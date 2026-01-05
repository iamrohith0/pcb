// src/pages/inventory/stock/CostHistory.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Download,
  Filter,
  History,
  Loader2,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function money(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 4 }).format(num);
}

function formatDate(d) {
  if (!d) return "-";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return String(d);
  }
}

function ChangeBadge({ direction, pct }) {
  const isUp = direction === "UP";
  const label =
    pct === null || pct === undefined
      ? "-"
      : `${isUp ? "+" : ""}${Number(pct).toFixed(2)}%`;

  return (
    <Badge
      className={cx(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        isUp ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
      )}
    >
      {isUp ? <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> : <TrendingDown className="mr-1 inline h-3.5 w-3.5" />}
      {label}
    </Badge>
  );
}

/**
 * Replace with real API calls later:
 * GET /inventory/cost-history?query=&item_type=&from=&to=&warehouse=&method=&page=&limit=
 * GET /inventory/cost-history/export?...
 */
function mockFetchCostHistory() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 101,
          itemCode: "RM-FR4-1.6-7628",
          itemName: "FR4 Laminate 1.6mm (7628)",
          itemType: "Raw Material",
          warehouse: "Main Stores",
          method: "Weighted Avg",
          effectiveDate: new Date(Date.now() - 86400000 * 14).toISOString(),
          oldCost: 1280.0,
          newCost: 1315.5,
          reason: "Supplier price revision",
          refType: "GRN",
          refNo: "GRN-0002",
        },
        {
          id: 102,
          itemCode: "CHEM-ETCH-CL",
          itemName: "Cu Etchant (Chloride) 20L",
          itemType: "Chemical",
          warehouse: "Chem Store",
          method: "FIFO",
          effectiveDate: new Date(Date.now() - 86400000 * 10).toISOString(),
          oldCost: 2450.0,
          newCost: 2390.0,
          reason: "Rate renegotiation",
          refType: "PO",
          refNo: "PO-2026-0121",
        },
        {
          id: 103,
          itemCode: "TOOL-DRILL-08",
          itemName: "Drill Bit 0.8mm",
          itemType: "Consumable",
          warehouse: "Tool Crib",
          method: "Standard",
          effectiveDate: new Date(Date.now() - 86400000 * 7).toISOString(),
          oldCost: 22.5,
          newCost: 24.0,
          reason: "Standard cost update",
          refType: "Manual",
          refNo: "SC-REV-01",
        },
        {
          id: 104,
          itemCode: "RM-CU-FOIL-18",
          itemName: "Copper Foil 18µm",
          itemType: "Raw Material",
          warehouse: "Incoming Bay",
          method: "Weighted Avg",
          effectiveDate: new Date(Date.now() - 86400000 * 3).toISOString(),
          oldCost: 980.0,
          newCost: 1012.0,
          reason: "Forex fluctuation",
          refType: "GRN",
          refNo: "GRN-0004",
        },
      ]);
    }, 450);
  });
}

export default function CostHistory() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters
  const [query, setQuery] = useState("");
  const [itemType, setItemType] = useState("ALL");
  const [warehouse, setWarehouse] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const itemTypes = useMemo(() => ["ALL", "Raw Material", "Chemical", "Consumable", "FG", "WIP"], []);
  const warehouses = useMemo(() => ["ALL", "Main Stores", "Incoming Bay", "Chem Store", "Tool Crib"], []);
  const methods = useMemo(() => ["ALL", "FIFO", "Weighted Avg", "Standard"], []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await mockFetchCostHistory();
      setRows(data);
    } catch (e) {
      toast({ title: "Failed to load cost history", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows || []).filter((r) => {
      const matchesQ =
        !q ||
        String(r.itemCode || "").toLowerCase().includes(q) ||
        String(r.itemName || "").toLowerCase().includes(q) ||
        String(r.refNo || "").toLowerCase().includes(q);

      const matchesType = itemType === "ALL" || String(r.itemType || "") === itemType;
      const matchesWH = warehouse === "ALL" || String(r.warehouse || "") === warehouse;
      const matchesMethod = method === "ALL" || String(r.method || "") === method;

      const d = r.effectiveDate ? new Date(r.effectiveDate) : null;
      const fromOk = !from || (d && d >= new Date(from));
      const toOk = !to || (d && d <= new Date(new Date(to).setHours(23, 59, 59, 999)));

      return matchesQ && matchesType && matchesWH && matchesMethod && fromOk && toOk;
    });
  }, [rows, query, itemType, warehouse, method, from, to]);

  const stats = useMemo(() => {
    const total = filtered.length;
    let up = 0;
    let down = 0;
    let deltaAbs = 0;

    filtered.forEach((r) => {
      const oldC = Number(r.oldCost || 0);
      const newC = Number(r.newCost || 0);
      const d = newC - oldC;
      deltaAbs += d;
      if (d > 0) up += 1;
      if (d < 0) down += 1;
    });

    return { total, up, down, deltaAbs };
  }, [filtered]);

  const resetFilters = () => {
    setQuery("");
    setItemType("ALL");
    setWarehouse("ALL");
    setMethod("ALL");
    setFrom("");
    setTo("");
  };

  const handleExport = () => {
    toast({ title: "Export", description: "Hook this button to your CSV/Excel export endpoint." });
    // window.location.href = `/api/inventory/cost-history/export?...`
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                Cost History
              </CardTitle>
              <CardDescription>
                Audit item cost changes across warehouses and costing methods (FIFO / Weighted Avg / Standard).
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-white p-3">
              <div className="text-xs text-gray-500">Records</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{stats.total}</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-xs text-gray-500">Increased</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{stats.up}</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-xs text-gray-500">Decreased</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{stats.down}</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-xs text-gray-500">Net delta (sum)</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{money(stats.deltaAbs)}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Search</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> filters
                </span>
              </div>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Item code / name / reference no..."
                  className="pl-9"
                />
                {query && (
                  <button
                    type="button"
                    className="absolute right-2 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-gray-500">Item type</div>
              <select
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
                {itemTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === "ALL" ? "All" : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-gray-500">Warehouse</div>
              <select
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w === "ALL" ? "All" : w}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <div className="text-xs text-gray-500">Method</div>
                <select
                  className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {methods.map((m) => (
                    <option key={m} value={m}>
                      {m === "ALL" ? "All" : m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <div className="text-xs text-gray-500">From</div>
                <div className="relative mt-1">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
                </div>
              </div>

              <div className="col-span-1">
                <div className="text-xs text-gray-500">To</div>
                <div className="relative mt-1">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Filter className="h-4 w-4" />
                Showing <span className="font-semibold text-gray-900">{filtered.length}</span> records
              </div>

              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Warehouse</th>
                  <th className="px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-left">Effective</th>
                  <th className="px-3 py-2 text-right">Old Cost</th>
                  <th className="px-3 py-2 text-right">New Cost</th>
                  <th className="px-3 py-2 text-left">Change</th>
                  <th className="px-3 py-2 text-left">Reference</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading..." : "No cost history found for your filters."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const oldC = Number(r.oldCost || 0);
                    const newC = Number(r.newCost || 0);
                    const delta = newC - oldC;
                    const pct = oldC === 0 ? null : (delta / oldC) * 100;
                    const direction = delta >= 0 ? "UP" : "DOWN";

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/60">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-gray-900">{r.itemName}</div>
                          <div className="text-xs text-gray-500">{r.itemCode}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{r.itemType}</td>
                        <td className="px-3 py-2 text-gray-700">{r.warehouse}</td>
                        <td className="px-3 py-2 text-gray-700">{r.method}</td>
                        <td className="px-3 py-2 text-gray-700">{formatDate(r.effectiveDate)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{money(oldC)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{money(newC)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <ChangeBadge direction={direction} pct={pct} />
                            <span className={cx("text-xs font-medium", delta >= 0 ? "text-emerald-700" : "text-rose-700")}>
                              {delta >= 0 ? "+" : ""}
                              {money(delta)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          <div className="font-medium">{r.refType}</div>
                          <div className="text-xs text-gray-500">{r.refNo}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{r.reason || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <History className="h-4 w-4" />
            Hook this page to inventory costing events (GRN posting, standard cost revision, landed cost allocation).
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
