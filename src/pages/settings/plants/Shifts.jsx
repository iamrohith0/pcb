// src/pages/settings/plants/Shifts.jsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Plus, Pencil, Trash2, RefreshCw, Clock, Factory, CalendarClock } from "lucide-react";
import api from "@/lib/axios";

/**
 * PCBxpress – Shifts
 * - Manage plant shifts (general config)
 * - Works with backend if available:
 *   GET    /settings/shifts
 *   POST   /settings/shifts
 *   PUT    /settings/shifts/:id
 *   DELETE /settings/shifts/:id
 *
 * If your backend uses different endpoints, just update the API paths below.
 */

const DEFAULT_FORM = {
  id: null,
  plant_id: "",
  name: "",
  code: "",
  start_time: "09:00",
  end_time: "18:00",
  grace_in_mins: 0,
  grace_out_mins: 0,
  break_mins: 30,
  is_overnight: false,
  is_active: true,
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function minutesBetween(startHHmm, endHHmm, isOvernight) {
  if (!startHHmm || !endHHmm) return 0;
  const [sh, sm] = startHHmm.split(":").map((x) => parseInt(x, 10));
  const [eh, em] = endHHmm.split(":").map((x) => parseInt(x, 10));

  if (![sh, sm, eh, em].every((n) => Number.isFinite(n))) return 0;

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (isOvernight) return (24 * 60 - start) + end;
  return Math.max(0, end - start);
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function Shifts() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [plants, setPlants] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [query, setQuery] = useState("");
  const [plantFilter, setPlantFilter] = useState(""); // plant_id
  const [activeOnly, setActiveOnly] = useState(false);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [mode, setMode] = useState("create"); // create | edit

  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const computed = useMemo(() => {
    const gross = minutesBetween(form.start_time, form.end_time, form.is_overnight);
    const breaks = Math.max(0, toInt(form.break_mins, 0));
    const net = Math.max(0, gross - breaks);
    return { gross, breaks, net };
  }, [form.start_time, form.end_time, form.is_overnight, form.break_mins]);

  const filteredShifts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shifts
      .filter((s) => (plantFilter ? String(s.plant_id ?? "") === String(plantFilter) : true))
      .filter((s) => (activeOnly ? !!s.is_active : true))
      .filter((s) => {
        if (!q) return true;
        const hay = `${s.name ?? ""} ${s.code ?? ""} ${s.start_time ?? ""}-${s.end_time ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        // active first, then by start time
        const aa = a.is_active ? 0 : 1;
        const bb = b.is_active ? 0 : 1;
        if (aa !== bb) return aa - bb;
        return String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""));
      });
  }, [shifts, query, plantFilter, activeOnly]);

  const plantNameById = useMemo(() => {
    const map = new Map();
    plants.forEach((p) => map.set(String(p.id), p.name || p.code || `Plant ${p.id}`));
    return map;
  }, [plants]);

  async function fetchPlants() {
    // Optional endpoint — if you don't have plants API, it will just use empty list.
    try {
      const res = await api.get("/settings/plants");
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setPlants(list);
    } catch {
      setPlants([]);
    }
  }

  async function fetchShifts() {
    const res = await api.get("/settings/shifts");
    const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    setShifts(list);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.allSettled([fetchPlants(), fetchShifts()]);
    } catch (e) {
      toast({
        title: "Failed to load shifts",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setMode("create");
    setForm(DEFAULT_FORM);
    // default plant to first plant if available
    if (plants?.length) {
      setForm((p) => ({ ...p, plant_id: String(plants[0].id) }));
    }
    setEditorOpen(true);
  }

  function openEdit(shift) {
    setMode("edit");
    setForm({
      id: shift.id ?? null,
      plant_id: shift.plant_id != null ? String(shift.plant_id) : "",
      name: shift.name ?? "",
      code: shift.code ?? "",
      start_time: shift.start_time ?? "09:00",
      end_time: shift.end_time ?? "18:00",
      grace_in_mins: toInt(shift.grace_in_mins ?? shift.grace_in ?? 0, 0),
      grace_out_mins: toInt(shift.grace_out_mins ?? shift.grace_out ?? 0, 0),
      break_mins: toInt(shift.break_mins ?? shift.break ?? 30, 30),
      is_overnight: !!shift.is_overnight,
      is_active: shift.is_active !== false,
    });
    setEditorOpen(true);
  }

  function requestDelete(shift) {
    setDeleteTarget(shift);
    setDeleteOpen(true);
  }

  function validate() {
    if (!form.name.trim()) return "Shift name is required.";
    if (!form.code.trim()) return "Shift code is required (e.g., A, B, C, DAY, NIGHT).";
    if (!form.start_time || !form.end_time) return "Start time and end time are required.";
    if (computed.gross <= 0) return "Shift duration must be greater than 0 minutes.";
    if (computed.breaks >= computed.gross) return "Break minutes must be less than the shift duration.";
    return null;
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    const err = validate();
    if (err) {
      toast({ title: "Fix required", description: err, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        plant_id: form.plant_id ? String(form.plant_id) : null,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        start_time: form.start_time,
        end_time: form.end_time,
        is_overnight: !!form.is_overnight,
        break_mins: Math.max(0, toInt(form.break_mins, 0)),
        grace_in_mins: Math.max(0, toInt(form.grace_in_mins, 0)),
        grace_out_mins: Math.max(0, toInt(form.grace_out_mins, 0)),
        is_active: !!form.is_active,
      };

      if (mode === "edit" && form.id) {
        await api.put(`/settings/shifts/${form.id}`, payload);
        toast({ title: "Shift updated", description: "Changes saved successfully." });
      } else {
        await api.post("/settings/shifts", payload);
        toast({ title: "Shift created", description: "New shift added successfully." });
      }

      setEditorOpen(false);
      await fetchShifts();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to save shift. Please try again.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) {
      setDeleteOpen(false);
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/settings/shifts/${deleteTarget.id}`);
      toast({ title: "Shift deleted", description: "The shift has been removed." });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchShifts();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to delete shift. Please try again.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#dc2551]" />
            <h1 className="text-xl font-semibold text-gray-900">Shifts</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Define shift timings for PCB production (DAY/NIGHT, A/B/C). Used in scheduling, WIP, attendance, and machine allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={loadAll}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button onClick={openCreate} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
            <Plus className="h-4 w-4" />
            New Shift
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search shifts by name/code, filter by plant and active status.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <Label>Search</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by shift name, code, or time…"
            />
          </div>

          <div className="md:col-span-5">
            <Label>Plant</Label>
            <Input
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value)}
              placeholder={plants?.length ? "Enter Plant ID (or leave empty)" : "Plant API not connected (optional)"}
            />
            <p className="mt-1 text-xs text-gray-500">
              If you have plants loaded, use plant id like:{" "}
              <span className="font-medium">{plants?.[0]?.id ?? "1"}</span>
            </p>
          </div>

          <div className="md:col-span-2 flex items-end">
            <div className="flex w-full items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm text-gray-700">Active only</span>
              <Switch checked={activeOnly} onCheckedChange={setActiveOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Shift List</CardTitle>
          <CardDescription>
            {filteredShifts.length} shift(s){" "}
            {activeOnly ? " (active filtered)" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading shifts…
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm font-medium text-gray-800">No shifts found</p>
              <p className="mt-1 text-sm text-gray-600">Create a shift to start scheduling PCB production.</p>
              <Button onClick={openCreate} className="mt-4 gap-2 bg-[#dc2551] hover:bg-[#b02045]">
                <Plus className="h-4 w-4" />
                Create Shift
              </Button>
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {filteredShifts.map((s) => {
                const gross = minutesBetween(s.start_time, s.end_time, !!s.is_overnight);
                const breaks = Math.max(0, toInt(s.break_mins ?? 0, 0));
                const net = Math.max(0, gross - breaks);

                return (
                  <div key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                            s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {s.name}{" "}
                          <span className="text-gray-500 font-medium">({s.code})</span>
                        </span>

                        {s.plant_id != null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#dc2551]/10 px-2.5 py-1 text-xs font-semibold text-[#dc2551]">
                            <Factory className="h-3.5 w-3.5" />
                            {plantNameById.get(String(s.plant_id)) ?? `Plant ${s.plant_id}`}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {s.start_time} → {s.end_time}
                          {s.is_overnight ? <span className="ml-1 text-xs text-indigo-600">(Overnight)</span> : null}
                        </span>

                        <span className="text-xs text-gray-500">
                          Gross: <span className="font-medium text-gray-700">{formatDuration(gross)}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Break: <span className="font-medium text-gray-700">{formatDuration(breaks)}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Net: <span className="font-medium text-gray-700">{formatDuration(net)}</span>
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Grace: IN <span className="font-medium text-gray-700">{toInt(s.grace_in_mins ?? 0)}m</span>, OUT{" "}
                        <span className="font-medium text-gray-700">{toInt(s.grace_out_mins ?? 0)}m</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" className="gap-2" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => requestDelete(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor (simple modal-style card) */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-base">
                  {mode === "edit" ? "Edit Shift" : "Create Shift"}
                </CardTitle>
                <CardDescription>
                  Configure timings for production planning and scheduling (routing/capacity/WIP).
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSave} className="space-y-5">
                  {/* Plant + Active */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-8">
                      <Label>Plant ID (optional)</Label>
                      <Input
                        value={form.plant_id}
                        onChange={(e) => setForm((p) => ({ ...p, plant_id: e.target.value }))}
                        placeholder={plants?.length ? `e.g., ${plants[0]?.id}` : "e.g., 1"}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        If you run multiple plants/shops, tie shift to a plant. Leave empty for global shifts.
                      </p>
                    </div>

                    <div className="md:col-span-4 flex items-end">
                      <div className="flex w-full items-center justify-between rounded-lg border px-3 py-2">
                        <span className="text-sm text-gray-700">Active</span>
                        <Switch
                          checked={form.is_active}
                          onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: !!v }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Name + Code */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-8">
                      <Label>Shift Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Day Shift, Night Shift, Shift A"
                        autoFocus
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label>Shift Code</Label>
                      <Input
                        value={form.code}
                        onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                        placeholder="e.g., DAY / NIGHT / A / B"
                      />
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={form.start_time}
                        onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={form.end_time}
                        onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-4 flex items-end">
                      <div className="flex w-full items-center justify-between rounded-lg border px-3 py-2">
                        <span className="text-sm text-gray-700">Overnight</span>
                        <Switch
                          checked={form.is_overnight}
                          onCheckedChange={(v) => setForm((p) => ({ ...p, is_overnight: !!v }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Break + Grace */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <Label>Break (mins)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.break_mins}
                        onChange={(e) => setForm((p) => ({ ...p, break_mins: toInt(e.target.value, 0) }))}
                        placeholder="e.g., 30"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label>Grace IN (mins)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.grace_in_mins}
                        onChange={(e) => setForm((p) => ({ ...p, grace_in_mins: toInt(e.target.value, 0) }))}
                        placeholder="e.g., 10"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label>Grace OUT (mins)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.grace_out_mins}
                        onChange={(e) => setForm((p) => ({ ...p, grace_out_mins: toInt(e.target.value, 0) }))}
                        placeholder="e.g., 10"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Clock className="h-4 w-4 text-gray-600" />
                        Shift Summary
                      </div>
                      <div className="text-xs text-gray-600">
                        Gross <span className="font-semibold text-gray-800">{formatDuration(computed.gross)}</span> · Break{" "}
                        <span className="font-semibold text-gray-800">{formatDuration(computed.breaks)}</span> · Net{" "}
                        <span className="font-semibold text-gray-800">{formatDuration(computed.net)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      Net duration is used to estimate capacity and route planning (drilling/plating/etching/solder mask/legend/final inspection).
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditorOpen(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#dc2551] hover:bg-[#b02045]"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Shift"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{deleteTarget?.name}</span> ({deleteTarget?.code}). If this shift
              is used in schedules or work orders, you may want to disable it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
