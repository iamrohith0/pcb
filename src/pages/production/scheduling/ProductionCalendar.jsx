// src/pages/production/scheduling/ProductionCalendar.jsx
import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";
import { CalendarDays, Filter, Plus, RefreshCw, Search, X } from "lucide-react";

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
 * ProductionCalendar.jsx
 * PCBxpress - Production Scheduling Calendar
 *
 * What this page does:
 * - Month-view calendar for scheduling production (work orders, lots, operations)
 * - Filters: Plant, Line, Machine, Status, Search
 * - Quick add schedule item (local UI demo; connect API later)
 *
 * Expected backend endpoints (later):
 * - GET /production/schedule?month=YYYY-MM&plant=...&line=...&machine=...
 * - POST /production/schedule
 * - PUT /production/schedule/:id
 * - DELETE /production/schedule/:id
 */

const STATUS = {
  planned: { label: "Planned", pill: "bg-slate-100 text-slate-700 border-slate-200" },
  running: { label: "Running", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  hold: { label: "Hold", pill: "bg-amber-50 text-amber-800 border-amber-200" },
  done: { label: "Done", pill: "bg-sky-50 text-sky-700 border-sky-200" },
};

const SHIFT = {
  A: { label: "Shift A", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  B: { label: "Shift B", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  C: { label: "Shift C", badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  G: { label: "General", badge: "bg-gray-50 text-gray-700 border-gray-200" },
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/** Replace with real API service later */
async function mockFetchScheduleItems({ monthKey }) {
  // monthKey example: "2026-01"
  // Demo seed items (you can delete these once backend is connected)
  const seed = [
    {
      id: "sch-1001",
      date: `${monthKey}-06`,
      plant: "Plant 1",
      line: "Imaging",
      machine: "LDI-01",
      shift: "A",
      status: "planned",
      wo: "WO-2401",
      customer: "Acme Electronics",
      job: "4L FR4, 1.6mm",
      operation: "Imaging",
      qty: 80,
    },
    {
      id: "sch-1002",
      date: `${monthKey}-06`,
      plant: "Plant 1",
      line: "Drilling",
      machine: "DRL-02",
      shift: "B",
      status: "running",
      wo: "WO-2402",
      customer: "Orbit Systems",
      job: "2L FR4, 1.0mm",
      operation: "CNC Drilling",
      qty: 120,
    },
    {
      id: "sch-1003",
      date: `${monthKey}-10`,
      plant: "Plant 1",
      line: "Plating",
      machine: "PLT-01",
      shift: "G",
      status: "hold",
      wo: "WO-2398",
      customer: "Nova IoT",
      job: "6L FR4, 2.0mm",
      operation: "Copper Plating",
      qty: 60,
    },
    {
      id: "sch-1004",
      date: `${monthKey}-14`,
      plant: "Plant 2",
      line: "Solder Mask",
      machine: "SMK-01",
      shift: "A",
      status: "done",
      wo: "WO-2389",
      customer: "Vector Labs",
      job: "2L FR4, 1.6mm",
      operation: "Solder Mask",
      qty: 200,
    },
  ];

  // simulate network delay
  await new Promise((r) => setTimeout(r, 250));
  return seed;
}

export default function ProductionCalendar() {
  const { toast } = useToast();

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // Filters
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");
  const [machine, setMachine] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  // Add/Edit modal state (simple add)
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [form, setForm] = useState({
    plant: "Plant 1",
    line: "Imaging",
    machine: "LDI-01",
    shift: "A",
    status: "planned",
    wo: "",
    customer: "",
    job: "",
    operation: "",
    qty: "",
  });

  const monthKey = useMemo(() => format(monthCursor, "yyyy-MM"), [monthCursor]);

  const dateCells = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });

    const days = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  }, [monthCursor]);

  const plants = useMemo(() => ["Plant 1", "Plant 2"], []);
  const lines = useMemo(
    () => ["Imaging", "Etching", "Drilling", "Plating", "Solder Mask", "Silkscreen", "Routing", "E-Test", "AOI"],
    []
  );
  const machines = useMemo(
    () => ["LDI-01", "LDI-02", "ETCH-01", "DRL-01", "DRL-02", "PLT-01", "SMK-01", "AOI-01", "ETST-01", "RTR-01"],
    []
  );

  async function load() {
    setLoading(true);
    try {
      const res = await mockFetchScheduleItems({ monthKey });
      setItems(res);
    } catch (e) {
      toast({ title: "Failed to load schedule", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (plant && it.plant !== plant) return false;
      if (line && it.line !== line) return false;
      if (machine && it.machine !== machine) return false;
      if (status && it.status !== status) return false;
      if (!term) return true;

      const hay = [
        it.wo,
        it.customer,
        it.job,
        it.operation,
        it.line,
        it.machine,
        it.plant,
        it.status,
        it.shift,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [items, plant, line, machine, status, q]);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const it of filtered) {
      const key = it.date; // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    // Sort items inside each day: running > planned > hold > done (or any preference)
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const order = { running: 0, planned: 1, hold: 2, done: 3 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      });
      map.set(k, arr);
    }
    return map;
  }, [filtered]);

  const monthTitle = useMemo(() => format(monthCursor, "MMMM yyyy"), [monthCursor]);

  function prevMonth() {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() - 1);
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function nextMonth() {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + 1);
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function openAdd(dateObj) {
    const key = format(dateObj, "yyyy-MM-dd");
    setSelectedDate(key);
    setForm((p) => ({
      ...p,
      wo: "",
      customer: "",
      job: "",
      operation: "",
      qty: "",
    }));
    setAddOpen(true);
  }

  function closeAdd() {
    setAddOpen(false);
    setSelectedDate(null);
  }

  function handleCreate() {
    if (!selectedDate) return;

    if (!form.wo.trim()) {
      toast({ title: "Work Order required", description: "Please enter WO number.", variant: "destructive" });
      return;
    }
    if (!form.operation.trim()) {
      toast({ title: "Operation required", description: "Please enter operation/stage.", variant: "destructive" });
      return;
    }

    const payload = {
      id: `sch-${Math.random().toString(16).slice(2)}`,
      date: selectedDate,
      plant: form.plant,
      line: form.line,
      machine: form.machine,
      shift: form.shift,
      status: form.status,
      wo: form.wo.trim(),
      customer: form.customer.trim(),
      job: form.job.trim(),
      operation: form.operation.trim(),
      qty: form.qty ? Number(form.qty) : undefined,
    };

    setItems((prev) => [payload, ...prev]);
    toast({ title: "Scheduled", description: `Added ${payload.wo} on ${format(parseISO(selectedDate), "dd MMM")}` });
    closeAdd();
  }

  function clearFilters() {
    setPlant("");
    setLine("");
    setMachine("");
    setStatus("");
    setQ("");
  }

  const activeFilterCount = useMemo(() => {
    return [plant, line, machine, status, q.trim()].filter(Boolean).length;
  }, [plant, line, machine, status, q]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#dc2551]" />
              Production Calendar
            </CardTitle>
            <CardDescription>
              Plan work orders by day/shift across plants, lines, and machines (PCB manufacturing scheduling).
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={prevMonth}>
              ←
            </Button>
            <div className="min-w-[170px] text-center text-sm font-semibold">{monthTitle}</div>
            <Button variant="outline" onClick={nextMonth}>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <Label>Plant</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                  >
                    <option value="">All</option>
                    {plants.map((p) => (
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
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                  >
                    <option value="">All</option>
                    {lines.map((l) => (
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
                    {machines.map((m) => (
                      <option key={m} value={m}>
                        {m}
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
                    {Object.keys(STATUS).map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="WO, customer..." />
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

                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-hidden rounded-xl border">
            {/* Week headers */}
            <div className="grid grid-cols-7 border-b bg-gray-50">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="px-3 py-2 text-xs font-semibold text-gray-600">
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {dateCells.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayItems = byDate.get(dayKey) || [];
                const today = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, monthCursor);

                return (
                  <div
                    key={dayKey}
                    className={cx(
                      "min-h-[120px] border-b border-r p-2",
                      !inMonth ? "bg-gray-50/60" : "bg-white",
                      "hover:bg-gray-50/40 transition-colors"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cx(
                            "grid h-7 w-7 place-items-center rounded-lg text-xs font-semibold",
                            today ? "bg-[#dc2551] text-white" : "bg-gray-100 text-gray-800",
                            !inMonth ? "opacity-60" : ""
                          )}
                        >
                          {format(day, "d")}
                        </div>
                        {!inMonth && <span className="text-[11px] text-gray-400">{format(day, "MMM")}</span>}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs hover:bg-[#dc2551]/10 hover:text-[#dc2551]"
                        onClick={() => openAdd(day)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {dayItems.slice(0, 3).map((it) => (
                        <div
                          key={it.id}
                          className="rounded-lg border bg-white p-2 text-[11px] shadow-sm"
                          title={`${it.wo} • ${it.operation} • ${it.machine}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-gray-900">{it.wo}</span>
                            <span className={cx("rounded-full border px-2 py-0.5 text-[10px]", STATUS[it.status]?.pill)}>
                              {STATUS[it.status]?.label ?? it.status}
                            </span>
                          </div>

                          <div className="mt-1 text-gray-600">
                            <span className="font-medium">{it.operation}</span>
                            <span className="mx-1">•</span>
                            <span>{it.machine}</span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={cx("rounded-full border px-2 py-0.5 text-[10px]", SHIFT[it.shift]?.badge)}>
                              {SHIFT[it.shift]?.label ?? it.shift}
                            </span>
                            {it.customer ? (
                              <span className="rounded-full border bg-gray-50 px-2 py-0.5 text-[10px] text-gray-700">
                                {it.customer}
                              </span>
                            ) : null}
                            {typeof it.qty === "number" ? (
                              <span className="rounded-full border bg-gray-50 px-2 py-0.5 text-[10px] text-gray-700">
                                Qty {it.qty}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}

                      {dayItems.length > 3 && (
                        <div className="rounded-lg border bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
                          +{dayItems.length - 3} more…
                        </div>
                      )}

                      {dayItems.length === 0 && (
                        <div className="rounded-lg border border-dashed bg-white px-2 py-2 text-[11px] text-gray-400">
                          No schedules
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Legend:</span>
            {Object.keys(STATUS).map((s) => (
              <span key={s} className={cx("rounded-full border px-2 py-1", STATUS[s].pill)}>
                {STATUS[s].label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Schedule Dialog */}
      <AlertDialog open={addOpen} onOpenChange={setAddOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#dc2551]" />
              Add Production Schedule
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDate ? (
                <>
                  Scheduling for <span className="font-medium">{format(parseISO(selectedDate), "EEE, dd MMM yyyy")}</span>
                </>
              ) : (
                "Pick a date"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Plant</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={form.plant}
                onChange={(e) => setForm((p) => ({ ...p, plant: e.target.value }))}
              >
                {plants.map((p) => (
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
                {lines.map((l) => (
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
                {machines.map((m) => (
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
                {Object.keys(STATUS).map((s) => (
                  <option key={s} value={s}>
                    {STATUS[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Quantity (Optional)</Label>
              <Input
                inputMode="numeric"
                value={form.qty}
                onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))}
                placeholder="e.g. 120"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Work Order (WO) *</Label>
              <Input
                value={form.wo}
                onChange={(e) => setForm((p) => ({ ...p, wo: e.target.value }))}
                placeholder="e.g. WO-2405"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Operation / Stage *</Label>
              <Input
                value={form.operation}
                onChange={(e) => setForm((p) => ({ ...p, operation: e.target.value }))}
                placeholder="e.g. Imaging / Drilling / Plating / AOI / E-Test"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Customer (Optional)</Label>
              <Input
                value={form.customer}
                onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))}
                placeholder="e.g. Acme Electronics"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Job Notes (Optional)</Label>
              <Input
                value={form.job}
                onChange={(e) => setForm((p) => ({ ...p, job: e.target.value }))}
                placeholder="e.g. 4L FR4, 1.6mm, HASL, Green mask"
              />
            </div>
          </div>

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel onClick={closeAdd}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate} className="bg-[#dc2551] hover:bg-[#b02045]">
              Add Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
