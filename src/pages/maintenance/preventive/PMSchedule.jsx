// src/pages/maintenance/preventive/PMSchedule.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Wrench,
  XCircle,
} from "lucide-react";

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
 * PCBxpress - Preventive Maintenance (PM) Schedule
 * File: src/pages/maintenance/preventive/PMSchedule.jsx
 *
 * A schedule view that turns PM checklist templates into calendar-like work.
 *
 * Suggested APIs:
 * - GET    /maintenance/pm/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD&query=&equipmentType=&criticality=&status=
 * - POST   /maintenance/pm/schedule                (create schedule item / assign)
 * - PUT    /maintenance/pm/schedule/:id            (update due date, assignee, status)
 * - POST   /maintenance/pm/schedule/:id/close      (close with readings + remarks)
 * - DELETE /maintenance/pm/schedule/:id
 * - GET    /maintenance/pm/schedule/export?from=&to=   (CSV/PDF)
 *
 * Notes:
 * - This page is a "planner" for PM jobs: due, overdue, completed, skipped.
 * - Integrate with:
 *    - Equipment master (equipmentId, line, plant)
 *    - Checklist library (checklistId)
 *    - Work Orders (optional link)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const CRIT_META = {
  A: { label: "A (Critical)", variant: "destructive" },
  B: { label: "B (Important)", variant: "default" },
  C: { label: "C (Standard)", variant: "secondary" },
};

const STATUS_META = {
  due: { label: "Due", variant: "secondary" },
  overdue: { label: "Overdue", variant: "destructive" },
  completed: { label: "Completed", variant: "default" },
  skipped: { label: "Skipped", variant: "outline" },
};

function MetaBadge({ meta, value }) {
  const m = meta?.[value] ?? { label: value, variant: "outline" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function Pill({ icon: Icon, title, value, hint }) {
  return (
    <Card className="rounded-2xl border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

function toISODate(d) {
  // local date -> YYYY-MM-DD
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso, n) {
  const dt = new Date(`${iso}T00:00:00`);
  dt.setDate(dt.getDate() + n);
  return toISODate(dt);
}

/** Mock data (replace with API) */
function mockSchedule(fromISO, toISO) {
  // Make a few items across the next days
  return [
    {
      id: "PM-SCH-00091",
      dueDate: addDays(fromISO, 1),
      status: "due",
      equipmentId: "EQ-DRL-0003",
      equipmentName: "CNC Drill #3",
      equipmentType: "Drilling",
      checklistId: "PM-DRL-DLY",
      checklistName: "CNC Drill — Daily Startup Checklist",
      criticality: "A",
      assignee: "Rafi (Maintenance)",
      plant: "Plant A",
      line: "Drill Bay",
      estimatedMins: 25,
      lastDone: addDays(fromISO, -1),
    },
    {
      id: "PM-SCH-00092",
      dueDate: addDays(fromISO, 2),
      status: "due",
      equipmentId: "EQ-PLT-0001",
      equipmentName: "Plating Line #1",
      equipmentType: "Plating",
      checklistId: "PM-PLT-WK",
      checklistName: "Plating Line — Weekly Chemical & Anode Check",
      criticality: "A",
      assignee: "Sree (Process)",
      plant: "Plant A",
      line: "Wet Process",
      estimatedMins: 60,
      lastDone: addDays(fromISO, -6),
    },
    {
      id: "PM-SCH-00093",
      dueDate: addDays(fromISO, -1),
      status: "overdue",
      equipmentId: "EQ-AOI-0002",
      equipmentName: "AOI Station #2",
      equipmentType: "Inspection (AOI)",
      checklistId: "PM-AOI-MO",
      checklistName: "AOI — Monthly Optics & Calibration",
      criticality: "B",
      assignee: "Arun (Quality)",
      plant: "Plant B",
      line: "Final Inspection",
      estimatedMins: 40,
      lastDone: addDays(fromISO, -31),
    },
    {
      id: "PM-SCH-00090",
      dueDate: addDays(fromISO, 0),
      status: "completed",
      equipmentId: "EQ-UTIL-0004",
      equipmentName: "Air Compressor #1",
      equipmentType: "Utilities",
      checklistId: "PM-UTIL-AN",
      checklistName: "Compressor & Dryer — Annual Service",
      criticality: "A",
      assignee: "Nithin (Facilities)",
      plant: "Plant A",
      line: "Utilities",
      estimatedMins: 120,
      lastDone: addDays(fromISO, 0),
      closedAt: `${addDays(fromISO, 0)} 14:20`,
      remark: "Oil replaced, filters cleaned, leak test OK.",
    },
    {
      id: "PM-SCH-00094",
      dueDate: addDays(fromISO, 4),
      status: "skipped",
      equipmentId: "EQ-ET-0001",
      equipmentName: "E-Test Machine #1",
      equipmentType: "Electrical Test",
      checklistId: "PM-ETEST-QTR",
      checklistName: "E-Test — Quarterly Fixture & Probe Verification",
      criticality: "B",
      assignee: "Arun (Quality)",
      plant: "Plant B",
      line: "E-Test",
      estimatedMins: 55,
      lastDone: addDays(fromISO, -95),
      remark: "Skipped due to machine under breakdown maintenance.",
    },
  ].filter((x) => x.dueDate >= fromISO && x.dueDate <= toISO);
}

export default function PMSchedule() {
  const { toast } = useToast();

  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [from, setFrom] = useState(todayISO);
  const [to, setTo] = useState(addDays(todayISO, 14));

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [equipmentType, setEquipmentType] = useState("all");
  const [criticality, setCriticality] = useState("all");
  const [status, setStatus] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [plant, setPlant] = useState("all");

  // Delete / remove schedule item
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // TODO: replace with API call using from/to + filters server-side if preferred
      const data = mockSchedule(from, to);
      setRows(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load PM schedule",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const equipmentTypes = useMemo(() => {
    const set = new Set(rows.map((r) => r.equipmentType).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const assignees = useMemo(() => {
    const set = new Set(rows.map((r) => r.assignee).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const plants = useMemo(() => {
    const set = new Set(rows.map((r) => r.plant).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const due = rows.filter((r) => r.status === "due").length;
    const overdue = rows.filter((r) => r.status === "overdue").length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const criticalA = rows.filter((r) => r.criticality === "A" && (r.status === "due" || r.status === "overdue")).length;
    return { total, due, overdue, completed, criticalA };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...rows];

    if (needle) {
      list = list.filter((r) => {
        const hay = [
          r.id,
          r.equipmentId,
          r.equipmentName,
          r.equipmentType,
          r.checklistId,
          r.checklistName,
          r.plant,
          r.line,
          r.assignee,
          r.status,
          r.criticality,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }

    if (equipmentType !== "all") list = list.filter((r) => r.equipmentType === equipmentType);
    if (criticality !== "all") list = list.filter((r) => r.criticality === criticality);
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (assignee !== "all") list = list.filter((r) => r.assignee === assignee);
    if (plant !== "all") list = list.filter((r) => r.plant === plant);

    // sort: overdue first, then due, then others; within by due date
    const prio = { overdue: 0, due: 1, skipped: 2, completed: 3 };
    list.sort((a, b) => {
      const pa = prio[a.status] ?? 9;
      const pb = prio[b.status] ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    });

    return list;
  }, [rows, q, equipmentType, criticality, status, assignee, plant]);

  const resetFilters = () => {
    setQ("");
    setEquipmentType("all");
    setCriticality("all");
    setStatus("all");
    setAssignee("all");
    setPlant("all");
  };

  const setQuickRange = (days) => {
    setFrom(todayISO);
    setTo(addDays(todayISO, days));
  };

  const requestDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      // TODO: replace with DELETE /maintenance/pm/schedule/:id
      setRows((prev) => prev.filter((r) => r.id !== selected.id));
      toast({ title: "Schedule item removed", description: `${selected.id} removed from schedule.` });
      setDeleteOpen(false);
      setSelected(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Remove failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const exportSchedule = async () => {
    try {
      // TODO: replace with backend export
      toast({
        title: "Export started (placeholder)",
        description: `Implement /maintenance/pm/schedule/export?from=${from}&to=${to} for CSV/PDF.`,
      });
    } catch (e) {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const markDone = async (row) => {
    try {
      // TODO: replace with POST /maintenance/pm/schedule/:id/close
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: "completed", closedAt: `${row.dueDate} 16:10`, remark: "Closed from schedule screen." }
            : r
        )
      );
      toast({ title: "Marked completed", description: `${row.id} closed.` });
    } catch (e) {
      toast({ title: "Action failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PM Schedule</h1>
            <p className="text-sm text-gray-600">
              Plan preventive maintenance jobs for PCB equipment and utilities. Track due, overdue and closures.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading || deleting}>
            <RefreshCw className={cx("h-4 w-4", (loading || deleting) && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={exportSchedule}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() =>
              toast({
                title: "Create schedule item (placeholder)",
                description: "Create PMScheduleCreate.jsx and hook it here.",
              })
            }
          >
            <Plus className="h-4 w-4" />
            New PM Job
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <Pill icon={ClipboardCheck} title="Jobs in Range" value={stats.total} />
        <Pill icon={AlertTriangle} title="Overdue" value={stats.overdue} hint="High priority items first" />
        <Pill icon={ShieldAlert} title="Due (Critical A)" value={stats.criticalA} hint="Stop-line risk items" />
        <Pill icon={CalendarDays} title="Due" value={stats.due} />
        <Pill icon={CheckCircle2} title="Completed" value={stats.completed} />
      </div>

      {/* Range + Filters */}
      <Card className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Range & Filters</p>
              <p className="text-xs text-gray-500">Pick a date window and filter by plant, type, owner and status.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setQuickRange(7)}>
              Next 7 days
            </Button>
            <Button variant="outline" onClick={() => setQuickRange(14)}>
              Next 14 days
            </Button>
            <Button variant="outline" onClick={() => setQuickRange(30)}>
              Next 30 days
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search equipment, checklist, job id..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plant">Plant</Label>
            <select
              id="plant"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              {plants.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All Plants" : p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="equipmentType">Type</Label>
            <select
              id="equipmentType"
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              {equipmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All Types" : t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <select
              id="assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "All Assignees" : a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="all">All</option>
              <option value="overdue">Overdue</option>
              <option value="due">Due</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          <div>
            <Label htmlFor="criticality">Criticality</Label>
            <select
              id="criticality"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="all">All</option>
              <option value="A">A (Critical)</option>
              <option value="B">B (Important)</option>
              <option value="C">C (Standard)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="h-28 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-28 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-28 animate-pulse rounded-2xl bg-gray-50" />
        </div>
      ) : !filtered.length ? (
        <Card className="rounded-2xl border bg-white p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-900">No scheduled PM jobs</h3>
          <p className="mt-1 text-sm text-gray-600">Try changing the date range or clearing filters.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="rounded-2xl border bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{r.id}</p>
                    <MetaBadge meta={STATUS_META} value={r.status} />
                    <MetaBadge meta={CRIT_META} value={r.criticality} />
                    <Badge variant="outline">{r.plant}</Badge>
                    <Badge variant="outline">{r.line}</Badge>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Equipment</p>
                      <p className="text-sm font-medium text-gray-900">
                        {r.equipmentName} <span className="text-gray-500">({r.equipmentId})</span>
                      </p>
                      <p className="text-xs text-gray-600">{r.equipmentType}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Checklist</p>
                      <p className="text-sm font-medium text-gray-900">
                        {r.checklistName} <span className="text-gray-500">({r.checklistId})</span>
                      </p>
                      <p className="text-xs text-gray-600">Estimated: {r.estimatedMins} mins</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      Due: <span className="font-semibold text-gray-900">{r.dueDate}</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-400" />
                      Assignee: <span className="font-semibold text-gray-900">{r.assignee}</span>
                    </span>
                    {r.lastDone ? (
                      <span className="inline-flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-gray-400" />
                        Last done: <span className="font-semibold text-gray-900">{r.lastDone}</span>
                      </span>
                    ) : null}
                  </div>

                  {r.remark ? (
                    <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">Remark</p>
                      <p className="mt-1">{r.remark}</p>
                    </div>
                  ) : null}

                  {r.closedAt ? (
                    <div className="mt-2 text-xs text-gray-500">Closed at: {r.closedAt}</div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to={`/maintenance/equipment/${r.equipmentId}`}>
                      <Wrench className="h-4 w-4" />
                      Equipment
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to={`/maintenance/preventive/pm-checklists/${r.checklistId}`}>
                      <ClipboardCheck className="h-4 w-4" />
                      Checklist
                    </Link>
                  </Button>

                  {r.status === "due" || r.status === "overdue" ? (
                    <Button
                      size="sm"
                      className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                      onClick={() => markDone(r)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Done
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        toast({
                          title: "Open job (placeholder)",
                          description: "Create PMJobDetails.jsx to show checklist execution + readings.",
                        })
                      }
                    >
                      {r.status === "completed" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          View Close
                        </>
                      ) : r.status === "skipped" ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          View Skip
                        </>
                      ) : (
                        <>
                          <Wrench className="h-4 w-4" />
                          View
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      toast({
                        title: "Reschedule (placeholder)",
                        description: "Implement edit dialog: change due date + assignee.",
                      })
                    }
                  >
                    <CalendarDays className="h-4 w-4" />
                    Reschedule
                  </Button>

                  <Button variant="outline" size="sm" className="gap-2" onClick={() => requestDelete(r)}>
                    <ShieldAlert className="h-4 w-4 text-[#dc2551]" />
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove schedule item?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <span className="font-semibold text-gray-900">{selected?.id}</span> from the PM schedule range.
              It won&apos;t delete the checklist template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
