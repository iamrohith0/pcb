// src/pages/sales/quotations/QuotationList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  ClipboardList,
  Eye,
  FileText,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import quotationsService from "@/services/sales/quotations.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const INR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function safeDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "—";
  }
}

function normalizeRow(q) {
  const id = q?.id || q?._id;
  const quoteNo = q?.quoteNo || q?.number || q?.quotationNo || "—";
  const customerName = q?.customer?.name || q?.customerName || q?.companyName || "—";
  const quoteDate = q?.quoteDate || q?.date || q?.createdAt;
  const validUntil = q?.validUntil || q?.expiryDate;
  const status = q?.status || "Draft";
  const grandTotal = q?.totals?.grandTotal ?? q?.grandTotal ?? q?.amount ?? 0;
  const layerCount = q?.pcb?.layerCount ?? q?.pcbSpec?.layerCount ?? q?.spec?.layerCount ?? null;
  const finish = q?.pcb?.surfaceFinish ?? q?.pcbSpec?.surfaceFinish ?? q?.spec?.surfaceFinish ?? "";
  return {
    id,
    quoteNo,
    customerName,
    quoteDate,
    validUntil,
    status,
    grandTotal,
    layerCount,
    finish,
    raw: q,
  };
}

const STATUS_BADGE = {
  Draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  Sent: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  Approved: "bg-green-50 text-green-700 hover:bg-green-50",
  Rejected: "bg-red-50 text-red-700 hover:bg-red-50",
  Expired: "bg-amber-50 text-amber-800 hover:bg-amber-50",
};

export default function QuotationList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Filters / UI
  const [query, setQuery] = useState(sp.get("q") || "");
  const [status, setStatus] = useState(sp.get("status") || "all");
  const [sort, setSort] = useState(sp.get("sort") || "date_desc"); // date_desc, date_asc, total_desc, total_asc

  const page = Number(sp.get("page") || 1);
  const limit = Number(sp.get("limit") || 10);

  const syncSearchParams = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "" || v === "all") next.delete(k);
      else next.set(k, String(v));
    });
    setSp(next, { replace: true });
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      // Expected API: list({ page, limit, q, status, sort })
      const res = await quotationsService.list({ page, limit, q: query.trim(), status, sort });
      const data = res?.data?.data ?? res?.data ?? {};
      const items = data?.items || data?.data || data?.rows || data || [];
      const list = Array.isArray(items) ? items : [];

      const mapped = list.map(normalizeRow);
      setRows(mapped);

      const nextMeta = data?.meta || data?.pagination || {};
      setMeta({
        page: nextMeta.page ?? page,
        limit: nextMeta.limit ?? limit,
        total: nextMeta.total ?? list.length,
        pages: nextMeta.pages ?? Math.max(1, Math.ceil((nextMeta.total ?? list.length) / (nextMeta.limit ?? limit))),
      });
    } catch (err) {
      toast({
        title: "Failed to load",
        description: err?.response?.data?.message || "Unable to load quotations.",
        variant: "destructive",
      });
      setRows([]);
      setMeta({ page, limit, total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sp.get("q"), sp.get("status"), sp.get("sort")]);

  // Keep local UI in sync when URL changes
  useEffect(() => setQuery(sp.get("q") || ""), [sp]);
  useEffect(() => setStatus(sp.get("status") || "all"), [sp]);
  useEffect(() => setSort(sp.get("sort") || "date_desc"), [sp]);

  const onApplyFilters = (e) => {
    e?.preventDefault?.();
    syncSearchParams({ q: query.trim() || null, status: status === "all" ? null : status, sort, page: 1 });
  };

  const onReset = () => {
    setQuery("");
    setStatus("all");
    setSort("date_desc");
    syncSearchParams({ q: null, status: null, sort: null, page: 1 });
  };

  const canPrev = page > 1;
  const canNext = page < (meta.pages || 1);

  const goPage = (p) => syncSearchParams({ page: p });

  const sortLabel = useMemo(() => {
    switch (sort) {
      case "date_asc":
        return "Date (Oldest)";
      case "total_desc":
        return "Total (High → Low)";
      case "total_asc":
        return "Total (Low → High)";
      default:
        return "Date (Newest)";
    }
  }, [sort]);

  const handleDelete = async (id) => {
    if (!id) return;
    const ok = window.confirm("Delete this quotation? This action cannot be undone.");
    if (!ok) return;

    setBusyId(id);
    try {
      await quotationsService.remove(id);
      toast({ title: "Deleted", description: "Quotation removed successfully." });
      fetchList();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete quotation.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">Sales</Badge>
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Quotations</Badge>
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">PCBXpress</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">Quotation List</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage RFQ quotations, pricing, and customer approvals for PCB manufacturing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchList} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>

          <Button className="bg-[#dc2551] hover:bg-[#B02045]" asChild>
            <Link to="/dashboard/sales/quotations/create">
              <Plus className="mr-2 h-4 w-4" />
              New Quotation
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="inline-flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            Filters
          </CardTitle>
          <CardDescription>Search and sort quotations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onApplyFilters} className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Quote no, customer, RFQ, finish, layers…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="all">All</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">Sort</label>
              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="date_desc">Date (Newest)</option>
                  <option value="date_asc">Date (Oldest)</option>
                  <option value="total_desc">Total (High → Low)</option>
                  <option value="total_asc">Total (Low → High)</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center gap-2">
              <Button type="submit" className="bg-[#dc2551] hover:bg-[#B02045]">
                Apply
              </Button>
              <Button type="button" variant="outline" onClick={onReset}>
                Reset
              </Button>

              <div className="ml-auto text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-800">{rows.length}</span> item(s) • Sort:{" "}
                <span className="font-semibold text-gray-800">{sortLabel}</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="inline-flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-600" />
            Quotations
          </CardTitle>
          <CardDescription>Click a quotation to view details or edit.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="grid place-items-center py-16">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading quotations…
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-900">No quotations found</p>
              <p className="mt-1 text-sm text-gray-600">Try adjusting filters or create a new quotation.</p>
              <div className="mt-4">
                <Button className="bg-[#dc2551] hover:bg-[#B02045]" asChild>
                  <Link to="/dashboard/sales/quotations/create">
                    <Plus className="mr-2 h-4 w-4" />
                    New Quotation
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Quotation</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">PCB</th>
                    <th className="px-4 py-3">Quote Date</th>
                    <th className="px-4 py-3">Valid Until</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <Link className="font-semibold text-gray-900 hover:underline" to={`/dashboard/sales/quotations/${r.id}`}>
                            {safeStr(r.quoteNo)}
                          </Link>
                          <span className="text-xs text-gray-500">ID: {safeStr(r.id).slice(0, 10)}…</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{safeStr(r.customerName)}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {r.layerCount ? (
                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">{r.layerCount}L</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">—</Badge>
                          )}
                          {r.finish ? (
                            <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">{safeStr(r.finish)}</Badge>
                          ) : (
                            <span className="text-xs text-gray-500">Finish: —</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">{safeDate(r.quoteDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{safeDate(r.validUntil)}</td>

                      <td className="px-4 py-3">
                        <Badge className={cx("border-0", STATUS_BADGE[r.status] || STATUS_BADGE.Draft)}>
                          {safeStr(r.status)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {INR(Number(r.grandTotal) || 0)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/dashboard/sales/quotations/${r.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </Button>

                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/dashboard/sales/quotations/${r.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(r.id)}
                            disabled={busyId === r.id}
                          >
                            {busyId === r.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
          {!loading && rows.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
              <div className="text-xs text-gray-600">
                Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                <span className="font-semibold text-gray-900">{meta.pages || 1}</span> • Total{" "}
                <span className="font-semibold text-gray-900">{meta.total || rows.length}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goPage(page - 1)} disabled={!canPrev}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => goPage(page + 1)} disabled={!canNext}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * EXPECTED SERVICE
 * -------------------------------------------------------
 * src/services/sales/quotations.service.js
 *  - list({ page, limit, q, status, sort })   // GET /sales/quotations
 *  - remove(id)                               // DELETE /sales/quotations/:id
 *
 * ROUTES (example)
 * -------------------------------------------------------
 * /sales/quotations           -> QuotationList.jsx
 * /sales/quotations/create    -> QuotationCreate.jsx
 * /sales/quotations/:id       -> QuotationDetails.jsx
 * /sales/quotations/:id/edit  -> QuotationEdit.jsx
 */
