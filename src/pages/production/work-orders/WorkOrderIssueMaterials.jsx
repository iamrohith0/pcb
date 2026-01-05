// src/pages/production/work-orders/WorkOrderIssueMaterials.jsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  Hash,
  Loader2,
  PackageOpen,
  Scan,
  Search,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.jsx";

/**
 * WorkOrderIssueMaterials.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Purpose:
 * - Issue / reserve raw materials against a Work Order (WO) from Stores
 * - Supports:
 *   - Search WO
 *   - View WO material requirements (planned)
 *   - Pick lots/batches from inventory (available)
 *   - Issue quantities (actual)
 *   - Generate an Issue Slip (future)
 *
 * Suggested backend endpoints:
 * - GET  /production/work-orders/:id (header)
 * - GET  /production/work-orders/:id/material-requirements
 * - GET  /inventory/stock/search?item=...&lot=...&warehouse=...
 * - POST /inventory/material-issues   { wo_id, lines:[{item_id, lot_id, qty, uom, from_location}] }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function money(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return x.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
}

function num(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function isPositive(v) {
  const n = Number(v);
  return !Number.isNaN(n) && n > 0;
}

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
}

const WAREHOUSES = ["Main Stores", "Chemicals Store", "Copper/Clad Store", "Tool Room"];
const LOCATIONS = ["R1-A1", "R1-A2", "R2-B1", "R3-C2", "FG-01"];
const UOMS = ["Nos", "Sheet", "Kg", "Ltr", "Set", "Roll"];

export default function WorkOrderIssueMaterials() {
  const { toast } = useToast();

  // Search / selection
  const [woQuery, setWoQuery] = useState("");
  const [loadingWo, setLoadingWo] = useState(false);
  const [wo, setWo] = useState(null); // selected work order

  // Issuing context
  const [warehouse, setWarehouse] = useState("Main Stores");
  const [plant, setPlant] = useState("Plant 1");
  const [issueDate, setIssueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [remarks, setRemarks] = useState("");

  // Requirements (planned) + stock (available) — UI mock
  const [requirements, setRequirements] = useState([]);
  const [stock, setStock] = useState([]);

  // Issue lines (actual)
  const [lines, setLines] = useState([]);

  // Barcode quick add (optional UI)
  const [scanText, setScanText] = useState("");
  const [scanMode, setScanMode] = useState("LOT"); // LOT / ITEM

  // Confirmations
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mock: load initial stock catalog
  useEffect(() => {
    // Replace with: inventoryApi.stockList(...)
    setStock([
      {
        id: uuid(),
        item: "FR4 Core",
        spec: "Tg 150, 1.6mm",
        lot: "FR4-LOT-2409-11",
        uom: "Sheet",
        available: 120,
        location: "R1-A1",
        unit_cost: 210,
      },
      {
        id: uuid(),
        item: "Copper Clad",
        spec: "1 oz, 0.2mm",
        lot: "CCL-LOT-2410-03",
        uom: "Sheet",
        available: 80,
        location: "R1-A2",
        unit_cost: 330,
      },
      {
        id: uuid(),
        item: "Solder Mask Ink",
        spec: "Green",
        lot: "SM-LOT-2411-02",
        uom: "Ltr",
        available: 18,
        location: "R2-B1",
        unit_cost: 1450,
      },
      {
        id: uuid(),
        item: "Etchant Chemical",
        spec: "CuCl2",
        lot: "CHM-LOT-2412-07",
        uom: "Ltr",
        available: 60,
        location: "R3-C2",
        unit_cost: 380,
      },
      {
        id: uuid(),
        item: "Packaging Box",
        spec: "Anti-static, Medium",
        lot: "PKG-LOT-2408-19",
        uom: "Nos",
        available: 500,
        location: "FG-01",
        unit_cost: 12,
      },
    ]);
  }, []);

  // Search WO (mock)
  async function fetchWO() {
    if (!woQuery.trim()) {
      toast({ title: "Enter WO number", description: "Type a WO number to search.", variant: "destructive" });
      return;
    }
    setLoadingWo(true);
    try {
      // Replace with: workOrdersApi.findByNumber(woQuery)
      await new Promise((r) => setTimeout(r, 450));

      const fakeWo = {
        id: uuid(),
        wo_no: woQuery.trim().toUpperCase(),
        customer: "ABC Electronics",
        part_no: "PCB-CTRL-12V",
        revision: "A",
        layers: 2,
        thickness_mm: 1.6,
        finish: "ENIG",
        order_qty: 100,
        status: "Planned",
      };

      setWo(fakeWo);

      // Replace with: GET /material-requirements
      setRequirements([
        { id: uuid(), item: "FR4 Core", spec: "Tg 150, 1.6mm", uom: "Sheet", required: 10 },
        { id: uuid(), item: "Copper Clad", spec: "1 oz, 0.2mm", uom: "Sheet", required: 10 },
        { id: uuid(), item: "Solder Mask Ink", spec: "Green", uom: "Ltr", required: 1.2 },
        { id: uuid(), item: "Etchant Chemical", spec: "CuCl2", uom: "Ltr", required: 5 },
        { id: uuid(), item: "Packaging Box", spec: "Anti-static, Medium", uom: "Nos", required: 100 },
      ]);

      setLines([]);
      toast({ title: "WO loaded", description: `Ready to issue materials for ${fakeWo.wo_no}` });
    } catch (e) {
      toast({ title: "WO not found", description: "Try another WO number.", variant: "destructive" });
      setWo(null);
      setRequirements([]);
      setLines([]);
    } finally {
      setLoadingWo(false);
    }
  }

  function addLineFromStock(s) {
    if (!wo) {
      toast({ title: "Select a WO first", description: "Search and load a Work Order before issuing.", variant: "destructive" });
      return;
    }

    // If already exists (same stock lot), just focus user to edit qty
    const exists = lines.find((l) => l.stock_id === s.id);
    if (exists) {
      toast({ title: "Already added", description: "This lot is already in your issue list." });
      return;
    }

    setLines((prev) => [
      ...prev,
      {
        id: uuid(),
        stock_id: s.id,
        item: s.item,
        spec: s.spec,
        lot: s.lot,
        uom: s.uom,
        from_location: s.location,
        available: s.available,
        qty: "",
        note: "",
        unit_cost: s.unit_cost,
      },
    ]);
  }

  function removeLine(id) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLine(id, key, value) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  }

  const filteredStock = useMemo(() => {
    const q = woQuery.trim().toLowerCase();
    // NOTE: using woQuery as a quick filter box; you can introduce a separate stockSearch if you want
    if (!q) return stock;
    return stock.filter((s) => {
      const hay = `${s.item} ${s.spec} ${s.lot} ${s.location}`.toLowerCase();
      return hay.includes(q);
    });
  }, [stock, woQuery]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + num(l.qty) * num(l.unit_cost), 0);
    const count = lines.length;
    const invalid = lines.some((l) => !isPositive(l.qty) || num(l.qty) > num(l.available));
    return { subtotal, count, invalid };
  }, [lines]);

  function validate() {
    const errors = [];
    if (!wo) errors.push("Select a Work Order.");
    if (!issueDate) errors.push("Issue date is required.");
    if (!lines.length) errors.push("Add at least one issue line.");

    lines.forEach((l) => {
      if (!isPositive(l.qty)) errors.push(`Qty must be > 0 for ${l.item} (${l.lot}).`);
      if (num(l.qty) > num(l.available)) errors.push(`Qty exceeds available stock for ${l.item} (${l.lot}).`);
    });

    return errors;
  }

  async function submitIssue() {
    const errors = validate();
    if (errors.length) {
      toast({ title: "Fix errors", description: errors[0], variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        wo_id: wo.id,
        wo_no: wo.wo_no,
        plant,
        warehouse,
        issue_date: issueDate,
        remarks,
        lines: lines.map((l) => ({
          stock_id: l.stock_id,
          item: l.item,
          lot: l.lot,
          uom: l.uom,
          qty: Number(l.qty),
          from_location: l.from_location,
          note: l.note?.trim() || "",
        })),
      };

      // Replace with: materialIssueApi.create(payload)
      await new Promise((r) => setTimeout(r, 650));

      toast({
        title: "Materials issued",
        description: `Issued ${payload.lines.length} line(s) against ${payload.wo_no}.`,
      });

      // Clear for next issue
      setLines([]);
      setRemarks("");
      setScanText("");
    } catch (e) {
      toast({
        title: "Issue failed",
        description: "Could not issue materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function quickScanAdd() {
    const t = scanText.trim();
    if (!t) return;

    // Demo behavior:
    // - LOT mode: match by exact lot
    // - ITEM mode: match by item substring
    const match =
      scanMode === "LOT"
        ? stock.find((s) => s.lot.toLowerCase() === t.toLowerCase())
        : stock.find((s) => s.item.toLowerCase().includes(t.toLowerCase()));

    if (!match) {
      toast({ title: "Not found", description: "No stock matched the scanned value.", variant: "destructive" });
      return;
    }

    addLineFromStock(match);
    setScanText("");
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#dc2551]" />
              Issue Materials
            </CardTitle>
            <CardDescription>Reserve/issue stores materials against a PCB work order.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Warehouse className="h-3.5 w-3.5" />
              {warehouse}
            </Badge>
            <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* WO Search */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Work Order No</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={woQuery}
                  onChange={(e) => setWoQuery(e.target.value)}
                  placeholder="WO-YYMMDD-XXX"
                  className="pl-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      fetchWO();
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchWO} className="w-full bg-[#dc2551] hover:bg-[#b02045]" disabled={loadingWo}>
                {loadingWo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load WO"}
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>Plant</Label>
              <div className="relative">
                <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="Plant 1">Plant 1</option>
                  <option value="Plant 2">Plant 2</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Warehouse</Label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Remarks</Label>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes for stores / audit trail" />
            </div>
          </div>

          {/* WO Summary */}
          {wo ? (
            <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-6">
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">WO</div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Hash className="h-4 w-4 text-gray-500" />
                  {wo.wo_no}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Customer</div>
                <div className="text-sm font-medium text-gray-900">{wo.customer}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Part</div>
                <div className="text-sm font-medium text-gray-900">
                  {wo.part_no} <span className="text-gray-500">Rev {wo.revision}</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Layers</div>
                <div className="text-sm font-medium text-gray-900">{wo.layers}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Finish</div>
                <div className="text-sm font-medium text-gray-900">{wo.finish}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Order Qty</div>
                <div className="text-sm font-medium text-gray-900">{wo.order_qty}</div>
              </div>

              <div className="md:col-span-6 flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Status: {wo.status}
                </Badge>
                <Badge variant="outline" className="gap-2">
                  <Truck className="h-3.5 w-3.5" />
                  Issue Slip: Draft
                </Badge>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
              Search a <b>Work Order</b> to view requirements and issue materials.
            </div>
          )}

          {/* Requirements + Quick Scan */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <PackageOpen className="h-4 w-4 text-gray-600" />
                  Material Requirements (Planned)
                </div>
                <Badge variant="outline">{requirements.length} items</Badge>
              </div>

              {requirements.length ? (
                <div className="overflow-auto rounded-lg border">
                  <table className="min-w-[520px] w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-semibold text-gray-700">Item</th>
                        <th className="px-3 py-2 font-semibold text-gray-700">Spec</th>
                        <th className="px-3 py-2 font-semibold text-gray-700">UOM</th>
                        <th className="px-3 py-2 font-semibold text-gray-700">Req</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2 font-medium text-gray-900">{r.item}</td>
                          <td className="px-3 py-2 text-gray-700">{r.spec}</td>
                          <td className="px-3 py-2 text-gray-700">{r.uom}</td>
                          <td className="px-3 py-2 text-gray-900">{r.required}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
                  Requirements will appear after you load a WO.
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-gray-600" />
                  Quick Scan Add
                </div>
                <Badge variant="outline" className="gap-2">
                  <Scan className="h-3.5 w-3.5" />
                  {scanMode}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-1 space-y-1.5">
                  <Label>Mode</Label>
                  <select
                    value={scanMode}
                    onChange={(e) => setScanMode(e.target.value)}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    <option value="LOT">LOT</option>
                    <option value="ITEM">ITEM</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label>Scan / Enter</Label>
                  <div className="flex gap-2">
                    <Input
                      value={scanText}
                      onChange={(e) => setScanText(e.target.value)}
                      placeholder={scanMode === "LOT" ? "Scan lot id e.g., FR4-LOT-2409-11" : "Search item e.g., solder mask"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          quickScanAdd();
                        }
                      }}
                    />
                    <Button variant="outline" onClick={quickScanAdd}>
                      Add
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-500">This is UI-only. Wire to scanner events / API if needed.</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
                Tip: Use this for fast issuing in stores. For controlled materials, always select the correct lot and location.
              </div>
            </div>
          </div>

          {/* Stock + Issue List */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Available Stock</div>
                <Badge variant="outline">{filteredStock.length} lots</Badge>
              </div>

              <div className="overflow-auto rounded-lg border">
                <table className="min-w-[740px] w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-semibold text-gray-700">Item</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Spec</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Lot</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Loc</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">UOM</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Avail</th>
                      <th className="px-3 py-2 font-semibold text-gray-700 w-[120px]"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="px-3 py-2 font-medium text-gray-900">{s.item}</td>
                        <td className="px-3 py-2 text-gray-700">{s.spec}</td>
                        <td className="px-3 py-2 text-gray-700">{s.lot}</td>
                        <td className="px-3 py-2 text-gray-700">{s.location}</td>
                        <td className="px-3 py-2 text-gray-700">{s.uom}</td>
                        <td className="px-3 py-2 text-gray-900">{s.available}</td>
                        <td className="px-3 py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => addLineFromStock(s)}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!filteredStock.length ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-600">
                          No stock lots found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-[11px] text-gray-500">
                For real usage, filter stock by warehouse, item, lot, and expiry/inspection status.
              </p>
            </div>

            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Issue List (Actual)</div>
                <Badge variant="outline">{totals.count} lines</Badge>
              </div>

              {lines.length ? (
                <div className="space-y-3">
                  {lines.map((l) => {
                    const over = num(l.qty) > num(l.available);
                    const bad = !isPositive(l.qty) || over;

                    return (
                      <div key={l.id} className="rounded-lg border bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{l.item}</div>
                            <div className="text-xs text-gray-500">
                              Lot: <span className="font-medium text-gray-700">{l.lot}</span> • {l.spec}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                              <Badge variant="outline">Loc: {l.from_location}</Badge>
                              <Badge variant="outline">UOM: {l.uom}</Badge>
                              <Badge variant="outline">Avail: {l.available}</Badge>
                              <Badge variant="outline">Unit: {money(l.unit_cost)}</Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="gap-2" onClick={() => removeLine(l.id)}>
                              <Trash2 className="h-4 w-4 text-rose-600" />
                              Remove
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label>Qty to Issue</Label>
                            <Input
                              value={l.qty}
                              onChange={(e) => updateLine(l.id, "qty", e.target.value)}
                              placeholder="0"
                              inputMode="decimal"
                              className={cx(bad && "border-rose-300 focus-visible:ring-rose-200")}
                            />
                            {over ? (
                              <p className="text-[11px] text-rose-600">Qty exceeds available stock.</p>
                            ) : bad ? (
                              <p className="text-[11px] text-rose-600">Enter a valid qty &gt; 0.</p>
                            ) : (
                              <p className="text-[11px] text-gray-500">
                                Line amount: <span className="font-medium text-gray-700">{money(num(l.qty) * num(l.unit_cost))}</span>
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label>From Location</Label>
                            <select
                              value={l.from_location}
                              onChange={(e) => updateLine(l.id, "from_location", e.target.value)}
                              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                            >
                              {[l.from_location, ...LOCATIONS.filter((x) => x !== l.from_location)].map((x) => (
                                <option key={x} value={x}>
                                  {x}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Line Note</Label>
                            <Input
                              value={l.note}
                              onChange={(e) => updateLine(l.id, "note", e.target.value)}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-lg border bg-gray-50 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-gray-700">
                        Subtotal: <span className="font-semibold text-gray-900">{money(totals.subtotal)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Includes only issued lines (Qty × Unit Cost). Taxes/valuation handled in finance.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
                  Add lots from stock (left) to build your issue list.
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setConfirmClear(true)} disabled={!lines.length}>
              <Trash2 className="h-4 w-4" />
              Clear Lines
            </Button>

            <Button
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting || !lines.length}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              Confirm Issue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear confirmation */}
      <ConfirmationDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear all issue lines?"
        description="This will remove all selected lots from the issue list."
        confirmText="Clear"
        confirmVariant="destructive"
        onConfirm={() => {
          setConfirmClear(false);
          setLines([]);
          toast({ title: "Cleared", description: "Issue list cleared." });
        }}
      />

      {/* Submit confirmation */}
      <ConfirmationDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Issue materials now?"
        description="This will post a material issue transaction against the selected Work Order."
        confirmText="Issue"
        confirmVariant="default"
        onConfirm={async () => {
          setConfirmSubmit(false);
          await submitIssue();
        }}
      />
    </div>
  );
}
