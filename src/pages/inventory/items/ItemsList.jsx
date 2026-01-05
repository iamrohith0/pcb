// src/pages/inventory/items/ItemsList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Boxes,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Filter,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import inventoryItemsService from "@/services/inventory/items.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "CHEMICAL", label: "Chemical" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "TOOLING", label: "Tooling" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "FINISHED_GOOD", label: "Finished Good (PCB)" },
  { value: "SERVICE", label: "Service" },
];

function TypeBadge({ type }) {
  const map = {
    RAW_MATERIAL: { label: "Raw Material", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    CHEMICAL: { label: "Chemical", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    CONSUMABLE: { label: "Consumable", cls: "bg-slate-50 text-slate-700 border-slate-200" },
    TOOLING: { label: "Tooling", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    PACKAGING: { label: "Packaging", cls: "bg-teal-50 text-teal-700 border-teal-200" },
    FINISHED_GOOD: { label: "Finished Good", cls: "bg-green-50 text-green-700 border-green-200" },
    SERVICE: { label: "Service", cls: "bg-gray-50 text-gray-700 border-gray-200" },
  };
  const t = map[type] || { label: type || "—", cls: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", t.cls)}>
      {t.label}
    </span>
  );
}

function ActiveBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
      Inactive
    </span>
  );
}

export default function ItemsList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query state (URL-synced)
  const qParam = searchParams.get("q") ?? "";
  const typeParam = searchParams.get("type") ?? "ALL";
  const activeParam = searchParams.get("active") ?? "ALL"; // ALL | ACTIVE | INACTIVE
  const pageParam = Number(searchParams.get("page") ?? "1");
  const limitParam = Number(searchParams.get("limit") ?? "20");

  // Local inputs (debounced apply)
  const [q, setQ] = useState(qParam);
  const [type, setType] = useState(typeParam);
  const [active, setActive] = useState(activeParam);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: pageParam, limit: limitParam, total: 0, pages: 1 });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState(null);

  const page = meta.page ?? pageParam;
  const limit = meta.limit ?? limitParam;

  const hasFilters = useMemo(() => {
    return (qParam && qParam.trim().length > 0) || typeParam !== "ALL" || activeParam !== "ALL";
  }, [qParam, typeParam, activeParam]);

  const fetchList = async (opts = {}) => {
    const {
      q: qv = qParam,
      type: tv = typeParam,
      active: av = activeParam,
      page: pv = pageParam,
      limit: lv = limitParam,
    } = opts;

    setLoading(true);
    try {
      const params = {
        q: qv?.trim() || undefined,
        type: tv && tv !== "ALL" ? tv : undefined,
        active:
          av === "ACTIVE" ? true : av === "INACTIVE" ? false : undefined,
        page: pv,
        limit: lv,
        sort: "updated_at:desc",
      };

      const res = await inventoryItemsService.list(params);

      // Supports a few common response shapes:
      // 1) { items:[], meta:{page,limit,total,pages} }
      // 2) { data:[], meta:{} }
      // 3) { items:[], total, page, limit }
      const payload = res?.data ?? {};
      const list = payload.items ?? payload.data ?? payload.results ?? [];
      const m = payload.meta ?? {};
      const total = m.total ?? payload.total ?? list.length ?? 0;
      const pages = m.pages ?? payload.pages ?? Math.max(1, Math.ceil(total / (m.limit ?? payload.limit ?? lv)));

      setItems(Array.isArray(list) ? list : []);
      setMeta({
        page: m.page ?? payload.page ?? pv,
        limit: m.limit ?? payload.limit ?? lv,
        total,
        pages,
      });
    } catch (err) {
      toast({
        title: "Failed to load items",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial / URL param changes -> fetch
  useEffect(() => {
    // keep inputs synced if user edits url manually / back-forward
    setQ(qParam);
    setType(typeParam);
    setActive(activeParam);
    // fetch
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, typeParam, activeParam, pageParam, limitParam]);

  // Apply filters to URL
  const applyFilters = (next = {}) => {
    const nextQ = next.q ?? q;
    const nextType = next.type ?? type;
    const nextActive = next.active ?? active;

    const sp = new URLSearchParams(searchParams);

    if (nextQ && nextQ.trim()) sp.set("q", nextQ.trim());
    else sp.delete("q");

    if (nextType && nextType !== "ALL") sp.set("type", nextType);
    else sp.delete("type");

    if (nextActive && nextActive !== "ALL") sp.set("active", nextActive);
    else sp.delete("active");

    // Reset page when filters change
    sp.set("page", "1");
    sp.set("limit", String(limitParam || 20));

    setSearchParams(sp, { replace: true });
  };

  const clearFilters = () => {
    setQ("");
    setType("ALL");
    setActive("ALL");

    const sp = new URLSearchParams(searchParams);
    sp.delete("q");
    sp.delete("type");
    sp.delete("active");
    sp.set("page", "1");
    sp.set("limit", String(limitParam || 20));
    setSearchParams(sp, { replace: true });
  };

  const gotoPage = (p) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("page", String(p));
    sp.set("limit", String(limitParam || 20));
    setSearchParams(sp, { replace: true });
  };

  const openDelete = (item) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected?.id) return;
    setDeleting(true);
    try {
      await inventoryItemsService.remove(selected.id);
      toast({ title: "Item deleted", description: "The item has been removed." });
      setDeleteOpen(false);
      setSelected(null);
      // refetch current page (or fallback if empty)
      fetchList();
    } catch (err) {
      toast({
        title: "Delete failed",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "This item may be used in BOM / transactions.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", label: "Item" },
      { key: "code", label: "Code" },
      { key: "type", label: "Type" },
      { key: "uom", label: "UOM" },
      { key: "stock", label: "Policy" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions" },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Boxes className="h-4 w-4" />
            <span>Inventory</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Items</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">Items</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage PCB raw materials, chemicals, consumables, tooling and finished goods.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fetchList()}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => navigate("/inventory/items/create")}
          >
            <Plus className="h-4 w-4" />
            New Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, code, category, barcode..."
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyFilters({ q });
                  }
                }}
              />
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <div className="w-full sm:w-[220px]">
                <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Type
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-[180px]">
                <div className="text-xs font-medium text-gray-500 mb-1">Status</div>
                <select
                  value={active}
                  onChange={(e) => setActive(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="ALL">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => applyFilters()} disabled={loading}>
              <Filter className="h-4 w-4" />
              Apply
            </Button>

            {hasFilters ? (
              <Button variant="ghost" className="gap-2" onClick={clearFilters} disabled={loading}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Active filters:</span>
            {qParam ? <Badge variant="secondary">q: {qParam}</Badge> : null}
            {typeParam !== "ALL" ? <Badge variant="secondary">type: {typeParam}</Badge> : null}
            {activeParam !== "ALL" ? <Badge variant="secondary">status: {activeParam}</Badge> : null}
          </div>
        ) : null}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y bg-white">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading items…
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-gray-900">No items found</p>
                      <p className="text-sm text-gray-600">
                        Try adjusting filters or create a new item.
                      </p>
                      <Button
                        className="mt-2 gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                        onClick={() => navigate("/inventory/items/create")}
                      >
                        <Plus className="h-4 w-4" />
                        New Item
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const id = it.id ?? it._id ?? it.item_id;
                  const name = it.name ?? "—";
                  const code = it.item_code ?? it.code ?? "—";
                  const uom = it.uom ?? "—";
                  const t = it.type ?? "—";
                  const trackInventory = Boolean(it.track_inventory ?? it.trackInventory ?? true);
                  const reorder = it.reorder_level ?? it.reorderLevel ?? "";
                  const minStock = it.min_stock ?? it.minStock ?? "";
                  const activeVal = Boolean(it.active ?? true);

                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{name}</span>
                          <span className="text-xs text-gray-500">
                            {it.category ? it.category : "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-800">{code}</span>
                      </td>

                      <td className="px-4 py-3">
                        <TypeBadge type={t} />
                      </td>

                      <td className="px-4 py-3">{uom}</td>

                      <td className="px-4 py-3">
                        {trackInventory ? (
                          <div className="text-xs text-gray-700">
                            <div>
                              <span className="text-gray-500">Min:</span>{" "}
                              <span className="font-medium">{minStock === "" ? "—" : minStock}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Reorder:</span>{" "}
                              <span className="font-medium">{reorder === "" ? "—" : reorder}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No stock tracking</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <ActiveBadge active={activeVal} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            asChild
                          >
                            <Link to={`/inventory/items/${id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            asChild
                          >
                            <Link to={`/inventory/items/${id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-600"
                            onClick={() => openDelete({ ...it, id })}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {items.length === 0 ? 0 : (page - 1) * limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-900">
              {(page - 1) * limit + items.length}
            </span>{" "}
            of <span className="font-medium text-gray-900">{meta.total ?? 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => gotoPage(Math.max(1, page - 1))} disabled={loading || page <= 1}>
              Prev
            </Button>

            <div className="text-xs text-gray-600">
              Page <span className="font-medium text-gray-900">{page}</span> /{" "}
              <span className="font-medium text-gray-900">{meta.pages ?? 1}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => gotoPage(Math.min(meta.pages ?? 1, page + 1))}
              disabled={loading || page >= (meta.pages ?? 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete item?"
        description={
          <span>
            This will permanently remove{" "}
            <span className="font-medium">{selected?.name || "this item"}</span>.
            If it is used in BOM / transactions, deletion may fail.
          </span>
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
