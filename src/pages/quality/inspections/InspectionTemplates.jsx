// src/pages/quality/inspections/InspectionTemplates.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardList,
  Copy,
  FileDown,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

import inspectionTemplatesService from "@/services/quality/inspection-templates.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const TYPE_META = {
  incoming: { label: "Incoming QC", className: "bg-gray-100 text-gray-700" },
  in_process: { label: "In-Process", className: "bg-gray-100 text-gray-700" },
  final: { label: "Final Inspection", className: "bg-gray-100 text-gray-700" },
};

const DEFAULT_NEW_TEMPLATE = {
  name: "",
  type: "incoming",
  version: "1.0",
  is_active: true,
  description: "",
  checkpoints: [
    // Typical PCB QC checkpoints starter set (editable)
    { key: "visual", label: "Visual Inspection", method: "Visual", spec: "", critical: false, enabled: true },
    { key: "dimensions", label: "Dimensions / Outline", method: "Vernier / CAD", spec: "", critical: false, enabled: true },
    { key: "hole_size", label: "Hole Size / Drill", method: "Pin Gauge", spec: "", critical: true, enabled: true },
    { key: "plating_thickness", label: "PTH Plating Thickness", method: "Microsection", spec: "", critical: true, enabled: true },
    { key: "soldermask", label: "Soldermask / Legend", method: "Visual", spec: "", critical: false, enabled: true },
    { key: "copper_thickness", label: "Copper Thickness", method: "Micrometer", spec: "", critical: false, enabled: true },
    { key: "warpage", label: "Warp / Twist", method: "Flatness Jig", spec: "", critical: false, enabled: true },
    { key: "cleanliness", label: "Cleanliness / Contamination", method: "Visual / Tape", spec: "", critical: false, enabled: true },
    { key: "aoi", label: "AOI Check", method: "AOI", spec: "", critical: true, enabled: true },
    { key: "etest", label: "E-Test (Short/Open)", method: "Flying Probe", spec: "", critical: true, enabled: true },
  ],
};

function TypePill({ value }) {
  const meta = TYPE_META[value] || { label: value || "—", className: "bg-gray-100 text-gray-700" };
  return <span className={cx("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>{meta.label}</span>;
}

function boolLabel(v) {
  return v ? "Yes" : "No";
}

export default function InspectionTemplates() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [activeOnly, setActiveOnly] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | duplicate
  const [current, setCurrent] = useState({ ...DEFAULT_NEW_TEMPLATE });

  const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !needle ||
        String(r.name || "").toLowerCase().includes(needle) ||
        String(r.description || "").toLowerCase().includes(needle) ||
        String(r.version || "").toLowerCase().includes(needle);
      const matchesType = type === "all" ? true : r.type === type;
      const matchesActive = activeOnly ? !!r.is_active : true;
      return matchesQ && matchesType && matchesActive;
    });
  }, [rows, q, type, activeOnly]);

  const fetchList = async () => {
    setLoading(true);
    try {
      /**
       * Expected backend shape:
       * { data: [ { id, name, type, version, is_active, checkpoints_count, updated_at, description } ] }
       */
      const res = await inspectionTemplatesService.list();
      const payload = res?.data ?? res;
      setRows(payload?.data || []);
    } catch (err) {
      toast({
        title: "Failed to load templates",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setMode("create");
    setCurrent({ ...DEFAULT_NEW_TEMPLATE, checkpoints: [...DEFAULT_NEW_TEMPLATE.checkpoints] });
    setDrawerOpen(true);
  };

  const openEdit = async (row) => {
    setMode("edit");
    setSaving(true);
    setDrawerOpen(true);
    try {
      // fetch full template with checkpoints
      const res = await inspectionTemplatesService.get(row.id);
      const payload = res?.data ?? res;
      setCurrent(payload?.data || payload || { ...DEFAULT_NEW_TEMPLATE });
    } catch (err) {
      toast({
        title: "Failed to open template",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      setDrawerOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const openDuplicate = async (row) => {
    setMode("duplicate");
    setSaving(true);
    setDrawerOpen(true);
    try {
      const res = await inspectionTemplatesService.get(row.id);
      const payload = res?.data ?? res;
      const t = payload?.data || payload || {};
      setCurrent({
        ...t,
        id: undefined,
        name: `${t.name || "Template"} (Copy)`,
        version: t.version || "1.0",
        is_active: true,
      });
    } catch (err) {
      toast({
        title: "Failed to duplicate template",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      setDrawerOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, val) => setCurrent((s) => ({ ...s, [key]: val }));

  const updateCheckpoint = (idx, patch) => {
    setCurrent((s) => {
      const next = [...(s.checkpoints || [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...s, checkpoints: next };
    });
  };

  const addCheckpoint = () => {
    setCurrent((s) => ({
      ...s,
      checkpoints: [
        ...(s.checkpoints || []),
        {
          key: `custom_${Date.now()}`,
          label: "",
          method: "",
          spec: "",
          critical: false,
          enabled: true,
        },
      ],
    }));
  };

  const removeCheckpoint = (idx) => {
    setCurrent((s) => {
      const next = [...(s.checkpoints || [])];
      next.splice(idx, 1);
      return { ...s, checkpoints: next };
    });
  };

  const validate = () => {
    if (!current?.name?.trim()) return "Template name is required.";
    if (!current?.type) return "Type is required.";
    if (!current?.version?.trim()) return "Version is required.";
    const cps = current?.checkpoints || [];
    if (cps.length === 0) return "Add at least one checkpoint.";
    const bad = cps.findIndex((c) => c.enabled && !String(c.label || "").trim());
    if (bad >= 0) return `Checkpoint #${bad + 1} needs a label.`;
    return null;
  };

  const handleSave = async () => {
    const errMsg = validate();
    if (errMsg) {
      toast({ title: "Validation", description: errMsg, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (mode === "edit" && current?.id) {
        await inspectionTemplatesService.update(current.id, current);
        toast({ title: "Template updated", description: "Changes saved successfully." });
      } else {
        await inspectionTemplatesService.create(current);
        toast({ title: "Template created", description: "Template saved successfully." });
      }
      setDrawerOpen(false);
      await fetchList();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (row) => setConfirmDelete({ open: true, row });
  const confirmDeleteNow = async () => {
    const row = confirmDelete.row;
    if (!row?.id) return setConfirmDelete({ open: false, row: null });

    setSaving(true);
    try {
      await inspectionTemplatesService.remove(row.id);
      toast({ title: "Deleted", description: "Template removed." });
      setConfirmDelete({ open: false, row: null });
      await fetchList();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await inspectionTemplatesService.update(row.id, { is_active: !row.is_active });
      toast({ title: "Updated", description: `Template is now ${row.is_active ? "inactive" : "active"}.` });
      await fetchList();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportJson = async () => {
    try {
      const res = await inspectionTemplatesService.exportJson();
      const blob = res?.data instanceof Blob ? res.data : null;

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inspection_templates_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast({ title: "Export", description: "Export endpoint did not return a blob. Check backend responseType." });
      }
    } catch (err) {
      toast({
        title: "Export failed",
        description: err?.response?.data?.message || "Could not export templates.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inspection Templates</h1>
          <p className="text-sm text-gray-500">
            Define reusable checkpoint sets for Incoming QC, In-Process, and Final inspections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchList} className="gap-2">
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" onClick={exportJson} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export JSON
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <Label>Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Template name, version, description..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Label>Type</Label>
            <div className="mt-1">
              <select
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="incoming">Incoming QC</option>
                <option value="in_process">In-Process</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-3">
            <Label>Active only</Label>
            <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3">
              <input
                id="activeOnly"
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="h-4 w-4 accent-[#dc2551]"
              />
              <label htmlFor="activeOnly" className="text-sm text-gray-700">
                Show active templates only
              </label>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="inline-flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>
              Templates: <span className="font-semibold text-gray-700">{filteredRows.length}</span>
            </span>
          </div>

          <div className="text-xs text-gray-500">
            Tip: Mark critical checkpoints so inspectors can’t submit without results.
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Checkpoints</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, c) => (
                      <td key={c} className="px-4 py-3">
                        <div className="h-3.5 w-full rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No templates found. Create your first inspection template.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{r.description || "—"}</div>
                    </td>

                    <td className="px-4 py-3">
                      <TypePill value={r.type} />
                    </td>

                    <td className="px-4 py-3 text-gray-700">{r.version || "—"}</td>

                    <td className="px-4 py-3">
                      <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        r.is_active ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
                      )}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {r.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      <Badge variant="secondary">
                        {r.checkpoints_count ?? (r.checkpoints?.length ?? "—")}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>

                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openDuplicate(r)}>
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className={cx("gap-2", r.is_active ? "text-gray-700" : "text-green-700")}
                          onClick={() => toggleActive(r)}
                        >
                          {r.is_active ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-rose-700 hover:bg-rose-50"
                          onClick={() => requestDelete(r)}
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
      </Card>

      {/* Right Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => !saving && setDrawerOpen(false)} />

          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="font-semibold text-gray-900">
                {mode === "edit" ? "Edit Template" : mode === "duplicate" ? "Duplicate Template" : "New Template"}
              </div>
              <Button variant="ghost" size="sm" onClick={() => !saving && setDrawerOpen(false)}>
                ✕
              </Button>
            </div>

            <div className="h-[calc(100%-56px)] overflow-y-auto p-4 space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-7">
                    <Label>Name</Label>
                    <Input
                      className="mt-1"
                      value={current.name || ""}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g., Standard Final Inspection (6L)"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-5">
                    <Label>Type</Label>
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                      value={current.type || "incoming"}
                      onChange={(e) => updateField("type", e.target.value)}
                      disabled={saving}
                    >
                      <option value="incoming">Incoming QC</option>
                      <option value="in_process">In-Process</option>
                      <option value="final">Final</option>
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <Label>Version</Label>
                    <Input
                      className="mt-1"
                      value={current.version || ""}
                      onChange={(e) => updateField("version", e.target.value)}
                      placeholder="1.0"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-8">
                    <Label>Description</Label>
                    <Input
                      className="mt-1"
                      value={current.description || ""}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Short note about when/why to use this template"
                      disabled={saving}
                    />
                  </div>

                  <div className="md:col-span-12">
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={!!current.is_active}
                        onChange={(e) => updateField("is_active", e.target.checked)}
                        className="h-4 w-4 accent-[#dc2551]"
                        disabled={saving}
                      />
                      <label htmlFor="is_active" className="text-sm text-gray-700">
                        Active template (available for selection during inspections)
                      </label>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">Checkpoints</div>
                    <div className="text-xs text-gray-500">
                      Enable/disable checkpoints, mark critical, and define method/spec.
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={addCheckpoint} disabled={saving}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {(current.checkpoints || []).map((cp, idx) => (
                    <div key={cp.key || idx} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!cp.enabled}
                            onChange={(e) => updateCheckpoint(idx, { enabled: e.target.checked })}
                            className="mt-1 h-4 w-4 accent-[#dc2551]"
                            disabled={saving}
                          />
                          <div className="text-sm font-semibold text-gray-900">#{idx + 1}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Critical:</span>
                          <input
                            type="checkbox"
                            checked={!!cp.critical}
                            onChange={(e) => updateCheckpoint(idx, { critical: e.target.checked })}
                            className="h-4 w-4 accent-[#dc2551]"
                            disabled={saving || !cp.enabled}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-700 hover:bg-rose-50"
                            onClick={() => removeCheckpoint(idx)}
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <Label>Label</Label>
                          <Input
                            className="mt-1"
                            value={cp.label || ""}
                            onChange={(e) => updateCheckpoint(idx, { label: e.target.value })}
                            placeholder="e.g., Hole size / Drill"
                            disabled={saving || !cp.enabled}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <Label>Method</Label>
                          <Input
                            className="mt-1"
                            value={cp.method || ""}
                            onChange={(e) => updateCheckpoint(idx, { method: e.target.value })}
                            placeholder="e.g., Pin gauge"
                            disabled={saving || !cp.enabled}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <Label>Spec / Criteria</Label>
                          <Input
                            className="mt-1"
                            value={cp.spec || ""}
                            onChange={(e) => updateCheckpoint(idx, { spec: e.target.value })}
                            placeholder="e.g., ±0.05mm"
                            disabled={saving || !cp.enabled}
                          />
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Enabled: <span className="font-semibold text-gray-700">{boolLabel(!!cp.enabled)}</span> •{" "}
                        Critical: <span className="font-semibold text-gray-700">{boolLabel(!!cp.critical)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="sticky bottom-0 border-t bg-white/90 backdrop-blur p-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setDrawerOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button className="bg-[#dc2551] hover:bg-[#b02045]" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmationDialog
        open={confirmDelete.open}
        onOpenChange={(v) => setConfirmDelete((s) => ({ ...s, open: v }))}
        title="Delete template?"
        description={
          confirmDelete.row
            ? `This will permanently delete "${confirmDelete.row.name}". This cannot be undone.`
            : "This cannot be undone."
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteNow}
      />
    </div>
  );
}
