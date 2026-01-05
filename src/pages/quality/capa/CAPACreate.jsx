// src/pages/quality/capa/CAPACreate.jsx
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectItem,
} from "@/components/ui/select";

import { ArrowLeft, Save, ShieldCheck } from "lucide-react";

const SOURCE_OPTIONS = [
  { value: "ncr", label: "NCR" },
  { value: "aoi", label: "AOI" },
  { value: "etest", label: "E-Test" },
  { value: "incoming_qc", label: "Incoming QC" },
  { value: "inprocess_qc", label: "In-Process QC" },
  { value: "final_qc", label: "Final QC" },
  { value: "customer_complaint", label: "Customer Complaint" },
  { value: "audit", label: "Internal/External Audit" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const ROOT_CAUSE_METHODS = [
  { value: "5why", label: "5 Whys" },
  { value: "fishbone", label: "Fishbone (Ishikawa)" },
  { value: "8d", label: "8D" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function CAPACreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("ncr");
  const [referenceNo, setReferenceNo] = useState(""); // e.g., NCR-000123 / AOI-0002
  const [severity, setSeverity] = useState("medium");
  const [status, setStatus] = useState("draft");

  const [problemStatement, setProblemStatement] = useState("");
  const [affectedProcess, setAffectedProcess] = useState(""); // e.g., Drilling, Plating, Etching, Soldermask
  const [partNo, setPartNo] = useState(""); // PCB part number / customer part
  const [jobNo, setJobNo] = useState(""); // Work Order / Job / Batch
  const [lotNo, setLotNo] = useState("");

  const [containmentAction, setContainmentAction] = useState("");
  const [rootCauseMethod, setRootCauseMethod] = useState("5why");
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [ownerDept, setOwnerDept] = useState(""); // e.g., Quality, CAM, Production, Stores
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD

  const [effectivenessCriteria, setEffectivenessCriteria] = useState("");
  const [notes, setNotes] = useState("");

  const errors = useMemo(() => {
    const e = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!problemStatement.trim()) e.problemStatement = "Problem statement is required.";
    if (!containmentAction.trim()) e.containmentAction = "Containment action is required.";
    if (!rootCause.trim()) e.rootCause = "Root cause is required.";
    if (!correctiveAction.trim()) e.correctiveAction = "Corrective action is required.";
    if (!preventiveAction.trim()) e.preventiveAction = "Preventive action is required.";
    if (!ownerName.trim()) e.ownerName = "Owner is required.";
    if (!dueDate) e.dueDate = "Due date is required.";
    return e;
  }, [
    title,
    problemStatement,
    containmentAction,
    rootCause,
    correctiveAction,
    preventiveAction,
    ownerName,
    dueDate,
  ]);

  const canSubmit = Object.keys(errors).length === 0 && !isSaving;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Fix required fields",
        description: "Please fill all required CAPA details before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        source_type: sourceType,
        reference_no: referenceNo.trim() || null,
        severity,
        status,

        problem_statement: problemStatement.trim(),
        affected_process: affectedProcess.trim() || null,
        part_no: partNo.trim() || null,
        job_no: jobNo.trim() || null,
        lot_no: lotNo.trim() || null,

        containment_action: containmentAction.trim(),
        root_cause_method: rootCauseMethod,
        root_cause: rootCause.trim(),
        corrective_action: correctiveAction.trim(),
        preventive_action: preventiveAction.trim(),

        owner_name: ownerName.trim(),
        owner_department: ownerDept.trim() || null,
        due_date: dueDate, // expect YYYY-MM-DD

        effectiveness_criteria: effectivenessCriteria.trim() || null,
        notes: notes.trim() || null,
      };

      // Recommended endpoint (adjust if your backend differs)
      // POST /quality/capa
      const res = await api.post("/quality/capa", payload);

      toast({
        title: "CAPA created",
        description: "Your CAPA has been saved successfully.",
      });

      const createdId = res?.data?.id;
      if (createdId) {
        navigate(`/quality/capa/${createdId}`);
      } else {
        navigate("/quality/capa");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create CAPA. Please try again.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link to="/quality/capa" className="hover:text-gray-700 hover:underline">
                CAPA
              </Link>
              <span>/</span>
              <span className="text-gray-700">Create</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Create CAPA</h1>
            <p className="text-sm text-gray-600">
              Corrective & Preventive Action for PCB manufacturing quality issues (NCR/AOI/E-Test/Audit/Customer).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            className={cx(
              "gap-2",
              "bg-[#dc2551] hover:bg-[#b02045]"
            )}
            disabled={!canSubmit}
            onClick={handleSave}
            type="button"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save CAPA"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Summary */}
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., High open in plating causing intermittent failures"
              />
              {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={sourceType} onValueChange={setSourceType} placeholder="Select source">
                  {SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference No.</Label>
                <Input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g., NCR-000123 / AOI-0042"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity} placeholder="Select severity">
                {SEVERITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus} placeholder="Select status">
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate}</p>}
            </div>
          </div>
        </Card>

        {/* Context (PCB-specific identifiers) */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900">PCB Context</h2>
          <p className="mt-1 text-xs text-gray-600">
            Link CAPA to Job/Work Order, Lot, and Part numbers for traceability.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Affected Process</Label>
              <Input
                value={affectedProcess}
                onChange={(e) => setAffectedProcess(e.target.value)}
                placeholder="e.g., Imaging / Etching / Plating"
              />
            </div>

            <div className="space-y-2">
              <Label>Part No.</Label>
              <Input
                value={partNo}
                onChange={(e) => setPartNo(e.target.value)}
                placeholder="Customer part / internal part"
              />
            </div>

            <div className="space-y-2">
              <Label>Job / Work Order No.</Label>
              <Input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                placeholder="e.g., WO-2026-00121"
              />
            </div>

            <div className="space-y-2">
              <Label>Lot No.</Label>
              <Input
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                placeholder="e.g., LOT-PLT-00088"
              />
            </div>
          </div>
        </Card>

        {/* Problem */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900">Problem Definition</h2>

          <div className="mt-4 space-y-2">
            <Label>
              Problem Statement <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Describe the issue observed (what/where/when/how many). Include defect type, layer, net, station, etc."
              rows={5}
            />
            {errors.problemStatement && (
              <p className="text-xs text-red-600">{errors.problemStatement}</p>
            )}
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900">Actions</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Containment Action <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={containmentAction}
                onChange={(e) => setContainmentAction(e.target.value)}
                placeholder="Immediate action to stop escape (hold lots, 100% inspection, quarantine, rework, etc.)"
                rows={4}
              />
              {errors.containmentAction && (
                <p className="text-xs text-red-600">{errors.containmentAction}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Root Cause Method</Label>
              <Select value={rootCauseMethod} onValueChange={setRootCauseMethod} placeholder="Select method">
                {ROOT_CAUSE_METHODS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </Select>

              <div className="mt-3 space-y-2">
                <Label>
                  Root Cause <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Explain verified root cause (equipment, chemistry, exposure settings, drill wear, operator method, etc.)"
                  rows={4}
                />
                {errors.rootCause && <p className="text-xs text-red-600">{errors.rootCause}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Corrective Action <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="Action to fix current issue and prevent recurrence for the affected lots/jobs"
                rows={4}
              />
              {errors.correctiveAction && (
                <p className="text-xs text-red-600">{errors.correctiveAction}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Preventive Action <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                placeholder="System-level prevention (SOP update, PM frequency, SPC control plan, training, parameter lock, incoming spec)"
                rows={4}
              />
              {errors.preventiveAction && (
                <p className="text-xs text-red-600">{errors.preventiveAction}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Ownership + Effectiveness */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900">Ownership & Effectiveness</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Owner <span className="text-red-500">*</span>
              </Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g., Anas K (Quality Engineer)"
              />
              {errors.ownerName && <p className="text-xs text-red-600">{errors.ownerName}</p>}
            </div>

            <div className="space-y-2">
              <Label>Owner Department</Label>
              <Input
                value={ownerDept}
                onChange={(e) => setOwnerDept(e.target.value)}
                placeholder="e.g., Quality / Production / CAM"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Effectiveness Criteria</Label>
              <Textarea
                value={effectivenessCriteria}
                onChange={(e) => setEffectivenessCriteria(e.target.value)}
                placeholder="How you will verify effectiveness (e.g., FPY improvement, defect reduction %, 0 escapes for 3 lots, audit closure, SPC stability)."
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional remarks, links to evidence, measurement logs, images, etc."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Bottom actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate("/quality/capa")}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            disabled={!canSubmit}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Create CAPA"}
          </Button>
        </div>

        {/* Tiny helper */}
        <p className="text-xs text-gray-500">
          Tip: For PCBxpress traceability, always fill <span className="font-medium">Job/WO</span> and{" "}
          <span className="font-medium">Lot No.</span> when available.
        </p>
      </form>
    </div>
  );
}
