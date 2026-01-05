// src/pages/production/routing/RoutingSteps.jsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowDown,
  ArrowUp,
  Clock,
  Copy,
  Layers,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Wand2,
  CheckCircle2,
} from "lucide-react";

/**
 * RoutingSteps.jsx
 * ----------------
 * Reusable component/page to build PCB manufacturing routing steps (process flow).
 *
 * Supports:
 * - Add/edit/remove steps
 * - Reorder steps (up/down)
 * - Auto-calc total standard time (min)
 * - Add QC gates inside steps
 * - Clone step
 * - Quick templates (2L / 4L / HDI) you can tweak
 *
 * Integration:
 * - If you want to use inside RoutingCreate / RoutingEdit:
 *   <RoutingSteps value={steps} onChange={setSteps} />
 *
 * Or as a standalone page, it will manage its own state.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const OP_CATALOG = [
  // Front-end / CAM
  { key: "CAM_IMPORT", label: "CAM Import & Pre-check", type: "office" },
  { key: "DFM_REVIEW", label: "DFM Review", type: "office" },

  // Inner layer / imaging
  { key: "CUT_LAMINATE", label: "Cut Laminate", type: "process" },
  { key: "DRY_FILM", label: "Dry Film Lamination", type: "process" },
  { key: "EXPOSURE", label: "Exposure", type: "process" },
  { key: "DEVELOP", label: "Develop", type: "process" },
  { key: "ETCH", label: "Etch", type: "process" },
  { key: "STRIP", label: "Strip", type: "process" },

  // Drilling / plating
  { key: "DRILL", label: "Drilling", type: "process" },
  { key: "DESMEAR", label: "Desmear", type: "process" },
  { key: "PTH", label: "PTH / Copper Plating", type: "process" },

  // Multilayer
  { key: "INNER_AOI", label: "Inner Layer AOI", type: "qc" },
  { key: "OXIDE", label: "Oxide Treatment", type: "process" },
  { key: "LAYUP", label: "Layup & Pressing", type: "process" },
  { key: "X_RAY", label: "X-Ray Registration", type: "qc" },

  // Outer layer
  { key: "OUTER_IMAGE", label: "Outer Layer Imaging", type: "process" },
  { key: "OUTER_AOI", label: "Outer AOI", type: "qc" },

  // Soldermask / finish
  { key: "SOLDER_MASK", label: "Solder Mask", type: "process" },
  { key: "SILKSCREEN", label: "Legend / Silkscreen", type: "process" },
  { key: "SURFACE_FINISH", label: "Surface Finish (HASL/ENIG/OSP)", type: "process" },

  // Test & pack
  { key: "E_TEST", label: "Electrical Test (E-Test)", type: "qc" },
  { key: "FINAL_QC", label: "Final QC", type: "qc" },
  { key: "PACKING", label: "Packing & Dispatch Prep", type: "process" },
];

const QC_GATE_CHOICES = ["AOI", "E-Test", "X-Ray", "Final QC", "Microsection", "Impedance Test"];

function makeStep(partial = {}) {
  const now = Date.now();
  return {
    id: `st_${now}_${Math.random().toString(16).slice(2)}`,
    stepNo: 0, // will be assigned
    operationKey: partial.operationKey || "CUT_LAMINATE",
    operationName:
      partial.operationName ||
      OP_CATALOG.find((o) => o.key === partial.operationKey)?.label ||
      "Operation",
    workCenter: partial.workCenter || "WC-01",
    machine: partial.machine || "",
    setupMin: Number.isFinite(Number(partial.setupMin)) ? Number(partial.setupMin) : 5,
    runMin: Number.isFinite(Number(partial.runMin)) ? Number(partial.runMin) : 10,
    moveMin: Number.isFinite(Number(partial.moveMin)) ? Number(partial.moveMin) : 2,
    queueMin: Number.isFinite(Number(partial.queueMin)) ? Number(partial.queueMin) : 0,
    yieldPct: Number.isFinite(Number(partial.yieldPct)) ? Number(partial.yieldPct) : 99.0,
    qcGates: Array.isArray(partial.qcGates) ? partial.qcGates : [],
    notes: partial.notes || "",
    active: partial.active !== undefined ? !!partial.active : true,
  };
}

function renumber(steps) {
  return steps.map((s, idx) => ({ ...s, stepNo: idx + 1 }));
}

function sumMinutes(steps) {
  return steps.reduce((acc, s) => acc + Number(s.setupMin || 0) + Number(s.runMin || 0) + Number(s.moveMin || 0) + Number(s.queueMin || 0), 0);
}

function opTypeColor(type) {
  if (type === "qc") return "bg-emerald-600 text-white hover:bg-emerald-600";
  if (type === "office") return "bg-gray-900 text-white hover:bg-gray-900";
  return "bg-[#dc2551] text-white hover:bg-[#dc2551]";
}

function guessOpType(operationKey) {
  return OP_CATALOG.find((o) => o.key === operationKey)?.type || "process";
}

export default function RoutingSteps({
  value,
  onChange,
  defaultTemplate = "2L",
  title = "Routing Steps",
  subtitle = "Build the PCB process flow with timings, work centers, and QC gates.",
}) {
  const { toast } = useToast();

  const isControlled = Array.isArray(value) && typeof onChange === "function";
  const [localSteps, setLocalSteps] = useState(() => {
    if (isControlled) return [];
    const tpl = buildTemplate(defaultTemplate);
    return renumber(tpl);
  });

  const steps = isControlled ? value : localSteps;
  const setSteps = (next) => {
    const normalized = renumber(next);
    if (isControlled) onChange(normalized);
    else setLocalSteps(normalized);
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const totals = useMemo(() => {
    const totalMin = sumMinutes(steps || []);
    const totalYield = (steps || []).reduce((acc, s) => acc * (Number(s.yieldPct || 100) / 100), 1) * 100;
    return {
      totalMin,
      totalYieldPct: Number.isFinite(totalYield) ? totalYield : 100,
      qcCount: (steps || []).reduce((acc, s) => acc + (s.qcGates?.length || 0), 0),
    };
  }, [steps]);

  function updateStep(id, patch) {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addStep(afterIndex = null) {
    const newStep = makeStep({});
    const next = steps.slice();
    if (afterIndex === null || afterIndex === undefined) next.push(newStep);
    else next.splice(afterIndex + 1, 0, newStep);
    setSteps(next);
    toast({ title: "Step added", description: "New routing step added to the flow." });
  }

  function cloneStep(id) {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const src = steps[idx];
    const copy = makeStep({ ...src, notes: src.notes ? `${src.notes} (copy)` : "" });
    const next = steps.slice();
    next.splice(idx + 1, 0, copy);
    setSteps(next);
    toast({ title: "Cloned", description: "Step duplicated." });
  }

  function requestDelete(id) {
    setSelectedId(id);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    setSteps(steps.filter((s) => s.id !== selectedId));
    setDeleteOpen(false);
    setSelectedId(null);
    toast({ title: "Removed", description: "Step removed from routing." });
  }

  function move(id, dir) {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = steps.slice();
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    setSteps(next);
  }

  function applyTemplate(kind) {
    const tpl = renumber(buildTemplate(kind));
    setSteps(tpl);
    toast({ title: "Template applied", description: `Loaded ${kind} routing template. Review and adjust timings.` });
  }

  function exportJson() {
    const payload = {
      generatedAt: new Date().toISOString(),
      steps,
      totals,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routing_steps_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Routing steps exported as JSON." });
  }

  function softValidate() {
    const issues = [];
    (steps || []).forEach((s) => {
      if (!s.operationName?.trim()) issues.push(`Step ${s.stepNo}: Operation name required`);
      if (!s.workCenter?.trim()) issues.push(`Step ${s.stepNo}: Work center required`);
      if (Number(s.yieldPct) <= 0 || Number(s.yieldPct) > 100) issues.push(`Step ${s.stepNo}: Yield must be 0-100`);
    });

    if (issues.length) {
      toast({
        title: "Validation warnings",
        description: issues.slice(0, 2).join(" • ") + (issues.length > 2 ? ` • +${issues.length - 2} more` : ""),
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Looks good", description: "Routing steps have no obvious issues." });
    return true;
  }

  return (
    <div className="space-y-6">
      {/* Top summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gray-900" />
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => softValidate()}>
            <CheckCircle2 className="h-4 w-4" />
            Validate
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportJson}>
            <Save className="h-4 w-4" />
            Export JSON
          </Button>
          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={() => addStep(null)}>
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-gray-500">Total Standard Time</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">{Math.round(totals.totalMin)} min</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10">
              <Clock className="h-5 w-5 text-[#dc2551]" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-gray-500">Estimated Yield</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">{totals.totalYieldPct.toFixed(2)}%</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-gray-500">QC Gates</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">{totals.qcCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100">
              <Layers className="h-5 w-5 text-gray-800" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-900">Quick Templates</CardTitle>
          <CardDescription className="text-xs">
            Load a standard process flow, then adjust work centers, machines, and times.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => applyTemplate("2L")}>
            <Wand2 className="h-4 w-4" />
            2 Layer Standard
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => applyTemplate("4L")}>
            <Wand2 className="h-4 w-4" />
            4 Layer Standard
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => applyTemplate("HDI")}>
            <Wand2 className="h-4 w-4" />
            HDI / Advanced
          </Button>

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
            <AlertTriangle className="h-4 w-4" />
            Templates are examples — match your shop-floor process.
          </div>
        </CardContent>
      </Card>

      {/* Steps list */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-900">Steps</CardTitle>
          <CardDescription className="text-xs">
            Each step represents an operation/work center in the PCB manufacturing flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(steps || []).length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#dc2551]/10">
                <Plus className="h-6 w-6 text-[#dc2551]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No steps yet</h3>
              <p className="mt-1 text-sm text-gray-600">Add steps or apply a template to get started.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={() => applyTemplate("2L")}>
                  Load 2L Template
                </Button>
                <Button className="bg-[#dc2551] hover:bg-[#b02045]" onClick={() => addStep(null)}>
                  Add Step
                </Button>
              </div>
            </div>
          ) : (
            steps.map((s, idx) => {
              const opType = guessOpType(s.operationKey);
              const opLabel = OP_CATALOG.find((o) => o.key === s.operationKey)?.label || s.operationName;

              return (
                <div key={s.id} className="rounded-2xl border bg-white p-4">
                  {/* Step header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-50">
                        <span className="text-sm font-extrabold text-gray-900">{s.stepNo}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cx("border-0", opTypeColor(opType))}>{opType.toUpperCase()}</Badge>
                          <p className="text-sm font-semibold text-gray-900">{opLabel}</p>
                          {!s.active ? <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inactive</Badge> : null}
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          Work Center: <span className="font-semibold text-gray-900">{s.workCenter || "-"}</span>
                          {s.machine ? (
                            <>
                              {" "}
                              • Machine: <span className="font-semibold text-gray-900">{s.machine}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => move(s.id, "up")}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                        Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => move(s.id, "down")}
                        disabled={idx === steps.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                        Down
                      </Button>

                      <Button variant="outline" size="sm" className="gap-2" onClick={() => cloneStep(s.id)}>
                        <Copy className="h-4 w-4" />
                        Clone
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => requestDelete(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>

                      <Button variant="outline" size="sm" className="gap-2" onClick={() => addStep(idx)}>
                        <Plus className="h-4 w-4" />
                        Add After
                      </Button>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <Label className="text-xs text-gray-600">Operation</Label>
                      <div className="mt-1">
                        <select
                          value={s.operationKey}
                          onChange={(e) => {
                            const key = e.target.value;
                            const label = OP_CATALOG.find((o) => o.key === key)?.label || s.operationName;
                            updateStep(s.id, { operationKey: key, operationName: label });
                          }}
                          className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                        >
                          {OP_CATALOG.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <Label className="text-xs text-gray-600">Work Center</Label>
                      <Input
                        className="mt-1"
                        value={s.workCenter}
                        onChange={(e) => updateStep(s.id, { workCenter: e.target.value })}
                        placeholder="e.g., Imaging Line 1"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label className="text-xs text-gray-600">Machine (optional)</Label>
                      <Input
                        className="mt-1"
                        value={s.machine}
                        onChange={(e) => updateStep(s.id, { machine: e.target.value })}
                        placeholder="e.g., UV Exposer #2"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs text-gray-600">Yield %</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={s.yieldPct}
                        onChange={(e) => updateStep(s.id, { yieldPct: e.target.value })}
                      />
                    </div>

                    {/* time grid */}
                    <div className="md:col-span-3">
                      <Label className="text-xs text-gray-600">Setup (min)</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        min="0"
                        value={s.setupMin}
                        onChange={(e) => updateStep(s.id, { setupMin: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs text-gray-600">Run (min)</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        min="0"
                        value={s.runMin}
                        onChange={(e) => updateStep(s.id, { runMin: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs text-gray-600">Move (min)</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        min="0"
                        value={s.moveMin}
                        onChange={(e) => updateStep(s.id, { moveMin: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs text-gray-600">Queue (min)</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        min="0"
                        value={s.queueMin}
                        onChange={(e) => updateStep(s.id, { queueMin: e.target.value })}
                      />
                    </div>

                    {/* QC Gates */}
                    <div className="md:col-span-6">
                      <Label className="text-xs text-gray-600">QC Gates</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {QC_GATE_CHOICES.map((g) => {
                          const active = (s.qcGates || []).includes(g);
                          return (
                            <button
                              type="button"
                              key={g}
                              onClick={() => {
                                const next = active
                                  ? (s.qcGates || []).filter((x) => x !== g)
                                  : [...(s.qcGates || []), g];
                                updateStep(s.id, { qcGates: next });
                              }}
                              className={cx(
                                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                                active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-6">
                      <Label className="text-xs text-gray-600">Notes (optional)</Label>
                      <Input
                        className="mt-1"
                        value={s.notes}
                        onChange={(e) => updateStep(s.id, { notes: e.target.value })}
                        placeholder="e.g., Use controlled etch parameters; verify impedance coupons"
                      />
                    </div>

                    {/* mini total */}
                    <div className="md:col-span-12">
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs">
                        <span className="text-gray-700">
                          Step Time:{" "}
                          <span className="font-semibold text-gray-900">
                            {Number(s.setupMin || 0) + Number(s.runMin || 0) + Number(s.moveMin || 0) + Number(s.queueMin || 0)} min
                          </span>
                        </span>
                        <span className="text-gray-700">
                          Yield: <span className="font-semibold text-gray-900">{Number(s.yieldPct || 0).toFixed(2)}%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove step?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected step from the routing flow. You can add it again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -----------------------------
   Templates
------------------------------ */
function buildTemplate(kind) {
  if (kind === "4L") {
    return [
      makeStep({ operationKey: "CAM_IMPORT", workCenter: "CAM", setupMin: 5, runMin: 10, qcGates: [] }),
      makeStep({ operationKey: "DFM_REVIEW", workCenter: "ENG", setupMin: 5, runMin: 15, qcGates: [] }),

      makeStep({ operationKey: "CUT_LAMINATE", workCenter: "CUT", setupMin: 5, runMin: 10 }),
      makeStep({ operationKey: "DRY_FILM", workCenter: "IMAGING", setupMin: 5, runMin: 20 }),
      makeStep({ operationKey: "EXPOSURE", workCenter: "IMAGING", setupMin: 3, runMin: 10 }),
      makeStep({ operationKey: "DEVELOP", workCenter: "IMAGING", setupMin: 3, runMin: 10 }),
      makeStep({ operationKey: "ETCH", workCenter: "ETCH", setupMin: 5, runMin: 25 }),
      makeStep({ operationKey: "STRIP", workCenter: "ETCH", setupMin: 3, runMin: 10 }),
      makeStep({ operationKey: "INNER_AOI", workCenter: "QC", setupMin: 2, runMin: 10, qcGates: ["AOI"] }),

      makeStep({ operationKey: "OXIDE", workCenter: "MLP", setupMin: 5, runMin: 15 }),
      makeStep({ operationKey: "LAYUP", workCenter: "MLP", setupMin: 10, runMin: 30 }),
      makeStep({ operationKey: "X_RAY", workCenter: "QC", setupMin: 2, runMin: 10, qcGates: ["X-Ray"] }),

      makeStep({ operationKey: "DRILL", workCenter: "DRILL", setupMin: 8, runMin: 25 }),
      makeStep({ operationKey: "DESMEAR", workCenter: "PLATING", setupMin: 5, runMin: 20 }),
      makeStep({ operationKey: "PTH", workCenter: "PLATING", setupMin: 10, runMin: 35 }),

      makeStep({ operationKey: "OUTER_IMAGE", workCenter: "IMAGING", setupMin: 5, runMin: 20 }),
      makeStep({ operationKey: "OUTER_AOI", workCenter: "QC", setupMin: 2, runMin: 12, qcGates: ["AOI"] }),

      makeStep({ operationKey: "SOLDER_MASK", workCenter: "SM", setupMin: 5, runMin: 20 }),
      makeStep({ operationKey: "SILKSCREEN", workCenter: "LEGEND", setupMin: 3, runMin: 10 }),
      makeStep({ operationKey: "SURFACE_FINISH", workCenter: "FINISH", setupMin: 10, runMin: 30 }),

      makeStep({ operationKey: "E_TEST", workCenter: "TEST", setupMin: 5, runMin: 20, qcGates: ["E-Test"] }),
      makeStep({ operationKey: "FINAL_QC", workCenter: "QC", setupMin: 3, runMin: 10, qcGates: ["Final QC"] }),
      makeStep({ operationKey: "PACKING", workCenter: "PACK", setupMin: 3, runMin: 10 }),
    ];
  }

  if (kind === "HDI") {
    return [
      makeStep({ operationKey: "CAM_IMPORT", workCenter: "CAM", setupMin: 5, runMin: 12 }),
      makeStep({ operationKey: "DFM_REVIEW", workCenter: "ENG", setupMin: 5, runMin: 20, notes: "Include microvia/stacked via checks" }),

      makeStep({ operationKey: "CUT_LAMINATE", workCenter: "CUT", setupMin: 5, runMin: 12 }),
      makeStep({ operationKey: "DRY_FILM", workCenter: "IMAGING", setupMin: 5, runMin: 25 }),
      makeStep({ operationKey: "EXPOSURE", workCenter: "IMAGING", setupMin: 4, runMin: 12 }),
      makeStep({ operationKey: "DEVELOP", workCenter: "IMAGING", setupMin: 3, runMin: 12 }),
      makeStep({ operationKey: "ETCH", workCenter: "ETCH", setupMin: 5, runMin: 30 }),
      makeStep({ operationKey: "STRIP", workCenter: "ETCH", setupMin: 3, runMin: 12 }),
      makeStep({ operationKey: "INNER_AOI", workCenter: "QC", setupMin: 2, runMin: 12, qcGates: ["AOI"] }),

      makeStep({ operationKey: "OXIDE", workCenter: "MLP", setupMin: 6, runMin: 18 }),
      makeStep({ operationKey: "LAYUP", workCenter: "MLP", setupMin: 12, runMin: 40 }),
      makeStep({ operationKey: "X_RAY", workCenter: "QC", setupMin: 3, runMin: 12, qcGates: ["X-Ray"] }),

      makeStep({ operationKey: "DRILL", workCenter: "LASER/DRILL", setupMin: 10, runMin: 35, notes: "Laser microvia + mechanical drill" }),
      makeStep({ operationKey: "DESMEAR", workCenter: "PLATING", setupMin: 6, runMin: 25 }),
      makeStep({ operationKey: "PTH", workCenter: "PLATING", setupMin: 10, runMin: 45, notes: "Tight copper thickness control" }),

      makeStep({ operationKey: "OUTER_IMAGE", workCenter: "IMAGING", setupMin: 5, runMin: 25 }),
      makeStep({ operationKey: "OUTER_AOI", workCenter: "QC", setupMin: 2, runMin: 15, qcGates: ["AOI"] }),
      makeStep({ operationKey: "SOLDER_MASK", workCenter: "SM", setupMin: 5, runMin: 25 }),
      makeStep({ operationKey: "SILKSCREEN", workCenter: "LEGEND", setupMin: 3, runMin: 12 }),
      makeStep({ operationKey: "SURFACE_FINISH", workCenter: "FINISH", setupMin: 12, runMin: 40, notes: "ENEPIG/ENIG per spec" }),

      makeStep({ operationKey: "E_TEST", workCenter: "TEST", setupMin: 5, runMin: 25, qcGates: ["E-Test", "Impedance Test"] }),
      makeStep({ operationKey: "FINAL_QC", workCenter: "QC", setupMin: 3, runMin: 12, qcGates: ["Final QC", "Microsection"] }),
      makeStep({ operationKey: "PACKING", workCenter: "PACK", setupMin: 3, runMin: 12 }),
    ];
  }

  // default 2L
  return [
    makeStep({ operationKey: "CAM_IMPORT", workCenter: "CAM", setupMin: 5, runMin: 8 }),
    makeStep({ operationKey: "DFM_REVIEW", workCenter: "ENG", setupMin: 5, runMin: 10 }),

    makeStep({ operationKey: "CUT_LAMINATE", workCenter: "CUT", setupMin: 5, runMin: 10 }),
    makeStep({ operationKey: "DRY_FILM", workCenter: "IMAGING", setupMin: 5, runMin: 18 }),
    makeStep({ operationKey: "EXPOSURE", workCenter: "IMAGING", setupMin: 3, runMin: 8 }),
    makeStep({ operationKey: "DEVELOP", workCenter: "IMAGING", setupMin: 3, runMin: 8 }),
    makeStep({ operationKey: "ETCH", workCenter: "ETCH", setupMin: 5, runMin: 22 }),
    makeStep({ operationKey: "STRIP", workCenter: "ETCH", setupMin: 3, runMin: 8 }),

    makeStep({ operationKey: "DRILL", workCenter: "DRILL", setupMin: 8, runMin: 20 }),
    makeStep({ operationKey: "DESMEAR", workCenter: "PLATING", setupMin: 5, runMin: 15 }),
    makeStep({ operationKey: "PTH", workCenter: "PLATING", setupMin: 10, runMin: 30 }),

    makeStep({ operationKey: "SOLDER_MASK", workCenter: "SM", setupMin: 5, runMin: 18 }),
    makeStep({ operationKey: "SILKSCREEN", workCenter: "LEGEND", setupMin: 3, runMin: 8 }),
    makeStep({ operationKey: "SURFACE_FINISH", workCenter: "FINISH", setupMin: 10, runMin: 25 }),

    makeStep({ operationKey: "E_TEST", workCenter: "TEST", setupMin: 5, runMin: 18, qcGates: ["E-Test"] }),
    makeStep({ operationKey: "FINAL_QC", workCenter: "QC", setupMin: 3, runMin: 10, qcGates: ["Final QC"] }),
    makeStep({ operationKey: "PACKING", workCenter: "PACK", setupMin: 3, runMin: 10 }),
  ];
}
