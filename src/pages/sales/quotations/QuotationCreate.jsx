// src/pages/sales/quotations/QuotationCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import customersService from "@/services/sales/customers.service";
import quotationsService from "@/services/sales/quotations.service";

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

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

export default function QuotationCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Customers
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const selectedCustomer = useMemo(
    () => customers.find((c) => pickId(c) === customerId) || null,
    [customers, customerId]
  );

  // Quote header
  const [quoteNo, setQuoteNo] = useState(""); // optional (backend can generate)
  const [quoteDate, setQuoteDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState(addDaysISO(14));
  const [rfqRef, setRfqRef] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [incoterms, setIncoterms] = useState("Ex-Works");
  const [leadTime, setLeadTime] = useState("7-10 working days");
  const [paymentTerms, setPaymentTerms] = useState("Advance / Net 15");
  const [remarks, setRemarks] = useState("");

  // PCB specs (quote-level)
  const [jobName, setJobName] = useState("");
  const [boardType, setBoardType] = useState("FR4");
  const [layerCount, setLayerCount] = useState(2);
  const [thickness, setThickness] = useState("1.6mm");
  const [copperWeight, setCopperWeight] = useState("1oz");
  const [surfaceFinish, setSurfaceFinish] = useState("HASL");
  const [solderMask, setSolderMask] = useState("Green");
  const [silkscreen, setSilkscreen] = useState("White");
  const [impedanceControl, setImpedanceControl] = useState("No");
  const [viaType, setViaType] = useState("Through-hole");
  const [panelization, setPanelization] = useState("None");

  // Lines
  const [lines, setLines] = useState([
    {
      id: crypto.randomUUID?.() || String(Date.now()),
      description: "PCB Fabrication",
      hsn: "8534",
      qty: 10,
      unitPrice: 0,
      discountPct: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,
      spec: "2L FR4 1.6mm HASL",
    },
  ]);

  // Load customers
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await customersService.list({ page: 1, limit: 200, q: "" });
        const arr = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
        setCustomers(Array.isArray(arr) ? arr : []);
      } catch (err) {
        toast({
          title: "Failed to load customers",
          description: err?.response?.data?.message || "Unable to fetch customers.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
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
  }, [lines]);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() || String(Date.now() + Math.random()),
        description: "Process / Service",
        hsn: "",
        qty: 1,
        unitPrice: 0,
        discountPct: 0,
        cgst: 9,
        sgst: 9,
        igst: 0,
        spec: "",
      },
    ]);
  };

  const removeLine = (id) => setLines((prev) => prev.filter((l) => l.id !== id));
  const updateLine = (id, patch) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const validate = () => {
    if (!customerId) return "Select a customer.";
    if (!quoteDate) return "Quote date is required.";
    if (!validUntil) return "Valid-until date is required.";
    if (!jobName?.trim()) return "Job/Project name is required.";
    if (!Array.isArray(lines) || lines.length === 0) return "Add at least one line item.";
    for (const l of lines) {
      if (!String(l.description || "").trim()) return "Each line needs a description.";
      if (num(l.qty) <= 0) return "Line quantity must be greater than 0.";
      if (num(l.unitPrice) < 0) return "Line unit price cannot be negative.";
      if (num(l.discountPct) < 0 || num(l.discountPct) > 100) return "Discount must be 0–100%.";
    }
    return null;
  };

  const buildPayload = () => {
    return {
      quoteNo: quoteNo || undefined,
      customerId,
      quoteDate,
      validUntil,
      rfqRef: rfqRef || null,
      currency,
      incoterms,
      leadTime,
      paymentTerms,
      remarks,

      pcb: {
        jobName,
        boardType,
        layerCount: num(layerCount),
        thickness,
        copperWeight,
        surfaceFinish,
        solderMask,
        silkscreen,
        impedanceControl,
        viaType,
        panelization,
      },

      lines: lines.map((l) => ({
        description: l.description,
        hsn: l.hsn || null,
        qty: num(l.qty),
        unitPrice: num(l.unitPrice),
        discountPct: num(l.discountPct),
        cgst: num(l.cgst),
        sgst: num(l.sgst),
        igst: num(l.igst),
        spec: l.spec || null,
      })),

      totals: {
        subTotal: totals.subTotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
      },
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errMsg = validate();
    if (errMsg) {
      toast({ title: "Check details", description: errMsg, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await quotationsService.create(payload);
      const created = res?.data?.data ?? res?.data ?? null;

      toast({
        title: "Quotation Created",
        description: `Quotation created successfully${created?.quoteNo ? ` (#${created.quoteNo})` : ""}.`,
      });

      const newId = pickId(created) || created?.quotationId || created?.id;
      if (newId) navigate(`/dashboard/sales/quotations/${newId}`, { replace: true });
      else navigate(`/dashboard/sales/quotations`, { replace: true });
    } catch (err) {
      toast({
        title: "Create failed",
        description: err?.response?.data?.message || "Unable to create quotation.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/sales/quotations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quotations
              </Link>
            </Button>
            <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">PCBXpress • Sales</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900">Create Quotation</h1>
          <p className="mt-1 text-sm text-gray-600">
            Prepare a price offer with PCB specs, taxes, discounts, and validity. Convert to Sales Order later.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={addLine}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
          <Button
            type="submit"
            form="quote-form"
            className="bg-cyan-600 hover:bg-cyan-500"
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <form id="quote-form" onSubmit={handleSave} className="space-y-6">
        {/* Customer + header */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Quotation Header
            </CardTitle>
            <CardDescription>Customer, dates, terms and reference (RFQ/Enquiry).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={cx(
                  "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                  "focus:ring-2 focus:ring-[#dc2551]/30"
                )}
                disabled={loading}
              >
                <option value="">{loading ? "Loading customers..." : "Select customer"}</option>
                {customers.map((c) => (
                  <option key={pickId(c)} value={pickId(c)}>
                    {c?.name || c?.companyName || c?.customerName || "Customer"}
                  </option>
                ))}
              </select>
              {selectedCustomer ? (
                <p className="text-xs text-gray-500">
                  GSTIN: {selectedCustomer?.gstin || "—"} • Phone: {selectedCustomer?.phone || "—"}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>RFQ Reference (optional)</Label>
              <Input value={rfqRef} onChange={(e) => setRfqRef(e.target.value)} placeholder="RFQ / Enquiry reference" />
            </div>

            <div className="space-y-2">
              <Label>Quotation No. (optional)</Label>
              <Input value={quoteNo} onChange={(e) => setQuoteNo(e.target.value)} placeholder="Auto-generated if blank" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" /> Quote Date
                </Label>
                <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Advance / Net 15" />
            </div>

            <div className="space-y-2">
              <Label>Lead Time</Label>
              <Input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="7-10 working days" />
            </div>

            <div className="space-y-2">
              <Label>Incoterms</Label>
              <select
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="Ex-Works">Ex-Works</option>
                <option value="FOB">FOB</option>
                <option value="CIF">CIF</option>
                <option value="DAP">DAP</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Remarks (optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Notes: tooling, test coupon, documentation, special packaging, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* PCB specs */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>PCB Specifications (for quote)</CardTitle>
            <CardDescription>High-level build parameters for costing and customer confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Job / Project Name</Label>
              <Input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="Example: Motor Driver PCB" />
            </div>

            <div className="space-y-2">
              <Label>Layers</Label>
              <Input type="number" min={1} value={layerCount} onChange={(e) => setLayerCount(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Board Type</Label>
              <select
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="FR4">FR4</option>
                <option value="High-Tg FR4">High-Tg FR4</option>
                <option value="Aluminum">Aluminum</option>
                <option value="Rogers">Rogers</option>
                <option value="Polyimide">Polyimide</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Thickness</Label>
              <Input value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="1.6mm" />
            </div>

            <div className="space-y-2">
              <Label>Copper Weight</Label>
              <Input value={copperWeight} onChange={(e) => setCopperWeight(e.target.value)} placeholder="1oz / 2oz" />
            </div>

            <div className="space-y-2">
              <Label>Surface Finish</Label>
              <select
                value={surfaceFinish}
                onChange={(e) => setSurfaceFinish(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="HASL">HASL</option>
                <option value="Lead Free HASL">Lead Free HASL</option>
                <option value="ENIG">ENIG</option>
                <option value="OSP">OSP</option>
                <option value="Immersion Silver">Immersion Silver</option>
                <option value="Immersion Tin">Immersion Tin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Solder Mask</Label>
              <Input value={solderMask} onChange={(e) => setSolderMask(e.target.value)} placeholder="Green / Black" />
            </div>

            <div className="space-y-2">
              <Label>Silkscreen</Label>
              <Input value={silkscreen} onChange={(e) => setSilkscreen(e.target.value)} placeholder="White / Black" />
            </div>

            <div className="space-y-2">
              <Label>Impedance Control</Label>
              <select
                value={impedanceControl}
                onChange={(e) => setImpedanceControl(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Via Type</Label>
              <select
                value={viaType}
                onChange={(e) => setViaType(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="Through-hole">Through-hole</option>
                <option value="Blind">Blind</option>
                <option value="Buried">Buried</option>
                <option value="Microvia">Microvia</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Panelization</Label>
              <select
                value={panelization}
                onChange={(e) => setPanelization(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="None">None</option>
                <option value="Customer Panel">Customer Panel</option>
                <option value="Factory Panel">Factory Panel</option>
                <option value="Step & Repeat">Step & Repeat</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Line Items & Pricing</CardTitle>
            <CardDescription>Add fabrication + process charges, discounts, and GST.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {lines.map((l, idx) => {
              const c = calcLine(l);

              return (
                <div key={l.id} className="rounded-2xl border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">#{idx + 1}</Badge>
                      <span className="text-sm font-semibold text-gray-900">{l.description || "Line Item"}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeLine(l.id)}
                      disabled={lines.length === 1}
                      title={lines.length === 1 ? "At least one line item required" : "Remove"}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={l.description}
                        onChange={(e) => updateLine(l.id, { description: e.target.value })}
                        placeholder="PCB Fabrication / AOI / E-Test"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>HSN/SAC</Label>
                      <Input value={l.hsn} onChange={(e) => updateLine(l.id, { hsn: e.target.value })} placeholder="8534" />
                    </div>

                    <div className="space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min={0}
                        value={l.qty}
                        onChange={(e) => updateLine(l.id, { qty: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min={0}
                        value={l.unitPrice}
                        onChange={(e) => updateLine(l.id, { unitPrice: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Discount %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={l.discountPct}
                        onChange={(e) => updateLine(l.id, { discountPct: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Spec / Notes</Label>
                      <Input
                        value={l.spec}
                        onChange={(e) => updateLine(l.id, { spec: e.target.value })}
                        placeholder="2L FR4 1.6mm HASL"
                      />
                    </div>

                    <div className="md:col-span-7 grid grid-cols-1 gap-3 sm:grid-cols-7">
                      <div className="space-y-2">
                        <Label>CGST %</Label>
                        <Input
                          type="number"
                          min={0}
                          value={l.cgst}
                          onChange={(e) => updateLine(l.id, { cgst: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SGST %</Label>
                        <Input
                          type="number"
                          min={0}
                          value={l.sgst}
                          onChange={(e) => updateLine(l.id, { sgst: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IGST %</Label>
                        <Input
                          type="number"
                          min={0}
                          value={l.igst}
                          onChange={(e) => updateLine(l.id, { igst: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-4 rounded-xl border bg-gray-50 p-3">
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Base</p>
                            <p className="font-semibold text-gray-900">{INR(c.base)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Discount</p>
                            <p className="font-semibold text-gray-900">{INR(c.discountAmt)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tax</p>
                            <p className="font-semibold text-gray-900">{INR(c.taxAmt)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-extrabold text-gray-900">{INR(c.total)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4">
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Totals</p>
                <p className="text-xs text-gray-500">Subtotal − Discount + GST = Grand Total</p>
              </div>

              <div className="grid grid-cols-4 gap-4 text-right text-sm">
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-semibold text-gray-900">{INR(totals.subTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Discount</p>
                  <p className="font-semibold text-gray-900">{INR(totals.discountTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">GST</p>
                  <p className="font-semibold text-gray-900">{INR(totals.taxTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Grand Total</p>
                  <p className="text-lg font-extrabold text-gray-900">{INR(totals.grandTotal)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Create Quotation
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </motion.div>
  );
}

/**
 * EXPECTED SERVICES
 * -------------------------------------------------------
 * src/services/sales/customers.service.js
 *  - list({ page, limit, q })
 *
 * src/services/sales/quotations.service.js
 *  - create(payload)  // POST /sales/quotations
 *
 * ROUTES (example)
 * -------------------------------------------------------
 * /sales/quotations            -> QuotationList.jsx
 * /sales/quotations/create     -> QuotationCreate.jsx
 * /sales/quotations/:id        -> QuotationDetails.jsx
 */
