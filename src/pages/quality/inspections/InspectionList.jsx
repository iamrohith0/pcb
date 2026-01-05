// src/pages/quality/inspections/InspectionList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select"; // if your shadcn select wrapper differs, replace with your own
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import inspectionsService from "@/services/quality/inspections.service"; // create this service (API calls) or adapt to your existing api layer

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  pending: { label: "Pending", icon: AlertTriangle, className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  in_progress: { label: "In Progress", icon: RefreshCcw, className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  passed: { label: "Passed", icon: CheckCircle2, className: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  failed: { label: "Failed", icon: XCircle, className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

const TYPE_OPTIONS = [
  { value: "incoming", label: "Incoming QC" },
  { value: "in_process", label: "In-Process" },
  { value: "final", label: "Final Inspection" },
];

const DEFAULT_PAGE_SIZE = 10;

function StatusPill({ value }) {
  const meta = STATUS_META[value] || { label: value || "—", icon: AlertTriangle, className: "bg-gray-50 text-gray-700 ring-1 ring-gray-200" };
  const Icon = meta.icon;
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function TypeBadge({ value }) {
  const map = {
    incoming: { label: "Incoming", className: "bg-gray-100 text-gray-700" },
    in_process: { label: "In-Process", className: "bg-gray-100 text-gray-700" },
    final: { label: "Final", className: "bg-gray-100 text-gray-700" },
  };
  const meta = map[value] || { label: value || "—", className: "bg-gray-100 text-gray-700" };
  return <span className={cx("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>{meta.label}</span>;
}

function parseIntSafe(v, fallback) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function InspectionList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-state (so refresh/back preserves filters)
  const page = parseIntSafe(searchParams.get("page"), 1);
  const pageSize = parseIntSafe(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortDir = searchParams.get("sortDir") || "desc";

  // UI-state
  const [localQ, setLocalQ] = useState(q);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize });
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => {
    const total = meta?.total ?? 0;
    const ps = meta?.pageSize ?? pageSize;
    return Math.max(1, Math.ceil(total / ps));
  }, [meta, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const queryPayload = useMemo(() => {
    return {
      page,
      pageSize,
      q: q || undefined,
      type: type !== "all" ? type : undefined,
      status: status !== "all" ? status : undefined,
      sortBy,
      sortDir,
    };
  }, [page, pageSize, q, type, status, sortBy, sortDir]);

  const setParam = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "" || v === "all") next.delete(k);
      else next.set(k, String(v));
    });
    // reset page if filters change (unless page explicitly passed)
    if (!("page" in patch)) next.set("page", "1");
    setSearchParams(next);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      /**
       * Expected backend shape (recommended):
       * {
       *   data: [{ id, inspection_no, type, status, lot_no, work_order_no, customer_name, pcb_part_no, inspector_name, inspected_at, created_at }],
       *   meta: { total, page, pageSize }
       * }
       */
      const res = await inspectionsService.list(queryPayload);
      const payload = res?.data ?? res; // allow either axios {data} or raw
      setRows(payload?.data || []);
      setMeta(payload?.meta || { total: payload?.total ?? 0, page, pageSize });
    } catch (err) {
      toast({
        title: "Failed to load inspections",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLocalQ(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPayload]);

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    setParam({ q: localQ?.trim() || undefined });
  };

  const toggleSort = (field) => {
    if (sortBy !== field) {
      setParam({ sortBy: field, sortDir: "asc" });
      return;
    }
    setParam({ sortDir: sortDir === "asc" ? "desc" : "asc" });
  };

  const handleExport = async () => {
    try {
      // Option A: backend returns file download URL
      // Option B: backend returns blob
      const res = await inspectionsService.exportCsv(queryPayload);
      const blob = res?.data instanceof Blob ? res.data : null;

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inspections_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (res?.data?.url) {
        window.open(res.data.url, "_blank");
      } else {
        toast({ title: "Export started", description: "If your backend streams downloads, it should start now." });
      }
    } catch (err) {
      toast({
        title: "Export failed",
        description: err?.response?.data?.message || "Could not export inspections.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inspections</h1>
          <p className="text-sm text-gray-500">
            Incoming QC, in-process checks, and final inspection records for PCB manufacturing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchList} className="gap-2">
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" onClick={handleExport} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => navigate("/quality/inspections/create")}
          >
            <Plus className="h-4 w-4" />
            New Inspection
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSubmitSearch} className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <Label>Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={localQ}
                onChange={(e) => setLocalQ(e.target.value)}
                placeholder="Inspection no, WO, lot, customer, part no..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Label>Type</Label>
            <div className="mt-1">
              {/* If your Select component API differs, replace with your UI select wrapper */}
              <select
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={type}
                onChange={(e) => setParam({ type: e.target.value })}
              >
                <option value="all">All</option>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>Status</Label>
            <div className="mt-1">
              <select
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={status}
                onChange={(e) => setParam({ status: e.target.value })}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2 flex items-end gap-2">
            <Button type="submit" className="w-full gap-2 bg-[#dc2551] hover:bg-[#b02045]">
              <Filter className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <div className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>
              Showing <span className="font-semibold text-gray-700">{rows.length}</span> of{" "}
              <span className="font-semibold text-gray-700">{meta.total ?? 0}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              value={pageSize}
              onChange={(e) => setParam({ pageSize: e.target.value })}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("inspection_no")}
                  >
                    Inspection #
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("status")}
                  >
                    Status
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3">Work Order</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">PCB Part No</th>
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("inspected_at")}
                  >
                    Inspected
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    {Array.from({ length: 10 }).map((__, c) => (
                      <td key={c} className="px-4 py-3">
                        <div className="h-3.5 w-full rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500">
                    No inspections found. Try changing filters or create a new inspection.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.inspection_no || `INS-${r.id}`}</td>
                    <td className="px-4 py-3">
                      <TypeBadge value={r.type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.work_order_no || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{r.lot_no || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{r.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{r.pcb_part_no || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{r.inspector_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.inspected_at ? new Date(r.inspected_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/quality/inspections/${r.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{page}</span> of{" "}
            <span className="font-semibold text-gray-700">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev || loading}
              onClick={() => setParam({ page: page - 1 })}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!canNext || loading}
              onClick={() => setParam({ page: page + 1 })}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Small helper note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-xs text-gray-500"
      >
        Tip: For PCB manufacturing, you can search by <span className="font-medium text-gray-700">Work Order</span>,{" "}
        <span className="font-medium text-gray-700">Lot</span>, or{" "}
        <span className="font-medium text-gray-700">Part No</span> to quickly trace quality history.
      </motion.div>
    </div>
  );
}
