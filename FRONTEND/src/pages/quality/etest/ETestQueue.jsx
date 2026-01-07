// src/pages/quality/etest/ETestQueue.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    Cable,
    CheckCircle2,
    ChevronLeft,
    ClipboardList,
    Eye,
    Filter,
    Loader2,
    PauseCircle,
    PlayCircle,
    RefreshCcw,
    Search,
    ShieldAlert,
    Timer,
    Trash2,
    XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDateTime(value) {
  if (!value) return "—";
  const raw = String(value);
  // If ISO
  if (raw.includes("T")) {
    const [d, t] = raw.split("T");
    return `${d} ${t?.slice(0, 5) || ""}`.trim();
  }
  return raw;
}

const STATUS_META = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  queued: { label: "Queued", className: "bg-blue-50 text-blue-700 border-blue-200" },
  running: { label: "Running", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  hold: { label: "On Hold", className: "bg-slate-100 text-slate-700 border-slate-200" },
  passed: { label: "Passed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function StatPill({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/**
 * ETestQueue.jsx
 *
 * Suggested backend endpoints (adjust to your API):
 * - GET    /quality/etest/queue?status=&q=&job_no=&order_no=&part_no=
 * - POST   /quality/etest/:id/start
 * - POST   /quality/etest/:id/hold
 * - POST   /quality/etest/:id/complete   { result: "passed"|"failed", remarks? }
 * - DELETE /quality/etest/:id
 *
 * Row shape (example):
 * {
 *   id, job_no, order_no, part_no, customer_name,
 *   boards_qty, panel_qty, fixture_id, program_name,
 *   status, priority, due_date, created_at, updated_at,
 *   last_result, last_run_at
 * }
 */
export default function ETestQueue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "queued");
  const [jobNo, setJobNo] = useState(searchParams.get("jobNo") || "");
  const [orderNo, setOrderNo] = useState(searchParams.get("orderNo") || "");
  const [partNo, setPartNo] = useState(searchParams.get("partNo") || "");

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Row actions
  const [actioningId, setActioningId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Keep URL in sync
  useEffect(() => {
    const next = {};
    if (q) next.q = q;
    if (status) next.status = status;
    if (jobNo) next.jobNo = jobNo;
    if (orderNo) next.orderNo = orderNo;
    if (partNo) next.partNo = partNo;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, jobNo, orderNo, partNo]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get("/quality/etest/queue", {
        params: {
          q: q || undefined,
          status: status || undefined,
          job_no: jobNo || undefined,
          order_no: orderNo || undefined,
          part_no: partNo || undefined,
        },
      });

      const data = res?.data?.data ?? res?.data ?? [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("ETest queue fetch failed:", err);
      toast({
        title: "Failed to load E-Test Queue",
        description: err?.response?.data?.message || "Please check API endpoint /quality/etest/queue",
        variant: "destructive",
      });

      // Friendly empty fallback so UI still renders
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!qq) return true;
      const hay = [
        r.job_no,
        r.order_no,
        r.part_no,
        r.customer_name,
        r.fixture_id,
        r.program_name,
        r.status,
        r.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const queued = rows.filter((r) => r.status === "queued").length;
    const running = rows.filter((r) => r.status === "running").length;
    const hold = rows.filter((r) => r.status === "hold").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    return { total, pending, queued, running, hold, failed };
  }, [rows]);

  const runAction = async (id, fn) => {
    setActioningId(id);
    try {
      await fn();
      toast({ title: "Updated", description: "Queue updated successfully." });
      await fetchQueue();
    } catch (err) {
      toast({
        title: "Action failed",
        description: err?.response?.data?.message || "Please verify backend endpoint.",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  };

  const startTest = (row) =>
    runAction(row.id, () => api.post(`/quality/etest/${row.id}/start`));

  const holdTest = (row) =>
    runAction(row.id, () => api.post(`/quality/etest/${row.id}/hold`));

  const markPassed = (row) =>
    runAction(row.id, () => api.post(`/quality/etest/${row.id}/complete`, { result: "passed" }));

  const markFailed = (row) =>
    runAction(row.id, () => api.post(`/quality/etest/${row.id}/complete`, { result: "failed" }));

  const openDelete = (row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) {
      setDeleteOpen(false);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/quality/etest/${deleteTarget.id}`);
      toast({ title: "Deleted", description: "E-Test queue item removed." });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchQueue();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete queue item.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Cable className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">E-Test Queue</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Manage electrical testing queue (flying probe / bed-of-nails) for PCB jobs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" className="gap-2" onClick={fetchQueue} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <ClipboardList className="h-4 w-4" />
            Add to Queue
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatPill label="Total" value={stats.total} icon={ClipboardList} />
        <StatPill label="Pending" value={stats.pending} icon={Timer} />
        <StatPill label="Queued" value={stats.queued} icon={Filter} />
        <StatPill label="Running" value={stats.running} icon={PlayCircle} />
        <StatPill label="On Hold" value={stats.hold} icon={PauseCircle} />
        <StatPill label="Failed" value={stats.failed} icon={ShieldAlert} />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search job/order/part/customer/fixture/program..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="queued | pending | running | hold | passed | failed"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Job No</Label>
            <Input value={jobNo} onChange={(e) => setJobNo(e.target.value)} placeholder="JB-..." />
          </div>

          <div className="space-y-1.5">
            <Label>Order No</Label>
            <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="SO-..." />
          </div>

          <div className="space-y-1.5">
            <Label>Part No</Label>
            <Input value={partNo} onChange={(e) => setPartNo(e.target.value)} placeholder="Part..." />
          </div>

          <div className="flex flex-wrap items-center gap-2 md:col-span-2 lg:col-span-5 pt-1">
            <Button variant="outline" className="gap-2" onClick={() => setQ("")}>
              <XCircle className="h-4 w-4" />
              Clear Search
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setJobNo("")}>
              <XCircle className="h-4 w-4" />
              Clear Job
            </Button>

            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
              <Filter className="h-4 w-4" />
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> items
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Fixture / Program</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Last Run</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading queue...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No queue items found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const meta = STATUS_META[row.status] || STATUS_META.queued;
                  const busy = actioningId === row.id;

                  return (
                    <tr key={row.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.job_no || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {row.order_no ? `Order ${row.order_no}` : "—"}{" "}
                          {row.part_no ? `• Part ${row.part_no}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900">{row.customer_name || "—"}</div>
                        <div className="text-xs text-gray-500">{row.priority ? `Priority: ${row.priority}` : " "}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900">{row.fixture_id || "—"}</div>
                        <div className="text-xs text-gray-500">{row.program_name || "—"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900">
                          {row.boards_qty ?? "—"} <span className="text-xs text-gray-500">boards</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.panel_qty != null ? `${row.panel_qty} panels` : " "}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cx("border", meta.className)}>
                          {meta.label}
                        </Badge>
                        {row.last_result && (
                          <div className="mt-1 text-xs text-gray-500">Last: {String(row.last_result)}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-700">{row.due_date ? String(row.due_date) : "—"}</td>

                      <td className="px-4 py-3 text-gray-700">{fmtDateTime(row.last_run_at || row.updated_at)}</td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            asChild
                            disabled={!row.id}
                          >
                            <Link to={`/quality/etest/${row.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>

                          {row.status !== "running" ? (
                            <Button
                              size="sm"
                              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                              onClick={() => startTest(row)}
                              disabled={busy}
                            >
                              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                              Start
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => holdTest(row)}
                              disabled={busy}
                            >
                              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />}
                              Hold
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => markPassed(row)}
                            disabled={busy}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Pass
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => markFailed(row)}
                            disabled={busy}
                          >
                            <XCircle className="h-4 w-4" />
                            Fail
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                            onClick={() => openDelete(row)}
                            disabled={busy}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-white px-4 py-3 text-xs text-gray-500">
          Tip: Tie this queue to <span className="font-medium text-gray-800">Work Orders</span> and{" "}
          <span className="font-medium text-gray-800">Routing</span> so E-Test becomes a required operation before dispatch.
        </div>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete queue item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the E-Test queue record. You can re-add it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={cx("bg-red-600 text-white hover:bg-red-700", deleting && "pointer-events-none opacity-70")}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
