// src/pages/warehouse/picking/PickWave.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Box,
    ClipboardList,
    Filter,
    Hash,
    Layers,
    MapPin,
    PackageCheck,
    PackageSearch,
    RefreshCw,
    Route,
    Search,
    Truck,
    Users,
    Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * PickWave.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/picking/PickWave.jsx
 *
 * Purpose:
 * - Create a "Pick Wave": group multiple pick tasks (for shipments/work orders) into one wave.
 * - Optimize picking by zone/aisle/location, priority, customer, dispatch date.
 *
 * Replace mocks with API:
 * - pickWaveService.suggest({ q, zone, priority, due })
 * - pickWaveService.create({ name, strategy, items })
 * - pickWaveService.release(waveId) / pickWaveService.print(waveId)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PRIORITY = {
  low: "LOW",
  normal: "NORMAL",
  high: "HIGH",
  urgent: "URGENT",
};

const priorityBadge = (p) => {
  if (p === "urgent") return "bg-[#dc2551]/10 text-[#dc2551]";
  if (p === "high") return "bg-amber-100 text-amber-800";
  if (p === "normal") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-700";
};

const STATUS = {
  ready: "READY",
  partial: "PARTIAL",
  blocked: "BLOCKED",
};

const statusBadge = (s) => {
  if (s === "blocked") return "bg-red-100 text-red-800";
  if (s === "partial") return "bg-amber-100 text-amber-800";
  return "bg-green-100 text-green-800";
};

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gray-50">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-lg font-extrabold text-gray-900">{value}</p>
        {hint ? <p className="text-[11px] text-gray-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export default function PickWave() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");

  // create wave fields
  const [waveName, setWaveName] = useState(`Wave-${new Date().toISOString().slice(0, 10)}`);
  const [strategy, setStrategy] = useState("zone_then_aisle"); // zone_then_aisle | customer | fifo
  const [pickerCount, setPickerCount] = useState(2);

  // MOCK candidate pick tasks
  const [tasks, setTasks] = useState(() => [
    {
      id: "PICK-2026-00118",
      kind: "Shipment",
      ref: "SHP-2026-00201",
      customer: "Nova Circuits",
      due: "Today",
      zone: "WH1-A",
      priority: "high",
      status: "ready",
      lines: 12,
      units: 84,
      est_minutes: 28,
    },
    {
      id: "PICK-2026-00119",
      kind: "Shipment",
      ref: "SHP-2026-00203",
      customer: "Kite Embedded Labs",
      due: "Tomorrow",
      zone: "WH1-CHEM",
      priority: "urgent",
      status: "blocked",
      lines: 6,
      units: 10,
      est_minutes: 15,
    },
    {
      id: "PICK-2026-00120",
      kind: "Work Order",
      ref: "WO-2026-00411",
      customer: "Internal",
      due: "Today",
      zone: "WH1-B",
      priority: "normal",
      status: "partial",
      lines: 9,
      units: 41,
      est_minutes: 22,
    },
    {
      id: "PICK-2026-00121",
      kind: "Shipment",
      ref: "SHP-2026-00205",
      customer: "Zen PCB Works",
      due: "Today",
      zone: "WH1-A",
      priority: "normal",
      status: "ready",
      lines: 8,
      units: 33,
      est_minutes: 16,
    },
    {
      id: "PICK-2026-00122",
      kind: "Work Order",
      ref: "WO-2026-00418",
      customer: "Internal",
      due: "This Week",
      zone: "WH1-PKG",
      priority: "low",
      status: "ready",
      lines: 5,
      units: 120,
      est_minutes: 10,
    },
  ]);

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const stats = useMemo(() => {
    const total = tasks.length;
    const ready = tasks.filter((t) => t.status === "ready").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const selected = selectedIds.size;
    return { total, ready, blocked, selected };
  }, [tasks, selectedIds]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tasks
      .filter((t) => (zone === "all" ? true : t.zone === zone))
      .filter((t) => (priority === "all" ? true : t.priority === priority))
      .filter((t) => (status === "all" ? true : t.status === status))
      .filter((t) => {
        if (!query) return true;
        const hay = [t.id, t.kind, t.ref, t.customer, t.zone, t.due].join(" ").toLowerCase();
        return hay.includes(query);
      });
  }, [tasks, q, zone, priority, status]);

  const selectedTasks = useMemo(
    () => tasks.filter((t) => selectedIds.has(t.id)),
    [tasks, selectedIds]
  );

  const totals = useMemo(() => {
    const lines = selectedTasks.reduce((sum, t) => sum + t.lines, 0);
    const units = selectedTasks.reduce((sum, t) => sum + t.units, 0);
    const minutes = selectedTasks.reduce((sum, t) => sum + t.est_minutes, 0);
    const perPicker = pickerCount > 0 ? Math.ceil(minutes / pickerCount) : minutes;
    return { lines, units, minutes, perPicker };
  }, [selectedTasks, pickerCount]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const suggestWave = async () => {
    setLoading(true);
    try {
      // const { data } = await pickWaveService.suggest({ q, zone, priority, status })
      await new Promise((r) => setTimeout(r, 350));

      // simple mock "suggest": choose READY + high/urgent first
      const suggested = tasks
        .filter((t) => t.status !== "blocked")
        .sort((a, b) => {
          const score = (x) => (x.priority === "urgent" ? 3 : x.priority === "high" ? 2 : x.priority === "normal" ? 1 : 0);
          return score(b) - score(a);
        })
        .slice(0, 4)
        .map((t) => t.id);

      setSelectedIds(new Set(suggested));
      toast({ title: "Suggested wave", description: "Selected best candidates based on readiness & priority." });
    } catch (e) {
      toast({ title: "Failed", description: "Could not generate suggestion.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createWave = async () => {
    if (!waveName.trim()) {
      toast({ title: "Wave name required", description: "Please enter a wave name.", variant: "destructive" });
      return;
    }
    if (selectedTasks.length === 0) {
      toast({ title: "No tasks selected", description: "Select at least one pick task.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // const { data } = await pickWaveService.create({ name: waveName, strategy, pickerCount, tasks: selectedIds })
      await new Promise((r) => setTimeout(r, 450));

      const newWaveId = `WAVE-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      toast({ title: "Wave created", description: `${newWaveId} created with ${selectedTasks.length} tasks.` });

      // navigate to a wave details page if you create later
      // navigate(`/warehouse/picking/waves/${newWaveId}`);
      navigate("/warehouse/picking"); // safe default
    } catch (e) {
      toast({ title: "Failed", description: "Could not create wave.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      // await pickWaveService.listCandidates(...)
      await new Promise((r) => setTimeout(r, 300));
      toast({ title: "Refreshed", description: "Candidates updated." });
    } catch (e) {
      toast({ title: "Failed", description: "Could not refresh right now.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <Wand2 className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pick Wave</h1>
            <p className="text-sm text-gray-500">
              Group picks into a single optimized wave (PCB materials, chemicals, packing items).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Link to="/warehouse/packing">
            <Button variant="outline" className="gap-2">
              <Box className="h-4 w-4" />
              Packing
            </Button>
          </Link>

          <Button onClick={createWave} disabled={loading} className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <PackageCheck className="h-4 w-4" />
            Create Wave
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Candidates" value={stats.total} hint="Pick tasks available" />
        <StatCard icon={PackageSearch} label="Ready" value={stats.ready} hint="Can be picked now" />
        <StatCard icon={Truck} label="Blocked" value={stats.blocked} hint="Needs resolution" />
        <StatCard icon={Layers} label="Selected" value={stats.selected} hint="Tasks in this wave" />
      </div>

      {/* Wave Builder */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-base">Wave Builder</CardTitle>
          <CardDescription>Define wave name and distribution strategy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Label htmlFor="waveName">Wave Name</Label>
              <div className="relative mt-2">
                <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="waveName"
                  value={waveName}
                  onChange={(e) => setWaveName(e.target.value)}
                  placeholder="Wave-YYYY-MM-DD"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="lg:col-span-4">
              <Label htmlFor="strategy">Strategy</Label>
              <div className="relative mt-2">
                <Route className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="strategy"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="zone_then_aisle">Zone → Aisle (fastest walking)</option>
                  <option value="customer">Customer grouped</option>
                  <option value="fifo">FIFO lots first</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-3">
              <Label htmlFor="pickers">Pickers</Label>
              <div className="relative mt-2">
                <Users className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="pickers"
                  type="number"
                  min={1}
                  value={pickerCount}
                  onChange={(e) => setPickerCount(Math.max(1, Number(e.target.value || 1)))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Lines</p>
              <p className="text-lg font-extrabold text-gray-900">{totals.lines}</p>
            </div>
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Units</p>
              <p className="text-lg font-extrabold text-gray-900">{totals.units}</p>
            </div>
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Est. Minutes</p>
              <p className="text-lg font-extrabold text-gray-900">{totals.minutes}</p>
            </div>
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Per Picker</p>
              <p className="text-lg font-extrabold text-gray-900">{totals.perPicker} min</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={suggestWave} disabled={loading} className="gap-2">
              <Wand2 className="h-4 w-4" />
              Suggest
            </Button>
            <Button variant="outline" onClick={selectAllFiltered} className="gap-2">
              <Layers className="h-4 w-4" />
              Select All (filtered)
            </Button>
            <Button variant="outline" onClick={clearSelection} className="gap-2">
              <Filter className="h-4 w-4" />
              Clear Selection
            </Button>
            <div className="text-xs text-gray-500">
              Selected <span className="font-semibold text-gray-900">{selectedTasks.length}</span> task(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-base">Candidate Pick Tasks</CardTitle>
          <CardDescription>Choose pick lists for shipments and work orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Label htmlFor="q">Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by pick id, ref (SHP/WO), customer, zone..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="zone">Zone</Label>
              <div className="relative mt-2">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="all">All</option>
                  <option value="WH1-A">WH1-A</option>
                  <option value="WH1-B">WH1-B</option>
                  <option value="WH1-CHEM">WH1-CHEM</option>
                  <option value="WH1-PKG">WH1-PKG</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="priority">Priority</Label>
              <div className="relative mt-2">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="all">All</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="status">Status</Label>
              <div className="relative mt-2">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="all">All</option>
                  <option value="ready">Ready</option>
                  <option value="partial">Partial</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-900">{filtered.length}</span> candidate(s)
          </div>

          {/* List */}
          <div className="grid grid-cols-1 gap-3">
            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
                    <PackageSearch className="h-5 w-5 text-gray-700" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">No candidates</p>
                  <p className="mt-1 text-sm text-gray-500">Try changing filters or search keywords.</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((t) => {
                const checked = selectedIds.has(t.id);
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    <div
                      className={cx(
                        "rounded-2xl border bg-white p-4 transition",
                        checked ? "ring-2 ring-[#dc2551]/20 border-[#dc2551]/30" : "hover:border-gray-300"
                      )}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggle(t.id)}
                              className={cx(
                                "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition",
                                checked
                                  ? "bg-[#dc2551] text-white"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              )}
                            >
                              {checked ? <PackageCheck className="h-4 w-4" /> : <PackageSearch className="h-4 w-4" />}
                              {checked ? "Selected" : "Select"}
                            </button>

                            <p className="text-sm font-extrabold text-gray-900">{t.id}</p>

                            <Badge className={cx("rounded-full", statusBadge(t.status))}>{STATUS[t.status]}</Badge>
                            <Badge className={cx("rounded-full", priorityBadge(t.priority))}>
                              {PRIORITY[t.priority]}
                            </Badge>
                            <Badge className="rounded-full bg-gray-100 text-gray-700">{t.kind}</Badge>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl bg-gray-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Reference</p>
                              <p className="font-semibold text-gray-900">{t.ref}</p>
                            </div>

                            <div className="rounded-xl bg-gray-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Customer</p>
                              <p className="font-semibold text-gray-900">{t.customer}</p>
                            </div>

                            <div className="rounded-xl bg-gray-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Zone</p>
                              <p className="font-semibold text-gray-900">{t.zone}</p>
                            </div>

                            <div className="rounded-xl bg-gray-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Due</p>
                              <p className="font-semibold text-gray-900">{t.due}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                              Lines: <span className="font-semibold text-gray-900">{t.lines}</span>
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                              Units: <span className="font-semibold text-gray-900">{t.units}</span>
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                              Est: <span className="font-semibold text-gray-900">{t.est_minutes} min</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <Button variant="outline" className="gap-2" asChild>
                            <Link to={`/warehouse/picking/list?pick=${encodeURIComponent(t.id)}`}>
                              View
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>

                          <Button
                            onClick={() => toggle(t.id)}
                            disabled={t.status === "blocked"}
                            className={cx(
                              "gap-2",
                              t.status === "blocked"
                                ? "bg-gray-200 text-gray-600 hover:bg-gray-200"
                                : "bg-cyan-600 hover:bg-cyan-500"
                            )}
                          >
                            {t.status === "blocked" ? "Blocked" : checked ? "Remove" : "Add"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
