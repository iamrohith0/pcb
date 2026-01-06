// src/pages/engineering/dfm/NetlistComparison.jsx
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    ChevronDown,
    ChevronRight,
    Download,
    GitCompare,
    RefreshCw,
    Search,
    ShieldCheck,
    Upload
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - Netlist Comparison (DFM)
 *
 * What it does:
 * - Compare "Design Netlist" (from CAD / IPC-356) vs "As-built/Manufacturing Netlist" (from CAM / tester)
 * - Show:
 *   - Missing nets
 *   - Extra nets
 *   - Opens / Shorts (mismatched connectivity)
 *   - Summary counts + expandable details
 *
 * Recommended backend endpoints:
 * - POST /engineering/dfm/netlist/compare (multipart or JSON)
 *    multipart/form-data fields:
 *      - design_file (required)  [ipc356, net, xml, txt]
 *      - fab_file (required)     [ipc356, net, xml, txt]
 *      - format_design (optional) e.g. "ipc-356"
 *      - format_fab (optional)    e.g. "ipc-356"
 *      - job_id / wo_no / revision (optional)
 *
 * Response example:
 * {
 *  "summary": { "missing": 3, "extra": 1, "opens": 2, "shorts": 1, "matched": 214 },
 *  "missing_nets": [{ "net": "N$12", "reason": "not found in fab netlist" }],
 *  "extra_nets": [{ "net": "N$99", "reason": "not found in design netlist" }],
 *  "opens": [{ "net": "VCC", "from": "U1.1", "to": "R4.2", "expected": "connected", "found": "open" }],
 *  "shorts": [{ "netA": "GND", "netB": "N$3", "pins": ["U2.4","C7.1"], "severity": "high" }]
 * }
 */

const DEFAULT_FORMATS = [
  { value: "auto", label: "Auto Detect" },
  { value: "ipc-356", label: "IPC-356" },
  { value: "net", label: "NET / Netlist" },
  { value: "xml", label: "XML" },
  { value: "txt", label: "Text" },
];

export default function NetlistComparison() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  // job metadata (optional)
  const [jobId, setJobId] = useState("");
  const [woNo, setWoNo] = useState("");
  const [revision, setRevision] = useState("");

  // files
  const [designFile, setDesignFile] = useState(null);
  const [fabFile, setFabFile] = useState(null);

  // formats
  const [formatDesign, setFormatDesign] = useState("auto");
  const [formatFab, setFormatFab] = useState("auto");

  // results
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("summary"); // summary|missing|extra|opens|shorts
  const [query, setQuery] = useState("");

  // expand/collapse
  const [expanded, setExpanded] = useState({
    missing: true,
    extra: true,
    opens: true,
    shorts: true,
  });

  // export confirm dialog
  const [exportOpen, setExportOpen] = useState(false);

  const summary = result?.summary || {
    missing: 0,
    extra: 0,
    opens: 0,
    shorts: 0,
    matched: 0,
  };

  const missing = result?.missing_nets || [];
  const extra = result?.extra_nets || [];
  const opens = result?.opens || [];
  const shorts = result?.shorts || [];

  const badges = useMemo(() => {
    const all = [
      { key: "missing", label: "Missing", value: summary.missing, tone: "rose" },
      { key: "extra", label: "Extra", value: summary.extra, tone: "amber" },
      { key: "opens", label: "Opens", value: summary.opens, tone: "indigo" },
      { key: "shorts", label: "Shorts", value: summary.shorts, tone: "red" },
      { key: "matched", label: "Matched", value: summary.matched, tone: "emerald" },
    ];
    return all;
  }, [summary]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterList = (list) => {
      if (!q) return list;
      return list.filter((row) =>
        Object.values(row || {})
          .flat()
          .some((v) => String(v).toLowerCase().includes(q))
      );
    };

    return {
      missing: filterList(missing),
      extra: filterList(extra),
      opens: filterList(opens),
      shorts: filterList(shorts),
    };
  }, [missing, extra, opens, shorts, query]);

  const canCompare = useMemo(() => {
    return !!designFile && !!fabFile;
  }, [designFile, fabFile]);

  const reset = () => {
    setResult(null);
    setHasResult(false);
    setActiveTab("summary");
    setQuery("");
    setExpanded({ missing: true, extra: true, opens: true, shorts: true });
  };

  const mockResult = () => ({
    summary: { missing: 2, extra: 1, opens: 1, shorts: 1, matched: 217 },
    missing_nets: [
      { net: "N$12", reason: "Not found in fab netlist", pins: ["U3.5", "R10.1"] },
      { net: "USB_D+", reason: "Expected connectivity not present", pins: ["J1.3", "U1.14"] },
    ],
    extra_nets: [{ net: "N$99", reason: "Net exists only in fab netlist", pins: ["TP7.1"] }],
    opens: [
      { net: "VCC", from: "U1.1", to: "R4.2", expected: "connected", found: "open", severity: "high" },
    ],
    shorts: [
      { netA: "GND", netB: "N$3", pins: ["U2.4", "C7.1"], severity: "high" },
    ],
    generated_at: new Date().toISOString(),
  });

  const doCompare = async () => {
    if (!canCompare) {
      toast({
        title: "Files required",
        description: "Please upload both Design Netlist and Fab/Test Netlist files.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prefer multipart to handle file upload
      const form = new FormData();
      form.append("design_file", designFile);
      form.append("fab_file", fabFile);

      if (formatDesign && formatDesign !== "auto") form.append("format_design", formatDesign);
      if (formatFab && formatFab !== "auto") form.append("format_fab", formatFab);

      if (jobId.trim()) form.append("job_id", jobId.trim());
      if (woNo.trim()) form.append("wo_no", woNo.trim());
      if (revision.trim()) form.append("revision", revision.trim());

      const res = await api.post("/engineering/dfm/netlist/compare", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = res?.data?.data ?? res?.data;
      setResult(payload);
      setHasResult(true);
      setActiveTab("summary");
      toast({ title: "Comparison complete", description: "Netlists compared successfully." });
    } catch (err) {
      toast({
        title: "Compare failed",
        description: err?.response?.data?.message || "Using sample comparison result (API not reachable).",
        variant: "destructive",
      });
      const sample = mockResult();
      setResult(sample);
      setHasResult(true);
      setActiveTab("summary");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!result) return;

    const safe = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [];

    // Summary
    lines.push(["Section", "Count"].map(safe).join(","));
    lines.push(["Missing Nets", summary.missing].map(safe).join(","));
    lines.push(["Extra Nets", summary.extra].map(safe).join(","));
    lines.push(["Opens", summary.opens].map(safe).join(","));
    lines.push(["Shorts", summary.shorts].map(safe).join(","));
    lines.push(["Matched", summary.matched].map(safe).join(","));
    lines.push("");

    const writeTable = (title, arr) => {
      lines.push([title].map(safe).join(","));
      const headers = Array.from(
        new Set(arr.flatMap((r) => Object.keys(r || {})))
      );

      if (headers.length === 0) {
        lines.push(safe("No rows"));
        lines.push("");
        return;
      }

      lines.push(headers.map(safe).join(","));
      arr.forEach((r) => {
        lines.push(headers.map((h) => safe(r?.[h])).join(","));
      });
      lines.push("");
    };

    writeTable("Missing Nets", missing);
    writeTable("Extra Nets", extra);
    writeTable("Opens", opens);
    writeTable("Shorts", shorts);

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `netlist_comparison_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "CSV exported successfully." });
  };

  const BadgePill = ({ tone, label, value, onClick, active }) => {
    const styles = {
      rose: active ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      amber: active ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      indigo: active ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
      red: active ? "bg-red-600 text-white" : "bg-red-50 text-red-700 ring-1 ring-red-200",
      emerald: active ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    };

    return (
      <button
        type="button"
        onClick={onClick}
        className={cx(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition",
          styles[tone] || "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
          onClick ? "hover:opacity-95" : ""
        )}
      >
        <span>{label}</span>
        <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-white/20" : "bg-white")}>
          {Number(value || 0)}
        </span>
      </button>
    );
  };

  const SectionHeader = ({ title, countKey, children, toggleKey }) => {
    const isOpen = expanded[toggleKey];
    const count =
      toggleKey === "missing"
        ? filtered.missing.length
        : toggleKey === "extra"
        ? filtered.extra.length
        : toggleKey === "opens"
        ? filtered.opens.length
        : filtered.shorts.length;

    return (
      <div className="rounded-2xl border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setExpanded((p) => ({ ...p, [toggleKey]: !p[toggleKey] }))}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
            <span className="font-semibold text-gray-900">{title}</span>
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          </div>
          <span className="text-xs text-gray-500">{countKey ? `Metric: ${countKey}` : ""}</span>
        </button>
        {isOpen && <div className="border-t border-gray-200 p-4">{children}</div>}
      </div>
    );
  };

  const Empty = ({ text }) => (
    <div className="grid place-items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-sm text-gray-500">
      {text}
    </div>
  );

  const KeyValue = ({ k, v }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
      <span className="text-gray-600">{k}</span>
      <span className="font-semibold text-gray-900">{v}</span>
    </div>
  );

  const RowTable = ({ rows, columns, emptyText }) => {
    if (!rows?.length) return <Empty text={emptyText} />;

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50/60">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.render ? c.render(r) : String(r?.[c.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const SummaryCard = () => (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
          <ShieldCheck className="h-4 w-4 text-[#dc2551]" />
          Summary
        </CardTitle>
        <CardDescription className="text-xs">
          High-level comparison counts and key identifiers.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KeyValue k="Missing Nets" v={summary.missing} />
        <KeyValue k="Extra Nets" v={summary.extra} />
        <KeyValue k="Opens" v={summary.opens} />
        <KeyValue k="Shorts" v={summary.shorts} />
        <KeyValue k="Matched" v={summary.matched} />
        <KeyValue k="Generated" v={result?.generated_at ? new Date(result.generated_at).toLocaleString() : "-"} />
      </CardContent>
    </Card>
  );

  // initial: keep clean (no auto-compare)
  useEffect(() => {
    // noop
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <GitCompare className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Netlist Comparison</h1>
              <Badge variant="outline">Engineering</Badge>
              <Badge variant="secondary">DFM</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Compare CAD (design) netlist vs CAM/test (fab) netlist to catch connectivity issues before shipment.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={reset} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Reset
          </Button>
          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={doCompare}
            disabled={!canCompare || loading}
          >
            <GitCompare className="h-4 w-4" />
            {loading ? "Comparing..." : "Compare"}
          </Button>
        </div>
      </div>

      {/* Upload + options */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Inputs</CardTitle>
          <CardDescription className="text-xs">
            Upload two netlists (CAD vs Fab/Test). Optionally tag with job/work order identifiers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Meta */}
          <div className="lg:col-span-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="space-y-2">
                <Label>Job ID (optional)</Label>
                <Input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="e.g., JOB-2031" />
              </div>
              <div className="space-y-2">
                <Label>WO No (optional)</Label>
                <Input value={woNo} onChange={(e) => setWoNo(e.target.value)} placeholder="e.g., WO-1452" />
              </div>
              <div className="space-y-2">
                <Label>Revision (optional)</Label>
                <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="e.g., R3" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Tip</div>
                  Use <span className="font-medium">IPC-356</span> for reliable CAD-to-fab comparisons. Auto-detect will
                  attempt best parsing on backend.
                </div>
              </div>
            </div>
          </div>

          {/* Files */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Design Netlist</p>
                    <p className="mt-0.5 text-xs text-gray-500">From CAD (IPC-356 / netlist export)</p>
                  </div>
                  <Upload className="h-4 w-4 text-gray-500" />
                </div>

                <div className="mt-3 space-y-2">
                  <Input
                    type="file"
                    accept=".ipc,.ipc356,.356,.net,.txt,.xml,.csv"
                    onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-gray-600">
                      {designFile ? designFile.name : "No file selected"}
                    </span>
                    <select
                      value={formatDesign}
                      onChange={(e) => setFormatDesign(e.target.value)}
                      className="h-9 rounded-md border border-input bg-white px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
                    >
                      {DEFAULT_FORMATS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Fab/Test Netlist</p>
                    <p className="mt-0.5 text-xs text-gray-500">From CAM / Tester (as-built netlist)</p>
                  </div>
                  <Upload className="h-4 w-4 text-gray-500" />
                </div>

                <div className="mt-3 space-y-2">
                  <Input
                    type="file"
                    accept=".ipc,.ipc356,.356,.net,.txt,.xml,.csv"
                    onChange={(e) => setFabFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-gray-600">{fabFile ? fabFile.name : "No file selected"}</span>
                    <select
                      value={formatFab}
                      onChange={(e) => setFormatFab(e.target.value)}
                      className="h-9 rounded-md border border-input bg-white px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
                    >
                      {DEFAULT_FORMATS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action line */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span
                  className={cx("h-2 w-2 rounded-full", canCompare ? "bg-emerald-500" : "bg-amber-500")}
                  aria-hidden="true"
                />
                {canCompare ? "Ready to compare" : "Upload both files to enable comparison"}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setExportOpen(true)}
                  disabled={!hasResult}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                  onClick={doCompare}
                  disabled={!canCompare || loading}
                >
                  <GitCompare className="h-4 w-4" />
                  {loading ? "Comparing..." : "Compare Now"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {!hasResult ? (
        <Card className="border border-gray-200">
          <CardContent className="py-10">
            <div className="grid place-items-center text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10">
                <GitCompare className="h-6 w-6 text-[#dc2551]" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">No comparison yet</h3>
              <p className="mt-1 max-w-xl text-sm text-gray-600">
                Upload your design netlist and fab/test netlist to detect missing nets, extra nets, opens and shorts.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Summary pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={activeTab === "summary" ? "default" : "outline"}
              className={cx(activeTab === "summary" ? "bg-cyan-600 hover:bg-cyan-500" : "", "gap-2")}
              onClick={() => setActiveTab("summary")}
            >
              <ShieldCheck className="h-4 w-4" />
              Summary
            </Button>

            {badges.map((b) => (
              <BadgePill
                key={b.key}
                tone={b.tone}
                label={b.label}
                value={b.value}
                active={activeTab === b.key}
                onClick={() => setActiveTab(b.key)}
              />
            ))}

            <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search mismatches..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Summary view */}
          {activeTab === "summary" && <SummaryCard />}

          {/* Detail view (accordion-style) */}
          {activeTab !== "summary" && (
            <div className="space-y-4">
              {activeTab === "missing" && (
                <SectionHeader title="Missing Nets" toggleKey="missing" countKey="missing">
                  <RowTable
                    rows={filtered.missing}
                    emptyText="No missing nets found."
                    columns={[
                      { key: "net", label: "Net", render: (r) => <span className="font-medium text-gray-900">{r.net || "-"}</span> },
                      { key: "reason", label: "Reason" },
                      { key: "pins", label: "Pins", render: (r) => (Array.isArray(r.pins) ? r.pins.join(", ") : r.pins || "-") },
                    ]}
                  />
                </SectionHeader>
              )}

              {activeTab === "extra" && (
                <SectionHeader title="Extra Nets" toggleKey="extra" countKey="extra">
                  <RowTable
                    rows={filtered.extra}
                    emptyText="No extra nets found."
                    columns={[
                      { key: "net", label: "Net", render: (r) => <span className="font-medium text-gray-900">{r.net || "-"}</span> },
                      { key: "reason", label: "Reason" },
                      { key: "pins", label: "Pins", render: (r) => (Array.isArray(r.pins) ? r.pins.join(", ") : r.pins || "-") },
                    ]}
                  />
                </SectionHeader>
              )}

              {activeTab === "opens" && (
                <SectionHeader title="Opens (Connectivity Breaks)" toggleKey="opens" countKey="opens">
                  <RowTable
                    rows={filtered.opens}
                    emptyText="No opens detected."
                    columns={[
                      { key: "net", label: "Net", render: (r) => <span className="font-medium text-gray-900">{r.net || "-"}</span> },
                      { key: "from", label: "From" },
                      { key: "to", label: "To" },
                      { key: "expected", label: "Expected" },
                      { key: "found", label: "Found" },
                      {
                        key: "severity",
                        label: "Severity",
                        render: (r) => {
                          const s = String(r.severity || "medium").toLowerCase();
                          const klass =
                            s === "high"
                              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                              : s === "low"
                              ? "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
                          return <span className={cx("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", klass)}>{s}</span>;
                        },
                      },
                    ]}
                  />
                </SectionHeader>
              )}

              {activeTab === "shorts" && (
                <SectionHeader title="Shorts (Unexpected Connections)" toggleKey="shorts" countKey="shorts">
                  <RowTable
                    rows={filtered.shorts}
                    emptyText="No shorts detected."
                    columns={[
                      { key: "netA", label: "Net A", render: (r) => <span className="font-medium text-gray-900">{r.netA || "-"}</span> },
                      { key: "netB", label: "Net B", render: (r) => <span className="font-medium text-gray-900">{r.netB || "-"}</span> },
                      {
                        key: "pins",
                        label: "Pins",
                        render: (r) => (Array.isArray(r.pins) ? r.pins.join(", ") : r.pins || "-"),
                      },
                      {
                        key: "severity",
                        label: "Severity",
                        render: (r) => {
                          const s = String(r.severity || "medium").toLowerCase();
                          const klass =
                            s === "high"
                              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                              : s === "low"
                              ? "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
                          return <span className={cx("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", klass)}>{s}</span>;
                        },
                      },
                    ]}
                  />
                </SectionHeader>
              )}
            </div>
          )}
        </div>
      )}

      {/* Export confirmation */}
      <AlertDialog open={exportOpen} onOpenChange={setExportOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[#dc2551]" />
              Export Comparison
            </AlertDialogTitle>
            <AlertDialogDescription>
              Export the current comparison (summary + mismatch lists) as a CSV file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setExportOpen(false);
                exportCSV();
              }}
              className="bg-cyan-600 hover:bg-cyan-500"
              disabled={!hasResult}
            >
              Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
