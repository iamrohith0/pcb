// src/pages/sales/quotations/QuotationEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import quotationsService from "@/services/sales/quotations.service";
import customersService from "@/services/sales/customers.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const INR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, minV, maxV) {
  return Math.min(Math.max(n, minV), maxV);
}

function safeDateInput(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

function buildTotals(lines) {
  let subTotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  for (const l of lines) {
    const qty = num(l.qty);
    const unitPrice = num(l.unitPrice);
    const discountPct = clamp(num(l.discountPct), 0, 100);

    const base = qty * unitPrice;
    const discountAmt = (base * discountPct) / 100;
    const afterDiscount = base - discountAmt;

    const cgst = num(l.cgst);
    const sgst = num(l.sgst);
    const igst = num(l.igst);
    const taxPct = cgst + sgst + igst;

    const taxAmt = (afterDiscount * taxPct) / 100;
    const total = afterDiscount + taxAmt;

    subTotal += base;
    discountTotal += discountAmt;
    taxTotal += taxAmt;
    grandTotal += total;
  }

  return { subTotal, discountTotal, taxTotal, grandTotal };
}

const DEFAULT_LINE = () => ({
  description: "",
  spec: "",
  hsn: "8534",
  qty: 1,
  unitPrice: 0,
  discountPct: 0,
  cgst: 9,
  sgst: 9,
  igst: 0,
});

export default function QuotationEdit() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");

  // Form state
  const [quoteNo, setQuoteNo] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [rfqRef, setRfqRef] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [currency, setCurrency] = useState("INR");

  // PCB spec
  const [pcb, setPcb] = useState({
    jobName: "",
    boardType: "Rigid",
    layerCount: 2,
    thickness: "1.6mm",
    copperWeight: "1oz",
    surfaceFinish: "HASL",
    solderMask: "Green",
    silkscreen: "White",
    impedanceControl: "No",
    viaType: "Through Hole",
    panelization: "",
  });

  const [remarks, setRemarks] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [lines, setLines] = useState([DEFAULT_LINE()]);

  const totals = useMemo(() => buildTotals(lines), [lines]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 30);
    return customers
      .filter((c) => {
        const name = (c?.name || "").toLowerCase();
        const email = (c?.email || "").toLowerCase();
        const phone = (c?.phone || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      })
      .slice(0, 30);
  }, [customers, customerSearch]);

  const load = async () => {
    setLoading(true);
    try {
      // Customers for dropdown (optional)
      try {
        const cRes = await customersService.list?.({ page: 1, limit: 200 });
        const list = cRes?.data?.data || cRes?.data?.items || cRes?.data || [];
        setCustomers(Array.isArray(list) ? list : []);
      } catch {
        setCustomers([]);
      }

      const res = await quotationsService.getById(id);
      const q = res?.data?.data ?? res?.data ?? null;

      if (!q) {
        toast({ title: "Not found", description: "Quotation not found.", variant: "destructive" });
        navigate("/sales/quotations", { replace: true });
        return;
      }

      setQuoteNo(q?.quoteNo || q?.number || "");
      setQuoteDate(safeDateInput(q?.quoteDate || q?.date || q?.createdAt));
      setValidUntil(safeDateInput(q?.validUntil || q?.expiryDate));

      setCustomerId(q?.customerId || q?.customer?.id || q?.customer?._id || "");
      setRfqRef(q?.rfqRef || "");
      setIncoterms(q?.incoterms || "");
      setLeadTime(q?.leadTime || "");
      setPaymentTerms(q?.paymentTerms || "");
      setCurrency(q?.currency || "INR");

      const spec = q?.pcb || q?.pcbSpec || q?.spec || {};
      setPcb((prev) => ({
        ...prev,
        jobName: spec?.jobName || q?.jobName || "",
        boardType: spec?.boardType ?? prev.boardType,
        layerCount: spec?.layerCount ?? prev.layerCount,
        thickness: spec?.thickness ?? prev.thickness,
        copperWeight: spec?.copperWeight ?? prev.copperWeight,
        surfaceFinish: spec?.surfaceFinish ?? prev.surfaceFinish,
        solderMask: spec?.solderMask ?? prev.solderMask,
        silkscreen: spec?.silkscreen ?? prev.silkscreen,
        impedanceControl: spec?.impedanceControl ?? prev.impedanceControl,
        viaType: spec?.viaType ?? prev.viaType,
        panelization: spec?.panelization ?? prev.panelization,
      }));

      setRemarks(q?.remarks || "");
      setInternalNote(q?.internalNote || q?.notes?.internal || "");

      const items = q?.lines || q?.items || [];
      if (Array.isArray(items) && items.length) {
        setLines(
          items.map((it) => ({
            id: it?.id || it?._id,
            description: it?.description || "",
            spec: it?.spec || "",
            hsn: it?.hsn || "8534",
            qty: it?.qty ?? 1,
            unitPrice: it?.unitPrice ?? 0,
            discountPct: it?.discountPct ?? 0,
            cgst: it?.cgst ?? 9,
            sgst: it?.sgst ?? 9,
            igst: it?.igst ?? 0,
          }))
        );
      } else {
        setLines([DEFAULT_LINE()]);
      }
    } catch (err) {
      toast({
        title: "Failed to load",
        description: err?.response?.data?.message || "Unable to load quotation details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, DEFAULT_LINE()]);
  const removeLine = (idx) => setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const validate = () => {
    if (!customerId) return "Please select a customer.";
    if (!quoteDate) return "Please select quotation date.";
    if (!validUntil) return "Please select validity/expiry date.";
    if (!pcb?.layerCount || num(pcb.layerCount) <= 0) return "Layer count must be greater than 0.";
    if (!lines.length) return "Add at least one line item.";
    for (const [i, l] of lines.entries()) {
      if (!l.description?.trim()) return `Line ${i + 1}: Description is required.`;
      if (num(l.qty) <= 0) return `Line ${i + 1}: Quantity must be > 0.`;
      if (num(l.unitPrice) < 0) return `Line ${i + 1}: Unit price cannot be negative.`;
    }
    return null;
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();

    const error = validate();
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        quoteNo,
        quoteDate,
        validUntil,
        customerId,
        rfqRef,
        incoterms,
        leadTime,
        paymentTerms,
        currency,
        pcb: {
          ...pcb,
          layerCount: num(pcb.layerCount),
        },
        remarks,
        internalNote,
        lines: lines.map((l) => ({
          id: l.id,
          description: l.description,
          spec: l.spec,
          hsn: l.hsn,
          qty: num(l.qty),
          unitPrice: num(l.unitPrice),
          discountPct: clamp(num(l.discountPct), 0, 100),
          cgst: num(l.cgst),
          sgst: num(l.sgst),
          igst: num(l.igst),
        })),
        totals, // backend can ignore if it computes itself
      };

      await quotationsService.update(id, payload);
      toast({ title: "Saved", description: "Quotation updated successfully." });
      navigate(`/sales/quotations/${id}`);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Unable to save quotation.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/sales/quotations/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Link>
            </Button>
            <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">Edit</Badge>
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">PCBXpress</Badge>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">
            Edit Quotation {quoteNo ? `— ${quoteNo}` : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Update PCB specification, pricing lines, and terms. Totals are calculated live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/sales/quotations/${id}`}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Quotation Info
              </CardTitle>
              <CardDescription>Core quotation data and references.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Quotation No." hint="Optional (auto-numbering recommended)">
                <Input value={quoteNo} onChange={(e) => setQuoteNo(e.target.value)} placeholder="QUO-2026-0001" />
              </Field>

              <Field label="Quote Date">
                <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} required />
              </Field>

              <Field label="Valid Until">
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
              </Field>

              <Field label="RFQ Reference">
                <Input value={rfqRef} onChange={(e) => setRfqRef(e.target.value)} placeholder="RFQ-..." />
              </Field>

              <Field label="Incoterms">
                <Input value={incoterms} onChange={(e) => setIncoterms(e.target.value)} placeholder="EXW / FOB / CIF…" />
              </Field>

              <Field label="Lead Time">
                <Input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="7–10 working days" />
              </Field>

              <Field label="Payment Terms" className="md:col-span-2">
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="50% advance, balance before dispatch" />
              </Field>

              <Field label="Currency">
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="INR" />
              </Field>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                Customer
              </CardTitle>
              <CardDescription>Select the customer for this quotation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label>Search customer</Label>
                  <Input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name/email/phone…"
                  />
                </div>
                <div>
                  <Label>Customer</Label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    required
                  >
                    <option value="">Select customer…</option>
                    {filteredCustomers.map((c) => (
                      <option key={c?.id || c?._id} value={c?.id || c?._id}>
                        {c?.name || "Customer"} {c?.email ? `— ${c.email}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!customers.length ? (
                <p className="text-xs text-gray-500">
                  Customer list not loaded (optional). You can still save if your backend accepts customerId.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* PCB Spec */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                PCB Specification (Cost Drivers)
              </CardTitle>
              <CardDescription>These parameters influence process, yield, and pricing.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Job / Project">
                <Input value={pcb.jobName} onChange={(e) => setPcb((p) => ({ ...p, jobName: e.target.value }))} placeholder="Prototype Rev-A" />
              </Field>

              <Field label="Board Type">
                <Input value={pcb.boardType} onChange={(e) => setPcb((p) => ({ ...p, boardType: e.target.value }))} placeholder="Rigid / Flex / Rigid-Flex" />
              </Field>

              <Field label="Layers">
                <Input
                  type="number"
                  min={1}
                  value={pcb.layerCount}
                  onChange={(e) => setPcb((p) => ({ ...p, layerCount: clamp(num(e.target.value), 1, 64) }))}
                />
              </Field>

              <Field label="Thickness">
                <Input value={pcb.thickness} onChange={(e) => setPcb((p) => ({ ...p, thickness: e.target.value }))} placeholder="1.6mm" />
              </Field>

              <Field label="Copper Weight">
                <Input value={pcb.copperWeight} onChange={(e) => setPcb((p) => ({ ...p, copperWeight: e.target.value }))} placeholder="1oz / 2oz" />
              </Field>

              <Field label="Surface Finish">
                <Input value={pcb.surfaceFinish} onChange={(e) => setPcb((p) => ({ ...p, surfaceFinish: e.target.value }))} placeholder="HASL / ENIG / OSP" />
              </Field>

              <Field label="Solder Mask">
                <Input value={pcb.solderMask} onChange={(e) => setPcb((p) => ({ ...p, solderMask: e.target.value }))} placeholder="Green / Black" />
              </Field>

              <Field label="Silkscreen">
                <Input value={pcb.silkscreen} onChange={(e) => setPcb((p) => ({ ...p, silkscreen: e.target.value }))} placeholder="White" />
              </Field>

              <Field label="Impedance Control">
                <Input value={pcb.impedanceControl} onChange={(e) => setPcb((p) => ({ ...p, impedanceControl: e.target.value }))} placeholder="Yes / No" />
              </Field>

              <Field label="Via Type">
                <Input value={pcb.viaType} onChange={(e) => setPcb((p) => ({ ...p, viaType: e.target.value }))} placeholder="Through / Blind / Buried / Microvia" />
              </Field>

              <Field label="Panelization">
                <Input value={pcb.panelization} onChange={(e) => setPcb((p) => ({ ...p, panelization: e.target.value }))} placeholder="e.g., 2x3 array, V-cut" />
              </Field>
            </CardContent>
          </Card>

          {/* Lines */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add pricing lines for PCB fabrication, tooling, stencil, shipping, etc.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="outline" onClick={addLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
                <div className="rounded-2xl border bg-gray-50 px-4 py-3 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                    <Tot label="Subtotal" value={INR(totals.subTotal)} />
                    <Tot label="Discount" value={INR(totals.discountTotal)} />
                    <Tot label="GST" value={INR(totals.taxTotal)} />
                    <Tot label="Grand Total" value={INR(totals.grandTotal)} strong />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {lines.map((l, idx) => (
                  <div key={l?.id || idx} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Line #{idx + 1}</p>
                        <p className="text-sm font-semibold text-gray-900">Pricing Item</p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length === 1}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-6">
                        <Label>Description *</Label>
                        <Input
                          value={l.description}
                          onChange={(e) => updateLine(idx, { description: e.target.value })}
                          placeholder="PCB fabrication (FR4, 2L), tooling, stencil, shipping…"
                          required
                        />
                      </div>

                      <div className="md:col-span-6">
                        <Label>Spec / Notes</Label>
                        <Input
                          value={l.spec}
                          onChange={(e) => updateLine(idx, { spec: e.target.value })}
                          placeholder="e.g., 100x80mm, ENIG, 0.2mm min drill"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>HSN</Label>
                        <Input value={l.hsn} onChange={(e) => updateLine(idx, { hsn: e.target.value })} />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Qty *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={l.qty}
                          onChange={(e) => updateLine(idx, { qty: clamp(num(e.target.value), 1, 999999) })}
                          required
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.unitPrice}
                          onChange={(e) => updateLine(idx, { unitPrice: num(e.target.value) })}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Disc %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={l.discountPct}
                          onChange={(e) => updateLine(idx, { discountPct: clamp(num(e.target.value), 0, 100) })}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <Label>CGST</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={l.cgst}
                          onChange={(e) => updateLine(idx, { cgst: clamp(num(e.target.value), 0, 100) })}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <Label>SGST</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={l.sgst}
                          onChange={(e) => updateLine(idx, { sgst: clamp(num(e.target.value), 0, 100) })}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <Label>IGST</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={l.igst}
                          onChange={(e) => updateLine(idx, { igst: clamp(num(e.target.value), 0, 100) })}
                        />
                      </div>

                      <div className="md:col-span-12">
                        <div className="mt-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                          <LiveLineSummary line={l} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Remarks (optional)</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Terms, exclusions, delivery notes…"
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Internal Note (team only)</Label>
                  <Textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Internal notes for sales/engineering handoff…"
                    rows={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right / Summary */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Totals and quick save.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Tot label="Subtotal" value={INR(totals.subTotal)} />
                  <Tot label="Discount" value={INR(totals.discountTotal)} />
                  <Tot label="GST" value={INR(totals.taxTotal)} />
                  <Tot label="Grand Total" value={INR(totals.grandTotal)} strong />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500"
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Save Quotation
              </Button>

              <Button type="button" variant="outline" className="w-full" asChild>
                <Link to={`/sales/quotations/${id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Details
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Tips (PCBXpress)</CardTitle>
              <CardDescription>For accurate PCB costing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>• Include minimum track/space and drill size in the line spec if pricing differs.</p>
              <p>• For impedance builds, mention target impedance and stackup details.</p>
              <p>• Keep shipping/tooling as separate lines for clean conversion to Sales Orders.</p>
            </CardContent>
          </Card>
        </div>
      </form>
    </motion.div>
  );
}

function Field({ label, hint, children, className }) {
  return (
    <div className={cx("space-y-2", className)}>
      <div className="flex items-end justify-between gap-2">
        <Label>{label}</Label>
        {hint ? <span className="text-[11px] text-gray-500">{hint}</span> : null}
      </div>
      {children}
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

function LiveLineSummary({ line }) {
  const qty = num(line.qty);
  const unit = num(line.unitPrice);
  const discountPct = clamp(num(line.discountPct), 0, 100);

  const base = qty * unit;
  const discountAmt = (base * discountPct) / 100;
  const after = base - discountAmt;

  const cgst = num(line.cgst);
  const sgst = num(line.sgst);
  const igst = num(line.igst);
  const taxPct = cgst + sgst + igst;
  const taxAmt = (after * taxPct) / 100;

  const total = after + taxAmt;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-gray-600">
        Base: <span className="font-semibold text-gray-900">{INR(base)}</span> • Disc:{" "}
        <span className="font-semibold text-gray-900">{INR(discountAmt)}</span> • Tax:{" "}
        <span className="font-semibold text-gray-900">{INR(taxAmt)}</span>
      </span>
      <span className="font-extrabold text-gray-900">Line Total: {INR(total)}</span>
    </div>
  );
}

/**
 * EXPECTED SERVICES
 * -------------------------------------------------------
 * src/services/sales/quotations.service.js
 *  - getById(id)           // GET   /sales/quotations/:id
 *  - update(id, payload)   // PATCH /sales/quotations/:id
 *
 * src/services/sales/customers.service.js
 *  - list({page,limit})    // GET /sales/customers
 *
 * ROUTES (example)
 * -------------------------------------------------------
 * /sales/quotations/:id/edit -> QuotationEdit.jsx
 */
