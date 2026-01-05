// src/pages/sales/invoices/InvoiceDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Edit,
  FileText,
  Hash,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Printer,
  ShieldCheck,
  Trash2,
  Truck,
  AlertTriangle,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import invoicesService from "@/services/sales/invoices.service";

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

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const INR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0
  );

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

function safeDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

function computeTotals(invoice) {
  const items = invoice?.items || [];
  const charges = invoice?.charges || { packing: 0, shipping: 0, other: 0 };

  const rows = items.map((it) => {
    const qty = Number(it.qty || 0);
    const unit = Number(it.unitPrice || 0);
    const base = qty * unit;

    const discPct = Number(it.discountPct || 0);
    const discount = base * (discPct / 100);

    const taxable = base - discount;

    const taxPct = Number(it.taxPct || 0);
    const tax = taxable * (taxPct / 100);

    const lineTotal = taxable + tax;

    return {
      base: round2(base),
      discount: round2(discount),
      taxable: round2(taxable),
      tax: round2(tax),
      lineTotal: round2(lineTotal),
    };
  });

  const subTotal = round2(rows.reduce((s, r) => s + r.base, 0));
  const discountTotal = round2(rows.reduce((s, r) => s + r.discount, 0));
  const taxableTotal = round2(rows.reduce((s, r) => s + r.taxable, 0));
  const taxTotal = round2(rows.reduce((s, r) => s + r.tax, 0));

  const chargeTotal = round2(
    Number(charges.packing || 0) + Number(charges.shipping || 0) + Number(charges.other || 0)
  );

  const beforeTcs = round2(taxableTotal + taxTotal + chargeTotal);

  const tcsPct = Number(invoice?.tcsPct || 0);
  const tcs = round2(beforeTcs * (tcsPct / 100));

  const rounding = round2(Number(invoice?.rounding || 0));

  const grandTotal = round2(beforeTcs + tcs + rounding);

  return {
    subTotal,
    discountTotal,
    taxableTotal,
    taxTotal,
    chargeTotal,
    tcs,
    rounding,
    grandTotal,
  };
}

function pickId(obj) {
  return obj?.id || obj?._id || obj?.uuid || "";
}

function StatusBadge({ status }) {
  const s = String(status || "DRAFT").toUpperCase();
  const cls =
    s === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : s === "SENT"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : s === "CANCELLED"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-gray-200 bg-gray-50 text-gray-700";
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium", cls)}>
      {s}
    </span>
  );
}

export default function InvoiceDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [marking, setMarking] = useState(false);

  const totals = useMemo(() => computeTotals(invoice), [invoice]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await invoicesService.getById(id);
      const data = res?.data?.data ?? res?.data ?? null;
      setInvoice(data);
    } catch (err) {
      toast({
        title: "Failed to load invoice",
        description: err?.response?.data?.message || "Invoice not found or server error.",
        variant: "destructive",
      });
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      toast({ title: "Copied", description: "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    // If your backend returns a PDF binary.
    // Expected: invoicesService.downloadPdf(id) -> blob
    try {
      toast({ title: "Preparing PDF", description: "Generating invoice PDF..." });
      const res = await invoicesService.downloadPdf(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice?.invoiceNo || "invoice"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Invoice PDF downloaded." });
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

  const handleMarkStatus = async (status) => {
    // Expected: invoicesService.updateStatus(id, { status })
    setMarking(true);
    try {
      await invoicesService.updateStatus(id, { status });
      toast({ title: "Updated", description: `Invoice marked as ${status}.` });
      fetchInvoice();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.response?.data?.message || "Unable to update invoice status.",
        variant: "destructive",
      });
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await invoicesService.remove(id);
      toast({ title: "Deleted", description: "Invoice deleted successfully." });
      navigate("/sales/invoices", { replace: true });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete invoice.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const customer = invoice?.customer || invoice?.customerSnapshot || invoice?.customerInfo || null;

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invoice...
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline">
          <Link to="/dashboard/sales/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Invoice not found</CardTitle>
            <CardDescription>The invoice you’re looking for doesn’t exist or you don’t have access.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Print styles */}
      <style>{`
        @media print {
          header, aside, .no-print { display: none !important; }
          main { padding: 0 !important; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button asChild variant="ghost" className="h-8 px-2">
              <Link to="/sales/invoices" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <span className="text-gray-300">/</span>
            <span className="truncate">Invoice Details</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              {invoice.invoiceNo || invoice.code || "Invoice"}
            </h1>
            <StatusBadge status={invoice.status} />
            {invoice.sourceType === "SALES_ORDER" && (
              <Badge variant="outline" className="text-[11px]">
                Linked to Sales Order
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            PCBXpress invoice view with items, GST, charges and printable layout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>

          <Button asChild variant="outline">
            <Link to={`/sales/invoices/${pickId(invoice)}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            onClick={() => setDeleteOpen(true)}
            className="bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700"
            variant="ghost"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main printable invoice */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="print-card">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Invoice
                    </CardTitle>
                    <CardDescription>
                      View and verify invoice before dispatch. Use Print for A4 output.
                    </CardDescription>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-1.5">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{invoice.invoiceNo || "—"}</span>
                      </span>
                      <button
                        className="no-print inline-flex items-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        onClick={() => copyToClipboard(invoice.invoiceNo || "")}
                        title="Copy Invoice No"
                        type="button"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {safeDate(invoice.invoiceDate)}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      Due: <span className="font-medium text-gray-700">{safeDate(invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Party blocks */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Bill To
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="font-semibold">{invoice.billing?.name || customer?.companyName || customer?.name || "—"}</p>
                      {invoice.billing?.gstin ? (
                        <p className="mt-1 text-xs text-gray-500">
                          GSTIN: <span className="font-medium text-gray-700">{invoice.billing.gstin}</span>
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                        {[invoice.billing?.addressLine1, invoice.billing?.addressLine2]
                          .filter(Boolean)
                          .join("\n")}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {[invoice.billing?.city, invoice.billing?.state, invoice.billing?.pincode].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-sm text-gray-700">{invoice.billing?.country || "India"}</p>
                    </div>

                    {customer?.email || customer?.phone ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {customer?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> {customer.email}
                          </span>
                        )}
                        {customer?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" /> {customer.phone}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Truck className="h-4 w-4 text-gray-500" />
                      Ship To
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="font-semibold">{invoice.shipping?.name || invoice.billing?.name || "—"}</p>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                        {[invoice.shipping?.addressLine1, invoice.shipping?.addressLine2]
                          .filter(Boolean)
                          .join("\n")}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {[invoice.shipping?.city, invoice.shipping?.state, invoice.shipping?.pincode].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-sm text-gray-700">{invoice.shipping?.country || "India"}</p>

                      <div className="mt-3 text-xs text-gray-500">
                        Place of Supply:{" "}
                        <span className="font-medium text-gray-700">{invoice.placeOfSupply || invoice.billing?.state || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">Items</p>
                    <p className="text-xs text-gray-500">Fabrication / assembly / tooling line items.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">HSN</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Rate</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Disc%</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">GST%</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invoice.items || []).map((it, idx) => {
                          const qty = Number(it.qty || 0);
                          const unit = Number(it.unitPrice || 0);
                          const base = qty * unit;
                          const disc = base * (Number(it.discountPct || 0) / 100);
                          const taxable = base - disc;
                          const tax = taxable * (Number(it.taxPct || 0) / 100);
                          const line = taxable + tax;

                          return (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{it.description || "—"}</p>
                                {it.uom ? <p className="text-xs text-gray-500">UoM: {it.uom}</p> : null}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{it.hsn || "—"}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {qty} {it.uom ? <span className="text-xs text-gray-500">{it.uom}</span> : null}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{INR(unit)}</td>
                              <td className="px-4 py-3 text-gray-700">{Number(it.discountPct || 0)}%</td>
                              <td className="px-4 py-3 text-gray-700">{Number(it.taxPct || 0)}%</td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">{INR(round2(line))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes / Terms */}
                {(invoice.notes || invoice.terms) && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">Notes</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{invoice.notes || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">Terms</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{invoice.terms || "—"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side summary + actions */}
          <div className="space-y-5">
            <Card className="print-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IndianRupee className="h-4 w-4 text-gray-500" />
                  Totals
                </CardTitle>
                <CardDescription>Calculated from items, GST and charges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sub-total</span>
                  <span className="font-medium">{INR(totals.subTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">- {INR(totals.discountTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taxable</span>
                  <span className="font-medium">{INR(totals.taxableTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">GST</span>
                  <span className="font-medium">{INR(totals.taxTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Charges</span>
                  <span className="font-medium">{INR(totals.chargeTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">TCS</span>
                  <span className="font-medium">{INR(totals.tcs)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rounding</span>
                  <span className="font-medium">{INR(totals.rounding)}</span>
                </div>

                <div className="my-2 h-px bg-gray-200" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Grand Total</span>
                  <span className="font-semibold text-gray-900">{INR(totals.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="no-print">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-gray-500" />
                  Status Actions
                </CardTitle>
                <CardDescription>Track invoice lifecycle for dispatch and payment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    disabled={marking}
                    onClick={() => handleMarkStatus("SENT")}
                    className="justify-start"
                  >
                    {marking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Mark as Sent
                  </Button>

                  <Button
                    variant="outline"
                    disabled={marking}
                    onClick={() => handleMarkStatus("PAID")}
                    className="justify-start"
                  >
                    {marking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Mark as Paid
                  </Button>

                  <Button
                    variant="outline"
                    disabled={marking}
                    onClick={() => handleMarkStatus("CANCELLED")}
                    className="justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {marking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                    Cancel Invoice
                  </Button>
                </div>

                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-800">Tip</p>
                  <p className="mt-1">
                    Use <b>Print</b> to generate a clean A4 invoice for PCB dispatch, and <b>PDF</b> for emailing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete invoice?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The invoice and its data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * EXPECTED services in: src/services/sales/invoices.service.js
 *
 * - getById(id)
 * - remove(id)
 * - updateStatus(id, { status })
 * - downloadPdf(id)  // returns Axios response with blob, set responseType:'arraybuffer' or 'blob'
 *
 * Typical backend:
 * GET    /sales/invoices/:id
 * DELETE /sales/invoices/:id
 * PATCH  /sales/invoices/:id/status
 * GET    /sales/invoices/:id/pdf
 */
