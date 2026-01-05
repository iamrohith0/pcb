// src/pages/quality/aoi/AOIResults.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - AOI Results
 *
 * Recommended Backend Endpoints:
 * - GET /quality/aoi/results?search=&status=&line=&severity=&from=&to=&page=&limit=
 * - GET /quality/aoi/results/:id
 * - GET /quality/aoi/results/export?search=&status=&line=&severity=&from=&to=  -> file
 *
 * Suggested record fields:
 * - id, jobNo, workOrderNo, customer, partNo, revision, layerCount,
 *   line, machine, inspectedAt,
 *   resultStatus (pass|fail|rework|scrap),
 *   defectCount,
 *   severity (minor|major|critical),
 *   programName, operator,
 *   notes
 *
 * Details (optional):
 * - defects[] with { code, name, side, x, y, severity, imageUrl?, comment? }
 */
export default function AOIResults() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // all|pass|fail|rework|scrap
  const [line, setLine] = useState("all"); // all or line name
  const [severity, setSeverity] = useState("all"); // all|minor|major|critical
  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState(""); // YYYY-MM-DD

  // dialogs
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const totalPages = useMemo(() => {
    const t = Number(meta?.total || 0);
    const l = Number(meta?.limit || 10);
    return Math.max(1, Math.ceil(t / l));
  }, [meta]);

  const normalizeList = (payload) => {
    const root = payload?.data ?? payload ?? {};
    const items = root.items ?? root.rows ?? root.data ?? (Array.isArray(root) ? root : []);
    const page = root.page ?? root.meta?.page ?? 1;
    const limit = root.limit ?? root.meta?.limit ?? 10;
    const total = root.total ?? root.meta?.total ?? items?.length ?? 0;
    return {
      items: Array.isArray(items) ? items : [],
      meta: { page: Number(page), limit: Number(limit), total: Number(total) },
    };
  };

  const mockRows = () => [
    {
      id: "AOIR-001",
      jobNo: "JOB-24022",
      workOrderNo: "WO-10090",
      customer: "Nova Instruments",
      partNo: "NI-SENS-220",
      revision: "R1",
      layerCount: 2,
      line: "AOI Line 2",
      machine: "Omron VT-S530",
      inspectedAt: "2026-01-06T01:00:00Z",
      resultStatus: "fail",
      defectCount: 14,
      severity: "major",
      programName: "NI-SENS-220_R1_TOPBOT",
      operator: "Arun",
      notes: "Solder bridge clusters on U3/Q1 region. Verify stencil/print alignment.",
      defects: [
        { code: "SB", name: "Solder Bridge", side: "Top", x: 124.2, y: 88.1, severity: "major" },
        { code: "MD", name: "Missing Device", side: "Top", x: 30.4, y: 55.9, severity: "critical" },
      ],
    },
    {
      id: "AOIR-002",
      jobNo: "JOB-24019",
      workOrderNo: "WO-10082",
      customer: "Orion Controls",
      partNo: "OC-PSU-441",
      revision: "R3",
      layerCount: 4,
      line: "AOI Line 1",
      machine: "Koh Young Zenith",
      inspectedAt: "2026-01-05T20:40:00Z",
      resultStatus: "pass",
      defectCount: 0,
      severity: "minor",
      programName: "OC-PSU-441_R3_STD",
      operator: "Meera",
      notes: "Clean run.",
      defects: [],
    },
    {
      id: "AOIR-003",
      jobNo: "JOB-23988",
      workOrderNo: "WO-10010",
      customer: "Helix Mobility",
      partNo: "HM-DRV-901",
      revision: "R7",
      layerCount: 6,
      line: "AOI Line 1",
      machine: "Koh Young Zenith",
      inspectedAt: "2026-01-04T18:10:00Z",
      resultStatus: "rework",
      defectCount: 6,
      severity: "minor",
      programName: "HM-DRV-901_R7_TOP",
      operator: "Rahul",
      notes: "Minor polarity/offset checks. Route to rework station.",
      defects: [{ code: "PO", name: "Polarity", side: "Top", x: 77.1, y: 21.4, severity: "minor" }],
    },
    {
      id: "AOIR-004",
      jobNo: "JOB-23950",
      workOrderNo: "WO-09960",
      customer: "Atlas Robotics",
      partNo: "AR-CNTRL-010",
      revision: "R2",
      layerCount: 8,
      line: "AOI Line 2",
      machine: "Omron VT-S530",
      inspectedAt: "2026-01-03T11:20:00Z",
      resultStatus: "scrap",
      defectCount: 22,
      severity: "critical",
      programName: "AR-CNTRL-010_R2",
      operator: "Sana",
      notes: "Multiple opens/shorts across BGA region. Escalate NCR.",
      defects: [{ code: "OS", name: "Open/Short", side: "Top", x: 98.5, y: 62.2, severity: "critical" }],
    },
  ];

  const fetchList = async (nextPage = meta.page) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/aoi/results", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          line: line === "all" ? undefined : line,
          severity: severity === "all" ? undefined : severity,
          from: from || undefined,
          to: to || undefined,
          page: nextPage,
          limit: meta.limit,
        },
      });

      const { items, meta: m } = normalizeList(res?.data);
      setRows(items);
      setMeta((prev) => ({ ...prev, ...m }));
    } catch (err) {
      toast({
        title: "Failed to load AOI results",
        description: err?.response?.data?.message || "Using sample data (API not reachable).",
        variant: "destructive",
      });

      const sample = mockRows();
      const filtered = sample.filter((r) => {
        const q = search.trim().toLowerCase();
        const matchesQ =
          !q ||
          [r.jobNo, r.workOrderNo, r.customer, r.partNo, r.revision, r.line, r.machine, r.programName]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q));

        const matchesStatus = status === "all" ? true : r.resultStatus === status;
        const matchesLine = line === "all" ? true : r.line === line;
        const matchesSev = severity === "all" ? true : r.severity === severity;

        const matchesFrom = !from ? true : new Date(r.inspectedAt).getTime() >= new Date(from).getTime();
        const matchesTo = !to ? true : new Date(r.inspectedAt).getTime() <= new Date(to + "T23:59:59").getTime();

        return matchesQ && matchesStatus && matchesLine && matchesSev && matchesFrom && matchesTo;
      });

      setRows(filtered);
      setMeta((prev) => ({ ...prev, page: 1, total: filtered.length }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, line, severity]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, from, to]);

  const distinctLines = useMemo(() => {
    const s = new Set(rows.map((r) => r.line).filter(Boolean));
    ["AOI Line 1", "AOI Line 2"].forEach((x) => s.add(x));
    return ["all", ...Array.from(s)];
  }, [rows]);

  const badgeStatus = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "pass")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pass
        </span>
      );
    if (v === "rework")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          Rework
        </span>
      );
    if (v === "scrap")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          Scrap
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
        <AlertTriangle className="h-3.5 w-3.5" />
        Fail
      </span>
    );
  };

  const badgeSeverity = (sev) => {
    const v = String(sev || "").toLowerCase();
    if (v === "critical") return <Badge className="bg-red-600 text-white">Critical</Badge>;
    if (v === "major") return <Badge className="bg-orange-600 text-white">Major</Badge>;
    return <Badge variant="outline">Minor</Badge>;
  };

  const fmtDateTime = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleString();
    } catch {
      return String(d);
    }
  };

  const openView = async (row) => {
    setSelected(row);
    setViewOpen(true);

    // try fetch details (optional)
    const id = row?.id ?? row?._id;
    if (!id) return;

    try {
      const res = await api.get(`/quality/aoi/results/${id}`);
      const details = res?.data?.data ?? res?.data;
      if (details) setSelected((prev) => ({ ...(prev || {}), ...(details || {}) }));
    } catch {
      // ignore (sample mode)
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Try blob export (recommended)
      const res = await api.get("/quality/aoi/results/export", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          line: line === "all" ? undefined : line,
          severity: severity === "all" ? undefined : severity,
          from: from || undefined,
          to: to || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const fname = `aoi_results_${new Date().toISOString().slice(0, 10)}.csv`;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export started", description: "Downloaded AOI results export." });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err?.response?.data?.message || "Export endpoint not available.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const pageFrom = (meta.page - 1) * meta.limit + 1;
  const pageTo = (meta.page - 1) * meta.limit + rows.length;
  const hasAnyDefects = (selected?.defects?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <SlidersHorizontal className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">AOI Results</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">AOI</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Search and review inspection outcomes, defect counts, and severity for PCB AOI runs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(1)} disabled={loading || exporting}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={handleExport} disabled={exporting}>
            <Download className={cx("h-4 w-4", exporting ? "animate-pulse" : "")} />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm text-gray-700">Filters</CardTitle>
          </div>
          <CardDescription className="text-xs">Filter by status, line, severity, and date range.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job / WO / Customer / Part / Program…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="rework">Rework</option>
              <option value="scrap">Scrap</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>AOI Line</Label>
            <select
              value={line}
              onChange={(e) => setLine(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              {distinctLines.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All lines" : l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="lg:col-span-6 mt-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>
              Showing <span className="font-medium text-gray-900">{rows.length ? `${pageFrom}-${pageTo}` : 0}</span> of{" "}
              <span className="font-medium text-gray-900">{meta.total || rows.length}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className={cx("h-2 w-2 rounded-full", loading ? "bg-amber-500" : "bg-emerald-500")} />
              {loading ? "Loading…" : "Ready"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Inspection Results</CardTitle>
          <CardDescription className="text-xs">Click “View” to see program/operator details and defect list.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Job / WO</th>
                  <th className="px-4 py-3 text-left">Customer / Part</th>
                  <th className="px-4 py-3 text-left">Line / Machine</th>
                  <th className="px-4 py-3 text-left">Inspected At</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Defects</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading results…" : "No AOI results found."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id ?? r._id ?? r.workOrderNo} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.jobNo || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.workOrderNo || "-"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.customer || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.partNo || "-"} {r.revision ? `• ${r.revision}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.line || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.machine || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-700">{fmtDateTime(r.inspectedAt)}</td>

                      <td className="px-4 py-3">{badgeStatus(r.resultStatus)}</td>

                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <Badge variant={Number(r.defectCount || 0) > 0 ? "secondary" : "outline"}>
                            {Number(r.defectCount || 0)} defects
                          </Badge>
                        </div>
                      </td>

                      <td className="px-4 py-3">{badgeSeverity(r.severity)}</td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openView(r)}>
                            <Eye className="h-4 w-4" />
                            View
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-900">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.max(1, meta.page - 1))}
                disabled={loading || meta.page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.min(totalPages, meta.page + 1))}
                disabled={loading || meta.page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View details dialog */}
      <AlertDialog open={viewOpen} onOpenChange={setViewOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#dc2551]" />
              AOI Result Details
            </AlertDialogTitle>
            <AlertDialogDescription>
              Job <span className="font-medium">{selected?.jobNo}</span> • WO{" "}
              <span className="font-medium">{selected?.workOrderNo}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Customer" value={selected?.customer} />
            <Info label="Part / Rev" value={`${selected?.partNo || "-"} ${selected?.revision ? `(${selected.revision})` : ""}`} />
            <Info label="Line" value={selected?.line} />
            <Info label="Machine" value={selected?.machine} />
            <Info label="Program" value={selected?.programName} />
            <Info label="Operator" value={selected?.operator} />
            <Info label="Inspected At" value={fmtDateTime(selected?.inspectedAt)} />
            <Info label="Layers" value={selected?.layerCount} />
            <Info label="Result" value={selected?.resultStatus} />
            <Info label="Defect Count" value={selected?.defectCount} />
            <Info label="Severity" value={selected?.severity} />
          </div>

          {selected?.notes ? (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</div>
              <div className="mt-1 text-sm text-gray-800">{selected.notes}</div>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Defects</div>
              <div className="text-xs text-gray-500">
                {hasAnyDefects ? `${selected.defects.length} items` : "No defects recorded"}
              </div>
            </div>

            {!hasAnyDefects ? (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <div className="font-medium">No defects</div>
                    <div className="text-xs text-emerald-800/80">This inspection result has zero defects.</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Side</th>
                      <th className="px-4 py-3 text-left">X</th>
                      <th className="px-4 py-3 text-left">Y</th>
                      <th className="px-4 py-3 text-left">Severity</th>
                      <th className="px-4 py-3 text-left">Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selected.defects.map((d, idx) => (
                      <tr key={`${d.code}-${idx}`} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.code || "-"}</td>
                        <td className="px-4 py-3 text-gray-800">{d.name || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{d.side || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{d.x ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{d.y ?? "-"}</td>
                        <td className="px-4 py-3">{badgeSeverity(d.severity)}</td>
                        <td className="px-4 py-3 text-gray-700">{d.comment || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {String(selected?.severity || "").toLowerCase() === "critical" ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <div className="font-medium">Critical severity detected</div>
                  <div className="text-xs text-red-800/80">
                    Recommended: open NCR and evaluate CAPA if recurring across lots.
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setViewOpen(false)}>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setViewOpen(false)}
              className="bg-[#dc2551] hover:bg-[#b02045]"
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value ?? "-"}</div>
    </div>
  );
}

function fmtDateTime(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  } catch {
    return String(d);
  }
}
