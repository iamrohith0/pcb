// src/pages/engineering/dfm/DFMReport.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import dfmService from "@/services/engineering/dfm.service";

/**
 * PCBxpress - DFMReport.jsx
 * -------------------------------------------------------
 * Purpose:
 *  - Show a printable/exportable DFM Report for a given Job/RFQ/Work Order
 *  - Summarize key PCB parameters + checklist findings + risk & notes
 *  - Allow "Print" and "Export" (mock download) until backend is wired
 *
 * Expected APIs (you can map in dfm.service):
 *  - dfmService.getReport({ jobId }) -> { data: report }
 *  - dfmService.exportReport({ jobId, format: "pdf"|"xlsx" }) -> blob
 *
 * URL usage:
 *  - /engineering/dfm/report?jobId=123
 */

const STATUS_META = {
  PASS: { label: "Pass", variant: "default", icon: CheckCircle2 },
  WARN: { label: "Needs Review", variant: "secondary", icon: AlertTriangle },
  FAIL: { label: "Fail", variant: "destructive", icon: AlertTriangle },
  DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDateTime(value) {
  try {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function pct(n, d) {
  if (!d) return "0%";
  const v = Math.round((n / d) * 100);
  return `${v}%`;
}

function groupByCategory(items = []) {
  const map = new Map();
  for (const it of items) {
    const key = it.category || "General";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  return Array.from(map.entries()).map(([category, rows]) => ({ category, rows }));
}

function riskColor(score) {
  // score: 0-100
  if (score >= 75) return "text-red-700 bg-red-50 ring-red-200";
  if (score >= 45) return "text-amber-700 bg-amber-50 ring-amber-200";
  return "text-emerald-700 bg-emerald-50 ring-emerald-200";
}

function scoreLabel(score) {
  if (score >= 75) return "High Risk";
  if (score >= 45) return "Medium Risk";
  return "Low Risk";
}

function safeText(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

const MOCK_REPORT = (jobId) => ({
  id: `DFM-${jobId || "—"}`,
  status: "WARN", // PASS | WARN | FAIL | DRAFT
  generatedAt: new Date().toISOString(),
  generatedBy: "System",
  reviewer: "—",
  approvals: {
    dfmEngineer: { name: "—", approvedAt: null },
    camEngineer: { name: "—", approvedAt: null },
    qa: { name: "—", approvedAt: null },
  },
  job: {
    jobId: jobId || "—",
    customer: "Acme Electronics",
    partNumber: "ACME-CTRL-02",
    revision: "B",
    layerCount: 6,
    boardSizeMm: "120 x 85",
    quantity: 50,
    finish: "ENIG",
    solderMask: "Green",
    silkscreen: "White",
    copperWeight: "1 oz ext / 0.5 oz int",
    thickness: "1.6 mm",
    impedance: "Yes (Controlled)",
    minTrace: "4 mil",
    minSpace: "4 mil",
    minDrill: "0.2 mm",
    annularRing: "≥ 4 mil",
    viaType: "Through + Microvias (L1-L2)",
    stackupId: "STK-06L-001",
    delivery: "Standard",
  },
  risk: {
    score: 58,
    drivers: [
      "Microvias used on L1-L2",
      "Tight drill tolerance on 0.2mm",
      "Impedance control required",
    ],
  },
  checklist: [
    {
      id: "CHK-001",
      category: "Fabrication Rules",
      item: "Minimum trace/space meets capability",
      result: "PASS",
      notes: "4/4 mil OK for standard HDI line.",
      severity: "LOW",
    },
    {
      id: "CHK-002",
      category: "Drill & Via",
      item: "Minimum finished drill meets capability",
      result: "WARN",
      notes: "0.2 mm requires drill compensation and tighter process control.",
      severity: "MEDIUM",
    },
    {
      id: "CHK-003",
      category: "Stackup & Impedance",
      item: "Controlled impedance rules provided",
      result: "WARN",
      notes: "Need target impedance table + coupon requirements confirmed.",
      severity: "MEDIUM",
    },
    {
      id: "CHK-004",
      category: "Solder Mask",
      item: "Mask expansion & dams verified",
      result: "PASS",
      notes: "No mask slivers detected in critical areas.",
      severity: "LOW",
    },
    {
      id: "CHK-005",
      category: "Silkscreen",
      item: "Silk-to-pad clearance OK",
      result: "PASS",
      notes: "No silk on pads.",
      severity: "LOW",
    },
    {
      id: "CHK-006",
      category: "Testability",
      item: "E-test / netlist info available",
      result: "FAIL",
      notes: "Netlist not provided. Request IPC-356 or Gerber netlist.",
      severity: "HIGH",
    },
  ],
  actions: [
    { id: "ACT-1", owner: "Sales", due: "2026-01-10", status: "OPEN", text: "Request IPC-356 netlist from customer." },
    { id: "ACT-2", owner: "CAM", due: "2026-01-12", status: "OPEN", text: "Confirm impedance coupon requirements & target table." },
  ],
  attachments: [
    { name: "Gerber.zip", type: "GERBER", url: "#" },
    { name: "Stackup.pdf", type: "STACKUP", url: "#" },
  ],
  notes:
    "DFM summary: feasible with minor risk. Proceed after netlist received and impedance coupon details confirmed.",
});

export default function DFMReport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const jobId = params.get("jobId") || "";

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState(null);

  // UI filter/search within checklist
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL"); // ALL | PASS | WARN | FAIL

  const statusMeta = STATUS_META[report?.status] || STATUS_META.DRAFT;
  const StatusIcon = statusMeta.icon;

  const grouped = useMemo(() => {
    const base = report?.checklist || [];
    const s = search.trim().toLowerCase();

    const filtered = base.filter((row) => {
      const okResult = resultFilter === "ALL" ? true : row.result === resultFilter;
      const okSearch = !s
        ? true
        : `${row.category} ${row.item} ${row.notes} ${row.id}`.toLowerCase().includes(s);
      return okResult && okSearch;
    });

    return groupByCategory(filtered);
  }, [report, search, resultFilter]);

  const summary = useMemo(() => {
    const list = report?.checklist || [];
    const total = list.length || 0;
    const pass = list.filter((x) => x.result === "PASS").length;
    const warn = list.filter((x) => x.result === "WARN").length;
    const fail = list.filter((x) => x.result === "FAIL").length;
    return { total, pass, warn, fail };
  }, [report]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // If you wire backend later, use:
      // const res = await dfmService.getReport({ jobId });
      // setReport(res.data);

      // For now, use mock data:
      const mock = MOCK_REPORT(jobId || "NEW");
      setReport(mock);
    } catch (e) {
      toast({
        title: "Failed to load report",
        description: "Unable to fetch DFM report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format = "pdf") => {
    setExporting(true);
    try {
      // Expected later:
      // const blob = await dfmService.exportReport({ jobId, format });
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = `DFM-${jobId}.${format}`;
      // a.click();
      // window.URL.revokeObjectURL(url);

      toast({
        title: "Export started",
        description: `Exporting report as ${format.toUpperCase()} (mock).`,
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: "Could not export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">DFM Report</h1>

              <Badge
                className={cx(
                  "inline-flex items-center gap-1.5",
                  report?.status === "PASS"
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : report?.status === "WARN"
                    ? "bg-amber-600 hover:bg-amber-600"
                    : report?.status === "FAIL"
                    ? "bg-red-600 hover:bg-red-600"
                    : "bg-gray-600 hover:bg-gray-600"
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusMeta.label}
              </Badge>

              <Badge variant="secondary" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {safeText(report?.id)}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-gray-600">
              Printable DFM summary for fabrication readiness, capability checks, and action items.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={loading}>
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button className="gap-2" onClick={() => handleExport("pdf")} disabled={loading || exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading DFM report...
          </div>
        </Card>
      )}

      {!loading && report && (
        <>
          {/* Top summary row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Job summary */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-800">Job Summary</p>
                </div>
                <Badge variant="secondary">{safeText(report?.job?.jobId)}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{safeText(report?.job?.customer)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Part / Rev</p>
                  <p className="font-medium text-gray-900">
                    {safeText(report?.job?.partNumber)} / {safeText(report?.job?.revision)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Layers</p>
                  <p className="font-medium text-gray-900">{safeText(report?.job?.layerCount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Board Size</p>
                  <p className="font-medium text-gray-900">{safeText(report?.job?.boardSizeMm)} mm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Finish</p>
                  <p className="font-medium text-gray-900">{safeText(report?.job?.finish)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thickness</p>
                  <p className="font-medium text-gray-900">{safeText(report?.job?.thickness)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Min Trace/Space</p>
                  <p className="font-medium text-gray-900">
                    {safeText(report?.job?.minTrace)} / {safeText(report?.job?.minSpace)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Min Drill</p>
                  <p className="font-medium text-gray-900">{safeText(report?.job?.minDrill)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gray-500" />
                  Impedance: {safeText(report?.job?.impedance)}
                </Badge>
                <Badge variant="outline">Via: {safeText(report?.job?.viaType)}</Badge>
                <Badge variant="outline">Qty: {safeText(report?.job?.quantity)}</Badge>
              </div>
            </Card>

            {/* Checklist summary */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Checklist Summary</p>
                <Badge variant="secondary">{summary.total} items</Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Pass</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700">{summary.pass}</p>
                  <p className="text-xs text-gray-500">{pct(summary.pass, summary.total)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Warn</p>
                  <p className="mt-1 text-lg font-bold text-amber-700">{summary.warn}</p>
                  <p className="text-xs text-gray-500">{pct(summary.warn, summary.total)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Fail</p>
                  <p className="mt-1 text-lg font-bold text-red-700">{summary.fail}</p>
                  <p className="text-xs text-gray-500">{pct(summary.fail, summary.total)}</p>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Generated: <span className="font-medium text-gray-900">{formatDateTime(report.generatedAt)}</span>
                <span className="mx-2 text-gray-300">•</span>
                By: <span className="font-medium text-gray-900">{safeText(report.generatedBy)}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">Reviewer: {safeText(report.reviewer)}</Badge>
                <Badge variant="outline">Stackup: {safeText(report?.job?.stackupId)}</Badge>
              </div>
            </Card>

            {/* Risk box */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Manufacturability Risk</p>
                <div
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                    riskColor(report?.risk?.score ?? 0)
                  )}
                >
                  <span>{scoreLabel(report?.risk?.score ?? 0)}</span>
                  <span className="rounded-full bg-white/60 px-2 py-0.5">{report?.risk?.score ?? 0}/100</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(report?.risk?.drivers || []).length === 0 ? (
                  <p className="text-sm text-gray-600">No risk drivers listed.</p>
                ) : (
                  report.risk.drivers.map((d, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-xl border bg-white p-3 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                      <p className="text-gray-700">{d}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                <p className="mt-1">{safeText(report?.notes)}</p>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <Label htmlFor="search">Search checklist</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by category, item, notes, ID..."
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={resultFilter === "ALL" ? "default" : "outline"}
                  onClick={() => setResultFilter("ALL")}
                  className="h-9"
                >
                  All
                </Button>
                <Button
                  variant={resultFilter === "PASS" ? "default" : "outline"}
                  onClick={() => setResultFilter("PASS")}
                  className="h-9"
                >
                  Pass
                </Button>
                <Button
                  variant={resultFilter === "WARN" ? "default" : "outline"}
                  onClick={() => setResultFilter("WARN")}
                  className="h-9"
                >
                  Warn
                </Button>
                <Button
                  variant={resultFilter === "FAIL" ? "default" : "outline"}
                  onClick={() => setResultFilter("FAIL")}
                  className="h-9"
                >
                  Fail
                </Button>
              </div>
            </div>
          </Card>

          {/* Checklist */}
          <div className="space-y-4">
            {grouped.length === 0 ? (
              <Card className="p-6">
                <p className="text-sm text-gray-600">No checklist items match your filter.</p>
              </Card>
            ) : (
              grouped.map((g) => (
                <motion.div
                  key={g.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{g.category}</p>
                        <Badge variant="secondary">{g.rows.length}</Badge>
                      </div>

                      <Link
                        to={`/engineering/dfm/review?jobId=${encodeURIComponent(report?.job?.jobId || "")}`}
                        className="text-xs font-semibold text-[#dc2551] hover:underline"
                      >
                        Open DFM Review →
                      </Link>
                    </div>

                    <div className="mt-4 divide-y rounded-xl border bg-white">
                      {g.rows.map((row) => {
                        const badgeClass =
                          row.result === "PASS"
                            ? "bg-emerald-600 hover:bg-emerald-600"
                            : row.result === "WARN"
                            ? "bg-amber-600 hover:bg-amber-600"
                            : row.result === "FAIL"
                            ? "bg-red-600 hover:bg-red-600"
                            : "bg-gray-600 hover:bg-gray-600";

                        return (
                          <div key={row.id} className="p-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className={cx("gap-1.5", badgeClass)}>
                                    {row.result === "PASS" ? (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                    )}
                                    {row.result}
                                  </Badge>

                                  <Badge variant="outline">{row.id}</Badge>
                                  <Badge variant="secondary">Severity: {row.severity}</Badge>
                                </div>

                                <p className="mt-2 font-medium text-gray-900">{row.item}</p>
                                <p className="mt-1 text-sm text-gray-600">{safeText(row.notes)}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() =>
                                    toast({
                                      title: "Checklist Item",
                                      description: `${row.id}: ${row.item}`,
                                    })
                                  }
                                >
                                  <FileText className="h-4 w-4" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Actions + Attachments */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Action Items</p>
                <Badge variant="secondary">{(report?.actions || []).length}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {(report?.actions || []).length === 0 ? (
                  <p className="text-sm text-gray-600">No action items.</p>
                ) : (
                  report.actions.map((a) => (
                    <div key={a.id} className="rounded-xl border bg-white p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{a.text}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Owner: <span className="font-medium">{a.owner}</span> • Due:{" "}
                            <span className="font-medium">{a.due}</span>
                          </p>
                        </div>
                        <Badge
                          className={cx(
                            a.status === "DONE"
                              ? "bg-emerald-600 hover:bg-emerald-600"
                              : "bg-amber-600 hover:bg-amber-600"
                          )}
                        >
                          {a.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Attachments</p>
                <Badge variant="secondary">{(report?.attachments || []).length}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {(report?.attachments || []).length === 0 ? (
                  <p className="text-sm text-gray-600">No attachments linked.</p>
                ) : (
                  report.attachments.map((f, idx) => (
                    <a
                      key={`${f.name}-${idx}`}
                      href={f.url || "#"}
                      onClick={(e) => {
                        if (!f.url || f.url === "#") {
                          e.preventDefault();
                          toast({
                            title: "Attachment not linked",
                            description: "Wire backend URLs to enable downloads.",
                          });
                        }
                      }}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{f.name}</p>
                          <p className="text-xs text-gray-500">{f.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Badge>
                    </a>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                Tip: Export PDF is for customer-facing DFM. Export XLSX is for internal analysis (optional).
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleExport("xlsx")}
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export XLSX
                </Button>

                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    toast({
                      title: "Approvals",
                      description: "Approval workflow can be added in DFMReview page (engineer → CAM → QA).",
                    })
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approvals
                </Button>
              </div>
            </Card>
          </div>

          {/* Footer hint */}
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-600" />
              <p>
                <span className="font-semibold">PCBxpress DFM:</span> This report is intended to confirm
                manufacturability before CAM tooling & work-order release. Failures must be resolved before release.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
