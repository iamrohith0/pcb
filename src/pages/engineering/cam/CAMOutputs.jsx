// src/pages/engineering/cam/CAMOutputs.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  FileArchive,
  FileCode2,
  FileText,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Tag,
  UploadCloud,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import camOutputsApi from "@/services/camOutputs.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return v;
  }
}

function normalizeList(resData) {
  const arr = resData?.items ?? resData?.data ?? resData ?? [];
  return Array.isArray(arr) ? arr : [];
}

const TYPE_STYLE = {
  "Gerber + Drill": "bg-emerald-50 text-emerald-700",
  "ODB++": "bg-blue-50 text-blue-700",
  "IPC2581": "bg-indigo-50 text-indigo-700",
  "Panel Drawing": "bg-amber-50 text-amber-700",
  "CAM Report": "bg-gray-100 text-gray-700",
  "Stackup Sheet": "bg-purple-50 text-purple-700",
  "Netlist/ET": "bg-pink-50 text-pink-700",
};

function TypeBadge({ type }) {
  const t = type || "CAM Report";
  return <Badge className={cx("rounded-full", TYPE_STYLE[t] || "bg-gray-100 text-gray-700")}>{t}</Badge>;
}

function fileIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("gerber") || t.includes("odb") || t.includes("ipc")) return FileCode2;
  if (t.includes("panel")) return FileText;
  if (t.includes("zip") || t.includes("archive")) return FileArchive;
  return Package;
}

export default function CAMOutputs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);

  // filters (URL-backed)
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [format, setFormat] = useState(searchParams.get("format") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [showFilters, setShowFilters] = useState(true);

  const syncUrl = (next = {}) => {
    const p = new URLSearchParams(searchParams);
    const setOrDel = (k, v) => {
      if (v == null || v === "" || v === "all") p.delete(k);
      else p.set(k, String(v));
    };
    setOrDel("q", next.q ?? q);
    setOrDel("type", next.type ?? type);
    setOrDel("format", next.format ?? format);
    setOrDel("sort", next.sort ?? sort);
    setSearchParams(p, { replace: true });
  };

  const fetchList = async (mode = "load") => {
    mode === "refresh" ? setRefreshing(true) : setLoading(true);
    try {
      const params = {
        q: q || undefined,
        type: type !== "all" ? type : undefined,
        format: format !== "all" ? format : undefined,
        sort: sort || undefined,
      };
      const res = await camOutputsApi.list(params);
      setRows(normalizeList(res?.data));
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load CAM outputs.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      mode === "refresh" ? setRefreshing(false) : setLoading(false);
    }
  };

  // keep state in sync with URL (back/forward)
  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setType(searchParams.get("type") || "all");
    setFormat(searchParams.get("format") || "all");
    setSort(searchParams.get("sort") || "newest");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // fetch on filter change
  useEffect(() => {
    fetchList("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, format, sort]);

  const filteredSorted = useMemo(() => {
    let data = [...rows];

    // frontend fallback filtering
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      data = data.filter((r) => {
        const outNo = (r.output_no ?? r.outputNo ?? r.number ?? "").toString().toLowerCase();
        const camNo = (r.cam_no ?? r.camNo ?? "").toString().toLowerCase();
        const board = (r.board_name ?? r.boardName ?? "").toString().toLowerCase();
        const rfq = (r.rfq_no ?? r.rfqNo ?? "").toString().toLowerCase();
        const so = (r.sales_order_no ?? r.soNo ?? "").toString().toLowerCase();
        const customer = (r.customer?.name ?? r.customer_name ?? "").toString().toLowerCase();
        const t = (r.type ?? "").toString().toLowerCase();
        return (
          outNo.includes(s) ||
          camNo.includes(s) ||
          board.includes(s) ||
          rfq.includes(s) ||
          so.includes(s) ||
          customer.includes(s) ||
          t.includes(s)
        );
      });
    }

    if (type !== "all") data = data.filter((r) => (r.type ?? "CAM Report") === type);
    if (format !== "all") data = data.filter((r) => (r.format ?? "").toLowerCase() === format.toLowerCase());

    // sort fallback
    const dt = (r) => new Date(r.created_at ?? r.createdAt ?? 0).getTime() || 0;
    if (sort === "newest") data.sort((a, b) => dt(b) - dt(a));
    if (sort === "oldest") data.sort((a, b) => dt(a) - dt(b));
    if (sort === "type") data.sort((a, b) => String(a.type ?? "").localeCompare(String(b.type ?? "")));

    return data;
  }, [rows, q, type, format, sort]);

  const stats = useMemo(() => {
    const s = { total: filteredSorted.length, zip: 0, gerber: 0, docs: 0 };
    filteredSorted.forEach((r) => {
      const f = (r.format ?? "").toLowerCase();
      const t = (r.type ?? "").toLowerCase();
      if (f.includes("zip") || t.includes("archive")) s.zip += 1;
      else if (t.includes("gerber") || t.includes("odb") || t.includes("ipc")) s.gerber += 1;
      else s.docs += 1;
    });
    return s;
  }, [filteredSorted]);

  const openDetails = (row) => {
    const id = row.id ?? row._id ?? row.output_id;
    if (!id) return;
    navigate(`/engineering/cam/outputs/${id}`);
  };

  const handleDownload = async (row, e) => {
    e?.stopPropagation?.();
    const id = row.id ?? row._id ?? row.output_id;
    if (!id) return;

    try {
      // Simple URL open approach (works if backend returns file stream)
      const res = await camOutputsApi.getDownloadUrl(id);
      const url = res?.data?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      // fallback: direct download endpoint
      window.open(camOutputsApi.directDownloadUrl(id), "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "Download failed",
        description: err?.response?.data?.message || "Could not download output file.",
        variant: "destructive",
      });
    }
  };

  const apply = () => syncUrl({ q, type, format, sort });
  const reset = () => {
    setQ("");
    setType("all");
    setFormat("all");
    setSort("newest");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border bg-white p-10">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading CAM outputs…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CAM Outputs</h1>
          <p className="text-sm text-gray-500">
            Final manufacturing deliverables produced by CAM: Gerbers/Drill, ODB++/IPC2581, panel drawings and reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList("refresh")} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/engineering/cam/outputs/create">
              <UploadCloud className="h-4 w-4" />
              Add Output
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Archives (ZIP)</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.zip}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Manufacturing Data</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.gerber}</p>
          </CardContent>
        </Card>
        <Card className="border bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Docs / Reports</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stats.docs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#dc2551]" />
                  Filters
                </CardTitle>
                <CardDescription>Search by Output No, CAM No, Board, Customer, RFQ, Sales Order</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={reset}>
                  Reset
                </Button>
                <Button className="bg-[#dc2551] hover:bg-[#b02045]" onClick={apply}>
                  Apply
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="OUT-0001, CAM-0003, Customer, RFQ, SO, board..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="Gerber + Drill">Gerber + Drill</option>
                  <option value="ODB++">ODB++</option>
                  <option value="IPC2581">IPC2581</option>
                  <option value="Panel Drawing">Panel Drawing</option>
                  <option value="CAM Report">CAM Report</option>
                  <option value="Stackup Sheet">Stackup Sheet</option>
                  <option value="Netlist/ET">Netlist/ET</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="zip">ZIP</option>
                  <option value="pdf">PDF</option>
                  <option value="txt">TXT</option>
                  <option value="csv">CSV</option>
                  <option value="gbr">GBR</option>
                  <option value="drl">DRL</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Sort</Label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Tip: Keep outputs “traceable” by always linking them to CAM Job + Sales Order + RFQ numbers.
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outputs</CardTitle>
          <CardDescription>Click a row to open output details (preview, audit, re-download)</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredSorted.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gray-100">
                <ShieldAlert className="h-6 w-6 text-gray-600" />
              </div>
              <p className="font-semibold text-gray-900">No outputs found</p>
              <p className="mt-1 text-sm text-gray-500">Try changing filters or add an output package.</p>
              <div className="mt-4 flex justify-center">
                <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
                  <Link to="/engineering/cam/outputs/create">
                    <UploadCloud className="h-4 w-4" />
                    Add Output
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSorted.map((r, idx) => {
                const id = r.id ?? r._id ?? r.output_id ?? idx;
                const outputNo = r.output_no ?? r.outputNo ?? r.number ?? "—";
                const camNo = r.cam_no ?? r.camNo ?? "—";
                const board = r.board_name ?? r.boardName ?? "PCB Job";
                const customer = r.customer?.name ?? r.customer_name ?? "—";
                const rfq = r.rfq_no ?? r.rfqNo ?? "—";
                const so = r.sales_order_no ?? r.soNo ?? "—";
                const t = r.type ?? "CAM Report";
                const fmt = (r.format ?? "").toUpperCase() || "—";
                const rev = r.revision ?? r.rev ?? "A";
                const created = r.created_at ?? r.createdAt ?? "";

                const Icon = fileIcon(t);

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.2) }}
                    onClick={() => openDetails(r)}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer px-4 py-4 hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
                            <Icon className="h-4.5 w-4.5" />
                          </span>

                          <p className="truncate text-sm font-bold text-gray-900">
                            {outputNo} <span className="font-medium text-gray-500">—</span>{" "}
                            <span className="font-semibold">{board}</span>
                          </p>

                          <TypeBadge type={t} />

                          <Badge className="rounded-full bg-gray-100 text-gray-700">{fmt}</Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <Tag className="h-3.5 w-3.5" /> Rev {rev}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <Package className="h-3.5 w-3.5" /> CAM: {camNo}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <FileText className="h-3.5 w-3.5" /> Customer: {customer}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <Calendar className="h-3.5 w-3.5" /> {fmtDate(created)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="rounded-full border bg-white px-2 py-1">
                          RFQ: <span className="font-semibold text-gray-900">{rfq}</span>
                        </span>
                        <span className="rounded-full border bg-white px-2 py-1">
                          SO: <span className="font-semibold text-gray-900">{so}</span>
                        </span>

                        <Button
                          variant="outline"
                          className="ml-auto gap-2"
                          onClick={(e) => handleDownload(r, e)}
                        >
                          <Download className="h-4 w-4 text-[#dc2551]" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
