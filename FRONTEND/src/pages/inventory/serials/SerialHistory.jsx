// src/pages/inventory/serials/SerialHistory.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  Calendar as CalendarIcon,
  PackageSearch,
  ClipboardList,
  MapPin,
  UserCircle2,
  Building2,
  Hash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

// If you already have a serials service, replace this import with it.
import serialsService from "@/services/inventory/serials.service";

/**
 * SerialHistory.jsx
 * - Shows event history of a single serial number (and optionally item info)
 * - Includes filters: date range + event type + text search
 * - Supports CSV export (client-side) + refresh
 *
 * Assumed backend endpoints (adapt in services):
 *  GET /inventory/serials/:serial/history?type=&q=&from=&to=&page=&limit=
 *  GET /inventory/serials/:serial   (optional, for header info)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

function safeStr(v) {
  return v === null || v === undefined ? "" : String(v);
}

function downloadCSV(filename, rows) {
  const escape = (val) => {
    const s = safeStr(val);
    // escape quotes & wrap with quotes if needed
    if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EVENT_TYPES = [
  { value: "ALL", label: "All Events" },
  { value: "CREATE", label: "Created" },
  { value: "RECEIVE", label: "Received (GRN)" },
  { value: "MOVE", label: "Moved (Warehouse)" },
  { value: "ISSUE", label: "Issued (WO / Production)" },
  { value: "CONSUME", label: "Consumed" },
  { value: "RETURN", label: "Returned" },
  { value: "SCRAP", label: "Scrapped" },
  { value: "ADJUST", label: "Adjusted" },
  { value: "SHIP", label: "Shipped" },
  { value: "AUDIT", label: "Audited" },
];

function EventBadge({ type }) {
  const map = {
    CREATE: "bg-gray-100 text-gray-700 border border-gray-200",
    RECEIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    MOVE: "bg-blue-50 text-blue-700 border border-blue-200",
    ISSUE: "bg-amber-50 text-amber-700 border border-amber-200",
    CONSUME: "bg-orange-50 text-orange-700 border border-orange-200",
    RETURN: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    SCRAP: "bg-rose-50 text-rose-700 border border-rose-200",
    ADJUST: "bg-purple-50 text-purple-700 border border-purple-200",
    SHIP: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    AUDIT: "bg-slate-50 text-slate-700 border border-slate-200",
  };
  const cls = map[type] || "bg-gray-100 text-gray-700 border border-gray-200";
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", cls)}>{type}</span>;
}

function KeyValue({ k, v, icon: Icon }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-white p-3">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 text-gray-400" /> : null}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500">{k}</p>
        <p className="truncate text-sm font-medium text-gray-900">{v ?? "—"}</p>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2">
      <p className="text-xs text-gray-500">
        Page <span className="font-medium text-gray-900">{page}</span> of{" "}
        <span className="font-medium text-gray-900">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => onPage(page - 1)}>
          Prev
        </Button>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default function SerialHistory() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary identifier
  const serial = searchParams.get("serial") || "";

  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [type, setType] = useState(searchParams.get("type") || "ALL");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [showFilters, setShowFilters] = useState(true);

  // Paging
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [limit, setLimit] = useState(Number(searchParams.get("limit") || 20));

  // Data
  const [loading, setLoading] = useState(false);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [serialInfo, setSerialInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  // Sync URL params
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (q) next.set("q", q);
    else next.delete("q");

    if (type && type !== "ALL") next.set("type", type);
    else next.delete("type");

    if (from) next.set("from", from);
    else next.delete("from");

    if (to) next.set("to", to);
    else next.delete("to");

    if (page && page !== 1) next.set("page", String(page));
    else next.delete("page");

    if (limit && limit !== 20) next.set("limit", String(limit));
    else next.delete("limit");

    // Keep serial param stable
    if (serial) next.set("serial", serial);

    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, from, to, page, limit, serial]);

  const canFetch = useMemo(() => serial.trim().length > 0, [serial]);

  const fetchHeader = async () => {
    if (!canFetch) return;
    setHeaderLoading(true);
    try {
      // Optional endpoint — if not available, comment this out.
      const res = await serialsService.getSerial(serial.trim());
      setSerialInfo(res?.data ?? res);
    } catch (err) {
      // Not fatal; still show history if possible
      setSerialInfo(null);
    } finally {
      setHeaderLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!canFetch) return;
    setLoading(true);
    try {
      const res = await serialsService.getSerialHistory(serial.trim(), {
        q: q.trim() || undefined,
        type: type !== "ALL" ? type : undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        limit,
      });

      // Accept both: { data: { events, meta } } or { events, meta }
      const payload = res?.data ?? res;
      setEvents(payload?.events ?? []);
      setMeta(payload?.meta ?? { page: 1, totalPages: 1, total: payload?.events?.length ?? 0 });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load serial history. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canFetch) return;
    fetchHeader();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

  // Refetch when filters change (debounced for q)
  useEffect(() => {
    if (!canFetch) return;
    const t = setTimeout(() => {
      fetchHistory();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, from, to, page, limit]);

  const clearFilters = () => {
    setQ("");
    setType("ALL");
    setFrom("");
    setTo("");
    setPage(1);
    setLimit(20);
  };

  const exportCSV = () => {
    if (!events?.length) {
      toast({ title: "Nothing to export", description: "No events found for current filters." });
      return;
    }

    const rows = [
      ["Serial", "Event Type", "Timestamp", "Ref Type", "Ref No", "From", "To", "Qty", "By", "Notes"],
      ...events.map((e) => [
        serial,
        safeStr(e.type),
        safeStr(e.at || e.timestamp || e.createdAt),
        safeStr(e.refType || e.reference_type),
        safeStr(e.refNo || e.reference_no),
        safeStr(e.fromLocation || e.from || e.from_location),
        safeStr(e.toLocation || e.to || e.to_location),
        safeStr(e.qty ?? e.quantity ?? ""),
        safeStr(e.byName || e.by || e.userName || e.user),
        safeStr(e.notes || e.remark || ""),
      ]),
    ];

    const filename = `serial-history_${serial}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, rows);
    toast({ title: "Export started", description: `Downloading ${filename}` });
  };

  // Fallback UI when serial not provided
  if (!serial) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Serial History</h1>
              <p className="text-sm text-gray-500">Enter a serial to view complete event trail.</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-500" />
              Lookup Serial
            </CardTitle>
            <CardDescription>Open this page with a serial query param, e.g. ?serial=SN-000123</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Serial Number</Label>
            <Input
              placeholder="SN-000123"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = e.currentTarget.value?.trim();
                  if (value) setSearchParams({ serial: value });
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  const el = document.querySelector('input[placeholder="SN-000123"]');
                  const value = el?.value?.trim();
                  if (value) setSearchParams({ serial: value });
                }}
                className="bg-cyan-600 hover:bg-cyan-500"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" onClick={() => navigate("/inventory/serials")}>
                Go to Serials
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Serial History</h1>
              <Badge className="bg-[#DC2551]/10 text-[#DC2551] hover:bg-[#DC2551]/10">{serial}</Badge>
            </div>
            <p className="text-sm text-gray-500">
              End-to-end trace trail for this serial across stores, production, and dispatch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => fetchHistory()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={!events?.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowFilters((s) => !s)}
            className="bg-cyan-600 hover:bg-cyan-500"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {/* Serial Info */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KeyValue k="Serial" v={serial} icon={Hash} />
        <KeyValue k="Item / Material" v={serialInfo?.itemName || serialInfo?.item?.name || "—"} icon={PackageSearch} />
        <KeyValue k="Current Location" v={serialInfo?.locationName || serialInfo?.location || "—"} icon={MapPin} />
        <KeyValue k="Status" v={serialInfo?.status || "—"} icon={ClipboardList} />
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  Filters
                </CardTitle>
                <CardDescription>Search and narrow event trail.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-5">
                <Label>Search</Label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={q}
                    onChange={(e) => {
                      setPage(1);
                      setQ(e.target.value);
                    }}
                    placeholder="Search by ref no, notes, user, location..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <Label>Event Type</Label>
                <div className="mt-2">
                  {/* Your Select component might differ; adjust as needed */}
                  <select
                    value={type}
                    onChange={(e) => {
                      setPage(1);
                      setType(e.target.value);
                    }}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/30"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>From</Label>
                <div className="mt-2">
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setPage(1);
                      setFrom(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>To</Label>
                <div className="mt-2">
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setPage(1);
                      setTo(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-medium text-gray-900">{events.length}</span> of{" "}
                  <span className="font-medium text-gray-900">{meta?.total ?? events.length}</span> events
                </p>

                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Rows</Label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setPage(1);
                      setLimit(Number(e.target.value));
                    }}
                    className="h-9 rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/30"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Trail</CardTitle>
          <CardDescription>Chronological log of movements, issues, consumption, and audits.</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-gray-900">No events found</p>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">By</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {events.map((e, idx) => {
                    const ts = e.at || e.timestamp || e.createdAt;
                    const refType = e.refType || e.reference_type || "";
                    const refNo = e.refNo || e.reference_no || "";
                    const fromLoc = e.fromLocation || e.from || e.from_location || "—";
                    const toLoc = e.toLocation || e.to || e.to_location || "—";
                    const qty = e.qty ?? e.quantity ?? "—";
                    const by = e.byName || e.by || e.userName || e.user || "—";
                    const notes = e.notes || e.remark || "—";

                    // Optional reference links (adapt to your routes)
                    const refLink =
                      refType === "GRN"
                        ? `/procurement/grn/${refNo}`
                        : refType === "WO"
                        ? `/production/work-orders/${refNo}`
                        : refType === "SHIPMENT"
                        ? `/logistics/shipments/${refNo}`
                        : null;

                    return (
                      <tr key={e.id || idx} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <EventBadge type={e.type} />
                          </div>
                        </td>

                        <td className="px-3 py-3 text-sm text-gray-800">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            {formatDateTime(ts)}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-sm">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">{refType || "—"}</span>
                            {refLink ? (
                              <Link className="font-medium text-[#DC2551] hover:underline" to={refLink}>
                                {refNo || "Open"}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-900">{refNo || "—"}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-sm text-gray-700">{fromLoc}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{toLoc}</td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{qty}</td>

                        <td className="px-3 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <UserCircle2 className="h-4 w-4 text-gray-400" />
                            {by}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-sm text-gray-700">
                          <span className="line-clamp-2">{notes}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <Pagination
              page={meta?.page || page}
              totalPages={meta?.totalPages || 1}
              onPage={(p) => setPage(p)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ✅ REQUIRED SERVICE (create if not existing):
 * src/services/serials.service.js
 *
 * export default {
 *   getSerial(serial) { return api.get(`/inventory/serials/${serial}`) }
 *   getSerialHistory(serial, params) { return api.get(`/inventory/serials/${serial}/history`, { params }) }
 * }
 */
