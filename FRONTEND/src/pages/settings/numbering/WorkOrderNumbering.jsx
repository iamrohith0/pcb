// src/pages/settings/numbering/WorkOrderNumbering.jsx
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
    ClipboardSignature,
    Copy,
    Hash,
    Loader2,
    RefreshCw,
    Save,
    Settings2,
    Trash2,
    Wand2,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const RESET_RULES = [
  { key: "NONE", label: "Never reset" },
  { key: "YEARLY", label: "Reset every year" },
  { key: "MONTHLY", label: "Reset every month" },
  { key: "DAILY", label: "Reset every day" },
];

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

  // WO often needs a quick visual of plant + FY + sequence
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
    .then(() => toast({ title: "Copied", description: "Work order number copied to clipboard." }))
    .catch(() => toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" }));
}

const DEFAULT_WO = {
  doc_type: "WORK_ORDER",
  enabled: true,

  prefix: "WO",
  suffix: "",

  separator: "-",
  padding: 5,

  start_from: 1,
  next_number: 1,

  reset_rule: "YEARLY",

  include_plant_code: true,
  include_fy: true,
  include_month: false,
  include_day: false,

  sample: "",
};

export default function WorkOrderNumbering() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [plantCode, setPlantCode] = useState("PLT");
  const [row, setRow] = useState(DEFAULT_WO);

  const [resetOpen, setResetOpen] = useState(false);

  const sample = useMemo(() => buildSample(row, plantCode), [row, plantCode]);

  const load = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /settings/numbering/work-order
      // -> { data: { plant_code, series: { ... } } }
      //
      // If your backend already uses the generic endpoint:
      // GET /settings/numbering/document-series
      // then we will also support that fallback.
      let data = null;

      try {
        const res = await api.get("/settings/numbering/work-order");
        data = res?.data?.data ?? res?.data ?? null;
      } catch (e) {
        // Fallback to the generic series endpoint
        const res2 = await api.get("/settings/numbering/document-series");
        const d2 = res2?.data?.data ?? res2?.data ?? {};
        const series = Array.isArray(d2.series) ? d2.series : [];
        const found = series.find((x) => x.doc_type === "WORK_ORDER");
        data = { plant_code: d2.plant_code, series: found };
      }

      const plant = data?.plant_code || "PLT";
      const series = data?.series || data?.work_order || null;

      const merged = { ...DEFAULT_WO, ...(series || {}) };
      setPlantCode(plant);
      setRow(merged);
    } catch (err) {
      console.warn("Work order numbering load failed:", err);
      toast({
        title: "Failed to load",
        description: err?.response?.data?.message || "Using default Work Order numbering.",
        variant: "destructive",
      });
      setRow(DEFAULT_WO);
      setPlantCode("PLT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (p) => setRow((prev) => ({ ...prev, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      // Preferred:
      // PUT /settings/numbering/work-order  { plant_code, series: { ... } }
      //
      // Fallback:
      // PUT /settings/numbering/document-series  { plant_code, series: [ ... ] }
      const payload = {
        plant_code: plantCode,
        series: { ...row },
      };
      delete payload.series.sample;

      try {
        await api.put("/settings/numbering/work-order", payload);
      } catch (e) {
        // Fallback to generic endpoint
        await api.put("/settings/numbering/document-series", {
          plant_code: plantCode,
          series: [{ ...payload.series, doc_type: "WORK_ORDER" }],
        });
      }

      toast({ title: "Saved", description: "Work order numbering updated." });
      await load();
    } catch (err) {
      console.warn("Work order numbering save failed:", err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    if (preset === "classic") {
      patch({
        enabled: true,
        prefix: "WO",
        suffix: "",
        separator: "-",
        padding: 5,
        reset_rule: "YEARLY",
        include_plant_code: true,
        include_fy: true,
        include_month: false,
        include_day: false,
      });
    }
    if (preset === "monthly") {
      patch({
        enabled: true,
        prefix: "WO",
        suffix: "",
        separator: "-",
        padding: 4,
        reset_rule: "MONTHLY",
        include_plant_code: true,
        include_fy: true,
        include_month: true,
        include_day: false,
      });
    }
    if (preset === "daily") {
      patch({
        enabled: true,
        prefix: "WO",
        suffix: "",
        separator: "-",
        padding: 3,
        reset_rule: "DAILY",
        include_plant_code: true,
        include_fy: true,
        include_month: true,
        include_day: true,
      });
    }
    toast({ title: "Preset applied", description: "Click Save to persist." });
  };

  const confirmReset = () => {
    patch({ next_number: Number(row.start_from || 1) });
    setResetOpen(false);
    toast({ title: "Reset applied", description: "Next number reset. Click Save to persist." });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Work Order numbering...
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
            <ClipboardSignature className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Work Order Numbering</h1>
            <p className="text-sm text-gray-500">
              Configure the WO format used across Production, WIP, and dispatch documents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={saving}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={save}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Plant code */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-gray-600" />
              Sample settings
            </p>
            <p className="text-xs text-gray-500">
              Used only for the preview. Your backend may also store this as company/plant setting.
            </p>
          </div>

          <div className="w-full md:w-[320px] space-y-2">
            <Label>Plant code</Label>
            <Input
              value={plantCode}
              onChange={(e) => setPlantCode((e.target.value || "").toUpperCase().replace(/\s+/g, ""))}
              placeholder="PLT"
              maxLength={10}
            />
          </div>
        </div>
      </Card>

      {/* Main config */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Series configuration</h2>
              <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                Doc type: WORK_ORDER
              </Badge>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Keep the WO format readable on shop-floor labels, travelers, panels, and cartons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <span className="text-xs font-semibold text-gray-700">Enabled</span>
              <Switch checked={!!row.enabled} onCheckedChange={(v) => patch({ enabled: v })} />
            </div>

            <Button variant="outline" className="gap-2" onClick={() => safeCopy(sample, toast)} disabled={!sample}>
              <Copy className="h-4 w-4" />
              Copy sample
            </Button>

            <Button
              variant="outline"
              className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={() => setResetOpen(true)}
              title="Reset next number to Start From"
            >
              <Trash2 className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <button
            type="button"
            className={cx(
              "rounded-xl border bg-white p-3 text-left transition hover:bg-gray-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            )}
            onClick={() => applyPreset("classic")}
          >
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-gray-600" />
              Classic (recommended)
            </p>
            <p className="mt-1 text-xs text-gray-500">PLT-WO-FY2526-00001</p>
          </button>

          <button
            type="button"
            className={cx(
              "rounded-xl border bg-white p-3 text-left transition hover:bg-gray-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            )}
            onClick={() => applyPreset("monthly")}
          >
            <p className="text-sm font-semibold text-gray-900">Monthly</p>
            <p className="mt-1 text-xs text-gray-500">PLT-WO-FY2526-01-0001</p>
          </button>

          <button
            type="button"
            className={cx(
              "rounded-xl border bg-white p-3 text-left transition hover:bg-gray-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            )}
            onClick={() => applyPreset("daily")}
          >
            <p className="text-sm font-semibold text-gray-900">Daily</p>
            <p className="mt-1 text-xs text-gray-500">PLT-WO-FY2526-01-06-001</p>
          </button>
        </div>

        {/* Fields */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-2">
            <Label>Prefix</Label>
            <Input
              value={row.prefix ?? ""}
              onChange={(e) => patch({ prefix: e.target.value })}
              placeholder="WO"
              disabled={!row.enabled}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Suffix</Label>
            <Input
              value={row.suffix ?? ""}
              onChange={(e) => patch({ suffix: e.target.value })}
              placeholder=""
              disabled={!row.enabled}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Separator</Label>
            <Input
              value={row.separator ?? "-"}
              onChange={(e) => patch({ separator: e.target.value })}
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
              onChange={(e) => patch({ padding: Number(e.target.value || 0) })}
              disabled={!row.enabled}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Start from</Label>
            <Input
              type="number"
              min={0}
              value={row.start_from ?? 1}
              onChange={(e) => patch({ start_from: Number(e.target.value || 0) })}
              disabled={!row.enabled}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Next number</Label>
            <Input
              type="number"
              min={0}
              value={row.next_number ?? 1}
              onChange={(e) => patch({ next_number: Number(e.target.value || 0) })}
              disabled={!row.enabled}
            />
          </div>

          <div className="space-y-2 lg:col-span-4">
            <Label>Reset rule</Label>
            <Select
              value={row.reset_rule ?? "YEARLY"}
              onValueChange={(v) => patch({ reset_rule: v })}
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
                  onCheckedChange={(v) => patch({ include_plant_code: v })}
                  disabled={!row.enabled}
                />
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                <span className="text-xs font-semibold text-gray-700">FY</span>
                <Switch
                  checked={!!row.include_fy}
                  onCheckedChange={(v) => patch({ include_fy: v })}
                  disabled={!row.enabled}
                />
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                <span className="text-xs font-semibold text-gray-700">Month</span>
                <Switch
                  checked={!!row.include_month}
                  onCheckedChange={(v) => patch({ include_month: v })}
                  disabled={!row.enabled}
                />
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                <span className="text-xs font-semibold text-gray-700">Day</span>
                <Switch
                  checked={!!row.include_day}
                  onCheckedChange={(v) => patch({ include_day: v })}
                  disabled={!row.enabled}
                />
              </div>
            </div>
          </div>

          {/* Sample */}
          <div className="space-y-2 lg:col-span-12">
            <Label>Sample output</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{sample}</p>
                <p className="mt-0.5 text-[11px] text-gray-500 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  Preview uses current date + “Next number”
                </p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => safeCopy(sample, toast)}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reset confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Work Order next number?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set next WO number back to <span className="font-semibold">{row.start_from ?? 1}</span>.
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
