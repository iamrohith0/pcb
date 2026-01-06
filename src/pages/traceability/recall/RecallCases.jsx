// src/pages/traceability/recall/RecallCases.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    open: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    investigating: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    containment: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    closed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    cancelled: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", cls)}>
      {status || "—"}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const s = (severity || "").toLowerCase();
  const map = {
    low: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    medium: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    high: "bg-red-50 text-red-700 ring-1 ring-red-200",
    critical: "bg-red-50 text-red-700 ring-1 ring-red-200",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", cls)}>
      {severity || "—"}
    </span>
  );
}

function safeText(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (pageSize || 20)));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs text-gray-500">
        Page <span className="font-semibold text-gray-800">{page}</span> of{" "}
        <span className="font-semibold text-gray-800">{pages}</span> • Total{" "}
        <span className="font-semibold text-gray-800">{total ?? 0}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function RecallCases() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [severity, setSeverity] = useState(searchParams.get("severity") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize") || 20));

  const statusOptions = ["", "Open", "Investigating", "Containment", "Closed", "Cancelled"];
  const severityOptions = ["", "Low", "Medium", "High", "Critical"];

  const queryObj = useMemo(
    () => ({
      q: q || undefined,
      status: status || undefined,
      severity: severity || undefined,
      page,
      pageSize,
    }),
    [q, status, severity, page, pageSize]
  );

  const syncUrl = (next) => {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.status) sp.set("status", next.status);
    if (next.severity) sp.set("severity", next.severity);
    if (next.page) sp.set("page", String(next.page));
    if (next.pageSize) sp.set("pageSize", String(next.pageSize));
    setSearchParams(sp, { replace: true });
  };

  const fetchCases = async (override = {}) => {
    const params = { ...queryObj, ...override };
    setLoading(true);
    setError("");
    try {
      // Expected API (adjust to your backend):
      // GET /traceability/recalls
      // params: q, status, severity, page, pageSize
      // -> { data: { items: [], total: number } } OR { items, total }
      const res = await api.get("/traceability/recalls", { params });
      const data = res?.data?.data ?? res?.data;

      const items = data?.items ?? data?.rows ?? data?.results ?? [];
      const t = data?.total ?? items.length ?? 0;

      setRows(Array.isArray(items) ? items : []);
      setTotal(Number.isFinite(t) ? t : 0);

      toast({
        title: "Recall cases loaded",
        description: "Showing recall cases based on your filters.",
      });

      syncUrl(params);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load recall cases.";
      setError(msg);
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setPage(1);
    fetchCases({ page: 1 });
  };

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setSeverity("");
    setPage(1);
    setPageSize(20);
    const next = { q: undefined, status: undefined, severity: undefined, page: 1, pageSize: 20 };
    syncUrl(next);
    fetchCases(next);
  };

  const onPage = (p) => {
    setPage(p);
    fetchCases({ page: p });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Recall Cases</h1>
              <p className="text-sm text-gray-600">
                Track containment, impacted lots, and shipment notifications (PCBxpress).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Traceability & compliance
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Shipment impact visibility
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5" />
              Audit-ready actions
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchCases()} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          {/* If you later add create page: /traceability/recall/new */}
          <Link to="/traceability/recall/new">
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
              <Plus className="h-4 w-4" />
              New Recall
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 flex-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Case ID, lot/batch, WO, customer, complaint, shipment…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {statusOptions.map((s) => (
                  <option key={s || "all"} value={s}>
                    {s || "All"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {severityOptions.map((s) => (
                  <option key={s || "all"} value={s}>
                    {s || "All"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={applyFilters} disabled={loading}>
              <Filter className="h-4 w-4" />
              Apply
            </Button>
            <Button variant="outline" onClick={clearFilters} disabled={loading}>
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border bg-amber-50 p-3 text-xs text-amber-900">
          <span className="font-semibold">Recall flow:</span> open case → investigate (AOI/eTest/NCR) → containment (hold
          lots/shipments) → notify customers → closure with CAPA evidence.
        </div>
      </Card>

      {/* Table / list */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#dc2551]" />
              <p className="text-sm font-semibold text-gray-900">Cases</p>
              <Badge className="bg-gray-100 text-gray-700">Total: {total}</Badge>
            </div>

            <div className="text-xs text-gray-500">
              Tip: click “View” to open details and impact links (lots, shipments, customers).
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 p-5 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading recall cases…
          </div>
        ) : error ? (
          <div className="p-5">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-semibold">Unable to load cases</p>
                  <p className="mt-1 text-xs text-red-700/90">{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No recall cases found for the selected filters.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Impacted</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Opened</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.map((r) => {
                  const id = r?.id ?? r?.case_id ?? r?.caseNo ?? r?.case_no;
                  const code = r?.case_code ?? r?.code ?? (id ? `RC-${id}` : "Recall");
                  const impactedLots = r?.impacted_lots_count ?? r?.impactedLots ?? r?.lots_count ?? 0;
                  const impactedShipments = r?.impacted_shipments_count ?? r?.impactedShipments ?? r?.shipments_count ?? 0;

                  return (
                    <tr key={String(id ?? code)} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-gray-900">{safeText(code)}</div>
                          <div className="text-xs text-gray-500">
                            {safeText(r?.title || r?.summary || r?.reason || "—")}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                            <Badge variant="secondary">WO: {safeText(r?.work_order_no || r?.workOrderNo)}</Badge>
                            <Badge variant="secondary">Lot/Batch: {safeText(r?.lot_code || r?.lotCode)}</Badge>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={r?.status} />
                      </td>

                      <td className="px-4 py-3">
                        <SeverityBadge severity={r?.severity} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs text-gray-700">
                          <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-gray-400" />
                            Lots: <span className="font-semibold">{impactedLots}</span>
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            Shipments: <span className="font-semibold">{impactedShipments}</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-800">
                        {safeText(r?.customer_name || r?.customerName || r?.customer)}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-600">
                        {fmtDate(r?.opened_at || r?.created_at || r?.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link to={`/traceability/recall/${encodeURIComponent(String(id))}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && (
          <div className="border-t bg-white px-4 py-3">
            <Pagination page={page} pageSize={pageSize} total={total} onPage={onPage} />
          </div>
        )}
      </Card>

      {/* Footer helper */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              Use genealogy links to prove “where-used” and contain defects fast.
            </div>
            <div className="mt-1 flex items-center gap-2 text-gray-500">
              <BadgeCheck className="h-4 w-4 text-gray-400" />
              Keep CAPA references attached before closing a case.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/traceability/lot-genealogy/search")}>
              <Search className="h-4 w-4" />
              Genealogy Search
            </Button>
            <Button
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              onClick={() => navigate("/traceability/recall/new")}
            >
              <Plus className="h-4 w-4" />
              Create Recall
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
