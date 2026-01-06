// src/pages/traceability/lot-genealogy/SupplierTrace.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  FileSearch2,
  Link2,
  Loader2,
  Package,
  Route,
  ScanSearch,
  Truck,
  RefreshCw,
  Hash,
  ShoppingBag,
  MapPin,
  Calendar,
  ClipboardList,
  Layers,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function pillClass(kind) {
  switch (kind) {
    case "success":
      return "border-green-200 bg-green-50 text-green-700";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

/**
 * PCBxpress ERP - Supplier Trace (Supplier -> Lots -> GRNs -> POs -> Work Orders)
 * Folder: src/pages/traceability/lot-genealogy/SupplierTrace.jsx
 *
 * Primary use cases:
 * - Given a Supplier + Lot/Batch/Serial, quickly see where that material went.
 * - Supplier audit, recall support, incoming quality investigations.
 *
 * Suggested backend endpoints (adapt to your backend):
 * - GET /traceability/supplier-trace?query=...  (query can be supplier name/code, PO, GRN, lot, invoice)
 *   returns:
 *   {
 *     supplier: {...},
 *     purchase_orders: [...],
 *     grns: [...],
 *     lots: [...],
 *     consumptions: [...],  // issue transactions to WOs
 *     work_orders: [...],
 *     shipments: [...]
 *   }
 */

export default function SupplierTrace() {
  const { toast } = useToast();
  const [sp] = useSearchParams();

  const initialQuery = sp.get("q") || sp.get("query") || "";
  const [query, setQuery] = useState(initialQuery);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const supplier = useMemo(() => result?.supplier ?? null, [result]);
  const purchaseOrders = useMemo(() => (Array.isArray(result?.purchase_orders) ? result.purchase_orders : []), [result]);
  const grns = useMemo(() => (Array.isArray(result?.grns) ? result.grns : []), [result]);
  const lots = useMemo(() => (Array.isArray(result?.lots) ? result.lots : []), [result]);
  const consumptions = useMemo(() => (Array.isArray(result?.consumptions) ? result.consumptions : []), [result]);
  const workOrders = useMemo(() => (Array.isArray(result?.work_orders) ? result.work_orders : []), [result]);
  const shipments = useMemo(() => (Array.isArray(result?.shipments) ? result.shipments : []), [result]);

  const summary = useMemo(() => {
    const items = lots.length || 0;
    const poCount = purchaseOrders.length || 0;
    const grnCount = grns.length || 0;
    const woCount = workOrders.length || 0;
    const shipCount = shipments.length || 0;
    return { items, poCount, grnCount, woCount, shipCount };
  }, [lots.length, purchaseOrders.length, grns.length, workOrders.length, shipments.length]);

  const runTrace = async (q) => {
    const v = (q ?? query).trim();
    if (!v) {
      toast({
        title: "Enter a search value",
        description: "Try Supplier code/name, PO number, GRN number, Lot/Batch, Invoice number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/traceability/supplier-trace`, { params: { query: v } });
      const data = res?.data?.data ?? res?.data ?? null;

      setResult(data);

      if (!data) {
        toast({ title: "No data", description: "No trace data returned." });
      } else {
        toast({ title: "Trace Ready", description: "Supplier trace loaded successfully." });
      }
    } catch (err) {
      console.error(err);
      setResult(null);
      toast({
        title: "Trace failed",
        description: err?.response?.data?.message || "Unable to run supplier trace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) runTrace(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chips = [
    { label: "Supplier", icon: Building2, hint: "Supplier code/name" },
    { label: "PO", icon: ShoppingBag, hint: "PO number" },
    { label: "GRN", icon: ClipboardList, hint: "GRN number" },
    { label: "Lot/Batch", icon: Hash, hint: "Lot or batch id" },
    { label: "Invoice", icon: FileSearch2, hint: "Supplier invoice" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="border bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#dc2551]/10 p-3">
                  <Route className="h-6 w-6 text-[#dc2551]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Supplier Trace</CardTitle>
                  <CardDescription>
                    Trace materials from supplier → PO/GRN → lots → consumption → work orders → shipments.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="ghost" className="gap-2">
                  <Link to="/traceability/lot-genealogy">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => runTrace(query)}
                  disabled={loading}
                >
                  <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Search */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="q">Search</Label>
                <div className="relative">
                  <ScanSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Supplier: ABC / PO: PO-00021 / GRN: GRN-0091 / Lot: LOT-5A / Invoice: INV-778"
                    className="pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runTrace(query);
                      }
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <Badge key={c.label} className={cx("border", pillClass("default"))}>
                      <c.icon className="mr-1 h-3.5 w-3.5" />
                      {c.label}: <span className="ml-1 text-gray-600">{c.hint}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  className="w-full gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                  onClick={() => runTrace(query)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch2 className="h-4 w-4" />}
                  Run Trace
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-600">Lots</div>
                <div className="mt-1 text-lg font-bold text-gray-800">{summary.items}</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-600">POs</div>
                <div className="mt-1 text-lg font-bold text-gray-800">{summary.poCount}</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-600">GRNs</div>
                <div className="mt-1 text-lg font-bold text-gray-800">{summary.grnCount}</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-600">Work Orders</div>
                <div className="mt-1 text-lg font-bold text-gray-800">{summary.woCount}</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-600">Shipments</div>
                <div className="mt-1 text-lg font-bold text-gray-800">{summary.shipCount}</div>
              </div>
            </div>

            {/* Supplier Header */}
            <div className="mt-4">
              <Card className="border bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-[#dc2551]/10 p-3">
                        <Building2 className="h-5 w-5 text-[#dc2551]" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Supplier</CardTitle>
                        <CardDescription className="text-xs">Supplier master details (if matched).</CardDescription>
                      </div>
                    </div>
                    {supplier ? (
                      <Badge className={cx("border", pillClass("success"))}>Matched</Badge>
                    ) : (
                      <Badge className={cx("border", pillClass("warn"))}>Not Matched</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {!supplier ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <div>
                          <div className="font-semibold">Supplier not directly identified</div>
                          <div className="text-xs text-amber-700">
                            The trace may still work via PO/GRN/Lot. Improve matching by searching supplier code/name.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-semibold text-gray-600">Supplier Code</div>
                        <div className="mt-1 text-sm font-semibold text-gray-800">
                          {safe(supplier.code ?? supplier.supplier_code)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-semibold text-gray-600">Name</div>
                        <div className="mt-1 text-sm font-semibold text-gray-800">{safe(supplier.name)}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                          <MapPin className="h-3.5 w-3.5" /> Location
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-800">
                          {safe(supplier.city ?? supplier.location)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-semibold text-gray-600">Status</div>
                        <div className="mt-1 text-sm font-semibold text-gray-800">
                          {safe(supplier.status ?? supplier.is_active ? "Active" : "—")}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Timeline Blocks */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* POs */}
              <Card className="border bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-[#dc2551]" />
                      <CardTitle className="text-sm">Purchase Orders</CardTitle>
                    </div>
                    <Badge className={cx("border", pillClass("default"))}>{purchaseOrders.length}</Badge>
                  </div>
                  <CardDescription className="text-xs">Upstream procurement documents.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-3 py-2">PO No</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Open</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {purchaseOrders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500">
                              No purchase orders found.
                            </td>
                          </tr>
                        ) : (
                          purchaseOrders.map((po) => {
                            const id = po.id ?? po._id ?? po.po_id ?? JSON.stringify(po);
                            const poNo = po.po_no ?? po.number ?? po.code ?? "—";
                            const date = po.date ?? po.po_date ?? po.created_at ?? "—";
                            const status = po.status ?? "—";
                            return (
                              <tr key={id} className="text-sm">
                                <td className="px-3 py-3 font-semibold text-gray-800">{safe(poNo)}</td>
                                <td className="px-3 py-3 text-gray-700">
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    {safe(date)}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <Badge className={cx("border", pillClass(status === "Cancelled" ? "danger" : "default"))}>
                                    {safe(status)}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <Button asChild variant="ghost" className="gap-2">
                                    <Link to={`/procurement/purchase-orders/details?po_id=${encodeURIComponent(poNo)}`}>
                                      <ExternalLink className="h-4 w-4" />
                                      Open
                                    </Link>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* GRNs */}
              <Card className="border bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-[#dc2551]" />
                      <CardTitle className="text-sm">GRNs</CardTitle>
                    </div>
                    <Badge className={cx("border", pillClass("default"))}>{grns.length}</Badge>
                  </div>
                  <CardDescription className="text-xs">Goods receipts where lots were created.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-3 py-2">GRN No</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Warehouse</th>
                          <th className="px-3 py-2 text-right">Open</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {grns.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500">
                              No GRNs found.
                            </td>
                          </tr>
                        ) : (
                          grns.map((g) => {
                            const id = g.id ?? g._id ?? g.grn_id ?? JSON.stringify(g);
                            const grnNo = g.grn_no ?? g.number ?? g.code ?? "—";
                            const date = g.date ?? g.grn_date ?? g.created_at ?? "—";
                            const wh = g.warehouse ?? g.warehouse_name ?? "—";
                            return (
                              <tr key={id} className="text-sm">
                                <td className="px-3 py-3 font-semibold text-gray-800">{safe(grnNo)}</td>
                                <td className="px-3 py-3 text-gray-700">
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    {safe(date)}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-gray-700">{safe(wh)}</td>
                                <td className="px-3 py-3 text-right">
                                  <Button asChild variant="ghost" className="gap-2">
                                    <Link to={`/procurement/grn/details?grn_id=${encodeURIComponent(grnNo)}`}>
                                      <ExternalLink className="h-4 w-4" />
                                      Open
                                    </Link>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Lots */}
              <Card className="border bg-white lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[#dc2551]" />
                      <CardTitle className="text-sm">Lots / Batches</CardTitle>
                    </div>
                    <Badge className={cx("border", pillClass("default"))}>{lots.length}</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Material identities used for traceability and recall.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-3 py-2">Lot</th>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Qty</th>
                          <th className="px-3 py-2">UOM</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {lots.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                              No lots found.
                            </td>
                          </tr>
                        ) : (
                          lots.map((l) => {
                            const id = l.id ?? l._id ?? l.lot_id ?? JSON.stringify(l);
                            const lot = l.lot_no ?? l.lot ?? l.batch_no ?? "—";
                            const item = l.item_name ?? l.item?.name ?? l.item ?? "—";
                            const qty = l.qty ?? l.quantity ?? "—";
                            const uom = l.uom ?? "—";
                            const status = l.status ?? "—";
                            return (
                              <tr key={id} className="text-sm">
                                <td className="px-3 py-3 font-mono text-xs text-gray-800">{safe(lot)}</td>
                                <td className="px-3 py-3 font-semibold text-gray-800">{safe(item)}</td>
                                <td className="px-3 py-3 text-gray-700">{safe(qty)}</td>
                                <td className="px-3 py-3 text-gray-700">{safe(uom)}</td>
                                <td className="px-3 py-3">
                                  <Badge className={cx("border", pillClass(status === "Quarantine" ? "warn" : "default"))}>
                                    {safe(status)}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Consumption */}
              <Card className="border bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-[#dc2551]" />
                      <CardTitle className="text-sm">Consumptions</CardTitle>
                    </div>
                    <Badge className={cx("border", pillClass("default"))}>{consumptions.length}</Badge>
                  </div>
                  <CardDescription className="text-xs">Issue transactions from stores to production.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-3 py-2">WO</th>
                          <th className="px-3 py-2">Lot</th>
                          <th className="px-3 py-2">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {consumptions.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-6 text-center text-sm text-gray-500">
                              No consumption transactions found.
                            </td>
                          </tr>
                        ) : (
                          consumptions.map((c) => {
                            const id = c.id ?? c._id ?? JSON.stringify(c);
                            const wo = c.work_order_no ?? c.wo_no ?? c.wo ?? "—";
                            const lot = c.lot_no ?? c.lot ?? "—";
                            const qty = c.qty ?? c.quantity ?? "—";
                            return (
                              <tr key={id} className="text-sm">
                                <td className="px-3 py-3 font-semibold text-gray-800">{safe(wo)}</td>
                                <td className="px-3 py-3 font-mono text-xs text-gray-700">{safe(lot)}</td>
                                <td className="px-3 py-3 text-gray-700">{safe(qty)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Work Orders */}
              <Card className="border bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#dc2551]" />
                      <CardTitle className="text-sm">Work Orders</CardTitle>
                    </div>
                    <Badge className={cx("border", pillClass("default"))}>{workOrders.length}</Badge>
                  </div>
                  <CardDescription className="text-xs">Manufacturing lots/boards where supplier material was used.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-3 py-2">WO No</th>
                          <th className="px-3 py-2">Part</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Open</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {workOrders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500">
                              No work orders found.
                            </td>
                          </tr>
                        ) : (
                          workOrders.map((w) => {
                            const id = w.id ?? w._id ?? w.wo_id ?? JSON.stringify(w);
                            const wo = w.wo_no ?? w.work_order_no ?? "—";
                            const part = w.part_no ?? w.pcb_part_no ?? w.part ?? "—";
                            const status = w.status ?? "—";
                            return (
                              <tr key={id} className="text-sm">
                                <td className="px-3 py-3 font-semibold text-gray-800">{safe(wo)}</td>
                                <td className="px-3 py-3 text-gray-700">{safe(part)}</td>
                                <td className="px-3 py-3">
                                  <Badge className={cx("border", pillClass(status === "Hold" ? "warn" : "default"))}>
                                    {safe(status)}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <Button asChild variant="ghost" className="gap-2">
                                    <Link to={`/production/work-orders/details?wo_no=${encodeURIComponent(wo)}`}>
                                      <ExternalLink className="h-4 w-4" />
                                      Open
                                    </Link>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Shipments */}
              <Card className="border bg-white lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[#dc2551]" />
                      <CardTitle className="text-sm">Shipments</CardTitle>
                    </div>
                    <Badge className={cx("border", pillClass("default"))}>{shipments.length}</Badge>
                  </div>
                  <CardDescription className="text-xs">Outbound trace (dispatch → shipment → tracking).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold text-gray-600">
                          <th className="px-3 py-2">Shipment</th>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Open</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {shipments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                              No shipments found.
                            </td>
                          </tr>
                        ) : (
                          shipments.map((s) => {
                            const id = s.id ?? s._id ?? s.shipment_id ?? JSON.stringify(s);
                            const shipNo = s.shipment_no ?? s.number ?? "—";
                            const cust = s.customer_name ?? s.customer ?? "—";
                            const date = s.date ?? s.ship_date ?? s.created_at ?? "—";
                            const status = s.status ?? "—";
                            return (
                              <tr key={id} className="text-sm">
                                <td className="px-3 py-3 font-semibold text-gray-800">{safe(shipNo)}</td>
                                <td className="px-3 py-3 text-gray-700">{safe(cust)}</td>
                                <td className="px-3 py-3 text-gray-700">
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    {safe(date)}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <Badge className={cx("border", pillClass(status === "Delivered" ? "success" : "default"))}>
                                    {safe(status)}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <Button asChild variant="ghost" className="gap-2">
                                    <Link to={`/logistics/shipments/details?shipment_no=${encodeURIComponent(shipNo)}`}>
                                      <ExternalLink className="h-4 w-4" />
                                      Open
                                    </Link>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer note */}
            <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <span className="font-semibold text-gray-700">Recall readiness:</span> For a real recall workflow, keep
                  strict lot creation at GRN, enforce issue-to-WO by lot, and ship by WO/lot mapping.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
