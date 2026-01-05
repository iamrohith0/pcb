// src/pages/production/scheduling/ShiftPlanning.jsx
import { useEffect, useMemo, useState } from "react";
import { format, addDays, startOfWeek, endOfWeek, parseISO, isSameDay } from "date-fns";
import {
  CalendarDays,
  Filter,
  RefreshCw,
  Search,
  Users,
  Factory,
  Wrench,
  Clock,
  Plus,
  X,
  Shuffle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

/**
 * ShiftPlanning.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Goal:
 * - Plan DAILY shifts per LINE/MACHINE (Imaging, Drilling, Plating, AOI, E-Test, etc.)
 * - Attach: supervisor, operators count, target WOs, notes
 * - Week view (Mon-Sun) with quick add/edit (UI demo with mock data)
 *
 * Later backend endpoints (suggested):
 * - GET  /production/shifts?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=...&line=...&machine=...
 * - POST /production/shifts
 * - PUT  /production/shifts/:id
 * - DELETE /production/shifts/:id
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const SHIFT = {
  A: { label: "Shift A", pill: "bg-violet-50 text-violet-700 border-violet-200" },
  B: { label: "Shift B", pill: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  C: { label: "Shift C", pill: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  G: { label: "General", pill: "bg-gray-50 text-gray-700 border-gray-200" },
};

const PLAN_STATUS = {
  draft: { label: "Draft", pill: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmed: { label: "Confirmed", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  changed: { label: "Changed", pill: "bg-amber-50 text-amber-800 border-amber-200" },
};

const LINES = ["Imaging", "Etching", "Drilling", "Plating", "Solder Mask", "Silkscreen", "Routing", "AOI", "E-Test"];
const MACHINES = ["LDI-01", "LDI-02", "ETCH-01", "DRL-01", "DRL-02", "PLT-01", "SMK-01", "AOI-01", "ETST-01", "RTR-01"];
const PLANTS = ["Plant 1", "Plant 2"];
const SUPERVISORS = ["Ravi", "Anand", "Karthik", "Sana", "Maya", "Imran"];

async function mockFetchShiftPlans({ fromKey, toKey }) {
  // Demo seed data (delete when connecting backend)
  await new Promise((r) => setTimeout(r, 250));
  return [
    {
      id: "sp-1001",
      date: fromKey,
      plant: "Plant 1",
      line: "Imaging",
      machine: "LDI-01",
      shift: "A",
      status: "confirmed",
      supervisor: "Ravi",
      operators: 4,
      wos: ["WO-2401", "WO-2405"],
      notes: "Priority: impedance stack. Verify film alignment.",
    },
    {
      id: "sp-1002",
      date: fromKey,
      plant: "Plant 1",
      line: "Drilling",
      machine: "DRL-02",
      shift: "B",
      status: "confirmed",
      supervisor: "Anand",
      operators: 3,
      wos: ["WO-2402"],
      notes: "Use new drill bits batch #DB-77.",
    },
    {
      id: "sp-1003",
      date: format(addDays(parseISO(fromKey), 1), "yyyy-MM-dd"),
      plant: "Plant 1",
      line: "Plating",
      machine: "PLT-01",
      shift: "G",
      status: "changed",
      supervisor: "Maya",
      operators: 5,
      wos: ["WO-2398"],
      notes: "Hold check: copper thickness trending high; recalibrate.",
    },
    {
      id: "sp-1004",
      date: format(addDays(parseISO(fromKey), 3), "yyyy-MM-dd"),
      plant: "Plant 2",
      line: "AOI",
      machine: "AOI-01",
      shift: "A",
      status: "draft",
      supervisor: "Sana",
      operators: 2,
      wos: ["WO-2389", "WO-2410"],
      notes: "Run golden sample first; export AOI defects report.",
    },
  ];
}

export default function ShiftPlanning() {
  const { toast } = useToast();

  // Week cursor (start Monday)
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  // Filters
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");
  const [machine, setMachine] = useState("");
  const [shift, setShift] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  // Dialog state
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    date: "",
    plant: "Plant 1",
    line: "Imaging",
    machine: "LDI-01",
    shift: "A",
    status: "draft",
    supervisor: "Ravi",
    operators: 3,
    wos: "",
    notes: "",
  });

  const fromKey = useMemo(() => format(startOfWeek(weekCursor, { weekStartsOn: 1 }), "yyyy-MM-dd"), [weekCursor]);
  const toKey = useMemo(() => format(endOfWeek(weekCursor, { weekStartsOn: 1 }), "yyyy-MM-dd"), [weekCursor]);

  const days = useMemo(() => {
    const start = startOfWeek(weekCursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [weekCursor]);

  const weekTitle = useMemo(() => {
    const a = parseISO(fromKey);
    const b = parseISO(toKey);
    return `${format(a, "dd MMM")} – ${format(b, "dd MMM yyyy")}`;
  }, [fromKey, toKey]);

  async function load() {
    setLoading(true);
    try {
      const res = await mockFetchShiftPlans({ fromKey, toKey });
      setPlans(res);
    } catch (e) {
      toast({ title: "Failed to load shift plans", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return plans.filter((p) => {
      if (plant && p.plant !== plant) return false;
      if (line && p.line !== line) return false;
      if (machine && p.machine !== machine) return false;
      if (shift && p.shift !== shift) return false;
      if (status && p.status !== status) return false;

      if (!term) return true;

      const hay = [
        p.date,
        p.plant,
        p.line,
        p.machine,
        p.shift,
        p.status,
        p.supervisor,
        ...(p.wos || []),
        p.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [plans, plant, line, machine, shift, status, q]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const key = p.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const order = { confirmed: 0, changed: 1, draft: 2 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      });
      map.set(k, arr);
    }
    return map;
  }, [filtered]);

  const activeFilterCount = useMemo(
    () => [plant, line, machine, shift, status, q.trim()].filter(Boolean).length,
    [plant, line, machine, shift, status, q]
  );

  function clearFilters() {
    setPlant("");
    setLine("");
    setMachine("");
    setShift("");
    setStatus("");
    setQ("");
  }

  function prevWeek() {
    setWeekCursor((d) => addDays(d, -7));
  }

  function nextWeek() {
    setWeekCursor((d) => addDays(d, 7));
  }

  function openCreate(dateObj) {
    const dateKey = format(dateObj, "yyyy-MM-dd");
    setEditId(null);
    setForm({
      date: dateKey,
      plant: "Plant 1",
      line: "Imaging",
      machine: "LDI-01",
      shift: "A",
      status: "draft",
      supervisor: SUPERVISORS[0],
      operators: 3,
      wos: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(plan) {
    setEditId(plan.id);
    setForm({
      date: plan.date,
      plant: plan.plant,
      line: plan.line,
      machine: plan.machine,
      shift: plan.shift,
      status: plan.status,
      supervisor: plan.supervisor,
      operators: plan.operators ?? 0,
      wos: (plan.wos || []).join(", "),
      notes: plan.notes || "",
    });
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditId(null);
  }

  function normalizeWos(text) {
    return text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  function savePlan() {
    if (!form.date) {
      toast({ title: "Date required", description: "Please choose a date.", variant: "destructive" });
      return;
    }
    if (!form.line || !form.machine || !form.shift) {
      toast({ title: "Line/Machine/Shift required", description: "Please fill required fields.", variant: "destructive" });
      return;
    }

    const wos = normalizeWos(form.wos);
    if (wos.length === 0) {
      toast({ title: "WO required", description: "Add at least one Work Order.", variant: "destructive" });
      return;
    }

    const payload = {
      id: editId || `sp-${Math.random().toString(16).slice(2)}`,
      date: form.date,
      plant: form.plant,
      line: form.line,
      machine: form.machine,
      shift: form.shift,
      status: form.status,
      supervisor: form.supervisor,
      operators: Number(form.operators) || 0,
      wos,
      notes: form.notes?.trim() || "",
    };

    setPlans((prev) => {
      const exists = prev.some((x) => x.id === payload.id);
      if (!exists) return [payload, ...prev];
      return prev.map((x) => (x.id === payload.id ? payload : x));
    });

    toast({
      title: editId ? "Shift plan updated" : "Shift plan created",
      description: `${payload.line} • ${payload.machine} • ${SHIFT[payload.shift]?.label} • ${format(parseISO(payload.date), "dd MMM")}`,
    });

    closeDialog();
  }

  function quickAutoFill() {
    // A small helper to fill realistic notes quickly
    const noteOptions = [
      "Check material availability before start; update WIP card after run.",
      "Run first article inspection; log deviations in quality notes.",
      "Confirm tooling/jigs readiness; verify program revision in CAM output.",
      "Prioritize urgent shipment job; coordinate with QC for fast AOI.",
    ];
    setForm((p) => ({
      ...p,
      notes: noteOptions[Math.floor(Math.random() * noteOptions.length)],
      operators: p.operators || 3,
    }));
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#dc2551]" />
              Shift Planning
            </CardTitle>
            <CardDescription>
              Weekly shift allocation by plant/line/machine for PCB manufacturing (operators, supervisor, WOs, notes).
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={prevWeek}>
              ←
            </Button>
            <div className="min-w-[190px] text-center text-sm font-semibold">{weekTitle}</div>
            <Button variant="outline" onClick={nextWeek}>
              →
            </Button>

            <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
              <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="rounded-xl border bg-white p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-gray-500" />
                    Plant
                  </Label>
                  <select
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                  >
                    <option value="">All</option>
                    {PLANTS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-gray-500" />
                    Line
                  </Label>
                  <select
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                  >
                    <option value="">All</option>
                    {LINES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Machine</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    value={machine}
                    onChange={(e) => setMachine(e.target.value)}
                  >
                    <option value="">All</option>
                    {MACHINES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    Shift
                  </Label>
                  <select
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                  >
                    <option value="">All</option>
                    {Object.keys(SHIFT).map((k) => (
                      <option key={k} value={k}>
                        {SHIFT[k].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    {Object.keys(PLAN_STATUS).map((s) => (
                      <option key={s} value={s}>
                        {PLAN_STATUS[s].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="WO, supervisor..." />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden lg:flex">
                  <Badge variant="outline" className="gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    Filters: {activeFilterCount}
                  </Badge>
                </div>

                <Button variant="outline" className="gap-2" onClick={clearFilters} disabled={activeFilterCount === 0}>
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Week board */}
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-7">
              {days.map((d) => {
                const dayKey = format(d, "yyyy-MM-dd");
                const dayPlans = byDay.get(dayKey) || [];
                const today = isSameDay(d, new Date());

                return (
                  <div key={dayKey} className="border-b lg:border-b-0 lg:border-r">
                    <div className={cx("flex items-center justify-between border-b bg-gray-50 px-3 py-2", today ? "bg-[#dc2551]/5" : "")}>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-700">{format(d, "EEE")}</span>
                        <span className="text-[11px] text-gray-500">{format(d, "dd MMM")}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs hover:bg-[#dc2551]/10 hover:text-[#dc2551]"
                        onClick={() => openCreate(d)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>

                    <div className="min-h-[180px] space-y-2 p-2">
                      {dayPlans.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-white px-2 py-2 text-[11px] text-gray-400">
                          No shift plans
                        </div>
                      ) : null}

                      {dayPlans.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => openEdit(p)}
                          className="w-full rounded-lg border bg-white p-2 text-left shadow-sm transition hover:shadow"
                          title="Click to edit"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-semibold text-gray-900">
                                {p.line} • {p.machine}
                              </div>
                              <div className="text-[11px] text-gray-600">
                                <span className="font-medium">{p.supervisor}</span> • <span>{p.operators} ops</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className={cx("rounded-full border px-2 py-0.5 text-[10px]", SHIFT[p.shift]?.pill)}>
                                {SHIFT[p.shift]?.label ?? p.shift}
                              </span>
                              <span className={cx("rounded-full border px-2 py-0.5 text-[10px]", PLAN_STATUS[p.status]?.pill)}>
                                {PLAN_STATUS[p.status]?.label ?? p.status}
                              </span>
                            </div>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-1">
                            {(p.wos || []).slice(0, 3).map((wo) => (
                              <span key={wo} className="rounded-full border bg-gray-50 px-2 py-0.5 text-[10px] text-gray-700">
                                {wo}
                              </span>
                            ))}
                            {(p.wos || []).length > 3 ? (
                              <span className="rounded-full border bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600">
                                +{(p.wos || []).length - 3}
                              </span>
                            ) : null}
                          </div>

                          {p.notes ? (
                            <div className="mt-1 line-clamp-2 text-[10.5px] text-gray-500">{p.notes}</div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Shift:</span>
            {Object.keys(SHIFT).map((k) => (
              <span key={k} className={cx("rounded-full border px-2 py-1", SHIFT[k].pill)}>
                {SHIFT[k].label}
              </span>
            ))}
            <span className="ml-2 font-semibold text-gray-800">Status:</span>
            {Object.keys(PLAN_STATUS).map((k) => (
              <span key={k} className={cx("rounded-full border px-2 py-1", PLAN_STATUS[k].pill)}>
                {PLAN_STATUS[k].label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#dc2551]" />
              {editId ? "Edit Shift Plan" : "Create Shift Plan"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Set supervisor, operators, target WOs and notes for a specific line/machine shift.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Plant</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.plant}
                onChange={(e) => setForm((p) => ({ ...p, plant: e.target.value }))}
              >
                {PLANTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Line</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.line}
                onChange={(e) => setForm((p) => ({ ...p, line: e.target.value }))}
              >
                {LINES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Machine</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.machine}
                onChange={(e) => setForm((p) => ({ ...p, machine: e.target.value }))}
              >
                {MACHINES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Shift</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.shift}
                onChange={(e) => setForm((p) => ({ ...p, shift: e.target.value }))}
              >
                {Object.keys(SHIFT).map((k) => (
                  <option key={k} value={k}>
                    {SHIFT[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                {Object.keys(PLAN_STATUS).map((k) => (
                  <option key={k} value={k}>
                    {PLAN_STATUS[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Supervisor</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.supervisor}
                onChange={(e) => setForm((p) => ({ ...p, supervisor: e.target.value }))}
              >
                {SUPERVISORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Operators (count)</Label>
              <Input
                inputMode="numeric"
                value={String(form.operators ?? "")}
                onChange={(e) => setForm((p) => ({ ...p, operators: e.target.value }))}
                placeholder="e.g. 4"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Work Orders (comma separated) *</Label>
              <Input
                value={form.wos}
                onChange={(e) => setForm((p) => ({ ...p, wos: e.target.value }))}
                placeholder="e.g. WO-2401, WO-2405"
              />
              <p className="text-[11px] text-gray-500">
                Tip: keep this aligned with routing/operations (Imaging → Etching → Drilling → Plating → SM → AOI → E-Test).
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Notes</Label>
                <Button variant="outline" size="sm" className="gap-2" type="button" onClick={quickAutoFill}>
                  <Shuffle className="h-4 w-4" />
                  Suggest note
                </Button>
              </div>
              <textarea
                className="min-h-[90px] w-full resize-none rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Safety checks, setup constraints, QA holds, tooling notes, priority shipments..."
              />
            </div>
          </div>

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={savePlan} className="bg-[#dc2551] hover:bg-[#b02045]">
              {editId ? "Save Changes" : "Create Plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
