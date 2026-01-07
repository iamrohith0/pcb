// src/pages/quality/certificates/ComplianceDocs.jsx
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    CheckCircle2,
    ClipboardCheck,
    Download,
    Eye,
    FileCheck2,
    Files,
    FileText,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UploadCloud,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - Compliance Documents
 *
 * What this screen covers:
 * - Upload & manage compliance docs: RoHS, REACH, Conflict Minerals, ISO certs, UL, etc.
 * - Link docs to customers, products, materials, or orders (backend-driven)
 * - Download / preview / delete
 *
 * Recommended backend endpoints:
 * - GET    /quality/certificates/compliance-docs?search=&type=&status=&page=&limit=
 * - POST   /quality/certificates/compliance-docs   (multipart/form-data)
 *          fields: file, title, doc_type, standard?, valid_from?, valid_to?, scope?, customer_id?, material_id?, product_id?, notes?
 * - GET    /quality/certificates/compliance-docs/:id
 * - GET    /quality/certificates/compliance-docs/:id/download  (blob)
 * - GET    /quality/certificates/compliance-docs/:id/preview   (url or blob)
 * - DELETE /quality/certificates/compliance-docs/:id
 *
 * Notes:
 * - Works with API; falls back to sample data when API is unavailable.
 */
export default function ComplianceDocs() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // filters
  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState("all"); // all|rohs|reach|cmrt|iso|ul|other
  const [status, setStatus] = useState("all"); // all|valid|expired|expiring

  // dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // selection
  const [selected, setSelected] = useState(null);

  // upload form
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("rohs");
  const [standard, setStandard] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [scope, setScope] = useState("company"); // company|customer|material|product|order
  const [scopeRef, setScopeRef] = useState(""); // id or code
  const [notes, setNotes] = useState("");

  // preview data
  const [previewUrl, setPreviewUrl] = useState("");

  const totalPages = useMemo(() => {
    const t = Number(meta?.total || 0);
    const l = Number(meta?.limit || 10);
    return Math.max(1, Math.ceil(t / l));
  }, [meta]);

  const normalizeList = (payload) => {
    const root = payload?.data ?? payload ?? {};
    const items = root.items ?? root.rows ?? root.data ?? (Array.isArray(root) ? root : []);
    const page = root.page ?? root.meta?.page ?? 1;
    const limit = root.limit ?? root.meta?.limit ?? 10;
    const total = root.total ?? root.meta?.total ?? items?.length ?? 0;
    return {
      items: Array.isArray(items) ? items : [],
      meta: { page: Number(page), limit: Number(limit), total: Number(total) },
    };
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const daysUntil = (d) => {
    if (!d) return null;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return null;
    const diff = Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const computeStatus = (row) => {
    const left = daysUntil(row?.validTo);
    if (left == null) return "valid";
    if (left < 0) return "expired";
    if (left <= 30) return "expiring";
    return "valid";
  };

  const statusChip = (row) => {
    const s = row?.status || computeStatus(row);
    if (s === "valid")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Valid
        </span>
      );
    if (s === "expiring")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Expiring
        </span>
      );
    if (s === "expired")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
          <FileCheck2 className="h-3.5 w-3.5" />
          Expired
        </span>
      );
    return <Badge variant="outline">Unknown</Badge>;
  };

  const typeLabel = (t) => {
    const v = String(t || "").toLowerCase();
    if (v === "rohs") return "RoHS";
    if (v === "reach") return "REACH";
    if (v === "cmrt") return "CMRT";
    if (v === "iso") return "ISO";
    if (v === "ul") return "UL";
    return "Other";
  };

  const mockRows = () => [
    {
      id: "DOC-ROHS-001",
      title: "RoHS Declaration - Materials Set A",
      docType: "rohs",
      standard: "RoHS 3 (EU 2015/863)",
      scope: "material",
      scopeRef: "MAT-ENIG-CHEM-01",
      validFrom: "2025-01-01",
      validTo: "2026-01-31",
      fileName: "rohs_declaration_set_a.pdf",
      createdAt: "2025-11-18",
    },
    {
      id: "DOC-ISO-003",
      title: "ISO 9001 Certificate",
      docType: "iso",
      standard: "ISO 9001:2015",
      scope: "company",
      scopeRef: "PCBxpress Plant 1",
      validFrom: "2024-06-01",
      validTo: "2026-05-31",
      fileName: "iso_9001_certificate.pdf",
      createdAt: "2025-06-01",
    },
    {
      id: "DOC-REACH-002",
      title: "REACH SVHC Statement (Quarterly)",
      docType: "reach",
      standard: "REACH (EC) No 1907/2006",
      scope: "company",
      scopeRef: "PCBxpress",
      validFrom: "2025-10-01",
      validTo: "2025-12-31",
      fileName: "reach_svhc_statement_q4.pdf",
      createdAt: "2025-10-02",
    },
  ];

  const fetchList = async (nextPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/certificates/compliance-docs", {
        params: {
          search: search || undefined,
          type: docType === "all" ? undefined : docType,
          status: status === "all" ? undefined : status,
          page: nextPage,
          limit: meta.limit,
        },
      });

      const { items, meta: m } = normalizeList(res?.data);
      setRows(items);
      setMeta((prev) => ({ ...prev, ...m }));
    } catch (err) {
      toast({
        title: "Failed to load compliance docs",
        description: err?.response?.data?.message || "Using sample data (API not reachable).",
        variant: "destructive",
      });

      const sample = mockRows();
      const q = search.trim().toLowerCase();

      const filtered = sample
        .map((r) => ({ ...r, status: computeStatus(r) }))
        .filter((r) => {
          const matchesQ =
            !q ||
            [r.id, r.title, r.standard, r.scope, r.scopeRef, r.fileName]
              .filter(Boolean)
              .some((x) => String(x).toLowerCase().includes(q));

          const matchesType = docType === "all" ? true : String(r.docType).toLowerCase() === docType;
          const st = r.status || computeStatus(r);
          const matchesStatus = status === "all" ? true : st === status;
          return matchesQ && matchesType && matchesStatus;
        });

      setRows(filtered);
      setMeta((prev) => ({ ...prev, page: 1, total: filtered.length }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, status]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const resetUploadForm = () => {
    setFile(null);
    setTitle("");
    setType("rohs");
    setStandard("");
    setValidFrom("");
    setValidTo("");
    setScope("company");
    setScopeRef("");
    setNotes("");
  };

  const openUpload = () => {
    resetUploadForm();
    setUploadOpen(true);
  };

  const openPreview = async (row) => {
    setSelected(row);
    setPreviewUrl("");
    setPreviewOpen(true);

    const id = row?.id ?? row?._id;
    if (!id) return;

    try {
      // Try preview endpoint first (might return URL)
      const res = await api.get(`/quality/certificates/compliance-docs/${id}/preview`);
      const data = res?.data?.data ?? res?.data;
      if (typeof data?.url === "string") {
        setPreviewUrl(data.url);
        return;
      }
      if (typeof data === "string") {
        setPreviewUrl(data);
        return;
      }
    } catch {
      // ignore, we can still try blob download to preview
    }

    // fallback to downloading blob then preview
    try {
      const res = await api.get(`/quality/certificates/compliance-docs/${id}/download`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      toast({
        title: "Preview unavailable",
        description: err?.response?.data?.message || "Preview endpoint not available.",
        variant: "destructive",
      });
      setPreviewOpen(false);
    }
  };

  const downloadDoc = async (row) => {
    const id = row?.id ?? row?._id;
    if (!id) return;

    setExporting(true);
    try {
      const res = await api.get(`/quality/certificates/compliance-docs/${id}/download`, { responseType: "blob" });
      const contentType = res.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([res.data], { type: contentType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = row?.fileName || row?.title || `${id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Downloaded", description: "Document downloaded." });
    } catch (err) {
      toast({
        title: "Download failed",
        description: err?.response?.data?.message || "Download endpoint not available.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const requestDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    const id = selected?.id ?? selected?._id;
    if (!id) return;

    try {
      await api.delete(`/quality/certificates/compliance-docs/${id}`);
      toast({ title: "Deleted", description: "Compliance document removed." });
      setDeleteOpen(false);
      fetchList(meta.page);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Delete endpoint not available.",
        variant: "destructive",
      });
      setDeleteOpen(false);
    }
  };

  const submitUpload = async () => {
    if (!file) {
      toast({ title: "File required", description: "Please choose a document file to upload.", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter a document title.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title.trim());
      form.append("doc_type", type);
      if (standard.trim()) form.append("standard", standard.trim());
      if (validFrom) form.append("valid_from", validFrom);
      if (validTo) form.append("valid_to", validTo);
      form.append("scope", scope);
      if (scopeRef.trim()) form.append("scope_ref", scopeRef.trim());
      if (notes.trim()) form.append("notes", notes.trim());

      await api.post("/quality/certificates/compliance-docs", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({ title: "Uploaded", description: "Compliance document uploaded successfully." });
      setUploadOpen(false);
      fetchList(1);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err?.response?.data?.message || "Upload endpoint not available (sample mode).",
        variant: "destructive",
      });
      setUploadOpen(false);
      // in sample mode, just refresh current list
      fetchList(1);
    } finally {
      setUploading(false);
    }
  };

  const pageFrom = (meta.page - 1) * meta.limit + 1;
  const pageTo = (meta.page - 1) * meta.limit + rows.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <ShieldCheck className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Compliance Docs</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">Certificates</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Central repository for RoHS / REACH / CMRT / ISO / UL and customer compliance documents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(1)} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={openUpload}>
            <UploadCloud className="h-4 w-4" />
            Upload Doc
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Search & Filter</CardTitle>
          <CardDescription className="text-xs">Filter by type and validity status.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title / Standard / Scope / Ref…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Doc Type</Label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="rohs">RoHS</option>
              <option value="reach">REACH</option>
              <option value="cmrt">CMRT</option>
              <option value="iso">ISO</option>
              <option value="ul">UL</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring (≤ 30 days)</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="lg:col-span-2 mt-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>
              Showing <span className="font-medium text-gray-900">{rows.length ? `${pageFrom}-${pageTo}` : 0}</span> of{" "}
              <span className="font-medium text-gray-900">{meta.total || rows.length}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className={cx("h-2 w-2 rounded-full", loading ? "bg-amber-500" : "bg-emerald-500")} />
              {loading ? "Loading…" : "Ready"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Documents</CardTitle>
          <CardDescription className="text-xs">Preview, download, and manage compliance documents.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Doc</th>
                  <th className="px-4 py-3 text-left">Type / Standard</th>
                  <th className="px-4 py-3 text-left">Scope</th>
                  <th className="px-4 py-3 text-left">Validity</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading documents…" : "No compliance documents found."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const st = r.status || computeStatus(r);
                    const ttl = daysUntil(r.validTo);
                    return (
                      <tr key={r.id ?? r._id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dc2551]/10">
                              <FileText className="h-4 w-4 text-[#dc2551]" />
                            </span>
                            <div>
                              <div className="font-medium text-gray-900">{r.title || "-"}</div>
                              <div className="mt-0.5 text-xs text-gray-500">
                                <span className="font-medium">{r.id || "—"}</span>
                                {r.fileName ? <span className="ml-2">• {r.fileName}</span> : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{typeLabel(r.docType)}</div>
                          <div className="mt-0.5 text-xs text-gray-500">{r.standard || "—"}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{String(r.scope || "—").toUpperCase()}</div>
                          <div className="mt-0.5 text-xs text-gray-500">{r.scopeRef || "—"}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-gray-900">
                            {fmtDate(r.validFrom)} <span className="text-gray-400">→</span> {fmtDate(r.validTo)}
                          </div>
                          {typeof ttl === "number" ? (
                            <div className="mt-0.5 text-xs text-gray-500">
                              {ttl < 0 ? `Expired ${Math.abs(ttl)}d ago` : `In ${ttl}d`}
                            </div>
                          ) : (
                            <div className="mt-0.5 text-xs text-gray-500">—</div>
                          )}
                        </td>

                        <td className="px-4 py-3">{statusChip({ ...r, status: st })}</td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openPreview(r)}>
                              <Eye className="h-4 w-4" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => downloadDoc(r)}
                              disabled={exporting}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-rose-700 hover:text-rose-700"
                              onClick={() => requestDelete(r)}
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

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-900">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.max(1, meta.page - 1))}
                disabled={loading || meta.page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.min(totalPages, meta.page + 1))}
                disabled={loading || meta.page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload dialog */}
      <AlertDialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#dc2551]" />
              Upload Compliance Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload compliance docs and link them to a scope (company/customer/material/product/order).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>File</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500">Allowed: PDF, images, Word, Excel.</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., RoHS Declaration - Set A" />
            </div>

            <div className="space-y-2">
              <Label>Doc Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="rohs">RoHS</option>
                <option value="reach">REACH</option>
                <option value="cmrt">CMRT</option>
                <option value="iso">ISO</option>
                <option value="ul">UL</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Standard (optional)</Label>
              <Input value={standard} onChange={(e) => setStandard(e.target.value)} placeholder="e.g., ISO 9001:2015" />
            </div>

            <div className="space-y-2">
              <Label>Valid From</Label>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Valid To</Label>
              <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="company">Company</option>
                <option value="customer">Customer</option>
                <option value="material">Material</option>
                <option value="product">Product</option>
                <option value="order">Order</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Scope Ref (optional)</Label>
              <Input
                value={scopeRef}
                onChange={(e) => setScopeRef(e.target.value)}
                placeholder="Customer ID / Material Code / SKU / SO No…"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes / supplier reference…" />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Files className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Best practice</div>
                  Keep ISO/UL as <span className="font-medium">Company</span> scope, RoHS/REACH as{" "}
                  <span className="font-medium">Material/Product</span> scope, and customer declarations as{" "}
                  <span className="font-medium">Customer</span> scope.
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitUpload} disabled={uploading} className="bg-cyan-600 hover:bg-cyan-500">
              {uploading ? "Uploading…" : "Upload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview dialog */}
      <AlertDialog
        open={previewOpen}
        onOpenChange={(o) => {
          setPreviewOpen(o);
          if (!o && previewUrl?.startsWith("blob:")) {
            try {
              window.URL.revokeObjectURL(previewUrl);
            } catch {}
          }
        }}
      >
        <AlertDialogContent className="max-w-5xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#dc2551]" />
              Preview
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.title ? (
                <>
                  <span className="font-medium">{selected.title}</span> • {typeLabel(selected.docType)}
                </>
              ) : (
                "Preview document"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-gray-200 bg-white p-2">
            {previewUrl ? (
              <iframe title="preview" src={previewUrl} className="h-[70vh] w-full rounded-lg" />
            ) : (
              <div className="grid h-[70vh] place-items-center text-sm text-gray-500">Loading preview…</div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              className="bg-cyan-600 hover:bg-cyan-500"
              onClick={() => selected && downloadDoc(selected)}
              disabled={exporting}
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">{selected?.title || "this document"}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
