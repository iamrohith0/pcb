// src/pages/engineering/stackup/StackupDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

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
  CheckCircle2,
  Copy,
  Edit3,
  FileText,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

/**
 * StackupDetails.jsx (PCBxpress / PCB Manufacturing ERP)
 *
 * Routes you can use:
 *   - /engineering/stackup/:id
 *   - /engineering/stackup/:id/edit  (optional separate page)
 *
 * This page supports:
 *   - View stackup template details
 *   - Inline Edit Mode (toggle)
 *   - Save changes
 *   - Delete template
 *   - Duplicate template (creates a copy)
 *
 * Replace mock service with axios in /src/services/stackup.service.js
 */

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function num(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function mm2mil(mm) {
  return mm / 0.0254;
}

/** Mock DB */
const MOCK_DB = {
  st_1201: {
    id: "st_1201",
    name: "FR4 4L 1.6mm TG170 — Impedance Ready",
    code: "STK-4L-170-16",
    layers: 4,
    materialFamily: "FR4",
    tg: "TG170",
    finish: "ENIG",
    soldermask: "Green",
    silkscreen: "White",
    impedance: true,
    targetThickness: 1.6,
    thicknessTolPlus: 0.15,
    thicknessTolMinus: 0.15,
    copperOuter: "1 oz",
    copperInnerDefault: "0.5 oz",
    dielectrics: [
      { name: "Prepreg", thickness: 0.20 },
      { name: "Core", thickness: 0.80 },
      { name: "Prepreg", thickness: 0.20 },
    ],
    notes: "Include impedance coupons for 50Ω single-ended and 100Ω diff. ENIG for fine-pitch.",
    active: true,
    defaultRuleId: "mr_1002",
    createdAt: "2026-01-02T10:20:00.000Z",
    updatedAt: "2026-01-04T08:10:00.000Z",
  },
};

const stackupService = {
  async getById(id) {
    await new Promise((r) => setTimeout(r, 280));
    const item = MOCK_DB[id];
    if (!item) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
    return { data: { ...item } };
  },
  async update(id, payload) {
    await new Promise((r) => setTimeout(r, 350));
    MOCK_DB[id] = { ...(MOCK_DB[id] || {}), ...payload, updatedAt: new Date().toISOString() };
    return { data: { ...MOCK_DB[id] } };
  },
  async remove(id) {
    await new Promise((r) => setTimeout(r, 300));
    delete MOCK_DB[id];
    return { ok: true };
  },
  async duplicate(id) {
    await new Promise((r) => setTimeout(r, 360));
    const base = MOCK_DB[id];
    if (!base) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
    const newId = `st_${Math.floor(Math.random() * 9000) + 1000}`;
    MOCK_DB[newId] = {
      ...base,
      id: newId,
      name: `${base.name} (Copy)`,
      code: `${base.code}-COPY`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { data: { ...MOCK_DB[newId] } };
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function calcDielectricTotal(dies) {
  return (dies || []).reduce((s, d) => s + num(d.thickness, 0), 0);
}

function calcEstimatedThickness(template) {
  const copperPerOzMm = 0.035;
  const outerOz = parseFloat(String(template.copperOuter).replace(" oz", "")) || 1;
  const innerOz = parseFloat(String(template.copperInnerDefault).replace(" oz", "")) || 0.5;
  const L = Number(template.layers);

  let copperTotal = 0;
  if (L === 1) copperTotal = outerOz * copperPerOzMm;
  else if (L === 2) copperTotal = outerOz * copperPerOzMm * 2;
  else copperTotal = outerOz * copperPerOzMm * 2 + innerOz * copperPerOzMm * (L - 2);

  const diel = calcDielectricTotal(template.dielectrics);
  return round2(diel + copperTotal);
}

export default function StackupDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [dupLoading, setDupLoading] = useState(false);

  const thicknessWindow = useMemo(() => {
    if (!data) return null;
    const t = num(editMode ? draft?.targetThickness : data.targetThickness, 1.6);
    const plus = num(editMode ? draft?.thicknessTolPlus : data.thicknessTolPlus, 0.15);
    const minus = num(editMode ? draft?.thicknessTolMinus : data.thicknessTolMinus, 0.15);
    return { min: round2(Math.max(0.1, t - minus)), max: round2(t + plus), t, plus, minus };
  }, [data, draft, editMode]);

  const dielectricTotal = useMemo(() => {
    const src = editMode ? draft : data;
    if (!src) return 0;
    return round2(calcDielectricTotal(src.dielectrics));
  }, [data, draft, editMode]);

  const estimatedThickness = useMemo(() => {
    const src = editMode ? draft : data;
    if (!src) return 0;
    return calcEstimatedThickness(src);
  }, [data, draft, editMode]);

  const canSave = useMemo(() => {
    if (!editMode || !draft) return false;
    if (!draft.name?.trim()) return false;
    if (!draft.code?.trim()) return false;
    if (num(draft.layers, 0) < 1) return false;
    if (num(draft.targetThickness, 0) <= 0) return false;
    if (!Array.isArray(draft.dielectrics) || draft.dielectrics.length === 0) return false;
    for (const d of draft.dielectrics) {
      if (!String(d.name || "").trim()) return false;
      if (num(d.thickness, 0) <= 0) return false;
    }
    return true;
  }, [editMode, draft]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await stackupService.getById(id);
      setData(res.data);
      setDraft(JSON.parse(JSON.stringify(res.data)));
    } catch (e) {
      toast({
        title: "Not found",
        description: "Stackup template not found.",
        variant: "destructive",
      });
      navigate("/dashboard/engineering/stackup", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleEdit = () => {
    if (!data) return;
    if (!editMode) {
      setDraft(JSON.parse(JSON.stringify(data)));
      setEditMode(true);
      return;
    }
    // if turning off, discard draft
    setDraft(JSON.parse(JSON.stringify(data)));
    setEditMode(false);
  };

  const updateDraft = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const updateDielectric = (idx, patch) => {
    setDraft((d) => ({
      ...d,
      dielectrics: d.dielectrics.map((x, i) => (i === idx ? { ...x, ...patch } : x)),
    }));
  };

  const addDielectric = () => {
    setDraft((d) => ({
      ...d,
      dielectrics: [...d.dielectrics, { name: "Prepreg", thickness: 0.2 }],
    }));
  };

  const removeDielectric = (idx) => {
    setDraft((d) => ({
      ...d,
      dielectrics: d.dielectrics.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!canSave) {
      toast({
        title: "Validation",
        description: "Please fill required fields and ensure dielectric thicknesses are valid.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...draft,
        name: draft.name.trim(),
        code: draft.code.trim(),
        layers: Number(draft.layers),
        targetThickness: num(draft.targetThickness, 1.6),
        thicknessTolPlus: num(draft.thicknessTolPlus, 0.15),
        thicknessTolMinus: num(draft.thicknessTolMinus, 0.15),
        dielectrics: draft.dielectrics.map((x) => ({
          name: String(x.name || "").trim(),
          thickness: num(x.thickness, 0),
        })),
        updatedAt: new Date().toISOString(),
      };

      const res = await stackupService.update(id, payload);
      setData(res.data);
      setDraft(JSON.parse(JSON.stringify(res.data)));
      setEditMode(false);

      toast({ title: "Saved", description: "Stackup template updated successfully." });
    } catch {
      toast({ title: "Save failed", description: "Could not update stackup template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await stackupService.remove(id);
      toast({ title: "Deleted", description: "Stackup template deleted." });
      navigate("/dashboard/engineering/stackup", { replace: true });
    } catch {
      toast({ title: "Delete failed", description: "Could not delete stackup template.", variant: "destructive" });
    } finally {
      setSaving(false);
      setDeleteOpen(false);
    }
  };

  const handleDuplicate = async () => {
    setDupLoading(true);
    try {
      const res = await stackupService.duplicate(id);
      toast({ title: "Duplicated", description: "Created a copy of this stackup template." });
      navigate(`/dashboard/engineering/stackup/${res.data.id}`, { replace: true });
    } catch {
      toast({ title: "Duplicate failed", description: "Could not duplicate template.", variant: "destructive" });
    } finally {
      setDupLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading stackup template…
        </div>
      </div>
    );
  }

  if (!data) return null;

  const view = editMode ? draft : data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
              {data.active ? (
                <Badge className="bg-emerald-600 text-white">Active</Badge>
              ) : (
                <Badge className="bg-gray-200 text-gray-800">Inactive</Badge>
              )}
              {data.impedance ? <Badge className="bg-sky-600 text-white">Impedance</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Stackup template details for quoting, CAM and DFM validation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={handleDuplicate} disabled={dupLoading}>
            {dupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Duplicate
          </Button>

          <Button variant="outline" className="gap-2" onClick={toggleEdit} disabled={saving}>
            <Pencil className="h-4 w-4" />
            {editMode ? "Cancel Edit" : "Edit"}
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="shadow-sm lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-gray-700" />
              Template Info
            </CardTitle>
            <CardDescription>Identity and manufacturing defaults.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <Label>Name</Label>
                {editMode ? (
                  <Input className="mt-2" value={view.name} onChange={(e) => updateDraft({ name: e.target.value })} />
                ) : (
                  <div className="mt-2 flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-gray-900">{data.name}</span>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => copyToClipboard(data.name)}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label>Code</Label>
                {editMode ? (
                  <Input className="mt-2" value={view.code} onChange={(e) => updateDraft({ code: e.target.value })} />
                ) : (
                  <div className="mt-2 flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-gray-900">{data.code}</span>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => copyToClipboard(data.code)}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label>Layers</Label>
                {editMode ? (
                  <select
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                    value={String(view.layers)}
                    onChange={(e) => updateDraft({ layers: Number(e.target.value) })}
                  >
                    {[1, 2, 4, 6, 8, 10, 12].map((x) => (
                      <option key={x} value={x}>
                        {x} Layers
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900">
                    {data.layers} Layers
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label>Material</Label>
                {editMode ? (
                  <select
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                    value={view.materialFamily}
                    onChange={(e) => updateDraft({ materialFamily: e.target.value })}
                  >
                    {["FR4", "High-Tg FR4", "Rogers", "Polyimide"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900">
                    {data.materialFamily}
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label>Tg</Label>
                {editMode ? (
                  <select
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                    value={view.tg}
                    onChange={(e) => updateDraft({ tg: e.target.value })}
                  >
                    {["TG150", "TG170", "TG180", "TG200"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900">
                    {data.tg}
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label>Finish</Label>
                {editMode ? (
                  <select
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                    value={view.finish}
                    onChange={(e) => updateDraft({ finish: e.target.value })}
                  >
                    {["HASL", "Lead-Free HASL", "ENIG", "OSP", "Immersion Tin", "Immersion Silver"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900">
                    {data.finish}
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label>Soldermask</Label>
                {editMode ? (
                  <select
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                    value={view.soldermask}
                    onChange={(e) => updateDraft({ soldermask: e.target.value })}
                  >
                    {["Green", "Black", "Red", "Blue", "White", "Yellow"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900">
                    {data.soldermask}
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label>Silkscreen</Label>
                {editMode ? (
                  <select
                    className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                    value={view.silkscreen}
                    onChange={(e) => updateDraft({ silkscreen: e.target.value })}
                  >
                    {["White", "Black", "None"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900">
                    {data.silkscreen}
                  </div>
                )}
              </div>

              <div className="md:col-span-6">
                <Label>Impedance</Label>
                <div className="mt-2 flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                  <span className="text-gray-700">Controlled impedance intent</span>
                  <div className="ml-auto flex items-center gap-2">
                    {editMode ? (
                      <>
                        <input
                          type="checkbox"
                          checked={!!view.impedance}
                          onChange={(e) => updateDraft({ impedance: e.target.checked })}
                        />
                        {view.impedance ? (
                          <Badge className="bg-sky-600 text-white">Yes</Badge>
                        ) : (
                          <Badge className="bg-gray-200 text-gray-800">No</Badge>
                        )}
                      </>
                    ) : data.impedance ? (
                      <Badge className="bg-sky-600 text-white">Yes</Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-800">No</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-6">
                <Label>Status</Label>
                <div className="mt-2 flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                  <span className="text-gray-700">Template active</span>
                  <div className="ml-auto flex items-center gap-2">
                    {editMode ? (
                      <>
                        <input
                          type="checkbox"
                          checked={!!view.active}
                          onChange={(e) => updateDraft({ active: e.target.checked })}
                        />
                        {view.active ? (
                          <Badge className="bg-emerald-600 text-white">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-200 text-gray-800">Inactive</Badge>
                        )}
                      </>
                    ) : data.active ? (
                      <Badge className="bg-emerald-600 text-white">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-800">Inactive</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              {editMode ? (
                <textarea
                  className="mt-2 h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={view.notes || ""}
                  onChange={(e) => updateDraft({ notes: e.target.value })}
                  placeholder="Manufacturing notes for CAM/DFM…"
                />
              ) : (
                <div className="mt-2 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                  {data.notes?.trim() ? data.notes : "—"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4 text-sm">
                <div className="text-xs text-gray-500">Created</div>
                <div className="mt-1 font-medium text-gray-900">{formatDate(data.createdAt)}</div>
              </div>
              <div className="rounded-xl border bg-white p-4 text-sm">
                <div className="text-xs text-gray-500">Last Updated</div>
                <div className="mt-1 font-medium text-gray-900">{formatDate(data.updatedAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-gray-700" />
              Thickness & Copper Summary
            </CardTitle>
            <CardDescription>Key dimensions for quoting and feasibility checks.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Target Thickness</div>
                    <div className="mt-1 text-xs text-gray-600">
                      {round2(mm2mil(num(view.targetThickness, 1.6)))} mil
                    </div>
                  </div>
                  <Badge className="bg-gray-900 text-white">{view.targetThickness} mm</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                    <div className="text-gray-500">Tolerance +</div>
                    <div className="font-semibold text-gray-900">{view.thicknessTolPlus} mm</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                    <div className="text-gray-500">Tolerance −</div>
                    <div className="font-semibold text-gray-900">{view.thicknessTolMinus} mm</div>
                  </div>
                </div>

                {thicknessWindow ? (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200 text-xs">
                    <span className="text-gray-500">Window</span>
                    <span className="font-semibold text-gray-900">
                      {thicknessWindow.min} – {thicknessWindow.max} mm
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Copper Defaults</div>
                    <div className="mt-1 text-xs text-gray-600">Used as template defaults per job.</div>
                  </div>
                  <Badge className="bg-gray-200 text-gray-900">{view.layers}L</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                    <div className="text-gray-500">Outer</div>
                    <div className="font-semibold text-gray-900">{view.copperOuter}</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                    <div className="text-gray-500">Inner Default</div>
                    <div className="font-semibold text-gray-900">{view.copperInnerDefault}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Dielectric Total</div>
                    <div className="mt-1 text-xs text-gray-600">Sum of segment thicknesses.</div>
                  </div>
                  <Badge className="bg-gray-900 text-white">{dielectricTotal} mm</Badge>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200 text-xs">
                  <span className="text-gray-500">Estimated finished thickness</span>
                  <span className="font-semibold text-gray-900">{estimatedThickness} mm</span>
                </div>

                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Use this template for RFQ auto-fill and CAM checks.
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">Quick Actions</div>
                  <Layers className="h-4 w-4 text-gray-700" />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <Link to="/engineering/stackup/create" className="w-full">
                    <Button variant="outline" className="w-full gap-2">
                      <Edit3 className="h-4 w-4" />
                      Create New Template
                    </Button>
                  </Link>

                  <Link to="/engineering/stackup" className="w-full">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to List
                    </Button>
                  </Link>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Next: bind this template to RFQ → quote → CAM stackup approval → Work Order lock.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dielectrics table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-gray-700" />
            Dielectric Segments
          </CardTitle>
          <CardDescription>Prepreg/Core segments used to approximate the stackup structure.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Thickness (mm)</th>
                  <th className="py-2 pr-3">Hint</th>
                  <th className="py-2 pr-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {view.dielectrics.map((d, idx) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 text-gray-500">{idx + 1}</td>

                    <td className="py-2 pr-3">
                      {editMode ? (
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                          value={d.name}
                          onChange={(e) => updateDielectric(idx, { name: e.target.value })}
                        >
                          {["Prepreg", "Core", "Bondply"].map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-900">{d.name}</Badge>
                      )}
                    </td>

                    <td className="py-2 pr-3">
                      {editMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={d.thickness}
                          onChange={(e) => updateDielectric(idx, { thickness: e.target.value })}
                        />
                      ) : (
                        <div className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900">
                          {d.thickness}
                        </div>
                      )}
                    </td>

                    <td className="py-2 pr-3 text-xs text-gray-500">
                      {d.name === "Core" ? "Rigid dielectric sheet" : "Bonding dielectric film"}
                    </td>

                    <td className="py-2 pr-3 text-right">
                      {editMode ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeDielectric(idx)}
                          disabled={(draft?.dielectrics?.length || 0) <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editMode ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" className="gap-2" onClick={addDielectric}>
                <Pencil className="h-4 w-4" />
                Add Segment
              </Button>

              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-900">Dielectric: {dielectricTotal} mm</Badge>
                <Badge className="bg-gray-900 text-white">Estimated: {estimatedThickness} mm</Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Badge className="bg-gray-100 text-gray-900">Dielectric: {dielectricTotal} mm</Badge>
              <Badge className="bg-gray-900 text-white">Estimated: {estimatedThickness} mm</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{data.name}</span>. This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
