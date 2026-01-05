// src/pages/sales/invoices/InvoiceList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Calendar,
  Download,
  Eye,
  FileSearch2,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  CheckCircle2,
  Send,
  Ban,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import invoicesService from "@/services/sales/invoices.service";

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

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const INR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0
  );

function safeDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

function pickId(obj) {
  return obj?.id || obj?._id || obj?.uuid || "";
}

function StatusBadge({ status }) {
  const s = String(status || "DRAFT").toUpperCase();
  const cls =
    s === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : s === "SENT"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : s === "CANCELLED"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-gray-200 bg-gray-50 text-gray-700";
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium", cls)}>
      {s}
    </span>
  );
}

function StatusIcon({ status }) {
  const s = String(status || "DRAFT").toUpperCase();
  if (s === "PAID") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (s === "SENT") return <Send className="h-4 w-4 text-blue-600" />;
  if (s === "CANCELLED") return <Ban className="h-4 w-4 text-red-600" />;
  return <FileText className="h-4 w-4 text-gray-500" />;
}

export default function InvoiceList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Table state
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  // Sorting
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "invoiceDate");
  const [sortDir, setSortDir] = useState(searchParams.get("sortDir") || "desc");

  // Paging
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 20);

  // Actions
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [bulkExporting, setBulkExporting] = useState(false);

  const queryObj = useMemo(
    () => ({
      page,
      limit,
      q: q?.trim() || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      sortBy,
      sortDir,
    }),
    [page, limit, q, status, from, to, sortBy, sortDir]
  );

  const syncUrl = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await invoicesService.list(queryObj);
      const data = res?.data?.data ?? res?.data ?? {};
      const list = data?.items ?? data?.results ?? data?.rows ?? data ?? [];
      const m = data?.meta ?? {
        page: data?.page ?? page,
        limit: data?.limit ?? limit,
        total: data?.total ?? list?.length ?? 0,
        totalPages: data?.totalPages ?? 1,
      };

      setRows(Array.isArray(list) ? list : []);
      setMeta(m);
    } catch (err) {
      toast({
        title: "Failed to load invoices",
        description: err?.response?.data?.message || "Server error while fetching invoices list.",
        variant: "destructive",
      });
      setRows([]);
      setMeta({ page: 1, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(queryObj)]);

  const resetFilters = () => {
    setQ("");
    setStatus("");
    setFrom("");
    setTo("");
    setSortBy("invoiceDate");
    setSortDir("desc");
    setSearchParams(new URLSearchParams({ page: "1", limit: String(limit) }), { replace: true });
  };

  const applyFilters = (e) => {
    e?.preventDefault?.();
    syncUrl({
      q: q?.trim() || "",
      status: status || "",
      from: from || "",
      to: to || "",
      sortBy,
      sortDir,
      page: 1,
      limit,
    });
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      const nextDir = sortDir === "asc" ? "desc" : "asc";
      setSortDir(nextDir);
      syncUrl({ sortBy: field, sortDir: nextDir, page: 1 });
      return;
    }
    setSortBy(field);
    setSortDir("desc");
    syncUrl({ sortBy: field, sortDir: "desc", page: 1 });
  };

  const openDelete = (invoice) => {
    setDeleteTarget(invoice);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await invoicesService.remove(pickId(deleteTarget));
      toast({ title: "Deleted", description: "Invoice deleted successfully." });
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete invoice.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = async () => {
    // Expected: invoicesService.exportCsv(queryObj) => blob/csv
    setBulkExporting(true);
    try {
      const res = await invoicesService.exportCsv(queryObj);
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Invoices exported as CSV." });
    } catch (err) {
      toast({
        title: "Export failed",
        description:
          err?.response?.data?.message ||
          "CSV export endpoint not available yet. Add invoicesService.exportCsv().",
        variant: "destructive",
      });
    } finally {
      setBulkExporting(false);
    }
  };

  const gotoPage = (p) => {
    const next = Math.max(1, Math.min(Number(meta?.totalPages || 1), p));
    syncUrl({ page: next });
  };

  const showingFrom = meta?.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const showingTo = meta?.total ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-gray-500">
            PCBXpress billing overview — search, filter, export, and open invoice details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>

          <Button variant="outline" onClick={exportCsv} disabled={bulkExporting}>
            {bulkExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>

          <Button asChild className="bg-[#dc2551] hover:bg-[#B02045]">
            <Link to="/dashboard/sales/invoices/create">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-gray-500" />
            Filters
          </CardTitle>
          <CardDescription>Filter invoices by number, customer, status and date range.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={applyFilters} className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5 space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Invoice no, customer, SO/WO ref..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Status</Label>
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="DRAFT / SENT / PAID"
              />
              <p className="text-[11px] text-gray-500">Tip: keep blank for all.</p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>From</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>To</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="md:col-span-1 flex items-end gap-2">
              <Button type="submit" className="w-full">
                Apply
              </Button>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-800">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of <span className="font-medium text-gray-800">{meta?.total || 0}</span>
              </div>
              <Button type="button" variant="ghost" onClick={resetFilters} className="text-gray-600">
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSearch2 className="h-4 w-4 text-gray-500" />
              Invoice List
            </CardTitle>
            <CardDescription>Click an invoice to open details.</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("invoiceNo")}
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                      >
                        Invoice <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("invoiceDate")}
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                      >
                        Date <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Due
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("grandTotal")}
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                      >
                        Amount <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices...
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10">
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-800">No invoices found</p>
                          <p className="mt-1 text-xs text-gray-500">Try adjusting filters or create a new invoice.</p>
                          <Button asChild className="mt-3 bg-[#dc2551] hover:bg-[#B02045]">
                            <Link to="/dashboard/sales/invoices/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Invoice
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((inv) => (
                      <tr key={pickId(inv)} className="border-b last:border-b-0 hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={inv.status} />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{inv.invoiceNo || inv.code || "—"}</p>
                              <p className="text-xs text-gray-500">
                                {inv.referenceNo ? `Ref: ${inv.referenceNo}` : inv.salesOrderNo ? `SO: ${inv.salesOrderNo}` : "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{inv.customer?.name || inv.customerName || "—"}</p>
                          <p className="text-xs text-gray-500">{inv.customer?.gstin || inv.customerGstin || ""}</p>
                        </td>

                        <td className="px-4 py-3 text-gray-700">{safeDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-3 text-gray-700">{safeDate(inv.dueDate)}</td>

                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>

                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {INR(Number(inv.grandTotal ?? inv.total ?? 0))}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/sales/invoices/${pickId(inv)}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openDelete(inv)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                Page <span className="font-medium text-gray-800">{meta?.page || 1}</span> of{" "}
                <span className="font-medium text-gray-800">{meta?.totalPages || 1}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={(meta?.page || 1) <= 1} onClick={() => gotoPage((meta?.page || 1) - 1)}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={(meta?.page || 1) >= (meta?.totalPages || 1)} onClick={() => gotoPage((meta?.page || 1) + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The invoice will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * EXPECTED services in: src/services/sales/invoices.service.js
 *
 * - list(params)                 // supports {page,limit,q,status,from,to,sortBy,sortDir}
 * - remove(id)
 * - exportCsv(params)            // returns Axios blob/csv
 *
 * Example backend:
 * GET    /sales/invoices
 * DELETE /sales/invoices/:id
 * GET    /sales/invoices/export/csv
 */
