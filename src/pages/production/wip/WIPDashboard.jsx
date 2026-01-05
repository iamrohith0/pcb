// src/pages/production/wip/WIPDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Factory,
  Filter,
  Gauge,
  Layers,
  RefreshCw,
  Search,
  Timer,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

/**
 * PCBxpress – WIP Dashboard (UI scaffold)
 * - KPI tiles: total WIP, late risk, holds, average cycle time
 * - Process stage breakdown (lanes)
 * - WIP table with filters & search
 * - Alerts panel (bottlenecks / aged WIP)
 *
 * Hook to backend later:
 * - GET /production/wip/summary?plant=...&from=...&to=...
 * - GET /production/wip/list?plant=...&stage=...&status=...&q=...
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PLANTS = ["Main Plant", "Plant-2", "Proto Lab"];

const STAGES = [
  { key: "cam", label: "CAM Prep", icon: Layers },
  { key: "imaging", label: "Imaging", icon: Layers },
  { key: "etching", label: "Etching", icon: Factory },
  { key: "drilling", label: "Drilling", icon: Wrench },
  { key: "plating", label: "Plating", icon: Layers },
  { key: "soldermask", label: "Solder Mask", icon: Layers },
  { key: "aoi", label: "AOI", icon: Activity },
  { key: "etest", label: "E-Test", icon: Activity },
  { key: "final", label: "Final QC", icon: CheckCircle2 },
];

const STATUS = ["In Queue", "Processing", "On Hold", "Completed"];

const severityBadge = (sev) => {
  if (sev === "High") return <Badge className="bg-red-600 hover:bg-red-600">High</Badge>;
  if (sev === "Medium") return <Badge className="bg-amber-600 hover:bg-amber-600">Medium</Badge>;
  return <Badge variant="secondary">Low</Badge>;
};

const statusBadge = (s) => {
  if (s === "Completed") return <Badge className="bg-green-600 hover:bg-green-600">Completed</Badge>;
  if (s === "On Hold")
    return (
      <Badge className="bg-amber-600 hover:bg-amber-600">
        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
        On Hold
      </Badge>
    );
  if (s === "Processing") return <Badge className="bg-blue-600 hover:bg-blue-600">Processing</Badge>;
  return <Badge variant="secondary">In Queue</Badge>;
};

function StatCard({ icon: Icon, title, value, hint, trend }) {
  const trendUp = trend === "up";
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
              <Icon className="h-5 w-5" />
            </span>
            {trend ? (
              <span
                className={cx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
                  trendUp ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                {trendUp ? "Improving" : "Needs attention"}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StagePill({ stage, count, wipHours, isActive, onClick }) {
  const Icon = stage.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group w-full text-left rounded-2xl border p-3 transition",
        isActive ? "border-[#dc2551] bg-[#dc2551]/5" : "bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cx("grid h-8 w-8 place-items-center rounded-xl", isActive ? "bg-[#dc2551] text-white" : "bg-gray-100 text-gray-700")}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="truncate text-sm font-semibold text-gray-900">{stage.label}</p>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            WIP: <span className="font-semibold text-gray-800">{count}</span> jobs • Aged:{" "}
            <span className="font-semibold text-gray-800">{wipHours}h</span>
          </p>
        </div>
        <ChevronDown className={cx("mt-1 h-4 w-4 text-gray-400 transition", isActive ? "rotate-180 text-[#dc2551]" : "group-hover:text-gray-600")} />
      </div>
    </button>
  );
}

export default function WIPDashboard() {
  const { toast } = useToast();

  const [plant, setPlant] = useState("Main Plant");
  const [stage, setStage] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Demo WIP data (replace with API)
  const [wip, setWip] = useState(() => {
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000);

    return [
      {
        id: "WO-24019",
        workOrderNo: "WO-24019",
        customer: "Aster Robotics",
        partNo: "AST-RB-CTRL-02",
        plant: "Main Plant",
        stage: "imaging",
        stageLabel: "Imaging",
        status: "Processing",
        qty: 120,
        layers: 4,
        thicknessMm: 1.6,
        startTime: hoursAgo(18),
        dueDate: "2026-01-08",
        holdReason: "",
      },
      {
        id: "WO-24027",
        workOrderNo: "WO-24027",
        customer: "Nova Instruments",
        partNo: "NOVA-ADC-12",
        plant: "Main Plant",
        stage: "etching",
        stageLabel: "Etching",
        status: "In Queue",
        qty: 500,
        layers: 2,
        thicknessMm: 1.2,
        startTime: hoursAgo(10),
        dueDate: "2026-01-07",
        holdReason: "",
      },
      {
        id: "WO-24031",
        workOrderNo: "WO-24031",
        customer: "Kite Mobility",
        partNo: "KITE-PWR-REV3",
        plant: "Plant-2",
        stage: "drilling",
        stageLabel: "Drilling",
        status: "Processing",
        qty: 80,
        layers: 6,
        thicknessMm: 1.8,
        startTime: hoursAgo(26),
        dueDate: "2026-01-07",
        holdReason: "",
      },
      {
        id: "WO-24033",
        workOrderNo: "WO-24033",
        customer: "Helio Tech",
        partNo: "HEL-IO-LOGIC",
        plant: "Main Plant",
        stage: "plating",
        stageLabel: "Plating",
        status: "On Hold",
        qty: 60,
        layers: 8,
        thicknessMm: 2.0,
        startTime: hoursAgo(54),
        dueDate: "2026-01-06",
        holdReason: "Copper thickness variation – re-check bath parameters",
      },
      {
        id: "WO-24036",
        workOrderNo: "WO-24036",
        customer: "Orion Labs",
        partNo: "ORION-SNS-01",
        plant: "Proto Lab",
        stage: "aoi",
        stageLabel: "AOI",
        status: "Processing",
        qty: 300,
        layers: 2,
        thicknessMm: 1.6,
        startTime: hoursAgo(7),
        dueDate: "2026-01-09",
        holdReason: "",
      },
      {
        id: "WO-24038",
        workOrderNo: "WO-24038",
        customer: "ZenDrive",
        partNo: "ZD-MOTOR-DRV",
        plant: "Main Plant",
        stage: "etest",
        stageLabel: "E-Test",
        status: "In Queue",
        qty: 150,
        layers: 4,
        thicknessMm: 1.6,
        startTime: hoursAgo(32),
        dueDate: "2026-01-08",
        holdReason: "",
      },
      {
        id: "WO-24041",
        workOrderNo: "WO-24041",
        customer: "ByteWave",
        partNo: "BW-SENSOR-FLEX",
        plant: "Main Plant",
        stage: "cam",
        stageLabel: "CAM Prep",
        status: "On Hold",
        qty: 40,
        layers: 2,
        thicknessMm: 0.8,
        startTime: hoursAgo(78),
        dueDate: "2026-01-06",
        holdReason: "Missing drill file in customer package",
      },
      {
        id: "WO-24044",
        workOrderNo: "WO-24044",
        customer: "SunPeak",
        partNo: "SP-POWER-2OZ",
        plant: "Main Plant",
        stage: "soldermask",
        stageLabel: "Solder Mask",
        status: "Processing",
        qty: 90,
        layers: 4,
        thicknessMm: 1.6,
        startTime: hoursAgo(14),
        dueDate: "2026-01-08",
        holdReason: "",
      },
      {
        id: "WO-24046",
        workOrderNo: "WO-24046",
        customer: "Raven Systems",
        partNo: "RVN-MCU-BASE",
        plant: "Main Plant",
        stage: "final",
        stageLabel: "Final QC",
        status: "Processing",
        qty: 110,
        layers: 2,
        thicknessMm: 1.6,
        startTime: hoursAgo(22),
        dueDate: "2026-01-07",
        holdReason: "",
      },
    ];
  });

  const refresh = async () => {
    setLoading(true);
    try {
      // Hook to API here
      await new Promise((r) => setTimeout(r, 500));
      toast({ title: "WIP refreshed", description: "Latest WIP snapshot loaded." });
    } catch (e) {
      toast({ title: "Refresh failed", description: "Could not load WIP data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return wip
      .filter((x) => x.plant === plant)
      .filter((x) => (stage === "all" ? true : x.stage === stage))
      .filter((x) => (status === "all" ? true : x.status === status))
      .filter((x) => {
        if (!qq) return true;
        return (
          x.workOrderNo.toLowerCase().includes(qq) ||
          x.customer.toLowerCase().includes(qq) ||
          x.partNo.toLowerCase().includes(qq) ||
          x.stageLabel.toLowerCase().includes(qq)
        );
      });
  }, [wip, plant, stage, status, q]);

  const now = Date.now();

  const enriched = useMemo(() => {
    return filtered.map((x) => {
      const ageHours = Math.max(0, Math.round((now - new Date(x.startTime).getTime()) / 3600000));
      const lateRisk = x.dueDate < new Date().toISOString().slice(0, 10) && x.status !== "Completed";
      return { ...x, ageHours, lateRisk };
    });
  }, [filtered, now]);

  const totals = useMemo(() => {
    const t = {
      total: enriched.length,
      holds: 0,
      lateRisk: 0,
      avgCycleHrs: 0,
      inProcess: 0,
    };

    let sumAge = 0;
    enriched.forEach((x) => {
      if (x.status === "On Hold") t.holds += 1;
      if (x.lateRisk) t.lateRisk += 1;
      if (x.status === "Processing") t.inProcess += 1;
      sumAge += x.ageHours;
    });

    t.avgCycleHrs = enriched.length ? Math.round(sumAge / enriched.length) : 0;
    return t;
  }, [enriched]);

  const stageStats = useMemo(() => {
    const map = new Map(STAGES.map((s) => [s.key, { count: 0, wipHours: 0 }]));
    enriched.forEach((x) => {
      const cur = map.get(x.stage) ?? { count: 0, wipHours: 0 };
      cur.count += 1;
      cur.wipHours += x.ageHours;
      map.set(x.stage, cur);
    });
    return map;
  }, [enriched]);

  const alerts = useMemo(() => {
    // Simple heuristics: aged > 48h OR holds
    const aged = enriched.filter((x) => x.ageHours >= 48).sort((a, b) => b.ageHours - a.ageHours);
    const holds = enriched.filter((x) => x.status === "On Hold");
    const list = [
      ...holds.map((x) => ({
        id: `HOLD-${x.id}`,
        title: `${x.workOrderNo} on hold`,
        desc: x.holdReason || "Hold reason not specified",
        sev: x.ageHours >= 48 ? "High" : "Medium",
      })),
      ...aged.slice(0, 4).map((x) => ({
        id: `AGED-${x.id}`,
        title: `${x.workOrderNo} aged WIP`,
        desc: `${x.stageLabel} • ${x.ageHours} hours in WIP`,
        sev: x.ageHours >= 72 ? "High" : "Medium",
      })),
    ];

    // de-dup by id
    const seen = new Set();
    return list.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true))).slice(0, 6);
  }, [enriched]);

  useEffect(() => {
    // If plant changes, reset stage filter to reduce confusion
    setStage("all");
  }, [plant]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production</p>
          <h1 className="text-xl font-bold text-gray-900">WIP Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time view of work-in-progress across PCB manufacturing stages (queue, processing, holds, aging).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast({ title: "Tip", description: "Later: add date range + shift filters." })}>
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            onClick={refresh}
            className="bg-[#dc2551] hover:bg-[#b02045] gap-2"
            disabled={loading}
          >
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard
          icon={Gauge}
          title="Total WIP"
          value={totals.total}
          hint="Jobs currently inside factory"
          trend={totals.total <= 8 ? "up" : "down"}
        />
        <StatCard
          icon={AlertTriangle}
          title="Holds"
          value={totals.holds}
          hint="Requires intervention / clarification"
          trend={totals.holds <= 1 ? "up" : "down"}
        />
        <StatCard
          icon={Timer}
          title="Avg WIP Age"
          value={`${totals.avgCycleHrs}h`}
          hint="Simple average (demo)"
          trend={totals.avgCycleHrs <= 24 ? "up" : "down"}
        />
        <StatCard
          icon={Activity}
          title="Late Risk"
          value={totals.lateRisk}
          hint="Past due-date threshold"
          trend={totals.lateRisk === 0 ? "up" : "down"}
        />
      </div>

      {/* Filters + Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Filters */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">WIP Filters</CardTitle>
            <CardDescription>Slice the WIP by plant, stage, status and job search.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <Label className="text-xs text-gray-500">Plant</Label>
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {PLANTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <Label className="text-xs text-gray-500">Stage</Label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="all">All stages</option>
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <Label className="text-xs text-gray-500">Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="all">All</option>
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-12">
                <Label className="text-xs text-gray-500">Search</Label>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="WO / Customer / Part / Stage"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Stage breakdown */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Stage Breakdown</p>
                <p className="text-xs text-gray-500">Click a stage to filter</p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {STAGES.map((s) => {
                  const st = stageStats.get(s.key) ?? { count: 0, wipHours: 0 };
                  const active = stage === s.key;
                  return (
                    <StagePill
                      key={s.key}
                      stage={s}
                      count={st.count}
                      wipHours={st.wipHours}
                      isActive={active}
                      onClick={() => setStage((cur) => (cur === s.key ? "all" : s.key))}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">WIP Alerts</CardTitle>
            <CardDescription>Aged WIP, holds and bottleneck signals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-gray-50 p-5 text-center">
                <p className="text-sm font-medium text-gray-700">No alerts</p>
                <p className="mt-1 text-xs text-gray-500">WIP looks healthy for this filter set.</p>
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="rounded-xl border bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{a.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{a.desc}</p>
                    </div>
                    {severityBadge(a.sev)}
                  </div>
                </div>
              ))
            )}

            <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">Tip</p>
              <p className="mt-1">
                Later: derive alerts from capacity constraints (machine uptime, shift load), and auto-create NCR/CAPA
                when holds exceed threshold.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WIP Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">WIP List</CardTitle>
              <CardDescription>{enriched.length} job(s) matching current filters.</CardDescription>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast({ title: "Export", description: "Hook to API: export WIP CSV/Excel." })}
            >
              <Filter className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">WO</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Part</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Stage</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Status</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Layers</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Thk (mm)</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Age</th>
                  <th className="sticky top-0 z-10 bg-white border-b px-3 py-2 text-xs font-semibold text-gray-500">Due</th>
                </tr>
              </thead>

              <tbody>
                {enriched.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10">
                      <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">No WIP found</p>
                        <p className="mt-1 text-xs text-gray-500">Try different filters or clear the search.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  enriched.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="border-b"
                    >
                      <td className="px-3 py-3 text-sm font-semibold text-gray-900">{row.workOrderNo}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{row.customer}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{row.partNo}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{row.stageLabel}</td>
                      <td className="px-3 py-3">{statusBadge(row.status)}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{row.qty}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{row.layers}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{row.thicknessMm}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cx(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                            row.ageHours >= 72
                              ? "bg-red-50 text-red-700"
                              : row.ageHours >= 48
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          )}
                        >
                          <Timer className="h-3.5 w-3.5" />
                          {row.ageHours}h
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cx("text-sm font-medium", row.lateRisk ? "text-red-600" : "text-gray-800")}>
                          {row.dueDate}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Hold details preview */}
          {enriched.some((x) => x.status === "On Hold") ? (
            <div className="mt-4 rounded-xl border bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold">Hold reasons</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900/90">
                    {enriched
                      .filter((x) => x.status === "On Hold")
                      .slice(0, 4)
                      .map((x) => (
                        <li key={x.id}>
                          <span className="font-semibold">{x.workOrderNo}</span>:{" "}
                          {x.holdReason || "No reason specified"}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
