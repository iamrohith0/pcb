// src/pages/quality/masters/DefectCodes.jsx
import { format } from "date-fns";
import {
    AlertTriangle,
    BadgeCheck,
    ClipboardList,
    Download,
    Edit3,
    Filter,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog.jsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

/**
 * DefectCodes.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Folder suggestion (since this is a master list used by many quality modules):
 * - src/pages/quality/masters/DefectCodes.jsx
 *
 * Recommended backend endpoints:
 * - GET    /quality/defect-codes?plant_id=&q=&category=&process=&severity=&is_active=&page=&page_size=
 * - POST   /quality/defect-codes
 * - PUT    /quality/defect-codes/:id
 * - PATCH  /quality/defect-codes/:id/toggle
 * - DELETE /quality/defect-codes/:id
 * - GET    /quality/defect-codes/export (CSV)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const CATEGORY = [
  "Registration",
  "Drilling",
  "PTH",
  "Imaging",
  "Etching",
  "Soldermask",
  "Surface Finish",
  "Legend",
  "Routing",
  "Final Inspection",
  "Packing",
];

const PROCESS = [
  "CAM",
  "Drill",
  "PTH Line",
  "Imaging",
  "Etching Line",
  "SM Line",
  "Finish Line",
  "AOI",
  "E-Test",
  "Final QC",
  "Dispatch",
];

const SEVERITY = ["Minor", "Major", "Critical"];

function emptyForm() {
  return {
    id: null,
    code: "",
    name: "",
    category: "Final Inspection",
    process: "Final QC",
    severity: "Major",
    description: "",
    suggested_action: "",
    is_active: true,
  };
}

function validate(form) {
  const e = {};
  if (!form.code.trim()) e.code = "Code is required";
  if (!form.name.trim()) e.name = "Name is required";
  return e;
}

export default function DefectCodes() {
  const { toast } = useToast();

  // Filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [process, setProcess] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [active, setActive] = useState("All");

  // Data
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });

  // Form panel
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  // Confirmations
  const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });
  const [confirmExport, setConfirmExport] = useState(false);

  const pageCount = useMemo(() => {
    const total = Number(meta.total || 0);
    const size = Number(meta.pageSize || 20);
    return Math.max(1, Math.ceil(total / size));
  }, [meta.total, meta.pageSize]);

  const queryParams = useMemo(() => {
    return {
      q: q.trim() || undefined,
      category: category !== "All" ? category : undefined,
      process: process !== "All" ? process : undefined,
      severity: severity !== "All" ? severity : undefined,
      is_active: active === "All" ? undefined : active === "Active",
      page: meta.page,
      page_size: meta.pageSize,
    };
  }, [q, category, process, severity, active, meta.page, meta.pageSize]);

  async function fetchRows() {
    setLoading(true);
    try {
      // Replace with: defectCodesApi.list(queryParams)
      await new Promise((r) => setTimeout(r, 420));

      const base = [
        {
          id: "DC-001",
          code: "SM-BL",
          name: "Soldermask Blister",
          category: "Soldermask",
          process: "SM Line",
          severity: "Major",
          description: "Blistering or bubbling in solder mask after curing.",
          suggested_action: "Check bake profile, cleaning, and humidity control.",
          is_active: true,
          updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        },
        {
          id: "DC-002",
          code: "ET-UN",
          name: "Under Etch",
          category: "Etching",
          process: "Etching Line",
          severity: "Critical",
          description: "Copper remaining beyond tolerance causing shorts / bridges.",
          suggested_action: "Verify etch chemistry, spray pressure, and conveyor speed.",
          is_active: true,
          updated_at: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        },
        {
          id: "DC-003",
          code: "AOI-MR",
          name: "Missing Registration",
          category: "Registration",
          process: "AOI",
          severity: "Major",
          description: "Misalignment between layers / artwork mismatch detected in AOI.",
          suggested_action: "Verify fiducials, tooling holes, and lamination alignment.",
          is_active: false,
          updated_at: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        },
      ];

      const ql = q.trim().toLowerCase();
      let filtered = base.filter((x) => {
        const hay = `${x.code} ${x.name} ${x.category} ${x.process} ${x.severity} ${x.description}`.toLowerCase();
        const okQ = !ql || hay.includes(ql);
        const okCat = category === "All" || x.category === category;
        const okProc = process === "All" || x.process === process;
        const okSev = severity === "All" || x.severity === severity;
        const okAct = active === "All" || (active === "Active" ? x.is_active : !x.is_active);
        return okQ && okCat && okProc && okSev && okAct;
      });

      const total = filtered.length;
      const start = (meta.page - 1) * meta.pageSize;
      filtered = filtered.slice(start, start + meta.pageSize);

      setRows(filtered);
      setMeta((m) => ({ ...m, total }));
    } catch (e) {
      toast({ title: "Failed to load defect codes", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams.q, queryParams.category, queryParams.process, queryParams.severity, queryParams.is_active, queryParams.page, queryParams.page_size]);

  function resetFilters() {
    setQ("");
    setCategory("All");
    setProcess("All");
    setSeverity("All");
    setActive("All");
    setMeta((m) => ({ ...m, page: 1 }));
  }

  function openCreate() {
    setErrors({});
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(row) {
    setErrors({});
    setForm({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      process: row.process,
      severity: row.severity,
      description: row.description || "",
      suggested_action: row.suggested_action || "",
      is_active: !!row.is_active,
    });
    setFormOpen(true);
  }

  async function saveForm() {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      // Replace with:
      // if (form.id) await defectCodesApi.update(form.id, form)
      // else await defectCodesApi.create(form)
      await new Promise((r) => setTimeout(r, 520));

      toast({
        title: form.id ? "Defect code updated" : "Defect code created",
        description: `${form.code} • ${form.name}`,
      });

      setFormOpen(false);
      await fetchRows();
    } catch (err) {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    try {
      // Replace with: await defectCodesApi.toggle(row.id)
      await new Promise((r) => setTimeout(r, 260));
      toast({
        title: row.is_active ? "Marked inactive" : "Marked active",
        description: `${row.code} • ${row.name}`,
      });
      await fetchRows();
    } catch {
      toast({ title: "Action failed", description: "Please try again.", variant: "destructive" });
    }
  }

  async function deleteRow(row) {
    try {
      // Replace with: await defectCodesApi.remove(row.id)
      await new Promise((r) => setTimeout(r, 420));
      toast({ title: "Defect code deleted", description: `${row.code} • ${row.name}` });
      await fetchRows();
    } catch {
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    }
  }

  async function exportCsv() {
    try {
      // Replace with: window.location = `/quality/defect-codes/export?...`
      toast({ title: "Export started", description: "CSV export (mock). Wire this to backend." });
    } catch {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  }

  function sevBadge(sev) {
    if (sev === "Critical") return <Badge className="bg-rose-600 hover:bg-rose-600">Critical</Badge>;
    if (sev === "Major") return <Badge className="bg-amber-500 hover:bg-amber-500">Major</Badge>;
    return <Badge variant="outline">Minor</Badge>;
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#dc2551]" />
              Defect Codes
            </CardTitle>
            <CardDescription>
              Master list used in AOI, E-Test, Final QC, NCR/CAPA, and production holds.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={fetchRows} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setConfirmExport(true)}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New Defect Code
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Filter className="h-4 w-4 text-gray-600" />
                Filters
              </div>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-600">
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4 space-y-1.5">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={q}
                    onChange={(e) => {
                      setMeta((m) => ({ ...m, page: 1 }));
                      setQ(e.target.value);
                    }}
                    placeholder="Search code, name, category, process…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setCategory(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {CATEGORY.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Process</Label>
                <select
                  value={process}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setProcess(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {PROCESS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Severity</Label>
                <select
                  value={severity}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setSeverity(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {SEVERITY.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Status</Label>
                <select
                  value={active}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setActive(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="text-sm font-semibold text-gray-900">Defect Codes</div>
              <div className="text-xs text-gray-500">
                Total: <span className="font-medium text-gray-700">{meta.total}</span>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Code</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Name</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Category</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Process</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Severity</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Status</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Updated</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 w-[220px]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-600">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading…
                        </div>
                      </td>
                    </tr>
                  ) : rows.length ? (
                    rows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="font-semibold">
                            {r.code}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-gray-900">{r.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[420px]">{r.description || "—"}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-800">{r.category}</td>
                        <td className="px-3 py-2 text-gray-800">{r.process}</td>
                        <td className="px-3 py-2">{sevBadge(r.severity)}</td>
                        <td className="px-3 py-2">
                          {r.is_active ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 inline-flex items-center gap-1">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="inline-flex items-center gap-1 text-gray-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {r.updated_at ? format(new Date(r.updated_at), "dd MMM yyyy") : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(r)}>
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => toggleActive(r)}
                            >
                              <Wrench className="h-4 w-4" />
                              {r.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => setConfirmDelete({ open: true, row: r })}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-600">
                        No defect codes found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
              <div className="text-xs text-gray-500">
                Page <span className="font-medium text-gray-700">{meta.page}</span> of{" "}
                <span className="font-medium text-gray-700">{pageCount}</span>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500">Rows</Label>
                <select
                  value={meta.pageSize}
                  onChange={(e) => setMeta((m) => ({ ...m, pageSize: Number(e.target.value), page: 1 }))}
                  className="h-9 rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))}
                  disabled={meta.page <= 1 || loading}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMeta((m) => ({ ...m, page: Math.min(pageCount, m.page + 1) }))}
                  disabled={meta.page >= pageCount || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Slide-over form (simple inline panel) */}
          {formOpen ? (
            <div className="rounded-xl border bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {form.id ? "Edit Defect Code" : "Create Defect Code"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Keep codes short and consistent (e.g., ET-UN, SM-BL, AOI-MR).
                  </div>
                </div>

                <Button variant="ghost" className="text-gray-600" onClick={() => setFormOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-3 space-y-1.5">
                  <Label>Code *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                    placeholder="ET-UN"
                  />
                  {errors.code ? <p className="text-xs text-rose-600">{errors.code}</p> : null}
                </div>

                <div className="md:col-span-5 space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Under Etch"
                  />
                  {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label>Severity</Label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value }))}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    {SEVERITY.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    {CATEGORY.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label>Process</Label>
                  <select
                    value={form.process}
                    onChange={(e) => setForm((s) => ({ ...s, process: e.target.value }))}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    {PROCESS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="What is the defect? What does it look like?"
                    className="min-h-[90px]"
                  />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label>Suggested Action</Label>
                  <Textarea
                    value={form.suggested_action}
                    onChange={(e) => setForm((s) => ({ ...s, suggested_action: e.target.value }))}
                    placeholder="Recommended checks / containment / corrective action"
                    className="min-h-[90px]"
                  />
                </div>

                <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="text-xs text-gray-500">
                    Status:{" "}
                    <span className="font-medium text-gray-700">{form.is_active ? "Active" : "Inactive"}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setForm((s) => ({ ...s, is_active: !s.is_active }))}
                    >
                      {form.is_active ? "Mark Inactive" : "Mark Active"}
                    </Button>

                    <Button
                      className="bg-cyan-600 hover:bg-cyan-500"
                      onClick={saveForm}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </span>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Confirm Export */}
      <ConfirmationDialog
        open={confirmExport}
        onOpenChange={setConfirmExport}
        title="Export defect codes?"
        description="A CSV will be generated using the current filters."
        confirmText="Export"
        confirmVariant="default"
        onConfirm={async () => {
          setConfirmExport(false);
          await exportCsv();
        }}
      />

      {/* Confirm Delete */}
      <ConfirmationDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete((s) => ({ ...s, open }))}
        title="Delete defect code?"
        description={
          confirmDelete.row
            ? `This will permanently remove ${confirmDelete.row.code} • ${confirmDelete.row.name}.`
            : "This will permanently remove the selected defect code."
        }
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={async () => {
          const row = confirmDelete.row;
          setConfirmDelete({ open: false, row: null });
          if (row) await deleteRow(row);
        }}
      />
    </div>
  );
}
