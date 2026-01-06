// src/pages/procurement/purchase-orders/PurchaseOrderCreate.jsx
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

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

import {
    Building2,
    CalendarDays,
    FileText,
    Loader2,
    PackageOpen,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

/**
 * PCBxpress – Purchase Order Create
 * Location: src/pages/procurement/purchase-orders/PurchaseOrderCreate.jsx
 *
 * Suggested APIs (adjust to your backend):
 *  GET  /procurement/suppliers
 *  GET  /inventory/items
 *  GET  /settings/company
 *  GET  /settings/numbering?key=PO
 *
 *  POST /procurement/purchase-orders
 *      body: {
 *        po_number, po_date, supplier_id, supplier_name,
 *        bill_to, ship_to, payment_terms, delivery_terms,
 *        currency, gst_included, remarks,
 *        lines: [{ item_id, item_code, item_name, uom, qty, unit_price, gst_percent, lead_time_days, expected_date, notes }]
 *      }
 */

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

const CURRENCY = "INR";
const UOMS = ["Kg", "Ltr", "Sqm", "Sheet", "Piece", "Pack", "Set", "Job"];

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clampInt(v, min, max, fallback) {
  const n = Math.floor(toNum(v, fallback));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
function normalizeDate(v) {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}

function emptyLine() {
  return {
    id: null,
    item_id: "",
    item_code: "",
    item_name: "",
    uom: "Piece",
    qty: 1,
    unit_price: 0,
    gst_percent: 18,
    lead_time_days: 0,
    expected_date: "",
    notes: "",
  };
}

export default function PurchaseOrderCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const [form, setForm] = useState({
    po_number: "",
    po_date: normalizeDate(new Date().toISOString()),
    supplier_id: "",
    supplier_name: "",

    bill_to: "",
    ship_to: "",
    payment_terms: "Net 30",
    delivery_terms: "EX-WORKS",
    currency: CURRENCY,
    gst_included: true,
    remarks: "",
  });

  const [lines, setLines] = useState([emptyLine()]);

  const supplierOptions = useMemo(() => {
    return suppliers.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [suppliers]);

  const itemOptions = useMemo(() => {
    return items.slice().sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [items]);

  const totals = useMemo(() => {
    const subTotal = lines.reduce((sum, l) => sum + toNum(l.qty, 0) * toNum(l.unit_price, 0), 0);
    const gstTotal = lines.reduce((sum, l) => {
      const base = toNum(l.qty, 0) * toNum(l.unit_price, 0);
      return sum + (base * toNum(l.gst_percent, 0)) / 100;
    }, 0);
    const grandTotal = subTotal + gstTotal;
    return { subTotal, gstTotal, grandTotal };
  }, [lines]);

  async function fetchMasters() {
    try {
      // Suppliers
      try {
        const s = await api.get("/procurement/suppliers");
        const list = Array.isArray(s.data?.data) ? s.data.data : Array.isArray(s.data) ? s.data : [];
        setSuppliers(
          list.map((x) => ({
            id: x.id ?? x._id ?? x.supplier_id ?? "",
            name: x.name ?? x.supplier_name ?? "Supplier",
            gstin: x.gstin ?? "",
            address: x.address ?? "",
            email: x.email ?? "",
            phone: x.phone ?? "",
          }))
        );
      } catch {
        setSuppliers([]);
      }

      // Items
      try {
        const i = await api.get("/inventory/items");
        const list = Array.isArray(i.data?.data) ? i.data.data : Array.isArray(i.data) ? i.data : [];
        setItems(
          list.map((x) => ({
            id: x.id ?? x._id ?? x.item_id ?? "",
            code: x.code ?? x.item_code ?? "",
            name: x.name ?? x.item_name ?? "Item",
            uom: x.uom ?? "",
            gst_percent: x.gst_percent ?? null,
            lead_time_days: x.lead_time_days ?? null,
            unit_price: x.unit_price ?? null,
          }))
        );
      } catch {
        setItems([]);
      }

      // Company addresses (optional)
      try {
        const c = await api.get("/settings/company");
        const company = c.data?.data ?? c.data?.company ?? c.data ?? null;
        const bill = company?.bill_to ?? company?.address ?? "";
        const ship = company?.ship_to ?? company?.address ?? "";
        setForm((p) => ({
          ...p,
          bill_to: p.bill_to || bill || "",
          ship_to: p.ship_to || ship || "",
        }));
      } catch {
        // ignore
      }

      // Numbering (optional)
      try {
        const n = await api.get("/settings/numbering", { params: { key: "PO" } });
        const next = n.data?.next ?? n.data?.data?.next ?? "";
        if (next) setForm((p) => ({ ...p, po_number: p.po_number || String(next) }));
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function addLine() {
    setLines((p) => [...p, emptyLine()]);
  }

  function removeLine(idx) {
    setLines((p) => p.filter((_, i) => i !== idx));
  }

  function updateLine(idx, key, value) {
    setLines((p) =>
      p.map((l, i) => {
        if (i !== idx) return l;

        const next = { ...l, [key]: value };

        next.qty = Math.max(0, toNum(next.qty, 0));
        next.unit_price = Math.max(0, toNum(next.unit_price, 0));
        next.gst_percent = Math.max(0, Math.min(100, toNum(next.gst_percent, 0)));
        next.lead_time_days = clampInt(next.lead_time_days, 0, 365, 0);
        next.expected_date = normalizeDate(next.expected_date);

        // normalize uom
        if (next.uom && !UOMS.includes(next.uom)) next.uom = "Piece";

        return next;
      })
    );
  }

  function onPickSupplier(supplierId) {
    const s = suppliers.find((x) => String(x.id) === String(supplierId));
    setField("supplier_id", supplierId);
    setField("supplier_name", s?.name || "");

    // If supplier has address, you may also prefill terms/addresses if you wish
  }

  function onPickItem(idx, itemId) {
    const it = items.find((x) => String(x.id) === String(itemId));
    updateLine(idx, "item_id", itemId);
    if (it?.code) updateLine(idx, "item_code", it.code);
    if (it?.name) updateLine(idx, "item_name", it.name);
    if (it?.uom && UOMS.includes(it.uom)) updateLine(idx, "uom", it.uom);
    if (typeof it?.gst_percent === "number") updateLine(idx, "gst_percent", it.gst_percent);
    if (typeof it?.lead_time_days === "number") updateLine(idx, "lead_time_days", it.lead_time_days);
    if (typeof it?.unit_price === "number") updateLine(idx, "unit_price", it.unit_price);
  }

  function validate() {
    if (!form.po_date) return "PO Date is required.";
    if (!form.supplier_id && !form.supplier_name) return "Please select a supplier.";
    if (!form.po_number) return "PO Number is required.";

    const validLines = lines.filter((l) => (l.item_id || l.item_name) && toNum(l.qty, 0) > 0);
    if (validLines.length === 0) return "Add at least one valid line item (item + qty).";

    for (const [i, l] of lines.entries()) {
      if (!l.item_id && !l.item_name) continue; // allow blank rows
      if (toNum(l.qty, 0) <= 0) return `Line ${i + 1}: Qty must be > 0.`;
      if (toNum(l.unit_price, 0) < 0) return `Line ${i + 1}: Unit price cannot be negative.`;
      if (!l.uom) return `Line ${i + 1}: UOM is required.`;
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      toast({ title: "Validation error", description: err, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        lines: lines
          .filter((l) => (l.item_id || l.item_name) && toNum(l.qty, 0) > 0)
          .map((l) => ({
            item_id: l.item_id || null,
            item_code: l.item_code || null,
            item_name: l.item_name || null,
            uom: l.uom,
            qty: toNum(l.qty, 0),
            unit_price: toNum(l.unit_price, 0),
            gst_percent: toNum(l.gst_percent, 0),
            lead_time_days: clampInt(l.lead_time_days, 0, 365, 0),
            expected_date: l.expected_date || null,
            notes: l.notes || null,
          })),
      };

      const res = await api.post("/procurement/purchase-orders", payload);
      const createdId = res.data?.id ?? res.data?.data?.id ?? res.data?._id ?? null;

      toast({ title: "PO created", description: `Purchase Order ${form.po_number} saved successfully.` });

      // Go to details page if you have it; otherwise navigate to list
      if (createdId) navigate(`/procurement/purchase-orders/${createdId}`);
      else navigate(`/procurement/purchase-orders`);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to create Purchase Order.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const isDirty = useMemo(() => {
    // minimal dirty check
    return (
      !!form.supplier_id ||
      !!form.supplier_name ||
      lines.some((l) => l.item_id || l.item_name || toNum(l.qty, 0) !== 1 || toNum(l.unit_price, 0) !== 0)
    );
  }, [form.supplier_id, form.supplier_name, lines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#dc2551]" />
            <h1 className="text-xl font-semibold text-gray-900">Create Purchase Order</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Create a PO for PCB raw materials, chemicals, tooling or outsourced services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => (isDirty ? setConfirmCancelOpen(true) : navigate(-1))}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save PO
          </Button>
        </div>
      </div>

      {/* PO Header */}
      <Card className="border-gray-200">
        <div className="p-5">
          {loading ? (
            <div className="text-sm text-gray-600 inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading masters…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Label>PO Number</Label>
                <Input
                  className="mt-2"
                  value={form.po_number}
                  onChange={(e) => setField("po_number", e.target.value)}
                  placeholder="PO-000123"
                />
              </div>

              <div className="md:col-span-3">
                <Label>PO Date</Label>
                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={form.po_date}
                    onChange={(e) => setField("po_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-6">
                <Label>Supplier</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  {supplierOptions.length > 0 ? (
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={form.supplier_id}
                      onChange={(e) => onPickSupplier(e.target.value)}
                    >
                      <option value="">Select supplier</option>
                      {supplierOptions.map((s) => (
                        <option key={String(s.id)} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={form.supplier_name}
                      onChange={(e) => setField("supplier_name", e.target.value)}
                      placeholder="Supplier name"
                    />
                  )}

                  <span className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 border">
                    <Building2 className="h-4 w-4" />
                    {form.supplier_name || "—"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-6">
                <Label>Bill To</Label>
                <textarea
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                  value={form.bill_to}
                  onChange={(e) => setField("bill_to", e.target.value)}
                  placeholder="Company billing address…"
                />
              </div>

              <div className="md:col-span-6">
                <Label>Ship To</Label>
                <textarea
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                  value={form.ship_to}
                  onChange={(e) => setField("ship_to", e.target.value)}
                  placeholder="Warehouse/plant delivery address…"
                />
              </div>

              <div className="md:col-span-4">
                <Label>Payment Terms</Label>
                <Input
                  className="mt-2"
                  value={form.payment_terms}
                  onChange={(e) => setField("payment_terms", e.target.value)}
                  placeholder="Net 30 / Advance / 50-50…"
                />
              </div>

              <div className="md:col-span-4">
                <Label>Delivery Terms</Label>
                <Input
                  className="mt-2"
                  value={form.delivery_terms}
                  onChange={(e) => setField("delivery_terms", e.target.value)}
                  placeholder="EX-WORKS / FOR / CIF…"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Currency</Label>
                <Input className="mt-2" value={form.currency} onChange={(e) => setField("currency", e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>GST Included</Label>
                <div className="mt-2 flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-700">Include GST</span>
                  <Switch checked={!!form.gst_included} onCheckedChange={(v) => setField("gst_included", !!v)} />
                </div>
              </div>

              <div className="md:col-span-12">
                <Label>Remarks</Label>
                <Input
                  className="mt-2"
                  value={form.remarks}
                  onChange={(e) => setField("remarks", e.target.value)}
                  placeholder="Special instructions / inspection requirement / packing…"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* PO Lines */}
      <Card className="border-gray-200">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageOpen className="h-5 w-5 text-[#dc2551]" />
              <h2 className="text-base font-semibold text-gray-900">Line Items</h2>
            </div>
            <Button variant="outline" className="gap-2" onClick={addLine} disabled={saving}>
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">UOM</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Unit Price</th>
                  <th className="py-2 pr-3">GST %</th>
                  <th className="py-2 pr-3">Lead (days)</th>
                  <th className="py-2 pr-3">Expected Date</th>
                  <th className="py-2 pr-3">Notes</th>
                  <th className="py-2 pr-0 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx} className="border-t align-top">
                    <td className="py-3 pr-3">
                      {itemOptions.length > 0 ? (
                        <select
                          className="w-96 rounded-md border px-2 py-2 text-sm"
                          value={l.item_id}
                          onChange={(e) => onPickItem(idx, e.target.value)}
                        >
                          <option value="">Select item</option>
                          {itemOptions.map((it) => (
                            <option key={String(it.id)} value={String(it.id)}>
                              {it.code ? `${it.code} — ${it.name}` : it.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            className="w-96"
                            placeholder="Item code"
                            value={l.item_code}
                            onChange={(e) => updateLine(idx, "item_code", e.target.value)}
                          />
                          <Input
                            className="w-96"
                            placeholder="Item name"
                            value={l.item_name}
                            onChange={(e) => updateLine(idx, "item_name", e.target.value)}
                          />
                        </div>
                      )}

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Item code"
                          value={l.item_code}
                          onChange={(e) => updateLine(idx, "item_code", e.target.value)}
                        />
                        <Input
                          placeholder="Item name"
                          value={l.item_name}
                          onChange={(e) => updateLine(idx, "item_name", e.target.value)}
                        />
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <select
                        className="w-28 rounded-md border px-2 py-2 text-sm"
                        value={l.uom}
                        onChange={(e) => updateLine(idx, "uom", e.target.value)}
                      >
                        {UOMS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 pr-3">
                      <Input
                        className="w-24"
                        type="number"
                        min="0"
                        step="1"
                        value={l.qty}
                        onChange={(e) => updateLine(idx, "qty", e.target.value)}
                      />
                    </td>

                    <td className="py-3 pr-3">
                      <div className="relative w-36">
                        <span className="pointer-events-none absolute left-2 top-2.5 text-xs text-gray-500">₹</span>
                        <Input
                          className="pl-6"
                          type="number"
                          min="0"
                          step="0.01"
                          value={l.unit_price}
                          onChange={(e) => updateLine(idx, "unit_price", e.target.value)}
                        />
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <Input
                        className="w-24"
                        type="number"
                        min="0"
                        step="0.1"
                        value={l.gst_percent}
                        onChange={(e) => updateLine(idx, "gst_percent", e.target.value)}
                      />
                    </td>

                    <td className="py-3 pr-3">
                      <Input
                        className="w-28"
                        type="number"
                        min="0"
                        step="1"
                        value={l.lead_time_days}
                        onChange={(e) => updateLine(idx, "lead_time_days", e.target.value)}
                      />
                    </td>

                    <td className="py-3 pr-3">
                      <Input
                        className="w-40"
                        type="date"
                        value={l.expected_date}
                        onChange={(e) => updateLine(idx, "expected_date", e.target.value)}
                      />
                    </td>

                    <td className="py-3 pr-3">
                      <Input
                        className="w-64"
                        placeholder="Notes"
                        value={l.notes}
                        onChange={(e) => updateLine(idx, "notes", e.target.value)}
                      />
                    </td>

                    <td className="py-3 pr-0">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1 || saving}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TotalBox label="Sub Total" value={totals.subTotal} />
            <TotalBox label="GST Total" value={totals.gstTotal} />
            <TotalBox label="Grand Total" value={totals.grandTotal} strong />
          </div>

          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 border">
              <span className="font-medium text-gray-700">Hint:</span> You can connect this page with Supplier Price List
              to auto-fill unit price.
            </span>
          </div>
        </div>
      </Card>

      {/* Cancel confirm */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              className="bg-cyan-600 hover:bg-cyan-500"
              onClick={() => navigate(-1)}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TotalBox({ label, value, strong = false }) {
  return (
    <Card className={cx("border-gray-200", strong && "ring-1 ring-[#dc2551]/25")}>
      <div className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={cx("mt-1 text-lg", strong ? "font-semibold text-gray-900" : "font-medium text-gray-800")}>
          ₹ {Number(value || 0).toFixed(2)}
        </p>
      </div>
    </Card>
  );
}
