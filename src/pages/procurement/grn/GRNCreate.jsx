// src/pages/procurement/grn/GRNCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

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
    ArrowLeft,
    Box,
    CalendarDays,
    ClipboardCheck,
    Hash,
    Loader2,
    PackageCheck,
    Plus,
    Receipt,
    Search,
    Trash2,
    Truck,
    Warehouse,
} from "lucide-react";

/**
 * PCBxpress – GRN Create (Goods Receipt Note)
 *
 * Backend endpoints supported (adjust if your API differs):
 * - GET  /procurement/suppliers
 * - GET  /procurement/purchase-orders?status=open
 * - GET  /procurement/purchase-orders/:id
 * - POST /procurement/grn
 *
 * Expected GRN payload (suggested):
 * {
 *   supplier_id, purchase_order_id?, grn_date, invoice_no?, invoice_date?,
 *   received_at?, warehouse_id?, remarks?, is_qc_required,
 *   items: [{ po_item_id?, item_id, uom?, ordered_qty?, received_qty, accepted_qty?, rejected_qty?, rate?, tax_percent?, batch_no?, lot_no?, expiry_date? }]
 * }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round((toNum(n, 0) + Number.EPSILON) * 100) / 100;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function GRNCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [poSearch, setPoSearch] = useState("");
  const [showPOPicker, setShowPOPicker] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    purchase_order_id: "",
    grn_date: todayISO(),
    invoice_no: "",
    invoice_date: "",
    received_at: "",
    warehouse_id: "",
    remarks: "",
    is_qc_required: true,
    items: [],
  });

  // Fetch masters
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [supRes, whRes, poRes] = await Promise.allSettled([
          api.get("/procurement/suppliers"),
          api.get("/warehouse/warehouses"),
          api.get("/procurement/purchase-orders?status=open"),
        ]);

        const sList =
          supRes.status === "fulfilled"
            ? Array.isArray(supRes.value?.data?.data)
              ? supRes.value.data.data
              : Array.isArray(supRes.value?.data)
              ? supRes.value.data
              : []
            : [];

        const wList =
          whRes.status === "fulfilled"
            ? Array.isArray(whRes.value?.data?.data)
              ? whRes.value.data.data
              : Array.isArray(whRes.value?.data)
              ? whRes.value.data
              : []
            : [];

        const pList =
          poRes.status === "fulfilled"
            ? Array.isArray(poRes.value?.data?.data)
              ? poRes.value.data.data
              : Array.isArray(poRes.value?.data)
              ? poRes.value.data
              : []
            : [];

        setSuppliers(sList);
        setWarehouses(wList);
        setPurchaseOrders(pList);
      } catch (e) {
        toast({
          title: "Failed to load GRN masters",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const supplierNameById = useMemo(() => {
    const m = new Map();
    suppliers.forEach((s) => m.set(String(s.id), s.name || s.company_name || `Supplier ${s.id}`));
    return m;
  }, [suppliers]);

  const warehouseNameById = useMemo(() => {
    const m = new Map();
    warehouses.forEach((w) => m.set(String(w.id), w.name || w.code || `Warehouse ${w.id}`));
    return m;
  }, [warehouses]);

  const filteredPOs = useMemo(() => {
    const q = poSearch.trim().toLowerCase();
    return purchaseOrders
      .filter((po) => {
        if (!q) return true;
        const hay = `${po.po_no ?? ""} ${po.number ?? ""} ${po.supplier_name ?? ""} ${po.supplier?.name ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 20);
  }, [purchaseOrders, poSearch]);

  const totals = useMemo(() => {
    const lineTotals = form.items.map((it) => {
      const qty = toNum(it.received_qty, 0);
      const rate = toNum(it.rate, 0);
      const tax = toNum(it.tax_percent, 0);
      const sub = qty * rate;
      const taxAmt = (sub * tax) / 100;
      return { sub, taxAmt, total: sub + taxAmt };
    });

    const subTotal = round2(lineTotals.reduce((a, b) => a + b.sub, 0));
    const taxTotal = round2(lineTotals.reduce((a, b) => a + b.taxAmt, 0));
    const grandTotal = round2(subTotal + taxTotal);

    return { subTotal, taxTotal, grandTotal };
  }, [form.items]);

  function updateField(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function pickPO(po) {
    // Fetch full PO details and prefill items
    try {
      setLoading(true);
      const id = po?.id;
      const res = await api.get(`/procurement/purchase-orders/${id}`);
      const data = res.data?.data ?? res.data;

      const poHeader = data?.purchase_order ?? data?.header ?? data ?? po;
      const poItems = data?.items ?? data?.lines ?? poHeader?.items ?? poHeader?.lines ?? [];

      const supplierId =
        poHeader?.supplier_id != null ? String(poHeader.supplier_id) : poHeader?.supplier?.id != null ? String(poHeader.supplier.id) : "";

      const mappedItems = (Array.isArray(poItems) ? poItems : []).map((li) => {
        const ordered = toNum(li.ordered_qty ?? li.qty ?? li.quantity ?? 0, 0);
        const pending = toNum(li.pending_qty ?? li.balance_qty ?? ordered, ordered);

        return {
          // references
          po_item_id: li.id ?? li.po_item_id ?? null,
          item_id: li.item_id ?? li.item?.id ?? null,

          // display
          item_code: li.item?.code ?? li.item_code ?? "",
          item_name: li.item?.name ?? li.item_name ?? "",
          uom: li.uom ?? li.item?.uom ?? "Nos",

          // qty
          ordered_qty: ordered,
          received_qty: pending > 0 ? pending : ordered,
          accepted_qty: pending > 0 ? pending : ordered,
          rejected_qty: 0,

          // pricing (optional)
          rate: toNum(li.rate ?? li.unit_price ?? 0, 0),
          tax_percent: toNum(li.tax_percent ?? li.gst_percent ?? 0, 0),

          // traceability (optional)
          batch_no: "",
          lot_no: "",
          expiry_date: "",
          remarks: "",
        };
      });

      setForm((p) => ({
        ...p,
        supplier_id: supplierId || p.supplier_id,
        purchase_order_id: String(poHeader?.id ?? id ?? ""),
        items: mappedItems,
      }));

      setShowPOPicker(false);

      toast({
        title: "PO linked",
        description: "Items loaded from Purchase Order. Update received quantities and save GRN.",
      });
    } catch (e) {
      toast({
        title: "Failed to load PO details",
        description: "Please try another PO or create GRN manually.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function addEmptyItem() {
    setForm((p) => ({
      ...p,
      items: [
        ...p.items,
        {
          po_item_id: null,
          item_id: null,
          item_code: "",
          item_name: "",
          uom: "Nos",
          ordered_qty: 0,
          received_qty: 0,
          accepted_qty: 0,
          rejected_qty: 0,
          rate: 0,
          tax_percent: 0,
          batch_no: "",
          lot_no: "",
          expiry_date: "",
          remarks: "",
        },
      ],
    }));
  }

  function removeItem(idx) {
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  }

  function updateItem(idx, key, val) {
    setForm((p) => ({
      ...p,
      items: p.items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)),
    }));
  }

  function autoCalcAcceptReject(idx) {
    const it = form.items[idx];
    const received = Math.max(0, toNum(it.received_qty, 0));
    const rejected = Math.max(0, toNum(it.rejected_qty, 0));
    const accepted = Math.max(0, received - rejected);
    updateItem(idx, "accepted_qty", accepted);
  }

  function validate() {
    if (!form.grn_date) return "GRN date is required.";
    if (!form.supplier_id) return "Supplier is required.";
    if (!form.warehouse_id) return "Warehouse is required.";
    if (!Array.isArray(form.items) || form.items.length === 0) return "Add at least one item.";
    for (let i = 0; i < form.items.length; i++) {
      const it = form.items[i];
      if (!String(it.item_name || it.item_code || "").trim()) return `Item #${i + 1}: Item name/code is required.`;
      const received = toNum(it.received_qty, -1);
      if (received < 0) return `Item #${i + 1}: Received qty cannot be negative.`;
      const accepted = toNum(it.accepted_qty, -1);
      const rejected = toNum(it.rejected_qty, -1);
      if (accepted < 0 || rejected < 0) return `Item #${i + 1}: Accepted/Rejected cannot be negative.`;
      if (round2(accepted + rejected) !== round2(received))
        return `Item #${i + 1}: Accepted + Rejected must equal Received.`;
    }
    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: "Fix required", description: err, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplier_id: String(form.supplier_id),
        purchase_order_id: form.purchase_order_id ? String(form.purchase_order_id) : null,
        grn_date: form.grn_date,
        invoice_no: form.invoice_no || null,
        invoice_date: form.invoice_date || null,
        received_at: form.received_at || null,
        warehouse_id: String(form.warehouse_id),
        remarks: form.remarks || null,
        is_qc_required: !!form.is_qc_required,
        totals: totals, // optional helper for backend
        items: form.items.map((it) => ({
          po_item_id: it.po_item_id ?? null,
          item_id: it.item_id ?? null,
          item_code: it.item_code || null,
          item_name: it.item_name || null,
          uom: it.uom || null,
          ordered_qty: toNum(it.ordered_qty, 0),
          received_qty: toNum(it.received_qty, 0),
          accepted_qty: toNum(it.accepted_qty, 0),
          rejected_qty: toNum(it.rejected_qty, 0),
          rate: toNum(it.rate, 0),
          tax_percent: toNum(it.tax_percent, 0),
          batch_no: it.batch_no || null,
          lot_no: it.lot_no || null,
          expiry_date: it.expiry_date || null,
          remarks: it.remarks || null,
        })),
      };

      const res = await api.post("/procurement/grn", payload);
      const created = res.data?.data ?? res.data;

      toast({
        title: "GRN created",
        description: "Goods receipt saved successfully.",
      });

      // Navigate to GRN details if route exists, else back to list
      const id = created?.id ?? created?.grn_id ?? null;
      if (id) navigate(`/procurement/grn/${id}`, { replace: true });
      else navigate("/procurement/grn", { replace: true });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create GRN. Please try again.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function requestClear() {
    setConfirmClear(true);
  }

  function clearForm() {
    setConfirmClear(false);
    setForm((p) => ({
      ...p,
      purchase_order_id: "",
      invoice_no: "",
      invoice_date: "",
      received_at: "",
      remarks: "",
      is_qc_required: true,
      items: [],
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-[#dc2551]" />
            <h1 className="text-xl font-semibold text-gray-900">Create GRN</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Record incoming materials for PCB manufacturing (laminates, copper foil, solder mask, drills, chemicals, packaging).
            Link a Purchase Order for accuracy and traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/procurement/grn">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" onClick={() => setShowPOPicker(true)} className="gap-2">
            <Receipt className="h-4 w-4" />
            Link PO
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            Save GRN
          </Button>
        </div>
      </div>

      {/* GRN Meta */}
      <Card className="border-gray-200">
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label>Supplier</Label>
              <Input
                value={form.supplier_id}
                onChange={(e) => updateField("supplier_id", e.target.value)}
                placeholder={suppliers.length ? `Enter Supplier ID (e.g., ${suppliers[0]?.id})` : "Enter Supplier ID"}
              />
              <p className="mt-1 text-xs text-gray-500">
                {form.supplier_id ? `Selected: ${supplierNameById.get(String(form.supplier_id)) ?? "—"}` : "Pick supplier (ID) or link a PO."}
              </p>
            </div>

            <div className="md:col-span-4">
              <Label>Warehouse</Label>
              <Input
                value={form.warehouse_id}
                onChange={(e) => updateField("warehouse_id", e.target.value)}
                placeholder={warehouses.length ? `Enter Warehouse ID (e.g., ${warehouses[0]?.id})` : "Enter Warehouse ID"}
              />
              <p className="mt-1 text-xs text-gray-500">
                {form.warehouse_id ? `Selected: ${warehouseNameById.get(String(form.warehouse_id)) ?? "—"}` : "Where the material is stored after receipt."}
              </p>
            </div>

            <div className="md:col-span-4">
              <Label>GRN Date</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={form.grn_date}
                  onChange={(e) => updateField("grn_date", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <Label>Invoice No (optional)</Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={form.invoice_no}
                  onChange={(e) => updateField("invoice_no", e.target.value)}
                  placeholder="Supplier invoice number"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <Label>Invoice Date (optional)</Label>
              <Input
                type="date"
                value={form.invoice_date}
                onChange={(e) => updateField("invoice_date", e.target.value)}
              />
            </div>

            <div className="md:col-span-4">
              <Label>Received At (optional)</Label>
              <div className="relative">
                <Truck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={form.received_at}
                  onChange={(e) => updateField("received_at", e.target.value)}
                  placeholder="Gate / Dock / Stores"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-8">
              <Label>Remarks (optional)</Label>
              <Input
                value={form.remarks}
                onChange={(e) => updateField("remarks", e.target.value)}
                placeholder="Any receipt notes, delivery challan ref, packaging condition, etc."
              />
            </div>

            <div className="md:col-span-4 flex items-end">
              <div className="flex w-full items-center justify-between rounded-lg border px-3 py-2">
                <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <Warehouse className="h-4 w-4 text-gray-500" />
                  QC required
                </span>
                <Switch
                  checked={form.is_qc_required}
                  onCheckedChange={(v) => updateField("is_qc_required", !!v)}
                />
              </div>
            </div>

            {form.purchase_order_id ? (
              <div className="md:col-span-12 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                Linked PO: <span className="font-semibold">{form.purchase_order_id}</span>{" "}
                <button
                  type="button"
                  onClick={requestClear}
                  className="ml-2 text-xs font-semibold text-[#dc2551] hover:underline"
                >
                  Clear PO & Items
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="border-gray-200">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-[#dc2551]" />
            <div>
              <p className="text-base font-semibold text-gray-900">Items</p>
              <p className="text-sm text-gray-600">Update received quantities, acceptance/rejection, batch/lot for traceability.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={addEmptyItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="p-5">
          {form.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm font-medium text-gray-800">No items added</p>
              <p className="mt-1 text-sm text-gray-600">Link a PO or add items manually.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => setShowPOPicker(true)} className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Link PO
                </Button>
                <Button onClick={addEmptyItem} className="gap-2 bg-cyan-600 hover:bg-cyan-500">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {form.items.map((it, idx) => (
                <div key={idx} className="rounded-2xl border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#dc2551]/10 px-2.5 py-1 text-xs font-semibold text-[#dc2551]">
                          Line {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {it.item_name || it.item_code || "Item"}
                        </span>
                        {it.uom ? <span className="text-xs text-gray-500">({it.uom})</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        PO Line: {it.po_item_id ?? "—"} · Ordered: {toNum(it.ordered_qty, 0)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <Label>Item Code</Label>
                      <Input
                        value={it.item_code}
                        onChange={(e) => updateItem(idx, "item_code", e.target.value)}
                        placeholder="e.g., LAM-FR4-1.6"
                      />
                    </div>

                    <div className="md:col-span-8">
                      <Label>Item Name</Label>
                      <Input
                        value={it.item_name}
                        onChange={(e) => updateItem(idx, "item_name", e.target.value)}
                        placeholder="e.g., FR4 Laminate 1.6mm TG150"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Received Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.received_qty}
                        onChange={(e) => {
                          updateItem(idx, "received_qty", e.target.value);
                          // keep accepted = received - rejected
                          const received = toNum(e.target.value, 0);
                          const rejected = toNum(it.rejected_qty, 0);
                          updateItem(idx, "accepted_qty", Math.max(0, received - rejected));
                        }}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Rejected Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.rejected_qty}
                        onChange={(e) => {
                          updateItem(idx, "rejected_qty", e.target.value);
                          // keep accepted = received - rejected
                          const rejected = toNum(e.target.value, 0);
                          const received = toNum(it.received_qty, 0);
                          updateItem(idx, "accepted_qty", Math.max(0, received - rejected));
                        }}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Accepted Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.accepted_qty}
                        onChange={(e) => updateItem(idx, "accepted_qty", e.target.value)}
                        onBlur={() => autoCalcAcceptReject(idx)}
                      />
                      <p className="mt-1 text-xs text-gray-500">Auto: Accepted = Received - Rejected</p>
                    </div>

                    <div className="md:col-span-3">
                      <Label>UOM</Label>
                      <Input value={it.uom} onChange={(e) => updateItem(idx, "uom", e.target.value)} />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Rate</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.rate}
                        onChange={(e) => updateItem(idx, "rate", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.tax_percent}
                        onChange={(e) => updateItem(idx, "tax_percent", e.target.value)}
                        placeholder="GST %"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Batch No (optional)</Label>
                      <Input
                        value={it.batch_no}
                        onChange={(e) => updateItem(idx, "batch_no", e.target.value)}
                        placeholder="Supplier batch"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Lot No (optional)</Label>
                      <Input
                        value={it.lot_no}
                        onChange={(e) => updateItem(idx, "lot_no", e.target.value)}
                        placeholder="Internal lot"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label>Expiry Date (optional)</Label>
                      <Input
                        type="date"
                        value={it.expiry_date}
                        onChange={(e) => updateItem(idx, "expiry_date", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-8">
                      <Label>Line Remarks (optional)</Label>
                      <Input
                        value={it.remarks}
                        onChange={(e) => updateItem(idx, "remarks", e.target.value)}
                        placeholder="QC notes, packaging issue, short/extra received, etc."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Clock className="h-4 w-4 text-gray-600" />
                    Summary
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-right text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Sub-total</p>
                      <p className="font-semibold text-gray-900">{totals.subTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tax</p>
                      <p className="font-semibold text-gray-900">{totals.taxTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Grand Total</p>
                      <p className="font-semibold text-[#dc2551]">{totals.grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Tip: Use batch/lot for chemical traceability and laminate control (important for PCB quality and recalls).
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* PO Picker Modal */}
      {showPOPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-3xl">
            <Card className="shadow-xl">
              <div className="border-b p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#dc2551]" />
                    <div>
                      <p className="text-base font-semibold text-gray-900">Link Purchase Order</p>
                      <p className="text-sm text-gray-600">Select an open PO to load supplier and items.</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setShowPOPicker(false)}>
                    Close
                  </Button>
                </div>

                <div className="mt-4">
                  <Label>Search PO</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      value={poSearch}
                      onChange={(e) => setPoSearch(e.target.value)}
                      placeholder="Search by PO number or supplier…"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-auto p-4">
                {filteredPOs.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <p className="text-sm font-medium text-gray-800">No open POs found</p>
                    <p className="mt-1 text-sm text-gray-600">Try a different keyword or create GRN manually.</p>
                  </div>
                ) : (
                  <div className="divide-y rounded-xl border">
                    {filteredPOs.map((po) => (
                      <button
                        key={po.id}
                        onClick={() => pickPO(po)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {po.po_no ?? po.number ?? `PO #${po.id}`}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600">
                            Supplier: {po.supplier_name ?? po.supplier?.name ?? supplierNameById.get(String(po.supplier_id)) ?? "—"}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#dc2551]">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Clear confirmation */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear linked PO?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the linked PO and all loaded items. You can still add items manually after clearing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearForm} className="bg-cyan-600 hover:bg-cyan-500" disabled={saving}>
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
