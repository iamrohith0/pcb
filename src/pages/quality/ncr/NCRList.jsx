// src/pages/quality/ncr/NCRList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    AlertTriangle,
    ArrowUpDown,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Eye,
    Filter,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STAGES = [
  "Incoming",
  "Innerlayer",
  "Lamination",
  "Drilling",
  "Desmear",
  "Plating",
  "Imaging/Etch",
  "Soldermask",
  "Legend",
  "Surface Finish",
  "AOI",
  "E-Test",
  "Final",
  "Packing",
];

const SEVERITIES = [
  { value: "", label: "All" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];

const DISPOSITIONS = [
  { value: "", label: "All" },
  { value: "hold", label: "Hold" },
  { value: "rework", label: "Rework" },
  { value: "scrap", label: "Scrap" },
  { value: "use_as_is", label: "Use As Is" },
  { value: "sort_100", label: "100% Sort" },
  { value: "return_to_supplier", label: "Return to Supplier" },
];

const STATUSES = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "contained", label: "Contained" },
  { value: "in_review", label: "In Review" },
  { value: "closed", label: "Closed" },
];

const SOURCES = [
  { value: "", label: "All" },
  { value: "inspection", label: "Inspection" },
  { value: "aoi", label: "AOI" },
  { value: "etest", label: "E-Test" },
  { value: "incoming", label: "Incoming QC" },
  { value: "process", label: "In-Process" },
  { value: "customer", label: "Customer Return" },
];

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

function fmtDate(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
    return dt.toISOString().slice(0, 10);
  } catch {
    return String(d).slice(0, 10);
  }
}

function severityBadge(sev) {
  if (sev === "critical") return "destructive";
  if (sev === "major") return "outline";
  return "secondary";
}

export default function NCRList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  // Table data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [pageInfo, setPageInfo] = useState({
    page: Number(sp.get("page") || 1),
    pageSize: Number(sp.get("pageSize") || 20),
    total: 0,
    totalPages: 1,
  });

  // Filters (keep URL in sync)
  const [q, setQ] = useState(sp.get("q") || "");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [source, setSource] = useState(sp.get("source") || "");
  const [stage, setStage] = useState(sp.get("stage") || "");
  const [severity, setSeverity] = useState(sp.get("severity") || "");
  const [disposition, setDisposition] = useState(sp.get("disposition") || "");
  const [fromDate, setFromDate] = useState(sp.get("from") || "");
  const [toDate, setToDate] = useState(sp.get("to") || "");

  // Sorting
  const [sortBy, setSortBy] = useState(sp.get("sortBy") || "created_at");
  const [sortDir, setSortDir] = useState(sp.get("sortDir") || "desc"); // asc/desc

  const paramsForApi = useMemo(() => {
    return {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,

      q: q || undefined,
      status: status || undefined,
      source_type: source || undefined,
      stage: stage || undefined,
      severity: severity || undefined,
      disposition: disposition || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,

      sortBy,
      sortDir,
    };
  }, [
    pageInfo.page,
    pageInfo.pageSize,
    q,
    status,
    source,
    stage,
    severity,
  ]);

  // NOTE: Above we referenced severity_triage accidentally, fix with correct dependency list
  // (Keeping code clean: re-declare properly)
  const apiParams = useMemo(
    () => ({
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,

      q: q || undefined,
      status: status || undefined,
      source_type: source || undefined,
      stage: stage || undefined,
      severity: severity || undefined,
      disposition: disposition || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,

      sortBy,
      sortDir,
    }),
    [
      pageInfo.page,
      pageInfo.pageSize,
      q,
      status,
      source,
      stage,
      severity,
      disposition,
      fromDate,
      toDate,
      sortBy,
      sortDir,
    ]
  );

  const syncUrl = (next = {}) => {
    const nextParams = new URLSearchParams(sp);

    const setOrDel = (k, v) => {
      if (v === undefined || v === null || v === "") nextParams.delete(k);
      else nextParams.set(k, String(v));
    };

    setOrDel("page", next.page ?? pageInfo.page);
    setOrDel("pageSize", next.pageSize ?? pageInfo.pageSize);

    setOrDel("q", next.q ?? q);
    setOrDel("status", next.status ?? status);
    setOrDel("source", next.source ?? source);
    setOrDel("stage", next.stage ?? stage);
    setOrDel("severity", next.severity ?? severity);
    setOrDel("disposition", next.disposition ?? disposition);
    setOrDel("from", next.from ?? fromDate);
    setOrDel("to", next.to ?? toDate);

    setOrDel("sortBy", next.sortBy ?? sortBy);
    setOrDel("sortDir", next.sortDir ?? sortDir);

    setSp(nextParams, { replace: true });
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      // Expected: GET /quality/ncr
      // Response shapes supported:
      // 1) { data: [...], meta: { page, pageSize, total, totalPages } }
      // 2) { data: { data: [...], meta: {...}} }
      // 3) { data: [...] } (no pagination)
      const res = await api.get("/quality/ncr", { params: apiParams });

      const payload = res?.data?.data ?? res?.data;

      let list = [];
      let meta = null;

      if (Array.isArray(payload)) {
        list = payload;
      } else if (payload?.data && Array.isArray(payload.data)) {
        list = payload.data;
        meta = payload.meta || payload.pagination || null;
      } else if (Array.isArray(payload?.items)) {
        list = payload.items;
        meta = payload.meta || payload.pagination || null;
      } else {
        list = [];
      }

      setRows(list);

      if (meta) {
        setPageInfo((p) => ({
          ...p,
          page: Number(meta.page ?? p.page),
          pageSize: Number(meta.pageSize ?? meta.per_page ?? p.pageSize),
          total: Number(meta.total ?? meta.total_count ?? list.length),
          totalPages: Number(meta.totalPages ?? meta.total_pages ?? 1),
        }));
      } else {
        // If backend doesn't paginate
        setPageInfo((p) => ({ ...p, total: list.length, totalPages: 1 }));
      }
    } catch (err) {
      console.warn("NCR list fetch failed:", err);
      toast({
        title: "Failed to load NCRs",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Keep URL updated on mount from initial state
    syncUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiParams]);

  const applyFilters = () => {
    // reset to page 1
    setPageInfo((p) => ({ ...p, page: 1 }));
    syncUrl({ page: 1 });
    // fetch triggered by apiParams
  };

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setSource("");
    setStage("");
    setSeverity("");
    setDisposition("");
    setFromDate("");
    setToDate("");
    setSortBy("created_at");
    setSortDir("desc");
    setPageInfo((p) => ({ ...p, page: 1 }));

    setSp(new URLSearchParams(), { replace: true });
  };

  const toggleSort = (field) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortDir("asc");
      syncUrl({ sortBy: field, sortDir: "asc", page: 1 });
      setPageInfo((p) => ({ ...p, page: 1 }));
      return;
    }
    const nextDir = sortDir === "asc" ? "desc" : "asc";
    setSortDir(nextDir);
    syncUrl({ sortDir: nextDir, page: 1 });
    setPageInfo((p) => ({ ...p, page: 1 }));
  };

  const goPage = (nextPage) => {
    const safe = Math.max(1, Math.min(pageInfo.totalPages || 1, nextPage));
    setPageInfo((p) => ({ ...p, page: safe }));
    syncUrl({ page: safe });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">NCR List</h1>
            <p className="text-sm text-gray-500">
              Track non-conformances across PCB stages (incoming, AOI, E-Test, final).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchRows} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
            <Link to="/quality/ncr/create">
              <Plus className="h-4 w-4" />
              New NCR
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="lg:col-span-2 space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="NCR No / WO / Lot / Customer / Part"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Stage</Label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="">All</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label>Disposition</Label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
            >
              {DISPOSITIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>From</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-wrap items-end justify-end gap-2">
            <Button variant="outline" className="gap-2" type="button" onClick={clearFilters}>
              <XCircle className="h-4 w-4" />
              Clear
            </Button>
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" type="button" onClick={applyFilters}>
              <Filter className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 hover:text-gray-900"
                    onClick={() => toggleSort("ncr_no")}
                    title="Sort by NCR No"
                  >
                    NCR
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-4 py-3">WO / Lot</th>
                <th className="px-4 py-3">Customer / Part</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 hover:text-gray-900"
                    onClick={() => toggleSort("stage")}
                    title="Sort by Stage"
                  >
                    Stage <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Disposition</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 hover:text-gray-900"
                    onClick={() => toggleSort("created_at")}
                    title="Sort by Created Date"
                  >
                    Created <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading NCRs...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-600">
                    No NCRs found.
                  </td>
                </tr>
              ) : (
                safeArr(rows).map((r) => {
                  const id = r.id;
                  const ncrNo = r.ncr_no || r.number || `NCR-${id}`;
                  const woNo = r.work_order_no || r.work_order?.work_order_no || r.work_order?.number || "-";
                  const lotNo = r.lot_no || r.lot?.lot_no || r.lot?.number || "-";
                  const cust = r.customer_name || r.work_order?.customer_name || "-";
                  const part = r.part_no || r.work_order?.part_no || "-";

                  const rStage = r.stage || "-";
                  const rSource = r.source_type || r.source || "-";
                  const rSev = r.severity || "-";
                  const rDisp = r.disposition || "-";
                  const rStatus = r.status || "open";
                  const created = fmtDate(r.created_at || r.createdAt || r.date || r.detection_date);

                  return (
                    <tr key={id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{ncrNo}</p>
                            <p className="truncate text-xs text-gray-500">{r.defect_code || r.defect || "—"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-gray-900">{woNo}</p>
                        <p className="text-xs text-gray-500">{lotNo}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-gray-900">{cust}</p>
                        <p className="text-xs text-gray-500">{part}</p>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                          {rStage}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="secondary">{String(rSource).toUpperCase()}</Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant={severityBadge(rSev)} className={cx(rSev === "major" ? "border-amber-200 bg-amber-50 text-amber-700" : "")}>
                          {String(rSev).toUpperCase()}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                          {String(rDisp).replace(/_/g, " ")}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-gray-600">{created}</td>

                      <td className="px-4 py-3">
                        {rStatus === "closed" ? (
                          <Badge className="gap-1 bg-green-600 text-white">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Closed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            {String(rStatus).replace(/_/g, " ")}
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/quality/ncr/${id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            {pageInfo.total ? (
              <span>
                Showing page <span className="font-semibold text-gray-700">{pageInfo.page}</span> of{" "}
                <span className="font-semibold text-gray-700">{pageInfo.totalPages}</span> • Total{" "}
                <span className="font-semibold text-gray-700">{pageInfo.total}</span>
              </span>
            ) : (
              <span>Traceable NCR register for compliance & audits.</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => goPage(pageInfo.page - 1)}
              disabled={loading || pageInfo.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => goPage(pageInfo.page + 1)}
              disabled={loading || pageInfo.page >= (pageInfo.totalPages || 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
