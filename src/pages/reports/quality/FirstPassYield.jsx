// src/pages/reports/quality/FirstPassYield.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Factory,
  Users,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Target,
  Gauge,
  Activity,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingChart,
  ShieldCheck,
  ShieldX,
  Zap,
  Thermometer,
  TrendingLine
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
 * First Pass Yield Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/quality/first-pass-yield
 *      params: from, to, query, plant_id, work_center_id, product_type, groupBy, page, size
 *      returns:
 *        {
 *          summary: { 
 *            total_units, passed_units, failed_units, first_pass_yield, 
 *            rework_units, scrap_units, yield_trend, target_yield, 
 *            top_issue_area, top_issue_count, avg_yield_by_shift 
 *          },
 *          yield_data: [
 *            {
 *              period,
 *              total_units,
 *              passed_units,
 *              failed_units,
 *              first_pass_yield,
 *              rework_rate,
 *              scrap_rate
 *            }
 *          ],
 *          trend_data: [
 *            { date, first_pass_yield, rework_rate, scrap_rate }
 *          ],
 *          breakdown_data: [
 *            {
 *              category,
 *              total_units,
 *              passed_units,
 *              failed_units,
 *              first_pass_yield,
 *              count
 *            }
 *          ],
 *          rows: [
 *            {
 *              id,
 *              lot_id,
 *              lot_no,
 *              product_type,
 *              work_center_id,
 *              work_center_name,
 *              plant_id,
 *              plant_name,
 *              shift,
 *              inspector_name,
 *              inspection_date,
 *              total_units,
 *              passed_units,
 *              failed_units,
 *              first_pass_yield,
 *              rework_units,
 *              scrap_units,
 *              yield_status // "Excellent", "Good", "Poor", "Critical"
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/quality/first-pass-yield/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function FirstPassYieldReport() {
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
  const [groupBy, setGroupBy] = useState("work_center");
  const [yieldStatus, setYieldStatus] = useState("all");

  // Lookups
  const [plants, setPlants] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    total_units: 0, 
    passed_units: 0, 
    failed_units: 0, 
    first_pass_yield: 0, 
    rework_units: 0, 
    scrap_units: 0, 
    yield_trend: "stable",
    target_yield: 0.95,
    top_issue_area: "",
    top_issue_count: 0,
    avg_yield_by_shift: {}
  });
  
  const [yieldData, setYieldData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);

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
      const res = await api.get("/reports/quality/first-pass-yield", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: productType !== "all" ? productType : undefined,
          yield_status: yieldStatus !== "all" ? yieldStatus : undefined,
          groupBy,
          page: pageIndex,
          size: pageSize,
        },
      });

      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      
      const sum = data?.summary || {};
      setSummary({
        total_units: Number(sum.total_units || 0),
        passed_units: Number(sum.passed_units || 0),
        failed_units: Number(sum.failed_units || 0),
        first_pass_yield: Number(sum.first_pass_yield || 0),
        rework_units: Number(sum.rework_units || 0),
        scrap_units: Number(sum.scrap_units || 0),
        yield_trend: sum.yield_trend || "stable",
        target_yield: Number(sum.target_yield || 0.95),
        top_issue_area: sum.top_issue_area || "",
        top_issue_count: Number(sum.top_issue_count || 0),
        avg_yield_by_shift: sum.avg_yield_by_shift || {}
      });

      setYieldData(Array.isArray(data.yield_data) ? data.yield_data : []);
      setTrendData(Array.isArray(data.trend_data) ? data.trend_data : []);
      setBreakdownData(Array.isArray(data.breakdown_data) ? data.breakdown_data : []);

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load first pass yield report",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ 
        total_units: 0, 
        passed_units: 0, 
        failed_units: 0, 
        first_pass_yield: 0, 
        rework_units: 0, 
        scrap_units: 0, 
        yield_trend: "stable",
        target_yield: 0.95,
        top_issue_area: "",
        top_issue_count: 0,
        avg_yield_by_shift: {}
      });
      setYieldData([]);
      setTrendData([]);
      setBreakdownData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    fetchData();
  }, [from, to, plantId, workCenterId, productType, yieldStatus, groupBy, pageIndex, pageSize]);

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
    setYieldStatus("all");
    setGroupBy("work_center");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/quality/first-pass-yield/export", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: productType !== "all" ? productType : undefined,
          yield_status: yieldStatus !== "all" ? yieldStatus : undefined,
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

      downloadBlob(res.data, `first_pass_yield_${from}_to_${to}.${ext}`);
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

  const getYieldStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "excellent":
        return <Badge variant="success" className="text-xs">Excellent</Badge>;
      case "good":
        return <Badge variant="secondary" className="text-xs">Good</Badge>;
      case "poor":
        return <Badge variant="warning" className="text-xs">Poor</Badge>;
      case "critical":
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getYieldColor = (yieldValue) => {
    const y = Number(yieldValue || 0);
    if (y >= 0.95) return "text-green-600 font-semibold";
    if (y >= 0.90) return "text-yellow-600 font-semibold";
    if (y >= 0.85) return "text-orange-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getTrendIcon = (direction) => {
    switch (direction?.toLowerCase()) {
      case "up":
      case "increasing":
        return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case "down":
      case "decreasing":
        return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingChart className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTrendColor = (direction) => {
    switch (direction?.toLowerCase()) {
      case "up":
      case "increasing":
        return "text-green-600 font-semibold";
      case "down":
      case "decreasing":
        return "text-red-600 font-semibold";
      default:
        return "text-yellow-600 font-semibold";
    }
  };

  const getReworkColor = (rate) => {
    const r = Number(rate || 0);
    if (r >= 0.10) return "text-red-600 font-semibold"; // 10%+
    if (r >= 0.05) return "text-orange-600 font-semibold"; // 5%+
    if (r >= 0.02) return "text-yellow-600 font-semibold"; // 2%+
    return "text-green-600 font-semibold";
  };

  const getScrapColor = (rate) => {
    const r = Number(rate || 0);
    if (r >= 0.05) return "text-red-600 font-semibold"; // 5%+
    if (r >= 0.02) return "text-orange-600 font-semibold"; // 2%+
    if (r >= 0.01) return "text-yellow-600 font-semibold"; // 1%+
    return "text-green-600 font-semibold";
  };

  const getYieldColors = (index) => {
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#dc2626"];
    return colors[index % colors.length];
  };

  const getWorkCenterIcon = (workCenter) => {
    const wc = workCenter?.toLowerCase() || "";
    if (wc.includes("solder")) return "🔥";
    if (wc.includes("assembly")) return "🔧";
    if (wc.includes("test")) return "🧪";
    if (wc.includes("inspection")) return "👁️";
    if (wc.includes("cleaning")) return "🧽";
    return "🏭";
  };

  const getTargetStatus = (currentYield, targetYield) => {
    const diff = currentYield - targetYield;
    if (diff >= 0.02) return { status: "exceeds", color: "text-green-600", icon: <ShieldCheck className="h-4 w-4 text-green-600" /> };
    if (diff >= 0) return { status: "meets", color: "text-yellow-600", icon: <ShieldCheck className="h-4 w-4 text-yellow-600" /> };
    return { status: "below", color: "text-red-600", icon: <ShieldX className="h-4 w-4 text-red-600" /> };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Quality</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">First Pass Yield Analysis</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor production quality by analyzing the percentage of units that pass quality inspection on the first attempt without rework.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button className="gap-2 bg-[#10b981] hover:bg-[#0ea579]" onClick={onExport} disabled={exporting}>
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
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#10b981]/20"
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
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#10b981]/20"
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
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#10b981]/20"
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
              <label className="text-xs font-semibold text-gray-600">Yield Status</label>
              <select
                value={yieldStatus}
                onChange={(e) => {
                  setYieldStatus(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#10b981]/20"
              >
                <option value="all">All Statuses</option>
                <option value="excellent">Excellent (≥95%)</option>
                <option value="good">Good (90-94%)</option>
                <option value="poor">Poor (85-89%)</option>
                <option value="critical">Critical (&lt;85%)</option>
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
                  placeholder="Lot number, inspector, work center, product type..."
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Units</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.total_units)}</p>
              <p className="mt-1 text-xs text-gray-500">All units inspected</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">First Pass Yield</p>
              <p className={`mt-2 text-2xl font-bold ${getYieldColor(summary.first_pass_yield)}`}>
                {formatPercentage(summary.first_pass_yield)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Units passing on first inspection</p>
            </div>
            <div className="rounded-xl bg-green-50 p-2 ring-1 ring-green-200 text-green-700">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rework Rate</p>
              <p className={`mt-2 text-2xl font-bold ${getReworkColor((summary.rework_units || 0) / (summary.total_units || 1))}`}>
                {formatPercentage((summary.rework_units || 0) / (summary.total_units || 1))}
              </p>
              <p className="mt-1 text-xs text-gray-500">Units requiring rework</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-2 ring-1 ring-orange-200 text-orange-700">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Scrap Rate</p>
              <p className={`mt-2 text-2xl font-bold ${getScrapColor((summary.scrap_units || 0) / (summary.total_units || 1))}`}>
                {formatPercentage((summary.scrap_units || 0) / (summary.total_units || 1))}
              </p>
              <p className="mt-1 text-xs text-gray-500">Units scrapped</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2 ring-1 ring-red-200 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Yield Performance Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Yield Performance Overview</h3>
            <p className="text-sm text-gray-600">Monitor first pass yield trends and compare against targets</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Target Yield</p>
            <p className="text-lg font-bold text-gray-900">{formatPercentage(summary.target_yield)}</p>
            <div className={`text-sm ${getTargetStatus(summary.first_pass_yield, summary.target_yield).color}`}>
              {getTargetStatus(summary.first_pass_yield, summary.target_yield).icon}
              <span className="ml-1">{getTargetStatus(summary.first_pass_yield, summary.target_yield).status}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Yield Distribution</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, first_pass_yield }) => `${category}: ${formatPercentage(first_pass_yield)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="passed_units"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getYieldColors(index)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} units`, 'Passed Units']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Yield vs Target Analysis</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Yield']} />
                  <Legend />
                  <Bar dataKey="first_pass_yield" fill="#10b981" name="First Pass Yield" />
                  <Bar dataKey="target_yield" fill="#f59e0b" name="Target Yield" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      {/* Trend Analysis */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Yield Trend Analysis</h3>
            <p className="text-sm text-gray-600">Monitor yield performance over time to identify trends and process improvements</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 text-sm font-semibold ${getTrendColor(summary.yield_trend)}`}>
              {getTrendIcon(summary.yield_trend)}
              {summary.yield_trend}
            </span>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip 
                formatter={(value, name) => [
                  `${(value * 100).toFixed(2)}%`, 
                  name === 'first_pass_yield' ? 'First Pass Yield' : 
                  name === 'rework_rate' ? 'Rework Rate' : 'Scrap Rate'
                ]} 
              />
              <Legend />
              <Line type="monotone" dataKey="first_pass_yield" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
              <Line type="monotone" dataKey="rework_rate" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
              <Line type="monotone" dataKey="scrap_rate" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detailed Analysis Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Detailed yield analysis
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} record{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Detailed breakdown of first pass yield for each lot and work center.
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
          <table className="min-w-[1600px] w-full">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Lot</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Work Center</th>
                <th className="px-4 py-3 text-left">Shift</th>
                <th className="px-4 py-3 text-right">Total Units</th>
                <th className="px-4 py-3 text-right">Passed</th>
                <th className="px-4 py-3 text-right">Failed</th>
                <th className="px-4 py-3 text-right">Yield</th>
                <th className="px-4 py-3 text-right">Rework</th>
                <th className="px-4 py-3 text-right">Scrap</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Inspector</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading yield data…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-sm text-gray-600">
                    No yield data found for the selected criteria.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const totalUnits = Number(r.total_units || 0);
                  const passedUnits = Number(r.passed_units || 0);
                  const failedUnits = Number(r.failed_units || 0);
                  const firstPassYield = Number(r.first_pass_yield || 0);
                  const reworkUnits = Number(r.rework_units || 0);
                  const scrapUnits = Number(r.scrap_units || 0);

                  const lotHref = r?.lot_id ? `/inventory/lots/${r.lot_id}` : null;
                  const workCenterHref = r?.work_center_id ? `/production/work-centers/${r.work_center_id}` : null;
                  const plantHref = r?.plant_id ? `/settings/plants/${r.plant_id}` : null;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex flex-col gap-1">
                          {lotHref ? (
                            <Link to={lotHref} className="font-medium text-[#10b981] hover:underline">
                              {r.lot_no || `Lot ${r.lot_id}`}
                            </Link>
                          ) : (
                            <span className="font-medium">{r.lot_no || `Lot ${r.lot_id}`}</span>
                          )}
                          <span className="text-xs text-gray-500">{r.plant_name || `Plant ${r.plant_id}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.product_type || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getWorkCenterIcon(r.work_center_name)}</span>
                          <span className="font-medium">{r.work_center_name || `Work Center ${r.work_center_id}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.shift || "-"}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatNumber(totalUnits)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">{formatNumber(passedUnits)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">{formatNumber(failedUnits)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getYieldColor(firstPassYield)}`}>
                        {formatPercentage(firstPassYield)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-orange-600">{formatNumber(reworkUnits)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">{formatNumber(scrapUnits)}</td>
                      <td className="px-4 py-3 text-sm">
                        {getYieldStatusBadge(r.yield_status)}
                        <div className="mt-1 text-xs text-gray-500">
                          Target: {formatPercentage(summary.target_yield)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.inspector_name || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateHuman(r.inspection_date)}</td>
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
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-[#10b981]/20"
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
            <TrendingLine className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">First Pass Yield Improvement Insights</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">Quality Focus:</span> Target work centers with yield below 90% for immediate process improvement.</li>
              <li><span className="font-medium">Rework Reduction:</span> Analyze root causes of rework to minimize additional processing costs.</li>
              <li><span className="font-medium">Scrap Minimization:</span> Focus on reducing scrap rate as it represents complete loss of material and labor.</li>
              <li><span className="font-medium">Trend Monitoring:</span> Track yield trends weekly to identify process drifts and implement corrective actions.</li>
              <li><span className="font-medium">Shift Analysis:</span> Compare yield performance across shifts to identify training or equipment issues.</li>
              <li><span className="font-medium">Target Achievement:</span> Maintain first pass yield above 95% for optimal production efficiency.</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Target:</span> Achieve 95%+ first pass yield consistently.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Review Frequency:</span> Daily monitoring, weekly analysis, monthly review.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Action Items:</span> Implement process improvements for low-yield areas and monitor effectiveness.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}