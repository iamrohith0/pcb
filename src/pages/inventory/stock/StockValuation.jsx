// src/pages/inventory/stock/StockValuation.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Wallet,
  Warehouse,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import stockService from "@/services/inventory/stock.service";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function safeNum(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function money(n, currency = "INR") {
  const val = safeNum(n, 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(val);
}

function fmt(n) {
  return new Intl.NumberFormat("en-IN").format(safeNum(n, 0));
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function exportCSV(filename, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const header = Object.keys(rows[0] || {});
  const lines = [
    header.map(esc).join(","),
    ...rows.map((r) => header.map((h) => esc(r[h])).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-600">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function StockValuation() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  // Filters
  const [asOfDate, setAsOfDate] = useState(todayISO());
  const [warehouse, setWarehouse] = useState("");
  const [location, setLocation] = useState("");
  const [valuationMethod, setValuationMethod] = useState("weighted_avg"); // weighted_avg | fifo | standard
  const [currency, setCurrency] = useState("INR");

  const [searchText, setSearchText] = useState("");
  const [minValue, setMinValue] = useState("");
  const [onlyPositiveStock, setOnlyPositiveStock] = useState(true);

  // Data
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    totalItems: 0,
    totalQty: 0,
    totalValue: 0,
    method: "weighted_avg",
    asOfDate: asOfDate,
  });

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const minV = minValue === "" ? null : safeNum(minValue, 0);

    return rows.filter((r) => {
      const itemCode = String(r.itemCode ?? "").toLowerCase();
      const itemName = String(r.itemName ?? "").toLowerCase();
      const wh = String(r.warehouse ?? "").toLowerCase();
      const loc = String(r.location ?? "").toLowerCase();

      const matchesText = !q || itemCode.includes(q) || itemName.includes(q) || wh.includes(q) || loc.includes(q);
      const qtyOk = !onlyPositiveStock || safeNum(r.onHandQty, 0) > 0;
      const minOk = minV == null || safeNum(r.stockValue, 0) >= minV;

      return matchesText && qtyOk && minOk;
    });
  }, [rows, searchText, minValue, onlyPositiveStock]);

  const totals = useMemo(() => {
    const totalItems = filteredRows.length;
    const totalQty = filteredRows.reduce((a, r) => a + safeNum(r.onHandQty, 0), 0);
    const totalValue = filteredRows.reduce((a, r) => a + safeNum(r.stockValue, 0), 0);
    return { totalItems, totalQty, totalValue };
  }, [filteredRows]);

  const loadValuation = async () => {
    setLoading(true);
    try {
      /**
       * ✅ Recommended backend:
       * GET /inventory/stock/valuation
       * params: { asOfDate, warehouse, location, method }
       * returns:
       * {
       *   meta: { asOfDate, method, currency, totalItems, totalQty, totalValue },
       *   rows: [
       *     { itemCode, itemName, uom, warehouse, location, onHandQty, unitCost, stockValue, lotNo?, lastReceiptDate? }
       *   ]
       * }
       */
      const res = await stockService.getValuation({
        asOfDate,
        warehouse: warehouse || undefined,
        location: location || undefined,
        method: valuationMethod,
      });

      const data = res?.data ?? res;

      setMeta({
        totalItems: safeNum(data?.meta?.totalItems, 0),
        totalQty: safeNum(data?.meta?.totalQty, 0),
        totalValue: safeNum(data?.meta?.totalValue, 0),
        asOfDate: data?.meta?.asOfDate || asOfDate,
        method: data?.meta?.method || valuationMethod,
        currency: data?.meta?.currency || currency,
      });

      setCurrency(data?.meta?.currency || currency);

      setRows(Array.isArray(data?.rows) ? data.rows : []);
      toast({ title: "Valuation loaded", description: `As of ${data?.meta?.asOfDate || asOfDate}` });
    } catch (err) {
      toast({
        title: "Failed to load valuation",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
      setRows([]);
      setMeta((m) => ({ ...m, totalItems: 0, totalQty: 0, totalValue: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValuation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    if (!filteredRows.length) {
      toast({ title: "Nothing to export", description: "No rows after filters.", variant: "destructive" });
      return;
    }

    const out = filteredRows.map((r) => ({
      AsOfDate: meta.asOfDate || asOfDate,
      Method: meta.method || valuationMethod,
      ItemCode: r.itemCode,
      ItemName: r.itemName,
      UOM: r.uom,
      Warehouse: r.warehouse,
      Location: r.location,
      OnHandQty: r.onHandQty,
      UnitCost: r.unitCost,
      StockValue: r.stockValue,
      LotNo: r.lotNo || "",
      LastReceiptDate: r.lastReceiptDate || "",
    }));

    exportCSV(`stock_valuation_${(meta.asOfDate || asOfDate).replaceAll("-", "")}.csv`, out);
    toast({ title: "Exported", description: "CSV downloaded successfully." });
  };

  const methodLabel =
    (meta.method || valuationMethod) === "fifo"
      ? "FIFO"
      : (meta.method || valuationMethod) === "standard"
      ? "Standard"
      : "Weighted Avg";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link to="/inventory/stock/dashboard" className="inline-flex">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          <div>
            <h1 className="text-lg font-bold text-gray-900">Stock Valuation</h1>
            <p className="text-sm text-gray-500">
              Inventory value snapshot by item and warehouse/location (raw materials, chemicals, consumables, WIP & FG).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={loadValuation} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>

          <Button variant="outline" onClick={handleExport} disabled={loading || !filteredRows.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card className="md:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-gray-700" />
              Total Stock Value
            </CardTitle>
            <CardDescription>As of {meta.asOfDate || asOfDate} • {methodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-gray-900">{money(totals.totalValue, currency)}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                Items: <span className="ml-1 font-semibold">{fmt(totals.totalItems)}</span>
              </Badge>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                Qty: <span className="ml-1 font-semibold">{fmt(totals.totalQty)}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-700" />
              Filters
            </CardTitle>
            <CardDescription>Refine valuation view and export only what you need.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="As of Date">
              <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
            </Field>

            <Field label="Warehouse (optional)">
              <div className="relative">
                <Warehouse className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} placeholder="e.g. Main Stores" className="pl-9" />
              </div>
            </Field>

            <Field label="Location (optional)">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. R1-B2 / LINE-1" />
            </Field>

            <Field label="Method">
              <select
                value={valuationMethod}
                onChange={(e) => setValuationMethod(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/30"
              >
                <option value="weighted_avg">Weighted Avg</option>
                <option value="fifo">FIFO</option>
                <option value="standard">Standard</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Backend must support this method.</p>
            </Field>

            <div className="sm:col-span-2 lg:col-span-2">
              <Field label="Search">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Item code/name, warehouse, location..."
                    className="pl-9"
                  />
                </div>
              </Field>
            </div>

            <Field label="Min Value (optional)">
              <Input
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                placeholder="e.g. 5000"
                inputMode="decimal"
              />
            </Field>

            <Field label="Stock">
              <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-700">Only positive stock</span>
                <button
                  type="button"
                  onClick={() => setOnlyPositiveStock((s) => !s)}
                  className={cx(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    onlyPositiveStock ? "bg-[#DC2551]" : "bg-gray-300"
                  )}
                  aria-label="Toggle only positive stock"
                >
                  <span
                    className={cx(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      onlyPositiveStock ? "translate-x-5" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </Field>

            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button
                className="bg-[#DC2551] hover:bg-[#B02045]"
                onClick={loadValuation}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Run Valuation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Valuation Lines</CardTitle>
              <CardDescription>
                Showing <span className="font-semibold">{fmt(filteredRows.length)}</span> items • Currency {currency}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                Method: <span className="ml-1 font-semibold">{methodLabel}</span>
              </Badge>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                As of: <span className="ml-1 font-semibold">{meta.asOfDate || asOfDate}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading valuation...
            </div>
          ) : !filteredRows.length ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-gray-600">
              <ShieldAlert className="h-6 w-6" />
              <p className="text-sm font-medium">No valuation rows</p>
              <p className="text-xs text-gray-500">Try changing filters, warehouse, or valuation method.</p>
            </div>
          ) : (
            <>
              {/* Desktop header */}
              <div className="hidden grid-cols-12 gap-3 rounded-xl border bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 md:grid">
                <div className="col-span-3">Item</div>
                <div className="col-span-2">WH / Location</div>
                <div className="col-span-2">On Hand</div>
                <div className="col-span-2">Unit Cost</div>
                <div className="col-span-3 text-right">Stock Value</div>
              </div>

              <div className="space-y-2">
                {filteredRows.map((r, i) => (
                  <motion.div
                    key={`${r.itemCode}-${r.warehouse}-${r.location}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12 }}
                    className="rounded-xl border bg-white p-3"
                  >
                    {/* Mobile layout */}
                    <div className="space-y-2 md:hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.itemCode}</p>
                          <p className="text-xs text-gray-500">{r.itemName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-gray-900">{money(r.stockValue, currency)}</p>
                          <p className="text-xs text-gray-500">Unit: {money(r.unitCost, currency)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                          {r.warehouse || "-"} {r.location ? `• ${r.location}` : ""}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                          Qty: <span className="ml-1 font-semibold">{fmt(r.onHandQty)}</span> {r.uom || ""}
                        </Badge>
                        {r.lotNo ? (
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Lot: {r.lotNo}</Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Desktop row */}
                    <div className="hidden grid-cols-12 items-center gap-3 md:grid">
                      <div className="col-span-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{r.itemCode}</p>
                            <p className="text-xs text-gray-500">{r.itemName}</p>
                          </div>
                          {r.uom ? (
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{r.uom}</Badge>
                          ) : null}
                        </div>
                        {r.lotNo ? <p className="mt-1 text-xs text-gray-500">Lot: {r.lotNo}</p> : null}
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-900">{r.warehouse || "-"}</p>
                        <p className="text-xs text-gray-500">{r.location || "—"}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm font-semibold text-gray-900">{fmt(r.onHandQty)}</p>
                        <p className="text-xs text-gray-500">{r.uom || ""}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm font-semibold text-gray-900">{money(r.unitCost, currency)}</p>
                        <p className="text-xs text-gray-500">{methodLabel} cost</p>
                      </div>

                      <div className="col-span-3 text-right">
                        <p className="text-sm font-extrabold text-gray-900">{money(r.stockValue, currency)}</p>
                        <p className="text-xs text-gray-500">{r.lastReceiptDate ? `Last GRN: ${r.lastReceiptDate}` : ""}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
