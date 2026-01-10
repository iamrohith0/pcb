// src/pages/engineering/panelization/PanelCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Copy,
  FileUp,
  Layers,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  Shuffle,
  SquareStack,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";

import panelizationService from "@/services/engineering/panelization.service";

/**
 * PanelCreate.jsx
 * Form-based panelization create/update page.
 *
 * Works with flexible backend service shapes:
 * - panelizationService.getPanel(id) / getJobSnapshot(id)
 * - panelizationService.createPanel(payload)
 * - panelizationService.updatePanel(id, payload)
 * - panelizationService.calculate(payload) (optional)
 *
 * Routes expected (adjust if needed):
 * - /engineering/panelization/create
 * - /engineering/panelization/simulator?jobId=...
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mmToIn(mm) {
  return mm / 25.4;
}

function inToMm(inches) {
  return inches * 25.4;
}

function formatMm(mm) {
  const n = safeNum(mm);
  return `${n.toFixed(2)} mm`;
}

function formatIn(mm) {
  const n = safeNum(mmToIn(mm));
  return `${n.toFixed(3)} in`;
}

function normalizeJob(apiJob) {
  if (!apiJob) return null;

  const id = apiJob?.id ?? apiJob?._id ?? apiJob?.jobId ?? apiJob?.panelJobId;

  return {
    id,
    name: apiJob?.name ?? apiJob?.title ?? "",
    description: apiJob?.description ?? "",
    status: (apiJob?.status ?? "draft").toLowerCase(),
    customer: apiJob?.customer ?? apiJob?.customerName ?? "",
    partNo: apiJob?.partNo ?? apiJob?.part_number ?? "",
    jobNo: apiJob?.jobNo ?? apiJob?.job_number ?? "",
    plant: apiJob?.plant ?? apiJob?.site ?? "",

    panel: {
      w: safeNum(apiJob?.panel?.w ?? apiJob?.panelW ?? 457),
      h: safeNum(apiJob?.panel?.h ?? apiJob?.panelH ?? 610),
      thickness: safeNum(apiJob?.panel?.thickness ?? apiJob?.panelThickness ?? 1.6),
      rails: {
        top: safeNum(apiJob?.panel?.rails?.top ?? apiJob?.rails?.top ?? 10),
        bottom: safeNum(apiJob?.panel?.rails?.bottom ?? apiJob?.rails?.bottom ?? 10),
        left: safeNum(apiJob?.panel?.rails?.left ?? apiJob?.rails?.left ?? 5),
        right: safeNum(apiJob?.panel?.rails?.right ?? apiJob?.rails?.right ?? 5),
      },
      units: apiJob?.panel?.units ?? "mm",
    },

    board: {
      w: safeNum(apiJob?.board?.w ?? apiJob?.boardW ?? 50),
      h: safeNum(apiJob?.board?.h ?? apiJob?.boardH ?? 70),
      thickness: safeNum(apiJob?.board?.thickness ?? apiJob?.boardThickness ?? 1.6),
      cornerR: safeNum(apiJob?.board?.cornerR ?? apiJob?.cornerR ?? 2),
      rotation: safeNum(apiJob?.board?.rotation ?? apiJob?.rotation ?? 0),
    },

    array: {
      cols: Math.max(1, Math.floor(safeNum(apiJob?.array?.cols ?? apiJob?.cols ?? 6))),
      rows: Math.max(1, Math.floor(safeNum(apiJob?.array?.rows ?? apiJob?.rows ?? 6))),
      gapX: safeNum(apiJob?.array?.gapX ?? apiJob?.gapX ?? 3),
      gapY: safeNum(apiJob?.array?.gapY ?? apiJob?.gapY ?? 3),
      origin: apiJob?.array?.origin ?? "center",
    },

    addons: {
      toolingHoles: apiJob?.addons?.toolingHoles ?? false,
      fiducials: apiJob?.addons?.fiducials ?? false,
      vcut: apiJob?.addons?.vcut ?? false,
      mouseBites: apiJob?.addons?.mouseBites ?? false,
    },

    notes: apiJob?.notes ?? "",
    raw: apiJob,
  };
}

function buildPayload(state) {
  return {
    name: state.name?.trim(),
    description: state.description?.trim(),
    status: state.status,
    customer: state.customer?.trim(),
    partNo: state.partNo?.trim(),
    jobNo: state.jobNo?.trim(),
    plant: state.plant?.trim(),
    panel: {
      w: safeNum(state.panel.w),
      h: safeNum(state.panel.h),
      thickness: safeNum(state.panel.thickness),
      rails: {
        top: safeNum(state.panel.rails.top),
        bottom: safeNum(state.panel.rails.bottom),
        left: safeNum(state.panel.rails.left),
        right: safeNum(state.panel.rails.right),
      },
      units: "mm",
    },
    board: {
      w: safeNum(state.board.w),
      h: safeNum(state.board.h),
      thickness: safeNum(state.board.thickness),
      cornerR: safeNum(state.board.cornerR),
      rotation: safeNum(state.board.rotation),
    },
    array: {
      cols: Math.max(1, Math.floor(safeNum(state.array.cols))),
      rows: Math.max(1, Math.floor(safeNum(state.array.rows))),
      gapX: safeNum(state.array.gapX),
      gapY: safeNum(state.array.gapY),
      origin: state.array.origin ?? "center",
    },
    addons: { ...state.addons },
    notes: state.notes ?? "",
  };
}

const DEFAULT_STATE = {
  id: null,
  name: "",
  description: "",
  status: "draft",
  customer: "",
  partNo: "",
  jobNo: "",
  plant: "",
  panel: {
    w: 457,
    h: 610,
    thickness: 1.6,
    rails: { top: 10, bottom: 10, left: 5, right: 5 },
    units: "mm",
  },
  board: {
    w: 50,
    h: 70,
    thickness: 1.6,
    cornerR: 2,
    rotation: 0,
  },
  array: { cols: 6, rows: 6, gapX: 3, gapY: 3, origin: "center" },
  addons: { toolingHoles: false, fiducials: false, vcut: false, mouseBites: false },
  notes: "",
};

export default function PanelCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const jobId = searchParams.get("jobId"); // optional for editing
  const cloneFrom = searchParams.get("cloneFrom"); // optional for cloning

  const [state, setState] = useState(DEFAULT_STATE);

  const [loading, setLoading] = useState(Boolean(jobId || cloneFrom));
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  const derived = useMemo(() => {
    const panelW = safeNum(state.panel.w);
    const panelH = safeNum(state.panel.h);

    const rails = state.panel.rails || { top: 0, bottom: 0, left: 0, right: 0 };
    const usableW = panelW - safeNum(rails.left) - safeNum(rails.right);
    const usableH = panelH - safeNum(rails.top) - safeNum(rails.bottom);

    const bw = safeNum(state.board.w);
    const bh = safeNum(state.board.h);
    const cols = Math.max(1, Math.floor(safeNum(state.array.cols)));
    const rows = Math.max(1, Math.floor(safeNum(state.array.rows)));
    const gapX = safeNum(state.array.gapX);
    const gapY = safeNum(state.array.gapY);

    const arrayW = cols * bw + (cols - 1) * gapX;
    const arrayH = rows * bh + (rows - 1) * gapY;

    const fits = arrayW <= usableW && arrayH <= usableH;
    const panelArea = panelW * panelH;
    const boardsArea = cols * rows * bw * bh;
    const utilization = panelArea > 0 ? (boardsArea / panelArea) * 100 : 0;

    // quick DFM-ish warnings
    const warnings = [];
    if (usableW <= 0 || usableH <= 0) warnings.push("Rails exceed panel size (usable area <= 0).");
    if (bw <= 0 || bh <= 0) warnings.push("Board size must be > 0.");
    if (gapX < 0 || gapY < 0) warnings.push("Gaps cannot be negative.");
    if (!fits) warnings.push("Array does not fit in usable panel area.");

    return {
      panelW,
      panelH,
      usableW,
      usableH,
      arrayW,
      arrayH,
      fits,
      utilization,
      warnings,
      count: cols * rows,
    };
  }, [state]);

  // Load job for edit/clone
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!jobId && !cloneFrom) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const idToLoad = jobId || cloneFrom;
        let res;

        if (panelizationService?.getPanel) res = await panelizationService.getPanel(idToLoad);
        else if (panelizationService?.getJobSnapshot) res = await panelizationService.getJobSnapshot(idToLoad);
        else if (panelizationService?.read) res = await panelizationService.read(idToLoad);
        else throw new Error("Read API not available in panelizationService.");

        const apiJob = res?.data ?? res?.item ?? res;
        const norm = normalizeJob(apiJob);

        if (!norm) throw new Error("Invalid job payload returned from API.");

        const merged = {
          ...DEFAULT_STATE,
          ...norm,
          // if cloning, ensure new id & draft
          id: jobId ? norm.id : null,
          status: jobId ? norm.status : "draft",
          name: jobId ? norm.name : `${norm.name || "Panel Job"} (Copy)`,
        };

        if (!cancelled) setState(merged);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e?.message || "Failed to load job.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [jobId, cloneFrom]);

  function update(path, value) {
    setState((prev) => {
      const next = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function randomizeExample() {
    // fun randomizer for quick testing
    const sizes = [
      { bw: 40, bh: 60 },
      { bw: 50, bh: 70 },
      { bw: 80, bh: 80 },
      { bw: 100, bh: 50 },
    ];
    const p = sizes[Math.floor(Math.random() * sizes.length)];
    const cols = Math.floor(3 + Math.random() * 8);
    const rows = Math.floor(3 + Math.random() * 8);
    update("board.w", p.bw);
    update("board.h", p.bh);
    update("array.cols", cols);
    update("array.rows", rows);
    update("array.gapX", Math.floor(Math.random() * 6));
    update("array.gapY", Math.floor(Math.random() * 6));
  }

  async function onCalculate() {
    // optional backend calculate
    try {
      setCalculating(true);

      if (!panelizationService?.calculate) {
        toast({
          title: "Calculated",
          description: "Using local calculations (no backend calculate API configured).",
        });
        return;
      }

      const payload = buildPayload(state);
      const res = await panelizationService.calculate(payload);
      const data = res?.data ?? res;

      toast({
        title: "Calculated",
        description: data?.message || "Calculation completed.",
      });

      // If backend returns improved suggestions, you can merge here:
      // Example: {array:{cols,rows,gapX,gapY}, metrics:{utilization, fits}}
      // We'll keep it conservative:
      if (data?.array?.cols != null) update("array.cols", data.array.cols);
      if (data?.array?.rows != null) update("array.rows", data.array.rows);
      if (data?.array?.gapX != null) update("array.gapX", data.array.gapX);
      if (data?.array?.gapY != null) update("array.gapY", data.array.gapY);
    } catch (e) {
      console.error(e);
      toast({
        title: "Calculate failed",
        description: e?.message || "Unable to calculate.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  }

  function validate() {
    const errs = [];
    if (!state.name?.trim()) errs.push("Job name is required.");
    if (derived.panelW <= 0 || derived.panelH <= 0) errs.push("Panel size must be > 0.");
    if (derived.usableW <= 0 || derived.usableH <= 0) errs.push("Rails are too large (usable area <= 0).");
    if (safeNum(state.board.w) <= 0 || safeNum(state.board.h) <= 0) errs.push("Board size must be > 0.");
    if (safeNum(state.array.cols) < 1 || safeNum(state.array.rows) < 1) errs.push("Rows/Cols must be at least 1.");
    return errs;
  }

  async function saveJob({ openSimulator = false } = {}) {
    const errs = validate();
    if (errs.length) {
      toast({ title: "Fix errors", description: errs[0], variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = buildPayload(state);
      let res;

      // Update if editing
      if (state.id || jobId) {
        const id = state.id || jobId;
        if (panelizationService?.updatePanel) res = await panelizationService.updatePanel(id, payload);
        else if (panelizationService?.update) res = await panelizationService.update(id, payload);
        else throw new Error("Update API not available in panelizationService.");
      } else {
        if (panelizationService?.createPanel) res = await panelizationService.createPanel(payload);
        else if (panelizationService?.create) res = await panelizationService.create(payload);
        else throw new Error("Create API not available in panelizationService.");
      }

      const saved = res?.data ?? res?.item ?? res;
      const savedId = saved?.id ?? saved?._id ?? saved?.jobId ?? saved?.panelJobId;

      if (savedId) setState((p) => ({ ...p, id: savedId }));

      toast({
        title: "Saved",
        description: openSimulator ? "Opening simulator…" : "Panel job saved successfully.",
      });

      if (openSimulator) {
        navigate(`/engineering/panelization/simulator?jobId=${encodeURIComponent(savedId || state.id)}`);
      } else {
        // if it was create, update URL to edit mode for continuity
        if (!jobId && savedId) {
          navigate(`/engineering/panelization/create?jobId=${encodeURIComponent(savedId)}`, { replace: true });
        }
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to save job.");
      toast({
        title: "Save failed",
        description: e?.message || "Unable to save panel job.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function copyJsonToClipboard() {
    try {
      const payload = buildPayload(state);
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Copied", description: "Panel config JSON copied to clipboard." });
    } catch (e) {
      toast({ title: "Copy failed", description: "Clipboard access denied.", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <LoadingState title="Loading panel job…" description="Fetching configuration…" />
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="p-4">
        <ErrorState title="Unable to open Panel Create" description={error} actionLabel="Back" onAction={() => navigate(-1)} />
      </div>
    );
  }

  const badgeVariant = derived.fits ? "default" : "destructive";

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title={jobId ? "Edit Panel Job" : "Create Panel Job"}
        subtitle="Define panel, board, array and addons. Save as draft or open the simulator."
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" asChild>
              <Link to="/engineering/panelization">
                <ArrowLeft className="h-4 w-4" />
                <span className="ml-2">Back</span>
              </Link>
            </Button>

            <Button variant="outline" onClick={copyJsonToClipboard}>
              <Copy className="h-4 w-4" />
              <span className="ml-2">Copy JSON</span>
            </Button>

            <Button variant="outline" onClick={onCalculate} disabled={calculating}>
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              <span className="ml-2">Calculate</span>
            </Button>

            <Button variant="outline" onClick={randomizeExample}>
              <Shuffle className="h-4 w-4" />
              <span className="ml-2">Random</span>
            </Button>

            <Button onClick={() => saveJob({ openSimulator: false })} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-2">Save</span>
            </Button>

            <Button
              className="bg-primary"
              onClick={() => saveJob({ openSimulator: true })}
              disabled={saving || validate().length > 0}
            >
              <ArrowRight className="h-4 w-4" />
              <span className="ml-2">Save & Open Simulator</span>
            </Button>
          </div>
        }
      />

      {/* Top summary */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={badgeVariant} className="inline-flex items-center gap-1">
              {derived.fits ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {derived.fits ? "Fits in panel" : "Doesn’t fit"}
            </Badge>
            <Badge variant="secondary">{derived.utilization.toFixed(1)}% Utilization</Badge>
            <Badge variant="outline">{derived.count} Boards</Badge>

            <div className="text-xs text-muted-foreground">
              Usable: {formatMm(derived.usableW)} × {formatMm(derived.usableH)}{" "}
              <span className="mx-1">•</span>
              Array: {formatMm(derived.arrayW)} × {formatMm(derived.arrayH)}
            </div>
          </div>

          {derived.warnings.length ? (
            <div className="text-xs text-destructive">
              {derived.warnings.slice(0, 2).map((w, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No warnings</div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* Left - Job meta */}
        <motion.div
          className="col-span-12 lg:col-span-4 space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <div className="font-semibold">Job Details</div>
            </div>

            <Field label="Job Name" required>
              <Input
                value={state.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g., CAM-Panel-RevA"
              />
            </Field>

            <Field label="Customer">
              <Input value={state.customer} onChange={(e) => update("customer", e.target.value)} placeholder="Customer name" />
            </Field>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <Field label="Part No">
                  <Input value={state.partNo} onChange={(e) => update("partNo", e.target.value)} placeholder="P/N" />
                </Field>
              </div>
              <div className="col-span-6">
                <Field label="Job No">
                  <Input value={state.jobNo} onChange={(e) => update("jobNo", e.target.value)} placeholder="Job #" />
                </Field>
              </div>
            </div>

            <Field label="Plant / Site">
              <Input value={state.plant} onChange={(e) => update("plant", e.target.value)} placeholder="e.g., Plant A" />
            </Field>

            <Field label="Description">
              <Textarea
                value={state.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Short description for this panelization job…"
                rows={3}
              />
            </Field>

            <Field label="Notes">
              <Textarea
                value={state.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="DFM notes, handling notes, special instructions…"
                rows={4}
              />
            </Field>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <div className="font-semibold">Add-ons</div>
            </div>

            <ToggleRow
              label="Tooling Holes"
              checked={!!state.addons.toolingHoles}
              onChange={(v) => update("addons.toolingHoles", v)}
              hint="Adds tooling holes to rails (if supported in simulator/export)."
            />
            <ToggleRow
              label="Fiducials"
              checked={!!state.addons.fiducials}
              onChange={(v) => update("addons.fiducials", v)}
              hint="Adds fiducials for assembly alignment."
            />
            <ToggleRow
              label="V-Cut"
              checked={!!state.addons.vcut}
              onChange={(v) => update("addons.vcut", v)}
              hint="Marks V-cut lines between boards."
            />
            <ToggleRow
              label="Mouse Bites"
              checked={!!state.addons.mouseBites}
              onChange={(v) => update("addons.mouseBites", v)}
              hint="Marks breakaway tabs with drill perforations."
            />
          </Card>
        </motion.div>

        {/* Right - Geometry config */}
        <motion.div
          className="col-span-12 lg:col-span-8 space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.03 }}
        >
          {/* Panel */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <SquareStack className="h-4 w-4" />
                <div className="font-semibold">Panel</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatMm(state.panel.w)} × {formatMm(state.panel.h)}{" "}
                <span className="mx-1">•</span>
                {formatIn(state.panel.w)} × {formatIn(state.panel.h)}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <Field label="Panel Width (mm)" required>
                  <Input
                    type="number"
                    value={state.panel.w}
                    onChange={(e) => update("panel.w", clamp(Number(e.target.value), 0, 99999))}
                  />
                </Field>
              </div>
              <div className="col-span-12 md:col-span-6">
                <Field label="Panel Height (mm)" required>
                  <Input
                    type="number"
                    value={state.panel.h}
                    onChange={(e) => update("panel.h", clamp(Number(e.target.value), 0, 99999))}
                  />
                </Field>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Field label="Panel Thickness (mm)">
                  <Input
                    type="number"
                    step="0.1"
                    value={state.panel.thickness}
                    onChange={(e) => update("panel.thickness", clamp(Number(e.target.value), 0, 20))}
                  />
                </Field>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Field label="Quick sizes">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        update("panel.w", 457);
                        update("panel.h", 610);
                      }}
                    >
                      18×24 in
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        update("panel.w", 450);
                        update("panel.h", 600);
                      }}
                    >
                      450×600
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        update("panel.w", 400);
                        update("panel.h", 500);
                      }}
                    >
                      400×500
                    </Button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="pt-1">
              <div className="text-sm font-semibold mb-2">Rails (mm)</div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6 md:col-span-3">
                  <Field label="Top" required>
                    <Input
                      type="number"
                      value={state.panel.rails.top}
                      onChange={(e) => update("panel.rails.top", clamp(Number(e.target.value), 0, 99999))}
                    />
                  </Field>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Field label="Bottom" required>
                    <Input
                      type="number"
                      value={state.panel.rails.bottom}
                      onChange={(e) => update("panel.rails.bottom", clamp(Number(e.target.value), 0, 99999))}
                    />
                  </Field>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Field label="Left" required>
                    <Input
                      type="number"
                      value={state.panel.rails.left}
                      onChange={(e) => update("panel.rails.left", clamp(Number(e.target.value), 0, 99999))}
                    />
                  </Field>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Field label="Right" required>
                    <Input
                      type="number"
                      value={state.panel.rails.right}
                      onChange={(e) => update("panel.rails.right", clamp(Number(e.target.value), 0, 99999))}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Usable area: {formatMm(derived.usableW)} × {formatMm(derived.usableH)}
              </div>
            </div>
          </Card>

          {/* Board */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <div className="font-semibold">Board</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Board: {formatMm(state.board.w)} × {formatMm(state.board.h)}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <Field label="Board Width (mm)" required>
                  <Input
                    type="number"
                    value={state.board.w}
                    onChange={(e) => update("board.w", clamp(Number(e.target.value), 0, 99999))}
                  />
                </Field>
              </div>
              <div className="col-span-12 md:col-span-4">
                <Field label="Board Height (mm)" required>
                  <Input
                    type="number"
                    value={state.board.h}
                    onChange={(e) => update("board.h", clamp(Number(e.target.value), 0, 99999))}
                  />
                </Field>
              </div>
              <div className="col-span-12 md:col-span-4">
                <Field label="Board Thickness (mm)">
                  <Input
                    type="number"
                    step="0.1"
                    value={state.board.thickness}
                    onChange={(e) => update("board.thickness", clamp(Number(e.target.value), 0, 20))}
                  />
                </Field>
              </div>

              <div className="col-span-12 md:col-span-4">
                <Field label="Corner Radius (mm)">
                  <Input
                    type="number"
                    step="0.5"
                    value={state.board.cornerR}
                    onChange={(e) => update("board.cornerR", clamp(Number(e.target.value), 0, 50))}
                  />
                </Field>
              </div>

              <div className="col-span-12 md:col-span-4">
                <Field label="Rotation (deg)">
                  <Input
                    type="number"
                    step="90"
                    value={state.board.rotation}
                    onChange={(e) => update("board.rotation", Number(e.target.value))}
                  />
                </Field>
              </div>

              <div className="col-span-12 md:col-span-4">
                <Field label="Gerber Upload (optional)">
                  <Button type="button" variant="outline" className="w-full justify-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Upload Gerber
                  </Button>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Connect this to your existing GerberUpload component/API.
                  </div>
                </Field>
              </div>
            </div>
          </Card>

          {/* Array */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <SquareStack className="h-4 w-4" />
                <div className="font-semibold">Array</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Array: {derived.count} boards • {formatMm(derived.arrayW)} × {formatMm(derived.arrayH)}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6 md:col-span-3">
                <Field label="Cols" required>
                  <Input
                    type="number"
                    value={state.array.cols}
                    onChange={(e) => update("array.cols", clamp(Number(e.target.value), 1, 999))}
                  />
                </Field>
              </div>
              <div className="col-span-6 md:col-span-3">
                <Field label="Rows" required>
                  <Input
                    type="number"
                    value={state.array.rows}
                    onChange={(e) => update("array.rows", clamp(Number(e.target.value), 1, 999))}
                  />
                </Field>
              </div>

              <div className="col-span-6 md:col-span-3">
                <Field label="Gap X (mm)">
                  <Input
                    type="number"
                    value={state.array.gapX}
                    onChange={(e) => update("array.gapX", clamp(Number(e.target.value), 0, 9999))}
                  />
                </Field>
              </div>
              <div className="col-span-6 md:col-span-3">
                <Field label="Gap Y (mm)">
                  <Input
                    type="number"
                    value={state.array.gapY}
                    onChange={(e) => update("array.gapY", clamp(Number(e.target.value), 0, 9999))}
                  />
                </Field>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Field label="Origin">
                  <select
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={state.array.origin}
                    onChange={(e) => update("array.origin", e.target.value)}
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top-left</option>
                  </select>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Origin affects where the array is placed in the panel (simulator respects this).
                  </div>
                </Field>
              </div>

              <div className="col-span-12 md:col-span-6">
                <Field label="Quick fit">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // naive “fit” attempt: maximize count by spacing
                        const usableW = derived.usableW;
                        const usableH = derived.usableH;
                        const bw = safeNum(state.board.w);
                        const bh = safeNum(state.board.h);
                        const gapX = safeNum(state.array.gapX);
                        const gapY = safeNum(state.array.gapY);

                        const cols = bw + gapX > 0 ? Math.floor((usableW + gapX) / (bw + gapX)) : 1;
                        const rows = bh + gapY > 0 ? Math.floor((usableH + gapY) / (bh + gapY)) : 1;

                        update("array.cols", clamp(cols, 1, 999));
                        update("array.rows", clamp(rows, 1, 999));
                      }}
                    >
                      Fit Best
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // reset array defaults
                        update("array.cols", 6);
                        update("array.rows", 6);
                        update("array.gapX", 3);
                        update("array.gapY", 3);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </Field>
              </div>
            </div>
          </Card>

          {/* Save area / Validation */}
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-semibold">Validation</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {validate().length ? (
                    <span className="text-destructive">{validate()[0]}</span>
                  ) : derived.fits ? (
                    <span className="text-emerald-600">Ready to save & simulate.</span>
                  ) : (
                    <span className="text-destructive">Array does not fit; adjust rails/rows/cols/gaps.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button variant="outline" onClick={() => setState(DEFAULT_STATE)}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="ml-2">Clear</span>
                </Button>

                <Button onClick={() => saveJob({ openSimulator: false })} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="ml-2">Save Draft</span>
                </Button>

                <Button onClick={() => saveJob({ openSimulator: true })} disabled={saving || validate().length > 0}>
                  <ArrowRight className="h-4 w-4" />
                  <span className="ml-2">Save & Open Simulator</span>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------------------- Small UI helpers ---------------------------- */

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, hint }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint ? <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div> : null}
      </div>

      <label className="inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={cx(
            "relative inline-flex h-6 w-11 items-center rounded-full border transition",
            checked ? "bg-primary/20" : "bg-muted/40"
          )}
        >
          <span
            className={cx(
              "inline-block h-5 w-5 transform rounded-full bg-background shadow transition",
              checked ? "translate-x-5" : "translate-x-1"
            )}
          />
        </span>
      </label>
    </div>
  );
}
