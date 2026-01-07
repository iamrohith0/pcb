// src/pages/quality/capa/CAPAList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

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
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const SOURCE_LABEL = {
  ncr: "NCR",
  aoi: "AOI",
  etest: "E-Test",
  incoming_qc: "Incoming QC",
  inprocess_qc: "In-Process QC",
  final_qc: "Final QC",
  customer_complaint: "Customer Complaint",
  audit: "Internal/External Audit",
};

const SEVERITY_META = {
  low: { label: "Low", className: "bg-gray-100 text-gray-700 border-gray-200" },
  medium: { label: "Medium", className: "bg-blue-50 text-blue-700 border-blue-200" },
  high: { label: "High", className: "bg-amber-50 text-amber-800 border-amber-200" },
  critical: { label: "Critical", className: "bg-red-50 text-red-700 border-red-200" },
};

const STATUS_META = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
  open: { label: "Open", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-800 border-amber-200" },
  verified: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
};

function fmtDate(value) {
  if (!value) return "—";
  const raw = String(value);
  return raw.includes("T") ? raw.split("T")[0] : raw;
}

function safeText(v) {
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

export default function CAPAList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();

  // Table state
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(false);

  // Filters/UI
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [severity, setSeverity] = useState(searchParams.get("severity") || "all");
  const [sourceType, setSourceType] = useState(searchParams.get("source") || "all");
  const [owner, setOwner] = useState(searchParams.get("owner") || "");
  const [dueFrom, setDueFrom] = useState(searchParams.get("dueFrom") || "");
  const [dueTo, setDueTo] = useState(searchParams.get("dueTo") || "");

  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "created_at");
  const [sortDir, setSortDir] = useState(searchParams.get("sortDir") || "desc");

  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const pageSize = Number(searchParams.get("pageSize") || 10);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const activeChips = useMemo(() => {
    const chips = [];
    if (q) chips.push({ key: "q", label: `Search: ${q}` });
    if (status !== "all") chips.push({ key: "status", label: `Status: ${STATUS_META[status]?.label || status}` });
    if (severity !== "all") chips.push({ key: "severity", label: `Severity: ${SEVERITY_META[severity]?.label || severity}` });
    if (sourceType !== "all") chips.push({ key: "source", label: `Source: ${SOURCE_LABEL[sourceType] || sourceType}` });
    if (owner) chips.push({ key: "owner", label: `Owner: ${owner}` });
    if (dueFrom) chips.push({ key: "dueFrom", label: `Due from: ${dueFrom}` });
    if (dueTo) chips.push({ key: "dueTo", label: `Due to: ${dueTo}` });
    return chips;
  }, [q, status, severity, sourceType, owner, dueFrom, dueTo]);

  const syncParams = () => {
    const next = {};
    if (q) next.q = q;
    if (status !== "all") next.status = status;
    if (severity !== "all") next.severity = severity;
    if (sourceType !== "all") next.source = sourceType;
    if (owner) next.owner = owner;
    if (dueFrom) next.dueFrom = dueFrom;
    if (dueTo) next.dueTo = dueTo;

    if (sortBy) next.sortBy = sortBy;
    if (sortDir) next.sortDir = sortDir;

    if (page && page !== 1) next.page = String(page);
    if (pageSize && pageSize !== 10) next.pageSize = String(pageSize);

    setSearchParams(next, { replace: true });
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      // Recommended endpoint (adjust to your backend):
      // GET /quality/capa?q=&status=&severity=&source_type=&owner=&due_from=&due_to=&sort_by=&sort_dir=&page=&page_size=
      const res = await api.get("/quality/capa", {
        params: {
          q: q || undefined,
          status: status !== "all" ? status : undefined,
          severity: severity !== "all" ? severity : undefined,
          source_type: sourceType !== "all" ? sourceType : undefined,
          owner: owner || undefined,
          due_from: dueFrom || undefined,
          due_to: dueTo || undefined,
          sort_by: sortBy || undefined,
          sort_dir: sortDir || undefined,
          page,
          page_size: pageSize,
        },
      });

      const data = res?.data;

      // Supports two common shapes:
      // 1) { items: [...], meta: { page, pageSize, total, totalPages } }
      // 2) { data: [...], meta: ... }  (laravel-like)
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
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load CAPA list.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // keep URL in sync whenever these change
    syncParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, severity, sourceType, owner, dueFrom, dueTo, sortBy, sortDir, page]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const clearFilterKey = (key) => {
    if (key === "q") setQ("");
    if (key === "status") setStatus("all");
    if (key === "severity") setSeverity("all");
    if (key === "source") setSourceType("all");
    if (key === "owner") setOwner("");
    if (key === "dueFrom") setDueFrom("");
    if (key === "dueTo") setDueTo("");
    setPage(1);
  };

  const clearAll = () => {
    setQ("");
    setStatus("all");
    setSeverity("all");
    setSourceType("all");
    setOwner("");
    setDueFrom("");
    setDueTo("");
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

  const handleCopy = async (text, title = "Copied") => {
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
      // DELETE /quality/capa/:id
      await api.delete(`/quality/capa/${deleteId}`);
      toast({ title: "CAPA deleted", description: "The record has been removed." });
      setDeleteOpen(false);
      setDeleteId(null);
      fetchList();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete CAPA.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
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
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">CAPA</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Corrective & Preventive Actions for PCB manufacturing quality control
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={fetchList} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => navigate("/quality/capa/create")}>
            <Plus className="h-4 w-4" />
            New CAPA
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
                  placeholder="CAPA No, title, part no, job no..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                {Object.keys(STATUS_META).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_META[k].label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                {Object.keys(SEVERITY_META).map((k) => (
                  <option key={k} value={k}>
                    {SEVERITY_META[k].label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select
                value={sourceType}
                onChange={(e) => {
                  setSourceType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Input
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setPage(1);
                }}
                placeholder="Owner name / department"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Due from</Label>
              <Input
                type="date"
                value={dueFrom}
                onChange={(e) => {
                  setDueFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Due to</Label>
              <Input
                type="date"
                value={dueTo}
                onChange={(e) => {
                  setDueTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={clearAll}
                disabled={loading && rows.length === 0}
              >
                <Filter className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Active filter chips */}
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
              onClick={() => toggleSort("due_date")}
              title="Sort by due date"
            >
              <ArrowUpDown className="h-4 w-4" />
              Due
              {sortBy === "due_date" ? <span className="text-xs">({sortDir})</span> : null}
            </Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">CAPA</th>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Source</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Severity</th>
                <th className="px-4 py-3 text-left font-semibold">Due</th>
                <th className="px-4 py-3 text-left font-semibold">Owner</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-600">
                    No CAPA records found.
                    <div className="mt-3">
                      <Button className="gap-2" onClick={() => navigate("/quality/capa/create")}>
                        <Plus className="h-4 w-4" />
                        Create CAPA
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {rows.map((r) => {
                const id = r.id ?? r._id ?? r.capa_id;
                const capaNo = r.capa_no || (id ? `CAPA-${id}` : "—");
                const statusMeta = STATUS_META[r.status] || null;
                const severityMeta = SEVERITY_META[r.severity] || null;

                const title = r.title || r.problem_title || r.problem_statement || "—";
                const ownerName = r.owner_name || r.owner || r.assigned_to || "—";
                const source = SOURCE_LABEL[r.source_type] || r.source_type || "—";

                return (
                  <tr key={String(id)} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(capaNo, "CAPA copied")}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-gray-700 hover:bg-gray-100"
                          title="Copy CAPA No."
                        >
                          {capaNo}
                          <Copy className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                      </div>
                      {r.reference_no ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Ref: <span className="font-mono">{r.reference_no}</span>
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <p className="max-w-[420px] truncate font-medium text-gray-900">{safeText(title)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Part: <span className="font-mono">{safeText(r.part_no)}</span>{" "}
                        {r.job_no ? (
                          <>
                            · Job: <span className="font-mono">{safeText(r.job_no)}</span>
                          </>
                        ) : null}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-gray-200 text-gray-700">
                        {source}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {statusMeta ? (
                        <Badge variant="outline" className={cx("border", statusMeta.className)}>
                          {statusMeta.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          {safeText(r.status)}
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {severityMeta ? (
                        <Badge variant="outline" className={cx("border", severityMeta.className)}>
                          {severityMeta.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          {safeText(r.severity)}
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">{fmtDate(r.due_date)}</td>

                    <td className="px-4 py-3">
                      <p className="text-gray-900">{safeText(ownerName)}</p>
                      {r.owner_department ? (
                        <p className="text-xs text-gray-500">{safeText(r.owner_department)}</p>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/quality/capa/${id}`)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/quality/capa/${id}/edit`)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
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
            <AlertDialogTitle>Delete CAPA?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the CAPA record. This action cannot be undone.
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
