// src/pages/production/scheduling/ScheduleBoard.jsx
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Factory,
    Filter,
    Layers,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

/**
 * PCBxpress – Production Scheduling Board (UI only)
 * - Week view (Mon–Sun)
 * - Swimlanes by process
 * - Cards represent Work Orders / Jobs
 * - Filters: Plant, Process, Priority, Status, Search
 *
 * Hook this to backend later:
 * - GET /production/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=...&process=...
 * - PATCH /production/schedule/:jobId (move/change dates/process)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PROCESS_LANES = [
  { key: "imaging", label: "Imaging", icon: Layers },
  { key: "etching", label: "Etching", icon: Factory },
  { key: "drilling", label: "Drilling", icon: Wrench },
  { key: "plating", label: "Plating", icon: Layers },
  { key: "soldermask", label: "Solder Mask", icon: Layers },
  { key: "silkscreen", label: "Silk Screen", icon: Layers },
  { key: "routing", label: "Routing/V-Score", icon: Wrench },
  { key: "aoi", label: "AOI", icon: ClipboardList },
  { key: "etest", label: "E-Test", icon: ClipboardList },
  { key: "final", label: "Final Inspection", icon: CheckCircle2 },
];

const PRIORITY = ["Low", "Normal", "High", "Critical"];
const STATUS = ["Planned", "In Progress", "On Hold", "Done"];

const PLANTS = ["Main Plant", "Plant-2", "Proto Lab"];

function startOfWeekMonday(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1 - day); // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function ymd(date) {
  return format(date, "yyyy-MM-dd");
}

function within(dateStr, fromStr, toStr) {
  // inclusive range compare using YYYY-MM-DD strings
  return dateStr >= fromStr && dateStr <= toStr;
}

function statusBadge(status) {
  switch (status) {
    case "Done":
      return <Badge className="bg-green-600 hover:bg-green-600">Done</Badge>;
    case "On Hold":
      return (
        <Badge className="bg-amber-600 hover:bg-amber-600">
          <AlertTriangle className="mr-1 h-3.5 w-3.5" /> On Hold
        </Badge>
      );
    case "In Progress":
      return <Badge className="bg-blue-600 hover:bg-blue-600">In Progress</Badge>;
    default:
      return <Badge variant="secondary">Planned</Badge>;
  }
}

function priorityBadge(p) {
  if (p === "Critical") return <Badge className="bg-red-600 hover:bg-red-600">Critical</Badge>;
  if (p === "High") return <Badge className="bg-amber-600 hover:bg-amber-600">High</Badge>;
  if (p === "Low") return <Badge variant="outline">Low</Badge>;
  return <Badge variant="secondary">Normal</Badge>;
}

function JobCard({ job, onOpen }) {
  const isLate = job.dueDate < job.endDate && job.status !== "Done";

  return (
    <button
      onClick={() => onOpen(job)}
      className={cx(
        "group w-full text-left",
        "rounded-xl border bg-white p-3 shadow-sm transition",
        "hover:shadow-md hover:border-gray-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
      )}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {job.workOrderNo} • {job.customer}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {job.partNo} • {job.layers}L • {job.thicknessMm}mm • {job.qty} pcs
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {priorityBadge(job.priority)}
          {statusBadge(job.status)}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span className="rounded-md bg-gray-50 px-2 py-1">
          Start: <span className="font-medium">{job.startDate}</span>
        </span>
        <span className="rounded-md bg-gray-50 px-2 py-1">
          End: <span className="font-medium">{job.endDate}</span>
        </span>
        <span className="rounded-md bg-gray-50 px-2 py-1">
          Due: <span className={cx("font-medium", isLate ? "text-red-600" : "")}>{job.dueDate}</span>
        </span>
        {job.plant && <span className="rounded-md bg-gray-50 px-2 py-1">{job.plant}</span>}
      </div>

      {job.notes ? (
        <p className="mt-2 line-clamp-2 text-xs text-gray-500 group-hover:text-gray-600">
          {job.notes}
        </p>
      ) : null}
    </button>
  );
}

function DrawerModal({ open, onClose, job }) {
  if (!open || !job) return null;

  const late = job.dueDate < job.endDate && job.status !== "Done";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {job.workOrderNo} • {job.customer}
            </p>
            <p className="truncate text-xs text-gray-500">{job.partNo}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {priorityBadge(job.priority)}
            {statusBadge(job.status)}
            {late ? (
              <Badge className="bg-red-600 hover:bg-red-600">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                Late risk
              </Badge>
            ) : (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                On track
              </Badge>
            )}
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Process</p>
                  <p className="font-medium text-gray-900">{job.processLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Plant</p>
                  <p className="font-medium text-gray-900">{job.plant}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start</p>
                  <p className="font-medium text-gray-900">{job.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End</p>
                  <p className="font-medium text-gray-900">{job.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className={cx("font-medium", late ? "text-red-600" : "text-gray-900")}>{job.dueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Qty</p>
                  <p className="font-medium text-gray-900">{job.qty} pcs</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Layers</p>
                  <p className="font-medium text-gray-900">{job.layers}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thickness</p>
                  <p className="font-medium text-gray-900">{job.thicknessMm} mm</p>
                </div>
              </div>

              {job.notes ? (
                <div className="mt-4">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{job.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Next actions (hook to backend later)</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Move job to a different process lane</li>
              <li>Adjust planned start/end dates</li>
              <li>Assign machine / line / shift</li>
              <li>Mark hold reason or completion</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={() => alert("Hook to API: reschedule")}>
              Reschedule
            </Button>
            <Button variant="outline" onClick={() => alert("Hook to API: open Work Order details")}>
              Open Work Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleBoard() {
  const { toast } = useToast();

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [plant, setPlant] = useState("Main Plant");
  const [process, setProcess] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fake dataset (replace with API fetch)
  const [jobs, setJobs] = useState(() => {
    const ws = startOfWeekMonday(new Date());
    const d0 = ymd(ws);
    const d1 = ymd(addDays(ws, 1));
    const d2 = ymd(addDays(ws, 2));
    const d3 = ymd(addDays(ws, 3));
    const d4 = ymd(addDays(ws, 4));
    const d5 = ymd(addDays(ws, 5));
    const d6 = ymd(addDays(ws, 6));

    return [
      {
        id: "WO-24019",
        workOrderNo: "WO-24019",
        customer: "Aster Robotics",
        partNo: "AST-RB-CTRL-02",
        layers: 4,
        thicknessMm: 1.6,
        qty: 120,
        plant: "Main Plant",
        process: "imaging",
        processLabel: "Imaging",
        startDate: d0,
        endDate: d1,
        dueDate: d3,
        priority: "High",
        status: "Planned",
        notes: "Tight impedance. Verify stackup + drill chart before CAM release.",
      },
      {
        id: "WO-24027",
        workOrderNo: "WO-24027",
        customer: "Nova Instruments",
        partNo: "NOVA-ADC-12",
        layers: 2,
        thicknessMm: 1.2,
        qty: 500,
        plant: "Main Plant",
        process: "etching",
        processLabel: "Etching",
        startDate: d1,
        endDate: d2,
        dueDate: d3,
        priority: "Normal",
        status: "In Progress",
        notes: "Green solder mask. Panelize to 2-up.",
      },
      {
        id: "WO-24031",
        workOrderNo: "WO-24031",
        customer: "Kite Mobility",
        partNo: "KITE-PWR-REV3",
        layers: 6,
        thicknessMm: 1.8,
        qty: 80,
        plant: "Plant-2",
        process: "drilling",
        processLabel: "Drilling",
        startDate: d2,
        endDate: d3,
        dueDate: d4,
        priority: "Critical",
        status: "Planned",
        notes: "Microvias present. Use controlled drill feed.",
      },
      {
        id: "WO-24033",
        workOrderNo: "WO-24033",
        customer: "Helio Tech",
        partNo: "HEL-IO-LOGIC",
        layers: 8,
        thicknessMm: 2.0,
        qty: 60,
        plant: "Main Plant",
        process: "plating",
        processLabel: "Plating",
        startDate: d3,
        endDate: d5,
        dueDate: d4, // late risk
        priority: "High",
        status: "In Progress",
        notes: "Watch copper thickness. QA sampling every batch.",
      },
      {
        id: "WO-24036",
        workOrderNo: "WO-24036",
        customer: "Orion Labs",
        partNo: "ORION-SNS-01",
        layers: 2,
        thicknessMm: 1.6,
        qty: 300,
        plant: "Proto Lab",
        process: "aoi",
        processLabel: "AOI",
        startDate: d4,
        endDate: d4,
        dueDate: d5,
        priority: "Low",
        status: "Planned",
        notes: "Prototype lot. Visual + AOI only.",
      },
      {
        id: "WO-24038",
        workOrderNo: "WO-24038",
        customer: "ZenDrive",
        partNo: "ZD-MOTOR-DRV",
        layers: 4,
        thicknessMm: 1.6,
        qty: 150,
        plant: "Main Plant",
        process: "etest",
        processLabel: "E-Test",
        startDate: d5,
        endDate: d6,
        dueDate: d6,
        priority: "Normal",
        status: "Planned",
        notes: "Netlist compare required before E-test certificate generation.",
      },
    ];
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekStart, i);
      return { date: d, key: ymd(d), label: format(d, "EEE"), day: format(d, "d MMM") };
    });
  }, [weekStart]);

  const range = useMemo(() => {
    const from = ymd(weekStart);
    const to = ymd(addDays(weekStart, 6));
    return { from, to };
  }, [weekStart]);

  const filteredJobs = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return jobs
      .filter((j) => j.plant === plant)
      .filter((j) => (process === "all" ? true : j.process === process))
      .filter((j) => (priority === "all" ? true : j.priority === priority))
      .filter((j) => (status === "all" ? true : j.status === status))
      .filter((j) => within(j.startDate, range.from, range.to) || within(j.endDate, range.from, range.to))
      .filter((j) => {
        if (!qq) return true;
        return (
          j.workOrderNo.toLowerCase().includes(qq) ||
          j.customer.toLowerCase().includes(qq) ||
          j.partNo.toLowerCase().includes(qq) ||
          j.processLabel.toLowerCase().includes(qq)
        );
      });
  }, [jobs, plant, process, priority, status, q, range.from, range.to]);

  const lanes = useMemo(() => {
    const laneMap = new Map(PROCESS_LANES.map((p) => [p.key, []]));
    filteredJobs.forEach((job) => {
      if (!laneMap.has(job.process)) laneMap.set(job.process, []);
      laneMap.get(job.process).push(job);
    });
    // sort within lane by priority then start date
    const pRank = { Low: 0, Normal: 1, High: 2, Critical: 3 };
    for (const [k, arr] of laneMap.entries()) {
      arr.sort((a, b) => {
        const pr = (pRank[b.priority] ?? 0) - (pRank[a.priority] ?? 0);
        if (pr !== 0) return pr;
        return a.startDate.localeCompare(b.startDate);
      });
      laneMap.set(k, arr);
    }
    return laneMap;
  }, [filteredJobs]);

  const totals = useMemo(() => {
    const t = { planned: 0, inProgress: 0, hold: 0, done: 0, lateRisk: 0 };
    filteredJobs.forEach((j) => {
      if (j.status === "Planned") t.planned += 1;
      if (j.status === "In Progress") t.inProgress += 1;
      if (j.status === "On Hold") t.hold += 1;
      if (j.status === "Done") t.done += 1;
      if (j.dueDate < j.endDate && j.status !== "Done") t.lateRisk += 1;
    });
    return t;
  }, [filteredJobs]);

  const openJob = (job) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      // Hook to API here
      await new Promise((r) => setTimeout(r, 500));
      toast({ title: "Schedule refreshed", description: "Latest scheduling snapshot loaded." });
    } catch (e) {
      toast({ title: "Refresh failed", description: "Could not load schedule data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goThisWeek = () => setWeekStart(startOfWeekMonday(new Date()));

  useEffect(() => {
    // Example auto-load whenever range/filters change (UI demo)
    // You can replace this with real API fetching later.
  }, [weekStart, plant, process, priority, status, q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production</p>
          <h1 className="text-xl font-bold text-gray-900">Schedule Board</h1>
          <p className="mt-1 text-sm text-gray-600">
            Plan PCB work orders across processes (week view). Monitor late risks and capacity hotspots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={prevWeek} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button variant="outline" onClick={goThisWeek} className="gap-2">
            <CalendarDays className="h-4 w-4" />
            This week
          </Button>
          <Button variant="outline" onClick={nextWeek} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={refresh}
            className="bg-cyan-600 hover:bg-cyan-500 gap-2"
            disabled={loading}
          >
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Week range */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {format(weekStart, "dd MMM yyyy")} – {format(addDays(weekStart, 6), "dd MMM yyyy")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Planned: {totals.planned}</Badge>
              <Badge className="bg-blue-600 hover:bg-blue-600">In Progress: {totals.inProgress}</Badge>
              <Badge className="bg-amber-600 hover:bg-amber-600">Hold: {totals.hold}</Badge>
              <Badge className="bg-green-600 hover:bg-green-600">Done: {totals.done}</Badge>
              <Badge className="bg-red-600 hover:bg-red-600">Late risk: {totals.lateRisk}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Filters row */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <Label className="text-xs text-gray-500">Plant</Label>
              <div className="mt-1 flex gap-2">
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {PLANTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-500">Process</Label>
              <div className="mt-1">
                <select
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="all">All processes</option>
                  {PROCESS_LANES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500">Priority</Label>
              <div className="mt-1">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="all">All</option>
                  {PRIORITY.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500">Status</Label>
              <div className="mt-1">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="all">All</option>
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500">Search</Label>
              <div className="mt-1 relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="WO / Customer / Part"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Day header */}
          <div className="mt-5 grid grid-cols-7 gap-2">
            {weekDays.map((d) => (
              <div
                key={d.key}
                className="rounded-lg border bg-white px-3 py-2 text-center shadow-sm"
              >
                <p className="text-xs font-semibold text-gray-700">{d.label}</p>
                <p className="text-xs text-gray-500">{d.day}</p>
              </div>
            ))}
          </div>

          {/* Lanes */}
          <div className="mt-4 space-y-3">
            {PROCESS_LANES.filter((lane) => (process === "all" ? true : lane.key === process)).map((lane) => {
              const Icon = lane.icon;
              const laneJobs = lanes.get(lane.key) ?? [];

              return (
                <motion.div
                  key={lane.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{lane.label}</p>
                        <p className="text-xs text-gray-500">
                          {laneJobs.length} job{laneJobs.length === 1 ? "" : "s"} in this lane
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                          toast({
                            title: "Tip",
                            description:
                              "Later: you can add drag & drop to move jobs between lanes and days.",
                          })
                        }
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Lane options
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
                    {laneJobs.length === 0 ? (
                      <div className="col-span-full rounded-xl border border-dashed bg-gray-50 p-6 text-center">
                        <p className="text-sm font-medium text-gray-700">No jobs scheduled</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Try changing filters or week range.
                        </p>
                      </div>
                    ) : (
                      laneJobs.map((job) => <JobCard key={job.id} job={job} onOpen={openJob} />)
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-4 flex items-start gap-2 rounded-xl border bg-gray-50 p-4">
            <Filter className="mt-0.5 h-4 w-4 text-gray-500" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold">PCBxpress scheduling notes</p>
              <p className="mt-1 text-xs text-gray-600">
                This board is a UI scaffold. Connect to backend to support real-time scheduling,
                drag & drop moves, machine assignments, and capacity constraints.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details drawer */}
      <DrawerModal
        open={drawerOpen}
        job={selectedJob}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedJob(null);
        }}
      />
    </div>
  );
}
