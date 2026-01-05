// src/pages/quality/inspections/InspectionDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  ArrowLeft,
  BadgeCheck,
  ClipboardCheck,
  Download,
  Edit3,
  FileText,
  Link2,
  Loader2,
  Paperclip,
  Printer,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";

/**
 * InspectionDetails.jsx (PCB Manufacturing ERP)
 *
 * Expected endpoints (adjust to your backend):
 * - GET    /quality/inspections/:id
 * - DELETE /quality/inspections/:id
 * - GET    /quality/inspections/:id/print   (optional)
 * - GET    /quality/inspections/:id/export  (optional)
 *
 * Suggested response shape:
 * {
 *   id,
 *   inspection_no,
 *   inspection_type: { id, name } OR inspection_type_name,
 *   stage,
 *   work_center: { id, name } OR work_center_name,
 *   overall_status: "pass"|"fail"|"pending",
 *   inspected_at,
 *   inspector_name,
 *   work_order: { id, work_order_no },
 *   lot: { id, lot_no },
 *   part_no,
 *   customer_name,
 *   sample_size,
 *   accepted_qty,
 *   rejected_qty,
 *   notes,
 *   checkpoints: [{ name, spec, method, result, status, defect_code, remarks }],
 *   defects: [{ defect_code, qty, remarks }],
 *   attachments: [{ name, url, size_kb }]
 * }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  pass: { label: "Pass", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fail: { label: "Fail", className: "bg-rose-50 text-rose-700 border-rose-200" },
  pending: { label: "Pending", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

function fmtDateTime(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

export default function InspectionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [inspection, setInspection] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchInspection = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quality/inspections/${id}`);
      const data = res?.data?.data ?? res?.data;
      setInspection(data || null);
    } catch (err) {
      console.warn("Failed to load inspection:", err);
      toast({
        title: "Failed to load inspection",
        description: err?.response?.data?.message || "Check endpoint /quality/inspections/:id",
        variant: "destructive",
      });
      setInspection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const statusKey = (inspection?.overall_status || inspection?.status || "pending").toLowerCase();
  const status = STATUS_META[statusKey] || STATUS_META.pending;

  const titleNo =
    inspection?.inspection_no ||
    inspection?.number ||
    inspection?.code ||
    (inspection?.id ? `INS-${inspection.id}` : "Inspection");

  const checkpoints = useMemo(() => safeArray(inspection?.checkpoints), [inspection]);
  const defects = useMemo(() => safeArray(inspection?.defects), [inspection]);
  const attachments = useMemo(() => safeArray(inspection?.attachments), [inspection]);

  const derived = useMemo(() => {
    const sample = Number(inspection?.sample_size ?? 0);
    const acc = Number(inspection?.accepted_qty ?? 0);
    const rej = Number(inspection?.rejected_qty ?? 0);
    const yieldPct = sample > 0 ? Math.round((acc / sample) * 1000) / 10 : 0; // 1 decimal
    const failPoints = checkpoints.filter((c) => (c?.status || "").toLowerCase() === "fail").length;
    const passPoints = checkpoints.filter((c) => (c?.status || "").toLowerCase() === "pass").length;
    return { sample, acc, rej, yieldPct, passPoints, failPoints };
  }, [inspection, checkpoints]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/quality/inspections/${id}`);
      toast({ title: "Inspection deleted", description: "The record has been removed." });
      navigate("/quality/inspections", { replace: true });
    } catch (err) {
      console.warn("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleExport = async () => {
    // Optional if your backend provides it. Safe fallback: open a URL in new tab.
    const url = `/quality/inspections/${id}/export`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePrint = async () => {
    // Optional if your backend provides it. Safe fallback: open a URL in new tab.
    const url = `/quality/inspections/${id}/print`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading inspection...
      </div>
    );
  }

  if (!inspection) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900">Inspection not found</h1>
            <p className="mt-1 text-sm text-gray-500">The record may have been deleted or you don’t have access.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button className="bg-[#dc2551] hover:bg-[#b02045]" asChild>
                <Link to="/quality/inspections">Go to Inspections</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const inspectionTypeName =
    inspection?.inspection_type?.name ||
    inspection?.inspection_type_name ||
    inspection?.type ||
    "-";

  const workCenterName =
    inspection?.work_center?.name ||
    inspection?.work_center_name ||
    inspection?.work_center ||
    "-";

  const workOrderNo =
    inspection?.work_order?.work_order_no ||
    inspection?.work_order_no ||
    inspection?.workOrderNo ||
    "";

  const lotNoVal =
    inspection?.lot?.lot_no ||
    inspection?.lot_no ||
    inspection?.lotNo ||
    "";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <ClipboardCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{titleNo}</h1>
              <Badge variant="outline" className={cx("border", status.className)}>
                <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                {status.label}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                {inspection?.stage || "—"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {inspectionTypeName} • {workCenterName} • Inspected {fmtDateTime(inspection?.inspected_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to={`/quality/inspections/${id}/edit`}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sample</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{derived.sample || 0}</p>
          <p className="mt-1 text-xs text-gray-500">Sampling quantity</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Accepted</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{derived.acc || 0}</p>
          <p className="mt-1 text-xs text-gray-500">OK boards</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{derived.rej || 0}</p>
          <p className="mt-1 text-xs text-gray-500">NG boards</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Yield</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{derived.yieldPct}%</p>
          <p className="mt-1 text-xs text-gray-500">Accepted / Sample</p>
        </Card>
      </div>

      {/* Trace header info */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-900">Trace & Header Info</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Inspector</Label>
            <Input readOnly value={inspection?.inspector_name || "-"} />
          </div>

          <div className="space-y-1.5">
            <Label>Work Order</Label>
            <Input readOnly value={workOrderNo || "-"} />
          </div>

          <div className="space-y-1.5">
            <Label>Lot</Label>
            <Input readOnly value={lotNoVal || "-"} />
          </div>

          <div className="space-y-1.5">
            <Label>Part No</Label>
            <Input readOnly value={inspection?.part_no || "-"} />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label>Customer</Label>
            <Input readOnly value={inspection?.customer_name || "-"} />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label>Notes</Label>
            <Textarea readOnly value={inspection?.notes || ""} placeholder="No notes" />
          </div>
        </div>
      </Card>

      {/* Checkpoints */}
      <Card className="p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Checkpoints</h2>
            <p className="text-xs text-gray-500">
              Pass: <span className="font-semibold text-gray-900">{derived.passPoints}</span> • Fail:{" "}
              <span className="font-semibold text-gray-900">{derived.failPoints}</span>
            </p>
          </div>
          <Badge variant="outline" className={cx("border", status.className)}>
            Overall: {status.label}
          </Badge>
        </div>

        <div className="mt-3 space-y-3">
          {checkpoints.length === 0 ? (
            <p className="text-sm text-gray-500">No checkpoints recorded.</p>
          ) : (
            checkpoints.map((c, idx) => {
              const sKey = (c?.status || "pending").toLowerCase();
              const s = STATUS_META[sKey] || STATUS_META.pending;

              return (
                <div key={idx} className="rounded-xl border bg-white p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{c?.name || `Checkpoint #${idx + 1}`}</p>
                        <Badge variant="outline" className={cx("border", s.className)}>
                          {s.label}
                        </Badge>
                        {c?.defect_code ? (
                          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                            Defect: {c.defect_code}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Spec</p>
                          <p className="mt-0.5 text-sm text-gray-800">{c?.spec || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Method</p>
                          <p className="mt-0.5 text-sm text-gray-800">{c?.method || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Result</p>
                          <p className="mt-0.5 text-sm text-gray-800">{c?.result || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Remarks</p>
                          <p className="mt-0.5 text-sm text-gray-800">{c?.remarks || "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* quick action to NCR/CAPA (optional links) */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(sKey === "fail" || (c?.defect_code && inspection?.rejected_qty > 0)) ? (
                        <>
                          <Button
                            variant="outline"
                            className="gap-2"
                            asChild
                          >
                            <Link to="/quality/ncr/create" state={{ fromInspectionId: inspection?.id, defect_code: c?.defect_code }}>
                              <Link2 className="h-4 w-4" />
                              Raise NCR
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            asChild
                          >
                            <Link to="/quality/capa/create" state={{ fromInspectionId: inspection?.id, defect_code: c?.defect_code }}>
                              <Link2 className="h-4 w-4" />
                              Start CAPA
                            </Link>
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Defects */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-900">Defects Summary</h2>
        <div className="mt-3 space-y-2">
          {defects.length === 0 ? (
            <p className="text-sm text-gray-500">No defects recorded.</p>
          ) : (
            defects.map((d, idx) => (
              <div key={idx} className="flex flex-col gap-1 rounded-xl border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{d?.defect_code || "—"}</p>
                  <p className="text-xs text-gray-500">{d?.remarks || "No remarks"}</p>
                </div>
                <Badge variant="outline" className="w-fit border-slate-200 bg-white text-slate-700">
                  Qty: {Number(d?.qty ?? 0)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Attachments */}
      <Card className="p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Paperclip className="h-4 w-4 text-gray-600" />
          Attachments
        </h2>

        <div className="mt-3 space-y-2">
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-500">No attachments.</p>
          ) : (
            attachments.map((a, idx) => {
              const name = a?.name || a?.file_name || `Attachment ${idx + 1}`;
              const url = a?.url || a?.download_url || a?.path;
              const size = a?.size_kb ? `${a.size_kb} KB` : a?.size ? `${Math.round(a.size / 1024)} KB` : "";

              return (
                <div key={idx} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{size || "—"}</p>
                  </div>

                  {url ? (
                    <Button variant="outline" className="gap-2" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
                      <FileText className="h-4 w-4" />
                      Open
                    </Button>
                  ) : (
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                      No URL
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Delete confirm */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete inspection?"
        description={
          <>
            This will permanently delete <span className="font-medium text-gray-900">{titleNo}</span>. This action cannot be
            undone.
          </>
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
