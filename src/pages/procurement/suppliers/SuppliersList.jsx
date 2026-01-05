// src/pages/procurement/suppliers/SuppliersList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import {
  Building2,
  CircleCheck,
  CircleX,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Truck,
} from "lucide-react";

/**
 * PCBxpress – Suppliers List
 * Location: src/pages/procurement/suppliers/SuppliersList.jsx
 *
 * Suggested APIs (adjust to your backend):
 *  GET    /procurement/suppliers?search=&status=&page=&limit=
 *  DELETE /procurement/suppliers/:id
 *
 * Optional:
 *  PATCH  /procurement/suppliers/:id   (status changes)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function normalizeDate(v) {
  if (!v) return "—";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}

function statusPill(status) {
  const s = String(status || "active").toLowerCase();
  const base = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium";
  if (s === "inactive") {
    return (
      <span className={cx(base, "border-gray-200 bg-gray-50 text-gray-700")}>
        <CircleX className="h-3.5 w-3.5" />
        Inactive
      </span>
    );
  }
  if (s === "blocked") {
    return (
      <span className={cx(base, "border-red-200 bg-red-50 text-red-700")}>
        <ShieldAlert className="h-3.5 w-3.5" />
        Blocked
      </span>
    );
  }
  return (
    <span className={cx(base, "border-emerald-200 bg-emerald-50 text-emerald-700")}>
      <CircleCheck className="h-3.5 w-3.5" />
      Active
    </span>
  );
}

function getSupplierId(s) {
  return s?.id ?? s?._id ?? s?.supplier_id ?? s?.supplierId;
}

export default function SuppliersList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rows, setRows] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // Pagination (simple)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const pageCount = useMemo(() => {
    const safe = Math.max(1, Math.ceil(Number(total || 0) / Number(limit || 1)));
    return safe;
  }, [total, limit]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => String(r.status || "active").toLowerCase() === "active").length;
    const inactive = rows.filter((r) => String(r.status || "").toLowerCase() === "inactive").length;
    const blocked = rows.filter((r) => String(r.status || "").toLowerCase() === "blocked").length;
    return { active, inactive, blocked };
  }, [rows]);

  async function fetchSuppliers({ soft = false } = {}) {
    if (!soft) setLoading(true);
    setRefreshing(true);

    try {
      const params = {
        page,
        limit,
      };
      if (search?.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;

      const res = await api.get("/procurement/suppliers", { params });

      // Accept common response shapes:
      // 1) { data: { items: [], total, page, limit } }
      // 2) { items: [], total, page, limit }
      // 3) [] (no pagination)
      const payload = res.data?.data ?? res.data;

      let items = [];
      let t = 0;
      let p = page;
      let l = limit;

      if (Array.isArray(payload)) {
        items = payload;
        t = payload.length;
      } else {
        items =
          payload?.items ||
          payload?.rows ||
          payload?.results ||
          payload?.data ||
          payload?.suppliers ||
          [];
        t = payload?.total ?? payload?.count ?? items.length ?? 0;
        p = payload?.page ?? page;
        l = payload?.limit ?? limit;
      }

      const normalized = (Array.isArray(items) ? items : []).map((s) => ({
        id: getSupplierId(s),
        name: s?.name ?? "—",
        code: s?.code ?? s?.supplier_code ?? "—",
        status: s?.status ?? "active",
        email: s?.email ?? "",
        phone: s?.phone ?? s?.mobile ?? "",
        gstin: s?.gstin ?? s?.tax_id ?? "",
        lead_time_days: s?.lead_time_days ?? s?.leadTimeDays ?? "",
        payment_terms: s?.payment_terms ?? s?.paymentTerms ?? "",
        created_at: normalizeDate(s?.created_at ?? s?.createdAt),
        updated_at: normalizeDate(s?.updated_at ?? s?.updatedAt),
      }));

      setRows(normalized);
      setTotal(Number(t || 0));
      setPage(Number(p || page));
      setLimit(Number(l || limit));
    } catch (e) {
      toast({
        title: "Failed to load suppliers",
        description: e?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Initial + whenever filters/pagination change
  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchSuppliers({ soft: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openDelete(row) {
    setDeleteTarget(row);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await api.delete(`/procurement/suppliers/${deleteTarget.id}`);
      toast({ title: "Deleted", description: "Supplier deleted successfully." });
      setDeleteOpen(false);
      setDeleteTarget(null);
      // Refetch current page
      fetchSuppliers({ soft: true });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || "Unable to delete supplier.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setPage(1);
    setLimit(12);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10">
              <Truck className="h-5 w-5 text-[#dc2551]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Suppliers</h1>
              <p className="mt-0.5 text-sm text-gray-600">
                Approved vendors and procurement master data for PCBxpress.
              </p>
            </div>
          </div>

          {/* Tiny stats */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border bg-white px-2.5 py-1 text-gray-700">
              Total: <span className="font-semibold">{total}</span>
            </span>
            <span className="rounded-full border bg-emerald-50 px-2.5 py-1 text-emerald-700">
              Active: <span className="font-semibold">{stats.active}</span>
            </span>
            <span className="rounded-full border bg-gray-50 px-2.5 py-1 text-gray-700">
              Inactive: <span className="font-semibold">{stats.inactive}</span>
            </span>
            <span className="rounded-full border bg-red-50 px-2.5 py-1 text-red-700">
              Blocked: <span className="font-semibold">{stats.blocked}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchSuppliers({ soft: true })} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/procurement/suppliers/create">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
            Filters
          </CardTitle>
          <CardDescription>Search vendors by name/code and status.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by supplier name, code, GSTIN…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="md:col-span-3 flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={resetFilters}>
                <Filter className="h-4 w-4" />
                Reset
              </Button>

              <Button variant="outline" className="gap-2" onClick={() => setLimit((p) => (p === 12 ? 24 : 12))}>
                <Building2 className="h-4 w-4" />
                Rows: {limit}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading suppliers…
            </div>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10">
              <Truck className="h-6 w-6 text-[#dc2551]" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900">No suppliers found</h3>
            <p className="mt-1 text-sm text-gray-600">Try adjusting filters or add your first supplier.</p>
            <div className="mt-4">
              <Button className="bg-[#dc2551] hover:bg-[#b02045]" asChild>
                <Link to="/procurement/suppliers/create">Add Supplier</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {rows.map((r) => (
              <SupplierCard
                key={r.id}
                row={r}
                onOpen={() => navigate(`/procurement/suppliers/${r.id}`)}
                onDelete={() => openDelete(r)}
              />
            ))}
          </div>

          {/* Pagination */}
          <Card className="border-gray-200">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{pageCount}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setPage(1)} disabled={page <= 1}>
                  First
                </Button>
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page >= pageCount}
                >
                  Next
                </Button>
                <Button variant="outline" onClick={() => setPage(pageCount)} disabled={page >= pageCount}>
                  Last
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete supplier?"
        description={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.name}". If there are linked POs/GRNs, the server may block deletion.`
            : "This action cannot be undone."
        }
        confirmText={deleting ? "Deleting…" : "Delete"}
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

function SupplierCard({ row, onOpen, onDelete }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-gray-900">{row.name}</p>
              {statusPill(row.status)}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-800">{row.code}</span>
              </span>

              {row.gstin ? (
                <span className="truncate">
                  GSTIN: <span className="font-medium text-gray-800">{row.gstin}</span>
                </span>
              ) : (
                <span className="text-gray-400">GSTIN: —</span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lead Time</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {row.lead_time_days ? `${row.lead_time_days} days` : "—"}
                </p>
              </div>

              <div className="rounded-xl border bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment Terms</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                  {row.payment_terms ? row.payment_terms : "—"}
                </p>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Updated: <span className="font-medium text-gray-700">{row.updated_at}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={onOpen}>
              Open
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function statusPill(status) {
  const s = String(status || "active").toLowerCase();
  const base = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium";
  if (s === "inactive") {
    return (
      <span className={cx(base, "border-gray-200 bg-gray-50 text-gray-700")}>
        <CircleX className="h-3.5 w-3.5" />
        Inactive
      </span>
    );
  }
  if (s === "blocked") {
    return (
      <span className={cx(base, "border-red-200 bg-red-50 text-red-700")}>
        <ShieldAlert className="h-3.5 w-3.5" />
        Blocked
      </span>
    );
  }
  return (
    <span className={cx(base, "border-emerald-200 bg-emerald-50 text-emerald-700")}>
      <CircleCheck className="h-3.5 w-3.5" />
      Active
    </span>
  );
}
