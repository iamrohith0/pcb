// src/pages/logistics/tracking/TrackingDashboard.jsx
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
    ArrowRight,
    CheckCircle2,
    Clock,
    Filter,
    MapPin,
    RefreshCcw,
    Search,
    ShieldCheck,
    Truck,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * TrackingDashboard.jsx (PCBxpress)
 * Route suggestion:
 * - /logistics/tracking
 *
 * Hook points (recommended services):
 * - trackingService.list({ q, status, carrier, dateFrom, dateTo, page, pageSize })
 * - trackingService.pollCarrierBulk({ shipmentIds })
 *
 * Notes:
 * - This is a UI-first implementation with MOCK data.
 * - Replace MOCK calls with API calls in useEffect + handlers.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = [
  { value: "all", label: "All Status" },
  { value: "created", label: "Created" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Delivery Failed" },
  { value: "returned", label: "Returned" },
];

const STATUS_META = {
  created: { tone: "gray", icon: Clock },
  picked_up: { tone: "blue", icon: Truck },
  in_transit: { tone: "blue", icon: Truck },
  out_for_delivery: { tone: "amber", icon: Truck },
  delivered: { tone: "green", icon: CheckCircle2 },
  failed: { tone: "red", icon: XCircle },
  returned: { tone: "red", icon: XCircle },
};

const MOCK_SHIPMENTS = [
  {
    id: "shp-2011",
    shipmentNo: "SHP-000311",
    dispatchNo: "DSP-000214",
    woNo: "WO-10294",
    customer: "Aster Robotics",
    carrier: "Blue Dart",
    trackingNo: "BD123456789",
    status: "in_transit",
    eta: "2026-01-08",
    lastEventTime: "2026-01-06 10:15",
    lastEventLocation: "Coimbatore Hub",
    destination: "Bengaluru, KA",
  },
  {
    id: "shp-2012",
    shipmentNo: "SHP-000312",
    dispatchNo: "DSP-000215",
    woNo: "WO-10298",
    customer: "Neon Circuits",
    carrier: "DTDC",
    trackingNo: "DT987654321",
    status: "out_for_delivery",
    eta: "2026-01-06",
    lastEventTime: "2026-01-06 08:40",
    lastEventLocation: "Bengaluru Hub",
    destination: "Bengaluru, KA",
  },
  {
    id: "shp-2013",
    shipmentNo: "SHP-000313",
    dispatchNo: "DSP-000219",
    woNo: "WO-10305",
    customer: "Volt Systems",
    carrier: "Delhivery",
    trackingNo: "DLV556677889",
    status: "delivered",
    eta: "2026-01-05",
    lastEventTime: "2026-01-05 18:12",
    lastEventLocation: "Customer Dock",
    destination: "Chennai, TN",
  },
  {
    id: "shp-2014",
    shipmentNo: "SHP-000314",
    dispatchNo: "DSP-000221",
    woNo: "WO-10308",
    customer: "IonWorks",
    carrier: "Blue Dart",
    trackingNo: "BD111222333",
    status: "failed",
    eta: "2026-01-06",
    lastEventTime: "2026-01-06 13:05",
    lastEventLocation: "Customer Address",
    destination: "Hyderabad, TS",
  },
];

function Badge({ tone = "gray", children }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
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

function statusIcon(value) {
  return STATUS_META[value]?.icon ?? Clock;
}

export default function TrackingDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [carrier, setCarrier] = useState("all");

  // Data
  const [rows, setRows] = useState([]);

  // Bulk action
  const [bulkSyncing, setBulkSyncing] = useState(false);

  useEffect(() => {
    // TODO: Replace with API call:
    // trackingService.list({ q, status, carrier })
    setLoading(true);
    const t = setTimeout(() => {
      setRows(MOCK_SHIPMENTS);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  const carriers = useMemo(() => {
    const set = new Set(rows.map((r) => r.carrier).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows.filter((r) => {
      const matchQ =
        !query ||
        (r.shipmentNo || "").toLowerCase().includes(query) ||
        (r.dispatchNo || "").toLowerCase().includes(query) ||
        (r.woNo || "").toLowerCase().includes(query) ||
        (r.customer || "").toLowerCase().includes(query) ||
        (r.trackingNo || "").toLowerCase().includes(query) ||
        (r.destination || "").toLowerCase().includes(query) ||
        (r.lastEventLocation || "").toLowerCase().includes(query);

      const matchStatus = status === "all" ? true : r.status === status;
      const matchCarrier = carrier === "all" ? true : r.carrier === carrier;

      return matchQ && matchStatus && matchCarrier;
    });
  }, [rows, q, status, carrier]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const inTransit = filtered.filter((r) => r.status === "in_transit").length;
    const ofd = filtered.filter((r) => r.status === "out_for_delivery").length;
    const delivered = filtered.filter((r) => r.status === "delivered").length;
    const exceptions = filtered.filter((r) => r.status === "failed" || r.status === "returned").length;
    return { total, inTransit, ofd, delivered, exceptions };
  }, [filtered]);

  const refresh = async () => {
    setLoading(true);
    try {
      // TODO: trackingService.list(...)
      await new Promise((r) => setTimeout(r, 350));
      setRows(MOCK_SHIPMENTS);
      toast({ title: "Refreshed", description: "Tracking list refreshed." });
    } catch {
      toast({ title: "Refresh failed", description: "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const bulkSync = async () => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to sync", description: "No shipments in current filter." });
      return;
    }
    setBulkSyncing(true);
    try {
      // TODO: trackingService.pollCarrierBulk({ shipmentIds: filtered.map(x => x.id) })
      await new Promise((r) => setTimeout(r, 650));
      toast({
        title: "Carrier sync complete",
        description: "Hook this to carrier API/webhooks to refresh status & timeline.",
      });
    } catch {
      toast({ title: "Sync failed", description: "Carrier sync failed. Try again.", variant: "destructive" });
    } finally {
      setBulkSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tracking Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live visibility on shipments for PCBxpress dispatches (carrier + ERP events).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={refresh} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={bulkSync}
            disabled={bulkSyncing || loading}
            title="Sync current filtered list with carrier"
          >
            <ShieldCheck className="h-4 w-4" />
            {bulkSyncing ? "Syncing..." : "Bulk Carrier Sync"}
          </Button>
          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => navigate("/logistics/dispatch/create")}
          >
            <Truck className="h-4 w-4" />
            New Dispatch
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{kpis.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">In Transit</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{kpis.inTransit}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Out for Delivery</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{kpis.ofd}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Delivered</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{kpis.delivered}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Exceptions</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{kpis.exceptions}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 w-full">
            <div>
              <Label>Search</Label>
              <div className="mt-2 relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Shipment / Dispatch / WO / Customer / Tracking..."
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Select value={status} onValueChange={setStatus}>
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
              <Label>Carrier</Label>
              <div className="mt-2">
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "all" ? "All Carriers" : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                setQ("");
                setStatus("all");
                setCarrier("all");
              }}
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>

            <Button
              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
              onClick={() => toast({ title: "Advanced Filters", description: "Hook: date range, destination, SLA buckets." })}
            >
              <ArrowRight className="h-4 w-4" />
              Advanced
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="overflow-hidden">
          <div className="border-b bg-white px-5 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Truck className="h-4 w-4 text-[#dc2551]" />
                Shipments
                <span className="text-xs font-normal text-gray-500">({filtered.length})</span>
              </div>

              <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Carrier sync + ERP events supported
              </div>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-6 text-center text-sm text-gray-600">
                No shipments found for current filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((r) => {
                  const Icon = statusIcon(r.status);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551] ring-1 ring-inset ring-[#dc2551]/15">
                          <Icon className="h-5 w-5" />
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{r.shipmentNo}</p>
                            <span className="text-xs text-gray-300">•</span>
                            <p className="text-xs text-gray-600">Dispatch {r.dispatchNo}</p>
                            <span className="text-xs text-gray-300">•</span>
                            <p className="text-xs text-gray-600">WO {r.woNo}</p>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {r.destination}
                            </span>
                            {r.eta ? (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-4 w-4 text-gray-400" />
                                ETA {r.eta}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">{r.customer}</span>
                            <span className="text-gray-300"> • </span>
                            <span>{r.carrier}</span>
                            <span className="text-gray-300"> • </span>
                            <span className="font-mono">{r.trackingNo}</span>
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            Last: <span className="text-gray-700">{r.lastEventTime}</span> •{" "}
                            <span className="text-gray-700">{r.lastEventLocation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Button variant="secondary" asChild>
                          <Link to={`/logistics/tracking/${r.id}`} className="gap-2 inline-flex items-center">
                            View Status
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>

                        <Button
                          className="bg-cyan-600 hover:bg-cyan-500"
                          asChild
                          title="Open shipment details"
                        >
                          <Link to={`/logistics/shipments/${r.id}`} className="gap-2 inline-flex items-center">
                            Details
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
