// src/pages/quality/aoi/AOIDefects.jsx
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
  Cpu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - AOI Defects Master
 *
 * Recommended Backend Endpoints:
 * - GET    /quality/aoi/defects?search=&status=&page=&limit=
 * - POST   /quality/aoi/defects
 * - PUT    /quality/aoi/defects/:id
 * - DELETE /quality/aoi/defects/:id
 *
 * Suggested model fields:
 * - id, code, name, category, severity (low|medium|high|critical),
 *   side (top|bottom|both), isActive, description, createdAt, updatedAt
 */
export default function AOIDefects() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // table data
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active"); // active|inactive|all

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState(null);

  // form
  const emptyForm = useMemo(
    () => ({
      code: "",
      name: "",
      category: "Soldering",
      severity: "medium",
      side: "top",
      isActive: true,
      description: "",
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);

  const totalPages = useMemo(() => {
    const t = Number(meta?.total || 0);
    const l = Number(meta?.limit || 10);
    return Math.max(1, Math.ceil(t / l));
  }, [meta]);

  const severityBadge = (sev) => {
    const s = String(sev || "").toLowerCase();
    const base = "border";
    if (s === "critical") return <Badge className={cx(base, "bg-red-600 text-white")}>Critical</Badge>;
    if (s === "high") return <Badge className={cx(base, "bg-orange-600 text-white")}>High</Badge>;
    if (s === "medium") return <Badge className={cx(base, "bg-yellow-500 text-white")}>Medium</Badge>;
    return <Badge className={cx(base, "bg-gray-200 text-gray-800")}>Low</Badge>;
  };

  const sideBadge = (side) => {
    const s = String(side || "").toLowerCase();
    if (s === "bottom") return <Badge variant="secondary">Bottom</Badge>;
    if (s === "both") return <Badge variant="outline">Both</Badge>;
    return <Badge variant="secondary">Top</Badge>;
  };

  const statusPill = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
        <XCircle className="h-3.5 w-3.5" />
        Inactive
      </span>
    );
  };

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

  const fetchList = async (nextPage = meta.page) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/aoi/defects", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          page: nextPage,
          limit: meta.limit,
        },
      });

      const { items, meta: m } = normalizeList(res?.data);
      setRows(items);
      setMeta((prev) => ({ ...prev, ...m }));
    } catch (err) {
      toast({
        title: "Failed to load AOI defects",
        description: err?.response?.data?.message || "Please check API and try again.",
        variant: "destructive",
      });

      // Safe UI fallback (so page isn't empty)
      setRows((prev) =>
        prev?.length
          ? prev
          : [
              {
                id: "DEF-001",
                code: "AOI-001",
                name: "Solder Bridge",
                category: "Soldering",
                severity: "high",
                side: "top",
                isActive: true,
                description: "Unwanted solder connection between adjacent pads/tracks.",
              },
              {
                id: "DEF-002",
                code: "AOI-002",
                name: "Missing Component",
                category: "Placement",
                severity: "critical",
                side: "top",
                isActive: true,
                description: "Component absent from intended location.",
              },
              {
                id: "DEF-003",
                code: "AOI-003",
                name: "Tombstoning",
                category: "Placement",
                severity: "medium",
                side: "top",
                isActive: false,
                description: "Chip component lifted on one end due to uneven wetting.",
              },
            ]
      );
      setMeta((prev) => ({ ...prev, page: 1, total: prev.total || 3 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset to page 1 whenever filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setSelected(null);
    setCreateOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      code: row?.code ?? "",
      name: row?.name ?? "",
      category: row?.category ?? "Soldering",
      severity: row?.severity ?? "medium",
      side: row?.side ?? "top",
      isActive: typeof row?.isActive === "boolean" ? row.isActive : true,
      description: row?.description ?? "",
    });
    setEditOpen(true);
  };

  const openDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const formErrors = useMemo(() => {
    const e = {};
    if (!String(form.code || "").trim()) e.code = "Code is required.";
    if (!String(form.name || "").trim()) e.name = "Name is required.";
    return e;
  }, [form]);

  const canSave = Object.keys(formErrors).length === 0 && !saving;

  const handleCreate = async () => {
    if (!canSave) {
      toast({ title: "Fix errors", description: "Please fill required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await api.post("/quality/aoi/defects", {
        code: String(form.code).trim(),
        name: String(form.name).trim(),
        category: form.category,
        severity: form.severity,
        side: form.side,
        isActive: Boolean(form.isActive),
        description: String(form.description || "").trim(),
      });

      toast({ title: "Defect created", description: "AOI defect master updated." });
      setCreateOpen(false);
      fetchList(1);
    } catch (err) {
      toast({
        title: "Create failed",
        description: err?.response?.data?.message || "Could not create defect.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected?.id) {
      toast({ title: "No item selected", description: "Please try again.", variant: "destructive" });
      return;
    }
    if (!canSave) {
      toast({ title: "Fix errors", description: "Please fill required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/quality/aoi/defects/${selected.id}`, {
        code: String(form.code).trim(),
        name: String(form.name).trim(),
        category: form.category,
        severity: form.severity,
        side: form.side,
        isActive: Boolean(form.isActive),
        description: String(form.description || "").trim(),
      });

      toast({ title: "Defect updated", description: "Changes saved successfully." });
      setEditOpen(false);
      fetchList(meta.page);
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.response?.data?.message || "Could not update defect.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setSaving(true);
    try {
      await api.delete(`/quality/aoi/defects/${selected.id}`);
      toast({ title: "Defect deleted", description: "Removed from AOI defect master." });
      setDeleteOpen(false);
      fetchList(1);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Could not delete defect.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
            <Cpu className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">AOI Defects</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">Master</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Maintain AOI defect codes used in inspection, NCR/CAPA and yield analytics.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(1)} disabled={loading || saving}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Defect
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm text-gray-700">Filter</CardTitle>
          </div>
          <CardDescription className="text-xs">Search and filter defects used by AOI programs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Code / name / category…"
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="hidden lg:block" />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 sm:w-[320px]">
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
          <CardTitle className="text-sm text-gray-700">Defect List</CardTitle>
          <CardDescription className="text-xs">
            Tip: Keep defect codes stable for consistent traceability & reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Defect</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">Side</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading defects…" : "No defects found. Create your first defect."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id ?? r._id ?? r.code} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.name}</div>
                        {r.description ? <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">{r.description}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.category || "-"}</td>
                      <td className="px-4 py-3">{severityBadge(r.severity)}</td>
                      <td className="px-4 py-3">{sideBadge(r.side)}</td>
                      <td className="px-4 py-3">{statusPill(Boolean(r.isActive))}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            onClick={() => openDelete(r)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
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

      {/* CREATE dialog */}
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create AOI Defect</AlertDialogTitle>
            <AlertDialogDescription>
              Add a new defect code used by AOI programs and inspection workflows.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setField("code", e.target.value)} placeholder="e.g., AOI-010" />
              {formErrors.code ? <p className="text-xs text-red-600">{formErrors.code}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g., Insufficient Solder"
              />
              {formErrors.name ? <p className="text-xs text-red-600">{formErrors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option>Soldering</option>
                <option>Placement</option>
                <option>Polarity</option>
                <option>Bridging</option>
                <option>Missing/Extra</option>
                <option>Mechanical</option>
                <option>Others</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <select
                value={form.severity}
                onChange={(e) => setField("severity", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Side</Label>
              <select
                value={form.side}
                onChange={(e) => setField("side", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Active</div>
                  <div className="text-xs text-gray-500">Inactive defects won’t be selectable.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setField("isActive", !form.isActive)}
                  className={cx(
                    "inline-flex h-7 w-12 items-center rounded-full p-1 transition",
                    form.isActive ? "bg-[#dc2551]" : "bg-gray-300"
                  )}
                  aria-label="Toggle active"
                >
                  <span
                    className={cx(
                      "h-5 w-5 rounded-full bg-white shadow transition",
                      form.isActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Optional notes for inspectors / AOI programmers…"
                className="min-h-[92px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate} disabled={!canSave} className="bg-[#dc2551] hover:bg-[#b02045]">
              {saving ? "Saving..." : "Create"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDIT dialog */}
      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit AOI Defect</AlertDialogTitle>
            <AlertDialogDescription>Update defect details. Keep code stable for reports.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setField("code", e.target.value)} placeholder="e.g., AOI-010" />
              {formErrors.code ? <p className="text-xs text-red-600">{formErrors.code}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Defect name" />
              {formErrors.name ? <p className="text-xs text-red-600">{formErrors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option>Soldering</option>
                <option>Placement</option>
                <option>Polarity</option>
                <option>Bridging</option>
                <option>Missing/Extra</option>
                <option>Mechanical</option>
                <option>Others</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <select
                value={form.severity}
                onChange={(e) => setField("severity", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Side</Label>
              <select
                value={form.side}
                onChange={(e) => setField("side", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Active</div>
                  <div className="text-xs text-gray-500">Inactive defects won’t be selectable.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setField("isActive", !form.isActive)}
                  className={cx(
                    "inline-flex h-7 w-12 items-center rounded-full p-1 transition",
                    form.isActive ? "bg-[#dc2551]" : "bg-gray-300"
                  )}
                  aria-label="Toggle active"
                >
                  <span
                    className={cx(
                      "h-5 w-5 rounded-full bg-white shadow transition",
                      form.isActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Optional notes for inspectors / AOI programmers…"
                className="min-h-[92px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdate} disabled={!canSave} className="bg-[#dc2551] hover:bg-[#b02045]">
              {saving ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Delete defect?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{selected?.code}</span> —{" "}
              <span className="font-medium">{selected?.name}</span> from the AOI defect master.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
