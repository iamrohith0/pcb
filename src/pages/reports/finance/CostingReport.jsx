// src/pages/reports/finance/CostingReport.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
    Calculator,
    Calendar,
    Download,
    Factory,
    FileSearch2,
    Filter,
    Layers,
    Loader2,
    Package,
    RefreshCcw,
    SlidersHorizontal,
    Table2,
    TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function badgeTone(kind) {
  switch (kind) {
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "success":
      return "border-green-200 bg-green-50 text-green-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

/**
 * PCBxpress ERP — Costing Report
 * File: src/pages/reports/finance/CostingReport.jsx
 *
 * Goal:
 * - Provide job/WO/part costing visibility with material + process + overhead + quality costs.
 *
 * Suggested backend endpoints (adjust to your API):
 * - GET  /reports/costing/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=&customer=&part=&wo=&status=
 * - GET  /reports/costing/lines?from=&to=&...  (optional for detail)
 * - GET  /reports/costing/export?format=pdf|xlsx&from=&to=&...
 *
 * Data shapes supported:
 * - summary tiles: { revenue, total_cost, gross_margin, margin_pct, jobs_count, avg_cost_per_panel }
 * - rows: [{ wo_no, job_no, customer, part_no, layers, qty, revenue, mat_cost, proc_cost, oh_cost, quality_cost, total_cost, margin, margin_pct, status }]
 */

export default function CostingReport() {
  const { toast } = useToast();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const defaultTo = `${yyyy}-${mm}-${dd}`;
  const defaultFrom = `${yyyy}-${mm}-01`;

  // Filters
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [plant, setPlant] = useState("");
  const [customer, setCustomer] = useState("");
  const [part, setPart] = useState("");
  const [wo, setWo] = useState("");
  const [status, setStatus] = useState(""); // Open / Closed / Shipped etc.
  const [minMarginPct, setMinMarginPct] = useState(""); // number string
  const [showOnlyLoss, setShowOnlyLoss] = useState(false);

  // Data
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const query = useMemo(() => {
    return {
      from: dateFrom || null,
      to: dateTo || null,
      plant: plant?.trim() || null,
      customer: customer?.trim() || null,
      part: part?.trim() || null,
      wo: wo?.trim() || null,
      status: status?.trim() || null,
      min_margin_pct: minMarginPct !== "" ? Number(minMarginPct) : null,
      only_loss: showOnlyLoss ? 1 : 0,
    };
  }, [dateFrom, dateTo, plant, customer, part, wo, status, minMarginPct, showOnlyLoss]);

  const canRun = useMemo(() => {
    return Boolean(dateFrom && dateTo);
  }, [dateFrom, dateTo]);

  const run = async () => {
    if (!canRun) {
      toast({
        title: "Missing date range",
        description: "Select Date From and Date To.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary(null);
    setRows([]);

    try {
      const res = await api.get("/reports/costing", { params: query });
      const data = res?.data?.data ?? res?.data ?? {};

      setSummary(data?.summary ?? null);
      setRows(Array.isArray(data?.rows) ? data.rows : []);

      toast({
        title: "Costing report ready",
        description: `Loaded ${Array.isArray(data?.rows) ? data.rows.length : 0} rows.`,
      });
    } catch (err) {
      console.warn(err);
      toast({
        title: "Failed to load report",
        description: err?.response?.data?.message || "Report endpoint not available yet. Connect backend to proceed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format = "pdf") => {
    if (!canRun) {
      toast({
        title: "Missing date range",
        description: "Select Date From and Date To, then export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const res = await api.get("/reports/costing/export", {
        params: { ...query, format },
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type:
          format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `costing-report-${dateFrom}_to_${dateTo}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export started", description: `Downloading ${format.toUpperCase()}...` });
    } catch (err) {
      console.warn(err);
      toast({
        title: "Export unavailable",
        description: err?.response?.data?.message || "Export endpoint not available yet.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const derived = useMemo(() => {
    // If backend doesn't provide summary, compute from rows
    if (summary) return summary;

    if (!rows?.length) return null;

    const revenue = rows.reduce((a, r) => a + Number(r?.revenue || 0), 0);
    const total_cost = rows.reduce((a, r) => a + Number(r?.total_cost || 0), 0);
    const margin = revenue - total_cost;
    const margin_pct = revenue > 0 ? (margin / revenue) * 100 : 0;
    const jobs_count = rows.length;

    return { revenue, total_cost, gross_margin: margin, margin_pct, jobs_count };
  }, [summary, rows]);

  const filteredRows = useMemo(() => {
    const minM = minMarginPct !== "" ? Number(minMarginPct) : null;

    return (rows || []).filter((r) => {
      const mp = Number(r?.margin_pct);
      if (showOnlyLoss && Number(r?.margin || 0) >= 0) return false;
      if (minM !== null && Number.isFinite(mp) && mp < minM) return false;
      return true;
    });
  }, [rows, minMarginPct, showOnlyLoss]);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="border bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#dc2551]/10 p-3">
                  <Calculator className="h-6 w-6 text-[#dc2551]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Costing Report</CardTitle>
                  <CardDescription>
                    Job/WO costing with material + process + overhead + quality costs and gross margin insights.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setSummary(null);
                    setRows([]);
                    toast({ title: "Cleared", description: "Report cleared." });
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Clear
                </Button>

                <Button
                  className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                  onClick={run}
                  disabled={isLoading || !canRun}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch2 className="h-4 w-4" />}
                  Run Report
                </Button>

                <Button variant="outline" className="gap-2" onClick={() => exportReport("pdf")} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export PDF
                </Button>

                <Button variant="outline" className="gap-2" onClick={() => exportReport("xlsx")} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export XLSX
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#dc2551]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Filters</p>
                  <p className="text-xs text-gray-600">Filter by date, plant, customer, part, WO, and margin.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date To</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Plant</Label>
                  <Input value={plant} onChange={(e) => setPlant(e.target.value)} placeholder="Plant A / Kochi..." />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Open / Closed / Shipped" />
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
                </div>

                <div className="space-y-2">
                  <Label>Part No</Label>
                  <Input value={part} onChange={(e) => setPart(e.target.value)} placeholder="PCB-..." />
                </div>

                <div className="space-y-2">
                  <Label>Work Order</Label>
                  <Input value={wo} onChange={(e) => setWo(e.target.value)} placeholder="WO-..." />
                </div>

                <div className="space-y-2">
                  <Label>Min Margin %</Label>
                  <Input
                    value={minMarginPct}
                    onChange={(e) => setMinMarginPct(e.target.value)}
                    placeholder="e.g. 20"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cx("border", badgeTone("default"))}>
                    <Filter className="mr-1 h-3.5 w-3.5" />
                    Range: {safe(dateFrom)} → {safe(dateTo)}
                  </Badge>
                  {plant?.trim() ? <Badge className={cx("border", badgeTone("default"))}>Plant: {plant}</Badge> : null}
                  {status?.trim() ? <Badge className={cx("border", badgeTone("default"))}>Status: {status}</Badge> : null}
                </div>

                <button
                  type="button"
                  onClick={() => setShowOnlyLoss((s) => !s)}
                  className={cx(
                    "rounded-xl border px-3 py-2 text-sm",
                    showOnlyLoss ? "border-red-200 bg-red-50 text-red-700" : "bg-white text-gray-700"
                  )}
                >
                  <TrendingUp className="mr-2 inline-block h-4 w-4" />
                  {showOnlyLoss ? "Showing LOSS only" : "Show LOSS only"}
                </button>
              </div>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <SummaryTile icon={Package} label="Jobs" value={derived?.jobs_count} hint="Count in range" />
              <SummaryTile icon={Factory} label="Revenue" value={money(derived?.revenue)} hint="Sales value" />
              <SummaryTile icon={Layers} label="Total Cost" value={money(derived?.total_cost)} hint="All cost heads" />
              <SummaryTile
                icon={Calculator}
                label="Gross Margin"
                value={money(derived?.gross_margin)}
                hint="Revenue - Total cost"
              />
              <SummaryTile icon={TrendingUp} label="Margin %" value={pct(derived?.margin_pct)} hint="Gross margin %" />
              <SummaryTile icon={Table2} label="Rows" value={filteredRows?.length} hint="Filtered results" />
            </div>

            {/* Table */}
            <Card className="border bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Costing by Work Order</CardTitle>
                <CardDescription className="text-xs">
                  Breakdown includes material, process, overhead, and quality costs. Use filters to narrow down.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border bg-gray-50 p-8 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading report...
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-600">
                    No results found. Try adjusting filters and click <span className="font-semibold">Run Report</span>.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <Th>WO</Th>
                          <Th>Job</Th>
                          <Th>Customer</Th>
                          <Th>Part</Th>
                          <Th className="text-right">Layers</Th>
                          <Th className="text-right">Qty</Th>
                          <Th className="text-right">Revenue</Th>
                          <Th className="text-right">Material</Th>
                          <Th className="text-right">Process</Th>
                          <Th className="text-right">Overhead</Th>
                          <Th className="text-right">Quality</Th>
                          <Th className="text-right">Total Cost</Th>
                          <Th className="text-right">Margin</Th>
                          <Th className="text-right">Margin %</Th>
                          <Th>Status</Th>
                        </tr>
                      </thead>

                      <tbody className="divide-y bg-white">
                        {filteredRows.map((r, idx) => {
                          const m = Number(r?.margin || 0);
                          const mp = Number(r?.margin_pct || 0);
                          const tone =
                            m < 0 || mp < 0 ? "danger" : mp >= 25 ? "success" : mp >= 10 ? "warn" : "default";

                          return (
                            <tr key={r?.id ?? r?._id ?? `${r?.wo_no}-${idx}`} className="text-sm">
                              <Td className="font-semibold text-gray-900">{safe(r?.wo_no)}</Td>
                              <Td>{safe(r?.job_no)}</Td>
                              <Td className="max-w-[220px] truncate">{safe(r?.customer)}</Td>
                              <Td className="font-mono text-xs">{safe(r?.part_no)}</Td>
                              <Td className="text-right">{safe(r?.layers)}</Td>
                              <Td className="text-right">{safe(r?.qty)}</Td>
                              <Td className="text-right font-semibold">{money(r?.revenue)}</Td>
                              <Td className="text-right">{money(r?.mat_cost)}</Td>
                              <Td className="text-right">{money(r?.proc_cost)}</Td>
                              <Td className="text-right">{money(r?.oh_cost)}</Td>
                              <Td className="text-right">{money(r?.quality_cost)}</Td>
                              <Td className="text-right font-semibold">{money(r?.total_cost)}</Td>
                              <Td className={cx("text-right font-semibold", m < 0 ? "text-red-700" : "text-gray-900")}>
                                {money(r?.margin)}
                              </Td>
                              <Td className="text-right">
                                <Badge className={cx("border", badgeTone(tone))}>{pct(r?.margin_pct)}</Badge>
                              </Td>
                              <Td>
                                <Badge className={cx("border", badgeTone("default"))}>{safe(r?.status)}</Badge>
                              </Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Calculator className="mt-0.5 h-4 w-4 text-[#dc2551]" />
                <div>
                  <div className="font-semibold">Cost heads included (recommended)</div>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-gray-600">
                    <li>Material: copper-clad, prepreg/core, chemicals, soldermask, legends, consumables</li>
                    <li>Process: drilling, imaging, plating, etching, lamination, routing/V-score, finishing</li>
                    <li>Overhead: power, labor burden, depreciation, utilities, plant overhead allocation</li>
                    <li>Quality: rework, scrap, NCR handling, retest (AOI/E-test), warranty/returns</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-600">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-gray-900">{safe(value)}</div>
          <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
        <div className="rounded-xl bg-[#dc2551]/10 p-2">
          <Icon className="h-5 w-5 text-[#dc2551]" />
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={cx("px-3 py-2 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={cx("px-3 py-2 whitespace-nowrap", className)}>{children}</td>;
}
