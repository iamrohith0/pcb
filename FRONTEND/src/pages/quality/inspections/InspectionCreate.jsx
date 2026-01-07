// src/pages/quality/inspections/InspectionCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    FileUp,
    Loader2,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

/**
 * InspectionCreate.jsx (PCB Manufacturing ERP)
 *
 * Suggested API endpoints (adjust to your backend):
 * - GET  /masters/inspection-types
 * - GET  /masters/work-centers
 * - GET  /production/work-orders/lookup?q=
 * - GET  /inventory/lots/lookup?q=
 * - POST /quality/inspections
 *
 * Payload example:
 * {
 *   inspection_type_id,
 *   stage: "Incoming"|"In-Process"|"Final",
 *   work_center_id,
 *   work_order_id,
 *   lot_id,
 *   part_no,
 *   customer_name,
 *   sample_size,
 *   accepted_qty,
 *   rejected_qty,
 *   inspector_name,
 *   inspected_at,
 *   notes,
 *   checkpoints: [{ name, spec, method, result, status, defect_code, remarks }],
 *   defects: [{ defect_code, qty, remarks }],
 *   attachments: [File...]
 * }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STAGES = [
  { value: "Incoming", label: "Incoming (IQC)" },
  { value: "In-Process", label: "In-Process (IPQC)" },
  { value: "Final", label: "Final (FQC)" },
];

const DEFAULT_CHECKPOINTS = [
  { name: "Visual inspection", spec: "No scratches, no contamination, no exposed copper", method: "Visual", result: "", status: "pending", defect_code: "", remarks: "" },
  { name: "Solder mask", spec: "No pinholes, no misregistration beyond tolerance", method: "Visual / Measurement", result: "", status: "pending", defect_code: "", remarks: "" },
  { name: "Silkscreen", spec: "Legible, aligned, no smudging", method: "Visual", result: "", status: "pending", defect_code: "", remarks: "" },
  { name: "Dimensional", spec: "Board size within drawing tolerance", method: "Caliper", result: "", status: "pending", defect_code: "", remarks: "" },
];

const STATUS_META = {
  pass: { label: "Pass", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fail: { label: "Fail", className: "bg-rose-50 text-rose-700 border-rose-200" },
  pending: { label: "Pending", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function InspectionCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadingMasters, setLoadingMasters] = useState(true);
  const [saving, setSaving] = useState(false);

  // Masters
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);

  // Lookup helpers
  const [woQuery, setWoQuery] = useState("");
  const [woOptions, setWoOptions] = useState([]);
  const [lotQuery, setLotQuery] = useState("");
  const [lotOptions, setLotOptions] = useState([]);

  // Header fields
  const [inspectionTypeId, setInspectionTypeId] = useState("");
  const [stage, setStage] = useState("In-Process");
  const [workCenterId, setWorkCenterId] = useState("");

  const [workOrderId, setWorkOrderId] = useState("");
  const [workOrderNo, setWorkOrderNo] = useState("");

  const [lotId, setLotId] = useState("");
  const [lotNo, setLotNo] = useState("");

  const [partNo, setPartNo] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [inspectorName, setInspectorName] = useState("");
  const [inspectedAt, setInspectedAt] = useState(() => {
    // default to current local datetime (YYYY-MM-DDTHH:mm)
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const v = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return v;
  });

  // Sampling & results
  const [sampleSize, setSampleSize] = useState(5);
  const [acceptedQty, setAcceptedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [notes, setNotes] = useState("");

  // Details
  const [checkpoints, setCheckpoints] = useState(DEFAULT_CHECKPOINTS);
  const [defects, setDefects] = useState([{ defect_code: "", qty: 1, remarks: "" }]);

  // Attachments
  const [attachments, setAttachments] = useState([]);

  const overallStatus = useMemo(() => {
    if (!checkpoints.length) return "pending";
    const anyFail = checkpoints.some((c) => c.status === "fail");
    const allPass = checkpoints.every((c) => c.status === "pass");
    if (anyFail) return "fail";
    if (allPass) return "pass";
    return "pending";
  }, [checkpoints]);

  useEffect(() => {
    const loadMasters = async () => {
      setLoadingMasters(true);
      try {
        const [typesRes, wcRes] = await Promise.all([
          api.get("/masters/inspection-types"),
          api.get("/masters/work-centers"),
        ]);

        setInspectionTypes(typesRes?.data?.data ?? typesRes?.data ?? []);
        setWorkCenters(wcRes?.data?.data ?? wcRes?.data ?? []);
      } catch (err) {
        console.warn("Failed to load masters:", err);
        toast({
          title: "Failed to load form data",
          description: err?.response?.data?.message || "Check masters endpoints.",
          variant: "destructive",
        });
        setInspectionTypes([]);
        setWorkCenters([]);
      } finally {
        setLoadingMasters(false);
      }
    };

    loadMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Work order lookup (simple debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = woQuery.trim();
      if (!q) {
        setWoOptions([]);
        return;
      }
      try {
        const res = await api.get("/production/work-orders/lookup", { params: { q } });
        const data = res?.data?.data ?? res?.data ?? [];
        setWoOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setWoOptions([]);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [woQuery]);

  // Lot lookup (simple debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = lotQuery.trim();
      if (!q) {
        setLotOptions([]);
        return;
      }
      try {
        const res = await api.get("/inventory/lots/lookup", { params: { q } });
        const data = res?.data?.data ?? res?.data ?? [];
        setLotOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setLotOptions([]);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [lotQuery]);

  const pickWorkOrder = (wo) => {
    setWorkOrderId(String(wo.id));
    setWorkOrderNo(wo.work_order_no || wo.number || wo.code || "");
    setPartNo(wo.part_no || wo.partNumber || partNo);
    setCustomerName(wo.customer_name || wo.customer || customerName);
    setWoOptions([]);
    setWoQuery(wo.work_order_no || wo.number || "");
  };

  const pickLot = (lot) => {
    setLotId(String(lot.id));
    setLotNo(lot.lot_no || lot.number || "");
    setPartNo(lot.part_no || partNo);
    setLotOptions([]);
    setLotQuery(lot.lot_no || lot.number || "");
  };

  const updateCheckpoint = (idx, patch) => {
    setCheckpoints((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const addCheckpoint = () => {
    setCheckpoints((prev) => [
      ...prev,
      { name: "", spec: "", method: "", result: "", status: "pending", defect_code: "", remarks: "" },
    ]);
  };

  const removeCheckpoint = (idx) => {
    setCheckpoints((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateDefect = (idx, patch) => {
    setDefects((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const addDefect = () => setDefects((prev) => [...prev, { defect_code: "", qty: 1, remarks: "" }]);
  const removeDefect = (idx) => setDefects((prev) => prev.filter((_, i) => i !== idx));

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!inspectionTypeId) return "Select an inspection type.";
    if (!stage) return "Select an inspection stage.";
    if (!inspectorName.trim()) return "Enter inspector name.";
    if (!inspectedAt) return "Select inspected date/time.";
    if (!workOrderId && !lotId && !partNo.trim()) return "Provide Work Order, Lot, or Part No.";
    if (sampleSize < 1) return "Sample size must be at least 1.";
    if (acceptedQty < 0 || rejectedQty < 0) return "Accepted/Rejected cannot be negative.";
    if (acceptedQty + rejectedQty > sampleSize) return "Accepted + Rejected cannot exceed sample size.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errMsg = validate();
    if (errMsg) {
      toast({ title: "Fix required", description: errMsg, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();

      fd.append("inspection_type_id", inspectionTypeId);
      fd.append("stage", stage);
      if (workCenterId) fd.append("work_center_id", workCenterId);

      if (workOrderId) fd.append("work_order_id", workOrderId);
      if (lotId) fd.append("lot_id", lotId);

      if (partNo) fd.append("part_no", partNo);
      if (customerName) fd.append("customer_name", customerName);

      fd.append("sample_size", String(sampleSize));
      fd.append("accepted_qty", String(acceptedQty));
      fd.append("rejected_qty", String(rejectedQty));

      fd.append("inspector_name", inspectorName);
      fd.append("inspected_at", inspectedAt);

      fd.append("overall_status", overallStatus);
      if (notes) fd.append("notes", notes);

      fd.append("checkpoints", JSON.stringify(checkpoints));
      fd.append("defects", JSON.stringify(defects.filter((d) => d.defect_code && Number(d.qty) > 0)));

      attachments.forEach((f) => fd.append("attachments[]", f));

      const res = await api.post("/quality/inspections", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const id = res?.data?.id ?? res?.data?.data?.id;
      toast({
        title: "Inspection created",
        description: "Inspection record saved successfully.",
      });

      if (id) navigate(`/quality/inspections/${id}`);
      else navigate("/quality/inspections");
    } catch (err) {
      console.warn("Create inspection failed:", err);
      toast({
        title: "Create failed",
        description: err?.response?.data?.message || "Unable to create inspection. Check endpoint /quality/inspections",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const meta = STATUS_META[overallStatus] || STATUS_META.pending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Create Inspection</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Record IQC / IPQC / FQC checks with checkpoints, defects and attachments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Inspection
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cx("border", meta.className)}>
              {meta.label}
            </Badge>
            <span className="text-sm text-gray-600">
              Sample: <span className="font-semibold text-gray-900">{sampleSize}</span> • Accepted{" "}
              <span className="font-semibold text-gray-900">{acceptedQty}</span> • Rejected{" "}
              <span className="font-semibold text-gray-900">{rejectedQty}</span>
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Tip: Link failed checkpoints to NCR/CAPA when rejection qty &gt; 0.
          </div>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header fields */}
        <Card className="p-4">
          {loadingMasters ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading form data...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Inspection Type</Label>
                <Input
                  value={inspectionTypeId}
                  onChange={(e) => setInspectionTypeId(e.target.value)}
                  placeholder="Type ID (or replace with Select)"
                />
                <p className="text-xs text-gray-500">
                  You can replace this with your <code>Select</code> component later.
                </p>
                {!!inspectionTypes?.length && (
                  <div className="text-xs text-gray-500">
                    Examples: {inspectionTypes.slice(0, 3).map((t) => t.name || t.title).filter(Boolean).join(", ")}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Incoming | In-Process | Final" />
                <div className="flex flex-wrap gap-2 pt-1">
                  {STAGES.map((s) => (
                    <Button
                      type="button"
                      key={s.value}
                      variant={stage === s.value ? "default" : "outline"}
                      className={cx("h-8", stage === s.value && "bg-cyan-600 hover:bg-cyan-500")}
                      onClick={() => setStage(s.value)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Work Center</Label>
                <Input
                  value={workCenterId}
                  onChange={(e) => setWorkCenterId(e.target.value)}
                  placeholder="Work Center ID (or replace with Select)"
                />
                {!!workCenters?.length && (
                  <div className="text-xs text-gray-500">
                    Examples: {workCenters.slice(0, 3).map((w) => w.name || w.title).filter(Boolean).join(", ")}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Inspected At</Label>
                <Input type="datetime-local" value={inspectedAt} onChange={(e) => setInspectedAt(e.target.value)} />
              </div>

              {/* Work order lookup */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label>Work Order</Label>
                <Input
                  value={woQuery}
                  onChange={(e) => setWoQuery(e.target.value)}
                  placeholder="Search WO no / job no..."
                />
                {woOptions.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border bg-white p-1 text-sm">
                    {woOptions.map((wo) => (
                      <button
                        type="button"
                        key={wo.id}
                        onClick={() => pickWorkOrder(wo)}
                        className="flex w-full items-start justify-between rounded-md px-2 py-2 text-left hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {wo.work_order_no || wo.number || wo.code || `WO#${wo.id}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {wo.part_no ? `Part: ${wo.part_no}` : ""}{" "}
                            {wo.customer_name ? `• ${wo.customer_name}` : ""}
                          </div>
                        </div>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                )}
                {workOrderId ? (
                  <p className="text-xs text-gray-500">
                    Selected: <span className="font-semibold text-gray-900">{workOrderNo || workOrderId}</span>
                  </p>
                ) : null}
              </div>

              {/* Lot lookup */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label>Lot</Label>
                <Input value={lotQuery} onChange={(e) => setLotQuery(e.target.value)} placeholder="Search lot no..." />
                {lotOptions.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border bg-white p-1 text-sm">
                    {lotOptions.map((lot) => (
                      <button
                        type="button"
                        key={lot.id}
                        onClick={() => pickLot(lot)}
                        className="flex w-full items-start justify-between rounded-md px-2 py-2 text-left hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{lot.lot_no || lot.number || `LOT#${lot.id}`}</div>
                          <div className="text-xs text-gray-500">
                            {lot.part_no ? `Part: ${lot.part_no}` : ""}
                            {lot.qty ? ` • Qty: ${lot.qty}` : ""}
                          </div>
                        </div>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                )}
                {lotId ? (
                  <p className="text-xs text-gray-500">
                    Selected: <span className="font-semibold text-gray-900">{lotNo || lotId}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Part No</Label>
                <Input value={partNo} onChange={(e) => setPartNo(e.target.value)} placeholder="PCB Part No / PN" />
              </div>

              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
              </div>

              <div className="space-y-1.5">
                <Label>Inspector</Label>
                <Input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} placeholder="Inspector name" />
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
            </div>
          )}
        </Card>

        {/* Sample & disposition */}
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Sample Size</Label>
              <Input
                type="number"
                min={1}
                value={sampleSize}
                onChange={(e) => setSampleSize(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Accepted</Label>
              <Input
                type="number"
                min={0}
                value={acceptedQty}
                onChange={(e) => setAcceptedQty(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rejected</Label>
              <Input
                type="number"
                min={0}
                value={rejectedQty}
                onChange={(e) => setRejectedQty(Number(e.target.value))}
              />
              {acceptedQty + rejectedQty > sampleSize ? (
                <p className="mt-1 flex items-center gap-2 text-xs text-rose-600">
                  <AlertCircle className="h-4 w-4" />
                  Accepted + Rejected cannot exceed sample size
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Checkpoints */}
        <Card className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Checkpoints</h2>
              <p className="text-xs text-gray-500">Add pass/fail for each inspection checkpoint.</p>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={addCheckpoint}>
              <Plus className="h-4 w-4" />
              Add checkpoint
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {checkpoints.map((c, idx) => {
              const sMeta = STATUS_META[c.status] || STATUS_META.pending;
              return (
                <div key={idx} className="rounded-xl border bg-white p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label>Checkpoint</Label>
                        <Input
                          value={c.name}
                          onChange={(e) => updateCheckpoint(idx, { name: e.target.value })}
                          placeholder="e.g., Soldermask alignment"
                        />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label>Spec</Label>
                        <Input
                          value={c.spec}
                          onChange={(e) => updateCheckpoint(idx, { spec: e.target.value })}
                          placeholder="Spec / tolerance"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Method</Label>
                        <Input
                          value={c.method}
                          onChange={(e) => updateCheckpoint(idx, { method: e.target.value })}
                          placeholder="Visual / Mic / Gauge"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Result</Label>
                        <Input
                          value={c.result}
                          onChange={(e) => updateCheckpoint(idx, { result: e.target.value })}
                          placeholder="Measured / notes"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Status</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={c.status === "pass" ? "default" : "outline"}
                            className={cx("h-8", c.status === "pass" && "bg-emerald-600 hover:bg-emerald-700")}
                            onClick={() => updateCheckpoint(idx, { status: "pass" })}
                          >
                            Pass
                          </Button>
                          <Button
                            type="button"
                            variant={c.status === "fail" ? "default" : "outline"}
                            className={cx("h-8", c.status === "fail" && "bg-rose-600 hover:bg-rose-700")}
                            onClick={() => updateCheckpoint(idx, { status: "fail" })}
                          >
                            Fail
                          </Button>
                          <Button
                            type="button"
                            variant={c.status === "pending" ? "default" : "outline"}
                            className={cx("h-8", c.status === "pending" && "bg-slate-700 hover:bg-slate-800")}
                            onClick={() => updateCheckpoint(idx, { status: "pending" })}
                          >
                            Pending
                          </Button>
                        </div>
                        <div className="pt-1">
                          <Badge variant="outline" className={cx("border", sMeta.className)}>
                            {sMeta.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Defect Code</Label>
                        <Input
                          value={c.defect_code}
                          onChange={(e) => updateCheckpoint(idx, { defect_code: e.target.value })}
                          placeholder="e.g., SM-PINHOLE"
                        />
                      </div>

                      <div className="space-y-1.5 lg:col-span-2">
                        <Label>Remarks</Label>
                        <Input
                          value={c.remarks}
                          onChange={(e) => updateCheckpoint(idx, { remarks: e.target.value })}
                          placeholder="Optional remarks"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      className="gap-2"
                      onClick={() => removeCheckpoint(idx)}
                      disabled={checkpoints.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Defects */}
        <Card className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Defects Summary</h2>
              <p className="text-xs text-gray-500">Record aggregated defect counts (optional).</p>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={addDefect}>
              <Plus className="h-4 w-4" />
              Add defect
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {defects.map((d, idx) => (
              <div key={idx} className="rounded-xl border bg-white p-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Defect Code</Label>
                    <Input
                      value={d.defect_code}
                      onChange={(e) => updateDefect(idx, { defect_code: e.target.value })}
                      placeholder="e.g., OPEN, SHORT, SM-MISREG"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      value={d.qty}
                      onChange={(e) => updateDefect(idx, { qty: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remarks</Label>
                    <Input
                      value={d.remarks}
                      onChange={(e) => updateDefect(idx, { remarks: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => removeDefect(idx)}
                    disabled={defects.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Attachments */}
        <Card className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Attachments</h2>
              <p className="text-xs text-gray-500">Upload photos, microscope images, PDFs, etc.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="gap-2" asChild>
                <label className="cursor-pointer">
                  <FileUp className="h-4 w-4" />
                  Add files
                  <input type="file" className="hidden" multiple onChange={onPickFiles} />
                </label>
              </Button>
            </div>
          </div>

          {attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {attachments.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{f.name}</p>
                    <p className="text-xs text-gray-500">{Math.round(f.size / 1024)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => removeAttachment(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-gray-500">No files selected.</p>
          )}
        </Card>

        {/* Footer actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" asChild>
            <Link to="/quality/inspections">Cancel</Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button type="submit" className="gap-2 bg-cyan-600 hover:bg-cyan-500" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Note: Replace text inputs for IDs with your <code>Select</code> component once your master endpoints are finalized.
        </p>
      </form>
    </div>
  );
}
