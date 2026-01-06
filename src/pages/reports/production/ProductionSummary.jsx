// src/pages/reports/production/ProductionSummary.jsx
import {
    Activity,
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Factory,
    Filter,
    Gauge,
    Loader2,
    Package,
    RefreshCcw,
    Search,
    SlidersHorizontal,
    Target,
    Users
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

function formatPercentage(n, decimals = 2) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "0%";
  return (num * 100).toFixed(decimals) + "%";
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
 * Production Summary Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/production/summary
 *      params: from, to, query, plant_id, work_center_id, product_type, status, groupBy, page, size
 *      returns:
 *        {
 *          summary: { 
 *            total_orders, completed_orders, in_progress_orders, on_time_rate, 
 *            capacity_utilization, efficiency, throughput, total_value, avg_cycle_time 
 *          },
 *          rows: [
 *            {
 *              id,
 *              work_center_id,
 *              work_center_name,
 *              plant_id,
 *              plant_name,
 *              orders_count,
 *              completed_count,
 *              in_progress_count,
 *              capacity_utilization,
 *              efficiency,
 *              throughput,
 *              avg_cycle_time,
 *              product_type,
 *              status,
 *              performance_trend // "Improving", "Stable", "Declining"
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/production/summary/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function ProductionSummaryReport() {
  const { toast } = useToast();

  // Date filters
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(new Date()));

  // Search and filters
  const [query, setQuery] = useState("");
  const [plantId, setPlantId] = useState("");
  const [workCenterId, setWorkCenterId] = useState("");
  const [productType, setProductType] = useState("all");
  const [status, setStatus] = useState("all");
  const [groupBy, setGroupBy] = useState("work_center");

  // Lookups
  const [plants, setPlants] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    total_orders: 0, 
    completed_orders: 0, 
    in_progress_orders: 0, 
    on_time_rate: 0, 
    capacity_utilization: 0, 
    efficiency: 0, 
    throughput: 0, 
    total_value: 0, 
    avg_cycle_time: 0 
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const loadLookups = async () => {
    try {
      const [pRes, wcRes] = await Promise.allSettled([
        api.get("/settings/plants"),
        api.get("/production/work-centers"),
      ]);

      if (pRes.status === "fulfilled") {
        const p = pRes.value?.data?.data || pRes.value?.data || [];
        setPlants(Array.isArray(p) ? p : []);
      }
      if (wcRes.status === "fulfilled") {
        const wc = wcRes.value?.data?.data || wcRes.value?.data || [];
        setWorkCenters(Array.isArray(wc) ? wc : []);
      }
    } catch {
      // ignore
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/production/summary", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: product_type !== "all" ? product_type : undefined,
          status: status !== "all" ? status : undefined,
          groupBy,
          page: pageIndex,
          size: pageSize,
        },
      });

      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      
      const sum = data?.summary || {};
      setSummary({
        total_orders: Number(sum.total_orders || 0),
        completed_orders: Number(sum.completed_orders || 0),
        in_progress_orders: Number(sum.in_progress_orders || 0),
        on_time_rate: Number(sum.on_time_rate || 0),
        capacity_utilization: Number(sum.capacity_utilization || 0),
        efficiency: Number(sum.efficiency || 0),
        throughput: Number(sum.throughput || 0),
        total_value: Number(sum.total_value || 0),
        avg_cycle_time: Number(sum.avg_cycle_time || 0),
      });

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load production summary",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ 
        total_orders: 0, 
        completed_orders: 0, 
        in_progress_orders: 0, 
        on_time_rate: 0, 
        capacity_utilization: 0, 
        efficiency: 0, 
        throughput: 0, 
        total_value: 0, 
        avg_cycle_time: 0 
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
  }, [from, to, plantId, workCenterId, productType, status, groupBy, pageIndex, pageSize]);

  const onApply = () => {
    setPageIndex(0);
    fetchData();
  };

  const onReset = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setFrom(toISODate(d));
    setTo(toISODate(new Date()));
    setQuery("");
    setPlantId("");
    setWorkCenterId("");
    setProductType("all");
    setStatus("all");
    setGroupBy("work_center");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/production/summary/export", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: product_type !== "all" ? product_type : undefined,
          status: status !== "all" ? status : undefined,
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

      downloadBlob(res.data, `production_summary_${from}_to_${to}.${ext}`);
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
      case "plant":
        return "Plant";
      case "product_type":
        return "Product Type";
      case "status":
        return "Status";
      default:
        return "Work Center";
    }
  }, [groupBy]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge variant="success" className="text-xs">Completed</Badge>;
      case "in_progress":
        return <Badge variant="warning" className="text-xs">In Progress</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
      case "on_schedule":
        return <Badge variant="success" className="text-xs">On Schedule</Badge>;
      case "delayed":
        return <Badge variant="destructive" className="text-xs">Delayed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getPerformanceBadge = (trend) => {
    switch (trend?.toLowerCase()) {
      case "improving":
        return <Badge variant="success" className="text-xs">Improving</Badge>;
      case "stable":
        return <Badge variant="secondary" className="text-xs">Stable</Badge>;
      case "declining":
        return <Badge variant="destructive" className="text-xs">Declining</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">-</Badge>;
    }
  };

  const getKPIColor = (value, type) => {
    const v = Number(value || 0);
    switch (type) {
      case "on_time_rate":
      case "efficiency":
      case "capacity_utilization":
        if (v >= 0.95) return "text-green-600 font-semibold";
        if (v >= 0.85) return "text-yellow-600 font-semibold";
        if (v >= 0.70) return "text-orange-600 font-semibold";
        return "text-red-600 font-bold";
      case "throughput":
        if (v >= 100) return "text-green-600 font-semibold";
        if (v >= 75) return "text-yellow-600 font-semibold";
        if (v >= 50) return "text-orange-600 font-semibold";
        return "text-red-600 font-bold";
      default:
        return "text-gray-600";
    }
  };

  const getKPIIcon = (type) => {
    switch (type) {
      case "on_time_rate":
        return <CheckCircle className="h-5 w-5" />;
      case "capacity_utilization":
        return <Gauge className="h-5 w-5" />;
      case "efficiency":
        return <Activity className="h-5 w-5" />;
      case "throughput":
        return <Target className="h-5 w-5" />;
      default:
        return <Factory className="h-5 w-5" />;
    }
  };

  const getKPIIconColor = (type) => {
    switch (type) {
      case "on_time_rate":
        return "bg-green-50 text-green-700 ring-green-200";
      case "capacity_utilization":
        return "bg-blue-50 text-blue-700 ring-blue-200";
      case "efficiency":
        return "bg-purple-50 text-purple-700 ring-purple-200";
      case "throughput":
        return "bg-orange-50 text-orange-700 ring-orange-200";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Production</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Production Summary Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive overview of production performance, capacity utilization, and operational efficiency.
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
              <label className="text-xs font-semibold text-gray-600">From Date</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">To Date</label>
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
              <label className="text-xs font-semibold text-gray-600">Work Center</label>
              <select
                value={workCenterId}
                onChange={(e) => {
                  setWorkCenterId(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="">All Work Centers</option>
                {workCenters.map((wc) => (
                  <option key={wc.id || wc._id} value={wc.id || wc._id}>
                    {wc.name || wc.code || `Work Center ${wc.id || wc._id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Product Type</label>
              <select
                value={productType}
                onChange={(e) => {
                  setProductType(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All Types</option>
                <option value="single_sided">Single Sided</option>
                <option value="double_sided">Double Sided</option>
                <option value="multilayer">Multilayer</option>
                <option value="flex">Flexible</option>
                <option value="rigid_flex">Rigid-Flex</option>
                <option value="hdi">HDI</option>
                <option value="high_freq">High Frequency</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
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
                  placeholder="Work center name, plant, product type..."
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.total_orders)}</p>
              <p className="mt-1 text-xs text-gray-500">All orders in period</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">On-Time Rate</p>
              <p className={`mt-2 text-2xl font-bold ${getKPIColor(summary.on_time_rate, 'on_time_rate')}`}>
                {formatPercentage(summary.on_time_rate)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Delivery performance</p>
            </div>
            <div className={`rounded-xl p-2 ring-1 ${getKPIIconColor('on_time_rate')}`}>
              {getKPIIcon('on_time_rate')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Capacity Utilization</p>
              <p className={`mt-2 text-2xl font-bold ${getKPIColor(summary.capacity_utilization, 'capacity_utilization')}`}>
                {formatPercentage(summary.capacity_utilization)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Resource efficiency</p>
            </div>
            <div className={`rounded-xl p-2 ring-1 ${getKPIIconColor('capacity_utilization')}`}>
              {getKPIIcon('capacity_utilization')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production Efficiency</p>
              <p className={`mt-2 text-2xl font-bold ${getKPIColor(summary.efficiency, 'efficiency')}`}>
                {formatPercentage(summary.efficiency)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Process effectiveness</p>
            </div>
            <div className={`rounded-xl p-2 ring-1 ${getKPIIconColor('efficiency')}`}>
              {getKPIIcon('efficiency')}
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Throughput</p>
              <p className={`mt-2 text-2xl font-bold ${getKPIColor(summary.throughput, 'throughput')}`}>
                {formatNumber(summary.throughput, 1)} units/day
              </p>
              <p className="mt-1 text-xs text-gray-500">Production output rate</p>
            </div>
            <div className={`rounded-xl p-2 ring-1 ${getKPIIconColor('throughput')}`}>
              {getKPIIcon('throughput')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Cycle Time</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.avg_cycle_time, 1)} days</p>
              <p className="mt-1 text-xs text-gray-500">Order completion time</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Value</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatINR(summary.total_value)}</p>
              <p className="mt-1 text-xs text-gray-500">Production output value</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Production Performance</h3>
            <p className="text-sm text-gray-600">Key metrics and performance trends</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg font-bold text-green-600">{formatNumber(summary.completed_orders)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="text-lg font-bold text-yellow-600">{formatNumber(summary.in_progress_orders)}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">On-Time Delivery</span>
              <span className={`text-sm font-bold ${getKPIColor(summary.on_time_rate, 'on_time_rate')}`}>
                {formatPercentage(summary.on_time_rate)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 bg-green-500 rounded-full"
                style={{ width: `${Math.min(100, summary.on_time_rate * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Capacity Utilization</span>
              <span className={`text-sm font-bold ${getKPIColor(summary.capacity_utilization, 'capacity_utilization')}`}>
                {formatPercentage(summary.capacity_utilization)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, summary.capacity_utilization * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Production Efficiency</span>
              <span className={`text-sm font-bold ${getKPIColor(summary.efficiency, 'efficiency')}`}>
                {formatPercentage(summary.efficiency)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 bg-purple-500 rounded-full"
                style={{ width: `${Math.min(100, summary.efficiency * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Throughput</span>
              <span className={`text-sm font-bold ${getKPIColor(summary.throughput, 'throughput')}`}>
                {formatNumber(summary.throughput, 1)} units/day
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 bg-orange-500 rounded-full"
                style={{ width: `${Math.min(100, (summary.throughput / 100) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {groupLabel} production performance
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} record{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Production performance analysis for the selected period. Monitor capacity utilization and efficiency trends.
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
                {groupBy === "work_center" ? (
                  <>
                    <th className="px-4 py-3 text-left">Work Center</th>
                    <th className="px-4 py-3 text-left">Plant</th>
                    <th className="px-4 py-3 text-left">Product Type</th>
                  </>
                ) : groupBy === "plant" ? (
                  <>
                    <th className="px-4 py-3 text-left">Plant</th>
                    <th className="px-4 py-3 text-left">Work Centers</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                  </>
                ) : groupBy === "product_type" ? (
                  <>
                    <th className="px-4 py-3 text-left">Product Type</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                    <th className="px-4 py-3 text-left">Efficiency</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                    <th className="px-4 py-3 text-left">Avg Cycle Time</th>
                  </>
                )}

                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Capacity</th>
                <th className="px-4 py-3 text-right">Efficiency</th>
                <th className="px-4 py-3 text-right">Throughput</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Performance</th>
                <th className="px-4 py-3 text-left">Cycle Time</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading production summary data…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    No production data found for the selected criteria.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const ordersCount = Number(r.orders_count || 0);
                  const capacityUtil = Number(r.capacity_utilization || 0);
                  const efficiency = Number(r.efficiency || 0);
                  const throughput = Number(r.throughput || 0);
                  const cycleTime = Number(r.avg_cycle_time || 0);

                  const workCenterHref = r?.work_center_id ? `/production/work-centers/${r.work_center_id}` : null;
                  const plantHref = r?.plant_id ? `/settings/plants/${r.plant_id}` : null;

                  return (
                    <tr key={`${groupBy}-${r.id}`} className="hover:bg-gray-50/70">
                      {groupBy === "work_center" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                WC
                              </Badge>
                              {workCenterHref ? (
                                <Link to={workCenterHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.work_center_name || `Work Center ${r.work_center_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.work_center_name || `Work Center ${r.work_center_id}`}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {plantHref ? (
                              <Link to={plantHref} className="font-medium text-blue-600 hover:underline">
                                {r.plant_name || `Plant ${r.plant_id}`}
                              </Link>
                            ) : (
                              <span>{r.plant_name || `Plant ${r.plant_id}`}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.product_type || "-"}</td>
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
                          <td className="px-4 py-3 text-sm text-gray-700">{r.work_centers_count || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                        </>
                      ) : groupBy === "product_type" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="font-medium">{r.product_type || "-"}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${getKPIColor(r.efficiency, 'efficiency')}`}>
                            {formatPercentage(r.efficiency)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getStatusBadge(r.status)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(r.avg_cycle_time, 1)} days</td>
                        </>
                      )}

                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatNumber(ordersCount)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getKPIColor(capacityUtil, 'capacity_utilization')}`}>
                        {formatPercentage(capacityUtil)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getKPIColor(efficiency, 'efficiency')}`}>
                        {formatPercentage(efficiency)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getKPIColor(throughput, 'throughput')}`}>
                        {formatNumber(throughput, 1)} units/day
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(r.status)}
                        <div className="mt-1 text-xs text-gray-500">{r.product_type || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {getPerformanceBadge(r.performance_trend)}
                        <div className="mt-1 text-xs text-gray-500">{r.work_centers_count ? `${r.work_centers_count} centers` : "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatNumber(cycleTime, 1)} days</span>
                          <span className="text-xs text-gray-500">{r.orders_count ? `${r.orders_count} orders` : "-"}</span>
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
            <p className="text-sm font-semibold text-gray-900">Production Performance Insights</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">Capacity Utilization:</span> Target 85-95% for optimal efficiency without overloading resources.</li>
              <li><span className="font-medium">On-Time Delivery:</span> Monitor work centers with low on-time rates for process improvements.</li>
              <li><span className="font-medium">Production Efficiency:</span> Identify bottlenecks and implement lean manufacturing practices.</li>
              <li><span className="font-medium">Throughput Optimization:</span> Balance workloads across work centers to maximize output.</li>
              <li><span className="font-medium">Cycle Time Reduction:</span> Streamline processes and reduce non-value-added activities.</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">KPI Targets:</span> On-time rate greater than 95%, Capacity utilization 85-95%, Efficiency greater than 90%.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Review Frequency:</span> Daily for operational metrics, weekly for strategic analysis.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Action Items:</span> Focus on improving efficiency and reducing cycle times for better throughput.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}