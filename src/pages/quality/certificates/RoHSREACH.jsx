// src/pages/quality/certificates/RoHSREACH.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    CalendarDays,
    CheckCircle2,
    Copy,
    Download,
    FileBadge2,
    FileText,
    Loader2,
    RefreshCcw,
    Save,
    Search,
    Send,
    ShieldCheck,
    Trash2
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DOC_STATUS = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
  ready: { label: "Ready", className: "bg-blue-50 text-blue-700 border-blue-200" },
  sent: { label: "Sent", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { label: "Archived", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

function fmtDate(value) {
  if (!value) return "";
  const raw = String(value);
  return raw.includes("T") ? raw.split("T")[0] : raw;
}

function safe(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

async function copyToClipboard(text, toast) {
  try {
    await navigator.clipboard.writeText(String(text || ""));
    toast({ title: "Copied", description: "Copied to clipboard." });
  } catch {
    toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
  }
}

/**
 * RoHS + REACH compliance declaration generator for PCBXpress
 *
 * Suggested endpoints (adjust to your backend):
 * - GET    /quality/certificates/rohs-reach/template
 * - POST   /quality/certificates/rohs-reach/generate   { job_no, customer, part_no, order_no }
 * - POST   /quality/certificates/rohs-reach/save       { ...doc }
 * - POST   /quality/certificates/rohs-reach/:id/send
 * - GET    /quality/certificates/rohs-reach/:id/download
 * - DELETE /quality/certificates/rohs-reach/:id
 */
export default function RoHSREACH() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [params, setParams] = useSearchParams();

  // Search/generate inputs
  const [jobNo, setJobNo] = useState(params.get("jobNo") || "");
  const [orderNo, setOrderNo] = useState(params.get("orderNo") || "");
  const [customer, setCustomer] = useState(params.get("customer") || "");
  const [partNo, setPartNo] = useState(params.get("partNo") || "");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Document model
  const [doc, setDoc] = useState({
    id: null,
    doc_no: "",
    status: "draft",
    issue_date: fmtDate(new Date().toISOString()),
    revision: "A",
    customer_name: "",
    customer_code: "",
    customer_address: "",
    job_no: "",
    order_no: "",
    part_no: "",
    description: "Printed Circuit Board Assembly / Bare PCB",
    applicable_standards: "RoHS Directive (EU) 2011/65/EU (as amended) and REACH Regulation (EC) No 1907/2006.",
    declaration_text:
      "We hereby declare that the products supplied under the above reference comply with the requirements of the RoHS Directive and the REACH regulation. No restricted substances are intentionally added beyond permissible limits, and any SVHCs (if present) are communicated as per regulatory requirements.",
    notes:
      "This declaration is based on information provided by raw material suppliers and internal process controls. This document is issued electronically and is valid without signature unless otherwise required by customer contract.",
    issuer_company: "PCBXpress",
    issuer_address: "Plant Address, City, State, India",
    issuer_contact: "quality@pcbxpress.example",
    signatory_name: "Quality Manager",
    signatory_title: "Quality Assurance",
  });

  const statusMeta = DOC_STATUS[doc.status] || DOC_STATUS.draft;

  const canDownload = doc.status !== "draft" && Boolean(doc.id);
  const canSend = (doc.status === "ready" || doc.status === "draft") && Boolean(doc.id);

  const syncParams = () => {
    const next = {};
    if (jobNo) next.jobNo = jobNo;
    if (orderNo) next.orderNo = orderNo;
    if (customer) next.customer = customer;
    if (partNo) next.partNo = partNo;
    setParams(next, { replace: true });
  };

  useEffect(() => {
    syncParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobNo, orderNo, customer, partNo]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const res = await api.get("/quality/certificates/rohs-reach/template");
      const tpl = res?.data;
      if (tpl && typeof tpl === "object") {
        setDoc((d) => ({
          ...d,
          ...tpl,
          issue_date: tpl.issue_date ? fmtDate(tpl.issue_date) : d.issue_date,
          status: tpl.status || "draft",
        }));
      }
    } catch (err) {
      // Not critical — template endpoint may not exist yet.
      console.warn("RoHS/REACH template not available:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyInputsToDoc = () => {
    setDoc((d) => ({
      ...d,
      job_no: jobNo || d.job_no,
      order_no: orderNo || d.order_no,
      customer_name: customer || d.customer_name,
      part_no: partNo || d.part_no,
    }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Optional: if you have a backend that resolves job/order -> customer details, address, etc.
      // POST /quality/certificates/rohs-reach/generate
      const res = await api.post("/quality/certificates/rohs-reach/generate", {
        job_no: jobNo || undefined,
        order_no: orderNo || undefined,
        customer: customer || undefined,
        part_no: partNo || undefined,
      });

      const data = res?.data;
      if (data && typeof data === "object") {
        setDoc((d) => ({
          ...d,
          ...data,
          issue_date: data.issue_date ? fmtDate(data.issue_date) : d.issue_date,
          status: data.status || d.status || "draft",
        }));
        toast({ title: "Generated", description: "Draft RoHS/REACH declaration created." });
      } else {
        applyInputsToDoc();
        toast({
          title: "Generated (local)",
          description: "Backend did not return a document payload. Filled fields locally.",
        });
      }
    } catch (err) {
      applyInputsToDoc();
      toast({
        title: "Generated (local)",
        description: "Generate API not available. Filled fields locally—please Save.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // POST /quality/certificates/rohs-reach/save
      const res = await api.post("/quality/certificates/rohs-reach/save", {
        ...doc,
        issue_date: doc.issue_date || undefined,
      });

      const saved = res?.data;
      if (saved && typeof saved === "object") {
        setDoc((d) => ({
          ...d,
          ...saved,
          issue_date: saved.issue_date ? fmtDate(saved.issue_date) : d.issue_date,
          status: saved.status || d.status,
        }));
      }

      toast({ title: "Saved", description: "RoHS/REACH declaration saved successfully." });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save declaration.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReady = () => {
    setDoc((d) => ({ ...d, status: "ready" }));
    toast({ title: "Marked Ready", description: "Document status set to Ready. Save to persist." });
  };

  const handleSend = async () => {
    if (!doc.id) {
      toast({ title: "Not saved yet", description: "Please Save before sending.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      await api.post(`/quality/certificates/rohs-reach/${doc.id}/send`);
      setDoc((d) => ({ ...d, status: "sent" }));
      toast({ title: "Sent", description: "Declaration sent to the customer." });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send declaration.";
      toast({ title: "Send failed", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    if (!doc.id) return;
    setDownloading(true);
    try {
      const res = await api.get(`/quality/certificates/rohs-reach/${doc.id}/download`);
      const url = res?.data?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        toast({ title: "Download started", description: "Opening PDF in a new tab." });
      } else {
        toast({
          title: "Download not available",
          description: "API didn't return a URL. Implement /download endpoint.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to download PDF.";
      toast({ title: "Download failed", description: msg, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const openDelete = () => setDeleteOpen(true);

  const confirmDelete = async () => {
    if (!doc.id) {
      setDeleteOpen(false);
      setDoc((d) => ({ ...d, id: null, doc_no: "", status: "draft" }));
      toast({ title: "Cleared", description: "Draft cleared locally." });
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/quality/certificates/rohs-reach/${doc.id}`);
      toast({ title: "Deleted", description: "Declaration removed." });
      setDeleteOpen(false);
      setDoc((d) => ({ ...d, id: null, doc_no: "", status: "draft" }));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to delete declaration.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    const bits = [];
    if (doc.doc_no) bits.push(doc.doc_no);
    if (doc.job_no) bits.push(`Job ${doc.job_no}`);
    if (doc.order_no) bits.push(`Order ${doc.order_no}`);
    if (doc.part_no) bits.push(`Part ${doc.part_no}`);
    return bits.length ? bits.join(" • ") : "Create a RoHS + REACH compliance declaration for customer shipments";
  }, [doc.doc_no, doc.job_no, doc.order_no, doc.part_no]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">RoHS + REACH Declaration</h1>
            <p className="mt-0.5 text-sm text-gray-500">{headerSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cx("border", statusMeta.className)}>
            {statusMeta.label}
          </Badge>

          <Button variant="outline" className="gap-2" onClick={() => navigate("/quality/certificates")}>
            <FileText className="h-4 w-4" />
            Certificates Home
          </Button>

          <Button variant="ghost" className="gap-2" onClick={loadTemplate} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Reload template
          </Button>
        </div>
      </div>

      {/* Generate from refs */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Job No</Label>
            <Input value={jobNo} onChange={(e) => setJobNo(e.target.value)} placeholder="JB-240912-001" />
          </div>
          <div className="space-y-1.5">
            <Label>Order No</Label>
            <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="SO-240912-044" />
          </div>
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
          </div>
          <div className="space-y-1.5">
            <Label>Part No</Label>
            <Input value={partNo} onChange={(e) => setPartNo(e.target.value)} placeholder="Customer part no" />
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2 pt-1">
            <Button className="gap-2" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBadge2 className="h-4 w-4" />}
              Generate Draft
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(doc.doc_no || doc.job_no || "", toast)}>
              <Copy className="h-4 w-4" />
              Copy Ref
            </Button>

            <Button variant="outline" className="gap-2" onClick={handleMarkReady}>
              <CheckCircle2 className="h-4 w-4" />
              Mark Ready
            </Button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={!canDownload || downloading}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </Button>

              <Button
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                onClick={handleSend}
                disabled={!canSend || sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to Customer
              </Button>

              <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>

              <Button variant="destructive" className="gap-2" onClick={openDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Document */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Declaration Content</h2>
            <div className="text-xs text-gray-500 inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Issue date:
              <span className="font-medium text-gray-800">{doc.issue_date || "—"}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Document No</Label>
              <Input
                value={safe(doc.doc_no)}
                onChange={(e) => setDoc((d) => ({ ...d, doc_no: e.target.value }))}
                placeholder="Auto-generated by backend (optional)"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Input value={safe(doc.status)} readOnly className="bg-gray-50" />
            </div>

            <div className="space-y-1.5">
              <Label>Job No</Label>
              <Input value={safe(doc.job_no)} onChange={(e) => setDoc((d) => ({ ...d, job_no: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Order No</Label>
              <Input value={safe(doc.order_no)} onChange={(e) => setDoc((d) => ({ ...d, order_no: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Part No</Label>
              <Input value={safe(doc.part_no)} onChange={(e) => setDoc((d) => ({ ...d, part_no: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Revision</Label>
              <Input value={safe(doc.revision)} onChange={(e) => setDoc((d) => ({ ...d, revision: e.target.value }))} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Input
                value={safe(doc.description)}
                onChange={(e) => setDoc((d) => ({ ...d, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Applicable Standards</Label>
              <Textarea
                value={safe(doc.applicable_standards)}
                onChange={(e) => setDoc((d) => ({ ...d, applicable_standards: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Declaration Text</Label>
              <Textarea
                value={safe(doc.declaration_text)}
                onChange={(e) => setDoc((d) => ({ ...d, declaration_text: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={safe(doc.notes)}
                onChange={(e) => setDoc((d) => ({ ...d, notes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900">Parties & Sign-off</h2>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Customer Name</Label>
              <Input
                value={safe(doc.customer_name)}
                onChange={(e) => setDoc((d) => ({ ...d, customer_name: e.target.value }))}
                placeholder="Customer"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Customer Code</Label>
              <Input
                value={safe(doc.customer_code)}
                onChange={(e) => setDoc((d) => ({ ...d, customer_code: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Customer Address</Label>
              <Textarea
                value={safe(doc.customer_address)}
                onChange={(e) => setDoc((d) => ({ ...d, customer_address: e.target.value }))}
                rows={3}
                placeholder="Optional"
              />
            </div>

            <div className="mt-2 border-t pt-3" />

            <div className="space-y-1.5">
              <Label>Issuer Company</Label>
              <Input
                value={safe(doc.issuer_company)}
                onChange={(e) => setDoc((d) => ({ ...d, issuer_company: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Issuer Address</Label>
              <Textarea
                value={safe(doc.issuer_address)}
                onChange={(e) => setDoc((d) => ({ ...d, issuer_address: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Issuer Contact</Label>
              <Input
                value={safe(doc.issuer_contact)}
                onChange={(e) => setDoc((d) => ({ ...d, issuer_contact: e.target.value }))}
              />
            </div>

            <div className="mt-2 border-t pt-3" />

            <div className="space-y-1.5">
              <Label>Signatory Name</Label>
              <Input
                value={safe(doc.signatory_name)}
                onChange={(e) => setDoc((d) => ({ ...d, signatory_name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Signatory Title</Label>
              <Input
                value={safe(doc.signatory_title)}
                onChange={(e) => setDoc((d) => ({ ...d, signatory_title: e.target.value }))}
              />
            </div>

            <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Search className="mt-0.5 h-4 w-4 text-gray-500" />
                <p>
                  Tip: Connect <span className="font-medium">Job/Order</span> modules to auto-fill customer & part details, and
                  generate a PDF matching your certificate template.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RoHS/REACH declaration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document record (and PDF if stored). This action cannot be undone.
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
