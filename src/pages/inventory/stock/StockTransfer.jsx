// src/pages/inventory/stock/StockTransfer.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Hash,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import ConfirmationDialog from "@/components/ConfirmationDialog.jsx";

import stockService from "@/services/stock.service";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function safeNum(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function fmt(n) {
  return new Intl.NumberFormat().format(safeNum(n));
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sumLines(lines) {
  return lines.reduce((acc, l) => acc + safeNum(l.qty, 0), 0);
}

function makeEmptyLine() {
  return {
    id: crypto?.randomUUID?.() || String(Math.random()).slice(2),
    itemCode: "",
    itemName: "",
    uom: "",
    lotNo: "",
    serialNo: "",
    availableQty: null,
    qty: "",
    remarks: "",
  };
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-600">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function StockTransfer() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Header fields
  const [transferDate, setTransferDate] = useState(todayISO());
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("Production");
  const [vehicleNo, setVehicleNo] = useState("");
  const [carrier, setCarrier] = useState("");

  // From/To
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [toLocation, setToLocation] = useState("");

  const [notes, setNotes] = useState("");

  // Search helpers (optional)
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  // Lines
  const [lines, setLines] = useState([makeEmptyLine()]);

  // Confirmations
  const [resetOpen, setResetOpen] = useState(false);
  const [removeLineId, setRemoveLineId] = useState(null);

  const totalQty = useMemo(() => sumLines(lines), [lines]);

  const canSubmit = useMemo(() => {
    if (!fromWarehouse || !toWarehouse) return false;
    if (fromWarehouse === toWarehouse && (fromLocation || "") === (toLocation || "")) return false;

    const hasValidLine = lines.some((l) => l.itemCode && safeNum(l.qty, 0) > 0);
    return hasValidLine && !saving;
  }, [fromWarehouse, toWarehouse, fromLocation, toLocation, lines, saving]);

  const addLine = () => setLines((prev) => [...prev, makeEmptyLine()]);

  const updateLine = (id, patch) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const requestRemoveLine = (id) => setRemoveLineId(id);
  const confirmRemoveLine = () => {
    const id = removeLineId;
    setRemoveLineId(null);
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== id);
      return next.length ? next : [makeEmptyLine()];
    });
  };

  const resetForm = () => {
    setTransferDate(todayISO());
    setReference("");
    setReason("Production");
    setVehicleNo("");
    setCarrier("");
    setFromWarehouse("");
    setFromLocation("");
    setToWarehouse("");
    setToLocation("");
    setNotes("");
    setLookupQuery("");
    setLines([makeEmptyLine()]);
  };

  const fetchDefaults = async () => {
    setLoading(true);
    try {
      /**
       * Optional endpoint:
       * GET /inventory/stock/transfer/defaults
       * -> { referencePrefix, defaultFromWarehouse, warehouses:[...], locationsByWarehouse:{...} }
       */
      const res = await stockService.getTransferDefaults?.();
      const data = res?.data ?? res;
      if (data?.defaultFromWarehouse) setFromWarehouse(data.defaultFromWarehouse);
      if (data?.defaultFromLocation) setFromLocation(data.defaultFromLocation);
      if (data?.defaultToWarehouse) setToWarehouse(data.defaultToWarehouse);
      if (data?.defaultToLocation) setToLocation(data.defaultToLocation);
      if (data?.referenceSuggested && !reference) setReference(data.referenceSuggested);
    } catch (e) {
      // safe ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateLines = () => {
    const issues = [];
    lines.forEach((l, idx) => {
      const lineNo = idx + 1;
      const qty = safeNum(l.qty, 0);

      if (!l.itemCode && (l.qty || l.lotNo || l.serialNo)) {
        issues.push(`Line ${lineNo}: Item Code is required.`);
        return;
      }
      if (l.itemCode && qty <= 0) {
        issues.push(`Line ${lineNo}: Quantity must be > 0.`);
      }
      if (l.availableQty != null && qty > safeNum(l.availableQty, 0)) {
        issues.push(`Line ${lineNo}: Qty (${qty}) exceeds available (${l.availableQty}).`);
      }
    });

    if (!fromWarehouse) issues.push("From Warehouse is required.");
    if (!toWarehouse) issues.push("To Warehouse is required.");
    if (fromWarehouse && toWarehouse && fromWarehouse === toWarehouse && (fromLocation || "") === (toLocation || "")) {
      issues.push("From and To cannot be the same warehouse/location.");
    }

    return issues;
  };

  const handleLookupItem = async () => {
    const q = lookupQuery.trim();
    if (!q) return;

    setLookupLoading(true);
    try {
      /**
       * Optional endpoint:
       * GET /inventory/items/lookup?q=...
       * -> { items:[{ itemCode, itemName, uom }] }
       */
      const res = await stockService.lookupItem?.({ q });
      const data = res?.data ?? res;
      const first = (data?.items || [])[0];
      if (!first) {
        toast({ title: "No item found", description: "Try a different search.", variant: "destructive" });
        return;
      }

      // Fill into the first empty line
      const target = lines.find((l) => !l.itemCode) || lines[0];
      updateLine(target.id, {
        itemCode: first.itemCode || "",
        itemName: first.itemName || "",
        uom: first.uom || "",
      });

      toast({ title: "Item selected", description: `${first.itemCode} added to transfer lines.` });
    } catch (err) {
      toast({
        title: "Lookup failed",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCheckAvailability = async (line) => {
    if (!line.itemCode || !fromWarehouse) {
      toast({
        title: "Missing fields",
        description: "Select From Warehouse and Item Code first.",
        variant: "destructive",
      });
      return;
    }

    try {
      /**
       * Recommended endpoint:
       * GET /inventory/stock/availability
       * params: { itemCode, warehouse, location, lotNo, serialNo }
       * -> { availableQty }
       */
      const res = await stockService.getAvailability?.({
        itemCode: line.itemCode,
        warehouse: fromWarehouse,
        location: fromLocation || undefined,
        lotNo: line.lotNo || undefined,
        serialNo: line.serialNo || undefined,
      });
      const data = res?.data ?? res;
      updateLine(line.id, { availableQty: safeNum(data?.availableQty, 0) });
      toast({ title: "Availability updated", description: `Available: ${fmt(data?.availableQty)}` });
    } catch (err) {
      toast({
        title: "Availability check failed",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    const issues = validateLines();
    if (issues.length) {
      toast({
        title: "Please fix these issues",
        description: issues.slice(0, 3).join(" "),
        variant: "destructive",
      });
      return;
    }

    const payload = {
      transferDate,
      reference: reference || undefined,
      reason,
      logistics: {
        carrier: carrier || undefined,
        vehicleNo: vehicleNo || undefined,
      },
      from: {
        warehouse: fromWarehouse,
        location: fromLocation || undefined,
      },
      to: {
        warehouse: toWarehouse,
        location: toLocation || undefined,
      },
      notes: notes || undefined,
      lines: lines
        .filter((l) => l.itemCode && safeNum(l.qty, 0) > 0)
        .map((l) => ({
          itemCode: l.itemCode,
          itemName: l.itemName || undefined,
          uom: l.uom || undefined,
          lotNo: l.lotNo || undefined,
          serialNo: l.serialNo || undefined,
          qty: safeNum(l.qty, 0),
          remarks: l.remarks || undefined,
        })),
    };

    setSaving(true);
    try {
      /**
       * Recommended endpoint:
       * POST /inventory/stock/transfers
       * -> { id, transferNo, status }
       */
      const res = await stockService.createTransfer(payload);
      const data = res?.data ?? res;

      toast({
        title: "Transfer created",
        description: `Transfer ${data?.transferNo || data?.id || ""} saved successfully.`,
      });

      // Navigate to details page if you have it
      if (data?.id) navigate(`/inventory/stock/transfers/${data.id}`);
      else resetForm();
    } catch (err) {
      toast({
        title: "Failed to create transfer",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);

      // If you have backend PDF endpoint:
      // const blob = await stockService.printTransferPdf(id)
      // For now: simple window print
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link to="/inventory/stock/dashboard" className="inline-flex">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          <div>
            <h1 className="text-lg font-bold text-gray-900">Stock Transfer</h1>
            <p className="text-sm text-gray-500">
              Move material between warehouses/locations (stores ⇄ production ⇄ quarantine) with lot/serial trace support.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setResetOpen(true)} disabled={saving}>
            <Trash2 className="mr-2 h-4 w-4" />
            Reset
          </Button>

          <Button variant="outline" onClick={handlePrint} disabled={printing}>
            <Download className={cx("mr-2 h-4 w-4", printing && "animate-spin")} />
            Print
          </Button>

          <Button className="bg-[#DC2551] hover:bg-[#B02045]" onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Create Transfer"}
          </Button>
        </div>
      </div>

      {/* Transfer header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-gray-700" />
            Transfer Details
          </CardTitle>
          <CardDescription>Capture transfer reason and logistics details (optional).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <Field label="Transfer Date">
              <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
            </Field>
          </div>

          <div className="md:col-span-3">
            <Field label="Reference (optional)" hint="PO/WO/Job No or manual reference for audit trail.">
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. WO-24019" className="pl-9" />
              </div>
            </Field>
          </div>

          <div className="md:col-span-3">
            <Field label="Reason">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Production / Rework / Quarantine / Return" />
            </Field>
          </div>

          <div className="md:col-span-3">
            <Field label="Carrier / Transport (optional)">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="relative">
                  <Truck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" className="pl-9" />
                </div>
                <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="Vehicle No" />
              </div>
            </Field>
          </div>

          <div className="md:col-span-12">
            <Field label="Notes (optional)">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special handling instructions (ESD, humidity, FIFO, quarantine)..." />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* From / To */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card className="md:col-span-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-gray-700" />
              From (Source)
            </CardTitle>
            <CardDescription>Select source warehouse and location (optional).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="From Warehouse">
              <Input value={fromWarehouse} onChange={(e) => setFromWarehouse(e.target.value)} placeholder="e.g. Main Stores" />
            </Field>

            <Field label="From Location (optional)">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="e.g. R1-B2" className="pl-9" />
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card className="md:col-span-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-gray-700" />
              To (Destination)
            </CardTitle>
            <CardDescription>Select destination warehouse and location (optional).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="To Warehouse">
              <Input value={toWarehouse} onChange={(e) => setToWarehouse(e.target.value)} placeholder="e.g. Production Floor" />
            </Field>

            <Field label="To Location (optional)">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="e.g. LINE-2" className="pl-9" />
              </div>
            </Field>
          </CardContent>
        </Card>
      </div>

      {/* Optional quick item lookup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-700" />
            Quick Item Lookup (optional)
          </CardTitle>
          <CardDescription>Find an item and auto-fill into an empty line (if your backend supports lookup).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="Search item code/name (e.g. Copper Foil 35um)"
          />
          <Button variant="outline" onClick={handleLookupItem} disabled={lookupLoading}>
            {lookupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Lookup
          </Button>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-700" />
                Transfer Lines
              </CardTitle>
              <CardDescription>Use Lot/Serial if the material is controlled. Quantity supports decimals for chemicals.</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                Total Qty: <span className="ml-1 font-semibold">{fmt(totalQty)}</span>
              </Badge>
              <Button variant="outline" onClick={addLine}>
                <Package className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Desktop header */}
          <div className="hidden grid-cols-12 gap-3 rounded-xl border bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 md:grid">
            <div className="col-span-2">Item Code</div>
            <div className="col-span-2">Lot / Serial</div>
            <div className="col-span-2">Available</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-3">Remarks</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {lines.map((l, idx) => {
            const qty = l.qty;
            const hasItem = !!l.itemCode;

            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-xl border bg-white p-3"
              >
                {/* Mobile */}
                <div className="space-y-3 md:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Line {idx + 1}</p>
                      <p className="text-sm font-semibold text-gray-900">{l.itemCode || "New Line"}</p>
                      {l.itemName ? <p className="text-xs text-gray-500">{l.itemName}</p> : null}
                    </div>

                    <Button variant="outline" onClick={() => requestRemoveLine(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Item Code">
                      <Input
                        value={l.itemCode}
                        onChange={(e) => updateLine(l.id, { itemCode: e.target.value })}
                        placeholder="e.g. PREPREG-2116"
                      />
                    </Field>

                    <Field label="UOM (optional)">
                      <Input value={l.uom} onChange={(e) => updateLine(l.id, { uom: e.target.value })} placeholder="KG / M / PCS" />
                    </Field>

                    <Field label="Lot No (optional)">
                      <Input value={l.lotNo} onChange={(e) => updateLine(l.id, { lotNo: e.target.value })} placeholder="LOT-..." />
                    </Field>

                    <Field label="Serial No (optional)">
                      <Input value={l.serialNo} onChange={(e) => updateLine(l.id, { serialNo: e.target.value })} placeholder="SN-..." />
                    </Field>

                    <Field label="Qty">
                      <Input
                        value={qty}
                        onChange={(e) => updateLine(l.id, { qty: e.target.value })}
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </Field>

                    <Field label="Availability">
                      <div className="flex items-center gap-2">
                        <Input value={l.availableQty == null ? "" : String(l.availableQty)} readOnly placeholder="-" />
                        <Button variant="outline" onClick={() => handleCheckAvailability(l)} disabled={!hasItem || !fromWarehouse}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </Field>
                  </div>

                  <Field label="Remarks (optional)">
                    <Textarea value={l.remarks} onChange={(e) => updateLine(l.id, { remarks: e.target.value })} placeholder="Reason/handling notes..." />
                  </Field>
                </div>

                {/* Desktop */}
                <div className="hidden grid-cols-12 items-start gap-3 md:grid">
                  <div className="col-span-2 space-y-1">
                    <Input
                      value={l.itemCode}
                      onChange={(e) => updateLine(l.id, { itemCode: e.target.value })}
                      placeholder="Item Code"
                    />
                    <Input
                      value={l.itemName}
                      onChange={(e) => updateLine(l.id, { itemName: e.target.value })}
                      placeholder="Item Name (optional)"
                    />
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Line {idx + 1}</Badge>
                      {l.uom ? <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{l.uom}</Badge> : null}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Input value={l.lotNo} onChange={(e) => updateLine(l.id, { lotNo: e.target.value })} placeholder="Lot No (optional)" />
                    <Input value={l.serialNo} onChange={(e) => updateLine(l.id, { serialNo: e.target.value })} placeholder="Serial No (optional)" />
                    <Input value={l.uom} onChange={(e) => updateLine(l.id, { uom: e.target.value })} placeholder="UOM (optional)" />
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Input value={l.availableQty == null ? "" : String(l.availableQty)} readOnly placeholder="-" />
                      <Button variant="outline" onClick={() => handleCheckAvailability(l)} disabled={!hasItem || !fromWarehouse}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Checks availability in <span className="font-medium">{fromWarehouse || "source WH"}</span>
                    </p>
                  </div>

                  <div className="col-span-2">
                    <Input
                      value={qty}
                      onChange={(e) => updateLine(l.id, { qty: e.target.value })}
                      placeholder="Qty"
                      inputMode="decimal"
                    />
                    <p className="mt-1 text-xs text-gray-500">Supports decimals for liquids/chemicals.</p>
                  </div>

                  <div className="col-span-3">
                    <Textarea value={l.remarks} onChange={(e) => updateLine(l.id, { remarks: e.target.value })} placeholder="Remarks..." />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button variant="outline" onClick={() => requestRemoveLine(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Footer hint */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Tip:</span> Use <span className="font-semibold">Quarantine</span> warehouse for suspect lots,
            and move back only after QA release.
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              Source: <span className="ml-1 font-semibold">{fromWarehouse || "-"}</span>
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              Destination: <span className="ml-1 font-semibold">{toWarehouse || "-"}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reset confirm */}
      <ConfirmationDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset transfer?"
        description="This will clear all entered fields and lines."
        confirmText="Reset"
        variant="destructive"
        onConfirm={() => {
          setResetOpen(false);
          resetForm();
          toast({ title: "Reset done", description: "Transfer form cleared." });
        }}
      />

      {/* Remove line confirm */}
      <ConfirmationDialog
        open={!!removeLineId}
        onOpenChange={(v) => !v && setRemoveLineId(null)}
        title="Remove this line?"
        description="This line will be removed from the transfer."
        confirmText="Remove"
        variant="destructive"
        onConfirm={confirmRemoveLine}
      />
    </div>
  );
}
