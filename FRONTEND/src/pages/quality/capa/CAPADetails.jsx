// src/pages/quality/capa/CAPADetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  Copy,
  Edit3,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  UserCircle2,
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

const ROOT_CAUSE_LABEL = {
  "5why": "5 Whys",
  fishbone: "Fishbone (Ishikawa)",
  "8d": "8D",
  other: "Other",
};

function fmtDate(value) {
  if (!value) return "—";
  // handle ISO or YYYY-MM-DD
  const raw = String(value);
  const d = raw.includes("T") ? raw.split("T")[0] : raw;
  return d;
}

function safeText(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function Field({ label, value, mono }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={cx("text-sm text-gray-900", mono && "font-mono")}>{safeText(value)}</p>
    </div>
  );
}

function Block({ title, children, icon: Icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        {Icon ? (
          <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export default function CAPADetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [capa, setCapa] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const severityMeta = useMemo(() => SEVERITY_META[capa?.severity] || null, [capa?.severity]);
  const statusMeta = useMemo(() => STATUS_META[capa?.status] || null, [capa?.status]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // Recommended endpoint (adjust to your backend)
      // GET /quality/capa/:id
      const res = await api.get(`/quality/capa/${id}`);
      setCapa(res?.data || null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load CAPA details.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCopy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      toast({ title: label, description: "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Recommended endpoint (adjust to your backend)
      // DELETE /quality/capa/:id
      await api.delete(`/quality/capa/${id}`);
      toast({ title: "CAPA deleted", description: "The record has been removed." });
      navigate("/quality/capa", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete CAPA.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-6 w-64 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading CAPA details...
          </div>
        </Card>
      </div>
    );
  }

  if (!capa) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-700">CAPA not found.</p>
        <div className="mt-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </Card>
    );
  }

  const refLabel = SOURCE_LABEL[capa.source_type] || safeText(capa.source_type);
  const rootMethodLabel = ROOT_CAUSE_LABEL[capa.root_cause_method] || safeText(capa.root_cause_method);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Link to="/quality/capa" className="hover:text-gray-700 hover:underline">
                CAPA
              </Link>
              <span>/</span>
              <span className="text-gray-700">
                {capa.capa_no || `CAPA-${id}`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-gray-600 hover:text-gray-900"
                onClick={() => handleCopy(capa.capa_no || `CAPA-${id}`, "CAPA No. copied")}
                aria-label="Copy CAPA number"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>

            <h1 className="mt-1 truncate text-xl font-bold text-gray-900">{safeText(capa.title)}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {statusMeta ? (
                <Badge className={cx("border", statusMeta.className)} variant="outline">
                  {statusMeta.label}
                </Badge>
              ) : null}
              {severityMeta ? (
                <Badge className={cx("border", severityMeta.className)} variant="outline">
                  Severity: {severityMeta.label}
                </Badge>
              ) : null}
              <Badge variant="outline" className="border-gray-200 text-gray-700">
                Source: {refLabel}
              </Badge>

              {capa.reference_no ? (
                <button
                  type="button"
                  onClick={() => handleCopy(capa.reference_no, "Reference copied")}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  title="Click to copy reference number"
                >
                  <span className="font-mono">{capa.reference_no}</span>
                  <Copy className="h-3.5 w-3.5 text-gray-500" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate(`/quality/capa/${id}/edit`)}
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick summary */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="CAPA No." value={capa.capa_no || `CAPA-${id}`} mono />
          <Field label="Due Date" value={fmtDate(capa.due_date)} />
          <Field label="Owner" value={capa.owner_name} />
          <Field label="Owner Dept." value={capa.owner_department} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Affected Process" value={capa.affected_process} />
          <Field label="Part No." value={capa.part_no} mono />
          <Field label="Job / Work Order No." value={capa.job_no} mono />
          <Field label="Lot No." value={capa.lot_no} mono />
        </div>
      </Card>

      {/* Problem */}
      <Block title="Problem Definition" icon={FileText}>
        <div className="space-y-3">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Problem Statement</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {safeText(capa.problem_statement)}
            </p>
          </div>
        </div>
      </Block>

      {/* Actions */}
      <Block title="Containment & Actions" icon={ClipboardCheck}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Containment Action</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {safeText(capa.containment_action)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Root Cause Method</p>
            <p className="mt-1 text-sm text-gray-900">{rootMethodLabel}</p>

            <p className="mt-3 text-xs font-medium text-gray-500">Root Cause</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {safeText(capa.root_cause)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Corrective Action</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {safeText(capa.corrective_action)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Preventive Action</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {safeText(capa.preventive_action)}
            </p>
          </div>
        </div>
      </Block>

      {/* Effectiveness */}
      <Block title="Effectiveness & Notes" icon={CalendarClock}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Effectiveness Criteria</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {safeText(capa.effectiveness_criteria)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {safeText(capa.notes)}
            </p>
          </div>
        </div>
      </Block>

      {/* Meta */}
      <Block title="Record Meta" icon={UserCircle2}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Created By" value={capa.created_by_name || capa.created_by || "—"} />
          <Field label="Created At" value={fmtDate(capa.created_at)} />
          <Field label="Last Updated" value={fmtDate(capa.updated_at)} />
          <Field label="Status" value={statusMeta?.label || safeText(capa.status)} />
        </div>
      </Block>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete CAPA?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">{capa.capa_no || `CAPA-${id}`}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cx(
                "bg-red-600 text-white hover:bg-red-700",
                deleting && "pointer-events-none opacity-70"
              )}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
