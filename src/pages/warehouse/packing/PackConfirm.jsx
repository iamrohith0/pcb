// src/pages/warehouse/packing/PackConfirm.jsx
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import { motion } from "framer-motion";
import {
    ArrowLeft,
    Barcode,
    Box,
    Boxes,
    CheckCircle2,
    ClipboardList,
    Hash,
    Package,
    QrCode,
    RefreshCw,
    ShieldAlert,
    Truck,
    Weight,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/**
 * PackConfirm.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/packing/PackConfirm.jsx
 *
 * Purpose:
 * - Confirm packing for a Shipment / Dispatch order
 * - Scan items/serial/lot, validate quantities, generate carton labels
 * - Capture weight/dimensions & packing notes
 *
 * Replace mocks with API:
 * - packingService.getPackJob(pack_id)
 * - packingService.scan({ pack_id, code })
 * - packingService.updateCarton({ pack_id, carton_id, weight, dims })
 * - packingService.confirm({ pack_id, notes })
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_BADGE = {
  draft: "bg-gray-100 text-gray-700",
  packing: "bg-amber-100 text-amber-800",
  ready: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
};

function Mini({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50">
        <Icon className="h-4 w-4 text-gray-700" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">{children}</div>;
}
function Col({ span = 6, children }) {
  return <div className={cx("lg:col-span-12", span ? `lg:col-span-${span}` : "")}>{children}</div>;
}

export default function PackConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // pack_id from route state or query (mock)
  const packId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("pack_id") || "PACK-2026-00012";
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [scan, setScan] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [pack, setPack] = useState(() => ({
    id: packId,
    status: "packing",
    shipment_no: "SHP-2026-00188",
    dispatch_no: "DSP-2026-00044",
    customer: "Aster Electronics Pvt Ltd",
    ship_to: "Bengaluru, KA",
    priority: "Normal",
    carrier: "BlueDart",
    service: "Surface",
    incoterm: "DAP",
    created_at: "Today 10:15",
    lines: [
      {
        id: "L1",
        sku: "PCB-4L-100x80",
        description: "4 Layer FR4, 1.6mm, ENIG, 100x80",
        uom: "PCS",
        ordered: 300,
        packed: 220,
        remaining: 80,
        track: "lot",
      },
      {
        id: "L2",
        sku: "PCB-2L-50x50",
        description: "2 Layer FR4, 1.6mm, HASL, 50x50",
        uom: "PCS",
        ordered: 500,
        packed: 500,
        remaining: 0,
        track: "none",
      },
    ],
    cartons: [
      {
        id: "C1",
        carton_no: "CTN-01",
        status: "open",
        weight_kg: 6.4,
        dims_cm: "35 x 25 x 18",
        items: [
          { sku: "PCB-4L-100x80", qty: 120 },
          { sku: "PCB-2L-50x50", qty: 250 },
        ],
      },
      {
        id: "C2",
        carton_no: "CTN-02",
        status: "open",
        weight_kg: 5.1,
        dims_cm: "35 x 25 x 18",
        items: [{ sku: "PCB-4L-100x80", qty: 100 }],
      },
    ],
    qa_hold: false,
  }));

  const totals = useMemo(() => {
    const totalLines = pack.lines.length;
    const ordered = pack.lines.reduce((a, l) => a + l.ordered, 0);
    const packed = pack.lines.reduce((a, l) => a + l.packed, 0);
    const remaining = pack.lines.reduce((a, l) => a + l.remaining, 0);
    const cartons = pack.cartons.length;
    const totalWeight = pack.cartons.reduce((a, c) => a + (Number(c.weight_kg) || 0), 0);
    return { totalLines, ordered, packed, remaining, cartons, totalWeight: totalWeight.toFixed(1) };
  }, [pack]);

  const canConfirm = useMemo(() => {
    if (pack.qa_hold) return false;
    if (pack.status === "confirmed") return false;
    return totals.remaining === 0 && pack.cartons.length > 0;
  }, [pack.qa_hold, pack.status, totals.remaining, pack.cartons.length]);

  useEffect(() => {
    // Simulate fetch pack job
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [packId]);

  const refresh = async () => {
    setLoading(true);
    try {
      // await packingService.getPackJob(packId)
      await new Promise((r) => setTimeout(r, 350));
      toast({ title: "Refreshed", description: "Packing job reloaded." });
    } finally {
      setLoading(false);
    }
  };

  const onScanSubmit = async (e) => {
    e.preventDefault();
    const code = scan.trim();
    if (!code) return;

    setLoading(true);
    try {
      // await packingService.scan({ pack_id: packId, code })
      // MOCK rules:
      // - If SKU contains PCB-4L-100x80 -> add 10 pcs if remaining >0
      // - If blocked/hold -> error
      if (pack.qa_hold) {
        toast({
          title: "QA Hold",
          description: "This shipment is on QA hold. Unblock before packing.",
          variant: "destructive",
        });
        return;
      }

      let updated = { ...pack };
      if (code.includes("PCB-4L-100x80")) {
        updated.lines = updated.lines.map((l) => {
          if (l.sku !== "PCB-4L-100x80") return l;
          const add = Math.min(10, l.remaining);
          return { ...l, packed: l.packed + add, remaining: l.remaining - add };
        });
      } else if (code.includes("PCB-2L-50x50")) {
        updated.lines = updated.lines.map((l) => {
          if (l.sku !== "PCB-2L-50x50") return l;
          if (l.remaining <= 0) return l;
          const add = Math.min(10, l.remaining);
          return { ...l, packed: l.packed + add, remaining: l.remaining - add };
        });
      } else {
        toast({
          title: "Unknown code",
          description: "Scan a valid SKU / lot / serial code for this pack job.",
          variant: "destructive",
        });
        return;
      }

      setPack(updated);
      toast({ title: "Scanned", description: `Captured: ${code}` });
      setScan("");
    } finally {
      setLoading(false);
    }
  };

  const updateCarton = (cartonId, patch) => {
    setPack((p) => ({
      ...p,
      cartons: p.cartons.map((c) => (c.id === cartonId ? { ...c, ...patch } : c)),
    }));
  };

  const printLabel = (carton) => {
    toast({
      title: "Label queued",
      description: `Carton ${carton.carton_no} label will be generated/printed.`,
    });
  };

  const requestConfirm = () => {
    if (!canConfirm) {
      toast({
        title: "Cannot confirm",
        description: pack.qa_hold
          ? "Shipment is on QA hold."
          : totals.remaining > 0
            ? "Some items are still pending to pack."
            : "Add at least one carton.",
        variant: "destructive",
      });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmPacking = async () => {
    setConfirmOpen(false);
    setConfirming(true);
    try {
      // await packingService.confirm({ pack_id: packId, notes })
      await new Promise((r) => setTimeout(r, 450));
      setPack((p) => ({ ...p, status: "confirmed" }));
      toast({ title: "Packing confirmed", description: "Shipment is ready for dispatch & tracking." });
      // navigate(`/logistics/shipments/${pack.shipment_no}`)
    } catch (e) {
      toast({ title: "Confirm failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <Package className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Pack Confirm</h1>
              <Badge className={cx("rounded-full", STATUS_BADGE[pack.status] || STATUS_BADGE.draft)}>
                {pack.status.toUpperCase()}
              </Badge>
              {pack.qa_hold && (
                <Badge className="rounded-full bg-red-100 text-red-800">
                  <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                  QA HOLD
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Confirm packing for dispatch (PCBxpress). Scan SKUs / lots, validate quantities, finalize cartons.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/warehouse/packing">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            onClick={requestConfirm}
            disabled={confirming || loading || !canConfirm}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            title={!canConfirm ? "All items must be packed (remaining = 0) and cartons must exist" : "Confirm packing"}
          >
            <CheckCircle2 className="h-4 w-4" />
            {confirming ? "Confirming..." : "Confirm Packing"}
          </Button>
        </div>
      </div>

      {/* Top summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Mini icon={ClipboardList} label="Lines" value={totals.totalLines} />
        <Mini icon={Boxes} label="Ordered" value={totals.ordered} />
        <Mini icon={Box} label="Packed" value={totals.packed} />
        <Mini icon={XCircle} label="Remaining" value={totals.remaining} />
        <Mini icon={Package} label="Cartons" value={totals.cartons} />
        <Mini icon={Weight} label="Total kg" value={totals.totalWeight} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Shipment meta + scan */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Shipment Info</CardTitle>
              <CardDescription>Dispatch, customer and carrier details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="rounded-xl border bg-white p-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Pack ID</span>
                    <span className="font-semibold text-gray-900">{pack.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Shipment</span>
                    <span className="font-semibold text-gray-900">{pack.shipment_no}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Dispatch</span>
                    <span className="font-semibold text-gray-900">{pack.dispatch_no}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-semibold text-gray-900">{pack.customer}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Ship to</span>
                    <span className="font-semibold text-gray-900">{pack.ship_to}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Carrier</span>
                    <span className="font-semibold text-gray-900">
                      {pack.carrier} <span className="text-gray-500">({pack.service})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Incoterm</span>
                    <span className="font-semibold text-gray-900">{pack.incoterm}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Created</span>
                    <span className="font-semibold text-gray-900">{pack.created_at}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Scan to pack</p>
                <form onSubmit={onScanSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="scan">Scan SKU / Lot / Serial</Label>
                    <div className="relative">
                      <QrCode className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="scan"
                        value={scan}
                        onChange={(e) => setScan(e.target.value)}
                        placeholder='e.g. "PCB-4L-100x80-LOT-001"'
                        className="pl-9"
                        disabled={loading || pack.status === "confirmed"}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Tip: scanning updates the packed quantity for the matching line item.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !scan.trim() || pack.status === "confirmed"}
                    className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500"
                  >
                    <Barcode className="h-4 w-4" />
                    Add Scan
                  </Button>
                </form>
              </div>

              <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Packing validation</p>
                    <p className="mt-1 text-xs text-amber-900/80">
                      Confirm is enabled only when <span className="font-semibold">Remaining = 0</span> and at least one carton exists.
                      Block/QA hold disables packing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Middle: Lines */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Packing Lines</CardTitle>
              <CardDescription>Ordered vs packed quantities per PCB item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {pack.lines.map((l) => {
                const pct = l.ordered ? Math.round((l.packed / l.ordered) * 100) : 0;
                const done = l.remaining === 0;
                return (
                  <div key={l.id} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{l.sku}</p>
                        <p className="mt-1 text-xs text-gray-600">{l.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5" /> {l.uom}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Boxes className="h-3.5 w-3.5" /> Track: {l.track}
                          </span>
                        </div>
                      </div>
                      <Badge className={cx("rounded-full", done ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800")}>
                        {done ? "DONE" : "IN PROGRESS"}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Ordered</p>
                        <p className="font-bold text-gray-900">{l.ordered}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Packed</p>
                        <p className="font-bold text-gray-900">{l.packed}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Remaining</p>
                        <p className={cx("font-bold", l.remaining ? "text-[#dc2551]" : "text-gray-900")}>{l.remaining}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-black/5">
                        <div className="h-2 rounded-full bg-black/20" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-gray-600">{pct}% packed</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Cartons + notes */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Cartons</CardTitle>
              <CardDescription>Update weight/dimensions and print carton labels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {pack.cartons.map((c) => (
                <div key={c.id} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.carton_no}</p>
                      <p className="mt-1 text-xs text-gray-600">Status: {c.status}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => printLabel(c)}>
                      <QrCode className="h-4 w-4" />
                      Label
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <div className="relative">
                        <Weight className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="number"
                          step="0.1"
                          className="pl-9"
                          value={c.weight_kg}
                          onChange={(e) => updateCarton(c.id, { weight_kg: e.target.value })}
                          disabled={pack.status === "confirmed"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Dimensions (cm)</Label>
                      <div className="relative">
                        <Truck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-9"
                          value={c.dims_cm}
                          onChange={(e) => updateCarton(c.id, { dims_cm: e.target.value })}
                          placeholder="L x W x H"
                          disabled={pack.status === "confirmed"}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Contents</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-700">
                        {c.items.map((it, idx) => (
                          <div key={`${c.id}-${idx}`} className="flex items-center justify-between">
                            <span className="font-medium">{it.sku}</span>
                            <span className="text-gray-600">{it.qty} pcs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Packing notes</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. ESD bag used, corner protectors added, fragile label applied..."
                  className="min-h-[90px]"
                  disabled={pack.status === "confirmed"}
                />
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {pack.cartons.length} carton(s)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Boxes className="h-4 w-4" />
                    Remaining: <span className="font-semibold text-gray-800">{totals.remaining}</span>
                  </span>
                </div>
              </div>

              {!canConfirm && (
                <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-900">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-semibold">Confirm disabled</p>
                      <p className="mt-1 text-xs text-red-900/80">
                        {pack.qa_hold
                          ? "Shipment is on QA hold."
                          : totals.remaining > 0
                            ? "Pack all pending quantities (Remaining must be 0)."
                            : "Add at least one carton."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm packing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock packing changes and mark the shipment as ready for dispatch & tracking.
              <span className="block pt-2">
                Shipment: <span className="font-medium">{pack.shipment_no}</span> • Dispatch:{" "}
                <span className="font-medium">{pack.dispatch_no}</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPacking}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
