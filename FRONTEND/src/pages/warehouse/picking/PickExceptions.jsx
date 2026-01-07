// src/pages/warehouse/picking/PickExceptions.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    Filter,
    PackageSearch,
    RefreshCw,
    Search,
    ShieldAlert,
    XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * PickExceptions.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/picking/PickExceptions.jsx
 *
 * What this page does:
 * - Shows exceptions created during picking (stock mismatch, wrong lot, blocked lot, damaged, missing label, etc.)
 * - Lets warehouse/supervisor filter & search
 * - Quick action to open the exception / resolve / link to related pick list
 *
 * Replace mocks with API:
 * - pickingExceptionsService.list({ q, type, severity, status })
 * - pickingExceptionsService.resolve(id, payload)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = {
  open: "OPEN",
  investigating: "INVESTIGATING",
  resolved: "RESOLVED",
  cancelled: "CANCELLED",
};

const SEVERITY = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

const TYPE = {
  shortage: "Stock Shortage",
  wrong_lot: "Wrong Lot Picked",
  blocked_lot: "Blocked / QA Hold Lot",
  damaged: "Damaged Material",
  label_missing: "Label Missing",
  location_mismatch: "Location Mismatch",
  uom_mismatch: "UoM Mismatch",
  unknown: "Other",
};

const statusBadge = (s) => {
  if (s === "resolved") return "bg-green-100 text-green-800";
  if (s === "investigating") return "bg-amber-100 text-amber-800";
  if (s === "cancelled") return "bg-gray-100 text-gray-700";
  return "bg-red-100 text-red-800";
};

const severityBadge = (s) => {
  if (s === "critical") return "bg-[#dc2551]/10 text-[#dc2551]";
  if (s === "high") return "bg-red-100 text-red-800";
  if (s === "medium") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
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

export default function PickExceptions() {
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  // MOCK DATA (replace with API)
  const [rows] = useState(() => [
    {
      id: "PEX-2026-00031",
      status: "open",
      severity: "high",
      type: "shortage",
      pick_list: "PICK-2026-00112",
      shipment_no: "SHP-2026-00192",
      customer: "Nova Circuits",
      item: "FR4 Core 0.8mm",
      sku: "MAT-FR4-CORE-0.8",
      expected_qty: 10,
      picked_qty: 6,
      uom: "Sheets",
      location: "WH1-A-12",
      lot: "LOT-FR4-00983",
      reported_by: "Warehouse - Arun",
      created_at: "Today 13:05",
      note: "Only 6 sheets found in bin. Bin count mismatch.",
    },
    {
      id: "PEX-2026-00032",
      status: "investigating",
      severity: "critical",
      type: "blocked_lot",
      pick_list: "PICK-2026-00114",
      shipment_no: "SHP-2026-00195",
      customer: "Kite Embedded Labs",
      item: "Solder Mask Ink - Green",
      sku: "CHEM-SM-GREEN",
      expected_qty: 2,
      picked_qty: 0,
      uom: "L",
      location: "WH1-CHEM-02",
      lot: "LOT-SM-00119",
      reported_by: "Warehouse - Rafi",
      created_at: "Today 14:20",
      note: "Lot shows QA HOLD in system; cannot pick.",
    },
    {
      id: "PEX-2026-00033",
      status: "resolved",
      severity: "medium",
      type: "wrong_lot",
      pick_list: "PICK-2026-00101",
      shipment_no: "SHP-2026-00180",
      customer: "Zen PCB Works",
      item: "Copper Foil 35um",
      sku: "MAT-CU-FOIL-35",
      expected_qty: 5,
      picked_qty: 5,
      uom: "Rolls",
      location: "WH1-B-04",
      lot: "LOT-CU-00421",
      reported_by: "Warehouse - Manu",
      created_at: "Jan 05 12:10",
      note: "Picked lot not matching FIFO. Supervisor approved substitution.",
    },
    {
      id: "PEX-2026-00034",
      status: "open",
      severity: "low",
      type: "label_missing",
      pick_list: "PICK-2026-00116",
      shipment_no: "SHP-2026-00198",
      customer: "Aster Electronics Pvt Ltd",
      item: "Packing Foam (ESD)",
      sku: "PKG-FOAM-ESD",
      expected_qty: 20,
      picked_qty: 20,
      uom: "Nos",
      location: "WH1-PKG-09",
      lot: "N/A",
      reported_by: "Warehouse - Sree",
      created_at: "Today 15:05",
      note: "No label on bin, but stock quantity matches.",
    },
  ]);

  const stats = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => r.status === "open").length;
    const investigating = rows.filter((r) => r.status === "investigating").length;
    const critical = rows.filter((r) => r.severity === "critical").length;
    return { total, open, investigating, critical };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter((r) => (type === "all" ? true : r.type === type))
      .filter((r) => (severity === "all" ? true : r.severity === severity))
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) => {
        if (!query) return true;
        const hay = [
          r.id,
          r.pick_list,
          r.shipment_no,
          r.customer,
          r.item,
          r.sku,
          r.location,
          r.lot,
          r.note,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [rows, q, type, severity, status]);

  const refresh = async () => {
    setLoading(true);
    try {
      // await pickingExceptionsService.list({ q, type, severity, status })
      await new Promise((r) => setTimeout(r, 350));
      toast({ title: "Refreshed", description: "Pick exceptions updated." });
    } catch (e) {
      toast({ title: "Failed", description: "Could not refresh right now.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resolve = (r) => {
    if (r.status === "resolved") {
      toast({ title: "Already resolved", description: `${r.id} is already resolved.` });
      return;
    }
    toast({
      title: "Open exception",
      description: `Redirect to exception details to resolve: ${r.id}`,
    });
    // navigate(`/warehouse/picking/exceptions/${r.id}`)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <PackageSearch className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pick Exceptions</h1>
            <p className="text-sm text-gray-500">
              Track and resolve picking issues before packing and dispatch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Link to="/warehouse/picking">
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
              <ClipboardList className="h-4 w-4" />
              Go to Picking
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total" value={stats.total} hint="All exceptions" />
        <StatCard icon={AlertTriangle} label="Open" value={stats.open} hint="Needs action" />
        <StatCard icon={ShieldAlert} label="Investigating" value={stats.investigating} hint="Supervisor review" />
        <StatCard icon={XCircle} label="Critical" value={stats.critical} hint="Stops picking/packing" />
      </div>

      {/* Filters */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-base">Search & Filters</CardTitle>
          <CardDescription>Filter by exception type, severity, and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Label htmlFor="q">Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by exception id, pick list, item, sku, customer..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="type">Type</Label>
              <div className="relative mt-2">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="all">All</option>
                  <option value="shortage">Stock Shortage</option>
                  <option value="wrong_lot">Wrong Lot</option>
                  <option value="blocked_lot">Blocked Lot</option>
                  <option value="damaged">Damaged</option>
                  <option value="label_missing">Label Missing</option>
                  <option value="location_mismatch">Location Mismatch</option>
                  <option value="uom_mismatch">UoM Mismatch</option>
                  <option value="unknown">Other</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Label htmlFor="severity">Severity</Label>
              <div className="relative mt-2">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
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
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filtered.length}</span> exception(s)
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
                <AlertTriangle className="h-5 w-5 text-gray-700" />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">No exceptions found</p>
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

                        <Badge className={cx("rounded-full", statusBadge(r.status))}>{STATUS[r.status] ?? r.status}</Badge>
                        <Badge className={cx("rounded-full", severityBadge(r.severity))}>
                          {SEVERITY[r.severity] ?? r.severity}
                        </Badge>

                        <Badge className="rounded-full bg-gray-100 text-gray-700">
                          {TYPE[r.type] ?? r.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pick List</p>
                          <p className="font-semibold text-gray-900">{r.pick_list}</p>
                        </div>

                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Shipment</p>
                          <p className="font-semibold text-gray-900">{r.shipment_no}</p>
                        </div>

                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Item</p>
                          <p className="font-semibold text-gray-900">{r.item}</p>
                          <p className="text-xs text-gray-500">{r.sku}</p>
                        </div>

                        <div className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Location / Lot</p>
                          <p className="font-semibold text-gray-900">{r.location}</p>
                          <p className="text-xs text-gray-500">{r.lot}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Customer: <span className="font-semibold text-gray-900">{r.customer}</span>
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Expected: <span className="font-semibold text-gray-900">{r.expected_qty}</span> {r.uom}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Picked:{" "}
                          <span className={cx("font-semibold", r.picked_qty < r.expected_qty ? "text-[#dc2551]" : "text-gray-900")}>
                            {r.picked_qty}
                          </span>{" "}
                          {r.uom}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Reported by: <span className="font-semibold text-gray-900">{r.reported_by}</span>
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-black/5">
                          Created: <span className="font-semibold text-gray-900">{r.created_at}</span>
                        </span>
                      </div>

                      {r.note ? (
                        <div className="rounded-xl border bg-white px-3 py-2 text-sm text-gray-700">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Note</p>
                          <p className="mt-1">{r.note}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button variant="outline" className="gap-2" asChild>
                        <Link to={`/warehouse/picking/list?pick_list=${encodeURIComponent(r.pick_list)}`}>
                          View Pick List
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>

                      <Button
                        onClick={() => resolve(r)}
                        disabled={r.status === "resolved"}
                        className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                      >
                        {r.status === "resolved" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Resolved
                          </>
                        ) : (
                          <>
                            Resolve
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
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
