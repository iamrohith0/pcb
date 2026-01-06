// src/pages/warehouse/packing/PackList.jsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  Filter,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * PackList.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/packing/PackList.jsx
 *
 * Purpose:
 * - Show all Packing Jobs (for warehouse)
 * - Search/filter by status, shipment, dispatch, customer
 * - Quick actions: Continue Packing, View, Confirm
 *
 * Replace mock with API:
 * - packingService.list({ q, status })
 * - packingService.getSummaryCounts()
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = {
  draft: "DRAFT",
  packing: "PACKING",
  ready: "READY",
  confirmed: "CONFIRMED",
  blocked: "BLOCKED",
};

const STATUS_BADGE = {
  draft: "bg-gray-100 text-gray-700",
  packing: "bg-amber-100 text-amber-800",
  ready: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
};

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gray-50">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-lg font-extrabold text-gray-900">{value}</p>
        {hint ? <p className="text-[11px] text-gray-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export default function PackList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  // MOCK DATA (replace with API)
  const [rows, setRows] = useState(() => [
    {
      id: "PACK-2026-00012",
      status: "packing",
      shipment_no: "SHP-2026-00188",
      dispatch_no: "DSP-2026-00044",
      customer: "Aster Electronics Pvt Ltd",
      ship_to: "Bengaluru, KA",
      carrier: "BlueDart (Surface)",
      cartons: 2,
      remaining: 80,
      total_lines: 2,
      created_at: "Today 10:15",
      qa_hold: false,
      priority: "Normal",
    },
    {
      id: "PACK-2026-00013",
      status: "ready",
      shipment_no: "SHP-2026-00192",
      dispatch_no: "DSP-2026-00045",
      customer: "Nova Circuits",
      ship_to: "Chennai, TN",
      carrier: "DTDC (Air)",
      cartons: 3,
      remaining: 0,
      total_lines: 4,
      created_at: "Today 11:40",
      qa_hold: false,
      priority: "High",
    },
    {
      id: "PACK-2026-00014",
      status: "blocked",
      shipment_no: "SHP-2026-00195",
      dispatch_no: "DSP-2026-00046",
      customer: "Kite Embedded Labs",
      ship_to: "Kochi, KL",
      carrier: "BlueDart (Surface)",
      cartons: 1,
      remaining: 0,
      total_lines: 1,
      created_at: "Yesterday 16:10",
      qa_hold: true,
      priority: "Normal",
    },
    {
      id: "PACK-2026-00015",
      status: "confirmed",
      shipment_no: "SHP-2026-00180",
      dispatch_no: "DSP-2026-00041",
      customer: "Zen PCB Works",
      ship_to: "Hyderabad, TS",
      carrier: "Delhivery (Surface)",
      cartons: 2,
      remaining: 0,
      total_lines: 3,
      created_at: "Jan 04 12:05",
      qa_hold: false,
      priority: "Normal",
    },
  ]);

  const stats = useMemo(() => {
    const total = rows.length;
    const packing = rows.filter((r) => r.status === "packing").length;
    const ready = rows.filter((r) => r.status === "ready").length;
    const blocked = rows.filter((r) => r.status === "blocked").length;
    return { total, packing, ready, blocked };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) => {
        if (!query) return true;
        const hay = [
          r.id,
          r.shipment_no,
          r.dispatch_no,
          r.customer,
          r.ship_to,
          r.carrier,
          r.status,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [rows, q, status]);

  const refresh = async () => {
    setLoading(true);
    try {
      // await packingService.list({ q, status })
      await new Promise((r) => setTimeout(r, 350));
      toast({ title: "Refreshed", description: "Pack jobs list updated." });
    } catch (e) {
      toast({ title: "Failed", description: "Could not refresh right now.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openPack = (packId) => {
    // You can route to PackConfirm with query param
    navigate(`/warehouse/packing/confirm?pack_id=${encodeURIComponent(packId)}`);
  };

  const quickConfirm = (r) => {
    if (r.qa_hold || r.status === "blocked") {
      toast({
        title: "Cannot confirm",
        description: "This pack job is blocked / on QA hold.",
        variant: "destructive",
      });
      return;
    }
    if (r.remaining > 0) {
      toast({
        title: "Not ready",
        description: "Remaining quantity is not zero. Complete packing first.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Open to confirm",
      description: "Review cartons and click Confirm Packing.",
    });
    openPack(r.id);
  };

  const StatusPill = ({ s, qa_hold }) => (
    <span className="inline-flex items-center gap-2">
      <Badge className={cx("rounded-full", STATUS_BADGE[s] || STATUS_BADGE.draft)}>{STATUS[s] ?? s}</Badge>
      {qa_hold ? (
        <Badge className="rounded-full bg-red-100 text-red-800">
          <ShieldAlert className="mr-1 h-3.5 w-3.5" />
          QA HOLD
        </Badge>
      ) : null}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <Package className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Packing Jobs</h1>
            <p className="text-sm text-gray-500">
              Manage packing for shipments — scan items, build cartons, and confirm for dispatch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Link to="/warehouse/packing/create">
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
              <ClipboardList className="h-4 w-4" />
              New Pack Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total" value={stats.total} hint="All pack jobs" />
        <StatCard icon={Package} label="Packing" value={stats.packing} hint="In progress" />
        <StatCard icon={Truck} label="Ready" value={stats.ready} hint="Remaining = 0" />
        <StatCard icon={ShieldAlert} label="Blocked" value={stats.blocked} hint="Hold / issues" />
      </div>

      {/* Filters */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-base">Search & Filters</CardTitle>
          <CardDescription>Find packing jobs by shipment, dispatch, customer, or status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Label htmlFor="q">Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by pack id, shipment, dispatch, customer, city..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="lg:col-span-4">
              <Label htmlFor="status">Status</Label>
              <div className="relative mt-2">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="packing">Packing</option>
                  <option value="ready">Ready</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filtered.length}</span> job(s)
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
                <Package className="h-5 w-5 text-gray-700" />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">No packing jobs found</p>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or search keywords.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold text-gray-900">{r.id}</p>
                        <StatusPill s={r.status} qa_hold={r.qa_hold} />
                        {r.priority === "High" ? (
                          <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">PRIORITY</Badge>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Shipment</p>
                          <p className="font-semibold text-gray-900">{r.shipment_no}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Dispatch</p>
                          <p className="font-semibold text-gray-900">{r.dispatch_no}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Customer</p>
                          <p className="font-semibold text-gray-900">{r.customer}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Ship to</p>
                          <p className="font-semibold text-gray-900">{r.ship_to}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Carrier: <span className="font-semibold text-gray-900">{r.carrier}</span>
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Cartons: <span className="font-semibold text-gray-900">{r.cartons}</span>
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Remaining:{" "}
                          <span className={cx("font-semibold", r.remaining > 0 ? "text-[#dc2551]" : "text-gray-900")}>
                            {r.remaining}
                          </span>
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Lines: <span className="font-semibold text-gray-900">{r.total_lines}</span>
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Created: <span className="font-semibold text-gray-900">{r.created_at}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => openPack(r.id)}
                      >
                        View / Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => quickConfirm(r)}
                        disabled={r.status === "confirmed"}
                        className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                        title={
                          r.status === "confirmed"
                            ? "Already confirmed"
                            : r.remaining > 0
                              ? "Remaining must be 0"
                              : r.qa_hold
                                ? "QA hold"
                                : "Confirm packing"
                        }
                      >
                        Confirm
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
