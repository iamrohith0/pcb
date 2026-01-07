// src/pages/logistics/shipments/ShipmentsList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
    ArrowLeft,
    Calendar,
    Eye,
    Filter,
    Package,
    Plus,
    RefreshCw,
    Search,
    Truck,
} from "lucide-react";

/**
 * PCBxpress - ShipmentsList
 * Folder: src/pages/logistics/shipments/ShipmentsList.jsx
 *
 * Shows shipments created from Dispatch/Logistics flow.
 * - Search by Shipment ID / SO / WO / Customer / Tracking
 * - Filter by status
 * - Quick actions: View, Create new
 *
 * API is mocked. Replace mockFetchShipments with real service later.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "-";
  }
}

// ---------------- Mock services ----------------
async function mockFetchShipments() {
  await new Promise((r) => setTimeout(r, 350));
  return [
    {
      id: "SHP-18421",
      status: "Ready",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      order: { soNo: "SO-1042", woNo: "WO-7781" },
      customer: { name: "Acme Electronics", code: "ACME" },
      carrier: "BlueDart",
      trackingNo: "BD123456789IN",
      boxes: 2,
      weightKg: 8.4,
      pickupAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
      shipTo: { city: "Bengaluru", state: "Karnataka" },
    },
    {
      id: "SHP-19302",
      status: "Draft",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      order: { soNo: "SO-1089", woNo: "" },
      customer: { name: "Orion Circuits", code: "ORION" },
      carrier: "DTDC",
      trackingNo: "",
      boxes: 1,
      weightKg: 2.1,
      pickupAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      shipTo: { city: "Pune", state: "Maharashtra" },
    },
    {
      id: "SHP-20115",
      status: "Dispatched",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
      order: { soNo: "SO-0991", woNo: "WO-6502" },
      customer: { name: "Nova Embedded", code: "NOVA" },
      carrier: "DHL",
      trackingNo: "DHL00982213",
      boxes: 3,
      weightKg: 12.9,
      pickupAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
      shipTo: { city: "Chennai", state: "Tamil Nadu" },
    },
  ];
}
// ------------------------------------------------

const STATUS_BADGE = {
  Draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  Ready: "bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10",
  Dispatched: "bg-green-100 text-green-800 hover:bg-green-100",
  Delivered: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  Cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
};

export default function ShipmentsList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const data = await mockFetchShipments();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load",
        description: "Could not fetch shipments list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter((r) => (status === "All" ? true : r.status === status))
      .filter((r) => {
        if (!query) return true;
        const hay = [
          r.id,
          r.order?.soNo,
          r.order?.woNo,
          r.customer?.name,
          r.customer?.code,
          r.trackingNo,
          r.carrier,
          r.shipTo?.city,
          r.shipTo?.state,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rows, q, status]);

  const counts = useMemo(() => {
    const map = { All: rows.length };
    for (const r of rows) map[r.status] = (map[r.status] || 0) + 1;
    return map;
  }, [rows]);

  const openRow = (r) => {
    // In real app: navigate(`/logistics/shipments/${r.id}`)
    toast({ title: "View shipment", description: `Open details for ${r.id} (route not wired yet).` });
  };

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
              <h1 className="text-lg font-bold text-gray-900">Shipments</h1>
              <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">PCBxpress Logistics</Badge>
            </div>
            <p className="text-sm text-gray-500">
              Track courier bookings, packaging controls, and dispatch handover per SO/WO.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <Link to="/logistics/shipments/create">
              <Plus className="h-4 w-4" />
              New Shipment
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-gray-500" />
            Filters
          </CardTitle>
          <CardDescription>Search by Shipment ID / SO / WO / Customer / Tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="SHP-..., SO-..., WO-..., customer, tracking..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {["All", "Draft", "Ready", "Dispatched", "Delivered", "Cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {s} {typeof counts[s] === "number" ? `(${counts[s]})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-gray-500" />
            Shipment Records
          </CardTitle>
          <CardDescription>
            Showing <span className="font-medium text-gray-900">{filtered.length}</span> of{" "}
            <span className="font-medium text-gray-900">{rows.length}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No shipments found</p>
              <p className="mt-1 text-sm text-gray-500">Try clearing filters or create a new shipment.</p>
              <Button asChild className="mt-4 gap-2 bg-cyan-600 hover:bg-cyan-500">
                <Link to="/logistics/shipments/create">
                  <Plus className="h-4 w-4" />
                  New Shipment
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500">
                    <th className="py-2 pr-3">Shipment</th>
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Carrier</th>
                    <th className="py-2 pr-3">Tracking</th>
                    <th className="py-2 pr-3">Package</th>
                    <th className="py-2 pr-3">Pickup</th>
                    <th className="py-2 pr-0 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70">
                      <td className="py-3 pr-3 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{r.id}</span>
                          <Badge className={STATUS_BADGE[r.status] || "bg-gray-100 text-gray-700"}>{r.status}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          Created: {fmtDate(r.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 pr-3 align-top">
                        <div className="text-sm text-gray-900">
                          {r.order?.soNo ? <div>SO: <span className="font-medium">{r.order.soNo}</span></div> : null}
                          {r.order?.woNo ? <div>WO: <span className="font-medium">{r.order.woNo}</span></div> : null}
                          {!r.order?.soNo && !r.order?.woNo ? <span className="text-gray-400">—</span> : null}
                        </div>
                      </td>

                      <td className="py-3 pr-3 align-top">
                        <div className="font-medium text-gray-900">{r.customer?.name || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {r.customer?.code ? `Code: ${r.customer.code}` : " "}
                          {r.shipTo?.city || r.shipTo?.state ? (
                            <span className="ml-2">
                              • {r.shipTo?.city || ""}{r.shipTo?.city && r.shipTo?.state ? ", " : ""}{r.shipTo?.state || ""}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3 pr-3 align-top">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{r.carrier || "—"}</span>
                        </div>
                      </td>

                      <td className="py-3 pr-3 align-top">
                        {r.trackingNo ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{r.trackingNo}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => {
                                navigator.clipboard.writeText(r.trackingNo);
                                toast({ title: "Copied", description: "Tracking number copied." });
                              }}
                            >
                              <span className="text-xs">Copy</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3 pr-3 align-top">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{r.boxes}</span>
                          <span className="text-gray-500">boxes</span>
                          <span className="text-gray-500">•</span>
                          <span className="font-medium">{r.weightKg}</span>
                          <span className="text-gray-500">kg</span>
                        </div>
                      </td>

                      <td className="py-3 pr-3 align-top">
                        {r.pickupAt ? (
                          <div className="text-sm text-gray-900">{fmtDate(r.pickupAt)}</div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3 pr-0 align-top text-right">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => openRow(r)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span>
                  Tip: Add tracking to mark shipments as <span className="font-semibold">Ready</span> /{" "}
                  <span className="font-semibold">Dispatched</span>.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setQ("");
                  setStatus("All");
                  toast({ title: "Filters cleared", description: "Showing all shipments." });
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
