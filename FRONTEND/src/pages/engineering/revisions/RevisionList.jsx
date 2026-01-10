// src/pages/engineering/revisions/RevisionList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  FilePlus2,
  Filter,
  GitCompare,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

/**
 * RevisionList.jsx (PCBxpress / PCB Manufacturing ERP)
 *
 * Suggested routes:
 *  - /engineering/revisions
 *
 * What it does:
 *  - Lists PCB job revisions
 *  - Search & filter by job, revision, status, finish, layer count
 *  - Quick actions: View, Compare, Create new revision (prefilled), Copy package info, Delete (admin)
 *
 * Backend integration (replace mocks):
 *  - GET    /engineering/revisions?search=&status=&finish=&layers=&job=&page=&pageSize=
 *  - DELETE /engineering/revisions/:id
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = ["All", "Draft", "Pending ECO", "Pending QA", "Released", "Obsolete"];
const FINISH = ["All", "HASL", "LF-HASL", "ENIG", "OSP", "Immersion Silver", "Immersion Tin"];

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "-";
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case "Released":
      return "bg-emerald-600 text-white";
    case "Pending ECO":
      return "bg-amber-500 text-white";
    case "Pending QA":
      return "bg-sky-600 text-white";
    case "Obsolete":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-100 text-gray-900";
  }
}

import revisionService from "@/services/engineering/revisions.service";

export default function RevisionList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 10 });

  // Filters
  const [search, setSearch] = useState(sp.get("search") || "");
  const [job, setJob] = useState(sp.get("job") || "");
  const [status, setStatus] = useState(sp.get("status") || "All");
  const [finish, setFinish] = useState(sp.get("finish") || "All");
  const [layers, setLayers] = useState(sp.get("layers") || "All");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const query = useMemo(() => {
    return {
      search,
      job,
      status,
      finish,
      layers,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 10),
    };
  }, [search, job, status, finish, layers, sp]);

  const syncQueryToUrl = (patch = {}) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "" || v === "All") next.delete(k);
      else next.set(k, String(v));
    });
    // reset page if filters changed
    if (patch.search !== undefined || patch.job !== undefined || patch.status !== undefined || patch.finish !== undefined || patch.layers !== undefined) {
      next.set("page", "1");
    }
    setSp(next, { replace: true });
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await revisionService.getAll(query);
      setRows(res.items || []);
      setMeta({ total: res.total || 0, page: res.page || 1, pageSize: res.pageSize || 10 });
    } catch (e) {
      toast({ title: "Load failed", description: "Could not load revisions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const totalPages = useMemo(() => {
    const p = Math.ceil((meta.total || 0) / (meta.pageSize || 10));
    return Math.max(1, p);
  }, [meta.total, meta.pageSize]);

  const pageInfo = useMemo(() => {
    const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
    const end = Math.min(meta.total, meta.page * meta.pageSize);
    return { start, end };
  }, [meta]);

  const goPage = (p) => {
    const next = new URLSearchParams(sp);
    next.set("page", String(Math.min(Math.max(1, p), totalPages)));
    setSp(next, { replace: true });
  };

  const clearFilters = () => {
    setSearch("");
    setJob("");
    setStatus("All");
    setFinish("All");
    setLayers("All");
    setSp(new URLSearchParams({ page: "1", pageSize: String(meta.pageSize || 10) }), { replace: true });
  };

  const openDelete = (row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await revisionService.delete(deleteTarget.id);
      toast({ title: "Deleted", description: `${deleteTarget.jobCode} ${deleteTarget.newRevision} removed.` });
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchList();
    } catch (e) {
      toast({ title: "Delete failed", description: "Could not delete revision.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const copySummary = async (row) => {
    const text = [
      `Job: ${row.jobCode}`,
      `Rev: ${row.baseRevision} → ${row.newRevision}`,
      `Title: ${row.title}`,
      `Status: ${row.status}`,
      `Fab: ${row.layers}L, ${row.thickness}, ${row.finish}`,
      `Created: ${formatDate(row.createdAt)} by ${row.createdBy}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Revision summary copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard not available.", variant: "destructive" });
    }
  };

  const goCreateFrom = (row) => {
    navigate(`/dashboard/engineering/revisions/create?job=${encodeURIComponent(row.jobCode)}&base=${encodeURIComponent(row.newRevision)}`);
  };

  const goCompare = (row) => {
    // You said you are creating RevisionCompare.jsx – this route can match that page.
    navigate(`/dashboard/engineering/revisions/compare?job=${encodeURIComponent(row.jobCode)}&from=${encodeURIComponent(row.baseRevision)}&to=${encodeURIComponent(row.newRevision)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Revisions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage PCB job revisions, release packages, and approval gates (ECO/QA/Customer).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={fetchList}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <Link to="/dashboard/engineering/revisions/create">
              <FilePlus2 className="h-4 w-4" />
              New Revision
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
            Filters
          </CardTitle>
          <CardDescription>Quickly find revisions by job, status, finish, layers.</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Job, revision, title, finish, status..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="job">Job Code</Label>
              <Input
                id="job"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="e.g., PCBXP-ALPHA-12"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Status</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Finish</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
              >
                {FINISH.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Layers</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={layers}
                onChange={(e) => setLayers(e.target.value)}
              >
                {["All", "1", "2", "4", "6", "8", "10", "12"].map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? "All" : `${x}L`}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-10">
              <div className="mt-6 flex items-center gap-2 rounded-lg border bg-gray-50 p-3 text-xs text-gray-600">
                <Filter className="h-4 w-4" />
                Tip: Search “ECO” or “yield” to quickly locate engineering-driven changes.
              </div>
            </div>

            <div className="md:col-span-2 flex items-end justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear
              </Button>
              <Button
                type="button"
                className="w-full bg-cyan-600 hover:bg-cyan-500"
                onClick={() =>
                  syncQueryToUrl({ search, job, status, finish, layers })
                }
              >
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-gray-600" />
              Revision Records
            </span>

            <div className="text-xs text-gray-500">
              {meta.total ? (
                <>
                  Showing <span className="font-medium text-gray-800">{pageInfo.start}</span>–
                  <span className="font-medium text-gray-800">{pageInfo.end}</span> of{" "}
                  <span className="font-medium text-gray-800">{meta.total}</span>
                </>
              ) : (
                "No records"
              )}
            </div>
          </CardTitle>
          <CardDescription>Click View/Compare for detailed checks and release audit.</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="py-3 pr-3">Job</th>
                  <th className="py-3 pr-3">Revision</th>
                  <th className="py-3 pr-3">Title</th>
                  <th className="py-3 pr-3">Fab</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Created</th>
                  <th className="py-3 pr-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading revisions...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      No revisions found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-gray-900">{r.jobCode}</div>
                        <div className="text-xs text-gray-500">By {r.createdBy}</div>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="inline-flex items-center gap-2">
                          <Badge className="rounded-full bg-gray-100 text-gray-900">{r.baseRevision}</Badge>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                          <Badge className="rounded-full bg-gray-900 text-white">{r.newRevision}</Badge>
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="max-w-[380px] truncate font-medium text-gray-900">{r.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Checklist:{" "}
                            <span className="font-medium text-gray-700">
                              {Object.values(r.checklist || {}).filter(Boolean).length}
                            </span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="inline-flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full bg-gray-100 text-gray-900">{r.layers}L</Badge>
                          <Badge className="rounded-full bg-gray-100 text-gray-900">{r.thickness}</Badge>
                          <Badge className="rounded-full bg-gray-100 text-gray-900">{r.finish}</Badge>
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <Badge className={cx("rounded-full", statusBadgeClass(r.status))}>{r.status}</Badge>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="inline-flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(r.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => copySummary(r)}
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => goCompare(r)}
                          >
                            <GitCompare className="h-4 w-4" />
                            Compare
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => goCreateFrom(r)}
                          >
                            <FilePlus2 className="h-4 w-4" />
                            New from
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                            onClick={() => navigate(`/dashboard/engineering/revisions/${r.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(r)}
                          >
                            <Trash2 className="h-4 w-4" />
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
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-800">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-800">{totalPages}</span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => goPage(1)} disabled={meta.page <= 1}>
                First
              </Button>
              <Button variant="outline" onClick={() => goPage(meta.page - 1)} disabled={meta.page <= 1}>
                Prev
              </Button>
              <Button variant="outline" onClick={() => goPage(meta.page + 1)} disabled={meta.page >= totalPages}>
                Next
              </Button>
              <Button variant="outline" onClick={() => goPage(totalPages)} disabled={meta.page >= totalPages}>
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete revision?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove revision{" "}
              <span className="font-medium">
                {deleteTarget?.jobCode} {deleteTarget?.newRevision}
              </span>{" "}
              from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
