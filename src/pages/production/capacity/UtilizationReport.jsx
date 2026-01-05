// src/pages/reports/production/UtilizationReport.jsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart3,
  Download,
  Factory,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Timer,
  Wrench,
} from "lucide-react";

/**
 * Utilization Report (PCB Manufacturing ERP)
 * -----------------------------------------
 * Utilization focuses on how much time a resource is actually used vs available.
 *
 * Common definitions:
 *  - Available Time (min) = Scheduled shift minutes for the period
 *  - Utilization (%) = Run Time / Available Time
 *  - Idle Time (min) = Available - (Run + Downtime)  [or simply Available - Run, depending on your policy]
 *
 * This page supports both:
 *  - Workcenter utilization (Drill, Plating, AOI, E-Test, etc.)
 *  - Department/Process group utilization (optional)
 *
 * Replace mock API with your backend service when ready.
 * Suggested endpoints:
 *  - GET /reports/utilization/summary?from=&to=&plant=&groupBy=(workcenter|process)
 *  - GET /reports/utilization/detail?from=&to=&plant=&groupBy=&q=
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function toISODate(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDefaultRange(days = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { from: toISODate(start), to: toISODate(end) };
}

function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return `${Math.round(Number(v))}%`;
}

function fmtMin(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return `${Math.round(Number(v))} min`;
}

function fmtHrs(vMin) {
  if (vMin === null || vMin === undefined || Number.isNaN(Number(vMin))) return "-";
  const h = Number(vMin) / 60;
  return `${h.toFixed(1)} h`;
}

function fmtNum(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return new Intl.NumberFormat().format(Number(v));
}

function clampPct(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function exportCsv(rows, meta) {
  const header = [
    "Plant",
    "Group By",
    "Resource ID",
    "Resource Name",
    "Process",
    "Available (min)",
    "Run (min)",
    "Downtime (min)",
    "Idle (min)",
    "Utilization (%)",
    "Downtime (%)",
    "Idle (%)",
    "Period From",
    "Period To",
  ];

  const escape = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const data = rows.map((r) => [
    r.plant,
    meta.groupBy,
    r.id,
    r.name,
    r.process,
    r.availableMin,
    r.runMin,
    r.downMin,
    r.idleMin,
    r.utilizationPct,
    r.downtimePct,
    r.idlePct,
    meta.from,
    meta.to,
  ]);

  const csv = [header, ...data].map((row) => row.map(escape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `utilization_${meta.groupBy}_${meta.from}_${meta.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function statusFromUtil(u) {
  const v = Number(u || 0);
  if (v >= 85) return { label: "Hot", tone: "border-rose-200 bg-rose-50 text-rose-700" };
  if (v >= 70) return { label: "Busy", tone: "border-amber-200 bg-amber-50 text-amber-800" };
  if (v >= 50) return { label: "Normal", tone: "border-blue-200 bg-blue-50 text-blue-700" };
  return { label: "Idle", tone: "border-gray-200 bg-gray-50 text-gray-700" };
}

function MetricCard({ title, value, sub, icon: Icon }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
          {Icon ? (
            <span className="rounded-lg bg-gray-50 p-2">
              <Icon className="h-4 w-4 text-gray-700" />
            </span>
          ) : null}
        </div>
        {sub ? <CardDescription className="text-xs">{sub}</CardDescription> : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, value }) {
  const v = clampPct(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className="font-semibold text-gray-900">{fmtPct(v)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-[#dc2551]" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

/** MOCK API — replace with backend */
async function mockFetchUtilization({ from, to, plant, groupBy }) {
  await new Promise((r) => setTimeout(r, 650));

  const base = [
    { id: "WC-DRILL-01", name: "CNC Drill 01", process: "Drilling", plant: "Plant A", availableMin: 14400, runMin: 11050, downMin: 1780 },
    { id: "WC-DRILL-02", name: "CNC Drill 02", process: "Drilling", plant: "Plant A", availableMin: 14400, runMin: 9800, downMin: 2150 },
    { id: "WC-PLATE-01", name: "Copper Plating Line", process: "Plating", plant: "Plant A", availableMin: 14400, runMin: 12550, downMin: 760 },
    { id: "WC-ETCH-01", name: "Etching Line", process: "Etching", plant: "Plant A", availableMin: 14400, runMin: 9000, downMin: 2100 },
    { id: "WC-AOI-01", name: "AOI 01", process: "Inspection", plant: "Plant A", availableMin: 14400, runMin: 11800, downMin: 620 },
    { id: "WC-ETEST-01", name: "E-Test 01", process: "Electrical Test", plant: "Plant A", availableMin: 14400, runMin: 7600, downMin: 980 },

    { id: "WC-DRILL-03", name: "CNC Drill 03", process: "Drilling", plant: "Plant B", availableMin: 14400, runMin: 8200, downMin: 2600 },
    { id: "WC-PLATE-02", name: "Copper Plating Line 02", process: "Plating", plant: "Plant B", availableMin: 14400, runMin: 10900, downMin: 1200 },
    { id: "WC-AOI-02", name: "AOI 02", process: "Inspection", plant: "Plant B", availableMin: 14400, runMin: 9900, downMin: 780 },
  ];

  let rows = base;
  if (plant && plant !== "all") rows = rows.filter((r) => r.plant === plant);

  // derive metrics
  rows = rows.map((r) => {
    const available = Math.max(0, Number(r.availableMin || 0));
    const run = Math.max(0, Number(r.runMin || 0));
    const down = Math.max(0, Number(r.downMin || 0));

    const idle = Math.max(0, available - run - down);
    const utilizationPct = available ? (run / available) * 100 : 0;
    const downtimePct = available ? (down / available) * 100 : 0;
    const idlePct = available ? (idle / available) * 100 : 0;

    return {
      ...r,
      idleMin: idle,
      utilizationPct: Math.round(utilizationPct),
      downtimePct: Math.round(downtimePct),
      idlePct: Math.round(idlePct),
    };
  });

  if (groupBy === "process") {
    // Aggregate by process
    const map = new Map();
    for (const r of rows) {
      const key = `${r.plant}__${r.process}`;
      const cur = map.get(key) || {
        id: `PROC-${r.process.toUpperCase().replace(/\s+/g, "-")}`,
        name: r.process,
        process: r.process,
        plant: r.plant,
        availableMin: 0,
        runMin: 0,
        downMin: 0,
      };
      cur.availableMin += r.availableMin;
      cur.runMin += r.runMin;
      cur.downMin += r.downMin;
      map.set(key, cur);
    }

    rows = Array.from(map.values()).map((r) => {
      const available = Math.max(0, Number(r.availableMin || 0));
      const run = Math.max(0, Number(r.runMin || 0));
      const down = Math.max(0, Number(r.downMin || 0));
      const idle = Math.max(0, available - run - down);
      return {
        ...r,
        idleMin: idle,
        utilizationPct: available ? Math.round((run / available) * 100) : 0,
        downtimePct: available ? Math.round((down / available) * 100) : 0,
        idlePct: available ? Math.round((idle / available) * 100) : 0,
      };
    });
  }

  // overall summary weighted by available time
  const totAvail = rows.reduce((s, r) => s + Number(r.availableMin || 0), 0);
  const totRun = rows.reduce((s, r) => s + Number(r.runMin || 0), 0);
  const totDown = rows.reduce((s, r) => s + Number(r.downMin || 0), 0);
  const totIdle = rows.reduce((s, r) => s + Number(r.idleMin || 0), 0);

  const summary = {
    from,
    to,
    plant: plant === "all" ? "All Plants" : plant,
    groupBy,
    totalResources: rows.length,
    availableMin: totAvail,
    runMin: totRun,
    downMin: totDown,
    idleMin: totIdle,
    utilizationPct: totAvail ? Math.round((totRun / totAvail) * 100) : 0,
    downtimePct: totAvail ? Math.round((totDown / totAvail) * 100) : 0,
    idlePct: totAvail ? Math.round((totIdle / totAvail) * 100) : 0,
  };

  // sort by utilization desc
  rows.sort((a, b) => Number(b.utilizationPct || 0) - Number(a.utilizationPct || 0));

  return { summary, rows };
}

export default function UtilizationReport() {
  const { toast } = useToast();

  const def = useMemo(() => getDefaultRange(30), []);
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);

  const [plant, setPlant] = useState("all");
  const [groupBy, setGroupBy] = useState("workcenter"); // workcenter | process
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const plantOptions = ["all", "Plant A", "Plant B"];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => `${r.id} ${r.name} ${r.plant} ${r.process}`.toLowerCase().includes(needle));
  }, [rows, q]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Replace with real service:
      // const res = await utilizationService.get({ from, to, plant, groupBy });
      // setSummary(res.data.summary); setRows(res.data.rows);

      const res = await mockFetchUtilization({ from, to, plant, groupBy });
      setSummary(res.summary);
      setRows(res.rows);
    } catch (e) {
      toast({
        title: "Failed to load utilization report",
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

  const onApply = async () => {
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
    const d = getDefaultRange(30);
    setFrom(d.from);
    setTo(d.to);
    setPlant("all");
    setGroupBy("workcenter");
    setQ("");
    toast({ title: "Reset complete", description: "Showing default last 30 days." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Utilization Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            See how effectively PCB production resources are used (run vs available time). Identify over-loaded and under-used stations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => exportCsv(filtered, { from, to, groupBy })}
            disabled={loading || filtered.length === 0}
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

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Plant</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
              >
                {plantOptions.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? "All Plants" : p}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Group By</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="workcenter">Workcenter</option>
                <option value="process">Process</option>
              </select>
            </div>

            <div className="md:col-span-3 flex gap-2">
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
            <div className="md:col-span-6">
              <Label className="text-xs text-gray-600">Search</Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                  placeholder="e.g., Drill, Plating, AOI, WC-DRILL-01"
                />
              </div>
            </div>

            <div className="md:col-span-6 flex items-center justify-between gap-3 rounded-xl border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <Factory className="h-4 w-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Scope</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {summary?.plant || "—"} • {groupBy === "workcenter" ? "Workcenters" : "Processes"}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {summary?.totalResources ?? 0} rows
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard title="Utilization" value={fmtPct(summary?.utilizationPct)} sub="Run / Available" icon={BarChart3} />
        <MetricCard title="Available" value={fmtHrs(summary?.availableMin)} sub={fmtMin(summary?.availableMin)} icon={Timer} />
        <MetricCard title="Run" value={fmtHrs(summary?.runMin)} sub={fmtMin(summary?.runMin)} icon={Factory} />
        <MetricCard title="Downtime" value={fmtHrs(summary?.downMin)} sub={fmtMin(summary?.downMin)} icon={Wrench} />
        <MetricCard title="Idle" value={fmtHrs(summary?.idleMin)} sub={fmtMin(summary?.idleMin)} icon={Timer} />
      </div>

      {/* Summary bars */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Time Split</CardTitle>
          <CardDescription className="text-xs">
            Weighted by available time. Use this to decide whether you need more capacity or better reliability.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          <ProgressRow label="Utilization (Run)" value={summary?.utilizationPct ?? 0} />
          <ProgressRow label="Downtime" value={summary?.downtimePct ?? 0} />
          <ProgressRow label="Idle" value={summary?.idlePct ?? 0} />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">
                {groupBy === "workcenter" ? "Workcenter Utilization" : "Process Utilization"}
              </CardTitle>
              <CardDescription className="text-xs">
                Sort by utilization automatically (highest first). Focus on top “Hot” stations for bottleneck mitigation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-600">No data found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="border-b px-2 py-2">Status</th>
                    <th className="border-b px-2 py-2">{groupBy === "workcenter" ? "Workcenter" : "Process"}</th>
                    <th className="border-b px-2 py-2">Plant</th>
                    <th className="border-b px-2 py-2">Available</th>
                    <th className="border-b px-2 py-2">Run</th>
                    <th className="border-b px-2 py-2">Downtime</th>
                    <th className="border-b px-2 py-2">Idle</th>
                    <th className="border-b px-2 py-2">Util %</th>
                    <th className="border-b px-2 py-2">Down %</th>
                    <th className="border-b px-2 py-2">Idle %</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const stat = statusFromUtil(r.utilizationPct);
                    return (
                      <tr key={`${r.plant}-${r.id}`} className="text-xs">
                        <td className="border-b px-2 py-2">
                          <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", stat.tone)}>
                            {stat.label}
                          </span>
                        </td>
                        <td className="border-b px-2 py-2">
                          <div className="font-semibold text-gray-900">{r.name}</div>
                          <div className="text-[11px] text-gray-500">{r.id}</div>
                        </td>
                        <td className="border-b px-2 py-2 text-gray-700">{r.plant}</td>
                        <td className="border-b px-2 py-2">{fmtHrs(r.availableMin)}</td>
                        <td className="border-b px-2 py-2 font-semibold text-gray-900">{fmtHrs(r.runMin)}</td>
                        <td className="border-b px-2 py-2">{fmtHrs(r.downMin)}</td>
                        <td className="border-b px-2 py-2">{fmtHrs(r.idleMin)}</td>
                        <td className="border-b px-2 py-2 font-semibold text-gray-900">{fmtPct(r.utilizationPct)}</td>
                        <td className="border-b px-2 py-2">{fmtPct(r.downtimePct)}</td>
                        <td className="border-b px-2 py-2">{fmtPct(r.idlePct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Notes for PCB factories</CardTitle>
          <CardDescription className="text-xs">How to act on utilization numbers.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            <span className="font-semibold">High utilization (≥ 85%)</span> usually indicates bottlenecks. Check queue/WIP
            before the resource, reduce changeovers, and prioritize preventive maintenance.
          </p>
          <p>
            <span className="font-semibold">High downtime</span> suggests reliability issues (breakdowns, utilities, chemistry,
            tooling). Track MTBF/MTTR and top downtime reasons.
          </p>
          <p>
            <span className="font-semibold">High idle</span> may indicate upstream starvation, poor scheduling, material shortages,
            or order mix problems (frequent setups). Validate release plan and kitting readiness.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
