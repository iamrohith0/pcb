// src/pages/sales/rfq/RFQList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Calendar,
  Layers,
  Boxes,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import rfqApi from "@/services/rfq.service";
import ConfirmationDialog from "@/components/ConfirmationDialog.jsx";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return dateStr;
  }
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeListPayload(data) {
  // supports { rfqs: [] } or { data: [] } or direct array
  const list = data?.rfqs ?? data?.data ?? data ?? [];
  return safeArr(list).map((r) => ({
    id: r.id ?? r._id ?? r.rfq_id ?? "",
    rfqNo: r.rfq_no ?? r.rfqNo ?? r.number ?? "",
    rfqDate: r.rfq_date ?? r.rfqDate ?? r.date ?? "",
    status: r.status ?? "Open",
    priority: r.priority ?? "Normal",
    customerName: r.customer?.name ?? r.customer_name ?? r.customerName ?? "",
    contactName: r.contact_name ?? r.contactName ?? "",
    currency: r.currency ?? "INR",
    totalQty: Number(r.total_qty ?? r.totalQty ?? r.qty_total ?? 0),
    linesCount: Number(r.lines_count ?? r.linesCount ?? r.items_count ?? r.lines?.length ?? 0),
    maxLayers: Number(r.max_layers ?? r.maxLayers ?? r.layers_max ?? 0),
  }));
}

const STATUS_BADGE = {
  Open: "bg-blue-50 text-blue-700",
  Quoted: "bg-amber-50 text-amber-700",
  Closed: "bg-gray-100 text-gray-700",
  Cancelled: "bg-red-50 text-red-700",
};

export default function RFQList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");

  // Data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = async (mode = "load") => {
    mode === "refresh" ? setRefreshing(true) : setLoading(true);
    try {
      const params = {};
      if (q?.trim()) params.q = q.trim();
      if (status !== "all") params.status = status;

      const res = await rfqApi.list(params);
      const normalized = normalizeListPayload(res?.data);
      setRows(normalized);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load RFQs.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      mode === "refresh" ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    fetchList("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep URL in sync
  useEffect(() => {
    const next = {};
    if (q?.trim()) next.q = q.trim();
    if (status !== "all") next.status = status;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  const filteredRows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && (r.status || "").toLowerCase() !== status.toLowerCase()) return false;
      if (!qq) return true;
      const hay = [
        r.rfqNo,
        r.customerName,
        r.contactName,
        r.status,
        r.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q, status]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const open = filteredRows.filter((r) => (r.status || "").toLowerCase() === "open").length;
    const quoted = filteredRows.filter((r) => (r.status || "").toLowerCase() === "quoted").length;
    const totalQty = filteredRows.reduce((s, r) => s + Number(r.totalQty || 0), 0);
    return { total, open, quoted, totalQty };
  }, [filteredRows]);

  const openDelete = (row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await rfqApi.remove(deleteTarget.id);
      toast({ title: "Deleted", description: `RFQ ${deleteTarget.rfqNo || ""} deleted.` });
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchList("refresh");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete RFQ.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-3">
            <FileText className="h-6 w-6 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">RFQs</h1>
              <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">Sales → RFQ</Badge>
            </div>
            <p className="text-sm text-gray-500">Track customer requirements and PCB quotations pipeline.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList("refresh")} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/sales/rfq/create">
              <Plus className="h-4 w-4" />
              New RFQ
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total</CardTitle>
            <CardDescription>RFQs</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open</CardTitle>
            <CardDescription>In progress</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.open}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quoted</CardTitle>
            <CardDescription>Sent to customer</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.quoted}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Qty</CardTitle>
            <CardDescription>Across filtered</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalQty}</CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Search & Filters</CardTitle>
            <CardDescription>Find RFQs quickly</CardDescription>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Filter className="h-4 w-4" />
            Filters affect table + stats
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search RFQ No, customer, contact, status…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === "all" ? "default" : "outline"}
                className={cx("w-full", status === "all" ? "bg-[#dc2551] hover:bg-[#b02045]" : "")}
                onClick={() => setStatus("all")}
              >
                All
              </Button>
              <Button type="button" variant={status === "Open" ? "default" : "outline"} className="w-full" onClick={() => setStatus("Open")}>
                Open
              </Button>
              <Button type="button" variant={status === "Quoted" ? "default" : "outline"} className="w-full" onClick={() => setStatus("Quoted")}>
                Quoted
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">RFQ List</CardTitle>
          <CardDescription>Click an RFQ to view details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid place-items-center rounded-2xl border bg-white p-10">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading…
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gray-100">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <p className="font-semibold text-gray-900">No RFQs found</p>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or create a new RFQ.</p>
              <div className="mt-4 flex justify-center">
                <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
                  <Link to="/sales/rfq/create">
                    <Plus className="h-4 w-4" />
                    New RFQ
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">RFQ</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Specs</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-white shadow-sm ring-1 ring-inset ring-gray-200"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10">
                            <FileText className="h-4 w-4 text-[#dc2551]" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{r.rfqNo || "—"}</div>
                            <div className="text-xs text-gray-500">{r.priority}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{r.customerName || "—"}</div>
                            <div className="text-xs text-gray-500">{r.contactName || ""}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(r.rfqDate)}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            <Layers className="h-3.5 w-3.5" />
                            {r.maxLayers ? `${r.maxLayers}L` : "—"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            <FileText className="h-3.5 w-3.5" />
                            {r.linesCount ? `${r.linesCount} lines` : "—"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            <Boxes className="h-3.5 w-3.5" />
                            {Number.isFinite(r.totalQty) ? `${r.totalQty} qty` : "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <Badge className={cx("rounded-full", STATUS_BADGE[r.status] || "bg-gray-100 text-gray-700")}>
                          {r.status || "—"}
                        </Badge>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => navigate(`/sales/rfq/${r.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => navigate(`/sales/rfq/${r.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(r)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete RFQ?"
        description={
          deleteTarget
            ? `This will permanently delete RFQ ${deleteTarget.rfqNo || ""}. This action cannot be undone.`
            : "This will permanently delete the selected RFQ."
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
