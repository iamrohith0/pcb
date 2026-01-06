// src/pages/reports/inventory/ConsumptionReport.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

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
 * Inventory Consumption Report (PCB Manufacturing ERP)
 *
 * Backend endpoints expected (adjust paths/params to match your API):
 * - GET  /reports/inventory/consumption
 *      params: from, to, query, plant_id, warehouse_id, item_type, groupBy, page, size
 *      returns:
 *        {
 *          summary: { qty, value },
 *          rows: [
 *            {
 *              id,
 *              date,            // ISO date/time
 *              item_id,
 *              item_code,
 *              item_name,
 *              item_type,       // e.g. "Laminate", "Copper", "Chemical", "Consumable", "Soldermask"
 *              uom,             // e.g. "kg", "sheet", "ltr"
 *              qty,             // issued quantity
 *              unit_cost,
 *              value,           // qty * unit_cost
 *              warehouse_id,
 *              warehouse_name,
 *              work_order_id,   // optional
 *              work_order_no,   // optional
 *              batch_no,        // optional
 *              lot_no,          // optional
 *              issue_ref,       // e.g. "ISS-00012"
 *              issued_by        // optional
 *            }
 *          ],
 *          page: { index, size, total }
 *        }
 *
 * - GET /reports/inventory/consumption/export (optional) -> file download (csv/xlsx/pdf)
 */
export default function ConsumptionReport() {
  const { toast } = useToast();

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(new Date()));

  const [query, setQuery] = useState("");
  const [plantId, setPlantId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [itemType, setItemType] = useState("all"); // all | laminate | copper | chemical | consumable | soldermask | etc
  const [groupBy, setGroupBy] = useState("item"); // item | work_order | day | warehouse

  const [plants, setPlants] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ qty: 0, value: 0 });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const loadLookups = async () => {
    // Optional lookups. If your API doesn't have these, the dropdowns will still work (manual ids).
    try {
      const [pRes, wRes] = await Promise.allSettled([
        api.get("/settings/plants"),
        api.get("/warehouse/warehouses"),
      ]);

      if (pRes.status === "fulfilled") {
        const p = pRes.value?.data?.data || pRes.value?.data || [];
        setPlants(Array.isArray(p) ? p : []);
      }
      if (wRes.status === "fulfilled") {
        const w = wRes.value?.data?.data || wRes.value?.data || [];
        setWarehouses(Array.isArray(w) ? w : []);
      }
    } catch {
      // ignore
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/inventory/consumption", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          warehouse_id: warehouseId || undefined,
          item_type: itemType !== "all" ? itemType : undefined,
          groupBy,
          page: pageIndex,
          size: pageSize,
        },
      });

      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSummary({
        qty: Number(data?.summary?.qty || 0),
        value: Number(data?.summary?.value || 0),
      });

      const p = data?.page || {};
      setTotal(Number(p.total || 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load consumption report",
        description: "Please check API connectivity and try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
      setSummary({ qty: 0, value: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, plantId, warehouseId, itemType, groupBy, pageIndex, pageSize]);

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
    setWarehouseId("");
    setItemType("all");
    setGroupBy("item");
    setPageIndex(0);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/reports/inventory/consumption/export", {
        params: {
          from,
          to,
          query: query?.trim() || undefined,
          plant_id: plantId || undefined,
          warehouse_id: warehouseId || undefined,
          item_type: itemType !== "all" ? itemType : undefined,
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

      downloadBlob(res.data, `consumption_${from}_to_${to}.${ext}`);
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
      case "work_order":
        return "Work Order";
      case "warehouse":
        return "Warehouse";
      case "day":
        return "Day";
      default:
        return "Item";
    }
  }, [groupBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports / Inventory</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Consumption Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track raw-material and consumable issues against work orders, batches/lots, and warehouses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={onExport} disabled={exporting}>
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
              <label className="text-xs font-semibold text-gray-600">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
                <option value="">All</option>
                {plants.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name || p.title || `Plant ${p.id || p._id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="">All</option>
                {warehouses.map((w) => (
                  <option key={w.id || w._id} value={w.id || w._id}>
                    {w.name || w.code || `Warehouse ${w.id || w._id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Item type</label>
              <select
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value);
                  setPageIndex(0);
                }}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All</option>
                <option value="laminate">Laminate</option>
                <option value="copper">Copper</option>
                <option value="chemical">Chemical</option>
                <option value="soldermask">Soldermask</option>
                <option value="silkscreen">Silkscreen</option>
                <option value="drill">Drill / Tooling</option>
                <option value="consumable">Consumable</option>
                <option value="outsourcing">Outsourcing</option>
              </select>
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
                <option value="item">Item</option>
                <option value="work_order">Work Order</option>
                <option value="warehouse">Warehouse</option>
                <option value="day">Day</option>
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
                  placeholder="Item / WO / Batch / Lot / Issue ref…"
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

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total issued qty</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(summary.qty, 3)}</p>
              <p className="mt-1 text-xs text-gray-500">Across selected filters</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Issued value</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatINR(summary.value)}</p>
              <p className="mt-1 text-xs text-gray-500">Qty × unit cost</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg unit cost</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary.qty > 0 ? formatINR(summary.value / summary.qty) : formatINR(0)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Weighted by issued qty</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {groupLabel} consumption
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({total} result{total === 1 ? "" : "s"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Typical source: material issue notes (stores issue) linked to WO routing steps (lamination, etch, plating, soldermask, etc.).
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
          <table className="min-w-[1150px] w-full">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {groupBy === "item" ? (
                  <>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">UOM</th>
                  </>
                ) : groupBy === "work_order" ? (
                  <>
                    <th className="px-4 py-3 text-left">Work Order</th>
                    <th className="px-4 py-3 text-left">Batch / Lot</th>
                  </>
                ) : groupBy === "warehouse" ? (
                  <>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Plant</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Context</th>
                  </>
                )}

                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-left">Reference</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading consumption…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-600">
                    No consumption data found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const qty = Number(r.qty || 0);
                  const unit = Number(r.unit_cost || 0);
                  const value = Number(r.value ?? qty * unit);

                  const woHref = r?.work_order_id ? `/production/work-orders/${r.work_order_id}` : null;
                  const itemHref = r?.item_id ? `/inventory/items/${r.item_id}` : null;

                  const refText = r?.issue_ref || r?.ref || r?.id;

                  return (
                    <tr key={`${groupBy}-${r.id}`} className="hover:bg-gray-50/70">
                      {groupBy === "item" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                ITEM
                              </Badge>
                              {itemHref ? (
                                <Link to={itemHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.item_code || r.item_name || `Item ${r.item_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.item_code || r.item_name || `Item ${r.item_id}`}</span>
                              )}
                              {r.item_name && r.item_code ? <span className="text-xs text-gray-500">— {r.item_name}</span> : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.item_type || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.uom || "-"}</td>
                        </>
                      ) : groupBy === "work_order" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                WO
                              </Badge>
                              {woHref ? (
                                <Link to={woHref} className="font-medium text-[#dc2551] hover:underline">
                                  {r.work_order_no || `WO ${r.work_order_id}`}
                                </Link>
                              ) : (
                                <span className="font-medium">{r.work_order_no || `WO ${r.work_order_id}`}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="text-xs text-gray-500">Batch:</span>{" "}
                            <span className="font-medium">{r.batch_no || "-"}</span>
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="text-xs text-gray-500">Lot:</span>{" "}
                            <span className="font-medium">{r.lot_no || "-"}</span>
                          </td>
                        </>
                      ) : groupBy === "warehouse" ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                WH
                              </Badge>
                              <span className="font-medium">{r.warehouse_name || `Warehouse ${r.warehouse_id}`}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.plant_name || "-"}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDateHuman(r.date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {r.work_order_no ? (
                              <span className="inline-flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  WO
                                </Badge>
                                {woHref ? (
                                  <Link to={woHref} className="font-medium text-[#dc2551] hover:underline">
                                    {r.work_order_no}
                                  </Link>
                                ) : (
                                  <span className="font-medium">{r.work_order_no}</span>
                                )}
                                <span className="text-xs text-gray-500">
                                  (Batch {r.batch_no || "-"}, Lot {r.lot_no || "-"})
                                </span>
                              </span>
                            ) : (
                              <span className="text-sm text-gray-700">-</span>
                            )}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(qty, 3)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">{formatINR(unit)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatINR(value)}</td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{refText || "-"}</span>
                          <span className="text-xs text-gray-500">
                            {r.issued_by ? `Issued by ${r.issued_by}` : ""}
                            {r.warehouse_name ? `${r.issued_by ? " • " : ""}${r.warehouse_name}` : ""}
                          </span>
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

      {/* Notes */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">What “consumption” means in a PCB shop</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-gray-600">
              <li><span className="font-medium">Material issues</span> from stores to production (laminate sheets, copper foil, prepreg, chemicals, inks).</li>
              <li><span className="font-medium">Tooling usage</span> like drill bits / routing tools can be tracked as consumables per WO.</li>
              <li><span className="font-medium">Batch/Lot trace</span> links issued materials → panels → finished boards for recall and genealogy.</li>
              <li><span className="font-medium">Costing</span> uses issued qty × moving-average/FIFO cost to build accurate COGS.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              If your backend returns a different schema, update the field mapping in this page.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
