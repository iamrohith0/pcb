// src/pages/sales/orders/SalesOrderEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  CalendarDays,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

import salesOrdersApi from "@/services/sales/salesOrders.service";
import customersApi from "@/services/sales/customers.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function money(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v : 0;
}

function fmtDate(d) {
  if (!d) return "";
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    return x.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function normalizeOrderPayload(order) {
  // maps backend fields into UI-friendly editable form state
  const orderNo = order?.order_no || order?.orderNo || "";
  const orderDate = fmtDate(order?.order_date || order?.orderDate);
  const status = order?.status || "Draft";

  const customerId =
    order?.customer?.id ||
    order?.customer_id ||
    order?.customerId ||
    "";

  const customerName =
    order?.customer?.name ||
    order?.customer_name ||
    order?.customerName ||
    "";

  const poNumber = order?.po?.number || order?.po_number || order?.poNumber || "";
  const poDate = fmtDate(order?.po?.date || order?.po_date || order?.poDate);

  const jobName = order?.job?.name || order?.job_name || order?.jobName || "";
  const priority = order?.job?.priority || order?.priority || "Normal";
  const requestedDelivery = fmtDate(
    order?.job?.requested_delivery || order?.requested_delivery || order?.requestedDelivery
  );

  const contactName = order?.contact?.name || order?.contact_name || "";
  const contactPhone = order?.contact?.phone || order?.contact_phone || "";
  const contactEmail = order?.contact?.email || order?.contact_email || "";

  const shippingAddress =
    order?.addresses?.shipping || order?.shipping_address || "";
  const billingAddress =
    order?.addresses?.billing || order?.billing_address || "";

  const notes = order?.notes || "";

  const rawLines = order?.items || order?.lines || [];
  const lines = Array.isArray(rawLines)
    ? rawLines.map((it) => ({
        id: it.id || undefined,
        sku: it.sku || "",
        description: it.description || "",
        qty: Number(it.qty || 0),
        uom: it.uom || "pcs",
        unitPrice: money(it.unit_price ?? it.unitPrice ?? 0),
        taxPct: money(it.tax_pct ?? it.taxPct ?? 0),
        leadTimeDays: Number(it.lead_time_days ?? it.leadTimeDays ?? 0),
      }))
    : [];

  return {
    orderNo,
    orderDate,
    status,
    customerId,
    customerName,
    poNumber,
    poDate,
    jobName,
    priority,
    requestedDelivery,
    contactName,
    contactPhone,
    contactEmail,
    shippingAddress,
    billingAddress,
    notes,
    lines,
  };
}

function buildUpdatePayload(form) {
  // backend-friendly payload (safe generic)
  return {
    order_no: form.orderNo,
    order_date: form.orderDate || null,
    status: form.status,
    customer_id: form.customerId || null,
    customer_name: form.customerName || null,

    po_number: form.poNumber || null,
    po_date: form.poDate || null,

    job_name: form.jobName || null,
    priority: form.priority || "Normal",
    requested_delivery: form.requestedDelivery || null,

    contact_name: form.contactName || null,
    contact_phone: form.contactPhone || null,
    contact_email: form.contactEmail || null,

    shipping_address: form.shippingAddress || null,
    billing_address: form.billingAddress || null,

    notes: form.notes || null,

    items: (form.lines || []).map((it) => ({
      id: it.id,
      sku: it.sku,
      description: it.description,
      qty: Number(it.qty || 0),
      uom: it.uom || "pcs",
      unit_price: Number(it.unitPrice || 0),
      tax_pct: Number(it.taxPct || 0),
      lead_time_days: Number(it.leadTimeDays || 0),
    })),
  };
}

function calcTotals(lines) {
  const rows = (lines || []).map((it) => {
    const qty = Number(it.qty || 0);
    const unit = Number(it.unitPrice || 0);
    const taxPct = Number(it.taxPct || 0);
    const base = qty * unit;
    const tax = (base * taxPct) / 100;
    return { base, tax, total: base + tax };
  });

  return {
    sub: rows.reduce((a, r) => a + r.base, 0),
    tax: rows.reduce((a, r) => a + r.tax, 0),
    grand: rows.reduce((a, r) => a + r.total, 0),
  };
}

export default function SalesOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [order, setOrder] = useState(null);
  const [customers, setCustomers] = useState([]);

  const [deleteLineOpen, setDeleteLineOpen] = useState(false);
  const [deleteLineIndex, setDeleteLineIndex] = useState(-1);

  const [form, setForm] = useState(() => ({
    orderNo: "",
    orderDate: "",
    status: "Draft",
    customerId: "",
    customerName: "",
    poNumber: "",
    poDate: "",
    jobName: "",
    priority: "Normal",
    requestedDelivery: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    shippingAddress: "",
    billingAddress: "",
    notes: "",
    lines: [],
  }));

  const totals = useMemo(() => calcTotals(form.lines), [form.lines]);

  const fetchCustomers = async () => {
    try {
      const res = await customersApi.list?.({ page: 1, limit: 200 });
      const rows = res?.data?.items ?? res?.data?.data ?? res?.data ?? [];
      setCustomers(Array.isArray(rows) ? rows : []);
    } catch {
      // Non-blocking
      setCustomers([]);
    }
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await salesOrdersApi.getById(id);
      const data = res?.data?.order ?? res?.data ?? null;
      setOrder(data);

      const normalized = normalizeOrderPayload(data || {});
      setForm(normalized);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load Sales Order.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const setLine = (idx, patch) =>
    setForm((p) => {
      const next = [...(p.lines || [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...p, lines: next };
    });

  const addLine = () => {
    setForm((p) => ({
      ...p,
      lines: [
        ...(p.lines || []),
        { sku: "", description: "", qty: 1, uom: "pcs", unitPrice: 0, taxPct: 18, leadTimeDays: 0 },
      ],
    }));
  };

  const requestRemoveLine = (idx) => {
    setDeleteLineIndex(idx);
    setDeleteLineOpen(true);
  };

  const confirmRemoveLine = () => {
    setForm((p) => {
      const next = [...(p.lines || [])];
      next.splice(deleteLineIndex, 1);
      return { ...p, lines: next };
    });
    setDeleteLineOpen(false);
    setDeleteLineIndex(-1);
  };

  const onCustomerSelect = (customerId) => {
    const found = customers.find((c) => String(c.id) === String(customerId));
    setForm((p) => ({
      ...p,
      customerId,
      customerName: found?.name || found?.company_name || p.customerName,
      contactName: found?.contact_name || p.contactName,
      contactPhone: found?.phone || found?.mobile || p.contactPhone,
      contactEmail: found?.email || p.contactEmail,
      billingAddress: found?.billing_address || p.billingAddress,
      shippingAddress: found?.shipping_address || p.shippingAddress,
    }));
  };

  const validate = () => {
    if (!form.customerId && !form.customerName) return "Select a customer (or enter customer name).";
    if (!form.orderDate) return "Order date is required.";
    if (!form.lines?.length) return "Add at least one line item.";
    const badQty = (form.lines || []).find((l) => Number(l.qty || 0) <= 0);
    if (badQty) return "Each line must have quantity greater than 0.";
    return null;
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const error = validate();
    if (error) {
      toast({ title: "Fix required", description: error, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = buildUpdatePayload(form);
      await salesOrdersApi.update(id, payload);
      toast({ title: "Saved", description: "Sales Order updated successfully." });
      navigate(`/dashboard/sales/orders/${id}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save Sales Order.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = form.orderNo ? `Edit • ${form.orderNo}` : `Edit Sales Order #${id}`;

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
              <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">
                PCB Manufacturing ERP
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Update SO fields used for engineering intake, routing, and production scheduling.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchOrder} disabled={loading || saving}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Reload
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="border-dashed">
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Sales Order...
            </div>
          </CardContent>
        </Card>
      ) : !order ? (
        <Card className="border-dashed">
          <CardContent className="py-10">
            <p className="text-center text-sm text-gray-600">Sales Order not found.</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left (main) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-[#dc2551]" />
                  Sales Order Info
                </CardTitle>
                <CardDescription className="text-sm">
                  Core identifiers and delivery promise.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sales Order No</Label>
                  <Input
                    value={form.orderNo}
                    onChange={(e) => setField("orderNo", e.target.value)}
                    placeholder="SO-2026-00012"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    Order Date <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.orderDate}
                    onChange={(e) => setField("orderDate", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                    placeholder="Draft / Submitted / Confirmed / ..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    value={form.priority}
                    onChange={(e) => setField("priority", e.target.value)}
                    placeholder="Normal / Urgent"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Requested Delivery</Label>
                  <Input
                    type="date"
                    value={form.requestedDelivery}
                    onChange={(e) => setField("requestedDelivery", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Job / Project Name</Label>
                  <Input
                    value={form.jobName}
                    onChange={(e) => setField("jobName", e.target.value)}
                    placeholder="Customer Board Rev-A"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer + PO */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-[#dc2551]" />
                  Customer & PO
                </CardTitle>
                <CardDescription className="text-sm">
                  Customer and purchase order details (used for invoicing + dispatch).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="inline-flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Customer <span className="text-rose-600">*</span>
                  </Label>

                  {/* If your UI library has Select, replace this with Select component.
                      Keeping plain select for compatibility. */}
                  <select
                    value={form.customerId}
                    onChange={(e) => onCustomerSelect(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.company_name || `Customer #${c.id}`}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-gray-500">
                    If customer list is empty, you can still type customer name below.
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Customer Name (manual)</Label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => setField("customerName", e.target.value)}
                    placeholder="ACME Electronics Pvt Ltd"
                  />
                </div>

                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input
                    value={form.poNumber}
                    onChange={(e) => setField("poNumber", e.target.value)}
                    placeholder="PO-88912"
                  />
                </div>

                <div className="space-y-2">
                  <Label>PO Date</Label>
                  <Input
                    type="date"
                    value={form.poDate}
                    onChange={(e) => setField("poDate", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact + Addresses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact & Addresses</CardTitle>
                <CardDescription className="text-sm">
                  Used for order communication, shipping labels, and invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Contact Name
                  </Label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => setField("contactName", e.target.value)}
                    placeholder="Ravi Kumar"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Phone
                  </Label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) => setField("contactPhone", e.target.value)}
                    placeholder="+91 9XXXX XXXXX"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setField("contactEmail", e.target.value)}
                    placeholder="buyer@company.com"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Shipping Address
                  </Label>
                  <Textarea
                    value={form.shippingAddress}
                    onChange={(e) => setField("shippingAddress", e.target.value)}
                    placeholder="Line 1, Area, City, State, PIN"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Billing Address
                  </Label>
                  <Textarea
                    value={form.billingAddress}
                    onChange={(e) => setField("billingAddress", e.target.value)}
                    placeholder="Line 1, Area, City, State, PIN"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line items editor */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Line Items</CardTitle>
                    <CardDescription className="text-sm">
                      Boards / panels / stencil / assembly service lines for PCB manufacturing.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" className="gap-2" onClick={addLine}>
                    <Plus className="h-4 w-4" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!form.lines?.length ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-600">
                    No line items. Click <span className="font-semibold">Add Line</span>.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.lines.map((it, idx) => (
                      <motion.div
                        key={it.id ?? idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm font-semibold text-gray-900">
                            Line #{idx + 1}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            className="gap-2"
                            onClick={() => requestRemoveLine(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>SKU</Label>
                            <Input
                              value={it.sku}
                              onChange={(e) => setLine(idx, { sku: e.target.value })}
                              placeholder="PCB-2L-FR4"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={it.description}
                              onChange={(e) => setLine(idx, { description: e.target.value })}
                              placeholder="2-layer FR4, HASL, 1oz, 100x80mm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Qty</Label>
                            <Input
                              type="number"
                              min={1}
                              value={it.qty}
                              onChange={(e) => setLine(idx, { qty: Number(e.target.value || 0) })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>UOM</Label>
                            <Input
                              value={it.uom}
                              onChange={(e) => setLine(idx, { uom: e.target.value })}
                              placeholder="pcs / panels"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={it.unitPrice}
                              onChange={(e) => setLine(idx, { unitPrice: Number(e.target.value || 0) })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Tax %</Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={it.taxPct}
                              onChange={(e) => setLine(idx, { taxPct: Number(e.target.value || 0) })}
                            />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label>Lead Time (days)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={it.leadTimeDays}
                              onChange={(e) => setLine(idx, { leadTimeDays: Number(e.target.value || 0) })}
                            />
                          </div>
                        </div>

                        {/* Line computed */}
                        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                          <span className="text-gray-600">Line Total</span>
                          <span className="font-semibold text-gray-900">
                            ₹{" "}
                            {(
                              Number(it.qty || 0) * Number(it.unitPrice || 0) +
                              (Number(it.qty || 0) * Number(it.unitPrice || 0) * Number(it.taxPct || 0)) / 100
                            ).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="flex flex-col items-end gap-2 pt-1">
                  <div className="flex w-full max-w-sm items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">₹ {totals.sub.toFixed(2)}</span>
                  </div>
                  <div className="flex w-full max-w-sm items-center justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">₹ {totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex w-full max-w-sm items-center justify-between rounded-lg bg-[#dc2551]/5 px-3 py-2">
                    <span className="text-sm font-semibold text-gray-900">Grand Total</span>
                    <span className="text-sm font-bold text-[#dc2551]">₹ {totals.grand.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notes</CardTitle>
                <CardDescription className="text-sm">
                  Special instructions for engineering/production (impedance, finish, coupons, packaging, etc).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Example: 4-layer, ENIG, impedance controlled on L1-L2, 100% e-test, green mask, white legend..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Footer buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="ghost" className="gap-2" asChild>
                <Link to={`/dashboard/sales/orders/${id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Link>
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="submit" className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Right (summary) */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Summary</CardTitle>
                <CardDescription className="text-sm">
                  Quick snapshot before saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-medium text-gray-900">{form.customerName || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-medium text-gray-900">{form.orderDate || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Requested Delivery</span>
                  <span className="font-medium text-gray-900">{form.requestedDelivery || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lines</span>
                  <span className="font-medium text-gray-900">{form.lines?.length || 0}</span>
                </div>

                <div className="mt-2 rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Grand Total</span>
                    <span className="font-bold text-[#dc2551]">₹ {totals.grand.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  After saving, send SO to Engineering for DFM/CAM, panelization, routing and work order creation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Helpful Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/sales/customers">
                    <User className="h-4 w-4" />
                    Customers
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/dashboard/sales/orders">
                    <FileText className="h-4 w-4" />
                    Sales Orders
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Delete line confirmation */}
          <ConfirmationDialog
            open={deleteLineOpen}
            onOpenChange={setDeleteLineOpen}
            title="Remove this line item?"
            description="This will remove the selected line item from the Sales Order. You can add it again later."
            confirmText="Remove"
            confirmVariant="destructive"
            onConfirm={confirmRemoveLine}
          />
        </form>
      )}
    </div>
  );
}
