// src/pages/quality/etest/ETestResults.jsx
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
    ArrowUpRight,
    CheckCircle2,
    ChevronLeft,
    Download,
    Eye,
    FileText,
    Filter,
    Loader2,
    RefreshCcw,
    Search,
    ShieldAlert,
    Trash2,
    XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDateTime(value) {
  if (!value) return "—";
  const raw = String(value);
  if (raw.includes("T")) {
    const [d, t] = raw.split("T");
    return `${d} ${t?.slice(0, 5) || ""}`.trim();
  }
  return raw;
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const RESULT_META = {
  passed: { label: "Passed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700 border-rose-200" },
  partial: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
  unknown: { label: "Unknown", className: "bg-slate-100 text-slate-700 border-slate-200" },
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
 * ETestResults.jsx
 *
 * Suggested backend endpoints (adjust to your API):
 * - GET    /quality/etest/results?from=&to=&result=&q=&job_no=&order_no=&part_no=
 * - GET    /quality/etest/results/export?from=&to=&result=&q=
 * - GET    /quality/etest/:id/report         (PDF/HTML report)
 * - DELETE /quality/etest/results/:id         (remove saved result record)
 *
 * Row shape (example):
 * {
 *   id,
 *   job_no, order_no, part_no, customer_name,
 *   test_type: "Flying Probe"|"Bed of Nails",
 *   run_at, operator_name,
 *   result: "passed"|"failed"|"partial",
 *   shorts, opens, total_nets,
 *   yield_percent,
 *   report_url,   // optional
 *   remarks
 * }
 */
export default function ETestResults() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [result, setResult] = useState(searchParams.get("result") || "all");
  const [jobNo, setJobNo] = useState(searchParams.get("jobNo") || "");
  const [orderNo, setOrderNo] = useState(searchParams.get("orderNo") || "");
  const [partNo, setPartNo] = useState(searchParams.get("partNo") || "");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sync URL
  useEffect(() => {
    const next = {};
    if (q) next.q = q;
    if (result && result !== "all") next.result = result;
    if (jobNo) next.jobNo = jobNo;
    if (orderNo) next.orderNo = orderNo;
    if (partNo) next.partNo = partNo;
    if (from) next.from = from;
    if (to) next.to = to;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, result, jobNo, orderNo, partNo, from, to]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get("/quality/etest/results", {
        params: {
          q: q || undefined,
          result: result === "all" ? undefined : result,
          job_no: jobNo || undefined,
          order_no: orderNo || undefined,
          part_no: partNo || undefined,
          from: from || undefined,
          to: to || undefined,
        },
      });
      const data = res?.data?.data ?? res?.data ?? [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("ETest results fetch failed:", err);
      toast({
        title: "Failed to load E-Test Results",
        description: err?.response?.data?.message || "Please check API endpoint /quality/etest/results",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (result !== "all" && String(r.result) !== result) return false;
      if (!qq) return true;
      const hay = [
        r.job_no,
        r.order_no,
        r.part_no,
        r.customer_name,
        r.operator_name,
        r.test_type,
        r.result,
        r.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q, result]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const passed = filtered.filter((r) => r.result === "passed").length;
    const failed = filtered.filter((r) => r.result === "failed").length;
    const partial = filtered.filter((r) => r.result === "partial").length;

    const avgYield =
      total === 0
        ? 0
        : Math.round(
            (filtered.reduce((acc, r) => acc + safeNum(r.yield_percent), 0) / total) * 10
          ) / 10;

    return { total, passed, failed, partial, avgYield };
  }, [filtered]);

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
      await api.delete(`/quality/etest/results/${deleteTarget.id}`);
      toast({ title: "Deleted", description: "E-Test result removed." });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchResults();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete result record.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = async () => {
    try {
      // If your backend supports export as a file:
      const res = await api.get("/quality/etest/results/export", {
        params: {
          q: q || undefined,
          result: result === "all" ? undefined : result,
          from: from || undefined,
          to: to || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: res.headers["content-type"] || "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etest-results-${from || "all"}-${to || "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export started", description: "Downloaded results file." });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err?.response?.data?.message || "Please check /quality/etest/results/export",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">E-Test Results</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              View completed electrical test runs, yield and defect counts (opens/shorts).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" className="gap-2" onClick={fetchResults} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
            <Link to="/quality/etest/queue">
              <ArrowUpRight className="h-4 w-4" />
              Go to Queue
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatPill label="Total" value={stats.total} icon={Filter} />
        <StatPill label="Passed" value={stats.passed} icon={CheckCircle2} />
        <StatPill label="Failed" value={stats.failed} icon={ShieldAlert} />
        <StatPill label="Partial" value={stats.partial} icon={XCircle} />
        <StatPill label="Avg Yield (%)" value={stats.avgYield} icon={CheckCircle2} />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search job/order/part/customer/operator..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Result</Label>
            <Input
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="all | passed | failed | partial"
            />
          </div>

          <div className="space-y-1.5">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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

          <div className="flex flex-wrap items-center gap-2 md:col-span-2 lg:col-span-6 pt-1">
            <Button variant="outline" className="gap-2" onClick={() => setQ("")}>
              <XCircle className="h-4 w-4" />
              Clear Search
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setResult("all");
                setFrom("");
                setTo("");
                setJobNo("");
                setOrderNo("");
                setPartNo("");
              }}
            >
              <XCircle className="h-4 w-4" />
              Reset Filters
            </Button>

            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
              <Filter className="h-4 w-4" />
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> records
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
                <th className="px-4 py-3">Run</th>
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Defects</th>
                <th className="px-4 py-3">Yield</th>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading results...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No results found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const meta = RESULT_META[row.result] || RESULT_META.unknown;

                  return (
                    <tr key={row.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.job_no || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {row.order_no ? `Order ${row.order_no}` : "—"}{" "}
                          {row.part_no ? `• Part ${row.part_no}` : ""}
                        </div>
                        <div className="text-xs text-gray-500">{row.customer_name || " "}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900">{fmtDateTime(row.run_at)}</div>
                        <div className="text-xs text-gray-500">{row.operator_name ? `By ${row.operator_name}` : "—"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900">{row.test_type || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {row.program_name ? `Program: ${row.program_name}` : " "}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cx("border", meta.className)}>
                          {meta.label}
                        </Badge>
                        {row.remarks ? (
                          <div className="mt-1 line-clamp-2 max-w-[240px] text-xs text-gray-500">{row.remarks}</div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-400">—</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Opens</span>
                          <span className="font-semibold text-gray-900">{row.opens ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Shorts</span>
                          <span className="font-semibold text-gray-900">{row.shorts ?? 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Nets: <span className="font-medium text-gray-900">{row.total_nets ?? "—"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        <div className="text-sm font-semibold text-gray-900">
                          {row.yield_percent != null ? `${row.yield_percent}%` : "—"}
                        </div>
                        <div className="text-xs text-gray-500">Net Yield</div>
                      </td>

                      <td className="px-4 py-3">
                        {row.report_url ? (
                          <a
                            href={row.report_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <FileText className="h-4 w-4" />
                            Open
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" asChild disabled={!row.id}>
                            <Link to={`/quality/etest/results/${row.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => openDelete(row)}
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
          Tip: Store raw E-Test logs + parsed defect list per net/pad to improve traceability and CAPA linkage.
        </div>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete result?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the stored E-Test result record.
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
