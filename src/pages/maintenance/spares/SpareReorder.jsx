// src/pages/maintenance/spares/SpareReorder.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Filter,
  PackagePlus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShoppingCart,
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
 * PCBxpress - Maintenance Spares Reorder
 * File: src/pages/maintenance/spares/SpareReorder.jsx
 *
 * Purpose:
 * - Identify spares below reorder level (ROL)
 * - Generate reorder suggestions (ROP/ROL + lead time)
 * - Create PR/PO draft (integration with procurement)
 * - Track items already on order / in transit
 *
 * Suggested APIs:
 * - GET  /maintenance/spares/reorder?query=&plant=&criticality=&status=&sort=
 * - POST /maintenance/spares/reorder/export (CSV/PDF)
 * - POST /procurement/purchase-requests (create PR) or /procurement/purchase-orders (draft PO)
 *
 * Integration fields (ideal):
 * - spare_id, sku, name, uom
 * - plant_id
 * - stock_on_hand, stock_reserved, stock_available
 * - reorder_level (ROL), reorder_qty, reorder_point (ROP)
 * - lead_time_days
 * - min_order_qty, pack_size
 * - vendor (preferred), last_price, last_po_date
 * - on_order_qty, eta_date
 * - criticality (A/B/C)
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
  needs_reorder: { label: "Needs Reorder", variant: "destructive" },
  ok: { label: "OK", variant: "secondary" },
  on_order: { label: "On Order", variant: "default" },
};

function MetaBadge({ meta, value }) {
  const m = meta?.[value] ?? { label: value, variant: "outline" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function toISODate(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Mock dataset (replace with API)
function mockReorderRows() {
  const today = toISODate(new Date());
  return [
    {
      id: "SP-00081",
      sku: "BRG-6002Z",
      name: "Ball Bearing 6002Z",
      category: "Mechanical",
      uom: "Nos",
      plant: "Plant A",
      criticality: "A",
      preferredVendor: "SKF Dealer - Kochi",
      stockOnHand: 6,
      stockReserved: 2,
      reorderLevel: 10,
      reorderQty: 20,
      leadTimeDays: 5,
      minOrderQty: 10,
      packSize: 10,
      onOrderQty: 0,
      etaDate: null,
      lastPrice: 180,
      lastPO: "PO-1092",
      lastPODate: "2025-12-08",
      status: "needs_reorder",
      usage30d: 12,
      usage90d: 28,
      usedIn: ["CNC Drill #3", "Router #1"],
      note: "High wear item for spindle assemblies.",
      updatedAt: today,
    },
    {
      id: "SP-00112",
      sku: "NOZ-PLT-04",
      name: "Plating Spray Nozzle 4mm",
      category: "Consumable",
      uom: "Nos",
      plant: "Plant A",
      criticality: "B",
      preferredVendor: "WetLine Supplies",
      stockOnHand: 18,
      stockReserved: 4,
      reorderLevel: 15,
      reorderQty: 30,
      leadTimeDays: 7,
      minOrderQty: 10,
      packSize: 5,
      onOrderQty: 20,
      etaDate: "2026-01-10",
      lastPrice: 95,
      lastPO: "PO-1108",
      lastPODate: "2025-12-20",
      status: "on_order",
      usage30d: 10,
      usage90d: 24,
      usedIn: ["Plating Line #1"],
      note: "On order; confirm ETA before raising new PO.",
      updatedAt: today,
    },
    {
      id: "SP-00034",
      sku: "FAN-120MM-24V",
      name: "24V DC Cooling Fan (120mm)",
      category: "Electrical",
      uom: "Nos",
      plant: "Plant B",
      criticality: "C",
      preferredVendor: "ElectroSpare",
      stockOnHand: 22,
      stockReserved: 2,
      reorderLevel: 12,
      reorderQty: 12,
      leadTimeDays: 3,
      minOrderQty: 6,
      packSize: 2,
      onOrderQty: 0,
      etaDate: null,
      lastPrice: 240,
      lastPO: "PO-1051",
      lastPODate: "2025-11-10",
      status: "ok",
      usage30d: 4,
      usage90d: 8,
      usedIn: ["AOI Station #2", "E-Test Machine #1"],
      note: "",
      updatedAt: today,
    },
    {
      id: "SP-00059",
      sku: "BELT-HTD-5M",
      name: "Timing Belt HTD 5M",
      category: "Mechanical",
      uom: "Nos",
      plant: "Plant B",
      criticality: "A",
      preferredVendor: "Motion Parts India",
      stockOnHand: 2,
      stockReserved: 1,
      reorderLevel: 6,
      reorderQty: 10,
      leadTimeDays: 12,
      minOrderQty: 5,
      packSize: 1,
      onOrderQty: 0,
      etaDate: null,
      lastPrice: 980,
      lastPO: "PO-1019",
      lastPODate: "2025-10-14",
      status: "needs_reorder",
      usage30d: 3,
      usage90d: 9,
      usedIn: ["Conveyor #2"],
      note: "Long lead time — keep safety stock.",
      updatedAt: today,
    },
  ];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function roundUpToPack(qty, packSize = 1) {
  const ps = Math.max(1, Number(packSize || 1));
  return Math.ceil(qty / ps) * ps;
}

function calcAvailable(row) {
  return Math.max(0, (row.stockOnHand ?? 0) - (row.stockReserved ?? 0));
}

/**
 * Basic reorder suggestion:
 * target = reorderLevel + (avgDailyUsage * leadTimeDays)
 * suggested = max(reorderQty, target - available - onOrderQty)
 * then apply MOQ + pack size
 */
function suggestQty(row) {
  const available = calcAvailable(row);
  const onOrder = row.onOrderQty ?? 0;

  const avgDailyUsage = (row.usage30d ?? 0) / 30;
  const demandDuringLead = avgDailyUsage * (row.leadTimeDays ?? 0);
  const target = (row.reorderLevel ?? 0) + demandDuringLead;

  const base = Math.max(row.reorderQty ?? 0, target - available - onOrder);
  const moq = row.minOrderQty ?? 0;
  const afterMoq = Math.max(base, moq);

  return roundUpToPack(Math.ceil(afterMoq), row.packSize ?? 1);
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

export default function SpareReorder() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters / sort
  const [q, setQ] = useState("");
  const [plant, setPlant] = useState("all");
  const [criticality, setCriticality] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("priority"); // priority | name | available | suggested

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [creatingPO, setCreatingPO] = useState(false);

  // Remove dialog (unselect or mark as reviewed)
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const plants = useMemo(() => {
    const set = new Set(rows.map((r) => r.plant).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      // TODO: replace with API GET /maintenance/spares/reorder
      const data = mockReorderRows();
      setRows(data);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load spares", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computed = useMemo(() => {
    return rows.map((r) => {
      const available = calcAvailable(r);
      const suggested = suggestQty(r);

      // Priority score: overdue-like needs reorder, criticality A, low available
      const statusWeight = r.status === "needs_reorder" ? 0 : r.status === "on_order" ? 1 : 2;
      const critWeight = r.criticality === "A" ? 0 : r.criticality === "B" ? 1 : 2;
      const availabilityRisk = clamp((r.reorderLevel ?? 0) - available, -999, 999);

      const priorityScore = statusWeight * 100 + critWeight * 20 + Math.max(0, availabilityRisk);
      return { ...r, available, suggested, priorityScore };
    });
  }, [rows]);

  const stats = useMemo(() => {
    const total = computed.length;
    const needs = computed.filter((r) => r.status === "needs_reorder").length;
    const onOrder = computed.filter((r) => r.status === "on_order").length;
    const criticalA = computed.filter((r) => r.criticality === "A" && r.status === "needs_reorder").length;

    const selectedCount = selectedIds.size;
    const selectedSuggestedTotal = computed
      .filter((r) => selectedIds.has(r.id))
      .reduce((sum, r) => sum + (r.suggested ?? 0), 0);

    return { total, needs, onOrder, criticalA, selectedCount, selectedSuggestedTotal };
  }, [computed, selectedIds]);

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
          r.preferredVendor,
          r.status,
          r.criticality,
          ...(r.usedIn ?? []),
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

    if (sortBy === "priority") list.sort((a, b) => a.priorityScore - b.priorityScore);
    if (sortBy === "name") list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    if (sortBy === "available") list.sort((a, b) => (a.available ?? 0) - (b.available ?? 0));
    if (sortBy === "suggested") list.sort((a, b) => (b.suggested ?? 0) - (a.suggested ?? 0));

    return list;
  }, [computed, q, plant, criticality, status, sortBy]);

  const allVisibleSelected = useMemo(() => {
    if (!filtered.length) return false;
    return filtered.every((r) => selectedIds.has(r.id));
  }, [filtered, selectedIds]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((r) => next.delete(r.id));
      } else {
        filtered.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const resetFilters = () => {
    setQ("");
    setPlant("all");
    setCriticality("all");
    setStatus("all");
    setSortBy("priority");
  };

  const exportList = async () => {
    toast({
      title: "Export (placeholder)",
      description: "Implement backend export for maintenance spares reorder list (CSV/PDF).",
    });
  };

  const requestRemoveFromSelection = (row) => {
    setRemoveTarget(row);
    setRemoveOpen(true);
  };

  const confirmRemoveFromSelection = () => {
    if (!removeTarget) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(removeTarget.id);
      return next;
    });
    setRemoveOpen(false);
    setRemoveTarget(null);
    toast({ title: "Removed from selection", description: "Item remains in list; only removed from current batch." });
  };

  const createDraftPO = async () => {
    if (!selectedIds.size) {
      toast({ title: "No items selected", description: "Select spares to create a draft PO.", variant: "destructive" });
      return;
    }

    setCreatingPO(true);
    try {
      // TODO: call backend to create PR/PO
      const items = computed
        .filter((r) => selectedIds.has(r.id))
        .map((r) => ({
          spare_id: r.id,
          sku: r.sku,
          name: r.name,
          qty: r.suggested,
          uom: r.uom,
          preferred_vendor: r.preferredVendor,
          plant: r.plant,
        }));

      console.log("Draft PO items:", items);

      toast({
        title: "Draft PO created (placeholder)",
        description: `Selected ${items.length} item(s). Now route to Procurement → Purchase Orders.`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create draft", description: "Please try again.", variant: "destructive" });
    } finally {
      setCreatingPO(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Spare Reorder</h1>
            <p className="text-sm text-gray-600">
              Auto-suggest reorder quantities for critical maintenance spares based on stock, ROL/lead time & usage.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={exportList}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={createDraftPO} disabled={creatingPO}>
            <Send className="h-4 w-4" />
            {creatingPO ? "Creating..." : "Create Draft PO"}
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <StatPill icon={Boxes} title="Total Spares" value={stats.total} />
        <StatPill icon={AlertTriangle} title="Needs Reorder" value={stats.needs} hint="Below reorder level / projected risk" />
        <StatPill icon={Truck} title="On Order" value={stats.onOrder} hint="Inbound quantities already planned" />
        <StatPill icon={ShieldAlert} title="Critical A at Risk" value={stats.criticalA} hint="Stop-line risk spares" />
        <StatPill icon={ClipboardList} title="Selected" value={stats.selectedCount} hint="Current reorder batch" />
        <StatPill icon={PackagePlus} title="Selected Qty" value={stats.selectedSuggestedTotal} hint="Total suggested units" />
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
              <p className="text-xs text-gray-500">Search, filter by plant/criticality/status and sort for action.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                toast({
                  title: "Configure reorder rules (placeholder)",
                  description: "Create SparePolicy.jsx to manage ROL/ROP, MOQ, pack sizes and lead time defaults.",
                })
              }
            >
              <SlidersHorizontal className="h-4 w-4" />
              Reorder Rules
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
                placeholder="Search spare, SKU, equipment usage..."
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
              <option value="needs_reorder">Needs Reorder</option>
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
              <option value="priority">Priority</option>
              <option value="name">Name</option>
              <option value="available">Available (Low→High)</option>
              <option value="suggested">Suggested (High→Low)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk action bar */}
      <Card className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={toggleSelectAllVisible} disabled={loading || !filtered.length}>
              <ArrowUpDown className="h-4 w-4" />
              {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
            </Button>
            <div className="text-sm text-gray-700">
              Selected: <span className="font-semibold text-gray-900">{stats.selectedCount}</span>
              <span className="mx-2 text-gray-300">|</span>
              Total suggested qty: <span className="font-semibold text-gray-900">{stats.selectedSuggestedTotal}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                toast({
                  title: "Generate PR (placeholder)",
                  description: "Create PurchaseRequestDraft.jsx and pass selected items to Procurement.",
                })
              }
            >
              <FileText className="h-4 w-4" />
              Create PR
            </Button>

            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={createDraftPO} disabled={creatingPO}>
              <ShoppingCart className="h-4 w-4" />
              {creatingPO ? "Creating..." : "Create Draft PO"}
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
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
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
            <Button className="bg-[#dc2551] hover:bg-[#b02045]" onClick={load}>
              Refresh
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isSelected = selectedIds.has(r.id);

            return (
              <Card key={r.id} className="rounded-2xl border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toggleSelect(r.id)}
                        className={cx(
                          "inline-flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          isSelected ? "border-[#dc2551] bg-[#dc2551]/10" : "border-gray-300 bg-white hover:bg-gray-50"
                        )}
                        aria-label={isSelected ? "Unselect item" : "Select item"}
                      >
                        {isSelected ? <CheckCircle2 className="h-4 w-4 text-[#dc2551]" /> : null}
                      </button>

                      <p className="font-semibold text-gray-900">
                        {r.name} <span className="text-gray-500">({r.sku})</span>
                      </p>

                      <MetaBadge meta={STATUS_META} value={r.status} />
                      <MetaBadge meta={CRIT_META} value={r.criticality} />
                      <Badge variant="outline">{r.plant}</Badge>
                      <Badge variant="outline">{r.category}</Badge>
                      <Badge variant="outline">{r.uom}</Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-xl border bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className="mt-1 text-sm text-gray-800">
                          On hand: <span className="font-semibold text-gray-900">{r.stockOnHand}</span>
                        </p>
                        <p className="text-sm text-gray-800">
                          Reserved: <span className="font-semibold text-gray-900">{r.stockReserved}</span>
                        </p>
                        <p className="text-sm text-gray-800">
                          Available:{" "}
                          <span className={cx("font-semibold", r.available <= r.reorderLevel ? "text-[#dc2551]" : "text-gray-900")}>
                            {r.available}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Reorder Policy</p>
                        <p className="mt-1 text-sm text-gray-800">
                          ROL: <span className="font-semibold text-gray-900">{r.reorderLevel}</span>
                        </p>
                        <p className="text-sm text-gray-800">
                          Reorder Qty: <span className="font-semibold text-gray-900">{r.reorderQty}</span>
                        </p>
                        <p className="text-sm text-gray-800">
                          Lead Time: <span className="font-semibold text-gray-900">{r.leadTimeDays}</span> days
                        </p>
                      </div>

                      <div className="rounded-xl border bg-white p-3">
                        <p className="text-xs text-gray-500">Suggested Purchase</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900">{r.suggested}</p>
                        <p className="text-xs text-gray-500">
                          MOQ: {r.minOrderQty} · Pack: {r.packSize}
                        </p>
                        {r.onOrderQty > 0 ? (
                          <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                            <Truck className="h-4 w-4 text-gray-400" />
                            On order: <span className="font-semibold text-gray-900">{r.onOrderQty}</span>
                            {r.etaDate ? (
                              <>
                                <span className="text-gray-300">|</span>
                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                ETA: <span className="font-semibold text-gray-900">{r.etaDate}</span>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-400" />
                        Preferred vendor: <span className="font-semibold text-gray-900">{r.preferredVendor}</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-gray-400" />
                        Used in: <span className="font-semibold text-gray-900">{(r.usedIn ?? []).join(", ") || "—"}</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-gray-400" />
                        Usage (30d): <span className="font-semibold text-gray-900">{r.usage30d}</span>
                        <span className="text-gray-300">|</span>
                        Usage (90d): <span className="font-semibold text-gray-900">{r.usage90d}</span>
                      </span>
                    </div>

                    {r.note ? (
                      <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">Note</p>
                        <p className="mt-1">{r.note}</p>
                      </div>
                    ) : null}

                    <div className="mt-2 text-xs text-gray-500">Updated: {r.updatedAt}</div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <Link to={`/maintenance/spares/${r.id}`}>
                        <Wrench className="h-4 w-4" />
                        Spare Details
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => toggleSelect(r.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isSelected ? "Selected" : "Select"}
                    </Button>

                    <Button
                      size="sm"
                      className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                      onClick={() => {
                        setSelectedIds((prev) => new Set(prev).add(r.id));
                        toast({ title: "Added to batch", description: `Added ${r.name} to current reorder batch.` });
                      }}
                    >
                      <PackagePlus className="h-4 w-4" />
                      Add to Batch
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => requestRemoveFromSelection(r)}
                      disabled={!isSelected}
                    >
                      <ShieldAlert className="h-4 w-4 text-[#dc2551]" />
                      Remove from Batch
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        toast({
                          title: "Open PO history (placeholder)",
                          description: "Create SpareCostHistory.jsx and link here.",
                        })
                      }
                    >
                      <FileText className="h-4 w-4" />
                      PO History
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Remove-from-batch confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from current batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-semibold text-gray-900">{removeTarget?.name}</span> from your
              current reorder selection only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveFromSelection}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
