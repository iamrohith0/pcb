// src/pages/settings/numbering/LotNumbering.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Hash,
  Save,
  RefreshCcw,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Factory,
  Copy,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import lotNumberingApi from "@/services/lotNumbering.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Badge({ variant = "neutral", children }) {
  const styles = {
    neutral: "bg-gray-100 text-gray-700 ring-gray-200",
    good: "bg-green-50 text-green-700 ring-green-200",
    bad: "bg-red-50 text-red-700 ring-red-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    brand: "bg-[#dc2551]/10 text-[#dc2551] ring-[#dc2551]/20",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", styles[variant])}>
      {children}
    </span>
  );
}

function HelpText({ children }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

/**
 * Token rules (example):
 *  - {PLANT} : Plant short code (e.g., "PCB")
 *  - {YY}    : Year (2-digit)
 *  - {YYYY}  : Year (4-digit)
 *  - {MM}    : Month (01-12)
 *  - {DD}    : Day (01-31)
 *  - {SEQ}   : Sequence number padded by seq_pad (e.g., 0001)
 *
 * Example format: LOT-{PLANT}-{YY}{MM}-{SEQ}
 * Example output: LOT-PCB-2601-0007
 */

const DEFAULTS = {
  enabled: true,
  plant_code: "PCB",
  prefix: "LOT",
  format: "{PREFIX}-{PLANT}-{YY}{MM}-{SEQ}",
  separator: "-",
  seq_start: 1,
  seq_pad: 4,
  reset: "monthly", // none | daily | monthly | yearly
  include_day: false,
  sample: "",
};

export default function LotNumbering() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(DEFAULTS);

  const tokens = useMemo(
    () => [
      { token: "{PREFIX}", label: "Prefix" },
      { token: "{PLANT}", label: "Plant Code" },
      { token: "{YY}", label: "Year (2)" },
      { token: "{YYYY}", label: "Year (4)" },
      { token: "{MM}", label: "Month" },
      { token: "{DD}", label: "Day" },
      { token: "{SEQ}", label: "Sequence" },
    ],
    []
  );

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const padSeq = (n, pad) => String(n).padStart(Math.max(1, pad || 1), "0");

  const buildSample = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const seq = padSeq(form.seq_start ?? 1, form.seq_pad ?? 4);
    const repl = {
      "{PREFIX}": form.prefix || "LOT",
      "{PLANT}": form.plant_code || "PCB",
      "{YY}": yy,
      "{YYYY}": yyyy,
      "{MM}": mm,
      "{DD}": dd,
      "{SEQ}": seq,
    };

    let fmt = form.format || "{PREFIX}-{PLANT}-{YY}{MM}-{SEQ}";

    // optional include_day behavior (only if token exists or not)
    if (!form.include_day && fmt.includes("{DD}")) {
      // if DD exists and include_day false, remove common patterns like -{DD} or {DD}
      fmt = fmt.replace(/-?\{DD\}/g, "");
    }

    const out = Object.keys(repl).reduce((acc, k) => acc.split(k).join(repl[k]), fmt);

    // sanitize: collapse double separators
    return out
      .replace(/--+/g, "-")
      .replace(/__+/g, "_")
      .replace(/\/{2,}/g, "/")
      .replace(/^-+|-+$/g, "")
      .trim();
  };

  const sample = useMemo(() => buildSample(), [
    form.prefix,
    form.plant_code,
    form.format,
    form.seq_start,
    form.seq_pad,
    form.include_day,
  ]);

  const hasErrors = useMemo(() => {
    if (!form.enabled) return false;
    if (!form.prefix) return true;
    if (!form.plant_code) return true;
    if (!form.format) return true;
    if (!String(form.format).includes("{SEQ}")) return true;
    if (Number(form.seq_pad) < 1 || Number(form.seq_pad) > 10) return true;
    if (Number(form.seq_start) < 0) return true;
    return false;
  }, [form]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await lotNumberingApi.get();
      const data = res?.data || {};
      const cfg = data.lot_numbering ?? data;

      setForm((p) => ({
        ...p,
        enabled: Boolean(cfg.enabled ?? p.enabled),
        plant_code: cfg.plant_code ?? p.plant_code,
        prefix: cfg.prefix ?? p.prefix,
        format: cfg.format ?? p.format,
        separator: cfg.separator ?? p.separator,
        seq_start: Number(cfg.seq_start ?? p.seq_start),
        seq_pad: Number(cfg.seq_pad ?? p.seq_pad),
        reset: cfg.reset ?? p.reset,
        include_day: Boolean(cfg.include_day ?? p.include_day),
      }));
    } catch (err) {
      toast({
        title: "Failed to load Lot Numbering",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    if (hasErrors) {
      toast({
        title: "Fix validation errors",
        description: "Ensure Prefix, Plant Code, Format are set and Format contains {SEQ}.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        seq_start: Number(form.seq_start),
        seq_pad: Number(form.seq_pad),
      };
      await lotNumberingApi.update(payload);

      toast({
        title: "Saved",
        description: "Lot numbering settings updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please check values and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copySample = async () => {
    try {
      await navigator.clipboard.writeText(sample);
      toast({ title: "Copied", description: "Sample lot number copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Could not access clipboard.", variant: "destructive" });
    }
  };

  const insertToken = (token) => {
    const next = (form.format || "") + token;
    update("format", next);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Lot Numbering</h1>
            <Badge variant="brand">
              <Hash className="mr-1.5 h-4 w-4" />
              Numbering
            </Badge>
            {form.enabled ? (
              <Badge variant="good">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="warn">
                <AlertTriangle className="mr-1.5 h-4 w-4" />
                Disabled
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Configure how lots are generated for raw material, WIP, and finished goods traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={onSave}
            disabled={loading || saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Config */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-900">Format & Reset</div>
              <div className="text-xs text-gray-500">
                For PCB manufacturing, monthly reset is common to keep lot sequences compact while preserving time context.
              </div>
            </div>

            <button
              type="button"
              onClick={() => update("enabled", !form.enabled)}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                form.enabled
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}
              aria-label="Toggle Lot Numbering"
            >
              <Settings2 className="h-4 w-4" />
              {form.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plant_code">
                <span className="inline-flex items-center gap-2">
                  <Factory className="h-4 w-4 text-gray-500" />
                  Plant Code <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input
                id="plant_code"
                value={form.plant_code}
                onChange={(e) => update("plant_code", e.target.value.toUpperCase())}
                placeholder="PCB"
                disabled={loading}
              />
              <HelpText>Short code used in lot IDs (example: PCB, PXC, BLR).</HelpText>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">
                Prefix <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prefix"
                value={form.prefix}
                onChange={(e) => update("prefix", e.target.value.toUpperCase())}
                placeholder="LOT"
                disabled={loading}
              />
              <HelpText>Common prefixes: LOT, RM, WIP, FG (choose one standard).</HelpText>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="format">
                Format <span className="text-red-500">*</span>
              </Label>
              <Input
                id="format"
                value={form.format}
                onChange={(e) => update("format", e.target.value)}
                placeholder="{PREFIX}-{PLANT}-{YY}{MM}-{SEQ}"
                disabled={loading}
              />
              <HelpText>
                Must include <span className="font-semibold">{`{SEQ}`}</span>. Example:{" "}
                <span className="font-mono">LOT-PCB-2601-0007</span>
              </HelpText>

              {/* Token buttons */}
              <div className="mt-2 flex flex-wrap gap-2">
                {tokens.map((t) => (
                  <Button
                    key={t.token}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => insertToken(t.token)}
                    disabled={loading}
                  >
                    {t.token} <span className="ml-2 text-xs text-gray-500">({t.label})</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seq_start">Sequence Start</Label>
              <Input
                id="seq_start"
                type="number"
                value={form.seq_start}
                onChange={(e) => update("seq_start", Number(e.target.value || 0))}
                disabled={loading}
                min={0}
              />
              <HelpText>First lot in a reset period (usually 1).</HelpText>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seq_pad">Sequence Padding</Label>
              <Input
                id="seq_pad"
                type="number"
                value={form.seq_pad}
                onChange={(e) => update("seq_pad", Number(e.target.value || 0))}
                disabled={loading}
                min={1}
                max={10}
              />
              <HelpText>Recommended: 4 (0001…9999).</HelpText>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  Reset Policy
                </span>
              </Label>
              <select
                id="reset"
                value={form.reset}
                onChange={(e) => update("reset", e.target.value)}
                disabled={loading}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="none">No Reset (continuous)</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <HelpText>Monthly is common for PCB lots (stable + readable).</HelpText>
            </div>

            <div className="space-y-2">
              <Label htmlFor="include_day">Include Day Token</Label>
              <select
                id="include_day"
                value={form.include_day ? "yes" : "no"}
                onChange={(e) => update("include_day", e.target.value === "yes")}
                disabled={loading}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="no">No (omit {`{DD}`})</option>
                <option value="yes">Yes (use {`{DD}`})</option>
              </select>
              <HelpText>Keep OFF unless you need day-level lot grouping.</HelpText>
            </div>
          </div>

          {form.enabled && hasErrors ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-semibold">Validation issues</div>
                  <div className="text-xs text-amber-900/80">
                    Ensure required fields are set, {`{SEQ}`} exists in the format, and padding is between 1 and 10.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Preview */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Preview</div>
                <div className="mt-1 text-xs text-gray-500">Sample lot number based on current date/time.</div>
              </div>
              <Badge variant={hasErrors ? "warn" : "good"}>{hasErrors ? "Check" : "OK"}</Badge>
            </div>

            <div className="mt-4 rounded-xl border bg-white p-3">
              <div className="text-xs text-gray-500">Sample Output</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="truncate font-mono text-sm font-semibold text-gray-900">{sample}</div>
                <Button variant="outline" size="sm" className="gap-2" onClick={copySample}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              <div className="font-semibold text-gray-900">PCB Traceability Notes</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
                <li>Use lots for raw copper foil, prepreg, laminates, solder mask, and chemicals.</li>
                <li>Link lots to work orders and WIP steps (drill, plating, etch, solder mask, AOI, e-test).</li>
                <li>Keep format stable—changing it breaks long-term genealogy consistency.</li>
              </ul>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-gray-900">Recommended Formats</div>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <div className="font-semibold">Monthly (simple)</div>
                <div className="mt-1 font-mono text-xs text-gray-700">LOT-{"{PLANT}"}-{"{YY}{MM}"}-{"{SEQ}"}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="font-semibold">Plant + Year</div>
                <div className="mt-1 font-mono text-xs text-gray-700">{"{PLANT}"}-{"{YYYY}"}-LOT-{"{SEQ}"}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="font-semibold">Daily (strict)</div>
                <div className="mt-1 font-mono text-xs text-gray-700">LOT-{"{PLANT}"}-{"{YY}{MM}{DD}"}-{"{SEQ}"}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-xs text-gray-500"
      >
        Tip: In PCB factories, lots usually reset monthly and are tied to incoming material batches + WIP steps for full genealogy.
      </motion.div>
    </div>
  );
}
