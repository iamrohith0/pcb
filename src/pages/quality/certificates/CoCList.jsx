// src/pages/quality/certificates/CoCList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
  ready: { label: "Ready", className: "bg-blue-50 text-blue-700 border-blue-200" },
  sent: { label: "Sent", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
};

function fmtDate(value) {
  if (!value) return "—";
  const raw = String(value);
  return raw.includes("T") ? raw.split("T")[0] : raw;
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-gray-700">
      <span>{label}</span>
      <button
        type="button"
        className="rounded-full p-0.5 hover:bg-gray-100"
        onClick={onRemove}
        aria-label="Remove filter"
      >
        <XCircle className="h-4 w-4 text-gray-500" />
      </button>
    </span>
  );
}

export default function CoCList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [jobNo, setJobNo] = useState(searchParams.get("jobNo") || "");
  const [customer, setCustomer] = useState(searchParams.get("customer") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");

  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "created_at");
  const [sortDir, setSortDir] = useState(searchParams.get("sortDir") || "desc");

  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const pageSize = Number(searchParams.get("pageSize") || 10);

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // quick action loading states
  const [sendingId, setSendingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const activeChips = useMemo(() => {
    const chips = [];
    if (q) chips.push({ key: "q", label: `Search: ${q}` });
    if (status !== "all") chips.push({ key: "status", label: `Status: ${STATUS_META[status]?.label || status}` });
    if (jobNo) chips.push({ key: "jobNo", label: `Job: ${jobNo}` });
    if (customer) chips.push({ key: "customer", label: `Customer: ${customer}` });
    if (dateFrom) chips.push({ key: "from", label: `From: ${dateFrom}` });
    if (dateTo) chips.push({ key: "to", label: `To: ${dateTo}` });
    return chips;
  }, [q, status, jobNo, customer, dateFrom, dateTo]);

  const syncParams = () => {
    const next = {};
    if (q) next.q = q;
    if (status !== "all") next.status = status;
    if (jobNo) next.jobNo = jobNo;
    if (customer) next.customer = customer;
    if (dateFrom) next.from = dateFrom;
    if (dateTo) next.to = dateTo;

    if (sortBy) next.sortBy = sortBy;
    if (sortDir) next.sortDir = sortDir;

    if (page && page !== 1) next.page = String(page);
    if (pageSize && pageSize !== 10) next.pageSize = String(pageSize);

    setSearchParams(next, { replace: true });
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      // Suggested endpoint (adjust to your backend):
      // GET /quality/certificates/coc?q=&status=&job_no=&customer=&from=&to=&sort_by=&sort_dir=&page=&page_size=
      const res = await api.get("/quality/certificates/coc", {
        params: {
          q: q || undefined,
          status: status !== "all" ? status : undefined,
          job_no: jobNo || undefined,
          customer: customer || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
          sort_by: sortBy || undefined,
          sort_dir: sortDir || undefined,
          page,
          page_size: pageSize,
        },
      });

      const data = res?.data;
      const items = data?.items || data?.data || data || [];
      const m = data?.meta || {};

      setRows(Array.isArray(items) ? items : []);
      setMeta({
        page: Number(m.page || page),
        pageSize: Number(m.pageSize || m.per_page || pageSize),
        total: Number(m.total || m.total_count || 0),
        totalPages: Number(m.totalPages || m.last_page || 1),
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load CoC list.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, jobNo, customer, dateFrom, dateTo, sortBy, sortDir, page]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const clearFilterKey = (key) => {
    if (key === "q") setQ("");
    if (key === "status") setStatus("all");
    if (key === "jobNo") setJobNo("");
    if (key === "customer") setCustomer("");
    if (key === "from") setDateFrom("");
    if (key === "to") setDateTo("");
    setPage(1);
  };

  const clearAll = () => {
    setQ("");
    setStatus("all");
    setJobNo("");
    setCustomer("");
    setDateFrom("");
    setDateTo("");
    setSortBy("created_at");
    setSortDir("desc");
    setPage(1);
  };

  const toggleSort = (key) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir("asc");
      setPage(1);
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const copyText = async (text, title = "Copied") => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      toast({ title, description: "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      // DELETE /quality/certificates/coc/:id
      await api.delete(`/quality/certificates/coc/${deleteId}`);
      toast({ title: "CoC deleted", description: "The record has been removed." });
      setDeleteOpen(false);
      setDeleteId(null);
      fetchList();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to delete CoC.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (row) => {
    const id = row.id ?? row._id ?? row.coc_id;
    if (!id) return;

    setDownloadingId(id);
    try {
      // Suggested endpoint: GET /quality/certificates/coc/:id/download  (returns file or signed URL)
      const res = await api.get(`/quality/certificates/coc/${id}/download`);

      // Supports: { url } or a direct file blob in real implementation.
      const url = res?.data?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        toast({ title: "Download started", description: "Opening CoC PDF in a new tab." });
      } else {
        toast({
          title: "Download not available",
          description: "Your API did not return a download URL. Implement /download endpoint.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to download CoC.";
      toast({ title: "Download failed", description: msg, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSend = async (row) => {
    const id = row.id ?? row._id ?? row.coc_id;
    if (!id) return;

    setSendingId(id);
    try {
      // Suggested endpoint: POST /quality/certificates/coc/:id/send
      await api.post(`/quality/certificates/coc/${id}/send`);
      toast({ title: "Sent", description: "CoC has been sent to the customer." });
      fetchList();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send CoC.";
      toast({ title: "Send failed", description: msg, variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };

  const rangeLabel = useMemo(() => {
    const start = (meta.page - 1) * meta.pageSize + 1;
    const end = Math.min(meta.page * meta.pageSize, meta.total || 0);
    if (!meta.total) return "0 results";
    return `${start}-${end} of ${meta.total}`;
  }, [meta.page, meta.pageSize, meta.total]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Certificates of Conformance (CoC)</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Generate, review, and send CoC documents for PCB shipments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={fetchList} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => navigate("/quality/certificates/coc/create")}>
            <Plus className="h-4 w-4" />
            New CoC
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="CoC No, job, part, invoice..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.keys(STATUS_META).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_META[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Job No</Label>
              <Input
                value={jobNo}
                onChange={(e) => {
                  setJobNo(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g., JB-240912-001"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Input
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  setPage(1);
                }}
                placeholder="Customer name"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date from</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date to</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" className="gap-2" onClick={clearAll}>
                <ArrowUpDown className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {activeChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.map((c) => (
                <Chip key={c.key} label={c.label} onRemove={() => clearFilterKey(c.key)} />
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-[#dc2551] hover:underline"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </span>
            ) : (
              <span>{rangeLabel}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toggleSort("created_at")}
              title="Sort by created date"
            >
              <ArrowUpDown className="h-4 w-4" />
              Created
              {sortBy === "created_at" ? <span className="text-xs">({sortDir})</span> : null}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toggleSort("ship_date")}
              title="Sort by ship date"
            >
              <ArrowUpDown className="h-4 w-4" />
              Ship
              {sortBy === "ship_date" ? <span className="text-xs">({sortDir})</span> : null}
            </Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">CoC</th>
                <th className="px-4 py-3 text-left font-semibold">Job / Part</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Ship Date</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-600">
                    No CoC records found.
                    <div className="mt-3">
                      <Button className="gap-2" onClick={() => navigate("/quality/certificates/coc/create")}>
                        <Plus className="h-4 w-4" />
                        Create CoC
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {rows.map((r) => {
                const id = r.id ?? r._id ?? r.coc_id;
                const cocNo = r.coc_no || (id ? `COC-${id}` : "—");
                const statusMeta = STATUS_META[r.status] || null;

                const job = r.job_no || r.work_order_no || r.order_no || "—";
                const part = r.part_no || r.customer_part_no || "—";
                const customerName = r.customer_name || r.customer || "—";

                const shipDate = r.ship_date || r.dispatch_date || r.invoice_date;

                const canSend = r.status !== "sent" && r.status !== "cancelled";
                const canDownload = r.status !== "draft";

                return (
                  <tr key={String(id)} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(cocNo, "CoC copied")}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-gray-700 hover:bg-gray-100"
                          title="Copy CoC No."
                        >
                          {cocNo}
                          <Copy className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                      </div>
                      {r.invoice_no ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Invoice: <span className="font-mono">{safe(r.invoice_no)}</span>
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        Job: <span className="font-mono">{safe(job)}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Part: <span className="font-mono">{safe(part)}</span>
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-gray-900">{safe(customerName)}</p>
                      {r.customer_code ? <p className="text-xs text-gray-500">{safe(r.customer_code)}</p> : null}
                    </td>

                    <td className="px-4 py-3">
                      {statusMeta ? (
                        <Badge variant="outline" className={cx("border", statusMeta.className)}>
                          {statusMeta.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          {safe(r.status)}
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">{fmtDate(shipDate)}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/quality/certificates/coc/${id}`)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/quality/certificates/coc/${id}/edit`)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={!canDownload || downloadingId === id}
                          onClick={() => handleDownload(r)}
                          title={canDownload ? "Download PDF" : "Not available for Draft"}
                        >
                          {downloadingId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          Download
                        </Button>

                        <Button
                          size="sm"
                          className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                          disabled={!canSend || sendingId === id}
                          onClick={() => handleSend(r)}
                          title="Send to customer"
                        >
                          {sendingId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Send
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => openDelete(id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-2 border-t bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Page <span className="font-medium text-gray-800">{meta.page}</span> of{" "}
            <span className="font-medium text-gray-800">{meta.totalPages}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete CoC?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the CoC record. This action cannot be undone.
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
