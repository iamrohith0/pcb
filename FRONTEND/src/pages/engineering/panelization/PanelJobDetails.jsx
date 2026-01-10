// src/pages/engineering/panelization/PanelJobDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Copy,
  FileDown,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Factory,
  User,
  Hash,
  Box,
  LayoutGrid,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import PageHeader from "@/components/layout/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

import panelizationService from "@/services/engineering/panelization.service";

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function shortId(id) {
  const s = String(id ?? "");
  if (!s) return "—";
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-3)}` : s;
}
function formatDate(iso) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function statusMeta(status) {
  const s = (status || "draft").toLowerCase();
  if (["approved", "complete", "completed"].includes(s))
    return { label: "Approved", variant: "default", icon: CheckCircle2 };
  if (["warning", "needs_review", "review"].includes(s))
    return { label: "Needs Review", variant: "secondary", icon: AlertTriangle };
  if (["failed", "error"].includes(s))
    return { label: "Error", variant: "destructive", icon: ShieldAlert };
  return { label: "Draft", variant: "outline", icon: LayoutGrid };
}

function normalizeJob(apiJob) {
  if (!apiJob) return null;

  const id = apiJob?.id ?? apiJob?._id ?? apiJob?.jobId ?? apiJob?.panelJobId;

  return {
    id,
    name: apiJob?.name ?? apiJob?.title ?? `Panel Job ${shortId(id)}`,
    description: apiJob?.description ?? "",
    status: (apiJob?.status ?? "draft").toLowerCase(),
    customer: apiJob?.customer ?? apiJob?.customerName ?? "",
    partNo: apiJob?.partNo ?? apiJob?.part_number ?? "",
    jobNo: apiJob?.jobNo ?? apiJob?.job_number ?? "",
    plant: apiJob?.plant ?? apiJob?.site ?? "",
    notes: apiJob?.notes ?? "",
    createdAt: apiJob?.createdAt ?? apiJob?.created_at ?? apiJob?.createdOn ?? null,
    updatedAt: apiJob?.updatedAt ?? apiJob?.updated_at ?? apiJob?.modifiedAt ?? null,

    panel: {
      w: safeNum(apiJob?.panel?.w ?? apiJob?.panelW),
      h: safeNum(apiJob?.panel?.h ?? apiJob?.panelH),
      thickness: safeNum(apiJob?.panel?.thickness ?? apiJob?.panelThickness),
      rails: {
        top: safeNum(apiJob?.panel?.rails?.top ?? apiJob?.rails?.top),
        bottom: safeNum(apiJob?.panel?.rails?.bottom ?? apiJob?.rails?.bottom),
        left: safeNum(apiJob?.panel?.rails?.left ?? apiJob?.rails?.left),
        right: safeNum(apiJob?.panel?.rails?.right ?? apiJob?.rails?.right),
      },
    },

    board: {
      w: safeNum(apiJob?.board?.w ?? apiJob?.boardW),
      h: safeNum(apiJob?.board?.h ?? apiJob?.boardH),
      thickness: safeNum(apiJob?.board?.thickness ?? apiJob?.boardThickness),
      cornerR: safeNum(apiJob?.board?.cornerR ?? apiJob?.cornerR),
      rotation: safeNum(apiJob?.board?.rotation ?? apiJob?.rotation),
    },

    array: {
      cols: Math.max(1, Math.floor(safeNum(apiJob?.array?.cols ?? apiJob?.cols ?? 1))),
      rows: Math.max(1, Math.floor(safeNum(apiJob?.array?.rows ?? apiJob?.rows ?? 1))),
      gapX: safeNum(apiJob?.array?.gapX ?? apiJob?.gapX),
      gapY: safeNum(apiJob?.array?.gapY ?? apiJob?.gapY),
      origin: apiJob?.array?.origin ?? "center",
    },

    addons: {
      toolingHoles: !!(apiJob?.addons?.toolingHoles ?? false),
      fiducials: !!(apiJob?.addons?.fiducials ?? false),
      vcut: !!(apiJob?.addons?.vcut ?? false),
      mouseBites: !!(apiJob?.addons?.mouseBites ?? false),
    },

    metrics: apiJob?.metrics ?? {},
    raw: apiJob,
  };
}

function computeDerived(job) {
  const panelW = safeNum(job?.panel?.w);
  const panelH = safeNum(job?.panel?.h);
  const rails = job?.panel?.rails || { top: 0, bottom: 0, left: 0, right: 0 };

  const usableW = panelW - safeNum(rails.left) - safeNum(rails.right);
  const usableH = panelH - safeNum(rails.top) - safeNum(rails.bottom);

  const cols = Math.max(1, Math.floor(safeNum(job?.array?.cols, 1)));
  const rows = Math.max(1, Math.floor(safeNum(job?.array?.rows, 1)));
  const bw = safeNum(job?.board?.w);
  const bh = safeNum(job?.board?.h);
  const gapX = safeNum(job?.array?.gapX);
  const gapY = safeNum(job?.array?.gapY);

  const arrayW = cols * bw + (cols - 1) * gapX;
  const arrayH = rows * bh + (rows - 1) * gapY;

  const fits = arrayW <= usableW && arrayH <= usableH;

  const areaPanel = panelW * panelH;
  const areaBoards = cols * rows * bw * bh;
  const utilization = areaPanel > 0 ? (areaBoards / areaPanel) * 100 : 0;

  return { usableW, usableH, arrayW, arrayH, fits, utilization, count: cols * rows };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PanelJobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [job, setJob] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "destructive",
    onConfirm: null,
  });

  async function load({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);
      setError(null);

      let res;
      if (panelizationService?.getJob) res = await panelizationService.getJob(id);
      else if (panelizationService?.readJob) res = await panelizationService.readJob(id);
      else if (panelizationService?.getPanelJob) res = await panelizationService.getPanelJob(id);
      else if (panelizationService?.read) res = await panelizationService.read(id);
      else throw new Error("Read API not available in panelizationService.");

      const apiJob = res?.data ?? res?.item ?? res;
      const norm = normalizeJob(apiJob);
      if (!norm?.id) throw new Error("Invalid job payload returned.");

      setJob(norm);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load job details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const derived = useMemo(() => (job ? computeDerived(job) : null), [job]);
  const meta = useMemo(() => statusMeta(job?.status), [job]);
  const StatusIcon = meta.icon;

  async function onRefresh() {
    setRefreshing(true);
    await load({ silent: true });
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(job?.raw ?? job, null, 2));
      toast({ title: "Copied", description: "Job JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  }

  async function onExport(format = "json") {
    try {
      if (!job?.id) throw new Error("Missing job id");

      let blob;
      if (panelizationService?.exportJob) {
        blob = await panelizationService.exportJob(job.id, { format });
      } else if (panelizationService?.exportPanelization) {
        blob = await panelizationService.exportPanelization(job.id, { format });
      } else {
        if (format !== "json") throw new Error("Export API not available for this format.");
        const payload = job?.raw ?? job;
        blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      }

      const outBlob =
        blob instanceof Blob
          ? blob
          : blob?.data instanceof Blob
            ? blob.data
            : blob?.blob instanceof Blob
              ? blob.blob
              : null;

      if (!outBlob) throw new Error("Export failed (no file received).");

      downloadBlob(outBlob, `${safeStr(job.name, "panel_job").replaceAll(" ", "_")}.${format}`);
      toast({ title: "Export started", description: `Downloading ${format.toUpperCase()}…` });
    } catch (e) {
      toast({ title: "Export failed", description: e?.message || "Unable to export.", variant: "destructive" });
    }
  }

  function askDelete() {
    setConfirm({
      open: true,
      title: `Delete "${job?.name}"?`,
      description: "This will permanently remove the panelization job.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          if (!job?.id) throw new Error("Missing job id");
          if (panelizationService?.deleteJob) await panelizationService.deleteJob(job.id);
          else if (panelizationService?.removeJob) await panelizationService.removeJob(job.id);
          else if (panelizationService?.delete) await panelizationService.delete(job.id);
          else throw new Error("Delete API not available in panelizationService.");

          toast({ title: "Deleted", description: "Job removed successfully." });
          navigate("/engineering/panelization");
        } catch (e) {
          toast({ title: "Delete failed", description: e?.message || "Unable to delete.", variant: "destructive" });
        } finally {
          setConfirm((c) => ({ ...c, open: false }));
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="p-4">
        <LoadingState title="Loading job details…" description="Fetching configuration…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState title="Could not load job" description={error} actionLabel="Back" onAction={() => navigate(-1)} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4">
        <Card className="p-6">
          <ErrorState title="Job not found" description="This panelization job does not exist." actionLabel="Back" onAction={() => navigate(-1)} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Panel Job Details"
        subtitle={`Job: ${job.name} • ID: ${shortId(job.id)}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" asChild>
              <Link to="/engineering/panelization">
                <ArrowLeft className="h-4 w-4" />
                <span className="ml-2">Dashboard</span>
              </Link>
            </Button>

            <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>

            <Button variant="outline" onClick={copyJson}>
              <Copy className="h-4 w-4" />
              <span className="ml-2">Copy JSON</span>
            </Button>

            <Button variant="outline" onClick={() => onExport("json")}>
              <FileDown className="h-4 w-4" />
              <span className="ml-2">Export</span>
            </Button>

            <Button variant="outline" onClick={() => navigate(`/engineering/panelization/create?jobId=${encodeURIComponent(job.id)}`)}>
              <Pencil className="h-4 w-4" />
              <span className="ml-2">Edit</span>
            </Button>

            <Button onClick={() => navigate(`/engineering/panelization/simulator?jobId=${encodeURIComponent(job.id)}`)}>
              <ArrowRight className="h-4 w-4" />
              <span className="ml-2">Open Simulator</span>
            </Button>

            <Button variant="destructive" onClick={askDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="ml-2">Delete</span>
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-12 gap-3">
        <motion.div className="col-span-12 xl:col-span-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-lg font-semibold truncate">{job.name}</div>
                  <Badge variant={meta.variant} className="inline-flex items-center gap-1">
                    <StatusIcon className="h-3.5 w-3.5" />
                    {meta.label}
                  </Badge>
                  {derived ? <Badge variant="secondary">{derived.utilization.toFixed(1)}% util</Badge> : null}
                </div>

                <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                  {job.description || "—"}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Created: {formatDate(job.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Updated: {formatDate(job.updatedAt)}
                  </span>
                  {job.plant ? (
                    <span className="inline-flex items-center gap-1">
                      <Factory className="h-3.5 w-3.5" />
                      {job.plant}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground">Job ID</div>
                <div className="font-mono text-sm">{shortId(job.id)}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div className="col-span-12 xl:col-span-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.03 }}>
          <Card className="p-4 space-y-3">
            <div className="font-semibold">Identifiers</div>

            <MetaRow icon={User} label="Customer" value={job.customer || "—"} />
            <MetaRow icon={Hash} label="Part No" value={job.partNo || "—"} />
            <MetaRow icon={Hash} label="Job No" value={job.jobNo || "—"} />

            <div className="pt-2 border-t text-xs text-muted-foreground">
              Notes:
              <div className="mt-1 whitespace-pre-line text-sm text-foreground">{job.notes || "—"}</div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Geometry */}
      <div className="grid grid-cols-12 gap-3">
        <motion.div className="col-span-12 lg:col-span-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="p-4 space-y-3">
            <div className="font-semibold flex items-center gap-2">
              <Box className="h-4 w-4" /> Panel
            </div>

            <InfoGrid>
              <Info label="Size" value={job.panel?.w && job.panel?.h ? `${job.panel.w} × ${job.panel.h} mm` : "—"} />
              <Info label="Thickness" value={job.panel?.thickness ? `${job.panel.thickness} mm` : "—"} />
              <Info label="Rail Top" value={numOrDash(job.panel?.rails?.top)} />
              <Info label="Rail Bottom" value={numOrDash(job.panel?.rails?.bottom)} />
              <Info label="Rail Left" value={numOrDash(job.panel?.rails?.left)} />
              <Info label="Rail Right" value={numOrDash(job.panel?.rails?.right)} />
              {derived ? <Info label="Usable W" value={`${derived.usableW.toFixed(1)} mm`} /> : null}
              {derived ? <Info label="Usable H" value={`${derived.usableH.toFixed(1)} mm`} /> : null}
            </InfoGrid>
          </Card>
        </motion.div>

        <motion.div className="col-span-12 lg:col-span-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.03 }}>
          <Card className="p-4 space-y-3">
            <div className="font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4" /> Board
            </div>

            <InfoGrid>
              <Info label="Size" value={job.board?.w && job.board?.h ? `${job.board.w} × ${job.board.h} mm` : "—"} />
              <Info label="Thickness" value={job.board?.thickness ? `${job.board.thickness} mm` : "—"} />
              <Info label="Corner R" value={numOrDash(job.board?.cornerR)} />
              <Info label="Rotation" value={Number.isFinite(job.board?.rotation) ? `${job.board.rotation}°` : "—"} />
            </InfoGrid>
          </Card>
        </motion.div>

        <motion.div className="col-span-12 lg:col-span-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.06 }}>
          <Card className="p-4 space-y-3">
            <div className="font-semibold flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> Array
            </div>

            <InfoGrid>
              <Info label="Cols × Rows" value={`${job.array?.cols ?? "—"} × ${job.array?.rows ?? "—"}`} />
              <Info label="Count" value={derived ? `${derived.count}` : "—"} />
              <Info label="Gap X" value={numOrDash(job.array?.gapX)} />
              <Info label="Gap Y" value={numOrDash(job.array?.gapY)} />
              <Info label="Origin" value={job.array?.origin ?? "—"} />
              {derived ? <Info label="Array W" value={`${derived.arrayW.toFixed(1)} mm`} /> : null}
              {derived ? <Info label="Array H" value={`${derived.arrayH.toFixed(1)} mm`} /> : null}
              {derived ? <Info label="Fits" value={derived.fits ? "Yes" : "No"} /> : null}
            </InfoGrid>
          </Card>
        </motion.div>
      </div>

      {/* Addons */}
      <Card className="p-4">
        <div className="font-semibold mb-3">Add-ons</div>
        <div className="flex flex-wrap gap-2">
          <AddonBadge label="Tooling Holes" on={!!job.addons?.toolingHoles} />
          <AddonBadge label="Fiducials" on={!!job.addons?.fiducials} />
          <AddonBadge label="V-Cut" on={!!job.addons?.vcut} />
          <AddonBadge label="Mouse Bites" on={!!job.addons?.mouseBites} />
        </div>
      </Card>

      <ConfirmationDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText={confirm.confirmText}
        variant={confirm.variant}
        onOpenChange={(open) => setConfirm((c) => ({ ...c, open }))}
        onConfirm={confirm.onConfirm}
      />
    </div>
  );
}

function numOrDash(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n}`;
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div className="grid grid-cols-12 gap-2">{children}</div>;
}

function Info({ label, value }) {
  return (
    <div className="col-span-6 rounded-lg border px-2 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

function AddonBadge({ label, on }) {
  return <Badge variant={on ? "default" : "outline"}>{label}</Badge>;
}
