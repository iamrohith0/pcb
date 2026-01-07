// src/pages/production/work-orders/WorkOrdersList.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Filter,
    Hash,
    Layers,
    Package,
    PauseCircle,
    PlayCircle,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Timer,
    X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function minutesUntil(d) {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / 60000);
}

function durationLabel(mins) {
  const m = Math.abs(mins);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const base = h > 0 ? `${h}h ${mm}m` : `${mm}m`;
  return mins < 0 ? `Overdue ${base}` : `Due in ${base}`;
}

function StatusPill({ status }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold";
  if (status === "In Progress")
    return (
      <span className={cx(base, "bg-blue-50 text-blue-700")}>
        <PlayCircle className="h-4 w-4" /> In Progress
      </span>
    );
  if (status === "Completed")
    return (
      <span className={cx(base, "bg-emerald-50 text-emerald-700")}>
        <CheckCircle2 className="h-4 w-4" /> Completed
      </span>
    );
  if (status === "On Hold")
    return (
      <span className={cx(base, "bg-amber-50 text-amber-700")}>
        <PauseCircle className="h-4 w-4" /> On Hold
      </span>
    );
  if (status === "Cancelled")
    return (
      <span className={cx(base, "bg-red-50 text-red-700")}>
        <AlertTriangle className="h-4 w-4" /> Cancelled
      </span>
    );
  return (
    <span className={cx(base, "bg-gray-100 text-gray-700")}>
      <Timer className="h-4 w-4" /> Planned
    </span>
  );
}

function PriorityPill({ priority }) {
  const base = "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold";
  if (priority === "Critical") return <span className={cx(base, "bg-red-50 text-red-700")}>Critical</span>;
  if (priority === "High") return <span className={cx(base, "bg-amber-50 text-amber-700")}>High</span>;
  return <span className={cx(base, "bg-gray-100 text-gray-700")}>Normal</span>;
}

function Kpi({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gray-50 text-gray-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-40 rounded bg-gray-100" />
          <div className="mt-2 h-3 w-72 rounded bg-gray-100" />
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-gray-100" />
            <div className="h-6 w-24 rounded-full bg-gray-100" />
            <div className="h-6 w-16 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="h-9 w-24 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * PCBxpress – Work Orders List
 * Hook backend later:
 * - GET /production/work-orders?search=&status=&priority=&plant=&layers=&due=...
 * - GET /production/work-orders/kpis
 */
export default function WorkOrdersList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [plant, setPlant] = useState("All");
  const [layers, setLayers] = useState("All");
  const [due, setDue] = useState("All"); // All | Today | This Week | Overdue

  const plants = ["All", "Main Plant", "Unit-2"];
  const statuses = ["All", "Planned", "In Progress", "On Hold", "Completed", "Cancelled"];
  const priorities = ["All", "Normal", "High", "Critical"];
  const layerOptions = ["All", "1", "2", "4", "6", "8"];
  const dueOptions = ["All", "Today", "This Week", "Overdue"];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Hook API call here
        await new Promise((r) => setTimeout(r, 550));

        const demo = [
          {
            id: "WO-24046",
            customer: "Raven Systems",
            partNo: "RVN-MCU-BASE",
            rev: "R3",
            layers: 4,
            qty: 110,
            finish: "ENIG",
            status: "On Hold",
            priority: "Critical",
            plant: "Main Plant",
            currentStage: "E-Test",
            dueDate: "2026-01-08T17:30:00",
          },
          {
            id: "WO-24047",
            customer: "Kite Robotics",
            partNo: "KR-PWR-CTRL",
            rev: "A2",
            layers: 2,
            qty: 300,
            finish: "HASL",
            status: "In Progress",
            priority: "High",
            plant: "Main Plant",
            currentStage: "Solder Mask",
            dueDate: "2026-01-07T18:00:00",
          },
          {
            id: "WO-24048",
            customer: "Nova Labs",
            partNo: "NV-SENSOR-IO",
            rev: "B1",
            layers: 6,
            qty: 60,
            finish: "ENIG",
            status: "Planned",
            priority: "Normal",
            plant: "Unit-2",
            currentStage: "Planning",
            dueDate: "2026-01-10T12:00:00",
          },
          {
            id: "WO-24041",
            customer: "Aster Controls",
            partNo: "AST-FLIGHT-IO",
            rev: "R1",
            layers: 4,
            qty: 200,
            finish: "ENIG",
            status: "Completed",
            priority: "Normal",
            plant: "Main Plant",
            currentStage: "Final QC",
            dueDate: "2026-01-03T12:00:00",
          },
        ];

        setRows(demo);
      } catch {
        toast({ title: "Load failed", description: "Could not load work orders.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return rows.filter((r) => {
      if (term) {
        const blob = `${r.id} ${r.customer} ${r.partNo} ${r.rev} ${r.finish} ${r.currentStage} ${r.plant}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }

      if (status !== "All" && r.status !== status) return false;
      if (priority !== "All" && r.priority !== priority) return false;
      if (plant !== "All" && r.plant !== plant) return false;
      if (layers !== "All" && String(r.layers) !== String(layers)) return false;

      if (due !== "All") {
        const dueDt = new Date(r.dueDate);
        if (due === "Today") {
          const end = new Date(startOfToday);
          end.setDate(end.getDate() + 1);
          if (!(dueDt >= startOfToday && dueDt < end)) return false;
        } else if (due === "This Week") {
          if (!(dueDt >= startOfToday && dueDt < endOfWeek)) return false;
        } else if (due === "Overdue") {
          if (!(dueDt.getTime() < Date.now() && r.status !== "Completed" && r.status !== "Cancelled")) return false;
        }
      }

      return true;
    });
  }, [rows, q, status, priority, plant, layers, due]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const inProgress = rows.filter((r) => r.status === "In Progress").length;
    const holds = rows.filter((r) => r.status === "On Hold").length;
    const overdue = rows.filter((r) => {
      const mins = minutesUntil(r.dueDate);
      return mins != null && mins < 0 && r.status !== "Completed" && r.status !== "Cancelled";
    }).length;

    return { total, inProgress, holds, overdue };
  }, [rows]);

  const clearFilters = () => {
    setQ("");
    setStatus("All");
    setPriority("All");
    setPlant("All");
    setLayers("All");
    setDue("All");
  };

  const hasFilters =
    q.trim() ||
    status !== "All" ||
    priority !== "All" ||
    plant !== "All" ||
    layers !== "All" ||
    due !== "All";

  const refresh = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      toast({ title: "Refreshed", description: "Work orders list updated." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">Work Orders</h1>
          <p className="mt-1 text-sm text-gray-600">Track PCB builds across routing, WIP, holds, and delivery timelines.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={refresh} className="gap-2" disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            className="bg-cyan-600 hover:bg-cyan-500 gap-2"
            onClick={() => navigate("/dashboard/production/work-orders/create")}
          >
            + New Work Order
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Hash} label="Total WOs" value={kpis.total} hint="All statuses" />
        <Kpi icon={PlayCircle} label="In Progress" value={kpis.inProgress} hint="Active on shopfloor" />
        <Kpi icon={PauseCircle} label="On Hold" value={kpis.holds} hint="Needs action" />
        <Kpi icon={AlertTriangle} label="Overdue" value={kpis.overdue} hint="Past due date" />
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                Filters
              </CardTitle>
              <CardDescription>Search by WO, customer, part number, stage, and plant.</CardDescription>
            </div>

            {hasFilters ? (
              <Button variant="outline" className="gap-2" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Label>Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="WO-24046, customer, part number..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <Label>Status</Label>
              <select
                className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <Label>Priority</Label>
              <select
                className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <Label>Plant</Label>
              <select
                className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
              >
                {plants.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <Label>Layers</Label>
              <select
                className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm"
                value={layers}
                onChange={(e) => setLayers(e.target.value)}
              >
                {layerOptions.map((l) => (
                  <option key={l} value={l}>
                    {l === "All" ? "All" : `${l}L`}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <Label>Due</Label>
              <select
                className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              >
                {dueOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of{" "}
            <span className="font-semibold text-gray-800">{rows.length}</span> work orders.
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : filtered.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gray-50 text-gray-700">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">No work orders found</p>
                  <p className="mt-1 text-sm text-gray-600">Try clearing filters or searching with a different keyword.</p>
                  {hasFilters ? (
                    <Button variant="outline" className="mt-3 gap-2" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filtered.map((r) => {
            const mins = minutesUntil(r.dueDate);
            const dueText = mins == null ? "—" : durationLabel(mins);
            const dueDanger = mins != null && mins < 0 && r.status !== "Completed" && r.status !== "Cancelled";

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{r.id}</p>
                          <StatusPill status={r.status} />
                          <PriorityPill priority={r.priority} />
                          <Badge variant="secondary">{r.plant}</Badge>
                          <Badge variant="secondary">{r.currentStage}</Badge>
                        </div>

                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-semibold">{r.customer}</span> • {r.partNo} • Rev {r.rev}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1">
                            <Layers className="h-4 w-4" />
                            {r.layers}L
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1">
                            <Package className="h-4 w-4" />
                            {r.qty} boards
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1">
                            <BadgeCheck className="h-4 w-4" />
                            {r.finish}
                          </span>
                          <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-1", dueDanger ? "bg-red-50 text-red-700" : "bg-gray-50")}>
                            <Calendar className="h-4 w-4" />
                            {formatDate(r.dueDate)} • {dueText}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/production/work-orders/${r.id}`)}
                        >
                          View
                          <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                          className="bg-cyan-600 hover:bg-cyan-500 gap-2"
                          onClick={() =>
                            toast({
                              title: "Quick action",
                              description: "Hook: start/hold/release from list (optional).",
                            })
                          }
                        >
                          Action
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
