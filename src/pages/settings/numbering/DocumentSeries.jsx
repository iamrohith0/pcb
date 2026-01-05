// src/pages/settings/numbering/DocumentSeries.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  BookMarked,
  Calculator,
  Copy,
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DOC_TYPES = [
  // Sales
  { key: "RFQ", label: "RFQ", hint: "Customer RFQ number series" },
  { key: "QUOTATION", label: "Quotation", hint: "Sales quotation / offer series" },
  { key: "SALES_ORDER", label: "Sales Order", hint: "Confirmed order series" },
  { key: "INVOICE", label: "Invoice", hint: "Sales invoice series" },
  { key: "CREDIT_NOTE", label: "Credit Note", hint: "Returns / adjustments series" },

  // Engineering
  { key: "JOB", label: "Job / Work Package", hint: "Engineering job number series" },
  { key: "DFM_REPORT", label: "DFM Report", hint: "DFM report series" },
  { key: "ECO", label: "ECO / Revision", hint: "Engineering change & revisions series" },

  // Production
  { key: "WORK_ORDER", label: "Work Order", hint: "Manufacturing WO series" },
  { key: "ROUTING", label: "Routing", hint: "Process routing series" },

  // Procurement / Inventory
  { key: "PURCHASE_ORDER", label: "Purchase Order", hint: "Supplier PO series" },
  { key: "GRN", label: "GRN", hint: "Goods receipt number series" },
  { key: "MATERIAL_ISSUE", label: "Material Issue", hint: "Issue / pick series" },

  // Quality
  { key: "INSPECTION", label: "Inspection", hint: "Incoming/In-process/Final inspection series" },
  { key: "NCR", label: "NCR", hint: "Non-conformance report series" },
  { key: "CAPA", label: "CAPA", hint: "Corrective & Preventive Action series" },
  { key: "COC", label: "Certificate of Conformance", hint: "Customer CoC / CoA series" },
];

const RESET_RULES = [
  { key: "NONE", label: "Never reset" },
  { key: "YEARLY", label: "Reset every year" },
  { key: "MONTHLY", label: "Reset every month" },
  { key: "DAILY", label: "Reset every day" },
];

const DEFAULT_ROWS = DOC_TYPES.map((d) => ({
  doc_type: d.key,
  enabled: true,
  prefix: d.key === "WORK_ORDER" ? "WO" : d.key === "SALES_ORDER" ? "SO" : d.key === "QUOTATION" ? "QTN" : d.key,
  suffix: "",
  padding: 5,
  start_from: 1,
  next_number: 1,
  reset_rule: "YEARLY",
  include_plant_code: false,
  include_fy: true,
  include_month: false,
  include_day: false,
  separator: "-",
  sample: "",
}));

function fyString(date = new Date()) {
  // India FY: Apr-Mar
  const m = date.getMonth(); // 0-11
  const y = date.getFullYear();
  const start = m >= 3 ? y : y - 1;
  const end = start + 1;
  return `${String(start).slice(-2)}${String(end).slice(-2)}`; // "2526"
}

function padNum(n, p) {
  const s = String(Math.max(0, Number(n) || 0));
  return s.padStart(Math.max(1, Number(p) || 1), "0");
}

function buildSample(row, plantCode = "PLT") {
  const sep = row.separator ?? "-";
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const parts = [];
  if (row.include_plant_code) parts.push(plantCode);
  if (row.prefix) parts.push(row.prefix);

  if (row.include_fy) parts.push(`FY${fyString(now)}`);
  if (row.include_month) parts.push(mm);
  if (row.include_day) parts.push(dd);

  parts.push(padNum(row.next_number ?? row.start_from ?? 1, row.padding ?? 5));

  if (row.suffix) parts.push(row.suffix);

  return parts.filter(Boolean).join(sep);
}

function safeCopy(text, toast) {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => toast({ title: "Copied", description: "Sample number copied to clipboard." }))
    .catch(() => toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" }));
}

function docMeta(docType) {
  return DOC_TYPES.find((d) => d.key === docType);
}

export default function DocumentSeries() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantCode, setPlantCode] = useState("PLT"); // used for samples only

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null); // doc_type

  const recomputeSamples = (list, code = plantCode) =>
    list.map((r) => ({ ...r, sample: buildSample(r, code) }));

  const fetchSeries = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /settings/numbering/document-series
      // -> { data: { plant_code, series: [...] } }
      const res = await api.get("/settings/numbering/document-series");
      const data = res?.data?.data ?? res?.data ?? {};
      const fromApi = Array.isArray(data.series) ? data.series : [];

      // Merge defaults with API (so new doc types appear automatically)
      const merged = DEFAULT_ROWS.map((d) => {
        const found = fromApi.find((x) => x.doc_type === d.doc_type);
        return { ...d, ...(found || {}) };
      });

      setPlantCode(data.plant_code || "PLT");
      setRows(recomputeSamples(merged, data.plant_code || "PLT"));
    } catch (err) {
      console.warn("Document series fetch failed:", err);
      toast({
        title: "Failed to load numbering",
        description: err?.response?.data?.message || "Using defaults for now.",
        variant: "destructive",
      });
      setRows(recomputeSamples(DEFAULT_ROWS));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const groups = {
      Sales: ["RFQ", "QUOTATION", "SALES_ORDER", "INVOICE", "CREDIT_NOTE"],
      Engineering: ["JOB", "DFM_REPORT", "ECO"],
      Production: ["WORK_ORDER", "ROUTING"],
      "Procurement & Inventory": ["PURCHASE_ORDER", "GRN", "MATERIAL_ISSUE"],
      Quality: ["INSPECTION", "NCR", "CAPA", "COC"],
    };

    const map = new Map(rows.map((r) => [r.doc_type, r]));
    return Object.entries(groups).map(([name, keys]) => ({
      name,
      items: keys.map((k) => map.get(k)).filter(Boolean),
    }));
  }, [rows]);

  const updateRow = (doc_type, patch) => {
    setRows((prev) =>
      recomputeSamples(
        prev.map((r) => (r.doc_type === doc_type ? { ...r, ...patch } : r))
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // PUT /settings/numbering/document-series
      // body: { plant_code, series: rows }
      await api.put("/settings/numbering/document-series", {
        plant_code: plantCode,
        series: rows.map(({ sample, ...rest }) => rest),
      });
      toast({ title: "Saved", description: "Document series updated." });
      await fetchSeries();
    } catch (err) {
      console.warn("Document series save failed:", err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const requestReset = (doc_type) => {
    setResetTarget(doc_type);
    setResetConfirmOpen(true);
  };

  const confirmReset = () => {
    if (!resetTarget) return;
    const row = rows.find((r) => r.doc_type === resetTarget);
    if (!row) return;

    updateRow(resetTarget, {
      next_number: Number(row.start_from || 1),
    });

    setResetConfirmOpen(false);
    setResetTarget(null);

    toast({ title: "Reset applied", description: "Next number reset. Click Save to persist." });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading document series...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Document Series</h1>
            <p className="text-sm text-gray-500">
              Configure numbering formats across Sales, Engineering, Production, Quality, Inventory and Procurement.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchSeries} disabled={saving}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Plant code (for samples + optionally persisted) */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-gray-600" />
              Sample generation settings
            </p>
            <p className="text-xs text-gray-500">
              Plant code is used in samples when “Include Plant Code” is enabled.
            </p>
          </div>

          <div className="w-full md:w-[320px] space-y-2">
            <Label>Plant code</Label>
            <Input
              value={plantCode}
              onChange={(e) => {
                const v = (e.target.value || "").toUpperCase().replace(/\s+/g, "");
                setPlantCode(v);
                setRows((prev) => recomputeSamples(prev, v));
              }}
              placeholder="PLT"
              maxLength={10}
            />
          </div>
        </div>
      </Card>

      {/* Groups */}
      {grouped.map((g) => (
        <Card key={g.name} className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">{g.name}</h2>
            <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
              {g.items.filter((x) => x.enabled).length}/{g.items.length} enabled
            </Badge>
          </div>

          <div className="mt-4 space-y-4">
            {g.items.map((row) => (
              <div key={row.doc_type} className="rounded-xl border bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100 text-gray-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{docMeta(row.doc_type)?.label || row.doc_type}</p>
                        <p className="text-xs text-gray-500">{docMeta(row.doc_type)?.hint || "Document numbering"}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                        Type: {row.doc_type}
                      </Badge>
                      <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                        Reset: {RESET_RULES.find((x) => x.key === row.reset_rule)?.label || row.reset_rule}
                      </Badge>
                      <Badge variant="outline" className="border-gray-200 bg-white text-gray-700 flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        Next: {row.next_number}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
                      <span className="text-xs font-semibold text-gray-700">Enabled</span>
                      <Switch
                        checked={!!row.enabled}
                        onCheckedChange={(v) => updateRow(row.doc_type, { enabled: v })}
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => safeCopy(row.sample, toast)}
                      disabled={!row.sample}
                      title="Copy sample"
                    >
                      <Copy className="h-4 w-4" />
                      Copy sample
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => requestReset(row.doc_type)}
                      title="Reset next number to Start From"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Config */}
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Prefix</Label>
                    <Input
                      value={row.prefix ?? ""}
                      onChange={(e) => updateRow(row.doc_type, { prefix: e.target.value })}
                      placeholder="WO"
                      disabled={!row.enabled}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>Suffix</Label>
                    <Input
                      value={row.suffix ?? ""}
                      onChange={(e) => updateRow(row.doc_type, { suffix: e.target.value })}
                      placeholder=""
                      disabled={!row.enabled}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>Separator</Label>
                    <Input
                      value={row.separator ?? "-"}
                      onChange={(e) => updateRow(row.doc_type, { separator: e.target.value })}
                      placeholder="-"
                      maxLength={3}
                      disabled={!row.enabled}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>Padding</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={row.padding ?? 5}
                      onChange={(e) => updateRow(row.doc_type, { padding: Number(e.target.value || 0) })}
                      disabled={!row.enabled}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>Start from</Label>
                    <Input
                      type="number"
                      min={0}
                      value={row.start_from ?? 1}
                      onChange={(e) => updateRow(row.doc_type, { start_from: Number(e.target.value || 0) })}
                      disabled={!row.enabled}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>Next number</Label>
                    <Input
                      type="number"
                      min={0}
                      value={row.next_number ?? 1}
                      onChange={(e) => updateRow(row.doc_type, { next_number: Number(e.target.value || 0) })}
                      disabled={!row.enabled}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-4">
                    <Label>Reset rule</Label>
                    <Select
                      value={row.reset_rule ?? "YEARLY"}
                      onValueChange={(v) => updateRow(row.doc_type, { reset_rule: v })}
                      disabled={!row.enabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reset rule" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESET_RULES.map((r) => (
                          <SelectItem key={r.key} value={r.key}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 lg:col-span-8">
                    <Label>Include tokens</Label>
                    <div className="grid grid-cols-1 gap-2 rounded-xl border bg-gray-50 p-3 sm:grid-cols-2 md:grid-cols-4">
                      <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">Plant</span>
                        <Switch
                          checked={!!row.include_plant_code}
                          onCheckedChange={(v) => updateRow(row.doc_type, { include_plant_code: v })}
                          disabled={!row.enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">FY</span>
                        <Switch
                          checked={!!row.include_fy}
                          onCheckedChange={(v) => updateRow(row.doc_type, { include_fy: v })}
                          disabled={!row.enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">Month</span>
                        <Switch
                          checked={!!row.include_month}
                          onCheckedChange={(v) => updateRow(row.doc_type, { include_month: v })}
                          disabled={!row.enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">Day</span>
                        <Switch
                          checked={!!row.include_day}
                          onCheckedChange={(v) => updateRow(row.doc_type, { include_day: v })}
                          disabled={!row.enabled}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 lg:col-span-12">
                    <Label>Sample output</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{row.sample}</p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Calculator className="h-3.5 w-3.5" />
                          Preview uses current date + “Next number”
                        </p>
                      </div>
                      <Button variant="outline" className="gap-2" onClick={() => safeCopy(row.sample, toast)}>
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Reset confirm */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset next number?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set <span className="font-semibold">{resetTarget}</span> series next number back to its “Start from” value.
              Click <span className="font-semibold">Save</span> to persist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-700" onClick={confirmReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
