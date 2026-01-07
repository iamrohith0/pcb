// src/pages/quality/capa/CAPAEffectiveness.jsx
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
    BarChart3,
    CheckCircle2,
    ClipboardCheck,
    Download,
    Filter,
    RefreshCw,
    Search,
    ShieldAlert,
    SlidersHorizontal,
    TrendingUp,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - CAPA Effectiveness
 *
 * Purpose:
 * Track verification results that prove CAPA is effective over time
 * (e.g., defect recurrence reduced, audits passed, customer complaints stopped).
 *
 * Recommended Backend Endpoints:
 * - GET  /quality/capa/effectiveness?search=&status=&owner=&risk=&from=&to=&page=&limit=
 * - GET  /quality/capa/effectiveness/:id
 * - POST /quality/capa/effectiveness/:id/submit-review
 *      { verification_method, sample_size, observed_defects, target_defects, result, notes }
 * - POST /quality/capa/effectiveness/:id/close
 *      { closure_notes }
 * - POST /quality/capa/effectiveness/:id/reopen
 *      { reason }
 * - GET  /quality/capa/effectiveness/export
 *
 * Suggested record fields:
 * - id, capaNo, ncrNo?, source ("AOI"|"E-Test"|"Customer"|"Audit"|"Process"),
 *   issueTitle, process, line, station?,
 *   owner, createdAt, dueDate,
 *   risk ("low"|"medium"|"high"|"critical"),
 *   status ("pending_review"|"effective"|"not_effective"|"monitoring"|"closed"),
 *   lastReviewAt, nextReviewAt?,
 *   verification { method, sampleSize, observedDefects, targetDefects, result, notes },
 *   metrics { beforeDPMO, afterDPMO }?
 */
export default function CAPAEffectiveness() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // all|pending_review|effective|not_effective|monitoring|closed
  const [risk, setRisk] = useState("all"); // all|low|medium|high|critical
  const [owner, setOwner] = useState("all"); // string or all
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // dialogs
  const [viewOpen, setViewOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [confirmMode, setConfirmMode] = useState("close"); // close|reopen

  // review form
  const [verificationMethod, setVerificationMethod] = useState("audit");
  const [sampleSize, setSampleSize] = useState("");
  const [observedDefects, setObservedDefects] = useState("");
  const [targetDefects, setTargetDefects] = useState("0");
  const [result, setResult] = useState("effective"); // effective|not_effective|monitoring
  const [notes, setNotes] = useState("");
  const [nextReviewAt, setNextReviewAt] = useState("");

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
      id: "CAPA-EFF-001",
      capaNo: "CAPA-2026-004",
      ncrNo: "NCR-2026-011",
      source: "AOI",
      issueTitle: "Recurring solder bridges on QFN footprint",
      process: "SMT",
      line: "SMT Line 1",
      owner: "Quality Engineer - A",
      createdAt: "2025-12-20T10:10:00Z",
      dueDate: "2026-01-08",
      risk: "high",
      status: "pending_review",
      lastReviewAt: null,
      nextReviewAt: "2026-01-15",
      verification: {
        method: "process_audit",
        sampleSize: 50,
        observedDefects: 0,
        targetDefects: 0,
        result: "effective",
        notes: "Stencil alignment procedure updated; first 50 panels passed AOI.",
      },
      metrics: { beforeDPMO: 820, afterDPMO: 60 },
    },
    {
      id: "CAPA-EFF-002",
      capaNo: "CAPA-2025-091",
      ncrNo: "NCR-2025-210",
      source: "Customer",
      issueTitle: "Intermittent open circuits on via-in-pad",
      process: "PTH/Plating",
      line: "Plating Line",
      owner: "Process Engineer - B",
      createdAt: "2025-11-01T07:30:00Z",
      dueDate: "2025-12-10",
      risk: "critical",
      status: "monitoring",
      lastReviewAt: "2025-12-20T09:00:00Z",
      nextReviewAt: "2026-01-20",
      verification: {
        method: "etest_trend",
        sampleSize: 200,
        observedDefects: 2,
        targetDefects: 0,
        result: "monitoring",
        notes: "Defects reduced but not zero; continue monitoring 2 more lots.",
      },
      metrics: { beforeDPMO: 1200, afterDPMO: 180 },
    },
    {
      id: "CAPA-EFF-003",
      capaNo: "CAPA-2025-070",
      ncrNo: "NCR-2025-140",
      source: "Audit",
      issueTitle: "Incomplete operator training records for AOI station",
      process: "Quality",
      line: "AOI Line 2",
      owner: "QA Supervisor",
      createdAt: "2025-10-05T12:00:00Z",
      dueDate: "2025-10-25",
      risk: "medium",
      status: "effective",
      lastReviewAt: "2025-11-10T10:00:00Z",
      nextReviewAt: null,
      verification: {
        method: "audit",
        sampleSize: 12,
        observedDefects: 0,
        targetDefects: 0,
        result: "effective",
        notes: "Training matrix completed and verified.",
      },
      metrics: null,
    },
    {
      id: "CAPA-EFF-004",
      capaNo: "CAPA-2025-015",
      ncrNo: "NCR-2025-030",
      source: "E-Test",
      issueTitle: "Shorts found after solder mask curing",
      process: "SM",
      line: "Solder Mask",
      owner: "Process Engineer - A",
      createdAt: "2025-08-15T08:20:00Z",
      dueDate: "2025-09-10",
      risk: "high",
      status: "not_effective",
      lastReviewAt: "2025-09-18T10:00:00Z",
      nextReviewAt: "2026-01-10",
      verification: {
        method: "retest_sampling",
        sampleSize: 30,
        observedDefects: 4,
        targetDefects: 0,
        result: "not_effective",
        notes: "Rework actions insufficient; new root-cause analysis needed.",
      },
      metrics: { beforeDPMO: 650, afterDPMO: 520 },
    },
  ];

  const fetchList = async (nextPage = meta.page) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/capa/effectiveness", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          risk: risk === "all" ? undefined : risk,
          owner: owner === "all" ? undefined : owner,
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
        title: "Failed to load CAPA effectiveness",
        description: err?.response?.data?.message || "Using sample data (API not reachable).",
        variant: "destructive",
      });

      const sample = mockRows();
      const filtered = sample.filter((r) => {
        const q = search.trim().toLowerCase();
        const matchesQ =
          !q ||
          [r.capaNo, r.ncrNo, r.issueTitle, r.process, r.line, r.owner, r.source]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q));

        const matchesStatus = status === "all" ? true : r.status === status;
        const matchesRisk = risk === "all" ? true : r.risk === risk;
        const matchesOwner = owner === "all" ? true : r.owner === owner;

        const matchesFrom = !from ? true : new Date(r.createdAt).getTime() >= new Date(from).getTime();
        const matchesTo = !to ? true : new Date(r.createdAt).getTime() <= new Date(to + "T23:59:59").getTime();

        return matchesQ && matchesStatus && matchesRisk && matchesOwner && matchesFrom && matchesTo;
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
  }, [status, risk, owner]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, from, to]);

  const owners = useMemo(() => {
    const s = new Set(rows.map((r) => r.owner).filter(Boolean));
    // seed common roles
    ["Quality Engineer - A", "Process Engineer - A", "Process Engineer - B", "QA Supervisor"].forEach((x) => s.add(x));
    return ["all", ...Array.from(s)];
  }, [rows]);

  const badgeRisk = (r) => {
    const v = String(r || "").toLowerCase();
    if (v === "critical") return <Badge className="bg-red-600 text-white">Critical</Badge>;
    if (v === "high") return <Badge className="bg-orange-600 text-white">High</Badge>;
    if (v === "medium") return <Badge className="bg-amber-500 text-white">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  const badgeStatus = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "effective")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Effective
        </span>
      );
    if (v === "not_effective")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          Not effective
        </span>
      );
    if (v === "monitoring")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          <TrendingUp className="h-3.5 w-3.5" />
          Monitoring
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
        <ClipboardCheck className="h-3.5 w-3.5" />
        Pending review
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
      const res = await api.get(`/quality/capa/effectiveness/${id}`);
      const details = res?.data?.data ?? res?.data;
      if (details) setSelected((prev) => ({ ...(prev || {}), ...(details || {}) }));
    } catch {
      // ignore
    }
  };

  const openReview = (row) => {
    setSelected(row);
    setReviewOpen(true);

    // seed with previous verification if exists
    const v = row?.verification || {};
    setVerificationMethod(v.method || "audit");
    setSampleSize(v.sampleSize != null ? String(v.sampleSize) : "");
    setObservedDefects(v.observedDefects != null ? String(v.observedDefects) : "");
    setTargetDefects(v.targetDefects != null ? String(v.targetDefects) : "0");
    setResult(v.result || "effective");
    setNotes("");
    setNextReviewAt(row?.nextReviewAt ? String(row.nextReviewAt).slice(0, 10) : "");
  };

  const openConfirm = (row, mode) => {
    setSelected(row);
    setConfirmMode(mode);
    setConfirmOpen(true);
    setNotes("");
  };

  const submitReview = async () => {
    if (!selected?.id && !selected?._id) return;

    const ss = sampleSize.trim();
    const od = observedDefects.trim();
    const td = targetDefects.trim();

    if (!ss || Number.isNaN(Number(ss)) || Number(ss) <= 0) {
      toast({ title: "Sample size required", description: "Enter a valid sample size.", variant: "destructive" });
      return;
    }
    if (!od || Number.isNaN(Number(od)) || Number(od) < 0) {
      toast({ title: "Observed defects required", description: "Enter a valid observed defects count.", variant: "destructive" });
      return;
    }
    if (td === "" || Number.isNaN(Number(td)) || Number(td) < 0) {
      toast({ title: "Target defects invalid", description: "Enter a valid target defects count.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const id = selected?.id ?? selected?._id;

      await api.post(`/quality/capa/effectiveness/${id}/submit-review`, {
        verification_method: verificationMethod,
        sample_size: Number(ss),
        observed_defects: Number(od),
        target_defects: Number(td),
        result,
        notes: notes || undefined,
        next_review_at: nextReviewAt || undefined,
      });

      toast({ title: "Review submitted", description: "Effectiveness review saved successfully." });
      setReviewOpen(false);
      await fetchList(meta.page);
    } catch (err) {
      toast({
        title: "Failed to submit review",
        description: err?.response?.data?.message || "Could not submit review.",
        variant: "destructive",
      });

      // fallback update for sample mode
      setRows((prev) =>
        prev.map((r) => {
          const id = selected?.id ?? selected?._id;
          const rid = r?.id ?? r?._id;
          if (String(rid) !== String(id)) return r;
          return {
            ...r,
            status: result === "effective" ? "effective" : result === "not_effective" ? "not_effective" : "monitoring",
            lastReviewAt: new Date().toISOString(),
            nextReviewAt: nextReviewAt || (result === "monitoring" ? new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10) : null),
            verification: {
              method: verificationMethod,
              sampleSize: Number(ss),
              observedDefects: Number(od),
              targetDefects: Number(td),
              result,
              notes: notes || "",
            },
          };
        })
      );
      setReviewOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const doConfirm = async () => {
    if (!selected?.id && !selected?._id) return;

    setSaving(true);
    try {
      const id = selected?.id ?? selected?._id;

      if (confirmMode === "close") {
        await api.post(`/quality/capa/effectiveness/${id}/close`, { closure_notes: notes || undefined });
        toast({ title: "CAPA closed", description: "Effectiveness record closed." });
      } else {
        if (!notes.trim()) {
          toast({ title: "Reason required", description: "Enter a reason to reopen.", variant: "destructive" });
          setSaving(false);
          return;
        }
        await api.post(`/quality/capa/effectiveness/${id}/reopen`, { reason: notes.trim() });
        toast({ title: "Reopened", description: "Effectiveness record reopened." });
      }

      setConfirmOpen(false);
      await fetchList(meta.page);
    } catch (err) {
      toast({
        title: "Action failed",
        description: err?.response?.data?.message || "Could not complete action.",
        variant: "destructive",
      });

      // fallback
      setRows((prev) =>
        prev.map((r) => {
          const id = selected?.id ?? selected?._id;
          const rid = r?.id ?? r?._id;
          if (String(rid) !== String(id)) return r;
          if (confirmMode === "close") return { ...r, status: "closed" };
          return { ...r, status: "pending_review" };
        })
      );
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get("/quality/capa/effectiveness/export", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          risk: risk === "all" ? undefined : risk,
          owner: owner === "all" ? undefined : owner,
          from: from || undefined,
          to: to || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `capa_effectiveness_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export downloaded", description: "CAPA effectiveness export downloaded." });
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

  const kpi = useMemo(() => {
    const total = rows.length;
    const eff = rows.filter((r) => String(r.status).toLowerCase() === "effective").length;
    const notEff = rows.filter((r) => String(r.status).toLowerCase() === "not_effective").length;
    const monitoring = rows.filter((r) => String(r.status).toLowerCase() === "monitoring").length;
    const pending = rows.filter((r) => String(r.status).toLowerCase() === "pending_review").length;
    return { total, eff, notEff, monitoring, pending };
  }, [rows]);

  const pageFrom = (meta.page - 1) * meta.limit + 1;
  const pageTo = (meta.page - 1) * meta.limit + rows.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <BarChart3 className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">CAPA Effectiveness</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">CAPA</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Verify if corrective & preventive actions actually reduced defects and prevented recurrence.
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

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KPI title="Total" value={kpi.total} icon={SlidersHorizontal} />
        <KPI title="Effective" value={kpi.eff} icon={CheckCircle2} />
        <KPI title="Not Effective" value={kpi.notEff} icon={ShieldAlert} />
        <KPI title="Monitoring" value={kpi.monitoring} icon={TrendingUp} />
        <KPI title="Pending Review" value={kpi.pending} icon={ClipboardCheck} />
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm text-gray-700">Filters</CardTitle>
          </div>
          <CardDescription className="text-xs">Search by CAPA/NCR, issue title, owner, or process.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:items-end">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="CAPA / NCR / Issue / Process…"
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
              <option value="pending_review">Pending review</option>
              <option value="effective">Effective</option>
              <option value="not_effective">Not effective</option>
              <option value="monitoring">Monitoring</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Risk</Label>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Owner</Label>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o === "all" ? "All owners" : o}
                </option>
              ))}
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

      {/* Table */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Effectiveness Records</CardTitle>
          <CardDescription className="text-xs">
            Review effectiveness, schedule next review, and close once stable.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">CAPA / NCR</th>
                  <th className="px-4 py-3 text-left">Issue</th>
                  <th className="px-4 py-3 text-left">Process / Line</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Last / Next Review</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading effectiveness records…" : "No CAPA effectiveness records found."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id ?? r._id ?? r.capaNo} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.capaNo || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.ncrNo || "-"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.issueTitle || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.source ? `${r.source} source` : "—"} • Created {fmtDateTime(r.createdAt)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.process || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.line || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-800">{r.owner || "-"}</td>

                      <td className="px-4 py-3">{badgeRisk(r.risk)}</td>

                      <td className="px-4 py-3">{badgeStatus(r.status)}</td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.lastReviewAt ? fmtDateTime(r.lastReviewAt) : "—"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {r.nextReviewAt ? `Next: ${String(r.nextReviewAt).slice(0, 10)}` : "No next review"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openView(r)}>
                            <SlidersHorizontal className="h-4 w-4" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                            onClick={() => openReview(r)}
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Review
                          </Button>

                          {String(r.status || "").toLowerCase() !== "closed" ? (
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openConfirm(r, "close")}>
                              Close
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openConfirm(r, "reopen")}>
                              Reopen
                            </Button>
                          )}
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

      {/* View dialog */}
      <AlertDialog open={viewOpen} onOpenChange={setViewOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#dc2551]" />
              Effectiveness Details
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{selected?.capaNo}</span> • {selected?.ncrNo ? `NCR ${selected.ncrNo}` : "No NCR linked"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Issue" value={selected?.issueTitle} />
            <Info label="Source" value={selected?.source} />
            <Info label="Process" value={selected?.process} />
            <Info label="Line" value={selected?.line} />
            <Info label="Owner" value={selected?.owner} />
            <Info label="Risk" value={selected?.risk} />
            <Info label="Status" value={selected?.status} />
            <Info label="Due Date" value={selected?.dueDate ? String(selected.dueDate).slice(0, 10) : "—"} />
            <Info label="Created At" value={fmtDateTime(selected?.createdAt)} />
            <Info label="Last Review" value={selected?.lastReviewAt ? fmtDateTime(selected.lastReviewAt) : "—"} />
            <Info label="Next Review" value={selected?.nextReviewAt ? String(selected.nextReviewAt).slice(0, 10) : "—"} />
          </div>

          {selected?.verification ? (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latest Verification</div>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info label="Method" value={selected.verification.method} />
                <Info label="Result" value={selected.verification.result} />
                <Info label="Sample Size" value={selected.verification.sampleSize} />
                <Info label="Observed Defects" value={selected.verification.observedDefects} />
                <Info label="Target Defects" value={selected.verification.targetDefects} />
                <Info label="Notes" value={selected.verification.notes || "—"} />
              </div>
            </div>
          ) : null}

          {selected?.metrics ? (
            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <BarChart3 className="h-4 w-4 text-gray-600" />
                Trend Metrics (Optional)
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info label="Before DPMO" value={selected.metrics.beforeDPMO ?? "—"} />
                <Info label="After DPMO" value={selected.metrics.afterDPMO ?? "—"} />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Tip: connect with AOI/E-test defect trends to compute DPMO automatically.
              </p>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setViewOpen(false)}>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setViewOpen(false)} className="bg-cyan-600 hover:bg-cyan-500">
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review dialog */}
      <AlertDialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#dc2551]" />
              Submit Effectiveness Review
            </AlertDialogTitle>
            <AlertDialogDescription>
              Record verification outcome for <span className="font-medium">{selected?.capaNo}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Verification Method</Label>
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
                >
                  <option value="audit">Audit</option>
                  <option value="process_audit">Process Audit</option>
                  <option value="etest_trend">E-Test Trend</option>
                  <option value="aoi_trend">AOI Trend</option>
                  <option value="retest_sampling">Re-test Sampling</option>
                  <option value="customer_feedback">Customer Feedback</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Result</Label>
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
                >
                  <option value="effective">Effective</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="not_effective">Not effective</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Sample Size</Label>
                <Input value={sampleSize} onChange={(e) => setSampleSize(e.target.value)} placeholder="e.g. 50" />
              </div>
              <div className="space-y-2">
                <Label>Observed Defects</Label>
                <Input value={observedDefects} onChange={(e) => setObservedDefects(e.target.value)} placeholder="e.g. 0" />
              </div>
              <div className="space-y-2">
                <Label>Target Defects</Label>
                <Input value={targetDefects} onChange={(e) => setTargetDefects(e.target.value)} placeholder="e.g. 0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was checked and what changed?" />
            </div>

            <div className="space-y-2">
              <Label>Next Review Date (optional)</Label>
              <Input type="date" value={nextReviewAt} onChange={(e) => setNextReviewAt(e.target.value)} />
              <p className="text-xs text-gray-500">
                If result is <span className="font-medium">Monitoring</span>, schedule another review after 2–4 weeks.
              </p>
            </div>

            {String(selected?.risk || "").toLowerCase() === "critical" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <div className="font-medium">Critical risk CAPA</div>
                    <div className="text-xs text-red-800/80">Ensure objective evidence is attached in backend (audit logs, trend charts, retest reports).</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitReview}
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              {saving ? "Saving…" : "Submit Review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close/Reopen confirm */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMode === "close" ? "Close effectiveness record?" : "Reopen effectiveness record?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode === "close"
                ? "Close when CAPA is stable and verified. You can reopen later if recurrence happens."
                : "Reopen if recurrence is detected or verification failed. This will move the record to pending review."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label>{confirmMode === "close" ? "Closure Notes (optional)" : "Reason (required)"}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={confirmMode === "close" ? "Closure evidence summary…" : "Why reopen?"} />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doConfirm}
              disabled={saving}
              className={confirmMode === "close" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-cyan-600 hover:bg-cyan-500"}
            >
              {saving ? "Saving…" : confirmMode === "close" ? "Close" : "Reopen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KPI({ title, value, icon: Icon }) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
          <Icon className="h-5 w-5 text-[#dc2551]" />
        </div>
      </CardContent>
    </Card>
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
