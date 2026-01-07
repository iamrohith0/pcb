// src/pages/production/scheduling/MachineAllocation.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useMemo, useState } from "react";

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
    CalendarDays,
    CheckCircle2,
    Clock,
    Filter,
    Layers,
    Plus,
    RefreshCw,
    Save,
    Search,
    Settings2,
    ShieldCheck,
    Trash2,
    Wrench,
} from "lucide-react";

/**
 * MachineAllocation.jsx
 * ---------------------
 * PCB Manufacturing ERP — Scheduling module
 *
 * Purpose:
 * - Allocate work orders / operations to machines (work centers)
 * - View machine load by date range
 * - Detect over-allocation
 * - Create "allocations" with planned start/end + quantities
 *
 * Backend integration:
 * Replace the mock APIs (loadMachines/loadWOs/loadAllocations/save/delete)
 * with your services in: src/services/production/*.service.js
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const WC_CHOICES = [
  "CAM",
  "IMAGING",
  "ETCH",
  "DRILL",
  "PLATING",
  "MLP",
  "SM",
  "FINISH",
  "AOI",
  "E-TEST",
  "PACK",
];

const SHIFT_CHOICES = ["General", "Shift A", "Shift B", "Shift C"];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function minutesToHM(min) {
  const m = Math.max(0, Math.round(Number(min || 0)));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}

function makeId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------
   Mock data + mock "API"
-------------------------------- */
const MOCK_MACHINES = [
  { id: "M-CAM-01", name: "CAM Station 01", workCenter: "CAM", shift: "General", capacityMinPerDay: 480, status: "Running" },
  { id: "M-IMG-01", name: "UV Exposer 01", workCenter: "IMAGING", shift: "Shift A", capacityMinPerDay: 480, status: "Running" },
  { id: "M-ETCH-01", name: "Etch Line 01", workCenter: "ETCH", shift: "Shift B", capacityMinPerDay: 480, status: "Running" },
  { id: "M-DRILL-01", name: "Drill Machine 01", workCenter: "DRILL", shift: "Shift A", capacityMinPerDay: 480, status: "Running" },
  { id: "M-PLT-01", name: "Plating Line 01", workCenter: "PLATING", shift: "Shift C", capacityMinPerDay: 480, status: "Maintenance" },
  { id: "M-AOI-01", name: "AOI 01", workCenter: "AOI", shift: "General", capacityMinPerDay: 420, status: "Running" },
];

const MOCK_WORK_ORDERS = [
  { id: "WO-24001", customer: "ACME", product: "2L FR4 1.6mm", qtyPanels: 50, dueDate: addDaysISO(todayISO(), 4), priority: "High", op: "IMAGING", stdMin: 240 },
  { id: "WO-24002", customer: "Nexa", product: "4L 1.6mm", qtyPanels: 30, dueDate: addDaysISO(todayISO(), 8), priority: "Normal", op: "DRILL", stdMin: 180 },
  { id: "WO-24003", customer: "Orbit", product: "2L 1.0mm", qtyPanels: 80, dueDate: addDaysISO(todayISO(), 3), priority: "Urgent", op: "ETCH", stdMin: 300 },
  { id: "WO-24004", customer: "Zen Circuits", product: "HDI 6L", qtyPanels: 12, dueDate: addDaysISO(todayISO(), 10), priority: "Normal", op: "PLATING", stdMin: 240 },
  { id: "WO-24005", customer: "Kite", product: "2L Aluminum", qtyPanels: 18, dueDate: addDaysISO(todayISO(), 6), priority: "High", op: "AOI", stdMin: 120 },
];

function loadMachinesMock() {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_MACHINES), 250));
}

function loadWorkOrdersMock() {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_WORK_ORDERS), 250));
}

function loadAllocationsMock() {
  const seed = [
    {
      id: "AL_1",
      date: todayISO(),
      machineId: "M-IMG-01",
      woId: "WO-24001",
      workCenter: "IMAGING",
      plannedMin: 180,
      plannedQtyPanels: 40,
      notes: "Rush batch",
    },
    {
      id: "AL_2",
      date: todayISO(),
      machineId: "M-ETCH-01",
      woId: "WO-24003",
      workCenter: "ETCH",
      plannedMin: 260,
      plannedQtyPanels: 60,
      notes: "",
    },
  ];
  return new Promise((resolve) => setTimeout(() => resolve(seed), 250));
}

/* ------------------------------
   UI helpers
-------------------------------- */
function PriorityBadge({ p }) {
  const cls =
    p === "Urgent"
      ? "bg-rose-600 text-white hover:bg-rose-600"
      : p === "High"
      ? "bg-amber-600 text-white hover:bg-amber-600"
      : "bg-gray-200 text-gray-800 hover:bg-gray-200";
  return <Badge className={cx("border-0", cls)}>{p}</Badge>;
}

function StatusBadge({ s }) {
  const cls =
    s === "Running"
      ? "bg-emerald-600 text-white hover:bg-emerald-600"
      : s === "Maintenance"
      ? "bg-amber-600 text-white hover:bg-amber-600"
      : "bg-gray-200 text-gray-800 hover:bg-gray-200";
  return <Badge className={cx("border-0", cls)}>{s}</Badge>;
}

export default function MachineAllocation() {
  const { toast } = useToast();

  // Filters
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(addDaysISO(todayISO(), 7));
  const [workCenter, setWorkCenter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Data
  const [machines, setMachines] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [loading, setLoading] = useState(true);

  // Create/edit drawer-ish state (inline panel)
  const [activeAlloc, setActiveAlloc] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // init load
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        setLoading(true);
        const [m, w, a] = await Promise.all([loadMachinesMock(), loadWorkOrdersMock(), loadAllocationsMock()]);
        if (!mounted) return;
        setMachines(m);
        setWorkOrders(w);
        setAllocations(a);
      } catch (e) {
        toast({ title: "Load failed", description: "Could not load scheduling data.", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const filteredMachines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (machines || [])
      .filter((m) => (workCenter === "ALL" ? true : m.workCenter === workCenter))
      .filter((m) => {
        if (!q) return true;
        return (
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.workCenter.toLowerCase().includes(q) ||
          m.shift.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.workCenter.localeCompare(b.workCenter) || a.name.localeCompare(b.name));
  }, [machines, workCenter, search]);

  const allocByMachineDate = useMemo(() => {
    const map = new Map(); // key: `${machineId}|${date}` => list
    (allocations || []).forEach((a) => {
      const key = `${a.machineId}|${a.date}`;
      const list = map.get(key) || [];
      list.push(a);
      map.set(key, list);
    });
    return map;
  }, [allocations]);

  const dateRange = useMemo(() => {
    // inclusive list of ISO dates
    const out = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return out;

    const cursor = new Date(start);
    while (cursor <= end) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      out.push(`${y}-${m}-${d}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [fromDate, toDate]);

  const kpis = useMemo(() => {
    const totalAllocMin = (allocations || []).reduce((acc, a) => acc + Number(a.plannedMin || 0), 0);
    const totalMachines = filteredMachines.length;
    const overDays = [];
    filteredMachines.forEach((m) => {
      dateRange.forEach((dt) => {
        const list = allocByMachineDate.get(`${m.id}|${dt}`) || [];
        const used = list.reduce((acc, x) => acc + Number(x.plannedMin || 0), 0);
        if (used > Number(m.capacityMinPerDay || 0)) overDays.push({ machineId: m.id, dt, used, cap: m.capacityMinPerDay });
      });
    });

    return {
      totalAllocMin,
      totalMachines,
      overCount: overDays.length,
      overDays,
    };
  }, [allocations, filteredMachines, dateRange, allocByMachineDate]);

  function openNewAllocation(machine, date) {
    setActiveAlloc({
      id: null,
      date,
      machineId: machine.id,
      workCenter: machine.workCenter,
      woId: "",
      plannedMin: 60,
      plannedQtyPanels: 0,
      notes: "",
    });
  }

  function openEditAllocation(a) {
    setActiveAlloc({ ...a });
  }

  function closeEditor() {
    setActiveAlloc(null);
  }

  function saveAllocation() {
    if (!activeAlloc) return;

    // basic validation
    if (!activeAlloc.machineId) {
      toast({ title: "Missing machine", description: "Select a machine.", variant: "destructive" });
      return;
    }
    if (!activeAlloc.date) {
      toast({ title: "Missing date", description: "Select a date.", variant: "destructive" });
      return;
    }
    if (!activeAlloc.woId) {
      toast({ title: "Missing work order", description: "Select a work order.", variant: "destructive" });
      return;
    }
    if (Number(activeAlloc.plannedMin || 0) <= 0) {
      toast({ title: "Invalid time", description: "Planned minutes must be greater than 0.", variant: "destructive" });
      return;
    }

    const machine = machines.find((m) => m.id === activeAlloc.machineId);
    const cap = Number(machine?.capacityMinPerDay || 0);
    const key = `${activeAlloc.machineId}|${activeAlloc.date}`;
    const existing = allocByMachineDate.get(key) || [];

    const sumOther = existing
      .filter((x) => x.id !== activeAlloc.id)
      .reduce((acc, x) => acc + Number(x.plannedMin || 0), 0);

    const nextUsed = sumOther + Number(activeAlloc.plannedMin || 0);
    if (cap > 0 && nextUsed > cap) {
      toast({
        title: "Over-allocated",
        description: `This allocation will exceed capacity (${minutesToHM(nextUsed)} / ${minutesToHM(cap)}).`,
        variant: "destructive",
      });
      // allow save anyway (common in real scheduling), but warn.
    }

    if (activeAlloc.id) {
      setAllocations((prev) => prev.map((x) => (x.id === activeAlloc.id ? { ...activeAlloc } : x)));
      toast({ title: "Updated", description: "Allocation updated." });
    } else {
      const newAlloc = { ...activeAlloc, id: makeId("AL") };
      setAllocations((prev) => [newAlloc, ...prev]);
      toast({ title: "Saved", description: "Allocation created." });
    }

    closeEditor();
  }

  function requestDeleteAllocation() {
    if (!activeAlloc?.id) return;
    setDeleteOpen(true);
  }

  function confirmDeleteAllocation() {
    if (!activeAlloc?.id) return;
    setAllocations((prev) => prev.filter((x) => x.id !== activeAlloc.id));
    setDeleteOpen(false);
    toast({ title: "Deleted", description: "Allocation removed." });
    closeEditor();
  }

  function resetFilters() {
    setFromDate(todayISO());
    setToDate(addDaysISO(todayISO(), 7));
    setWorkCenter("ALL");
    setSearch("");
    toast({ title: "Filters reset", description: "Showing default scheduling window." });
  }

  const woMap = useMemo(() => {
    const m = new Map();
    (workOrders || []).forEach((w) => m.set(w.id, w));
    return m;
  }, [workOrders]);

  const machineMap = useMemo(() => {
    const m = new Map();
    (machines || []).forEach((x) => m.set(x.id, x));
    return m;
  }, [machines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-gray-900" />
            <h1 className="text-xl font-bold text-gray-900">Machine Allocation</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Allocate PCB work orders to machines by date. Track capacity and detect bottlenecks early.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => {
              // convenience: open allocation on first machine & first date if available
              const m = filteredMachines[0];
              const d = dateRange[0];
              if (!m || !d) {
                toast({ title: "No target", description: "Select a date range and ensure machines exist.", variant: "destructive" });
                return;
              }
              openNewAllocation(m, d);
            }}
          >
            <Plus className="h-4 w-4" />
            New Allocation
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-gray-500">Total Planned Time</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">{minutesToHM(kpis.totalAllocMin)}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10">
              <Clock className="h-5 w-5 text-[#dc2551]" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-gray-500">Machines in View</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">{kpis.totalMachines}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100">
              <Wrench className="h-5 w-5 text-gray-900" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-gray-500">Over-allocated Days</p>
              <p className={cx("mt-1 text-2xl font-extrabold", kpis.overCount ? "text-rose-600" : "text-gray-900")}>
                {kpis.overCount}
              </p>
            </div>
            <div className={cx("grid h-10 w-10 place-items-center rounded-xl", kpis.overCount ? "bg-rose-50" : "bg-emerald-50")}>
              {kpis.overCount ? <ShieldCheck className="h-5 w-5 text-rose-700" /> : <CheckCircle2 className="h-5 w-5 text-emerald-700" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Filters</CardTitle>
          <CardDescription className="text-xs">Control the scheduling view window and scope.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <Label className="text-xs">From</Label>
            <Input className="mt-1" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Label className="text-xs">To</Label>
            <Input className="mt-1" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs">Work Center</Label>
            <div className="mt-1">
              <select
                value={workCenter}
                onChange={(e) => setWorkCenter(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="ALL">All</option>
                {WC_CHOICES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs">Search</Label>
            <div className="mt-1 relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Machine, WC, shift..." />
            </div>
          </div>

          <div className="md:col-span-12 flex items-center gap-2 text-xs text-gray-600">
            <Filter className="h-4 w-4" />
            Tip: keep date range short (7–14 days) for faster scheduling decisions.
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Allocation Board</CardTitle>
          <CardDescription className="text-xs">
            Click a day cell to add allocation. Click an allocation chip to edit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-600">Loading scheduling data…</div>
          ) : dateRange.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-600">Choose a valid date range.</div>
          ) : filteredMachines.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-600">
              No machines match current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1050px]">
                {/* Header row */}
                <div className="grid" style={{ gridTemplateColumns: `340px repeat(${dateRange.length}, minmax(140px, 1fr))` }}>
                  <div className="sticky left-0 z-10 border-b bg-white px-3 py-2 text-xs font-semibold text-gray-600">
                    Machine / Work Center
                  </div>
                  {dateRange.map((d) => (
                    <div key={d} className="border-b bg-white px-3 py-2 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{d}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {filteredMachines.map((m) => (
                  <div
                    key={m.id}
                    className="grid"
                    style={{ gridTemplateColumns: `340px repeat(${dateRange.length}, minmax(140px, 1fr))` }}
                  >
                    {/* Machine cell */}
                    <div className="sticky left-0 z-10 border-b bg-white px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                            <StatusBadge s={m.status} />
                          </div>
                          <p className="mt-1 text-xs text-gray-600">
                            <span className="font-semibold">{m.workCenter}</span> • {m.shift} • Capacity:{" "}
                            <span className="font-semibold text-gray-900">{minutesToHM(m.capacityMinPerDay)}</span>/day
                          </p>
                        </div>
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100">
                          <Layers className="h-4 w-4 text-gray-800" />
                        </div>
                      </div>
                    </div>

                    {/* Day cells */}
                    {dateRange.map((dt) => {
                      const list = allocByMachineDate.get(`${m.id}|${dt}`) || [];
                      const used = list.reduce((acc, x) => acc + Number(x.plannedMin || 0), 0);
                      const cap = Number(m.capacityMinPerDay || 0);
                      const over = cap > 0 && used > cap;

                      return (
                        <div
                          key={`${m.id}_${dt}`}
                          className={cx(
                            "border-b px-2 py-2 align-top",
                            over ? "bg-rose-50" : "bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={cx("text-[11px] font-semibold", over ? "text-rose-700" : "text-gray-700")}>
                              {minutesToHM(used)} / {minutesToHM(cap)}
                            </p>
                            <button
                              type="button"
                              onClick={() => openNewAllocation(m, dt)}
                              className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
                              aria-label="Add allocation"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-2 space-y-2">
                            {list.length === 0 ? (
                              <div className="rounded-lg border border-dashed p-2 text-center text-[11px] text-gray-500">
                                No allocation
                              </div>
                            ) : (
                              list.map((a) => {
                                const wo = woMap.get(a.woId);
                                const pri = wo?.priority || "Normal";
                                return (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => openEditAllocation(a)}
                                    className={cx(
                                      "w-full rounded-xl border px-2 py-2 text-left text-[11px] transition",
                                      "hover:shadow-sm hover:bg-gray-50"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-gray-900">{a.woId}</span>
                                      <PriorityBadge p={pri} />
                                    </div>
                                    <p className="mt-1 text-[11px] text-gray-600 line-clamp-2">
                                      {wo?.product || "Work order"} • {a.plannedQtyPanels || 0} panels
                                    </p>
                                    <p className="mt-1 text-[11px] text-gray-700">
                                      Planned: <span className="font-semibold">{minutesToHM(a.plannedMin)}</span>
                                    </p>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor panel */}
      {activeAlloc && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              {activeAlloc.id ? "Edit Allocation" : "New Allocation"}
            </CardTitle>
            <CardDescription className="text-xs">
              Assign a work order operation to a machine on a specific date.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <Label className="text-xs">Date</Label>
              <Input
                className="mt-1"
                type="date"
                value={activeAlloc.date}
                onChange={(e) => setActiveAlloc((p) => ({ ...p, date: e.target.value }))}
              />
            </div>

            <div className="md:col-span-4">
              <Label className="text-xs">Machine</Label>
              <div className="mt-1">
                <select
                  value={activeAlloc.machineId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const mach = machineMap.get(id);
                    setActiveAlloc((p) => ({ ...p, machineId: id, workCenter: mach?.workCenter || p.workCenter }));
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                >
                  <option value="">Select machine</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} • {m.workCenter} • {m.shift}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-5">
              <Label className="text-xs">Work Order</Label>
              <div className="mt-1">
                <select
                  value={activeAlloc.woId}
                  onChange={(e) => {
                    const woId = e.target.value;
                    const wo = woMap.get(woId);
                    setActiveAlloc((p) => ({
                      ...p,
                      woId,
                      workCenter: wo?.op || p.workCenter,
                      plannedMin: wo?.stdMin ?? p.plannedMin,
                    }));
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                >
                  <option value="">Select work order</option>
                  {workOrders
                    .filter((w) => (workCenter === "ALL" ? true : w.op === workCenter))
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.id} • {w.customer} • {w.product} • Due {w.dueDate}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs">Planned Minutes</Label>
              <Input
                className="mt-1"
                type="number"
                min="1"
                value={activeAlloc.plannedMin}
                onChange={(e) => setActiveAlloc((p) => ({ ...p, plannedMin: e.target.value }))}
              />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs">Planned Qty (Panels)</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={activeAlloc.plannedQtyPanels}
                onChange={(e) => setActiveAlloc((p) => ({ ...p, plannedQtyPanels: e.target.value }))}
              />
            </div>

            <div className="md:col-span-6">
              <Label className="text-xs">Notes</Label>
              <Input
                className="mt-1"
                value={activeAlloc.notes || ""}
                onChange={(e) => setActiveAlloc((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional instructions (e.g., run with controlled etch parameters)"
              />
            </div>

            {/* Helper: capacity preview */}
            <div className="md:col-span-12">
              {(() => {
                const mach = machineMap.get(activeAlloc.machineId);
                const cap = Number(mach?.capacityMinPerDay || 0);
                const key = `${activeAlloc.machineId}|${activeAlloc.date}`;
                const list = allocByMachineDate.get(key) || [];
                const usedOthers = list
                  .filter((x) => x.id !== activeAlloc.id)
                  .reduce((acc, x) => acc + Number(x.plannedMin || 0), 0);
                const nextUsed = usedOthers + Number(activeAlloc.plannedMin || 0);
                const over = cap > 0 && nextUsed > cap;

                return (
                  <div className={cx("rounded-xl border px-3 py-2 text-xs", over ? "border-rose-200 bg-rose-50" : "border-gray-200 bg-gray-50")}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-gray-700">
                        Capacity Preview:{" "}
                        <span className={cx("font-semibold", over ? "text-rose-700" : "text-gray-900")}>
                          {minutesToHM(nextUsed)} / {minutesToHM(cap)}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Work Center: <span className="font-semibold text-gray-900">{activeAlloc.workCenter || "-"}</span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                {activeAlloc.id ? (
                  <Button
                    variant="outline"
                    className="gap-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={requestDeleteAllocation}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    Create a new allocation entry
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={closeEditor}>
                  Cancel
                </Button>
                <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={saveAllocation}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete allocation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the allocation from the schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAllocation}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
