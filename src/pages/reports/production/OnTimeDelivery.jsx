// src/pages/reports/production/OnTimeDelivery.jsx
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle,
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
    TrendingDown,
    TrendingUp,
    Users
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
 * On-Time Delivery Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/production/on-time-delivery
 *      params: from, to, query, plant_id, customer_id, sales_order_id, status, groupBy, page, size
 *      returns:
 *        {
 *          summary: { total_orders, on_time_orders, delayed_orders, on_time_rate, avg_delay_days, total_value },
 *          rows: [
 *            {
 *              id,
 *              sales_order_id,
 *              sales_order_no,
 *              customer_id,
 *              customer_name,
 *              order_date,
 *              promised_date,
 *              actual_delivery_date,
 *              delivery_status, // "On Time", "Delayed", "Early"
 *              delay_days,
 *              order_value,
 *              plant_id,
 *              plant_name,
 *              priority, // "High", "Medium", "Low"
 *              product_category,
 *              items_count,
 *              status // "Delivered", "In Transit", "Pending"
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/production/on-time-delivery/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function OnTimeDeliveryReport() {
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
  const [customerId, setCustomerId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [status, setStatus] = useState("all");
  const [groupBy, setGroupBy] = useState("order");

  // Lookups
  const [plants, setPlants] = useState([]);
  const [customers, setCustomers] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ 
    total_orders: 0, 
    on_time_orders: 0, 
    delayed_orders: 0, 
    on_time_rate: 0, 
    avg_delay_days: 0, 
    total_value: 0 
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const loadLookups = async () => {
    try {
      const [pRes, cRes] = await Promise.allSettled([
        api.get("/settings/plants"),
        api.get("/sales/customers"),
      ]);

      if (pRes.status === "fulfilled") {
        const p = pRes.value?.data?.data || pRes.value?.data || [];
        setPlants(Array.isArray(p) ? p : []);
      }
      if (cRes.status === "fulfilled") {
        const c = cRes.value?.data?.data || cRes.value?.data || [];
        setCustomers(Array.isArray(c) ? c : []);
      }
    } catch {
      // ignore
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/production/on-time-delivery", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          customer_id: customerId || undefined,
          sales_order_id: salesOrderId || undefined,
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
        on_time_orders: Number(sum.on_time_orders || 0),
        delayed_orders: Number(sum.delayed_orders || 0),
        on_time_rate: Number(sum.on_time_rate || 0),
        avg_delay_days: Number(sum.avg_delay_days || 0),
        total_value: Number(sum.total_value || 0),
      });

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load on-time delivery report",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ 
        total_orders: 0, 
        on_time_orders: 0, 
        delayed_orders: 0, 
        on_time_rate: 0, 
        avg_delay_days: 0, 
        total_value: 0 
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
  }, [from, to, plantId, customerId, salesOrderId, status, groupBy, pageIndex, pageSize]);

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
    setCustomerId("");
    setSalesOrderId("");
    setStatus("all");
    setGroupBy("order");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/production/on-time-delivery/export", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          customer_id: customerId || undefined,
          sales_order_id: salesOrderId || undefined,
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

      downloadBlob(res.data, `on_time_delivery_${from}_to_${to}.${ext}`);
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
      case "customer":
        return "Customer";
      case "plant":
        return "Plant";
      case "status":
        return "Delivery Status";
      default:
        return "Order";
    }
  }, [groupBy]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "on time":
        return <Badge variant="success" className="text-xs">On Time</Badge>;
      case "delayed":
        return <Badge variant="destructive" className="text-xs">Delayed</Badge>;
      case "early":
        return <Badge variant="secondary" className="text-xs">Early</Badge>;
      case "in transit":
        return <Badge variant="outline" className="text-xs">In Transit</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
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

  const getOnTimeColor = (rate) => {
    const r = Number(rate || 0);
    if (r >= 0.95) return "text-green-600 font-semibold";
    if (r >= 0.85) return "text-yellow-600 font-semibold";
    if (r >= 0.70) return "text-orange-600 font-semibold";
    return "text-red-600 font-bold";
  };

  const getDelayColor = (days) => {
    const d = Number(days || 0);
    if (d <= 0) return "text-green-600 font-semibold";
    if (d <= 3) return "text-yellow-600 font-semibold";
    if (d <= 7) return "text-orange-600 font-semibold";
    return "text-red-600 font-bold";
  };

  const getOnTimeTrend = () => {
    // This would typically come from backend, but we can calculate a simple trend
    const rate = summary.on_time_rate;
    if (rate >= 0.95) return { icon: TrendingUp, color: "text-green-600", text: "Excellent" };
    if (rate >= 0.85) return { icon: TrendingUp, color: "text-yellow-600", text: "Good" };
    if (rate >= 0.70) return { icon: TrendingDown, color: "text-orange-600", text: "Needs Improvement" };
    return { icon: TrendingDown, color: "text-red-600", text: "Critical" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Production</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">On-Time Delivery Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track delivery performance and identify areas for improvement in order fulfillment.
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
              <label className="text-xs font-semibold text-gray-600">Customer</label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name || c.company_name || `Customer ${c.id || c._id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Sales Order</label>
              <Input
                placeholder="SO-XXXXX"
                value={salesOrderId}
                onChange={(e) => {
                  setSalesOrderId(e.target.value);
                  setPageIndex(0);
                }}
              />
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
                <option value="delivered">Delivered</option>
                <option value="in_transit">In Transit</option>
                <option value="pending">Pending</option>
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
                  placeholder="Customer name, order number, product category..."
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.total_orders)}</p>
              <p className="mt-1 text-xs text-gray-500">Orders in period</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">On-Time Orders</p>
              <p className="mt-2 text-2xl font-bold text-green-600">{formatNumber(summary.on_time_orders)}</p>
              <p className="mt-1 text-xs text-gray-500">Delivered on time</p>
            </div>
            <div className="rounded-xl bg-green-50 p-2 ring-1 ring-green-200 text-green-700">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Delayed Orders</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{formatNumber(summary.delayed_orders)}</p>
              <p className="mt-1 text-xs text-gray-500">Orders past due</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2 ring-1 ring-red-200 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">On-Time Rate</p>
              <p className={`mt-2 text-2xl font-bold ${getOnTimeColor(summary.on_time_rate)}`}>
                {formatPercentage(summary.on_time_rate)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Performance metric</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Delay</p>
              <p className={`mt-2 text-2xl font-bold ${getDelayColor(summary.avg_delay_days)}`}>
                {formatNumber(summary.avg_delay_days, 1)} days
              </p>
              <p className="mt-1 text-xs text-gray-500">For delayed orders</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-2 ring-1 ring-orange-200 text-orange-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Value</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatINR(summary.total_value)}</p>
              <p className="mt-1 text-xs text-gray-500">At risk value</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Delivery Performance</h3>
            <p className="text-sm text-gray-600">Overall on-time delivery performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 ${getOnTimeTrend().color}`}>
              {React.createElement(getOnTimeTrend().icon, { className: "h-5 w-5" })}
              <span className="font-semibold">{getOnTimeTrend().text}</span>
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">On-Time</span>
              <span className="text-sm font-bold text-green-600">{formatPercentage(summary.on_time_rate)}</span>
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
              <span className="text-sm font-medium text-gray-700">Delayed</span>
              <span className="text-sm font-bold text-red-600">{formatPercentage(1 - summary.on_time_rate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 bg-red-500 rounded-full"
                style={{ width: `${Math.min(100, (1 - summary.on_time_rate) * 100)}%` }}
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
              {groupLabel} delivery performance
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} order{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Delivery status analysis for the selected period. Focus on delayed orders for improvement opportunities.
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
                ) : groupBy === "customer" ? (
                  <>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                    <th className="px-4 py-3 text-left">On-Time Rate</th>
                  </>
                ) : groupBy === "plant" ? (
                  <>
                    <th className="px-4 py-3 text-left">Plant</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                    <th className="px-4 py-3 text-left">On-Time Rate</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Orders</th>
                    <th className="px-4 py-3 text-left">Avg Delay</th>
                  </>
                )}

                <th className="px-4 py-3 text-right">Order Value</th>
                <th className="px-4 py-3 text-right">Promised Date</th>
                <th className="px-4 py-3 text-right">Actual Delivery</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Delay</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading delivery performance data…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    No delivery data found for the selected criteria.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const orderValue = Number(r.order_value || 0);
                  const delayDays = Number(r.delay_days || 0);
                  const onTimeRate = Number(r.on_time_rate || 0);

                  const orderHref = r?.sales_order_id ? `/sales/orders/${r.sales_order_id}` : null;
                  const customerHref = r?.customer_id ? `/sales/customers/${r.customer_id}` : null;
                  const plantHref = r?.plant_id ? `/settings/plants/${r.plant_id}` : null;

                  return (
                    <tr key={`${groupBy}-${r.id}`} className="hover:bg-gray-50/70">
                      {groupBy === "order" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                ORDER
                              </Badge>
                              {orderHref ? (
                                <Link to={orderHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.sales_order_no || `SO-${r.sales_order_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.sales_order_no || `SO-${r.sales_order_id}`}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {customerHref ? (
                              <Link to={customerHref} className="font-medium text-blue-600 hover:underline">
                                {r.customer_name || `Customer ${r.customer_id}`}
                              </Link>
                            ) : (
                              <span>{r.customer_name || `Customer ${r.customer_id}`}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.product_category || "-"}</td>
                        </>
                      ) : groupBy === "customer" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                CUSTOMER
                              </Badge>
                              {customerHref ? (
                                <Link to={customerHref} className="font-medium text-blue-600 hover:underline">
                                  {r.customer_name || `Customer ${r.customer_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.customer_name || `Customer ${r.customer_id}`}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${getOnTimeColor(onTimeRate)}`}>
                            {formatPercentage(onTimeRate)}
                          </td>
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
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${getOnTimeColor(onTimeRate)}`}>
                            {formatPercentage(onTimeRate)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getStatusBadge(r.delivery_status)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.orders_count || "-"}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${getDelayColor(r.avg_delay_days)}`}>
                            {formatNumber(r.avg_delay_days, 1)} days
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatINR(orderValue)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateHuman(r.promised_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateHuman(r.actual_delivery_date)}</td>

                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(r.delivery_status)}
                        <div className="mt-1 text-xs text-gray-500">{r.status || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {getPriorityBadge(r.priority)}
                        <div className="mt-1 text-xs text-gray-500">{r.items_count ? `${r.items_count} items` : "-"}</div>
                      </td>

                      <td className={`px-4 py-3 text-sm font-semibold ${getDelayColor(delayDays)}`}>
                        {delayDays > 0 ? `${formatNumber(delayDays)} days late` : delayDays < 0 ? `${Math.abs(delayDays)} days early` : "On time"}
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
            <p className="text-sm font-semibold text-gray-900">Delivery Performance Insights</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">On-Time Rate Target:</span> Aim for 95%+ on-time delivery for customer satisfaction.</li>
              <li><span className="font-medium">High Priority Orders:</span> Monitor and expedite high-priority orders to prevent delays.</li>
              <li><span className="font-medium">Customer Analysis:</span> Identify customers with frequent delays for targeted improvement.</li>
              <li><span className="font-medium">Plant Performance:</span> Compare plant performance to identify best practices and areas needing support.</li>
              <li><span className="font-medium">Root Cause Analysis:</span> Investigate reasons for delays (material shortage, capacity, quality issues).</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="text-xs text-gray-500">
                <span className="font-semibold">KPI:</span> On-time delivery rate above 95% consistently.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Review Frequency:</span> Weekly for operational review, monthly for strategic analysis.
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Action Items:</span> Reduce average delay days and improve forecasting accuracy.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}