// src/pages/warehouse/locations/LocationsList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Building2,
  Filter,
  Hash,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Warehouse,
} from "lucide-react";

import api from "@/lib/axios";

/**
 * PCBxpress ERP — Warehouse → Locations → List
 * File: src/pages/warehouse/locations/LocationsList.jsx
 *
 * Suggested API endpoints:
 * - GET    /warehouse/locations?search=&plant=&warehouse_id=&type=&is_active=&page=&limit=
 * - DELETE /warehouse/locations/:id
 *
 * Response shape supported:
 * - { data: Location[], meta: { page, limit, total } }
 * - or Location[] directly (fallback)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 text-sm">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ onClear, createHref = "/warehouse/locations/create" }) {
  return (
    <Card className="rounded-2xl border bg-white p-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
          <MapPin className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No locations found</h3>
        <p className="mt-1 text-sm text-gray-600">
          Try changing filters or create your first location for Stores, WIP, Finished Goods, Quarantine, and Dispatch.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={onClear} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Clear filters
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
            <Link to={createHref}>
              <Plus className="h-4 w-4" />
              Create location
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function LocationsList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [plant, setPlant] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [type, setType] = useState("");
  const [active, setActive] = useState(""); // "", "1", "0"

  // masters
  const [warehouses, setWarehouses] = useState([]);

  // paging
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  // ui
  const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });
  const [showFilters, setShowFilters] = useState(true);

  const totalPages = useMemo(() => {
    const t = Number(total || 0);
    return t > 0 ? Math.ceil(t / limit) : 1;
  }, [total]);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/api/warehouse/warehouses");
      const list = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(list)) setWarehouses(list);
    } catch (e) {
      // safe fallback
      setWarehouses([
        { id: "WH-PLANTA", name: "Main Warehouse - Plant A", plant: "Plant A" },
        { id: "WH-PLANTB", name: "Main Warehouse - Plant B", plant: "Plant B" },
      ]);
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        plant: plant || undefined,
        warehouse_id: warehouseId || undefined,
        type: type || undefined,
        is_active: active === "" ? undefined : active,
        page,
        limit,
      };

      const res = await api.get("/api/warehouse/locations", { params });

      const data = res.data?.data ?? res.data;
      const meta = res.data?.meta;

      const list = Array.isArray(data) ? data : Array.isArray(res.data) ? res.data : [];
      setRows(list);

      const metaTotal =
        meta?.total ??
        res.data?.total ??
        (typeof res.data?.count === "number" ? res.data.count : list.length);
      setTotal(Number(metaTotal || 0));
    } catch (e) {
      console.error(e);

      // fallback demo data (keeps UI working)
      const demo = [
        {
          id: "LOC-0001",
          code: "LOC-ST-Z1-A1-R1-S1-B01",
          name: "Stores Z1 A1 Rack1 Bin01",
          plant: "Plant A",
          type: "Stores",
          is_active: true,
          warehouse_id: "WH-PLANTA",
          warehouse_name: "Main Warehouse - Plant A",
          path: { zone: "Z1", aisle: "A1", rack: "R1", shelf: "S1", bin: "B01" },
        },
        {
          id: "LOC-0002",
          code: "LOC-WIP-Z2-A2-R3-S1-B08",
          name: "WIP Z2 A2 Rack3 Bin08",
          plant: "Plant A",
          type: "WIP",
          is_active: true,
          warehouse_id: "WH-PLANTA",
          warehouse_name: "Main Warehouse - Plant A",
          path: { zone: "Z2", aisle: "A2", rack: "R3", shelf: "S1", bin: "B08" },
        },
        {
          id: "LOC-0003",
          code: "LOC-QA-Z9-A1-R1-S1-B01",
          name: "Quarantine QA Hold",
          plant: "Plant B",
          type: "Quarantine",
          is_active: false,
          warehouse_id: "WH-PLANTB",
          warehouse_name: "Main Warehouse - Plant B",
          path: { zone: "Z9", aisle: "A1", rack: "R1", shelf: "S1", bin: "B01" },
        },
      ];

      // simple client-side filtering for demo
      const filtered = demo.filter((r) => {
        const s = search.trim().toLowerCase();
        const matchSearch =
          !s ||
          r.code.toLowerCase().includes(s) ||
          r.name.toLowerCase().includes(s) ||
          (r.warehouse_name || "").toLowerCase().includes(s);

        const matchPlant = !plant || r.plant === plant;
        const matchWarehouse = !warehouseId || String(r.warehouse_id) === String(warehouseId);
        const matchType = !type || r.type === type;
        const matchActive = active === "" ? true : active === "1" ? !!r.is_active : !r.is_active;

        return matchSearch && matchPlant && matchWarehouse && matchType && matchActive;
      });

      setRows(filtered);
      setTotal(filtered.length);

      toast({
        title: "Using demo data",
        description: "API not available. Showing sample locations list.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch on filters/page
  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, plant, warehouseId, type, active, page]);

  const clearFilters = () => {
    setSearch("");
    setPlant("");
    setWarehouseId("");
    setType("");
    setActive("");
    setPage(1);
  };

  const requestDelete = (row) => setConfirmDelete({ open: true, row });

  const confirmDeleteNow = async () => {
    const row = confirmDelete.row;
    if (!row) return;

    try {
      await api.delete(`/api/warehouse/locations/${row.id}`);
      toast({ title: "Deleted", description: `${row.code} removed.` });

      // refresh list
      setConfirmDelete({ open: false, row: null });
      fetchLocations();
    } catch (e) {
      console.error(e);
      toast({
        title: "Delete failed",
        description:
          e?.response?.data?.message ||
          "This location may be linked to stock movements, WIP lots, or traceability. Remove links first.",
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    const all = rows;
    const activeCount = all.filter((r) => !!(r.is_active ?? r.isActive)).length;
    const inactiveCount = all.length - activeCount;

    const byType = all.reduce((acc, r) => {
      const t = r.type || "Unknown";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const topType =
      Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { activeCount, inactiveCount, topType };
  }, [rows]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Locations</h1>
            <p className="text-sm text-gray-600">
              Manage bin/rack locations for Stores, WIP, Finished Goods, Quarantine, and Dispatch.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <Warehouse className="h-3.5 w-3.5" />
                Total: {total || rows.length}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Top Type: {stats.topType}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <Button variant="outline" className="gap-2" onClick={fetchLocations} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
            <Link to="/warehouse/locations/create">
              <Plus className="h-4 w-4" />
              New Location
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatPill icon={Warehouse} label="Active" value={stats.activeCount} />
        <StatPill icon={Warehouse} label="Inactive" value={stats.inactiveCount} />
        <StatPill icon={Filter} label="Filtered by" value={[plant, warehouseId, type, active].filter(Boolean).length} />
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="rounded-2xl border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5 lg:gap-4 w-full">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Search className="h-4 w-4 text-gray-400" />
                  Search
                </div>
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Code, name, warehouse..."
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  Plant
                </div>
                <select
                  value={plant}
                  onChange={(e) => {
                    setPage(1);
                    setPlant(e.target.value);
                  }}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                >
                  <option value="">All</option>
                  <option value="Plant A">Plant A</option>
                  <option value="Plant B">Plant B</option>
                  <option value="Plant C">Plant C</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Warehouse className="h-4 w-4 text-gray-400" />
                  Warehouse
                </div>
                <select
                  value={warehouseId}
                  onChange={(e) => {
                    setPage(1);
                    setWarehouseId(e.target.value);
                  }}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                >
                  <option value="">All</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Type
                </div>
                <select
                  value={type}
                  onChange={(e) => {
                    setPage(1);
                    setType(e.target.value);
                  }}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                >
                  <option value="">All</option>
                  <option value="Stores">Stores</option>
                  <option value="RM">Raw Material</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="WIP">WIP</option>
                  <option value="Finished Goods">Finished Goods</option>
                  <option value="Dispatch">Dispatch</option>
                  <option value="Quarantine">Quarantine</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Filter className="h-4 w-4 text-gray-400" />
                  Status
                </div>
                <select
                  value={active}
                  onChange={(e) => {
                    setPage(1);
                    setActive(e.target.value);
                  }}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                >
                  <option value="">All</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={clearFilters}>
                <RefreshCw className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="rounded-2xl border bg-white">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-semibold text-gray-900">All locations</div>
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-900">{page}</span> / {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Plant</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-40 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-56 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-48 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="ml-auto h-8 w-28 rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <EmptyState onClear={clearFilters} />
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/warehouse/locations/${r.id}/edit`)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
                          <Hash className="h-4 w-4" />
                        </span>
                        <div className="leading-tight">
                          <div className="font-semibold text-gray-900">{r.code}</div>
                          <div className="text-xs text-gray-500">
                            {(r.path?.zone || r.zone) ? (
                              <span>
                                {(r.path?.zone || r.zone) && `Z:${r.path?.zone || r.zone}`}{" "}
                                {(r.path?.aisle || r.aisle) && `A:${r.path?.aisle || r.aisle}`}{" "}
                                {(r.path?.rack || r.rack) && `R:${r.path?.rack || r.rack}`}{" "}
                                {(r.path?.bin || r.bin) && `B:${r.path?.bin || r.bin}`}
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.notes || "—"}</div>
                    </td>

                    <td className="px-4 py-4">{r.plant || "—"}</td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-gray-400" />
                        <span>{r.warehouse_name || r.warehouseName || "—"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge variant="outline">{r.type || "—"}</Badge>
                    </td>

                    <td className="px-4 py-4">
                      {r.is_active ?? r.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          className="h-8 rounded-xl px-3"
                          asChild
                        >
                          <Link to={`/warehouse/locations/${r.id}/edit`}>Edit</Link>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-8 rounded-xl px-3 text-[#dc2551] hover:bg-[#dc2551]/10 hover:text-[#dc2551]"
                          onClick={() => requestDelete(r)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-900">{rows.length}</span> item(s)
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={!canPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Badge variant="outline" className="rounded-xl">
              Page {page} / {totalPages}
            </Badge>
            <Button
              variant="outline"
              disabled={!canNext || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the location. If it is linked to stock movements, WIP lots, or traceability,
              deletion should be blocked by the backend.
              <div className="mt-2 rounded-xl border bg-gray-50 p-3 text-sm">
                <div className="font-semibold text-gray-900">{confirmDelete.row?.code || "—"}</div>
                <div className="text-xs text-gray-500">{confirmDelete.row?.name || "—"}</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNow}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
