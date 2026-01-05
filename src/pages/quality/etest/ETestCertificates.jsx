// src/pages/quality/certificates/ETestCertificates.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  FileBadge,
  FileSearch,
  FileText,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - E-Test Certificates
 *
 * Typical workflow:
 * - Production completes E-Test (electrical test) on finished panels/PCBs.
 * - Certificates are generated per Work Order / Lot / Batch.
 * - QA approves and releases certificate to customer (downloadable).
 *
 * Recommended backend endpoints:
 * - GET    /quality/certificates/etest?search=&status=&page=&limit=
 * - POST   /quality/certificates/etest   (create / upload)
 *          multipart/form-data or JSON:
 *          fields: wo_no, lot_no, batch_no, customer, part_no, revision,
 *                  test_type, standard, tested_by, approved_by,
 *                  test_date, notes, file(optional)
 * - GET    /quality/certificates/etest/:id
 * - GET    /quality/certificates/etest/:id/download (blob/pdf)
 * - DELETE /quality/certificates/etest/:id
 */
export default function ETestCertificates() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // all|draft|approved|released|failed

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // selection
  const [selected, setSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // create form
  const [file, setFile] = useState(null);
  const [woNo, setWoNo] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [partNo, setPartNo] = useState("");
  const [revision, setRevision] = useState("");
  const [testType, setTestType] = useState("flying-probe"); // flying-probe|fixture|open-short|hi-pot|other
  const [standard, setStandard] = useState("IPC-9252"); // example
  const [testDate, setTestDate] = useState("");
  const [testedBy, setTestedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [notes, setNotes] = useState("");

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

  const statusChip = (s) => {
    const v = String(s || "draft").toLowerCase();
    if (v === "approved")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
        </span>
      );
    if (v === "released")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Released
        </span>
      );
    if (v === "failed")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
          <XCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
        <FileText className="h-3.5 w-3.5" />
        Draft
      </span>
    );
  };

  const testTypeLabel = (t) => {
    const v = String(t || "").toLowerCase();
    if (v === "flying-probe") return "Flying Probe";
    if (v === "fixture") return "Fixture";
    if (v === "open-short") return "Open/Short";
    if (v === "hi-pot") return "Hi-Pot";
    return "Other";
  };

  const mockRows = () => [
    {
      id: "ET-2026-0007",
      woNo: "WO-1452",
      lotNo: "LOT-08",
      batchNo: "B-012",
      customer: "Apex Controls",
      partNo: "PCB-CTRL-02",
      revision: "R3",
      testType: "flying-probe",
      standard: "IPC-9252",
      testDate: "2026-01-04",
      testedBy: "Operator-11",
      approvedBy: "QA-Lead",
      status: "released",
      fileName: "ET-2026-0007.pdf",
      createdAt: "2026-01-04",
    },
    {
      id: "ET-2026-0006",
      woNo: "WO-1448",
      lotNo: "LOT-07",
      batchNo: "B-010",
      customer: "Nova Power",
      partNo: "PCB-PWR-11",
      revision: "R1",
      testType: "fixture",
      standard: "IPC-9252",
      testDate: "2026-01-02",
      testedBy: "Operator-04",
      approvedBy: "QA-01",
      status: "approved",
      fileName: "ET-2026-0006.pdf",
      createdAt: "2026-01-02",
    },
    {
      id: "ET-2025-0139",
      woNo: "WO-1398",
      lotNo: "LOT-22",
      batchNo: "B-201",
      customer: "Vector Instruments",
      partNo: "PCB-SENS-07",
      revision: "R2",
      testType: "open-short",
      standard: "IPC-9252",
      testDate: "2025-12-12",
      testedBy: "Operator-02",
      approvedBy: "",
      status: "draft",
      fileName: "",
      createdAt: "2025-12-12",
    },
  ];

  const fetchList = async (nextPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/certificates/etest", {
        params: {
          search: search || undefined,
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
        title: "Failed to load E-Test certificates",
        description: err?.response?.data?.message || "Using sample data (API not reachable).",
        variant: "destructive",
      });

      const sample = mockRows();
      const q = search.trim().toLowerCase();
      const filtered = sample.filter((r) => {
        const matchesQ =
          !q ||
          [r.id, r.woNo, r.lotNo, r.batchNo, r.customer, r.partNo, r.revision, r.standard, r.testType]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q));
        const matchesStatus = status === "all" ? true : String(r.status).toLowerCase() === status;
        return matchesQ && matchesStatus;
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
  }, [status]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setFile(null);
    setWoNo("");
    setLotNo("");
    setBatchNo("");
    setCustomer("");
    setPartNo("");
    setRevision("");
    setTestType("flying-probe");
    setStandard("IPC-9252");
    setTestDate("");
    setTestedBy("");
    setApprovedBy("");
    setNotes("");
    setCreateOpen(true);
  };

  const openPreview = async (row) => {
    setSelected(row);
    setPreviewUrl("");
    setPreviewOpen(true);

    const id = row?.id ?? row?._id;
    if (!id) return;

    // Try preview endpoint first
    try {
      const res = await api.get(`/quality/certificates/etest/${id}/preview`);
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
      // ignore
    }

    // fallback to blob download
    try {
      const res = await api.get(`/quality/certificates/etest/${id}/download`, { responseType: "blob" });
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

  const downloadCert = async (row) => {
    const id = row?.id ?? row?._id;
    if (!id) return;

    setExporting(true);
    try {
      const res = await api.get(`/quality/certificates/etest/${id}/download`, { responseType: "blob" });
      const contentType = res.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([res.data], { type: contentType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = row?.fileName || `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Downloaded", description: "Certificate downloaded." });
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
      await api.delete(`/quality/certificates/etest/${id}`);
      toast({ title: "Deleted", description: "E-Test certificate removed." });
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

  const submitCreate = async () => {
    if (!woNo.trim()) {
      toast({ title: "WO No required", description: "Please enter Work Order number.", variant: "destructive" });
      return;
    }
    if (!partNo.trim()) {
      toast({ title: "Part No required", description: "Please enter Part number.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const hasFile = !!file;

      if (hasFile) {
        const form = new FormData();
        form.append("file", file);
        form.append("wo_no", woNo.trim());
        if (lotNo.trim()) form.append("lot_no", lotNo.trim());
        if (batchNo.trim()) form.append("batch_no", batchNo.trim());
        if (customer.trim()) form.append("customer", customer.trim());
        form.append("part_no", partNo.trim());
        if (revision.trim()) form.append("revision", revision.trim());
        form.append("test_type", testType);
        if (standard.trim()) form.append("standard", standard.trim());
        if (testDate) form.append("test_date", testDate);
        if (testedBy.trim()) form.append("tested_by", testedBy.trim());
        if (approvedBy.trim()) form.append("approved_by", approvedBy.trim());
        if (notes.trim()) form.append("notes", notes.trim());

        await api.post("/quality/certificates/etest", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/quality/certificates/etest", {
          wo_no: woNo.trim(),
          lot_no: lotNo.trim() || undefined,
          batch_no: batchNo.trim() || undefined,
          customer: customer.trim() || undefined,
          part_no: partNo.trim(),
          revision: revision.trim() || undefined,
          test_type: testType,
          standard: standard.trim() || undefined,
          test_date: testDate || undefined,
          tested_by: testedBy.trim() || undefined,
          approved_by: approvedBy.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }

      toast({ title: "Saved", description: "E-Test certificate created." });
      setCreateOpen(false);
      fetchList(1);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Create endpoint not available (sample mode).",
        variant: "destructive",
      });
      setCreateOpen(false);
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">E-Test Certificates</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">Certificates</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Manage electrical test certificates for Work Orders / Lots / Batches and release them to customers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(1)} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Certificate
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Search & Filter</CardTitle>
          <CardDescription className="text-xs">Search by WO, customer, part, batch and filter by status.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div className="space-y-2 lg:col-span-3">
            <Label>Search</Label>
            <div className="relative">
              <FileSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="WO / Lot / Batch / Customer / Part / Cert No…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2 lg:col-span-1">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="failed">Failed</option>
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

      {/* Table */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Certificates</CardTitle>
          <CardDescription className="text-xs">Preview, download and manage E-Test certificates.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Certificate</th>
                  <th className="px-4 py-3 text-left">WO / Lot / Batch</th>
                  <th className="px-4 py-3 text-left">Customer / Part</th>
                  <th className="px-4 py-3 text-left">Test</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading certificates…" : "No E-Test certificates found."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id ?? r._id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dc2551]/10">
                            <FileBadge className="h-4 w-4 text-[#dc2551]" />
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">{r.id || "—"}</div>
                            <div className="mt-0.5 text-xs text-gray-500">{r.fileName || "No file attached"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900">
                          <span className="font-medium">{r.woNo || r.wo_no || "—"}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.lotNo || r.lot_no ? `Lot: ${r.lotNo || r.lot_no}` : "Lot: —"} •{" "}
                          {r.batchNo || r.batch_no ? `Batch: ${r.batchNo || r.batch_no}` : "Batch: —"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.customer || "—"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.partNo || r.part_no || "—"} {r.revision || r.rev ? `• Rev ${r.revision || r.rev}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{testTypeLabel(r.testType || r.test_type)}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.standard || "—"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900">{fmtDate(r.testDate || r.test_date)}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.testedBy || r.tested_by ? `By: ${r.testedBy || r.tested_by}` : "By: —"}
                          {r.approvedBy || r.approved_by ? ` • Approved: ${r.approvedBy || r.approved_by}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3">{statusChip(r.status)}</td>

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
                            onClick={() => downloadCert(r)}
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
                  ))
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

      {/* Create dialog */}
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileBadge className="h-5 w-5 text-[#dc2551]" />
              New E-Test Certificate
            </AlertDialogTitle>
            <AlertDialogDescription>
              Create a certificate for a Work Order / Lot / Batch. Attach a PDF if available.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Attach Certificate (optional)</Label>
              <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-gray-500">Recommended: upload a PDF generated by the test machine/LIMS.</p>
            </div>

            <div className="space-y-2">
              <Label>WO No *</Label>
              <Input value={woNo} onChange={(e) => setWoNo(e.target.value)} placeholder="e.g., WO-1452" />
            </div>

            <div className="space-y-2">
              <Label>Lot No</Label>
              <Input value={lotNo} onChange={(e) => setLotNo(e.target.value)} placeholder="e.g., LOT-08" />
            </div>

            <div className="space-y-2">
              <Label>Batch No</Label>
              <Input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="e.g., B-012" />
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
            </div>

            <div className="space-y-2">
              <Label>Part No *</Label>
              <Input value={partNo} onChange={(e) => setPartNo(e.target.value)} placeholder="e.g., PCB-CTRL-02" />
            </div>

            <div className="space-y-2">
              <Label>Revision</Label>
              <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="e.g., R3" />
            </div>

            <div className="space-y-2">
              <Label>Test Type</Label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="flying-probe">Flying Probe</option>
                <option value="fixture">Fixture</option>
                <option value="open-short">Open/Short</option>
                <option value="hi-pot">Hi-Pot</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Standard</Label>
              <Input value={standard} onChange={(e) => setStandard(e.target.value)} placeholder="e.g., IPC-9252" />
            </div>

            <div className="space-y-2">
              <Label>Test Date</Label>
              <Input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Tested By</Label>
              <Input value={testedBy} onChange={(e) => setTestedBy(e.target.value)} placeholder="Operator / User" />
            </div>

            <div className="space-y-2">
              <Label>Approved By</Label>
              <Input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} placeholder="QA Approver" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any remarks / deviations / machine id..." />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Release Control</div>
                  Only <span className="font-medium">Approved/Released</span> certificates should be shared to customers.
                  You can enforce this rule on the backend.
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitCreate} disabled={uploading} className="bg-[#dc2551] hover:bg-[#b02045]">
              {uploading ? "Saving…" : "Save"}
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
              {selected?.id ? (
                <>
                  <span className="font-medium">{selected.id}</span> • {selected?.woNo || selected?.wo_no || "WO"}
                </>
              ) : (
                "Preview certificate"
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
              className="bg-[#dc2551] hover:bg-[#b02045]"
              onClick={() => selected && downloadCert(selected)}
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
              Delete Certificate
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">{selected?.id || "this certificate"}</span>?
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
