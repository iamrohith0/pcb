// src/pages/inventory/adjustments/StockAdjustmentsList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    ArrowUpDown,
    CalendarDays,
    ClipboardCheck,
    Eye,
    Filter,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Warehouse,
    XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function normalizeStatus(s) {
  return String(s || "DRAFT").toUpperCase();
}

function StatusBadge({ status }) {
  const s = normalizeStatus(status);
  const cls =
    s === "POSTED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "CANCELLED"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
      {s}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = String(type || "").toUpperCase();
  const cls =
    t === "INCREASE"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : t === "DECREASE"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
      {t || "-"}
    </span>
  );
}

export default function StockAdjustmentsList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // "", DRAFT, POSTED, CANCELLED
  const [type, setType] = useState(""); // "", INCREASE, DECREASE
  const [warehouseId, setWarehouseId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Masters
  const [warehouses, setWarehouses] = useState([]);

  // Sorting
  const [sortBy, setSortBy] = useState("doc_date"); // doc_date | id | status | type
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  // Paging
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load warehouses (optional)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get("/masters/warehouses");
        const data = res?.data?.data ?? res?.data ?? [];
        if (!mounted) return;
        setWarehouses(Array.isArray(data) ? data : []);
      } catch (err) {
        // it's okay if not available
        console.warn("Warehouses master not available:", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const queryParams = useMemo(() => {
    const params = {
      page,
      pageSize,
      q: q?.trim() || undefined,
      status: status || undefined,
      type: type || undefined,
      warehouse_id: warehouseId || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      sortBy,
      sortDir,
    };
    // Remove undefined
    Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
    return params;
  }, [page, pageSize, q, status, type, warehouseId, fromDate, toDate, sortBy, sortDir]);

  const fetchList = async () => {
    setLoading(true);
    try {
      // Adjust endpoint to your backend:
      // recommended: GET /inventory/adjustments with query params
      const res = await api.get("/inventory/adjustments", { params: queryParams });
      const payload = res?.data?.data ?? res?.data ?? {};
      const items = payload?.items ?? payload?.rows ?? payload ?? [];
      const metaIn = payload?.meta ?? res?.data?.meta ?? {};

      const list = Array.isArray(items) ? items : Array.isArray(payload) ? payload : [];
      setRows(list);

      const total = Number(metaIn.total ?? metaIn.count ?? list.length) || 0;
      const pg = Number(metaIn.page ?? page) || page;
      const ps = Number(metaIn.pageSize ?? metaIn.perPage ?? pageSize) || pageSize;

      setMeta({ page: pg, pageSize: ps, total });
    } catch (err) {
      console.error("Failed to load stock adjustments:", err);
      toast({
        title: "Failed to load",
        description: "Could not fetch stock adjustments list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto load when filters/page/sort change
  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const totalPages = useMemo(() => {
    const t = Number(meta.total) || 0;
    return Math.max(1, Math.ceil(t / pageSize));
  }, [meta.total]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const resetFilters = () => {
    setQ("");
    setStatus("");
    setType("");
    setWarehouseId("");
    setFromDate("");
    setToDate("");
    setSortBy("doc_date");
    setSortDir("desc");
    setPage(1);
  };

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortDir("desc");
  };

  const openDelete = (row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      // Adjust endpoint to your backend:
      await api.delete(`/inventory/adjustments/${deleteTarget.id}`);
      toast({ title: "Deleted", description: "Stock adjustment deleted successfully." });
      setDeleteOpen(false);
      setDeleteTarget(null);
      // refresh list
      fetchList();
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Could not delete this adjustment. It may be posted/locked.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const warehouseName = (row) => {
    const wid = String(row?.warehouse_id ?? "");
    const w = warehouses.find((x) => String(x.id ?? x.warehouse_id) === wid);
    return w?.name ?? w?.warehouse_name ?? row?.warehouse_name ?? "-";
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <ClipboardCheck className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">Stock Adjustments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Inventory corrections for PCB materials (CCL, prepreg, solder mask, chemicals, drills, etc.)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchList} className="gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <Link to="/inventory/adjustments/create">
              <Plus className="h-4 w-4" />
              New Adjustment
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
          <CardDescription>Search and narrow down by date, warehouse, type and status</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Doc ID / item code / lot no / reference..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="INCREASE">Increase</option>
                <option value="DECREASE">Decrease</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <div className="relative">
                <Warehouse className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={String(w.id ?? w.warehouse_id)} value={String(w.id ?? w.warehouse_id)}>
                      {w.name ?? w.warehouse_name ?? "Warehouse"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>From</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-end gap-2 lg:col-span-2">
              <Button variant="outline" onClick={resetFilters} className="gap-2">
                <XCircle className="h-4 w-4" />
                Reset
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  // no-op; filters auto apply, but users expect button
                  fetchList();
                }}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">All Adjustments</CardTitle>
          <CardDescription>
            Showing {rows.length} of {meta.total} records
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("id")}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      Doc <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("doc_date")}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      Date <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("type")}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      Type <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      Status <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2 text-right">Lines</th>
                  <th className="px-3 py-2 text-right">Total Qty</th>
                  <th className="px-3 py-2 text-right">Total Value</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm text-gray-600">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm text-gray-600">
                      No adjustments found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const rid = r.id ?? r.adjustment_id ?? r.doc_no;
                    const date = r.doc_date ?? r.date;
                    const st = r.status;
                    const tp = r.adjustment_type ?? r.type;
                    const reason = r.reason ?? r.remarks ?? "-";
                    const lineCount = Number(r.line_count ?? r.lines_count ?? (r.lines?.length ?? 0)) || 0;
                    const totalQty = r.total_qty ?? r.totalQty ?? 0;
                    const totalValue = r.total_value ?? r.totalValue ?? 0;

                    return (
                      <tr
                        key={String(rid ?? idx)}
                        className={cx("border-t", idx % 2 === 0 ? "bg-white" : "bg-gray-50/40")}
                      >
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          <button
                            type="button"
                            className="hover:underline"
                            onClick={() => navigate(`/inventory/adjustments/${rid}`)}
                          >
                            #{rid}
                          </button>
                        </td>
                        <td className="px-3 py-2">{fmtDate(date)}</td>
                        <td className="px-3 py-2">{warehouseName(r)}</td>
                        <td className="px-3 py-2">
                          <TypeBadge type={tp} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={st} />
                        </td>
                        <td className="px-3 py-2 max-w-[240px] truncate" title={reason}>
                          {reason}
                        </td>
                        <td className="px-3 py-2 text-right">{lineCount}</td>
                        <td className="px-3 py-2 text-right">{Number(totalQty).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}</td>
                        <td className="px-3 py-2 text-right">{Number(totalValue || 0).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigate(`/inventory/adjustments/${rid}`)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-red-600 hover:text-red-700"
                              onClick={() => openDelete({ ...r, id: rid })}
                              disabled={normalizeStatus(st) === "POSTED"}
                              title={normalizeStatus(st) === "POSTED" ? "Posted adjustments cannot be deleted." : "Delete"}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
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

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="grid place-items-center py-10 text-sm text-gray-600">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border bg-white p-6 text-center text-sm text-gray-600">No adjustments found.</div>
            ) : (
              rows.map((r, idx) => {
                const rid = r.id ?? r.adjustment_id ?? r.doc_no;
                const date = r.doc_date ?? r.date;
                const st = r.status;
                const tp = r.adjustment_type ?? r.type;
                const reason = r.reason ?? r.remarks ?? "-";
                const lineCount = Number(r.line_count ?? r.lines_count ?? (r.lines?.length ?? 0)) || 0;

                return (
                  <div key={String(rid ?? idx)} className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{rid}</p>
                        <p className="mt-1 text-xs text-gray-500">{fmtDate(date)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={st} />
                        <TypeBadge type={tp} />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Warehouse</p>
                        <p className="font-medium text-gray-900">{warehouseName(r)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Lines</p>
                        <p className="font-medium text-gray-900">{lineCount}</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="text-xs font-semibold text-gray-500">Reason</p>
                      <p className="mt-1 line-clamp-2">{reason}</p>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => navigate(`/inventory/adjustments/${rid}`)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-red-600 hover:text-red-700"
                        onClick={() => openDelete({ ...r, id: rid })}
                        disabled={normalizeStatus(st) === "POSTED"}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || loading}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canNext || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" /> Delete adjustment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">#{deleteTarget?.id}</span>.
              <br />
              Posted adjustments are usually locked for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
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
