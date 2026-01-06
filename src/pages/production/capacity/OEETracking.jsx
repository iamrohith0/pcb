// src/pages/production/wip/OEETracking.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Download,
    Factory,
    Filter,
    Gauge,
    Loader2,
    RefreshCw,
    Search,
    Timer,
    Wrench
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * OEE Tracking (PCB Manufacturing ERP)
 * ----------------------------------
 * OEE = Availability × Performance × Quality
 *
 * Replace mock API with your backend service when ready.
 * Suggested endpoints:
 *  - GET /production/oee/summary?from=&to=&plant=&workcenter=
 *  - GET /production/oee/workcenters?from=&to=&plant=&workcenter=
 *  - GET /production/oee/events?from=&to=&plant=&workcenter=   (optional)
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

function getDefaultRange(days = 14) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { from: toISODate(start), to: toISODate(end) };
}

function clampPct(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return `${Math.round(Number(v))}%`;
}

function fmtMin(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  const n = Number(v);
  return `${Math.round(n)} min`;
}

function fmtNum(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return new Intl.NumberFormat().format(Number(v));
}

function exportCsv(rows, meta) {
  const header = [
    "Date",
    "Plant",
    "Workcenter ID",
    "Workcenter Name",
    "Planned Time (min)",
    "Run Time (min)",
    "Downtime (min)",
    "Ideal Cycle Time (sec/pc)",
    "Total Count (pcs)",
    "Good Count (pcs)",
    "Reject Count (pcs)",
    "Availability %",
    "Performance %",
    "Quality %",
    "OEE %",
    "Range From",
    "Range To",
  ];

  const escape = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const data = rows.flatMap((r) =>
    (r.daily || []).map((d) => [
      d.date,
      r.plant,
      r.id,
      r.name,
      d.plannedMin,
      d.runMin,
      d.downMin,
      d.idealCycleSec,
      d.totalCount,
      d.goodCount,
      d.rejectCount,
      d.availability,
      d.performance,
      d.quality,
      d.oee,
      meta?.from || "",
      meta?.to || "",
    ])
  );

  const csv = [header, ...data].map((row) => row.map(escape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `oee-tracking_${meta?.from || "from"}_${meta?.to || "to"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Simple status from OEE value */
function oeeStatus(oee) {
  const v = Number(oee || 0);
  if (v >= 85) return { label: "Excellent", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (v >= 70) return { label: "Good", tone: "border-blue-200 bg-blue-50 text-blue-700" };
  if (v >= 55) return { label: "Watch", tone: "border-amber-200 bg-amber-50 text-amber-800" };
  return { label: "Risk", tone: "border-rose-200 bg-rose-50 text-rose-700" };
}

/**
 * MOCK DATA (replace with API)
 * daily[] contains per-day aggregates per workcenter.
 */
async function mockFetchOEE({ from, to, plant, workcenter }) {
  await new Promise((r) => setTimeout(r, 650));

  const seed = [
    {
      id: "WC-PLATE-01",
      name: "Copper Plating Line",
      plant: "Plant A",
      daily: [
        { date: from, plannedMin: 480, runMin: 430, downMin: 50, idealCycleSec: 6, totalCount: 7800, goodCount: 7600, rejectCount: 200 },
        { date: to, plannedMin: 480, runMin: 415, downMin: 65, idealCycleSec: 6, totalCount: 7600, goodCount: 7350, rejectCount: 250 },
      ],
    },
    {
      id: "WC-DRILL-01",
      name: "CNC Drill 01",
      plant: "Plant A",
      daily: [
        { date: from, plannedMin: 480, runMin: 410, downMin: 70, idealCycleSec: 7, totalCount: 6400, goodCount: 6200, rejectCount: 200 },
        { date: to, plannedMin: 480, runMin: 420, downMin: 60, idealCycleSec: 7, totalCount: 6650, goodCount: 6500, rejectCount: 150 },
      ],
    },
    {
      id: "WC-AOI-01",
      name: "AOI 01",
      plant: "Plant A",
      daily: [
        { date: from, plannedMin: 480, runMin: 450, downMin: 30, idealCycleSec: 4, totalCount: 9200, goodCount: 9150, rejectCount: 50 },
        { date: to, plannedMin: 480, runMin: 455, downMin: 25, idealCycleSec: 4, totalCount: 9400, goodCount: 9360, rejectCount: 40 },
      ],
    },
    {
      id: "WC-DRILL-02",
      name: "CNC Drill 02",
      plant: "Plant B",
      daily: [
        { date: from, plannedMin: 480, runMin: 360, downMin: 120, idealCycleSec: 7, totalCount: 5200, goodCount: 5020, rejectCount: 180 },
        { date: to, plannedMin: 480, runMin: 370, downMin: 110, idealCycleSec: 7, totalCount: 5400, goodCount: 5250, rejectCount: 150 },
      ],
    },
  ];

  let rows = seed;
  if (plant && plant !== "all") rows = rows.filter((r) => r.plant === plant);
  if (workcenter && workcenter !== "all") rows = rows.filter((r) => r.id === workcenter);

  // compute OEE components
  rows = rows.map((r) => {
    const daily = r.daily.map((d) => {
      const planned = Math.max(0, Number(d.plannedMin || 0));
      const run = Math.max(0, Number(d.runMin || 0));
      const down = Math.max(0, Number(d.downMin || 0));
      const idealCycleSec = Math.max(0.001, Number(d.idealCycleSec || 1));
      const total = Math.max(0, Number(d.totalCount || 0));
      const good = Math.max(0, Number(d.goodCount || 0));
      const reject = Math.max(0, Number(d.rejectCount || 0));

      const availability = planned > 0 ? (run / planned) * 100 : 0;
      const idealRunTimeMin = total > 0 ? (total * idealCycleSec) / 60 : 0;
      const performance = run > 0 ? (idealRunTimeMin / run) * 100 : 0;
      const quality = total > 0 ? (good / total) * 100 : 0;

      const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

      return {
        ...d,
        availability: Math.round(availability),
        performance: Math.round(performance),
        quality: Math.round(quality),
        oee: Math.round(oee),
      };
    });

    return { ...r, daily };
  });

  // summary (avg across all daily points)
  const all = rows.flatMap((r) => r.daily.map((d) => ({ ...d, wc: r.id })));
  const avg = (k) => (all.length ? Math.round(all.reduce((s, a) => s + Number(a[k] || 0), 0) / all.length) : 0);

  const totalReject = all.reduce((s, a) => s + Number(a.rejectCount || 0), 0);
  const totalCount = all.reduce((s, a) => s + Number(a.totalCount || 0), 0);
  const scrapRate = totalCount ? Math.round((totalReject / totalCount) * 1000) / 10 : 0; // 1 decimal

  return {
    summary: {
      from,
      to,
      plant: plant === "all" ? "All Plants" : plant,
      workcenter: workcenter === "all" ? "All Workcenters" : workcenter,
      avgAvailability: avg("availability"),
      avgPerformance: avg("performance"),
      avgQuality: avg("quality"),
      avgOEE: avg("oee"),
      scrapRate, // %
    },
    rows,
  };
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

export default function OEETracking() {
  const { toast } = useToast();

  const def = useMemo(() => getDefaultRange(14), []);
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);

  const [plant, setPlant] = useState("all");
  const [workcenter, setWorkcenter] = useState("all");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const PlantOptions = ["all", "Plant A", "Plant B"];

  const workcenterOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.id));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => `${r.id} ${r.name} ${r.plant}`.toLowerCase().includes(needle));
  }, [rows, q]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Replace with your service:
      // const res = await oeeService.get({ from, to, plant, workcenter });
      // setSummary(res.data.summary); setRows(res.data.rows);

      const res = await mockFetchOEE({ from, to, plant, workcenter });
      setSummary(res.summary);
      setRows(res.rows);
    } catch (err) {
      toast({
        title: "Failed to load OEE data",
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
    const d = getDefaultRange(14);
    setFrom(d.from);
    setTo(d.to);
    setPlant("all");
    setWorkcenter("all");
    setQ("");
    toast({ title: "Reset complete", description: "Showing default last 14 days." });
  };

  const oeeStat = useMemo(() => oeeStatus(summary?.avgOEE ?? 0), [summary?.avgOEE]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">OEE Tracking</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track Availability, Performance, Quality and OEE for PCB workcenters to reduce downtime, speed loss and defects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
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

            <div className="md:col-span-3">
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

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Workcenter</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={workcenter}
                onChange={(e) => setWorkcenter(e.target.value)}
              >
                {(workcenterOptions.length ? workcenterOptions : ["all"]).map((w) => (
                  <option key={w} value={w}>
                    {w === "all" ? "All Workcenters" : w}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex gap-2">
              <Button variant="outline" className="w-full gap-2" onClick={onReset} type="button">
                <Filter className="h-4 w-4" />
                Reset
              </Button>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={onApply} disabled={loading} type="button">
                Apply
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-6">
              <Label className="text-xs text-gray-600">Search workcenter</Label>
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
                  <Gauge className="h-4 w-4 text-gray-700" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Average OEE</div>
                  <div className="text-sm font-semibold text-gray-900">{fmtPct(summary?.avgOEE)}</div>
                </div>
              </div>

              <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", oeeStat.tone)}>
                {oeeStat.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard
          title="Availability"
          value={fmtPct(summary?.avgAvailability)}
          sub="Run time vs planned time"
          icon={Timer}
        />
        <MetricCard
          title="Performance"
          value={fmtPct(summary?.avgPerformance)}
          sub="Ideal speed vs actual"
          icon={Activity}
        />
        <MetricCard
          title="Quality"
          value={fmtPct(summary?.avgQuality)}
          sub="Good count vs total"
          icon={CheckCircle2}
        />
        <MetricCard
          title="OEE"
          value={fmtPct(summary?.avgOEE)}
          sub={`${summary?.plant || "—"} • ${summary?.workcenter || "—"}`}
          icon={Gauge}
        />
        <MetricCard
          title="Scrap Rate"
          value={summary?.scrapRate !== undefined ? `${Number(summary.scrapRate).toFixed(1)}%` : "-"}
          sub="Rejects / total"
          icon={AlertTriangle}
        />
      </div>

      {/* Component bars */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">OEE Components</CardTitle>
          <CardDescription className="text-xs">
            Improve OEE by fixing the weakest component first (availability, performance, or quality).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          <ProgressRow label="Availability" value={summary?.avgAvailability ?? 0} />
          <ProgressRow label="Performance" value={summary?.avgPerformance ?? 0} />
          <ProgressRow label="Quality" value={summary?.avgQuality ?? 0} />
          <ProgressRow label="OEE" value={summary?.avgOEE ?? 0} />
        </CardContent>
      </Card>

      {/* Workcenter detail cards */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">Workcenter Daily OEE</CardTitle>
              <CardDescription className="text-xs">
                Per-day breakdown for each selected workcenter (planned, run, downtime, counts & OEE).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Factory className="h-4 w-4" />
              <span>{filteredRows.length} workcenter(s)</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-600">No workcenters found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredRows.map((r) => {
                const all = r.daily || [];
                const avg = (k) => (all.length ? Math.round(all.reduce((s, d) => s + Number(d[k] || 0), 0) / all.length) : 0);

                const a = avg("availability");
                const p = avg("performance");
                const qy = avg("quality");
                const o = avg("oee");
                const stat = oeeStatus(o);

                const weak = (() => {
                  const m = [
                    { k: "Availability", v: a },
                    { k: "Performance", v: p },
                    { k: "Quality", v: qy },
                  ].sort((x, y) => x.v - y.v);
                  return m[0];
                })();

                return (
                  <div key={r.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{r.name}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.id} • {r.plant}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", stat.tone)}>
                            {stat.label}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Weakest: {weak.k} ({fmtPct(weak.v)})
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500">Avg OEE</div>
                        <div className="text-2xl font-bold text-gray-900">{fmtPct(o)}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Availability</div>
                        <div className="mt-1 font-semibold text-gray-900">{fmtPct(a)}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Performance</div>
                        <div className="mt-1 font-semibold text-gray-900">{fmtPct(p)}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Quality</div>
                        <div className="mt-1 font-semibold text-gray-900">{fmtPct(qy)}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Scrap (avg)</div>
                        <div className="mt-1 font-semibold text-gray-900">
                          {(() => {
                            const total = all.reduce((s, d) => s + Number(d.totalCount || 0), 0);
                            const rej = all.reduce((s, d) => s + Number(d.rejectCount || 0), 0);
                            return total ? `${((rej / total) * 100).toFixed(1)}%` : "-";
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-[760px] w-full border-separate border-spacing-0">
                        <thead>
                          <tr className="text-left text-xs text-gray-500">
                            <th className="border-b px-2 py-2">Date</th>
                            <th className="border-b px-2 py-2">Planned</th>
                            <th className="border-b px-2 py-2">Run</th>
                            <th className="border-b px-2 py-2">Down</th>
                            <th className="border-b px-2 py-2">Total</th>
                            <th className="border-b px-2 py-2">Good</th>
                            <th className="border-b px-2 py-2">Reject</th>
                            <th className="border-b px-2 py-2">A</th>
                            <th className="border-b px-2 py-2">P</th>
                            <th className="border-b px-2 py-2">Q</th>
                            <th className="border-b px-2 py-2">OEE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {all.map((d) => (
                            <tr key={`${r.id}-${d.date}`} className="text-xs">
                              <td className="border-b px-2 py-2 text-gray-800">{d.date}</td>
                              <td className="border-b px-2 py-2">{fmtMin(d.plannedMin)}</td>
                              <td className="border-b px-2 py-2">{fmtMin(d.runMin)}</td>
                              <td className="border-b px-2 py-2">{fmtMin(d.downMin)}</td>
                              <td className="border-b px-2 py-2">{fmtNum(d.totalCount)}</td>
                              <td className="border-b px-2 py-2">{fmtNum(d.goodCount)}</td>
                              <td className="border-b px-2 py-2">{fmtNum(d.rejectCount)}</td>
                              <td className="border-b px-2 py-2">{fmtPct(d.availability)}</td>
                              <td className="border-b px-2 py-2">{fmtPct(d.performance)}</td>
                              <td className="border-b px-2 py-2">{fmtPct(d.quality)}</td>
                              <td className="border-b px-2 py-2 font-semibold text-gray-900">{fmtPct(d.oee)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 rounded-xl border bg-gray-50 p-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">
                          <Wrench className="h-4 w-4 text-gray-700" />
                        </div>
                        <div className="text-xs text-gray-600">
                          <div className="font-semibold text-gray-900">Improvement hint</div>
                          {weak.k === "Availability" ? (
                            <p className="mt-1">
                              Reduce unplanned downtime: track top stoppage reasons (breakdowns, changeovers, utilities),
                              improve PM schedules, and ensure spares readiness.
                            </p>
                          ) : weak.k === "Performance" ? (
                            <p className="mt-1">
                              Reduce speed loss: optimize programs/feeds, reduce micro-stops, standardize setup, and
                              balance upstream release to avoid starving/blocking.
                            </p>
                          ) : (
                            <p className="mt-1">
                              Reduce defects: tighten process parameters, improve inspection feedback loop (AOI → rework),
                              control chemistry, and validate tooling wear.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes / glossary */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">How to read OEE</CardTitle>
          <CardDescription className="text-xs">Practical interpretation for PCB manufacturing.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p className="text-sm">
            <span className="font-semibold">Availability</span> drops due to breakdowns, long changeovers, power/air/water
            issues, or missing manpower. Track downtime categories and MTBF/MTTR.
          </p>
          <p className="text-sm">
            <span className="font-semibold">Performance</span> drops due to reduced speed, micro-stops, tool wear,
            frequent program switching, and line imbalance. Standardize setups and stabilize release.
          </p>
          <p className="text-sm">
            <span className="font-semibold">Quality</span> drops due to scrap/rework: drill smear, plating voids, etch
            under/over, misregistration, AOI false calls, etc. Close the loop with SPC and CAPA.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
