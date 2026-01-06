// src/pages/maintenance/equipment/EquipmentList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
  AlertTriangle,
  ArrowUpDown,
  Factory,
  Filter,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Wrench,
} from "lucide-react";

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

/**
 * PCBxpress - Equipment List
 * Path: src/pages/maintenance/equipment/EquipmentList.jsx
 *
 * Replace mock calls with real endpoints:
 * - GET    /maintenance/equipment?query=&plant=&line=&status=&criticality=
 * - DELETE /maintenance/equipment/:id
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  running: { label: "Running", variant: "secondary" },
  down: { label: "Down", variant: "destructive" },
  pm: { label: "PM", variant: "default" },
  hold: { label: "Hold", variant: "outline" },
};

const CRIT_META = {
  A: { label: "A (Critical)", variant: "destructive" },
  B: { label: "B (Important)", variant: "default" },
  C: { label: "C (Standard)", variant: "secondary" },
};

const mockEquipment = () => [
  {
    id: "DRL-01",
    name: "CNC Drill #1",
    category: "Drilling",
    plant: "Plant A",
    line: "Drilling",
    location: "Bay D1",
    status: "running",
    criticality: "A",
    nextPM: "2026-01-11",
    nextCalibration: "2026-05-10",
    vendor: "Schmoll",
    model: "X3000",
    updatedAt: "2026-01-05",
  },
  {
    id: "PLT-01",
    name: "Plating Line #1",
    category: "Plating",
    plant: "Plant A",
    line: "Plating",
    location: "Bay P2",
    status: "pm",
    criticality: "A",
    nextPM: "2026-01-16",
    nextCalibration: "2026-04-01",
    vendor: "Atotech",
    model: "CuProLine",
    updatedAt: "2026-01-02",
  },
  {
    id: "ETC-02",
    name: "Etching Line #2",
    category: "Etching",
    plant: "Plant A",
    line: "Etching",
    location: "Bay E4",
    status: "running",
    criticality: "B",
    nextPM: "2026-01-20",
    nextCalibration: "2026-03-08",
    vendor: "Uyemura",
    model: "ETCH-Pro",
    updatedAt: "2026-01-03",
  },
  {
    id: "AOI-01",
    name: "AOI Station #1",
    category: "Inspection",
    plant: "Plant B",
    line: "AOI",
    location: "QC Lab",
    status: "down",
    criticality: "B",
    nextPM: "2026-01-15",
    nextCalibration: "2026-03-15",
    vendor: "Mirtec",
    model: "MV-9",
    updatedAt: "2026-01-04",
  },
  {
    id: "CNC-RT-01",
    name: "CNC Router",
    category: "Routing",
    plant: "Plant B",
    line: "Routing",
    location: "Bay R1",
    status: "hold",
    criticality: "C",
    nextPM: "2026-02-01",
    nextCalibration: "2026-06-01",
    vendor: "LPKF",
    model: "ProtoMat",
    updatedAt: "2025-12-28",
  },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.hold;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function CritBadge({ crit }) {
  const meta = CRIT_META[crit] ?? CRIT_META.C;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
        <Wrench className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-900">No equipment found</h3>
      <p className="mt-1 text-sm text-gray-600">
        Try changing filters or clearing the search to see more results.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="outline" onClick={onReset}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}

export default function EquipmentList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("table"); // table | grid

  const [rows, setRows] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [plant, setPlant] = useState("all");
  const [line, setLine] = useState("all");
  const [status, setStatus] = useState("all");
  const [crit, setCrit] = useState("all");

  // sorting
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  // delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const plants = useMemo(() => {
    const set = new Set(rows.map((r) => r.plant).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const lines = useMemo(() => {
    const set = new Set(rows.map((r) => r.line).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API call
      const data = mockEquipment();
      setRows(data);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load equipment", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...rows];

    if (needle) {
      list = list.filter((r) => {
        const hay = [
          r.id,
          r.name,
          r.category,
          r.vendor,
          r.model,
          r.plant,
          r.line,
          r.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }

    if (plant !== "all") list = list.filter((r) => r.plant === plant);
    if (line !== "all") list = list.filter((r) => r.line === line);
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (crit !== "all") list = list.filter((r) => r.criticality === crit);

    // sorting
    list.sort((a, b) => {
      const av = (a?.[sortKey] ?? "").toString().toLowerCase();
      const bv = (b?.[sortKey] ?? "").toString().toLowerCase();
      const res = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? res : -res;
    });

    return list;
  }, [rows, q, plant, line, status, crit, sortKey, sortDir]);

  const stats = useMemo(() => {
    const total = rows.length;
    const down = rows.filter((r) => r.status === "down").length;
    const pm = rows.filter((r) => r.status === "pm").length;
    const criticalA = rows.filter((r) => r.criticality === "A").length;
    return { total, down, pm, criticalA };
  }, [rows]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const resetFilters = () => {
    setQ("");
    setPlant("all");
    setLine("all");
    setStatus("all");
    setCrit("all");
  };

  const askDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      // TODO: Replace with DELETE call
      setRows((prev) => prev.filter((r) => r.id !== selected.id));
      toast({ title: "Deleted", description: `Equipment ${selected.id} removed.` });
      setDeleteOpen(false);
      setSelected(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Equipment</h1>
            <p className="text-sm text-gray-600">
              Manage PCB shop assets (drilling, plating, etching, AOI, E-test) with PM and downtime visibility.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={load}
            disabled={loading || deleting}
            aria-label="Refresh list"
          >
            <RefreshCw className={cx("h-4 w-4", (loading || deleting) && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            className={cx("gap-2", view === "table" && "border-[#dc2551]/40")}
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
            Table
          </Button>

          <Button
            variant="outline"
            className={cx("gap-2", view === "grid" && "border-[#dc2551]/40")}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            Cards
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() =>
              toast({
                title: "Create equipment (placeholder)",
                description: "Create EquipmentCreate.jsx and hook it here.",
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Assets</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Down</p>
          <p className="mt-1 text-2xl font-bold text-[#dc2551]">{stats.down}</p>
        </Card>
        <Card className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">In PM</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.pm}</p>
        </Card>
        <Card className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Critical (A)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.criticalA}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Filters</p>
              <p className="text-xs text-gray-500">Search and narrow down assets by plant, line, status, and criticality.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ID, name, vendor, model, location..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plant">Plant</Label>
            <select
              id="plant"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              {plants.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All Plants" : p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="line">Line</Label>
            <select
              id="line"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              {lines.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All Lines" : l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="down">Down</option>
              <option value="pm">PM</option>
              <option value="hold">Hold</option>
            </select>
          </div>

          <div>
            <Label htmlFor="crit">Criticality</Label>
            <select
              id="crit"
              value={crit}
              onChange={(e) => setCrit(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="all">All</option>
              <option value="A">A (Critical)</option>
              <option value="B">B (Important)</option>
              <option value="C">C (Standard)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="h-32 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-32 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-32 animate-pulse rounded-2xl bg-gray-50" />
        </div>
      ) : !filtered.length ? (
        <EmptyState onReset={resetFilters} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="rounded-2xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {r.id} — {r.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {r.plant} • {r.line} • {r.location}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={r.status} />
                  <CritBadge crit={r.criticality} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="text-gray-500">Vendor</p>
                  <p className="font-medium text-gray-900">{r.vendor}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="text-gray-500">Model</p>
                  <p className="font-medium text-gray-900">{r.model}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="text-gray-500">Next PM</p>
                  <p className="font-medium text-gray-900">{r.nextPM}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="text-gray-500">Next Cal</p>
                  <p className="font-medium text-gray-900">{r.nextCalibration}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" asChild>
                  <Link to={`/maintenance/equipment/${r.id}`}>
                    <Settings2 className="h-4 w-4" />
                    Details
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    toast({
                      title: "Edit (placeholder)",
                      description: "Create EquipmentEdit.jsx and link it here.",
                    })
                  }
                >
                  <Wrench className="h-4 w-4" />
                  Edit
                </Button>

                <Button variant="outline" className="gap-2" onClick={() => askDelete(r)}>
                  <Trash2 className="h-4 w-4 text-[#dc2551]" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border bg-white p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              Results <span className="text-gray-500 font-normal">({filtered.length})</span>
            </p>
            <p className="text-xs text-gray-500">Tip: Click column headers to sort.</p>
          </div>

          <div className="w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button className="inline-flex items-center gap-2" onClick={() => toggleSort("id")}>
                      Asset ID <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="inline-flex items-center gap-2" onClick={() => toggleSort("name")}>
                      Name <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Plant / Line</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Criticality</th>
                  <th className="px-4 py-3 text-left">Next PM</th>
                  <th className="px-4 py-3 text-left">Next Cal</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{r.name}</p>
                        <p className="truncate text-xs text-gray-500">
                          {r.vendor} • {r.model} • {r.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{r.plant}</p>
                      <p className="text-xs text-gray-500">{r.line}</p>
                    </td>
                    <td className="px-4 py-3">{r.location}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <CritBadge crit={r.criticality} />
                    </td>
                    <td className="px-4 py-3">{r.nextPM}</td>
                    <td className="px-4 py-3">{r.nextCalibration}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <Link to={`/maintenance/equipment/${r.id}`}>
                            <Settings2 className="h-4 w-4" />
                            Details
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            toast({
                              title: "Edit (placeholder)",
                              description: "Create EquipmentEdit.jsx and link it here.",
                            })
                          }
                        >
                          <Wrench className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => askDelete(r)}>
                          <Trash2 className="h-4 w-4 text-[#dc2551]" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-semibold text-gray-900">
                {selected?.id} — {selected?.name}
              </span>{" "}
              from the master list. You can restrict delete in backend if logs exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
