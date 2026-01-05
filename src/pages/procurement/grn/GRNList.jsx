// src/pages/procurement/grn/GRNList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Hash,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(d) {
  if (!d) return "-";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return String(d);
  }
}

function StatusBadge({ status }) {
  const s = String(status || "DRAFT").toUpperCase();
  const conf =
    {
      DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
      RECEIVED: { label: "Received", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      PARTIAL: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
      QC_PENDING: { label: "QC Pending", className: "bg-blue-50 text-blue-700 border-blue-200" },
      QC_PASSED: { label: "QC Passed", className: "bg-green-50 text-green-700 border-green-200" },
      QC_FAILED: { label: "QC Failed", className: "bg-rose-50 text-rose-700 border-rose-200" },
      PUTAWAY: { label: "Putaway", className: "bg-violet-50 text-violet-700 border-violet-200" },
      CANCELLED: { label: "Cancelled", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
    }[s] || { label: s, className: "bg-slate-100 text-slate-700 border-slate-200" };

  return (
    <Badge className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", conf.className)}>
      {conf.label}
    </Badge>
  );
}

/**
 * Replace these mocks with real API calls later:
 * - GET /procurement/grn?query=&status=&from=&to=&warehouse=&page=&limit=
 * - GET /procurement/grn/export?...
 */
function mockFetchGRNs() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          grnNo: "GRN-0001",
          poNo: "PO-2026-0112",
          supplier: "Shree Copper Suppliers",
          warehouse: "Main Stores",
          receivedDate: new Date().toISOString(),
          vehicleNo: "KL-07-AB-4521",
          status: "QC_PENDING",
          itemsCount: 2,
        },
        {
          id: 2,
          grnNo: "GRN-0002",
          poNo: "PO-2026-0115",
          supplier: "FR4 Distributors India",
          warehouse: "Incoming Bay",
          receivedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          vehicleNo: "TN-09-CD-8890",
          status: "QC_PASSED",
          itemsCount: 5,
        },
        {
          id: 3,
          grnNo: "GRN-0003",
          poNo: "PO-2026-0121",
          supplier: "ChemLab Supplies",
          warehouse: "Chem Store",
          receivedDate: new Date(Date.now() - 86400000 * 6).toISOString(),
          vehicleNo: "KA-01-ZZ-1100",
          status: "PUTAWAY",
          itemsCount: 3,
        },
        {
          id: 4,
          grnNo: "GRN-0004",
          poNo: "PO-2026-0124",
          supplier: "Stencil & Tools Co",
          warehouse: "Tool Crib",
          receivedDate: new Date(Date.now() - 86400000 * 10).toISOString(),
          vehicleNo: "KL-12-AA-3333",
          status: "QC_FAILED",
          itemsCount: 1,
        },
      ]);
    }, 450);
  });
}

export default function GRNList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sp, setSp] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters (synced with URL)
  const [query, setQuery] = useState(sp.get("q") || "");
  const [status, setStatus] = useState(sp.get("status") || "ALL");
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");
  const [warehouse, setWarehouse] = useState(sp.get("wh") || "ALL");

  const warehouses = useMemo(() => ["ALL", "Main Stores", "Incoming Bay", "Chem Store", "Tool Crib"], []);
  const statuses = useMemo(
    () => ["ALL", "DRAFT", "RECEIVED", "PARTIAL", "QC_PENDING", "QC_PASSED", "QC_FAILED", "PUTAWAY", "CANCELLED"],
    []
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await mockFetchGRNs();
      setRows(data);
    } catch (e) {
      toast({ title: "Failed to load GRNs", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (rows || []).filter((r) => {
      const matchesQuery =
        !q ||
        String(r.grnNo || "").toLowerCase().includes(q) ||
        String(r.poNo || "").toLowerCase().includes(q) ||
        String(r.supplier || "").toLowerCase().includes(q) ||
        String(r.vehicleNo || "").toLowerCase().includes(q);

      const matchesStatus = status === "ALL" || String(r.status || "").toUpperCase() === status;
      const matchesWH = warehouse === "ALL" || String(r.warehouse || "") === warehouse;

      const rDate = r.receivedDate ? new Date(r.receivedDate) : null;
      const fromOk = !from || (rDate && rDate >= new Date(from));
      const toOk = !to || (rDate && rDate <= new Date(new Date(to).setHours(23, 59, 59, 999)));

      return matchesQuery && matchesStatus && matchesWH && fromOk && toOk;
    });
  }, [rows, query, status, warehouse, from, to]);

  const syncUrl = () => {
    const next = {};
    if (query.trim()) next.q = query.trim();
    if (status && status !== "ALL") next.status = status;
    if (warehouse && warehouse !== "ALL") next.wh = warehouse;
    if (from) next.from = from;
    if (to) next.to = to;
    setSp(next, { replace: true });
  };

  useEffect(() => {
    syncUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, warehouse, from, to]);

  const resetFilters = () => {
    setQuery("");
    setStatus("ALL");
    setWarehouse("ALL");
    setFrom("");
    setTo("");
  };

  const handleExport = () => {
    toast({ title: "Export", description: "Hook this to your export endpoint (CSV/Excel)." });
    // window.location.href = `/api/procurement/grn/export?...`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-600" />
                GRN List
              </CardTitle>
              <CardDescription>Track Goods Receipt Notes from PO receipt to QC and putaway.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              {/* If you later implement GRN Create page */}
              <Button
                className="bg-[#dc2551] hover:bg-[#b02045]"
                onClick={() => toast({ title: "Create GRN", description: "Add a GRN Create page and route, then link here." })}
              >
                <Plus className="mr-2 h-4 w-4" />
                New GRN
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <Label className="text-xs text-gray-500">Search</Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="GRN no / PO no / Supplier / Vehicle..."
                  className="pl-9"
                />
                {query && (
                  <button
                    type="button"
                    className="absolute right-2 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500">Status</Label>
              <select
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All" : s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500">Warehouse</Label>
              <select
                className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w === "ALL" ? "All" : w}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">From</Label>
                <div className="relative mt-1">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">To</Label>
                <div className="relative mt-1">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Filter className="h-4 w-4" />
                Showing <span className="font-semibold text-gray-900">{filtered.length}</span> GRNs
              </div>

              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      GRN
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left">PO</th>
                  <th className="px-3 py-2 text-left">Supplier</th>
                  <th className="px-3 py-2 text-left">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Warehouse
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Received
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left">Vehicle</th>
                  <th className="px-3 py-2 text-left">Items</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading..." : "No GRNs found for your filters."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-gray-900">{r.grnNo}</div>
                        <div className="text-xs text-gray-500">ID: {r.id}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{r.poNo}</td>
                      <td className="px-3 py-2">
                        <div className="text-gray-900 font-medium">{r.supplier}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{r.warehouse}</td>
                      <td className="px-3 py-2 text-gray-700">{formatDate(r.receivedDate)}</td>
                      <td className="px-3 py-2 text-gray-700">{r.vehicleNo || "-"}</td>
                      <td className="px-3 py-2 text-gray-700">{r.itemsCount}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={r.status} />
                        {String(r.status || "").toUpperCase() === "QC_PASSED" && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Ready for putaway
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/procurement/grn/${r.id}`)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Hint */}
          <div className="mt-3 text-xs text-gray-500">
            Tip: Add routes for <span className="font-medium">/procurement/grn</span> and{" "}
            <span className="font-medium">/procurement/grn/:id</span> to connect GRN List → GRN Details.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
