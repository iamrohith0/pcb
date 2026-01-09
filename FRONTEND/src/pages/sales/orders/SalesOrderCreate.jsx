// src/pages/sales/orders/SalesOrderCreate.jsx
import { motion } from "framer-motion";
import {
    ArrowLeft,
    CalendarDays,
    ClipboardList,
    FileText,
    Loader2,
    Plus,
    Save,
    Trash2,
    UploadCloud,
    User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import customersApi from "@/services/sales/customers.service";
import salesOrdersApi from "@/services/sales/salesOrders.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function money(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
}

const DEFAULT_ITEM = () => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  sku: "",
  description: "",
  qty: 1,
  uom: "pcs",
  unitPrice: 0,
  taxPct: 18,
  leadTimeDays: 7,
});

export default function SalesOrderCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Loading
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  // Masters
  const [customers, setCustomers] = useState([]);

  // Form fields
  const [orderNo, setOrderNo] = useState(""); // can be auto
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // PCB specific / order details
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [jobName, setJobName] = useState(""); // internal job / project name
  const [priority, setPriority] = useState("Normal"); // Normal/Urgent
  const [requestedDelivery, setRequestedDelivery] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Files (front-end only placeholder; backend can support multipart later)
  const [attachments, setAttachments] = useState([]);

  // Lines
  const [items, setItems] = useState([DEFAULT_ITEM()]);

  // Fetch bootstrap data
  useEffect(() => {
    let alive = true;

    (async () => {
      setBootLoading(true);
      try {
        const [cRes, nextRes] = await Promise.allSettled([
          customersApi.list?.() ?? customersApi.getAll?.() ?? customersApi.get?.(),
          salesOrdersApi.getNextNumber?.(),
        ]);

        if (!alive) return;

        if (cRes.status === "fulfilled") {
          const list = cRes.value?.data?.items ?? cRes.value?.data ?? [];
          setCustomers(Array.isArray(list) ? list : []);
        } else {
          setCustomers([]);
        }

        if (nextRes?.status === "fulfilled") {
          const next = nextRes.value?.data?.order_no || nextRes.value?.data?.next || "";
          if (next) setOrderNo(next);
        }
      } catch (e) {
        // safe noop
      } finally {
        if (alive) setBootLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // When customer changes, auto-fill basic info if available
  useEffect(() => {
    const c = customers.find((x) => String(x?.id) === String(customerId));
    if (!c) return;

    // Try common keys
    setContactName((prev) => prev || c?.contact_name || c?.contactName || c?.name || "");
    setContactPhone((prev) => prev || c?.phone || c?.mobile || "");
    setContactEmail((prev) => prev || c?.email || "");
    setShippingAddress((prev) => prev || c?.shipping_address || c?.shippingAddress || c?.address || "");
    setBillingAddress((prev) => prev || c?.billing_address || c?.billingAddress || c?.address || "");
  }, [customerId, customers]);

  const totals = useMemo(() => {
    const rows = items.map((it) => {
      const qty = Number(it.qty || 0);
      const unit = Number(it.unitPrice || 0);
      const taxPct = Number(it.taxPct || 0);
      const base = qty * unit;
      const tax = (base * taxPct) / 100;
      return { base, tax, total: base + tax };
    });

    const subTotal = rows.reduce((a, r) => a + r.base, 0);
    const taxTotal = rows.reduce((a, r) => a + r.tax, 0);
    const grandTotal = rows.reduce((a, r) => a + r.total, 0);

    return { subTotal, taxTotal, grandTotal };
  }, [items]);

  const canSubmit = useMemo(() => {
    if (!customerId) return false;
    if (!orderDate) return false;
    if (!items.length) return false;
    // At least 1 item should have description or sku and qty > 0
    return items.some((it) => (it.description?.trim() || it.sku?.trim()) && Number(it.qty || 0) > 0);
  }, [customerId, orderDate, items]);

  const addItem = () => setItems((prev) => [...prev, DEFAULT_ITEM()]);
  const removeItem = (id) => setItems((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== id)));

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildPayload = () => ({
    orderNo: orderNo || undefined,
    orderDate,
    customerId,
    contact: {
      name: contactName,
      phone: contactPhone,
      email: contactEmail,
    },
    po: {
      number: poNumber,
      date: poDate || undefined,
    },
    job: {
      name: jobName,
      priority,
      requestedDelivery: requestedDelivery || undefined,
    },
    addresses: {
      shipping: shippingAddress ? { addressLine1: shippingAddress } : null,
      billing: billingAddress ? { addressLine1: billingAddress } : null,
    },
    notes,
    items: items.map((it) => ({
      sku: it.sku,
      description: it.description,
      qty: Number(it.qty || 0),
      uom: it.uom,
      unitPrice: Number(it.unitPrice || 0),
      taxPct: Number(it.taxPct || 0),
      leadTimeDays: Number(it.leadTimeDays || 0),
    })),
    totals: {
      subTotal: Number(totals.subTotal || 0),
      taxTotal: Number(totals.taxTotal || 0),
      grandTotal: Number(totals.grandTotal || 0),
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const payload = buildPayload();

      // Save order (JSON)
      const res = await salesOrdersApi.create(payload);

      // Optional: if you later support multipart upload on backend,
      // add: salesOrdersApi.uploadAttachments(orderId, attachments)
      const createdId = res?.data?.id || res?.data?.order?.id;

      toast({
        title: "Sales Order created",
        description: "Order saved successfully. You can now proceed to engineering / CAM intake.",
      });

      if (createdId) {
        navigate(`/dashboard/sales/orders/${createdId}`, { replace: true });
      } else {
        navigate(`/dashboard/sales/orders`, { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create Sales Order. Please try again.";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Sales Order</h1>
            <p className="text-sm text-gray-500">
              PCBxpress • Sales → Orders • Capture PO + job details for PCB manufacturing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || loading || bootLoading}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Order
          </Button>
        </div>
      </div>

      {bootLoading ? (
        <Card className="border-dashed">
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading masters...
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Order meta */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-[#dc2551]" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sales Order No.</Label>
                  <Input
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    placeholder="Auto / Manual (e.g. SO-2026-0012)"
                  />
                  <p className="text-xs text-gray-500">
                    If blank, backend can auto-generate based on numbering rules.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Customer</Label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className={cx(
                      "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                      "focus:ring-2 focus:ring-[#dc2551]/25"
                    )}
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.company_name || c.companyName || `Customer #${c.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Customer PO reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label>PO Date</Label>
                  <Input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Job / Project Name</Label>
                  <Input
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="e.g. Power Supply Board Rev-A"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={cx(
                      "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                      "focus:ring-2 focus:ring-[#dc2551]/25"
                    )}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Requested Delivery Date</Label>
                  <Input
                    type="date"
                    value={requestedDelivery}
                    onChange={(e) => setRequestedDelivery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-[#dc2551]" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Person name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91..." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="mail@domain.com" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Addresses + Notes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-[#dc2551]" />
                  Addresses & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <Textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Shipping address"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Textarea
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Billing address"
                    rows={4}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Internal Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special packaging, compliance notes (RoHS), stackup constraints, delivery instructions..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UploadCloud className="h-4 w-4 text-[#dc2551]" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">PO / Specs / Notes (optional)</Label>
                  <div className="mt-2">
                    <Input type="file" multiple onChange={onPickFiles} />
                  </div>
                </div>

                {attachments?.length ? (
                  <div className="space-y-2">
                    {attachments.map((f, idx) => (
                      <div
                        key={`${f.name}-${idx}`}
                        className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm"
                      >
                        <span className="truncate pr-2">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                          aria-label="Remove attachment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Add Gerber / BOM / fabrication notes later in Engineering → CAM.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Order Line Items</CardTitle>
                <Button type="button" variant="outline" onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="hidden grid-cols-12 gap-3 text-xs font-semibold text-gray-500 sm:grid">
                <div className="col-span-2">SKU</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-1">UOM</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">Tax %</div>
                <div className="col-span-1 text-right">Lead (days)</div>
                <div className="col-span-1 text-right">Amount</div>
              </div>

              {items.map((it) => {
                const qty = Number(it.qty || 0);
                const unit = Number(it.unitPrice || 0);
                const base = qty * unit;
                const tax = (base * Number(it.taxPct || 0)) / 100;
                const total = base + tax;

                return (
                  <motion.div
                    key={it.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border bg-white p-3"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-2">
                        <Label className="sm:hidden">SKU</Label>
                        <Input
                          value={it.sku}
                          onChange={(e) => updateItem(it.id, { sku: e.target.value })}
                          placeholder="SKU / Part"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="sm:hidden">Description</Label>
                        <Input
                          value={it.description}
                          onChange={(e) => updateItem(it.id, { description: e.target.value })}
                          placeholder="PCB / Assembly / Stencil..."
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Label className="sm:hidden">Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          value={it.qty}
                          onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                          className="sm:text-right"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Label className="sm:hidden">UOM</Label>
                        <select
                          value={it.uom}
                          onChange={(e) => updateItem(it.id, { uom: e.target.value })}
                          className={cx(
                            "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                            "focus:ring-2 focus:ring-[#dc2551]/25"
                          )}
                        >
                          <option value="pcs">pcs</option>
                          <option value="panels">panels</option>
                          <option value="sets">sets</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="sm:hidden">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(it.id, { unitPrice: e.target.value })}
                          className="sm:text-right"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Label className="sm:hidden">Tax %</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.taxPct}
                          onChange={(e) => updateItem(it.id, { taxPct: e.target.value })}
                          className="sm:text-right"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Label className="sm:hidden">Lead (days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={it.leadTimeDays}
                          onChange={(e) => updateItem(it.id, { leadTimeDays: e.target.value })}
                          className="sm:text-right"
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-end justify-between gap-2 sm:flex-col sm:items-end">
                        <div className="w-full">
                          <Label className="sm:hidden">Amount</Label>
                          <div className="h-10 w-full rounded-md bg-gray-50 px-3 text-right text-sm leading-10 text-gray-800">
                            ₹ {money(total)}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeItem(it.id)}
                          className="mt-0 sm:mt-2 text-gray-500 hover:bg-gray-100"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Totals */}
              <div className="flex flex-col items-end gap-2 border-t pt-4">
                <div className="flex w-full max-w-sm items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">₹ {money(totals.subTotal)}</span>
                </div>
                <div className="flex w-full max-w-sm items-center justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">₹ {money(totals.taxTotal)}</span>
                </div>
                <div className="flex w-full max-w-sm items-center justify-between rounded-lg bg-[#dc2551]/5 px-3 py-2">
                  <span className="text-sm font-semibold text-gray-900">Grand Total</span>
                  <span className="text-sm font-bold text-[#dc2551]">₹ {money(totals.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Sales Order
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
