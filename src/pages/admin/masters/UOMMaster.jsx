// src/pages/admin/masters/UOMMaster.jsx
import { motion } from "framer-motion";
import {
    Download,
    Eye,
    FileDown,
    Filter,
    Pencil,
    Plus,
    RefreshCw,
    Ruler,
    Search,
    ShieldCheck,
    Trash2,
    X,
} from "lucide-react";
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

import api from "@/lib/axios";

/**
 * PCBxpress - UOM Master (Admin > Masters)
 * ---------------------------------------------------------
 * Suggested endpoints:
 *  GET    /admin/masters/uoms?search=&status=&page=&limit=
 *  GET    /admin/masters/uoms/:id
 *  POST   /admin/masters/uoms
 *  PUT    /admin/masters/uoms/:id
 *  DELETE /admin/masters/uoms/:id
 *  GET    /admin/masters/uoms/export?format=csv|xlsx&search=&status=
 *
 * Data model (recommended):
 *  {
 *    id, code, name, category, baseUomCode,
 *    conversionToBase, // number (optional)
 *    status: "active"|"inactive",
 *    notes,
 *    createdAt, updatedAt
 *  }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(s) {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
        <Ruler className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <Label className="text-sm">{label}</Label>
        {hint ? <span className="text-[11px] text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

const STATUS_OPTIONS = ["active", "inactive"];
const CATEGORY_OPTIONS = [
  "Count",
  "Length",
  "Area",
  "Weight",
  "Volume",
  "Time",
  "Packaging",
  "Other",
];

export default function UOMMaster() {
  const { toast } = useToast();

  // table state
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // dialogs
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [mode, setMode] = useState("create"); // create | edit

  // form
  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "Count",
    baseUomCode: "",
    conversionToBase: "",
    status: "active",
    notes: "",
  });

  const page = meta.page ?? 1;
  const limit = meta.limit ?? 10;

  const filtersCount = useMemo(() => {
    return [status].filter((v) => String(v || "").trim()).length;
  }, [status]);

  const load = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/masters/uoms", {
        params: {
          search: search || undefined,
          status: status || undefined,
          page: p,
          limit: l,
        },
      });

      setRows(Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : []);
      setMeta(
        res.data?.meta || {
          page: p,
          limit: l,
          total: res.data?.total ?? 0,
          totalPages: res.data?.totalPages ?? 1,
        }
      );
    } catch (e) {
      toast({
        title: "Failed to load UOMs",
        description: "Please check your API or try again.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    load(1, limit);
  };

  const clearFilters = () => {
    setStatus("");
    toast({ title: "Filters cleared", description: "UOM filters were reset." });
  };

  const openCreate = () => {
    setMode("create");
    setActiveRow(null);
    setForm({
      code: "",
      name: "",
      category: "Count",
      baseUomCode: "",
      conversionToBase: "",
      status: "active",
      notes: "",
    });
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setActiveRow(row);
    setForm({
      code: row?.code ?? "",
      name: row?.name ?? "",
      category: row?.category ?? "Count",
      baseUomCode: row?.baseUomCode ?? "",
      conversionToBase: row?.conversionToBase ?? "",
      status: row?.status ?? "active",
      notes: row?.notes ?? "",
    });
    setOpenForm(true);
  };

  const openDetails = async (row) => {
    try {
      const id = row?.id ?? row?._id;
      if (!id) {
        setActiveRow(row);
        setOpenView(true);
        return;
      }
      const res = await api.get(`/admin/masters/uoms/${id}`);
      setActiveRow(res.data ?? row);
      setOpenView(true);
    } catch {
      setActiveRow(row);
      setOpenView(true);
    }
  };

  const requestDelete = (row) => {
    setActiveRow(row);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    try {
      const id = activeRow?.id ?? activeRow?._id;
      if (!id) throw new Error("Missing id");

      await api.delete(`/admin/masters/uoms/${id}`);
      toast({ title: "Deleted", description: "UOM removed from master list." });
      setDeleteOpen(false);
      setActiveRow(null);
      load(page, limit);
    } catch (e) {
      toast({ title: "Delete failed", description: "Could not delete this UOM.", variant: "destructive" });
    }
  };

  const validate = () => {
    if (!form.code.trim()) return "UOM code is required (e.g., PCS, M, SQM).";
    if (!form.name.trim()) return "UOM name is required (e.g., Pieces, Meter).";
    if (!form.category.trim()) return "Category is required.";
    if (!form.status.trim()) return "Status is required.";

    // If conversion is filled, baseUomCode should be present
    if (String(form.conversionToBase).trim() !== "" && !form.baseUomCode.trim()) {
      return "Base UOM code is required when conversion is provided.";
    }

    // conversion must be positive number if provided
    if (String(form.conversionToBase).trim() !== "") {
      const n = Number(form.conversionToBase);
      if (!Number.isFinite(n) || n <= 0) return "Conversion to base must be a positive number.";
    }

    return "";
  };

  const save = async () => {
    const msg = validate();
    if (msg) {
      toast({ title: "Validation", description: msg, variant: "destructive" });
      return;
    }

    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        conversionToBase:
          String(form.conversionToBase).trim() === "" ? null : Number(form.conversionToBase),
        baseUomCode: form.baseUomCode.trim().toUpperCase(),
      };

      if (mode === "create") {
        await api.post("/admin/masters/uoms", payload);
        toast({ title: "Created", description: "UOM added to master." });
      } else {
        const id = activeRow?.id ?? activeRow?._id;
        await api.put(`/admin/masters/uoms/${id}`, payload);
        toast({ title: "Updated", description: "UOM updated successfully." });
      }

      setOpenForm(false);
      setActiveRow(null);
      load(page, limit);
    } catch (e) {
      const status = e?.response?.status;
      let desc = "Failed to save UOM.";
      if (status === 409) desc = "UOM code already exists. Please use a unique code.";
      toast({ title: "Save failed", description: desc, variant: "destructive" });
    }
  };

  const exportData = async (fmt) => {
    setExporting(true);
    try {
      const res = await api.get("/admin/masters/uoms/export", {
        params: { format: fmt, search: search || undefined, status: status || undefined },
        responseType: "blob",
      });
      const name = `pcbxpress_uom_master_${new Date().toISOString().slice(0, 10)}.${fmt}`;
      downloadBlob(res.data, name);
      toast({ title: "Export ready", description: `Downloaded ${name}` });
    } catch (e) {
      toast({ title: "Export failed", description: "Could not export UOMs.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin • Masters</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">UOM Master</h1>
          <p className="mt-1 text-sm text-gray-600">
            Units of Measurement used across items, BOM, purchasing, inventory and production (PCS, M, SQM, KG, L).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => load(page, limit)} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => exportData("csv")}
            disabled={exporting || loading}
            title="Export CSV"
          >
            <FileDown className="h-4 w-4" />
            CSV
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => exportData("xlsx")}
            disabled={exporting || loading}
            title="Export XLSX"
          >
            <Download className="h-4 w-4" />
            XLSX
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New UOM
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-700" />
              Search & Filters
            </CardTitle>
            <CardDescription>Find UOMs by code/name and filter by status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Label>Search</Label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    placeholder="Search code / name / category"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Input
                  className="mt-2"
                  placeholder="active / inactive"
                  list="uom-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <datalist id="uom-status">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="lg:col-span-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="inline-flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    {meta.total ?? rows.length} items
                  </Badge>
                  {filtersCount > 0 ? (
                    <Badge variant="secondary" className="inline-flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      {filtersCount} filter{filtersCount === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500">
                    Search
                  </Button>
                  <Button type="button" variant="outline" onClick={clearFilters} disabled={filtersCount === 0}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-4 w-4 text-gray-700" />
            UOMs
          </CardTitle>
          <CardDescription>Keep codes consistent to avoid BOM and purchasing mistakes.</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">Loading UOMs…</div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No UOMs found"
              description="Try changing filters or create your first unit of measurement."
              action={
                <Button className="bg-cyan-600 hover:bg-cyan-500 gap-2" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New UOM
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Base UOM</th>
                    <th className="px-4 py-3 text-left">Conversion</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => {
                    const id = r?.id ?? r?._id ?? r?.code;
                    return (
                      <tr key={id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-mono text-[12px] text-gray-800">{r.code || "-"}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.name || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{r.category || "-"}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-gray-800">{r.baseUomCode || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.conversionToBase ? (
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck className="h-4 w-4 text-gray-400" />
                              {r.conversionToBase}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={cx(
                              "capitalize",
                              r.status === "active"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            {r.status || "active"}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openDetails(r)}>
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-red-600 hover:text-red-600"
                              onClick={() => requestDelete(r)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex flex-col gap-2 border-t bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  Page <span className="font-semibold text-gray-700">{meta.page}</span> of{" "}
                  <span className="font-semibold text-gray-700">{meta.totalPages}</span> •{" "}
                  <span className="font-semibold text-gray-700">{meta.total}</span> total
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1 || loading}
                    onClick={() => load(Math.max(1, meta.page - 1), limit)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.totalPages || loading}
                    onClick={() => load(Math.min(meta.totalPages, meta.page + 1), limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <AlertDialog open={openView} onOpenChange={setOpenView}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-gray-700" />
              UOM Details
            </AlertDialogTitle>
            <AlertDialogDescription>Verify conversion rules and usage standard.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Code</p>
                <p className="mt-1 font-mono text-[12px] text-gray-900">{activeRow?.code || "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Name</p>
                <p className="mt-1 font-medium text-gray-900">{activeRow?.name || "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Category</p>
                <p className="mt-1 text-gray-900">{activeRow?.category || "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className="mt-1 text-gray-900 capitalize">{activeRow?.status || "active"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Base UOM</p>
                <p className="mt-1 font-mono text-[12px] text-gray-900">{activeRow?.baseUomCode || "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Conversion to Base</p>
                <p className="mt-1 text-gray-900">{activeRow?.conversionToBase ?? "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3 sm:col-span-2">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{activeRow?.notes ?? "-"}</p>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">Created / Updated</p>
              <p className="mt-1 text-gray-900">
                {fmtDate(activeRow?.createdAt)} • {fmtDate(activeRow?.updatedAt)}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpenView(false);
                openEdit(activeRow);
              }}
            >
              Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <AlertDialog open={openForm} onOpenChange={setOpenForm}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-gray-700" />
              {mode === "create" ? "Create UOM" : "Edit UOM"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Use short codes (PCS, M, SQM, KG) and define conversion only when needed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="UOM Code" hint="Unique">
              <Input
                value={form.code}
                onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                placeholder="e.g., PCS"
                className="font-mono text-[12px]"
              />
            </Field>

            <Field label="UOM Name">
              <Input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g., Pieces"
              />
            </Field>

            <Field label="Category">
              <Input
                list="uom-category"
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              />
              <datalist id="uom-category">
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            <Field label="Status">
              <Input
                list="uom-status2"
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              />
              <datalist id="uom-status2">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>

            <Field label="Base UOM Code" hint="Only if conversion needed">
              <Input
                value={form.baseUomCode}
                onChange={(e) => setForm((s) => ({ ...s, baseUomCode: e.target.value.toUpperCase() }))}
                placeholder="e.g., M (for CM), SQM (for SQFT)"
                className="font-mono text-[12px]"
              />
            </Field>

            <Field label="Conversion to Base" hint="Positive number">
              <Input
                type="number"
                step="0.0001"
                value={form.conversionToBase}
                onChange={(e) => setForm((s) => ({ ...s, conversionToBase: e.target.value }))}
                placeholder="e.g., 0.01 (CM -> M)"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Notes">
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                  placeholder="Usage example: PCB area in SQM, copper foil in KG, counts in PCS..."
                />
              </Field>
            </div>

            <div className="sm:col-span-2 rounded-2xl border bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" />
                <div>
                  <p className="font-semibold">Rule</p>
                  <p className="mt-1">
                    If you use conversion, keep one base UOM per category (example: Length base = M, Area base = SQM)
                    to avoid incorrect purchasing and BOM calculations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={save}>{mode === "create" ? "Create" : "Save changes"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete UOM?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{activeRow?.code}</span> from UOM Master. Ensure it is not
              referenced by items/BOM/purchase orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
