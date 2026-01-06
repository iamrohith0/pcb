// src/pages/sales/customers/CustomersList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import customersService from "@/services/sales/customers.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(val, fallback = "—") {
  if (val === null || val === undefined || val === "") return fallback;
  return String(val);
}

function formatAddress(c) {
  const parts = [c?.addressLine1, c?.addressLine2, c?.city, c?.state, c?.country, c?.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function statusBadge(status) {
  const s = String(status || "ACTIVE").toUpperCase();
  if (s === "ACTIVE") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>;
  if (s === "INACTIVE") return <Badge variant="secondary">Inactive</Badge>;
  if (s === "BLOCKED") return <Badge className="bg-rose-600 hover:bg-rose-600">Blocked</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}

export default function CustomersList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query params
  const pageParam = Number(searchParams.get("page") || 1);
  const sizeParam = Number(searchParams.get("size") || 10);
  const qParam = searchParams.get("q") || "";
  const statusParam = searchParams.get("status") || "all";

  // Local state
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: pageParam, size: sizeParam, total: 0, totalPages: 1 });

  const [q, setQ] = useState(qParam);
  const [status, setStatus] = useState(statusParam);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  const queryParams = useMemo(() => {
    const params = { page: pageParam, size: sizeParam };
    if (qParam?.trim()) params.q = qParam.trim();
    if (statusParam && statusParam !== "all") params.status = statusParam;
    return params;
  }, [pageParam, sizeParam, qParam, statusParam]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Expected response shape (recommended):
      // { data: { items: [], page: 1, size: 10, total: 0, totalPages: 1 } }
      // Fallback supported: { data: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 1 } } (Spring pageable)
      const res = await customersService.list(queryParams);
      const data = res?.data ?? {};

      const items = data.items ?? data.content ?? data.data ?? [];
      const page = data.page ?? (typeof data.number === "number" ? data.number + 1 : pageParam);
      const size = data.size ?? sizeParam;
      const total = data.total ?? data.totalElements ?? items.length ?? 0;
      const totalPages = data.totalPages ?? Math.max(1, Math.ceil((total || 0) / (size || 10)));

      setRows(Array.isArray(items) ? items : []);
      setMeta({ page, size, total, totalPages });
    } catch (err) {
      toast({
        title: "Failed to load customers",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    // reset page on filter change
    next.set("page", "1");
    next.set("size", String(sizeParam));

    if (q?.trim()) next.set("q", q.trim());
    else next.delete("q");

    if (status && status !== "all") next.set("status", status);
    else next.delete("status");

    setSearchParams(next);
  };

  const clearFilters = () => {
    setQ("");
    setStatus("all");
    setSearchParams({ page: "1", size: String(sizeParam) });
  };

  const goPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    next.set("size", String(sizeParam));
    setSearchParams(next);
  };

  const openDelete = (customer) => {
    setSelectedCustomer(customer);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer?.id) return;
    setDeleting(true);
    try {
      await customersService.remove(selectedCustomer.id);
      toast({ title: "Customer deleted", description: `${safe(selectedCustomer.name)} removed successfully.` });
      setConfirmOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Could not delete this customer.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    // Simple client-side export of current rows (not full DB export).
    const headers = [
      "Customer ID",
      "Customer Name",
      "Company",
      "Email",
      "Phone",
      "City",
      "State",
      "GSTIN",
      "Status",
    ];

    const lines = rows.map((c) => [
      safe(c.customerCode || c.code || c.id),
      safe(c.name),
      safe(c.companyName || c.company),
      safe(c.email),
      safe(c.phone),
      safe(c.city),
      safe(c.state),
      safe(c.gstin),
      safe(c.status),
    ]);

    const csv = [headers, ...lines]
      .map((arr) =>
        arr
          .map((v) => `"${String(v ?? "").replaceAll(`"`, `""`)}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pcbxpress-customers-page-${meta.page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500">
            Manage PCBxpress customers, contacts, and billing details for RFQs, quotes, and orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            Export (CSV)
          </Button>

          <Button asChild className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
            <Link to="new">
              <Plus className="h-4 w-4" />
              New Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-gray-500" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name / company / email / GSTIN..."
                  className="pl-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Status</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "active", "inactive", "blocked"].map((s) => {
                  const active = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cx(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        active ? "border-[#dc2551] bg-[#dc2551]/10 text-[#dc2551]" : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-end gap-2 md:justify-end">
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button onClick={applyFilters} className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
                <Filter className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Customer Directory</CardTitle>
            <div className="text-xs text-gray-500">
              Total: <span className="font-semibold text-gray-700">{meta.total}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading customers...
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-100">
                <Building2 className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or add a new customer.</p>
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => navigate("new")}
                  className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                >
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((c, idx) => (
                <motion.div
                  key={c.id ?? idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {safe(c.name, "Unnamed Customer")}
                      </span>
                      {statusBadge(c.status)}
                      {c.customerCode || c.code ? (
                        <Badge variant="outline" className="text-[11px]">
                          {safe(c.customerCode || c.code)}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-1 flex flex-col gap-1 text-xs text-gray-600 sm:flex-row sm:items-center sm:gap-4">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {safe(c.companyName || c.company, "Company not set")}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {safe(c.email)}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {safe(c.phone)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {formatAddress(c)}
                      </span>
                      {c.gstin ? (
                        <Badge variant="secondary" className="text-[11px]">
                          GSTIN: {c.gstin}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px]">
                          GSTIN: —
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button asChild variant="outline" className="gap-2">
                      <Link to={`/sales/customers/${c.id}`}>
                        <User2 className="h-4 w-4" />
                        View
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="gap-2">
                      <Link to={`/sales/customers/${c.id}/edit`}>
                        Edit
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => openDelete(c)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t bg-white px-4 py-3">
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{meta.page}</span> of{" "}
            <span className="font-semibold text-gray-700">{meta.totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => goPage(meta.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!canNext || loading} onClick={() => goPage(meta.page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete customer?"
        description={
          selectedCustomer
            ? `This will permanently delete "${safe(selectedCustomer.name)}". This can affect RFQs, quotations, and sales history.`
            : "This will permanently delete this customer."
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
