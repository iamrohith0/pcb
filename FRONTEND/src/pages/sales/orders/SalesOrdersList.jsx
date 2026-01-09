// src/pages/sales/orders/SalesOrdersList.jsx
import { motion } from "framer-motion";
import {
    ArrowUpDown,
    Building2,
    CalendarDays,
    Eye,
    FileText,
    Filter,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import salesOrdersApi from "@/services/sales/salesOrders.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "—";
    return x.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

function money(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v : 0;
}

function getStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("draft")) return "bg-gray-100 text-gray-700";
  if (s.includes("submitted")) return "bg-blue-50 text-blue-700";
  if (s.includes("confirmed")) return "bg-emerald-50 text-emerald-700";
  if (s.includes("in production") || s.includes("production")) return "bg-amber-50 text-amber-800";
  if (s.includes("completed") || s.includes("closed")) return "bg-purple-50 text-purple-700";
  if (s.includes("cancel")) return "bg-rose-50 text-rose-700";
  return "bg-gray-100 text-gray-700";
}

function normalizeRow(o) {
  return {
    id: o?.id,
    orderNo: o?.order_no || o?.orderNo || o?.so_no || o?.soNo || `SO-${o?.id ?? ""}`,
    orderDate: o?.order_date || o?.orderDate || o?.date,
    customerName: o?.customer?.name || o?.customer_name || o?.customerName || "—",
    status: o?.status || "Draft",
    // totals fields may vary by backend
    grandTotal:
      o?.totals?.grand_total ??
      o?.grand_total ??
      o?.grandTotal ??
      o?.total_amount ??
      0,
    currency: o?.currency || "INR",
    priority: o?.priority || o?.job?.priority || "Normal",
    requestedDelivery:
      o?.requested_delivery || o?.requestedDelivery || o?.job?.requested_delivery || null,
  };
}

export default function SalesOrdersList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("order_date"); // order_date | order_no | customer | total
  const [sortDir, setSortDir] = useState("desc"); // asc|desc
  const [page, setPage] = useState(1);
  const limit = 10;

  const statusChips = useMemo(
    () => ["All", "Draft", "Submitted", "Confirmed", "In Production", "Completed", "Cancelled"],
    []
  );

  const hasActiveFilters = useMemo(() => {
    return Boolean(q || (status && status !== "All") || dateFrom || dateTo);
  }, [q, status, dateFrom, dateTo]);

  const fetchList = async ({ soft = false } = {}) => {
    if (soft) setRefreshing(true);
    else setLoading(true);

    try {
      // Generic params to match most APIs
      const params = {
        page,
        limit,
        q: q || undefined,
        status: status !== "All" ? status : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: sortBy || undefined,
        sort_dir: sortDir || undefined,
      };

      const res = await salesOrdersApi.list(params);

      // Support common response shapes
      const data = res?.data ?? {};
      const items = data?.items ?? data?.data ?? data?.orders ?? [];
      const m = data?.meta ?? data?.pagination ?? data ?? {};

      const normalized = Array.isArray(items) ? items.map(normalizeRow) : [];
      setRows(normalized);

      const nextMeta = {
        page: Number(m.page ?? m.current_page ?? page ?? 1),
        limit: Number(m.limit ?? m.per_page ?? limit),
        total: Number(m.total ?? m.total_items ?? normalized.length),
        totalPages: Number(m.totalPages ?? m.total_pages ?? m.last_page ?? 1),
      };
      setMeta(nextMeta);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load Sales Orders.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setRows([]);
      setMeta({ page: 1, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, sortBy, sortDir]);

  // debounce search + date range
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchList({ soft: true });
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, dateFrom, dateTo]);

  const toggleSort = (key) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setQ("");
    setStatus("All");
    setDateFrom("");
    setDateTo("");
    setSortBy("order_date");
    setSortDir("desc");
    setPage(1);
  };

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(meta.totalPages || 1, p + 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Sales Orders</h1>
            <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">
              PCB Manufacturing ERP
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Track SO intake for engineering, routing, production scheduling, and dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList({ soft: true })} disabled={refreshing}>
            <RefreshCw className={cx("h-4 w-4", refreshing ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
            <Link to="/dashboard/sales/orders/create">
              <Plus className="h-4 w-4" />
              New Sales Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-[#dc2551]" />
            Filters
          </CardTitle>
          <CardDescription className="text-sm">
            Search by SO number, customer name, or status. Filter by order date range.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="SO number / Customer / Keyword..."
                className="pl-9"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
            >
              {statusChips.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-gray-100 text-gray-700">
                Page {meta.page} / {meta.totalPages || 1}
              </Badge>
              <Badge className="rounded-full bg-gray-100 text-gray-700">
                Total: {meta.total || rows.length}
              </Badge>
              {hasActiveFilters ? (
                <Badge className="rounded-full bg-amber-50 text-amber-800">Filters active</Badge>
              ) : (
                <Badge className="rounded-full bg-emerald-50 text-emerald-700">All orders</Badge>
              )}
            </div>

            {hasActiveFilters ? (
              <Button variant="outline" className="gap-2" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-[#dc2551]" />
            Orders List
          </CardTitle>
          <CardDescription className="text-sm">
            Click an order to view details. Use sort buttons for quick ordering.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table header actions */}
          <div className="flex flex-wrap items-center gap-2 border-b bg-white px-4 py-3 text-sm">
            <span className="text-gray-600">Sort:</span>

            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => toggleSort("order_date")}>
              <CalendarDays className="h-4 w-4" />
              Order Date
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>

            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => toggleSort("order_no")}>
              <FileText className="h-4 w-4" />
              SO No
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>

            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => toggleSort("customer")}>
              <Building2 className="h-4 w-4" />
              Customer
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>

            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => toggleSort("total")}>
              ₹ Total
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>

            <span className="ml-auto text-xs text-gray-500">
              Sorting: <span className="font-medium">{sortBy}</span> ({sortDir})
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading sales orders...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm font-semibold text-gray-900">No Sales Orders found</p>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or create a new Sales Order.</p>
              <div className="mt-4 flex justify-center">
                <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
                  <Link to="/dashboard/sales/orders/create">
                    <Plus className="h-4 w-4" />
                    Create Sales Order
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3">SO No</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{r.orderNo}</div>
                        <div className="text-xs text-gray-500">Priority: {r.priority}</div>
                      </td>

                      <td className="px-4 py-3">{fmtDate(r.orderDate)}</td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.customerName}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getStatusTone(r.status))}>
                          {r.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">{fmtDate(r.requestedDelivery)}</td>

                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ₹ {money(r.grandTotal).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <Link to={`/dashboard/sales/orders/${r.id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && rows.length > 0 ? (
            <div className="flex flex-col gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Showing page <span className="font-medium">{meta.page}</span> of{" "}
                <span className="font-medium">{meta.totalPages || 1}</span>
              </p>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goPrev} disabled={meta.page <= 1}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={goNext} disabled={meta.page >= (meta.totalPages || 1)}>
                  Next
                </Button>

                <Button
                  size="sm"
                  className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                  onClick={() => navigate("/dashboard/sales/orders/create")}
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
