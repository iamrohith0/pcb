// src/pages/warehouse/picking/PickConfirm.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Barcode,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    Factory,
    Hash,
    PackageCheck,
    RefreshCw,
    ScanLine,
    Search,
    ShieldCheck,
    Truck,
    XCircle,
} from "lucide-react";

import api from "@/lib/axios";

/**
 * PCBxpress ERP — Warehouse → Picking → Pick Confirm
 * File: src/pages/warehouse/picking/PickConfirm.jsx
 *
 * Goal:
 *  - Confirm a picking task against a Pick List / Shipment / Work Order
 *  - Scan location + item barcode/lot + qty and finalize the pick
 *
 * Suggested backend endpoints (optional):
 *  - GET  /warehouse/pick-lists/:id
 *  - POST /warehouse/pick-lists/:id/confirm     { confirmed_by, lines:[...] }
 *  - POST /warehouse/pick-lists/:id/cancel      { reason }
 *
 * This UI works with demo/local state if endpoints are not ready.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Divider() {
  return <div className="h-px w-full bg-gray-100" />;
}

function parseQuery(search) {
  const p = new URLSearchParams(search || "");
  return {
    pickListId: p.get("pickListId") || "",
    shipmentId: p.get("shipmentId") || "",
    workOrder: p.get("workOrder") || "",
  };
}

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "picked") return <Badge className="rounded-xl bg-green-600 text-white">Picked</Badge>;
  if (s === "partial") return <Badge className="rounded-xl bg-amber-500 text-white">Partial</Badge>;
  if (s === "open") return <Badge variant="secondary" className="rounded-xl">Open</Badge>;
  if (s === "cancelled") return <Badge className="rounded-xl bg-gray-700 text-white">Cancelled</Badge>;
  return <Badge variant="outline" className="rounded-xl">—</Badge>;
}

function normalizeNum(v) {
  const n = Number(String(v || "").trim());
  return Number.isFinite(n) ? n : 0;
}

function safeStr(v) {
  return String(v ?? "");
}

function demoPickList(pickListId, shipmentId) {
  return {
    id: pickListId || "PICK-10021",
    status: "open",
    shipment_id: shipmentId || "SHIP-10582",
    work_order: "WO-22014",
    customer: "Acme Electronics",
    created_at: new Date().toISOString().slice(0, 10),
    priority: "Normal",
    lines: [
      {
        line_id: "L1",
        item_code: "PCB-CTRL-REV-C",
        description: "Controller PCB, 4L, ENIG, 1.6mm",
        required_qty: 500,
        picked_qty: 0,
        uom: "PCS",
        default_location: "WH-A1-R02-B04",
        lot_required: true,
      },
      {
        line_id: "L2",
        item_code: "PCB-SNS-REV-A",
        description: "Sensor PCB, 2L, HASL, 1.0mm",
        required_qty: 250,
        picked_qty: 0,
        uom: "PCS",
        default_location: "WH-A1-R03-B01",
        lot_required: true,
      },
      {
        line_id: "L3",
        item_code: "ESD-BAG-10x12",
        description: "ESD bag 10x12 inch",
        required_qty: 25,
        picked_qty: 0,
        uom: "PCS",
        default_location: "WH-A2-R01-B02",
        lot_required: false,
      },
    ],
  };
}

function computePickStatus(lines) {
  if (!lines?.length) return "open";
  const req = lines.reduce((a, l) => a + normalizeNum(l.required_qty), 0);
  const pk = lines.reduce((a, l) => a + normalizeNum(l.picked_qty), 0);
  if (pk <= 0) return "open";
  if (pk >= req && req > 0) return "picked";
  return "partial";
}

export default function PickConfirm() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const { pickListId: pickListFromQuery, shipmentId: shipFromQuery, workOrder: woFromQuery } = useMemo(
    () => parseQuery(location.search),
    [location.search]
  );

  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const [searchId, setSearchId] = useState(pickListFromQuery || "");
  const [pickList, setPickList] = useState(() => demoPickList(pickListFromQuery, shipFromQuery));

  // Scan inputs
  const [scanLineId, setScanLineId] = useState(pickList?.lines?.[0]?.line_id || "");
  const [scanLocation, setScanLocation] = useState("");
  const [scanItem, setScanItem] = useState("");
  const [scanLot, setScanLot] = useState("");
  const [scanQty, setScanQty] = useState("0");

  const [cancelReason, setCancelReason] = useState("");

  const status = useMemo(() => computePickStatus(pickList?.lines), [pickList?.lines]);

  const selectedLine = useMemo(() => {
    return (pickList?.lines || []).find((l) => l.line_id === scanLineId) || null;
  }, [pickList?.lines, scanLineId]);

  // If query provided WO, keep it
  useEffect(() => {
    if (woFromQuery) {
      setPickList((s) => ({ ...s, work_order: woFromQuery }));
    }
  }, [woFromQuery]);

  const loadPickList = async () => {
    if (!searchId) {
      toast({ title: "Enter Pick List ID", description: "Please enter a Pick List ID to load.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/warehouse/pick-lists/${encodeURIComponent(searchId)}`);
      const data = res.data?.data || res.data;

      const mapped = {
        id: data?.id || searchId,
        status: data?.status || "open",
        shipment_id: data?.shipment_id || data?.shipmentId || "",
        work_order: data?.work_order || data?.workOrder || "",
        customer: data?.customer || data?.customer_name || "",
        created_at: data?.created_at || new Date().toISOString().slice(0, 10),
        priority: data?.priority || "Normal",
        lines: Array.isArray(data?.lines) ? data.lines : [],
      };

      setPickList(mapped);
      setScanLineId(mapped.lines?.[0]?.line_id || "");
      toast({ title: "Loaded", description: `Pick List ${searchId} loaded.` });
    } catch (e) {
      console.warn("Load pick list failed:", e);
      const demo = demoPickList(searchId, shipFromQuery);
      setPickList(demo);
      setScanLineId(demo.lines?.[0]?.line_id || "");
      toast({
        title: "Using demo data",
        description: "Backend endpoint not available. Loaded a demo pick list.",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyScan = () => {
    if (!selectedLine) {
      toast({ title: "Select a line", description: "Please select a pick line first.", variant: "destructive" });
      return;
    }

    const qty = normalizeNum(scanQty);
    if (qty <= 0) {
      toast({ title: "Invalid quantity", description: "Enter a quantity greater than 0.", variant: "destructive" });
      return;
    }

    // Basic validation
    if (scanLocation && selectedLine.default_location && scanLocation !== selectedLine.default_location) {
      toast({
        title: "Location mismatch",
        description: `Expected ${selectedLine.default_location}. You scanned ${scanLocation}.`,
        variant: "destructive",
      });
      return;
    }

    if (scanItem && scanItem !== selectedLine.item_code) {
      toast({
        title: "Item mismatch",
        description: `Expected ${selectedLine.item_code}. You scanned ${scanItem}.`,
        variant: "destructive",
      });
      return;
    }

    if (selectedLine.lot_required && !scanLot) {
      toast({
        title: "Lot required",
        description: "This item requires a Lot/Batch number.",
        variant: "destructive",
      });
      return;
    }

    setPickList((prev) => {
      const lines = (prev.lines || []).map((l) => {
        if (l.line_id !== selectedLine.line_id) return l;
        const nextPicked = normalizeNum(l.picked_qty) + qty;
        const cappedPicked = Math.min(nextPicked, normalizeNum(l.required_qty));
        return {
          ...l,
          picked_qty: cappedPicked,
          last_scan: {
            at: new Date().toISOString(),
            location: scanLocation || l.default_location || "",
            item: scanItem || l.item_code || "",
            lot: scanLot || "",
            qty,
          },
        };
      });

      return { ...prev, lines };
    });

    toast({
      title: "Scan applied",
      description: `Picked ${qty} ${selectedLine.uom} for ${selectedLine.item_code}.`,
    });

    // Clear scan fields (keep location for faster picking)
    setScanItem("");
    setScanLot("");
    setScanQty("0");
  };

  const resetLinePick = (line_id) => {
    setPickList((prev) => ({
      ...prev,
      lines: (prev.lines || []).map((l) => (l.line_id === line_id ? { ...l, picked_qty: 0, last_scan: null } : l)),
    }));
    toast({ title: "Reset", description: "Picked qty reset for the line." });
  };

  const validateBeforeConfirm = () => {
    if (!pickList?.id) return "Pick List ID missing.";
    if (!(pickList?.lines || []).length) return "No lines to confirm.";
    const anyPicked = (pickList.lines || []).some((l) => normalizeNum(l.picked_qty) > 0);
    if (!anyPicked) return "Nothing picked yet. Scan and apply at least one line.";
    return null;
  };

  const confirmPick = async () => {
    const err = validateBeforeConfirm();
    if (err) {
      toast({ title: "Cannot confirm", description: err, variant: "destructive" });
      setConfirmOpen(false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pick_list_id: pickList.id,
        shipment_id: pickList.shipment_id,
        work_order: pickList.work_order,
        status,
        lines: (pickList.lines || []).map((l) => ({
          line_id: l.line_id,
          item_code: l.item_code,
          required_qty: l.required_qty,
          picked_qty: l.picked_qty,
          uom: l.uom,
          location: l.last_scan?.location || l.default_location || "",
          lot: l.last_scan?.lot || "",
          last_scan_at: l.last_scan?.at || null,
        })),
        confirmed_at: new Date().toISOString(),
      };

      await api.post(`/warehouse/pick-lists/${encodeURIComponent(pickList.id)}/confirm`, payload);

      toast({ title: "Pick confirmed", description: `Pick List ${pickList.id} confirmed successfully.` });
      setPickList((s) => ({ ...s, status: status }));
      setConfirmOpen(false);

      // Optional navigate to packing
      navigate(`/warehouse/packing/packing-slip?shipmentId=${encodeURIComponent(pickList.shipment_id || "")}`, {
        replace: false,
      });
    } catch (e) {
      console.warn("Confirm pick failed:", e);
      toast({
        title: "Saved locally (demo)",
        description: "Backend confirm endpoint not available. Your picks are reflected in UI.",
      });
      setPickList((s) => ({ ...s, status: status }));
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelPickList = async () => {
    if (!cancelReason.trim()) {
      toast({ title: "Reason required", description: "Please enter a cancel reason.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.post(`/warehouse/pick-lists/${encodeURIComponent(pickList.id)}/cancel`, { reason: cancelReason.trim() });
      toast({ title: "Cancelled", description: `Pick List ${pickList.id} cancelled.` });
      setPickList((s) => ({ ...s, status: "cancelled" }));
      setCancelOpen(false);
    } catch (e) {
      console.warn("Cancel pick list failed:", e);
      toast({
        title: "Cancelled locally (demo)",
        description: "Backend cancel endpoint not available. Marked cancelled in UI.",
      });
      setPickList((s) => ({ ...s, status: "cancelled" }));
      setCancelOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const req = (pickList?.lines || []).reduce((a, l) => a + normalizeNum(l.required_qty), 0);
    const pk = (pickList?.lines || []).reduce((a, l) => a + normalizeNum(l.picked_qty), 0);
    const remaining = Math.max(0, req - pk);
    return { req, pk, remaining };
  }, [pickList?.lines]);

  const canEdit = String(pickList?.status || "").toLowerCase() !== "cancelled";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pick Confirm</h1>
            <p className="text-sm text-gray-600">
              Confirm picking for shipments/work orders with barcode + lot tracking (PCBxpress ERP).
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-xl gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Traceable lots
              </Badge>
              <Badge variant="secondary" className="rounded-xl gap-1">
                <Truck className="h-3.5 w-3.5" />
                Shipment-linked
              </Badge>
              {statusBadge(pickList?.status || status)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/warehouse/picking">
              <ClipboardList className="h-4 w-4" />
              Picking
            </Link>
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setCancelOpen(true)}
            disabled={loading || !pickList?.id || String(pickList?.status || "").toLowerCase() === "cancelled"}
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => setConfirmOpen(true)}
            disabled={loading || !canEdit}
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm Pick
          </Button>
        </div>
      </div>

      {/* Load Pick list */}
      <Card className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="flex items-end gap-2">
              <div className="w-full space-y-1.5">
                <Label>Load by Pick List ID</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="PICK-10021"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={loadPickList} disabled={loading}>
                <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
                Load
              </Button>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-3">
            <div className="rounded-2xl border bg-gray-50 p-3">
              <div className="text-[11px] text-gray-500">Shipment</div>
              <div className="text-sm font-semibold text-gray-900">{pickList?.shipment_id || "—"}</div>
            </div>
            <div className="rounded-2xl border bg-gray-50 p-3">
              <div className="text-[11px] text-gray-500">Work Order</div>
              <div className="text-sm font-semibold text-gray-900">{pickList?.work_order || "—"}</div>
            </div>
            <div className="rounded-2xl border bg-gray-50 p-3">
              <div className="text-[11px] text-gray-500">Customer</div>
              <div className="text-sm font-semibold text-gray-900">{pickList?.customer || "—"}</div>
            </div>
          </div>
        </div>

        <Divider />

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Pick List</div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <div className="text-sm font-semibold text-gray-900">{pickList?.id || "—"}</div>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Status</div>
            <div className="mt-1">{statusBadge(status)}</div>
          </div>
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Required Qty</div>
            <div className="text-sm font-semibold text-gray-900">{totals.req}</div>
          </div>
          <div className="rounded-2xl border bg-white p-3">
            <div className="text-[11px] text-gray-500">Picked / Remaining</div>
            <div className="text-sm font-semibold text-gray-900">
              {totals.pk} / {totals.remaining}
            </div>
          </div>
        </div>
      </Card>

      {/* Scan & lines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Scan panel */}
        <Card className="rounded-2xl border bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Scan & Pick</p>
              <p className="text-xs text-gray-500">Scan location → item → lot (if required) → qty → Apply</p>
            </div>
            <Badge variant="outline" className="rounded-xl gap-1">
              <ScanLine className="h-3.5 w-3.5" />
              Scan Mode
            </Badge>
          </div>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label>Pick Line</Label>
              <select
                className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={scanLineId}
                onChange={(e) => setScanLineId(e.target.value)}
                disabled={!canEdit}
              >
                {(pickList?.lines || []).map((l) => (
                  <option key={l.line_id} value={l.line_id}>
                    {l.item_code} — Req {l.required_qty} {l.uom} (Picked {l.picked_qty})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Location (scan)</Label>
                <div className="relative">
                  <Barcode className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={scanLocation}
                    onChange={(e) => setScanLocation(e.target.value)}
                    placeholder={selectedLine?.default_location || "WH-A1-R02-B04"}
                    className="pl-9"
                    disabled={!canEdit}
                  />
                </div>
                {selectedLine?.default_location ? (
                  <p className="text-xs text-gray-500">
                    Expected: <span className="font-medium text-gray-700">{selectedLine.default_location}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Item Code (scan)</Label>
                <div className="relative">
                  <PackageCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={scanItem}
                    onChange={(e) => setScanItem(e.target.value)}
                    placeholder={selectedLine?.item_code || "PCB-CTRL-REV-C"}
                    className="pl-9"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Lot / Batch{" "}
                  {selectedLine?.lot_required ? <span className="text-[#dc2551]">*</span> : <span className="text-gray-400">(optional)</span>}
                </Label>
                <div className="relative">
                  <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={scanLot}
                    onChange={(e) => setScanLot(e.target.value)}
                    placeholder={selectedLine?.lot_required ? "FG-LOT-00031" : "—"}
                    className="pl-9"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Qty</Label>
                <Input value={scanQty} onChange={(e) => setScanQty(e.target.value)} placeholder="0" disabled={!canEdit} />
                <p className="text-xs text-gray-500">
                  Remaining for line:{" "}
                  <span className="font-medium text-gray-700">
                    {Math.max(0, normalizeNum(selectedLine?.required_qty) - normalizeNum(selectedLine?.picked_qty))}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                onClick={applyScan}
                disabled={loading || !canEdit}
              >
                <ClipboardCheck className="h-4 w-4" />
                Apply Scan
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setScanLocation("");
                  setScanItem("");
                  setScanLot("");
                  setScanQty("0");
                }}
                disabled={!canEdit}
              >
                <RefreshCw className="h-4 w-4" />
                Clear
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (!selectedLine?.item_code) return;
                  toast({
                    title: "Tip",
                    description: "Hook a barcode scanner to fill these inputs automatically.",
                  });
                }}
              >
                <ScanLine className="h-4 w-4" />
                Scanner tip
              </Button>
            </div>
          </div>
        </Card>

        {/* Lines panel */}
        <Card className="rounded-2xl border bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Pick Lines</p>
              <p className="text-xs text-gray-500">Track required vs picked quantities per SKU.</p>
            </div>
            <Badge variant="secondary" className="rounded-xl gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              {pickList?.lines?.length || 0} lines
            </Badge>
          </div>

          <Divider />

          <div className="mt-4 space-y-3">
            {(pickList?.lines || []).map((l) => {
              const req = normalizeNum(l.required_qty);
              const pk = normalizeNum(l.picked_qty);
              const rem = Math.max(0, req - pk);
              const pct = req > 0 ? Math.min(100, Math.round((pk / req) * 100)) : 0;

              return (
                <div key={l.line_id} className="rounded-2xl border bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{l.item_code}</span>
                        {pk >= req && req > 0 ? (
                          <Badge className="rounded-xl bg-green-600 text-white">Complete</Badge>
                        ) : pk > 0 ? (
                          <Badge className="rounded-xl bg-amber-500 text-white">In progress</Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-xl">Not started</Badge>
                        )}
                        {l.lot_required ? (
                          <Badge variant="outline" className="rounded-xl">Lot required</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-xl">No lot</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{l.description}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5 text-gray-400" />
                          Line: {l.line_id}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Barcode className="h-3.5 w-3.5 text-gray-400" />
                          Loc: {l.default_location || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Req / Picked / Rem</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {req} / {pk} / {rem} {l.uom}
                        </div>
                      </div>

                      <div className="w-40 overflow-hidden rounded-full bg-white border">
                        <div
                          className="h-2 rounded-full bg-[#dc2551]"
                          style={{ width: `${pct}%` }}
                          aria-label={`Progress ${pct}%`}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScanLineId(l.line_id)}
                          className="gap-2"
                        >
                          <ScanLine className="h-4 w-4" />
                          Select
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetLinePick(l.line_id)}
                          disabled={!canEdit}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>

                  {l.last_scan ? (
                    <div className="mt-3 rounded-xl border bg-white p-3 text-xs text-gray-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <ScanLine className="h-3.5 w-3.5" />
                          Last scan
                        </span>
                        <span className="text-gray-500">{new Date(l.last_scan.at).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div>
                          <span className="text-gray-500">Location:</span> {l.last_scan.location || "—"}
                        </div>
                        <div>
                          <span className="text-gray-500">Lot:</span> {l.last_scan.lot || "—"}
                        </div>
                        <div>
                          <span className="text-gray-500">Qty:</span>{" "}
                          <span className="font-semibold">{l.last_scan.qty}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Pick List?</AlertDialogTitle>
            <AlertDialogDescription>
              This will confirm picking for <span className="font-semibold">{pickList?.id || "—"}</span>.
              Status will be saved as <span className="font-semibold">{status}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPick} disabled={loading}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Pick List?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling will stop this pick list and prevent further scans. Add a reason for audit logs.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-3 space-y-1.5">
            <Label>Cancel reason</Label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Shipment cancelled / Wrong allocation / Stock issue"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={cancelPickList} disabled={loading}>
              Cancel Pick List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
