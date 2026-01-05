// src/pages/production/routing/RoutingDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ClipboardList,
  Copy,
  Edit3,
  Factory,
  FileDown,
  Layers,
  Loader2,
  PencilLine,
  ShieldCheck,
  Timer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ScanEye,
  Zap,
  Wrench,
  Settings2,
  Printer,
  Droplet,
} from "lucide-react";

/**
 * PCB ERP - RoutingDetails
 * -----------------------
 * View (and optionally clone/export) an existing manufacturing routing.
 * Replace MOCK fetch with real API later.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pctClamp(v) {
  const n = asNumber(v, 0);
  return Math.max(0, Math.min(100, n));
}

function normalizeSteps(steps) {
  return (steps || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s, idx) => ({ ...s, order: idx + 1 }));
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const OP_ICON = {
  cam: Settings2,
  imaging: Printer,
  etching: Droplet,
  drilling: Wrench,
  pth: Wrench,
  plating: Layers,
  aoi: ScanEye,
  soldermask: ShieldCheck,
  silkscreen: Printer,
  surfacefinish: Droplet,
  profiling: Wrench,
  etest: Zap,
  final: CheckCircle2,
};

const QC_BADGE = {
  none: { label: "No QC", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  inprocess: { label: "In-Process", className: "bg-blue-600 text-white hover:bg-blue-600" },
  aoi: { label: "AOI", className: "bg-[#dc2551] text-white hover:bg-[#dc2551]" },
  etest: { label: "E-Test", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
  final: { label: "Final QC", className: "bg-gray-900 text-white hover:bg-gray-900" },
};

// ------------------------------
// MOCK: Replace with API later
// ------------------------------
async function mockFetchRoutingById(id) {
  await new Promise((r) => setTimeout(r, 650));

  // if id doesn't exist, pretend not found
  if (!id) return null;

  return {
    id,
    code: "RT-ML4-A",
    name: "4L Standard FR4 (ENIG)",
    category: "multilayer",
    layerCount: 4,
    plant: "Plant A",
    customerClass: "IPC-2",
    revision: "A",
    notes: "Standard multilayer flow with AOI + E-Test.",
    steps: [
      {
        order: 1,
        opKey: "cam",
        name: "CAM Prep",
        workcenter: "CAM",
        timeUnit: "min",
        setupTime: 10,
        runTime: 2,
        runTimePer: "panel",
        yieldPct: 99,
        qcGate: "none",
        mandatory: true,
        docRef: "WI-CAM-001",
        notes: "Verify drill files, impedance coupons, stackup.",
      },
      {
        order: 2,
        opKey: "imaging",
        name: "Imaging / LDI",
        workcenter: "IMAGING",
        timeUnit: "min",
        setupTime: 15,
        runTime: 3,
        runTimePer: "panel",
        yieldPct: 98.5,
        qcGate: "inprocess",
        mandatory: true,
        docRef: "WI-LDI-004",
        notes: "Control exposure based on resist batch.",
      },
      {
        order: 3,
        opKey: "etching",
        name: "Etching",
        workcenter: "ETCH",
        timeUnit: "min",
        setupTime: 15,
        runTime: 3,
        runTimePer: "panel",
        yieldPct: 98.2,
        qcGate: "inprocess",
        mandatory: true,
        docRef: "WI-ETCH-002",
        notes: "Monitor Cu thickness; record SPC.",
      },
      {
        order: 4,
        opKey: "aoi",
        name: "AOI Inspection",
        workcenter: "AOI",
        timeUnit: "min",
        setupTime: 8,
        runTime: 2,
        runTimePer: "panel",
        yieldPct: 99.2,
        qcGate: "aoi",
        mandatory: true,
        docRef: "WI-AOI-007",
        notes: "Program per rev; validate golden image.",
      },
      {
        order: 5,
        opKey: "etest",
        name: "Electrical Test",
        workcenter: "ETEST",
        timeUnit: "min",
        setupTime: 10,
        runTime: 5,
        runTimePer: "panel",
        yieldPct: 99.0,
        qcGate: "etest",
        mandatory: true,
        docRef: "WI-ET-003",
        notes: "Netlist compare; log failures by defect code.",
      },
      {
        order: 6,
        opKey: "final",
        name: "Final QC + Packing",
        workcenter: "PACK",
        timeUnit: "min",
        setupTime: 6,
        runTime: 2,
        runTimePer: "lot",
        yieldPct: 99.8,
        qcGate: "final",
        mandatory: true,
        docRef: "WI-PACK-001",
        notes: "Labeling, COA if requested, vacuum pack.",
      },
    ],
    createdAt: "2026-01-05T10:30:00Z",
    updatedAt: "2026-01-05T12:10:00Z",
  };
}

export default function RoutingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // TODO: replace with routingService.getById(id)
        const data = await mockFetchRoutingById(id);
        if (!mounted) return;

        if (!data) {
          setRouting(null);
          toast({ title: "Not found", description: "Routing not found.", variant: "destructive" });
        } else {
          setRouting(data);
        }
      } catch (e) {
        if (!mounted) return;
        toast({ title: "Failed to load", description: "Could not load routing details.", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const steps = useMemo(() => normalizeSteps(routing?.steps || []), [routing]);

  const kpis = useMemo(() => {
    const totalSetup = steps.reduce((s, x) => s + asNumber(x.setupTime, 0), 0);
    const totalRun = steps.reduce((s, x) => s + asNumber(x.runTime, 0), 0);
    const rolledYield = steps.reduce((acc, x) => acc * (pctClamp(x.yieldPct) / 100), 1);
    const qcCount = steps.filter((x) => x.qcGate && x.qcGate !== "none").length;

    return {
      totalSetup,
      totalRun,
      rolledYieldPct: Math.round(rolledYield * 10000) / 100,
      qcCount,
      stepCount: steps.length,
    };
  }, [steps]);

  const onExportJson = () => {
    if (!routing) return;
    const payload = {
      ...routing,
      steps,
      kpis,
    };
    downloadJson(`routing_${routing.code || routing.id}.json`, payload);
    toast({ title: "Exported JSON", description: "Routing exported as JSON." });
  };

  const onClone = () => {
    if (!routing) return;
    // Navigate to create page and pass state (optional). If you don't use state, remove it.
    navigate("/production/routing/create", {
      state: {
        cloneFrom: routing,
      },
    });
    toast({ title: "Cloning started", description: "Routing data sent to Create page (as draft)." });
  };

  const onEdit = () => {
    if (!routing) return;
    // If you implement RoutingEdit.jsx later, update this route.
    navigate(`/production/routing/${routing.id}/edit`);
  };

  const requestDelete = () => setConfirmDelete(true);

  const confirmDeleteNow = async () => {
    try {
      setConfirmDelete(false);
      // TODO: replace with routingService.delete(routing.id)
      await new Promise((r) => setTimeout(r, 650));
      toast({ title: "Routing deleted", description: `Routing "${routing?.code}" removed.` });
      navigate("/production/routing", { replace: true });
    } catch (e) {
      toast({ title: "Delete failed", description: "Could not delete routing.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <p className="text-sm text-gray-600">Loading routing…</p>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="h-20 animate-pulse rounded bg-gray-100" />
              <div className="h-20 animate-pulse rounded bg-gray-100" />
              <div className="h-20 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="mt-6 h-64 animate-pulse rounded bg-gray-50" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!routing) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-50">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Routing not found</h2>
          <p className="mt-1 text-sm text-gray-600">The routing you requested doesn’t exist or was removed.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/production/routing">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Link>
            </Button>
            <Button className="bg-[#dc2551] hover:bg-[#b02045]" asChild>
              <Link to="/production/routing/create">Create Routing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-800" />
            <h1 className="text-xl font-bold text-gray-900">Routing Details</h1>
            <Badge className="bg-gray-900 text-white hover:bg-gray-900">{routing.code}</Badge>
            <Badge variant="outline">{routing.category?.toUpperCase?.() || "ROUTING"}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-600">{routing.name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/production/routing">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" onClick={onExportJson}>
            <FileDown className="h-4 w-4" />
            Export JSON
          </Button>

          <Button variant="outline" className="gap-2" onClick={onClone}>
            <Copy className="h-4 w-4" />
            Clone
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={requestDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header + KPIs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="shadow-sm lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-800">Routing Header</CardTitle>
            <CardDescription className="text-xs">Identity and applicability.</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="text-xs text-gray-600">Routing Code</Label>
              <Input value={routing.code || ""} readOnly className="mt-1 bg-gray-50" />
            </div>

            <div className="md:col-span-8">
              <Label className="text-xs text-gray-600">Routing Name</Label>
              <Input value={routing.name || ""} readOnly className="mt-1 bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Category</Label>
              <Input value={routing.category || ""} readOnly className="mt-1 bg-gray-50" />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600">Layers</Label>
              <Input value={String(routing.layerCount ?? "")} readOnly className="mt-1 bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Plant</Label>
              <Input value={routing.plant || ""} readOnly className="mt-1 bg-gray-50" />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600">Revision</Label>
              <Input value={routing.revision || ""} readOnly className="mt-1 bg-gray-50" />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600">Class</Label>
              <Input value={routing.customerClass || "-"} readOnly className="mt-1 bg-gray-50" />
            </div>

            <div className="md:col-span-12">
              <Label className="text-xs text-gray-600">Notes</Label>
              <Textarea value={routing.notes || ""} readOnly className="mt-1 bg-gray-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-800">Derived KPIs</CardTitle>
            <CardDescription className="text-xs">From steps (for planning).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Total Setup</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{Math.round(kpis.totalSetup)} min</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Total Run</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{Math.round(kpis.totalRun)} min</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">QC Gates</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{kpis.qcCount}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Rolled Yield</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{kpis.rolledYieldPct}%</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Steps</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{kpis.stepCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Steps Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-800">Steps</CardTitle>
          <CardDescription className="text-xs">Ordered manufacturing operations.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Operation</th>
                  <th className="px-4 py-3 text-left">Workcenter</th>
                  <th className="px-4 py-3 text-left">Setup</th>
                  <th className="px-4 py-3 text-left">Run</th>
                  <th className="px-4 py-3 text-left">Yield</th>
                  <th className="px-4 py-3 text-left">QC Gate</th>
                  <th className="px-4 py-3 text-left">Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {steps.map((s) => {
                  const Icon = OP_ICON[s.opKey] || PencilLine;
                  const qc = QC_BADGE[s.qcGate] || QC_BADGE.none;

                  return (
                    <tr key={`${routing.id}-${s.order}`} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 font-semibold text-gray-700">{s.order}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 rounded-lg bg-gray-100 p-1.5">
                            <Icon className="h-4 w-4 text-gray-700" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-500">
                              {s.mandatory ? "Mandatory" : "Optional"}
                              {s.runTimePer ? ` • per ${String(s.runTimePer)}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{s.workcenter}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {asNumber(s.setupTime, 0)} {s.timeUnit || "min"}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {asNumber(s.runTime, 0)} {s.timeUnit || "min"}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{pctClamp(s.yieldPct)}%</td>
                      <td className="px-4 py-3">
                        <Badge className={cx("border-0", qc.className)}>{qc.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{s.docRef || "-"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Step Notes */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {steps.map((s) => (
              <div key={`note-${routing.id}-${s.order}`} className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    Step {s.order}: {s.name}
                  </div>
                  {s.notes ? <Badge variant="outline">Notes</Badge> : <Badge variant="outline">—</Badge>}
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  {s.notes ? s.notes : <span className="text-gray-500">No notes for this step.</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete routing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-semibold">{routing.code}</span>. This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNow}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
