// src/pages/warehouse/warehouses/WarehousesList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

import api from "@/lib/axios";

/**
 * PCBxpress - Warehouses List
 * Routes used (expected):
 *  GET    /warehouses               -> list with pagination/search
 *  DELETE /warehouses/:id           -> delete warehouse
 *
 * If your backend differs, update the endpoints in fetchWarehouses/deleteWarehouse.
 */

const PAGE_SIZE_DEFAULT = 10;

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export default function WarehousesList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: PAGE_SIZE_DEFAULT,
    total: 0,
    totalPages: 1,
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtersLabel = useMemo(() => {
    const parts = [];
    if (query.trim()) parts.push(`Search: "${query.trim()}"`);
    if (status !== "all") parts.push(`Status: ${status}`);
    return parts.length ? parts.join(" • ") : "All warehouses";
  }, [query, status]);

  const canPrev = meta.page > 1;
  const canNext = meta.page < (meta.totalPages || 1);

  async function fetchWarehouses({ page = 1 } = {}) {
    setLoading(true);
    try {
      // Common patterns supported:
      // - /warehouses?page=1&pageSize=10&search=&status=
      // Backend response suggested:
      // { data: [...], meta: { page, pageSize, total, totalPages } }
      // Fallback supported:
      // { data: [...], total: 100, page: 1, pageSize: 10 }
      const res = await api.get("/warehouses", {
        params: {
          page,
          pageSize,
          search: query.trim() || undefined,
          status: status !== "all" ? status : undefined,
        },
      });

      const data = res?.data;

      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const m = data?.meta || {};

      const total =
        typeof m.total === "number"
          ? m.total
          : typeof data?.total === "number"
          ? data.total
          : list.length;

      const currentPage =
        typeof m.page === "number"
          ? m.page
          : typeof data?.page === "number"
          ? data.page
          : page;

      const size =
        typeof m.pageSize === "number"
          ? m.pageSize
          : typeof data?.pageSize === "number"
          ? data.pageSize
          : pageSize;

      const totalPages =
        typeof m.totalPages === "number"
          ? m.totalPages
          : Math.max(1, Math.ceil(total / Math.max(1, size)));

      setRows(list);
      setMeta({
        page: currentPage,
        pageSize: size,
        total,
        totalPages,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load warehouses",
        description: "Please check your connection or permissions and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteWarehouse(id) {
    setDeleting(true);
    try {
      await api.delete(`/warehouses/${id}`);
      toast({
        title: "Warehouse deleted",
        description: "The warehouse was removed successfully.",
      });
      setDeleteOpen(false);
      setSelected(null);

      // If we deleted last item on current page, move back a page when possible
      const isLastRowOnPage = rows.length === 1 && meta.page > 1;
      await fetchWarehouses({ page: isLastRowOnPage ? meta.page - 1 : meta.page });
    } catch (err) {
      console.error(err);
      toast({
        title: "Delete failed",
        description:
          err?.response?.data?.message ||
          "Unable to delete warehouse. It may be linked to locations/stock/WIP.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    fetchWarehouses({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, pageSize]);

  // Debounced search/filters -> reset to page 1
  useEffect(() => {
    const t = setTimeout(() => fetchWarehouses({ page: 1 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  const onClickRow = (w) => {
    navigate(`/warehouse/warehouses/${w.id}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dc2551]/10">
              <WarehouseIcon className="h-5 w-5 text-[#dc2551]" />
            </span>
            <h1 className="text-xl font-bold text-gray-900">Warehouses</h1>
          </div>
          <p className="text-sm text-gray-600">
            Manage physical warehouses used for raw material, WIP, and finished goods in PCB manufacturing.
          </p>
          <p className="text-xs text-gray-500">{filtersLabel}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
          >
            <RefreshCcw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Link to="/warehouse/warehouses/create">
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
              <Plus className="h-4 w-4" />
              New Warehouse
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code, name, plant, city, manager..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
            <div className="flex gap-2">
              {["all", "active", "inactive"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cx(
                    "rounded-xl border px-3 py-2 text-sm transition-colors",
                    status === s
                      ? "border-[#dc2551]/30 bg-[#dc2551]/10 text-[#dc2551]"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {s === "all" ? "All" : s === "active" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">Page size</label>
            <div className="flex gap-2">
              {[10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setPageSize(n)}
                  className={cx(
                    "rounded-xl border px-3 py-2 text-sm transition-colors",
                    pageSize === n
                      ? "border-[#dc2551]/30 bg-[#dc2551]/10 text-[#dc2551]"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              List ({meta.total || 0})
            </p>
            <p className="text-xs text-gray-500">
              Page {meta.page} of {meta.totalPages}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Plant</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y bg-white">
              {loading ? (
                [...Array(6)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-56 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto h-8 w-28 rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-gray-500" colSpan={7}>
                    No warehouses found. Create your first warehouse to begin.
                  </td>
                </tr>
              ) : (
                rows.map((w) => {
                  const isActive =
                    w?.status === "active" || w?.is_active === true || w?.active === true;
                  const type = safeText(w?.type || w?.warehouse_type || "General");
                  const plant = safeText(w?.plant?.name || w?.plant_name || "—");
                  const city = safeText(w?.city || w?.address?.city || "—");

                  return (
                    <tr
                      key={w.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onClickRow(w)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {safeText(w?.code || w?.warehouse_code || `WH-${w?.id}`)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div className="leading-tight">
                            <p className="font-medium text-gray-900">{safeText(w?.name || "Unnamed")}</p>
                            <p className="text-xs text-gray-500">
                              {safeText(w?.manager_name || w?.manager?.name || "No manager")}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-700">{plant}</td>

                      <td className="px-4 py-3">
                        <Badge variant="secondary">{type}</Badge>
                      </td>

                      <td className="px-4 py-3 text-gray-700">{city}</td>

                      <td className="px-4 py-3">
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                          )}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Link to={`/warehouse/warehouses/${w.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>

                          <Link to={`/warehouse/warehouses/${w.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setSelected(w);
                              setDeleteOpen(true);
                            }}
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

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {rows.length ? (meta.page - 1) * meta.pageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-700">
              {Math.min(meta.page * meta.pageSize, meta.total || 0)}
            </span>{" "}
            of <span className="font-medium text-gray-700">{meta.total || 0}</span>
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWarehouses({ page: meta.page - 1 })}
              disabled={loading || !canPrev}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWarehouses({ page: meta.page + 1 })}
              disabled={loading || !canNext}
              className="gap-1.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete confirm */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete warehouse?"
        description={
          selected
            ? `This will permanently delete "${selected.name || "this warehouse"}". If it has linked locations, stock, or WIP, deletion may fail.`
            : "This will permanently delete this warehouse."
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={() => selected?.id && deleteWarehouse(selected.id)}
        loading={deleting}
      />
    </div>
  );
}
