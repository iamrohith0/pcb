// src/pages/inventory/lots/LotCreate.jsx
import {
    ArrowLeft,
    Barcode,
    CalendarDays,
    CheckCircle2,
    Factory,
    Hash,
    Loader2,
    PackageSearch,
    Save,
    ShieldCheck,
    Tag,
    Truck,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import inventoryItemsService from "@/services/inventory/items.service";
import lotsService from "@/services/inventory/lots.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * LotCreate.jsx (PCB Manufacturing ERP)
 * - Used for creating a lot/batch for inventory traceability (chemicals, laminates, copper foil, prepreg, soldermask, etc.)
 * - Supports: item selection, supplier, received date, expiry, quantity, CoA/CoC refs, status, notes.
 *
 * Backend expected (example):
 * - GET  /inventory/items?active=true&limit=1000  (for item dropdown)
 * - POST /inventory/lots                          (create lot)
 *
 * Adjust service functions if your endpoints differ.
 */

const LOT_STATUS = [
  { value: "QUARANTINE", label: "Quarantine" },
  { value: "RELEASED", label: "Released" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "CONSUMED", label: "Consumed" },
];

const QUALITY_GATES = [
  { value: "NONE", label: "None" },
  { value: "COA_REQUIRED", label: "CoA Required" },
  { value: "INCOMING_INSPECTION", label: "Incoming Inspection" },
  { value: "LAB_TEST", label: "Lab Test" },
];

export default function LotCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Loading states
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  // Items for dropdown
  const [items, setItems] = useState([]);

  // Form state
  const [itemId, setItemId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierLotRef, setSupplierLotRef] = useState("");
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [mfgDate, setMfgDate] = useState("");

  const [uom, setUom] = useState("");
  const [qtyReceived, setQtyReceived] = useState("");
  const [qtyAvailable, setQtyAvailable] = useState(""); // optional, can default to received
  const [warehouse, setWarehouse] = useState("");
  const [location, setLocation] = useState("");

  const [status, setStatus] = useState("QUARANTINE");
  const [qualityGate, setQualityGate] = useState("COA_REQUIRED");
  const [coaNumber, setCoaNumber] = useState("");
  const [cocNumber, setCocNumber] = useState("");

  const [notes, setNotes] = useState("");

  const selectedItem = useMemo(() => items.find((i) => String(i.id ?? i._id ?? i.item_id) === String(itemId)), [items, itemId]);

  const computedUom = useMemo(() => {
    const it = selectedItem;
    const itUom = it?.uom ?? it?.unit ?? "";
    return uom || itUom || "";
  }, [selectedItem, uom]);

  const qtyAvailDefault = useMemo(() => {
    if (qtyAvailable !== "") return qtyAvailable;
    if (qtyReceived !== "") return qtyReceived;
    return "";
  }, [qtyAvailable, qtyReceived]);

  // Fetch active items for lot creation
  useEffect(() => {
    const run = async () => {
      setLoadingItems(true);
      try {
        const res = await inventoryItemsService.list({
          active: true,
          limit: 1000,
          sort: "name:asc",
        });

        const payload = res?.data ?? {};
        const list = payload.items ?? payload.data ?? payload.results ?? [];
        setItems(Array.isArray(list) ? list : []);
      } catch (err) {
        toast({
          title: "Failed to load items",
          description: err?.response?.data?.message || err?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingItems(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    if (!itemId) return "Please select an item.";
    if (!lotNumber.trim()) return "Lot number is required.";
    if (!receivedDate) return "Received date is required.";
    if (qtyReceived === "" || Number(qtyReceived) <= 0) return "Received quantity must be greater than 0.";
    if (expiryDate && mfgDate && expiryDate < mfgDate) return "Expiry date cannot be earlier than MFG date.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast({ title: "Check the form", description: error, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        item_id: itemId,
        lot_number: lotNumber.trim(),
        supplier_name: supplierName.trim() || undefined,
        supplier_lot_ref: supplierLotRef.trim() || undefined,

        received_date: receivedDate,
        mfg_date: mfgDate || undefined,
        expiry_date: expiryDate || undefined,

        uom: computedUom || undefined,
        qty_received: Number(qtyReceived),
        qty_available: qtyAvailDefault !== "" ? Number(qtyAvailDefault) : Number(qtyReceived),

        warehouse: warehouse.trim() || undefined,
        location: location.trim() || undefined,

        status,
        quality_gate: qualityGate,
        coa_number: coaNumber.trim() || undefined,
        coc_number: cocNumber.trim() || undefined,

        notes: notes.trim() || undefined,
      };

      const res = await lotsService.create(payload);

      const created = res?.data?.lot ?? res?.data ?? null;
      const newId = created?.id ?? created?._id ?? created?.lot_id;

      toast({
        title: "Lot created",
        description: `${lotNumber.trim()} has been created successfully.`,
      });

      if (newId) navigate(`/inventory/lots/${newId}`, { replace: true });
      else navigate(`/inventory/lots`, { replace: true });
    } catch (err) {
      toast({
        title: "Create failed",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/inventory/lots" className="inline-flex items-center gap-2 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Lots
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Create</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">Create Lot</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a new lot/batch for traceability and inventory control (chemicals, laminates, prepreg, soldermask, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/inventory/lots" className="gap-2">
              <XCircle className="h-4 w-4" />
              Cancel
            </Link>
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            type="submit"
            form="lot-create-form"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Lot
          </Button>
        </div>
      </div>

      <form id="lot-create-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Main */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left: core info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-gray-600" />
                Lot Information
              </CardTitle>
              <CardDescription>Core lot fields used across purchasing, stores, QA, and production traceability.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Item */}
              <div className="space-y-2">
                <Label>Item</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <select
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      disabled={loadingItems}
                    >
                      <option value="">{loadingItems ? "Loading items..." : "Select item"}</option>
                      {items.map((it) => {
                        const id = it.id ?? it._id ?? it.item_id;
                        const name = it.name ?? "Unnamed";
                        const code = it.item_code ?? it.code ?? "";
                        const type = it.type ?? "";
                        return (
                          <option key={id} value={id}>
                            {name} {code ? `(${code})` : ""} {type ? `- ${type}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1">
                        <PackageSearch className="h-3.5 w-3.5" />
                        UOM
                      </span>
                      <span className="font-medium text-gray-900">{computedUom || "—"}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        Type
                      </span>
                      <span className="font-medium text-gray-900">{selectedItem?.type || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lot number + supplier */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lot_number">Lot Number</Label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="lot_number"
                      value={lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                      placeholder="e.g., LAM-2026-00012"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Supplier</Label>
                  <div className="relative">
                    <Truck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="supplier_name"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="e.g., Shengyi / Nan Ya / Local vendor"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_lot_ref">Supplier Lot / Batch Reference (optional)</Label>
                <Input
                  id="supplier_lot_ref"
                  value={supplierLotRef}
                  onChange={(e) => setSupplierLotRef(e.target.value)}
                  placeholder="Supplier-provided batch id"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="received_date">Received Date</Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="received_date"
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mfg_date">MFG Date (optional)</Label>
                  <Input id="mfg_date" type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date (optional)</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Qty + storage */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="qty_received">Quantity Received</Label>
                  <Input
                    id="qty_received"
                    inputMode="decimal"
                    value={qtyReceived}
                    onChange={(e) => setQtyReceived(e.target.value)}
                    placeholder="e.g., 25"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Use item UOM ({computedUom || "—"}). For chemicals, this may be liters/kg.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qty_available">Quantity Available (optional)</Label>
                  <Input
                    id="qty_available"
                    inputMode="decimal"
                    value={qtyAvailable}
                    onChange={(e) => setQtyAvailable(e.target.value)}
                    placeholder="Defaults to received"
                  />
                  <p className="text-xs text-gray-500">
                    If partial quantity is quarantined/blocked, set available accordingly.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uom">UOM (optional override)</Label>
                  <Input
                    id="uom"
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    placeholder={selectedItem?.uom ? `Default: ${selectedItem.uom}` : "e.g., kg / L / sheets"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse (optional)</Label>
                  <div className="relative">
                    <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="warehouse"
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      placeholder="e.g., Main Stores"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., RACK-A / BIN-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Storage conditions, handling, special QA notes, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Right: QA / status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gray-600" />
                Quality & Status
              </CardTitle>
              <CardDescription>Control how the lot is allowed to move into production.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {LOT_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="gap-1">
                    {status === "RELEASED" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : status === "BLOCKED" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    {status}
                  </Badge>
                  {expiryDate ? (
                    <Badge variant="secondary" className="gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      exp {expiryDate}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quality Gate</Label>
                <select
                  value={qualityGate}
                  onChange={(e) => setQualityGate(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {QUALITY_GATES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Example: Chemicals/laminates often require CoA and incoming inspection before release.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coa_number">CoA Number (optional)</Label>
                <Input id="coa_number" value={coaNumber} onChange={(e) => setCoaNumber(e.target.value)} placeholder="e.g., COA-88921" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coc_number">CoC Number (optional)</Label>
                <Input id="coc_number" value={cocNumber} onChange={(e) => setCocNumber(e.target.value)} placeholder="e.g., COC-55110" />
              </div>

              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-600" />
                  <div className="text-xs text-gray-600">
                    <p className="font-medium text-gray-900">Tip</p>
                    <p className="mt-1">
                      Keep new lots in <span className="font-medium">Quarantine</span> until incoming QA verifies CoA/inspection.
                      Only then set to <span className="font-medium">Released</span>.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                form="lot-create-form"
                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Lot
              </Button>

              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to="/inventory/lots">
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sticky helper footer for small screens */}
        <div className="sticky bottom-3 z-10 rounded-2xl border bg-white/90 p-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" asChild>
              <Link to="/inventory/lots" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>

            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" type="submit" form="lot-create-form" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
