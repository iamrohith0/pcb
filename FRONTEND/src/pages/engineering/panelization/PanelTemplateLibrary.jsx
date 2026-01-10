// src/pages/engineering/panelization/PanelTemplateLibrary.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  FilePlus2,
  Filter,
  Grid3X3,
  LayoutTemplate,
  Loader2,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Download,
  BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

import panelizationService from "@/services/engineering/panelization.service";

/**
 * PanelTemplateLibrary.jsx
 * ------------------------------------------------------------
 * A template library for panelization presets:
 * - Browse templates
 * - Search + filter by category/size/tags
 * - Use template -> goes to PanelCreate with prefilled config (via query or backend clone)
 * - Create new template from current job (optional)
 * - Import / Export templates (JSON)
 *
 * Service methods (optional, fallback safe):
 * - listTemplates(params)
 * - deleteTemplate(id)
 * - createJobFromTemplate(templateId)
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

function shortId(id) {
  const s = String(id ?? "");
  if (!s) return "—";
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-3)}` : s;
}

function normalizeTemplate(t) {
  if (!t) return null;
  const id = t?.id ?? t?._id ?? t?.templateId;
  return {
    id,
    name: t?.name ?? t?.title ?? `Template ${shortId(id)}`,
    description: t?.description ?? "",
    category: t?.category ?? "General",
    tags: Array.isArray(t?.tags) ? t.tags : [],
    updatedAt: t?.updatedAt ?? t?.updated_at ?? t?.modifiedAt ?? null,
    createdAt: t?.createdAt ?? t?.created_at ?? t?.createdOn ?? null,

    panelW: safeNum(t?.panel?.w ?? t?.panelW),
    panelH: safeNum(t?.panel?.h ?? t?.panelH),
    rails: {
      top: safeNum(t?.panel?.rails?.top ?? t?.rails?.top),
      bottom: safeNum(t?.panel?.rails?.bottom ?? t?.rails?.bottom),
      left: safeNum(t?.panel?.rails?.left ?? t?.rails?.left),
      right: safeNum(t?.panel?.rails?.right ?? t?.rails?.right),
    },

    boardW: safeNum(t?.board?.w ?? t?.boardW),
    boardH: safeNum(t?.board?.h ?? t?.boardH),
    cornerR: safeNum(t?.board?.cornerR ?? t?.cornerR),
    rotation: safeNum(t?.board?.rotation ?? t?.rotation),

    cols: Math.max(1, Math.floor(safeNum(t?.array?.cols ?? t?.cols ?? 1))),
    rows: Math.max(1, Math.floor(safeNum(t?.array?.rows ?? t?.rows ?? 1))),
    gapX: safeNum(t?.array?.gapX ?? t?.gapX),
    gapY: safeNum(t?.array?.gapY ?? t?.gapY),

    addons: {
      toolingHoles: !!(t?.addons?.toolingHoles ?? false),
      fiducials: !!(t?.addons?.fiducials ?? false),
      vcut: !!(t?.addons?.vcut ?? false),
      mouseBites: !!(t?.addons?.mouseBites ?? false),
    },

    raw: t,
  };
}

function templateToQueryPayload(tpl) {
  // Minimal query payload to prefill PanelCreate
  // (PanelCreate can read "tpl" param as JSON string)
  const payload = {
    name: tpl.name,
    description: tpl.description,
    panelW: tpl.panelW,
    panelH: tpl.panelH,
    rails: tpl.rails,
    boardW: tpl.boardW,
    boardH: tpl.boardH,
    cornerR: tpl.cornerR,
    rotation: tpl.rotation,
    cols: tpl.cols,
    rows: tpl.rows,
    gapX: tpl.gapX,
    gapY: tpl.gapY,
    addons: tpl.addons,
    templateId: tpl.id,
  };
  return encodeURIComponent(JSON.stringify(payload));
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

export default function PanelTemplateLibrary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");

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
      if (panelizationService?.listTemplates) {
        res = await panelizationService.listTemplates({
          q: q?.trim() || undefined,
          category: category !== "all" ? category : undefined,
        });
      } else if (panelizationService?.getTemplates) {
        res = await panelizationService.getTemplates();
      } else if (panelizationService?.listPanelTemplates) {
        res = await panelizationService.listPanelTemplates();
      } else {
        // fallback: show built-in templates
        res = { data: BUILTIN_TEMPLATES };
      }

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

      setTemplates(list.map(normalizeTemplate).filter(Boolean));
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load templates.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set(["all"]);
    templates.forEach((t) => set.add((t.category || "General").toLowerCase()));
    return Array.from(set).map((c) => (c === "all" ? "all" : c));
  }, [templates]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const cat = category.toLowerCase();

    return templates.filter((t) => {
      const okCat = cat === "all" ? true : (t.category || "").toLowerCase() === cat;
      if (!okCat) return false;

      if (!qq) return true;

      const hay = [
        t.name,
        t.description,
        t.category,
        ...(t.tags || []),
        `${t.panelW}x${t.panelH}`,
        `${t.cols}x${t.rows}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [templates, q, category]);

  function applyFilters() {
    const next = new URLSearchParams(searchParams);
    if (q?.trim()) next.set("q", q.trim());
    else next.delete("q");

    if (category && category !== "all") next.set("category", category);
    else next.delete("category");

    setSearchParams(next, { replace: true });
  }

  async function onRefresh() {
    setRefreshing(true);
    await load({ silent: true });
  }

  async function onUseTemplate(tpl) {
    // Preferred: backend clones template -> create a job -> open create/simulator
    try {
      if (panelizationService?.createJobFromTemplate) {
        const res = await panelizationService.createJobFromTemplate(tpl.id);
        const created = res?.data ?? res?.item ?? res;
        const newId = created?.id ?? created?._id ?? created?.jobId ?? created?.panelJobId;
        if (newId) {
          toast({ title: "Template applied", description: "Opening job…" });
          navigate(`/engineering/panelization/simulator?jobId=${encodeURIComponent(newId)}`);
          return;
        }
      }
    } catch (e) {
      // fall back to query prefill
      console.warn("createJobFromTemplate failed, using query prefill", e);
    }

    const tplParam = templateToQueryPayload(tpl);
    navigate(`/engineering/panelization/create?tpl=${tplParam}`);
  }

  async function copyTemplateJson(tpl) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tpl.raw ?? tpl, null, 2));
      toast({ title: "Copied", description: "Template JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  }

  async function exportTemplateJson(tpl) {
    const payload = tpl.raw ?? tpl;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${safeStr(tpl.name, "panel_template").replaceAll(" ", "_")}.json`);
    toast({ title: "Exported", description: "Template JSON downloaded." });
  }

  function askDelete(tpl) {
    setConfirm({
      open: true,
      title: `Delete "${tpl.name}"?`,
      description: "This will permanently remove the template.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          if (panelizationService?.deleteTemplate) await panelizationService.deleteTemplate(tpl.id);
          else if (panelizationService?.removeTemplate) await panelizationService.removeTemplate(tpl.id);
          else if (panelizationService?.deletePanelTemplate) await panelizationService.deletePanelTemplate(tpl.id);
          else {
            // fallback: remove locally only
            setTemplates((prev) => prev.filter((x) => x.id !== tpl.id));
            toast({ title: "Removed locally", description: "No delete API found; removed from view." });
          }

          toast({ title: "Deleted", description: "Template removed successfully." });
          setTemplates((prev) => prev.filter((x) => x.id !== tpl.id));
        } catch (e) {
          toast({ title: "Delete failed", description: e?.message || "Unable to delete template.", variant: "destructive" });
        } finally {
          setConfirm((c) => ({ ...c, open: false }));
        }
      },
    });
  }

  function onImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(String(reader.result || "{}"));
        // If backend supports createTemplate -> send it
        if (panelizationService?.createTemplate) {
          await panelizationService.createTemplate(json);
          toast({ title: "Imported", description: "Template added." });
          onRefresh();
          return;
        }

        // fallback: local append
        const norm = normalizeTemplate({ ...json, _id: `local_${Date.now()}` });
        if (norm) {
          setTemplates((prev) => [norm, ...prev]);
          toast({ title: "Imported locally", description: "No API found; template stored for this session only." });
        }
      } catch (e) {
        toast({ title: "Import failed", description: "Invalid JSON file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  }

  if (loading) {
    return (
      <div className="p-4">
        <LoadingState title="Loading templates…" description="Fetching panel presets…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState title="Template library failed" description={error} actionLabel="Back" onAction={() => navigate("/engineering/panelization")} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Panel Template Library"
        subtitle="Reusable panelization presets for fast job creation"
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" asChild>
              <Link to="/engineering/panelization">
                <ArrowLeft className="h-4 w-4" />
                <span className="ml-2">Dashboard</span>
              </Link>
            </Button>

            <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Grid3X3 className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>

            <Button asChild>
              <Link to="/engineering/panelization/create">
                <FilePlus2 className="h-4 w-4" />
                <span className="ml-2">New Job</span>
              </Link>
            </Button>

            {/* Import JSON */}
            <label className="inline-flex">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => onImportFile(e.target.files?.[0])}
              />
              <Button variant="outline" type="button">
                <Upload className="h-4 w-4" />
                <span className="ml-2">Import</span>
              </Button>
            </label>
          </div>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-12 md:col-span-6">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search templates by name, size, tags…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <Label className="text-xs">Category</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 md:col-span-2 flex gap-2">
            <Button className="w-full" onClick={applyFilters}>
              <Filter className="h-4 w-4" />
              <span className="ml-2">Apply</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No templates found"
            description="Try clearing filters or import a JSON template."
            actionLabel="Create New Job"
            onAction={() => navigate("/engineering/panelization/create")}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          {filtered.map((tpl, idx) => (
            <motion.div
              key={tpl.id}
              className="col-span-12 md:col-span-6 xl:col-span-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.02 }}
            >
              <Card className="p-4 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                      <div className="font-semibold truncate">{tpl.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {tpl.description || "—"}
                    </div>
                  </div>

                  <Badge variant="secondary" className="shrink-0">
                    {tpl.category || "General"}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-12 gap-2 text-xs">
                  <Stat label="Panel" value={`${tpl.panelW || "—"}×${tpl.panelH || "—"} mm`} />
                  <Stat label="Array" value={`${tpl.cols || "—"}×${tpl.rows || "—"}`} />
                  <Stat label="Gap" value={`${tpl.gapX ?? "—"}/${tpl.gapY ?? "—"} mm`} />
                  <Stat label="Board" value={`${tpl.boardW || "—"}×${tpl.boardH || "—"} mm`} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(tpl.tags || []).slice(0, 4).map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                  {(tpl.tags || []).length > 4 ? (
                    <Badge variant="outline">+{(tpl.tags || []).length - 4}</Badge>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="flex-1" onClick={() => onUseTemplate(tpl)}>
                    <Sparkles className="h-4 w-4" />
                    <span className="ml-2">Use Template</span>
                  </Button>

                  <Button variant="outline" onClick={() => copyTemplateJson(tpl)}>
                    <Copy className="h-4 w-4" />
                  </Button>

                  <Button variant="outline" onClick={() => exportTemplateJson(tpl)}>
                    <Download className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/engineering/panelization/create?tpl=${templateToQueryPayload(tpl)}&editTemplate=1`)
                    }
                    title="Edit as new job (or edit template if supported)"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button variant="destructive" onClick={() => askDelete(tpl)} title="Delete template">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    ID: {shortId(tpl.id)}
                  </span>
                  <span>{tpl.updatedAt ? "Updated" : "Built-in"}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

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

function Stat({ label, value }) {
  return (
    <div className="col-span-6 rounded-lg border p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

/**
 * Built-in templates if backend doesn't provide template APIs yet.
 * You can delete these once your backend endpoints exist.
 */
const BUILTIN_TEMPLATES = [
  {
    _id: "builtin_std_457x610",
    name: "Standard FR4 Panel (457×610)",
    description: "Common PCB panel size with standard rails. Good default for SMT lines.",
    category: "standard",
    tags: ["FR4", "SMT", "Default"],
    panel: { w: 457, h: 610, rails: { top: 10, bottom: 10, left: 5, right: 5 } },
    board: { w: 50, h: 70, cornerR: 2, rotation: 0 },
    array: { cols: 6, rows: 6, gapX: 3, gapY: 3, origin: "center" },
    addons: { toolingHoles: true, fiducials: true, vcut: false, mouseBites: false },
  },
  {
    _id: "builtin_vcut_400x500",
    name: "V-Cut Production (400×500)",
    description: "Optimized for V-cut separation with tighter gaps and fiducials enabled.",
    category: "production",
    tags: ["V-Cut", "Production", "Fast"],
    panel: { w: 400, h: 500, rails: { top: 12, bottom: 12, left: 6, right: 6 } },
    board: { w: 45, h: 55, cornerR: 1, rotation: 0 },
    array: { cols: 7, rows: 7, gapX: 2, gapY: 2, origin: "center" },
    addons: { toolingHoles: true, fiducials: true, vcut: true, mouseBites: false },
  },
  {
    _id: "builtin_mousebites_proto",
    name: "Prototype Mouse-Bites (300×450)",
    description: "Prototype-friendly panel with mouse-bites separation and larger spacing.",
    category: "prototype",
    tags: ["Mouse-Bites", "Prototype"],
    panel: { w: 300, h: 450, rails: { top: 10, bottom: 10, left: 8, right: 8 } },
    board: { w: 60, h: 80, cornerR: 3, rotation: 90 },
    array: { cols: 4, rows: 4, gapX: 5, gapY: 5, origin: "center" },
    addons: { toolingHoles: false, fiducials: true, vcut: false, mouseBites: true },
  },
];
