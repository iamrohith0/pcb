// src/pages/production/routing/RoutingList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Filter,
  RefreshCw,
  Layers,
  Factory,
  ClipboardList,
  ArrowUpDown,
  Trash2,
  Eye,
  Pencil,
  FileDown,
  Copy,
  Loader2,
  AlertTriangle,
} from "lucide-react";

/**
 * PCB Manufacturing ERP — RoutingList
 * -----------------------------------
 * Lists routing masters used for planning and work order creation.
 * - Search + quick filters (category, plant, layers)
 * - Sort
 * - Actions: View, Edit, Clone, Export JSON, Delete
 *
 * Replace MOCK APIs with real routingService later:
 * - routingService.list({ q, category, plant, layers, sortBy, sortDir })
 * - routingService.delete(id)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeLower(v) {
  return String(v || "").toLowerCase();
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------------
// MOCK: Replace with API later
// ------------------------------
const MOCK = [
  {
    id: "rt-1",
    code: "RT-SL2-A",
    name: "2L Standard FR4 (HASL)",
    category: "single",
    layerCount: 2,
    plant: "Plant A",
    revision: "A",
    active: true,
    qcGates: ["AOI", "E-Test"],
    updatedAt: "2026-01-05T12:10:00Z",
  },
  {
    id: "rt-2",
    code: "RT-ML4-A",
    name: "4L Standard FR4 (ENIG)",
    category: "multilayer",
    layerCount: 4,
    plant: "Plant A",
    revision: "A",
    active: true,
    qcGates: ["AOI", "E-Test"],
    updatedAt: "2026-01-05T12:15:00Z",
  },
  {
    id: "rt-3",
    code: "RT-ML6-B",
    name: "6L Impedance Controlled (ENIG)",
    category: "multilayer",
    layerCount: 6,
    plant: "Plant B",
    revision: "B",
    active: true,
    qcGates: ["AOI", "E-Test", "Final QC"],
    updatedAt: "2026-01-04T09:10:00Z",
  },
  {
    id: "rt-4",
    code: "RT-HD1-A",
    name: "HDI 8L (Via-in-pad, ENEPIG)",
    category: "hdi",
    layerCount: 8,
    plant: "Plant A",
    revision: "A",
    active: false,
    qcGates: ["AOI", "E-Test", "X-Ray"],
    updatedAt: "2026-01-02T19:40:00Z",
  },
];

async function mockListRoutings() {
  await new Promise((r) => setTimeout(r, 550));
  return MOCK;
}

async function mockDeleteRouting() {
  await new Promise((r) => setTimeout(r, 600));
  return true;
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

const CATEGORY_BADGE = {
  single: { label: "Single / 2L", className: "bg-gray-900 text-white hover:bg-gray-900" },
  multilayer: { label: "Multilayer", className: "bg-[#dc2551] text-white hover:bg-[#dc2551]" },
  hdi: { label: "HDI", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
  flex: { label: "Flex", className: "bg-blue-600 text-white hover:bg-blue-600" },
};

export default function RoutingList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [plant, setPlant] = useState("all");
  const [layers, setLayers] = useState("all");

  // sort
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  // delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const plants = useMemo(() => {
    const uniq = Array.from(new Set(rows.map((r) => r.plant).filter(Boolean)));
    return ["all", ...uniq];
  }, [rows]);

  const layerOptions = useMemo(() => {
    const uniq = Array.from(new Set(rows.map((r) => r.layerCount).filter((n) => Number.isFinite(Number(n)))))
      .map(Number)
      .sort((a, b) => a - b);
    return ["all", ...uniq.map(String)];
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      // TODO: replace with routingService.list()
      const data = await mockListRoutings();
      setRows(data || []);
    } catch (e) {
      toast({ title: "Failed to load", description: "Could not load routings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = safeLower(q);
    return rows.filter((r) => {
      const matchQ =
        !qq ||
        safeLower(r.code).includes(qq) ||
        safeLower(r.name).includes(qq) ||
        safeLower(r.plant).includes(qq) ||
        safeLower(r.revision).includes(qq);

      const matchCat = category === "all" ? true : r.category === category;
      const matchPlant = plant === "all" ? true : r.plant === plant;
      const matchLayers = layers === "all" ? true : String(r.layerCount) === String(layers);

      return matchQ && matchCat && matchPlant && matchLayers;
    });
  }, [rows, q, category, plant, layers]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const arr = filtered.slice();

    arr.sort((a, b) => {
      const va = a?.[sortBy];
      const vb = b?.[sortBy];

      if (sortBy === "updatedAt") {
        const da = va ? new Date(va).getTime() : 0;
        const db = vb ? new Date(vb).getTime() : 0;
        return (da - db) * dir;
      }

      // numeric
      if (sortBy === "layerCount") {
        return (Number(va) - Number(vb)) * dir;
      }

      // string
      return safeLower(va).localeCompare(safeLower(vb)) * dir;
    });

    return arr;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const openDelete = (row) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;
    setDeleting(true);
    try {
      // TODO: routingService.delete(selectedRow.id)
      await mockDeleteRouting(selectedRow.id);
      setRows((prev) => prev.filter((x) => x.id !== selectedRow.id));
      toast({ title: "Deleted", description: `Routing "${selectedRow.code}" removed.` });
      setDeleteOpen(false);
      setSelectedRow(null);
    } catch (e) {
      toast({ title: "Delete failed", description: "Could not delete routing.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const exportRow = (row) => {
    downloadJson(`routing_${row.code || row.id}.json`, row);
    toast({ title: "Exported JSON", description: "Routing exported as JSON." });
  };

  const cloneRow = (row) => {
    navigate("/production/routing/create", { state: { cloneFrom: row } });
    toast({ title: "Cloning started", description: "Routing sent to Create page (as draft)." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-800" />
            <h1 className="text-xl font-bold text-gray-900">Routing Master</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Define PCB process flows (operations, QC gates, standard times) for planning, costing, and work orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/production/routing/create">
              <Plus className="h-4 w-4" />
              New Routing
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-800">Search & Filters</CardTitle>
          <CardDescription className="text-xs">Find routing by code, name, plant, layers, or category.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <Label className="text-xs text-gray-600">Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by code, name, plant…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs text-gray-600">Category</Label>
            <div className="mt-1">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All</option>
                <option value="single">Single / 2L</option>
                <option value="multilayer">Multilayer</option>
                <option value="hdi">HDI</option>
                <option value="flex">Flex</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs text-gray-600">Plant</Label>
            <div className="mt-1">
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {plants.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? "All Plants" : p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs text-gray-600">Layers</Label>
            <div className="mt-1">
              <select
                value={layers}
                onChange={(e) => setLayers(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {layerOptions.map((l) => (
                  <option key={l} value={l}>
                    {l === "all" ? "All" : `${l} Layers`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Filter className="h-4 w-4" />
              Showing <span className="font-semibold text-gray-900">{sorted.length}</span> of{" "}
              <span className="font-semibold text-gray-900">{rows.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 gap-2"
                onClick={() => {
                  setQ("");
                  setCategory("all");
                  setPlant("all");
                  setLayers("all");
                  toast({ title: "Filters cleared", description: "Showing all routings." });
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-800">Routings</CardTitle>
          <CardDescription className="text-xs">Click a routing to view details.</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading routings…
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-50">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No routings found</h3>
              <p className="mt-1 text-sm text-gray-600">Try changing filters or create a new routing.</p>
              <div className="mt-4 flex justify-center">
                <Button className="bg-[#dc2551] hover:bg-[#b02045]" asChild>
                  <Link to="/production/routing/create">
                    <Plus className="mr-2 h-4 w-4" />
                    New Routing
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        className="inline-flex items-center gap-2 hover:text-gray-900"
                        onClick={() => toggleSort("code")}
                        type="button"
                      >
                        Code <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        className="inline-flex items-center gap-2 hover:text-gray-900"
                        onClick={() => toggleSort("name")}
                        type="button"
                      >
                        Name <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        className="inline-flex items-center gap-2 hover:text-gray-900"
                        onClick={() => toggleSort("category")}
                        type="button"
                      >
                        Category <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        className="inline-flex items-center gap-2 hover:text-gray-900"
                        onClick={() => toggleSort("layerCount")}
                        type="button"
                      >
                        Layers <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="inline-flex items-center gap-2">
                        <Factory className="h-4 w-4" /> Plant
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">QC Gates</th>
                    <th className="px-4 py-3 text-left">
                      <button
                        className="inline-flex items-center gap-2 hover:text-gray-900"
                        onClick={() => toggleSort("updatedAt")}
                        type="button"
                      >
                        Updated <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {sorted.map((r) => {
                    const cat = CATEGORY_BADGE[r.category] || {
                      label: String(r.category || "Unknown"),
                      className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
                    };

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-900 text-white hover:bg-gray-900">{r.code}</Badge>
                            {!r.active ? (
                              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inactive</Badge>
                            ) : (
                              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Active</Badge>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">Rev {r.revision || "-"}</div>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/production/routing/${r.id}`)}
                            className="text-left font-semibold text-gray-900 hover:underline"
                          >
                            {r.name}
                          </button>
                        </td>

                        <td className="px-4 py-3">
                          <Badge className={cx("border-0", cat.className)}>{cat.label}</Badge>
                        </td>

                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-2">
                            <Layers className="h-4 w-4 text-gray-700" />
                            <span className="font-semibold text-gray-900">{r.layerCount}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant="outline">{r.plant || "-"}</Badge>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(r.qcGates || []).slice(0, 3).map((g) => (
                              <Badge key={`${r.id}-${g}`} variant="outline">
                                {g}
                              </Badge>
                            ))}
                            {(r.qcGates || []).length > 3 ? (
                              <Badge variant="outline">+{(r.qcGates || []).length - 3}</Badge>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(r.updatedAt)}</td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigate(`/production/routing/${r.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigate(`/production/routing/${r.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>

                            <Button variant="outline" size="sm" className="gap-2" onClick={() => cloneRow(r)}>
                              <Copy className="h-4 w-4" />
                              Clone
                            </Button>

                            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportRow(r)}>
                              <FileDown className="h-4 w-4" />
                              Export
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              onClick={() => openDelete(r)}
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
            </div>
          )}

          {/* Small footer */}
          {!loading && sorted.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
              <span>
                Sort: <span className="font-semibold text-gray-900">{sortBy}</span> ({sortDir})
              </span>
              <span className="inline-flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Routing master impacts capacity planning, costing, and WIP flow.
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete routing?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRow ? (
                <>
                  This will permanently remove <span className="font-semibold">{selectedRow.code}</span>. This action
                  can’t be undone.
                </>
              ) : (
                <>This action can’t be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
