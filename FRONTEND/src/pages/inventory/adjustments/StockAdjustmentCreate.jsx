// src/pages/inventory/adjustments/StockAdjustmentCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import {
    ArrowLeft,
    CalendarDays,
    CalendarRange,
    Hash,
    Loader2,
    PackageSearch,
    Plus,
    Save,
    Trash2,
    Warehouse,
} from "lucide-react";

import api from "@/lib/axios";

/**
 * Stock Adjustment (PCB Manufacturing ERP)
 * - Used by Stores/Inventory team to correct stock quantities due to:
 *   - cycle count variance
 *   - scrap/damage
 *   - consumption correction
 *   - GRN mismatch correction
 *   - lot split/merge correction (optional)
 *
 * Backend expectations (recommended):
 * POST /inventory/adjustments
 * payload: {
 *   doc_date, warehouse_id, location_id, adjustment_type, reason, reference, remarks,
 *   lines: [{ item_id, item_code, item_name, lot_no, serial_no, uom, qty, unit_cost, line_note }]
 * }
 */

const ADJ_TYPES = [
  { value: "INCREASE", label: "Increase (Add stock)" },
  { value: "DECREASE", label: "Decrease (Reduce stock)" },
];

const REASONS = [
  "Cycle Count Variance",
  "Scrap / Damage",
  "Expiry / Obsolete",
  "Consumption Correction",
  "GRN / Invoice Mismatch",
  "WIP Issue Correction",
  "Other",
];

const emptyLine = () => ({
  id: crypto.randomUUID(),
  item_id: "",
  item_code: "",
  item_name: "",
  lot_no: "",
  serial_no: "",
  uom: "",
  qty: "",
  unit_cost: "",
  line_note: "",
});

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function StockAdjustmentCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Master data
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);

  // Page state
  const [saving, setSaving] = useState(false);

  // Header fields
  const [docDate, setDocDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("DECREASE");
  const [reason, setReason] = useState("Cycle Count Variance");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");

  // Lines
  const [lines, setLines] = useState([emptyLine()]);

  // Search helpers
  const [itemQuery, setItemQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return items.slice(0, 50);
    return items
      .filter((it) => {
        const code = String(it.code ?? it.item_code ?? "").toLowerCase();
        const name = String(it.name ?? it.item_name ?? "").toLowerCase();
        return code.includes(q) || name.includes(q);
      })
      .slice(0, 50);
  }, [items, itemQuery]);

  // Fetch masters (warehouses, locations, items)
  useEffect(() => {
    let mounted = true;

    const loadMasters = async () => {
      setLoadingMasters(true);
      try {
        // Adjust these endpoints to match your backend
        const [wRes, lRes, iRes] = await Promise.all([
          api.get("/masters/warehouses"),
          api.get("/masters/locations"),
          api.get("/masters/items", { params: { type: "RM,CONSUMABLE,PACKING,WIP" } }),
        ]);

        if (!mounted) return;

        const w = wRes?.data?.data ?? wRes?.data ?? [];
        const l = lRes?.data?.data ?? lRes?.data ?? [];
        const it = iRes?.data?.data ?? iRes?.data ?? [];

        setWarehouses(Array.isArray(w) ? w : []);
        setLocations(Array.isArray(l) ? l : []);
        setItems(Array.isArray(it) ? it : []);

        // Auto-select first warehouse if available
        if (!warehouseId && Array.isArray(w) && w.length) {
          setWarehouseId(String(w[0].id ?? w[0].warehouse_id ?? ""));
        }
      } catch (err) {
        console.warn("Failed to load masters:", err);
        toast({
          title: "Failed to load masters",
          description: "Warehouses/Locations/Items could not be loaded. Check API endpoints.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoadingMasters(false);
      }
    };

    loadMasters();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep location list scoped to selected warehouse if your locations have warehouse_id
  const scopedLocations = useMemo(() => {
    if (!warehouseId) return locations;
    return locations.filter((loc) => {
      const wid = String(loc.warehouse_id ?? loc.warehouseId ?? "");
      return !wid || wid === String(warehouseId);
    });
  }, [locations, warehouseId]);

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id) => {
    setLines((prev) => {
      if (prev.length === 1) return prev; // keep at least one
      return prev.filter((l) => l.id !== id);
    });
  };

  const updateLine = (id, patch) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const onPickItem = (lineId, item) => {
    const itemId = item.id ?? item.item_id ?? "";
    const code = item.code ?? item.item_code ?? "";
    const name = item.name ?? item.item_name ?? "";
    const uom = item.uom ?? item.unit ?? item.uom_name ?? "";

    updateLine(lineId, {
      item_id: String(itemId),
      item_code: String(code),
      item_name: String(name),
      uom: String(uom),
    });
  };

  const computeTotals = useMemo(() => {
    const totalQty = lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
    const totalValue = lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0);
    return { totalQty, totalValue };
  }, [lines]);

  const validate = () => {
    if (!docDate) return "Document date is required.";
    if (!warehouseId) return "Warehouse is required.";
    if (!adjustmentType) return "Adjustment type is required.";
    if (!reason) return "Reason is required.";

    const usableLines = lines.filter((l) => l.item_id || l.item_code || l.item_name);

    if (!usableLines.length) return "Add at least one line item.";
    for (let i = 0; i < usableLines.length; i++) {
      const l = usableLines[i];
      const row = i + 1;

      if (!l.item_id && !l.item_code) return `Line ${row}: Select an item.`;
      if (!l.qty || Number(l.qty) === 0) return `Line ${row}: Quantity must be non-zero.`;

      // If you enforce lot/serial for certain item types, validate here
      // Example: if (l.track_by === "LOT" && !l.lot_no) ...
    }

    return null;
  };

  const buildPayload = () => {
    const payloadLines = lines
      .filter((l) => l.item_id || l.item_code || l.item_name)
      .map((l) => ({
        item_id: l.item_id ? String(l.item_id) : undefined,
        item_code: l.item_code ? String(l.item_code) : undefined,
        item_name: l.item_name ? String(l.item_name) : undefined,
        lot_no: l.lot_no ? String(l.lot_no) : undefined,
        serial_no: l.serial_no ? String(l.serial_no) : undefined,
        uom: l.uom ? String(l.uom) : undefined,
        qty: Number(l.qty) || 0,
        unit_cost: l.unit_cost === "" ? undefined : Number(l.unit_cost) || 0,
        line_note: l.line_note ? String(l.line_note) : undefined,
      }));

    return {
      doc_date: docDate,
      warehouse_id: warehouseId,
      location_id: locationId || null,
      adjustment_type: adjustmentType,
      reason,
      reference: reference || null,
      remarks: remarks || null,
      lines: payloadLines,
    };
  };

  const handleSave = async () => {
    const errMsg = validate();
    if (errMsg) {
      toast({ title: "Validation error", description: errMsg, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();

      // Adjust this endpoint to your backend
      const res = await api.post("/inventory/adjustments", payload);

      const newId = res?.data?.id ?? res?.data?.data?.id ?? null;

      toast({
        title: "Stock adjustment created",
        description: newId ? `Document #${newId} created successfully.` : "Created successfully.",
      });

      // Navigate to details page if you have it:
      // navigate(`/inventory/adjustments/${newId}`);
      navigate("/inventory/adjustments", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 422 ? "Invalid data. Please check fields and try again." : "Failed to create adjustment.");

      toast({ title: "Save failed", description: msg, variant: "destructive" });
      console.error("Save adjustment error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Stock Adjustment</h1>
            <p className="text-sm text-gray-500">
              Correct raw material / consumables / packing stock for PCB manufacturing (lots, reels, sheets).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-cyan-600 hover:bg-cyan-500" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Header card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Document Details</CardTitle>
          <CardDescription>Header details used for audit, warehouse linkage, and traceability.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="docDate" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              Date
            </Label>
            <Input id="docDate" type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-gray-400" />
              Warehouse
            </Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
              disabled={loadingMasters}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={String(w.id ?? w.warehouse_id)} value={String(w.id ?? w.warehouse_id)}>
                  {w.name ?? w.warehouse_name ?? "Warehouse"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-400" />
              Location (optional)
            </Label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
              disabled={loadingMasters}
            >
              <option value="">Select location</option>
              {scopedLocations.map((loc) => (
                <option key={String(loc.id ?? loc.location_id)} value={String(loc.id ?? loc.location_id)}>
                  {loc.name ?? loc.location_name ?? "Location"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
            >
              {ADJ_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Reference (optional)</Label>
            <Input
              placeholder="e.g., CC-2026-01, NCR-102, Scrap Note #..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>Remarks (optional)</Label>
            <Textarea
              placeholder="Write a short explanation for audit trail..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Line Items</CardTitle>
            <CardDescription>Add the items and quantities to correct.</CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <PackageSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search item (code/name)..."
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={addLine} className="gap-2">
              <Plus className="h-4 w-4" />
              Add line
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-3 py-2 w-[320px]">Item</th>
                  <th className="px-3 py-2 w-[140px]">Lot No</th>
                  <th className="px-3 py-2 w-[160px]">Serial No</th>
                  <th className="px-3 py-2 w-[90px]">UOM</th>
                  <th className="px-3 py-2 w-[120px]">Qty</th>
                  <th className="px-3 py-2 w-[140px]">Unit Cost</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2 w-[70px]"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className={cx("border-t", idx % 2 === 0 ? "bg-white" : "bg-gray-50/40")}>
                    {/* Item picker */}
                    <td className="px-3 py-2 align-top">
                      <div className="space-y-2">
                        <select
                          value={line.item_id}
                          onChange={(e) => {
                            const picked = items.find((it) => String(it.id ?? it.item_id) === String(e.target.value));
                            if (picked) onPickItem(line.id, picked);
                            else updateLine(line.id, { item_id: e.target.value });
                          }}
                          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
                          disabled={loadingMasters}
                        >
                          <option value="">Select item</option>
                          {filteredItems.map((it) => {
                            const id = String(it.id ?? it.item_id ?? "");
                            const code = it.code ?? it.item_code ?? "";
                            const name = it.name ?? it.item_name ?? "";
                            return (
                              <option key={id} value={id}>
                                {code ? `${code} — ${name}` : name}
                              </option>
                            );
                          })}
                        </select>

                        <div className="text-xs text-gray-500">
                          {line.item_code || line.item_name ? (
                            <span>
                              <span className="font-medium text-gray-800">{line.item_code}</span>{" "}
                              <span className="text-gray-500">{line.item_name}</span>
                            </span>
                          ) : (
                            <span>Select an item to auto-fill UOM</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="LOT-001 / REEL-12"
                        value={line.lot_no}
                        onChange={(e) => updateLine(line.id, { lot_no: e.target.value })}
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="Serial (if any)"
                        value={line.serial_no}
                        onChange={(e) => updateLine(line.id, { serial_no: e.target.value })}
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="UOM"
                        value={line.uom}
                        onChange={(e) => updateLine(line.id, { uom: e.target.value })}
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="Qty"
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                      />
                      <p className="mt-1 text-[11px] text-gray-500">
                        {adjustmentType === "DECREASE" ? "Reducing stock" : "Adding stock"}
                      </p>
                    </td>

                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.unit_cost}
                        onChange={(e) => updateLine(line.id, { unit_cost: e.target.value })}
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="Line note..."
                        value={line.line_note}
                        onChange={(e) => updateLine(line.id, { line_note: e.target.value })}
                      />
                    </td>

                    <td className="px-3 py-2 align-top">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(line.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {lines.map((line, idx) => (
              <div key={line.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Line {idx + 1}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(line.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label>Item</Label>
                    <select
                      value={line.item_id}
                      onChange={(e) => {
                        const picked = items.find((it) => String(it.id ?? it.item_id) === String(e.target.value));
                        if (picked) onPickItem(line.id, picked);
                        else updateLine(line.id, { item_id: e.target.value });
                      }}
                      className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
                      disabled={loadingMasters}
                    >
                      <option value="">Select item</option>
                      {filteredItems.map((it) => {
                        const id = String(it.id ?? it.item_id ?? "");
                        const code = it.code ?? it.item_code ?? "";
                        const name = it.name ?? it.item_name ?? "";
                        return (
                          <option key={id} value={id}>
                            {code ? `${code} — ${name}` : name}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-gray-500">
                      {line.item_code || line.item_name ? (
                        <>
                          <span className="font-medium text-gray-800">{line.item_code}</span>{" "}
                          <span className="text-gray-500">{line.item_name}</span>
                        </>
                      ) : (
                        "Select an item to auto-fill UOM"
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Lot No</Label>
                      <Input value={line.lot_no} onChange={(e) => updateLine(line.id, { lot_no: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Serial No</Label>
                      <Input
                        value={line.serial_no}
                        onChange={(e) => updateLine(line.id, { serial_no: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>UOM</Label>
                      <Input value={line.uom} onChange={(e) => updateLine(line.id, { uom: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unit_cost}
                        onChange={(e) => updateLine(line.id, { unit_cost: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Line Note</Label>
                      <Input
                        value={line.line_note}
                        onChange={(e) => updateLine(line.id, { line_note: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addLine} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add line
            </Button>
          </div>

          {/* Totals */}
          <div className="flex flex-col gap-2 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <span className="font-medium">Document Date:</span> {docDate}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                Total Qty: <span className="font-semibold">{computeTotals.totalQty}</span>
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                Total Value: <span className="font-semibold">{computeTotals.totalValue.toFixed(2)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" onClick={() => navigate("/inventory/adjustments")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2 bg-cyan-600 hover:bg-cyan-500" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Adjustment
            </Button>
          </div>

          {/* Helpful hint */}
          <div className="rounded-2xl border border-[#dc2551]/20 bg-[#dc2551]/5 p-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
                <CalendarRange className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">PCB manufacturing tip</p>
                <p className="mt-1 text-sm text-gray-600">
                  Track lots for copper clad laminates, prepregs, soldermask, chemicals, and component reels.
                  Stock adjustments should be linked to cycle count sheets, NCR/CAPA, or scrap notes for audit.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
