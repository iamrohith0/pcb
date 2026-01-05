// src/pages/maintenance/breakdowns/BreakdownCreate.jsx
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Factory,
  Hammer,
  Loader2,
  MapPin,
  Settings2,
  ShieldCheck,
  Tag,
  Wrench,
} from "lucide-react";

/**
 * PCBxpress - Breakdown Create
 * Path: src/pages/maintenance/breakdowns/BreakdownCreate.jsx
 *
 * Replace mock APIs with your backend:
 * - GET  /maintenance/equipment/options
 * - POST /maintenance/breakdowns
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// ---------------- Mock API ----------------
async function mockGetOptions() {
  await new Promise((r) => setTimeout(r, 400));
  return {
    plants: [
      { id: "pl_1", name: "Plant A - Main" },
      { id: "pl_2", name: "Plant B - Proto" },
    ],
    areas: [
      { id: "ar_cam", name: "CAM" },
      { id: "ar_drill", name: "Drilling" },
      { id: "ar_plating", name: "Plating" },
      { id: "ar_etch", name: "Etching" },
      { id: "ar_solder", name: "Solder Mask" },
      { id: "ar_silk", name: "Silkscreen" },
      { id: "ar_test", name: "E-Test" },
      { id: "ar_pack", name: "Packing" },
    ],
    lines: [
      { id: "ln_1", name: "Line 1" },
      { id: "ln_2", name: "Line 2" },
      { id: "ln_3", name: "Line 3" },
    ],
    equipment: [
      { id: "eq_101", code: "DRL-02", name: "CNC Drill Machine #2", area: "Drilling" },
      { id: "eq_205", code: "PLT-01", name: "Copper Plating Line", area: "Plating" },
      { id: "eq_310", code: "ETC-03", name: "Etching Conveyor #3", area: "Etching" },
      { id: "eq_420", code: "ETST-01", name: "Electrical Test Fixture", area: "E-Test" },
    ],
    priorities: [
      { id: "p1", name: "P1 - Critical" },
      { id: "p2", name: "P2 - High" },
      { id: "p3", name: "P3 - Medium" },
      { id: "p4", name: "P4 - Low" },
    ],
    categories: [
      "Mechanical",
      "Electrical",
      "Pneumatic",
      "Hydraulic",
      "Software/PLC",
      "Utilities",
      "Other",
    ],
    symptomTags: ["No Power", "Overheating", "Unusual Noise", "Alignment Issue", "Leak", "Sensor Fault"],
  };
}

async function mockCreateBreakdown(payload) {
  await new Promise((r) => setTimeout(r, 850));
  if (!payload?.equipmentId) throw new Error("Equipment required");
  return {
    id: `bd_${Math.floor(10000 + Math.random() * 90000)}`,
    ...payload,
    status: "Open",
    createdAt: new Date().toISOString(),
  };
}
// ------------------------------------------

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <Label className="text-sm">{label}</Label>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export default function BreakdownCreate() {
  const { toast } = useToast();

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [options, setOptions] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // form state
  const [plantId, setPlantId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [lineId, setLineId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");

  const [priorityId, setPriorityId] = useState("p2");
  const [category, setCategory] = useState("Mechanical");

  const [incidentAt, setIncidentAt] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  });

  const [reportedBy, setReportedBy] = useState("");
  const [shift, setShift] = useState("General");

  const [symptoms, setSymptoms] = useState("");
  const [tags, setTags] = useState([]);
  const [impact, setImpact] = useState("Line stopped");
  const [safetyRisk, setSafetyRisk] = useState(false);

  const [immediateAction, setImmediateAction] = useState("");
  const [notes, setNotes] = useState("");

  // Load options
  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      try {
        const data = await mockGetOptions();
        setOptions(data);

        // sensible defaults
        setPlantId(data.plants?.[0]?.id || "");
        setAreaId(data.areas?.[2]?.id || "");
        setLineId(data.lines?.[0]?.id || "");
      } catch (e) {
        console.error(e);
        toast({ title: "Failed to load", description: "Could not load equipment options.", variant: "destructive" });
      } finally {
        setLoadingOptions(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEquipment = useMemo(() => {
    const list = options?.equipment || [];
    if (!areaId) return list;
    const areaName = options?.areas?.find((a) => a.id === areaId)?.name;
    if (!areaName) return list;
    return list.filter((e) => String(e.area).toLowerCase() === String(areaName).toLowerCase());
  }, [options, areaId]);

  useEffect(() => {
    // reset equipment if it doesn't belong to selected area
    if (!equipmentId) return;
    if (!filteredEquipment.some((e) => e.id === equipmentId)) setEquipmentId("");
  }, [filteredEquipment, equipmentId]);

  const selectedEquipment = useMemo(() => {
    return (options?.equipment || []).find((e) => e.id === equipmentId) || null;
  }, [options, equipmentId]);

  const toggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const validate = () => {
    if (!plantId) return "Plant is required.";
    if (!areaId) return "Area is required.";
    if (!equipmentId) return "Equipment is required.";
    if (!symptoms.trim()) return "Symptoms/issue description is required.";
    if (!reportedBy.trim()) return "Reported by is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: "Missing details", description: err, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        plantId,
        areaId,
        lineId: lineId || null,
        equipmentId,
        priorityId,
        category,
        incidentAt,
        reportedBy,
        shift,
        symptoms,
        tags,
        impact,
        safetyRisk,
        immediateAction,
        notes,
      };

      const created = await mockCreateBreakdown(payload);

      toast({
        title: "Breakdown created",
        description: `Ticket ${created.id} opened for ${selectedEquipment?.code || "equipment"}.`,
      });

      // reset key fields (keep plant/area)
      setEquipmentId("");
      setSymptoms("");
      setTags([]);
      setImmediateAction("");
      setNotes("");
      setSafetyRisk(false);
      setImpact("Line stopped");
      setPriorityId("p2");
      setCategory("Mechanical");
    } catch (e2) {
      console.error(e2);
      toast({ title: "Create failed", description: e2?.message || "Could not create breakdown.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">Create Breakdown</h1>
            <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">Maintenance</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Log an equipment breakdown and trigger corrective actions (PCB manufacturing line).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <Factory className="mr-1 h-3.5 w-3.5" />
            PCBxpress ERP
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: core info */}
        <Card className="border-gray-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-gray-500" />
              Breakdown Details
            </CardTitle>
            <CardDescription>Plant/area/equipment mapping and issue description.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {loadingOptions ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading equipment options...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="Plant">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={plantId}
                      onChange={(e) => setPlantId(e.target.value)}
                    >
                      {(options?.plants || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Area / Process">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={areaId}
                      onChange={(e) => setAreaId(e.target.value)}
                    >
                      {(options?.areas || []).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Line (optional)">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                    >
                      <option value="">—</option>
                      {(options?.lines || []).map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Equipment" hint="Required">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={equipmentId}
                      onChange={(e) => setEquipmentId(e.target.value)}
                    >
                      <option value="">Select equipment…</option>
                      {filteredEquipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.code} — {eq.name}
                        </option>
                      ))}
                    </select>

                    {selectedEquipment && (
                      <div className="mt-2 rounded-lg border bg-gray-50 p-2 text-xs text-gray-700">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-white text-gray-700 hover:bg-white">{selectedEquipment.code}</Badge>
                          <span className="font-medium">{selectedEquipment.name}</span>
                          <span className="text-gray-500">• {selectedEquipment.area}</span>
                        </div>
                      </div>
                    )}
                  </Field>

                  <Field label="Incident Time" hint="When the breakdown started">
                    <div className="relative">
                      <CalendarClock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="datetime-local"
                        value={incidentAt}
                        onChange={(e) => setIncidentAt(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="Priority">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={priorityId}
                      onChange={(e) => setPriorityId(e.target.value)}
                    >
                      {(options?.priorities || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Category">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {(options?.categories || []).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Shift">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Shift A">Shift A</option>
                      <option value="Shift B">Shift B</option>
                      <option value="Shift C">Shift C</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Reported By" hint="Operator / Supervisor name">
                    <div className="relative">
                      <ClipboardList className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        value={reportedBy}
                        onChange={(e) => setReportedBy(e.target.value)}
                        placeholder="e.g., Irfan / Line Supervisor"
                        className="pl-9"
                      />
                    </div>
                  </Field>

                  <Field label="Impact">
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={impact}
                      onChange={(e) => setImpact(e.target.value)}
                    >
                      <option value="Line stopped">Line stopped</option>
                      <option value="Reduced throughput">Reduced throughput</option>
                      <option value="Quality risk">Quality risk</option>
                      <option value="Rework required">Rework required</option>
                      <option value="Minor / observation">Minor / observation</option>
                    </select>
                  </Field>
                </div>

                <Field label="Symptoms / Issue" hint="Required">
                  <Textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe the issue (what happened, alarms, visible symptoms, job/order context)."
                    rows={5}
                  />
                </Field>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Symptom Tags</Label>
                    <span className="text-xs text-gray-500">
                      <Tag className="inline h-3.5 w-3.5 -mt-0.5 mr-1" />
                      Quick classify
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(options?.symptomTags || []).map((t) => {
                      const active = tags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className={cx(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            active
                              ? "border-[#dc2551]/40 bg-[#dc2551]/10 text-[#dc2551]"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field label="Immediate Action Taken" hint="Optional">
                  <Textarea
                    value={immediateAction}
                    onChange={(e) => setImmediateAction(e.target.value)}
                    placeholder="e.g., stopped line, isolated power, informed maintenance, moved WIP to hold."
                    rows={3}
                  />
                </Field>

                <Field label="Notes" hint="Optional">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any extra context: job no, panel id, operator remarks, error codes."
                    rows={3}
                  />
                </Field>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: safety + actions */}
        <Card className="border-gray-100 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-gray-500" />
              Safety & Submit
            </CardTitle>
            <CardDescription>Ensure safe handling before maintenance starts.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Safety Check</p>

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={safetyRisk}
                      onChange={(e) => setSafetyRisk(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Safety risk involved (chemical/electrical/mechanical)
                  </label>

                  <p className="text-xs text-gray-500">
                    If enabled, the ticket should require supervisor approval and LOTO checklist.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold text-gray-700">What happens next</p>
              <ul className="mt-2 space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-500" />
                  Creates an “Open” breakdown ticket
                </li>
                <li className="flex items-start gap-2">
                  <Hammer className="mt-0.5 h-4 w-4 text-gray-500" />
                  Maintenance team assigns technician + ETA
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
                  WIP/Orders linked for traceability (optional)
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              disabled={submitting || loadingOptions}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "Creating..." : "Create Breakdown Ticket"}
            </Button>

            <div className="rounded-xl border border-dashed p-4 text-xs text-gray-500">
              Tip: After creation, add RCA, spare parts used, downtime, and PM linkage in the Breakdown Details page.
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
