// src/pages/quality/inspections/IncomingQC.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileSearch2,
  FlaskConical,
  Loader2,
  PackageSearch,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

/**
 * PCBxpress – Incoming QC (IQC)
 *
 * Suggested backend endpoints (adjust to your API):
 * - GET  /procurement/grn?status=pending_qc   (list of GRNs waiting QC)
 * - GET  /procurement/grn/:id                (GRN details with items)
 * - GET  /quality/iqc/templates              (optional inspection templates)
 * - POST /quality/iqc                         (create IQC record)
 *
 * Payload suggestion:
 * {
 *   grn_id,
 *   iqc_date,
 *   inspector_name,
 *   is_sampling,
 *   sampling_plan: { lot_size, sample_size, aql, method },
 *   remarks,
 *   results: [
 *     {
 *       grn_item_id?, item_id?, item_code?, item_name?,
 *       received_qty, sample_qty, accepted_qty, rejected_qty,
 *       disposition: "ACCEPT"|"REJECT"|"HOLD",
 *       defects: [{ code, name, qty, note }],
 *       measurements: [{ name, target, actual, unit, pass }],
 *       notes
 *     }
 *   ]
 * }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round((toNum(n, 0) + Number.EPSILON) * 100) / 100;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const DISPOSITIONS = [
  { key: "ACCEPT", label: "Accept", icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { key: "REJECT", label: "Reject", icon: XCircle, tone: "text-red-700 bg-red-50 border-red-200" },
  { key: "HOLD", label: "Hold", icon: ShieldCheck, tone: "text-amber-800 bg-amber-50 border-amber-200" },
];

export default function IncomingQC() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [grns, setGrns] = useState([]);
  const [grnSearch, setGrnSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);

  const [form, setForm] = useState({
    grn_id: "",
    iqc_date: todayISO(),
    inspector_name: "",
    is_sampling: true,
    sampling_plan: {
      lot_size: "",
      sample_size: "",
      aql: "1.0",
      method: "AQL",
    },
    remarks: "",
    results: [],
  });

  const selectedGRN = useMemo(() => {
    const id = String(form.grn_id || "");
    return grns.find((g) => String(g.id) === id) || null;
  }, [form.grn_id, grns]);

  const filteredGRNs = useMemo(() => {
    const q = grnSearch.trim().toLowerCase();
    return grns
      .filter((g) => {
        if (!q) return true;
        const hay = `${g.grn_no ?? ""} ${g.invoice_no ?? ""} ${g.supplier_name ?? ""} ${g.supplier?.name ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 25);
  }, [grns, grnSearch]);

  const overallSummary = useMemo(() => {
    const totals = form.results.reduce(
      (acc, r) => {
        acc.received += toNum(r.received_qty, 0);
        acc.sample += toNum(r.sample_qty, 0);
        acc.accepted += toNum(r.accepted_qty, 0);
        acc.rejected += toNum(r.rejected_qty, 0);
        return acc;
      },
      { received: 0, sample: 0, accepted: 0, rejected: 0 }
    );

    const dispositionCounts = form.results.reduce(
      (acc, r) => {
        const d = r.disposition || "HOLD";
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      },
      { ACCEPT: 0, REJECT: 0, HOLD: 0 }
    );

    return {
      totals: {
        received: round2(totals.received),
        sample: round2(totals.sample),
        accepted: round2(totals.accepted),
        rejected: round2(totals.rejected),
      },
      dispositionCounts,
    };
  }, [form.results]);

  // Load GRNs pending QC
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/procurement/grn?status=pending_qc");
        const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setGrns(list);
      } catch (e) {
        toast({
          title: "Failed to load GRNs",
          description: "Could not fetch GRNs pending QC. Check API and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function updateSampling(key, val) {
    setForm((p) => ({ ...p, sampling_plan: { ...p.sampling_plan, [key]: val } }));
  }

  async function selectGRN(grn) {
    try {
      setLoading(true);
      const res = await api.get(`/procurement/grn/${grn.id}`);
      const data = res.data?.data ?? res.data;

      const header = data?.grn ?? data?.header ?? data ?? grn;
      const items = data?.items ?? header?.items ?? [];

      const results = (Array.isArray(items) ? items : []).map((it) => {
        const received = toNum(it.accepted_qty ?? it.received_qty ?? it.qty ?? 0, 0);
        const sampleDefault = Math.min(received, Math.max(1, Math.ceil(received * 0.1))); // default 10% sampling

        return {
          // references
          grn_item_id: it.id ?? it.grn_item_id ?? null,
          item_id: it.item_id ?? it.item?.id ?? null,

          // display
          item_code: it.item?.code ?? it.item_code ?? "",
          item_name: it.item?.name ?? it.item_name ?? "",
          uom: it.uom ?? it.item?.uom ?? "Nos",
          batch_no: it.batch_no ?? "",
          lot_no: it.lot_no ?? "",

          // qty
          received_qty: received,
          sample_qty: sampleDefault,
          accepted_qty: sampleDefault,
          rejected_qty: 0,

          // disposition
          disposition: "ACCEPT",

          // optional qc details
          defects: [],
          measurements: [],
          notes: "",
        };
      });

      setForm((p) => ({
        ...p,
        grn_id: String(header?.id ?? grn.id),
        // try to infer lot size from GRN totals
        sampling_plan: {
          ...p.sampling_plan,
          lot_size: String(
            results.reduce((a, r) => a + toNum(r.received_qty, 0), 0) || ""
          ),
          sample_size: p.is_sampling
            ? String(results.reduce((a, r) => a + toNum(r.sample_qty, 0), 0) || "")
            : "",
        },
        results,
      }));

      setPickerOpen(false);

      toast({
        title: "GRN loaded",
        description: "Incoming items loaded for IQC. Update sampling and results, then submit.",
      });
    } catch (e) {
      toast({
        title: "Failed to load GRN details",
        description: "Please try another GRN or check API mapping.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function addDefect(lineIdx) {
    setForm((p) => ({
      ...p,
      results: p.results.map((r, i) =>
        i === lineIdx
          ? {
              ...r,
              defects: [
                ...(r.defects || []),
                { code: "", name: "", qty: 0, note: "" },
              ],
            }
          : r
      ),
    }));
  }

  function removeDefect(lineIdx, defectIdx) {
    setForm((p) => ({
      ...p,
      results: p.results.map((r, i) =>
        i === lineIdx
          ? { ...r, defects: (r.defects || []).filter((_, di) => di !== defectIdx) }
          : r
      ),
    }));
  }

  function updateDefect(lineIdx, defectIdx, key, val) {
    setForm((p) => ({
      ...p,
      results: p.results.map((r, i) => {
        if (i !== lineIdx) return r;
        const next = (r.defects || []).map((d, di) => (di === defectIdx ? { ...d, [key]: val } : d));
        return { ...r, defects: next };
      }),
    }));
  }

  function addMeasurement(lineIdx) {
    setForm((p) => ({
      ...p,
      results: p.results.map((r, i) =>
        i === lineIdx
          ? {
              ...r,
              measurements: [
                ...(r.measurements || []),
                { name: "", target: "", actual: "", unit: "", pass: true },
              ],
            }
          : r
      ),
    }));
  }

  function removeMeasurement(lineIdx, mIdx) {
    setForm((p) => ({
      ...p,
      results: p.results.map((r, i) =>
        i === lineIdx
          ? { ...r, measurements: (r.measurements || []).filter((_, mi) => mi !== mIdx) }
          : r
      ),
    }));
  }

  function updateMeasurement(lineIdx, mIdx, key, val) {
    setForm((p) => ({
      ...p,
      results: p.results.map((r, i) => {
        if (i !== lineIdx) return r;
        const next = (r.measurements || []).map((m, mi) => (mi === mIdx ? { ...m, [key]: val } : m));
        return { ...r, measurements: next };
      }),
    }));
  }

  function updateLine(lineIdx, key, val) {
    setForm((p) => ({
      ...p,
      results: p.results.map((r, i) => (i === lineIdx ? { ...r, [key]: val } : r)),
    }));
  }

  function syncAcceptReject(lineIdx, changedKey) {
    const r = form.results[lineIdx];
    const received = Math.max(0, toNum(r.received_qty, 0));
    const sample = Math.max(0, Math.min(received, toNum(r.sample_qty, 0)));

    let accepted = Math.max(0, toNum(r.accepted_qty, 0));
    let rejected = Math.max(0, toNum(r.rejected_qty, 0));

    if (changedKey === "sample_qty") {
      accepted = sample;
      rejected = 0;
    } else if (changedKey === "rejected_qty") {
      accepted = Math.max(0, sample - rejected);
    } else if (changedKey === "accepted_qty") {
      rejected = Math.max(0, sample - accepted);
    }

    // auto disposition
    const disp = rejected > 0 ? "HOLD" : "ACCEPT";

    setForm((p) => ({
      ...p,
      results: p.results.map((x, i) =>
        i === lineIdx
          ? {
              ...x,
              sample_qty: sample,
              accepted_qty: Math.min(sample, accepted),
              rejected_qty: Math.min(sample, rejected),
              disposition: x.disposition === "REJECT" ? "REJECT" : disp,
            }
          : x
      ),
    }));
  }

  function validate() {
    if (!form.grn_id) return "Select a GRN first.";
    if (!form.iqc_date) return "IQC date is required.";
    if (!String(form.inspector_name || "").trim()) return "Inspector name is required.";
    if (!Array.isArray(form.results) || form.results.length === 0) return "No items found for IQC.";

    if (form.is_sampling) {
      const lot = toNum(form.sampling_plan.lot_size, -1);
      const sample = toNum(form.sampling_plan.sample_size, -1);
      if (lot < 0) return "Sampling: Lot size is invalid.";
      if (sample < 0) return "Sampling: Sample size is invalid.";
    }

    for (let i = 0; i < form.results.length; i++) {
      const r = form.results[i];
      const received = toNum(r.received_qty, -1);
      const sample = toNum(r.sample_qty, -1);
      const accepted = toNum(r.accepted_qty, -1);
      const rejected = toNum(r.rejected_qty, -1);

      if (received < 0) return `Line ${i + 1}: received qty invalid.`;
      if (sample < 0) return `Line ${i + 1}: sample qty invalid.`;
      if (accepted < 0 || rejected < 0) return `Line ${i + 1}: accepted/rejected cannot be negative.`;
      if (round2(accepted + rejected) !== round2(sample)) return `Line ${i + 1}: accepted + rejected must equal sample.`;
      if (sample > received) return `Line ${i + 1}: sample cannot exceed received qty.`;
      if (!r.disposition) return `Line ${i + 1}: disposition required.`;
    }

    return null;
  }

  async function submitIQC() {
    const err = validate();
    if (err) {
      toast({ title: "Fix required", description: err, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        grn_id: String(form.grn_id),
        iqc_date: form.iqc_date,
        inspector_name: form.inspector_name,
        is_sampling: !!form.is_sampling,
        sampling_plan: form.is_sampling
          ? {
              lot_size: toNum(form.sampling_plan.lot_size, 0),
              sample_size: toNum(form.sampling_plan.sample_size, 0),
              aql: String(form.sampling_plan.aql || ""),
              method: String(form.sampling_plan.method || "AQL"),
            }
          : null,
        remarks: form.remarks || null,
        results: form.results.map((r) => ({
          grn_item_id: r.grn_item_id ?? null,
          item_id: r.item_id ?? null,
          item_code: r.item_code || null,
          item_name: r.item_name || null,
          uom: r.uom || null,
          batch_no: r.batch_no || null,
          lot_no: r.lot_no || null,
          received_qty: toNum(r.received_qty, 0),
          sample_qty: toNum(r.sample_qty, 0),
          accepted_qty: toNum(r.accepted_qty, 0),
          rejected_qty: toNum(r.rejected_qty, 0),
          disposition: r.disposition,
          defects: (r.defects || []).map((d) => ({
            code: d.code || null,
            name: d.name || null,
            qty: toNum(d.qty, 0),
            note: d.note || null,
          })),
          measurements: (r.measurements || []).map((m) => ({
            name: m.name || null,
            target: m.target || null,
            actual: m.actual || null,
            unit: m.unit || null,
            pass: !!m.pass,
          })),
          notes: r.notes || null,
        })),
      };

      const res = await api.post("/quality/iqc", payload);
      const created = res.data?.data ?? res.data;

      toast({
        title: "IQC submitted",
        description: "Incoming QC record saved successfully.",
      });

      const id = created?.id ?? created?.iqc_id ?? null;
      if (id) navigate(`/quality/inspections/incoming/${id}`, { replace: true });
      else navigate("/quality/inspections", { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to submit IQC. Please try again.";
      toast({ title: "Submit failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function requestClear() {
    setConfirmClear(true);
  }

  function clearForm() {
    setConfirmClear(false);
    setForm({
      grn_id: "",
      iqc_date: todayISO(),
      inspector_name: "",
      is_sampling: true,
      sampling_plan: { lot_size: "", sample_size: "", aql: "1.0", method: "AQL" },
      remarks: "",
      results: [],
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-[#dc2551]" />
            <h1 className="text-xl font-semibold text-gray-900">Incoming QC (IQC)</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Inspect incoming raw materials for PCB manufacturing (laminates, copper foil, solder mask, chemicals, drills).
            Record sampling, defects, measurements, and final disposition.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/quality/inspections">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" onClick={() => setPickerOpen(true)} className="gap-2">
            <PackageSearch className="h-4 w-4" />
            Select GRN
          </Button>

          <Button
            onClick={submitIQC}
            disabled={saving || loading}
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            Submit IQC
          </Button>
        </div>
      </div>

      {/* GRN / IQC Meta */}
      <Card className="border-gray-200">
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label>Selected GRN</Label>
              <Input
                value={form.grn_id}
                readOnly
                placeholder="Select a GRN…"
                onClick={() => setPickerOpen(true)}
                className="cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500">
                {selectedGRN
                  ? `GRN: ${selectedGRN.grn_no ?? selectedGRN.id} · Supplier: ${selectedGRN.supplier_name ?? selectedGRN.supplier?.name ?? "—"}`
                  : "Choose a GRN pending QC to load items."}
              </p>
            </div>

            <div className="md:col-span-4">
              <Label>IQC Date</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={form.iqc_date}
                  onChange={(e) => updateField("iqc_date", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <Label>Inspector Name</Label>
              <Input
                value={form.inspector_name}
                onChange={(e) => updateField("inspector_name", e.target.value)}
                placeholder="e.g., Arun / QC Team"
              />
            </div>

            <div className="md:col-span-12">
              <div className="flex flex-col gap-3 rounded-xl border bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <ShieldCheck className="h-4 w-4 text-gray-600" />
                  Sampling Inspection (AQL)
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Enable</span>
                  <Switch
                    checked={form.is_sampling}
                    onCheckedChange={(v) => updateField("is_sampling", !!v)}
                  />
                </div>
              </div>

              {form.is_sampling && (
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <Label>Lot Size</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={form.sampling_plan.lot_size}
                      onChange={(e) => updateSampling("lot_size", e.target.value)}
                      placeholder="Auto / Enter"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Sample Size</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={form.sampling_plan.sample_size}
                      onChange={(e) => updateSampling("sample_size", e.target.value)}
                      placeholder="Auto / Enter"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>AQL</Label>
                    <Input
                      value={form.sampling_plan.aql}
                      onChange={(e) => updateSampling("aql", e.target.value)}
                      placeholder="e.g., 1.0"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Method</Label>
                    <Input
                      value={form.sampling_plan.method}
                      onChange={(e) => updateSampling("method", e.target.value)}
                      placeholder="AQL / 100% / Custom"
                    />
                  </div>
                </div>
              )}
            </div>

            {form.grn_id ? (
              <div className="md:col-span-12 rounded-xl border bg-white p-3 text-sm text-gray-700">
                <span className="font-semibold">IQC Summary:</span>{" "}
                Received {overallSummary.totals.received} · Sample {overallSummary.totals.sample} · Accepted{" "}
                {overallSummary.totals.accepted} · Rejected {overallSummary.totals.rejected}{" "}
                <span className="ml-2 text-xs text-gray-500">
                  (Lines: Accept {overallSummary.dispositionCounts.ACCEPT}, Hold {overallSummary.dispositionCounts.HOLD}, Reject{" "}
                  {overallSummary.dispositionCounts.REJECT})
                </span>
                <button
                  type="button"
                  onClick={requestClear}
                  className="ml-2 text-xs font-semibold text-[#dc2551] hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : null}

            <div className="md:col-span-12">
              <Label>Remarks (optional)</Label>
              <Input
                value={form.remarks}
                onChange={(e) => updateField("remarks", e.target.value)}
                placeholder="Notes about packaging condition, COA provided, temperature control, etc."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Items Results */}
      <Card className="border-gray-200">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-[#dc2551]" />
            <div>
              <p className="text-base font-semibold text-gray-900">Inspection Lines</p>
              <p className="text-sm text-gray-600">Record sampling, defects, measurements, and final disposition per item.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPickerOpen(true)} className="gap-2">
              <FileSearch2 className="h-4 w-4" />
              Change GRN
            </Button>
          </div>
        </div>

        <div className="p-5">
          {form.results.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm font-medium text-gray-800">No GRN selected</p>
              <p className="mt-1 text-sm text-gray-600">Select a GRN pending QC to load items.</p>
              <div className="mt-4 flex justify-center">
                <Button onClick={() => setPickerOpen(true)} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
                  <PackageSearch className="h-4 w-4" />
                  Select GRN
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {form.results.map((r, idx) => {
                const disp = DISPOSITIONS.find((d) => d.key === r.disposition) || DISPOSITIONS[2];
                const DispIcon = disp.icon;

                return (
                  <div key={idx} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#dc2551]/10 px-2.5 py-1 text-xs font-semibold text-[#dc2551]">
                            Line {idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {r.item_name || r.item_code || "Item"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {r.item_code ? `(${r.item_code})` : ""} {r.uom ? `· ${r.uom}` : ""}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          {r.batch_no ? (
                            <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5">
                              <Tag className="h-3.5 w-3.5" /> Batch: {r.batch_no}
                            </span>
                          ) : null}
                          {r.lot_no ? (
                            <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5">
                              <Tag className="h-3.5 w-3.5" /> Lot: {r.lot_no}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5">
                            <Truck className="h-3.5 w-3.5" /> Received: {round2(r.received_qty)}
                          </span>
                        </div>
                      </div>

                      <div className={cx("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold", disp.tone)}>
                        <DispIcon className="h-4 w-4" />
                        <span>{disp.label}</span>
                      </div>
                    </div>

                    {/* Line controls */}
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-3">
                        <Label>Sample Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={r.sample_qty}
                          onChange={(e) => {
                            updateLine(idx, "sample_qty", e.target.value);
                          }}
                          onBlur={() => syncAcceptReject(idx, "sample_qty")}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {form.is_sampling ? "Based on sampling plan" : "Use 100% if sampling off"}
                        </p>
                      </div>

                      <div className="md:col-span-3">
                        <Label>Rejected Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={r.rejected_qty}
                          onChange={(e) => updateLine(idx, "rejected_qty", e.target.value)}
                          onBlur={() => syncAcceptReject(idx, "rejected_qty")}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label>Accepted Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={r.accepted_qty}
                          onChange={(e) => updateLine(idx, "accepted_qty", e.target.value)}
                          onBlur={() => syncAcceptReject(idx, "accepted_qty")}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label>Disposition</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {DISPOSITIONS.map((d) => (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => updateLine(idx, "disposition", d.key)}
                              className={cx(
                                "rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
                                r.disposition === d.key ? d.tone : "bg-white hover:bg-gray-50 text-gray-700"
                              )}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Use HOLD for re-test / supplier clarification.</p>
                      </div>

                      <div className="md:col-span-12">
                        <Label>Notes (optional)</Label>
                        <Input
                          value={r.notes}
                          onChange={(e) => updateLine(idx, "notes", e.target.value)}
                          placeholder="e.g., COA mismatch, edge damage, moisture suspicion, etc."
                        />
                      </div>
                    </div>

                    {/* Defects */}
                    <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <ClipboardCheck className="h-4 w-4 text-gray-600" />
                          Defects
                        </div>
                        <Button variant="outline" onClick={() => addDefect(idx)} className="gap-2">
                          <Tag className="h-4 w-4" />
                          Add Defect
                        </Button>
                      </div>

                      {(r.defects || []).length === 0 ? (
                        <p className="mt-2 text-sm text-gray-600">No defects recorded.</p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {(r.defects || []).map((d, di) => (
                            <div key={di} className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-12">
                              <div className="md:col-span-2">
                                <Label className="text-xs">Code</Label>
                                <Input
                                  value={d.code}
                                  onChange={(e) => updateDefect(idx, di, "code", e.target.value)}
                                  placeholder="e.g., DAMG"
                                />
                              </div>

                              <div className="md:col-span-5">
                                <Label className="text-xs">Defect</Label>
                                <Input
                                  value={d.name}
                                  onChange={(e) => updateDefect(idx, di, "name", e.target.value)}
                                  placeholder="e.g., Edge damage / Contamination"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <Label className="text-xs">Qty</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={d.qty}
                                  onChange={(e) => updateDefect(idx, di, "qty", e.target.value)}
                                />
                              </div>

                              <div className="md:col-span-2">
                                <Label className="text-xs">Note</Label>
                                <Input
                                  value={d.note}
                                  onChange={(e) => updateDefect(idx, di, "note", e.target.value)}
                                  placeholder="optional"
                                />
                              </div>

                              <div className="md:col-span-1 flex items-end">
                                <Button
                                  variant="outline"
                                  className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => removeDefect(idx, di)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Measurements */}
                    <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <ShieldCheck className="h-4 w-4 text-gray-600" />
                          Measurements
                        </div>
                        <Button variant="outline" onClick={() => addMeasurement(idx)} className="gap-2">
                          <Tag className="h-4 w-4" />
                          Add Measurement
                        </Button>
                      </div>

                      {(r.measurements || []).length === 0 ? (
                        <p className="mt-2 text-sm text-gray-600">No measurements recorded.</p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {(r.measurements || []).map((m, mi) => (
                            <div key={mi} className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-12">
                              <div className="md:col-span-3">
                                <Label className="text-xs">Name</Label>
                                <Input
                                  value={m.name}
                                  onChange={(e) => updateMeasurement(idx, mi, "name", e.target.value)}
                                  placeholder="e.g., Thickness / Tg / Viscosity"
                                />
                              </div>

                              <div className="md:col-span-3">
                                <Label className="text-xs">Target</Label>
                                <Input
                                  value={m.target}
                                  onChange={(e) => updateMeasurement(idx, mi, "target", e.target.value)}
                                  placeholder="e.g., 1.60 ± 0.10"
                                />
                              </div>

                              <div className="md:col-span-3">
                                <Label className="text-xs">Actual</Label>
                                <Input
                                  value={m.actual}
                                  onChange={(e) => updateMeasurement(idx, mi, "actual", e.target.value)}
                                  placeholder="e.g., 1.58"
                                />
                              </div>

                              <div className="md:col-span-1">
                                <Label className="text-xs">Unit</Label>
                                <Input
                                  value={m.unit}
                                  onChange={(e) => updateMeasurement(idx, mi, "unit", e.target.value)}
                                  placeholder="mm"
                                />
                              </div>

                              <div className="md:col-span-1 flex items-end">
                                <div className="flex w-full items-center justify-between rounded-lg border px-3 py-2">
                                  <span className="text-xs font-semibold text-gray-700">Pass</span>
                                  <Switch
                                    checked={!!m.pass}
                                    onCheckedChange={(v) => updateMeasurement(idx, mi, "pass", !!v)}
                                  />
                                </div>
                              </div>

                              <div className="md:col-span-1 flex items-end">
                                <Button
                                  variant="outline"
                                  className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => removeMeasurement(idx, mi)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* GRN Picker */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-3xl">
            <Card className="shadow-xl">
              <div className="border-b p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <PackageSearch className="h-5 w-5 text-[#dc2551]" />
                    <div>
                      <p className="text-base font-semibold text-gray-900">Select GRN for IQC</p>
                      <p className="text-sm text-gray-600">Pick a GRN with status “Pending QC”.</p>
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => setPickerOpen(false)}>
                    Close
                  </Button>
                </div>

                <div className="mt-4">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      value={grnSearch}
                      onChange={(e) => setGrnSearch(e.target.value)}
                      placeholder="Search by GRN no / supplier / invoice…"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-auto p-4">
                {filteredGRNs.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <p className="text-sm font-medium text-gray-800">No GRNs found</p>
                    <p className="mt-1 text-sm text-gray-600">
                      If you expect GRNs here, check that your API returns items with status <b>pending_qc</b>.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y rounded-xl border">
                    {filteredGRNs.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => selectGRN(g)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {g.grn_no ?? `GRN #${g.id}`}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600">
                            Supplier: {g.supplier_name ?? g.supplier?.name ?? "—"}
                            {g.invoice_no ? ` · Invoice: ${g.invoice_no}` : ""}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#dc2551]">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Clear confirmation */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear IQC form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected GRN and all inspection lines. You can select another GRN after clearing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearForm} className="bg-[#dc2551] hover:bg-[#b02045]" disabled={saving}>
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
