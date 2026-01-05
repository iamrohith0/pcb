// src/pages/engineering/revisions/ECOChangeRequests.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

import { useToast } from "@/components/ui/use-toast";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Filter,
  History,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

/**
 * ECOChangeRequests.jsx
 * PCBxpress – Engineering Change Order (ECO) / Change Requests
 *
 * What this page does:
 * - Lists ECO change requests (filters + search)
 * - Shows status badges and key meta
 * - Provides Create (route link), View, Approve/Reject, Delete (confirmation dialog)
 *
 * Backend integration:
 * Replace the mock service with real API calls:
 *  - GET    /engineering/revisions/eco?query=&status=&priority=&from=&to=
 *  - POST   /engineering/revisions/eco/:id/approve
 *  - POST   /engineering/revisions/eco/:id/reject
 *  - DELETE /engineering/revisions/eco/:id
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-800" },
  in_review: { label: "In Review", className: "bg-amber-100 text-amber-900" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Rejected", className: "bg-rose-100 text-rose-900" },
  implemented: { label: "Implemented", className: "bg-purple-100 text-purple-900" },
};

const PRIORITY = {
  low: { label: "Low", className: "bg-gray-100 text-gray-800" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-900" },
  high: { label: "High", className: "bg-rose-100 text-rose-900" },
  critical: { label: "Critical", className: "bg-red-100 text-red-900" },
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso || "-";
  }
}

function shortId(id) {
  if (!id) return "-";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

/** Mock API – replace with real service */
const ecoService = {
  async list(params) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 250));

    // Mock data
    const rows = [
      {
        id: "ECO-2026-00041",
        title: "Update solder mask expansion for fine-pitch BGA",
        projectCode: "PCBXP-ALPHA-12",
        customer: "Aster Devices",
        reason: "Assembly bridging observed in pilot run",
        status: "in_review",
        priority: "high",
        createdAt: "2026-01-03T10:15:00.000Z",
        owner: "CAM",
        affected: ["Gerber", "DFM", "Stackup"],
        revisionFrom: "R1",
        revisionTo: "R2",
      },
      {
        id: "ECO-2026-00037",
        title: "Change via tenting rule for outdoor controller",
        projectCode: "PCBXP-PLANT-07",
        customer: "Kite Controls",
        reason: "Ingress risk improvement",
        status: "submitted",
        priority: "medium",
        createdAt: "2026-01-01T08:02:00.000Z",
        owner: "Engineering",
        affected: ["DFM", "Routing"],
        revisionFrom: "R3",
        revisionTo: "R4",
      },
      {
        id: "ECO-2025-00992",
        title: "Swap laminate from FR4 TG150 to TG170 (lead time)",
        projectCode: "PCBXP-OMEGA-21",
        customer: "NeoGrid",
        reason: "Supply constraint & thermal margin",
        status: "approved",
        priority: "critical",
        createdAt: "2025-12-22T13:41:00.000Z",
        owner: "Procurement",
        affected: ["Stackup", "Procurement"],
        revisionFrom: "R5",
        revisionTo: "R6",
      },
    ];

    // Basic filtering for mock
    const { query, status, priority, from, to } = params || {};
    const q = (query || "").toLowerCase();

    let filtered = rows.filter((r) => {
      const matchesQ =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q);

      const matchesStatus = !status || status === "all" || r.status === status;
      const matchesPriority = !priority || priority === "all" || r.priority === priority;

      const created = new Date(r.createdAt).getTime();
      const fromOk = !from || created >= new Date(from).getTime();
      const toOk = !to || created <= new Date(to).getTime();

      return matchesQ && matchesStatus && matchesPriority && fromOk && toOk;
    });

    // Newest first
    filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { data: filtered };
  },

  async approve(id) {
    await new Promise((r) => setTimeout(r, 250));
    return { ok: true, id };
  },

  async reject(id) {
    await new Promise((r) => setTimeout(r, 250));
    return { ok: true, id };
  },

  async remove(id) {
    await new Promise((r) => setTimeout(r, 250));
    return { ok: true, id };
  },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status || "Unknown", className: "bg-gray-100 text-gray-800" };
  return <Badge className={cx("rounded-full px-2.5 py-0.5", s.className)}>{s.label}</Badge>;
}

function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || { label: priority || "Unknown", className: "bg-gray-100 text-gray-800" };
  return <Badge className={cx("rounded-full px-2.5 py-0.5", p.className)}>{p.label}</Badge>;
}

function AffectedPills({ items }) {
  if (!items?.length) return <span className="text-xs text-gray-500">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 4).map((it) => (
        <Badge key={it} className="rounded-full bg-gray-100 text-gray-800">
          {it}
        </Badge>
      ))}
      {items.length > 4 && <Badge className="rounded-full bg-gray-100 text-gray-800">+{items.length - 4}</Badge>}
    </div>
  );
}

export default function ECOChangeRequests() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  // Filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Dialog state
  const [confirm, setConfirm] = useState({ open: false, mode: null, id: null, title: "" });

  const stats = useMemo(() => {
    const total = rows.length;
    const by = (key, val) => rows.filter((r) => r[key] === val).length;
    return {
      total,
      submitted: by("status", "submitted"),
      inReview: by("status", "in_review"),
      approved: by("status", "approved"),
      rejected: by("status", "rejected"),
    };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ecoService.list({ query, status, priority, from, to });
      setRows(res.data || []);
    } catch (e) {
      toast({
        title: "Failed to load ECOs",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load();
  };

  const onReset = () => {
    setQuery("");
    setStatus("all");
    setPriority("all");
    setFrom("");
    setTo("");
    // Reload with cleared filters
    setTimeout(() => load(), 0);
  };

  const openConfirm = (mode, row) => {
    setConfirm({
      open: true,
      mode,
      id: row.id,
      title: row.title,
    });
  };

  const runAction = async () => {
    const { mode, id } = confirm;
    if (!mode || !id) return;

    try {
      setLoading(true);

      if (mode === "approve") {
        await ecoService.approve(id);
        toast({ title: "ECO Approved", description: `${id} has been approved.` });
      } else if (mode === "reject") {
        await ecoService.reject(id);
        toast({ title: "ECO Rejected", description: `${id} has been rejected.` });
      } else if (mode === "delete") {
        await ecoService.remove(id);
        toast({ title: "ECO Deleted", description: `${id} has been deleted.` });
      }

      // Re-load list
      await load();
    } catch (e) {
      toast({
        title: "Action failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirm({ open: false, mode: null, id: null, title: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ECO Change Requests</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage engineering changes across Gerber, stackup, tooling, routing and production documentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="gap-2 bg-[#DC2551] hover:bg-[#B02045]">
            <Link to="/engineering/revisions/eco/new">
              <Plus className="h-4 w-4" />
              Create ECO
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <History className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Total</div>
            <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Submitted</div>
            <div className="mt-1 text-2xl font-semibold">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">In Review</div>
            <div className="mt-1 text-2xl font-semibold">{stats.inReview}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Approved</div>
            <div className="mt-1 text-2xl font-semibold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Rejected</div>
            <div className="mt-1 text-2xl font-semibold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-gray-600" />
            Filters
          </CardTitle>
          <CardDescription>Search and narrow down ECOs by status, priority and date.</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={onSearch} className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <Label htmlFor="q">Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by ECO ID, title, customer, project…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="implemented">Implemented</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <Input className="mt-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label>To</Label>
                <Input className="mt-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onReset} className="gap-2">
                <XCircle className="h-4 w-4" />
                Reset
              </Button>
              <Button type="submit" className="gap-2 bg-[#DC2551] hover:bg-[#B02045]" disabled={loading}>
                <Search className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-gray-600" />
            ECO List
          </CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${rows.length} record(s)`}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                  <th className="p-3">ECO</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Project / Customer</th>
                  <th className="p-3">Revision</th>
                  <th className="p-3">Affected</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No ECOs found. Try adjusting filters or create a new ECO.
                    </td>
                  </tr>
                )}

                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50/70">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{shortId(r.id)}</div>
                      <div className="text-xs text-gray-500">{r.owner || "—"}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-medium text-gray-900">{r.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">{r.reason}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-medium text-gray-900">{r.projectCode}</div>
                      <div className="text-xs text-gray-500">{r.customer}</div>
                    </td>

                    <td className="p-3">
                      <div className="text-gray-900">
                        {r.revisionFrom} → <span className="font-semibold">{r.revisionTo}</span>
                      </div>
                      <div className="text-xs text-gray-500">ECO revision hop</div>
                    </td>

                    <td className="p-3">
                      <AffectedPills items={r.affected} />
                    </td>

                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="p-3">
                      <PriorityBadge priority={r.priority} />
                    </td>

                    <td className="p-3">
                      <div className="text-gray-900">{formatDate(r.createdAt)}</div>
                      <div className="text-xs text-gray-500">Created</div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <Link to={`/engineering/revisions/eco/${encodeURIComponent(r.id)}`}>
                            View <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>

                        {(r.status === "submitted" || r.status === "in_review") && (
                          <>
                            <Button
                              size="sm"
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => openConfirm("approve", r)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                              onClick={() => openConfirm("reject", r)}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          onClick={() => openConfirm("delete", r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer hint */}
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            Approvals should be role-protected (Engineering Manager / QA / Admin).
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={confirm.open} onOpenChange={(open) => setConfirm((p) => ({ ...p, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm.mode === "approve" && "Approve ECO?"}
              {confirm.mode === "reject" && "Reject ECO?"}
              {confirm.mode === "delete" && "Delete ECO?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-2 space-y-2">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{confirm.id}</span>
                </div>
                <div className="text-sm text-gray-600">{confirm.title}</div>

                {confirm.mode === "approve" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    This will move the request forward for implementation & revision release.
                  </div>
                )}

                {confirm.mode === "reject" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-rose-700">
                    <XCircle className="h-4 w-4" />
                    This will mark the request as rejected and stop further processing.
                  </div>
                )}

                {confirm.mode === "delete" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-rose-700">
                    <Trash2 className="h-4 w-4" />
                    This will permanently remove the ECO request (use with caution).
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>

            {confirm.mode === "approve" && (
              <AlertDialogAction
                onClick={runAction}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Approve
              </AlertDialogAction>
            )}

            {confirm.mode === "reject" && (
              <AlertDialogAction
                onClick={runAction}
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Reject
              </AlertDialogAction>
            )}

            {confirm.mode === "delete" && (
              <AlertDialogAction
                onClick={runAction}
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
