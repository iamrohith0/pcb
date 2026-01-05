// src/pages/engineering/stackup/LeadTimeMatrix.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

import {
  CalendarClock,
  Copy,
  Download,
  Layers,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";

/**
 * PCBxpress – Lead Time Matrix (Engineering/Stackup)
 *
 * Purpose:
 * - Define standard lead times (days) based on build complexity + options.
 * - Used by RFQ/Quotation to auto-calculate promised ship date.
 *
 * Suggested API (adjust to your backend):
 *  GET    /engineering/lead-time-matrix
 *  POST   /engineering/lead-time-matrix              (create row)
 *  PUT    /engineering/lead-time-matrix/:id          (update row)
 *  DELETE /engineering/lead-time-matrix/:id          (delete row)
 *  POST   /engineering/lead-time-matrix/bulk-upsert  (save all)
 *
 * Data model suggestion:
 * {
 *   id,
 *   is_active,
 *   build_type: "Prototype"|"Production"|"QuickTurn",
 *   layers_min, layers_max,
 *   thickness_min_mm, thickness_max_mm,
 *   copper_oz_min, copper_oz_max,
 *   min_trace_mm, min_space_mm,
 *   finish: "HASL"|"ENIG"|"OSP"|"ImmAg"|"ImmSn",
 *   mask: "Green"|"Black"|"White"|"Blue"|"Red"|"MatteBlack",
 *   via_type: "TH"|"BlindBuried"|"Microvia"|"Any",
 *   impedance_controlled: boolean,
 *   hdI: boolean,
 *   via_in_pad: boolean,
 *   pressfit: boolean,
 *   serialization: "None"|"1D"|"2D",
 *   e_test: "None"|"FlyingProbe"|"Fixture",
 *   aoi: boolean,
 *   xray: boolean,
 *   panelization: "FactoryStd"|"Customer"|"None",
 *   base_lead_days,
 *   addon_days,      // additional days if conditions match (optional)
 *   priority: number // higher wins when multiple match
 * }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const OPTIONS = {
  build_type: ["Prototype", "Production", "QuickTurn"],
  finish: ["Any", "HASL", "ENIG", "OSP", "ImmAg", "ImmSn"],
  mask: ["Any", "Green", "Black", "White", "Blue", "Red", "MatteBlack"],
  via_type: ["Any", "TH", "BlindBuried", "Microvia"],
  serialization: ["None", "1D", "2D"],
  e_test: ["None", "FlyingProbe", "Fixture"],
  panelization: ["Any", "FactoryStd", "Customer", "None"],
};

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(v, min, max, fallback) {
  const n = Math.floor(toNum(v, fallback));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function defaultRow() {
  return {
    id: null,
    is_active: true,
    name: "Std Rule",
    build_type: "Prototype",
    layers_min: 1,
    layers_max: 2,
    thickness_min_mm: 0.8,
    thickness_max_mm: 1.6,
    copper_oz_min: 0.5,
    copper_oz_max: 1,
    min_trace_mm: 0.1,
    min_space_mm: 0.1,
    finish: "Any",
    mask: "Any",
    via_type: "Any",
    impedance_controlled: false,
    hdi: false,
    via_in_pad: false,
    pressfit: false,
    serialization: "None",
    e_test: "None",
    aoi: true,
    xray: false,
    panelization: "Any",
    base_lead_days: 7,
    addon_days: 0,
    priority: 50,
    notes: "",
  };
}

function normalizeRow(r) {
  const d = defaultRow();
  const row = { ...d, ...(r || {}) };

  row.id = row.id ?? null;
  row.is_active = !!row.is_active;

  row.name = safeStr(row.name, d.name);

  row.build_type = OPTIONS.build_type.includes(row.build_type) ? row.build_type : d.build_type;

  row.layers_min = clampInt(row.layers_min, 1, 64, d.layers_min);
  row.layers_max = clampInt(row.layers_max, row.layers_min, 64, d.layers_max);

  row.thickness_min_mm = toNum(row.thickness_min_mm, d.thickness_min_mm);
  row.thickness_max_mm = Math.max(row.thickness_min_mm, toNum(row.thickness_max_mm, d.thickness_max_mm));

  row.copper_oz_min = toNum(row.copper_oz_min, d.copper_oz_min);
  row.copper_oz_max = Math.max(row.copper_oz_min, toNum(row.copper_oz_max, d.copper_oz_max));

  row.min_trace_mm = Math.max(0, toNum(row.min_trace_mm, d.min_trace_mm));
  row.min_space_mm = Math.max(0, toNum(row.min_space_mm, d.min_space_mm));

  row.finish = OPTIONS.finish.includes(row.finish) ? row.finish : d.finish;
  row.mask = OPTIONS.mask.includes(row.mask) ? row.mask : d.mask;
  row.via_type = OPTIONS.via_type.includes(row.via_type) ? row.via_type : d.via_type;

  row.impedance_controlled = !!row.impedance_controlled;
  row.hdi = !!row.hdi;
  row.via_in_pad = !!row.via_in_pad;
  row.pressfit = !!row.pressfit;

  row.serialization = OPTIONS.serialization.includes(row.serialization) ? row.serialization : d.serialization;
  row.e_test = OPTIONS.e_test.includes(row.e_test) ? row.e_test : d.e_test;

  row.aoi = !!row.aoi;
  row.xray = !!row.xray;

  row.panelization = OPTIONS.panelization.includes(row.panelization) ? row.panelization : d.panelization;

  row.base_lead_days = clampInt(row.base_lead_days, 0, 365, d.base_lead_days);
  row.addon_days = clampInt(row.addon_days, 0, 365, d.addon_days);
  row.priority = clampInt(row.priority, 0, 999, d.priority);

  row.notes = safeStr(row.notes, "");

  return row;
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LeadTimeMatrix() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);

  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const hay = [
        r.name,
        r.build_type,
        `L${r.layers_min}-${r.layers_max}`,
        r.finish,
        r.mask,
        r.via_type,
        r.serialization,
        r.e_test,
        r.panelization,
        r.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const summary = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;

    const quick = rows
      .filter((r) => r.is_active && r.build_type === "QuickTurn")
      .sort((a, b) => b.priority - a.priority)[0];

    return { total, active, quick };
  }, [rows]);

  async function fetchMatrix() {
    setLoading(true);
    try {
      const res = await api.get("/engineering/lead-time-matrix");
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRows(list.map(normalizeRow));
    } catch (e) {
      toast({
        title: "Failed to load matrix",
        description: "Could not fetch lead time rules. Check API mapping.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addRow() {
    setRows((p) => [normalizeRow(defaultRow()), ...p]);
    toast({ title: "Row added", description: "Fill the rule and click Save All." });
  }

  function duplicateRow(idx) {
    setRows((p) => {
      const src = p[idx];
      const copy = normalizeRow({ ...src, id: null, name: `${src.name || "Rule"} (copy)` });
      return [copy, ...p];
    });
  }

  function updateRow(idx, key, val) {
    setRows((p) =>
      p.map((r, i) => {
        if (i !== idx) return r;
        const next = normalizeRow({ ...r, [key]: val });

        // Keep ranges sane when min changes
        if (key === "layers_min" && next.layers_max < next.layers_min) next.layers_max = next.layers_min;
        if (key === "thickness_min_mm" && next.thickness_max_mm < next.thickness_min_mm) next.thickness_max_mm = next.thickness_min_mm;
        if (key === "copper_oz_min" && next.copper_oz_max < next.copper_oz_min) next.copper_oz_max = next.copper_oz_min;

        return next;
      })
    );
  }

  function requestDelete(idx) {
    setDeleteTarget({ idx, row: rows[idx] });
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;

    const row = target.row;
    const idx = target.idx;

    setDeleteOpen(false);
    setDeleteTarget(null);

    // If not saved yet, just remove locally
    if (!row?.id) {
      setRows((p) => p.filter((_, i) => i !== idx));
      toast({ title: "Removed", description: "Rule removed." });
      return;
    }

    try {
      await api.delete(`/engineering/lead-time-matrix/${row.id}`);
      setRows((p) => p.filter((_, i) => i !== idx));
      toast({ title: "Deleted", description: "Rule deleted from server." });
    } catch (e) {
      toast({ title: "Delete failed", description: "Could not delete rule.", variant: "destructive" });
    }
  }

  async function saveAll() {
    setSavingAll(true);
    try {
      const payload = {
        rules: rows.map((r) => ({
          id: r.id,
          is_active: r.is_active,
          name: r.name,
          build_type: r.build_type,
          layers_min: toNum(r.layers_min, 1),
          layers_max: toNum(r.layers_max, 2),
          thickness_min_mm: toNum(r.thickness_min_mm, 0.8),
          thickness_max_mm: toNum(r.thickness_max_mm, 1.6),
          copper_oz_min: toNum(r.copper_oz_min, 0.5),
          copper_oz_max: toNum(r.copper_oz_max, 1),
          min_trace_mm: toNum(r.min_trace_mm, 0.1),
          min_space_mm: toNum(r.min_space_mm, 0.1),
          finish: r.finish,
          mask: r.mask,
          via_type: r.via_type,
          impedance_controlled: !!r.impedance_controlled,
          hdi: !!r.hdi,
          via_in_pad: !!r.via_in_pad,
          pressfit: !!r.pressfit,
          serialization: r.serialization,
          e_test: r.e_test,
          aoi: !!r.aoi,
          xray: !!r.xray,
          panelization: r.panelization,
          base_lead_days: toNum(r.base_lead_days, 0),
          addon_days: toNum(r.addon_days, 0),
          priority: toNum(r.priority, 50),
          notes: r.notes || null,
        })),
      };

      // Prefer bulk upsert if available
      try {
        await api.post("/engineering/lead-time-matrix/bulk-upsert", payload);
      } catch {
        // fallback: upsert row by row
        for (const r of payload.rules) {
          if (r.id) await api.put(`/engineering/lead-time-matrix/${r.id}`, r);
          else await api.post("/engineering/lead-time-matrix", r);
        }
      }

      toast({ title: "Saved", description: "Lead time matrix updated." });
      await fetchMatrix();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to save matrix.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSavingAll(false);
    }
  }

  function exportMatrix() {
    const payload = { exported_at: new Date().toISOString(), rules: rows };
    downloadJson("lead_time_matrix.json", payload);
    toast({ title: "Exported", description: "Downloaded lead_time_matrix.json" });
  }

  function importMatrix(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const list = Array.isArray(parsed?.rules) ? parsed.rules : Array.isArray(parsed) ? parsed : [];
        const normalized = list.map((r) => normalizeRow({ ...r, id: null })); // import as new
        setRows(normalized);
        toast({ title: "Imported", description: "Rules loaded. Click Save All to persist." });
      } catch {
        toast({ title: "Invalid file", description: "Please import a valid JSON export.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#dc2551]" />
            <h1 className="text-xl font-semibold text-gray-900">Lead Time Matrix</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Configure standard build lead times for PCBxpress based on stackup complexity, finish, via type, testing and options.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchMatrix} className="gap-2" disabled={loading || savingAll}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" onClick={exportMatrix} className="gap-2" disabled={savingAll}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <label className="inline-flex">
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importMatrix(f);
                e.target.value = "";
              }}
            />
            <span
              className={cx(
                "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                "hover:bg-gray-50"
              )}
            >
              <Upload className="h-4 w-4" />
              Import
            </span>
          </label>

          <Button onClick={addRow} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" disabled={savingAll}>
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>

          <Button onClick={saveAll} className="gap-2" disabled={savingAll || loading}>
            {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Summary + search */}
      <Card className="border-gray-200">
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-8">
              <Label>Search rules</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, build type, finish, via, test…"
                  className="pl-9"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Tip: Keep <b>priority</b> higher for more specific rules (e.g., HDI + ENIG + Impedance).
              </p>
            </div>

            <div className="md:col-span-4">
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Layers className="h-4 w-4 text-gray-600" />
                  Matrix Summary
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border bg-white p-2">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-semibold text-gray-900">{summary.total}</p>
                  </div>
                  <div className="rounded-xl border bg-white p-2">
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-lg font-semibold text-gray-900">{summary.active}</p>
                  </div>
                  <div className="rounded-xl border bg-white p-2">
                    <p className="text-xs text-gray-500">Top QuickTurn</p>
                    <p className="text-lg font-semibold text-gray-900">{summary.quick?.base_lead_days ?? "—"}</p>
                    <p className="text-[11px] text-gray-500">days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="mt-4 rounded-xl border bg-white p-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading lead time rules…
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Rules list */}
      <div className="space-y-4">
        {filtered.length === 0 && !loading ? (
          <Card className="border-gray-200">
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-gray-900">No rules found</p>
              <p className="mt-1 text-sm text-gray-600">Try clearing the search or add a new rule.</p>
              <div className="mt-4 flex justify-center">
                <Button onClick={addRow} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          filtered.map((r, idx) => {
            // idx here is index in filtered array; we need real index in rows
            const realIdx = rows.findIndex((x) => x === r);

            return (
              <Card key={r.id ?? `new-${realIdx}`} className="border-gray-200">
                <div className="border-b p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#dc2551]/10 px-2.5 py-1 text-xs font-semibold text-[#dc2551]">
                          Priority {r.priority}
                        </span>
                        <span className="text-base font-semibold text-gray-900">{r.name || "Rule"}</span>
                        <span className="text-xs text-gray-500">
                          {r.build_type} · L{r.layers_min}-{r.layers_max} · {r.finish} · {r.via_type}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">
                        Base: <b>{r.base_lead_days} days</b>
                        {r.addon_days ? (
                          <>
                            {" "}
                            · Add-on: <b>{r.addon_days} days</b>
                          </>
                        ) : null}
                        {" "}
                        · Panel: <b>{r.panelization}</b>
                        {" "}
                        · E-Test: <b>{r.e_test}</b>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">Active</span>
                        <Switch
                          checked={!!r.is_active}
                          onCheckedChange={(v) => updateRow(realIdx, "is_active", !!v)}
                        />
                      </div>

                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => duplicateRow(realIdx)}
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </Button>

                      <Button
                        variant="outline"
                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => requestDelete(realIdx)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    {/* Rule name / build type */}
                    <div className="md:col-span-4">
                      <Label>Rule Name</Label>
                      <Input
                        value={r.name}
                        onChange={(e) => updateRow(realIdx, "name", e.target.value)}
                        placeholder="e.g., HDI ENIG Impedance"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Build Type</Label>
                      <select
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        value={r.build_type}
                        onChange={(e) => updateRow(realIdx, "build_type", e.target.value)}
                      >
                        {OPTIONS.build_type.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Priority</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={r.priority}
                        onChange={(e) => updateRow(realIdx, "priority", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Base Lead (days)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={r.base_lead_days}
                        onChange={(e) => updateRow(realIdx, "base_lead_days", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Add-on (days)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={r.addon_days}
                        onChange={(e) => updateRow(realIdx, "addon_days", e.target.value)}
                      />
                    </div>

                    {/* Ranges */}
                    <div className="md:col-span-2">
                      <Label>Layers Min</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={r.layers_min}
                        onChange={(e) => updateRow(realIdx, "layers_min", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Layers Max</Label>
                      <Input
                        type="number"
                        min={r.layers_min}
                        step="1"
                        value={r.layers_max}
                        onChange={(e) => updateRow(realIdx, "layers_max", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Thickness Min (mm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.thickness_min_mm}
                        onChange={(e) => updateRow(realIdx, "thickness_min_mm", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Thickness Max (mm)</Label>
                      <Input
                        type="number"
                        min={r.thickness_min_mm}
                        step="0.01"
                        value={r.thickness_max_mm}
                        onChange={(e) => updateRow(realIdx, "thickness_max_mm", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Copper Min (oz)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.25"
                        value={r.copper_oz_min}
                        onChange={(e) => updateRow(realIdx, "copper_oz_min", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Copper Max (oz)</Label>
                      <Input
                        type="number"
                        min={r.copper_oz_min}
                        step="0.25"
                        value={r.copper_oz_max}
                        onChange={(e) => updateRow(realIdx, "copper_oz_max", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Min Trace (mm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.min_trace_mm}
                        onChange={(e) => updateRow(realIdx, "min_trace_mm", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Min Space (mm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.min_space_mm}
                        onChange={(e) => updateRow(realIdx, "min_space_mm", e.target.value)}
                      />
                    </div>

                    {/* Options */}
                    <div className="md:col-span-2">
                      <Label>Finish</Label>
                      <select
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        value={r.finish}
                        onChange={(e) => updateRow(realIdx, "finish", e.target.value)}
                      >
                        {OPTIONS.finish.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Solder Mask</Label>
                      <select
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        value={r.mask}
                        onChange={(e) => updateRow(realIdx, "mask", e.target.value)}
                      >
                        {OPTIONS.mask.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Via Type</Label>
                      <select
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        value={r.via_type}
                        onChange={(e) => updateRow(realIdx, "via_type", e.target.value)}
                      >
                        {OPTIONS.via_type.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Serialization</Label>
                      <select
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        value={r.serialization}
                        onChange={(e) => updateRow(realIdx, "serialization", e.target.value)}
                      >
                        {OPTIONS.serialization.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>E-Test</Label>
                      <select
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        value={r.e_test}
                        onChange={(e) => updateRow(realIdx, "e_test", e.target.value)}
                      >
                        {OPTIONS.e_test.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Panelization</Label>
                      <select
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        value={r.panelization}
                        onChange={(e) => updateRow(realIdx, "panelization", e.target.value)}
                      >
                        {OPTIONS.panelization.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Boolean toggles */}
                    <div className="md:col-span-12">
                      <div className="grid grid-cols-1 gap-3 rounded-2xl border bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Toggle
                          label="Impedance"
                          checked={r.impedance_controlled}
                          onChange={(v) => updateRow(realIdx, "impedance_controlled", v)}
                        />
                        <Toggle label="HDI" checked={r.hdi} onChange={(v) => updateRow(realIdx, "hdi", v)} />
                        <Toggle
                          label="Via-in-Pad"
                          checked={r.via_in_pad}
                          onChange={(v) => updateRow(realIdx, "via_in_pad", v)}
                        />
                        <Toggle
                          label="Pressfit"
                          checked={r.pressfit}
                          onChange={(v) => updateRow(realIdx, "pressfit", v)}
                        />
                        <Toggle label="AOI" checked={r.aoi} onChange={(v) => updateRow(realIdx, "aoi", v)} />
                        <Toggle label="X-Ray" checked={r.xray} onChange={(v) => updateRow(realIdx, "xray", v)} />
                      </div>
                    </div>

                    <div className="md:col-span-12">
                      <Label>Notes</Label>
                      <Input
                        value={r.notes}
                        onChange={(e) => updateRow(realIdx, "notes", e.target.value)}
                        placeholder="e.g., add 2 days for HDI lamination + controlled impedance"
                      />
                      <div className="mt-2 inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs text-gray-600">
                        <Settings2 className="h-4 w-4 text-gray-500" />
                        When matching: system picks the <b>highest priority active</b> rule that fits RFQ parameters.
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected lead time rule. If it is already saved, it will be deleted from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#dc2551] hover:bg-[#b02045]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      <Switch checked={!!checked} onCheckedChange={(v) => onChange(!!v)} />
    </div>
  );
}
