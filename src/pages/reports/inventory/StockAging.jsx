// src/pages/reports/inventory/StockAging.jsx
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    Download,
    Filter,
    Loader2,
    RefreshCcw,
    Search,
    SlidersHorizontal
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
 * Stock Aging Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/inventory/stock-aging
 *      params: as_of_date, query, plant_id, warehouse_id, item_type, aging_buckets, groupBy, page, size
 *      returns:
 *        {
 *          summary: { total_value, avg_age, aging_distribution },
 *          rows: [
 *            {
 *              id,
 *              item_id,
 *              item_code,
 *              item_name,
 *              item_type,
 *              uom,
 *              current_stock,
 *              avg_age_days,
 *              as_of_date,
 *              total_value,
 *              unit_cost,
 *              warehouse_id,
 *              warehouse_name,
 *              plant_id,
 *              plant_name,
 *              aging_bucket, // "0-30", "31-60", "61-90", "91-180", "180+"
 *              bucket_days,  // actual days
 *              value_0_30,
 *              value_31_60,
 *              value_61_90,
 *              value_91_180,
 *              value_180_plus,
 *              status // "Fresh", "Aging", "Old", "Critical"
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/inventory/stock-aging/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function StockAgingReport() {
  const { toast } = useToast();

  // Date and filters
  const [asOfDate, setAsOfDate] = useState(() => toISODate(new Date()));
  const [query, setQuery] = useState("");
  const [plantId, setPlantId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [itemType, setItemType] = useState("all");
  const [agingBuckets, setAgingBuckets] = useState("standard"); // standard | custom
  const [groupBy, setGroupBy] = useState("item");

  // Lookups
  const [plants, setPlants] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    total_value: 0, 
    avg_age: 0, 
    aging_distribution: { "0-30": 0, "31-60": 0, "61-90": 0, "91-180": 0, "180+": 0 }
  });

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
      const res = await api.get("/reports/inventory/stock-aging", {
        params: {
          as_of_date: asOfDate,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          warehouse_id: warehouseId || undefined,
          item_type: itemType !== "all" ? itemType : undefined,
          aging_buckets: agingBuckets,
          groupBy,
          page: pageIndex,
          size: pageSize,
        },
      });

      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      
      const sum = data?.summary || {};
      setSummary({
        total_value: Number(sum.total_value || 0),
        avg_age: Number(sum.avg_age || 0),
        aging_distribution: {
          "0-30": Number(sum.aging_distribution?.["0-30"] || 0),
          "31-60": Number(sum.aging_distribution?.["31-60"] || 0),
          "61-90": Number(sum.aging_distribution?.["61-90"] || 0),
          "91-180": Number(sum.aging_distribution?.["91-180"] || 0),
          "180+": Number(sum.aging_distribution?.["180+"] || 0),
        }
      });

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load stock aging report",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ 
        total_value: 0, 
        avg_age: 0, 
        aging_distribution: { "0-30": 0, "31-60": 0, "61-90": 0, "91-180": 0, "180+": 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    fetchData();
  }, [asOfDate, plantId, warehouseId, itemType, agingBuckets, groupBy, pageIndex, pageSize]);

  const onApply = () => {
    setPageIndex(0);
    fetchData();
  };

  const onReset = () => {
    setAsOfDate(toISODate(new Date()));
    setQuery("");
    setPlantId("");
    setWarehouseId("");
    setItemType("all");
    setAgingBuckets("standard");
    setGroupBy("item");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/inventory/stock-aging/export", {
        params: {
          as_of_date: asOfDate,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          warehouse_id: warehouseId || undefined,
          item_type: itemType !== "all" ? itemType : undefined,
          aging_buckets: agingBuckets,
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

      downloadBlob(res.data, `stock_aging_${asOfDate}.${ext}`);
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
      case "bucket":
        return "Aging Bucket";
      default:
        return "Item";
    }
  }, [groupBy]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "fresh":
        return <Badge variant="success" className="text-xs">Fresh</Badge>;
      case "aging":
        return <Badge variant="warning" className="text-xs">Aging</Badge>;
      case "old":
        return <Badge variant="destructive" className="text-xs">Old</Badge>;
      case "critical":
        return <Badge variant="destructive" className="text-xs bg-red-600">Critical</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getAgingColor = (bucket) => {
    switch (bucket) {
      case "0-30":
        return "text-green-600 font-semibold";
      case "31-60":
        return "text-yellow-600 font-semibold";
      case "61-90":
        return "text-orange-600 font-semibold";
      case "91-180":
        return "text-red-600 font-semibold";
      case "180+":
        return "text-red-700 font-bold";
      default:
        return "text-gray-600";
    }
  };

  const getAgingPercentage = (bucketValue) => {
    const total = summary.total_value;
    if (total <= 0) return "0%";
    return ((bucketValue / total) * 100).toFixed(1) + "%";
  };

  const getAgingBarWidth = (bucketValue) => {
    const total = summary.total_value;
    if (total <= 0) return "0%";
    return Math.min(100, (bucketValue / total) * 100) + "%";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Inventory</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Stock Aging Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analyze inventory age distribution to identify obsolete stock and optimize working capital.
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">As of Date</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="pl-9" />
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
              <label className="text-xs font-semibold text-gray-600">Aging Buckets</label>
              <select
                value={agingBuckets}
                onChange={(e) => {
                  setAgingBuckets(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="standard">Standard (30-day buckets)</option>
                <option value="custom">Custom Buckets</option>
              </select>
            </div>

            <div className="space-y-1.5 lg:col-span-6">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Stock Value</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatINR(summary.total_value)}</p>
              <p className="mt-1 text-xs text-gray-500">As of {formatDateHuman(asOfDate)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Average Age</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.avg_age, 1)} days</p>
              <p className="mt-1 text-xs text-gray-500">Weighted by value</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Critical Stock (180+ days)</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{formatINR(summary.aging_distribution["180+"] || 0)}</p>
              <p className="mt-1 text-xs text-gray-500">{getAgingPercentage(summary.aging_distribution["180+"] || 0)} of total</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2 ring-1 ring-red-200 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Aging Distribution Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Aging Distribution</h3>
            <p className="text-sm text-gray-600">Value distribution across aging buckets</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-lg font-bold text-gray-900">{formatINR(summary.total_value)}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {Object.entries(summary.aging_distribution).map(([bucket, value]) => (
            <div key={bucket} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold ${getAgingColor(bucket)}`}>
                  {bucket === "0-30" && "0-30 days (Fresh)"}
                  {bucket === "31-60" && "31-60 days (Aging)"}
                  {bucket === "61-90" && "61-90 days (Old)"}
                  {bucket === "91-180" && "91-180 days (Very Old)"}
                  {bucket === "180+" && "180+ days (Critical)"}
                </span>
                <span className="font-medium text-gray-900">{formatINR(value)}</span>
                <span className="text-xs text-gray-500">{getAgingPercentage(value)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${bucket === "0-30" ? "bg-green-500" : bucket === "31-60" ? "bg-yellow-500" : bucket === "61-90" ? "bg-orange-500" : bucket === "91-180" ? "bg-red-500" : "bg-red-700"}`}
                  style={{ width: getAgingBarWidth(value) }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {groupLabel} stock aging
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} item{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Inventory age analysis as of {formatDateHuman(asOfDate)}. Focus on items in critical aging buckets.
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
          <table className="min-w-[1300px] w-full">
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
                    <th className="px-4 py-3 text-left">Aging Bucket</th>
                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-left">Avg Age</th>
                  </>
                )}

                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Avg Age</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Aging Breakdown</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading stock aging data…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-600">
                    No stock aging data found for the selected criteria.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const stock = Number(r.current_stock || 0);
                  const avgAge = Number(r.avg_age_days || 0);
                  const totalValue = Number(r.total_value || 0);
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
                            <span className={`font-semibold ${getAgingColor(r.aging_bucket)}`}>
                              {r.aging_bucket === "0-30" && "0-30 days"}
                              {r.aging_bucket === "31-60" && "31-60 days"}
                              {r.aging_bucket === "61-90" && "61-90 days"}
                              {r.aging_bucket === "91-180" && "91-180 days"}
                              {r.aging_bucket === "180+" && "180+ days"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.item_count || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(r.avg_age_days, 1)} days</td>
                        </>
                      )}

                      <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(stock, 3)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getAgingColor(r.aging_bucket)}`}>
                        {formatNumber(avgAge)} days
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatINR(totalValue)}</td>

                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(r.status)}
                        <div className="mt-1 text-xs text-gray-500">Bucket: {r.aging_bucket || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">0-30:</span>
                            <span className="font-medium">{formatINR(r.value_0_30 || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-yellow-600">31-60:</span>
                            <span className="font-medium">{formatINR(r.value_31_60 || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-orange-600">61-90:</span>
                            <span className="font-medium">{formatINR(r.value_61_90 || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-red-600">91-180:</span>
                            <span className="font-medium">{formatINR(r.value_91_180 || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-red-700 font-semibold">180+:</span>
                            <span className="font-bold">{formatINR(r.value_180_plus || 0)}</span>
                          </div>
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
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Stock Aging Insights</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">Critical Stock (180+ days)</span>: Immediate action required - consider disposal, return to supplier, or deep discounting.</li>
              <li><span className="font-medium">Very Old Stock (91-180 days)</span>: Review usage patterns, consider bundling with fast-moving items.</li>
              <li><span className="font-medium">Old Stock (61-90 days)</span>: Monitor closely, adjust reorder quantities and safety stock levels.</li>
              <li><span className="font-medium">Aging Stock (31-60 days)</span>: Normal aging, but review for potential improvements in turnover.</li>
              <li><span className="font-medium">Fresh Stock (0-30 days)</span>: Healthy turnover, maintain current ordering practices.</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Recommendation:</span> Target critical stock for immediate action to free up working capital.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Review Frequency:</span> Weekly for critical stock, monthly for overall aging analysis.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">KPI:</span> Keep critical stock below 5% of total inventory value.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}