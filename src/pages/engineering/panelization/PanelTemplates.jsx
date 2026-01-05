// src/pages/engineering/panelization/PanelTemplates.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  FileSearch2,
  Layers,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import panelizationService from "@/services/engineering/panelization.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(v) {
  try {
    if (!v) return "—";
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

/** Mock templates (used if backend not wired yet) */
function mockTemplates() {
  return [
    {
      id: "TPL-STD-001",
      name: "Standard FR4 (V-Score) 18×24",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
      createdBy: "Admin",
      tags: ["FR4", "V-SCORE", "Standard"],
      defaults: {
        panelSize: { wMm: 457, hMm: 610 },
        railMm: 10,
        fiducials: "GLOBAL",
        toolingHoles: true,
        separation: "V_SCORE",
        breakAway: false,
      },
      status: "ACTIVE",
      usageCount: 48,
    },
    {
      id: "TPL-STD-002",
      name: "Tab Route (Mouse-bite) 16×22",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
      createdBy: "CAM",
      tags: ["TAB-ROUTE", "Mouse-bite"],
      defaults: {
        panelSize: { wMm: 406, hMm: 559 },
        railMm: 12,
        fiducials: "GLOBAL",
        toolingHoles: true,
        separation: "TAB_ROUTE",
        breakAway: true,
      },
      status: "ACTIVE",
      usageCount: 22,
    },
    {
      id: "TPL-CUST-009",
      name: "RF Shield (Edge Rails + Coupons)",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      createdBy: "Engineer",
      tags: ["RF", "COUPONS", "CUSTOM"],
      defaults: {
        panelSize: { wMm: 500, hMm: 600 },
        railMm: 15,
        fiducials: "PER_ARRAY",
        toolingHoles: true,
        separation: "TAB_ROUTE",
        breakAway: true,
      },
      status: "DRAFT",
      usageCount: 0,
    },
  ];
}

function StatusBadge({ value }) {
  const v = safeStr(value, "—");
  if (v === "ACTIVE") return <Badge className="bg-emerald-600 hover:bg-emerald-600">ACTIVE</Badge>;
  if (v === "DRAFT") return <Badge className="bg-slate-600 hover:bg-slate-600">DRAFT</Badge>;
  return <Badge variant="secondary">{v}</Badge>;
}

function Pill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs text-gray-700">
      <Icon className="h-3.5 w-3.5 text-gray-500" />
      {label}
    </span>
  );
}

export default function PanelTemplates() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [onlyActive, setOnlyActive] = useState(searchParams.get("active") === "1");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // When backend is ready:
      // const res = await panelizationService.listTemplates();
      // setRows(res.data ?? []);

      setRows(mockTemplates());
    } catch (e) {
      toast({
        title: "Failed to load templates",
        description: "Could not fetch panel templates.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (query) next.set("q", query);
    else next.delete("q");

    if (onlyActive) next.set("active", "1");
    else next.delete("active");

    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, onlyActive]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(rows) ? rows : [];
    const activeFiltered = onlyActive ? list.filter((t) => t.status === "ACTIVE") : list;

    if (!q) return activeFiltered;

    return activeFiltered.filter((t) => {
      const hay = [
        t.id,
        t.name,
        t.createdBy,
        ...(Array.isArray(t.tags) ? t.tags : []),
        t.defaults?.separation,
        t.defaults?.fiducials,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, query, onlyActive]);

  const handleDuplicate = async (tpl) => {
    try {
      // Backend idea:
      // const res = await panelizationService.duplicateTemplate({ templateId: tpl.id });
      // toast({ title: "Template duplicated", description: `Created ${res.data?.id || "new template"}` });

      toast({ title: "Template duplicated", description: `A copy of "${tpl.name}" is ready to edit.` });
    } catch {
      toast({ title: "Failed", description: "Could not duplicate template.", variant: "destructive" });
    }
  };

  const handleDelete = async (tpl) => {
    // For now, front-end only (you can wire with ConfirmationDialog later)
    const ok = window.confirm(`Delete template "${tpl.name}"?`);
    if (!ok) return;

    try {
      // await panelizationService.deleteTemplate({ templateId: tpl.id });
      setRows((prev) => prev.filter((x) => x.id !== tpl.id));
      toast({ title: "Deleted", description: "Template removed." });
    } catch {
      toast({ title: "Failed", description: "Could not delete template.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Panel Templates</h1>
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              CAM / Panelization
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Standardize panel setups (rails, fiducials, tooling holes, separation method) and reuse across jobs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Link to="/engineering/panelization/templates/create" className="inline-flex">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <FileSearch2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates: id, name, tag, separation..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyActive((v) => !v)}
              className={cx(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                onlyActive ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Active only
            </button>

            <Badge variant="outline" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              {filtered.length} results
            </Badge>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading templates...
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-700">No templates found.</p>
          <p className="mt-1 text-xs text-gray-500">Try clearing search or create a new template.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((t) => {
            const size = t.defaults?.panelSize ? `${t.defaults.panelSize.wMm} × ${t.defaults.panelSize.hMm} mm` : "—";
            const sep = t.defaults?.separation ? t.defaults.separation.replaceAll("_", " ") : "—";
            const fid = t.defaults?.fiducials ? t.defaults.fiducials.replaceAll("_", " ") : "—";
            const rail = typeof t.defaults?.railMm === "number" ? `${t.defaults.railMm} mm` : "—";

            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <Card className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/engineering/panelization/templates/${encodeURIComponent(t.id)}`}
                          className="text-base font-extrabold text-gray-900 hover:underline"
                        >
                          {t.name}
                        </Link>
                        <Badge variant="outline">ID: {t.id}</Badge>
                        <StatusBadge value={t.status} />
                        {typeof t.usageCount === "number" ? (
                          <Badge variant="secondary" className="gap-1.5">
                            <Tag className="h-3.5 w-3.5" />
                            Used: {t.usageCount}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {fmtDate(t.createdAt)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-gray-700">By {t.createdBy || "—"}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Pill icon={Layers} label={`Panel: ${size}`} />
                        <Pill icon={Wrench} label={`Rails: ${rail}`} />
                        <Pill icon={Settings2} label={`Fiducials: ${fid}`} />
                        <Pill icon={LayoutGrid} label={`Separation: ${sep}`} />
                      </div>

                      {Array.isArray(t.tags) && t.tags.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {t.tags.slice(0, 8).map((x) => (
                            <Badge key={x} variant="outline" className="text-xs">
                              {x}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Link to={`/engineering/panelization/templates/${encodeURIComponent(t.id)}`} className="inline-flex">
                        <Button variant="outline">Open</Button>
                      </Link>

                      <Link to={`/engineering/panelization/templates/${encodeURIComponent(t.id)}/edit`} className="inline-flex">
                        <Button>Edit</Button>
                      </Link>

                      <Button variant="outline" className="gap-2" onClick={() => handleDuplicate(t)}>
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </Button>

                      <Button variant="ghost" className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(t)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
