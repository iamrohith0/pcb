// src/pages/reports/finance/TaxSummary.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
    Calendar,
    Download,
    FileSearch2,
    Filter,
    Loader2,
    Percent,
    ReceiptIndianRupee,
    RefreshCcw,
    ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function moneyINR(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function tone(kind) {
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
 * PCBxpress ERP — Tax Summary (India GST)
 * File: src/pages/reports/finance/TaxSummary.jsx
 *
 * Suggested endpoints (adjust to your API):
 * - GET  /reports/tax/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&plant=&customer=&gstin=&place_of_supply=&doc_type=
 * - GET  /reports/tax/export?format=pdf|xlsx&from=&to=&...
 *
 * Recommended response shape:
 * {
 *   summary: {
 *     taxable_value,
 *     cgst, sgst, igst, cess,
 *     total_tax,
 *     total_invoice_value,
 *     invoices_count
 *   },
 *   by_rate: [
 *     { rate: 0, taxable_value, cgst, sgst, igst, cess, total_tax },
 *     { rate: 5, ... },
 *     ...
 *   ],
 *   by_place: [
 *     { state: "Kerala", place_of_supply: "32", taxable_value, total_tax, total_invoice_value, invoices_count }
 *   ],
 *   rows: [
 *     { doc_no, doc_date, doc_type, customer, gstin, place_of_supply, taxable_value, cgst, sgst, igst, cess, total_tax, total_value, status }
 *   ]
 * }
 */

export default function TaxSummary() {
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
  const [gstin, setGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState(""); // ex: "32" Kerala
  const [docType, setDocType] = useState(""); // Tax Invoice / Credit Note / Debit Note / Export etc.

  // Data
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState({ summary: null, by_rate: [], by_place: [], rows: [] });

  const query = useMemo(() => {
    return {
      from: dateFrom || null,
      to: dateTo || null,
      plant: plant?.trim() || null,
      customer: customer?.trim() || null,
      gstin: gstin?.trim() || null,
      place_of_supply: placeOfSupply?.trim() || null,
      doc_type: docType?.trim() || null,
    };
  }, [dateFrom, dateTo, plant, customer, gstin, placeOfSupply, docType]);

  const canRun = Boolean(dateFrom && dateTo);

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
    setData({ summary: null, by_rate: [], by_place: [], rows: [] });

    try {
      const res = await api.get("/reports/tax/summary", { params: query });
      const payload = res?.data?.data ?? res?.data ?? {};

      setData({
        summary: payload?.summary ?? null,
        by_rate: Array.isArray(payload?.by_rate) ? payload.by_rate : [],
        by_place: Array.isArray(payload?.by_place) ? payload.by_place : [],
        rows: Array.isArray(payload?.rows) ? payload.rows : [],
      });

      toast({
        title: "Tax summary ready",
        description: `Loaded ${Array.isArray(payload?.rows) ? payload.rows.length : 0} documents.`,
      });
    } catch (err) {
      console.warn(err);
      toast({
        title: "Failed to load tax summary",
        description: err?.response?.data?.message || "Tax summary endpoint not available yet. Connect backend to proceed.",
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
      const res = await api.get("/reports/tax/export", {
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
      a.download = `tax-summary-${dateFrom}_to_${dateTo}.${format}`;
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

  const derivedSummary = useMemo(() => {
    if (data.summary) return data.summary;

    // derive from rows if summary missing
    const rows = data.rows || [];
    if (!rows.length) return null;

    const taxable_value = rows.reduce((a, r) => a + Number(r?.taxable_value || 0), 0);
    const cgst = rows.reduce((a, r) => a + Number(r?.cgst || 0), 0);
    const sgst = rows.reduce((a, r) => a + Number(r?.sgst || 0), 0);
    const igst = rows.reduce((a, r) => a + Number(r?.igst || 0), 0);
    const cess = rows.reduce((a, r) => a + Number(r?.cess || 0), 0);
    const total_tax = cgst + sgst + igst + cess;
    const total_invoice_value = rows.reduce((a, r) => a + Number(r?.total_value || 0), 0);

    return {
      taxable_value,
      cgst,
      sgst,
      igst,
      cess,
      total_tax,
      total_invoice_value,
      invoices_count: rows.length,
    };
  }, [data]);

  const taxSplitTone = useMemo(() => {
    const s = derivedSummary;
    if (!s) return "default";
    const ig = Number(s?.igst || 0);
    const cg = Number(s?.cgst || 0);
    const sg = Number(s?.sgst || 0);
    if (ig > cg + sg) return "warn"; // more inter-state than intra-state
    return "success";
  }, [derivedSummary]);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="border bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#dc2551]/10 p-3">
                  <ReceiptIndianRupee className="h-6 w-6 text-[#dc2551]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tax Summary</CardTitle>
                  <CardDescription>
                    GST summary across invoices/notes with breakup by rate slab and place of supply (India).
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setData({ summary: null, by_rate: [], by_place: [], rows: [] });
                    toast({ title: "Cleared", description: "Tax summary cleared." });
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
                  Run
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
                <Filter className="h-4 w-4 text-[#dc2551]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Filters</p>
                  <p className="text-xs text-gray-600">Filter tax by date range, plant, customer, GSTIN, and POS.</p>
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
                  <Input value={plant} onChange={(e) => setPlant(e.target.value)} placeholder="Plant A / Unit 2..." />
                </div>

                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="Tax Invoice / CN / DN" />
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
                </div>

                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="32AAAAA0000A1Z5" />
                </div>

                <div className="space-y-2">
                  <Label>Place of Supply (POS code)</Label>
                  <Input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="e.g. 32" />
                </div>

                <div className="space-y-2">
                  <Label>Quick Note</Label>
                  <div className="rounded-xl border bg-white px-3 py-2 text-xs text-gray-600">
                    Intra-state: CGST+SGST • Inter-state: IGST
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge className={cx("border", tone("default"))}>
                  Range: {safe(dateFrom)} → {safe(dateTo)}
                </Badge>
                {plant?.trim() ? <Badge className={cx("border", tone("default"))}>Plant: {plant}</Badge> : null}
                {docType?.trim() ? <Badge className={cx("border", tone("default"))}>Doc: {docType}</Badge> : null}
                {placeOfSupply?.trim() ? (
                  <Badge className={cx("border", tone("default"))}>POS: {placeOfSupply}</Badge>
                ) : null}
              </div>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <SummaryTile icon={ShieldCheck} label="Documents" value={derivedSummary?.invoices_count} hint="Invoices/notes" />
              <SummaryTile icon={ReceiptIndianRupee} label="Taxable" value={moneyINR(derivedSummary?.taxable_value)} hint="Taxable value" />
              <SummaryTile icon={Percent} label="Total GST" value={moneyINR(derivedSummary?.total_tax)} hint="CGST+SGST+IGST+CESS" />
              <SummaryTile icon={ReceiptIndianRupee} label="Invoice Value" value={moneyINR(derivedSummary?.total_invoice_value)} hint="Grand total" />
              <SummaryTile icon={Percent} label="CGST" value={moneyINR(derivedSummary?.cgst)} hint="Intra-state" />
              <SummaryTile icon={Percent} label="IGST" value={moneyINR(derivedSummary?.igst)} hint="Inter-state" />
            </div>

            {/* Breakup: by rate & by place */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Breakup by GST Rate</CardTitle>
                  <CardDescription className="text-xs">Rate slab wise taxable and tax totals.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <SkeletonBox />
                  ) : (data.by_rate || []).length === 0 ? (
                    <EmptyBox text="No rate breakup available. Backend can return by_rate[]" />
                  ) : (
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-xs font-semibold text-gray-600">
                            <Th className="text-right">Rate</Th>
                            <Th className="text-right">Taxable</Th>
                            <Th className="text-right">CGST</Th>
                            <Th className="text-right">SGST</Th>
                            <Th className="text-right">IGST</Th>
                            <Th className="text-right">CESS</Th>
                            <Th className="text-right">Total Tax</Th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                          {data.by_rate.map((r, idx) => (
                            <tr key={`${r?.rate}-${idx}`} className="text-sm">
                              <Td className="text-right">
                                <Badge className={cx("border", tone("default"))}>{safe(r?.rate)}%</Badge>
                              </Td>
                              <Td className="text-right font-semibold">{moneyINR(r?.taxable_value)}</Td>
                              <Td className="text-right">{moneyINR(r?.cgst)}</Td>
                              <Td className="text-right">{moneyINR(r?.sgst)}</Td>
                              <Td className="text-right">{moneyINR(r?.igst)}</Td>
                              <Td className="text-right">{moneyINR(r?.cess)}</Td>
                              <Td className="text-right font-semibold">{moneyINR(r?.total_tax)}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Breakup by Place of Supply</CardTitle>
                  <CardDescription className="text-xs">
                    POS-wise totals. Helps reconcile intra/inter-state split.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className={cx("border", tone(taxSplitTone))}>
                      IGST vs CGST+SGST: {moneyINR(derivedSummary?.igst)} vs {moneyINR((derivedSummary?.cgst || 0) + (derivedSummary?.sgst || 0))}
                    </Badge>
                  </div>

                  {isLoading ? (
                    <SkeletonBox />
                  ) : (data.by_place || []).length === 0 ? (
                    <EmptyBox text="No POS breakup available. Backend can return by_place[]" />
                  ) : (
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-xs font-semibold text-gray-600">
                            <Th>State</Th>
                            <Th>POS</Th>
                            <Th className="text-right">Taxable</Th>
                            <Th className="text-right">Total Tax</Th>
                            <Th className="text-right">Invoice Value</Th>
                            <Th className="text-right">Docs</Th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                          {data.by_place.map((p, idx) => (
                            <tr key={`${p?.place_of_supply}-${idx}`} className="text-sm">
                              <Td className="max-w-[160px] truncate">{safe(p?.state)}</Td>
                              <Td>
                                <Badge className={cx("border", tone("default"))}>{safe(p?.place_of_supply)}</Badge>
                              </Td>
                              <Td className="text-right font-semibold">{moneyINR(p?.taxable_value)}</Td>
                              <Td className="text-right">{moneyINR(p?.total_tax)}</Td>
                              <Td className="text-right">{moneyINR(p?.total_invoice_value)}</Td>
                              <Td className="text-right">{safe(p?.invoices_count)}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Document list */}
            <Card className="border bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Document-wise Tax</CardTitle>
                <CardDescription className="text-xs">
                  Invoice / CN / DN level tax values for reconciliation and auditing.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <SkeletonBox />
                ) : (data.rows || []).length === 0 ? (
                  <EmptyBox text="No documents found. Run report or adjust filters." />
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <Th>Doc No</Th>
                          <Th>Date</Th>
                          <Th>Type</Th>
                          <Th>Customer</Th>
                          <Th>GSTIN</Th>
                          <Th>POS</Th>
                          <Th className="text-right">Taxable</Th>
                          <Th className="text-right">CGST</Th>
                          <Th className="text-right">SGST</Th>
                          <Th className="text-right">IGST</Th>
                          <Th className="text-right">CESS</Th>
                          <Th className="text-right">Total Tax</Th>
                          <Th className="text-right">Total</Th>
                          <Th>Status</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {data.rows.map((r, idx) => {
                          const totalTax = Number(r?.total_tax ?? (Number(r?.cgst || 0) + Number(r?.sgst || 0) + Number(r?.igst || 0) + Number(r?.cess || 0)));
                          const kind = totalTax > 0 ? "success" : "default";

                          return (
                            <tr key={r?.id ?? r?._id ?? `${r?.doc_no}-${idx}`} className="text-sm">
                              <Td className="font-semibold text-gray-900">{safe(r?.doc_no)}</Td>
                              <Td>{safe(r?.doc_date)}</Td>
                              <Td>
                                <Badge className={cx("border", tone("default"))}>{safe(r?.doc_type)}</Badge>
                              </Td>
                              <Td className="max-w-[220px] truncate">{safe(r?.customer)}</Td>
                              <Td className="font-mono text-xs">{safe(r?.gstin)}</Td>
                              <Td>
                                <Badge className={cx("border", tone("default"))}>{safe(r?.place_of_supply)}</Badge>
                              </Td>
                              <Td className="text-right font-semibold">{moneyINR(r?.taxable_value)}</Td>
                              <Td className="text-right">{moneyINR(r?.cgst)}</Td>
                              <Td className="text-right">{moneyINR(r?.sgst)}</Td>
                              <Td className="text-right">{moneyINR(r?.igst)}</Td>
                              <Td className="text-right">{moneyINR(r?.cess)}</Td>
                              <Td className="text-right font-semibold">{moneyINR(totalTax)}</Td>
                              <Td className="text-right font-semibold">{moneyINR(r?.total_value)}</Td>
                              <Td>
                                <Badge className={cx("border", tone(kind))}>{safe(r?.status)}</Badge>
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
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[#dc2551]" />
                <div>
                  <div className="font-semibold">GST reconciliation tips (ERP)</div>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-gray-600">
                    <li>Validate POS vs shipping state to decide IGST vs CGST+SGST.</li>
                    <li>Ensure GST rate matches item HSN and customer tax category.</li>
                    <li>Track Credit/Debit Notes separately for adjustments.</li>
                    <li>Export XLSX for filing workflows and audit trails.</li>
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

function SkeletonBox() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-gray-50 p-8 text-sm text-gray-600">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
    </div>
  );
}

function EmptyBox({ text }) {
  return <div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-600">{text}</div>;
}

function Th({ children, className = "" }) {
  return <th className={cx("px-3 py-2 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={cx("px-3 py-2 whitespace-nowrap", className)}>{children}</td>;
}
