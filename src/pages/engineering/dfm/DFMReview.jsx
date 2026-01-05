// src/pages/engineering/dfm/DFMReview.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import dfmService from "@/services/dfm.service";

/**
 * PCBxpress - DFMReview.jsx
 * -------------------------------------------------------
 * Purpose:
 *  - Internal DFM checklist review + notes
 *  - Update per-check item result (PASS/WARN/FAIL)
 *  - Assign reviewer, set overall status, add global notes
 *  - Trigger approvals flow (Engineer -> CAM -> QA) as simple actions
 *
 * Expected APIs (wire later):
 *  - dfmService.getReview({ jobId }) -> { data: review }
 *  - dfmService.updateReview({ jobId, payload }) -> { data }
 *  - dfmService.submitForApproval({ jobId }) -> { data }
 *  - dfmService.approveStep({ jobId, step }) -> { data }
 *
 * URL:
 *  - /engineering/dfm/review?jobId=123
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const RESULT_META = {
  PASS: { label: "Pass", badge: "bg-emerald-600 hover:bg-emerald-600", icon: CheckCircle2 },
  WARN: { label: "Warn", badge: "bg-amber-600 hover:bg-amber-600", icon: TriangleAlert },
  FAIL: { label: "Fail", badge: "bg-red-600 hover:bg-red-600", icon: XCircle },
};

const STATUS_META = {
  DRAFT: { label: "Draft", badge: "bg-gray-600 hover:bg-gray-600" },
  IN_REVIEW: { label: "In Review", badge: "bg-sky-600 hover:bg-sky-600" },
  NEEDS_CUSTOMER: { label: "Needs Customer Input", badge: "bg-amber-600 hover:bg-amber-600" },
  READY_FOR_CAM: { label: "Ready for CAM", badge: "bg-emerald-600 hover:bg-emerald-600" },
  HOLD: { label: "Hold", badge: "bg-red-600 hover:bg-red-600" },
};

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
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

function computeOverallFromItems(items) {
  const list = items || [];
  const hasFail = list.some((x) => x.result === "FAIL");
  const hasWarn = list.some((x) => x.result === "WARN");
  if (hasFail) return "HOLD";
  if (hasWarn) return "IN_REVIEW";
  return "READY_FOR_CAM";
}

function groupByCategory(items = []) {
  const m = new Map();
  for (const it of items) {
    const k = it.category || "General";
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return Array.from(m.entries()).map(([category, rows]) => ({ category, rows }));
}

const MOCK_REVIEW = (jobId) => ({
  job: {
    jobId: jobId || "—",
    customer: "Acme Electronics",
    partNumber: "ACME-CTRL-02",
    revision: "B",
    layerCount: 6,
    boardSizeMm: "120 x 85",
    finish: "ENIG",
    thickness: "1.6 mm",
    minTrace: "4 mil",
    minSpace: "4 mil",
    minDrill: "0.2 mm",
    impedance: "Yes (Controlled)",
    stackupId: "STK-06L-001",
  },
  review: {
    id: `DFM-REV-${jobId || "NEW"}`,
    status: "IN_REVIEW", // DRAFT | IN_REVIEW | NEEDS_CUSTOMER | READY_FOR_CAM | HOLD
    reviewer: "—",
    lastSavedAt: new Date().toISOString(),
    globalNotes:
      "Review key HDI constraints (microvias + min drill). Request IPC-356 netlist and confirm impedance coupon needs.",
    customerQuestions:
      "Please share IPC-356/netlist and confirm target impedance values + coupon requirements.",
    approvals: {
      dfmEngineer: { name: "—", status: "PENDING", at: null }, // PENDING|APPROVED
      camEngineer: { name: "—", status: "PENDING", at: null },
      qa: { name: "—", status: "PENDING", at: null },
    },
    checklist: [
      {
        id: "CHK-001",
        category: "Fabrication Rules",
        item: "Minimum trace/space meets capability",
        result: "PASS",
        severity: "LOW",
        notes: "4/4 mil ok for HDI-capable line.",
        evidence: "",
      },
      {
        id: "CHK-002",
        category: "Drill & Via",
        item: "Minimum finished drill meets capability",
        result: "WARN",
        severity: "MEDIUM",
        notes: "0.2mm needs tight control; confirm tolerance and aspect ratio.",
        evidence: "",
      },
      {
        id: "CHK-003",
        category: "Stackup & Impedance",
        item: "Controlled impedance table + coupon requirements defined",
        result: "WARN",
        severity: "MEDIUM",
        notes: "Need target impedance table; define coupon type/location.",
        evidence: "",
      },
      {
        id: "CHK-004",
        category: "Testability",
        item: "Netlist / IPC-356 available for E-test",
        result: "FAIL",
        severity: "HIGH",
        notes: "Netlist missing; cannot proceed to CAM release.",
        evidence: "",
      },
      {
        id: "CHK-005",
        category: "Solder Mask",
        item: "Mask dams / expansion verified",
        result: "PASS",
        severity: "LOW",
        notes: "No slivers seen in critical areas.",
        evidence: "",
      },
    ],
  },
});

export default function DFMReview() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const jobId = params.get("jobId") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL"); // ALL|PASS|WARN|FAIL
  const [autoStatus, setAutoStatus] = useState(true);

  const review = data?.review;
  const job = data?.job;

  const statusMeta = STATUS_META[review?.status] || STATUS_META.DRAFT;

  const grouped = useMemo(() => {
    const list = review?.checklist || [];
    const s = search.trim().toLowerCase();
    const filtered = list.filter((row) => {
      const okRes = resultFilter === "ALL" ? true : row.result === resultFilter;
      const okSearch = !s
        ? true
        : `${row.category} ${row.item} ${row.notes} ${row.id} ${row.severity}`.toLowerCase().includes(s);
      return okRes && okSearch;
    });

    return groupByCategory(filtered);
  }, [review, search, resultFilter]);

  const stats = useMemo(() => {
    const list = review?.checklist || [];
    const total = list.length || 0;
    const pass = list.filter((x) => x.result === "PASS").length;
    const warn = list.filter((x) => x.result === "WARN").length;
    const fail = list.filter((x) => x.result === "FAIL").length;
    return { total, pass, warn, fail };
  }, [review]);

  const fetchReview = async () => {
    setLoading(true);
    try {
      // If backend wired:
      // const res = await dfmService.getReview({ jobId });
      // setData(res.data);

      setData(MOCK_REVIEW(jobId || "NEW"));
    } catch (e) {
      toast({
        title: "Failed to load DFM review",
        description: "Unable to fetch review details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const updateChecklistRow = (id, patch) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const row = next.review.checklist.find((x) => x.id === id);
      if (row) Object.assign(row, patch);

      if (autoStatus) {
        next.review.status = computeOverallFromItems(next.review.checklist);
      }
      return next;
    });
  };

  const updateReviewField = (patch) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      Object.assign(next.review, patch);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Backend:
      // await dfmService.updateReview({ jobId, payload: data.review });

      updateReviewField({ lastSavedAt: new Date().toISOString() });
      toast({ title: "Saved", description: "DFM review saved (mock)." });
    } catch (e) {
      toast({
        title: "Save failed",
        description: "Could not save DFM review.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    try {
      // Backend:
      // await dfmService.submitForApproval({ jobId });

      updateReviewField({ status: "IN_REVIEW" });
      toast({ title: "Submitted", description: "Submitted for approvals (mock)." });
    } catch (e) {
      toast({
        title: "Submit failed",
        description: "Could not submit for approval.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveStep = async (stepKey) => {
    try {
      // Backend:
      // await dfmService.approveStep({ jobId, step: stepKey });

      setData((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        next.review.approvals[stepKey] = {
          ...(next.review.approvals[stepKey] || {}),
          status: "APPROVED",
          at: new Date().toISOString(),
          name: next.review.approvals[stepKey]?.name || "Current User",
        };
        return next;
      });

      toast({ title: "Approved", description: `${stepKey} approved (mock).` });
    } catch (e) {
      toast({
        title: "Approve failed",
        description: "Could not approve this step.",
        variant: "destructive",
      });
    }
  };

  const stepBadge = (status) =>
    status === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-600" : "bg-gray-600 hover:bg-gray-600";

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
              <h1 className="text-xl font-bold text-gray-900">DFM Review</h1>

              <Badge className={cx("gap-1.5", statusMeta.badge)}>
                <ClipboardCheck className="h-3.5 w-3.5" />
                {statusMeta.label}
              </Badge>

              <Badge variant="secondary" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {safe(review?.id)}
              </Badge>

              <Link
                to={`/engineering/dfm/report?jobId=${encodeURIComponent(jobId)}`}
                className="text-xs font-semibold text-[#dc2551] hover:underline"
              >
                View Report →
              </Link>
            </div>

            <p className="mt-1 text-sm text-gray-600">
              Internal manufacturability review for PCB fabrication readiness (rules, drill/via, stackup, testability).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchReview} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={handleSave} disabled={loading || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>

          <Button className="gap-2" onClick={handleSubmitForApproval} disabled={loading || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading DFM review...
          </div>
        </Card>
      )}

      {!loading && data && (
        <>
          {/* Job Summary */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Job Snapshot</p>
                <Badge variant="secondary">{safe(job?.jobId)}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{safe(job?.customer)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Part / Rev</p>
                  <p className="font-medium text-gray-900">
                    {safe(job?.partNumber)} / {safe(job?.revision)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Layers</p>
                  <p className="font-medium text-gray-900">{safe(job?.layerCount)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Board Size</p>
                  <p className="font-medium text-gray-900">{safe(job?.boardSizeMm)} mm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Finish</p>
                  <p className="font-medium text-gray-900">{safe(job?.finish)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stackup</p>
                  <p className="font-medium text-gray-900">{safe(job?.stackupId)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Min Trace/Space</p>
                  <p className="font-medium text-gray-900">
                    {safe(job?.minTrace)} / {safe(job?.minSpace)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Min Drill</p>
                  <p className="font-medium text-gray-900">{safe(job?.minDrill)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Impedance</p>
                  <p className="font-medium text-gray-900">{safe(job?.impedance)}</p>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Last saved: <span className="font-medium text-gray-800">{formatDateTime(review?.lastSavedAt)}</span>
              </div>
            </Card>

            {/* Review Controls */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Review Controls</p>

              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="reviewer">Reviewer</Label>
                  <Input
                    id="reviewer"
                    value={review?.reviewer || ""}
                    onChange={(e) => updateReviewField({ reviewer: e.target.value })}
                    placeholder="DFM Engineer name"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-white p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Auto status</p>
                    <p className="text-xs text-gray-500">Status updates based on FAIL/WARN presence</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoStatus((v) => !v)}
                    className={cx(
                      "inline-flex h-8 w-14 items-center rounded-full border transition",
                      autoStatus ? "bg-emerald-600 border-emerald-600" : "bg-gray-200 border-gray-300"
                    )}
                    aria-label="Toggle auto status"
                  >
                    <span
                      className={cx(
                        "h-7 w-7 rounded-full bg-white shadow transition-transform",
                        autoStatus ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>Overall Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(STATUS_META).map((k) => (
                      <Button
                        key={k}
                        variant={review?.status === k ? "default" : "outline"}
                        className="h-9"
                        onClick={() => updateReviewField({ status: k })}
                        disabled={autoStatus}
                        title={autoStatus ? "Disable auto status to set manually" : ""}
                      >
                        {STATUS_META[k].label}
                      </Button>
                    ))}
                  </div>
                  {autoStatus && (
                    <p className="text-xs text-gray-500">
                      Auto status is ON. Turn it off to set status manually.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Checklist Score</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border bg-white p-2">
                      <p className="text-xs text-gray-500">Pass</p>
                      <p className="text-lg font-bold text-emerald-700">{stats.pass}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-2">
                      <p className="text-xs text-gray-500">Warn</p>
                      <p className="text-lg font-bold text-amber-700">{stats.warn}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-2">
                      <p className="text-xs text-gray-500">Fail</p>
                      <p className="text-lg font-bold text-red-700">{stats.fail}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Approvals */}
          <Card className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Approvals</p>
                <p className="mt-1 text-sm text-gray-600">
                  Simple approval steps for release control: DFM Engineer → CAM Engineer → QA
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={() => handleApproveStep("dfmEngineer")}>
                  <BadgeCheck className="h-4 w-4" />
                  Approve (DFM)
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => handleApproveStep("camEngineer")}>
                  <BadgeCheck className="h-4 w-4" />
                  Approve (CAM)
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => handleApproveStep("qa")}>
                  <BadgeCheck className="h-4 w-4" />
                  Approve (QA)
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { key: "dfmEngineer", label: "DFM Engineer" },
                { key: "camEngineer", label: "CAM Engineer" },
                { key: "qa", label: "QA" },
              ].map((s) => {
                const step = review?.approvals?.[s.key] || {};
                const isApproved = step.status === "APPROVED";
                return (
                  <div key={s.key} className="rounded-xl border bg-white p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{s.label}</p>
                      <Badge className={stepBadge(step.status)}>{step.status || "PENDING"}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      By: <span className="font-medium text-gray-800">{safe(step.name)}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      At: <span className="font-medium text-gray-800">{isApproved ? formatDateTime(step.at) : "—"}</span>
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                      <ShieldCheck className="h-4 w-4" />
                      Release gate
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Notes */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Global Notes</p>
              <p className="mt-1 text-sm text-gray-600">
                Internal notes for manufacturing readiness, capability exceptions and assumptions.
              </p>
              <Textarea
                className="mt-3 min-h-[140px]"
                value={review?.globalNotes || ""}
                onChange={(e) => updateReviewField({ globalNotes: e.target.value })}
                placeholder="Add internal notes..."
              />
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Customer Questions</p>
              <p className="mt-1 text-sm text-gray-600">
                Items to clarify with the customer before CAM release (netlist, impedance table, drill tolerance, etc).
              </p>
              <Textarea
                className="mt-3 min-h-[140px]"
                value={review?.customerQuestions || ""}
                onChange={(e) => updateReviewField({ customerQuestions: e.target.value })}
                placeholder="Write questions to customer..."
              />
            </Card>
          </div>

          {/* Checklist filters */}
          <Card className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <Label htmlFor="search">Search checklist</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by category, item, notes, ID, severity..."
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant={resultFilter === "ALL" ? "default" : "outline"} onClick={() => setResultFilter("ALL")} className="h-9">
                  All
                </Button>
                <Button variant={resultFilter === "PASS" ? "default" : "outline"} onClick={() => setResultFilter("PASS")} className="h-9">
                  Pass
                </Button>
                <Button variant={resultFilter === "WARN" ? "default" : "outline"} onClick={() => setResultFilter("WARN")} className="h-9">
                  Warn
                </Button>
                <Button variant={resultFilter === "FAIL" ? "default" : "outline"} onClick={() => setResultFilter("FAIL")} className="h-9">
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
                    </div>

                    <div className="mt-4 divide-y rounded-xl border bg-white">
                      {g.rows.map((row) => {
                        const meta = RESULT_META[row.result] || RESULT_META.WARN;
                        const Icon = meta.icon;

                        return (
                          <div key={row.id} className="p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              {/* Left */}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className={cx("gap-1.5", meta.badge)}>
                                    <Icon className="h-3.5 w-3.5" />
                                    {meta.label}
                                  </Badge>
                                  <Badge variant="outline">{row.id}</Badge>
                                  <Badge variant="secondary">Severity: {safe(row.severity)}</Badge>
                                </div>

                                <p className="mt-2 font-medium text-gray-900">{row.item}</p>

                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Notes</Label>
                                    <Textarea
                                      className="min-h-[90px]"
                                      value={row.notes || ""}
                                      onChange={(e) => updateChecklistRow(row.id, { notes: e.target.value })}
                                      placeholder="Add notes, constraints, exceptions..."
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Evidence / Reference</Label>
                                    <Textarea
                                      className="min-h-[90px]"
                                      value={row.evidence || ""}
                                      onChange={(e) => updateChecklistRow(row.id, { evidence: e.target.value })}
                                      placeholder="Add reference (file name, screenshot name, measurement, etc.)"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Right controls */}
                              <div className="flex flex-col gap-2 lg:w-[220px]">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Result</p>
                                <div className="flex flex-wrap gap-2">
                                  {["PASS", "WARN", "FAIL"].map((r) => (
                                    <Button
                                      key={r}
                                      variant={row.result === r ? "default" : "outline"}
                                      className="h-9"
                                      onClick={() => updateChecklistRow(row.id, { result: r })}
                                      title="Set result"
                                    >
                                      {r}
                                    </Button>
                                  ))}
                                </div>

                                <div className="mt-2 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                                  <div className="flex items-start gap-2">
                                    <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                                    <p>
                                      <span className="font-semibold">Tip:</span> Any <span className="font-semibold">FAIL</span>{" "}
                                      puts release on <span className="font-semibold">HOLD</span>.
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  variant="outline"
                                  className="mt-2 gap-2"
                                  onClick={() =>
                                    toast({
                                      title: "Checklist Item",
                                      description: `${row.id}: ${row.item}`,
                                    })
                                  }
                                >
                                  <FileText className="h-4 w-4" />
                                  Quick View
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

          {/* Footer */}
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-600" />
              <p>
                <span className="font-semibold">Release guidance:</span> When status is{" "}
                <span className="font-semibold">READY_FOR_CAM</span>, generate the final DFM report and proceed to CAM tooling and panelization.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
