// src/pages/production/capacity/BottleneckAnalysis.jsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
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
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// If you already have a service, replace mock calls with your API.
// Example: import capacityService from "@/services/capacity.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${Math.round(v)}%`;
}

function fmtHrs(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  const n = Number(v);
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)} h`;
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

/**
 * Mock API — replace with real API when backend is ready.
 * The idea: for each machine/workcenter, compute utilization, queue, throughput, downtime, and flag bottlenecks.
 */
async function mockFetchBottleneckAnalysis({ from, to, plant, processGroup }) {
  // simulate network
  await new Promise((r) => setTimeout(r, 650));

  const base = [
    {
      id: "WC-DRILL-01",
      name: "CNC Drill 01",
      group: "Drilling",
      plant: "Plant A",
      utilization: 87,
      queueHours: 18.5,
      throughputPanelsPerDay: 42,
      downtimeHours: 3.2,
      wipLots: 14,
      onTimeRate: 78,
      trend7d: +6,
      notes: "High queue from multilayer jobs. Consider parallel routing to Drill 02.",
    },
    {
      id: "WC-PLATE-01",
      name: "Copper Plating Line",
      group: "Plating",
      plant: "Plant A",
      utilization: 92,
      queueHours: 26.0,
      throughputPanelsPerDay: 30,
      downtimeHours: 1.1,
      wipLots: 19,
      onTimeRate: 71,
      trend7d: +4,
      notes: "Highest utilization. Check bath change schedule and shift coverage.",
    },
    {
      id: "WC-AOI-01",
      name: "AOI 01",
      group: "Inspection",
      plant: "Plant A",
      utilization: 68,
      queueHours: 6.4,
      throughputPanelsPerDay: 55,
      downtimeHours: 2.5,
      wipLots: 7,
      onTimeRate: 88,
      trend7d: -3,
      notes: "Stable. Some downtime due to program switching.",
    },
    {
      id: "WC-ETCH-01",
      name: "Etching Line",
      group: "Imaging/Etch",
      plant: "Plant A",
      utilization: 83,
      queueHours: 12.2,
      throughputPanelsPerDay: 48,
      downtimeHours: 4.8,
      wipLots: 12,
      onTimeRate: 81,
      trend7d: +1,
      notes: "Downtime higher than average. Investigate rollers & chemistry.",
    },
    {
      id: "WC-ROUTE-01",
      name: "CNC Router 01",
      group: "Profiling",
      plant: "Plant A",
      utilization: 74,
      queueHours: 9.1,
      throughputPanelsPerDay: 60,
      downtimeHours: 0.8,
      wipLots: 6,
      onTimeRate: 90,
      trend7d: +2,
      notes: "Good throughput. Keep tooling availability high.",
    },
    {
      id: "WC-DRILL-02",
      name: "CNC Drill 02",
      group: "Drilling",
      plant: "Plant B",
      utilization: 59,
      queueHours: 4.0,
      throughputPanelsPerDay: 36,
      downtimeHours: 6.1,
      wipLots: 5,
      onTimeRate: 84,
      trend7d: -1,
      notes: "Lower utilization due to frequent bit changes; review setup time.",
    },
  ];

  let rows = base;

  if (plant && plant !== "all") rows = rows.filter((r) => r.plant === plant);
  if (processGroup && processGroup !== "all") rows = rows.filter((r) => r.group === processGroup);

  // Derive a "bottleneck score" (simple heuristic)
  rows = rows.map((r) => {
    const score =
      r.utilization * 0.45 +
      Math.min(r.queueHours, 40) * 1.0 +
      r.wipLots * 0.9 +
      (100 - r.onTimeRate) * 0.7 +
      r.downtimeHours * 0.6;

    return { ...r, score: Math.round(score) };
  });

  // Rank by score desc
  rows.sort((a, b) => b.score - a.score);

  // plant summary
  const summary = {
    from,
    to,
    plant: plant === "all" ? "All Plants" : plant,
    processGroup: processGroup === "all" ? "All Processes" : processGroup,
    topBottleneck: rows[0] ? `${rows[0].name} (${rows[0].id})` : "-",
    avgUtilization: rows.length ? Math.round(rows.reduce((s, r) => s + r.utilization, 0) / rows.length) : 0,
    avgQueue: rows.length ? Number((rows.reduce((s, r) => s + r.queueHours, 0) / rows.length).toFixed(1)) : 0,
  };

  return { summary, rows };
}

function SeverityBadge({ score }) {
  let tone = "bg-gray-100 text-gray-700 border-gray-200";
  let label = "Low";
  if (score >= 140) {
    tone = "bg-red-50 text-red-700 border-red-200";
    label = "Critical";
  } else if (score >= 110) {
    tone = "bg-amber-50 text-amber-800 border-amber-200";
    label = "High";
  } else if (score >= 85) {
    tone = "bg-blue-50 text-blue-700 border-blue-200";
    label = "Medium";
  }
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", tone)}>
      {label}
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

function exportCsv(rows, meta) {
  const header = [
    "Rank",
    "Workcenter ID",
    "Workcenter Name",
    "Plant",
    "Process Group",
    "Bottleneck Score",
    "Utilization %",
    "Queue Hours",
    "WIP Lots",
    "Throughput Panels/Day",
    "Downtime Hours",
    "On-time %",
    "Trend 7d %",
    "Notes",
    "Range From",
    "Range To",
  ];

  const data = rows.map((r, idx) => [
    idx + 1,
    r.id,
    r.name,
    r.plant,
    r.group,
    r.score,
    r.utilization,
    r.queueHours,
    r.wipLots,
    r.throughputPanelsPerDay,
    r.downtimeHours,
    r.onTimeRate,
    r.trend7d,
    (r.notes || "").replace(/\n/g, " "),
    meta?.from || "",
    meta?.to || "",
  ]);

  const escape = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csv = [header, ...data].map((row) => row.map(escape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bottleneck-analysis_${meta?.from || "from"}_${meta?.to || "to"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BottleneckAnalysis() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const def = useMemo(() => getDefaultRange(14), []);
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);
  const [plant, setPlant] = useState("all");
  const [processGroup, setProcessGroup] = useState("all");
  const [q, setQ] = useState("");

  const [sortBy, setSortBy] = useState("score"); // score | utilization | queue | downtime | wip
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  const canExport = true; // change by permission if needed

  const fetchData = async () => {
    setLoading(true);
    try {
      // Replace with backend call:
      // const res = await capacityService.getBottleneckAnalysis({ from, to, plant, processGroup });
      // setSummary(res.data.summary); setRows(res.data.rows);

      const res = await mockFetchBottleneckAnalysis({ from, to, plant, processGroup });
      setSummary(res.summary);
      setRows(res.rows);
    } catch (err) {
      toast({
        title: "Failed to load bottleneck analysis",
        description: "Please try again. If the issue persists, contact admin.",
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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...rows];

    if (needle) {
      list = list.filter((r) => {
        const hay = `${r.id} ${r.name} ${r.group} ${r.plant}`.toLowerCase();
        return hay.includes(needle);
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    const pick = (r) => {
      if (sortBy === "utilization") return r.utilization;
      if (sortBy === "queue") return r.queueHours;
      if (sortBy === "downtime") return r.downtimeHours;
      if (sortBy === "wip") return r.wipLots;
      return r.score; // default score
    };

    list.sort((a, b) => (pick(a) > pick(b) ? 1 * dir : pick(a) < pick(b) ? -1 * dir : 0));
    return list;
  }, [rows, q, sortBy, sortDir]);

  const top3 = filtered.slice(0, 3);

  const onApplyFilters = async () => {
    setFiltersOpen(false);
    await fetchData();
  };

  const onResetFilters = () => {
    const d = getDefaultRange(14);
    setFrom(d.from);
    setTo(d.to);
    setPlant("all");
    setProcessGroup("all");
    setQ("");
    setSortBy("score");
    setSortDir("desc");
    toast({ title: "Filters reset", description: "Showing default last 14 days." });
  };

  const PlantOptions = ["all", "Plant A", "Plant B"];
  const GroupOptions = ["all", "Drilling", "Plating", "Imaging/Etch", "Inspection", "Profiling"];

  const SortOptions = [
    { value: "score", label: "Bottleneck Score" },
    { value: "utilization", label: "Utilization %" },
    { value: "queue", label: "Queue Hours" },
    { value: "wip", label: "WIP Lots" },
    { value: "downtime", label: "Downtime Hours" },
  ];

  const roleName = user?.role || "user";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bottleneck Analysis</h1>
          <p className="mt-1 text-sm text-gray-600">
            Identify constraints across workcenters (queue, utilization, downtime, WIP) for better throughput planning.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => exportCsv(filtered, { from, to })}
            disabled={!canExport || loading || filtered.length === 0}
            title={!canExport ? "You don't have permission to export" : ""}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Range</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs">
                {from} → {to}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{summary?.plant || "—"}</Badge>
              <Badge variant="secondary">{summary?.processGroup || "—"}</Badge>
              <Badge variant="secondary">Role: {roleName}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Current Constraint</CardTitle>
            <CardDescription className="text-xs">Highest bottleneck score in selection</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm font-semibold text-gray-900">{summary?.topBottleneck || "—"}</div>
            <div className="mt-2 text-xs text-gray-600">
              Action: reduce queue, add shift capacity, or reroute load to parallel workcenter.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Averages</CardTitle>
            <CardDescription className="text-xs">Across filtered workcenters</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">Avg Utilization</div>
              <div className="text-sm font-semibold text-gray-900">{fmtPct(summary?.avgUtilization)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-600">Avg Queue</div>
              <div className="text-sm font-semibold text-gray-900">{fmtHrs(summary?.avgQueue)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + sort */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-md">
              <Label className="text-xs text-gray-600">Search workcenter</Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="e.g., Drill, Plating, WC-PLATE-01" />
              </div>
            </div>

            <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
              <div>
                <Label className="text-xs text-gray-600">Sort by</Label>
                {/* If your Select component is shadcn Select, replace with SelectTrigger/SelectContent pattern.
                    Keeping simple here to match your existing imports */}
                <select
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Direction</Label>
                <div className="mt-1 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cx("w-full gap-2", sortDir === "desc" && "border-[#dc2551]/40 bg-[#dc2551]/5 text-[#dc2551]")}
                    onClick={() => setSortDir("desc")}
                  >
                    <ArrowDown className="h-4 w-4" /> Desc
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cx("w-full gap-2", sortDir === "asc" && "border-[#dc2551]/40 bg-[#dc2551]/5 text-[#dc2551]")}
                    onClick={() => setSortDir("asc")}
                  >
                    <ArrowUp className="h-4 w-4" /> Asc
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Top insights */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {top3.map((r, idx) => (
              <div key={r.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Top #{idx + 1}</div>
                    <div className="mt-0.5 text-sm font-semibold text-gray-900">{r.name}</div>
                    <div className="mt-0.5 text-xs text-gray-600">
                      <span className="font-medium">{r.group}</span> • {r.plant} • <span className="text-gray-500">{r.id}</span>
                    </div>
                  </div>
                  <SeverityBadge score={r.score} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-gray-500">Utilization</div>
                    <div className="font-semibold text-gray-900">{fmtPct(r.utilization)}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-gray-500">Queue</div>
                    <div className="font-semibold text-gray-900">{fmtHrs(r.queueHours)}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-gray-500">WIP Lots</div>
                    <div className="font-semibold text-gray-900">{r.wipLots}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-gray-500">Trend (7d)</div>
                    <div className="mt-0.5">
                      <TrendPill v={r.trend7d} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  <span className="font-medium">Suggestion:</span> {r.notes}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">Workcenter Ranking</CardTitle>
              <CardDescription className="text-xs">
                Ranked by bottleneck score (utilization + queue + WIP + downtime + on-time impact).
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Settings2 className="h-4 w-4" />
              <span>{filtered.length} result(s)</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Rank</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Workcenter</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Process</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Plant</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Severity</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Score</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Utilization</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Queue</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">WIP</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Throughput</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Downtime</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">On-time</th>
                  <th className="sticky top-0 bg-white/95 backdrop-blur border-b px-3 py-2">Trend 7d</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-3 py-10">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading analysis…
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-3 py-10">
                      <div className="text-center text-sm text-gray-600">
                        No workcenters found for current filters/search.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => (
                    <tr key={r.id} className="text-sm">
                      <td className="border-b px-3 py-3 text-gray-600">{idx + 1}</td>

                      <td className="border-b px-3 py-3">
                        <div className="font-semibold text-gray-900">{r.name}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.id}</div>
                      </td>

                      <td className="border-b px-3 py-3 text-gray-700">{r.group}</td>
                      <td className="border-b px-3 py-3 text-gray-700">{r.plant}</td>

                      <td className="border-b px-3 py-3">
                        <SeverityBadge score={r.score} />
                      </td>

                      <td className="border-b px-3 py-3">
                        <span className="font-semibold text-gray-900">{r.score}</span>
                      </td>

                      <td className="border-b px-3 py-3">{fmtPct(r.utilization)}</td>
                      <td className="border-b px-3 py-3">{fmtHrs(r.queueHours)}</td>
                      <td className="border-b px-3 py-3">{r.wipLots}</td>
                      <td className="border-b px-3 py-3">{r.throughputPanelsPerDay}/day</td>
                      <td className="border-b px-3 py-3">{fmtHrs(r.downtimeHours)}</td>
                      <td className="border-b px-3 py-3">{fmtPct(r.onTimeRate)}</td>
                      <td className="border-b px-3 py-3">
                        <TrendPill v={r.trend7d} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {!loading && filtered.length > 0 && (
            <div className="mt-4 rounded-xl border bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">
                  <Filter className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">How the score works</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Score is a heuristic combining <span className="font-medium">utilization</span>,{" "}
                    <span className="font-medium">queue</span>, <span className="font-medium">WIP</span>,{" "}
                    <span className="font-medium">downtime</span>, and{" "}
                    <span className="font-medium">on-time impact</span>. Replace with your plant’s official KPI model
                    when backend is ready.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters dialog */}
      <AlertDialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Filters</AlertDialogTitle>
            <AlertDialogDescription>
              Narrow down analysis by date range, plant and process group.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Plant</Label>
              <select
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
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

            <div className="space-y-2">
              <Label>Process Group</Label>
              <select
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={processGroup}
                onChange={(e) => setProcessGroup(e.target.value)}
              >
                {GroupOptions.map((g) => (
                  <option key={g} value={g}>
                    {g === "all" ? "All Processes" : g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={onResetFilters}>Reset</AlertDialogCancel>
            <AlertDialogAction onClick={onApplyFilters} disabled={loading} className="bg-[#dc2551] hover:bg-[#b02045]">
              {loading ? "Applying..." : "Apply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
