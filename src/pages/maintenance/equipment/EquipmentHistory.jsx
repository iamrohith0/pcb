// src/pages/maintenance/equipment/EquipmentHistory.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Filter,
  History,
  Search,
  ShieldAlert,
  Timer,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

/**
 * EquipmentHistory.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/maintenance/equipment/EquipmentHistory.jsx
 *
 * What it shows:
 * - Unified equipment timeline (Breakdowns, Preventive Maintenance, Spares usage, Calibrations, Notes)
 * - Filters by date/type/search
 *
 * API integration points:
 * - Replace mock loaders with:
 *    equipmentService.getHistory(equipmentId, filters)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const EVENT_TYPES = [
  { key: "all", label: "All" },
  { key: "breakdown", label: "Breakdown" },
  { key: "pm", label: "Preventive Maintenance" },
  { key: "spares", label: "Spares Used" },
  { key: "calibration", label: "Calibration" },
  { key: "note", label: "Note" },
];

const TYPE_BADGE = {
  breakdown: "bg-red-100 text-red-700",
  pm: "bg-green-100 text-green-700",
  spares: "bg-blue-100 text-blue-700",
  calibration: "bg-purple-100 text-purple-700",
  note: "bg-gray-100 text-gray-700",
};

const SEVERITY_BADGE = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function formatDT(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysBetween(a, b) {
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  const ms = Math.abs(B - A);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function EventIcon({ type }) {
  const base = "h-4 w-4";
  if (type === "breakdown") return <ShieldAlert className={base} />;
  if (type === "pm") return <Wrench className={base} />;
  if (type === "spares") return <Activity className={base} />;
  if (type === "calibration") return <Timer className={base} />;
  return <History className={base} />;
}

function TimelineItem({ item }) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cx("grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset", "bg-white")}>
          <EventIcon type={item.type} />
        </div>
        <div className="mt-2 h-full w-px bg-gray-200" />
      </div>

      <div className="flex-1 pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-gray-900">{item.title}</span>
              <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", TYPE_BADGE[item.type] || "bg-gray-100 text-gray-700")}>
                {item.type_label}
              </span>
              {item.severity && (
                <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", SEVERITY_BADGE[item.severity] || "bg-gray-100 text-gray-700")}>
                  {item.severity.toUpperCase()}
                </span>
              )}
              {item.status && <Badge variant="outline">{item.status}</Badge>}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDT(item.at)}
              </span>
              {typeof item.downtime_min === "number" && (
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  Downtime: {item.downtime_min} min
                </span>
              )}
              {item.by && <span>By: {item.by}</span>}
              {item.reference && <span>Ref: {item.reference}</span>}
            </div>

            {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}

            {item.meta && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(item.meta).map(([k, v]) => (
                  <div key={k} className="rounded-xl border bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{k.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-sm text-gray-800">{String(v)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {item.action && (
            <div className="flex shrink-0 items-center gap-2">
              <Link to={item.action.to}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EquipmentHistory() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();

  const equipmentId = params?.id || "EQ-0001"; // supports /maintenance/equipment/:id/history

  // UI filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  // In real app, fetch equipment summary too (name/type/department)
  const equipmentSummary = useMemo(
    () => ({
      id: equipmentId,
      name: "CNC Drill 01",
      type: "CNC Drill",
      area: "Line A",
      location: "Bay 3",
      criticality: "high",
      assetTag: "ASSET-DRL-001",
    }),
    [equipmentId]
  );

  // Mock history dataset (replace with API)
  const allHistory = useMemo(() => {
    const now = new Date();
    const iso = (d) => d.toISOString();

    const d1 = new Date(now); d1.setDate(now.getDate() - 1); d1.setHours(9, 30, 0, 0);
    const d2 = new Date(now); d2.setDate(now.getDate() - 3); d2.setHours(15, 10, 0, 0);
    const d3 = new Date(now); d3.setDate(now.getDate() - 7); d3.setHours(11, 0, 0, 0);
    const d4 = new Date(now); d4.setDate(now.getDate() - 12); d4.setHours(10, 20, 0, 0);
    const d5 = new Date(now); d5.setDate(now.getDate() - 22); d5.setHours(14, 45, 0, 0);

    return [
      {
        id: "H-1005",
        type: "breakdown",
        type_label: "Breakdown",
        title: "Spindle vibration alarm",
        at: iso(d1),
        severity: "high",
        status: "Closed",
        by: "Maintenance - Arun",
        reference: "BD-00921",
        downtime_min: 85,
        description:
          "Vibration alarm triggered during drilling. Root cause: worn spindle bearing. Replaced bearing and recalibrated runout.",
        meta: {
          root_cause: "Worn spindle bearing",
          action_taken: "Bearing replacement + runout calibration",
          verified_by: "QA - Nisha",
        },
        action: { to: "/maintenance/breakdowns" },
      },
      {
        id: "H-1004",
        type: "spares",
        type_label: "Spares Used",
        title: "Issued: Spindle bearing set (2)",
        at: iso(d2),
        by: "Stores - Faisal",
        reference: "ISS-4412",
        description: "Issued spares for CNC Drill 01 breakdown ticket BD-00921.",
        meta: {
          item: "Spindle bearing set",
          qty: 2,
          lot: "LOT-BRG-118",
        },
      },
      {
        id: "H-1003",
        type: "pm",
        type_label: "Preventive Maintenance",
        title: "Monthly PM completed",
        at: iso(d3),
        by: "Maintenance - Arun",
        reference: "PM-00312",
        description:
          "Cleaned dust collection, checked chuck clamp pressure, lubricated guides, verified drill depth repeatability.",
        meta: {
          checklist: "PM-CNC-DRL-MONTHLY",
          next_due_in_days: 30,
        },
      },
      {
        id: "H-1002",
        type: "calibration",
        type_label: "Calibration",
        title: "Runout calibration verified",
        at: iso(d4),
        by: "QA - Nisha",
        reference: "CAL-0199",
        description: "Runout within spec after calibration. Logged verification for audit.",
        meta: {
          runout_um: 8,
          limit_um: 10,
          instrument: "Dial gauge",
        },
      },
      {
        id: "H-1001",
        type: "note",
        type_label: "Note",
        title: "Operator note: coolant filter clogging",
        at: iso(d5),
        by: "Operator - Rakesh",
        reference: "NOTE-221",
        description:
          "Coolant filter clogs faster during heavy drilling jobs. Suggest weekly check during peak lots.",
        meta: {
          suggestion: "Add weekly filter check",
        },
      },
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, []);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();

    return allHistory.filter((item) => {
      // type
      if (type !== "all" && item.type !== type) return false;

      // search
      if (qLower) {
        const hay = [
          item.title,
          item.type_label,
          item.description,
          item.reference,
          item.by,
          item.status,
          JSON.stringify(item.meta || {}),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!hay.includes(qLower)) return false;
      }

      // date range
      const t = new Date(item.at).getTime();
      if (from) {
        const f = new Date(from + "T00:00:00").getTime();
        if (t < f) return false;
      }
      if (to) {
        const tt = new Date(to + "T23:59:59").getTime();
        if (t > tt) return false;
      }

      return true;
    });
  }, [allHistory, q, type, from, to]);

  const stats = useMemo(() => {
    const breakdowns = allHistory.filter((x) => x.type === "breakdown");
    const pm = allHistory.filter((x) => x.type === "pm");
    const lastEvent = allHistory[0];

    const lastBreakdown = breakdowns[0];
    const daysSinceLastBreakdown = lastBreakdown ? daysBetween(new Date(), lastBreakdown.at) : null;

    const totalDowntimeMin = breakdowns.reduce((acc, x) => acc + (x.downtime_min || 0), 0);

    return {
      totalEvents: allHistory.length,
      breakdownCount: breakdowns.length,
      pmCount: pm.length,
      totalDowntimeMin,
      lastEventAt: lastEvent?.at || null,
      daysSinceLastBreakdown,
    };
  }, [allHistory]);

  const applyFilters = async () => {
    // For API mode: call fetchHistory(filters)
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 250));
      toast({ title: "Filters applied", description: "History updated." });
    } catch {
      toast({ title: "Failed", description: "Could not apply filters.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQ("");
    setType("all");
    setFrom("");
    setTo("");
    toast({ title: "Cleared", description: "Filters reset." });
  };

  return (
    <div className="space-y-6">
      {/* Title + Back */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <History className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Equipment History</h1>
            <p className="text-sm text-gray-500">
              Timeline for breakdowns, PM, spares usage and quality verifications.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Link to="/maintenance/equipment">
            <Button variant="outline" className="gap-2">
              <Wrench className="h-4 w-4" />
              Equipment List
            </Button>
          </Link>
        </div>
      </div>

      {/* Equipment summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{equipmentSummary.name}</CardTitle>
                <CardDescription className="mt-1">
                  {equipmentSummary.type} • {equipmentSummary.assetTag} • {equipmentSummary.area || "—"} •{" "}
                  {equipmentSummary.location || "—"}
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={cx(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    equipmentSummary.criticality === "critical"
                      ? "bg-red-100 text-red-700"
                      : equipmentSummary.criticality === "high"
                      ? "bg-orange-100 text-orange-700"
                      : equipmentSummary.criticality === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  Criticality: {equipmentSummary.criticality.toUpperCase()}
                </span>

                <Badge variant="outline">Equipment ID: {equipmentSummary.id}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total Events</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
            <div className="rounded-xl border bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Breakdowns</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{stats.breakdownCount}</p>
            </div>
            <div className="rounded-xl border bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">PM Records</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{stats.pmCount}</p>
            </div>
            <div className="rounded-xl border bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Downtime</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{stats.totalDowntimeMin} min</p>
              {typeof stats.daysSinceLastBreakdown === "number" && (
                <p className="mt-1 text-xs text-gray-500">Last breakdown: {stats.daysSinceLastBreakdown} day(s) ago</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <CardDescription>Search and narrow results for audits and troubleshooting.</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, ref, notes..."
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Activity className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
            </div>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:col-span-4">
              <Button
                type="button"
                onClick={applyFilters}
                className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                disabled={loading}
              >
                <FileSearch2Icon />
                {loading ? "Applying..." : "Apply"}
              </Button>
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear
              </Button>

              <div className="ml-auto text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filtered.length}</span> record(s)
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-base">Timeline</CardTitle>
            </div>
            <CardDescription>Most recent events first.</CardDescription>
          </CardHeader>

          <CardContent className="p-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border bg-white p-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
                  <ShieldAlert className="h-5 w-5 text-gray-500" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">No history found</p>
                <p className="mt-1 text-sm text-gray-500">Try changing filters or clearing the search.</p>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* First item should not draw tail line below; handled visually by last element spacing */}
                {filtered.map((item, idx) => (
                  <div key={item.id} className={cx(idx === filtered.length - 1 ? "[&>div>div>div:last-child]:hidden" : "")}>
                    <TimelineItem item={item} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/** Small inline icon component to avoid adding more lucide imports */
function FileSearch2Icon() {
  return <Search className="h-4 w-4" />;
}
