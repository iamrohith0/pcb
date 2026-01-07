// src/pages/reports/finance/Profitability.jsx
import {
    ArrowDownToLine,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    Loader2,
    RefreshCcw,
    Search,
    TrendingUp,
    XCircle,
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

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function computeMargin(revenue, cost) {
  const r = safeNumber(revenue);
  const c = safeNumber(cost);
  const profit = r - c;
  const marginPct = r > 0 ? (profit / r) * 100 : 0;
  return { profit, marginPct };
}

function StatCard({ title, value, hint, icon: Icon, tone = "neutral" }) {
  const toneCls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "bad"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <div className={cx("rounded-xl p-2 ring-1", toneCls)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Profitability report for PCB manufacturing ERP
 *
 * Backend endpoints expected (adjust if your API differs):
 * - GET  /reports/finance/profitability?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=customer|product|order|work_order&query=
 *   Returns:
 *    {
 *      summary: { revenue, cogs, overhead, scrap, profit },
 *      rows: [
 *        {
 *          id, type, // e.g. "SO", "WO", "CUSTOMER", "PRODUCT"
 *          ref,      // e.g. "SO-000123"
 *          name,     // e.g. customer name / product name
 *          revenue,
 *          cogs,
 *          overhead,
 *          scrap,
 *          profit,
 *          margin_pct,
 *          currency  // optional
 *        }
 *      ],
 *      page: { index, size, total }
 *    }
 *
 * - GET /reports/finance/profitability/export?...  (optional) -> file download
 */
export default function Profitability() {
  const { toast } = useToast();

  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(today));
  const [groupBy, setGroupBy] = useState("order"); // order | work_order | customer | product
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    revenue: 0,
    cogs: 0,
    overhead: 0,
    scrap: 0,
    profit: 0,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const marginMeta = useMemo(() => {
    const revenue = safeNumber(summary.revenue);
    const cost = safeNumber(summary.cogs) + safeNumber(summary.overhead) + safeNumber(summary.scrap);
    return computeMargin(revenue, cost);
  }, [summary]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/finance/profitability", {
        params: {
          from,
          to,
          groupBy,
          query: query?.trim() || undefined,
          page: pageIndex,
          size: pageSize,
        },
      });

      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSummary({
        revenue: safeNumber(data?.summary?.revenue),
        cogs: safeNumber(data?.summary?.cogs),
        overhead: safeNumber(data?.summary?.overhead),
        scrap: safeNumber(data?.summary?.scrap),
        profit: safeNumber(data?.summary?.profit),
      });

      const p = data?.page || {};
      setTotal(safeNumber(p.total));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load profitability",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, groupBy, pageIndex, pageSize]);

  const onApplySearch = () => {
    setPageIndex(0);
    fetchData();
  };

  const onReset = () => {
    const d = new Date();
    const d2 = new Date();
    d.setDate(d.getDate() - 30);
    setFrom(toISODate(d));
    setTo(toISODate(d2));
    setGroupBy("order");
    setQuery("");
    setPageIndex(0);
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/finance/profitability/export", {
        params: {
          from,
          to,
          groupBy,
          query: query?.trim() || undefined,
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

      downloadBlob(res.data, `profitability_${from}_to_${to}.${ext}`);
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
      case "product":
        return "Product";
      case "work_order":
        return "Work Order";
      default:
        return "Sales Order";
    }
  }, [groupBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Finance</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Profitability</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analyze revenue, costs (COGS + overhead + scrap) and margins across orders, customers, products and work orders.
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Group by</label>
              <select
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="order">Sales Order</option>
                <option value="work_order">Work Order</option>
                <option value="customer">Customer</option>
                <option value="product">Product</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => (e.key === "Enter" ? onApplySearch() : null)}
                  placeholder="SO number / customer / product…"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={onApplySearch} disabled={loading}>
              <Filter className="h-4 w-4" />
              Apply
            </Button>
            <Button variant="ghost" className="gap-2" onClick={onReset} disabled={loading}>
              <XCircle className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Revenue"
          value={formatINR(summary.revenue)}
          hint={`Range: ${from} → ${to}`}
          icon={TrendingUp}
          tone="neutral"
        />
        <StatCard title="COGS" value={formatINR(summary.cogs)} hint="Direct material + process costs" icon={BarChart3} tone="neutral" />
        <StatCard title="Overhead" value={formatINR(summary.overhead)} hint="Labor, utilities, depreciation…" icon={BarChart3} tone="neutral" />
        <StatCard title="Scrap" value={formatINR(summary.scrap)} hint="Rejected / non-recoverable" icon={BarChart3} tone="bad" />
        <StatCard
          title="Profit"
          value={formatINR(summary.profit)}
          hint={`Margin: ${marginMeta.marginPct.toFixed(1)}%`}
          icon={BarChart3}
          tone={summary.profit >= 0 ? "good" : "bad"}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {groupLabel} profitability
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} result{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Tip: Use Group by = Work Order to analyze process-level profitability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Export: CSV/XLSX/PDF (if enabled)
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">{groupLabel}</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">COGS</th>
                <th className="px-4 py-3 text-right">Overhead</th>
                <th className="px-4 py-3 text-right">Scrap</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-right">Margin</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading profitability…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-600">
                    No data found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const revenue = safeNumber(r.revenue);
                  const cost = safeNumber(r.cogs) + safeNumber(r.overhead) + safeNumber(r.scrap);
                  const { profit, marginPct } = computeMargin(revenue, cost);
                  const profitTone = profit >= 0 ? "text-emerald-700" : "text-rose-700";

                  const refText = r?.ref || r?.name || r?.id;
                  const detailsHref =
                    r?.type === "SO"
                      ? `/sales/orders/${r.id}`
                      : r?.type === "WO"
                      ? `/production/work-orders/${r.id}`
                      : null;

                  return (
                    <tr key={`${r.type || "ROW"}-${r.id}`} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {r.type || groupBy.toUpperCase()}
                          </Badge>

                          {detailsHref ? (
                            <Link to={detailsHref} className="font-medium text-[#dc2551] hover:underline">
                              {refText}
                            </Link>
                          ) : (
                            <span className="font-medium">{refText}</span>
                          )}

                          {r?.name && r?.ref ? <span className="text-xs text-gray-500">— {r.name}</span> : null}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right text-sm text-gray-800">{formatINR(revenue)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-800">{formatINR(r.cogs)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-800">{formatINR(r.overhead)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-800">{formatINR(r.scrap)}</td>

                      <td className={cx("px-4 py-3 text-right text-sm font-semibold", profitTone)}>
                        {formatINR(profit)}
                      </td>

                      <td className="px-4 py-3 text-right text-sm">
                        <Badge className={cx("rounded-full", marginPct >= 20 ? "bg-emerald-600" : marginPct >= 0 ? "bg-slate-700" : "bg-rose-600")}>
                          {marginPct.toFixed(1)}%
                        </Badge>
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

      {/* Notes */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">How profitability is typically computed (PCB ERP)</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">Revenue</span> from sales invoices / delivered orders (net of credit notes).</li>
              <li><span className="font-medium">COGS</span> includes laminate, copper, chemicals, drills, soldermask, consumables, outsourced ops, and direct process costs.</li>
              <li><span className="font-medium">Overhead</span> can be allocated by machine-hours, panel area, or work order routing times.</li>
              <li><span className="font-medium">Scrap</span> from NCR dispositions (scrap) and yield losses (panel rejects).</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              If your backend uses different fields, update the mapping in this page accordingly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
