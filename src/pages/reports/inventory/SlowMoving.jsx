// src/pages/reports/inventory/SlowMoving.jsx
import {
    AlertTriangle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Filter,
    Loader2,
    Package,
    RefreshCcw,
    Search,
    SlidersHorizontal,
    TrendingDown
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function toISODate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  try {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatINR(n) {
  const num = Number(n || 0);
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num);
  } catch {
    return `₹${num.toFixed(2)}`;
  }
}

function formatNumber(n, decimals = 2) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function formatDateHuman(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Slow Moving Inventory Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/inventory/slow-moving
 *      params: from, to, query, plant_id, warehouse_id, item_type, min_days, max_value, groupBy, page, size
 *      returns:
 *        {
 *          summary: { items, total_value, avg_days },
 *          rows: [
 *            {
 *              id,
 *              item_id,
 *              item_code,
 *              item_name,
 *              item_type,
 *              uom,
 *              current_stock,
 *              last_movement_date,
 *              days_since_movement,
 *              avg_daily_usage,
 *              estimated_days_left,
 *              total_value,
 *              unit_cost,
 *              warehouse_id,
 *              warehouse_name,
 *              plant_id,
 *              plant_name,
 *              category, // e.g. "Critical", "Moderate", "Low"
 *              status // e.g. "Stale", "At Risk", "Monitor"
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/inventory/slow-moving/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function SlowMovingReport() {
  const { toast } = useToast();

  // Date filters
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(new Date()));

  // Search and filters
  const [query, setQuery] = useState("");
  const [plantId, setPlantId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [itemType, setItemType] = useState("all");
  const [minDays, setMinDays] = useState("30");
  const [maxValue, setMaxValue] = useState("");
  const [groupBy, setGroupBy] = useState("item");

  // Lookups
  const [plants, setPlants] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ items: 0, total_value: 0, avg_days: 0 });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const loadLookups = async () => {
    try {
      const [pRes, wRes] = await Promise.allSettled([
        api.get("/settings/plants"),
        api.get("/warehouse/warehouses"),
      ]);

      if (pRes.status === "fulfilled") {
        const p = pRes.value?.data?.data || pRes.value?.data || [];
        setPlants(Array.isArray(p) ? p : []);
      }
      if (wRes.status === "fulfilled") {
        const w = wRes.value?.data?.data || wRes.value?.data || [];
        setWarehouses(Array.isArray(w) ? w : []);
      }
    } catch {
      // ignore
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/inventory/slow-moving", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          warehouse_id: warehouseId || undefined,
          item_type: itemType !== "all" ? itemType : undefined,
          min_days: Number(minDays) || undefined,
          max_value: Number(maxValue) || undefined,
          groupBy,
          page: pageIndex,
          size: pageSize,
        },
      });

      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSummary({
        items: Number(data?.summary?.items || 0),
        total_value: Number(data?.summary?.total_value || 0),
        avg_days: Number(data?.summary?.avg_days || 0),
      });

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load slow moving report",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ items: 0, total_value: 0, avg_days: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    fetchData();
  }, [from, to, plantId, warehouseId, itemType, minDays, maxValue, groupBy, pageIndex, pageSize]);

  const onApply = () => {
    setPageIndex(0);
    fetchData();
  };

  const onReset = () => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    setFrom(toISODate(d));
    setTo(toISODate(new Date()));
    setQuery("");
    setPlantId("");
    setWarehouseId("");
    setItemType("all");
    setMinDays("30");
    setMaxValue("");
    setGroupBy("item");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/inventory/slow-moving/export", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          warehouse_id: warehouseId || undefined,
          item_type: itemType !== "all" ? itemType : undefined,
          min_days: Number(minDays) || undefined,
          max_value: Number(maxValue) || undefined,
          groupBy,
        },
        responseType: "blob",
      });

      const contentType = res?.headers?.["content-type"] || "application/octet-stream";
      const ext =
        contentType.includes("pdf")
          ? "pdf"
          : contentType.includes("sheet") || contentType.includes("excel")
          ? "xlsx"
          : "csv";

      downloadBlob(res.data, `slow_moving_${from}_to_${to}.${ext}`);
      toast({ title: "Export started", description: "Your report is downloading." });
    } catch (err) {
      console.warn("Export endpoint not available or failed:", err);
      toast({
        title: "Export failed",
        description: "Export endpoint may not be enabled yet.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const groupLabel = useMemo(() => {
    switch (groupBy) {
      case "warehouse":
        return "Warehouse";
      case "plant":
        return "Plant";
      case "category":
        return "Category";
      default:
        return "Item";
    }
  }, [groupBy]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "stale":
        return <Badge variant="destructive" className="text-xs">Stale</Badge>;
      case "at risk":
        return <Badge variant="warning" className="text-xs">At Risk</Badge>;
      case "monitor":
        return <Badge variant="secondary" className="text-xs">Monitor</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category?.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case "moderate":
        return <Badge variant="warning" className="text-xs">Moderate</Badge>;
      case "low":
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">-</Badge>;
    }
  };

  const getDaysColor = (days) => {
    const d = Number(days || 0);
    if (d >= 180) return "text-red-600 font-semibold";
    if (d >= 90) return "text-orange-600 font-semibold";
    if (d >= 30) return "text-yellow-600 font-semibold";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Inventory</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Slow Moving Inventory Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            Identify inventory items with low turnover that may be tying up capital and warehouse space.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={onExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Movement From</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Movement To</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Plant</label>
              <select
                value={plantId}
                onChange={(e) => {
                  setPlantId(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="">All Plants</option>
                {plants.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name || p.title || `Plant ${p.id || p._id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id || w._id} value={w.id || w._id}>
                    {w.name || w.code || `Warehouse ${w.id || w._id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Item Type</label>
              <select
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All Types</option>
                <option value="laminate">Laminate</option>
                <option value="copper">Copper</option>
                <option value="chemical">Chemical</option>
                <option value="soldermask">Soldermask</option>
                <option value="silkscreen">Silkscreen</option>
                <option value="drill">Drill / Tooling</option>
                <option value="consumable">Consumable</option>
                <option value="outsourcing">Outsourcing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Min Days Since Movement</label>
              <select
                value={minDays}
                onChange={(e) => {
                  setMinDays(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="30">30+ days</option>
                <option value="60">60+ days</option>
                <option value="90">90+ days</option>
                <option value="180">180+ days</option>
                <option value="365">1+ year</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Max Value (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={maxValue}
                onChange={(e) => {
                  setMaxValue(e.target.value);
                  setPageIndex(0);
                }}
              />
            </div>

            <div className="space-y-1.5 lg:col-span-7">
              <label className="text-xs font-semibold text-gray-600">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => (e.key === "Enter" ? onApply() : null)}
                  placeholder="Item code, name, warehouse, plant..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={onApply} disabled={loading}>
              <Filter className="h-4 w-4" />
              Apply
            </Button>
            <Button variant="ghost" className="gap-2" onClick={onReset} disabled={loading}>
              <SlidersHorizontal className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Slow Moving Items</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.items)}</p>
              <p className="mt-1 text-xs text-gray-500">Items with low turnover</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tied Up Capital</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatINR(summary.total_value)}</p>
              <p className="mt-1 text-xs text-gray-500">Total value of slow moving stock</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Days Idle</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.avg_days, 1)}</p>
              <p className="mt-1 text-xs text-gray-500">Average days since last movement</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {groupLabel} slow moving inventory
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} item{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Items with no movement for the specified period. Consider review, discounting, or disposal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Export (if enabled)
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {groupBy === "item" ? (
                  <>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">UOM</th>
                  </>
                ) : groupBy === "warehouse" ? (
                  <>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Plant</th>
                    <th className="px-4 py-3 text-left">Items</th>
                  </>
                ) : groupBy === "plant" ? (
                  <>
                    <th className="px-4 py-3 text-left">Plant</th>
                    <th className="px-4 py-3 text-left">Warehouses</th>
                    <th className="px-4 py-3 text-left">Items</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-left">Avg Days</th>
                  </>
                )}

                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Days Idle</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Movement</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading slow moving inventory…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-600">
                    No slow moving inventory found for the selected criteria.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const stock = Number(r.current_stock || 0);
                  const days = Number(r.days_since_movement || 0);
                  const value = Number(r.total_value || 0);
                  const unitCost = Number(r.unit_cost || 0);

                  const itemHref = r?.item_id ? `/inventory/items/${r.item_id}` : null;
                  const warehouseHref = r?.warehouse_id ? `/warehouse/warehouses/${r.warehouse_id}` : null;
                  const plantHref = r?.plant_id ? `/settings/plants/${r.plant_id}` : null;

                  return (
                    <tr key={`${groupBy}-${r.id}`} className="hover:bg-gray-50/70">
                      {groupBy === "item" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                ITEM
                              </Badge>
                              {itemHref ? (
                                <Link to={itemHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.item_code || r.item_name || `Item ${r.item_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.item_code || r.item_name || `Item ${r.item_id}`}</span>
                              )}
                              {r.item_name && r.item_code ? <span className="text-xs text-gray-500">— {r.item_name}</span> : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.item_type || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.uom || "-"}</td>
                        </>
                      ) : groupBy === "warehouse" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                WH
                              </Badge>
                              {warehouseHref ? (
                                <Link to={warehouseHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.warehouse_name || `Warehouse ${r.warehouse_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.warehouse_name || `Warehouse ${r.warehouse_id}`}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.plant_name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.item_count || "-"}</td>
                        </>
                      ) : groupBy === "plant" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                PLANT
                              </Badge>
                              {plantHref ? (
                                <Link to={plantHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.plant_name || `Plant ${r.plant_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.plant_name || `Plant ${r.plant_id}`}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.warehouse_count || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.item_count || "-"}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getCategoryBadge(r.category)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.item_count || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(r.avg_days, 1)}</td>
                        </>
                      )}

                      <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(stock, 3)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getDaysColor(days)}`}>
                        {formatNumber(days)} days
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatINR(value)}</td>

                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(r.status)}
                        <div className="mt-1 text-xs text-gray-500">{r.category ? getCategoryBadge(r.category) : "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDateHuman(r.last_movement_date)}</span>
                          <span className="text-xs text-gray-500">Unit cost: {formatINR(unitCost)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-600">
            Page <span className="font-semibold">{pageIndex + 1}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0);
                }}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={loading || pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={loading || pageIndex >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Actionable Insights */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Actionable Insights</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">Review Critical Items</span> (180+ days): Consider discounting, bundling, or disposal.</li>
              <li><span className="font-medium">Monitor At Risk Items</span> (90-180 days): Increase marketing efforts or adjust reorder points.</li>
              <li><span className="font-medium">Optimize Stock Levels</span>: Reduce safety stock for slow movers to free up capital.</li>
              <li><span className="font-medium">Supplier Negotiations</span>: Discuss return policies or consignment for high-value slow movers.</li>
              <li><span className="font-medium">Demand Forecasting</span>: Review forecasting models for accuracy on these items.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Tip: Use the "Min Days" filter to focus on your most critical slow moving inventory.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}