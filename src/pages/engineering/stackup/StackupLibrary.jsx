// src/pages/engineering/stackup/StackupLibrary.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import {
  ArrowUpDown,
  CheckCircle2,
  Copy,
  FileSearch2,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Eye,
} from "lucide-react";

/**
 * StackupLibrary.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Route:
 *   /engineering/stackup
 *
 * Features:
 *  - List stackup templates
 *  - Search + filters (Layers, Finish, Material, Impedance, Status)
 *  - Sort by Updated/Name/Layers
 *  - Create / View / Duplicate / Delete
 *
 * Replace MOCK service with real API in:
 *   /src/services/stackup.service.js
 */

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function safeNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

/** Mock dataset */
const MOCK = [
  {
    id: "st_1201",
    name: "FR4 4L 1.6mm TG170 — Impedance Ready",
    code: "STK-4L-170-16",
    layers: 4,
    materialFamily: "FR4",
    tg: "TG170",
    finish: "ENIG",
    soldermask: "Green",
    silkscreen: "White",
    impedance: true,
    targetThickness: 1.6,
    active: true,
    updatedAt: "2026-01-04T08:10:00.000Z",
  },
  {
    id: "st_1202",
    name: "FR4 2L 1.0mm — Economy HASL",
    code: "STK-2L-ECON-10",
    layers: 2,
    materialFamily: "FR4",
    tg: "TG150",
    finish: "Lead-Free HASL",
    soldermask: "Green",
    silkscreen: "White",
    impedance: false,
    targetThickness: 1.0,
    active: true,
    updatedAt: "2026-01-03T13:05:00.000Z",
  },
  {
    id: "st_1203",
    name: "Rogers 4L 0.8mm — RF Prototype",
    code: "STK-RG-4L-08",
    layers: 4,
    materialFamily: "Rogers",
    tg: "TG200",
    finish: "ENIG",
    soldermask: "Green",
    silkscreen: "White",
    impedance: true,
    targetThickness: 0.8,
    active: false,
    updatedAt: "2026-01-02T09:44:00.000Z",
  },
];

const stackupService = {
  async list() {
    await new Promise((r) => setTimeout(r, 250));
    return { data: [...MOCK] };
  },
  async remove(id) {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK.findIndex((x) => x.id === id);
    if (idx >= 0) MOCK.splice(idx, 1);
    return { ok: true };
  },
  async duplicate(id) {
    await new Promise((r) => setTimeout(r, 320));
    const src = MOCK.find((x) => x.id === id);
    if (!src) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
    const newId = `st_${Math.floor(Math.random() * 9000) + 1000}`;
    const copy = {
      ...src,
      id: newId,
      name: `${src.name} (Copy)`,
      code: `${src.code}-COPY`,
      updatedAt: new Date().toISOString(),
      active: false,
    };
    MOCK.unshift(copy);
    return { data: copy };
  },
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function Pill({ children, className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

export default function StackupLibrary() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // UI states
  const [q, setQ] = useState("");

  const [filterLayers, setFilterLayers] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("all");
  const [filterFinish, setFilterFinish] = useState("all");
  const [filterImpedance, setFilterImpedance] = useState("all"); // all | yes | no
  const [filterStatus, setFilterStatus] = useState("all"); // all | active | inactive

  const [sortBy, setSortBy] = useState("updated_desc"); // updated_desc | updated_asc | name_asc | layers_asc | layers_desc

  // dialogs
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [dupLoadingId, setDupLoadingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await stackupService.list();
      setRows(res.data || []);
    } catch {
      toast({ title: "Load failed", description: "Could not load stackup templates.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const materials = useMemo(() => {
    const set = new Set(rows.map((r) => r.materialFamily).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const finishes = useMemo(() => {
    const set = new Set(rows.map((r) => r.finish).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const out = rows.filter((r) => {
      const matchQ =
        !query ||
        String(r.name || "").toLowerCase().includes(query) ||
        String(r.code || "").toLowerCase().includes(query) ||
        String(r.materialFamily || "").toLowerCase().includes(query) ||
        String(r.finish || "").toLowerCase().includes(query);

      const matchLayers = filterLayers === "all" ? true : String(r.layers) === String(filterLayers);

      const matchMaterial = filterMaterial === "all" ? true : r.materialFamily === filterMaterial;

      const matchFinish = filterFinish === "all" ? true : r.finish === filterFinish;

      const matchImp =
        filterImpedance === "all" ? true : filterImpedance === "yes" ? !!r.impedance : !r.impedance;

      const matchStatus =
        filterStatus === "all" ? true : filterStatus === "active" ? !!r.active : !r.active;

      return matchQ && matchLayers && matchMaterial && matchFinish && matchImp && matchStatus;
    });

    const sorted = [...out];
    const byUpdated = (a, b) => safeNum(new Date(a.updatedAt).getTime(), 0) - safeNum(new Date(b.updatedAt).getTime(), 0);

    if (sortBy === "updated_desc") sorted.sort((a, b) => byUpdated(b, a));
    if (sortBy === "updated_asc") sorted.sort((a, b) => byUpdated(a, b));
    if (sortBy === "name_asc") sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sortBy === "layers_asc") sorted.sort((a, b) => safeNum(a.layers, 0) - safeNum(b.layers, 0));
    if (sortBy === "layers_desc") sorted.sort((a, b) => safeNum(b.layers, 0) - safeNum(a.layers, 0));

    return sorted;
  }, [rows, q, filterLayers, filterMaterial, filterFinish, filterImpedance, filterStatus, sortBy]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.active).length;
    const imp = rows.filter((r) => r.impedance).length;
    const hiTg = rows.filter((r) => String(r.tg || "").toUpperCase().includes("170") || String(r.tg || "").includes("180") || String(r.tg || "").includes("200")).length;
    return { total, active, imp, hiTg };
  }, [rows]);

  const openDelete = (row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try {
      await stackupService.remove(deleteTarget.id);
      setRows((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast({ title: "Deleted", description: "Stackup template deleted." });
    } catch {
      toast({ title: "Delete failed", description: "Could not delete template.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (row) => {
    setDupLoadingId(row.id);
    try {
      const res = await stackupService.duplicate(row.id);
      setRows((prev) => [res.data, ...prev]);
      toast({ title: "Duplicated", description: "Created a copy. Open it to review and activate." });
    } catch {
      toast({ title: "Duplicate failed", description: "Could not duplicate template.", variant: "destructive" });
    } finally {
      setDupLoadingId(null);
    }
  };

  const resetFilters = () => {
    setQ("");
    setFilterLayers("all");
    setFilterMaterial("all");
    setFilterFinish("all");
    setFilterImpedance("all");
    setFilterStatus("all");
    setSortBy("updated_desc");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stackup Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage approved PCB stackup templates used across RFQs, CAM, DFM, and production work orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Link to="/dashboard/engineering/stackup/create">
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
              <Plus className="h-4 w-4" />
              New Stackup
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Templates</CardTitle>
            <CardDescription>Total stackup presets</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{kpis.total}</div>
            <Pill className="bg-gray-50 text-gray-800">
              <Layers className="mr-1 h-3.5 w-3.5" />
              Library
            </Pill>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
            <CardDescription>Usable for RFQs</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{kpis.active}</div>
            <Pill className="bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Approved
            </Pill>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Impedance</CardTitle>
            <CardDescription>Controlled impedance intent</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{kpis.imp}</div>
            <Pill className="bg-sky-50 text-sky-800">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Coupons
            </Pill>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High Tg</CardTitle>
            <CardDescription>Thermal robustness</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{kpis.hiTg}</div>
            <Pill className="bg-amber-50 text-amber-900">
              <Layers className="mr-1 h-3.5 w-3.5" />
              TG170+
            </Pill>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch2 className="h-4 w-4 text-gray-700" />
            Search & Filters
          </CardTitle>
          <CardDescription>Quickly find the right stackup for a customer RFQ or internal work order.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <Label>Search</Label>
              <Input
                className="mt-2"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, code, material, finish…"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Layers</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={filterLayers}
                onChange={(e) => setFilterLayers(e.target.value)}
              >
                <option value="all">All</option>
                {[1, 2, 4, 6, 8, 10, 12].map((x) => (
                  <option key={x} value={String(x)}>
                    {x}L
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Material</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
              >
                {materials.map((m) => (
                  <option key={m} value={m}>
                    {m === "all" ? "All" : m}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <Label>Finish</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={filterFinish}
                onChange={(e) => setFilterFinish(e.target.value)}
              >
                {finishes.map((f) => (
                  <option key={f} value={f}>
                    {f === "all" ? "All" : f}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <Label>Impedance</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={filterImpedance}
                onChange={(e) => setFilterImpedance(e.target.value)}
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <Label>Status</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <Label>Sort</Label>
              <select
                className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated_desc">Updated (newest)</option>
                <option value="updated_asc">Updated (oldest)</option>
                <option value="name_asc">Name (A→Z)</option>
                <option value="layers_asc">Layers (low→high)</option>
                <option value="layers_desc">Layers (high→low)</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-end gap-2">
              <Button variant="outline" className="w-full" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-gray-700" />
            Templates
          </CardTitle>
          <CardDescription>
            Click a template to view details, edit, or duplicate for a new customer/RFQ.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading templates…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-700">
              No templates match your filters.
              <div className="mt-3">
                <Link to="/engineering/stackup/create">
                  <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
                    <Plus className="h-4 w-4" />
                    Create first template
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="py-2 pr-3">Template</th>
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Layers</th>
                    <th className="py-2 pr-3">Material</th>
                    <th className="py-2 pr-3">Finish</th>
                    <th className="py-2 pr-3">Thickness</th>
                    <th className="py-2 pr-3">Flags</th>
                    <th className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1">
                        Updated <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
                    </th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {r.active ? (
                              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            ) : (
                              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{r.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {r.active ? (
                                <Badge className="bg-emerald-600 text-white">Active</Badge>
                              ) : (
                                <Badge className="bg-gray-200 text-gray-800">Inactive</Badge>
                              )}
                              {r.impedance ? <Badge className="bg-sky-600 text-white">Impedance</Badge> : null}
                              {String(r.tg || "").toUpperCase().includes("170") ||
                              String(r.tg || "").includes("180") ||
                              String(r.tg || "").includes("200") ? (
                                <Badge className="bg-amber-500 text-white">High Tg</Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="flex items-center justify-between gap-2 rounded-md border bg-white px-2 py-1.5">
                          <span className="font-medium text-gray-900">{r.code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => navigator.clipboard?.writeText(r.code)}
                            title="Copy code"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <Badge className="bg-gray-100 text-gray-900">{r.layers}L</Badge>
                      </td>

                      <td className="py-3 pr-3">{r.materialFamily}</td>
                      <td className="py-3 pr-3">{r.finish}</td>

                      <td className="py-3 pr-3">
                        <Badge className="bg-gray-900 text-white">{r.targetThickness} mm</Badge>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {r.impedance ? (
                            <Pill className="bg-sky-50 text-sky-800">
                              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                              Z
                            </Pill>
                          ) : (
                            <Pill className="bg-gray-50 text-gray-700">Std</Pill>
                          )}
                          <Pill className="bg-gray-50 text-gray-700">{r.soldermask || "—"} SM</Pill>
                        </div>
                      </td>

                      <td className="py-3 pr-3 text-xs text-gray-600">{fmtDate(r.updatedAt)}</td>

                      <td className="py-3 pr-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate(`/dashboard/engineering/stackup/${r.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDuplicate(r)}
                            disabled={dupLoadingId === r.id}
                          >
                            {dupLoadingId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            Duplicate
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(r)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 text-xs text-gray-500">
                Tip: keep “Active” templates limited to what your plant can reliably build (capability-based quoting).
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-gray-900">{deleteTarget?.name}</span>. This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
