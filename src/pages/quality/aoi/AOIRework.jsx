// src/pages/quality/aoi/AOIRework.jsx
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
    CheckCircle2,
    ClipboardList,
    Download,
    Filter,
    RefreshCw,
    Search,
    ShieldAlert,
    SlidersHorizontal,
    Wrench,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - AOI Rework
 *
 * Recommended Backend Endpoints:
 * - GET  /quality/aoi/rework?search=&line=&severity=&from=&to=&state=&page=&limit=
 * - GET  /quality/aoi/rework/:id
 * - POST /quality/aoi/rework/:id/assign       { assigned_to, due_date?, notes? }
 * - POST /quality/aoi/rework/:id/complete     { disposition: "retest"|"scrap"|"accept", notes?, defects_fixed? }
 * - POST /quality/aoi/rework/:id/hold         { reason }
 * - POST /quality/aoi/rework/:id/release-hold { notes? }
 * - GET  /quality/aoi/rework/export           -> file
 *
 * Suggested record fields:
 * - id, jobNo, workOrderNo, customer, partNo, revision, layerCount,
 *   line, machine, inspectedAt,
 *   severity, defectCount,
 *   state: "unassigned"|"assigned"|"in_progress"|"on_hold"|"completed",
 *   assignedTo, dueDate,
 *   notes
 *
 * Optional:
 * - defects[] with { code, name, side, x, y, severity, status("open"|"fixed"), comment? }
 */
export default function AOIRework() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // filters
  const [search, setSearch] = useState("");
  const [line, setLine] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [state, setState] = useState("all"); // all|unassigned|assigned|in_progress|on_hold|completed
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // dialogs
  const [viewOpen, setViewOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionMode, setActionMode] = useState("assign"); // assign|complete|hold|release
  const [selected, setSelected] = useState(null);

  // action form
  const [assignTo, setAssignTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [disposition, setDisposition] = useState("retest"); // retest|scrap|accept
  const [defectsFixed, setDefectsFixed] = useState("");

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
      id: "AOIRW-001",
      jobNo: "JOB-24022",
      workOrderNo: "WO-10090",
      customer: "Nova Instruments",
      partNo: "NI-SENS-220",
      revision: "R1",
      layerCount: 2,
      line: "AOI Line 2",
      machine: "Omron VT-S530",
      inspectedAt: "2026-01-06T01:00:00Z",
      severity: "major",
      defectCount: 14,
      state: "unassigned",
      assignedTo: null,
      dueDate: null,
      notes: "Solder bridge clusters on U3/Q1 region. Verify stencil/print alignment.",
      defects: [
        { code: "SB", name: "Solder Bridge", side: "Top", x: 124.2, y: 88.1, severity: "major", status: "open" },
        { code: "MD", name: "Missing Device", side: "Top", x: 30.4, y: 55.9, severity: "critical", status: "open" },
      ],
    },
    {
      id: "AOIRW-002",
      jobNo: "JOB-23988",
      workOrderNo: "WO-10010",
      customer: "Helix Mobility",
      partNo: "HM-DRV-901",
      revision: "R7",
      layerCount: 6,
      line: "AOI Line 1",
      machine: "Koh Young Zenith",
      inspectedAt: "2026-01-04T18:10:00Z",
      severity: "minor",
      defectCount: 6,
      state: "assigned",
      assignedTo: "Rework Tech - A",
      dueDate: "2026-01-07",
      notes: "Minor polarity/offset checks. Route to rework station.",
      defects: [{ code: "PO", name: "Polarity", side: "Top", x: 77.1, y: 21.4, severity: "minor", status: "open" }],
    },
    {
      id: "AOIRW-003",
      jobNo: "JOB-23950",
      workOrderNo: "WO-09960",
      customer: "Atlas Robotics",
      partNo: "AR-CNTRL-010",
      revision: "R2",
      layerCount: 8,
      line: "AOI Line 2",
      machine: "Omron VT-S530",
      inspectedAt: "2026-01-03T11:20:00Z",
      severity: "critical",
      defectCount: 22,
      state: "on_hold",
      assignedTo: "Rework Tech - B",
      dueDate: "2026-01-06",
      notes: "Multiple opens/shorts across BGA region. Awaiting QA decision.",
      defects: [{ code: "OS", name: "Open/Short", side: "Top", x: 98.5, y: 62.2, severity: "critical", status: "open" }],
    },
    {
      id: "AOIRW-004",
      jobNo: "JOB-23912",
      workOrderNo: "WO-09880",
      customer: "Pulse Dynamics",
      partNo: "PD-COMM-122",
      revision: "R4",
      layerCount: 4,
      line: "AOI Line 1",
      machine: "Koh Young Zenith",
      inspectedAt: "2026-01-02T09:25:00Z",
      severity: "major",
      defectCount: 3,
      state: "completed",
      assignedTo: "Rework Tech - A",
      dueDate: "2026-01-03",
      notes: "Rework completed. Sent to retest.",
      defects: [{ code: "TS", name: "Tombstone", side: "Top", x: 18.1, y: 44.9, severity: "major", status: "fixed" }],
    },
  ];

  const fetchList = async (nextPage = meta.page) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/aoi/rework", {
        params: {
          search: search || undefined,
          line: line === "all" ? undefined : line,
          severity: severity === "all" ? undefined : severity,
          state: state === "all" ? undefined : state,
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
        title: "Failed to load AOI rework",
        description: err?.response?.data?.message || "Using sample data (API not reachable).",
        variant: "destructive",
      });

      const sample = mockRows();
      const filtered = sample.filter((r) => {
        const q = search.trim().toLowerCase();
        const matchesQ =
          !q ||
          [r.jobNo, r.workOrderNo, r.customer, r.partNo, r.revision, r.line, r.machine]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q));

        const matchesLine = line === "all" ? true : r.line === line;
        const matchesSev = severity === "all" ? true : r.severity === severity;
        const matchesState = state === "all" ? true : r.state === state;

        const matchesFrom = !from ? true : new Date(r.inspectedAt).getTime() >= new Date(from).getTime();
        const matchesTo = !to ? true : new Date(r.inspectedAt).getTime() <= new Date(to + "T23:59:59").getTime();

        return matchesQ && matchesLine && matchesSev && matchesState && matchesFrom && matchesTo;
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
  }, [line, severity, state]);

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

  const badgeSeverity = (sev) => {
    const v = String(sev || "").toLowerCase();
    if (v === "critical") return <Badge className="bg-red-600 text-white">Critical</Badge>;
    if (v === "major") return <Badge className="bg-orange-600 text-white">Major</Badge>;
    return <Badge variant="outline">Minor</Badge>;
  };

  const badgeState = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "completed")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
        </span>
      );
    if (v === "on_hold")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          On hold
        </span>
      );
    if (v === "in_progress")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          <Wrench className="h-3.5 w-3.5" />
          In progress
        </span>
      );
    if (v === "assigned")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <ClipboardList className="h-3.5 w-3.5" />
          Assigned
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
        <ClipboardList className="h-3.5 w-3.5" />
        Unassigned
      </span>
    );
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

    const id = row?.id ?? row?._id;
    if (!id) return;

    try {
      const res = await api.get(`/quality/aoi/rework/${id}`);
      const details = res?.data?.data ?? res?.data;
      if (details) setSelected((prev) => ({ ...(prev || {}), ...(details || {}) }));
    } catch {
      // ignore
    }
  };

  const openAction = (row, mode) => {
    setSelected(row);
    setActionMode(mode);
    setActionOpen(true);

    // reset form
    setAssignTo(row?.assignedTo || "");
    setDueDate(row?.dueDate ? String(row.dueDate).slice(0, 10) : "");
    setNotes("");
    setDisposition("retest");
    setDefectsFixed("");
  };

  const doAction = async () => {
    if (!selected?.id && !selected?._id) return;

    setSaving(true);
    try {
      const id = selected?.id ?? selected?._id;

      if (actionMode === "assign") {
        if (!assignTo.trim()) {
          toast({ title: "Assign to is required", description: "Please enter technician/station name.", variant: "destructive" });
          setSaving(false);
          return;
        }
        await api.post(`/quality/aoi/rework/${id}/assign`, {
          assigned_to: assignTo.trim(),
          due_date: dueDate || undefined,
          notes: notes || undefined,
        });

        toast({ title: "Assigned", description: `Rework assigned to ${assignTo}.` });
      }

      if (actionMode === "complete") {
        await api.post(`/quality/aoi/rework/${id}/complete`, {
          disposition,
          notes: notes || undefined,
          defects_fixed: defectsFixed || undefined,
        });

        toast({ title: "Completed", description: `Marked completed (Disposition: ${disposition}).` });
      }

      if (actionMode === "hold") {
        if (!notes.trim()) {
          toast({ title: "Reason required", description: "Please enter hold reason in notes.", variant: "destructive" });
          setSaving(false);
          return;
        }
        await api.post(`/quality/aoi/rework/${id}/hold`, { reason: notes.trim() });
        toast({ title: "On hold", description: "Rework moved to hold." });
      }

      if (actionMode === "release") {
        await api.post(`/quality/aoi/rework/${id}/release-hold`, { notes: notes || undefined });
        toast({ title: "Released", description: "Hold released successfully." });
      }

      setActionOpen(false);
      await fetchList(meta.page);
    } catch (err) {
      toast({
        title: "Action failed",
        description: err?.response?.data?.message || "Could not complete action.",
        variant: "destructive",
      });

      // fallback for sample mode: update locally
      setRows((prev) =>
        prev.map((r) => {
          const id = selected?.id ?? selected?._id;
          const rid = r?.id ?? r?._id;
          if (String(rid) !== String(id)) return r;

          if (actionMode === "assign") {
            return { ...r, state: "assigned", assignedTo: assignTo.trim(), dueDate: dueDate || null };
          }
          if (actionMode === "hold") return { ...r, state: "on_hold" };
          if (actionMode === "release") return { ...r, state: "in_progress" };
          if (actionMode === "complete") return { ...r, state: "completed" };
          return r;
        })
      );

      setActionOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/quality/aoi/rework/export", {
        params: {
          search: search || undefined,
          line: line === "all" ? undefined : line,
          severity: severity === "all" ? undefined : severity,
          state: state === "all" ? undefined : state,
          from: from || undefined,
          to: to || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aoi_rework_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export started", description: "Downloaded AOI rework export." });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <Wrench className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">AOI Rework</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">AOI</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Assign, track, hold/release and close AOI rework tasks for PCB assemblies and panels.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(1)} disabled={loading || exporting}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={handleExport} disabled={exporting}>
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
          <CardDescription className="text-xs">Filter by state, severity, line, and date range.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:items-end">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job / WO / Customer / Part…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
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

          <div className="lg:col-span-7 mt-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
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

      {/* Rework table */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Rework Tasks</CardTitle>
          <CardDescription className="text-xs">
            View details, assign to technician, move to hold, or complete with disposition.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Job / WO</th>
                  <th className="px-4 py-3 text-left">Customer / Part</th>
                  <th className="px-4 py-3 text-left">Line / Machine</th>
                  <th className="px-4 py-3 text-left">Inspected</th>
                  <th className="px-4 py-3 text-left">State</th>
                  <th className="px-4 py-3 text-left">Defects</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">Assigned / Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading rework tasks…" : "No AOI rework tasks found."}
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

                      <td className="px-4 py-3">{badgeState(r.state)}</td>

                      <td className="px-4 py-3">
                        <Badge variant={Number(r.defectCount || 0) > 0 ? "secondary" : "outline"}>
                          {Number(r.defectCount || 0)} defects
                        </Badge>
                      </td>

                      <td className="px-4 py-3">{badgeSeverity(r.severity)}</td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.assignedTo || "—"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.dueDate ? `Due: ${String(r.dueDate).slice(0, 10)}` : "No due date"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openView(r)}>
                            <ClipboardList className="h-4 w-4" />
                            View
                          </Button>

                          {String(r.state || "").toLowerCase() === "unassigned" ? (
                            <Button
                              size="sm"
                              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                              onClick={() => openAction(r, "assign")}
                            >
                              <Wrench className="h-4 w-4" />
                              Assign
                            </Button>
                          ) : null}

                          {String(r.state || "").toLowerCase() === "on_hold" ? (
                            <Button
                              size="sm"
                              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                              onClick={() => openAction(r, "release")}
                            >
                              Release
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openAction(r, "hold")}>
                              Hold
                            </Button>
                          )}

                          {String(r.state || "").toLowerCase() !== "completed" ? (
                            <Button
                              size="sm"
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => openAction(r, "complete")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Complete
                            </Button>
                          ) : null}
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

      {/* View details */}
      <AlertDialog open={viewOpen} onOpenChange={setViewOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#dc2551]" />
              Rework Details
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
            <Info label="Inspected At" value={fmtDateTime(selected?.inspectedAt)} />
            <Info label="State" value={selected?.state} />
            <Info label="Defect Count" value={selected?.defectCount} />
            <Info label="Severity" value={selected?.severity} />
            <Info label="Assigned To" value={selected?.assignedTo || "—"} />
            <Info label="Due Date" value={selected?.dueDate ? String(selected.dueDate).slice(0, 10) : "—"} />
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
              <div className="text-xs text-gray-500">{(selected?.defects?.length || 0) ? `${selected.defects.length} items` : "No defect list"}</div>
            </div>

            {(selected?.defects?.length || 0) ? (
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
                      <th className="px-4 py-3 text-left">Status</th>
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
                        <td className="px-4 py-3">
                          <Badge variant={String(d.status || "").toLowerCase() === "fixed" ? "secondary" : "outline"}>
                            {String(d.status || "open").toLowerCase() === "fixed" ? "Fixed" : "Open"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{d.comment || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                No defect items found for this record.
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setViewOpen(false)}>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setViewOpen(false)} className="bg-cyan-600 hover:bg-cyan-500">
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Action dialog */}
      <AlertDialog open={actionOpen} onOpenChange={setActionOpen}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#dc2551]" />
              {actionMode === "assign"
                ? "Assign Rework"
                : actionMode === "complete"
                ? "Complete Rework"
                : actionMode === "hold"
                ? "Put On Hold"
                : "Release Hold"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Job <span className="font-medium">{selected?.jobNo}</span> • WO{" "}
              <span className="font-medium">{selected?.workOrderNo}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {actionMode === "assign" ? (
              <>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Input value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="Technician / Station name" />
                </div>
                <div className="space-y-2">
                  <Label>Due Date (optional)</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add instruction for rework…" />
                </div>
              </>
            ) : null}

            {actionMode === "complete" ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Disposition</Label>
                    <select
                      value={disposition}
                      onChange={(e) => setDisposition(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
                    >
                      <option value="retest">Send to Retest</option>
                      <option value="accept">Accept As-Is</option>
                      <option value="scrap">Scrap</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Defects Fixed (optional)</Label>
                    <Input
                      value={defectsFixed}
                      onChange={(e) => setDefectsFixed(e.target.value)}
                      placeholder="e.g., SB:10, MD:1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Completion notes…" />
                </div>

                {String(selected?.severity || "").toLowerCase() === "critical" ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
                      <div>
                        <div className="font-medium">Critical severity</div>
                        <div className="text-xs text-red-800/80">Ensure QA verification and NCR/CAPA if recurring.</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {actionMode === "hold" ? (
              <div className="space-y-2">
                <Label>Hold Reason</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter reason for hold…" />
                <p className="text-xs text-gray-500">This will move the rework task to <span className="font-medium">On hold</span>.</p>
              </div>
            ) : null}

            {actionMode === "release" ? (
              <div className="space-y-2">
                <Label>Release Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Release note…" />
                <p className="text-xs text-gray-500">This will move the task back to <span className="font-medium">In progress</span>.</p>
              </div>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doAction}
              disabled={saving}
              className={cx(
                actionMode === "complete" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-cyan-600 hover:bg-cyan-500"
              )}
            >
              {saving ? "Saving…" : actionMode === "assign" ? "Assign" : actionMode === "complete" ? "Complete" : actionMode === "hold" ? "Hold" : "Release"}
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
