// src/pages/production/capacity/CapacityDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  Factory,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

/**
 * If you already have services, replace mock calls with your API.
 * Suggested endpoints:
 *  - GET /production/capacity/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=...&group=...
 *  - GET /production/capacity/workcenters?...
 *  - GET /production/capacity/bottlenecks?...
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${Math.round(Number(v))}%`;
}

function fmtHrs(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  const n = Number(v);
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)} h`;
}

function fmtNum(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return new Intl.NumberFormat().format(Number(v));
}

function toISODate(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDefaultRange(days = 14) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { from: toISODate(start), to: toISODate(end) };
}

function severityFromUtil(util) {
  const u = Number(util || 0);
  if (u >= 90) return { label: "Critical", tone: "bg-red-50 text-red-700 border-red-200" };
  if (u >= 80) return { label: "High", tone: "bg-amber-50 text-amber-800 border-amber-200" };
  if (u >= 65) return { label: "Medium", tone: "bg-blue-50 text-blue-700 border-blue-200" };
  return { label: "Low", tone: "bg-gray-50 text-gray-700 border-gray-200" };
}

/** CSV export helper */
function exportCsv(rows, meta) {
  const header = [
    "Workcenter ID",
    "Workcenter Name",
    "Plant",
    "Process Group",
    "Available Hours",
    "Load Hours",
    "Utilization %",
    "Queue Hours",
    "WIP Lots",
    "Downtime Hours",
    "Throughput Panels/Day",
    "OEE %",
    "Range From",
    "Range To",
  ];

  const escape = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const data = rows.map((r) => [
    r.id,
    r.name,
    r.plant,
    r.group,
    r.availableHours,
    r.loadHours,
    r.utilization,
    r.queueHours,
    r.wipLots,
    r.downtimeHours,
    r.throughputPanelsPerDay,
    r.oee,
    meta?.from || "",
    meta?.to || "",
  ]);

  const csv = [header, ...data].map((row) => row.map(escape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `capacity-dashboard_${meta?.from || "from"}_${meta?.to || "to"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Mock API — replace with backend calls.
 */
async function mockFetchCapacity({ from, to, plant, group }) {
  await new Promise((r) => setTimeout(r, 650));

  const base = [
    {
      id: "WC-PLATE-01",
      name: "Copper Plating Line",
      plant: "Plant A",
      group: "Plating",
      availableHours: 160,
      loadHours: 148,
      utilization: 92,
      queueHours: 26.0,
      wipLots: 19,
      downtimeHours: 1.1,
      throughputPanelsPerDay: 30,
      oee: 78,
      trend7d: +4,
      health: "risk",
      notes: "Constraint candidate. Check shift coverage and bath schedule.",
    },
    {
      id: "WC-DRILL-01",
      name: "CNC Drill 01",
      plant: "Plant A",
      group: "Drilling",
      availableHours: 160,
      loadHours: 139,
      utilization: 87,
      queueHours: 18.5,
      wipLots: 14,
      downtimeHours: 3.2,
      throughputPanelsPerDay: 42,
      oee: 74,
      trend7d: +6,
      health: "risk",
      notes: "High queue from multilayer jobs. Consider routing to Drill 02.",
    },
    {
      id: "WC-ETCH-01",
      name: "Etching Line",
      plant: "Plant A",
      group: "Imaging/Etch",
      availableHours: 160,
      loadHours: 133,
      utilization: 83,
      queueHours: 12.2,
      wipLots: 12,
      downtimeHours: 4.8,
      throughputPanelsPerDay: 48,
      oee: 69,
      trend7d: +1,
      health: "watch",
      notes: "Downtime elevated. Investigate rollers & chemistry.",
    },
    {
      id: "WC-AOI-01",
      name: "AOI 01",
      plant: "Plant A",
      group: "Inspection",
      availableHours: 160,
      loadHours: 109,
      utilization: 68,
      queueHours: 6.4,
      wipLots: 7,
      downtimeHours: 2.5,
      throughputPanelsPerDay: 55,
      oee: 82,
      trend7d: -3,
      health: "ok",
      notes: "Stable. Some downtime due to program switching.",
    },
    {
      id: "WC-ROUTE-01",
      name: "CNC Router 01",
      plant: "Plant A",
      group: "Profiling",
      availableHours: 160,
      loadHours: 118,
      utilization: 74,
      queueHours: 9.1,
      wipLots: 6,
      downtimeHours: 0.8,
      throughputPanelsPerDay: 60,
      oee: 86,
      trend7d: +2,
      health: "ok",
      notes: "Good throughput. Keep tooling availability high.",
    },
    {
      id: "WC-DRILL-02",
      name: "CNC Drill 02",
      plant: "Plant B",
      group: "Drilling",
      availableHours: 160,
      loadHours: 95,
      utilization: 59,
      queueHours: 4.0,
      wipLots: 5,
      downtimeHours: 6.1,
      throughputPanelsPerDay: 36,
      oee: 63,
      trend7d: -1,
      health: "watch",
      notes: "Lower utilization due to bit changes; reduce setup time.",
    },
  ];

  let rows = base;
  if (plant && plant !== "all") rows = rows.filter((r) => r.plant === plant);
  if (group && group !== "all") rows = rows.filter((r) => r.group === group);

  // summary
  const avgUtil = rows.length ? Math.round(rows.reduce((s, r) => s + r.utilization, 0) / rows.length) : 0;
  const avgOee = rows.length ? Math.round(rows.reduce((s, r) => s + r.oee, 0) / rows.length) : 0;
  const totalLoad = rows.reduce((s, r) => s + r.loadHours, 0);
  const totalAvail = rows.reduce((s, r) => s + r.availableHours, 0);
  const totalQueue = Number((rows.reduce((s, r) => s + r.queueHours, 0)).toFixed(1));
  const bottleneck = [...rows].sort((a, b) => b.utilization - a.utilization)[0];

  // process breakdown
  const byGroup = Object.values(
    rows.reduce((acc, r) => {
      const k = r.group;
      acc[k] = acc[k] || { group: k, workcenters: 0, avgUtil: 0, load: 0, avail: 0, queue: 0 };
      acc[k].workcenters += 1;
      acc[k].load += r.loadHours;
      acc[k].avail += r.availableHours;
      acc[k].queue += r.queueHours;
      acc[k].avgUtil += r.utilization;
      return acc;
    }, {})
  ).map((g) => ({
    ...g,
    avgUtil: Math.round(g.avgUtil / g.workcenters),
    queue: Number(g.queue.toFixed(1)),
  }));

  byGroup.sort((a, b) => b.avgUtil - a.avgUtil);

  return {
    summary: {
      from,
      to,
      plant: plant === "all" ? "All Plants" : plant,
      group: group === "all" ? "All Processes" : group,
      avgUtilization: avgUtil,
      avgOEE: avgOee,
      totalLoadHours: totalLoad,
      totalAvailableHours: totalAvail,
      totalQueueHours: totalQueue,
      topConstraint: bottleneck ? `${bottleneck.name} (${bottleneck.id})` : "-",
    },
    byGroup,
    rows,
  };
}

function HealthPill({ health }) {
  const map = {
    ok: { label: "OK", tone: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
    watch: { label: "Watch", tone: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle },
    risk: { label: "Risk", tone: "border-rose-200 bg-rose-50 text-rose-700", icon: AlertTriangle },
  };
  const v = map[health] || map.watch;
  const Icon = v.icon;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", v.tone)}>
      <Icon className="h-3.5 w-3.5" />
      {v.label}
    </span>
  );
}

function TrendPill({ v }) {
  const up = v > 0;
  const down = v < 0;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        up && "border-emerald-200 bg-emerald-50 text-emerald-700",
        down && "border-rose-200 bg-rose-50 text-rose-700",
        !up && !down && "border-gray-200 bg-gray-50 text-gray-700"
      )}
    >
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : down ? <TrendingDown className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
      <span>{up ? `+${v}` : `${v}`}%</span>
    </span>
  );
}

export default function CapacityDashboard() {
  const { toast } = useToast();

  const def = useMemo(() => getDefaultRange(14), []);
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);

  const [plant, setPlant] = useState("all");
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [byGroup, setByGroup] = useState([]);
  const [rows, setRows] = useState([]);

  const PlantOptions = ["all", "Plant A", "Plant B"];
  const GroupOptions = ["all", "Drilling", "Plating", "Imaging/Etch", "Inspection", "Profiling"];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Replace with service call when backend exists
      // const res = await capacityService.getDashboard({ from, to, plant, group });
      // setSummary(res.data.summary); setByGroup(res.data.byGroup); setRows(res.data.rows);

      const res = await mockFetchCapacity({ from, to, plant, group });
      setSummary(res.summary);
      setByGroup(res.byGroup);
      setRows(res.rows);
    } catch (err) {
      toast({
        title: "Failed to load capacity dashboard",
        description: "Please try again. If it continues, contact admin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => `${r.id} ${r.name} ${r.plant} ${r.group}`.toLowerCase().includes(needle));
  }, [rows, q]);

  const constraint = useMemo(() => {
    const s = [...filteredRows].sort((a, b) => b.utilization - a.utilization);
    return s[0] || null;
  }, [filteredRows]);

  const constraintSeverity = useMemo(() => severityFromUtil(constraint?.utilization ?? 0), [constraint]);

  const onApply = async () => {
    // simple validation
    if (!from || !to) {
      toast({ title: "Invalid range", description: "Select From and To dates.", variant: "destructive" });
      return;
    }
    if (from > to) {
      toast({ title: "Invalid range", description: "'From' date cannot be after 'To'.", variant: "destructive" });
      return;
    }
    await fetchData();
  };

  const onReset = () => {
    const d = getDefaultRange(14);
    setFrom(d.from);
    setTo(d.to);
    setPlant("all");
    setGroup("all");
    setQ("");
    toast({ title: "Reset complete", description: "Showing default last 14 days." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Capacity Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor load vs available hours, utilization, queue, WIP, downtime and OEE across PCB workcenters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => exportCsv(filteredRows, { from, to })}
            disabled={loading || filteredRows.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600">Plant</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
              >
                {PlantOptions.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? "All Plants" : p}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600">Process</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                {GroupOptions.map((g) => (
                  <option key={g} value={g}>
                    {g === "all" ? "All Processes" : g}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button variant="outline" className="w-full gap-2" onClick={onReset} type="button">
                <Filter className="h-4 w-4" />
                Reset
              </Button>
              <Button className="w-full bg-[#dc2551] hover:bg-[#b02045]" onClick={onApply} disabled={loading} type="button">
                Apply
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-5">
              <Label className="text-xs text-gray-600">Search workcenter</Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                  placeholder="e.g., Plating, Drill, AOI, WC-DRILL-01"
                />
              </div>
            </div>

            <div className="md:col-span-7 flex items-center justify-between gap-3 rounded-xl border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <Factory className="h-4 w-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Top Constraint</div>
                  <div className="text-sm font-semibold text-gray-900">{summary?.topConstraint || "—"}</div>
                </div>
              </div>

              <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", constraintSeverity.tone)}>
                {constraintSeverity.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Avg Utilization</CardTitle>
            <CardDescription className="text-xs">{summary?.plant || "—"} • {summary?.group || "—"}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{fmtPct(summary?.avgUtilization)}</div>
            <div className="mt-1 text-xs text-gray-600">Target: 70–85% for stable flow</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Avg OEE</CardTitle>
            <CardDescription className="text-xs">Availability • Performance • Quality</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{fmtPct(summary?.avgOEE)}</div>
            <div className="mt-1 text-xs text-gray-600">Improve by reducing downtime & rework</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Load vs Available</CardTitle>
            <CardDescription className="text-xs">Workcenter hours in range</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs text-gray-500">Load</div>
                <div className="text-lg font-bold text-gray-900">{fmtHrs(summary?.totalLoadHours)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Available</div>
                <div className="text-lg font-bold text-gray-900">{fmtHrs(summary?.totalAvailableHours)}</div>
              </div>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-[#dc2551]"
                style={{
                  width: `${Math.min(
                    100,
                    summary?.totalAvailableHours ? (summary.totalLoadHours / summary.totalAvailableHours) * 100 : 0
                  )}%`,
                }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-600">Higher means tighter capacity</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Queue</CardTitle>
            <CardDescription className="text-xs">Across filtered workcenters</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{fmtHrs(summary?.totalQueueHours)}</div>
            <div className="mt-1 text-xs text-gray-600">Queue drives lead time & late deliveries</div>
          </CardContent>
        </Card>
      </div>

      {/* Process Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">Process Breakdown</CardTitle>
              <CardDescription className="text-xs">
                Average utilization by process group (helps spot stage-level constraints).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Settings2 className="h-4 w-4" />
              <span>{byGroup.length} group(s)</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {byGroup.map((g) => {
                const sev = severityFromUtil(g.avgUtil);
                return (
                  <div key={g.group} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{g.group}</div>
                        <div className="mt-0.5 text-xs text-gray-600">
                          {g.workcenters} workcenter(s) • Queue {fmtHrs(g.queue)}
                        </div>
                      </div>
                      <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", sev.tone)}>
                        {sev.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Avg Utilization</span>
                        <span className="font-semibold text-gray-900">{fmtPct(g.avgUtil)}</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-[#dc2551]" style={{ width: `${Math.min(100, g.avgUtil)}%` }} />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="text-gray-500">Load</div>
                        <div className="font-semibold text-gray-900">{fmtHrs(g.load)}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="text-gray-500">Available</div>
                        <div className="font-semibold text-gray-900">{fmtHrs(g.avail)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workcenter table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">Workcenters</CardTitle>
              <CardDescription className="text-xs">
                Focus on utilization + queue + OEE to keep lead times predictable.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/production/capacity/bottleneck-analysis">
                  <BarChart3 className="h-4 w-4" />
                  Bottleneck Analysis
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="min-w-[1060px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Workcenter</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Plant</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Process</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Health</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Utilization</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Queue</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">WIP</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Load</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Available</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Downtime</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">OEE</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Trend 7d</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-3 py-10">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading…
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-3 py-10">
                      <div className="text-center text-sm text-gray-600">No workcenters found.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRows
                    .slice()
                    .sort((a, b) => b.utilization - a.utilization)
                    .map((r) => (
                      <tr key={r.id} className="text-sm">
                        <td className="border-b px-3 py-3">
                          <div className="font-semibold text-gray-900">{r.name}</div>
                          <div className="mt-0.5 text-xs text-gray-500">{r.id}</div>
                        </td>
                        <td className="border-b px-3 py-3 text-gray-700">{r.plant}</td>
                        <td className="border-b px-3 py-3 text-gray-700">{r.group}</td>
                        <td className="border-b px-3 py-3">
                          <HealthPill health={r.health} />
                        </td>
                        <td className="border-b px-3 py-3">{fmtPct(r.utilization)}</td>
                        <td className="border-b px-3 py-3">{fmtHrs(r.queueHours)}</td>
                        <td className="border-b px-3 py-3">{fmtNum(r.wipLots)}</td>
                        <td className="border-b px-3 py-3">{fmtHrs(r.loadHours)}</td>
                        <td className="border-b px-3 py-3">{fmtHrs(r.availableHours)}</td>
                        <td className="border-b px-3 py-3">{fmtHrs(r.downtimeHours)}</td>
                        <td className="border-b px-3 py-3">{fmtPct(r.oee)}</td>
                        <td className="border-b px-3 py-3">
                          <TrendPill v={r.trend7d} />
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredRows.length > 0 && (
            <div className="mt-4 rounded-xl border bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">
                  <Wrench className="h-4 w-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Next Actions (practical)</div>
                  <ul className="mt-1 list-disc pl-4 text-xs text-gray-600 space-y-1">
                    <li>
                      If utilization is <span className="font-medium">≥ 90%</span>, add shift capacity, parallelize routing, or reduce setup time.
                    </li>
                    <li>
                      If queue is increasing, check upstream release rules and WIP limits to prevent flooding the constraint.
                    </li>
                    <li>
                      If OEE is low, prioritize preventive maintenance and reduce changeover/program switching.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
