// src/pages/logistics/tracking/DeliveryStatus.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  MapPin,
  PackageCheck,
  PackageOpen,
  RefreshCcw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * DeliveryStatus.jsx (PCBxpress)
 * Purpose:
 * - Track shipment delivery status + timeline events
 * - Manual status update + carrier polling hook points
 *
 * Hook points (recommended services):
 * - shipmentsService.getById(shipmentId)
 * - trackingService.getTimeline(shipmentId)
 * - trackingService.pollCarrier({ carrier, trackingNo })
 * - trackingService.updateStatus(shipmentId, payload)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = [
  { value: "created", label: "Created" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Delivery Failed" },
  { value: "returned", label: "Returned" },
];

const STATUS_META = {
  created: { tone: "gray", icon: PackageOpen, hint: "Shipment created in ERP" },
  picked_up: { tone: "blue", icon: Truck, hint: "Carrier picked up from plant" },
  in_transit: { tone: "blue", icon: Truck, hint: "Moving through hubs" },
  out_for_delivery: { tone: "amber", icon: Truck, hint: "Courier is on route" },
  delivered: { tone: "green", icon: PackageCheck, hint: "Delivered to consignee" },
  failed: { tone: "red", icon: XCircle, hint: "Attempt failed (address/OTP/unavailable)" },
  returned: { tone: "red", icon: XCircle, hint: "Returned to origin" },
};

const MOCK = {
  shipment: {
    id: "shp-2011",
    shipmentNo: "SHP-000311",
    dispatchNo: "DSP-000214",
    carrier: "Blue Dart",
    trackingNo: "BD123456789",
    status: "in_transit",
    eta: "2026-01-08",
    destination: "Bengaluru, KA",
    addressLine: "Customer Warehouse, Peenya Industrial Area",
  },
  timeline: [
    { id: "t1", time: "2026-01-05 09:22", status: "created", location: "Kochi, KL", note: "Shipment created" },
    { id: "t2", time: "2026-01-05 16:10", status: "picked_up", location: "Kochi, KL", note: "Picked up from Plant Gate 2" },
    { id: "t3", time: "2026-01-06 02:40", status: "in_transit", location: "Coimbatore Hub", note: "Arrived at hub" },
    { id: "t4", time: "2026-01-06 10:15", status: "in_transit", location: "Coimbatore Hub", note: "Departed hub" },
  ],
};

function Badge({ tone = "gray", children }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  };
  return <span className={cx(base, tones[tone] || tones.gray)}>{children}</span>;
}

function statusLabel(value) {
  return STATUS.find((s) => s.value === value)?.label ?? value;
}

function statusTone(value) {
  return STATUS_META[value]?.tone ?? "gray";
}

export default function DeliveryStatus() {
  const { id } = useParams(); // /logistics/tracking/:id (shipmentId)
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(null);
  const [timeline, setTimeline] = useState([]);

  // Search / filter for timeline
  const [q, setQ] = useState("");

  // Manual update
  const [newStatus, setNewStatus] = useState("in_transit");
  const [newLocation, setNewLocation] = useState("");
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Carrier poll
  const [polling, setPolling] = useState(false);

  // Confirm dialog for "Mark Delivered"
  const [confirmDelivered, setConfirmDelivered] = useState(false);

  useEffect(() => {
    // TODO replace with API:
    // shipmentsService.getById(id)
    // trackingService.getTimeline(id)
    setLoading(true);
    const t = setTimeout(() => {
      setShipment({ ...MOCK.shipment, id: id || MOCK.shipment.id });
      setTimeline(MOCK.timeline);
      setNewStatus(MOCK.shipment.status || "in_transit");
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [id]);

  const filteredTimeline = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return timeline;
    return timeline.filter((t) => {
      return (
        (t.time || "").toLowerCase().includes(query) ||
        statusLabel(t.status).toLowerCase().includes(query) ||
        (t.location || "").toLowerCase().includes(query) ||
        (t.note || "").toLowerCase().includes(query)
      );
    });
  }, [timeline, q]);

  const copy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: label, description: text });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  };

  const pollCarrier = async () => {
    if (!shipment?.trackingNo) {
      toast({ title: "Missing tracking number", description: "Add tracking number to poll carrier.", variant: "destructive" });
      return;
    }
    setPolling(true);
    try {
      // TODO: trackingService.pollCarrier({ carrier: shipment.carrier, trackingNo: shipment.trackingNo })
      await new Promise((r) => setTimeout(r, 600));

      toast({
        title: "Carrier sync complete",
        description: "Hook this to carrier API/webhook to refresh status & timeline.",
      });
    } catch {
      toast({ title: "Sync failed", description: "Carrier poll failed. Try again.", variant: "destructive" });
    } finally {
      setPolling(false);
    }
  };

  const addTimelineEvent = async () => {
    if (!newStatus) return;

    // For delivered we want confirm
    if (newStatus === "delivered") {
      setConfirmDelivered(true);
      return;
    }

    await persistStatusUpdate();
  };

  const persistStatusUpdate = async () => {
    if (!shipment) return;

    setSaving(true);
    try {
      // TODO: trackingService.updateStatus(shipment.id, { status: newStatus, location: newLocation, note: newNote })
      await new Promise((r) => setTimeout(r, 450));

      const now = new Date();
      const stamp = now.toISOString().slice(0, 16).replace("T", " ");
      const evt = {
        id: `t-${Date.now()}`,
        time: stamp,
        status: newStatus,
        location: newLocation?.trim() || "—",
        note: newNote?.trim() || "",
      };

      setTimeline((prev) => [evt, ...prev]);
      setShipment((prev) => ({ ...prev, status: newStatus }));

      setNewLocation("");
      setNewNote("");

      toast({ title: "Updated", description: `Status set to ${statusLabel(newStatus)}.` });
    } catch {
      toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const currentMeta = shipment ? STATUS_META[shipment.status] : null;
  const CurrentIcon = currentMeta?.icon || Clock;

  if (loading || !shipment) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-72 animate-pulse rounded bg-gray-200" />
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-10 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="secondary" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Delivery Status • {shipment.shipmentNo}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>Carrier:</span>
              <Badge tone="gray">{shipment.carrier}</Badge>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-2">
                <span className="text-gray-500">Tracking:</span>
                <button
                  className="inline-flex items-center gap-2 font-semibold text-gray-900 hover:text-[#dc2551]"
                  onClick={() => copy(shipment.trackingNo, "Tracking copied")}
                >
                  {shipment.trackingNo || "—"}
                  <ClipboardCopy className="h-4 w-4 text-gray-400" />
                </button>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={pollCarrier} disabled={polling}>
            <RefreshCcw className={cx("h-4 w-4", polling ? "animate-spin" : "")} />
            {polling ? "Syncing..." : "Sync Carrier"}
          </Button>
          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => {
              const el = document.getElementById("manual-update");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Truck className="h-4 w-4" />
            Update Status
          </Button>
        </div>
      </div>

      {/* Current status card */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551] ring-1 ring-inset ring-[#dc2551]/15">
              <CurrentIcon className="h-5 w-5" />
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">Current</p>
                <Badge tone={statusTone(shipment.status)}>{statusLabel(shipment.status)}</Badge>
                {shipment.eta ? <Badge tone="amber">ETA {shipment.eta}</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {STATUS_META[shipment.status]?.hint || "Tracking status from carrier / ERP updates."}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {shipment.destination}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">{shipment.addressLine}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => navigate(`/logistics/shipments/${shipment.id}`)}
              title="Open shipment details"
            >
              <Search className="h-4 w-4" />
              Shipment Details
            </Button>

            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => toast({ title: "Proof of Delivery", description: "Hook: fetch POD / signed document." })}
            >
              <ShieldCheck className="h-4 w-4" />
              POD
            </Button>
          </div>
        </div>
      </Card>

      {/* Timeline search + list */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-5 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Clock className="h-4 w-4 text-[#dc2551]" />
                Tracking Timeline
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Events can be added manually (ERP) or synced from carrier API/webhooks.
              </p>
            </div>

            <div className="w-full sm:w-80">
              <Label className="sr-only">Search timeline</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search timeline..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          {filteredTimeline.length === 0 ? (
            <div className="rounded-xl border bg-gray-50 p-6 text-center text-sm text-gray-600">
              No timeline events found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTimeline.map((t) => {
                const meta = STATUS_META[t.status] || STATUS_META.created;
                const Icon = meta.icon || Clock;

                return (
                  <div
                    key={t.id}
                    className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551] ring-1 ring-inset ring-[#dc2551]/15">
                        <Icon className="h-5 w-5" />
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
                          {t.location ? (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {t.location}
                            </span>
                          ) : null}
                        </div>

                        {t.note ? <p className="mt-1 text-sm text-gray-700">{t.note}</p> : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                      <span className="text-xs text-gray-500">{t.time}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-gray-600 hover:bg-gray-100"
                        onClick={() => copy(`${t.time} • ${statusLabel(t.status)} • ${t.location || ""} • ${t.note || ""}`, "Event copied")}
                      >
                        <ClipboardCopy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Manual update */}
      <motion.div
        id="manual-update"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Manual Status Update</h2>
              <p className="text-xs text-gray-500">
                Use this if the carrier API is not integrated or you want internal milestone events (OTP confirmed, POD received).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone="gray">PCBxpress Logistics</Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <div className="mt-2">
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Hub / City / Plant gate" />
              </div>
            </div>

            <div>
              <Label>Note</Label>
              <div className="mt-2">
                <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Optional note (OTP verified, POD pending...)" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              <span>Best practice: keep customer-visible events consistent with carrier timeline.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setNewStatus(shipment.status || "in_transit");
                  setNewLocation("");
                  setNewNote("");
                }}
              >
                Reset
              </Button>

              <Button
                className="bg-[#dc2551] hover:bg-[#b02045] gap-2"
                onClick={addTimelineEvent}
                disabled={saving}
              >
                {newStatus === "delivered" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {saving ? "Saving..." : "Mark Delivered"}
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    {saving ? "Saving..." : "Add Event"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Delivered confirm */}
      <ConfirmationDialog
        open={confirmDelivered}
        onOpenChange={setConfirmDelivered}
        title="Mark as Delivered?"
        description="This will set the shipment status to Delivered and add a timeline event. Make sure POD/OTP confirmation is available."
        confirmText="Yes, Delivered"
        confirmVariant="default"
        onConfirm={async () => {
          setConfirmDelivered(false);
          await persistStatusUpdate();
        }}
      />
    </div>
  );
}
