// src/pages/quality/ncr/NCRDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  ClipboardList,
  FileDown,
  Image as ImageIcon,
  Link2,
  Paperclip,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

import ncrService from "@/services/quality/ncr.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  open: { label: "Open", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  under_review: { label: "Under Review", className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  dispositioned: { label: "Dispositioned", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  closed: { label: "Closed", className: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  rejected: { label: "Rejected", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

const SEVERITY_META = {
  minor: { label: "Minor", className: "bg-gray-100 text-gray-700" },
  major: { label: "Major", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  critical: { label: "Critical", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

function Pill({ children, className }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm text-gray-900">{value ?? "—"}</div>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function NCRDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [row, setRow] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({
    status: "",
    severity: "",
    disposition: "",
    root_cause: "",
    corrective_action: "",
    preventive_action: "",
    containment_action: "",
    due_date: "",
    owner_id: "",
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  const canEdit = true; // You can wire permission checks later (role-based)

  const statusPill = useMemo(() => {
    const meta = STATUS_META[row?.status] || { label: row?.status || "—", className: "bg-gray-100 text-gray-700" };
    return (
      <Pill className={meta.className}>
        <ShieldCheck className="h-4 w-4" />
        {meta.label}
      </Pill>
    );
  }, [row?.status]);

  const severityPill = useMemo(() => {
    const meta =
      SEVERITY_META[row?.severity] || { label: row?.severity || "—", className: "bg-gray-100 text-gray-700" };
    return (
      <Pill className={meta.className}>
        <AlertTriangle className="h-4 w-4" />
        {meta.label}
      </Pill>
    );
  }, [row?.severity]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      /**
       * Expected backend shape:
       * { data: {
       *   id, ncr_no, status, severity, source, issue_type,
       *   job_no, work_order_no, customer_name,
       *   part_no, revision, layer_count, qty, uom,
       *   detected_at, created_at, updated_at,
       *   detected_by, owner, department,
       *   defect_code, defect_area, defect_desc,
       *   disposition, root_cause, corrective_action, preventive_action, containment_action,
       *   due_date, closed_at,
       *   attachments: [{ id, name, url, mime, size }],
       *   links: { inspection_id, aoi_result_id, etest_id, capa_id }
       * } }
       */
      const res = await ncrService.get(id);
      const payload = res?.data ?? res;
      const data = payload?.data || payload;

      setRow(data || null);

      setEdit({
        status: data?.status || "open",
        severity: data?.severity || "minor",
        disposition: data?.disposition || "",
        root_cause: data?.root_cause || "",
        corrective_action: data?.corrective_action || "",
        preventive_action: data?.preventive_action || "",
        containment_action: data?.containment_action || "",
        due_date: data?.due_date ? String(data.due_date).slice(0, 10) : "",
        owner_id: data?.owner_id || "",
      });
    } catch (err) {
      toast({
        title: "Failed to load NCR",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await ncrService.update(id, edit);
      toast({ title: "NCR updated", description: "Changes saved successfully." });
      setEditOpen(false);
      await fetchDetails();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = () => setConfirmDelete(true);
  const confirmDeleteNow = async () => {
    setSaving(true);
    try {
      await ncrService.remove(id);
      toast({ title: "Deleted", description: "NCR removed successfully." });
      navigate("/quality/ncr", { replace: true });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const res = await ncrService.exportPdf(id);
      const blob = res?.data instanceof Blob ? res.data : null;

      if (!blob) {
        toast({
          title: "Download failed",
          description: "Export endpoint did not return a blob. Check backend responseType.",
          variant: "destructive",
        });
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${row?.ncr_no || "NCR"}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "PDF export failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const attachments = row?.attachments || [];
  const links = row?.links || {};

  const quickLinks = [
    links?.inspection_id && { label: "Inspection", to: `/quality/inspections/${links.inspection_id}` },
    links?.aoi_result_id && { label: "AOI Result", to: `/quality/aoi/results/${links.aoi_result_id}` },
    links?.etest_id && { label: "E-Test", to: `/quality/etest/certificates/${links.etest_id}` },
    links?.capa_id && { label: "CAPA", to: `/quality/capa/${links.capa_id}` },
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {row?.ncr_no ? `NCR ${row.ncr_no}` : "NCR Details"}
              </h1>
              {row?.status && statusPill}
              {row?.severity && severityPill}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Non-Conformance Report for PCB manufacturing (defects, disposition, corrective actions, trace links).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchDetails} className="gap-2" disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={downloadPdf} disabled={!row}>
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>

          {canEdit && (
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={() => setEditOpen(true)} disabled={!row}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}

          {canEdit && (
            <Button
              variant="outline"
              className="gap-2 text-rose-700 hover:bg-rose-50"
              onClick={requestDelete}
              disabled={!row}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
          </div>
        </Card>
      ) : !row ? (
        <Card className="p-10 text-center text-sm text-gray-500">NCR not found.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-8">
            {/* Defect Summary */}
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-700 ring-1 ring-rose-100">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Defect Summary</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      Describe the non-conformance observed and where it was detected.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {row?.defect_code ? <Badge variant="secondary">Defect: {row.defect_code}</Badge> : null}
                  {row?.issue_type ? <Badge variant="secondary">{row.issue_type}</Badge> : null}
                  {row?.source ? <Badge variant="secondary">Source: {row.source}</Badge> : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-8">
                  <Field label="Defect Description" value={row?.defect_desc} />
                </div>
                <div className="md:col-span-4">
                  <Field label="Defect Area" value={row?.defect_area} />
                </div>

                <div className="md:col-span-4">
                  <Field label="Detected At" value={formatDate(row?.detected_at)} />
                </div>
                <div className="md:col-span-4">
                  <Field label="Detected By" value={row?.detected_by?.name || row?.detected_by || "—"} />
                </div>
                <div className="md:col-span-4">
                  <Field label="Department" value={row?.department} />
                </div>
              </div>
            </Card>

            {/* Disposition & Actions */}
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-700 ring-1 ring-blue-100">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Disposition & Actions</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      Containment, root cause, corrective & preventive actions.
                    </div>
                  </div>
                </div>

                {row?.due_date ? <Badge variant="secondary">Due: {String(row.due_date).slice(0, 10)}</Badge> : null}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-6">
                  <Field label="Disposition" value={row?.disposition} />
                </div>
                <div className="md:col-span-6">
                  <Field label="Owner" value={row?.owner?.name || row?.owner || "—"} />
                </div>

                <div className="md:col-span-12">
                  <Field label="Containment Action" value={row?.containment_action} />
                </div>
                <div className="md:col-span-12">
                  <Field label="Root Cause" value={row?.root_cause} />
                </div>
                <div className="md:col-span-12">
                  <Field label="Corrective Action" value={row?.corrective_action} />
                </div>
                <div className="md:col-span-12">
                  <Field label="Preventive Action" value={row?.preventive_action} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <Field label="Created" value={formatDate(row?.created_at)} />
                </div>
                <div className="md:col-span-4">
                  <Field label="Updated" value={formatDate(row?.updated_at)} />
                </div>
                <div className="md:col-span-4">
                  <Field label="Closed At" value={formatDate(row?.closed_at)} />
                </div>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-5 lg:col-span-4">
            {/* Job / WO / Customer / Part */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Job Context</div>
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <BadgeCheck className="h-4 w-4" />
                  Trace Ready
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <Field label="Job No" value={row?.job_no} />
                <Field label="Work Order" value={row?.work_order_no} />
                <Field label="Customer" value={row?.customer_name} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Part No" value={row?.part_no} />
                  <Field label="Revision" value={row?.revision} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Layers" value={row?.layer_count} />
                  <Field label="Qty" value={row?.qty} />
                  <Field label="UOM" value={row?.uom} />
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Quick Links</div>
                <Link2 className="h-4 w-4 text-gray-400" />
              </div>

              <div className="mt-3 space-y-2">
                {quickLinks.length === 0 ? (
                  <div className="text-sm text-gray-500">No linked records.</div>
                ) : (
                  quickLinks.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      <span className="font-medium">{l.label}</span>
                      <span className="text-xs text-gray-500">Open</span>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Attachments */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Attachments</div>
                <Paperclip className="h-4 w-4 text-gray-400" />
              </div>

              <div className="mt-3 space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-sm text-gray-500">No files uploaded.</div>
                ) : (
                  attachments.map((a) => {
                    const isImage = String(a?.mime || "").startsWith("image/");
                    return (
                      <a
                        key={a.id || a.url}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          {isImage ? <ImageIcon className="h-4 w-4 text-gray-500" /> : <Paperclip className="h-4 w-4 text-gray-500" />}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-900">{a.name || "Attachment"}</div>
                            <div className="text-xs text-gray-500">{a.size ? `${Math.round(a.size / 1024)} KB` : a.mime || "—"}</div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">Open</span>
                      </a>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit drawer */}
      {editOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => !saving && setEditOpen(false)} />

          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="font-semibold text-gray-900">Edit NCR</div>
              <Button variant="ghost" size="sm" onClick={() => !saving && setEditOpen(false)}>
                ✕
              </Button>
            </div>

            <div className="h-[calc(100%-56px)] overflow-y-auto p-4 space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <Label>Status</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={edit.status}
                      onChange={(e) => setEdit((s) => ({ ...s, status: e.target.value }))}
                      disabled={saving}
                    >
                      <option value="open">Open</option>
                      <option value="under_review">Under Review</option>
                      <option value="dispositioned">Dispositioned</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="md:col-span-6">
                    <Label>Severity</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={edit.severity}
                      onChange={(e) => setEdit((s) => ({ ...s, severity: e.target.value }))}
                      disabled={saving}
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="md:col-span-12">
                    <Label>Disposition</Label>
                    <Input
                      className="mt-1"
                      value={edit.disposition}
                      onChange={(e) => setEdit((s) => ({ ...s, disposition: e.target.value }))}
                      placeholder="e.g., Rework / Scrap / Use As Is / Return to supplier"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-12">
                    <Label>Containment Action</Label>
                    <textarea
                      className="mt-1 min-h-[84px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={edit.containment_action}
                      onChange={(e) => setEdit((s) => ({ ...s, containment_action: e.target.value }))}
                      placeholder="Immediate action to contain issue (hold lot, stop line, segregate...)"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-12">
                    <Label>Root Cause</Label>
                    <textarea
                      className="mt-1 min-h-[84px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={edit.root_cause}
                      onChange={(e) => setEdit((s) => ({ ...s, root_cause: e.target.value }))}
                      placeholder="5-Why / Fishbone root cause summary"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-12">
                    <Label>Corrective Action</Label>
                    <textarea
                      className="mt-1 min-h-[84px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={edit.corrective_action}
                      onChange={(e) => setEdit((s) => ({ ...s, corrective_action: e.target.value }))}
                      placeholder="What will be done to correct this issue?"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-12">
                    <Label>Preventive Action</Label>
                    <textarea
                      className="mt-1 min-h-[84px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={edit.preventive_action}
                      onChange={(e) => setEdit((s) => ({ ...s, preventive_action: e.target.value }))}
                      placeholder="What will prevent recurrence (process change, training, poka-yoke)?"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-6">
                    <Label>Due Date</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      value={edit.due_date}
                      onChange={(e) => setEdit((s) => ({ ...s, due_date: e.target.value }))}
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-6">
                    <Label>Owner (User ID)</Label>
                    <Input
                      className="mt-1"
                      value={edit.owner_id}
                      onChange={(e) => setEdit((s) => ({ ...s, owner_id: e.target.value }))}
                      placeholder="e.g., 12"
                      disabled={saving}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      If you have a users dropdown later, replace this input with a Select.
                    </div>
                  </div>
                </div>
              </Card>

              <div className="sticky bottom-0 border-t bg-white/90 backdrop-blur p-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button className="bg-[#dc2551] hover:bg-[#b02045]" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete NCR?"
        description="This will permanently delete this NCR record. This cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteNow}
      />
    </div>
  );
}
