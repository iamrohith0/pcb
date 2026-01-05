// src/pages/engineering/revisions/RevisionCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ClipboardCheck,
  FilePlus2,
  Hash,
  Layers,
  Loader2,
  Package,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";

/**
 * RevisionCreate.jsx (PCBxpress / PCB Manufacturing ERP)
 *
 * Purpose:
 * - Create a new revision for a PCB Job (R1 -> R2, etc.)
 * - Capture release metadata + DFM notes + change summary
 * - Prepare a "Release Package" checklist (Gerber/Drill/Stackup/BOM/Panel drawings)
 *
 * Suggested route:
 *  - /engineering/revisions/new
 * Optional query params:
 *  - ?job=PCBXP-ALPHA-12&base=R1  (prefill)
 *
 * Backend Integration (replace mocks):
 *  - GET  /engineering/jobs/:job/revisions/meta     (latest revision, defaults)
 *  - POST /engineering/revisions                   (create revision)
 *  Payload (example):
 *   {
 *     jobCode, baseRevision, newRevision,
 *     title, reason, changeSummary,
 *     release: { layerCount, boardThickness, surfaceFinish, solderMask, silkscreen },
 *     packageChecklist: { gerber, drill, stackup, fabDrawing, bom, panelDrawing, impedanceReport, assemblyDrawing },
 *     approvals: { requiresECO, requiresQA, requiresCustomerApproval },
 *     notes
 *   }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/** Mock services (replace with axios services) */
const revisionService = {
  async getPrefill({ jobCode }) {
    await new Promise((r) => setTimeout(r, 250));
    if (!jobCode) return null;
    return {
      latestRevision: "R2",
      defaults: {
        layerCount: 4,
        boardThickness: "1.6mm",
        surfaceFinish: "ENIG",
        solderMask: "Green",
        silkscreen: "White",
      },
    };
  },

  async create(payload) {
    await new Promise((r) => setTimeout(r, 450));

    // Simulate server validation
    if (!payload?.jobCode || !payload?.newRevision) {
      const err = new Error("Validation error");
      err.response = { status: 422, data: { message: "Job Code and New Revision are required." } };
      throw err;
    }

    return {
      id: "rev_" + Math.random().toString(16).slice(2),
      ...payload,
      createdAt: new Date().toISOString(),
      status: payload?.approvals?.requiresECO ? "Pending ECO" : "Draft",
    };
  },
};

const SURFACE_FINISH = ["HASL", "LF-HASL", "ENIG", "OSP", "Immersion Silver", "Immersion Tin"];
const MASKS = ["Green", "Black", "Blue", "Red", "White", "Yellow", "Matte Black"];
const SILK = ["White", "Black", "None"];

export default function RevisionCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const [jobCode, setJobCode] = useState(sp.get("job") || "");
  const [baseRevision, setBaseRevision] = useState(sp.get("base") || "");
  const [newRevision, setNewRevision] = useState("");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  const [layerCount, setLayerCount] = useState("");
  const [boardThickness, setBoardThickness] = useState("");
  const [surfaceFinish, setSurfaceFinish] = useState("ENIG");
  const [solderMask, setSolderMask] = useState("Green");
  const [silkscreen, setSilkscreen] = useState("White");

  const [checklist, setChecklist] = useState({
    gerber: true,
    drill: true,
    stackup: true,
    fabDrawing: true,
    bom: false,
    panelDrawing: false,
    impedanceReport: false,
    assemblyDrawing: false,
  });

  const [approvals, setApprovals] = useState({
    requiresECO: true,
    requiresQA: true,
    requiresCustomerApproval: false,
  });

  const [notes, setNotes] = useState("");
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const canSubmit = useMemo(() => {
    return jobCode.trim() && baseRevision.trim() && newRevision.trim() && title.trim();
  }, [jobCode, baseRevision, newRevision, title]);

  const checklistCount = useMemo(() => {
    const on = Object.values(checklist).filter(Boolean).length;
    const total = Object.keys(checklist).length;
    return { on, total };
  }, [checklist]);

  const toggleChecklist = (k) => setChecklist((s) => ({ ...s, [k]: !s[k] }));
  const toggleApproval = (k) => setApprovals((s) => ({ ...s, [k]: !s[k] }));

  const prefill = async () => {
    const job = jobCode.trim();
    if (!job) return;

    setLoadingPrefill(true);
    try {
      const res = await revisionService.getPrefill({ jobCode: job });

      if (res?.latestRevision && !baseRevision) setBaseRevision(res.latestRevision);
      if (res?.defaults) {
        setLayerCount(String(res.defaults.layerCount ?? ""));
        setBoardThickness(res.defaults.boardThickness ?? "");
        setSurfaceFinish(res.defaults.surfaceFinish ?? "ENIG");
        setSolderMask(res.defaults.solderMask ?? "Green");
        setSilkscreen(res.defaults.silkscreen ?? "White");
      }

      toast({ title: "Prefilled", description: "Loaded last revision defaults." });
    } catch (e) {
      toast({ title: "Prefill failed", description: "Could not fetch defaults.", variant: "destructive" });
    } finally {
      setLoadingPrefill(false);
    }
  };

  useEffect(() => {
    if (jobCode.trim()) prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildPayload = () => ({
    jobCode: jobCode.trim(),
    baseRevision: baseRevision.trim(),
    newRevision: newRevision.trim(),
    title: title.trim(),
    reason: reason.trim(),
    changeSummary: changeSummary.trim(),
    release: {
      layerCount: layerCount ? Number(layerCount) : null,
      boardThickness: boardThickness.trim(),
      surfaceFinish,
      solderMask,
      silkscreen,
    },
    packageChecklist: checklist,
    approvals,
    notes: notes.trim(),
  });

  const submit = async () => {
    if (!canSubmit) {
      toast({
        title: "Missing fields",
        description: "Please fill Job Code, Base Revision, New Revision and Title.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await revisionService.create(payload);

      toast({
        title: "Revision created",
        description: `${res.jobCode} • ${res.baseRevision} → ${res.newRevision} (${res.status})`,
      });

      // You can change this to your RevisionDetails route later
      navigate(`/engineering/revisions`, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 422 ? "Validation failed. Please check your inputs." : "Failed to create revision.");
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const requestSubmit = (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Revision</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new PCB job revision and prepare a release package for CAM/Production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/engineering/revisions">
              <ArrowLeft className="h-4 w-4" />
              Back to Revisions
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={prefill}
            disabled={loadingPrefill || !jobCode.trim()}
          >
            {loadingPrefill ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Prefill
          </Button>
        </div>
      </div>

      <form onSubmit={requestSubmit} className="space-y-6">
        {/* Core identifiers */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4 text-gray-600" />
              Revision Identity
            </CardTitle>
            <CardDescription>Job and revision identifiers used across traceability and release records.</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <Label htmlFor="job">Job Code</Label>
                <Input
                  id="job"
                  value={jobCode}
                  onChange={(e) => setJobCode(e.target.value)}
                  placeholder="e.g., PCBXP-ALPHA-12"
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-4">
                <Label htmlFor="base">Base Revision</Label>
                <Input
                  id="base"
                  value={baseRevision}
                  onChange={(e) => setBaseRevision(e.target.value)}
                  placeholder="e.g., R2"
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-4">
                <Label htmlFor="new">New Revision</Label>
                <Input
                  id="new"
                  value={newRevision}
                  onChange={(e) => setNewRevision(e.target.value)}
                  placeholder="e.g., R3"
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-12">
                <Label htmlFor="title">Revision Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Update drill sizes and solder mask clearance for better yield"
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-6">
                <Label htmlFor="reason">Reason / Trigger</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ECO, DFM feedback, customer change, yield issue…"
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-6">
                <Label htmlFor="changeSummary">Change Summary</Label>
                <Input
                  id="changeSummary"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Short summary for production travelers & audit."
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-12">
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-gray-50 p-3 text-xs text-gray-600">
                  <Package className="h-4 w-4" />
                  Tip: Keep titles short. Put details in notes and checklist attachments.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Release parameters */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-gray-600" />
              Release Parameters
            </CardTitle>
            <CardDescription>Key manufacturing parameters that often change across revisions.</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Label htmlFor="layers">Layer Count</Label>
                <Input
                  id="layers"
                  type="number"
                  min={1}
                  value={layerCount}
                  onChange={(e) => setLayerCount(e.target.value)}
                  placeholder="e.g., 4"
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-3">
                <Label htmlFor="thk">Board Thickness</Label>
                <Input
                  id="thk"
                  value={boardThickness}
                  onChange={(e) => setBoardThickness(e.target.value)}
                  placeholder="e.g., 1.6mm"
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-3">
                <Label>Surface Finish</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={surfaceFinish}
                  onChange={(e) => setSurfaceFinish(e.target.value)}
                >
                  {SURFACE_FINISH.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <Label>Solder Mask</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={solderMask}
                  onChange={(e) => setSolderMask(e.target.value)}
                >
                  {MASKS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <Label>Silkscreen</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={silkscreen}
                  onChange={(e) => setSilkscreen(e.target.value)}
                >
                  {SILK.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-9">
                <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                  <ShieldCheck className="h-4 w-4" />
                  Keep release parameters aligned with the stackup sheet and impedance constraints.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Release package checklist */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-gray-600" />
              Release Package Checklist
            </CardTitle>
            <CardDescription>Select the documents included in this revision release package.</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                Included:{" "}
                <Badge className="rounded-full bg-gray-100 text-gray-800">
                  {checklistCount.on}/{checklistCount.total}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setChecklist({
                      gerber: true,
                      drill: true,
                      stackup: true,
                      fabDrawing: true,
                      bom: true,
                      panelDrawing: true,
                      impedanceReport: true,
                      assemblyDrawing: true,
                    })
                  }
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setChecklist({
                      gerber: false,
                      drill: false,
                      stackup: false,
                      fabDrawing: false,
                      bom: false,
                      panelDrawing: false,
                      impedanceReport: false,
                      assemblyDrawing: false,
                    })
                  }
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <ChecklistItem
                label="Gerber / Artwork"
                checked={checklist.gerber}
                onToggle={() => toggleChecklist("gerber")}
              />
              <ChecklistItem
                label="NC Drill"
                checked={checklist.drill}
                onToggle={() => toggleChecklist("drill")}
              />
              <ChecklistItem
                label="Stackup Sheet"
                checked={checklist.stackup}
                onToggle={() => toggleChecklist("stackup")}
              />
              <ChecklistItem
                label="Fabrication Drawing"
                checked={checklist.fabDrawing}
                onToggle={() => toggleChecklist("fabDrawing")}
              />
              <ChecklistItem label="BOM" checked={checklist.bom} onToggle={() => toggleChecklist("bom")} />
              <ChecklistItem
                label="Panel Drawing"
                checked={checklist.panelDrawing}
                onToggle={() => toggleChecklist("panelDrawing")}
              />
              <ChecklistItem
                label="Impedance Report"
                checked={checklist.impedanceReport}
                onToggle={() => toggleChecklist("impedanceReport")}
              />
              <ChecklistItem
                label="Assembly Drawing"
                checked={checklist.assemblyDrawing}
                onToggle={() => toggleChecklist("assemblyDrawing")}
              />
            </div>

            <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-xs text-gray-600">
              <span className="font-medium text-gray-800">Recommended minimum:</span> Gerber + Drill + Stackup + Fab
              Drawing.
            </div>
          </CardContent>
        </Card>

        {/* Approvals */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Approvals & Gates</CardTitle>
            <CardDescription>Define which approvals are required before release to production.</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TogglePill
                label="Requires ECO"
                checked={approvals.requiresECO}
                onToggle={() => toggleApproval("requiresECO")}
                hint="Engineering change must be approved."
              />
              <TogglePill
                label="Requires QA Review"
                checked={approvals.requiresQA}
                onToggle={() => toggleApproval("requiresQA")}
                hint="QA checks documents, rules, travelers."
              />
              <TogglePill
                label="Customer Approval"
                checked={approvals.requiresCustomerApproval}
                onToggle={() => toggleApproval("requiresCustomerApproval")}
                hint="Customer sign-off required."
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Notes</CardTitle>
            <CardDescription>DFM notes, special process notes, risks, and release instructions.</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Label htmlFor="notes">Notes (internal)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: Increase annular ring to 5 mil; update tooling holes; panel rails 7mm for conveyor; plating constraints…"
              className="mt-2 min-h-[140px]"
            />
          </CardContent>
        </Card>

        {/* Submit bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Creating a revision generates traceability records and a release package entry.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/engineering/revisions")}>
              Cancel
            </Button>

            <Button
              type="submit"
              className="gap-2 bg-[#DC2551] hover:bg-[#B02045]"
              disabled={!canSubmit || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
              Create Revision
            </Button>
          </div>
        </div>
      </form>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create this revision?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create revision <span className="font-medium">{newRevision || "—"}</span> for job{" "}
              <span className="font-medium">{jobCode || "—"}</span> (base:{" "}
              <span className="font-medium">{baseRevision || "—"}</span>) and register a release package checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-2 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-gray-100 text-gray-800">{layerCount ? `${layerCount}L` : "—L"}</Badge>
              <Badge className="rounded-full bg-gray-100 text-gray-800">{boardThickness || "— thickness"}</Badge>
              <Badge className="rounded-full bg-gray-100 text-gray-800">{surfaceFinish}</Badge>
              <Badge className="rounded-full bg-gray-100 text-gray-800">{solderMask} mask</Badge>
              <Badge className="rounded-full bg-gray-100 text-gray-800">{silkscreen} silk</Badge>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Checklist selected: {checklistCount.on}/{checklistCount.total}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="gap-2">
              <XCircle className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={submit}
              className={cx("gap-2", "bg-[#DC2551] hover:bg-[#B02045]")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChecklistItem({ label, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        checked ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      <span className="text-gray-900">{label}</span>
      {checked ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Included
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
          <XCircle className="h-4 w-4" />
          Not included
        </span>
      )}
    </button>
  );
}

function TogglePill({ label, checked, onToggle, hint }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "rounded-xl border p-4 text-left transition-colors",
        checked ? "border-[#DC2551]/25 bg-[#DC2551]/5" : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <Badge className={cx("rounded-full", checked ? "bg-[#DC2551] text-white" : "bg-gray-100 text-gray-800")}>
          {checked ? "Yes" : "No"}
        </Badge>
      </div>
      <div className="mt-2 text-xs text-gray-600">{hint}</div>
    </button>
  );
}
