// src/pages/quality/ncr/NCRCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
    AlertTriangle,
    ArrowLeft,
    ClipboardCheck,
    Loader2,
    Save,
    Search,
    ShieldCheck
} from "lucide-react";

/**
 * NCRCreate.jsx (PCB Manufacturing ERP)
 *
 * Creates a Non-Conformance Report (NCR) linked to Inspection / Work Order / Lot.
 *
 * Expected endpoints (adjust to your backend):
 * - POST /quality/ncr
 * - GET  /quality/defect-codes (optional)
 * - GET  /production/work-orders/search?q=... (optional)
 * - GET  /inventory/lots/search?q=... (optional)
 *
 * Suggested payload:
 * {
 *   ncr_no,                 // optional (backend may generate)
 *   source_type,            // "inspection" | "aoi" | "etest" | "incoming" | "process" | "customer"
 *   source_ref_id,          // inspection_id etc.
 *   work_order_id,
 *   lot_id,
 *   part_no,
 *   customer_name,
 *   stage,                  // "Incoming" | "Innerlayer" | "Lamination" | "Drilling" | "Plating" | "Soldermask" | "Legend" | "Surface Finish" | "E-Test" | "Final"
 *   severity,               // "minor" | "major" | "critical"
 *   disposition,            // "rework" | "scrap" | "use_as_is" | "return_to_supplier" | "sort_100" | "hold"
 *   defect_code,
 *   defect_description,
 *   qty_affected,
 *   detection_date,
 *   detected_by,
 *   containment_action,
 *   root_cause_hint,
 *   corrective_action_hint,
 *   preventive_action_hint,
 *   notes
 * }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STAGES = [
  "Incoming",
  "Innerlayer",
  "Lamination",
  "Drilling",
  "Desmear",
  "Plating",
  "Imaging/Etch",
  "Soldermask",
  "Legend",
  "Surface Finish",
  "AOI",
  "E-Test",
  "Final",
  "Packing",
];

const SEVERITIES = [
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];

const DISPOSITIONS = [
  { value: "hold", label: "Hold" },
  { value: "rework", label: "Rework" },
  { value: "scrap", label: "Scrap" },
  { value: "use_as_is", label: "Use As Is" },
  { value: "sort_100", label: "100% Sort" },
  { value: "return_to_supplier", label: "Return to Supplier" },
];

const SOURCES = [
  { value: "inspection", label: "Inspection" },
  { value: "aoi", label: "AOI" },
  { value: "etest", label: "E-Test" },
  { value: "incoming", label: "Incoming QC" },
  { value: "process", label: "In-Process" },
  { value: "customer", label: "Customer Return" },
];

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NCRCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // If user came from InspectionDetails "Raise NCR"
  const fromInspectionId = location?.state?.fromInspectionId ?? null;
  const prefillDefectCode = location?.state?.defect_code ?? "";

  const [saving, setSaving] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  // Minimal dependencies: keep everything controlled
  const [form, setForm] = useState({
    ncr_no: "",
    source_type: fromInspectionId ? "inspection" : "process",
    source_ref_id: fromInspectionId || "",
    stage: "Final",
    severity: "major",
    disposition: "hold",

    work_order_id: "",
    work_order_no: "",
    lot_id: "",
    lot_no: "",

    part_no: "",
    customer_name: "",

    defect_code: prefillDefectCode,
    defect_description: "",

    qty_affected: 0,
    detection_date: todayISO(),
    detected_by: "",

    containment_action: "",
    root_cause_hint: "",
    corrective_action_hint: "",
    preventive_action_hint: "",
    notes: "",
  });

  const [defectCodes, setDefectCodes] = useState([]);
  const [woSearch, setWoSearch] = useState("");
  const [woResults, setWoResults] = useState([]);
  const [woSearching, setWoSearching] = useState(false);

  const [lotSearch, setLotSearch] = useState("");
  const [lotResults, setLotResults] = useState([]);
  const [lotSearching, setLotSearching] = useState(false);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  // Optional: fetch defect code master
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/quality/defect-codes");
        const data = res?.data?.data ?? res?.data ?? [];
        setDefectCodes(Array.isArray(data) ? data : []);
      } catch (e) {
        // Not mandatory
        setDefectCodes([]);
      }
    })();
  }, []);

  // Prefill from inspection if we have id
  useEffect(() => {
    if (!fromInspectionId) return;

    (async () => {
      setLoadingPrefill(true);
      try {
        const res = await api.get(`/quality/inspections/${fromInspectionId}`);
        const ins = res?.data?.data ?? res?.data;

        setForm((p) => ({
          ...p,
          source_type: "inspection",
          source_ref_id: fromInspectionId,
          stage: ins?.stage || p.stage,
          work_order_id: ins?.work_order?.id || ins?.work_order_id || p.work_order_id,
          work_order_no: ins?.work_order?.work_order_no || ins?.work_order_no || p.work_order_no,
          lot_id: ins?.lot?.id || ins?.lot_id || p.lot_id,
          lot_no: ins?.lot?.lot_no || ins?.lot_no || p.lot_no,
          part_no: ins?.part_no || p.part_no,
          customer_name: ins?.customer_name || p.customer_name,
          qty_affected: Number(ins?.rejected_qty ?? p.qty_affected),
        }));
      } catch (err) {
        console.warn("Inspection prefill failed:", err);
        toast({
          title: "Could not prefill from Inspection",
          description: "You can still create NCR manually.",
          variant: "destructive",
        });
      } finally {
        setLoadingPrefill(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromInspectionId]);

  const selectedDefectLabel = useMemo(() => {
    if (!form.defect_code) return "";
    const hit = defectCodes.find((d) => d.code === form.defect_code || d.defect_code === form.defect_code);
    return hit?.name || hit?.description || "";
  }, [defectCodes, form.defect_code]);

  const searchWorkOrders = async () => {
    if (!woSearch.trim()) return setWoResults([]);
    setWoSearching(true);
    try {
      const res = await api.get(`/production/work-orders/search`, { params: { q: woSearch.trim() } });
      const data = res?.data?.data ?? res?.data ?? [];
      setWoResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setWoResults([]);
    } finally {
      setWoSearching(false);
    }
  };

  const searchLots = async () => {
    if (!lotSearch.trim()) return setLotResults([]);
    setLotSearching(true);
    try {
      const res = await api.get(`/inventory/lots/search`, { params: { q: lotSearch.trim() } });
      const data = res?.data?.data ?? res?.data ?? [];
      setLotResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setLotResults([]);
    } finally {
      setLotSearching(false);
    }
  };

  const validate = () => {
    if (!form.source_type) return "Select NCR source.";
    if (!form.stage) return "Select stage.";
    if (!form.severity) return "Select severity.";
    if (!form.disposition) return "Select disposition.";
    if (!form.defect_code && !form.defect_description) return "Add a defect code or defect description.";
    if (Number(form.qty_affected) < 0) return "Affected quantity cannot be negative.";
    return "";
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
      const payload = {
        ncr_no: form.ncr_no || undefined,
        source_type: form.source_type,
        source_ref_id: form.source_ref_id || undefined,
        stage: form.stage,
        severity: form.severity,
        disposition: form.disposition,

        work_order_id: form.work_order_id || undefined,
        lot_id: form.lot_id || undefined,

        part_no: form.part_no || undefined,
        customer_name: form.customer_name || undefined,

        defect_code: form.defect_code || undefined,
        defect_description: form.defect_description || undefined,

        qty_affected: Number(form.qty_affected || 0),
        detection_date: form.detection_date || undefined,
        detected_by: form.detected_by || undefined,

        containment_action: form.containment_action || undefined,
        root_cause_hint: form.root_cause_hint || undefined,
        corrective_action_hint: form.corrective_action_hint || undefined,
        preventive_action_hint: form.preventive_action_hint || undefined,
        notes: form.notes || undefined,
      };

      const res = await api.post("/quality/ncr", payload);
      const created = res?.data?.data ?? res?.data;

      toast({
        title: "NCR created",
        description: `NCR ${created?.ncr_no || created?.id || ""} saved successfully.`,
      });

      navigate(`/quality/ncr/${created?.id || ""}`.replace(/\/$/, ""), { replace: true });
    } catch (err) {
      console.warn("NCR create failed:", err);
      toast({
        title: "Create failed",
        description: err?.response?.data?.message || "Unable to create NCR.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create NCR</h1>
            <p className="text-sm text-gray-500">Non-Conformance Report for PCB manufacturing defects.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={() => navigate("/quality/ncr")}>
            <ClipboardCheck className="h-4 w-4" />
            NCR List
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top row */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>NCR No (optional)</Label>
              <Input
                value={form.ncr_no}
                onChange={(e) => setField("ncr_no", e.target.value)}
                placeholder="Auto if blank"
              />
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <select
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.source_type}
                onChange={(e) => setField("source_type", e.target.value)}
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {fromInspectionId ? (
                <p className="text-xs text-gray-500">Linked from Inspection ID: {fromInspectionId}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <select
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.stage}
                onChange={(e) => setField("stage", e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity / Disposition */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Severity</Label>
              <select
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.severity}
                onChange={(e) => setField("severity", e.target.value)}
              >
                {SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Disposition</Label>
              <select
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.disposition}
                onChange={(e) => setField("disposition", e.target.value)}
              >
                {DISPOSITIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Affected Qty</Label>
              <Input
                type="number"
                min="0"
                value={form.qty_affected}
                onChange={(e) => setField("qty_affected", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Work Order + Lot search */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Work Order</p>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {form.work_order_no || "Not linked"}
                </Badge>
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  value={woSearch}
                  onChange={(e) => setWoSearch(e.target.value)}
                  placeholder="Search work order (WO no / customer / part)"
                />
                <Button type="button" variant="outline" className="gap-2" onClick={searchWorkOrders} disabled={woSearching}>
                  {woSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>

              {woResults.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {woResults.slice(0, 5).map((wo) => (
                    <button
                      type="button"
                      key={wo.id}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-left hover:bg-gray-50"
                      onClick={() => {
                        setField("work_order_id", wo.id);
                        setField("work_order_no", wo.work_order_no || wo.number || `WO-${wo.id}`);
                        setField("customer_name", wo.customer_name || form.customer_name);
                        setField("part_no", wo.part_no || form.part_no);
                        toast({ title: "Work order linked", description: "Work order details applied." });
                        setWoResults([]);
                      }}
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {wo.work_order_no || wo.number || `WO-${wo.id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {wo.customer_name || "-"} • {wo.part_no || "-"}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Lot</p>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {form.lot_no || "Not linked"}
                </Badge>
              </div>

              <div className="mt-3 flex gap-2">
                <Input value={lotSearch} onChange={(e) => setLotSearch(e.target.value)} placeholder="Search lot (Lot No)" />
                <Button type="button" variant="outline" className="gap-2" onClick={searchLots} disabled={lotSearching}>
                  {lotSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>

              {lotResults.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {lotResults.slice(0, 5).map((lot) => (
                    <button
                      type="button"
                      key={lot.id}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-left hover:bg-gray-50"
                      onClick={() => {
                        setField("lot_id", lot.id);
                        setField("lot_no", lot.lot_no || lot.number || `LOT-${lot.id}`);
                        toast({ title: "Lot linked", description: "Lot selected." });
                        setLotResults([]);
                      }}
                    >
                      <p className="text-sm font-semibold text-gray-900">{lot.lot_no || lot.number || `LOT-${lot.id}`}</p>
                      <p className="text-xs text-gray-500">{lot.part_no || "-"} • Qty: {lot.qty ?? "-"}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Defect */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Defect Code</Label>
              <Input
                value={form.defect_code}
                onChange={(e) => setField("defect_code", e.target.value)}
                placeholder="e.g., OPEN, SHORT, SM_BUBBLE"
              />
              {selectedDefectLabel ? (
                <p className="text-xs text-gray-500">Master: {selectedDefectLabel}</p>
              ) : null}
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>Defect Description</Label>
              <Input
                value={form.defect_description}
                onChange={(e) => setField("defect_description", e.target.value)}
                placeholder="Describe the defect (location, layer, measurement, photo reference, etc.)"
              />
            </div>
          </div>

          {/* Detection info */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Detection Date</Label>
              <Input
                type="date"
                value={form.detection_date}
                onChange={(e) => setField("detection_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Detected By</Label>
              <Input
                value={form.detected_by}
                onChange={(e) => setField("detected_by", e.target.value)}
                placeholder="Inspector / Operator name"
              />
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setField("customer_name", e.target.value)}
                placeholder="Customer name"
              />
            </div>
          </div>

          {/* Actions fields */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Containment Action (Immediate)</Label>
              <Textarea
                value={form.containment_action}
                onChange={(e) => setField("containment_action", e.target.value)}
                placeholder="Hold affected lot, segregate WIP, stop line, add 100% inspection, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Any extra details, attachments, references, operator statements..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Root Cause (hint)</Label>
              <Textarea
                value={form.root_cause_hint}
                onChange={(e) => setField("root_cause_hint", e.target.value)}
                placeholder="Possible cause: drill wander, over-etch, under-cure, contamination..."
              />
            </div>

            <div className="space-y-2">
              <Label>Corrective Action (hint)</Label>
              <Textarea
                value={form.corrective_action_hint}
                onChange={(e) => setField("corrective_action_hint", e.target.value)}
                placeholder="Adjust process window, re-train operator, update CAM rule, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Preventive Action (hint)</Label>
              <Textarea
                value={form.preventive_action_hint}
                onChange={(e) => setField("preventive_action_hint", e.target.value)}
                placeholder="Add control plan check, poka-yoke, maintenance schedule, SPC monitoring..."
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              NCR is traceable to WO/Lot/Inspection for compliance & audits.
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/quality/ncr">Cancel</Link>
              </Button>

              <Button
                type="submit"
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                disabled={saving || loadingPrefill}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Create NCR"}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {loadingPrefill ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Prefilling from inspection...
        </div>
      ) : null}
    </div>
  );
}
