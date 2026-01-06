// src/pages/sales/invoices/InvoicePrint.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Loader2,
  Printer,
  RefreshCw,
  Stamp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import invoicesService from "@/services/sales/invoices.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const INR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

function safeDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

function pickId(obj) {
  return obj?.id || obj?._id || obj?.uuid || "";
}

function upper(s) {
  return String(s || "").toUpperCase();
}

function calcLine(line) {
  const qty = Number(line?.qty ?? line?.quantity ?? 0) || 0;
  const rate = Number(line?.rate ?? line?.unitPrice ?? 0) || 0;
  const amount = qty * rate;

  const cgst = Number(line?.cgst ?? 0) || 0;
  const sgst = Number(line?.sgst ?? 0) || 0;
  const igst = Number(line?.igst ?? 0) || 0;

  const taxPct = cgst + sgst + igst;
  const taxAmt = (amount * taxPct) / 100;
  const total = amount + taxAmt;

  return { qty, rate, amount, taxPct, taxAmt, total };
}

export default function InvoicePrint() {
  const { toast } = useToast();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [customer, setCustomer] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await invoicesService.get(id);
      const data = res?.data?.data ?? res?.data ?? null;

      setInvoice(data);
      setCompany(data?.company || data?.meta?.company || null);
      setCustomer(data?.customer || data?.party || null);
    } catch (err) {
      toast({
        title: "Failed to load invoice",
        description: err?.response?.data?.message || "Unable to fetch invoice details for printing.",
        variant: "destructive",
      });
      setInvoice(null);
      setCompany(null);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-print if route contains ?autoprint=1
  useEffect(() => {
    const usp = new URLSearchParams(window.location.search);
    const auto = usp.get("autoprint");
    if (auto === "1") {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
  }, []);

  const items = useMemo(() => {
    const arr = invoice?.items || invoice?.lines || invoice?.lineItems || [];
    return Array.isArray(arr) ? arr : [];
  }, [invoice]);

  const totals = useMemo(() => {
    let subTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    items.forEach((l) => {
      const c = calcLine(l);
      subTotal += c.amount;
      taxTotal += c.taxAmt;
      grandTotal += c.total;
    });

    // If backend provides totals, prefer them
    const backendGrand = Number(invoice?.grandTotal ?? invoice?.total ?? NaN);
    const backendSub = Number(invoice?.subTotal ?? invoice?.subtotal ?? NaN);
    const backendTax = Number(invoice?.taxTotal ?? invoice?.gstTotal ?? NaN);

    return {
      subTotal: Number.isFinite(backendSub) ? backendSub : subTotal,
      taxTotal: Number.isFinite(backendTax) ? backendTax : taxTotal,
      grandTotal: Number.isFinite(backendGrand) ? backendGrand : grandTotal,
      roundOff: Number(invoice?.roundOff ?? 0) || 0,
    };
  }, [items, invoice]);

  const status = upper(invoice?.status || "DRAFT");

  const downloadPdf = async () => {
    // Expected: invoicesService.downloadPdf(id) => blob/pdf
    try {
      const res = await invoicesService.downloadPdf(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice?.invoiceNo || "invoice"}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "PDF download failed",
        description:
          err?.response?.data?.message ||
          "PDF endpoint not available yet. Add invoicesService.downloadPdf().",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Toolbar (hidden on print) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/sales/invoices/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadPdf} disabled={!invoice}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={() => window.print()} disabled={!invoice}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Printable Area */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-600 print:hidden">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading invoice...
              </div>
            ) : !invoice ? (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold text-gray-800">Invoice not found</p>
                <p className="mt-1 text-xs text-gray-500">Please go back and select a valid invoice.</p>
              </div>
            ) : (
              <div id="print-root" className="bg-white px-6 py-6 sm:px-8 sm:py-8 print:p-0">
                {/* Print CSS */}
                <style>{`
                  @media print {
                    @page { size: A4; margin: 10mm; }
                    html, body { background: #fff !important; }
                    .print\\:hidden { display: none !important; }
                    #print-root { box-shadow: none !important; }
                    .watermark { opacity: 0.08 !important; }
                  }
                `}</style>

                {/* Watermark */}
                <div className="pointer-events-none absolute inset-0 hidden print:block">
                  <div className="watermark fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[92px] font-extrabold text-gray-500">
                    PCBXpress
                  </div>
                </div>

                {/* Header */}
                <div className="relative">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Company */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
                          <Stamp className="h-5 w-5" />
                        </div>
                        <div>
                          <h1 className="text-lg font-extrabold tracking-tight text-gray-900">
                            {company?.name || "PCBXpress"}
                          </h1>
                          <p className="text-xs text-gray-500">
                            PCB Manufacturing ERP • Invoice Document
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-gray-700">
                        <p className="font-medium text-gray-900">{company?.legalName || company?.name || "PCBXpress"}</p>
                        <p>{company?.addressLine1 || company?.address || "—"}</p>
                        <p className="flex flex-wrap gap-x-3">
                          <span>{company?.city || ""}{company?.city ? "," : ""} {company?.state || ""}</span>
                          <span>{company?.pincode || ""}</span>
                        </p>
                        <p className="flex flex-wrap gap-x-3">
                          <span>GSTIN: {company?.gstin || "—"}</span>
                          <span>PAN: {company?.pan || "—"}</span>
                        </p>
                        <p className="flex flex-wrap gap-x-3">
                          <span>Email: {company?.email || "—"}</span>
                          <span>Phone: {company?.phone || "—"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Invoice meta */}
                    <div className="w-full sm:w-[320px] rounded-2xl border bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Invoice</p>
                          <p className="text-lg font-extrabold tracking-tight text-gray-900">
                            {invoice?.invoiceNo || invoice?.code || "—"}
                          </p>
                        </div>
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            status === "PAID"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : status === "SENT"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : status === "CANCELLED"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-gray-200 bg-white text-gray-700"
                          )}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500">Invoice Date</p>
                          <p className="font-semibold text-gray-900">{safeDate(invoice?.invoiceDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Due Date</p>
                          <p className="font-semibold text-gray-900">{safeDate(invoice?.dueDate)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Reference</p>
                          <p className="font-semibold text-gray-900">
                            {invoice?.referenceNo ||
                              (invoice?.salesOrderNo ? `SO: ${invoice.salesOrderNo}` : "") ||
                              (invoice?.workOrderNo ? `WO: ${invoice.workOrderNo}` : "") ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-5 h-px w-full bg-gray-200" />

                  {/* Bill to / Ship to */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill To</p>
                      <div className="mt-2 space-y-1 text-xs text-gray-700">
                        <p className="text-sm font-bold text-gray-900">{customer?.name || invoice?.customerName || "—"}</p>
                        <p>{customer?.addressLine1 || customer?.address || "—"}</p>
                        <p className="flex flex-wrap gap-x-3">
                          <span>{customer?.city || ""}{customer?.city ? "," : ""} {customer?.state || ""}</span>
                          <span>{customer?.pincode || ""}</span>
                        </p>
                        <p className="flex flex-wrap gap-x-3">
                          <span>GSTIN: {customer?.gstin || invoice?.customerGstin || "—"}</span>
                          <span>Phone: {customer?.phone || "—"}</span>
                        </p>
                        <p>Email: {customer?.email || "—"}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ship To</p>
                      <div className="mt-2 space-y-1 text-xs text-gray-700">
                        <p className="text-sm font-bold text-gray-900">
                          {invoice?.shipTo?.name || customer?.name || invoice?.customerName || "—"}
                        </p>
                        <p>{invoice?.shipTo?.addressLine1 || invoice?.shipTo?.address || customer?.addressLine1 || customer?.address || "—"}</p>
                        <p className="flex flex-wrap gap-x-3">
                          <span>
                            {(invoice?.shipTo?.city || customer?.city || "")}
                            {(invoice?.shipTo?.city || customer?.city) ? "," : ""} {(invoice?.shipTo?.state || customer?.state || "")}
                          </span>
                          <span>{invoice?.shipTo?.pincode || customer?.pincode || ""}</span>
                        </p>
                        <p className="flex flex-wrap gap-x-3">
                          <span>Place of Supply: {invoice?.placeOfSupply || customer?.state || "—"}</span>
                          <span>State Code: {invoice?.stateCode || "—"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-5 overflow-hidden rounded-2xl border">
                    <div className="bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Invoice Items</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        PCB manufacturing billing lines (board + process + consumables).
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="border-b bg-white">
                          <tr>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              #
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Description
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              HSN/SAC
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">
                              Rate
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">
                              Tax %
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-600">
                                No line items found.
                              </td>
                            </tr>
                          ) : (
                            items.map((line, idx) => {
                              const c = calcLine(line);
                              return (
                                <tr key={pickId(line) || idx} className="border-b last:border-b-0">
                                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-900">
                                      {line?.name || line?.description || "PCB Item"}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                      {line?.notes ||
                                        line?.spec ||
                                        (line?.boardSpec ? `Spec: ${line.boardSpec}` : "") ||
                                        (line?.jobNo ? `Job: ${line.jobNo}` : "") ||
                                        ""}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-gray-700">{line?.hsn || line?.hsnSac || "—"}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{c.qty}</td>
                                  <td className="px-4 py-3 text-right text-gray-900">{INR(c.rate)}</td>
                                  <td className="px-4 py-3 text-right text-gray-900">{INR(c.amount)}</td>
                                  <td className="px-4 py-3 text-right text-gray-700">{c.taxPct ? `${c.taxPct}%` : "—"}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{INR(c.total)}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment & Notes</p>
                      <div className="mt-2 space-y-2 text-xs text-gray-700">
                        <p>
                          <span className="font-semibold text-gray-900">Payment Terms:</span>{" "}
                          {invoice?.paymentTerms || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">Dispatch Terms:</span>{" "}
                          {invoice?.dispatchTerms || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">Notes:</span>{" "}
                          {invoice?.notes || "—"}
                        </p>

                        {/* Bank */}
                        <div className="mt-3 rounded-xl bg-gray-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Bank Details
                          </p>
                          <p className="mt-1">
                            <span className="font-semibold text-gray-900">A/C Name:</span>{" "}
                            {company?.bank?.accountName || company?.bankAccountName || "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">A/C No:</span>{" "}
                            {company?.bank?.accountNo || company?.bankAccountNo || "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">IFSC:</span>{" "}
                            {company?.bank?.ifsc || company?.bankIfsc || "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">Bank:</span>{" "}
                            {company?.bank?.bankName || company?.bankName || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</p>

                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold text-gray-900">{INR(totals.subTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">GST Total</span>
                          <span className="font-semibold text-gray-900">{INR(totals.taxTotal)}</span>
                        </div>

                        {totals.roundOff ? (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Round Off</span>
                            <span className="font-semibold text-gray-900">{INR(totals.roundOff)}</span>
                          </div>
                        ) : null}

                        <div className="my-2 h-px w-full bg-gray-200" />

                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-gray-900">Grand Total</span>
                          <span className="text-base font-extrabold text-gray-900">
                            {INR(totals.grandTotal + (totals.roundOff || 0))}
                          </span>
                        </div>

                        {invoice?.amountInWords ? (
                          <div className="mt-2 rounded-xl bg-gray-50 p-3 text-xs">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Amount in Words
                            </p>
                            <p className="mt-1 font-medium text-gray-900">{invoice.amountInWords}</p>
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Generated by PCBXpress ERP</span>
                          <span>Page 1/1</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Authorized Signatory</p>
                      <p className="mt-1">This is a system generated invoice. Signature not required if digitally signed.</p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">For {company?.name || "PCBXpress"}</p>
                      <p className="mt-6 text-[11px] text-gray-500">Stamp / Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

/**
 * EXPECTED services in: src/services/sales/invoices.service.js
 *
 * - get(id)                       // GET /sales/invoices/:id
 * - downloadPdf(id)               // GET /sales/invoices/:id/pdf   (blob)
 *
 * Notes:
 * - This component prints clean A4.
 * - Use route: /sales/invoices/:id/print
 * - Auto print: /sales/invoices/:id/print?autoprint=1
 */
