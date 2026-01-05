// src/pages/production/routing/RoutingCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Copy,
  Plus,
  Trash2,
  Wrench,
  Save,
  Loader2,
  Layers,
  Droplet,
  ShieldCheck,
  ScanEye,
  Zap,
  Printer,
  Settings2,
  Timer,
  AlertTriangle,
} from "lucide-react";

/**
 * PCB ERP - RoutingCreate
 * ----------------------
 * Manufacturing routing = ordered process steps for building a PCB.
 * This UI is ready; replace MOCK_* with real APIs later.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "STEP") {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}-${Date.now().toString(16).slice(2)}`;
}

const ROUTING_CATEGORIES = [
  { value: "single", label: "Single Layer" },
  { value: "double", label: "Double Layer" },
  { value: "multilayer", label: "Multilayer" },
  { value: "flex", label: "Flex" },
  { value: "rigid-flex", label: "Rigid-Flex" },
  { value: "hdi", label: "HDI" },
];

const QC_GATES = [
  { value: "none", label: "No QC Gate" },
  { value: "inprocess", label: "In-Process QC" },
  { value: "aoi", label: "AOI Gate" },
  { value: "etest", label: "E-Test Gate" },
  { value: "final", label: "Final QC" },
];

const UNITS_TIME = [
  { value: "min", label: "Minutes" },
  { value: "sec", label: "Seconds" },
];

const OP_LIBRARY = [
  { key: "cam", label: "CAM Prep", icon: Settings2, defaultWc: "CAM", defaultQc: "none" },
  { key: "imaging", label: "Imaging / LDI", icon: Printer, defaultWc: "IMAGING", defaultQc: "inprocess" },
  { key: "etching", label: "Etching", icon: Droplet, defaultWc: "ETCH", defaultQc: "inprocess" },
  { key: "drilling", label: "CNC Drilling", icon: Wrench, defaultWc: "DRILL", defaultQc: "none" },
  { key: "pth", label: "PTH / Desmear", icon: Wrench, defaultWc: "PTH", defaultQc: "inprocess" },
  { key: "plating", label: "Copper Plating", icon: Layers, defaultWc: "PLATING", defaultQc: "inprocess" },
  { key: "aoi", label: "AOI Inspection", icon: ScanEye, defaultWc: "AOI", defaultQc: "aoi" },
  { key: "soldermask", label: "Solder Mask", icon: ShieldCheck, defaultWc: "SM", defaultQc: "inprocess" },
  { key: "silkscreen", label: "Silkscreen / Legend", icon: Printer, defaultWc: "SS", defaultQc: "inprocess" },
  { key: "surfacefinish", label: "Surface Finish (ENIG/HASL)", icon: Droplet, defaultWc: "FINISH", defaultQc: "inprocess" },
  { key: "profiling", label: "Profiling / Routing", icon: Wrench, defaultWc: "PROFILE", defaultQc: "none" },
  { key: "etest", label: "Electrical Test", icon: Zap, defaultWc: "ETEST", defaultQc: "etest" },
  { key: "final", label: "Final QC + Packing", icon: CheckCircle2, defaultWc: "PACK", defaultQc: "final" },
];

const MOCK_WORKCENTERS = [
  { code: "CAM", name: "CAM" },
  { code: "IMAGING", name: "Imaging / LDI" },
  { code: "ETCH", name: "Etching Line" },
  { code: "DRILL", name: "CNC Drilling" },
  { code: "PTH", name: "PTH / Desmear" },
  { code: "PLATING", name: "Copper Plating" },
  { code: "AOI", name: "AOI" },
  { code: "SM", name: "Solder Mask" },
  { code: "SS", name: "Silkscreen" },
  { code: "FINISH", name: "Surface Finish" },
  { code: "PROFILE", name: "Profiling / Routing" },
  { code: "ETEST", name: "E-Test" },
  { code: "PACK", name: "Final QC + Packing" },
];

function emptyStep(order = 1) {
  return {
    id: uid(),
    order,
    opKey: "cam",
    name: "CAM Prep",
    workcenter: "CAM",
    timeUnit: "min",
    setupTime: 10,
    runTime: 2,
    runTimePer: "panel", // panel | lot | piece
    yieldPct: 99,
    queueLimit: "",
    transferBatch: "",
    qcGate: "none",
    mandatory: true,
    docRef: "",
    notes: "",
  };
}

function normalizeSteps(steps) {
  return steps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s, idx) => ({ ...s, order: idx + 1 }));
}

function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pctClamp(v) {
  const n = asNumber(v, 0);
  return Math.max(0, Math.min(100, n));
}

function timeClamp(v) {
  const n = asNumber(v, 0);
  return Math.max(0, n);
}

function exportJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `routing_${payload.code || "draft"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RoutingCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Header
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("multilayer");
  const [layerCount, setLayerCount] = useState(4);
  const [plant, setPlant] = useState("Plant A");
  const [customerClass, setCustomerClass] = useState("");
  const [revision, setRevision] = useState("A");
  const [notes, setNotes] = useState("");

  // Steps
  const [steps, setSteps] = useState(() => {
    const s1 = emptyStep(1);
    const s2 = emptyStep(2);
    s2.opKey = "imaging";
    s2.name = "Imaging / LDI";
    s2.workcenter = "IMAGING";
    s2.qcGate = "inprocess";
    const s3 = emptyStep(3);
    s3.opKey = "etching";
    s3.name = "Etching";
    s3.workcenter = "ETCH";
    s3.setupTime = 15;
    s3.runTime = 3;
    return [s1, s2, s3];
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [stepToDelete, setStepToDelete] = useState(null);

  const workcenters = useMemo(() => MOCK_WORKCENTERS, []);
  const opLib = useMemo(() => OP_LIBRARY, []);

  const derived = useMemo(() => {
    const sorted = normalizeSteps(steps);
    const totalSetup = sorted.reduce((s, x) => s + asNumber(x.setupTime, 0), 0);
    const totalRun = sorted.reduce((s, x) => s + asNumber(x.runTime, 0), 0);
    const rolledYield = sorted.reduce((acc, x) => acc * (pctClamp(x.yieldPct) / 100), 1);
    const qcCount = sorted.filter((x) => x.qcGate && x.qcGate !== "none").length;

    return {
      totalSetup,
      totalRun,
      rolledYieldPct: Math.round(rolledYield * 10000) / 100,
      qcCount,
      stepCount: sorted.length,
    };
  }, [steps]);

  const canSave = useMemo(() => {
    if (!code.trim()) return false;
    if (!name.trim()) return false;
    if (derived.stepCount === 0) return false;
    return true;
  }, [code, name, derived.stepCount]);

  const onAddStep = () => {
    const next = emptyStep(steps.length + 1);
    setSteps((prev) => normalizeSteps([...prev, next]));
  };

  const onAddFromLibrary = (opKey) => {
    const lib = opLib.find((x) => x.key === opKey);
    if (!lib) return;

    const next = emptyStep(steps.length + 1);
    next.opKey = lib.key;
    next.name = lib.label;
    next.workcenter = lib.defaultWc;
    next.qcGate = lib.defaultQc;
    next.setupTime = lib.key === "cam" ? 10 : 15;
    next.runTime = lib.key === "etest" ? 5 : 3;

    setSteps((prev) => normalizeSteps([...prev, next]));
  };

  const onRemoveStep = (step) => {
    setStepToDelete(step);
    setConfirmDeleteStep(true);
  };

  const confirmRemove = () => {
    if (!stepToDelete) return;
    setSteps((prev) => normalizeSteps(prev.filter((s) => s.id !== stepToDelete.id)));
    setConfirmDeleteStep(false);
    setStepToDelete(null);
  };

  const onMove = (id, dir) => {
    setSteps((prev) => {
      const sorted = normalizeSteps(prev);
      const idx = sorted.findIndex((s) => s.id === id);
      if (idx < 0) return sorted;
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return sorted;
      const a = sorted[idx];
      const b = sorted[swapIdx];
      sorted[idx] = { ...b };
      sorted[swapIdx] = { ...a };
      return normalizeSteps(sorted);
    });
  };

  const updateStep = (id, patch) => {
    setSteps((prev) =>
      normalizeSteps(
        prev.map((s) => {
          if (s.id !== id) return s;
          const next = { ...s, ...patch };

          if (patch.opKey) {
            const lib = opLib.find((x) => x.key === patch.opKey);
            if (lib) {
              next.name = lib.label;
              if (!patch.workcenter) next.workcenter = lib.defaultWc;
              if (!patch.qcGate) next.qcGate = lib.defaultQc;
            }
          }

          if ("setupTime" in patch) next.setupTime = timeClamp(patch.setupTime);
          if ("runTime" in patch) next.runTime = timeClamp(patch.runTime);
          if ("yieldPct" in patch) next.yieldPct = pctClamp(patch.yieldPct);

          return next;
        })
      )
    );
  };

  const onDuplicateStep = (step) => {
    const clone = { ...step, id: uid(), order: steps.length + 1 };
    setSteps((prev) => normalizeSteps([...prev, clone]));
    toast({ title: "Step duplicated", description: `Added a copy of "${step.name}".` });
  };

  const buildPayload = () => ({
    code: code.trim(),
    name: name.trim(),
    category,
    layerCount: asNumber(layerCount, 1),
    plant,
    customerClass: customerClass.trim() || null,
    revision: revision.trim() || "A",
    notes: notes.trim() || null,
    steps: normalizeSteps(steps).map((s) => ({
      order: s.order,
      opKey: s.opKey,
      name: s.name,
      workcenter: s.workcenter,
      timeUnit: s.timeUnit,
      setupTime: asNumber(s.setupTime, 0),
      runTime: asNumber(s.runTime, 0),
      runTimePer: s.runTimePer,
      yieldPct: pctClamp(s.yieldPct),
      queueLimit: s.queueLimit ? String(s.queueLimit) : null,
      transferBatch: s.transferBatch ? String(s.transferBatch) : null,
      qcGate: s.qcGate,
      mandatory: Boolean(s.mandatory),
      docRef: s.docRef ? String(s.docRef) : null,
      notes: s.notes ? String(s.notes) : null,
    })),
    kpis: {
      totalSetupTime: derived.totalSetup,
      totalRunTime: derived.totalRun,
      rolledYieldPct: derived.rolledYieldPct,
      qcGatesCount: derived.qcCount,
    },
  });

  const onExportJson = () => {
    const payload = buildPayload();
    exportJson(payload);
    toast({ title: "Exported JSON", description: "Routing exported as a template JSON file." });
  };

  const onSave = async () => {
    if (!canSave) {
      toast({
        title: "Missing required fields",
        description: "Please fill Routing Code, Name and at least one step.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();

      // TODO: replace with API call
      // await routingService.create(payload)
      await new Promise((r) => setTimeout(r, 850));

      toast({
        title: "Routing created",
        description: `Routing "${payload.code}" saved successfully.`,
      });

      navigate("/production/routing", { replace: true });
    } catch (e) {
      toast({
        title: "Save failed",
        description: "Could not save routing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDiscard = () => setConfirmDiscard(true);
  const confirmDiscardNow = () => {
    setConfirmDiscard(false);
    navigate(-1);
  };

  // Default routing code suggestion if empty
  useEffect(() => {
    if (code.trim()) return;
    const cat = category === "multilayer" ? `ML${layerCount}` : category.toUpperCase();
    setCode(`RT-${cat}-${revision}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, layerCount, revision]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-700" />
            <h1 className="text-xl font-bold text-gray-900">Create Routing</h1>
            <Badge variant="outline">PCB Manufacturing</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Define the operation sequence (workcenters, times, yields, QC gates) used to manufacture a PCB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/production/routing">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" onClick={onExportJson} disabled={saving}>
            <Copy className="h-4 w-4" />
            Export JSON
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={onSave} disabled={saving || !canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Routing
          </Button>
        </div>
      </div>

      {/* Header + KPIs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="shadow-sm lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-800">Routing Header</CardTitle>
            <CardDescription className="text-xs">Basic identity and applicability.</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label>Routing Code *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., RT-ML4-A"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-8">
              <Label>Routing Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 4L Standard FR4 (ENIG)"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-3">
              <Label>Category</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {ROUTING_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Layers</Label>
              <Input
                type="number"
                min={1}
                value={layerCount}
                onChange={(e) => setLayerCount(asNumber(e.target.value, 1))}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-3">
              <Label>Plant</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
              >
                <option value="Plant A">Plant A</option>
                <option value="Plant B">Plant B</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Revision</Label>
              <Input value={revision} onChange={(e) => setRevision(e.target.value)} className="mt-1" />
            </div>

            <div className="md:col-span-2">
              <Label>Class (optional)</Label>
              <Input
                value={customerClass}
                onChange={(e) => setCustomerClass(e.target.value)}
                placeholder="e.g., IPC-2 / Medical"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-12">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any process notes, constraints, chemistry, special checks…"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-800">Quick KPIs</CardTitle>
            <CardDescription className="text-xs">Derived from steps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Total Setup</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{Math.round(derived.totalSetup)} min</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Total Run</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{Math.round(derived.totalRun)} min</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">QC Gates</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{derived.qcCount}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Rolled Yield</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{derived.rolledYieldPct}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operation Library */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Operation Library</CardTitle>
          <CardDescription className="text-xs">Quick-add common PCB operations.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {opLib.map((op) => {
            const Icon = op.icon;
            return (
              <Button key={op.key} variant="outline" className="gap-2" onClick={() => onAddFromLibrary(op.key)} type="button">
                <Icon className="h-4 w-4" />
                {op.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Steps */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">Routing Steps</CardTitle>
              <CardDescription className="text-xs">
                Maintain correct order. These values drive capacity planning and bottleneck analysis.
              </CardDescription>
            </div>
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={onAddStep} type="button">
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {normalizeSteps(steps).map((s, idx) => {
            const lib = opLib.find((x) => x.key === s.opKey);
            const Icon = lib?.icon ?? Settings2;

            return (
              <div key={s.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-gray-50 p-2">
                      <Icon className="h-4 w-4 text-gray-700" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Step {idx + 1}</span>
                        {s.mandatory ? (
                          <Badge className="bg-gray-900 text-white hover:bg-gray-900">Mandatory</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                        {s.qcGate !== "none" ? (
                          <Badge className="bg-[#dc2551] text-white hover:bg-[#dc2551]">
                            QC: {s.qcGate.toUpperCase()}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        Workcenter: <span className="font-medium text-gray-700">{s.workcenter}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onMove(s.id, -1)} disabled={idx === 0} type="button">
                      ↑
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onMove(s.id, 1)} disabled={idx === steps.length - 1} type="button">
                      ↓
                    </Button>

                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onDuplicateStep(s)} type="button">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      onClick={() => onRemoveStep(s)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Step Editor */}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Operation</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={s.opKey}
                      onChange={(e) => updateStep(s.id, { opKey: e.target.value })}
                    >
                      {opLib.map((op) => (
                        <option key={op.key} value={op.key}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Workcenter</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={s.workcenter}
                      onChange={(e) => updateStep(s.id, { workcenter: e.target.value })}
                    >
                      {workcenters.map((wc) => (
                        <option key={wc.code} value={wc.code}>
                          {wc.code} — {wc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-600">Time Unit</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={s.timeUnit}
                      onChange={(e) => updateStep(s.id, { timeUnit: e.target.value })}
                    >
                      {UNITS_TIME.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-600">Setup Time</Label>
                    <Input
                      type="number"
                      min={0}
                      value={s.setupTime}
                      onChange={(e) => updateStep(s.id, { setupTime: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-600">Run Time</Label>
                    <Input
                      type="number"
                      min={0}
                      value={s.runTime}
                      onChange={(e) => updateStep(s.id, { runTime: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Run Time Per</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={s.runTimePer}
                      onChange={(e) => updateStep(s.id, { runTimePer: e.target.value })}
                    >
                      <option value="panel">Panel</option>
                      <option value="piece">Piece</option>
                      <option value="lot">Lot</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Yield %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={s.yieldPct}
                      onChange={(e) => updateStep(s.id, { yieldPct: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">QC Gate</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={s.qcGate}
                      onChange={(e) => updateStep(s.id, { qcGate: e.target.value })}
                    >
                      {QC_GATES.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Queue Limit (optional)</Label>
                    <Input
                      value={s.queueLimit}
                      onChange={(e) => updateStep(s.id, { queueLimit: e.target.value })}
                      placeholder="e.g., 5 lots"
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Transfer Batch (optional)</Label>
                    <Input
                      value={s.transferBatch}
                      onChange={(e) => updateStep(s.id, { transferBatch: e.target.value })}
                      placeholder="e.g., 10 panels"
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Document Ref (optional)</Label>
                    <Input
                      value={s.docRef}
                      onChange={(e) => updateStep(s.id, { docRef: e.target.value })}
                      placeholder="SOP / WI / Spec link"
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600">Mandatory</Label>
                    <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!s.mandatory}
                        onChange={(e) => updateStep(s.id, { mandatory: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">Step must be executed</span>
                    </div>
                  </div>

                  <div className="md:col-span-12">
                    <Label className="text-xs text-gray-600">Step Notes</Label>
                    <Textarea
                      value={s.notes}
                      onChange={(e) => updateStep(s.id, { notes: e.target.value })}
                      placeholder="Chemistry constraints, fixture/tooling notes, inspection points…"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {steps.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-600">
              No steps yet. Add steps from the library or click <span className="font-semibold">Add Step</span>.
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 rounded-xl border bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <div className="font-semibold">Tip</div>
            <div>
              Keep step times realistic. These values drive <span className="font-semibold">capacity planning</span> and{" "}
              <span className="font-semibold">bottleneck analysis</span>.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDiscard} disabled={saving} type="button">
            Discard
          </Button>
          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={onSave} disabled={saving || !canSave} type="button">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Routing
          </Button>
        </div>
      </div>

      {/* Discard dialog */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your routing draft will be lost if you leave this page without saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardNow}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete step dialog */}
      <AlertDialog open={confirmDeleteStep} onOpenChange={setConfirmDeleteStep}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove step?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-semibold">{stepToDelete?.name}</span> from the routing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
