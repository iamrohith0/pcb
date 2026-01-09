// src/pages/engineering/stackup/MaterialRules.jsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import stackupService from "@/services/engineering/stackup.service";

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
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Copy,
  FileDown,
  FilePlus2,
  Filter,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

/**
 * MaterialRules.jsx (PCBxpress / PCB Manufacturing ERP)
 *
 * Suggested route:
 *   /engineering/stackup/material-rules
 *
 * Purpose:
 *   Define and enforce stackup/material constraints for quoting + CAM/DFM.
 *   Examples:
 *     - Allowed dielectrics by layer count
 *     - Min/Max thickness ranges
 *     - Allowed copper weights
 *     - Controlled impedance availability
 *     - Min drill / annular ring policy
 *
 * Backend integration (replace mocks):
 *   GET    /engineering/stackup/material-rules?search=&layers=&active=&page=&pageSize=
 *   POST   /engineering/stackup/material-rules
 *   PUT    /engineering/stackup/material-rules/:id
 *   DELETE /engineering/stackup/material-rules/:id
 */

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "-";
  }
}

function boolBadge(active) {
  return active ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-800";
}

function riskBadge(risk) {
  if (risk === "Low") return "bg-emerald-600 text-white";
  if (risk === "Medium") return "bg-amber-500 text-white";
  if (risk === "High") return "bg-red-600 text-white";
  return "bg-gray-100 text-gray-900";
}

function normalizeRule(raw = {}) {
  const familiesRaw = raw.dielectricFamilies ?? raw.dielectric_families ?? raw.dielectricFamilies ?? [];
  const dielectricFamilies = Array.isArray(familiesRaw)
    ? familiesRaw
    : String(familiesRaw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    id: raw.id ?? raw.rule_id ?? raw.uuid ?? "",
    name: raw.name ?? raw.rule_name ?? "",
    layers: raw.layers ?? raw.layer_count ?? null,
    dielectricFamilies,
    tg: raw.tg ?? raw.tg_rating ?? "",
    thicknessMin: raw.thicknessMin ?? raw.thickness_min_mm ?? raw.thickness_min ?? null,
    thicknessMax: raw.thicknessMax ?? raw.thickness_max_mm ?? raw.thickness_max ?? null,
    copperOuter: raw.copperOuter ?? raw.copper_outer ?? "",
    copperInner: raw.copperInner ?? raw.copper_inner ?? "",
    impedance: raw.impedance ?? raw.controlled_impedance ?? false,
    minTrace: raw.minTrace ?? raw.min_trace_mil ?? raw.min_trace ?? null,
    minSpace: raw.minSpace ?? raw.min_space_mil ?? raw.min_space ?? null,
    minDrill: raw.minDrill ?? raw.min_drill_mm ?? raw.min_drill ?? null,
    annularRing: raw.annularRing ?? raw.annular_ring_mm ?? raw.annular_ring ?? null,
    risk: raw.risk ?? raw.risk_level ?? "",
    active: typeof raw.active === "boolean" ? raw.active : raw.is_active ?? true,
    notes: raw.notes ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at ?? raw.modified_at ?? "",
    updatedBy: raw.updatedBy ?? raw.updated_by ?? raw.modified_by ?? "",
  };
}

function normalizeListPayload(payload) {
  const itemsRaw = payload?.items ?? payload?.data?.items ?? payload?.data ?? payload ?? [];
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeRule) : [];
  return {
    items,
    total: payload?.total ?? payload?.data?.total ?? items.length,
    page: payload?.page ?? payload?.data?.page ?? 1,
    pageSize: payload?.pageSize ?? payload?.data?.pageSize ?? items.length || 10,
  };
}

const DEFAULT_FORM = {
  id: null,
  name: "",
  layers: 2,
  dielectricFamilies: "FR4",
  tg: "TG150",
  thicknessMin: 1.6,
  thicknessMax: 1.6,
  copperOuter: "1 oz",
  copperInner: "0.5 oz",
  impedance: false,
  minTrace: 4,
  minSpace: 4,
  minDrill: 0.30,
  annularRing: 0.10,
  risk: "Low",
  active: true,
  notes: "",
};

export default function MaterialRules() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 10 });

  // Filters
  const [search, setSearch] = useState("");
  const [layersFilter, setLayersFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");

  // Create/Edit
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const query = useMemo(
    () => ({
      search,
      layers: layersFilter,
      active: activeFilter,
      page: meta.page,
      pageSize: meta.pageSize,
    }),
    [search, layersFilter, activeFilter, meta.page, meta.pageSize]
  );

  const totalPages = useMemo(() => {
    const p = Math.ceil((meta.total || 0) / (meta.pageSize || 10));
    return Math.max(1, p);
  }, [meta.total, meta.pageSize]);

  const pageInfo = useMemo(() => {
    const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
    const end = Math.min(meta.total, meta.page * meta.pageSize);
    return { start, end };
  }, [meta]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await stackupService.listMaterialRules(query);
      const normalized = normalizeListPayload(res);
      setRows(normalized.items);
      setMeta((m) => ({
        ...m,
        total: normalized.total || 0,
        page: normalized.page || m.page,
        pageSize: normalized.pageSize || m.pageSize,
      }));
    } catch {
      toast({ title: "Load failed", description: "Could not load material rules.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.page, meta.pageSize]);

  const applyFilters = () => {
    setMeta((m) => ({ ...m, page: 1 }));
    fetchList();
  };

  const clearFilters = () => {
    setSearch("");
    setLayersFilter("All");
    setActiveFilter("All");
    setMeta((m) => ({ ...m, page: 1 }));
    // run after state update tick
    setTimeout(fetchList, 0);
  };

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM, id: null });
    setEditorOpen(true);
  };

  const openEdit = (r) => {
    setForm({
      id: r.id,
      name: r.name,
      layers: r.layers,
      dielectricFamilies: (r.dielectricFamilies || []).join(", "),
      tg: r.tg,
      thicknessMin: r.thicknessMin,
      thicknessMax: r.thicknessMax,
      copperOuter: r.copperOuter,
      copperInner: r.copperInner === "-" ? "" : r.copperInner,
      impedance: !!r.impedance,
      minTrace: r.minTrace,
      minSpace: r.minSpace,
      minDrill: r.minDrill,
      annularRing: r.annularRing,
      risk: r.risk,
      active: !!r.active,
      notes: r.notes || "",
    });
    setEditorOpen(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Rule name is required.";
    if (!Number(form.layers) || Number(form.layers) < 1) return "Layers must be a valid number.";
    if (Number(form.thicknessMin) <= 0 || Number(form.thicknessMax) <= 0) return "Thickness values must be > 0.";
    if (Number(form.thicknessMin) > Number(form.thicknessMax)) return "Thickness min cannot exceed thickness max.";
    if (Number(form.minTrace) <= 0 || Number(form.minSpace) <= 0) return "Trace/space must be > 0.";
    if (Number(form.minDrill) <= 0) return "Min drill must be > 0.";
    if (Number(form.annularRing) <= 0) return "Annular ring must be > 0.";
    return null;
  };

  const saveRule = async () => {
    const err = validateForm();
    if (err) {
      toast({ title: "Validation", description: err, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        layers: Number(form.layers),
        dielectricFamilies: form.dielectricFamilies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tg: form.tg,
        thicknessMin: Number(form.thicknessMin),
        thicknessMax: Number(form.thicknessMax),
        copperOuter: form.copperOuter,
        copperInner: form.copperInner ? form.copperInner : "-",
        impedance: !!form.impedance,
        minTrace: Number(form.minTrace),
        minSpace: Number(form.minSpace),
        minDrill: Number(form.minDrill),
        annularRing: Number(form.annularRing),
        risk: form.risk,
        active: !!form.active,
        notes: form.notes?.trim() || "",
        updatedAt: new Date().toISOString(),
        updatedBy: "You",
      };

      if (form.id) {
        await stackupService.updateMaterialRule(form.id, payload);
        toast({ title: "Updated", description: "Material rule updated successfully." });
      } else {
        await stackupService.createMaterialRule(payload);
        toast({ title: "Created", description: "Material rule created successfully." });
      }

      setEditorOpen(false);
      setForm({ ...DEFAULT_FORM });
      fetchList();
    } catch {
      toast({ title: "Save failed", description: "Could not save rule.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyRule = async (r) => {
    const text = [
      `Rule: ${r.name}`,
      `Layers: ${r.layers}L`,
      `Dielectric: ${(r.dielectricFamilies || []).join(", ")}`,
      `TG: ${r.tg}`,
      `Thickness: ${r.thicknessMin}–${r.thicknessMax} mm`,
      `Copper: Outer ${r.copperOuter}${r.copperInner && r.copperInner !== "-" ? `, Inner ${r.copperInner}` : ""}`,
      `Impedance: ${r.impedance ? "Yes" : "No"}`,
      `Min: ${r.minTrace}/${r.minSpace} mil, Drill ${r.minDrill} mm, Ring ${r.annularRing} mm`,
      `Risk: ${r.risk}`,
      `Active: ${r.active ? "Yes" : "No"}`,
      `Updated: ${formatDate(r.updatedAt)} by ${r.updatedBy}`,
      r.notes ? `Notes: ${r.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Rule details copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard not available.", variant: "destructive" });
    }
  };

  const openDelete = (r) => {
    setDeleteTarget(r);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await stackupService.deleteMaterialRule(deleteTarget.id);
      toast({ title: "Deleted", description: "Material rule deleted." });
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchList();
    } catch {
      toast({ title: "Delete failed", description: "Could not delete rule.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Name",
      "Layers",
      "Dielectrics",
      "TG",
      "ThicknessMin(mm)",
      "ThicknessMax(mm)",
      "CopperOuter",
      "CopperInner",
      "Impedance",
      "MinTrace(mil)",
      "MinSpace(mil)",
      "MinDrill(mm)",
      "AnnularRing(mm)",
      "Risk",
      "Active",
      "UpdatedAt",
      "UpdatedBy",
      "Notes",
    ];

    const lines = rows.map((r) => [
      r.name,
      r.layers,
      (r.dielectricFamilies || []).join("|"),
      r.tg,
      r.thicknessMin,
      r.thicknessMax,
      r.copperOuter,
      r.copperInner,
      r.impedance ? "Yes" : "No",
      r.minTrace,
      r.minSpace,
      r.minDrill,
      r.annularRing,
      r.risk,
      r.active ? "Yes" : "No",
      r.updatedAt,
      r.updatedBy,
      (r.notes || "").replaceAll("\n", " "),
    ]);

    const csv = [headers, ...lines]
      .map((row) =>
        row
          .map((v) => {
            const s = String(v ?? "");
            if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
            return s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `material_rules_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast({ title: "Exported", description: "CSV downloaded." });
  };

  const goPage = (p) => {
    setMeta((m) => ({ ...m, page: Math.min(Math.max(1, p), totalPages) }));
  };

  // Basic health indicator: if a rule is "Released/Active" but has risky tight values, flag in UI.
  const computeWarnings = (r) => {
    const warnings = [];
    if (r.active && r.risk === "High") warnings.push("High risk rule is active");
    if (r.minTrace <= 3 || r.minSpace <= 3) warnings.push("Tight trace/space");
    if (r.minDrill <= 0.20) warnings.push("Small drill");
    return warnings;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Material Rules</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define stackup/material constraints used by Quoting, CAM/DFM, and Routing (capability gates).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchList} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={rows.length === 0}>
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={openCreate}>
            <FilePlus2 className="h-4 w-4" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-gray-600" />
            Filters
          </CardTitle>
          <CardDescription>Search by rule name, dielectric family, TG, copper, risk.</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="FR4, TG170, 4L, ENIG, tight drill..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Layers</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={layersFilter}
                onChange={(e) => setLayersFilter(e.target.value)}
              >
                {["All", "2", "4", "6", "8", "10", "12"].map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? "All" : `${x}L`}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <Label>Active</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                {[
                  { label: "All", value: "All" },
                  { label: "Active", value: "true" },
                  { label: "Inactive", value: "false" },
                ].map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-10">
              <div className="mt-6 flex items-start gap-2 rounded-lg border bg-gray-50 p-3 text-xs text-gray-600">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                These rules should match your factory capability sheet (min trace/space, drill, copper, TG families).
              </div>
            </div>

            <div className="md:col-span-2 flex items-end justify-end gap-2">
              <Button type="button" variant="outline" onClick={clearFilters} className="w-full">
                Clear
              </Button>
              <Button type="button" className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={applyFilters}>
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-600" />
              Rules
            </span>

            <div className="text-xs text-gray-500">
              {meta.total ? (
                <>
                  Showing <span className="font-medium text-gray-800">{pageInfo.start}</span>–
                  <span className="font-medium text-gray-800">{pageInfo.end}</span> of{" "}
                  <span className="font-medium text-gray-800">{meta.total}</span>
                </>
              ) : (
                "No records"
              )}
            </div>
          </CardTitle>
          <CardDescription>Use Active rules to gate quotes and enforce CAM defaults.</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="py-3 pr-3">Rule</th>
                  <th className="py-3 pr-3">Stackup</th>
                  <th className="py-3 pr-3">Limits</th>
                  <th className="py-3 pr-3">Risk</th>
                  <th className="py-3 pr-3">Active</th>
                  <th className="py-3 pr-3">Updated</th>
                  <th className="py-3 pr-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading rules...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      No rules found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const warnings = computeWarnings(r);
                    return (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{r.name}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                  <Layers className="h-3.5 w-3.5" />
                                  {r.layers}L
                                </span>
                                <Badge className="rounded-full bg-gray-100 text-gray-900">{r.tg}</Badge>
                                <Badge className="rounded-full bg-gray-100 text-gray-900">
                                  {(r.dielectricFamilies || []).join(", ")}
                                </Badge>
                                {r.impedance ? (
                                  <Badge className="rounded-full bg-sky-600 text-white">Impedance</Badge>
                                ) : (
                                  <Badge className="rounded-full bg-gray-200 text-gray-800">No Impedance</Badge>
                                )}
                              </div>
                              {r.notes ? (
                                <div className="mt-2 max-w-[520px] truncate text-xs text-gray-600">{r.notes}</div>
                              ) : null}
                            </div>

                            {warnings.length ? (
                              <div className="mt-0.5 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                                <AlertTriangle className="h-4 w-4" />
                                {warnings[0]}
                              </div>
                            ) : (
                              <div className="mt-0.5 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200">
                                <CheckCircle2 className="h-4 w-4" />
                                OK
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 pr-3">
                          <div className="space-y-1 text-gray-700">
                            <div className="text-xs text-gray-500">Thickness</div>
                            <div className="font-medium">
                              {r.thicknessMin}–{r.thicknessMax} mm
                            </div>
                            <div className="text-xs text-gray-500 mt-2">Copper</div>
                            <div className="font-medium">
                              Outer {r.copperOuter}
                              {r.copperInner && r.copperInner !== "-" ? ` • Inner ${r.copperInner}` : ""}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-3">
                          <div className="space-y-1 text-gray-700">
                            <div className="text-xs text-gray-500">Trace / Space</div>
                            <div className="font-medium">
                              {r.minTrace}/{r.minSpace} mil
                            </div>
                            <div className="text-xs text-gray-500 mt-2">Drill / Ring</div>
                            <div className="font-medium">
                              {r.minDrill} mm • {r.annularRing} mm
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-3">
                          <Badge className={cx("rounded-full", riskBadge(r.risk))}>{r.risk}</Badge>
                        </td>

                        <td className="py-3 pr-3">
                          <Badge className={cx("rounded-full", boolBadge(r.active))}>{r.active ? "Active" : "Inactive"}</Badge>
                        </td>

                        <td className="py-3 pr-3">
                          <div className="text-gray-700">{formatDate(r.updatedAt)}</div>
                          <div className="text-xs text-gray-500">{r.updatedBy}</div>
                        </td>

                        <td className="py-3 pr-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => copyRule(r)}
                            >
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEdit(r)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openDelete(r)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-800">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-800">{totalPages}</span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => goPage(1)} disabled={meta.page <= 1}>
                First
              </Button>
              <Button variant="outline" onClick={() => goPage(meta.page - 1)} disabled={meta.page <= 1}>
                Prev
              </Button>
              <Button variant="outline" onClick={() => goPage(meta.page + 1)} disabled={meta.page >= totalPages}>
                Next
              </Button>
              <Button variant="outline" onClick={() => goPage(totalPages)} disabled={meta.page >= totalPages}>
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Dialog (uses AlertDialog for consistency with your UI kit) */}
      <AlertDialog open={editorOpen} onOpenChange={setEditorOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-gray-700" />
              {form.id ? "Edit Material Rule" : "Create Material Rule"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Define your factory capability constraints. These rules can be used as defaults for quoting and CAM.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-8">
              <Label>Rule Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Standard FR4 — 4 Layer (Impedance Ready)"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-4">
              <Label>Layers</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={String(form.layers)}
                onChange={(e) => setForm((f) => ({ ...f, layers: Number(e.target.value) }))}
              >
                {[1, 2, 4, 6, 8, 10, 12].map((x) => (
                  <option key={x} value={x}>
                    {x}L
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-8">
              <Label>Dielectric Families (comma separated)</Label>
              <Input
                value={form.dielectricFamilies}
                onChange={(e) => setForm((f) => ({ ...f, dielectricFamilies: e.target.value }))}
                placeholder="FR4, High-Tg FR4, Rogers (if supported)"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-4">
              <Label>Tg</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={form.tg}
                onChange={(e) => setForm((f) => ({ ...f, tg: e.target.value }))}
              >
                {["TG150", "TG170", "TG180", "TG200"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <Label>Thickness Min (mm)</Label>
              <Input
                type="number"
                step="0.05"
                value={form.thicknessMin}
                onChange={(e) => setForm((f) => ({ ...f, thicknessMin: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="md:col-span-6">
              <Label>Thickness Max (mm)</Label>
              <Input
                type="number"
                step="0.05"
                value={form.thicknessMax}
                onChange={(e) => setForm((f) => ({ ...f, thicknessMax: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="md:col-span-6">
              <Label>Copper Outer</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={form.copperOuter}
                onChange={(e) => setForm((f) => ({ ...f, copperOuter: e.target.value }))}
              >
                {["0.5 oz", "1 oz", "2 oz", "3 oz"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <Label>Copper Inner</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={form.copperInner}
                onChange={(e) => setForm((f) => ({ ...f, copperInner: e.target.value }))}
              >
                {["", "0.5 oz", "1 oz", "2 oz"].map((x) => (
                  <option key={x || "none"} value={x}>
                    {x ? x : "—"}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <Label>Controlled Impedance</Label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={!!form.impedance}
                  onChange={(e) => setForm((f) => ({ ...f, impedance: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Enabled</span>
              </div>
            </div>

            <div className="md:col-span-4">
              <Label>Min Trace (mil)</Label>
              <Input
                type="number"
                step="0.5"
                value={form.minTrace}
                onChange={(e) => setForm((f) => ({ ...f, minTrace: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="md:col-span-4">
              <Label>Min Space (mil)</Label>
              <Input
                type="number"
                step="0.5"
                value={form.minSpace}
                onChange={(e) => setForm((f) => ({ ...f, minSpace: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="md:col-span-6">
              <Label>Min Drill (mm)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.minDrill}
                onChange={(e) => setForm((f) => ({ ...f, minDrill: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="md:col-span-6">
              <Label>Annular Ring (mm)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.annularRing}
                onChange={(e) => setForm((f) => ({ ...f, annularRing: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="md:col-span-6">
              <Label>Risk</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={form.risk}
                onChange={(e) => setForm((f) => ({ ...f, risk: e.target.value }))}
              >
                {["Low", "Medium", "High"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <Label>Active</Label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Enabled</span>
              </div>
            </div>

            <div className="md:col-span-12">
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="When to use this rule, any special approvals needed, vendor constraints..."
                className="mt-2 h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={saveRule}
              className="bg-cyan-600 hover:bg-cyan-500"
              disabled={saving}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Save Rule
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
