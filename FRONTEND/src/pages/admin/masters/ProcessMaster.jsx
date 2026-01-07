// src/pages/production/masters/ProcessMaster.jsx
import { format } from "date-fns";
import {
    ArrowRightLeft,
    BadgeCheck,
    Download,
    Edit3,
    Factory,
    Filter,
    Layers3,
    Link2,
    Loader2,
    Plus,
    RefreshCw,
    Route,
    Search,
    Timer,
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
 * ProcessMaster.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Suggested folder:
 * - src/pages/production/masters/ProcessMaster.jsx
 *
 * Why this exists:
 * - Single source of truth for manufacturing process steps used by:
 *   Routing, Work Orders, WIP Move, Capacity, OEE, Quality checkpoints.
 *
 * Recommended backend endpoints:
 * - GET    /production/processes?q=&area=&process_type=&is_active=&page=&page_size=
 * - POST   /production/processes
 * - PUT    /production/processes/:id
 * - PATCH  /production/processes/:id/toggle
 * - DELETE /production/processes/:id
 * - GET    /production/processes/export (CSV)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const AREA = [
  "CAM/Engineering",
  "Inner Layer",
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

const PROCESS_TYPE = ["Manual", "Machine", "Chemical", "Inspection", "Test"];

const CHECKPOINTS = ["None", "In-Process", "Quality Gate", "Final Gate"];

function emptyForm() {
  return {
    id: null,
    code: "",
    name: "",
    area: "Imaging",
    process_type: "Machine",
    standard_cycle_time_min: 10,
    setup_time_min: 5,
    queue_buffer_min: 0,
    checkpoint: "In-Process",
    requires_material_issue: false,
    requires_machine: true,
    description: "",
    work_instructions: "",
    is_active: true,
  };
}

function validate(form) {
  const e = {};
  if (!form.code.trim()) e.code = "Code is required";
  if (!form.name.trim()) e.name = "Name is required";
  if (!form.area) e.area = "Area is required";
  if (!form.process_type) e.process_type = "Process type is required";
  if (Number.isNaN(Number(form.standard_cycle_time_min)) || Number(form.standard_cycle_time_min) < 0)
    e.standard_cycle_time_min = "Cycle time must be 0 or more";
  if (Number.isNaN(Number(form.setup_time_min)) || Number(form.setup_time_min) < 0)
    e.setup_time_min = "Setup time must be 0 or more";
  if (Number.isNaN(Number(form.queue_buffer_min)) || Number(form.queue_buffer_min) < 0)
    e.queue_buffer_min = "Queue buffer must be 0 or more";
  return e;
}

function SwitchLike({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
        value ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-700"
      )}
      aria-pressed={value}
    >
      {value ? <BadgeCheck className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
      <span className="font-medium">{label}</span>
      <span className={cx("h-2 w-2 rounded-full", value ? "bg-emerald-500" : "bg-gray-400")} />
    </button>
  );
}

export default function ProcessMaster() {
  const { toast } = useToast();

  // Filters
  const [q, setQ] = useState("");
  const [area, setArea] = useState("All");
  const [processType, setProcessType] = useState("All");
  const [active, setActive] = useState("All");

  // Data
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });

  // Form
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  // Confirms
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
      area: area !== "All" ? area : undefined,
      process_type: processType !== "All" ? processType : undefined,
      is_active: active === "All" ? undefined : active === "Active",
      page: meta.page,
      page_size: meta.pageSize,
    };
  }, [q, area, processType, active, meta.page, meta.pageSize]);

  async function fetchRows() {
    setLoading(true);
    try {
      // Replace with: processApi.list(queryParams)
      await new Promise((r) => setTimeout(r, 420));

      const base = [
        {
          id: "PR-001",
          code: "CAM-01",
          name: "CAM Data Prep",
          area: "CAM/Engineering",
          process_type: "Manual",
          standard_cycle_time_min: 30,
          setup_time_min: 0,
          queue_buffer_min: 0,
          checkpoint: "Quality Gate",
          requires_material_issue: false,
          requires_machine: false,
          description: "Gerber review, DFM checks, tooling, and output generation.",
          work_instructions: "Verify stackup, annular ring, drills, panel specs.",
          is_active: true,
          updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        },
        {
          id: "PR-002",
          code: "DRL-01",
          name: "CNC Drilling",
          area: "Drilling",
          process_type: "Machine",
          standard_cycle_time_min: 18,
          setup_time_min: 12,
          queue_buffer_min: 10,
          checkpoint: "In-Process",
          requires_material_issue: false,
          requires_machine: true,
          description: "Drill program execution and tool wear control.",
          work_instructions: "Confirm tool list, backup, entry/exit material, hit count.",
          is_active: true,
          updated_at: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        },
        {
          id: "PR-003",
          code: "ET-01",
          name: "Etching Line",
          area: "Etching",
          process_type: "Chemical",
          standard_cycle_time_min: 22,
          setup_time_min: 6,
          queue_buffer_min: 15,
          checkpoint: "In-Process",
          requires_material_issue: false,
          requires_machine: true,
          description: "Copper removal to achieve target trace geometry.",
          work_instructions: "Check chemistry, ORP, temp, spray pressure, speed.",
          is_active: false,
          updated_at: new Date(Date.now() - 9 * 24 * 3600 * 1000),
        },
      ];

      const ql = q.trim().toLowerCase();
      let filtered = base.filter((x) => {
        const hay = `${x.code} ${x.name} ${x.area} ${x.process_type} ${x.description}`.toLowerCase();
        const okQ = !ql || hay.includes(ql);
        const okArea = area === "All" || x.area === area;
        const okType = processType === "All" || x.process_type === processType;
        const okAct = active === "All" || (active === "Active" ? x.is_active : !x.is_active);
        return okQ && okArea && okType && okAct;
      });

      const total = filtered.length;
      const start = (meta.page - 1) * meta.pageSize;
      filtered = filtered.slice(start, start + meta.pageSize);

      setRows(filtered);
      setMeta((m) => ({ ...m, total }));
    } catch {
      toast({ title: "Failed to load processes", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams.q, queryParams.area, queryParams.process_type, queryParams.is_active, queryParams.page, queryParams.page_size]);

  function resetFilters() {
    setQ("");
    setArea("All");
    setProcessType("All");
    setActive("All");
    setMeta((m) => ({ ...m, page: 1 }));
  }

  function openCreate() {
    setErrors({});
    setForm(emptyForm());
    setPanelOpen(true);
  }

  function openEdit(row) {
    setErrors({});
    setForm({
      id: row.id,
      code: row.code,
      name: row.name,
      area: row.area,
      process_type: row.process_type,
      standard_cycle_time_min: row.standard_cycle_time_min ?? 0,
      setup_time_min: row.setup_time_min ?? 0,
      queue_buffer_min: row.queue_buffer_min ?? 0,
      checkpoint: row.checkpoint ?? "None",
      requires_material_issue: !!row.requires_material_issue,
      requires_machine: !!row.requires_machine,
      description: row.description || "",
      work_instructions: row.work_instructions || "",
      is_active: !!row.is_active,
    });
    setPanelOpen(true);
  }

  async function saveForm() {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      // Replace with:
      // if (form.id) await processApi.update(form.id, form)
      // else await processApi.create(form)
      await new Promise((r) => setTimeout(r, 520));

      toast({
        title: form.id ? "Process updated" : "Process created",
        description: `${form.code} • ${form.name}`,
      });

      setPanelOpen(false);
      await fetchRows();
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    try {
      // Replace with: await processApi.toggle(row.id)
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
      // Replace with: await processApi.remove(row.id)
      await new Promise((r) => setTimeout(r, 420));
      toast({ title: "Process deleted", description: `${row.code} • ${row.name}` });
      await fetchRows();
    } catch {
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    }
  }

  async function exportCsv() {
    try {
      // Replace with: window.location = `/production/processes/export?...`
      toast({ title: "Export started", description: "CSV export (mock). Wire this to backend." });
    } catch {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  }

  function typeBadge(t) {
    if (t === "Machine") return <Badge className="bg-sky-600 hover:bg-sky-600">Machine</Badge>;
    if (t === "Chemical") return <Badge className="bg-violet-600 hover:bg-violet-600">Chemical</Badge>;
    if (t === "Inspection") return <Badge className="bg-amber-500 hover:bg-amber-500">Inspection</Badge>;
    if (t === "Test") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Test</Badge>;
    return <Badge variant="outline">Manual</Badge>;
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-[#dc2551]" />
              Process Master
            </CardTitle>
            <CardDescription>
              Define process steps with cycle times and gates. Used by routing, work orders, WIP moves and KPI dashboards.
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
              New Process
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
              <div className="md:col-span-5 space-y-1.5">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={q}
                    onChange={(e) => {
                      setMeta((m) => ({ ...m, page: 1 }));
                      setQ(e.target.value);
                    }}
                    placeholder="Search code, name, area…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label>Area</Label>
                <select
                  value={area}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setArea(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {AREA.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Type</Label>
                <select
                  value={processType}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setProcessType(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {PROCESS_TYPE.map((t) => (
                    <option key={t} value={t}>
                      {t}
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
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Route className="h-4 w-4 text-gray-700" />
                Processes
              </div>
              <div className="text-xs text-gray-500">
                Total: <span className="font-medium text-gray-700">{meta.total}</span>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[1200px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Code</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Name</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Area</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Type</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Times</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Gate</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Status</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Updated</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 w-[240px]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-gray-600">
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
                          <div className="text-xs text-gray-500 truncate max-w-[520px]">{r.description || "—"}</div>
                        </td>

                        <td className="px-3 py-2 text-gray-800">{r.area}</td>

                        <td className="px-3 py-2">{typeBadge(r.process_type)}</td>

                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1 text-xs text-gray-700">
                            <span className="inline-flex items-center gap-1">
                              <Timer className="h-3.5 w-3.5 text-gray-500" />
                              Cycle: <span className="font-medium">{r.standard_cycle_time_min}m</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Layers3 className="h-3.5 w-3.5 text-gray-500" />
                              Setup: <span className="font-medium">{r.setup_time_min}m</span> • Buffer{" "}
                              <span className="font-medium">{r.queue_buffer_min}m</span>
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <Badge variant={r.checkpoint === "None" ? "outline" : "default"} className={cx(
                            r.checkpoint === "Quality Gate" ? "bg-indigo-600 hover:bg-indigo-600" : "",
                            r.checkpoint === "Final Gate" ? "bg-emerald-600 hover:bg-emerald-600" : "",
                            r.checkpoint === "In-Process" ? "bg-gray-800 hover:bg-gray-800" : ""
                          )}>
                            {r.checkpoint}
                          </Badge>
                        </td>

                        <td className="px-3 py-2">
                          {r.is_active ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 inline-flex items-center gap-1">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="inline-flex items-center gap-1 text-gray-700">
                              <Wrench className="h-3.5 w-3.5" />
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

                            <Button variant="outline" size="sm" className="gap-2" onClick={() => toggleActive(r)}>
                              <ArrowRightLeft className="h-4 w-4" />
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
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-gray-600">
                        No processes found for the selected filters.
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

          {/* Inline editor panel */}
          {panelOpen ? (
            <div className="rounded-xl border bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {form.id ? "Edit Process" : "Create Process"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Define standard timings and gates. These drive capacity planning and WIP lead-time reporting.
                  </div>
                </div>
                <Button variant="ghost" className="text-gray-600" onClick={() => setPanelOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-3 space-y-1.5">
                  <Label>Code *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                    placeholder="DRL-01"
                  />
                  {errors.code ? <p className="text-xs text-rose-600">{errors.code}</p> : null}
                </div>

                <div className="md:col-span-5 space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="CNC Drilling"
                  />
                  {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label>Gate / Checkpoint</Label>
                  <select
                    value={form.checkpoint}
                    onChange={(e) => setForm((s) => ({ ...s, checkpoint: e.target.value }))}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    {CHECKPOINTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label>Area</Label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm((s) => ({ ...s, area: e.target.value }))}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    {AREA.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {errors.area ? <p className="text-xs text-rose-600">{errors.area}</p> : null}
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label>Process Type</Label>
                  <select
                    value={form.process_type}
                    onChange={(e) => setForm((s) => ({ ...s, process_type: e.target.value }))}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    {PROCESS_TYPE.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.process_type ? <p className="text-xs text-rose-600">{errors.process_type}</p> : null}
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label>Cycle Time (min)</Label>
                  <Input
                    type="number"
                    value={form.standard_cycle_time_min}
                    onChange={(e) => setForm((s) => ({ ...s, standard_cycle_time_min: Number(e.target.value) }))}
                  />
                  {errors.standard_cycle_time_min ? (
                    <p className="text-xs text-rose-600">{errors.standard_cycle_time_min}</p>
                  ) : null}
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label>Setup Time (min)</Label>
                  <Input
                    type="number"
                    value={form.setup_time_min}
                    onChange={(e) => setForm((s) => ({ ...s, setup_time_min: Number(e.target.value) }))}
                  />
                  {errors.setup_time_min ? <p className="text-xs text-rose-600">{errors.setup_time_min}</p> : null}
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label>Queue Buffer (min)</Label>
                  <Input
                    type="number"
                    value={form.queue_buffer_min}
                    onChange={(e) => setForm((s) => ({ ...s, queue_buffer_min: Number(e.target.value) }))}
                  />
                  {errors.queue_buffer_min ? <p className="text-xs text-rose-600">{errors.queue_buffer_min}</p> : null}
                </div>

                <div className="md:col-span-12 flex flex-wrap items-center gap-2">
                  <SwitchLike
                    value={form.requires_machine}
                    onChange={(v) => setForm((s) => ({ ...s, requires_machine: v }))}
                    label="Requires Machine"
                  />
                  <SwitchLike
                    value={form.requires_material_issue}
                    onChange={(v) => setForm((s) => ({ ...s, requires_material_issue: v }))}
                    label="Requires Material Issue"
                  />
                  <SwitchLike
                    value={form.is_active}
                    onChange={(v) => setForm((s) => ({ ...s, is_active: v }))}
                    label={form.is_active ? "Active" : "Inactive"}
                  />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="High-level description of the process step."
                    className="min-h-[90px]"
                  />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label>Work Instructions</Label>
                  <Textarea
                    value={form.work_instructions}
                    onChange={(e) => setForm((s) => ({ ...s, work_instructions: e.target.value }))}
                    placeholder="Operator checklist / parameters / checks."
                    className="min-h-[110px]"
                  />
                </div>

                <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Used by: <span className="font-medium text-gray-700">Routing</span> →{" "}
                    <span className="font-medium text-gray-700">Work Orders</span> →{" "}
                    <span className="font-medium text-gray-700">WIP</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setPanelOpen(false)}>
                      Cancel
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
        title="Export processes?"
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
        title="Delete process?"
        description={
          confirmDelete.row
            ? `This will permanently remove ${confirmDelete.row.code} • ${confirmDelete.row.name}.`
            : "This will permanently remove the selected process."
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
