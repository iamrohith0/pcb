// src/pages/inventory/bom/BOMDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  Calculator,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Truck,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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
    // fallback
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

export default function BOMDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [bom, setBom] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Adjust endpoint if needed
      const res = await api.get(`/inventory/bom/${id}`);
      const data = res?.data?.data ?? res?.data ?? null;
      setBom(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load BOM",
        description: e?.response?.data?.message || "BOM not found or server error.",
        variant: "destructive",
      });
      setBom(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.get(`/inventory/bom/${id}`);
      const data = res?.data?.data ?? res?.data ?? null;
      setBom(data);
      toast({ title: "Refreshed", description: "BOM updated." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Refresh failed",
        description: e?.response?.data?.message || "Could not refresh BOM.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const header = useMemo(() => {
    const h = bom || {};
    const product = h.product || h.finished_product || h.item || null;

    const productCode =
      pick(product, ["code", "sku", "part_no", "partNo"]) || pick(h, ["product_code", "productCode"], "");
    const productName =
      pick(product, ["name", "title", "description"]) || pick(h, ["product_name", "productName"], "");
    const productUom = pick(h, ["product_uom", "productUom"], "pcs");
    const revision = pick(h, ["revision", "rev"], "A");
    const layers = pick(h, ["layers"], "");
    const bpp = pick(h, ["boards_per_panel", "boardsPerPanel", "panel_qty"], "");
    const yieldPercent = safeNum(pick(h, ["yield_percent", "yieldPercent"], 100), 100);

    const code = pick(h, ["code", "bom_code", "bomCode"], "");
    const name = pick(h, ["name", "bom_name", "bomName"], "BOM");
    const status = pick(h, ["status"], "Active");

    return {
      name,
      code,
      revision,
      status,
      productCode,
      productName,
      productUom,
      layers,
      bpp,
      yieldPercent,
      notes: pick(h, ["notes", "remark", "remarks"], ""),
      createdAt: pick(h, ["created_at", "createdAt"], ""),
      updatedAt: pick(h, ["updated_at", "updatedAt"], ""),
    };
  }, [bom]);

  const lines = useMemo(() => {
    const raw = bom?.lines || bom?.items || bom?.bom_lines || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((ln, idx) => {
      const item = ln.item || ln.material || null;
      const itemCode = pick(item, ["code", "item_code", "sku"], "") || pick(ln, ["item_code", "code"], "");
      const itemName = pick(item, ["name", "item_name", "title"], "") || pick(ln, ["item_name", "name"], "");
      const uom = pick(ln, ["uom", "unit"], "") || pick(item, ["uom", "unit"], "");
      const qtyPer = safeNum(pick(ln, ["qty_per", "qtyPer", "qty"], 0), 0);
      const scrapPct = safeNum(pick(ln, ["scrap_percent", "scrapPercent", "scrap"], 0), 0);
      const unitCost = safeNum(pick(ln, ["unit_cost", "unitCost", "cost"], 0), 0);
      const category = pick(ln, ["category", "type"], "Material");
      const whName =
        pick(ln?.warehouse, ["name", "warehouse_name"], "") ||
        pick(ln, ["warehouse_name"], "") ||
        "";

      const remarks = pick(ln, ["remarks", "remark", "note"], "");

      const effectiveQty = qtyPer * (1 + scrapPct / 100);
      const lineCost = effectiveQty * unitCost;

      return {
        _idx: idx + 1,
        category,
        itemCode,
        itemName,
        uom,
        qtyPer,
        scrapPct,
        unitCost,
        whName,
        remarks,
        effectiveQty,
        lineCost,
      };
    });
  }, [bom]);

  const costRaw = useMemo(() => round4(lines.reduce((s, l) => s + (Number.isFinite(l.lineCost) ? l.lineCost : 0), 0)), [lines]);
  const yieldFactor = useMemo(() => {
    const y = safeNum(header.yieldPercent, 100);
    const c = Math.min(100, Math.max(1, y));
    return c / 100;
  }, [header.yieldPercent]);
  const costGood = useMemo(() => round4(costRaw / yieldFactor), [costRaw, yieldFactor]);

  const onCopy = async (text, label = "Copied") => {
    const ok = await copyText(text);
    toast({
      title: ok ? label : "Copy failed",
      description: ok ? "Copied to clipboard." : "Your browser blocked clipboard access.",
      variant: ok ? "default" : "destructive",
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Adjust endpoint if needed
      await api.delete(`/inventory/bom/${id}`);
      toast({ title: "Deleted", description: "BOM removed successfully." });
      navigate("/inventory/bom", { replace: true });
    } catch (e) {
      console.error(e);
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || "Could not delete BOM.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading BOM...
        </div>
      </div>
    );
  }

  if (!bom) {
    return (
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">BOM not found</CardTitle>
            <CardDescription>The BOM may have been deleted or you don’t have access.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/inventory/bom">
                <ArrowLeft className="h-4 w-4" /> Back to BOMs
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{header.name}</h1>
              <Badge className="border bg-white text-gray-700">Rev {header.revision}</Badge>
              <Badge className={cx("border", header.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-700")}>
                {header.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Finished Product:{" "}
              <span className="font-medium text-gray-800">
                {header.productCode ? `${header.productCode} — ` : ""}
                {header.productName || "—"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/inventory/bom">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          {/* If you later implement edit route */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => toast({ title: "Edit not added", description: "Create BOMEdit.jsx route when ready." })}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Costing Snapshot
            </CardTitle>
            <CardDescription>Material + scrap + yield adjustment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Raw cost (with scrap)</span>
              <span className="font-semibold">{moneyLike(costRaw)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Yield %</span>
              <span className="font-semibold">{safeNum(header.yieldPercent, 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Cost / good unit</span>
              <span className="font-semibold">{moneyLike(costGood)}</span>
            </div>
            <p className="pt-2 text-xs text-gray-500">
              Final costing usually also includes routing/machine time + overhead + process scrap analysis.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> BOM Metadata
            </CardTitle>
            <CardDescription>Quick reference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">BOM Code</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{header.code || "—"}</span>
                {header.code ? (
                  <button
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                    onClick={() => onCopy(header.code, "BOM code copied")}
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">UOM</span>
              <span className="font-medium text-gray-800">{header.productUom || "pcs"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Layers</span>
              <span className="font-medium text-gray-800">{header.layers || "—"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Boards/Panel</span>
              <span className="font-medium text-gray-800">{header.bpp || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Notes
            </CardTitle>
            <CardDescription>Process / vendor constraints</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {header.notes?.trim() ? header.notes : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lines Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">BOM Lines</CardTitle>
          <CardDescription>
            Materials, chemicals, tooling, outsource steps (per 1 finished unit)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {lines.length === 0 ? (
            <div className="rounded-2xl border bg-gray-50 p-6 text-sm text-gray-600">
              No lines found for this BOM.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr className="text-left">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">UOM</th>
                    <th className="px-3 py-2 text-right">Qty/Unit</th>
                    <th className="px-3 py-2 text-right">Scrap %</th>
                    <th className="px-3 py-2 text-right">Eff. Qty</th>
                    <th className="px-3 py-2 text-right">Unit Cost</th>
                    <th className="px-3 py-2 text-right">Line Cost</th>
                    <th className="px-3 py-2">Warehouse</th>
                    <th className="px-3 py-2">Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {lines.map((l) => (
                    <tr key={l._idx} className={cx("border-t", l._idx % 2 === 0 ? "bg-white" : "bg-gray-50/40")}>
                      <td className="px-3 py-2 text-gray-600">{l._idx}</td>
                      <td className="px-3 py-2">
                        <Badge className="border bg-white text-gray-700">{l.category}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">
                          {l.itemCode ? `${l.itemCode} — ` : ""}
                          {l.itemName || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{l.uom || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{moneyLike(l.qtyPer)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{safeNum(l.scrapPct, 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{moneyLike(l.effectiveQty)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{moneyLike(l.unitCost)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{moneyLike(l.lineCost)}</td>
                      <td className="px-3 py-2 text-gray-700">{l.whName || "—"}</td>
                      <td className="px-3 py-2 text-gray-700">{l.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t bg-gray-50">
                    <td className="px-3 py-2" colSpan={8}>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Truck className="h-4 w-4" />
                        This view is for planning & costing. Manufacturing routing & process steps are handled in Production/Routing.
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{moneyLike(costRaw)}</td>
                    <td className="px-3 py-2" colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Cost / good unit:</span>{" "}
                <span className="tabular-nums">{moneyLike(costGood)}</span>{" "}
                <span className="text-xs text-gray-500">(Yield adjusted)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    onCopy(
                      JSON.stringify(
                        {
                          bom_id: id,
                          name: header.name,
                          revision: header.revision,
                          raw_cost: costRaw,
                          yield_percent: header.yieldPercent,
                          cost_per_good_unit: costGood,
                        },
                        null,
                        2
                      ),
                      "Cost summary copied"
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                  Copy Summary
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              Delete BOM?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{header.name}</span> (Rev {header.revision}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
