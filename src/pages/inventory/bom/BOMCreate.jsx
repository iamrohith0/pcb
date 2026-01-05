// src/pages/inventory/bom/BOMCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
  FileUp,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
  XCircle,
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

const DEFAULT_UOM = "pcs";

export default function BOMCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadingMasters, setLoadingMasters] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form: Header
  const [bomName, setBomName] = useState("");
  const [bomCode, setBomCode] = useState("");
  const [revision, setRevision] = useState("A");
  const [productId, setProductId] = useState("");
  const [productUom, setProductUom] = useState(DEFAULT_UOM);
  const [layers, setLayers] = useState("2");
  const [panelization, setPanelization] = useState("1"); // number of boards per panel (optional)
  const [yieldPercent, setYieldPercent] = useState("98"); // expected yield %
  const [notes, setNotes] = useState("");

  // Masters
  const [products, setProducts] = useState([]); // Finished goods / PCB part numbers
  const [items, setItems] = useState([]); // Raw materials & consumables
  const [warehouses, setWarehouses] = useState([]); // optional

  // BOM Lines
  const [lines, setLines] = useState([
    {
      item_id: "",
      item_code: "",
      item_name: "",
      uom: "",
      qty_per: "1",
      scrap_percent: "0",
      unit_cost: "",
      warehouse_id: "",
      remarks: "",
      category: "Material", // Material | Chemical | Tooling | Outsource | Other
    },
  ]);

  // Confirm dialogs
  const [resetOpen, setResetOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  // --- load masters
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingMasters(true);
      try {
        // Adjust these endpoints as per your backend
        const [productsRes, itemsRes, whRes] = await Promise.allSettled([
          api.get("/inventory/products"),
          api.get("/inventory/items"),
          api.get("/masters/warehouses"),
        ]);

        if (!mounted) return;

        const p = productsRes.status === "fulfilled" ? (productsRes.value?.data?.data ?? productsRes.value?.data) : [];
        const it = itemsRes.status === "fulfilled" ? (itemsRes.value?.data?.data ?? itemsRes.value?.data) : [];
        const w = whRes.status === "fulfilled" ? (whRes.value?.data?.data ?? whRes.value?.data) : [];

        setProducts(Array.isArray(p?.items) ? p.items : Array.isArray(p) ? p : []);
        setItems(Array.isArray(it?.items) ? it.items : Array.isArray(it) ? it : []);
        setWarehouses(Array.isArray(w?.items) ? w.items : Array.isArray(w) ? w : []);
      } catch (err) {
        console.error(err);
        toast({
          title: "Masters load failed",
          description: "Could not load products/materials. You can still type codes manually.",
          variant: "destructive",
        });
      } finally {
        setLoadingMasters(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProduct = useMemo(() => {
    const p = products.find((x) => String(x.id ?? x.product_id) === String(productId));
    return p || null;
  }, [products, productId]);

  useEffect(() => {
    // if product has uom, auto set
    const u = selectedProduct?.uom ?? selectedProduct?.unit ?? "";
    if (u) setProductUom(u);
  }, [selectedProduct]);

  const findItem = (id) => items.find((x) => String(x.id ?? x.item_id) === String(id));

  const setLine = (index, patch) => {
    setLines((prev) => prev.map((ln, i) => (i === index ? { ...ln, ...patch } : ln)));
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        item_id: "",
        item_code: "",
        item_name: "",
        uom: "",
        qty_per: "1",
        scrap_percent: "0",
        unit_cost: "",
        warehouse_id: "",
        remarks: "",
        category: "Material",
      },
    ]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const headerCost = useMemo(() => {
    // Estimate BOM cost per 1 PCB (or per product UOM)
    let total = 0;
    for (const ln of lines) {
      const qty = safeNum(ln.qty_per, 0);
      const scrap = safeNum(ln.scrap_percent, 0);
      const cost = safeNum(ln.unit_cost, 0);
      const effectiveQty = qty * (1 + scrap / 100);
      total += effectiveQty * cost;
    }
    return round4(total);
  }, [lines]);

  const effectiveYieldFactor = useMemo(() => {
    const y = safeNum(yieldPercent, 100);
    const clamped = Math.min(100, Math.max(1, y));
    return clamped / 100;
  }, [yieldPercent]);

  const costWithYield = useMemo(() => {
    // If yield is 98%, cost per good unit increases slightly.
    return round4(headerCost / effectiveYieldFactor);
  }, [headerCost, effectiveYieldFactor]);

  const validate = () => {
    if (!bomName.trim()) return "BOM name is required.";
    if (!revision.trim()) return "Revision is required.";
    if (!productId) return "Please select a finished PCB product (Part No).";
    if (lines.length === 0) return "Add at least one BOM line item.";

    const bad = lines.find((ln) => !ln.item_id && !ln.item_code && !ln.item_name);
    if (bad) return "Each BOM line must have an item selected (or item code/name filled).";

    const badQty = lines.find((ln) => safeNum(ln.qty_per, -1) <= 0);
    if (badQty) return "Each BOM line must have Qty/Unit greater than 0.";

    const y = safeNum(yieldPercent, 0);
    if (y <= 0 || y > 100) return "Yield % must be between 1 and 100.";

    return null;
  };

  const buildPayload = () => {
    return {
      name: bomName.trim(),
      code: bomCode.trim() || undefined,
      revision: revision.trim(),
      product_id: productId,
      product_uom: productUom || DEFAULT_UOM,
      layers: safeNum(layers, 2),
      boards_per_panel: safeNum(panelization, 1),
      yield_percent: safeNum(yieldPercent, 100),
      notes: notes?.trim() || "",
      lines: lines.map((ln) => ({
        item_id: ln.item_id || undefined,
        item_code: ln.item_code?.trim() || undefined,
        item_name: ln.item_name?.trim() || undefined,
        uom: ln.uom?.trim() || undefined,
        category: ln.category || "Material",
        qty_per: safeNum(ln.qty_per, 0),
        scrap_percent: safeNum(ln.scrap_percent, 0),
        unit_cost: ln.unit_cost === "" ? undefined : safeNum(ln.unit_cost, 0),
        warehouse_id: ln.warehouse_id || undefined,
        remarks: ln.remarks?.trim() || "",
      })),
    };
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Validation error", description: err, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();

      // Adjust endpoint to your backend:
      // POST /inventory/bom
      const res = await api.post("/inventory/bom", payload);
      const created = res?.data?.data ?? res?.data ?? {};
      const id = created?.id ?? created?.bom_id;

      toast({
        title: "BOM created",
        description: "Bill of Materials saved successfully.",
      });

      if (id) navigate(`/inventory/bom/${id}`, { replace: true });
      else navigate("/inventory/bom", { replace: true });
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        "Could not create BOM. Please check your server and try again.";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setSubmitOpen(false);
    }
  };

  const resetForm = () => {
    setBomName("");
    setBomCode("");
    setRevision("A");
    setProductId("");
    setProductUom(DEFAULT_UOM);
    setLayers("2");
    setPanelization("1");
    setYieldPercent("98");
    setNotes("");
    setLines([
      {
        item_id: "",
        item_code: "",
        item_name: "",
        uom: "",
        qty_per: "1",
        scrap_percent: "0",
        unit_cost: "",
        warehouse_id: "",
        remarks: "",
        category: "Material",
      },
    ]);
    setResetOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create BOM</h1>
            <p className="mt-1 text-sm text-gray-500">
              Define PCB manufacturing materials & consumables per unit (lamination, drilling, plating, solder mask, etc.)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/inventory/bom">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => setResetOpen(true)} disabled={submitting}>
            <XCircle className="h-4 w-4" />
            Reset
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => setSubmitOpen(true)}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save BOM
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Cost Estimate
            </CardTitle>
            <CardDescription>Approx per good unit considering scrap & yield</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Material cost (raw)</span>
              <span className="font-semibold">{headerCost.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Yield %</span>
              <span className="font-semibold">{safeNum(yieldPercent, 0).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Cost / good unit</span>
              <span className="font-semibold">{costWithYield.toFixed(4)}</span>
            </div>
            <p className="pt-2 text-xs text-gray-500">
              This is a quick estimate. Final costing typically includes routing, machine time, overhead & scrap analysis.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> BOM Lines
            </CardTitle>
            <CardDescription>Count and completeness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total lines</span>
              <span className="font-semibold">{lines.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Missing items</span>
              <span className="font-semibold">
                {lines.filter((l) => !l.item_id && !l.item_code && !l.item_name).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Has unit costs</span>
              <span className="font-semibold">{lines.filter((l) => l.unit_cost !== "").length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileUp className="h-4 w-4" /> Import (optional)
            </CardTitle>
            <CardDescription>CSV upload can be added later</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              You can later add a CSV import button for BOM lines (item_code, qty_per, scrap%, cost).
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-gray-500">
              <Badge className="border bg-gray-50 text-gray-700">Future</Badge>
              Faster data entry for large BOMs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">BOM Header</CardTitle>
          <CardDescription>Product, revision and PCB manufacturing parameters</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>BOM Name *</Label>
            <Input value={bomName} onChange={(e) => setBomName(e.target.value)} placeholder="e.g., PCBX-CTRL Board BOM" />
          </div>

          <div className="space-y-2">
            <Label>BOM Code</Label>
            <Input value={bomCode} onChange={(e) => setBomCode(e.target.value)} placeholder="Optional internal code" />
          </div>

          <div className="space-y-2">
            <Label>Revision *</Label>
            <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="A / B / C..." />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Finished Product (PCB Part No) *</Label>
            <select
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={loadingMasters}
            >
              <option value="">{loadingMasters ? "Loading..." : "Select product"}</option>
              {products.map((p) => (
                <option key={String(p.id ?? p.product_id)} value={String(p.id ?? p.product_id)}>
                  {(p.code ?? p.sku ?? p.part_no ?? "PRODUCT") + " — " + (p.name ?? p.title ?? "")}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="text-xs text-gray-500">
                Selected: <span className="font-medium text-gray-700">{selectedProduct.name ?? selectedProduct.title}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Product UOM</Label>
            <Input value={productUom} onChange={(e) => setProductUom(e.target.value)} placeholder="pcs" />
          </div>

          <div className="space-y-2">
            <Label>Layers</Label>
            <Input type="number" min="1" value={layers} onChange={(e) => setLayers(e.target.value)} placeholder="2" />
          </div>

          <div className="space-y-2">
            <Label>Boards / Panel</Label>
            <Input
              type="number"
              min="1"
              value={panelization}
              onChange={(e) => setPanelization(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label>Expected Yield %</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={yieldPercent}
              onChange={(e) => setYieldPercent(e.target.value)}
              placeholder="98"
            />
          </div>

          <div className="space-y-2 lg:col-span-3">
            <Label>Notes</Label>
            <textarea
              className="min-h-[90px] w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes: material assumptions, vendor constraints, process notes..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">BOM Lines</CardTitle>
            <CardDescription>Add raw materials, chemicals, tooling and outsourced operations</CardDescription>
          </div>

          <Button variant="outline" className="gap-2" onClick={addLine} disabled={submitting}>
            <Plus className="h-4 w-4" />
            Add Line
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <table className="min-w-[1150px] w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr className="text-left">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Item *</th>
                  <th className="px-3 py-2">UOM</th>
                  <th className="px-3 py-2 text-right">Qty / Unit *</th>
                  <th className="px-3 py-2 text-right">Scrap %</th>
                  <th className="px-3 py-2 text-right">Unit Cost</th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">Remarks</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {lines.map((ln, idx) => {
                  const itemId = ln.item_id;
                  const item = itemId ? findItem(itemId) : null;

                  return (
                    <tr key={idx} className={cx("border-t", idx % 2 === 0 ? "bg-white" : "bg-gray-50/40")}>
                      <td className="px-3 py-2">
                        <select
                          className="h-9 w-[150px] rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                          value={ln.category}
                          onChange={(e) => setLine(idx, { category: e.target.value })}
                        >
                          <option>Material</option>
                          <option>Chemical</option>
                          <option>Tooling</option>
                          <option>Outsource</option>
                          <option>Other</option>
                        </select>
                      </td>

                      <td className="px-3 py-2">
                        <select
                          className="h-9 w-[320px] rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                          value={ln.item_id}
                          onChange={(e) => {
                            const v = e.target.value;
                            const it = v ? findItem(v) : null;
                            setLine(idx, {
                              item_id: v,
                              item_code: it?.code ?? it?.item_code ?? "",
                              item_name: it?.name ?? it?.item_name ?? "",
                              uom: it?.uom ?? it?.unit ?? ln.uom ?? "",
                              unit_cost:
                                ln.unit_cost !== ""
                                  ? ln.unit_cost
                                  : String(it?.unit_cost ?? it?.cost ?? ""),
                            });
                          }}
                          disabled={loadingMasters}
                        >
                          <option value="">{loadingMasters ? "Loading..." : "Select item"}</option>
                          {items.map((it) => (
                            <option key={String(it.id ?? it.item_id)} value={String(it.id ?? it.item_id)}>
                              {(it.code ?? it.item_code ?? "ITEM") + " — " + (it.name ?? it.item_name ?? "")}
                            </option>
                          ))}
                        </select>

                        {!ln.item_id && (
                          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3">
                            <Input
                              value={ln.item_code}
                              onChange={(e) => setLine(idx, { item_code: e.target.value })}
                              placeholder="Item code (manual)"
                            />
                            <Input
                              value={ln.item_name}
                              onChange={(e) => setLine(idx, { item_name: e.target.value })}
                              placeholder="Item name (manual)"
                            />
                            <Input
                              value={ln.uom}
                              onChange={(e) => setLine(idx, { uom: e.target.value })}
                              placeholder="UOM"
                            />
                          </div>
                        )}

                        {item && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item?.spec ?? item?.description ?? ""}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        <Input
                          value={ln.uom}
                          onChange={(e) => setLine(idx, { uom: e.target.value })}
                          placeholder="pcs/kg/ltr"
                          className="h-9 w-[90px]"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={ln.qty_per}
                          onChange={(e) => setLine(idx, { qty_per: e.target.value })}
                          className="h-9 w-[120px] text-right"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ln.scrap_percent}
                          onChange={(e) => setLine(idx, { scrap_percent: e.target.value })}
                          className="h-9 w-[110px] text-right"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={ln.unit_cost}
                          onChange={(e) => setLine(idx, { unit_cost: e.target.value })}
                          className="h-9 w-[120px] text-right"
                          placeholder="Optional"
                        />
                      </td>

                      <td className="px-3 py-2">
                        <select
                          className="h-9 w-[160px] rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                          value={ln.warehouse_id}
                          onChange={(e) => setLine(idx, { warehouse_id: e.target.value })}
                        >
                          <option value="">Default</option>
                          {warehouses.map((w) => (
                            <option key={String(w.id ?? w.warehouse_id)} value={String(w.id ?? w.warehouse_id)}>
                              {w.name ?? w.warehouse_name ?? "Warehouse"}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2">
                        <Input
                          value={ln.remarks}
                          onChange={(e) => setLine(idx, { remarks: e.target.value })}
                          placeholder="Optional"
                          className="h-9 w-[220px]"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 hover:text-red-700"
                          onClick={() => removeLine(idx)}
                          disabled={submitting || lines.length === 1}
                          title={lines.length === 1 ? "At least one line required" : "Remove line"}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile lines */}
          <div className="space-y-3 md:hidden">
            {lines.map((ln, idx) => (
              <div key={idx} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">Line #{idx + 1}</p>
                    <p className="text-xs text-gray-500">Add item + quantity</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600 hover:text-red-700"
                    onClick={() => removeLine(idx)}
                    disabled={submitting || lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={ln.category}
                      onChange={(e) => setLine(idx, { category: e.target.value })}
                    >
                      <option>Material</option>
                      <option>Chemical</option>
                      <option>Tooling</option>
                      <option>Outsource</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Item *</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={ln.item_id}
                      onChange={(e) => {
                        const v = e.target.value;
                        const it = v ? findItem(v) : null;
                        setLine(idx, {
                          item_id: v,
                          item_code: it?.code ?? it?.item_code ?? "",
                          item_name: it?.name ?? it?.item_name ?? "",
                          uom: it?.uom ?? it?.unit ?? ln.uom ?? "",
                          unit_cost: ln.unit_cost !== "" ? ln.unit_cost : String(it?.unit_cost ?? it?.cost ?? ""),
                        });
                      }}
                      disabled={loadingMasters}
                    >
                      <option value="">{loadingMasters ? "Loading..." : "Select item"}</option>
                      {items.map((it) => (
                        <option key={String(it.id ?? it.item_id)} value={String(it.id ?? it.item_id)}>
                          {(it.code ?? it.item_code ?? "ITEM") + " — " + (it.name ?? it.item_name ?? "")}
                        </option>
                      ))}
                    </select>

                    {!ln.item_id && (
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          value={ln.item_code}
                          onChange={(e) => setLine(idx, { item_code: e.target.value })}
                          placeholder="Item code (manual)"
                        />
                        <Input
                          value={ln.item_name}
                          onChange={(e) => setLine(idx, { item_name: e.target.value })}
                          placeholder="Item name (manual)"
                        />
                        <Input value={ln.uom} onChange={(e) => setLine(idx, { uom: e.target.value })} placeholder="UOM" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Qty / Unit *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={ln.qty_per}
                        onChange={(e) => setLine(idx, { qty_per: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Scrap %</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ln.scrap_percent}
                        onChange={(e) => setLine(idx, { scrap_percent: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={ln.unit_cost}
                        onChange={(e) => setLine(idx, { unit_cost: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>UOM</Label>
                      <Input value={ln.uom} onChange={(e) => setLine(idx, { uom: e.target.value })} placeholder="pcs/kg/ltr" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Warehouse</Label>
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={ln.warehouse_id}
                      onChange={(e) => setLine(idx, { warehouse_id: e.target.value })}
                    >
                      <option value="">Default</option>
                      {warehouses.map((w) => (
                        <option key={String(w.id ?? w.warehouse_id)} value={String(w.id ?? w.warehouse_id)}>
                          {w.name ?? w.warehouse_name ?? "Warehouse"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Input
                      value={ln.remarks}
                      onChange={(e) => setLine(idx, { remarks: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-gray-50 p-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Tip:</span> Add chemicals (etchant, developer, plating),
              tooling (drills, routers), and outsourced operations if you want complete costing later.
            </div>
            <Button variant="outline" className="gap-2" onClick={addLine}>
              <Plus className="h-4 w-4" />
              Add Another Line
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Reset */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear header fields and all BOM lines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetForm} className="bg-red-600 hover:bg-red-700">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Submit */}
      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Save BOM?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new BOM revision for the selected PCB product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submit} disabled={submitting} className="bg-[#dc2551] hover:bg-[#b02045]">
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
