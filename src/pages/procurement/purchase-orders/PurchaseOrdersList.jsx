// src/pages/procurement/purchase-orders/PurchaseOrdersList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ChevronLeft,
  ChevronRight,
  FileDown,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";

/**
 * PCBxpress – Purchase Orders List
 * Location: src/pages/procurement/purchase-orders/PurchaseOrdersList.jsx
 *
 * Suggested APIs (adjust to your backend):
 *  GET  /procurement/purchase-orders
 *      params: { q, status, supplier_id, from, to, page, limit, sort }
 *      response: { data: [...], meta: { page, limit, total, pages } }
 *
 *  DELETE /procurement/purchase-orders/:id   (optional)
 *  GET    /procurement/purchase-orders/export (optional - CSV/XLSX)
 *
 * Routing suggestions:
 *  /procurement/purchase-orders           -> list
 *  /procurement/purchase-orders/create    -> create
 *  /procurement/purchase-orders/:id       -> details
 */

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function normalizeDate(v) {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "sent", label: "Sent to Supplier" },
  { value: "partial_received", label: "Partially Received" },
  { value: "received", label: "Received" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function PurchaseOrdersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filters (read from URL)
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = safeNum(searchParams.get("page") || 1, 1);
  const limit = safeNum(searchParams.get("limit") || 10, 10);

  const [localQ, setLocalQ] = useState(q);

  useEffect(() => setLocalQ(q), [q]);

  const query = useMemo(() => ({ q, status, from, to, page, limit }), [q, status, from, to, page, limit]);

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === "" || value === null || value === undefined) next.delete(key);
    else next.set(key, String(value));
    // Reset page when changing key except page/limit
    if (!["page", "limit"].includes(key)) next.set("page", "1");
    setSearchParams(next, { replace: true });
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams({ page: "1", limit: String(limit || 10) }), { replace: true });
  }

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get("/procurement/purchase-orders", {
        params: {
          q: query.q || undefined,
          status: query.status || undefined,
          from: query.from || undefined,
          to: query.to || undefined,
          page: query.page || 1,
          limit: query.limit || 10,
          sort: "-po_date",
        },
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      const m = res.data?.meta || res.data?.pagination || {};

      setRows(
        data.map((x) => ({
          id: x.id ?? x._id ?? "",
          po_number: x.po_number ?? x.number ?? "PO",
          po_date: normalizeDate(x.po_date ?? x.date ?? ""),
          supplier_name: x.supplier_name ?? x.supplier?.name ?? "Supplier",
          status: x.status ?? "draft",
          items_count: x.items_count ?? x.lines_count ?? x.lines?.length ?? 0,
          grand_total: x.grand_total ?? x.total ?? x.amount ?? 0,
          currency: x.currency ?? "INR",
          created_at: normalizeDate(x.created_at ?? x.createdAt ?? ""),
        }))
      );

      setMeta({
        page: safeNum((m.page ?? query.page), query.page),
        limit: safeNum((m.limit ?? query.limit), query.limit),
        total: safeNum((m.total ?? m.count ?? data.length), data.length),
        pages: safeNum((m.pages ?? Math.ceil((m.total ?? data.length) / (m.limit ?? query.limit))) || 1, 1),
      });
    } catch (e) {
      toast({
        title: "Failed to load POs",
        description: e?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      setRows([]);
      setMeta({ page: 1, limit: 10, total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q, query.status, query.from, query.to, query.page, query.limit]);

  function badge(status) {
    const s = String(status || "").toLowerCase();
    const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border";
    if (s === "approved") return <span className={cx(base, "border-emerald-200 bg-emerald-50 text-emerald-700")}>Approved</span>;
    if (s === "sent") return <span className={cx(base, "border-blue-200 bg-blue-50 text-blue-700")}>Sent</span>;
    if (s === "partial_received") return <span className={cx(base, "border-amber-200 bg-amber-50 text-amber-800")}>Partial</span>;
    if (s === "received") return <span className={cx(base, "border-emerald-200 bg-emerald-50 text-emerald-700")}>Received</span>;
    if (s === "cancelled") return <span className={cx(base, "border-red-200 bg-red-50 text-red-700")}>Cancelled</span>;
    if (s === "closed") return <span className={cx(base, "border-gray-200 bg-gray-50 text-gray-700")}>Closed</span>;
    if (s === "submitted") return <span className={cx(base, "border-violet-200 bg-violet-50 text-violet-700")}>Submitted</span>;
    return <span className={cx(base, "border-gray-200 bg-gray-50 text-gray-700")}>Draft</span>;
  }

  function openDelete(po) {
    setDeleteTarget(po);
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    try {
      await api.delete(`/procurement/purchase-orders/${deleteTarget.id}`);
      toast({ title: "Deleted", description: `PO ${deleteTarget.po_number} deleted.` });
      setConfirmDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || "Could not delete the PO.",
        variant: "destructive",
      });
    }
  }

  async function handleExport() {
    // This is a stub; many backends return a file stream.
    // If your backend returns a URL, redirect/open it. If it returns blob, handle download.
    setExporting(true);
    try {
      // Option 1: open link
      // window.open(`/api/procurement/purchase-orders/export?status=${status}&from=${from}&to=${to}&q=${q}`, "_blank");

      // Option 2: call and show toast (placeholder)
      await api.get("/procurement/purchase-orders/export", {
        params: { q: q || undefined, status: status || undefined, from: from || undefined, to: to || undefined },
      });

      toast({ title: "Export started", description: "If your server returns a file, it will download in a new tab." });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e?.response?.data?.message || "Unable to export purchase orders.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.pages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#dc2551]" />
            <h1 className="text-xl font-semibold text-gray-900">Purchase Orders</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Track PCB raw material POs, approvals, and receiving status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting || loading}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Export
          </Button>
          <Button className="gap-2" onClick={() => navigate("/procurement/purchase-orders/create")}>
            <Plus className="h-4 w-4" />
            New PO
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-800">Filters</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <Label>Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  className="pl-9"
                  placeholder="Search PO number / supplier…"
                  value={localQ}
                  onChange={(e) => setLocalQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setParam("q", localQ.trim());
                  }}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setParam("q", localQ.trim())}>
                  Apply
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLocalQ("")}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Status</Label>
              <select
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setParam("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>From</Label>
              <Input className="mt-2" type="date" value={from} onChange={(e) => setParam("from", e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label>To</Label>
              <Input className="mt-2" type="date" value={to} onChange={(e) => setParam("to", e.target.value)} />
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium text-gray-700">{rows.length}</span> of{" "}
                <span className="font-medium text-gray-700">{meta.total}</span> purchase orders
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-gray-200">
        <div className="p-4">
          {loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading purchase orders…
            </div>
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3">PO No</th>
                    <th className="py-2 pr-3">PO Date</th>
                    <th className="py-2 pr-3">Supplier</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Items</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-0 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((po) => (
                    <tr key={po.id} className="border-t">
                      <td className="py-3 pr-3">
                        <Link
                          className="font-medium text-gray-900 hover:underline"
                          to={`/procurement/purchase-orders/${po.id}`}
                        >
                          {po.po_number}
                        </Link>
                        <div className="mt-0.5 text-xs text-gray-500">{po.created_at ? `Created: ${po.created_at}` : ""}</div>
                      </td>
                      <td className="py-3 pr-3 text-gray-700">{po.po_date || "—"}</td>
                      <td className="py-3 pr-3 text-gray-800">{po.supplier_name}</td>
                      <td className="py-3 pr-3">{badge(po.status)}</td>
                      <td className="py-3 pr-3 text-gray-700">{po.items_count}</td>
                      <td className="py-3 pr-3 text-gray-900">
                        {po.currency || "INR"} {Number(po.grand_total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 pr-0">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate(`/procurement/purchase-orders/${po.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(po)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {rows.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-gray-500">
                Page <span className="font-medium text-gray-700">{meta.page}</span> of{" "}
                <span className="font-medium text-gray-700">{meta.pages}</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border px-2 py-2 text-xs"
                  value={limit}
                  onChange={(e) => setParam("limit", e.target.value)}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}/page
                    </option>
                  ))}
                </select>

                <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setParam("page", meta.page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setParam("page", meta.page + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{deleteTarget?.po_number}</span>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#dc2551] hover:bg-[#b02045]"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#dc2551]/10">
        <FileText className="h-6 w-6 text-[#dc2551]" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-900">No Purchase Orders found</h3>
      <p className="mt-1 text-sm text-gray-600">
        Create your first PO to start tracking raw materials and receiving.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button asChild className="gap-2">
          <Link to="/procurement/purchase-orders/create">
            <Plus className="h-4 w-4" />
            New PO
          </Link>
        </Button>
      </div>
    </div>
  );
}
