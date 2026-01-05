// src/pages/engineering/stackup/StackupCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ClipboardList,
  FilePlus2,
  Layers,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

/**
 * StackupCreate.jsx (PCBxpress / PCB Manufacturing ERP)
 *
 * Suggested routes:
 *   - /engineering/stackup/create
 *   - /engineering/stackup/:id/edit  (optional reuse)
 *
 * Purpose:
 *   Create a PCB stackup template with layer count, copper weights, dielectrics,
 *   thickness targets, impedance intent, and manufacturing notes.
 *
 * Backend integration (replace mocks):
 *   GET  /engineering/stackup/material-rules   (for capability defaults)
 *   POST /engineering/stackup/templates
 *   PUT  /engineering/stackup/templates/:id
 */

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function clamp(n, a, b) {
  return Math.min(Math.max(n, a), b);
}

function num(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function mm2mil(mm) {
  // 1 mil = 0.0254 mm
  return mm / 0.0254;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Mock service — replace with axios in /src/services/stackup.service.js */
const stackupService = {
  async listMaterialRules() {
    await new Promise((r) => setTimeout(r, 250));
    return [
      {
        id: "mr_1001",
        name: "Standard FR4 — 2 Layer (Cost Optimized)",
        layers: 2,
        dielectricFamilies: ["FR4"],
        tg: "TG150",
        thicknessMin: 0.8,
        thicknessMax: 2.0,
        copperOuter: "1 oz",
        copperInner: "-",
        impedance: false,
        minTrace: 4,
        minSpace: 4,
        minDrill: 0.30,
        annularRing: 0.10,
        risk: "Low",
        active: true,
      },
      {
        id: "mr_1002",
        name: "Standard FR4 — 4 Layer (General)",
        layers: 4,
        dielectricFamilies: ["FR4", "High-Tg FR4"],
        tg: "TG170",
        thicknessMin: 1.2,
        thicknessMax: 2.0,
        copperOuter: "1 oz",
        copperInner: "0.5 oz",
        impedance: true,
        minTrace: 4,
        minSpace: 4,
        minDrill: 0.25,
        annularRing: 0.10,
        risk: "Low",
        active: true,
      },
      {
        id: "mr_1003",
        name: "HDI-ish — 6 Layer (Tighter rules)",
        layers: 6,
        dielectricFamilies: ["High-Tg FR4"],
        tg: "TG180",
        thicknessMin: 1.0,
        thicknessMax: 1.8,
        copperOuter: "1 oz",
        copperInner: "0.5 oz",
        impedance: true,
        minTrace: 3,
        minSpace: 3,
        minDrill: 0.20,
        annularRing: 0.09,
        risk: "Medium",
        active: true,
      },
    ];
  },

  async createTemplate(payload) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true, id: `st_${Math.floor(Math.random() * 9000) + 1000}`, ...payload };
  },
};

const DEFAULT_FORM = {
  name: "",
  code: "",
  layers: 4,
  materialFamily: "FR4",
  tg: "TG170",
  finish: "HASL",
  soldermask: "Green",
  silkscreen: "White",
  impedance: false,

  targetThickness: 1.6, // mm
  thicknessTolPlus: 0.15, // mm
  thicknessTolMinus: 0.15, // mm

  copperOuter: "1 oz",
  copperInnerDefault: "0.5 oz",

  // dielectric per segment (simple template)
  dielectrics: [
    { name: "Prepreg", thickness: 0.20 }, // mm
    { name: "Core", thickness: 0.80 }, // mm
    { name: "Prepreg", thickness: 0.20 }, // mm
  ],

  notes: "",
  active: true,
  defaultRuleId: "",
};

function buildLayerModel(layers) {
  const L = Number(layers);
  if (L === 1) return ["L1 (Top)"];
  if (L === 2) return ["L1 (Top)", "L2 (Bottom)"];

  const arr = [];
  for (let i = 1; i <= L; i++) {
    if (i === 1) arr.push("L1 (Top)");
    else if (i === L) arr.push(`L${L} (Bottom)`);
    else arr.push(`L${i} (Inner)`);
  }
  return arr;
}

function calcTotalDielectricMm(dies) {
  return (dies || []).reduce((sum, d) => sum + num(d.thickness, 0), 0);
}

export default function StackupCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loadingRules, setLoadingRules] = useState(false);
  const [materialRules, setMaterialRules] = useState([]);

  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const [form, setForm] = useState({ ...DEFAULT_FORM });

  const layerLabels = useMemo(() => buildLayerModel(form.layers), [form.layers]);

  const selectedRule = useMemo(() => {
    if (!form.defaultRuleId) return null;
    return materialRules.find((x) => x.id === form.defaultRuleId) || null;
  }, [form.defaultRuleId, materialRules]);

  const dielectricTotal = useMemo(() => calcTotalDielectricMm(form.dielectrics), [form.dielectrics]);

  const estimatedThickness = useMemo(() => {
    // For a template we approximate total thickness ~ dielectricTotal + copper contribution (~0.035mm per 1oz per copper layer)
    const copperPerOzMm = 0.035;
    const outerOz = parseFloat(String(form.copperOuter).replace(" oz", "")) || 1;
    const innerOz = parseFloat(String(form.copperInnerDefault).replace(" oz", "")) || 0.5;
    const L = Number(form.layers);

    let copperTotal = 0;
    if (L === 1) copperTotal = outerOz * copperPerOzMm;
    else if (L === 2) copperTotal = outerOz * copperPerOzMm * 2;
    else {
      // top+bottom outer + inner layers
      copperTotal = outerOz * copperPerOzMm * 2 + innerOz * copperPerOzMm * (L - 2);
    }

    return round2(dielectricTotal + copperTotal);
  }, [dielectricTotal, form.copperOuter, form.copperInnerDefault, form.layers]);

  const thicknessWindow = useMemo(() => {
    const t = num(form.targetThickness, 1.6);
    const plus = num(form.thicknessTolPlus, 0.15);
    const minus = num(form.thicknessTolMinus, 0.15);
    return {
      min: round2(Math.max(0.1, t - minus)),
      max: round2(t + plus),
    };
  }, [form.targetThickness, form.thicknessTolPlus, form.thicknessTolMinus]);

  const thicknessStatus = useMemo(() => {
    if (!selectedRule) return null;
    // Compare target window with rule min/max
    const ok = thicknessWindow.min >= selectedRule.thicknessMin && thicknessWindow.max <= selectedRule.thicknessMax;
    return { ok };
  }, [selectedRule, thicknessWindow]);

  const canSave = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.code.trim()) return false;
    if (num(form.layers, 0) < 1) return false;
    if (num(form.targetThickness, 0) <= 0) return false;
    if (form.dielectrics.length === 0) return false;
    return true;
  }, [form]);

  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const rules = await stackupService.listMaterialRules();
      setMaterialRules((rules || []).filter((r) => r.active));
    } catch {
      toast({ title: "Load failed", description: "Could not load material rules.", variant: "destructive" });
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRuleDefaults = (ruleId) => {
    const rule = materialRules.find((x) => x.id === ruleId);
    if (!rule) return;

    setForm((f) => {
      const L = rule.layers;
      const newDies = [];

      // Simple heuristic: create (L-1) dielectric segments. For 2L -> 1 core; 4L -> 3 segments; 6L -> 5 segments.
      const segCount = Math.max(1, L - 1);
      for (let i = 0; i < segCount; i++) {
        const isCore = i === Math.floor(segCount / 2);
        newDies.push({
          name: isCore ? "Core" : "Prepreg",
          thickness: round2((rule.thicknessMin + rule.thicknessMax) / 2 / segCount),
        });
      }

      return {
        ...f,
        defaultRuleId: rule.id,
        layers: rule.layers,
        materialFamily: (rule.dielectricFamilies || [f.materialFamily])[0] || f.materialFamily,
        tg: rule.tg || f.tg,
        copperOuter: rule.copperOuter || f.copperOuter,
        copperInnerDefault: rule.copperInner && rule.copperInner !== "-" ? rule.copperInner : f.copperInnerDefault,
        impedance: !!rule.impedance,
        // keep current target thickness but clamp into capability range
        targetThickness: clamp(num(f.targetThickness, 1.6), rule.thicknessMin, rule.thicknessMax),
        dielectrics: newDies,
      };
    });

    toast({ title: "Applied", description: "Material rule defaults applied to stackup." });
  };

  const addDielectricRow = () => {
    setForm((f) => ({
      ...f,
      dielectrics: [...f.dielectrics, { name: "Prepreg", thickness: 0.20 }],
    }));
  };

  const removeDielectricRow = (idx) => {
    setForm((f) => ({
      ...f,
      dielectrics: f.dielectrics.filter((_, i) => i !== idx),
    }));
  };

  const updateDielectric = (idx, patch) => {
    setForm((f) => ({
      ...f,
      dielectrics: f.dielectrics.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Template name is required.";
    if (!form.code.trim()) return "Template code is required.";
    if (num(form.layers, 0) < 1) return "Layers must be a valid number.";
    if (num(form.targetThickness, 0) <= 0) return "Target thickness must be > 0.";
    if (form.dielectrics.length === 0) return "Add at least one dielectric segment.";
    for (const d of form.dielectrics) {
      if (!d.name?.trim()) return "Dielectric name cannot be empty.";
      if (num(d.thickness, 0) <= 0) return "Dielectric thickness must be > 0.";
    }
    if (selectedRule) {
      if (thicknessWindow.min < selectedRule.thicknessMin || thicknessWindow.max > selectedRule.thicknessMax) {
        return `Thickness window must fit within selected rule range (${selectedRule.thicknessMin}–${selectedRule.thicknessMax} mm).`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Validation", description: err, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        layers: Number(form.layers),
        materialFamily: form.materialFamily,
        tg: form.tg,
        finish: form.finish,
        soldermask: form.soldermask,
        silkscreen: form.silkscreen,
        impedance: !!form.impedance,

        targetThickness: num(form.targetThickness, 1.6),
        thicknessTolPlus: num(form.thicknessTolPlus, 0.15),
        thicknessTolMinus: num(form.thicknessTolMinus, 0.15),

        copperOuter: form.copperOuter,
        copperInnerDefault: form.copperInnerDefault || "-",

        dielectrics: form.dielectrics.map((d) => ({
          name: String(d.name || "").trim(),
          thickness: num(d.thickness, 0),
        })),

        notes: String(form.notes || "").trim(),
        active: !!form.active,
        defaultRuleId: form.defaultRuleId || null,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await stackupService.createTemplate(payload);

      toast({
        title: "Saved",
        description: `Stackup template created (${res?.id || "OK"}).`,
      });

      // Navigate to list page (create later) or back.
      navigate("/engineering/stackup", { replace: true });
    } catch {
      toast({ title: "Save failed", description: "Could not save stackup template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_FORM });
    setResetOpen(false);
    toast({ title: "Reset", description: "Form reset to defaults." });
  };

  return (
    <div className="space-y-6">
      {/* Top */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Stackup Template</h1>
            <p className="mt-1 text-sm text-gray-600">
              Define a reusable PCB stackup template for quoting, CAM, and DFM. Keep it aligned with your material rules.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchRules} disabled={loadingRules}>
            {loadingRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Rules
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => setResetOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Reset
          </Button>

          <Button
            className="gap-2 bg-[#DC2551] hover:bg-[#B02045]"
            onClick={handleSave}
            disabled={saving || !canSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Template
          </Button>
        </div>
      </div>

      {/* Rule + identity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="shadow-sm lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FilePlus2 className="h-4 w-4 text-gray-700" />
              Template Info
            </CardTitle>
            <CardDescription>Basic metadata and manufacturing settings.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <Label>Template Name</Label>
                <Input
                  className="mt-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., FR4 4L 1.6mm TG170 — Impedance Ready"
                />
              </div>

              <div className="md:col-span-4">
                <Label>Template Code</Label>
                <Input
                  className="mt-2"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g., STK-4L-170-16"
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
                      {x} Layers
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <Label>Material Family</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={form.materialFamily}
                  onChange={(e) => setForm((f) => ({ ...f, materialFamily: e.target.value }))}
                >
                  {["FR4", "High-Tg FR4", "Rogers", "Polyimide"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
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

              <div className="md:col-span-4">
                <Label>Surface Finish</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={form.finish}
                  onChange={(e) => setForm((f) => ({ ...f, finish: e.target.value }))}
                >
                  {["HASL", "Lead-Free HASL", "ENIG", "OSP", "Immersion Tin", "Immersion Silver"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <Label>Soldermask</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={form.soldermask}
                  onChange={(e) => setForm((f) => ({ ...f, soldermask: e.target.value }))}
                >
                  {["Green", "Black", "Red", "Blue", "White", "Yellow"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <Label>Silkscreen</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={form.silkscreen}
                  onChange={(e) => setForm((f) => ({ ...f, silkscreen: e.target.value }))}
                >
                  {["White", "Black", "None"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-6">
                <Label>Controlled Impedance</Label>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!form.impedance}
                    onChange={(e) => setForm((f) => ({ ...f, impedance: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Enable impedance intent</span>
                  {form.impedance ? <Badge className="ml-auto bg-sky-600 text-white">Yes</Badge> : <Badge className="ml-auto bg-gray-200 text-gray-800">No</Badge>}
                </div>
              </div>

              <div className="md:col-span-6">
                <Label>Active</Label>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Enable this template</span>
                  {form.active ? (
                    <Badge className="ml-auto bg-emerald-600 text-white">Active</Badge>
                  ) : (
                    <Badge className="ml-auto bg-gray-200 text-gray-800">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label>Manufacturing Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any special notes for CAM/DFM: resin content, impedance coupons, via fill, controlled depth, etc."
                className="mt-2 h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-gray-700" />
              Material Rule (Defaults)
            </CardTitle>
            <CardDescription>
              Pick a rule to apply capability defaults (layers, TG, copper, allowed thickness range).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <Label>Rule</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={form.defaultRuleId}
                onChange={(e) => {
                  const id = e.target.value;
                  setForm((f) => ({ ...f, defaultRuleId: id }));
                  if (id) applyRuleDefaults(id);
                }}
              >
                <option value="">— Select a rule —</option>
                {materialRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <div className="mt-2 text-xs text-gray-500">
                {loadingRules ? "Loading rules..." : `${materialRules.length} active rule(s) available`}
              </div>
            </div>

            {selectedRule ? (
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{selectedRule.name}</div>
                    <div className="mt-1 text-xs text-gray-600">
                      Layers: <span className="font-medium">{selectedRule.layers}L</span> • TG:{" "}
                      <span className="font-medium">{selectedRule.tg}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Thickness range:{" "}
                      <span className="font-medium">
                        {selectedRule.thicknessMin}–{selectedRule.thicknessMax} mm
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Copper: <span className="font-medium">{selectedRule.copperOuter}</span>{" "}
                      {selectedRule.copperInner && selectedRule.copperInner !== "-" ? (
                        <>
                          • Inner: <span className="font-medium">{selectedRule.copperInner}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <Badge className="bg-emerald-600 text-white">Active</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                    <div className="text-gray-500">Min Trace/Space</div>
                    <div className="font-semibold text-gray-900">
                      {selectedRule.minTrace}/{selectedRule.minSpace} mil
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                    <div className="text-gray-500">Min Drill</div>
                    <div className="font-semibold text-gray-900">{selectedRule.minDrill} mm</div>
                  </div>
                </div>

                {thicknessStatus ? (
                  <div
                    className={cx(
                      "mt-3 flex items-center gap-2 rounded-lg px-2 py-1 text-xs ring-1 ring-inset",
                      thicknessStatus.ok
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                        : "bg-amber-50 text-amber-900 ring-amber-200"
                    )}
                  >
                    {thicknessStatus.ok ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                    Target thickness window{" "}
                    <span className="font-semibold">
                      {thicknessWindow.min}–{thicknessWindow.max} mm
                    </span>{" "}
                    {thicknessStatus.ok ? "fits rule range" : "is outside rule range"}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                Tip: Select a rule so your templates always match factory capability.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stackup Core */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="shadow-sm lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-gray-700" />
              Thickness & Copper
            </CardTitle>
            <CardDescription>Target thickness window and copper defaults by layer type.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <Label>Target Thickness (mm)</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step="0.05"
                  value={form.targetThickness}
                  onChange={(e) => setForm((f) => ({ ...f, targetThickness: e.target.value }))}
                />
                <div className="mt-1 text-xs text-gray-500">
                  ~{round2(mm2mil(num(form.targetThickness, 1.6)))} mil
                </div>
              </div>

              <div className="md:col-span-4">
                <Label>+ Tolerance (mm)</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step="0.01"
                  value={form.thicknessTolPlus}
                  onChange={(e) => setForm((f) => ({ ...f, thicknessTolPlus: e.target.value }))}
                />
              </div>

              <div className="md:col-span-4">
                <Label>− Tolerance (mm)</Label>
                <Input
                  className="mt-2"
                  type="number"
                  step="0.01"
                  value={form.thicknessTolMinus}
                  onChange={(e) => setForm((f) => ({ ...f, thicknessTolMinus: e.target.value }))}
                />
              </div>

              <div className="md:col-span-6">
                <Label>Outer Copper</Label>
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
                <Label>Default Inner Copper</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={form.copperInnerDefault}
                  onChange={(e) => setForm((f) => ({ ...f, copperInnerDefault: e.target.value }))}
                >
                  {["0.5 oz", "1 oz", "2 oz"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">Estimated Thickness</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Based on dielectric sum + approximate copper contribution.
                  </div>
                </div>
                <Badge className="bg-gray-900 text-white">{estimatedThickness} mm</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                  <div className="text-gray-500">Dielectric Total</div>
                  <div className="font-semibold text-gray-900">{round2(dielectricTotal)} mm</div>
                </div>
                <div className="rounded-lg bg-white p-2 ring-1 ring-inset ring-gray-200">
                  <div className="text-gray-500">Thickness Window</div>
                  <div className="font-semibold text-gray-900">
                    {thicknessWindow.min}–{thicknessWindow.max} mm
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Layer Map</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {layerLabels.map((l) => (
                  <Badge key={l} className="bg-gray-100 text-gray-900">
                    {l}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-600">
                This template defines defaults. Actual job stackup can be derived per RFQ/Work Order.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-gray-700" />
              Dielectric Segments
            </CardTitle>
            <CardDescription>
              Define prepreg/core thickness segments (simplified template). You can refine later during CAM stackup.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-700">
              <div className="font-semibold">Tip</div>
              Keep segments realistic to your supplier materials. Use “Core” for rigid sheets, “Prepreg” for bonding films.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Thickness (mm)</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {form.dielectrics.map((d, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="py-2 pr-3 text-gray-500">{idx + 1}</td>

                      <td className="py-2 pr-3">
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
                      </td>

                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={d.thickness}
                          onChange={(e) => updateDielectric(idx, { thickness: e.target.value })}
                        />
                      </td>

                      <td className="py-2 pr-3 text-xs text-gray-500">
                        {d.name === "Core" ? "Rigid dielectric sheet" : "Bonding dielectric film"}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeDielectricRow(idx)}
                          disabled={form.dielectrics.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" className="gap-2" onClick={addDielectricRow}>
                <FilePlus2 className="h-4 w-4" />
                Add Segment
              </Button>

              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-900">Dielectric: {round2(dielectricTotal)} mm</Badge>
                <Badge className="bg-gray-900 text-white">Estimated: {estimatedThickness} mm</Badge>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Capability Check</div>
                  <div className="mt-1 text-xs text-gray-600">
                    If you selected a rule, your thickness window must fit the rule’s allowed range.
                  </div>
                </div>
                {selectedRule ? (
                  thicknessStatus?.ok ? (
                    <Badge className="bg-emerald-600 text-white">OK</Badge>
                  ) : (
                    <Badge className="bg-amber-500 text-white">Review</Badge>
                  )
                ) : (
                  <Badge className="bg-gray-200 text-gray-800">No Rule</Badge>
                )}
              </div>

              {selectedRule ? (
                <div className="mt-3 text-xs text-gray-700">
                  Rule range:{" "}
                  <span className="font-semibold">
                    {selectedRule.thicknessMin}–{selectedRule.thicknessMax} mm
                  </span>{" "}
                  • Your window:{" "}
                  <span className="font-semibold">
                    {thicknessWindow.min}–{thicknessWindow.max} mm
                  </span>
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-700">
                  Select a rule for automatic capability validation.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset confirm */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all changes and restore default template values.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700" disabled={saving}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer helper */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-gray-700" />
            Next steps (recommended)
          </CardTitle>
          <CardDescription>After creating templates, wire them into RFQ quoting and CAM stackup validation.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-gray-50 p-4 text-sm">
            <div className="font-semibold text-gray-900">RFQ</div>
            <p className="mt-1 text-xs text-gray-600">
              Choose a template during RFQ to auto-fill layer count, thickness, copper, and impedance intent.
            </p>
          </div>
          <div className="rounded-xl border bg-gray-50 p-4 text-sm">
            <div className="font-semibold text-gray-900">CAM/DFM</div>
            <p className="mt-1 text-xs text-gray-600">
              Run checks: thickness range, min drill, min trace/space and impedance feasibility with coupons.
            </p>
          </div>
          <div className="rounded-xl border bg-gray-50 p-4 text-sm">
            <div className="font-semibold text-gray-900">Production</div>
            <p className="mt-1 text-xs text-gray-600">
              Generate Work Orders using approved stackups; lock template version via ECO/Revision control.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
