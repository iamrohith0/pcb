// src/pages/procurement/pricing/SupplierPriceList.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

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
  BadgeIndianRupee,
  Building2,
  CalendarClock,
  Copy,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

/**
 * PCBxpress – Supplier Price List
 * Location: src/pages/procurement/pricing/SupplierPriceList.jsx
 *
 * Used for:
 * - Managing supplier-wise rates for raw materials and outsourced services:
 *   FR4 laminates, copper foil, prepreg, soldermask, ENIG/HASL, drilling, plating chemicals,
 *   outsourcing (laser drill, impedance test coupons, etc.)
 *
 * Suggested API (adjust to your backend):
 *  GET    /procurement/supplier-prices
 *  POST   /procurement/supplier-prices              (create)
 *  PUT    /procurement/supplier-prices/:id          (update)
 *  DELETE /procurement/supplier-prices/:id          (delete)
 *  POST   /procurement/supplier-prices/bulk-upsert  (save all)
 *
 * Optional (if you have master endpoints):
 *  GET /procurement/suppliers
 *  GET /inventory/items
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const CURRENCY = "₹";

const ITEM_TYPES = [
  "Raw Material",
  "Consumable",
  "Chemical",
  "Outsource Service",
  "Tooling",
  "Packaging",
];

const UOMS = ["Kg", "Ltr", "Sqm", "Sheet", "Piece", "Pack", "Set", "Job"];

const defaultRow = () => ({
  id: null,
  is_active: true,

  supplier_id: "",
  supplier_name: "",

  item_id: "",
  item_code: "",
  item_name: "",

  item_type: "Raw Material",

  uom: "Kg",
  currency: "INR",

  unit_price: 0,
  moq: 0,
  lead_time_days: 0,

  effective_from: "",
  effective_to: "",

  gst_percent: 18,
  notes: "",
});

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(v, min, max, fallback) {
  const n = Math.floor(toNum(v, fallback));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function normalizeDate(v) {
  if (!v) return "";
  // allow "YYYY-MM-DD" or ISO
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}

function normalizeRow(r) {
  const d = defaultRow();
  const row = { ...d, ...(r || {}) };

  row.id = row.id ?? null;
  row.is_active = !!row.is_active;

  row.supplier_id = safeStr(row.supplier_id);
  row.supplier_name = safeStr(row.supplier_name);

  row.item_id = safeStr(row.item_id);
  row.item_code = safeStr(row.item_code);
  row.item_name = safeStr(row.item_name);

  row.item_type = ITEM_TYPES.includes(row.item_type) ? row.item_type : d.item_type;

  row.uom = UOMS.includes(row.uom) ? row.uom : d.uom;
  row.currency = safeStr(row.currency, "INR");

  row.unit_price = Math.max(0, toNum(row.unit_price, 0));
  row.moq = Math.max(0, toNum(row.moq, 0));
  row.lead_time_days = clampInt(row.lead_time_days, 0, 365, 0);

  row.effective_from = normalizeDate(row.effective_from);
  row.effective_to = normalizeDate(row.effective_to);

  row.gst_percent = Math.max(0, Math.min(100, toNum(row.gst_percent, 18)));
  row.notes = safeStr(row.notes, "");

  return row;
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function SupplierPriceList() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);

  const [rows, setRows] = useState([]);

  // Optional master lists (if you have endpoints)
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);

  // filters
  const [query, setQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeOnly, setActiveOnly] = useState(true);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      if (activeOnly && !r.is_active) return false;
      if (supplierFilter && String(r.supplier_id) !== String(supplierFilter)) return false;
      if (typeFilter !== "All" && r.item_type !== typeFilter) return false;

      if (!q) return true;
      const hay = [
        r.supplier_name,
        r.item_code,
        r.item_name,
        r.item_type,
        r.uom,
        r.currency,
        r.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, supplierFilter, typeFilter, activeOnly]);

  const summary = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const uniqueSuppliers = new Set(rows.map((r) => r.supplier_id).filter(Boolean)).size;
    return { total, active, uniqueSuppliers };
  }, [rows]);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await api.get("/procurement/supplier-prices");
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRows(list.map(normalizeRow));
    } catch (e) {
      toast({
        title: "Failed to load prices",
        description: "Could not fetch supplier price list. Check API mapping.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMasters() {
    // Masters are optional; page works even without them
    try {
      const s = await api.get("/procurement/suppliers");
      const list = Array.isArray(s.data?.data) ? s.data.data : Array.isArray(s.data) ? s.data : [];
      setSuppliers(
        list.map((x) => ({
          id: x.id ?? x._id ?? x.supplier_id ?? "",
          name: x.name ?? x.supplier_name ?? "Supplier",
        }))
      );
    } catch {
      // ignore
    }

    try {
      const i = await api.get("/inventory/items");
      const list = Array.isArray(i.data?.data) ? i.data.data : Array.isArray(i.data) ? i.data : [];
      setItems(
        list.map((x) => ({
          id: x.id ?? x._id ?? x.item_id ?? "",
          code: x.code ?? x.item_code ?? "",
          name: x.name ?? x.item_name ?? "Item",
          type: x.type ?? x.item_type ?? "",
          uom: x.uom ?? "",
        }))
      );
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchAll();
    fetchMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addRow() {
    setRows((p) => [normalizeRow(defaultRow()), ...p]);
    toast({ title: "Row added", description: "Fill supplier/item and click Save All." });
  }

  function updateRow(idx, key, value) {
    setRows((p) =>
      p.map((r, i) => (i === idx ? normalizeRow({ ...r, [key]: value }) : r))
    );
  }

  function onPickSupplier(idx, supplierId) {
    const s = suppliers.find((x) => String(x.id) === String(supplierId));
    updateRow(idx, "supplier_id", supplierId);
    if (s?.name) updateRow(idx, "supplier_name", s.name);
  }

  function onPickItem(idx, itemId) {
    const it = items.find((x) => String(x.id) === String(itemId));
    updateRow(idx, "item_id", itemId);
    if (it?.code) updateRow(idx, "item_code", it.code);
    if (it?.name) updateRow(idx, "item_name", it.name);
    if (it?.type && ITEM_TYPES.includes(it.type)) updateRow(idx, "item_type", it.type);
    if (it?.uom && UOMS.includes(it.uom)) updateRow(idx, "uom", it.uom);
  }

  function duplicateRow(idx) {
    setRows((p) => {
      const src = p[idx];
      const copy = normalizeRow({ ...src, id: null, item_code: src.item_code, notes: `${src.notes || ""}`.trim() });
      return [copy, ...p];
    });
  }

  function requestDelete(idx) {
    setDeleteTarget({ idx, row: rows[idx] });
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    const t = deleteTarget;
    if (!t) return;

    setDeleteOpen(false);
    setDeleteTarget(null);

    const row = t.row;
    const idx = t.idx;

    if (!row?.id) {
      setRows((p) => p.filter((_, i) => i !== idx));
      toast({ title: "Removed", description: "Row removed." });
      return;
    }

    try {
      await api.delete(`/procurement/supplier-prices/${row.id}`);
      setRows((p) => p.filter((_, i) => i !== idx));
      toast({ title: "Deleted", description: "Price row deleted from server." });
    } catch (e) {
      toast({ title: "Delete failed", description: "Could not delete price row.", variant: "destructive" });
    }
  }

  async function saveAll() {
    setSavingAll(true);
    try {
      const payload = {
        prices: rows.map((r) => ({
          id: r.id,
          is_active: r.is_active,
          supplier_id: r.supplier_id || null,
          supplier_name: r.supplier_name || null,
          item_id: r.item_id || null,
          item_code: r.item_code || null,
          item_name: r.item_name || null,
          item_type: r.item_type,
          uom: r.uom,
          currency: r.currency || "INR",
          unit_price: toNum(r.unit_price, 0),
          moq: toNum(r.moq, 0),
          lead_time_days: clampInt(r.lead_time_days, 0, 365, 0),
          effective_from: r.effective_from || null,
          effective_to: r.effective_to || null,
          gst_percent: toNum(r.gst_percent, 18),
          notes: r.notes || null,
        })),
      };

      // Prefer bulk endpoint
      try {
        await api.post("/procurement/supplier-prices/bulk-upsert", payload);
      } catch {
        // fallback row-by-row
        for (const p of payload.prices) {
          if (p.id) await api.put(`/procurement/supplier-prices/${p.id}`, p);
          else await api.post("/procurement/supplier-prices", p);
        }
      }

      toast({ title: "Saved", description: "Supplier price list updated." });
      await fetchAll();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to save price list.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSavingAll(false);
    }
  }

  function exportJson() {
    downloadJson("supplier_price_list.json", { exported_at: new Date().toISOString(), prices: rows });
    toast({ title: "Exported", description: "Downloaded supplier_price_list.json" });
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const list = Array.isArray(parsed?.prices) ? parsed.prices : Array.isArray(parsed) ? parsed : [];
        const normalized = list.map((r) => normalizeRow({ ...r, id: null })); // import as new
        setRows(normalized);
        toast({ title: "Imported", description: "Rows loaded. Click Save All to persist." });
      } catch {
        toast({ title: "Invalid file", description: "Please import a valid JSON export.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  }

  const supplierOptions = useMemo(() => {
    // if no master list, still allow manual typing
    return suppliers.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [suppliers]);

  const itemOptions = useMemo(() => {
    return items.slice().sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#dc2551]" />
            <h1 className="text-xl font-semibold text-gray-900">Supplier Price List</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Maintain supplier-wise rates for PCB raw materials, chemicals and outsourced processes. Used in PO pricing and
            cost estimation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchAll} className="gap-2" disabled={loading || savingAll}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" onClick={exportJson} className="gap-2" disabled={savingAll}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <label className="inline-flex">
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = "";
              }}
            />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              Import
            </span>
          </label>

          <Button onClick={addRow} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" disabled={savingAll}>
            <Plus className="h-4 w-4" />
            Add Row
          </Button>

          <Button onClick={saveAll} className="gap-2" disabled={savingAll || loading}>
            {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search supplier, item code/name, notes…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Supplier</Label>
              <select
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">All suppliers</option>
                {supplierOptions.map((s) => (
                  <option key={String(s.id)} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Item Type</Label>
              <select
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All</option>
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Active Only</Label>
              <div className="mt-2 flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-700">Show active</span>
                <Switch checked={activeOnly} onCheckedChange={(v) => setActiveOnly(!!v)} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryChip icon={Building2} label="Suppliers" value={summary.uniqueSuppliers} />
            <SummaryChip icon={Filter} label="Active Rows" value={summary.active} />
            <SummaryChip icon={CalendarClock} label="Total Rows" value={summary.total} />
          </div>

          {loading && (
            <div className="mt-4 rounded-xl border bg-white p-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading supplier prices…
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="border-gray-200">
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2 pr-3">Supplier</th>
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">UOM</th>
                  <th className="py-2 pr-3">Unit Price</th>
                  <th className="py-2 pr-3">MOQ</th>
                  <th className="py-2 pr-3">Lead (days)</th>
                  <th className="py-2 pr-3">Effective From</th>
                  <th className="py-2 pr-3">Effective To</th>
                  <th className="py-2 pr-3">GST %</th>
                  <th className="py-2 pr-3">Notes</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={13} className="py-10 text-center text-gray-600">
                      No rows found. Add a row to start.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const idx = rows.findIndex((x) => x === row);
                    return (
                      <tr key={row.id ?? `new-${idx}`} className="border-t">
                        <td className="py-3 pr-3 align-top">
                          <Switch
                            checked={!!row.is_active}
                            onCheckedChange={(v) => updateRow(idx, "is_active", !!v)}
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          {supplierOptions.length > 0 ? (
                            <select
                              className="w-60 rounded-md border px-2 py-2 text-sm"
                              value={row.supplier_id}
                              onChange={(e) => onPickSupplier(idx, e.target.value)}
                            >
                              <option value="">Select supplier</option>
                              {supplierOptions.map((s) => (
                                <option key={String(s.id)} value={String(s.id)}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              className="w-60"
                              placeholder="Supplier name"
                              value={row.supplier_name}
                              onChange={(e) => updateRow(idx, "supplier_name", e.target.value)}
                            />
                          )}
                        </td>

                        <td className="py-3 pr-3 align-top">
                          {itemOptions.length > 0 ? (
                            <select
                              className="w-72 rounded-md border px-2 py-2 text-sm"
                              value={row.item_id}
                              onChange={(e) => onPickItem(idx, e.target.value)}
                            >
                              <option value="">Select item</option>
                              {itemOptions.map((it) => (
                                <option key={String(it.id)} value={String(it.id)}>
                                  {it.code ? `${it.code} — ${it.name}` : it.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                className="w-72"
                                placeholder="Item code"
                                value={row.item_code}
                                onChange={(e) => updateRow(idx, "item_code", e.target.value)}
                              />
                              <Input
                                className="w-72"
                                placeholder="Item name"
                                value={row.item_name}
                                onChange={(e) => updateRow(idx, "item_name", e.target.value)}
                              />
                            </div>
                          )}
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <select
                            className="w-48 rounded-md border px-2 py-2 text-sm"
                            value={row.item_type}
                            onChange={(e) => updateRow(idx, "item_type", e.target.value)}
                          >
                            {ITEM_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <select
                            className="w-28 rounded-md border px-2 py-2 text-sm"
                            value={row.uom}
                            onChange={(e) => updateRow(idx, "uom", e.target.value)}
                          >
                            {UOMS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <div className="relative w-36">
                            <BadgeIndianRupee className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              className="pl-8"
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.unit_price}
                              onChange={(e) => updateRow(idx, "unit_price", e.target.value)}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {row.currency === "INR" ? `${CURRENCY} INR` : row.currency}
                          </p>
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <Input
                            className="w-24"
                            type="number"
                            min="0"
                            step="1"
                            value={row.moq}
                            onChange={(e) => updateRow(idx, "moq", e.target.value)}
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <Input
                            className="w-28"
                            type="number"
                            min="0"
                            step="1"
                            value={row.lead_time_days}
                            onChange={(e) => updateRow(idx, "lead_time_days", e.target.value)}
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <Input
                            className="w-36"
                            type="date"
                            value={row.effective_from}
                            onChange={(e) => updateRow(idx, "effective_from", e.target.value)}
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <Input
                            className="w-36"
                            type="date"
                            value={row.effective_to}
                            onChange={(e) => updateRow(idx, "effective_to", e.target.value)}
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <Input
                            className="w-24"
                            type="number"
                            min="0"
                            step="0.1"
                            value={row.gst_percent}
                            onChange={(e) => updateRow(idx, "gst_percent", e.target.value)}
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <Input
                            className="w-72"
                            placeholder="Notes"
                            value={row.notes}
                            onChange={(e) => updateRow(idx, "notes", e.target.value)}
                          />
                        </td>

                        <td className="py-3 pr-0 align-top">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => duplicateRow(idx)}>
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => requestDelete(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <div className="inline-flex items-center gap-2">
              <span className="font-medium text-gray-700">Tip:</span> Use Effective From/To to maintain price history.
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="font-medium text-gray-700">Pricing:</span> Used during PO creation and cost rollup.
            </div>
          </div>
        </div>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete price row?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected supplier price row. If it is already saved, it will be deleted from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#dc2551] hover:bg-[#b02045]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm">
          <Icon className="h-4 w-4 text-gray-700" />
        </span>
        <div className="leading-tight">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
