// src/pages/reports/quality/DefectPareto.jsx
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    Gauge,
    Loader2,
    RefreshCcw,
    Search,
    SlidersHorizontal,
    TrendingChart,
    TrendingDown as TrendingDownIcon,
    TrendingUp as TrendingUpIcon,
    Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
 * Defect Pareto Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/quality/defect-pareto
 *      params: from, to, query, plant_id, work_center_id, product_type, defect_type, groupBy, page, size
 *      returns:
 *        {
 *          summary: { 
 *            total_defects, total_rework_cost, total_scrap_cost, total_cost, 
 *            top_defect_type, top_defect_count, avg_defect_rate, trend_direction 
 *          },
 *          pareto_data: [
 *            {
 *              defect_type,
 *              defect_count,
 *              percentage,
 *              cumulative_percentage,
 *              cost_impact
 *            }
 *          ],
 *          trend_data: [
 *            { date, defect_count, defect_rate }
 *          ],
 *          rows: [
 *            {
 *              id,
 *              lot_id,
 *              lot_no,
 *              product_type,
 *              defect_type,
 *              defect_count,
 *              inspection_date,
 *              inspector_name,
 *              work_center_id,
 *              work_center_name,
 *              plant_id,
 *              plant_name,
 *              severity, // "Critical", "Major", "Minor"
 *              status, // "Open", "In Progress", "Closed"
 *              rework_cost,
 *              scrap_cost,
 *              total_cost
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/quality/defect-pareto/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function DefectParetoReport() {
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
  const [defectType, setDefectType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [groupBy, setGroupBy] = useState("defect_type");

  // Lookups
  const [plants, setPlants] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    total_defects: 0, 
    total_rework_cost: 0, 
    total_scrap_cost: 0, 
    total_cost: 0, 
    top_defect_type: "", 
    top_defect_count: 0, 
    avg_defect_rate: 0, 
    trend_direction: "stable" 
  });
  
  const [paretoData, setParetoData] = useState([]);
  const [trendData, setTrendData] = useState([]);

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
      const res = await api.get("/reports/quality/defect-pareto", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: productType !== "all" ? productType : undefined,
          defect_type: defectType !== "all" ? defectType : undefined,
          severity: severity !== "all" ? severity : undefined,
          groupBy,
          page: pageIndex,
          size: pageSize,
        },
      });

      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      
      const sum = data?.summary || {};
      setSummary({
        total_defects: Number(sum.total_defects || 0),
        total_rework_cost: Number(sum.total_rework_cost || 0),
        total_scrap_cost: Number(sum.total_scrap_cost || 0),
        total_cost: Number(sum.total_cost || 0),
        top_defect_type: sum.top_defect_type || "",
        top_defect_count: Number(sum.top_defect_count || 0),
        avg_defect_rate: Number(sum.avg_defect_rate || 0),
        trend_direction: sum.trend_direction || "stable",
      });

      setParetoData(Array.isArray(data.pareto_data) ? data.pareto_data : []);
      setTrendData(Array.isArray(data.trend_data) ? data.trend_data : []);

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load defect pareto report",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ 
        total_defects: 0, 
        total_rework_cost: 0, 
        total_scrap_cost: 0, 
        total_cost: 0, 
        top_defect_type: "", 
        top_defect_count: 0, 
        avg_defect_rate: 0, 
        trend_direction: "stable" 
      });
      setParetoData([]);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    fetchData();
  }, [from, to, plantId, workCenterId, productType, defectType, severity, groupBy, pageIndex, pageSize]);

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
    setDefectType("all");
    setSeverity("all");
    setGroupBy("defect_type");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/quality/defect-pareto/export", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: productType !== "all" ? productType : undefined,
          defect_type: defectType !== "all" ? defectType : undefined,
          severity: severity !== "all" ? severity : undefined,
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

      downloadBlob(res.data, `defect_pareto_${from}_to_${to}.${ext}`);
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

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case "major":
        return <Badge variant="warning" className="text-xs">Major</Badge>;
      case "minor":
        return <Badge variant="secondary" className="text-xs">Minor</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return <Badge variant="destructive" className="text-xs">Open</Badge>;
      case "in_progress":
        return <Badge variant="warning" className="text-xs">In Progress</Badge>;
      case "closed":
        return <Badge variant="success" className="text-xs">Closed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction?.toLowerCase()) {
      case "up":
      case "increasing":
        return <TrendingUpIcon className="h-4 w-4 text-red-600" />;
      case "down":
      case "decreasing":
        return <TrendingDownIcon className="h-4 w-4 text-green-600" />;
      default:
        return <TrendingChart className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTrendColor = (direction) => {
    switch (direction?.toLowerCase()) {
      case "up":
      case "increasing":
        return "text-red-600 font-semibold";
      case "down":
      case "decreasing":
        return "text-green-600 font-semibold";
      default:
        return "text-yellow-600 font-semibold";
    }
  };

  const getCostColor = (cost) => {
    const c = Number(cost || 0);
    if (c >= 10000) return "text-red-600 font-bold";
    if (c >= 5000) return "text-orange-600 font-semibold";
    if (c >= 1000) return "text-yellow-600 font-semibold";
    return "text-gray-600";
  };

  const getDefectRateColor = (rate) => {
    const r = Number(rate || 0);
    if (r >= 0.05) return "text-red-600 font-semibold"; // 5%+
    if (r >= 0.02) return "text-orange-600 font-semibold"; // 2%+
    if (r >= 0.01) return "text-yellow-600 font-semibold"; // 1%+
    return "text-green-600 font-semibold";
  };

  const getParetoColors = (index) => {
    const colors = ["#dc2551", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"];
    return colors[index % colors.length];
  };

  const getDefectTypeIcon = (defectType) => {
    const type = defectType?.toLowerCase() || "";
    if (type.includes("short") || type.includes("bridge")) return "⚡";
    if (type.includes("open") || type.includes("break")) return "❌";
    if (type.includes("solder")) return "🔥";
    if (type.includes("component")) return "🔧";
    if (type.includes("alignment")) return "📏";
    if (type.includes("contamination")) return "☣️";
    return "⚠️";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Quality</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Defect Pareto Analysis</h1>
          <p className="mt-1 text-sm text-gray-600">
            Identify the most significant quality issues using Pareto principle (80/20 rule) to prioritize improvement efforts.
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
              <label className="text-xs font-semibold text-gray-600">Severity</label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
            </div>

            <div className="space-y-1.5 lg:col-span-7">
              <label className="text-xs font-semibold text-gray-600">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => (e.key === "Enter" ? onApply() : null)}
                  placeholder="Defect type, lot number, inspector, work center..."
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
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Defects</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.total_defects)}</p>
              <p className="mt-1 text-xs text-gray-500">All defects in period</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Cost</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{formatINR(summary.total_cost)}</p>
              <p className="mt-1 text-xs text-gray-500">Rework + scrap cost</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2 ring-1 ring-red-200 text-red-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Defect Rate</p>
              <p className={`mt-2 text-2xl font-bold ${getDefectRateColor(summary.avg_defect_rate)}`}>
                {formatPercentage(summary.avg_defect_rate)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Average defect percentage</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Gauge className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trend</p>
              <p className={`mt-2 text-2xl font-bold ${getTrendColor(summary.trend_direction)}`}>
                {summary.trend_direction}
              </p>
              <p className="mt-1 text-xs text-gray-500">Defect trend direction</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              {getTrendIcon(summary.trend_direction)}
            </div>
          </div>
        </Card>
      </div>

      {/* Pareto Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pareto Analysis (80/20 Rule)</h3>
            <p className="text-sm text-gray-600">Identify the vital few defect types causing most quality issues</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Top Defect</p>
            <p className="text-lg font-bold text-gray-900">{summary.top_defect_type || "-"}</p>
            <p className="text-sm text-gray-600">{formatNumber(summary.top_defect_count)} occurrences</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Defect Distribution</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={paretoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ defect_type, percentage }) => `${defect_type}: ${formatPercentage(percentage)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="defect_count"
                  >
                    {paretoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getParetoColors(index)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} defects`, 'Count']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Pareto Chart (Count & Cumulative %)</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="defect_type" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="defect_count" fill="#dc2551" name="Defect Count" />
                  <Line yAxisId="right" type="monotone" dataKey="cumulative_percentage" stroke="#3b82f6" name="Cumulative %" />
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
            <h3 className="text-lg font-semibold text-gray-900">Defect Trend Analysis</h3>
            <p className="text-sm text-gray-600">Monitor defect patterns over time to identify trends and seasonal variations</p>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value, name) => name === 'defect_count' ? [`${value} defects`, name] : [`${(value * 100).toFixed(2)}%`, name]} />
              <Legend />
              <Line type="monotone" dataKey="defect_count" stroke="#dc2551" strokeWidth={2} />
              <Line type="monotone" dataKey="defect_rate" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detailed Analysis Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Detailed defect analysis
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} record{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Detailed breakdown of defects for root cause analysis and corrective actions.
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
          <table className="min-w-[1500px] w-full">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Lot</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Defect Type</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-right">Count</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-left">Inspector</th>
                <th className="px-4 py-3 text-left">Work Center</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading defect data…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    No defect data found for the selected criteria.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const defectCount = Number(r.defect_count || 0);
                  const totalCost = Number(r.total_cost || 0);
                  const reworkCost = Number(r.rework_cost || 0);
                  const scrapCost = Number(r.scrap_cost || 0);

                  const lotHref = r?.lot_id ? `/inventory/lots/${r.lot_id}` : null;
                  const workCenterHref = r?.work_center_id ? `/production/work-centers/${r.work_center_id}` : null;
                  const plantHref = r?.plant_id ? `/settings/plants/${r.plant_id}` : null;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex flex-col gap-1">
                          {lotHref ? (
                            <Link to={lotHref} className="font-medium text-[#dc2551] hover:underline">
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
                          <span className="text-lg">{getDefectTypeIcon(r.defect_type)}</span>
                          <span className="font-medium">{r.defect_type || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getSeverityBadge(r.severity)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatNumber(defectCount)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getCostColor(totalCost)}`}>
                        {formatINR(totalCost)}
                        <div className="mt-1 text-xs text-gray-500">
                          Rework: {formatINR(reworkCost)} | Scrap: {formatINR(scrapCost)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.inspector_name || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {workCenterHref ? (
                          <Link to={workCenterHref} className="font-medium text-blue-600 hover:underline">
                            {r.work_center_name || `Work Center ${r.work_center_id}`}
                          </Link>
                        ) : (
                          <span>{r.work_center_name || `Work Center ${r.work_center_id}`}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(r.status)}
                        <div className="mt-1 text-xs text-gray-500">{r.product_type || "-"}</div>
                      </td>
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
            <p className="text-sm font-semibold text-gray-900">Quality Improvement Insights</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">Pareto Principle:</span> Focus on top 20% of defect types causing 80% of quality issues for maximum impact.</li>
              <li><span className="font-medium">Cost Analysis:</span> Prioritize defects with highest cost impact (rework + scrap) for immediate attention.</li>
              <li><span className="font-medium">Trend Monitoring:</span> Track defect trends over time to identify process improvements or emerging issues.</li>
              <li><span className="font-medium">Root Cause Analysis:</span> Investigate critical and major defects to identify underlying process problems.</li>
              <li><span className="font-medium">Work Center Focus:</span> Target high-defect work centers for process optimization and training.</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Target:</span> Reduce total defects by 50% in top 3 defect categories.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Review Frequency:</span> Weekly for Pareto analysis, daily for critical defects.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Action Items:</span> Implement corrective actions for top defect causes and monitor effectiveness.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}