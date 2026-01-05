// src/pages/inventory/lots/LotsList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  Barcode,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Filter,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import lotsService from "@/services/inventory/lots.service";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  QUARANTINE: { label: "Quarantine", icon: ShieldCheck, className: "bg-amber-50 text-amber-700 border-amber-200" },
  RELEASED: { label: "Released", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BLOCKED: { label: "Blocked", icon: XCircle, className: "bg-rose-50 text-rose-700 border-rose-200" },
  CONSUMED: { label: "Consumed", icon: PackageSearch, className: "bg-slate-50 text-slate-700 border-slate-200" },
};

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
}

function safe(v) {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

export default function LotsList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters / UI state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [onlyExpired, setOnlyExpired] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState("received_date"); // received_date | expiry_date | lot_number | qty_available
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Supports multiple backend shapes:
      // - res.data.lots
      // - res.data.data
      // - res.data
      const res = await lotsService.list?.({ q, status, onlyExpired, sortKey, sortDir });
      const data = res?.data?.lots ?? res?.data?.data ?? res?.data ?? [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Failed to load lots",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filter + sort (works even if backend list() ignores params)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const isExpired = (lot) => {
      if (!lot?.expiry_date) return false;
      const exp = new Date(lot.expiry_date);
      if (Number.isNaN(exp.getTime())) return false;
      const today = new Date().toISOString().slice(0, 10);
      return exp.toISOString().slice(0, 10) < today;
    };

    const normStatus = (s) => String(s || "QUARANTINE").toUpperCase();

    let out = rows.filter((r) => {
      const s = normStatus(r.status);

      if (status !== "ALL" && s !== status) return false;
      if (onlyExpired && !isExpired(r)) return false;

      if (!needle) return true;

      const hay = [
        r.lot_number ?? r.lotNumber ?? r.code ?? r.number,
        r.item_name ?? r.itemName ?? r.item?.name,
        r.item_code ?? r.itemCode ?? r.item?.code ?? r.item?.item_code,
        r.supplier_name ?? r.supplierName,
        r.supplier_lot_ref ?? r.supplierLotRef,
        r.warehouse,
        r.location,
        r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(needle);
    });

    const getSortVal = (r) => {
      if (sortKey === "lot_number") return String(r.lot_number ?? r.lotNumber ?? r.code ?? r.number ?? "");
      if (sortKey === "qty_available") return Number(r.qty_available ?? r.qtyAvailable ?? r.available_qty ?? 0);
      if (sortKey === "expiry_date") return r.expiry_date ? new Date(r.expiry_date).getTime() : 0;
      return r.received_date ? new Date(r.received_date).getTime() : 0;
    };

    out.sort((a, b) => {
      const av = getSortVal(a);
      const bv = getSortVal(b);
      if (av === bv) return 0;
      const dir = sortDir === "asc" ? 1 : -1;
      return av > bv ? dir : -dir;
    });

    return out;
  }, [rows, q, status, onlyExpired, sortKey, sortDir]);

  const totals = useMemo(() => {
    const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const received = filtered.reduce((sum, r) => sum + toNum(r.qty_received ?? r.qtyReceived ?? r.received_qty), 0);
    const available = filtered.reduce((sum, r) => sum + toNum(r.qty_available ?? r.qtyAvailable ?? r.available_qty), 0);
    return { received, available };
  }, [filtered]);

  const requestDelete = (lot) => {
    setDeleteTarget(lot);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const id = deleteTarget._id ?? deleteTarget.id;
      await lotsService.remove(id);
      toast({ title: "Lot deleted", description: "The lot has been removed." });
      setRows((prev) => prev.filter((x) => (x._id ?? x.id) !== id));
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const StatusBadge = ({ value }) => {
    const s = String(value || "QUARANTINE").toUpperCase();
    const meta = STATUS_META[s] || STATUS_META.QUARANTINE;
    const Icon = meta.icon;
    return (
      <Badge variant="secondary" className={cx("gap-1 border", meta.className)}>
        <Icon className="h-3.5 w-3.5" />
        {meta.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Lots</h1>
          <p className="text-sm text-gray-600">
            Track PCB material lots (laminates, prepregs, soldermask, chemicals) with expiry, QA gates and traceability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} className="gap-2">
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button asChild className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
            <Link to="/inventory/lots/create">
              <Plus className="h-4 w-4" />
              New Lot
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-gray-600" />
            Filters
          </CardTitle>
          <CardDescription>Search and narrow down lots by status and expiry.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search lot no, item, supplier, warehouse…"
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="ml-auto w-[160px] rounded-lg border bg-white px-2 py-1 text-sm outline-none"
              >
                <option value="ALL">All</option>
                <option value="QUARANTINE">Quarantine</option>
                <option value="RELEASED">Released</option>
                <option value="BLOCKED">Blocked</option>
                <option value="CONSUMED">Consumed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <ClipboardList className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Only Expired</span>
              <button
                type="button"
                onClick={() => setOnlyExpired((s) => !s)}
                className={cx(
                  "ml-auto inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors",
                  onlyExpired ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-gray-700 border-gray-200"
                )}
              >
                {onlyExpired ? "Yes" : "No"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-gray-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="inline-flex items-center gap-1">
                <PackageSearch className="h-4 w-4 text-gray-600" />
                {filtered.length} lots
              </span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Barcode className="h-4 w-4 text-gray-600" />
                received: <span className="font-semibold text-gray-900">{totals.received}</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-1">
                <PackageSearch className="h-4 w-4 text-gray-600" />
                available: <span className="font-semibold text-gray-900">{totals.available}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                className={cx(
                  "inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs",
                  sortKey === "received_date" ? "border-gray-300" : "border-gray-200"
                )}
                onClick={() => toggleSort("received_date")}
              >
                Received <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
              <button
                className={cx(
                  "inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs",
                  sortKey === "expiry_date" ? "border-gray-300" : "border-gray-200"
                )}
                onClick={() => toggleSort("expiry_date")}
              >
                Expiry <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
              <button
                className={cx(
                  "inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs",
                  sortKey === "qty_available" ? "border-gray-300" : "border-gray-200"
                )}
                onClick={() => toggleSort("qty_available")}
              >
                Available <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lot Register</CardTitle>
          <CardDescription>Click a lot to view full genealogy-ready details.</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="grid place-items-center py-14">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading lots...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
              No lots found.{" "}
              <Link className="text-[#dc2551] underline" to="/inventory/lots/create">
                Create a new lot
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <Th onClick={() => toggleSort("lot_number")} active={sortKey === "lot_number"}>
                      Lot No <ArrowUpDown className="h-3.5 w-3.5" />
                    </Th>
                    <Th>Item</Th>
                    <Th>Supplier</Th>
                    <Th onClick={() => toggleSort("received_date")} active={sortKey === "received_date"}>
                      Received <ArrowUpDown className="h-3.5 w-3.5" />
                    </Th>
                    <Th onClick={() => toggleSort("expiry_date")} active={sortKey === "expiry_date"}>
                      Expiry <ArrowUpDown className="h-3.5 w-3.5" />
                    </Th>
                    <Th onClick={() => toggleSort("qty_available")} active={sortKey === "qty_available"}>
                      Qty (Avail) <ArrowUpDown className="h-3.5 w-3.5" />
                    </Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filtered.map((r) => {
                    const id = r._id ?? r.id;
                    const lotNo = r.lot_number ?? r.lotNumber ?? r.code ?? r.number;
                    const itemName = r.item_name ?? r.itemName ?? r.item?.name;
                    const itemCode = r.item_code ?? r.itemCode ?? r.item?.code ?? r.item?.item_code;
                    const supplier = r.supplier_name ?? r.supplierName ?? "—";
                    const exp = r.expiry_date;
                    const expDate = exp ? fmtDate(exp) : "—";
                    const isExpired = (() => {
                      if (!exp) return false;
                      try {
                        const today = new Date().toISOString().slice(0, 10);
                        const d = new Date(exp).toISOString().slice(0, 10);
                        return d < today;
                      } catch {
                        return false;
                      }
                    })();

                    const qtyAvail = r.qty_available ?? r.qtyAvailable ?? r.available_qty;
                    const uom = r.uom ?? r.unit ?? r.item?.uom ?? r.item?.unit;

                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <button
                            className="inline-flex items-center gap-2 text-left font-medium text-gray-900 hover:text-[#dc2551]"
                            onClick={() => navigate(`/inventory/lots/${id}`)}
                          >
                            <Barcode className="h-4 w-4 text-gray-500" />
                            <span className="truncate">{safe(lotNo)}</span>
                          </button>
                          <div className="mt-1 text-xs text-gray-500">
                            Ref: {safe(r.supplier_lot_ref ?? r.supplierLotRef)}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{safe(itemName)}</div>
                          <div className="text-xs text-gray-500">{itemCode ? `Code: ${itemCode}` : "—"}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="text-gray-900">{safe(supplier)}</div>
                          <div className="text-xs text-gray-500">
                            WH: {safe(r.warehouse)} {r.location ? `• ${r.location}` : ""}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="inline-flex items-center gap-2 text-gray-900">
                            <CalendarDays className="h-4 w-4 text-gray-500" />
                            {fmtDate(r.received_date)}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <Badge
                            variant="secondary"
                            className={cx(
                              "border",
                              isExpired ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-700 border-slate-200"
                            )}
                          >
                            {expDate}
                          </Badge>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-semibold text-gray-900">
                            {safe(qtyAvail)} <span className="text-xs font-medium text-gray-600">{uom || ""}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Rec: {safe(r.qty_received ?? r.qtyReceived ?? r.received_qty)}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <StatusBadge value={r.status} />
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild className="gap-2">
                              <Link to={`/inventory/lots/${id}/edit`}>Edit</Link>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => requestDelete(r)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Lot?"
        description={
          <span>
            This will permanently remove{" "}
            <span className="font-semibold">
              {deleteTarget?.lot_number ?? deleteTarget?.lotNumber ?? deleteTarget?.code ?? deleteTarget?.number ?? "this lot"}
            </span>
            . If the lot is linked to WIP/production, prefer <span className="font-semibold">Block</span> instead of delete.
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

/* ---- table helpers ---- */
function Th({ children, className, onClick, active = false }) {
  const clickable = typeof onClick === "function";
  return (
    <th
      onClick={onClick}
      className={cx(
        "px-3 py-3 text-left",
        clickable ? "cursor-pointer select-none hover:text-gray-900" : "",
        active ? "text-gray-900" : "",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </th>
  );
}
