// src/pages/engineering/cam/CAMJobDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  FileDown,
  FileText,
  Layers,
  Loader2,
  PackageOpen,
  Pencil,
  PlayCircle,
  RefreshCw,
  Send,
  ShieldAlert,
  Tag,
  UserCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog.jsx";

import camJobsApi from "@/services/camJobs.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
}

function normalizeOne(data) {
  const j = data?.job ?? data?.data ?? data ?? {};
  return {
    id: j.id ?? j._id ?? j.cam_job_id ?? "",
    camNo: j.cam_no ?? j.camNo ?? j.number ?? "",
    rfqNo: j.rfq_no ?? j.rfqNo ?? "",
    soNo: j.sales_order_no ?? j.soNo ?? "",
    customerName: j.customer?.name ?? j.customer_name ?? "",
    boardName: j.board_name ?? j.boardName ?? "PCB Job",
    layers: Number(j.layers ?? j.layer_count ?? 0),
    revision: j.revision ?? j.rev ?? "A",
    dueDate: j.due_date ?? j.dueDate ?? "",
    createdAt: j.created_at ?? j.createdAt ?? "",
    status: j.status ?? "Pending",
    priority: j.priority ?? "Normal",
    assignedTo: j.assigned_to?.name ?? j.assignedTo?.name ?? j.assigned_to_name ?? "",
    notes: j.notes ?? "",
    stackup: j.stackup ?? null,
    panelization: j.panelization ?? null,
    files: Array.isArray(j.files) ? j.files : [],
    checkpoints: Array.isArray(j.checkpoints) ? j.checkpoints : [],
    outputs: Array.isArray(j.outputs) ? j.outputs : [],
    timeline: Array.isArray(j.timeline) ? j.timeline : [],
  };
}

const STATUS_STYLE = {
  Pending: "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-50 text-blue-700",
  "Ready for DFM": "bg-amber-50 text-amber-700",
  Released: "bg-emerald-50 text-emerald-700",
  Blocked: "bg-red-50 text-red-700",
};

function EmptyLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-sm text-gray-900">{value || "—"}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-[#dc2551]/10 p-3">
        <Icon className="h-5 w-5 text-[#dc2551]" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function CAMJobDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchJob = async (mode = "load") => {
    mode === "refresh" ? setRefreshing(true) : setLoading(true);
    try {
      const res = await camJobsApi.getById(id);
      setJob(normalizeOne(res?.data));
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load CAM job.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      mode === "refresh" ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const statusBadge = useMemo(() => {
    const s = job?.status || "Pending";
    return (
      <Badge className={cx("rounded-full", STATUS_STYLE[s] || "bg-gray-100 text-gray-700")}>
        {s}
      </Badge>
    );
  }, [job]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await camJobsApi.remove(id);
      toast({ title: "Deleted", description: "CAM job deleted successfully." });
      navigate("/engineering/cam", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete CAM job.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleQuickStatus = async (nextStatus) => {
    try {
      await camJobsApi.update(id, { status: nextStatus });
      toast({ title: "Updated", description: `Status changed to ${nextStatus}.` });
      fetchJob("refresh");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update status.";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    }
  };

  const downloadFile = async (file) => {
    // expects backend to return { url } or direct file response.
    // We'll open url if available.
    try {
      if (file?.url) {
        window.open(file.url, "_blank", "noopener,noreferrer");
        return;
      }
      const res = await camJobsApi.downloadFile(id, file?.id || file?.file_id || file?.key);
      const url = res?.data?.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast({ title: "Download", description: "Download link not available.", variant: "destructive" });
    } catch (err) {
      toast({ title: "Download failed", description: "Unable to download file.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border bg-white p-10">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading CAM Job…
        </div>
      </div>
    );
  }

  if (!job?.id) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gray-100">
          <ShieldAlert className="h-6 w-6 text-gray-600" />
        </div>
        <p className="font-semibold text-gray-900">CAM job not found</p>
        <p className="mt-1 text-sm text-gray-500">The job may have been removed or you don’t have access.</p>
        <div className="mt-4 flex justify-center">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/engineering/cam">
              <ArrowLeft className="h-4 w-4" />
              Back to CAM Jobs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-3">
            <ClipboardList className="h-6 w-6 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                CAM Job {job.camNo ? `— ${job.camNo}` : ""}
              </h1>
              {statusBadge}
              <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">
                {job.priority}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              PCB CAM preparation, outputs, and release tracking
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                <Layers className="h-3.5 w-3.5" />
                {job.layers ? `${job.layers} Layers` : "—"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                <Tag className="h-3.5 w-3.5" />
                Rev {job.revision}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                <Calendar className="h-3.5 w-3.5" />
                Due: {fmtDate(job.dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchJob("refresh")} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/engineering/cam/${job.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => handleQuickStatus("Released")}
          >
            <BadgeCheck className="h-4 w-4" />
            Release
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Job Overview</CardTitle>
            <CardDescription>Customer, order reference, and assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <EmptyLine label="Board / Product" value={job.boardName} />
              <EmptyLine label="Customer" value={job.customerName} />
              <EmptyLine label="RFQ No" value={job.rfqNo} />
              <EmptyLine label="Sales Order No" value={job.soNo} />
              <EmptyLine label="Created At" value={fmtDate(job.createdAt)} />
              <div className="flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3">
                <div className="text-sm font-medium text-gray-700">Assigned To</div>
                <div className="inline-flex items-center gap-2 text-sm text-gray-900">
                  <UserCircle2 className="h-4 w-4 text-gray-400" />
                  {job.assignedTo || "—"}
                </div>
              </div>
            </div>

            {job.notes ? (
              <div className="rounded-2xl border bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Notes</p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{job.notes}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="outline" className="gap-2" onClick={() => handleQuickStatus("In Progress")}>
                <PlayCircle className="h-4 w-4" />
                Mark In Progress
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleQuickStatus("Ready for DFM")}>
                <CheckCircle2 className="h-4 w-4" />
                Ready for DFM
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleQuickStatus("Blocked")}
              >
                <ShieldAlert className="h-4 w-4" />
                Mark Blocked
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manufacturing Inputs</CardTitle>
            <CardDescription>Stackup & panelization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stackup</p>
              {job.stackup ? (
                <div className="mt-2 space-y-1 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Copper</span>
                    <span className="font-medium">{job.stackup.cu ?? job.stackup.copper ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Core/Prepreg</span>
                    <span className="font-medium">{job.stackup.core ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Finish</span>
                    <span className="font-medium">{job.stackup.finish ?? "—"}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-600">Not set</p>
              )}
            </div>

            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Panelization</p>
              {job.panelization ? (
                <div className="mt-2 space-y-1 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Panel Size</span>
                    <span className="font-medium">{job.panelization.panel_size ?? job.panelization.panelSize ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Array</span>
                    <span className="font-medium">{job.panelization.array ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rails</span>
                    <span className="font-medium">{job.panelization.rails ?? "—"}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-600">Not set</p>
              )}
            </div>

            <Button variant="outline" className="w-full gap-2" asChild>
              <Link to={`/engineering/dfm/create?camJobId=${job.id}`}>
                <Send className="h-4 w-4" />
                Create DFM from CAM
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Files + Outputs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionTitle icon={PackageOpen} title="Input Files" subtitle="Gerbers, drill, ODB++, drawings" />
          </CardHeader>
          <CardContent className="space-y-3">
            {job.files?.length ? (
              <div className="space-y-2">
                {job.files.map((f) => (
                  <div key={f.id ?? f.file_id ?? f.key ?? f.name} className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-gray-100">
                        <FileText className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{f.name ?? f.filename ?? "File"}</p>
                        <p className="text-xs text-gray-500">
                          {f.type ?? f.category ?? "Input"} • {f.size ?? f.filesize ?? "—"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => downloadFile(f)}>
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-900">No files attached</p>
                <p className="mt-1 text-sm text-gray-500">Upload Gerbers/ODB++ in Edit page.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon={FileDown} title="CAM Outputs" subtitle="Panelized outputs & manufacturing pack" />
          </CardHeader>
          <CardContent className="space-y-3">
            {job.outputs?.length ? (
              <div className="space-y-2">
                {job.outputs.map((o) => (
                  <div key={o.id ?? o.file_id ?? o.key ?? o.name} className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10">
                        <FileDown className="h-4 w-4 text-[#dc2551]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{o.name ?? o.filename ?? "Output"}</p>
                        <p className="text-xs text-gray-500">
                          {o.type ?? o.category ?? "Output"} • {o.size ?? o.filesize ?? "—"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => downloadFile(o)}>
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-900">No outputs generated</p>
                <p className="mt-1 text-sm text-gray-500">Generate CAM pack after checks are complete.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checkpoints + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CAM Checkpoints</CardTitle>
            <CardDescription>Standard PCB CAM checklist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.checkpoints?.length ? (
              job.checkpoints.map((c, idx) => (
                <div key={c.id ?? idx} className="flex items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3">
                  <div className="flex items-start gap-2">
                    {c.done || c.completed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.title ?? c.name ?? "Checkpoint"}</p>
                      <p className="text-xs text-gray-500">{c.note ?? c.description ?? ""}</p>
                    </div>
                  </div>
                  <Badge className={cx("rounded-full", c.done || c.completed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {c.done || c.completed ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-900">No checklist configured</p>
                <p className="mt-1 text-sm text-gray-500">Add checkpoints from Edit page.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <CardDescription>Status, assignments, and file actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.timeline?.length ? (
              job.timeline.map((t, idx) => (
                <motion.div
                  key={t.id ?? idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.title ?? t.action ?? "Update"}</p>
                      <p className="text-xs text-gray-500">{t.message ?? t.detail ?? ""}</p>
                    </div>
                    <span className="text-xs text-gray-500">{fmtDate(t.at ?? t.created_at ?? t.date)}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-2xl border bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-900">No activity yet</p>
                <p className="mt-1 text-sm text-gray-500">Updates will appear here as the job progresses.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Back */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="gap-2" asChild>
          <Link to="/engineering/cam">
            <ArrowLeft className="h-4 w-4" />
            Back to CAM Jobs
          </Link>
        </Button>
      </div>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete CAM Job?"
        description={`This will permanently delete CAM Job ${job.camNo || ""}. This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
