// src/pages/inventory/stock/StockDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Boxes,
  PackageSearch,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Warehouse,
  ScanLine,
  Layers,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import stockService from "@/services/inventory/stock.service";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function safeNum(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function fmt(n) {
  return new Intl.NumberFormat().format(safeNum(n));
}

function fmtMoney(n, currency = "INR") {
  const x = safeNum(n);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(x);
}

function Spark({ up = true }) {
  // lightweight inline sparkline (no chart lib)
  const points = up
    ? "0,18 8,14 16,16 24,10 32,12 40,6 48,8 56,2 64,4"
    : "0,2 8,6 16,4 24,10 32,8 40,14 48,12 56,18 64,16";
  return (
    <svg viewBox="0 0 64 20" className="h-6 w-20">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "neutral", extra }) {
  const toneClass =
    tone === "danger"
      ? "bg-red-50 text-red-700 ring-red-100"
      : tone === "good"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : "bg-slate-50 text-slate-700 ring-slate-100";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
          </div>

          <div className={cx("rounded-xl p-3 ring-1", toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {extra ? <div className="mt-3">{extra}</div> : null}
      </CardContent>
    </Card>
  );
}

function Row({ label, right, hint }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        {hint ? <p className="text-xs text-gray-500 truncate">{hint}</p> : null}
      </div>
      <div className="flex-none">{right}</div>
    </div>
  );
}

export default function StockDashboard() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalLots: 0,
    totalOnHandQty: 0,
    totalReservedQty: 0,
    totalAvailableQty: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    noStockCount: 0,
    overStockCount: 0,
    expiringLotsCount: 0,
  });

  const [lowStock, setLowStock] = useState([]);
  const [recentMoves, setRecentMoves] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      /**
       * Expected APIs (recommended):
       * GET /inventory/stock/summary -> { ...summary }
       * GET /inventory/stock/alerts?type=low&limit=8 -> { items: [...] }
       * GET /inventory/stock/movements?limit=8 -> { items: [...] }
       */
      const [s, low, mv] = await Promise.all([
        stockService.getSummary(),
        stockService.getAlerts({ type: "low", limit: 8 }),
        stockService.getMovements({ limit: 8 }),
      ]);

      const sData = s?.data ?? s;
      setSummary((prev) => ({ ...prev, ...(sData || {}) }));

      const lowItems = (low?.data?.items ?? low?.data ?? low ?? []).items ?? (low?.data?.items ?? low?.data ?? low ?? []);
      setLowStock(Array.isArray(lowItems) ? lowItems : []);

      const mvItems = (mv?.data?.items ?? mv?.data ?? mv ?? []).items ?? (mv?.data?.items ?? mv?.data ?? mv ?? []);
      setRecentMoves(Array.isArray(mvItems) ? mvItems : []);
    } catch (err) {
      toast({
        title: "Failed to load stock dashboard",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLow = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return lowStock;
    return lowStock.filter((x) => {
      const item = (x?.itemCode || x?.code || x?.sku || "").toLowerCase();
      const name = (x?.itemName || x?.name || "").toLowerCase();
      const wh = (x?.warehouse || x?.warehouseName || "").toLowerCase();
      return item.includes(s) || name.includes(s) || wh.includes(s);
    });
  }, [lowStock, q]);

  const kpiTrend = useMemo(() => {
    // heuristic: if available > reserved => "up"
    return summary.totalAvailableQty >= summary.totalReservedQty;
  }, [summary.totalAvailableQty, summary.totalReservedQty]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Stock Dashboard</h1>
          <p className="text-sm text-gray-500">
            Live view of inventory health for PCB raw materials, WIP, and finished goods.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={cx("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Link to="/inventory/stock">
            <Button variant="outline">
              <PackageSearch className="mr-2 h-4 w-4" />
              Stock List
            </Button>
          </Link>

          <Link to="/inventory/items">
            <Button variant="outline">
              <Boxes className="mr-2 h-4 w-4" />
              Items
            </Button>
          </Link>

          <Link to="/inventory/lots">
            <Button className="bg-cyan-600 hover:bg-cyan-500">
              <Layers className="mr-2 h-4 w-4" />
              Lots
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <StatCard
            title="On-hand Quantity"
            value={fmt(summary.totalOnHandQty)}
            subtitle={`Available ${fmt(summary.totalAvailableQty)} · Reserved ${fmt(summary.totalReservedQty)}`}
            icon={Warehouse}
            tone="neutral"
            extra={
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  {kpiTrend ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  Utilization
                </span>
                <span className={cx("font-medium", kpiTrend ? "text-emerald-700" : "text-amber-700")}>
                  <span className="inline-flex items-center gap-2">
                    <Spark up={kpiTrend} />
                    {kpiTrend ? "Healthy" : "Tight"}
                  </span>
                </span>
              </div>
            }
          />
        </div>

        <div className="md:col-span-4">
          <StatCard
            title="Stock Value"
            value={fmtMoney(summary.totalStockValue)}
            subtitle={`${fmt(summary.totalItems)} items · ${fmt(summary.totalLots)} lots`}
            icon={Boxes}
            tone="good"
            extra={
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Valuation</Badge>
                <span>FIFO / Avg (as configured)</span>
              </div>
            }
          />
        </div>

        <div className="md:col-span-4">
          <StatCard
            title="Alerts"
            value={fmt(summary.lowStockCount + summary.noStockCount)}
            subtitle={`Low ${fmt(summary.lowStockCount)} · Out ${fmt(summary.noStockCount)} · Expiring ${fmt(summary.expiringLotsCount)}`}
            icon={AlertTriangle}
            tone={summary.noStockCount > 0 ? "danger" : summary.lowStockCount > 0 ? "warn" : "good"}
            extra={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                  Low: {fmt(summary.lowStockCount)}
                </Badge>
                <Badge className="bg-red-50 text-red-700 hover:bg-red-50">
                  Out: {fmt(summary.noStockCount)}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  Exp: {fmt(summary.expiringLotsCount)}
                </Badge>
              </div>
            }
          />
        </div>
      </div>

      {/* Quick actions row */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Quick Actions</p>
              <p className="text-sm text-gray-500">Common inventory workflows for PCB manufacturing.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/inventory/adjustments/create">
                <Button variant="outline">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Stock Adjustment
                </Button>
              </Link>

              <Link to="/inventory/serials/register">
                <Button variant="outline">
                  <ScanLine className="mr-2 h-4 w-4" />
                  Register Serials
                </Button>
              </Link>

              <Link to="/procurement/grn/create">
                <Button className="bg-cyan-600 hover:bg-cyan-500">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  GRN (Receive)
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low stock + Recent movement */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Low Stock */}
        <Card className="md:col-span-7">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Low Stock Watchlist</CardTitle>
              <CardDescription>Items below reorder point / min level (top 8)</CardDescription>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search item / warehouse…"
                className="w-full sm:w-64"
              />
              <Link to="/inventory/stock?filter=low" className="inline-flex">
                <Button variant="outline">View all</Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {!filteredLow.length ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm font-medium text-gray-900">No low stock items</p>
                <p className="mt-1 text-sm text-gray-500">You’re good for now. Keep an eye on copper, prepreg, soldermask & chemicals.</p>
              </div>
            ) : (
              filteredLow.map((x, idx) => {
                const code = x?.itemCode || x?.code || x?.sku || `ITEM-${idx + 1}`;
                const name = x?.itemName || x?.name || "Item";
                const wh = x?.warehouse || x?.warehouseName || "Main Stores";
                const onHand = safeNum(x?.onHandQty ?? x?.onHand ?? 0);
                const min = safeNum(x?.minQty ?? x?.minLevel ?? 0);
                const uom = x?.uom || "PCS";

                const severity = onHand <= 0 ? "danger" : onHand < min ? "warn" : "neutral";
                const badgeClass =
                  severity === "danger"
                    ? "bg-red-50 text-red-700 hover:bg-red-50"
                    : severity === "warn"
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-100";

                return (
                  <motion.div
                    key={`${code}-${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl border bg-white p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className={badgeClass}>
                            {onHand <= 0 ? <AlertTriangle className="mr-2 h-4 w-4" /> : <PackageSearch className="mr-2 h-4 w-4" />}
                            {onHand <= 0 ? "Out of stock" : "Low stock"}
                          </Badge>
                          <span className="font-mono text-xs text-gray-600">{code}</span>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500 truncate">{wh}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                          On-hand: <span className="ml-1 font-semibold">{fmt(onHand)}</span> {uom}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                          Min: <span className="ml-1 font-semibold">{fmt(min)}</span> {uom}
                        </Badge>
                        <Link to={`/inventory/stock?item=${encodeURIComponent(code)}`} className="inline-flex">
                          <Button variant="outline">
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Open
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent movements */}
        <Card className="md:col-span-5">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Recent Movements</CardTitle>
              <CardDescription>Receipts, issues to production, adjustments</CardDescription>
            </div>
            <Link to="/inventory/stock/movements" className="inline-flex">
              <Button variant="outline">View</Button>
            </Link>
          </CardHeader>

          <CardContent className="space-y-2">
            {!recentMoves.length ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm font-medium text-gray-900">No movements yet</p>
                <p className="mt-1 text-sm text-gray-500">GRN, Issue to WO, and adjustments will appear here.</p>
              </div>
            ) : (
              recentMoves.slice(0, 8).map((m, idx) => {
                const type = (m?.type || m?.movementType || "Movement").toString();
                const ref = m?.refNo || m?.reference || m?.docNo || `REF-${idx + 1}`;
                const item = m?.itemCode || m?.sku || "ITEM";
                const qty = safeNum(m?.qty ?? m?.quantity ?? 0);
                const uom = m?.uom || "PCS";
                const when = m?.date || m?.createdAt || "";

                const isIn = ["grn", "receipt", "in", "purchase"].some((k) => type.toLowerCase().includes(k));
                const tone = isIn ? "good" : "warn";

                return (
                  <Row
                    key={`${ref}-${idx}`}
                    label={`${type} · ${ref}`}
                    hint={`${item} · ${when}`.trim()}
                    right={
                      <Badge
                        className={cx(
                          isIn ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                        )}
                      >
                        {isIn ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />}
                        {qty < 0 ? fmt(Math.abs(qty)) : fmt(qty)} {uom}
                      </Badge>
                    }
                  />
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
