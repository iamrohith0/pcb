// src/pages/inventory/items/ItemCreate.jsx
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Barcode,
    Boxes,
    Building2,
    CheckCircle2,
    FileUp,
    Hash,
    Info,
    Loader2,
    PackagePlus,
    Save,
    Tag,
    Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import inventoryItemsService from "@/services/inventory/items.service"; // <-- create this service

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const ITEM_TYPES = [
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "CHEMICAL", label: "Chemical" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "TOOLING", label: "Tooling" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "FINISHED_GOOD", label: "Finished Good (PCB)" },
  { value: "SERVICE", label: "Service" },
];

const DEFAULT_UOMS = [
  { value: "PCS", label: "PCS" },
  { value: "SHEET", label: "SHEET" },
  { value: "PANEL", label: "PANEL" },
  { value: "M", label: "M" },
  { value: "KG", label: "KG" },
  { value: "L", label: "L" },
];

export default function ItemCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Masters (optional)
  const [uoms, setUoms] = useState(DEFAULT_UOMS);
  const [categories, setCategories] = useState([
    { value: "GENERAL", label: "General" },
    { value: "LAMINATE_FR4", label: "Laminate (FR4)" },
    { value: "COPPER_FOIL", label: "Copper Foil" },
    { value: "SOLDER_MASK", label: "Solder Mask" },
    { value: "SILKSCREEN_INK", label: "Silkscreen Ink" },
    { value: "DRILL_BITS", label: "Drill Bits" },
    { value: "PACKING_MATERIAL", label: "Packing Material" },
  ]);

  // Form state
  const [form, setForm] = useState({
    item_code: "",
    name: "",
    description: "",
    type: "RAW_MATERIAL",
    category: "GENERAL",
    uom: "PCS",

    // Inventory controls
    track_inventory: true,
    track_lots: false,
    track_serials: false,

    // Stock rules
    min_stock: "",
    max_stock: "",
    reorder_level: "",
    reorder_qty: "",

    // Pricing / costing
    standard_cost: "",
    last_purchase_price: "",
    currency: "INR",

    // Storage
    shelf_life_days: "",
    storage_location_hint: "",

    // Identifiers
    hsn_sac: "",
    barcode: "",

    // Compliance
    hazardous: false,
    msds_required: false,

    // Status
    active: true,
  });

  const [attachments, setAttachments] = useState({
    msdsFile: null,
    specFile: null,
  });

  // Simple derived validations
  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Item name is required";
    if (!form.item_code.trim()) e.item_code = "Item code is required";
    if (!form.uom) e.uom = "UOM is required";
    if (!form.type) e.type = "Type is required";
    if (form.track_serials && form.track_lots) {
      e.track = "Use either Lot tracking OR Serial tracking (not both).";
    }
    return e;
  }, [form]);

  const canSave = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Fetch masters (optional) - safe fallback
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        // If you have master endpoints, use them:
        // const [uomRes, catRes] = await Promise.all([
        //   mastersService.getUoms(),
        //   mastersService.getItemCategories(),
        // ]);
        // if (!mounted) return;
        // setUoms(uomRes.data?.map(x => ({value:x.code,label:x.name})) ?? DEFAULT_UOMS);
        // setCategories(catRes.data?.map(x => ({value:x.code,label:x.name})) ?? categories);

        // Otherwise keep defaults
      } catch (err) {
        console.warn("Masters fetch failed, using defaults:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handlePickFile = (key) => (e) => {
    const file = e.target.files?.[0] || null;
    setAttachments((p) => ({ ...p, [key]: file }));
  };

  const handleClearFile = (key) => () => {
    setAttachments((p) => ({ ...p, [key]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSave) {
      toast({
        title: "Fix validation errors",
        description: "Please fill required fields before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Build payload
      const payload = {
        ...form,
        min_stock: form.min_stock === "" ? null : Number(form.min_stock),
        max_stock: form.max_stock === "" ? null : Number(form.max_stock),
        reorder_level: form.reorder_level === "" ? null : Number(form.reorder_level),
        reorder_qty: form.reorder_qty === "" ? null : Number(form.reorder_qty),
        standard_cost: form.standard_cost === "" ? null : Number(form.standard_cost),
        last_purchase_price: form.last_purchase_price === "" ? null : Number(form.last_purchase_price),
        shelf_life_days: form.shelf_life_days === "" ? null : Number(form.shelf_life_days),
      };

      /**
       * Option A (recommended): multipart upload for files.
       * Your backend should accept:
       * POST /inventory/items with FormData
       */
      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      if (attachments.msdsFile) fd.append("msds", attachments.msdsFile);
      if (attachments.specFile) fd.append("spec", attachments.specFile);

      const res = await inventoryItemsService.create(fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = res?.data?.item || res?.data;

      toast({
        title: "Item created",
        description: created?.name ? `${created.name} saved successfully.` : "Saved successfully.",
      });

      navigate("/inventory/items", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create item. Please try again.";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Boxes className="h-4 w-4" />
            <span>Inventory</span>
            <span className="text-gray-300">/</span>
            <span>Items</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Create</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">Create Item</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Add a new inventory item for PCBxpress (raw materials, chemicals, consumables, tooling, packaging, or finished PCB).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSubmit}
            disabled={saving || !canSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Item
          </Button>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* LEFT: main form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-2 space-y-5"
          >
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-gray-700" />
                <h2 className="text-sm font-semibold text-gray-900">Basic Details</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="item_code">Item Code *</Label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="item_code"
                      value={form.item_code}
                      onChange={(e) => setField("item_code", e.target.value.toUpperCase())}
                      placeholder="e.g., FR4-1.6-1080"
                      className={cx("pl-9", errors.item_code && "border-red-500")}
                    />
                  </div>
                  {errors.item_code && (
                    <p className="text-xs text-red-600">{errors.item_code}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="e.g., FR4 Laminate 1.6mm"
                      className={cx("pl-9", errors.name && "border-red-500")}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Item Type *</Label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value)}
                    className={cx(
                      "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20",
                      errors.type && "border-red-500"
                    )}
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uom">UOM *</Label>
                  <select
                    id="uom"
                    value={form.uom}
                    onChange={(e) => setField("uom", e.target.value)}
                    className={cx(
                      "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20",
                      errors.uom && "border-red-500"
                    )}
                  >
                    {uoms.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsn_sac">HSN/SAC</Label>
                  <Input
                    id="hsn_sac"
                    value={form.hsn_sac}
                    onChange={(e) => setField("hsn_sac", e.target.value)}
                    placeholder="e.g., 85340000"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Specs, supplier notes, storage instructions…"
                    rows={4}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-gray-700" />
                <h2 className="text-sm font-semibold text-gray-900">Identifiers & Tracking</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode (optional)</Label>
                  <Input
                    id="barcode"
                    value={form.barcode}
                    onChange={(e) => setField("barcode", e.target.value)}
                    placeholder="Scan or enter barcode"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_location_hint">Storage Location Hint</Label>
                  <Input
                    id="storage_location_hint"
                    value={form.storage_location_hint}
                    onChange={(e) => setField("storage_location_hint", e.target.value)}
                    placeholder="e.g., Stores-A / Rack-03 / Bin-12"
                  />
                </div>

                <div className="sm:col-span-2 mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Track Inventory</p>
                      <p className="text-xs text-gray-500">Enable stock ledger</p>
                    </div>
                    <Switch
                      checked={form.track_inventory}
                      onCheckedChange={(v) => setField("track_inventory", Boolean(v))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lot Tracking</p>
                      <p className="text-xs text-gray-500">Batch / lot control</p>
                    </div>
                    <Switch
                      checked={form.track_lots}
                      onCheckedChange={(v) => {
                        const on = Boolean(v);
                        setForm((p) => ({
                          ...p,
                          track_lots: on,
                          track_serials: on ? false : p.track_serials,
                        }));
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Serial Tracking</p>
                      <p className="text-xs text-gray-500">Unique serial per unit</p>
                    </div>
                    <Switch
                      checked={form.track_serials}
                      onCheckedChange={(v) => {
                        const on = Boolean(v);
                        setForm((p) => ({
                          ...p,
                          track_serials: on,
                          track_lots: on ? false : p.track_lots,
                        }));
                      }}
                    />
                  </div>
                </div>

                {errors.track && (
                  <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errors.track}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-700" />
                <h2 className="text-sm font-semibold text-gray-900">Stock Rules</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Min Stock</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    value={form.min_stock}
                    onChange={(e) => setField("min_stock", e.target.value)}
                    placeholder="0"
                    disabled={!form.track_inventory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_stock">Max Stock</Label>
                  <Input
                    id="max_stock"
                    type="number"
                    value={form.max_stock}
                    onChange={(e) => setField("max_stock", e.target.value)}
                    placeholder="0"
                    disabled={!form.track_inventory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_level">Reorder Level</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    value={form.reorder_level}
                    onChange={(e) => setField("reorder_level", e.target.value)}
                    placeholder="0"
                    disabled={!form.track_inventory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_qty">Reorder Quantity</Label>
                  <Input
                    id="reorder_qty"
                    type="number"
                    value={form.reorder_qty}
                    onChange={(e) => setField("reorder_qty", e.target.value)}
                    placeholder="0"
                    disabled={!form.track_inventory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelf_life_days">Shelf Life (days)</Label>
                  <Input
                    id="shelf_life_days"
                    type="number"
                    value={form.shelf_life_days}
                    onChange={(e) => setField("shelf_life_days", e.target.value)}
                    placeholder="e.g., 180"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* RIGHT: side panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="space-y-5"
          >
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-700" />
                <h2 className="text-sm font-semibold text-gray-900">Costing & Pricing</h2>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={(e) => setField("currency", e.target.value)}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="standard_cost">Standard Cost</Label>
                  <Input
                    id="standard_cost"
                    type="number"
                    value={form.standard_cost}
                    onChange={(e) => setField("standard_cost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_purchase_price">Last Purchase Price</Label>
                  <Input
                    id="last_purchase_price"
                    type="number"
                    value={form.last_purchase_price}
                    onChange={(e) => setField("last_purchase_price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gray-700" />
                <h2 className="text-sm font-semibold text-gray-900">Compliance</h2>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hazardous</p>
                    <p className="text-xs text-gray-500">Chemical / risky material</p>
                  </div>
                  <Switch
                    checked={form.hazardous}
                    onCheckedChange={(v) => setField("hazardous", Boolean(v))}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">MSDS Required</p>
                    <p className="text-xs text-gray-500">Attach safety datasheet</p>
                  </div>
                  <Switch
                    checked={form.msds_required}
                    onCheckedChange={(v) => setField("msds_required", Boolean(v))}
                  />
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileUp className="h-4 w-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">MSDS File</p>
                    </div>
                    {attachments.msdsFile ? (
                      <Button variant="ghost" size="sm" className="gap-2" onClick={handleClearFile("msdsFile")}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-2">
                    {attachments.msdsFile ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="truncate">{attachments.msdsFile.name}</span>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handlePickFile("msdsFile")}
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <div className="cursor-pointer rounded-md border border-dashed p-3 text-center text-sm text-gray-600 hover:bg-gray-50">
                          Click to upload MSDS (PDF/Image)
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileUp className="h-4 w-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">Spec / Datasheet</p>
                    </div>
                    {attachments.specFile ? (
                      <Button variant="ghost" size="sm" className="gap-2" onClick={handleClearFile("specFile")}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-2">
                    {attachments.specFile ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="truncate">{attachments.specFile.name}</span>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handlePickFile("specFile")}
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <div className="cursor-pointer rounded-md border border-dashed p-3 text-center text-sm text-gray-600 hover:bg-gray-50">
                          Click to upload Spec / Datasheet (PDF/Image)
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-700" />
                <h2 className="text-sm font-semibold text-gray-900">Status</h2>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="text-xs text-gray-500">Available across ERP</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setField("active", Boolean(v))} />
              </div>

              <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-xs text-gray-600">
                <p className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-gray-500" />
                  Tip: Use <span className="font-medium">Lot tracking</span> for chemicals and
                  <span className="font-medium"> serial tracking</span> for finished PCB units when needed.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" className="gap-2" onClick={() => navigate("/inventory/items")} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            disabled={saving || !canSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Item
          </Button>
        </div>

        {/* Loading overlay (masters) */}
        {loading && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm">
            <div className="rounded-xl bg-white px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading masters…
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
