// src/pages/maintenance/spares/SparesStock.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
    AlertTriangle,
    Boxes,
    Download,
    Filter,
    PackageSearch,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Truck,
    Wrench,
} from "lucide-react";

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

/**
 * PCBxpress - Maintenance → Spares → Stock
 * File: src/pages/maintenance/spares/SparesStock.jsx
 *
 * Goal:
 * - View spare parts stock across plants/warehouses
 * - Track On-Hand / Reserved / Available / On-Order
 * - Quick stock adjustments request (to Inventory module)
 * - Identify critical low stock
 *
 * Suggested APIs:
 * - GET    /maintenance/spares/stock?query=&plant=&criticality=&status=&sort=
 * - GET    /maintenance/spares/stock/:id
 * - POST   /inventory/stock/adjustments (request adjustment)
 * - POST   /maintenance/spares/stock/export (CSV)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const CRIT_META = {
  A: { label: "A (Critical)", variant: "destructive" },
  B: { label: "B (Important)", variant: "default" },
  C: { label: "C (Standard)", variant: "secondary" },
};

const STATUS_META = {
  low: { label: "Low", variant: "destructive" },
  ok: { label: "OK", variant: "secondary" },
  on_order: { label: "On Order", variant: "default" },
};

function MetaBadge({ meta, value }) {
  const m = meta?.[value] ?? { label: value, variant: "outline" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function calcAvailable(r) {
  return Math.max(0, (r.stockOnHand ?? 0) - (r.stockReserved ?? 0));
}

// Mock dataset (replace with API)
function mockStockRows() {
  return [
    {
      id: "SP-00081",
      sku: "BRG-6002Z",
      name: "Ball Bearing 6002Z",
      category: "Mechanical",
      uom: "Nos",
      plant: "Plant A",
      location: "Stores / Rack M-02",
      criticality: "A",
      reorderLevel: 10,
      stockOnHand: 6,
      stockReserved: 2,
      onOrderQty: 0,
      etaDate: null,
      lastIssueDate: "2025-12-30",
      lastReceiptDate: "2025-12-08",
      preferredVendor: "SKF Dealer - Kochi",
      status: "low",
    },
    {
      id: "SP-00112",
      sku: "NOZ-PLT-04",
      name: "Plating Spray Nozzle 4mm",
      category: "Consumable",
      uom: "Nos",
      plant: "Plant A",
      location: "Chem Stores / Bin C-11",
      criticality: "B",
      reorderLevel: 15,
      stockOnHand: 18,
      stockReserved: 4,
      onOrderQty: 20,
      etaDate: "2026-01-10",
      lastIssueDate: "2025-12-29",
      lastReceiptDate: "2025-12-20",
      preferredVendor: "WetLine Supplies",
      status: "on_order",
    },
    {
      id: "SP-00034",
      sku: "FAN-120MM-24V",
      name: "24V DC Cooling Fan (120mm)",
      category: "Electrical",
      uom: "Nos",
      plant: "Plant B",
      location: "Stores / Rack E-01",
      criticality: "C",
      reorderLevel: 12,
      stockOnHand: 22,
      stockReserved: 2,
      onOrderQty: 0,
      etaDate: null,
      lastIssueDate: "2025-12-18",
      lastReceiptDate: "2025-11-10",
      preferredVendor: "ElectroSpare",
      status: "ok",
    },
    {
      id: "SP-00059",
      sku: "BELT-HTD-5M",
      name: "Timing Belt HTD 5M",
      category: "Mechanical",
      uom: "Nos",
      plant: "Plant B",
      location: "Stores / Rack M-05",
      criticality: "A",
      reorderLevel: 6,
      stockOnHand: 2,
      stockReserved: 1,
      onOrderQty: 0,
      etaDate: null,
      lastIssueDate: "2025-12-27",
      lastReceiptDate: "2025-10-14",
      preferredVendor: "Motion Parts India",
      status: "low",
    },
  ];
}

function StatPill({ icon: Icon, title, value, hint }) {
  return (
    <Card className="rounded-2xl border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

export default function SparesStock() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [plant, setPlant] = useState("all");
  const [criticality, setCriticality] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("risk"); // risk | name | available | onhand

  // Select (for bulk)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Adjustment dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      // TODO: replace with API GET /maintenance/spares/stock
      const data = mockStockRows().map((r) => ({ ...r, available: calcAvailable(r) }));
      setRows(data);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load spares stock", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plants = useMemo(() => {
    const set = new Set(rows.map((r) => r.plant).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const computed = useMemo(() => {
    return rows.map((r) => {
      const available = calcAvailable(r);
      const gap = (r.reorderLevel ?? 0) - available;

      // risk score: low stock + criticality + no inbound
      const statusWeight = r.status === "low" ? 0 : r.status === "on_order" ? 1 : 2;
      const critWeight = r.criticality === "A" ? 0 : r.criticality === "B" ? 1 : 2;
      const inboundPenalty = (r.onOrderQty ?? 0) > 0 ? 0 : 10;

      const risk = statusWeight * 100 + critWeight * 20 + Math.max(0, gap) + inboundPenalty;
      return { ...r, available, risk };
    });
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...computed];

    if (needle) {
      list = list.filter((r) => {
        const hay = [
          r.id,
          r.sku,
          r.name,
          r.category,
          r.uom,
          r.plant,
          r.location,
          r.preferredVendor,
          r.status,
          r.criticality,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }

    if (plant !== "all") list = list.filter((r) => r.plant === plant);
    if (criticality !== "all") list = list.filter((r) => r.criticality === criticality);
    if (status !== "all") list = list.filter((r) => r.status === status);

    if (sortBy === "risk") list.sort((a, b) => a.risk - b.risk);
    if (sortBy === "name") list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    if (sortBy === "available") list.sort((a, b) => (a.available ?? 0) - (b.available ?? 0));
    if (sortBy === "onhand") list.sort((a, b) => (b.stockOnHand ?? 0) - (a.stockOnHand ?? 0));

    return list;
  }, [computed, q, plant, criticality, status, sortBy]);

  const stats = useMemo(() => {
    const total = computed.length;
    const low = computed.filter((r) => r.status === "low").length;
    const onOrder = computed.filter((r) => r.status === "on_order").length;
    const criticalLow = computed.filter((r) => r.status === "low" && r.criticality === "A").length;

    const selectedCount = selectedIds.size;
    const selectedAvailable = computed
      .filter((r) => selectedIds.has(r.id))
      .reduce((sum, r) => sum + (r.available ?? 0), 0);

    return { total, low, onOrder, criticalLow, selectedCount, selectedAvailable };
  }, [computed, selectedIds]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = useMemo(() => {
    if (!filtered.length) return false;
    return filtered.every((r) => selectedIds.has(r.id));
  }, [filtered, selectedIds]);

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const clearFilters = () => {
    setQ("");
    setPlant("all");
    setCriticality("all");
    setStatus("all");
    setSortBy("risk");
  };

  const exportCsv = async () => {
    toast({
      title: "Export (placeholder)",
      description: "Implement backend export for spares stock list (CSV).",
    });
  };

  const openAdjust = (row) => {
    setAdjustTarget(row);
    setAdjustQty("");
    setAdjustReason("");
    setAdjustOpen(true);
  };

  const submitAdjust = async () => {
    const qty = Number(adjustQty);
    if (!adjustTarget) return;

    if (!Number.isFinite(qty) || qty === 0) {
      toast({ title: "Invalid quantity", description: "Enter a non-zero adjustment quantity.", variant: "destructive" });
      return;
    }
    if (!adjustReason.trim()) {
      toast({ title: "Reason required", description: "Please add a reason for the adjustment.", variant: "destructive" });
      return;
    }

    try {
      // TODO: POST /inventory/stock/adjustments
      // payload: { item_id: adjustTarget.id, qty, reason: adjustReason, module: "maintenance_spares" }
      toast({
        title: "Adjustment requested (placeholder)",
        description: `Requested ${qty > 0 ? "+" : ""}${qty} ${adjustTarget.uom} for ${adjustTarget.name}.`,
      });
      setAdjustOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", description: "Could not request adjustment.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Spares Stock</h1>
            <p className="text-sm text-gray-600">
              Track maintenance spares stock by plant/location with low-stock alerts and adjustment requests.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
            <Link to="/maintenance/spares/reorder">
              <Truck className="h-4 w-4" />
              Go to Reorder
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatPill icon={Boxes} title="Total Spares" value={stats.total} />
        <StatPill icon={AlertTriangle} title="Low Stock" value={stats.low} hint="Below reorder level / risk items" />
        <StatPill icon={Truck} title="On Order" value={stats.onOrder} hint="Inbound quantities planned" />
        <StatPill icon={ShieldCheck} title="Critical Low (A)" value={stats.criticalLow} hint="Stop-line risk spares" />
        <StatPill icon={PackageSearch} title="Selected" value={stats.selectedCount} hint={`Available sum: ${stats.selectedAvailable}`} />
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Filters</p>
              <p className="text-xs text-gray-500">Search and narrow down by plant, criticality and stock status.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                toast({
                  title: "Configure spares master (placeholder)",
                  description: "Create SparesMaster.jsx to manage ROL, criticality, preferred vendor and locations.",
                })
              }
            >
              <SlidersHorizontal className="h-4 w-4" />
              Spares Master
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search spare, SKU, location, vendor..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plant">Plant</Label>
            <select
              id="plant"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              {plants.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All Plants" : p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="criticality">Criticality</Label>
            <select
              id="criticality"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="all">All</option>
              <option value="A">A (Critical)</option>
              <option value="B">B (Important)</option>
              <option value="C">C (Standard)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="on_order">On Order</option>
              <option value="ok">OK</option>
            </select>
          </div>

          <div>
            <Label htmlFor="sortBy">Sort</Label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="risk">Risk (High→Low)</option>
              <option value="name">Name</option>
              <option value="available">Available (Low→High)</option>
              <option value="onhand">On-hand (High→Low)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={toggleSelectAllVisible} disabled={!filtered.length}>
            <PackageSearch className="h-4 w-4" />
            {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (!selectedIds.size) {
                toast({ title: "No selection", description: "Select items first.", variant: "destructive" });
                return;
              }
              toast({
                title: "Bulk adjustment (placeholder)",
                description: "Add BulkStockAdjust.jsx to request adjustments for selected spares.",
              });
            }}
          >
            <Plus className="h-4 w-4" />
            Request Bulk Adjustment
          </Button>
        </div>
      </Card>

      {/* Table/List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="h-32 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-32 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-32 animate-pulse rounded-2xl bg-gray-50" />
        </div>
      ) : !filtered.length ? (
        <Card className="rounded-2xl border bg-white p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-900">No matching spares</h3>
          <p className="mt-1 text-sm text-gray-600">Try changing filters or clearing search.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={load}>
              Refresh
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const selected = selectedIds.has(r.id);
            const available = calcAvailable(r);

            const lowDanger = available <= (r.reorderLevel ?? 0);
            const borderClass = lowDanger ? "border-[#dc2551]/30" : "border-gray-200";

            return (
              <Card key={r.id} className={cx("rounded-2xl border bg-white p-4", borderClass)}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toggleSelect(r.id)}
                        className={cx(
                          "inline-flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          selected ? "border-[#dc2551] bg-[#dc2551]/10" : "border-gray-300 bg-white hover:bg-gray-50"
                        )}
                        aria-label={selected ? "Unselect item" : "Select item"}
                      >
                        {selected ? <ShieldCheck className="h-4 w-4 text-[#dc2551]" /> : null}
                      </button>

                      <p className="font-semibold text-gray-900">
                        {r.name} <span className="text-gray-500">({r.sku})</span>
                      </p>

                      <MetaBadge meta={STATUS_META} value={r.status} />
                      <MetaBadge meta={CRIT_META} value={r.criticality} />
                      <Badge variant="outline">{r.plant}</Badge>
                      <Badge variant="outline">{r.location}</Badge>
                      <Badge variant="outline">{r.uom}</Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div className="rounded-xl border bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">On Hand</p>
                        <p className="mt-1 text-xl font-extrabold text-gray-900">{r.stockOnHand}</p>
                      </div>

                      <div className="rounded-xl border bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Reserved</p>
                        <p className="mt-1 text-xl font-extrabold text-gray-900">{r.stockReserved}</p>
                      </div>

                      <div className={cx("rounded-xl border p-3", lowDanger ? "bg-[#dc2551]/5" : "bg-gray-50")}>
                        <p className="text-xs text-gray-500">Available</p>
                        <p className={cx("mt-1 text-xl font-extrabold", lowDanger ? "text-[#dc2551]" : "text-gray-900")}>
                          {available}
                        </p>
                        <p className="text-xs text-gray-500">ROL: {r.reorderLevel}</p>
                      </div>

                      <div className="rounded-xl border bg-white p-3">
                        <p className="text-xs text-gray-500">Inbound</p>
                        <p className="mt-1 text-xl font-extrabold text-gray-900">{r.onOrderQty ?? 0}</p>
                        <p className="text-xs text-gray-500">{r.etaDate ? `ETA: ${r.etaDate}` : "No ETA"}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-400" />
                        Vendor: <span className="font-semibold text-gray-900">{r.preferredVendor}</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <PackageSearch className="h-4 w-4 text-gray-400" />
                        Last issue: <span className="font-semibold text-gray-900">{r.lastIssueDate || "—"}</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        Last receipt: <span className="font-semibold text-gray-900">{r.lastReceiptDate || "—"}</span>
                      </span>
                    </div>

                    {lowDanger ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-[#dc2551]/5 px-3 py-2 text-sm text-[#dc2551]">
                        <AlertTriangle className="h-4 w-4" />
                        Stock is at/under reorder level — consider creating a reorder batch.
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <Link to={`/maintenance/spares/${r.id}`}>
                        <Wrench className="h-4 w-4" />
                        Details
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => openAdjust(r)}
                    >
                      <Plus className="h-4 w-4" />
                      Request Adjust
                    </Button>

                    <Button
                      size="sm"
                      className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                      asChild
                    >
                      <Link to="/maintenance/spares/reorder">
                        <Truck className="h-4 w-4" />
                        Reorder
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Adjustment dialog */}
      <AlertDialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request stock adjustment</AlertDialogTitle>
            <AlertDialogDescription>
              This sends a request to Inventory for physical count/adjustment approval.
              <span className="block mt-2 text-xs text-gray-500">
                Item: <span className="font-semibold text-gray-900">{adjustTarget?.name}</span>{" "}
                <span className="text-gray-400">({adjustTarget?.sku})</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="qty">Adjustment qty (use negative for decrease)</Label>
              <Input
                id="qty"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. +5 or -2"
                inputMode="decimal"
              />
              <p className="mt-1 text-xs text-gray-500">
                Available is calculated as On Hand - Reserved. Adjustments should reflect actual stock count.
              </p>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Physical count correction, damaged item, wrong receipt..."
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitAdjust}>Submit Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
