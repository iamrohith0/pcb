// src/pages/quality/aoi/AOIQueue.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  ClipboardList,
  Cpu,
  Eye,
  Filter,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Timer,
  XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - AOI Queue
 *
 * Recommended Backend Endpoints:
 * - GET  /quality/aoi/queue?search=&status=&line=&priority=&page=&limit=
 * - POST /quality/aoi/queue/:id/hold           (optional)
 * - POST /quality/aoi/queue/:id/release        (optional)
 * - POST /quality/aoi/queue/:id/start          (optional)
 * - POST /quality/aoi/queue/:id/complete       (optional)
 *
 * Suggested fields per record:
 * - id, jobNo, workOrderNo, customer, partNo, revision, layerCount,
 *   line, machine, status (queued|running|hold|done),
 *   priority (low|normal|high|urgent),
 *   panels, boards, dueDate,
 *   createdAt, updatedAt,
 *   holdReason (if hold)
 */
export default function AOIQueue() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("queued"); // queued|running|hold|done|all
  const [line, setLine] = useState("all"); // all or line name
  const [priority, setPriority] = useState("all"); // all|low|normal|high|urgent

  // dialogs
  const [viewOpen, setViewOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [holdReason, setHoldReason] = useState("");

  const totalPages = useMemo(() => {
    const t = Number(meta?.total || 0);
    const l = Number(meta?.limit || 10);
    return Math.max(1, Math.ceil(t / l));
  }, [meta]);

  const normalizeList = (payload) => {
    const root = payload?.data ?? payload ?? {};
    const items = root.items ?? root.rows ?? root.data ?? (Array.isArray(root) ? root : []);
    const page = root.page ?? root.meta?.page ?? 1;
    const limit = root.limit ?? root.meta?.limit ?? 10;
    const total = root.total ?? root.meta?.total ?? items?.length ?? 0;
    return {
      items: Array.isArray(items) ? items : [],
      meta: { page: Number(page), limit: Number(limit), total: Number(total) },
    };
  };

  const mockRows = () => [
    {
      id: "AOIQ-001",
      jobNo: "JOB-24019",
      workOrderNo: "WO-10082",
      customer: "Orion Controls",
      partNo: "OC-PSU-441",
      revision: "R3",
      layerCount: 4,
      line: "AOI Line 1",
      machine: "Koh Young Zenith",
      status: "queued",
      priority: "high",
      panels: 18,
      boards: 360,
      dueDate: "2026-01-08",
      createdAt: "2026-01-06T00:05:00Z",
    },
    {
      id: "AOIQ-002",
      jobNo: "JOB-24022",
      workOrderNo: "WO-10090",
      customer: "Nova Instruments",
      partNo: "NI-SENS-220",
      revision: "R1",
      layerCount: 2,
      line: "AOI Line 2",
      machine: "Omron VT-S530",
      status: "running",
      priority: "urgent",
      panels: 10,
      boards: 200,
      dueDate: "2026-01-06",
      createdAt: "2026-01-06T00:10:00Z",
    },
    {
      id: "AOIQ-003",
      jobNo: "JOB-23988",
      workOrderNo: "WO-10010",
      customer: "Helix Mobility",
      partNo: "HM-DRV-901",
      revision: "R7",
      layerCount: 6,
      line: "AOI Line 1",
      machine: "Koh Young Zenith",
      status: "hold",
      priority: "normal",
      panels: 6,
      boards: 120,
      dueDate: "2026-01-09",
      holdReason: "Awaiting updated AOI program / golden sample approval",
      createdAt: "2026-01-05T21:20:00Z",
    },
    {
      id: "AOIQ-004",
      jobNo: "JOB-23950",
      workOrderNo: "WO-09960",
      customer: "Atlas Robotics",
      partNo: "AR-CNTRL-010",
      revision: "R2",
      layerCount: 8,
      line: "AOI Line 2",
      machine: "Omron VT-S530",
      status: "done",
      priority: "low",
      panels: 12,
      boards: 240,
      dueDate: "2026-01-05",
      createdAt: "2026-01-05T12:10:00Z",
    },
  ];

  const fetchList = async (nextPage = meta.page) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/aoi/queue", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          line: line === "all" ? undefined : line,
          priority: priority === "all" ? undefined : priority,
          page: nextPage,
          limit: meta.limit,
        },
      });

      const { items, meta: m } = normalizeList(res?.data);
      setRows(items);
      setMeta((prev) => ({ ...prev, ...m }));
    } catch (err) {
      toast({
        title: "Failed to load AOI queue",
        description: err?.response?.data?.message || "Using sample data (API not reachable).",
        variant: "destructive",
      });
      const sample = mockRows();
      // apply lightweight local filtering for nicer UX
      const filtered = sample.filter((r) => {
        const q = search.trim().toLowerCase();
        const matchesQ =
          !q ||
          [r.jobNo, r.workOrderNo, r.customer, r.partNo, r.revision, r.line, r.machine]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q));

        const matchesStatus = status === "all" ? true : r.status === status;
        const matchesLine = line === "all" ? true : r.line === line;
        const matchesPriority = priority === "all" ? true : r.priority === priority;
        return matchesQ && matchesStatus && matchesLine && matchesPriority;
      });

      setRows(filtered);
      setMeta((prev) => ({ ...prev, page: 1, total: filtered.length }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, line, priority]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const badgePriority = (p) => {
    const v = String(p || "").toLowerCase();
    if (v === "urgent") return <Badge className="bg-red-600 text-white">Urgent</Badge>;
    if (v === "high") return <Badge className="bg-orange-600 text-white">High</Badge>;
    if (v === "normal") return <Badge className="bg-gray-900 text-white">Normal</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  const badgeStatus = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "running")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          <PlayCircle className="h-3.5 w-3.5" />
          Running
        </span>
      );
    if (v === "hold")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <PauseCircle className="h-3.5 w-3.5" />
          Hold
        </span>
      );
    if (v === "done")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Done
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
        <Timer className="h-3.5 w-3.5" />
        Queued
      </span>
    );
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const dueChip = (dueDate) => {
    if (!dueDate) return <Badge variant="outline">No due</Badge>;
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return <Badge className="bg-red-600 text-white">Overdue</Badge>;
    if (diffDays === 0) return <Badge className="bg-orange-600 text-white">Due today</Badge>;
    if (diffDays <= 2) return <Badge className="bg-yellow-500 text-white">Due soon</Badge>;
    return <Badge variant="secondary">On track</Badge>;
  };

  const openView = (row) => {
    setSelected(row);
    setViewOpen(true);
  };

  const openHold = (row) => {
    setSelected(row);
    setHoldReason(row?.holdReason || "");
    setHoldOpen(true);
  };

  const openRelease = (row) => {
    setSelected(row);
    setReleaseOpen(true);
  };

  const safeLocalUpdate = (id, patch) => {
    setRows((prev) => prev.map((r) => ((r.id ?? r._id) === id ? { ...r, ...patch } : r)));
  };

  const action = async (kind, row) => {
    const id = row?.id ?? row?._id;
    if (!id) return;

    setActing(true);
    try {
      if (kind === "start") await api.post(`/quality/aoi/queue/${id}/start`);
      if (kind === "complete") await api.post(`/quality/aoi/queue/${id}/complete`);
      if (kind === "hold") await api.post(`/quality/aoi/queue/${id}/hold`, { reason: holdReason || undefined });
      if (kind === "release") await api.post(`/quality/aoi/queue/${id}/release`);

      toast({ title: "Updated", description: "AOI queue updated successfully." });
      fetchList(meta.page);
    } catch (err) {
      // fallback to optimistic local state for UI continuity
      if (kind === "start") safeLocalUpdate(id, { status: "running" });
      if (kind === "complete") safeLocalUpdate(id, { status: "done" });
      if (kind === "hold") safeLocalUpdate(id, { status: "hold", holdReason: holdReason || "On hold" });
      if (kind === "release") safeLocalUpdate(id, { status: "queued", holdReason: "" });

      toast({
        title: "API action failed",
        description: err?.response?.data?.message || "Applied locally (sample mode).",
        variant: "destructive",
      });
    } finally {
      setActing(false);
    }
  };

  const pageFrom = (meta.page - 1) * meta.limit + 1;
  const pageTo = (meta.page - 1) * meta.limit + rows.length;

  const distinctLines = useMemo(() => {
    const s = new Set(rows.map((r) => r.line).filter(Boolean));
    // keep stable demo options too
    ["AOI Line 1", "AOI Line 2"].forEach((x) => s.add(x));
    return ["all", ...Array.from(s)];
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <Cpu className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">AOI Queue</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">AOI</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Live queue for Automated Optical Inspection: prioritize, hold/release, start/complete runs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(1)} disabled={loading || acting}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm text-gray-700">Filters</CardTitle>
          </div>
          <CardDescription className="text-xs">Search by job/WO/part/customer and filter by status, line, priority.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Job / WO / Customer / Part…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="queued">Queued</option>
                <option value="running">Running</option>
                <option value="hold">Hold</option>
                <option value="done">Done</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>AOI Line</Label>
              <select
                value={line}
                onChange={(e) => setLine(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                {distinctLines.map((l) => (
                  <option key={l} value={l}>
                    {l === "all" ? "All lines" : l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 lg:w-[340px]">
            <span>
              Showing <span className="font-medium text-gray-900">{rows.length ? `${pageFrom}-${pageTo}` : 0}</span> of{" "}
              <span className="font-medium text-gray-900">{meta.total || rows.length}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className={cx("h-2 w-2 rounded-full", loading ? "bg-amber-500" : "bg-emerald-500")} />
              {loading ? "Loading…" : "Ready"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Queue table */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Queue</CardTitle>
          <CardDescription className="text-xs">
            Actions follow typical AOI flow: <span className="font-medium">Queued → Running → Done</span>, with optional Hold/Release.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Job / WO</th>
                  <th className="px-4 py-3 text-left">Customer / Part</th>
                  <th className="px-4 py-3 text-left">Line / Machine</th>
                  <th className="px-4 py-3 text-left">Layers</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading queue…" : "No AOI jobs in queue."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id ?? r._id ?? r.workOrderNo} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.jobNo || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.workOrderNo || "-"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.customer || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.partNo || "-"} {r.revision ? `• ${r.revision}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.line || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.machine || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-700">{r.layerCount ?? "-"}</td>

                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{r.panels ?? 0} panels</Badge>
                          <Badge variant="outline">{r.boards ?? 0} boards</Badge>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {dueChip(r.dueDate)}
                          <span className="text-xs text-gray-500">{fmtDate(r.dueDate)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">{badgePriority(r.priority)}</td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {badgeStatus(r.status)}
                          {r.status === "hold" && r.holdReason ? (
                            <div className="text-xs text-gray-500 line-clamp-1">{r.holdReason}</div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openView(r)}>
                            <Eye className="h-4 w-4" />
                            View
                          </Button>

                          {String(r.status).toLowerCase() === "queued" ? (
                            <Button
                              size="sm"
                              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                              disabled={acting}
                              onClick={() => action("start", r)}
                            >
                              <PlayCircle className="h-4 w-4" />
                              Start
                            </Button>
                          ) : null}

                          {String(r.status).toLowerCase() === "running" ? (
                            <Button
                              size="sm"
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                              disabled={acting}
                              onClick={() => action("complete", r)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Complete
                            </Button>
                          ) : null}

                          {String(r.status).toLowerCase() !== "done" ? (
                            String(r.status).toLowerCase() === "hold" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-amber-200 text-amber-800 hover:bg-amber-50"
                                disabled={acting}
                                onClick={() => openRelease(r)}
                              >
                                <PlayCircle className="h-4 w-4" />
                                Release
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-amber-200 text-amber-800 hover:bg-amber-50"
                                disabled={acting}
                                onClick={() => openHold(r)}
                              >
                                <PauseCircle className="h-4 w-4" />
                                Hold
                              </Button>
                            )
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-900">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.max(1, meta.page - 1))}
                disabled={loading || meta.page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.min(totalPages, meta.page + 1))}
                disabled={loading || meta.page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VIEW dialog */}
      <AlertDialog open={viewOpen} onOpenChange={setViewOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[#dc2551]" />
              AOI Job Details
            </AlertDialogTitle>
            <AlertDialogDescription>Quick view of job context for AOI operator and QA lead.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Job No" value={selected?.jobNo} />
            <Info label="Work Order" value={selected?.workOrderNo} />
            <Info label="Customer" value={selected?.customer} />
            <Info label="Part / Rev" value={`${selected?.partNo || "-"} ${selected?.revision ? `(${selected.revision})` : ""}`} />
            <Info label="Layers" value={selected?.layerCount} />
            <Info label="Quantity" value={`${selected?.panels ?? 0} panels • ${selected?.boards ?? 0} boards`} />
            <Info label="Line" value={selected?.line} />
            <Info label="Machine" value={selected?.machine} />
            <Info label="Priority" value={selected ? selected.priority : "-"} />
            <Info label="Status" value={selected ? selected.status : "-"} />
            <Info label="Due Date" value={fmtDate(selected?.dueDate)} />
            <Info label="Created" value={fmtDate(selected?.createdAt)} />
          </div>

          {selected?.status === "hold" ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <div className="font-medium">Hold Reason</div>
                  <div className="text-xs text-amber-900/80">{selected?.holdReason || "—"}</div>
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setViewOpen(false)} className="bg-[#dc2551] hover:bg-[#b02045]">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HOLD dialog */}
      <AlertDialog open={holdOpen} onOpenChange={setHoldOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-amber-700" />
              Put on hold?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Job: <span className="font-medium">{selected?.jobNo}</span> • WO:{" "}
              <span className="font-medium">{selected?.workOrderNo}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label>Hold reason (optional but recommended)</Label>
            <textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="e.g., Awaiting AOI program update, missing golden sample, BOM mismatch…"
              className="min-h-[96px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            />
            <p className="text-xs text-gray-500">
              Hold reason improves traceability and helps NCR/CAPA triage.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setHoldOpen(false);
                action("hold", selected);
              }}
              disabled={acting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {acting ? "Updating..." : "Hold"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* RELEASE dialog */}
      <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-emerald-700" />
              Release from hold?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will move the job back to <span className="font-medium">Queued</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setReleaseOpen(false);
                action("release", selected);
              }}
              disabled={acting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {acting ? "Updating..." : "Release"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value ?? "-"}</div>
    </div>
  );
}
