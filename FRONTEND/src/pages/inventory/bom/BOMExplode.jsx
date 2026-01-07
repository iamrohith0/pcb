// src/pages/inventory/bom/BOMExplode.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
    ArrowLeft,
    Boxes,
    Calculator,
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    Filter,
    Layers,
    Loader2,
    RefreshCw,
    Search,
    Settings2,
    ShieldCheck,
    Split,
    Wand2,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function moneyLike(n) {
  if (!Number.isFinite(n)) return "0.0000";
  return n.toFixed(4);
}

function pick(obj, keys, fallback = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("active") || s.includes("released")) return "bg-emerald-50 text-emerald-700 border";
  if (s.includes("draft")) return "bg-amber-50 text-amber-700 border";
  if (s.includes("obsolete") || s.includes("inactive")) return "bg-gray-50 text-gray-700 border";
  return "bg-white text-gray-700 border";
}

/**
 * Expected API response shape (flexible):
 * GET /inventory/bom/:id/explode?qty=1&depth=3&include_stock=true&warehouse_id=&search=
 *
 * Response can be:
 * { data: { header: {...}, rows: [...] } }
 * or { header: {...}, rows: [...] }
 *
 * Row fields we try to read:
 * - id, bom_id
 * - level (0..n), parent_id, parent_code, parent_name
 * - item_code, item_name, uom
 * - qty_per, scrap_percent
 * - required_qty (for requested build qty)
 * - available_qty (if include_stock)
 * - shortage_qty (if include_stock)
 * - unit_cost, extended_cost
 * - item_type/category
 * - make_buy
 * - lead_time_days
 * - notes/remarks
 */

export default function BOMExplode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [header, setHeader] = useState(null);
  const [rows, setRows] = useState([]);

  // Controls
  const [buildQty, setBuildQty] = useState(1);
  const [depth, setDepth] = useState(4);
  const [includeStock, setIncludeStock] = useState(true);
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");

  // UI
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [treeMode, setTreeMode] = useState(true);
  const [expanded, setExpanded] = useState(() => new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Read optional defaults from querystring (nice for deep links)
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const q = safeNum(qs.get("qty"), 1);
    const d = safeNum(qs.get("depth"), 4);
    const st = qs.get("stock");
    const wh = qs.get("warehouse_id") || "";
    const s = qs.get("search") || "";
    setBuildQty(clamp(q, 1, 999999));
    setDepth(clamp(d, 1, 20));
    if (st !== null) setIncludeStock(st === "1" || st === "true");
    setWarehouseId(wh);
    setSearch(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExplode = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {
        qty: buildQty,
        depth,
        include_stock: includeStock ? 1 : 0,
      };
      if (warehouseId) params.warehouse_id = warehouseId;
      if (search) params.search = search;

      const res = await api.get(`/inventory/bom/${id}/explode`, { params });
      const payload = res?.data?.data ?? res?.data ?? {};
      setHeader(payload.header ?? payload.bom ?? payload.header ?? null);
      setRows(Array.isArray(payload.rows) ? payload.rows : Array.isArray(payload.items) ? payload.items : []);
      toast({
        title: isRefresh ? "Refreshed" : "Loaded",
        description: `Explosion generated for qty ${buildQty}.`,
      });

      // Auto expand root on first load
      if (!isRefresh) {
        const firstRoot = (Array.isArray(payload.rows) ? payload.rows : []).find((r) => safeNum(r.level, 0) === 0);
        if (firstRoot?.id) {
          setExpanded((prev) => new Set([...prev, String(firstRoot.id)]));
        }
      }

      // sync url
      const qs = new URLSearchParams();
      qs.set("qty", String(buildQty));
      qs.set("depth", String(depth));
      qs.set("stock", includeStock ? "1" : "0");
      if (warehouseId) qs.set("warehouse_id", warehouseId);
      if (search) qs.set("search", search);
      navigate({ pathname: location.pathname, search: `?${qs.toString()}` }, { replace: true });
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to explode BOM",
        description: e?.response?.data?.message || "Server error while generating explosion.",
        variant: "destructive",
      });
      setHeader(null);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExplode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived header bits
  const hdr = useMemo(() => {
    const h = header || {};
    const product = h.product || h.item || null;
    return {
      name: pick(h, ["name", "bom_name", "bomName"], "BOM Explosion"),
      code: pick(h, ["code", "bom_code", "bomCode"], ""),
      revision: pick(h, ["revision", "rev"], "A"),
      status: pick(h, ["status"], "Active"),
      productCode: pick(product, ["code", "sku"], "") || pick(h, ["product_code", "productCode"], ""),
      productName: pick(product, ["name", "title"], "") || pick(h, ["product_name", "productName"], ""),
      uom: pick(h, ["product_uom", "productUom"], "pcs"),
      yieldPercent: safeNum(pick(h, ["yield_percent", "yieldPercent"], 100), 100),
    };
  }, [header]);

  // Normalize rows
  const normalized = useMemo(() => {
    return (rows || []).map((r, i) => {
      const level = safeNum(r.level, 0);
      const rid = String(r.id ?? r.row_id ?? `${level}-${i}`);
      const parentId = r.parent_id != null ? String(r.parent_id) : r.parentId != null ? String(r.parentId) : null;

      const item = r.item || r.material || null;
      const itemCode =
        pick(item, ["code", "sku", "item_code"], "") || pick(r, ["item_code", "code", "sku"], "");
      const itemName =
        pick(item, ["name", "title", "item_name"], "") || pick(r, ["item_name", "name"], "");
      const uom = pick(r, ["uom", "unit"], "") || pick(item, ["uom", "unit"], "");

      const qtyPer = safeNum(pick(r, ["qty_per", "qtyPer", "qty"], 0), 0);
      const scrapPct = safeNum(pick(r, ["scrap_percent", "scrapPercent", "scrap"], 0), 0);

      const requiredQty = safeNum(pick(r, ["required_qty", "requiredQty", "required"], 0), 0);
      const availableQty = safeNum(pick(r, ["available_qty", "availableQty", "available"], 0), 0);
      const shortageQty = safeNum(pick(r, ["shortage_qty", "shortageQty", "shortage"], 0), 0);

      const unitCost = safeNum(pick(r, ["unit_cost", "unitCost", "cost"], 0), 0);
      const extCost = safeNum(pick(r, ["extended_cost", "extendedCost", "line_cost", "lineCost"], 0), 0);

      const makeBuy = pick(r, ["make_buy", "makeBuy"], "");
      const leadDays = safeNum(pick(r, ["lead_time_days", "leadTimeDays"], 0), 0);
      const category = pick(r, ["category", "item_type", "type"], "Material");
      const remarks = pick(r, ["remarks", "remark", "note", "notes"], "");

      return {
        _i: i,
        id: rid,
        parentId,
        level,
        category,
        itemCode,
        itemName,
        uom,
        qtyPer,
        scrapPct,
        requiredQty,
        availableQty,
        shortageQty,
        unitCost,
        extCost,
        makeBuy,
        leadDays,
        remarks,
      };
    });
  }, [rows]);

  // Build tree index
  const tree = useMemo(() => {
    const byId = new Map();
    const children = new Map();
    const roots = [];

    for (const n of normalized) {
      byId.set(n.id, n);
      if (!children.has(n.id)) children.set(n.id, []);
    }
    for (const n of normalized) {
      if (n.parentId && byId.has(n.parentId)) {
        children.get(n.parentId).push(n.id);
      } else {
        roots.push(n.id);
      }
    }

    // Sort children by code/name for stable view
    for (const [pid, kids] of children.entries()) {
      kids.sort((a, b) => {
        const A = byId.get(a);
        const B = byId.get(b);
        return `${A?.itemCode || ""} ${A?.itemName || ""}`.localeCompare(`${B?.itemCode || ""} ${B?.itemName || ""}`);
      });
    }
    roots.sort((a, b) => {
      const A = byId.get(a);
      const B = byId.get(b);
      return `${A?.itemCode || ""} ${A?.itemName || ""}`.localeCompare(`${B?.itemCode || ""} ${B?.itemName || ""}`);
    });

    return { byId, children, roots };
  }, [normalized]);

  const totals = useMemo(() => {
    const t = {
      lines: normalized.length,
      required: 0,
      shortage: 0,
      extCost: 0,
    };
    for (const r of normalized) {
      t.required += Number.isFinite(r.requiredQty) ? r.requiredQty : 0;
      t.shortage += Number.isFinite(r.shortageQty) ? r.shortageQty : 0;
      t.extCost += Number.isFinite(r.extCost) ? r.extCost : 0;
    }
    t.required = round4(t.required);
    t.shortage = round4(t.shortage);
    t.extCost = round4(t.extCost);
    return t;
  }, [normalized]);

  const toggleExpand = (nodeId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const setAllExpanded = (expand = true) => {
    if (!treeMode) return;
    if (!expand) {
      setExpanded(new Set());
      return;
    }
    const ids = normalized.map((n) => n.id);
    setExpanded(new Set(ids));
  };

  const visibleRows = useMemo(() => {
    if (!treeMode) return normalized;

    const out = [];
    const walk = (id) => {
      const node = tree.byId.get(id);
      if (!node) return;
      out.push(node);
      const kids = tree.children.get(id) || [];
      if (!expanded.has(id)) return;
      for (const cid of kids) walk(cid);
    };
    for (const rid of tree.roots) walk(rid);
    return out;
  }, [treeMode, normalized, tree, expanded]);

  const filteredVisibleRows = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return visibleRows;

    // For tree mode: still filter rows, but keep hierarchy minimal
    // Simplified: filter by itemCode/itemName/category
    return visibleRows.filter((r) => {
      const blob = `${r.category} ${r.itemCode} ${r.itemName}`.toLowerCase();
      return blob.includes(q);
    });
  }, [visibleRows, search]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const headers = [
        "Level",
        "Category",
        "Item Code",
        "Item Name",
        "UOM",
        "Qty/Unit",
        "Scrap %",
        "Required Qty",
        "Available Qty",
        "Shortage Qty",
        "Unit Cost",
        "Extended Cost",
        "Make/Buy",
        "Lead Time (days)",
        "Remarks",
      ];

      const lines = normalized.map((r) => [
        r.level,
        r.category,
        r.itemCode,
        r.itemName,
        r.uom,
        moneyLike(r.qtyPer),
        r.scrapPct.toFixed(2),
        moneyLike(r.requiredQty),
        moneyLike(r.availableQty),
        moneyLike(r.shortageQty),
        moneyLike(r.unitCost),
        moneyLike(r.extCost),
        r.makeBuy,
        r.leadDays,
        (r.remarks || "").replace(/\r?\n/g, " "),
      ]);

      const esc = (v) => {
        const s = String(v ?? "");
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const csv = [headers.map(esc).join(","), ...lines.map((row) => row.map(esc).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `bom_explode_${id}_qty${buildQty}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Exported", description: "CSV downloaded." });
      setExportOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", description: "Could not export CSV.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const copySummary = async () => {
    const payload = {
      bom_id: id,
      bom_code: hdr.code,
      revision: hdr.revision,
      build_qty: buildQty,
      depth,
      include_stock: includeStock,
      totals,
      rows: normalized,
    };
    const ok = await copyText(JSON.stringify(payload, null, 2));
    toast({
      title: ok ? "Copied" : "Copy failed",
      description: ok ? "Explosion JSON copied to clipboard." : "Clipboard blocked by browser.",
      variant: ok ? "default" : "destructive",
    });
  };

  const hdrBadge = useMemo(() => statusTone(hdr.status), [hdr.status]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating BOM explosion...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <Split className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">BOM Explosion</h1>
              <Badge className={hdrBadge}>{hdr.status}</Badge>
              <Badge className="border bg-white text-gray-700">Rev {hdr.revision}</Badge>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {hdr.productCode ? `${hdr.productCode} — ` : ""}
              <span className="font-medium text-gray-800">{hdr.productName || hdr.name}</span>{" "}
              <span className="text-xs text-gray-500">({hdr.uom})</span>
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1">
                <Layers className="h-3.5 w-3.5" /> Lines: <span className="font-semibold text-gray-800">{totals.lines}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1">
                <Boxes className="h-3.5 w-3.5" /> Required:{" "}
                <span className="font-semibold text-gray-800 tabular-nums">{moneyLike(totals.required)}</span>
              </span>
              {includeStock && (
                <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Shortage:{" "}
                  <span className="font-semibold text-gray-800 tabular-nums">{moneyLike(totals.shortage)}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1">
                <Calculator className="h-3.5 w-3.5" /> Ext Cost:{" "}
                <span className="font-semibold text-gray-800 tabular-nums">{moneyLike(totals.extCost)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to={`/inventory/bom/${id}`}>
              <ArrowLeft className="h-4 w-4" /> Back to BOM
            </Link>
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setFiltersOpen((s) => !s)}
          >
            <Settings2 className="h-4 w-4" />
            Options
            {filtersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          <Button variant="outline" className="gap-2" onClick={copySummary}>
            <Copy className="h-4 w-4" /> Copy JSON
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" /> Export
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => fetchExplode(true)}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalculate
          </Button>
        </div>
      </div>

      {/* Options */}
      {filtersOpen && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Explosion Options
            </CardTitle>
            <CardDescription>Control depth, stock availability, and view mode</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Build Qty ({hdr.uom})</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={buildQty}
                onChange={(e) => setBuildQty(clamp(safeNum(e.target.value, 1), 1, 999999))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depth">Depth</Label>
              <Input
                id="depth"
                type="number"
                min={1}
                max={20}
                value={depth}
                onChange={(e) => setDepth(clamp(safeNum(e.target.value, 4), 1, 20))}
              />
              <p className="text-xs text-gray-500">Max recommended: 6–8 for big BOMs</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wh">Warehouse ID (optional)</Label>
              <Input
                id="wh"
                placeholder="e.g. WH-01"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              />
              <p className="text-xs text-gray-500">Used for availability/shortage</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search (server + UI)</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  className="pl-9"
                  placeholder="FR4, Copper, Soldermask..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">Filters the rendered rows</p>
            </div>

            <div className="md:col-span-4 flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant={includeStock ? "default" : "outline"}
                className={includeStock ? "bg-emerald-600 hover:bg-emerald-700" : "gap-2"}
                onClick={() => setIncludeStock((s) => !s)}
              >
                {includeStock ? (
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Stock: ON
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Stock: OFF
                  </span>
                )}
              </Button>

              <Button
                variant={treeMode ? "default" : "outline"}
                className={treeMode ? "bg-slate-900 hover:bg-slate-800" : ""}
                onClick={() => setTreeMode(true)}
              >
                Tree View
              </Button>

              <Button
                variant={!treeMode ? "default" : "outline"}
                className={!treeMode ? "bg-slate-900 hover:bg-slate-800" : ""}
                onClick={() => setTreeMode(false)}
              >
                Flat View
              </Button>

              {treeMode && (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => setAllExpanded(true)}>
                    <Wand2 className="h-4 w-4" /> Expand all
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setAllExpanded(false)}>
                    <Wand2 className="h-4 w-4" /> Collapse all
                  </Button>
                </>
              )}

              <Button
                className="ml-auto gap-2 bg-cyan-600 hover:bg-cyan-500"
                onClick={() => fetchExplode(true)}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Apply & Recalculate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Exploded Requirements</CardTitle>
          <CardDescription>
            Required quantities for build qty <span className="font-medium text-gray-800">{buildQty}</span>{" "}
            (depth {depth}) {includeStock ? "with availability/shortage" : ""}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {filteredVisibleRows.length === 0 ? (
            <div className="rounded-2xl border bg-gray-50 p-6 text-sm text-gray-600">
              No rows match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-[1200px] w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr className="text-left">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">UOM</th>
                    <th className="px-3 py-2 text-right">Qty/Unit</th>
                    <th className="px-3 py-2 text-right">Scrap %</th>
                    <th className="px-3 py-2 text-right">Required</th>
                    {includeStock && <th className="px-3 py-2 text-right">Available</th>}
                    {includeStock && <th className="px-3 py-2 text-right">Shortage</th>}
                    <th className="px-3 py-2 text-right">Unit Cost</th>
                    <th className="px-3 py-2 text-right">Ext Cost</th>
                    <th className="px-3 py-2">Make/Buy</th>
                    <th className="px-3 py-2 text-right">Lead Days</th>
                    <th className="px-3 py-2">Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVisibleRows.map((r) => {
                    const kids = tree.children.get(r.id) || [];
                    const hasKids = kids.length > 0;

                    const indent = treeMode ? clamp(r.level, 0, 10) : 0;
                    const shortageBad = includeStock && r.shortageQty > 0.000001;

                    return (
                      <tr key={r.id} className={cx("border-t", r._i % 2 === 0 ? "bg-white" : "bg-gray-50/40")}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {treeMode ? (
                              <div className="flex items-center" style={{ marginLeft: indent * 14 }}>
                                {hasKids ? (
                                  <button
                                    className="mr-1 rounded-md p-1 text-gray-600 hover:bg-gray-100"
                                    onClick={() => toggleExpand(r.id)}
                                    title={expanded.has(r.id) ? "Collapse" : "Expand"}
                                  >
                                    {expanded.has(r.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="mr-1 inline-block w-6" />
                                )}
                              </div>
                            ) : null}

                            <div>
                              <div className="font-medium text-gray-900">
                                {r.itemCode ? `${r.itemCode} — ` : ""}
                                {r.itemName || "—"}
                              </div>
                              <div className="text-xs text-gray-500">Level {r.level}</div>
                            </div>

                            {hasKids && (
                              <Badge className="ml-auto border bg-white text-gray-700">
                                {kids.length} sub
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <Badge className="border bg-white text-gray-700">{r.category}</Badge>
                        </td>

                        <td className="px-3 py-2 text-gray-700">{r.uom || "—"}</td>

                        <td className="px-3 py-2 text-right tabular-nums">{moneyLike(r.qtyPer)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.scrapPct.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{moneyLike(r.requiredQty)}</td>

                        {includeStock && (
                          <td className="px-3 py-2 text-right tabular-nums">{moneyLike(r.availableQty)}</td>
                        )}

                        {includeStock && (
                          <td className={cx("px-3 py-2 text-right tabular-nums font-semibold", shortageBad ? "text-red-600" : "text-gray-800")}>
                            {moneyLike(r.shortageQty)}
                          </td>
                        )}

                        <td className="px-3 py-2 text-right tabular-nums">{moneyLike(r.unitCost)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{moneyLike(r.extCost)}</td>

                        <td className="px-3 py-2 text-gray-700">{r.makeBuy || "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.leadDays || 0}</td>
                        <td className="px-3 py-2 text-gray-700">{r.remarks || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Totals:</span>{" "}
                Required <span className="tabular-nums font-medium">{moneyLike(totals.required)}</span>
                {includeStock ? (
                  <>
                    {" "}
                    • Shortage <span className="tabular-nums font-medium">{moneyLike(totals.shortage)}</span>
                  </>
                ) : null}
                {" "}
                • Ext Cost <span className="tabular-nums font-medium">{moneyLike(totals.extCost)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" className="gap-2" onClick={copySummary}>
                  <Copy className="h-4 w-4" /> Copy JSON
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <AlertDialog open={exportOpen} onOpenChange={setExportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Explosion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Download the exploded requirement rows as CSV.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={exporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={exportCSV} disabled={exporting}>
              {exporting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </span>
              ) : (
                "Download CSV"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
