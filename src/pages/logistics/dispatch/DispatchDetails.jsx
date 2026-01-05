// src/pages/logistics/dispatch/DispatchDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

import {
  ArrowLeft,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  MapPin,
  Package,
  Printer,
  QrCode,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

/**
 * PCBxpress - DispatchDetails
 * Purpose:
 * - Show dispatch header info + package info + documents + tracking + status timeline
 * - Quick actions: Open checklist, Print docs, Mark packed, Mark shipped/dispatched
 *
 * Notes:
 * - API is mocked. Replace mockFetch/mockSave with real services later.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDateTime(value) {
  try {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return value ?? "-";
  }
}

function StatusPill({ status }) {
  const map = {
    Draft: "bg-gray-100 text-gray-700",
    Packed: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
    Ready: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    Blocked: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    Dispatched: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
    Delivered: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", map[status] || map.Draft)}>
      {status || "Draft"}
    </span>
  );
}

function Timeline({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-[#dc2551]/10 text-[#dc2551]">
            {it.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 text-gray-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-gray-900">{it.title}</p>
              {it.when ? <span className="text-xs text-gray-500">{formatDateTime(it.when)}</span> : null}
            </div>
            {it.note ? <p className="text-xs text-gray-500">{it.note}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------- Mock data / API stubs (replace with real services) -------
async function mockFetchDispatch(dispatchId) {
  await new Promise((r) => setTimeout(r, 250));

  return {
    id: dispatchId || "DSP-000124",
    status: "Packed",
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),

    customer: { name: "Acme Electronics", code: "ACME" },
    order: {
      soNo: "SO-1042",
      woNo: "WO-7781",
      poNo: "PO-ACME-221",
      incoterm: "DAP",
      shipTo: {
        name: "Acme Electronics - Receiving",
        address1: "Plot 21, Industrial Area",
        address2: "Whitefield",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560066",
        country: "India",
        phone: "+91 98xxxxxx12",
        email: "stores@acme.com",
        gstin: "29ABCDE1234F1Z5",
      },
    },

    shipment: {
      carrier: "BlueDart",
      service: "Air Express",
      trackingNo: "",
      pickupAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
      boxes: 2,
      weightKg: 8.4,
      dimensions: "40x30x25 cm (each)",
      insured: true,
      fragile: true,
    },

    packing: {
      esd: true,
      desiccant: true,
      humidityCard: true,
      edgeProtectors: true,
      cartonSealed: true,
      labelCustomer: true,
      labelInternal: true,
    },

    documents: {
      invoiceNo: "INV-2026-00142",
      packingListNo: "PL-2026-00101",
      coc: true,
      testReport: true,
      msds: false,
    },

    items: [
      {
        line: 1,
        partNo: "PCB-ACME-4L-001",
        rev: "B",
        finish: "ENIG",
        qty: 120,
        uom: "pcs",
        panelCount: 12,
        lotNo: "L-102",
        serialRange: "S0001201 - S0001320",
      },
      {
        line: 2,
        partNo: "PCB-ACME-2L-009",
        rev: "A",
        finish: "HASL LF",
        qty: 60,
        uom: "pcs",
        panelCount: 6,
        lotNo: "L-103",
        serialRange: "S0001321 - S0001380",
      },
    ],

    timeline: [
      { title: "Dispatch created", ok: true, when: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), note: "SO linked and shipment initiated" },
      { title: "QC released", ok: true, when: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), note: "Final inspection approved" },
      { title: "Packed", ok: true, when: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), note: "ESD + desiccant + labels applied" },
      { title: "Dispatched", ok: false, when: null, note: "Waiting for tracking / handover" },
    ],

    notes: "",
  };
}

async function mockSaveDispatch(dispatchId, payload) {
  await new Promise((r) => setTimeout(r, 250));
  return { ok: true, id: dispatchId, ...payload };
}
// ------------------------------------------------------------------

export default function DispatchDetails() {
  const { dispatchId } = useParams(); // route: /logistics/dispatch/:dispatchId
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dispatch, setDispatch] = useState(null);

  // editable bits (for demo)
  const [trackingNo, setTrackingNo] = useState("");
  const [carrier, setCarrier] = useState("");
  const [service, setService] = useState("");
  const [boxes, setBoxes] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");

  const [fragile, setFragile] = useState(false);
  const [insured, setInsured] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await mockFetchDispatch(dispatchId);
        if (!alive) return;
        setDispatch(data);

        setTrackingNo(data?.shipment?.trackingNo || "");
        setCarrier(data?.shipment?.carrier || "");
        setService(data?.shipment?.service || "");
        setBoxes(String(data?.shipment?.boxes ?? ""));
        setWeightKg(String(data?.shipment?.weightKg ?? ""));
        setFragile(Boolean(data?.shipment?.fragile));
        setInsured(Boolean(data?.shipment?.insured));
        setNotes(data?.notes || "");
      } catch (e) {
        console.error(e);
        toast({ title: "Failed to load dispatch", description: "Please try again.", variant: "destructive" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dispatchId, toast]);

  const meta = dispatch || {};
  const order = meta.order || {};
  const ship = meta.shipment || {};
  const docs = meta.documents || {};
  const addr = order.shipTo || {};
  const customer = meta.customer || {};

  const canDispatch = useMemo(() => {
    // minimal gate: tracking no + boxes + weight
    return Boolean(trackingNo?.trim()) && Number(boxes) > 0 && Number(weightKg) > 0;
  }, [trackingNo, boxes, weightKg]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!meta?.id) return;
    setSaving(true);
    try {
      await mockSaveDispatch(meta.id, {
        shipment: {
          carrier,
          service,
          trackingNo,
          boxes: Number(boxes || 0),
          weightKg: Number(weightKg || 0),
          fragile,
          insured,
        },
        notes,
        updatedAt: new Date().toISOString(),
      });

      toast({ title: "Saved", description: "Dispatch details updated." });
      setDispatch((d) =>
        d
          ? {
              ...d,
              shipment: { ...(d.shipment || {}), carrier, service, trackingNo, boxes: Number(boxes || 0), weightKg: Number(weightKg || 0), fragile, insured },
              notes,
              updatedAt: new Date().toISOString(),
            }
          : d
      );
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", description: "Could not save. Try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDispatched = async () => {
    if (!meta?.id) return;
    if (!canDispatch) {
      toast({
        title: "Missing tracking details",
        description: "Add tracking number, boxes and weight to mark as dispatched.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await mockSaveDispatch(meta.id, {
        status: "Dispatched",
        shipment: {
          carrier,
          service,
          trackingNo,
          boxes: Number(boxes || 0),
          weightKg: Number(weightKg || 0),
          fragile,
          insured,
        },
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Dispatched", description: "Shipment marked as dispatched." });
      setDispatch((d) =>
        d
          ? {
              ...d,
              status: "Dispatched",
              updatedAt: new Date().toISOString(),
              timeline: [
                ...(d.timeline || []),
                { title: "Dispatched", ok: true, when: new Date().toISOString(), note: `Tracking: ${trackingNo}` },
              ],
            }
          : d
      );
    } catch (e) {
      console.error(e);
      toast({ title: "Action failed", description: "Unable to mark as dispatched.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-64 animate-pulse rounded bg-gray-100" />
          <div className="h-9 w-48 animate-pulse rounded bg-gray-100" />
        </div>
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Dispatch Details</h1>
              <StatusPill status={meta.status} />
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {meta.id}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Track shipment handover for PCB manufacturing orders — documents, packaging, labels and logistics.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/logistics/dispatch/${meta.id}/checklist`}>
              <ClipboardCheck className="h-4 w-4" />
              Open Checklist
            </Link>
          </Button>

          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
            <ShieldCheck className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>

          <Button
            onClick={handleMarkDispatched}
            disabled={saving || meta.status === "Dispatched"}
            className={cx("gap-2", canDispatch ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 text-gray-700 hover:bg-gray-300")}
            title={!canDispatch ? "Add tracking, boxes & weight" : "Mark dispatched"}
          >
            <Truck className="h-4 w-4" />
            Mark Dispatched
          </Button>
        </div>
      </div>

      {/* Top Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Order & Customer</CardTitle>
            <CardDescription className="text-xs">Linked manufacturing order</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-900">{customer.name || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">SO</span>
              <span className="font-medium text-gray-900">{order.soNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">WO</span>
              <span className="font-medium text-gray-900">{order.woNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Customer PO</span>
              <span className="font-medium text-gray-900">{order.poNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Incoterm</span>
              <span className="font-medium text-gray-900">{order.incoterm || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ship To</CardTitle>
            <CardDescription className="text-xs">Address for delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{addr.name || "-"}</p>
                <p className="text-gray-600">{addr.address1 || ""}{addr.address2 ? `, ${addr.address2}` : ""}</p>
                <p className="text-gray-600">
                  {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")} {addr.country ? `• ${addr.country}` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {addr.phone ? `Phone: ${addr.phone}` : ""} {addr.email ? `• Email: ${addr.email}` : ""}
                </p>
                {addr.gstin ? <p className="text-xs text-gray-500">GSTIN: {addr.gstin}</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Documents</CardTitle>
            <CardDescription className="text-xs">Commercial + compliance docs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Invoice</span>
              <span className="font-medium text-gray-900">{docs.invoiceNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Packing List</span>
              <span className="font-medium text-gray-900">{docs.packingListNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">CoC</span>
              <span className="font-medium text-gray-900">{docs.coc ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Test Reports</span>
              <span className="font-medium text-gray-900">{docs.testReport ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">MSDS</span>
              <span className="font-medium text-gray-900">{docs.msds ? "Yes" : "No"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-base">Dispatch Items</CardTitle>
          <CardDescription className="text-xs">PCB part numbers, lots and traceability details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(meta.items || []).map((it) => (
            <div key={it.line} className="rounded-xl border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{it.partNo}</span>
                    </span>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      Rev {it.rev}
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {it.finish}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Lot: <span className="font-medium text-gray-800">{it.lotNo}</span> • Serial:{" "}
                    <span className="font-medium text-gray-800">{it.serialRange}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">
                    Qty {it.qty} {it.uom}
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    Panels {it.panelCount}
                  </Badge>
                  <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(`${it.partNo} Rev ${it.rev} Lot ${it.lotNo}`)}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shipment editable */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Shipment Details</CardTitle>
            <CardDescription className="text-xs">Carrier & tracking information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g., BlueDart / DTDC" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Input id="service" value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g., Air Express" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking (AWB)</Label>
              <div className="flex gap-2">
                <Input
                  id="tracking"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="Enter tracking number"
                />
                <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(trackingNo || "")} disabled={!trackingNo}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="boxes">Boxes</Label>
                <Input id="boxes" value={boxes} onChange={(e) => setBoxes(e.target.value)} placeholder="e.g., 2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g., 8.4" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fragile</p>
                    <p className="text-xs text-gray-500">Handle with care</p>
                  </div>
                </div>
                <Switch checked={fragile} onCheckedChange={setFragile} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Insured</p>
                    <p className="text-xs text-gray-500">Shipment insurance enabled</p>
                  </div>
                </div>
                <Switch checked={insured} onCheckedChange={setInsured} />
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <p>
                <span className="font-semibold text-gray-800">Pickup:</span> {formatDateTime(ship.pickupAt)}{" "}
                {ship.dimensions ? `• ${ship.dimensions}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription className="text-xs">Dispatch status trail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Timeline items={meta.timeline || []} />

            <div className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">Checklist & Documents</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to={`/logistics/dispatch/${meta.id}/checklist`}>
                      <ClipboardCheck className="h-4 w-4" />
                      Checklist
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      toast({ title: "Print docs", description: "Connect to invoice/packing-list/CoC print endpoints." })
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Docs
                  </Button>
                </div>
              </div>
            </div>

            {!canDispatch ? (
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                <p className="font-semibold">Dispatch not ready</p>
                <p>Add tracking number, boxes and weight to enable “Mark Dispatched”.</p>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200">
                <p className="font-semibold">Ready to dispatch</p>
                <p>Tracking details are complete.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription className="text-xs">Special instructions for packing / courier / customer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Example: Include microsection report. Mark carton 'FRAGILE'. Partial shipment - balance in next batch."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">Last updated: {formatDateTime(meta.updatedAt)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
            <ShieldCheck className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={handleMarkDispatched}
            disabled={saving || meta.status === "Dispatched"}
            className={cx("gap-2", canDispatch ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 text-gray-700 hover:bg-gray-300")}
          >
            <Truck className="h-4 w-4" />
            Mark Dispatched
          </Button>
        </div>
      </div>
    </div>
  );
}
