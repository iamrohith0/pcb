// src/pages/sales/quotations/QuotationDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileText,
  Loader2,
  Mail,
  Printer,
  RefreshCw,
  Send,
  Trash2,
  User2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import quotationsService from "@/services/sales/quotations.service";
import customersService from "@/services/sales/customers.service";

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
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

function pickId(obj) {
  return obj?.id || obj?._id || obj?.uuid || "";
}

function safeDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return String(d);
  }
}

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function calcLine(line) {
  const qty = num(line?.qty);
  const unitPrice = num(line?.unitPrice);
  const discountPct = Math.min(Math.max(num(line?.discountPct), 0), 100);

  const base = qty * unitPrice;
  const discountAmt = (base * discountPct) / 100;
  const amount = base - discountAmt;

  const cgst = num(line?.cgst);
  const sgst = num(line?.sgst);
  const igst = num(line?.igst);
  const taxPct = cgst + sgst + igst;

  const taxAmt = (amount * taxPct) / 100;
  const total = amount + taxAmt;

  return { qty, unitPrice, base, discountPct, discountAmt, amount, taxPct, taxAmt, total };
}

function detectStatus(q) {
  // backend may provide status; otherwise infer
  const s = (q?.status || q?.state || "").toString().toLowerCase();
  if (s) return s;
  if (q?.convertedToOrder) return "converted";
  if (q?.isCancelled) return "cancelled";
  // if expired
  if (q?.validUntil) {
    const vu = new Date(q.validUntil);
    if (!Number.isNaN(vu.getTime()) && vu.getTime() < Date.now()) return "expired";
  }
  return "draft";
}

function statusBadge(status) {
  const s = String(status || "draft").toLowerCase();
  if (s === "converted") return "bg-green-100 text-green-700 hover:bg-green-100";
  if (s === "sent") return "bg-blue-100 text-blue-700 hover:bg-blue-100";
  if (s === "approved") return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  if (s === "rejected") return "bg-red-100 text-red-700 hover:bg-red-100";
  if (s === "cancelled") return "bg-gray-200 text-gray-700 hover:bg-gray-200";
  if (s === "expired") return "bg-amber-100 text-amber-700 hover:bg-amber-100";
  return "bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10";
}

export default function QuotationDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [quote, setQuote] = useState(null);
  const [customer, setCustomer] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Quick notes / internal memo
  const [internalNote, setInternalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const status = useMemo(() => detectStatus(quote), [quote]);

  const lines = useMemo(() => {
    const arr = quote?.lines || quote?.items || [];
    return Array.isArray(arr) ? arr : [];
  }, [quote]);

  const totals = useMemo(() => {
    // Prefer backend totals, but compute if missing
    const t = quote?.totals || {};
    const has = ["subTotal", "discountTotal", "taxTotal", "grandTotal"].some((k) => t?.[k] != null);

    if (has) {
      return {
        subTotal: num(t.subTotal),
        discountTotal: num(t.discountTotal),
        taxTotal: num(t.taxTotal),
        grandTotal: num(t.grandTotal),
      };
    }

    let subTotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    for (const l of lines) {
      const c = calcLine(l);
      subTotal += c.base;
      discountTotal += c.discountAmt;
      taxTotal += c.taxAmt;
      grandTotal += c.total;
    }
    return { subTotal, discountTotal, taxTotal, grandTotal };
  }, [quote, lines]);

  const pcb = quote?.pcb || quote?.pcbSpec || quote?.spec || {};

  const load = async () => {
    setLoading(true);
    try {
      const res = await quotationsService.getById(id);
      const q = res?.data?.data ?? res?.data ?? null;
      setQuote(q);
      setInternalNote(q?.internalNote || q?.notes?.internal || "");

      const cId = q?.customerId || q?.customer?.id || q?.customer?._id;
      if (cId) {
        try {
          const cRes = await customersService.getById(cId);
          const c = cRes?.data?.data ?? cRes?.data ?? null;
          setCustomer(c);
        } catch {
          // fallback if quote contains embedded customer
          setCustomer(q?.customer || null);
        }
      } else {
        setCustomer(q?.customer || null);
      }
    } catch (err) {
      toast({
        title: "Failed to load quotation",
        description: err?.response?.data?.message || "Unable to fetch quotation details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
      toast({ title: "Updated", description: "Quotation refreshed." });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyQuoteNo = async () => {
    const text = quote?.quoteNo || quote?.number || `QUO-${id}`;
    try {
      await navigator.clipboard.writeText(String(text));
      toast({ title: "Copied", description: "Quotation number copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Unable to access clipboard.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await quotationsService.remove(id);
      toast({ title: "Deleted", description: "Quotation removed successfully." });
      navigate("/sales/quotations", { replace: true });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete quotation.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const saveInternalNote = async () => {
    setSavingNote(true);
    try {
      // Prefer a dedicated endpoint if you have one; fallback to update()
      if (typeof quotationsService.updateNote === "function") {
        await quotationsService.updateNote(id, { internalNote });
      } else {
        await quotationsService.update(id, { internalNote });
      }
      toast({ title: "Saved", description: "Internal note updated." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Unable to save internal note.",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handlePrint = () => {
    // If you have a dedicated print route, use it. Otherwise use browser print.
    // navigate(`/sales/quotations/${id}/print`)
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      if (typeof quotationsService.downloadPdf !== "function") {
        toast({
          title: "Not available",
          description: "PDF download API not configured yet.",
          variant: "destructive",
        });
        return;
      }
      await quotationsService.downloadPdf(id); // implement file download in service
    } catch (err) {
      toast({
        title: "Download failed",
        description: err?.response?.data?.message || "Unable to download PDF.",
        variant: "destructive",
      });
    }
  };

  const handleSendToCustomer = async () => {
    try {
      if (typeof quotationsService.sendToCustomer !== "function") {
        toast({
          title: "Not available",
          description: "Send action API not configured yet.",
          variant: "destructive",
        });
        return;
      }
      await quotationsService.sendToCustomer(id);
      toast({ title: "Sent", description: "Quotation sent to customer." });
      await load();
    } catch (err) {
      toast({
        title: "Send failed",
        description: err?.response?.data?.message || "Unable to send quotation.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToSO = async () => {
    try {
      if (typeof quotationsService.convertToSalesOrder !== "function") {
        toast({
          title: "Not available",
          description: "Conversion API not configured yet.",
          variant: "destructive",
        });
        return;
      }
      const res = await quotationsService.convertToSalesOrder(id);
      const so = res?.data?.data ?? res?.data ?? null;
      toast({ title: "Converted", description: "Quotation converted to Sales Order." });
      const soId = pickId(so) || so?.salesOrderId;
      if (soId) navigate(`/dashboard/sales/orders/${soId}`);
      else navigate(`/dashboard/sales/orders`);
    } catch (err) {
      toast({
        title: "Convert failed",
        description: err?.response?.data?.message || "Unable to convert to Sales Order.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading quotation…
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/sales/quotations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Quotation not found</CardTitle>
            <CardDescription>The requested quotation does not exist or you don’t have access.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const quoteNo = quote?.quoteNo || quote?.number || `QUO-${id}`;
  const quoteDate = quote?.quoteDate || quote?.date || quote?.createdAt;
  const validUntil = quote?.validUntil || quote?.expiryDate;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/sales/quotations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quotations
              </Link>
            </Button>
            <Badge className={statusBadge(status)}>{String(status).toUpperCase()}</Badge>
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">PCBXpress</Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{quoteNo}</h1>
            <Button variant="ghost" size="sm" onClick={copyQuoteNo} className="text-gray-600 hover:bg-gray-100">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>

          <p className="mt-1 text-sm text-gray-600">
            Quote Date: <span className="font-medium text-gray-800">{safeDate(quoteDate)}</span> • Valid Until:{" "}
            <span className="font-medium text-gray-800">{safeDate(validUntil)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>

          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>

          <Button variant="outline" onClick={handleSendToCustomer}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>

          <Button className="bg-[#dc2551] hover:bg-[#B02045]" onClick={handleConvertToSO}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Convert to Sales Order
          </Button>

          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <User2 className="h-5 w-5 text-gray-600" />
                Customer
              </CardTitle>
              <CardDescription>Billing/contact information used for this quotation.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Customer Name</p>
                <p className="font-semibold text-gray-900">{customer?.name || quote?.customer?.name || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-800">{customer?.email || quote?.customer?.email || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-800">{customer?.phone || quote?.customer?.phone || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">GSTIN</p>
                <p className="text-sm text-gray-800">{customer?.gstin || quote?.customer?.gstin || "—"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-800">
                  {customer?.addressLine1 ||
                    quote?.customer?.addressLine1 ||
                    customer?.address ||
                    quote?.customer?.address ||
                    "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* PCB Spec */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                PCB Specification
              </CardTitle>
              <CardDescription>Quote-level build parameters (for costing and confirmation).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Spec label="Job / Project" value={pcb?.jobName || quote?.jobName} />
              <Spec label="Board Type" value={pcb?.boardType} />
              <Spec label="Layers" value={pcb?.layerCount} />
              <Spec label="Thickness" value={pcb?.thickness} />
              <Spec label="Copper Weight" value={pcb?.copperWeight} />
              <Spec label="Surface Finish" value={pcb?.surfaceFinish} />
              <Spec label="Solder Mask" value={pcb?.solderMask} />
              <Spec label="Silkscreen" value={pcb?.silkscreen} />
              <Spec label="Impedance Control" value={pcb?.impedanceControl} />
              <Spec label="Via Type" value={pcb?.viaType} />
              <Spec label="Panelization" value={pcb?.panelization} />
              <Spec label="RFQ Ref" value={quote?.rfqRef} />
              <Spec label="Incoterms" value={quote?.incoterms} />
              <Spec label="Lead Time" value={quote?.leadTime} />
              <Spec label="Payment Terms" value={quote?.paymentTerms} />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Pricing breakdown including discount and GST.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                      <th className="p-2">#</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">HSN</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit</th>
                      <th className="p-2 text-right">Disc%</th>
                      <th className="p-2 text-right">GST%</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => {
                      const c = calcLine(l);
                      return (
                        <tr key={l?.id || i} className="border-b last:border-b-0">
                          <td className="p-2 text-gray-500">{i + 1}</td>
                          <td className="p-2">
                            <p className="font-semibold text-gray-900">{l?.description || "—"}</p>
                            {l?.spec ? <p className="text-xs text-gray-500">{l.spec}</p> : null}
                          </td>
                          <td className="p-2 text-gray-700">{l?.hsn || "—"}</td>
                          <td className="p-2 text-right text-gray-800">{c.qty}</td>
                          <td className="p-2 text-right text-gray-800">{INR(c.unitPrice)}</td>
                          <td className="p-2 text-right text-gray-800">{c.discountPct}%</td>
                          <td className="p-2 text-right text-gray-800">{c.taxPct}%</td>
                          <td className="p-2 text-right font-extrabold text-gray-900">{INR(c.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {lines.map((l, i) => {
                  const c = calcLine(l);
                  return (
                    <div key={l?.id || i} className="rounded-2xl border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-500">#{i + 1}</p>
                          <p className="font-semibold text-gray-900">{l?.description || "—"}</p>
                          {l?.spec ? <p className="mt-1 text-xs text-gray-500">{l.spec}</p> : null}
                        </div>
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{INR(c.total)}</Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <Mini label="HSN" value={l?.hsn || "—"} />
                        <Mini label="Qty" value={String(c.qty)} />
                        <Mini label="Unit" value={INR(c.unitPrice)} />
                        <Mini label="Disc" value={`${c.discountPct}%`} />
                        <Mini label="GST" value={`${c.taxPct}%`} />
                        <Mini label="Tax" value={INR(c.taxAmt)} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Totals</p>
                    <p className="text-xs text-gray-500">Subtotal − Discount + GST = Grand Total</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-right text-sm sm:grid-cols-4">
                    <Tot label="Subtotal" value={INR(totals.subTotal)} />
                    <Tot label="Discount" value={INR(totals.discountTotal)} />
                    <Tot label="GST" value={INR(totals.taxTotal)} />
                    <Tot label="Grand Total" value={INR(totals.grandTotal)} strong />
                  </div>
                </div>
              </div>

              {quote?.remarks ? (
                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-semibold text-gray-900">Remarks</p>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{quote.remarks}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Right / Side */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage quotation workflow.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Button asChild variant="outline">
                <Link to={`/dashboard/sales/quotations/${id}/edit`}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Quotation
                </Link>
              </Button>

              <Button variant="outline" onClick={handleSendToCustomer}>
                <Mail className="mr-2 h-4 w-4" />
                Email to Customer
              </Button>

              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>

              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              <Button className="bg-[#dc2551] hover:bg-[#B02045]" onClick={handleConvertToSO}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Convert to Sales Order
              </Button>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Meta
              </CardTitle>
              <CardDescription>Reference + tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Meta label="Quotation No." value={quoteNo} onCopy={copyQuoteNo} />
              <Meta label="Created At" value={safeDate(quote?.createdAt || quoteDate)} />
              <Meta label="Updated At" value={safeDate(quote?.updatedAt)} />
              <Meta label="Currency" value={quote?.currency || "INR"} />
              <Meta label="Status" value={String(status).toUpperCase()} badge />
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Visible only to your team (not printed on customer quote).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Example: Customer needs delivery by Friday, confirm ENIG availability…"
                  rows={6}
                />
              </div>
              <Button
                variant="outline"
                onClick={saveInternalNote}
                disabled={savingNote}
                className="w-full"
              >
                {savingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Save Note
              </Button>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="overflow-hidden border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Quotation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{quoteNo}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print styles */}
      <style>{`
        @media print {
          header, aside, .no-print { display: none !important; }
          body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </motion.div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value ?? value === 0 ? String(value) : "—"}</p>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-xs font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Tot({ label, value, strong }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cx("font-semibold text-gray-900", strong && "text-lg font-extrabold")}>{value}</p>
    </div>
  );
}

function Meta({ label, value, badge, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {badge ? (
          <Badge className="mt-1 bg-gray-100 text-gray-700 hover:bg-gray-100">{value}</Badge>
        ) : (
          <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
        )}
      </div>
      {onCopy ? (
        <Button variant="ghost" size="sm" onClick={onCopy} className="text-gray-600 hover:bg-gray-100">
          <Copy className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

/**
 * EXPECTED SERVICES
 * -------------------------------------------------------
 * src/services/sales/quotations.service.js
 *  - getById(id)                 // GET  /sales/quotations/:id
 *  - remove(id)                  // DELETE /sales/quotations/:id
 *  - update(id, payload)         // PATCH /sales/quotations/:id   (optional)
 *  - updateNote(id, payload)     // PATCH /sales/quotations/:id/note (optional)
 *  - downloadPdf(id)             // GET /sales/quotations/:id/pdf (optional; file download)
 *  - sendToCustomer(id)          // POST /sales/quotations/:id/send (optional)
 *  - convertToSalesOrder(id)     // POST /sales/quotations/:id/convert (optional)
 *
 * src/services/sales/customers.service.js
 *  - getById(id)                 // GET  /sales/customers/:id
 *
 * ROUTES (example)
 * -------------------------------------------------------
 * /sales/quotations/:id          -> QuotationDetails.jsx
 * /sales/quotations/:id/edit     -> QuotationEdit.jsx (next if you want)
 * /sales/quotations/:id/print    -> QuotationPrint.jsx (optional)
 */
