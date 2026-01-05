// src/pages/inventory/items/ItemEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  Info,
  Loader2,
  Package,
  Save,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import inventoryItemsService from "@/services/inventory/items.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const TYPE_OPTIONS = [
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "CHEMICAL", label: "Chemical" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "TOOLING", label: "Tooling" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "FINISHED_GOOD", label: "Finished Good (PCB)" },
  { value: "SERVICE", label: "Service" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

function safeNum(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isNaN(n) ? "" : n;
}

function HeaderPill({ tone = "gray", children }) {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", cls)}>{children}</span>;
}

export default function ItemEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    item_code: "",
    type: "RAW_MATERIAL",
    category: "",
    uom: "",
    barcode: "",
    hsn_sac: "",
    description: "",

    active: true,

    // tracking
    track_inventory: true,
    track_lots: false,
    track_serials: false,
    shelf_life_days: "",

    // stock policy
    min_stock: "",
    max_stock: "",
    reorder_level: "",
    reorder_qty: "",
    storage_location_hint: "",

    // costing
    currency: "INR",
    standard_cost: "",
    last_purchase_price: "",

    // compliance / attachments
    hazardous: false,
    msds_required: false,
    msds_url: "",
    spec_url: "",
  });

  // Optional: image upload preview (if you support)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const pageTitle = useMemo(() => (form?.name ? `Edit: ${form.name}` : "Edit Item"), [form?.name]);

  const setField = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const loadItem = async () => {
    setLoading(true);
    try {
      const res = await inventoryItemsService.getById(id);
      const data = res?.data?.item ?? res?.data;

      setForm((prev) => ({
        ...prev,
        name: data?.name ?? "",
        item_code: data?.item_code ?? "",
        type: data?.type ?? "RAW_MATERIAL",
        category: data?.category ?? "",
        uom: data?.uom ?? "",
        barcode: data?.barcode ?? "",
        hsn_sac: data?.hsn_sac ?? "",
        description: data?.description ?? "",

        active: Boolean(data?.active ?? true),

        track_inventory: Boolean(data?.track_inventory ?? true),
        track_lots: Boolean(data?.track_lots ?? false),
        track_serials: Boolean(data?.track_serials ?? false),
        shelf_life_days: data?.shelf_life_days ?? "",

        min_stock: data?.min_stock ?? "",
        max_stock: data?.max_stock ?? "",
        reorder_level: data?.reorder_level ?? "",
        reorder_qty: data?.reorder_qty ?? "",
        storage_location_hint: data?.storage_location_hint ?? "",

        currency: data?.currency ?? "INR",
        standard_cost: data?.standard_cost ?? "",
        last_purchase_price: data?.last_purchase_price ?? "",

        hazardous: Boolean(data?.hazardous ?? false),
        msds_required: Boolean(data?.msds_required ?? false),
        msds_url: data?.msds_url ?? "",
        spec_url: data?.spec_url ?? "",
      }));

      // Optional image fields (if backend returns)
      if (data?.image_url) setImagePreview(data.image_url);
    } catch (err) {
      toast({
        title: "Failed to load item",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
      navigate("/inventory/items", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    if (!form.name.trim()) return "Item name is required.";
    if (!form.item_code.trim()) return "Item code is required.";
    if (!form.uom.trim()) return "UOM is required.";
    if (form.track_lots && form.track_serials) return "Enable either Lot tracking or Serial tracking (not both) unless your process truly requires it.";
    if (form.min_stock !== "" && form.max_stock !== "" && Number(form.min_stock) > Number(form.max_stock)) return "Min stock cannot be greater than Max stock.";
    if (form.msds_required && !form.msds_url.trim() && !imageFile) return "MSDS is required. Provide MSDS URL or upload attachment (if supported).";
    return null;
  };

  const buildPayload = () => {
    // If you support file upload, use FormData; otherwise send JSON
    const hasFile = Boolean(imageFile);

    // Always send as FormData to be safe (works for JSON too if backend accepts multipart)
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("item_code", form.item_code);
    fd.append("type", form.type);
    fd.append("category", form.category);
    fd.append("uom", form.uom);
    fd.append("barcode", form.barcode);
    fd.append("hsn_sac", form.hsn_sac);
    fd.append("description", form.description);

    fd.append("active", String(Boolean(form.active)));

    fd.append("track_inventory", String(Boolean(form.track_inventory)));
    fd.append("track_lots", String(Boolean(form.track_lots)));
    fd.append("track_serials", String(Boolean(form.track_serials)));
    fd.append("shelf_life_days", String(form.shelf_life_days === "" ? "" : safeNum(form.shelf_life_days)));

    fd.append("min_stock", String(form.min_stock === "" ? "" : safeNum(form.min_stock)));
    fd.append("max_stock", String(form.max_stock === "" ? "" : safeNum(form.max_stock)));
    fd.append("reorder_level", String(form.reorder_level === "" ? "" : safeNum(form.reorder_level)));
    fd.append("reorder_qty", String(form.reorder_qty === "" ? "" : safeNum(form.reorder_qty)));
    fd.append("storage_location_hint", form.storage_location_hint);

    fd.append("currency", form.currency);
    fd.append("standard_cost", String(form.standard_cost === "" ? "" : safeNum(form.standard_cost)));
    fd.append("last_purchase_price", String(form.last_purchase_price === "" ? "" : safeNum(form.last_purchase_price)));

    fd.append("hazardous", String(Boolean(form.hazardous)));
    fd.append("msds_required", String(Boolean(form.msds_required)));
    fd.append("msds_url", form.msds_url);
    fd.append("spec_url", form.spec_url);

    if (hasFile) fd.append("image", imageFile);

    return { fd, hasFile };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errMsg = validate();
    if (errMsg) {
      toast({ title: "Validation error", description: errMsg, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { fd, hasFile } = buildPayload();
      await inventoryItemsService.update(id, fd, hasFile ? { headers: { "Content-Type": "multipart/form-data" } } : {});
      toast({ title: "Saved", description: "Item updated successfully." });
      navigate(`/inventory/items/${id}`, { replace: true });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await inventoryItemsService.remove(id);
      toast({ title: "Item deleted", description: "The item has been removed." });
      navigate("/inventory/items", { replace: true });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err?.message || "Item may be used in BOM/transactions.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handlePickImage = (file) => {
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const trackingTone = form.track_inventory ? "green" : "gray";
  const hazardTone = form.hazardous ? "amber" : "gray";
  const activeTone = form.active ? "green" : "red";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            <span>Inventory</span>
            <span className="text-gray-300">/</span>
            <span>Items</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Edit</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>

            <HeaderPill tone={activeTone}>
              <CheckCircle2 className="h-4 w-4" />
              {form.active ? "Active" : "Inactive"}
            </HeaderPill>

            <HeaderPill tone={trackingTone}>
              <ClipboardList className="h-4 w-4" />
              {form.track_inventory ? "Inventory Tracked" : "No Stock Tracking"}
            </HeaderPill>

            <HeaderPill tone={hazardTone}>
              <ShieldCheck className="h-4 w-4" />
              {form.hazardous ? "Hazardous" : "Non-hazardous"}
            </HeaderPill>
          </div>

          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Maintain accurate item masters for laminates, copper foils, chemicals, tooling, and packaging to avoid production delays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)} disabled={loading}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" className="gap-2" asChild disabled={loading}>
            <Link to={`/inventory/items/${id}`}>
              <Info className="h-4 w-4" />
              View Details
            </Link>
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border bg-white p-10">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading item…
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Basic Info</h2>
                      <p className="mt-0.5 text-xs text-gray-500">Core identifiers used across BOM, RFQ, PO, and Work Orders.</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                      <Tag className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g., FR4 Laminate 1.6mm" />
                    </div>

                    <div className="space-y-2">
                      <Label>Item Code *</Label>
                      <Input value={form.item_code} onChange={(e) => setField("item_code", e.target.value)} placeholder="e.g., RM-FR4-160" />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <select
                        value={form.type}
                        onChange={(e) => setField("type", e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">For PCB: use Raw Material for laminates/copper; Chemical for plating/etch; Tooling for drills.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={form.category} onChange={(e) => setField("category", e.target.value)} placeholder="e.g., Laminate / Copper Foil / Solder Mask" />
                    </div>

                    <div className="space-y-2">
                      <Label>UOM *</Label>
                      <Input value={form.uom} onChange={(e) => setField("uom", e.target.value)} placeholder="e.g., sheet / kg / liter / pcs" />
                    </div>

                    <div className="space-y-2">
                      <Label>Barcode</Label>
                      <Input value={form.barcode} onChange={(e) => setField("barcode", e.target.value)} placeholder="Optional" />
                    </div>

                    <div className="space-y-2">
                      <Label>HSN/SAC</Label>
                      <Input value={form.hsn_sac} onChange={(e) => setField("hsn_sac", e.target.value)} placeholder="For GST" />
                    </div>

                    <div className="space-y-2">
                      <Label>Storage Location Hint</Label>
                      <Input
                        value={form.storage_location_hint}
                        onChange={(e) => setField("storage_location_hint", e.target.value)}
                        placeholder="e.g., CHEM-RACK-A2 / RM-SHELF-03"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      placeholder="Specs, thickness, copper weight, supplier, handling notes…"
                      className="min-h-[110px]"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <Switch checked={form.active} onCheckedChange={(v) => setField("active", Boolean(v))} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active</p>
                        <p className="text-xs text-gray-500">Inactive items won’t be selectable in new transactions.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Tracking & Shelf Life</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Lot tracking is recommended for chemicals to support PCB traceability.</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
                    <Switch checked={form.track_inventory} onCheckedChange={(v) => setField("track_inventory", Boolean(v))} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Track Inventory</p>
                      <p className="mt-1 text-xs text-gray-500">Enable to maintain stock and reorder rules.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
                    <Switch
                      checked={form.track_lots}
                      onCheckedChange={(v) => {
                        const next = Boolean(v);
                        setField("track_lots", next);
                        if (next) setField("track_serials", false);
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lot Tracking</p>
                      <p className="mt-1 text-xs text-gray-500">Chemicals, solder mask, inks, laminates by batch.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
                    <Switch
                      checked={form.track_serials}
                      onCheckedChange={(v) => {
                        const next = Boolean(v);
                        setField("track_serials", next);
                        if (next) setField("track_lots", false);
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Serial Tracking</p>
                      <p className="mt-1 text-xs text-gray-500">Use only if unit-level IDs are required.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shelf Life (days)</Label>
                    <Input
                      type="number"
                      value={form.shelf_life_days}
                      onChange={(e) => setField("shelf_life_days", e.target.value)}
                      placeholder="e.g., 180"
                      disabled={!form.track_lots}
                    />
                    <p className="text-xs text-gray-500">Typically used for chemicals. Enabled when Lot Tracking is ON.</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Stock Policy</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Min/Max + reorder level prevents production halts.</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Min Stock</Label>
                    <Input
                      type="number"
                      value={form.min_stock}
                      onChange={(e) => setField("min_stock", e.target.value)}
                      disabled={!form.track_inventory}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Stock</Label>
                    <Input
                      type="number"
                      value={form.max_stock}
                      onChange={(e) => setField("max_stock", e.target.value)}
                      disabled={!form.track_inventory}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Level</Label>
                    <Input
                      type="number"
                      value={form.reorder_level}
                      onChange={(e) => setField("reorder_level", e.target.value)}
                      disabled={!form.track_inventory}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Quantity</Label>
                    <Input
                      type="number"
                      value={form.reorder_qty}
                      onChange={(e) => setField("reorder_qty", e.target.value)}
                      disabled={!form.track_inventory}
                      placeholder="0"
                    />
                  </div>
                </div>

                {!form.track_inventory ? (
                  <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-xs text-gray-700">
                    <p className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 text-gray-500" />
                      Stock policy is disabled because <span className="font-medium">Track Inventory</span> is OFF.
                    </p>
                  </div>
                ) : null}
              </Card>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Costing</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Used for RFQ pricing & production cost roll-up.</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                    <Save className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <select
                      value={form.currency}
                      onChange={(e) => setField("currency", e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {CURRENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Standard Cost</Label>
                    <Input
                      type="number"
                      value={form.standard_cost}
                      onChange={(e) => setField("standard_cost", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Purchase Price</Label>
                    <Input
                      type="number"
                      value={form.last_purchase_price}
                      onChange={(e) => setField("last_purchase_price", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Compliance & Documents</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Best practice for chemicals (etch, plating, mask, ink).</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
                    <Switch checked={form.hazardous} onCheckedChange={(v) => setField("hazardous", Boolean(v))} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Hazardous</p>
                      <p className="mt-1 text-xs text-gray-500">Flags handling SOP / PPE checks.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
                    <Switch checked={form.msds_required} onCheckedChange={(v) => setField("msds_required", Boolean(v))} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">MSDS Required</p>
                      <p className="mt-1 text-xs text-gray-500">Require MSDS before receiving in GRN.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>MSDS URL</Label>
                    <Input
                      value={form.msds_url}
                      onChange={(e) => setField("msds_url", e.target.value)}
                      placeholder="https://…"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Spec/Datasheet URL</Label>
                    <Input
                      value={form.spec_url}
                      onChange={(e) => setField("spec_url", e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Item Image (Optional)</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Useful for stores teams (labeling & picking).</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border bg-gray-50 p-4">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-36 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-36 place-items-center rounded-lg border bg-white">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Upload className="h-4 w-4" />
                          No image selected
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-white">
                        <Upload className="h-4 w-4" />
                        Choose file
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePickImage(e.target.files?.[0])}
                        />
                      </label>

                      {imagePreview ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Clear
                        </Button>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      If your backend doesn’t support uploads, remove this block and keep URLs only.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs text-gray-500">
                  Tip: For PCB materials, include thickness, Tg, copper weight, and supplier grade in description or a structured spec module later.
                </p>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" className="justify-center" onClick={() => navigate(`/inventory/items/${id}`)}>
              Cancel
            </Button>

            <Button
              type="submit"
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      )}

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete item?"
        description={
          <span>
            This will permanently remove <span className="font-medium">{form?.name || "this item"}</span>. If it is used in BOM
            or transactions, deletion may fail.
          </span>
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
