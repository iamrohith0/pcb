// src/pages/engineering/dfm/DFMQueue.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowRight,
    BadgeCheck,
    Calendar,
    ClipboardCheck,
    Eye,
    FileText,
    Filter,
    Layers,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    UserCircle2,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import dfmApi from "@/services/engineering/dfm.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  in_review: { label: "In Review", className: "bg-blue-100 text-blue-800" },
  issues_found: { label: "Issues Found", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejected", className: "bg-rose-100 text-rose-800" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return <Badge className={cx("rounded-full", s.className)}>{s.label}</Badge>;
}


function PriorityPill({ priority }) {
  const map = {
    High: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    Low: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", map[priority] || map.Medium)}>
      {priority || "Medium"}
    </span>
  );
}

function HealthBadge({ value }) {
  if (value == null) return <Badge className="rounded-full bg-gray-100 text-gray-700">—</Badge>;
  const cls =
    value >= 85
      ? "bg-emerald-100 text-emerald-800"
      : value >= 70
      ? "bg-blue-100 text-blue-800"
      : value >= 55
      ? "bg-amber-100 text-amber-800"
      : "bg-rose-100 text-rose-800";
  return <Badge className={cx("rounded-full", cls)}>{value}%</Badge>;
}

export default function DFMQueue() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  // filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | pending | in_review | issues_found | approved | rejected
  const [priority, setPriority] = useState("all"); // all | High | Medium | Low
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      // Suggested backend:
      // GET /dfm/queue?status=&priority=&q=&unassigned=
      // Return: [{...}]
      const resp = await dfmApi.getQueue?.({
        q: query || undefined,
        status: status !== "all" ? status : undefined,
        priority: priority !== "all" ? priority : undefined,
        unassigned: onlyUnassigned ? true : undefined,
      });

      const data = resp?.data?.items || resp?.data || [];
      setRows(data);

      toast({ title: "Queue loaded", description: "DFM queue updated." });
    } catch (err) {
      setRows([]);
      toast({
        title: "Error loading queue",
        description: err?.response?.data?.message || "Unable to load DFM queue at this time.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows || [])
      .filter((r) => {
        const qOk = !q
          ? true
          : `${r.id} ${r.customer} ${r.boardName} ${r.revision} ${r.rfqNo} ${r.soNo} ${r.camNo} ${r.notes}`
              .toLowerCase()
              .includes(q);

        const statusOk = status === "all" ? true : r.status === status;
        const prOk = priority === "all" ? true : r.priority === priority;
        const unassignedOk = !onlyUnassigned ? true : !r.assignedTo;

        return qOk && statusOk && prOk && unassignedOk;
      })
      .sort((a, b) => {
        // prioritize: High > Medium > Low, then newest updated
        const pr = { High: 3, Medium: 2, Low: 1 };
        const pA = pr[a.priority] || 0;
        const pB = pr[b.priority] || 0;
        if (pA !== pB) return pB - pA;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
  }, [rows, query, status, priority, onlyUnassigned]);

  const counts = useMemo(() => {
    const by = (st) => (rows || []).filter((r) => r.status === st).length;
    return {
      all: (rows || []).length,
      pending: by("pending"),
      in_review: by("in_review"),
      issues_found: by("issues_found"),
      approved: by("approved"),
      rejected: by("rejected"),
    };
  }, [rows]);

  const quickStats = useMemo(() => {
    const unassigned = (rows || []).filter((r) => !r.assignedTo).length;
    const issues = (rows || []).filter((r) => r.status === "issues_found").length;
    const inReview = (rows || []).filter((r) => r.status === "in_review").length;
    return { unassigned, issues, inReview };
  }, [rows]);

  const statusIcon = (st) => {
    switch (st) {
      case "approved":
        return <BadgeCheck className="h-4 w-4 text-emerald-700" />;
      case "issues_found":
        return <AlertTriangle className="h-4 w-4 text-amber-700" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-rose-700" />;
      default:
        return <ClipboardCheck className="h-4 w-4 text-[#dc2551]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DFM Queue</h1>
          <p className="text-sm text-gray-500">
            Track jobs waiting for Design-for-Manufacturing review and CAM release.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchQueue} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-[#dc2551]" />}
            Refresh
          </Button>

          <Button
            className="bg-cyan-600 hover:bg-cyan-500 gap-2"
            onClick={() => navigate("/dashboard/engineering/dfm/checklist")}
          >
            <Plus className="h-4 w-4" />
            New Checklist
          </Button>
        </div>
      </div>

      {/* Status chips */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">In Review</p>
                <Badge className="rounded-full bg-blue-100 text-blue-800">{quickStats.inReview}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-700">Jobs actively being checked by CAM/DFM engineer.</p>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Issues Found</p>
                <Badge className="rounded-full bg-amber-100 text-amber-800">{quickStats.issues}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-700">Requires customer clarification or design update.</p>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Unassigned</p>
                <Badge className="rounded-full bg-gray-100 text-gray-700">{quickStats.unassigned}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-700">Needs an owner to start DFM review.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#dc2551]" />
            Filters
          </CardTitle>
          <CardDescription>Search and narrow down DFM jobs</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by RFQ / SO / CAM / customer / board…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            >
              <option value="all">All ({counts.all})</option>
              <option value="pending">Pending ({counts.pending})</option>
              <option value="in_review">In Review ({counts.in_review})</option>
              <option value="issues_found">Issues Found ({counts.issues_found})</option>
              <option value="approved">Approved ({counts.approved})</option>
              <option value="rejected">Rejected ({counts.rejected})</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <div className="mt-3 flex items-center justify-between">
              <Label className="text-sm text-gray-700">Only unassigned</Label>
              <button
                type="button"
                className={cx(
                  "inline-flex h-6 w-11 items-center rounded-full border px-1 transition",
                  onlyUnassigned ? "bg-[#dc2551]/10 border-[#dc2551]/30" : "bg-gray-100 border-gray-200"
                )}
                onClick={() => setOnlyUnassigned((v) => !v)}
                aria-label="Toggle unassigned filter"
              >
                <span
                  className={cx(
                    "h-4 w-4 rounded-full transition",
                    onlyUnassigned ? "translate-x-5 bg-[#dc2551]" : "translate-x-0 bg-gray-400"
                  )}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
                  {/* left: identity */}
                  <div className="lg:col-span-8 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{r.id}</span>
                          <PriorityPill priority={r.priority} />
                          <StatusBadge status={r.status} />
                          <HealthBadge value={r.health} />
                        </div>

                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-semibold">{r.customer}</span> ·{" "}
                          <span className="font-semibold">{r.boardName}</span>{" "}
                          <span className="text-gray-500">Rev {r.revision}</span>
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-4 w-4 text-gray-500" /> {r.layers} layers
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-4 w-4 text-gray-500" /> {r.rfqNo} · {r.soNo} · {r.camNo}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" /> Due: {r.dueDate}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserCircle2 className="h-4 w-4 text-gray-500" />{" "}
                            {r.assignedTo ? `Owner: ${r.assignedTo}` : "Unassigned"}
                          </span>
                        </div>

                        {r.notes ? (
                          <div className="mt-3 rounded-xl border bg-gray-50 p-3">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">Note:</span> {r.notes}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="hidden lg:flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate("/dashboard/engineering/dfm/checklist")}
                          title="Open checklist"
                        >
                          <ClipboardCheck className="h-4 w-4 text-[#dc2551]" />
                          Checklist
                        </Button>

                        <Button
                          className="bg-cyan-600 hover:bg-cyan-500 gap-2"
                          onClick={() => navigate(`/dashboard/engineering/dfm/review?jobId=${encodeURIComponent(r.id)}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* right: action strip */}
                  <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {statusIcon(r.status)}
                        <span className="font-semibold">Updated</span>
                        <span className="text-gray-500">
                          {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => navigate("/dashboard/engineering/dfm/checklist")}
                      >
                        <ClipboardCheck className="h-4 w-4 text-[#dc2551]" />
                        Checklist
                      </Button>

                      <Button
                        className="bg-cyan-600 hover:bg-cyan-500 gap-2"
                        onClick={() => navigate(`/dashboard/engineering/dfm/review?jobId=${encodeURIComponent(r.id)}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                        View
                      </Button>
                    </div>

                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs text-blue-900/90">
                        Suggested next step:{" "}
                        <span className="font-semibold">
                          {r.status === "pending"
                            ? "Assign owner & start review"
                            : r.status === "issues_found"
                            ? "Send clarification to customer"
                            : r.status === "in_review"
                            ? "Complete checklist & approve"
                            : r.status === "approved"
                            ? "Release CAM outputs to production"
                            : "Close and archive"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-100">
                  <ClipboardCheck className="h-6 w-6 text-gray-700" />
                </div>
                <p className="mt-3 font-semibold text-gray-900">No DFM jobs found</p>
                <p className="mt-1 text-sm text-gray-500">Clear filters or try a different search.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
