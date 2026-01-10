// src/pages/engineering/panelization/PanelizationDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  Filter,
  LayoutGrid,
  Boxes,
  FileDown,
  Trash2,
  Eye,
  Copy,
  CalendarDays,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import PageHeader from "@/components/layout/PageHeader";
import PageSkeleton from "@/components/common/PageSkeleton";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

import panelizationService from "@/services/engineering/panelization.service";

// Helpers
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

function shortId(id) {
  const s = String(id ?? "");
  if (!s) return "—";
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-3)}` : s;
}

function statusMeta(status) {
  const s = (status || "draft").toLowerCase();
  if (["approved", "complete", "completed"].includes(s))
    return { label: "Approved", variant: "default", icon: CheckCircle2 };
  if (["warning", "needs_review", "review"].includes(s))
    return { label: "Needs Review", variant: "secondary", icon: AlertTriangle };
  if (["failed", "error"].includes(s))
    return { label: "Error", variant: "destructive", icon: AlertTriangle };
  if (["published", "locked"].includes(s))
    return { label: "Published", variant: "default", icon: CheckCircle2 };
  return { label: "Draft", variant: "outline", icon: LayoutGrid };
}

function computeUtilization(job) {
  // utilization may be provided by backend. If not, compute basic:
  const u = job?.metrics?.utilization ?? job?.utilization;
  if (Number.isFinite(Number(u))) return Number(u);

  const panelW = safeNum(job?.panel?.w ?? job?.panelW);
  const panelH = safeNum(job?.panel?.h ?? job?.panelH);
  const boardW = safeNum(job?.board?.w ?? job?.boardW);
  const boardH = safeNum(job?.board?.h ?? job?.boardH);
  const cols = safeNum(job?.array?.cols ?? job?.cols, 0);
  const rows = safeNum(job?.array?.rows ?? job?.rows, 0);

  const areaPanel = panelW * panelH;
  const areaBoards = cols * rows * boardW * boardH;
  if (areaPanel <= 0) return 0;
  return (areaBoards / areaPanel) * 100;
}

function safeList(res) {
  // accept: array, {data:[]}, {items:[]}, {results:[]}
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.results)) return res.results;
  return [];
}

/**
 * PanelizationDashboard
 * - Lists panelization jobs/templates
 * - Search, status filter
 * - Quick actions: Create, Open, Duplicate, Export, Delete
 *
 * Expectations about service (graceful if missing):
 * - panelizationService.listJobs({ q, status }) OR listPanelJobs OR getJobs
 * - panelizationService.deleteJob(id)
 * - panelizationService.duplicateJob(id) OR cloneJob(id)
 * - panelizationService.exportJob(id, { format }) OR exportPanelization(id)
 */
export default function PanelizationDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [jobs, setJobs] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | draft | needs_review | approved | error
  const [plant, setPlant] = useState("all"); // optional

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "destructive",
    onConfirm: null,
  });

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return jobs.filter((j) => {
      const okQ =
        !qq ||
        safeStr(j?.name).toLowerCase().includes(qq) ||
        safeStr(j?.jobNo).toLowerCase().includes(qq) ||
        safeStr(j?.customer).toLowerCase().includes(qq) ||
        safeStr(j?.partNo).toLowerCase().includes(qq) ||
        safeStr(j?.id).toLowerCase().includes(qq);

      const st = (j?.status || "draft").toLowerCase();
      const okStatus = status === "all" ? true : st === status;

      const pl = safeStr(j?.plant || j?.site || "").toLowerCase();
      const okPlant = plant === "all" ? true : pl === plant;

      return okQ && okStatus && okPlant;
    });
  }, [jobs, q, status, plant]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const by = { draft: 0, needs_review: 0, approved: 0, error: 0 };
    for (const j of jobs) {
      const st = (j?.status || "draft").toLowerCase();
      if (by[st] === undefined) continue;
      by[st]++;
    }
    return { total, ...by };
  }, [jobs]);

  async function fetchJobs({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const payload = { q: q.trim() || undefined, status: status === "all" ? undefined : status };

      // Try common service method names
      let res;
      if (panelizationService?.listJobs) res = await panelizationService.listJobs(payload);
      else if (panelizationService?.listPanelJobs) res = await panelizationService.listPanelJobs(payload);
      else if (panelizationService?.getJobs) res = await panelizationService.getJobs(payload);
      else if (panelizationService?.list) res = await panelizationService.list(payload);

      const list = safeList(res);

      // Normalize fields lightly (don’t mutate original too much)
      const normalized = list.map((j) => ({
        id: j?.id ?? j?._id ?? j?.jobId ?? j?.panelJobId,
        name: j?.name ?? j?.title ?? `Panel Job ${shortId(j?.id ?? j?._id)}`,
        status: (j?.status ?? "draft").toLowerCase(),
        createdAt: j?.createdAt ?? j?.created_at ?? j?.createdOn ?? j?.created_date,
        updatedAt: j?.updatedAt ?? j?.updated_at ?? j?.modifiedAt ?? j?.modified_at,
        customer: j?.customer ?? j?.customerName ?? "",
        plant: j?.plant ?? j?.site ?? "",
        jobNo: j?.jobNo ?? j?.job_number ?? "",
        partNo: j?.partNo ?? j?.part_number ?? "",
        panel: j?.panel ?? { w: j?.panelW, h: j?.panelH },
        board: j?.board ?? { w: j?.boardW, h: j?.boardH },
        array: j?.array ?? { cols: j?.cols, rows: j?.rows, gapX: j?.gapX, gapY: j?.gapY },
        metrics: j?.metrics ?? {},
        raw: j,
      }));

      setJobs(normalized);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load panelization jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchJobs({ silent: true });
  }

  function goCreate() {
    // Adjust routes to match your app
    navigate("/engineering/panelization/create");
  }

  function goSimulator(jobId) {
    // Adjust routes to match your app
    navigate(`/engineering/panelization/simulator?jobId=${encodeURIComponent(jobId)}`);
  }

  function askDelete(job) {
    setConfirm({
      open: true,
      title: `Delete "${job.name}"?`,
      description: "This will permanently remove the panelization job and its saved configuration.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          if (!job?.id) throw new Error("Missing job id");
          if (panelizationService?.deleteJob) await panelizationService.deleteJob(job.id);
          else if (panelizationService?.removeJob) await panelizationService.removeJob(job.id);
          else if (panelizationService?.delete) await panelizationService.delete(job.id);
          else throw new Error("Delete API not available in panelizationService.");

          toast({ title: "Deleted", description: `"${job.name}" removed successfully.` });
          setJobs((prev) => prev.filter((x) => x.id !== job.id));
        } catch (e) {
          console.error(e);
          toast({
            title: "Delete failed",
            description: e?.message || "Could not delete the job.",
            variant: "destructive",
          });
        } finally {
          setConfirm((c) => ({ ...c, open: false }));
        }
      },
    });
  }

  function askDuplicate(job) {
    setConfirm({
      open: true,
      title: `Duplicate "${job.name}"?`,
      description: "A copy will be created as a new draft job.",
      confirmText: "Duplicate",
      variant: "default",
      onConfirm: async () => {
        try {
          if (!job?.id) throw new Error("Missing job id");
          let res;
          if (panelizationService?.duplicateJob) res = await panelizationService.duplicateJob(job.id);
          else if (panelizationService?.cloneJob) res = await panelizationService.cloneJob(job.id);
          else if (panelizationService?.copyJob) res = await panelizationService.copyJob(job.id);
          else throw new Error("Duplicate API not available in panelizationService.");

          toast({ title: "Duplicated", description: "New draft created." });
          // If API returns created job, prepend; else refresh
          const created = res?.data ?? res?.item ?? res;
          if (created?.id || created?._id) {
            await fetchJobs({ silent: true });
          } else {
            await fetchJobs({ silent: true });
          }
        } catch (e) {
          console.error(e);
          toast({
            title: "Duplicate failed",
            description: e?.message || "Could not duplicate the job.",
            variant: "destructive",
          });
        } finally {
          setConfirm((c) => ({ ...c, open: false }));
        }
      },
    });
  }

  async function onExport(job, format = "json") {
    try {
      if (!job?.id) throw new Error("Missing job id");

      let blob;
      if (panelizationService?.exportJob) {
        blob = await panelizationService.exportJob(job.id, { format });
      } else if (panelizationService?.exportPanelization) {
        blob = await panelizationService.exportPanelization(job.id, { format });
      } else {
        // Fallback: client-side JSON export
        if (format !== "json") throw new Error("Export API not available for this format.");
        const data = job.raw ?? job;
        const text = JSON.stringify(data, null, 2);
        blob = new Blob([text], { type: "application/json" });
      }

      // If API returns {blob} or Response, normalize
      const outBlob =
        blob instanceof Blob
          ? blob
          : blob?.data instanceof Blob
            ? blob.data
            : blob?.blob instanceof Blob
              ? blob.blob
              : null;

      if (!outBlob) throw new Error("Export failed (no file received).");

      const url = URL.createObjectURL(outBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeStr(job.name, "panelization-job").replaceAll(" ", "_")}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "Export started", description: `Downloading ${format.toUpperCase()}…` });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", description: e?.message || "Could not export.", variant: "destructive" });
    }
  }

  // Derive plant options
  const plantOptions = useMemo(() => {
    const set = new Set();
    for (const j of jobs) {
      const p = safeStr(j?.plant).trim();
      if (p) set.add(p.toLowerCase());
    }
    return ["all", ...Array.from(set)];
  }, [jobs]);

  if (loading) {
    return (
      <div className="p-4">
        <PageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Could not load panelization jobs"
          description={error}
          actionLabel="Retry"
          onAction={() => fetchJobs()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="PCB Panelization"
        subtitle="Manage panel jobs, templates, and open the interactive simulator."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button onClick={goCreate}>
              <Plus className="h-4 w-4" />
              <span className="ml-2">New Panel Job</span>
            </Button>
          </div>
        }
      />

      {/* KPI / Quick stats */}
      <div className="grid grid-cols-12 gap-3">
        <StatCard title="Total Jobs" value={stats.total} icon={Boxes} />
        <StatCard title="Draft" value={stats.draft} icon={LayoutGrid} />
        <StatCard title="Needs Review" value={stats.needs_review} icon={AlertTriangle} />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} />
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by job name, job no, customer, part no…"
                className="pl-9"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setStatus("all");
                setPlant("all");
              }}
              className="hidden sm:inline-flex"
            >
              <Filter className="h-4 w-4" />
              <span className="ml-2">Reset</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <SelectPill
              label="Status"
              value={status}
              options={[
                { value: "all", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "needs_review", label: "Needs Review" },
                { value: "approved", label: "Approved" },
                { value: "error", label: "Error" },
              ]}
              onChange={setStatus}
            />
            <SelectPill
              label="Plant"
              value={plant}
              options={plantOptions.map((p) => ({
                value: p,
                label: p === "all" ? "All" : p.toUpperCase(),
              }))}
              onChange={setPlant}
              icon={Factory}
            />
          </div>
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No panelization jobs found"
            description="Create a new job or adjust filters to see results."
            actionLabel="Create job"
            onAction={goCreate}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          {filtered.map((job, idx) => (
            <motion.div
              key={job.id || idx}
              className="col-span-12 xl:col-span-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.2) }}
            >
              <JobCard
                job={job}
                onOpen={() => goSimulator(job.id)}
                onDuplicate={() => askDuplicate(job)}
                onDelete={() => askDelete(job)}
                onExport={(fmt) => onExport(job, fmt)}
                onView={() => navigate(`/engineering/panelization/jobs/${encodeURIComponent(job.id)}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
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

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card className="col-span-6 md:col-span-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-xl border flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function SelectPill({ label, value, options, onChange, icon: Icon }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-muted-foreground hidden sm:block">{label}</div>
      <div className="relative">
        {Icon ? <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /> : null}
        <select
          className={cx(
            "h-9 rounded-md border bg-background text-sm px-3 pr-8",
            Icon ? "pl-9" : ""
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function JobCard({ job, onOpen, onDuplicate, onDelete, onExport, onView }) {
  const meta = statusMeta(job.status);
  const Icon = meta.icon;
  const util = computeUtilization(job);

  const panelW = safeNum(job?.panel?.w);
  const panelH = safeNum(job?.panel?.h);
  const boardW = safeNum(job?.board?.w);
  const boardH = safeNum(job?.board?.h);
  const cols = safeNum(job?.array?.cols);
  const rows = safeNum(job?.array?.rows);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-base font-semibold truncate">{job.name}</div>
            <Badge variant={meta.variant} className="inline-flex items-center gap-1">
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </Badge>
            {Number.isFinite(util) ? (
              <Badge variant="secondary">{util.toFixed(1)}% util</Badge>
            ) : null}
          </div>

          <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Updated: {formatDate(job.updatedAt || job.createdAt)}
            </span>
            {job.plant ? (
              <span className="inline-flex items-center gap-1">
                <Factory className="h-3.5 w-3.5" />
                {job.plant}
              </span>
            ) : null}
            {job.customer ? <span>Customer: {job.customer}</span> : null}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">ID</div>
          <div className="text-sm font-mono">{shortId(job.id)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-12 gap-2 text-xs">
        <InfoPill label="Panel" value={panelW && panelH ? `${panelW}×${panelH} mm` : "—"} />
        <InfoPill label="Board" value={boardW && boardH ? `${boardW}×${boardH} mm` : "—"} />
        <InfoPill label="Array" value={cols && rows ? `${cols}×${rows}` : "—"} />
        <InfoPill label="Part No" value={job.partNo || "—"} />
        <InfoPill label="Job No" value={job.jobNo || "—"} />
        <InfoPill label="Gap" value={job?.array?.gapX != null && job?.array?.gapY != null ? `${job.array.gapX}/${job.array.gapY} mm` : "—"} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={onOpen}>
            <ArrowRight className="h-4 w-4" />
            <span className="ml-2">Open Simulator</span>
          </Button>

          <Button variant="outline" onClick={onView}>
            <Eye className="h-4 w-4" />
            <span className="ml-2">View</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={() => onExport("json")}>
            <FileDown className="h-4 w-4" />
          </Button>

          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="col-span-6 md:col-span-4 xl:col-span-2 rounded-lg border px-2 py-1">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}
