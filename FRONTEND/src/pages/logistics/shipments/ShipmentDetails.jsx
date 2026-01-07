// src/pages/logistics/shipments/ShipmentDetails.jsx
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
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
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Box,
    Calendar,
    CheckCircle2,
    ClipboardCopy,
    FileDown,
    MapPin,
    Package,
    Phone,
    RefreshCcw,
    Save,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

/**
 * ShipmentDetails.jsx (PCBxpress)
 * - View shipment header + dispatch link + consignee + carrier + tracking
 * - Update shipment status and tracking details
 * - Timeline events (mock)
 *
 * Hook points:
 * - shipmentService.getById(id)
 * - shipmentService.update(id, payload)
 * - shipmentService.exportLabel(id) / exportInvoice(id) etc.
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
  { value: "exception", label: "Exception / Hold" },
];

const CARRIERS = [
  "DHL",
  "FedEx",
  "Blue Dart",
  "DTDC",
  "Delhivery",
  "India Post",
  "Customer Pickup",
  "Other",
];

// Mock payload (replace with API)
const MOCK = {
  id: "shp-2011",
  shipmentNo: "SHP-000311",
  dispatchNo: "DSP-000214",
  dispatchId: "dq-1001",
  createdAt: "2026-01-05 11:20",
  shipDate: "2026-01-05",
  status: "in_transit",
  service: "Express",
  carrier: "Blue Dart",
  trackingNo: "BD123456789",
  awbNo: "AWB-7788122",
  weightKg: 2.4,
  boxes: 2,
  incoterm: "DAP",
  notes: "Handle with care. FR4 boards with soldermask.",
  shipFrom: {
    plant: "PCBxpress Plant-1",
    address: "SIDCO Industrial Estate, Kerala, India",
  },
  shipTo: {
    name: "Apex Instruments",
    contact: "Ravi Kumar",
    phone: "+91 9XXXXXXXXX",
    address: "Plot 17, Electronic City, Bengaluru, Karnataka, India",
    pincode: "560100",
  },
  items: [
    {
      line: 1,
      partNo: "PCB-2L-FR4-1.6",
      description: "2-Layer FR4 PCB, Green SM, HASL",
      qty: 200,
      uom: "pcs",
      wo: "WO-00419",
    },
    {
      line: 2,
      partNo: "PCB-4L-FR4-1.6",
      description: "4-Layer FR4 PCB, Black SM, ENIG",
      qty: 50,
      uom: "pcs",
      wo: "WO-00420",
    },
  ],
  events: [
    { ts: "2026-01-05 11:20", title: "Shipment created", desc: "Shipment record generated from dispatch DSP-000214." },
    { ts: "2026-01-05 16:10", title: "Picked up", desc: "Carrier pickup completed at Plant-1." },
    { ts: "2026-01-06 02:30", title: "In transit", desc: "Shipment in transit to destination hub." },
  ],
};

function Badge({ tone = "gray", children }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return <span className={cx(base, tones[tone] || tones.gray)}>{children}</span>;
}

function statusTone(v) {
  switch (v) {
    case "created":
      return "gray";
    case "picked_up":
      return "blue";
    case "in_transit":
      return "violet";
    case "out_for_delivery":
      return "amber";
    case "delivered":
      return "green";
    case "exception":
      return "red";
    default:
      return "gray";
  }
}

function formatQty(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return n ?? "—";
  return x.toLocaleString();
}

export default function ShipmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(null);

  // editable fields
  const [status, setStatus] = useState("created");
  const [carrier, setCarrier] = useState("Other");
  const [trackingNo, setTrackingNo] = useState("");
  const [awbNo, setAwbNo] = useState("");
  const [service, setService] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [boxes, setBoxes] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [notes, setNotes] = useState("");

  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, action: null });

  useEffect(() => {
    // TODO: Replace with API:
    // const res = await shipmentService.getById(id)
    // setShipment(res.data)
    setLoading(true);
    const t = setTimeout(() => {
      const data = { ...MOCK, id: id || MOCK.id };
      setShipment(data);
      setStatus(data.status);
      setCarrier(data.carrier);
      setTrackingNo(data.trackingNo || "");
      setAwbNo(data.awbNo || "");
      setService(data.service || "");
      setWeightKg(String(data.weightKg ?? ""));
      setBoxes(String(data.boxes ?? ""));
      setIncoterm(data.incoterm || "");
      setNotes(data.notes || "");
      setDirty(false);
      setLoading(false);
    }, 250);

    return () => clearTimeout(t);
  }, [id]);

  const header = useMemo(() => {
    if (!shipment) return null;
    return {
      title: shipment.shipmentNo,
      subtitle: `Linked Dispatch: ${shipment.dispatchNo}`,
    };
  }, [shipment]);

  const copy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: label, description: text });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  };

  const refreshTracking = async () => {
    // TODO: call carrier tracking API / backend integration
    toast({ title: "Tracking refresh", description: "Hook carrier tracking sync from backend." });
  };

  const requestSave = () => {
    if (!dirty) {
      toast({ title: "No changes", description: "Nothing to save." });
      return;
    }
    setConfirm({ open: true, action: "save" });
  };

  const requestMarkDelivered = () => setConfirm({ open: true, action: "deliver" });

  const doConfirmedAction = async () => {
    const action = confirm.action;
    setConfirm({ open: false, action: null });

    try {
      if (action === "save") {
        // TODO: shipmentService.update(id, payload)
        // payload = { status, carrier, trackingNo, awbNo, service, weightKg, boxes, incoterm, notes }
        await new Promise((r) => setTimeout(r, 250));

        setShipment((prev) => ({
          ...prev,
          status,
          carrier,
          trackingNo,
          awbNo,
          service,
          weightKg: Number(weightKg || 0),
          boxes: Number(boxes || 0),
          incoterm,
          notes,
          events: [
            ...(prev?.events || []),
            {
              ts: new Date().toISOString().slice(0, 16).replace("T", " "),
              title: "Shipment updated",
              desc: "Shipment fields updated from ERP.",
            },
          ],
        }));
        setDirty(false);
        toast({ title: "Saved", description: "Shipment updated successfully." });
      }

      if (action === "deliver") {
        // TODO: shipmentService.markDelivered(id)
        await new Promise((r) => setTimeout(r, 250));
        setStatus("delivered");
        setShipment((prev) => ({
          ...prev,
          status: "delivered",
          events: [
            ...(prev?.events || []),
            {
              ts: new Date().toISOString().slice(0, 16).replace("T", " "),
              title: "Delivered",
              desc: "Shipment marked as delivered.",
            },
          ],
        }));
        setDirty(true); // because status changed compared to server
        toast({ title: "Marked delivered", description: "Shipment status updated to Delivered." });
      }
    } catch {
      toast({ title: "Action failed", description: "Please try again.", variant: "destructive" });
    }
  };

  if (loading || !shipment) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-52 animate-pulse rounded bg-gray-200" />
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

  const confirmTitle =
    confirm.action === "save" ? "Save changes?" : confirm.action === "deliver" ? "Mark as delivered?" : "Confirm";
  const confirmDesc =
    confirm.action === "save"
      ? "This will update shipment tracking & status details in the ERP."
      : "This will set shipment status to Delivered. You can still edit tracking data later if needed.";
  const confirmBtn =
    confirm.action === "save" ? "Save" : confirm.action === "deliver" ? "Mark Delivered" : "Confirm";

  return (
    <div className="space-y-5">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="secondary" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{header?.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>{header?.subtitle}</span>
              <span className="text-gray-300">•</span>
              <Badge tone={statusTone(status)}>{STATUS.find((s) => s.value === status)?.label ?? status}</Badge>
              {dirty && <Badge tone="amber">Unsaved</Badge>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={refreshTracking}>
            <RefreshCcw className="h-4 w-4" />
            Sync Tracking
          </Button>

          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => toast({ title: "Export", description: "Hook label/invoice export from backend." })}
          >
            <FileDown className="h-4 w-4" />
            Export Docs
          </Button>

          <Button
            variant="secondary"
            className="gap-2"
            onClick={requestMarkDelivered}
            disabled={status === "delivered"}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Delivered
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={requestSave}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Shipment Summary</div>
            <ShieldCheck className="h-4 w-4 text-[#dc2551]" />
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Shipment No</span>
              <button
                className="inline-flex items-center gap-2 font-semibold text-gray-900 hover:text-[#dc2551]"
                onClick={() => copy(shipment.shipmentNo, "Shipment No copied")}
              >
                {shipment.shipmentNo}
                <ClipboardCopy className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Dispatch</span>
              <Link
                to={`/logistics/dispatch/${shipment.dispatchId}`}
                className="font-semibold text-[#dc2551] hover:underline"
              >
                {shipment.dispatchNo}
              </Link>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Ship Date</span>
              <span className="font-semibold text-gray-900">{shipment.shipDate}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Boxes</span>
              <span className="font-semibold text-gray-900">{shipment.boxes}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Weight</span>
              <span className="font-semibold text-gray-900">{shipment.weightKg} kg</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Incoterm</span>
              <span className="font-semibold text-gray-900">{shipment.incoterm || "—"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Ship From</div>
            <MapPin className="h-4 w-4 text-[#dc2551]" />
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="font-semibold text-gray-900">{shipment.shipFrom.plant}</div>
            <div className="text-gray-600">{shipment.shipFrom.address}</div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Ship To</div>
            <Package className="h-4 w-4 text-[#dc2551]" />
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="font-semibold text-gray-900">{shipment.shipTo.name}</div>
            <div className="text-gray-600">{shipment.shipTo.address}</div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{shipment.shipTo.phone}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Editable fields */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Carrier & Tracking</h2>
            <p className="text-xs text-gray-500">Update tracking details and shipment status.</p>
          </div>
          <Truck className="h-4 w-4 text-[#dc2551]" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Status</Label>
            <div className="mt-2">
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setDirty(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
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
            <Label>Carrier</Label>
            <div className="mt-2">
              <Select
                value={carrier}
                onValueChange={(v) => {
                  setCarrier(v);
                  setDirty(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  {CARRIERS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Service</Label>
            <div className="mt-2">
              <Input
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  setDirty(true);
                }}
                placeholder="Express / Surface / Priority..."
              />
            </div>
          </div>

          <div>
            <Label>Tracking No</Label>
            <div className="mt-2">
              <Input
                value={trackingNo}
                onChange={(e) => {
                  setTrackingNo(e.target.value);
                  setDirty(true);
                }}
                placeholder="Carrier tracking number"
              />
            </div>
          </div>

          <div>
            <Label>AWB No</Label>
            <div className="mt-2">
              <Input
                value={awbNo}
                onChange={(e) => {
                  setAwbNo(e.target.value);
                  setDirty(true);
                }}
                placeholder="Airway bill / Consignment no"
              />
            </div>
          </div>

          <div>
            <Label>Incoterm</Label>
            <div className="mt-2">
              <Input
                value={incoterm}
                onChange={(e) => {
                  setIncoterm(e.target.value);
                  setDirty(true);
                }}
                placeholder="EXW / FOB / CIF / DAP..."
              />
            </div>
          </div>

          <div>
            <Label>Boxes</Label>
            <div className="mt-2">
              <Input
                type="number"
                min="0"
                value={boxes}
                onChange={(e) => {
                  setBoxes(e.target.value);
                  setDirty(true);
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>Weight (kg)</Label>
            <div className="mt-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={weightKg}
                onChange={(e) => {
                  setWeightKg(e.target.value);
                  setDirty(true);
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Label>Notes</Label>
            <div className="mt-2">
              <Input
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setDirty(true);
                }}
                placeholder="Special handling notes..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Box className="h-4 w-4 text-[#dc2551]" />
              Shipment Items
            </div>
            <Badge tone="gray">{shipment.items.length} lines</Badge>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Line</th>
                <th className="px-5 py-3">Part No</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">WO</th>
                <th className="px-5 py-3 text-right">Qty</th>
                <th className="px-5 py-3">UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipment.items.map((it) => (
                <tr key={it.line} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{it.line}</td>
                  <td className="px-5 py-3 text-sm text-gray-900">{it.partNo}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{it.description}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{it.wo}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">{formatQty(it.qty)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{it.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Tracking Timeline</h2>
              <p className="text-xs text-gray-500">Internal ERP shipment history (sync carrier events if available).</p>
            </div>
            <RefreshCcw className="h-4 w-4 text-[#dc2551]" />
          </div>

          <div className="mt-4 space-y-4">
            {shipment.events.map((ev, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#dc2551]" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900">{ev.title}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {ev.ts}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{ev.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <ConfirmationDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((p) => ({ ...p, open }))}
        title={confirmTitle}
        description={confirmDesc}
        confirmText={confirmBtn}
        confirmVariant="destructive"
        onConfirm={doConfirmedAction}
      />
    </div>
  );
}
