// src/pages/reports/production/WIPReport.jsx
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    Layers,
    Loader2,
    RefreshCcw,
    Search,
    SlidersHorizontal,
    Timer,
    Users,
    Workflow
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
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
 * Work in Progress (WIP) Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/production/wip
 *      params: as_of_date, query, plant_id, work_center_id, product_type, status, aging_bucket, groupBy, page, size
 *      returns:
 *        {
 *          summary: { 
 *            total_orders, total_value, avg_age_days, on_schedule, delayed, at_risk, 
 *            completed_this_period, started_this_period, aging_distribution 
 *          },
 *          rows: [
 *            {
 *              id,
 *              work_order_id,
 *              work_order_no,
 *              sales_order_id,
 *              sales_order_no,
 *              customer_name,
 *              product_type,
 *              current_stage,
 *              current_work_center,
 *              started_date,
 *              promised_date,
 *              estimated_completion,
 *              actual_completion,
 *              status, // "On Schedule", "Delayed", "At Risk", "Completed"
 *              age_days,
 *              completion_percentage,
 *              value,
 *              plant_id,
 *              plant_name,
 *              priority,
 *              items_count
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/production/wip/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function WIPReport() {
  const { toast } = useToast();

  // Date and filters
  const [asOfDate, setAsOfDate] = useState(() => toISODate(new Date()));
  const [query, setQuery] = useState("");
  const [plantId, setPlantId] = useState("");
  const [workCenterId, setWorkCenterId] = useState("");
  const [productType, setProductType] = useState("all");
  const [status, setStatus] = useState("all");
  const [agingBucket, setAgingBucket] = useState("all");
  const [groupBy, setGroupBy] = useState("order");

  // Lookups
  const [plants, setPlants] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    total_orders: 0, 
    total_value: 0, 
    avg_age_days: 0, 
    on_schedule: 0, 
    delayed: 0, 
    at_risk: 0, 
    completed_this_period: 0, 
    started_this_period: 0,
    aging_distribution: { "0-7": 0, "8-14": 0, "15-30": 0, "31-60": 0, "60+": 0 }
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
      const res = await api.get("/reports/production/wip", {
        params: {
          as_of_date: asOfDate,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: productType !== "all" ? productType : undefined,
          status: status !== "all" ? status : undefined,
          aging_bucket: agingBucket !== "all" ? agingBucket : undefined,
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
        total_value: Number(sum.total_value || 0),
        avg_age_days: Number(sum.avg_age_days || 0),
        on_schedule: Number(sum.on_schedule || 0),
        delayed: Number(sum.delayed || 0),
        at_risk: Number(sum.at_risk || 0),
        completed_this_period: Number(sum.completed_this_period || 0),
        started_this_period: Number(sum.started_this_period || 0),
        aging_distribution: {
          "0-7": Number(sum.aging_distribution?.["0-7"] || 0),
          "8-14": Number(sum.aging_distribution?.["8-14"] || 0),
          "15-30": Number(sum.aging_distribution?.["15-30"] || 0),
          "31-60": Number(sum.aging_distribution?.["31-60"] || 0),
          "60+": Number(sum.aging_distribution?.["60+"] || 0),
        }
      });

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load WIP report",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ 
        total_orders: 0, 
        total_value: 0, 
        avg_age_days: 0, 
        on_schedule: 0, 
        delayed: 0, 
        at_risk: 0, 
        completed_this_period: 0, 
        started_this_period: 0,
        aging_distribution: { "0-7": 0, "8-14": 0, "15-30": 0, "31-60": 0, "60+": 0 }
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
  }, [asOfDate, plantId, workCenterId, productType, status, agingBucket, groupBy, pageIndex, pageSize]);

  const onApply = () => {
    setPageIndex(0);
    fetchData();
  };

  const onReset = () => {
    setAsOfDate(toISODate(new Date()));
    setQuery("");
    setPlantId("");
    setWorkCenterId("");
    setProductType("all");
    setStatus("all");
    setAgingBucket("all");
    setGroupBy("order");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/production/wip/export", {
        params: {
          as_of_date: asOfDate,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          work_center_id: workCenterId || undefined,
          product_type: productType !== "all" ? productType : undefined,
          status: status !== "all" ? status : undefined,
          aging_bucket: agingBucket !== "all" ? agingBucket : undefined,
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

      downloadBlob(res.data, `wip_report_${asOfDate}.${ext}`);
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
      case "work_center":
        return "Work Center";
      case "plant":
        return "Plant";
      case "status":
        return "Status";
      case "stage":
        return "Stage";
      default:
        return "Order";
    }
  }, [groupBy]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "on_schedule":
        return <Badge variant="success" className="text-xs">On Schedule</Badge>;
      case "delayed":
        return <Badge variant="destructive" className="text-xs">Delayed</Badge>;
      case "at_risk":
        return <Badge variant="warning" className="text-xs">At Risk</Badge>;
      case "completed":
        return <Badge variant="secondary" className="text-xs">Completed</Badge>;
      case "started":
        return <Badge variant="outline" className="text-xs">Started</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getAgingColor = (bucket) => {
    switch (bucket) {
      case "0-7":
        return "text-green-600 font-semibold";
      case "8-14":
        return "text-yellow-600 font-semibold";
      case "15-30":
        return "text-orange-600 font-semibold";
      case "31-60":
        return "text-red-600 font-semibold";
      case "60+":
        return "text-red-700 font-bold";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case "medium":
        return <Badge variant="warning" className="text-xs">Medium</Badge>;
      case "low":
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">-</Badge>;
    }
  };

  const getCompletionColor = (percentage) => {
    const p = Number(percentage || 0);
    if (p >= 100) return "text-green-600 font-semibold";
    if (p >= 75) return "text-yellow-600 font-semibold";
    if (p >= 50) return "text-orange-600 font-semibold";
    return "text-red-600 font-bold";
  };

  const getAgingPercentage = (bucketValue) => {
    const total = summary.total_orders;
    if (total <= 0) return "0%";
    return ((bucketValue / total) * 100).toFixed(1) + "%";
  };

  const getAgingBarWidth = (bucketValue) => {
    const total = summary.total_orders;
    if (total <= 0) return "0%";
    return Math.min(100, (bucketValue / total) * 100) + "%";
  };

  const getWIPHealth = () => {
    const total = summary.total_orders;
    const delayed = summary.delayed;
    const atRisk = summary.at_risk;
    
    if (total <= 0) return { status: "Good", color: "text-green-600", icon: CheckCircle };
    
    const riskPercentage = (delayed + atRisk) / total;
    
    if (riskPercentage <= 0.1) return { status: "Good", color: "text-green-600", icon: CheckCircle };
    if (riskPercentage <= 0.25) return { status: "Warning", color: "text-yellow-600", icon: AlertTriangle };
    return { status: "Critical", color: "text-red-600", icon: AlertTriangle };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Production</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Work in Progress (WIP) Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor active production orders, track progress, and identify potential bottlenecks in the manufacturing process.
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
                <option value="on_schedule">On Schedule</option>
                <option value="delayed">Delayed</option>
                <option value="at_risk">At Risk</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Aging Bucket</label>
              <select
                value={agingBucket}
                onChange={(e) => {
                  setAgingBucket(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All Ages</option>
                <option value="0-7">0-7 days</option>
                <option value="8-14">8-14 days</option>
                <option value="15-30">15-30 days</option>
                <option value="31-60">31-60 days</option>
                <option value="60+">60+ days</option>
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
                  placeholder="Work order, sales order, customer, product..."
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
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total WIP Orders</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.total_orders)}</p>
              <p className="mt-1 text-xs text-gray-500">As of {formatDateHuman(asOfDate)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">WIP Value</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatINR(summary.total_value)}</p>
              <p className="mt-1 text-xs text-gray-500">Total work in progress value</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Age</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.avg_age_days, 1)} days</p>
              <p className="mt-1 text-xs text-gray-500">Average WIP age</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Timer className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">WIP Health</p>
              <p className={`mt-2 text-2xl font-bold ${getWIPHealth().color}`}>
                {getWIPHealth().status}
              </p>
              <p className="mt-1 text-xs text-gray-500">Overall WIP status</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              {React.createElement(getWIPHealth().icon, { className: "h-5 w-5" })}
            </div>
          </div>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">On Schedule</p>
              <p className="mt-2 text-2xl font-bold text-green-600">{formatNumber(summary.on_schedule)}</p>
              <p className="mt-1 text-xs text-gray-500">{formatPercentage(summary.on_schedule / summary.total_orders)} of total</p>
            </div>
            <div className="rounded-xl bg-green-50 p-2 ring-1 ring-green-200 text-green-700">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">At Risk</p>
              <p className="mt-2 text-2xl font-bold text-yellow-600">{formatNumber(summary.at_risk)}</p>
              <p className="mt-1 text-xs text-gray-500">{formatPercentage(summary.at_risk / summary.total_orders)} of total</p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-2 ring-1 ring-yellow-200 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Delayed</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{formatNumber(summary.delayed)}</p>
              <p className="mt-1 text-xs text-gray-500">{formatPercentage(summary.delayed / summary.total_orders)} of total</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2 ring-1 ring-red-200 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Aging Distribution */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">WIP Aging Distribution</h3>
            <p className="text-sm text-gray-600">Age distribution of work in progress orders</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(summary.total_orders)}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {Object.entries(summary.aging_distribution).map(([bucket, count]) => (
            <div key={bucket} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold ${getAgingColor(bucket)}`}>
                  {bucket === "0-7" && "0-7 days (Fresh)"}
                  {bucket === "8-14" && "8-14 days (Aging)"}
                  {bucket === "15-30" && "15-30 days (Old)"}
                  {bucket === "31-60" && "31-60 days (Very Old)"}
                  {bucket === "60+" && "60+ days (Critical)"}
                </span>
                <span className="font-medium text-gray-900">{formatNumber(count)}</span>
                <span className="text-xs text-gray-500">{getAgingPercentage(count)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${bucket === "0-7" ? "bg-green-500" : bucket === "8-14" ? "bg-yellow-500" : bucket === "15-30" ? "bg-orange-500" : bucket === "31-60" ? "bg-red-500" : "bg-red-700"}`}
                  style={{ width: getAgingBarWidth(count) }}
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
              {groupLabel} WIP analysis
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} order{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Work in progress orders as of {formatDateHuman(asOfDate)}. Monitor aging and status for optimal throughput.
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
          <table className="min-w-[1400px] w-full">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {groupBy === "order" ? (
                  <>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Product</th>
                  </>
                ) : groupBy === "work_center" ? (
                  <>
                    <th className="px-4 py-3 text-left">Work Center</th>
                    <th className="px-4 py-3 text-left">Plant</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                  </>
                ) : groupBy === "plant" ? (
                  <>
                    <th className="px-4 py-3 text-left">Plant</th>
                    <th className="px-4 py-3 text-left">Work Centers</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                  </>
                ) : groupBy === "status" ? (
                  <>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                    <th className="px-4 py-3 text-left">Avg Age</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left">Stage</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                    <th className="px-4 py-3 text-left">Avg Completion</th>
                  </>
                )}

                <th className="px-4 py-3 text-right">Age</th>
                <th className="px-4 py-3 text-right">Completion</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Current Stage</th>
                <th className="px-4 py-3 text-left">Priority</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading WIP data…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    No WIP data found for the selected criteria.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const ageDays = Number(r.age_days || 0);
                  const completion = Number(r.completion_percentage || 0);
                  const value = Number(r.value || 0);

                  const workOrderHref = r?.work_order_id ? `/production/work-orders/${r.work_order_id}` : null;
                  const salesOrderHref = r?.sales_order_id ? `/sales/orders/${r.sales_order_id}` : null;
                  const workCenterHref = r?.current_work_center_id ? `/production/work-centers/${r.current_work_center_id}` : null;
                  const plantHref = r?.plant_id ? `/settings/plants/${r.plant_id}` : null;

                  return (
                    <tr key={`${groupBy}-${r.id}`} className="hover:bg-gray-50/70">
                      {groupBy === "order" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex flex-col gap-1">
                              {workOrderHref ? (
                                <Link to={workOrderHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.work_order_no || `WO-${r.work_order_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.work_order_no || `WO-${r.work_order_id}`}</span>
                              )}
                              {salesOrderHref ? (
                                <Link to={salesOrderHref} className="text-xs text-blue-600 hover:underline">
                                  {r.sales_order_no || `SO-${r.sales_order_id}`}
                                </Link>
                              ) : (
                                <span className="text-xs text-gray-500">{r.sales_order_no || `SO-${r.sales_order_id}`}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.customer_name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.product_type || "-"}</td>
                        </>
                      ) : groupBy === "work_center" ? (
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
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
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
                      ) : groupBy === "status" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getStatusBadge(r.status)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(r.avg_age_days, 1)} days</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="font-medium">{r.current_stage || "-"}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${getCompletionColor(r.avg_completion)}`}>
                            {formatPercentage(r.avg_completion / 100)}
                          </td>
                        </>
                      )}

                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getAgingColor(ageDays <= 7 ? "0-7" : ageDays <= 14 ? "8-14" : ageDays <= 30 ? "15-30" : ageDays <= 60 ? "31-60" : "60+")}`}>
                        {formatNumber(ageDays)} days
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${getCompletionColor(completion)}`}>
                        {formatPercentage(completion / 100)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatINR(value)}</td>

                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(r.status)}
                        <div className="mt-1 text-xs text-gray-500">{r.product_type || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{r.current_stage || "-"}</span>
                          <span className="text-xs text-gray-500">{r.current_work_center || "-"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {getPriorityBadge(r.priority)}
                        <div className="mt-1 text-xs text-gray-500">{r.items_count ? `${r.items_count} items` : "-"}</div>
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
            <Workflow className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">WIP Management Insights</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">WIP Aging:</span> Focus on orders in 31+ day buckets for immediate attention and bottleneck identification.</li>
              <li><span className="font-medium">Status Monitoring:</span> Track "At Risk" and "Delayed" orders daily to prevent further delays.</li>
              <li><span className="font-medium">Capacity Planning:</span> Use WIP levels to optimize work center loading and prevent overproduction.</li>
              <li><span className="font-medium">Flow Optimization:</span> Analyze stage transitions to identify and eliminate process bottlenecks.</li>
              <li><span className="font-medium">Priority Management:</span> Ensure high-priority orders receive appropriate attention and resources.</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Target:</span> Keep WIP aging under 15 days for optimal throughput.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Review Frequency:</span> Daily for critical orders, weekly for overall WIP health.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Action Items:</span> Reduce delayed orders and optimize work center utilization.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}