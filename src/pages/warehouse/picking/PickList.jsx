// src/pages/warehouse/picking/PickList.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
    ArrowRight,
    Barcode,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    Filter,
    Hash,
    PackageCheck,
    RefreshCw,
    Search,
    Truck,
    XCircle
} from "lucide-react";

import api from "@/lib/axios";

/**
 * PCBxpress ERP — Warehouse → Picking → Pick Lists
 * File: src/pages/warehouse/picking/PickList.jsx
 *
 * Purpose:
 *  - View & manage pick lists (Open/Partial/Picked/Cancelled)
 *  - Search, filter, open details, and navigate to PickConfirm
 *
 * Suggested backend endpoints (optional):
 *  - GET    /warehouse/pick-lists?status=&q=&from=&to=&page=&limit=
 *  - POST   /warehouse/pick-lists                 { shipment_id, work_order, ... }
 *  - GET    /warehouse/pick-lists/:id
 *  - POST   /warehouse/pick-lists/:id/cancel      { reason }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function statusMeta(status) {
  const s = String(status || "").toLowerCase();
  if (s === "open") return { label: "Open", cls: "bg-gray-900 text-white" };
  if (s === "partial") return { label: "Partial", cls: "bg-amber-500 text-white" };
  if (s === "picked") return { label: "Picked", cls: "bg-green-600 text-white" };
  if (s === "cancelled") return { label: "Cancelled", cls: "bg-gray-700 text-white" };
  return { label: String(status || "—"), cls: "bg-gray-200 text-gray-800" };
}

function StatusPill({ status }) {
  const m = statusMeta(status);
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", m.cls)}>{m.label}</span>;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
}

function demoPickLists() {
  return [
    {
      id: "PICK-10021",
      status: "open",
      shipment_id: "SHIP-10582",
      work_order: "WO-22014",
      customer: "Acme Electronics",
      priority: "Normal",
      created_at: "2026-01-06",
      lines: 3,
      picked_lines: 0,
      total_qty: 775,
      picked_qty: 0,
    },
    {
      id: "PICK-10018",
      status: "partial",
      shipment_id: "SHIP-10560",
      work_order: "WO-21992",
      customer: "Nova Circuits",
      priority: "High",
      created_at: "2026-01-05",
      lines: 5,
      picked_lines: 3,
      total_qty: 1240,
      picked_qty: 820,
    },
    {
      id: "PICK-10011",
      status: "picked",
      shipment_id: "SHIP-10511",
      work_order: "WO-21940",
      customer: "Kite Robotics",
      priority: "Normal",
      created_at: "2026-01-03",
      lines: 2,
      picked_lines: 2,
      total_qty: 525,
      picked_qty: 525,
    },
    {
      id: "PICK-10009",
      status: "cancelled",
      shipment_id: "SHIP-10497",
      work_order: "WO-21922",
      customer: "Sunwave Systems",
      priority: "Normal",
      created_at: "2026-01-02",
      lines: 4,
      picked_lines: 0,
      total_qty: 910,
      picked_qty: 0,
    },
  ];
}

export default function PickList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(() => demoPickLists());

  // Search/filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Cancel flow
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (status === "all" ? true : String(r.status).toLowerCase() === status))
      .filter((r) => {
        if (!query) return true;
        const hay = `${r.id} ${r.shipment_id} ${r.work_order} ${r.customer}`.toLowerCase();
        return hay.includes(query);
      })
      .filter((r) => {
        const d = formatDate(r.created_at);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
  }, [rows, q, status, from, to]);

  const stats = useMemo(() => {
    const all = rows || [];
    const count = (s) => all.filter((r) => String(r.status).toLowerCase() === s).length;
    return {
      total: all.length,
      open: count("open"),
      partial: count("partial"),
      picked: count("picked"),
      cancelled: count("cancelled"),
    };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await api.get(`/warehouse/pick-lists?${params.toString()}`);
      const data = res.data?.data || res.data;

      if (Array.isArray(data)) {
        setRows(data);
      } else if (Array.isArray(data?.items)) {
        setRows(data.items);
      } else {
        // fallback
        setRows(demoPickLists());
      }

      toast({ title: "Refreshed", description: "Pick lists updated." });
    } catch (e) {
      console.warn("Load pick lists failed:", e);
      setRows(demoPickLists());
      toast({
        title: "Using demo data",
        description: "Backend endpoint not available. Showing demo pick lists.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If you prefer auto-load from backend on first mount, uncomment:
    // load();
    // For now, keep demo visible instantly.
  }, []);

  const openConfirm = (pick) => {
    const pickListId = pick?.id || "";
    const shipmentId = pick?.shipment_id || "";
    const workOrder = pick?.work_order || "";
    navigate(
      `/warehouse/picking/pick-confirm?pickListId=${encodeURIComponent(pickListId)}&shipmentId=${encodeURIComponent(
        shipmentId
      )}&workOrder=${encodeURIComponent(workOrder)}`
    );
  };

  const openCancel = (id) => {
    setCancelId(id);
    setCancelReason("");
    setCancelOpen(true);
  };

  const doCancel = async () => {
    if (!cancelReason.trim()) {
      toast({ title: "Reason required", description: "Please enter a cancel reason.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.post(`/warehouse/pick-lists/${encodeURIComponent(cancelId)}/cancel`, { reason: cancelReason.trim() });
      setRows((prev) =>
        (prev || []).map((r) => (r.id === cancelId ? { ...r, status: "cancelled", cancel_reason: cancelReason.trim() } : r))
      );
      toast({ title: "Cancelled", description: `Pick List ${cancelId} cancelled.` });
      setCancelOpen(false);
    } catch (e) {
      console.warn("Cancel failed:", e);
      setRows((prev) =>
        (prev || []).map((r) => (r.id === cancelId ? { ...r, status: "cancelled", cancel_reason: cancelReason.trim() } : r))
      );
      toast({
        title: "Cancelled locally (demo)",
        description: "Backend cancel endpoint not available. Marked cancelled in UI.",
      });
      setCancelOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pick Lists</h1>
            <p className="text-sm text-gray-600">
              Create and manage pick lists for shipments and work orders (PCBxpress Warehouse).
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-xl gap-1">
                <Barcode className="h-3.5 w-3.5" />
                Barcode picking
              </Badge>
              <Badge variant="secondary" className="rounded-xl gap-1">
                <Truck className="h-3.5 w-3.5" />
                Shipment linked
              </Badge>
              <Badge variant="outline" className="rounded-xl gap-1">
                <PackageCheck className="h-3.5 w-3.5" />
                Lot/Batch aware
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => toast({ title: "Coming soon", description: "Pick List creation UI can be added next." })}
          >
            <ClipboardCheck className="h-4 w-4" />
            New Pick List
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500">Total</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{stats.total}</div>
        </Card>
        <Card className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500">Open</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{stats.open}</div>
        </Card>
        <Card className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500">Partial</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{stats.partial}</div>
        </Card>
        <Card className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500">Picked</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{stats.picked}</div>
        </Card>
        <Card className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500">Cancelled</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{stats.cancelled}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <Label>Search</Label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by Pick List / Shipment / Work Order / Customer"
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  className="h-10 w-full rounded-xl border bg-white px-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="partial">Partial</option>
                  <option value="picked">Picked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>From</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>To</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" className="w-full gap-2" onClick={load} disabled={loading}>
                <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
                Apply
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border bg-white p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-600">
                <th className="px-4 py-3">Pick List</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Shipment</th>
                <th className="px-4 py-3">Work Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Lines</th>
                <th className="px-4 py-3">Qty (picked/total)</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                    No pick lists found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const disabled = String(r.status).toLowerCase() === "cancelled";
                  const pickedQty = Number(r.picked_qty || 0);
                  const totalQty = Number(r.total_qty || 0);

                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{r.id}</div>
                            <div className="text-xs text-gray-500">Priority: {r.priority || "Normal"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusPill status={r.status} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.shipment_id || "—"}</div>
                        <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-gray-400" />
                          Dispatch
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.work_order || "—"}</div>
                        <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                          <ClipboardCheck className="h-3.5 w-3.5 text-gray-400" />
                          Production link
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.customer || "—"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{r.lines ?? "—"}</div>
                        <div className="text-xs text-gray-500">Picked lines: {r.picked_lines ?? 0}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {pickedQty} / {totalQty}
                        </div>
                        <div className="mt-1 h-2 w-40 overflow-hidden rounded-full border bg-white">
                          <div
                            className="h-2 rounded-full bg-[#dc2551]"
                            style={{
                              width: totalQty > 0 ? `${Math.min(100, Math.round((pickedQty / totalQty) * 100))}%` : "0%",
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{formatDate(r.created_at)}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => openConfirm(r)}
                            disabled={disabled}
                          >
                            <ArrowRight className="h-4 w-4" />
                            Open
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => openCancel(r.id)}
                            disabled={disabled}
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Pick List?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will cancel <span className="font-semibold">{cancelId}</span>. Please provide a reason for audit logs.
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
            <AlertDialogAction onClick={doCancel} disabled={loading}>
              Cancel Pick List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
