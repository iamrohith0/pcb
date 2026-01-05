// src/pages/sales/invoices/InvoiceCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Search,
  Trash2,
  IndianRupee,
  Percent,
  Truck,
  Building2,
  CheckCircle2,
  Hash,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import customersService from "@/services/sales/customers.service";
import invoicesService from "@/services/sales/invoices.service";
import salesOrdersService from "@/services/sales/orders.service"; // optional: if you have sales orders

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const INR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0
  );

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

const DEFAULTS = {
  invoiceNo: "", // optional if auto-numbering
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",

  customerId: "",
  customerSnapshot: null, // display-only

  sourceType: "DIRECT", // DIRECT | SALES_ORDER
  sourceOrderId: "",

  currency: "INR",
  placeOfSupply: "", // State name for GST

  billing: {
    name: "",
    gstin: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
  shipping: {
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },

  items: [
    {
      id: crypto.randomUUID(),
      description: "PCB Fabrication",
      hsn: "8534", // PCBs often: 8534, adjust as per your use
      qty: 1,
      uom: "Lot",
      unitPrice: 0,
      discountPct: 0,
      taxPct: 18, // GST %
    },
  ],

  charges: {
    packing: 0,
    shipping: 0,
    other: 0,
  },

  tcsPct: 0, // optional
  rounding: 0,

  notes: "",
  terms: "Goods once sold will not be taken back. Subject to jurisdiction.",
};

function sanitizePayload(form, computed) {
  const trim = (v) => (typeof v === "string" ? v.trim() : v);

  return {
    invoiceNo: trim(form.invoiceNo) || null,
    invoiceDate: form.invoiceDate,
    dueDate: form.dueDate || null,

    customerId: form.customerId,
    sourceType: form.sourceType,
    sourceOrderId: form.sourceType === "SALES_ORDER" ? form.sourceOrderId : null,

    currency: form.currency || "INR",
    placeOfSupply: trim(form.placeOfSupply) || null,

    billing: {
      name: trim(form.billing.name),
      gstin: trim(form.billing.gstin),
      addressLine1: trim(form.billing.addressLine1),
      addressLine2: trim(form.billing.addressLine2),
      city: trim(form.billing.city),
      state: trim(form.billing.state),
      pincode: trim(form.billing.pincode),
      country: trim(form.billing.country) || "India",
    },
    shipping: {
      name: trim(form.shipping.name),
      addressLine1: trim(form.shipping.addressLine1),
      addressLine2: trim(form.shipping.addressLine2),
      city: trim(form.shipping.city),
      state: trim(form.shipping.state),
      pincode: trim(form.shipping.pincode),
      country: trim(form.shipping.country) || "India",
    },

    items: form.items.map((it) => ({
      description: trim(it.description),
      hsn: trim(it.hsn) || null,
      qty: Number(it.qty || 0),
      uom: trim(it.uom) || null,
      unitPrice: Number(it.unitPrice || 0),
      discountPct: Number(it.discountPct || 0),
      taxPct: Number(it.taxPct || 0),
    })),

    charges: {
      packing: Number(form.charges.packing || 0),
      shipping: Number(form.charges.shipping || 0),
      other: Number(form.charges.other || 0),
    },

    tcsPct: Number(form.tcsPct || 0),
    rounding: Number(form.rounding || 0),

    notes: trim(form.notes) || null,
    terms: trim(form.terms) || null,

    totals: computed, // optional: keep or remove depending on backend preference
  };
}

function computeTotals(form) {
  const items = form.items || [];
  const charges = form.charges || { packing: 0, shipping: 0, other: 0 };

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

  const tcsPct = Number(form.tcsPct || 0);
  const tcs = round2(beforeTcs * (tcsPct / 100));

  const rounding = round2(Number(form.rounding || 0));

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

export default function InvoiceCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [orderQuery, setOrderQuery] = useState("");
  const [orderResults, setOrderResults] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);

  const from = useMemo(() => (location.state && location.state.from) || "/sales/invoices", [location.state]);

  const totals = useMemo(() => computeTotals(form), [form]);

  const update = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const updateItem = (id, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, [key]: value } : it)),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          description: "",
          hsn: "8534",
          qty: 1,
          uom: "Nos",
          unitPrice: 0,
          discountPct: 0,
          taxPct: 18,
        },
      ],
    }));
  };

  const removeItem = (id) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? prev.items : prev.items.filter((it) => it.id !== id),
    }));
  };

  const applyCustomer = (c) => {
    update("customerId", c.id || c._id || "");
    update("customerSnapshot", c);

    // Prefill billing/shipping from customer
    const billing = c.billing || c.address?.billing || {};
    const shipping = c.shipping || c.address?.shipping || {};

    update("billing", {
      ...form.billing,
      name: c.companyName || c.name || "",
      gstin: c.gstin || "",
      addressLine1: billing.addressLine1 || billing.line1 || "",
      addressLine2: billing.addressLine2 || billing.line2 || "",
      city: billing.city || "",
      state: billing.state || "",
      pincode: billing.pincode || "",
      country: billing.country || "India",
    });

    update("shipping", {
      ...form.shipping,
      name: c.companyName || c.name || "",
      addressLine1: shipping.addressLine1 || shipping.line1 || "",
      addressLine2: shipping.addressLine2 || shipping.line2 || "",
      city: shipping.city || "",
      state: shipping.state || "",
      pincode: shipping.pincode || "",
      country: shipping.country || "India",
    });

    // place of supply (state) default
    if (!form.placeOfSupply) update("placeOfSupply", billing.state || shipping.state || "");

    toast({ title: "Customer selected", description: `${c.companyName || c.name} applied to invoice.` });
  };

  const searchCustomers = async () => {
    const q = customerQuery.trim();
    if (!q) {
      setCustomerResults([]);
      return;
    }
    setCustomerLoading(true);
    try {
      // Expect: customersService.list({ q }) or customersService.search(q)
      const res = await customersService.list({ q, page: 1, limit: 10 });
      const data = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
      setCustomerResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setCustomerResults([]);
      toast({ title: "Customer search failed", description: "Unable to fetch customers.", variant: "destructive" });
    } finally {
      setCustomerLoading(false);
    }
  };

  const searchOrders = async () => {
    const q = orderQuery.trim();
    if (!q) {
      setOrderResults([]);
      return;
    }
    setOrderLoading(true);
    try {
      const res = await salesOrdersService.list({ q, page: 1, limit: 10 });
      const data = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
      setOrderResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrderResults([]);
      toast({ title: "Order search failed", description: "Unable to fetch sales orders.", variant: "destructive" });
    } finally {
      setOrderLoading(false);
    }
  };

  const applyOrder = (order) => {
    update("sourceType", "SALES_ORDER");
    update("sourceOrderId", order.id || order._id || "");

    // optional mapping if your order has line items
    const lines = order.items || order.lines || [];
    if (Array.isArray(lines) && lines.length) {
      const mapped = lines.map((l) => ({
        id: crypto.randomUUID(),
        description: l.description || l.name || "PCB Item",
        hsn: l.hsn || "8534",
        qty: Number(l.qty || 1),
        uom: l.uom || "Nos",
        unitPrice: Number(l.unitPrice || l.rate || 0),
        discountPct: Number(l.discountPct || 0),
        taxPct: Number(l.taxPct || 18),
      }));
      update("items", mapped);
    }

    toast({ title: "Sales Order linked", description: `Invoice will be generated from the selected order.` });
  };

  const validate = () => {
    if (!form.customerId) {
      toast({ title: "Customer required", description: "Please select a customer.", variant: "destructive" });
      return false;
    }
    if (!form.invoiceDate) {
      toast({ title: "Invoice date required", description: "Please select an invoice date.", variant: "destructive" });
      return false;
    }
    if (!form.items?.length) {
      toast({ title: "Items required", description: "Add at least one invoice item.", variant: "destructive" });
      return false;
    }
    const bad = form.items.find((it) => !String(it.description || "").trim() || Number(it.qty || 0) <= 0);
    if (bad) {
      toast({
        title: "Invalid items",
        description: "Each item must have a description and quantity > 0.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = sanitizePayload(form, totals);
      const res = await invoicesService.create(payload);

      const created = res?.data?.data ?? res?.data;
      const id = created?.id || created?._id;

      toast({
        title: "Invoice created",
        description: `${created?.invoiceNo ? `Invoice ${created.invoiceNo}` : "Invoice"} saved successfully.`,
      });

      if (id) navigate(`/sales/invoices/${id}`, { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(", ") : null) ||
        "Failed to create invoice. Please try again.";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Small UX: compute due date when payment terms exist in customer snapshot
  useEffect(() => {
    const terms = form.customerSnapshot?.credit?.paymentTermsDays;
    if (!terms || !form.invoiceDate) return;
    if (form.dueDate) return;

    const dt = new Date(form.invoiceDate);
    dt.setDate(dt.getDate() + Number(terms));
    update("dueDate", dt.toISOString().slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.customerSnapshot, form.invoiceDate]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button asChild variant="ghost" className="h-8 px-2">
              <Link to={from} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <span className="text-gray-300">/</span>
            <span className="truncate">Create Invoice</span>
          </div>

          <h1 className="mt-2 text-xl font-bold tracking-tight">New Invoice</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create invoices for PCB manufacturing jobs with GST, freight, and packing charges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to={from}>Cancel</Link>
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-[#dc2551] hover:bg-[#b02045]"
            disabled={saving}
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Create
              </span>
            )}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-5 lg:col-span-2">
            {/* Invoice meta */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  Invoice Details
                </CardTitle>
                <CardDescription>Basic invoice meta and source linking.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo">Invoice No (optional)</Label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="invoiceNo"
                      placeholder="Auto if empty"
                      value={form.invoiceNo}
                      onChange={(e) => update("invoiceNo", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={form.invoiceDate}
                      onChange={(e) => update("invoiceDate", e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => update("dueDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Source</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {["DIRECT", "SALES_ORDER"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          update("sourceType", s);
                          if (s === "DIRECT") update("sourceOrderId", "");
                        }}
                        className={cx(
                          "rounded-xl border px-3 py-1.5 text-sm transition",
                          form.sourceType === s
                            ? "border-[#dc2551]/40 bg-[#dc2551]/10 text-[#dc2551]"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {s === "DIRECT" ? "Direct" : "From Sales Order"}
                      </button>
                    ))}
                    <Badge variant="outline" className="text-[11px]">
                      {form.sourceType === "SALES_ORDER" ? "Maps items from order (if available)" : "Manual entry"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfSupply">Place of Supply (State)</Label>
                  <Input
                    id="placeOfSupply"
                    placeholder="e.g., Kerala"
                    value={form.placeOfSupply}
                    onChange={(e) => update("placeOfSupply", e.target.value)}
                  />
                </div>

                {form.sourceType === "SALES_ORDER" && (
                  <div className="md:col-span-3 space-y-2">
                    <Label>Find Sales Order</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search by order no / customer / job..."
                          value={orderQuery}
                          onChange={(e) => setOrderQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={searchOrders} disabled={orderLoading}>
                        {orderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                      </Button>
                    </div>

                    {orderResults.length > 0 && (
                      <div className="mt-2 rounded-xl border border-gray-200 bg-white">
                        <div className="max-h-52 overflow-auto p-2">
                          {orderResults.map((o) => (
                            <button
                              key={o.id || o._id}
                              type="button"
                              onClick={() => applyOrder(o)}
                              className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {o.orderNo || o.soNo || o.code || "Sales Order"}
                                  </p>
                                  <p className="truncate text-xs text-gray-500">
                                    {o.customerName || o.customer?.companyName || o.customer?.name || "Customer"} •{" "}
                                    {o.jobRef || o.reference || "—"}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-[11px]">
                                  {o.status || "OPEN"}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Customer
                </CardTitle>
                <CardDescription>Select a customer to auto-fill addresses and GST details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search customers by name, company, email..."
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={searchCustomers} disabled={customerLoading}>
                    {customerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                {form.customerSnapshot && (
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {form.customerSnapshot.companyName || form.customerSnapshot.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {form.customerSnapshot.email || "—"} • {form.customerSnapshot.phone || "—"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[11px]">
                        Selected
                      </Badge>
                    </div>
                  </div>
                )}

                {customerResults.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="max-h-52 overflow-auto p-2">
                      {customerResults.map((c) => (
                        <button
                          key={c.id || c._id}
                          type="button"
                          onClick={() => applyCustomer(c)}
                          className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {c.companyName || c.name}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {c.email || "—"} • {c.phone || "—"}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[11px]">
                              {c.status || "ACTIVE"}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label>Billing Name</Label>
                    <Input value={form.billing.name} onChange={(e) => update("billing.name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>GSTIN</Label>
                    <Input
                      value={form.billing.gstin}
                      onChange={(e) => update("billing.gstin", e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Billing Address Line 1</Label>
                    <Input value={form.billing.addressLine1} onChange={(e) => update("billing.addressLine1", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Address Line 2</Label>
                    <Input value={form.billing.addressLine2} onChange={(e) => update("billing.addressLine2", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={form.billing.city} onChange={(e) => update("billing.city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={form.billing.state} onChange={(e) => update("billing.state", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input value={form.billing.pincode} onChange={(e) => update("billing.pincode", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={form.billing.country} onChange={(e) => update("billing.country", e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="h-4 w-4" />
                    Shipping address is used for dispatch & courier.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => update("shipping", { ...form.shipping, ...form.billing, gstin: undefined })}
                  >
                    Copy Billing → Shipping
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Shipping Name</Label>
                    <Input value={form.shipping.name} onChange={(e) => update("shipping.name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Address Line 1</Label>
                    <Input value={form.shipping.addressLine1} onChange={(e) => update("shipping.addressLine1", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Address Line 2</Label>
                    <Input value={form.shipping.addressLine2} onChange={(e) => update("shipping.addressLine2", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={form.shipping.city} onChange={(e) => update("shipping.city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={form.shipping.state} onChange={(e) => update("shipping.state", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input value={form.shipping.pincode} onChange={(e) => update("shipping.pincode", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Line Items
                </CardTitle>
                <CardDescription>Add PCB fabrication / assembly / stencil / tooling items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  {form.items.map((it, idx) => {
                    const qty = Number(it.qty || 0);
                    const unit = Number(it.unitPrice || 0);
                    const base = qty * unit;
                    const disc = base * (Number(it.discountPct || 0) / 100);
                    const taxable = base - disc;
                    const tax = taxable * (Number(it.taxPct || 0) / 100);
                    const lineTotal = taxable + tax;

                    return (
                      <div key={it.id} className="rounded-2xl border border-gray-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              Item #{idx + 1}{" "}
                              <span className="ml-2 text-xs font-normal text-gray-500">
                                ({INR(round2(lineTotal))})
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">HSN, qty, tax and discount supported.</p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeItem(it.id)}
                            disabled={form.items.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Description</Label>
                            <Input
                              value={it.description}
                              onChange={(e) => updateItem(it.id, "description", e.target.value)}
                              placeholder="e.g., 4L FR4 PCB 1.6mm ENIG, panel 250x200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>HSN</Label>
                            <Input value={it.hsn} onChange={(e) => updateItem(it.id, "hsn", e.target.value)} placeholder="8534" />
                          </div>

                          <div className="space-y-2">
                            <Label>UoM</Label>
                            <Input value={it.uom} onChange={(e) => updateItem(it.id, "uom", e.target.value)} placeholder="Nos / Lot / Panel" />
                          </div>

                          <div className="space-y-2">
                            <Label>Qty</Label>
                            <Input
                              type="number"
                              min="0"
                              value={it.qty}
                              onChange={(e) => updateItem(it.id, "qty", e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <div className="relative">
                              <IndianRupee className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input
                                type="number"
                                min="0"
                                value={it.unitPrice}
                                onChange={(e) => updateItem(it.id, "unitPrice", e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Discount %</Label>
                            <div className="relative">
                              <Percent className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input
                                type="number"
                                min="0"
                                value={it.discountPct}
                                onChange={(e) => updateItem(it.id, "discountPct", e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>GST %</Label>
                            <Input
                              type="number"
                              min="0"
                              value={it.taxPct}
                              onChange={(e) => updateItem(it.id, "taxPct", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <Badge variant="outline" className="text-[11px]">
                            Base: {INR(round2(base))}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            Discount: {INR(round2(disc))}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            Taxable: {INR(round2(taxable))}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            GST: {INR(round2(tax))}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            Total: {INR(round2(lineTotal))}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button type="button" variant="outline" onClick={addItem} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-5">
            {/* Charges */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4 text-gray-500" />
                  Additional Charges
                </CardTitle>
                <CardDescription>Packing, shipping, and other job charges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Packing</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.charges.packing}
                    onChange={(e) => update("charges.packing", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.charges.shipping}
                    onChange={(e) => update("charges.shipping", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.charges.other}
                    onChange={(e) => update("charges.other", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tax extras */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  Taxes & Rounding
                </CardTitle>
                <CardDescription>Optional TCS and manual rounding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>TCS % (optional)</Label>
                  <Input type="number" min="0" value={form.tcsPct} onChange={(e) => update("tcsPct", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Rounding (+/-)</Label>
                  <Input type="number" value={form.rounding} onChange={(e) => update("rounding", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Summary
                </CardTitle>
                <CardDescription>Calculated totals (live).</CardDescription>
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
                  <span className="text-gray-900 font-semibold">Grand Total</span>
                  <span className="text-gray-900 font-semibold">{INR(totals.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes & terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes & Terms</CardTitle>
                <CardDescription>These will appear in the printed invoice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea
                    className="min-h-[90px] w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#dc2551]/40"
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="e.g., Job ref, delivery instructions, test certificates..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms</Label>
                  <textarea
                    className="min-h-[90px] w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#dc2551]/40"
                    value={form.terms}
                    onChange={(e) => update("terms", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* sticky footer for mobile submit */}
          <div className="lg:hidden">
            <div className="fixed bottom-4 left-0 right-0 z-20 px-4">
              <div className="mx-auto max-w-xl rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur">
                <Button
                  type="submit"
                  className="w-full bg-[#dc2551] hover:bg-[#b02045]"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Create Invoice"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * NOTES / EXPECTED SERVICES
 * 1) customersService.list({ q, page, limit })
 * 2) invoicesService.create(payload)
 * 3) Optional: salesOrdersService.list({ q, page, limit })
 *
 * Routes suggestion:
 * - /sales/invoices/new  -> InvoiceCreate.jsx
 * - /sales/invoices/:id  -> InvoiceDetails.jsx (later)
 */
