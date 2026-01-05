// src/pages/inventory/items/ItemDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Barcode,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Copy,
  Edit3,
  FileText,
  Info,
  Loader2,
  Package,
  ShieldCheck,
  Tag,
  Trash2,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import inventoryItemsService from "@/services/inventory/items.service";
import ConfirmationDialog from "@/components/ConfirmationDialog";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const TYPE_LABEL = {
  RAW_MATERIAL: "Raw Material",
  CHEMICAL: "Chemical",
  CONSUMABLE: "Consumable",
  TOOLING: "Tooling",
  PACKAGING: "Packaging",
  FINISHED_GOOD: "Finished Good (PCB)",
  SERVICE: "Service",
};

const CURRENCY = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

function fmtMoney(val, currency = "INR") {
  if (val === null || val === undefined || val === "") return "—";
  const sym = CURRENCY[currency] ?? "";
  const num = Number(val);
  if (Number.isNaN(num)) return "—";
  return `${sym}${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtNum(val) {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString();
}

function Field({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 truncate text-sm font-medium text-gray-900">{value ?? "—"}</p>
        </div>
        {Icon ? (
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50 text-gray-700">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

function Pill({ tone = "gray", children }) {
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

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Optional: stock summary endpoint (if you have)
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSummary, setStockSummary] = useState(null);

  const title = useMemo(() => item?.name || "Item Details", [item]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await inventoryItemsService.getById(id);
      const data = res?.data?.item ?? res?.data;
      setItem(data);
    } catch (err) {
      toast({
        title: "Failed to load item",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSummary = async () => {
    // If your backend doesn't have this endpoint yet, keep it gracefully optional.
    setStockLoading(true);
    try {
      // Example endpoint: GET /inventory/items/:id/stock-summary
      const res = await inventoryItemsService.getStockSummary?.(id);
      const data = res?.data?.summary ?? res?.data;
      setStockSummary(data);
    } catch {
      // silent: optional
      setStockSummary(null);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
    // optional
    fetchStockSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCopy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
      toast({ title: label, description: "Saved to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
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
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const activeTone = item?.active ? "green" : "red";
  const trackTone = item?.track_inventory ? "green" : "gray";
  const hazardTone = item?.hazardous ? "amber" : "gray";

  const belowReorder =
    item?.track_inventory &&
    item?.reorder_level != null &&
    stockSummary?.on_hand != null &&
    Number(stockSummary.on_hand) <= Number(item.reorder_level);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Boxes className="h-4 w-4" />
            <span>Inventory</span>
            <span className="text-gray-300">/</span>
            <span>Items</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Details</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            {item ? (
              <>
                <Pill tone={activeTone}>
                  <BadgeCheck className="h-4 w-4" />
                  {item.active ? "Active" : "Inactive"}
                </Pill>

                <Pill tone={trackTone}>
                  <Warehouse className="h-4 w-4" />
                  {item.track_inventory ? "Inventory Tracked" : "No Stock Tracking"}
                </Pill>

                <Pill tone={hazardTone}>
                  <ShieldCheck className="h-4 w-4" />
                  {item.hazardous ? "Hazardous" : "Non-hazardous"}
                </Pill>

                {belowReorder ? (
                  <Pill tone="red">
                    <TriangleAlert className="h-4 w-4" />
                    Below Reorder Level
                  </Pill>
                ) : null}
              </>
            ) : null}
          </div>

          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            View item information, tracking rules, stock thresholds, costing, and attachments for PCB manufacturing workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)} disabled={loading}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/inventory/items/${id}/edit`)}
            disabled={loading || !item}
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => setDeleteOpen(true)}
            disabled={loading || !item}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid place-items-center rounded-2xl border bg-white p-10">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading item…
          </div>
        </div>
      ) : !item ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-900">Item not found</p>
          <p className="mt-1 text-sm text-gray-600">It may have been deleted or you don't have access.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => navigate("/inventory/items")}>
              Go to Items
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Top summary cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="p-5">
                <SectionTitle
                  icon={Package}
                  title="Item Identity"
                  subtitle="Core identifiers used in BOM, procurement, and production."
                />
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <Field label="Item Code" value={item.item_code || "—"} icon={Tag} />
                  <div className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</p>
                        <p className="mt-1 truncate text-sm font-medium text-gray-900">
                          {TYPE_LABEL[item.type] ?? item.type ?? "—"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Category: {item.category ?? "—"}</p>
                      </div>
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50 text-gray-700">
                        <Boxes className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <Field label="UOM" value={item.uom || "—"} icon={Info} />
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 }}>
              <Card className="p-5">
                <SectionTitle
                  icon={Warehouse}
                  title="Stock Snapshot"
                  subtitle="Optional. Uses stock summary endpoint if available."
                />

                <div className="mt-4 space-y-3">
                  {stockLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading stock…
                    </div>
                  ) : stockSummary ? (
                    <>
                      <Field label="On Hand" value={fmtNum(stockSummary.on_hand)} icon={Warehouse} />
                      <Field label="Reserved" value={fmtNum(stockSummary.reserved)} icon={Info} />
                      <Field label="Available" value={fmtNum(stockSummary.available)} icon={CheckCircle2} />
                      <div className="rounded-xl border bg-gray-50 p-4 text-xs text-gray-600">
                        {belowReorder ? (
                          <div className="flex items-start gap-2 text-red-700">
                            <TriangleAlert className="mt-0.5 h-4 w-4" />
                            Stock is at/below reorder level ({fmtNum(item.reorder_level)}). Consider raising PO.
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <Info className="mt-0.5 h-4 w-4" />
                            Keep your reorder rules updated for uninterrupted PCB production.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                      <p className="font-medium">No stock summary available</p>
                      <p className="mt-1 text-xs text-gray-600">
                        Add an endpoint like <span className="font-mono">/inventory/items/:id/stock-summary</span> to show live stock.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
              <Card className="p-5">
                <SectionTitle
                  icon={Building2}
                  title="Costing"
                  subtitle="Used for quotation and production cost roll-up."
                />
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <Field
                    label="Standard Cost"
                    value={fmtMoney(item.standard_cost, item.currency)}
                    icon={Info}
                  />
                  <Field
                    label="Last Purchase Price"
                    value={fmtMoney(item.last_purchase_price, item.currency)}
                    icon={Info}
                  />
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Currency</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{item.currency ?? "—"}</p>
                    <p className="mt-1 text-xs text-gray-500">Maintain consistent currency across vendors.</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* LEFT large */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-5">
                <SectionTitle
                  icon={Info}
                  title="Tracking Rules"
                  subtitle="Control how this item is handled in stores, lots, and traceability."
                />
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Track Inventory" value={item.track_inventory ? "Yes" : "No"} icon={Warehouse} />
                  <Field label="Lot Tracking" value={item.track_lots ? "Enabled" : "Disabled"} icon={BadgeCheck} />
                  <Field label="Serial Tracking" value={item.track_serials ? "Enabled" : "Disabled"} icon={BadgeCheck} />
                  <Field label="Shelf Life (days)" value={fmtNum(item.shelf_life_days)} icon={Calendar} />
                </div>

                {item.track_lots || item.track_serials ? (
                  <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-xs text-gray-700">
                    <p className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 text-gray-500" />
                      Use <span className="font-medium">lot tracking</span> for chemicals (plating, solder mask, inks) to support
                      batch genealogy. Use <span className="font-medium">serial tracking</span> only when you truly need unit-level IDs.
                    </p>
                  </div>
                ) : null}
              </Card>

              <Card className="p-5">
                <SectionTitle
                  icon={Boxes}
                  title="Stock Policy"
                  subtitle="Min/Max and reorder settings for uninterrupted PCB production."
                />
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Min Stock" value={fmtNum(item.min_stock)} icon={Info} />
                  <Field label="Max Stock" value={fmtNum(item.max_stock)} icon={Info} />
                  <Field label="Reorder Level" value={fmtNum(item.reorder_level)} icon={Info} />
                  <Field label="Reorder Quantity" value={fmtNum(item.reorder_qty)} icon={Info} />
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle
                  icon={FileText}
                  title="Description"
                  subtitle="Specs, handling notes, supplier constraints."
                />
                <div className="mt-4 rounded-xl border bg-white p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {item.description?.trim() ? item.description : "—"}
                  </p>
                </div>
              </Card>
            </div>

            {/* RIGHT sidebar */}
            <div className="space-y-4">
              <Card className="p-5">
                <SectionTitle
                  icon={Barcode}
                  title="Identifiers"
                  subtitle="Used for scanning and tax classification."
                />

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Barcode</p>
                        <p className="mt-1 truncate text-sm font-medium text-gray-900">{item.barcode || "—"}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleCopy(item.barcode || "", "Barcode copied")}
                        disabled={!item.barcode}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <Field label="HSN/SAC" value={item.hsn_sac || "—"} icon={Tag} />

                  <Field
                    label="Storage Location Hint"
                    value={item.storage_location_hint || "—"}
                    icon={Warehouse}
                  />
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle
                  icon={ShieldCheck}
                  title="Compliance"
                  subtitle="Safety and documentation controls."
                />

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hazardous</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{item.hazardous ? "Yes" : "No"}</p>
                    {item.hazardous ? (
                      <p className="mt-1 text-xs text-amber-700">Ensure handling SOP and PPE checks are enforced.</p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">Standard storage and handling.</p>
                    )}
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">MSDS Required</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{item.msds_required ? "Yes" : "No"}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      If enabled, procurement should require MSDS attachment before GRN.
                    </p>
                  </div>

                  {/* Attachments */}
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attachments</p>
                    <div className="mt-2 space-y-2 text-sm">
                      {/* Expecting backend fields: msds_url/spec_url OR attachments[] */}
                      {item.msds_url ? (
                        <a className="text-[#dc2551] hover:underline" href={item.msds_url} target="_blank" rel="noreferrer">
                          View MSDS
                        </a>
                      ) : (
                        <p className="text-gray-600">MSDS: —</p>
                      )}

                      {item.spec_url ? (
                        <a className="text-[#dc2551] hover:underline" href={item.spec_url} target="_blank" rel="noreferrer">
                          View Spec/Datasheet
                        </a>
                      ) : (
                        <p className="text-gray-600">Spec/Datasheet: —</p>
                      )}

                      {!item.msds_url && !item.spec_url ? (
                        <p className="text-xs text-gray-500">
                          Add <span className="font-mono">msds_url</span> / <span className="font-mono">spec_url</span> fields or an
                          attachments array in backend.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle icon={Info} title="Quick Actions" subtitle="Navigate to related ERP flows." />
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/procurement/purchase-orders/create">
                      Create Purchase Order
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/inventory/stock/adjustments/create">
                      Stock Adjustment
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/inventory/bom/create">
                      Add to BOM
                    </Link>
                  </Button>
                </div>

                <div className="mt-3 rounded-xl border bg-white p-4 text-xs text-gray-600">
                  <p className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-gray-500" />
                    In PCB manufacturing, strong item masters prevent mistakes in laminate thickness, copper weight,
                    solder mask type, and tooling selection.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete item?"
        description={
          <span>
            This will permanently remove <span className="font-medium">{item?.name}</span>. If it is used in BOM or
            transactions, deletion may fail based on backend rules.
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
