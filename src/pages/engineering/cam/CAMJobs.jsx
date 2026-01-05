// src/pages/engineering/cam/CAMJobs.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  CircleDot,
  Filter,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Tag,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import camJobsApi from "@/services/camJobs.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return v;
  }
}

function normalizeList(resData) {
  const arr = resData?.items ?? resData?.data ?? resData ?? [];
  return Array.isArray(arr) ? arr : [];
}

const STATUS_STYLE = {
  Pending: "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-50 text-blue-700",
  "Ready for DFM": "bg-amber-50 text-amber-700",
  Released: "bg-emerald-50 text-emerald-700",
  Blocked: "bg-red-50 text-red-700",
};

const PRIORITY_STYLE = {
  Low: "bg-gray-100 text-gray-700",
  Normal: "bg-[#dc2551]/10 text-[#dc2551]",
  High: "bg-amber-50 text-amber-700",
  Urgent: "bg-red-50 text-red-700",
};

function StatusBadge({ status }) {
  const s = status || "Pending";
  return <Badge className={cx("rounded-full", STATUS_STYLE[s] || "bg-gray-100 text-gray-700")}>{s}</Badge>;
}

function PriorityBadge({ priority }) {
  const p = priority || "Normal";
  return <Badge className={cx("rounded-full", PRIORITY_STYLE[p] || PRIORITY_STYLE.Normal)}>{p}</Badge>;
}

export default function CAMJobs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);

  // filters (URL-backed)
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [priority, setPriority] = useState(searchParams.get("priority") || "all");
  const [layerBand, setLayerBand] = useState(searchParams.get("layers") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // UI
  const [showFilters, setShowFilters] = useState(true);

  const syncUrl = (next = {}) => {
    const p = new URLSearchParams(searchParams);
    const setOrDel = (k, v) => {
      if (v == null || v === "" || v === "all") p.delete(k);
      else p.set(k, String(v));
    };
    setOrDel("q", next.q ?? q);
    setOrDel("status", next.status ?? status);
    setOrDel("priority", next.priority ?? priority);
    setOrDel("layers", next.layers ?? layerBand);
    setOrDel("sort", next.sort ?? sort);
    setSearchParams(p, { replace: true });
  };

  const fetchList = async (mode = "load") => {
    mode === "refresh" ? setRefreshing(true) : setLoading(true);
    try {
      const params = {
        q: q || undefined,
        status: status !== "all" ? status : undefined,
        priority: priority !== "all" ? priority : undefined,
        layers: layerBand !== "all" ? layerBand : undefined,
        sort: sort || undefined,
      };
      const res = await camJobsApi.list(params);
      setRows(normalizeList(res?.data));
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load CAM jobs.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      mode === "refresh" ? setRefreshing(false) : setLoading(false);
    }
  };

  // initial load + whenever URL params change (back/forward)
  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setStatus(searchParams.get("status") || "all");
    setPriority(searchParams.get("priority") || "all");
    setLayerBand(searchParams.get("layers") || "all");
    setSort(searchParams.get("sort") || "newest");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // fetch on filters change
  useEffect(() => {
    fetchList("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, priority, layerBand, sort]);

  const filteredSorted = useMemo(() => {
    let data = [...rows];

    // frontend fallback filtering (if backend doesn't filter)
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      data = data.filter((r) => {
        const camNo = (r.cam_no ?? r.camNo ?? r.number ?? "").toString().toLowerCase();
        const board = (r.board_name ?? r.boardName ?? "").toString().toLowerCase();
        const rfq = (r.rfq_no ?? r.rfqNo ?? "").toString().toLowerCase();
        const so = (r.sales_order_no ?? r.soNo ?? "").toString().toLowerCase();
        const cust = (r.customer?.name ?? r.customer_name ?? "").toString().toLowerCase();
        return camNo.includes(s) || board.includes(s) || rfq.includes(s) || so.includes(s) || cust.includes(s);
      });
    }
    if (status !== "all") data = data.filter((r) => (r.status ?? "Pending") === status);
    if (priority !== "all") data = data.filter((r) => (r.priority ?? "Normal") === priority);

    if (layerBand !== "all") {
      const layers = (r) => Number(r.layers ?? r.layer_count ?? 0);
      if (layerBand === "1-2") data = data.filter((r) => layers(r) >= 1 && layers(r) <= 2);
      if (layerBand === "4") data = data.filter((r) => layers(r) === 4);
      if (layerBand === "6-8") data = data.filter((r) => layers(r) >= 6 && layers(r) <= 8);
      if (layerBand === "10+") data = data.filter((r) => layers(r) >= 10);
    }

    // sort fallback
    const dt = (r) => new Date(r.created_at ?? r.createdAt ?? 0).getTime() || 0;
    const due = (r) => new Date(r.due_date ?? r.dueDate ?? 0).getTime() || 0;

    if (sort === "newest") data.sort((a, b) => dt(b) - dt(a));
    if (sort === "oldest") data.sort((a, b) => dt(a) - dt(b));
    if (sort === "due_soon") data.sort((a, b) => due(a) - due(b));
    if (sort === "priority") {
      const rank = { Urgent: 4, High: 3, Normal: 2, Low: 1 };
      data.sort((a, b) => (rank[b.priority ?? "Normal"] ?? 2) - (rank[a.priority ?? "Normal"] ?? 2));
    }

    return data;
  }, [rows, q, status, priority, layerBand, sort]);

  const stats = useMemo(() => {
    const s = { total: filteredSorted.length, pending: 0, inProgress: 0, ready: 0, released: 0, blocked: 0 };
    filteredSorted.forEach((r) => {
      const st = r.status ?? "Pending";
      if (st === "Pending") s.pending += 1;
      else if (st === "In Progress") s.inProgress += 1;
      else if (st === "Ready for DFM") s.ready += 1;
      else if (st === "Released") s.released += 1;
      else if (st === "Blocked") s.blocked += 1;
    });
    return s;
  }, [filteredSorted]);

  const openDetails = (row) => {
    const jobId = row.id ?? row._id ?? row.cam_job_id;
    if (!jobId) return;
    navigate(`/engineering/cam/${jobId}`);
  };

  const apply = () => {
    syncUrl({ q, status, priority, layers: layerBand, sort });
    // fetchList triggered by state changes
  };

  const reset = () => {
    setQ("");
    setStatus("all");
    setPriority("all");
    setLayerBand("all");
    setSort("newest");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border bg-white p-10">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading CAM jobs…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CAM Jobs</h1>
          <p className="text-sm text-gray-500">
            Manage PCB CAM preparation: input files → checks → outputs → release to DFM/production.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fetchList("refresh")}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/engineering/cam/create">
              <Plus className="h-4 w-4" />
              New CAM Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">In Progress</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Ready for DFM</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.ready}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Released</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.released}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Blocked</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.blocked}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#dc2551]" />
                  Filters
                </CardTitle>
                <CardDescription>Search by CAM No, board, customer, RFQ, sales order</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={reset}>
                  Reset
                </Button>
                <Button className="bg-[#dc2551] hover:bg-[#b02045]" onClick={apply}>
                  Apply
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="CAM-0001, Customer, RFQ-..., SO-..., Board name..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Ready for DFM">Ready for DFM</option>
                  <option value="Released">Released</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Layers</Label>
                <select
                  value={layerBand}
                  onChange={(e) => setLayerBand(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="1-2">1–2 Layers</option>
                  <option value="4">4 Layers</option>
                  <option value="6-8">6–8 Layers</option>
                  <option value="10+">10+ Layers</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Sort</Label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="due_soon">Due Soon</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Tip: Filters work even if backend doesn’t support them—frontend fallback is enabled.
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jobs</CardTitle>
          <CardDescription>Click a row to open details</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSorted.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gray-100">
                <ShieldAlert className="h-6 w-6 text-gray-600" />
              </div>
              <p className="font-semibold text-gray-900">No CAM jobs found</p>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or create a new CAM job.</p>
              <div className="mt-4 flex justify-center">
                <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
                  <Link to="/engineering/cam/create">
                    <Plus className="h-4 w-4" />
                    New CAM Job
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSorted.map((r, idx) => {
                const id = r.id ?? r._id ?? r.cam_job_id ?? idx;
                const camNo = r.cam_no ?? r.camNo ?? r.number ?? "—";
                const board = r.board_name ?? r.boardName ?? "PCB Job";
                const customer = r.customer?.name ?? r.customer_name ?? "—";
                const rfq = r.rfq_no ?? r.rfqNo ?? "—";
                const so = r.sales_order_no ?? r.soNo ?? "—";
                const layers = Number(r.layers ?? r.layer_count ?? 0) || 0;
                const rev = r.revision ?? r.rev ?? "A";
                const due = r.due_date ?? r.dueDate ?? "";
                const statusVal = r.status ?? "Pending";
                const prio = r.priority ?? "Normal";

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.2) }}
                    onClick={() => openDetails(r)}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer px-4 py-4 hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {camNo} <span className="font-medium text-gray-500">—</span>{" "}
                            <span className="font-semibold">{board}</span>
                          </p>
                          <StatusBadge status={statusVal} />
                          <PriorityBadge priority={prio} />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <Tag className="h-3.5 w-3.5" /> Rev {rev}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <Layers className="h-3.5 w-3.5" /> {layers ? `${layers} Layers` : "—"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <Calendar className="h-3.5 w-3.5" /> Due {fmtDate(due)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <CircleDot className="h-3.5 w-3.5" /> Customer: {customer}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="rounded-full border bg-white px-2 py-1">
                          RFQ: <span className="font-semibold text-gray-900">{rfq}</span>
                        </span>
                        <span className="rounded-full border bg-white px-2 py-1">
                          SO: <span className="font-semibold text-gray-900">{so}</span>
                        </span>
                        <Button
                          variant="outline"
                          className="ml-auto gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(r);
                          }}
                        >
                          <BadgeCheck className="h-4 w-4 text-[#dc2551]" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-gray-500">
        PCB CAM flow: <span className="font-medium text-gray-700">Inputs</span> →{" "}
        <span className="font-medium text-gray-700">Checkpoints</span> →{" "}
        <span className="font-medium text-gray-700">Panelization</span> →{" "}
        <span className="font-medium text-gray-700">Outputs</span> →{" "}
        <span className="font-medium text-gray-700">Release</span>
      </div>
    </div>
  );
}
