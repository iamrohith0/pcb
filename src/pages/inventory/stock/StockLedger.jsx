// src/pages/inventory/stock/StockLedger.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar as CalendarIcon,
  Warehouse,
  Boxes,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import stockService from "@/services/stock.service";

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

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function Pill({ children, className }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", className)}>
      {children}
    </span>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-12 items-center gap-3 rounded-xl border bg-white px-3 py-2">{children}</div>;
}

function Col({ span, children, className }) {
  return <div className={cx(`col-span-12 sm:col-span-${span}`, className)}>{children}</div>;
}

export default function StockLedger() {
  const { toast } = useToast();
  const query = useQuery();
  const navigate = useNavigate();

  // Optional URL params for deep-linking:
  // ?item=CU-FOIL-35UM&warehouse=Main%20Stores&from=2026-01-01&to=2026-01-31
  const [item, setItem] = useState(query.get("item") || "");
  const [warehouse, setWarehouse] = useState(query.get("warehouse") || "");
  const [lot, setLot] = useState(query.get("lot") || "");
  const [from, setFrom] = useState(query.get("from") || "");
  const [to, setTo] = useState(query.get("to") || "");
  const [docType, setDocType] = useState(query.get("type") || ""); // GRN, ISSUE, ADJ, RETURN, etc
  const [ref, setRef] = useState(query.get("ref") || "");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [meta, setMeta] = useState({
    openingQty: 0,
    openingValue: 0,
    closingQty: 0,
    closingValue: 0,
    currency: "INR",
  });

  const [rows, setRows] = useState([]);

  const hasAnyFilter = useMemo(() => {
    return !!(item || warehouse || lot || from || to || docType || ref || q);
  }, [item, warehouse, lot, from, to, docType, ref, q]);

  const filteredRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const hay = [
        r?.docType,
        r?.refNo,
        r?.docNo,
        r?.itemCode,
        r?.itemName,
        r?.warehouse,
        r?.location,
        r?.lotNo,
        r?.serialNo,
        r?.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [rows, q]);

  const totals = useMemo(() => {
    let inQty = 0;
    let outQty = 0;
    let inVal = 0;
    let outVal = 0;

    for (const r of filteredRows) {
      const qtyIn = safeNum(r?.qtyIn ?? r?.inQty ?? 0);
      const qtyOut = safeNum(r?.qtyOut ?? r?.outQty ?? 0);
      const valIn = safeNum(r?.valueIn ?? r?.inValue ?? 0);
      const valOut = safeNum(r?.valueOut ?? r?.outValue ?? 0);

      inQty += qtyIn;
      outQty += qtyOut;
      inVal += valIn;
      outVal += valOut;
    }

    return { inQty, outQty, inVal, outVal };
  }, [filteredRows]);

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (item) params.set("item", item);
    if (warehouse) params.set("warehouse", warehouse);
    if (lot) params.set("lot", lot);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (docType) params.set("type", docType);
    if (ref) params.set("ref", ref);
    navigate({ search: params.toString() }, { replace: true });
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      syncUrl();

      /**
       * Expected API (recommended):
       * GET /inventory/stock/ledger
       * params: { item, warehouse, lot, from, to, type, ref, q, page, pageSize }
       * response: { meta: { openingQty, openingValue, closingQty, closingValue, currency }, items: [...] }
       */
      const res = await stockService.getLedger({
        item: item || undefined,
        warehouse: warehouse || undefined,
        lot: lot || undefined,
        from: from || undefined,
        to: to || undefined,
        type: docType || undefined,
        ref: ref || undefined,
        q: q || undefined,
      });

      const data = res?.data ?? res;
      const metaData = data?.meta || {};
      const items = data?.items || data?.rows || [];

      setMeta((prev) => ({ ...prev, ...(metaData || {}) }));
      setRows(Array.isArray(items) ? items : []);
    } catch (err) {
      toast({
        title: "Failed to load stock ledger",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setItem("");
    setWarehouse("");
    setLot("");
    setFrom("");
    setTo("");
    setDocType("");
    setRef("");
    setQ("");
    // keep URL clean
    navigate({ search: "" }, { replace: true });
  };

  const exportCsv = async () => {
    try {
      setExporting(true);

      // Prefer backend export if you have it:
      // GET /inventory/stock/ledger/export?...
      // Otherwise, generate CSV from current filteredRows:
      const cols = [
        "Date",
        "DocType",
        "RefNo",
        "ItemCode",
        "ItemName",
        "Warehouse",
        "Location",
        "LotNo",
        "SerialNo",
        "UOM",
        "QtyIn",
        "QtyOut",
        "BalanceQty",
        "UnitCost",
        "ValueIn",
        "ValueOut",
        "BalanceValue",
        "Remarks",
      ];

      const esc = (v) => {
        const s = v == null ? "" : String(v);
        const needs = /[,"\n]/.test(s);
        return needs ? `"${s.replaceAll('"', '""')}"` : s;
      };

      const lines = [cols.join(",")];
      for (const r of filteredRows) {
        const line = [
          fmtDate(r?.date || r?.txnDate),
          r?.docType || r?.type || "",
          r?.refNo || r?.docNo || "",
          r?.itemCode || "",
          r?.itemName || "",
          r?.warehouse || "",
          r?.location || "",
          r?.lotNo || "",
          r?.serialNo || "",
          r?.uom || "",
          safeNum(r?.qtyIn ?? r?.inQty ?? 0),
          safeNum(r?.qtyOut ?? r?.outQty ?? 0),
          safeNum(r?.balanceQty ?? r?.runningQty ?? 0),
          safeNum(r?.unitCost ?? r?.rate ?? 0),
          safeNum(r?.valueIn ?? r?.inValue ?? 0),
          safeNum(r?.valueOut ?? r?.outValue ?? 0),
          safeNum(r?.balanceValue ?? r?.runningValue ?? 0),
          r?.remarks || "",
        ].map(esc);

        lines.push(line.join(","));
      }

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "Exported", description: "Stock ledger CSV downloaded." });
    } catch (e) {
      toast({ title: "Export failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    // Load once initially with URL params
    fetchLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <h1 className="text-lg font-bold text-gray-900">Stock Ledger</h1>
            <p className="text-sm text-gray-500">
              Item-wise inventory ledger with running balance (ideal for copper foil, prepreg, soldermask, chemicals, and finished boards).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchLedger} disabled={loading}>
            <RefreshCw className={cx("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" onClick={exportCsv} disabled={exporting || loading}>
            <Download className={cx("mr-2 h-4 w-4", exporting && "animate-spin")} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                Filters
              </CardTitle>
              <CardDescription>Use filters to drill down by item / warehouse / date / lot / reference.</CardDescription>
            </div>

            {hasAnyFilter ? (
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="text-xs text-gray-600">Item Code</Label>
              <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. CU-FOIL-35UM" />
            </div>

            <div className="md:col-span-4">
              <Label className="text-xs text-gray-600">Warehouse</Label>
              <Input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} placeholder="e.g. Main Stores" />
            </div>

            <div className="md:col-span-4">
              <Label className="text-xs text-gray-600">Lot No</Label>
              <Input value={lot} onChange={(e) => setLot(e.target.value)} placeholder="e.g. LOT-2026-0012" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Doc Type</Label>
              <Input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="GRN / ISSUE / ADJ" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Reference</Label>
              <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="PO/GRN/WO/ADJ No" />
            </div>

            <div className="md:col-span-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search in results (doc no, location, serial, remarks)…"
                  className="w-full"
                />
              </div>

              <Button className="bg-[#DC2551] hover:bg-[#B02045]" onClick={fetchLedger} disabled={loading}>
                {loading ? "Loading…" : "Apply"}
              </Button>
            </div>
          </div>

          {/* Opening/Closing */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2">
                <Pill className="bg-slate-50 text-slate-700">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Opening
                </Pill>
                <Pill className="bg-slate-50 text-slate-700">
                  Qty: <span className="ml-1 font-semibold">{fmt(meta.openingQty)}</span>
                </Pill>
                <Pill className="bg-slate-50 text-slate-700">
                  Value: <span className="ml-1 font-semibold">{fmt(meta.openingValue)}</span>
                </Pill>
              </div>
            </div>

            <div className="md:col-span-6">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2">
                <Pill className="bg-slate-50 text-slate-700">
                  <FileText className="mr-2 h-4 w-4" />
                  Closing
                </Pill>
                <Pill className="bg-slate-50 text-slate-700">
                  Qty: <span className="ml-1 font-semibold">{fmt(meta.closingQty)}</span>
                </Pill>
                <Pill className="bg-slate-50 text-slate-700">
                  Value: <span className="ml-1 font-semibold">{fmt(meta.closingValue)}</span>
                </Pill>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <Card className="md:col-span-4">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total In</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{fmt(totals.inQty)}</p>
                <p className="mt-1 text-sm text-gray-500">Value: {fmt(totals.inVal)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
                <ArrowUpCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Out</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{fmt(totals.outQty)}</p>
                <p className="mt-1 text-sm text-gray-500">Value: {fmt(totals.outVal)}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700 ring-1 ring-amber-100">
                <ArrowDownCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rows</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{fmt(filteredRows.length)}</p>
                <p className="mt-1 text-sm text-gray-500">After search filter</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-slate-700 ring-1 ring-slate-100">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Ledger Entries</CardTitle>
              <CardDescription>Running balance per transaction (GRN, Issue to WO, Return, Adjustment).</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {item ? <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Item: {item}</Badge> : null}
              {warehouse ? (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  <Warehouse className="mr-2 h-4 w-4" />
                  {warehouse}
                </Badge>
              ) : null}
              {lot ? (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  <Package className="mr-2 h-4 w-4" />
                  {lot}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* Header row */}
          <div className="hidden grid-cols-12 gap-3 rounded-xl border bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 sm:grid">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Doc</div>
            <div className="col-span-2">Item</div>
            <div className="col-span-2">WH / Loc</div>
            <div className="col-span-1 text-right">In</div>
            <div className="col-span-1 text-right">Out</div>
            <div className="col-span-2 text-right">Balance</div>
          </div>

          {!filteredRows.length ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="text-sm font-medium text-gray-900">No ledger entries found</p>
              <p className="mt-1 text-sm text-gray-500">
                Try setting <span className="font-medium">Item Code</span> and <span className="font-medium">Date range</span>, then click Apply.
              </p>
            </div>
          ) : (
            filteredRows.map((r, idx) => {
              const date = fmtDate(r?.date || r?.txnDate);
              const doc = r?.docType || r?.type || "-";
              const refNo = r?.refNo || r?.docNo || "";
              const itemCode = r?.itemCode || "-";
              const itemName = r?.itemName || "";
              const wh = r?.warehouse || "-";
              const loc = r?.location || "";
              const lotNo = r?.lotNo || "";
              const serialNo = r?.serialNo || "";
              const qtyIn = safeNum(r?.qtyIn ?? r?.inQty ?? 0);
              const qtyOut = safeNum(r?.qtyOut ?? r?.outQty ?? 0);
              const bal = safeNum(r?.balanceQty ?? r?.runningQty ?? 0);
              const uom = r?.uom || "";

              const isIn = qtyIn > 0 && qtyOut <= 0;

              return (
                <motion.div
                  key={`${refNo || doc}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border bg-white px-3 py-2"
                >
                  {/* Mobile layout */}
                  <div className="space-y-2 sm:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {doc} {refNo ? `· ${refNo}` : ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {date} · {wh}
                          {loc ? ` / ${loc}` : ""}
                        </p>
                      </div>

                      <Badge
                        className={cx(
                          isIn
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                        )}
                      >
                        {isIn ? <ArrowUpCircle className="mr-2 h-4 w-4" /> : <ArrowDownCircle className="mr-2 h-4 w-4" />}
                        {isIn ? `+${fmt(qtyIn)}` : `-${fmt(qtyOut)}`} {uom}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{itemCode}</Badge>
                      {lotNo ? <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Lot: {lotNo}</Badge> : null}
                      {serialNo ? (
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">SN: {serialNo}</Badge>
                      ) : null}
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Bal: {fmt(bal)} {uom}</Badge>
                    </div>

                    {itemName ? <p className="text-xs text-gray-500">{itemName}</p> : null}
                    {r?.remarks ? <p className="text-xs text-gray-500">Remarks: {r.remarks}</p> : null}
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden grid-cols-12 items-center gap-3 sm:grid">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-900">{date}</p>
                      {r?.time ? <p className="text-xs text-gray-500">{r.time}</p> : null}
                    </div>

                    <div className="col-span-2 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc}</p>
                      <p className="text-xs text-gray-500 truncate">{refNo}</p>
                    </div>

                    <div className="col-span-2 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{itemCode}</p>
                      <p className="text-xs text-gray-500 truncate">{itemName}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {lotNo ? <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Lot: {lotNo}</Badge> : null}
                        {serialNo ? (
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">SN: {serialNo}</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="col-span-2 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{wh}</p>
                      <p className="text-xs text-gray-500 truncate">{loc}</p>
                    </div>

                    <div className="col-span-1 text-right">
                      <span className={cx("text-sm font-semibold", qtyIn > 0 ? "text-emerald-700" : "text-gray-300")}>
                        {qtyIn > 0 ? fmt(qtyIn) : "—"}
                      </span>
                    </div>

                    <div className="col-span-1 text-right">
                      <span className={cx("text-sm font-semibold", qtyOut > 0 ? "text-amber-700" : "text-gray-300")}>
                        {qtyOut > 0 ? fmt(qtyOut) : "—"}
                      </span>
                    </div>

                    <div className="col-span-2 text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-900">{fmt(bal)} {uom}</span>
                        {r?.balanceValue != null ? (
                          <span className="text-xs text-gray-500">Val: {fmt(safeNum(r.balanceValue))}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
