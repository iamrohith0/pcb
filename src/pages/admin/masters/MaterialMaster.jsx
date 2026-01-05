// src/pages/admin/masters/MaterialMaster.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Layers,
  Package,
  Factory,
  ShieldCheck,
  Pencil,
  Trash2,
  Eye,
  FileDown,
  X,
} from "lucide-react";

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

import api from "@/lib/axios";

/**
 * PCBxpress - Material Master (Admin > Masters)
 * ---------------------------------------------------------
 * Suggested endpoints:
 *  GET    /admin/masters/materials?search=&type=&status=&page=&limit=
 *  GET    /admin/masters/materials/:id
 *  POST   /admin/masters/materials
 *  PUT    /admin/masters/materials/:id
 *  DELETE /admin/masters/materials/:id
 *  GET    /admin/masters/materials/export?format=csv|xlsx&search=&type=&status=
 *
 * Data model (recommended):
 *  {
 *    id, code, name, type, uom,
 *    spec: { thicknessMm, copperOz, tg, materialClass, finish, color, notes },
 *    vendor: { preferredVendor, vendorPartNo, leadTimeDays },
 *    inventory: { minStock, reorderPoint },
 *    pricing: { currency, unitPrice },
 *    compliance: { rohs, reach, ul },
 *    status: "active"|"inactive",
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
        <Layers className="h-6 w-6" />
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

const MATERIAL_TYPES = [
  "Copper Clad Laminate (CCL)",
  "Prepreg",
  "Copper Foil",
  "Solder Mask",
  "Silkscreen Ink",
  "Surface Finish Chemical",
  "Drill Bit",
  "Tooling / Consumable",
  "Packaging",
  "Other",
];

const STATUS_OPTIONS = ["active", "inactive"];

export default function MaterialMaster() {
  const { toast } = useToast();

  // table state
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  // dialog state
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [mode, setMode] = useState("create"); // create | edit

  // form model
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: MATERIAL_TYPES[0],
    uom: "PCS",
    status: "active",
    spec: {
      thicknessMm: "",
      copperOz: "",
      tg: "",
      materialClass: "",
      finish: "",
      color: "",
      notes: "",
    },
    vendor: {
      preferredVendor: "",
      vendorPartNo: "",
      leadTimeDays: "",
    },
    inventory: {
      minStock: "",
      reorderPoint: "",
    },
    pricing: {
      currency: "INR",
      unitPrice: "",
    },
    compliance: {
      rohs: true,
      reach: false,
      ul: false,
    },
  });

  const page = meta.page ?? 1;
  const limit = meta.limit ?? 10;

  const filtersCount = useMemo(() => {
    return [type, status].filter((v) => String(v || "").trim()).length;
  }, [type, status]);

  const load = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/masters/materials", {
        params: {
          search: search || undefined,
          type: type || undefined,
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
        title: "Failed to load materials",
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
  }, [type, status]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    load(1, limit);
  };

  const clearFilters = () => {
    setType("");
    setStatus("");
    toast({ title: "Filters cleared", description: "Material filters were reset." });
  };

  const openCreate = () => {
    setMode("create");
    setActiveRow(null);
    setForm({
      code: "",
      name: "",
      type: MATERIAL_TYPES[0],
      uom: "PCS",
      status: "active",
      spec: {
        thicknessMm: "",
        copperOz: "",
        tg: "",
        materialClass: "",
        finish: "",
        color: "",
        notes: "",
      },
      vendor: {
        preferredVendor: "",
        vendorPartNo: "",
        leadTimeDays: "",
      },
      inventory: {
        minStock: "",
        reorderPoint: "",
      },
      pricing: {
        currency: "INR",
        unitPrice: "",
      },
      compliance: {
        rohs: true,
        reach: false,
        ul: false,
      },
    });
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setActiveRow(row);
    setForm({
      code: row?.code ?? "",
      name: row?.name ?? "",
      type: row?.type ?? MATERIAL_TYPES[0],
      uom: row?.uom ?? "PCS",
      status: row?.status ?? "active",
      spec: {
        thicknessMm: row?.spec?.thicknessMm ?? "",
        copperOz: row?.spec?.copperOz ?? "",
        tg: row?.spec?.tg ?? "",
        materialClass: row?.spec?.materialClass ?? "",
        finish: row?.spec?.finish ?? "",
        color: row?.spec?.color ?? "",
        notes: row?.spec?.notes ?? "",
      },
      vendor: {
        preferredVendor: row?.vendor?.preferredVendor ?? "",
        vendorPartNo: row?.vendor?.vendorPartNo ?? "",
        leadTimeDays: row?.vendor?.leadTimeDays ?? "",
      },
      inventory: {
        minStock: row?.inventory?.minStock ?? "",
        reorderPoint: row?.inventory?.reorderPoint ?? "",
      },
      pricing: {
        currency: row?.pricing?.currency ?? "INR",
        unitPrice: row?.pricing?.unitPrice ?? "",
      },
      compliance: {
        rohs: !!row?.compliance?.rohs,
        reach: !!row?.compliance?.reach,
        ul: !!row?.compliance?.ul,
      },
    });
    setOpenForm(true);
  };

  const openDetails = async (row) => {
    try {
      // if list is already full data, this is fine.
      // If list is minimal, fetch full details.
      const id = row?.id ?? row?._id;
      if (!id) {
        setActiveRow(row);
        setOpenView(true);
        return;
      }
      const res = await api.get(`/admin/masters/materials/${id}`);
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

      await api.delete(`/admin/masters/materials/${id}`);
      toast({ title: "Deleted", description: "Material removed from master list." });
      setDeleteOpen(false);
      setActiveRow(null);
      load(page, limit);
    } catch (e) {
      toast({ title: "Delete failed", description: "Could not delete this material.", variant: "destructive" });
    }
  };

  const validate = () => {
    if (!form.code.trim()) return "Material code is required.";
    if (!form.name.trim()) return "Material name is required.";
    if (!form.type.trim()) return "Material type is required.";
    if (!form.uom.trim()) return "UOM is required.";
    if (!form.status.trim()) return "Status is required.";
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
        // normalize numbers (backend may do this too)
        spec: {
          ...form.spec,
          thicknessMm: form.spec.thicknessMm === "" ? null : Number(form.spec.thicknessMm),
          copperOz: form.spec.copperOz === "" ? null : Number(form.spec.copperOz),
          tg: form.spec.tg === "" ? null : Number(form.spec.tg),
        },
        vendor: {
          ...form.vendor,
          leadTimeDays: form.vendor.leadTimeDays === "" ? null : Number(form.vendor.leadTimeDays),
        },
        inventory: {
          ...form.inventory,
          minStock: form.inventory.minStock === "" ? null : Number(form.inventory.minStock),
          reorderPoint: form.inventory.reorderPoint === "" ? null : Number(form.inventory.reorderPoint),
        },
        pricing: {
          ...form.pricing,
          unitPrice: form.pricing.unitPrice === "" ? null : Number(form.pricing.unitPrice),
        },
      };

      if (mode === "create") {
        await api.post("/admin/masters/materials", payload);
        toast({ title: "Created", description: "Material added to master." });
      } else {
        const id = activeRow?.id ?? activeRow?._id;
        await api.put(`/admin/masters/materials/${id}`, payload);
        toast({ title: "Updated", description: "Material updated successfully." });
      }

      setOpenForm(false);
      setActiveRow(null);
      load(page, limit);
    } catch (e) {
      const status = e?.response?.status;
      let desc = "Failed to save material.";
      if (status === 409) desc = "Code already exists. Please use a unique material code.";
      toast({ title: "Save failed", description: desc, variant: "destructive" });
    }
  };

  const exportData = async (fmt) => {
    setExporting(true);
    try {
      const res = await api.get("/admin/masters/materials/export", {
        params: { format: fmt, search: search || undefined, type: type || undefined, status: status || undefined },
        responseType: "blob",
      });
      const name = `pcbxpress_material_master_${new Date().toISOString().slice(0, 10)}.${fmt}`;
      downloadBlob(res.data, name);
      toast({ title: "Export ready", description: `Downloaded ${name}` });
    } catch (e) {
      toast({ title: "Export failed", description: "Could not export materials.", variant: "destructive" });
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
          <h1 className="mt-1 text-xl font-bold text-gray-900">Material Master</h1>
          <p className="mt-1 text-sm text-gray-600">
            Central list of PCB manufacturing materials (CCL, prepreg, copper foil, chemicals, consumables).
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

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Material
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
            <CardDescription>Find materials by code/name and narrow down by type/status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Label>Search</Label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    placeholder="Search code / name / vendor part no"
                  />
                </div>
              </div>

              <div>
                <Label>Type</Label>
                <Input
                  className="mt-2"
                  placeholder="Choose or type (e.g., Prepreg)"
                  list="mm-types"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                />
                <datalist id="mm-types">
                  {MATERIAL_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div>
                <Label>Status</Label>
                <Input
                  className="mt-2"
                  placeholder="active / inactive"
                  list="mm-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <datalist id="mm-status">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="lg:col-span-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="inline-flex items-center gap-1">
                    <Package className="h-4 w-4" />
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
                  <Button type="submit" className="bg-[#dc2551] hover:bg-[#b02045]">
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
            <Factory className="h-4 w-4 text-gray-700" />
            Materials
          </CardTitle>
          <CardDescription>Used across RFQ, BOM, purchasing, inventory, and production.</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">Loading materials…</div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No materials found"
              description="Try changing filters or create your first PCB material in the master list."
              action={
                <Button className="bg-[#dc2551] hover:bg-[#b02045] gap-2" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New Material
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
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">UOM</th>
                    <th className="px-4 py-3 text-left">Compliance</th>
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
                        <td className="px-4 py-3 text-gray-700">{r.type || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{r.uom || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {r?.compliance?.rohs ? (
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                RoHS
                              </Badge>
                            ) : (
                              <Badge variant="secondary">RoHS: No</Badge>
                            )}
                            {r?.compliance?.ul ? <Badge variant="secondary">UL</Badge> : null}
                          </div>
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openDetails(r)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEdit(r)}
                            >
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

              {/* Pagination (simple) */}
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
              <Layers className="h-5 w-5 text-gray-700" />
              Material Details
            </AlertDialogTitle>
            <AlertDialogDescription>Reference specs for PCB manufacturing usage.</AlertDialogDescription>
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
                <p className="text-xs text-gray-500">Type</p>
                <p className="mt-1 text-gray-900">{activeRow?.type || "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">UOM</p>
                <p className="mt-1 text-gray-900">{activeRow?.uom || "-"}</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Specs</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Thickness (mm)</p>
                  <p className="mt-1 text-gray-900">{activeRow?.spec?.thicknessMm ?? "-"}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Copper (oz)</p>
                  <p className="mt-1 text-gray-900">{activeRow?.spec?.copperOz ?? "-"}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Tg</p>
                  <p className="mt-1 text-gray-900">{activeRow?.spec?.tg ?? "-"}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Class / Grade</p>
                  <p className="mt-1 text-gray-900">{activeRow?.spec?.materialClass ?? "-"}</p>
                </div>
                <div className="rounded-xl border bg-white p-3 sm:col-span-2">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{activeRow?.spec?.notes ?? "-"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Preferred Vendor</p>
                <p className="mt-1 text-gray-900">{activeRow?.vendor?.preferredVendor ?? "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Vendor Part No</p>
                <p className="mt-1 font-mono text-[12px] text-gray-900">{activeRow?.vendor?.vendorPartNo ?? "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Lead Time (days)</p>
                <p className="mt-1 text-gray-900">{activeRow?.vendor?.leadTimeDays ?? "-"}</p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Unit Price</p>
                <p className="mt-1 text-gray-900">
                  {activeRow?.pricing?.currency ?? "INR"} {activeRow?.pricing?.unitPrice ?? "-"}
                </p>
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
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-gray-700" />
              {mode === "create" ? "Create Material" : "Edit Material"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Keep master specs consistent for RFQ, BOM and production traceability.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Field label="Material Code" hint="Unique">
                <Input
                  value={form.code}
                  onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CCL-FR4-1.6-1OZ"
                  className="font-mono text-[12px]"
                />
              </Field>

              <Field label="Material Name">
                <Input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g., FR4 CCL 1.6mm 1oz"
                />
              </Field>

              <Field label="Type">
                <Input
                  list="mm-types2"
                  value={form.type}
                  onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                />
                <datalist id="mm-types2">
                  {MATERIAL_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>

              <Field label="UOM">
                <Input value={form.uom} onChange={(e) => setForm((s) => ({ ...s, uom: e.target.value }))} />
              </Field>

              <Field label="Status">
                <Input
                  list="mm-status2"
                  value={form.status}
                  onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                />
                <datalist id="mm-status2">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>

              <Field label="Currency">
                <Input
                  value={form.pricing.currency}
                  onChange={(e) => setForm((s) => ({ ...s, pricing: { ...s.pricing, currency: e.target.value } }))}
                />
              </Field>

              {/* Specs */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Specs (optional)
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Field label="Thickness (mm)">
                      <Input
                        type="number"
                        step="0.01"
                        value={form.spec.thicknessMm}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, spec: { ...s.spec, thicknessMm: e.target.value } }))
                        }
                      />
                    </Field>

                    <Field label="Copper (oz)">
                      <Input
                        type="number"
                        step="0.5"
                        value={form.spec.copperOz}
                        onChange={(e) => setForm((s) => ({ ...s, spec: { ...s.spec, copperOz: e.target.value } }))}
                      />
                    </Field>

                    <Field label="Tg">
                      <Input
                        type="number"
                        step="1"
                        value={form.spec.tg}
                        onChange={(e) => setForm((s) => ({ ...s, spec: { ...s.spec, tg: e.target.value } }))}
                      />
                    </Field>

                    <Field label="Class / Grade">
                      <Input
                        value={form.spec.materialClass}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, spec: { ...s.spec, materialClass: e.target.value } }))
                        }
                        placeholder="e.g., FR4, High Tg"
                      />
                    </Field>

                    <Field label="Finish">
                      <Input
                        value={form.spec.finish}
                        onChange={(e) => setForm((s) => ({ ...s, spec: { ...s.spec, finish: e.target.value } }))}
                        placeholder="e.g., ENIG, HASL"
                      />
                    </Field>

                    <Field label="Color">
                      <Input
                        value={form.spec.color}
                        onChange={(e) => setForm((s) => ({ ...s, spec: { ...s.spec, color: e.target.value } }))}
                        placeholder="e.g., Green"
                      />
                    </Field>

                    <div className="lg:col-span-3">
                      <Field label="Notes">
                        <Input
                          value={form.spec.notes}
                          onChange={(e) => setForm((s) => ({ ...s, spec: { ...s.spec, notes: e.target.value } }))}
                          placeholder="Any additional spec notes..."
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    Vendor & Lead Time (optional)
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Field label="Preferred Vendor">
                      <Input
                        value={form.vendor.preferredVendor}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, vendor: { ...s.vendor, preferredVendor: e.target.value } }))
                        }
                      />
                    </Field>

                    <Field label="Vendor Part No">
                      <Input
                        value={form.vendor.vendorPartNo}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, vendor: { ...s.vendor, vendorPartNo: e.target.value } }))
                        }
                      />
                    </Field>

                    <Field label="Lead Time (days)">
                      <Input
                        type="number"
                        step="1"
                        value={form.vendor.leadTimeDays}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, vendor: { ...s.vendor, leadTimeDays: e.target.value } }))
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Inventory & Pricing */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Inventory & Pricing (optional)
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Field label="Min Stock">
                      <Input
                        type="number"
                        step="1"
                        value={form.inventory.minStock}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, inventory: { ...s.inventory, minStock: e.target.value } }))
                        }
                      />
                    </Field>

                    <Field label="Reorder Point">
                      <Input
                        type="number"
                        step="1"
                        value={form.inventory.reorderPoint}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, inventory: { ...s.inventory, reorderPoint: e.target.value } }))
                        }
                      />
                    </Field>

                    <Field label="Unit Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={form.pricing.unitPrice}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, pricing: { ...s.pricing, unitPrice: e.target.value } }))
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Compliance */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Compliance (optional)
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!form.compliance.rohs}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, compliance: { ...s.compliance, rohs: e.target.checked } }))
                        }
                      />
                      RoHS
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!form.compliance.reach}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, compliance: { ...s.compliance, reach: e.target.checked } }))
                        }
                      />
                      REACH
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!form.compliance.ul}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, compliance: { ...s.compliance, ul: e.target.checked } }))
                        }
                      />
                      UL
                    </label>
                  </div>
                </div>
              </div>

              {/* Save area note */}
              <div className="lg:col-span-3 rounded-2xl border bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <FileDown className="mt-0.5 h-5 w-5 flex-none" />
                  <div>
                    <p className="font-semibold">Tip</p>
                    <p className="mt-1">
                      For traceability, keep material code stable and use revisions/versions in production documents
                      (BOM/stackup) instead of renaming material codes.
                    </p>
                  </div>
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
              Delete material?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{activeRow?.name}</span> from Material Master.
              Existing references in RFQs/BOMs should be handled by your backend rules.
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
