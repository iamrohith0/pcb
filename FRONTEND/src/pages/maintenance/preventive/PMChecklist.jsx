// src/pages/maintenance/preventive/PMChecklist.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    Download,
    Factory,
    Filter,
    Plus,
    RefreshCw,
    Search,
    Settings2,
    ShieldAlert,
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
 * PCBxpress - Preventive Maintenance (PM) Checklist Library
 * File: src/pages/maintenance/preventive/PMChecklist.jsx
 *
 * Suggested APIs:
 * - GET    /maintenance/pm/checklists?query=&equipmentType=&frequency=&criticality=&status=
 * - POST   /maintenance/pm/checklists
 * - PUT    /maintenance/pm/checklists/:id
 * - DELETE /maintenance/pm/checklists/:id
 * - GET    /maintenance/pm/checklists/:id/export  (PDF/CSV)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const FREQ_META = {
  daily: { label: "Daily", variant: "secondary" },
  weekly: { label: "Weekly", variant: "default" },
  monthly: { label: "Monthly", variant: "outline" },
  quarterly: { label: "Quarterly", variant: "secondary" },
  semiannual: { label: "Semi-Annual", variant: "default" },
  annual: { label: "Annual", variant: "destructive" },
};

const STATUS_META = {
  active: { label: "Active", variant: "secondary" },
  draft: { label: "Draft", variant: "outline" },
  retired: { label: "Retired", variant: "destructive" },
};

const CRIT_META = {
  A: { label: "A (Critical)", variant: "destructive" },
  B: { label: "B (Important)", variant: "default" },
  C: { label: "C (Standard)", variant: "secondary" },
};

function Pill({ icon: Icon, title, value }) {
  return (
    <Card className="rounded-2xl border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function MetaBadge({ meta, value }) {
  const m = meta?.[value] ?? { label: value, variant: "outline" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
        <ClipboardCheck className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-900">No checklists found</h3>
      <p className="mt-1 text-sm text-gray-600">
        Create a PM checklist template for drilling, plating, etching, AOI, E-test, routing and utilities.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="outline" onClick={onReset}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}

/** Mock data (replace with API) */
function mockChecklists() {
  return [
    {
      id: "PM-DRL-DLY",
      name: "CNC Drill — Daily Startup Checklist",
      equipmentType: "Drilling",
      frequency: "daily",
      criticality: "A",
      status: "active",
      steps: 14,
      safety: true,
      qa: false,
      lastUpdated: "2026-01-04",
      owner: "Maintenance",
    },
    {
      id: "PM-PLT-WK",
      name: "Plating Line — Weekly Chemical & Anode Check",
      equipmentType: "Plating",
      frequency: "weekly",
      criticality: "A",
      status: "active",
      steps: 22,
      safety: true,
      qa: true,
      lastUpdated: "2026-01-02",
      owner: "Process",
    },
    {
      id: "PM-AOI-MO",
      name: "AOI — Monthly Optics & Calibration",
      equipmentType: "Inspection (AOI)",
      frequency: "monthly",
      criticality: "B",
      status: "active",
      steps: 11,
      safety: false,
      qa: true,
      lastUpdated: "2025-12-28",
      owner: "Quality",
    },
    {
      id: "PM-ETEST-QTR",
      name: "E-Test — Quarterly Fixture & Probe Verification",
      equipmentType: "Electrical Test",
      frequency: "quarterly",
      criticality: "B",
      status: "draft",
      steps: 16,
      safety: false,
      qa: true,
      lastUpdated: "2025-12-22",
      owner: "Quality",
    },
    {
      id: "PM-UTIL-AN",
      name: "Compressor & Dryer — Annual Service",
      equipmentType: "Utilities",
      frequency: "annual",
      criticality: "A",
      status: "active",
      steps: 18,
      safety: true,
      qa: false,
      lastUpdated: "2025-12-15",
      owner: "Facilities",
    },
  ];
}

export default function PMChecklist() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [equipmentType, setEquipmentType] = useState("all");
  const [frequency, setFrequency] = useState("all");
  const [criticality, setCriticality] = useState("all");
  const [status, setStatus] = useState("all");

  // Sorting
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // TODO: replace with API
      const data = mockChecklists();
      setRows(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load PM checklists",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const equipmentTypes = useMemo(() => {
    const set = new Set(rows.map((r) => r.equipmentType).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const criticalA = rows.filter((r) => r.criticality === "A").length;
    const withSafety = rows.filter((r) => r.safety).length;
    return { total, active, criticalA, withSafety };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...rows];

    if (needle) {
      list = list.filter((r) => {
        const hay = [
          r.id,
          r.name,
          r.equipmentType,
          r.frequency,
          r.criticality,
          r.status,
          r.owner,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }

    if (equipmentType !== "all") list = list.filter((r) => r.equipmentType === equipmentType);
    if (frequency !== "all") list = list.filter((r) => r.frequency === frequency);
    if (criticality !== "all") list = list.filter((r) => r.criticality === criticality);
    if (status !== "all") list = list.filter((r) => r.status === status);

    list.sort((a, b) => {
      const av = (a?.[sortKey] ?? "").toString().toLowerCase();
      const bv = (b?.[sortKey] ?? "").toString().toLowerCase();
      const res = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? res : -res;
    });

    return list;
  }, [rows, q, equipmentType, frequency, criticality, status, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const resetFilters = () => {
    setQ("");
    setEquipmentType("all");
    setFrequency("all");
    setCriticality("all");
    setStatus("all");
  };

  const requestDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      // TODO: replace with API delete
      setRows((prev) => prev.filter((r) => r.id !== selected.id));
      toast({ title: "Checklist deleted", description: `${selected.id} removed.` });
      setDeleteOpen(false);
      setSelected(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const exportChecklist = async (row) => {
    try {
      // TODO: replace with backend export
      toast({
        title: "Export started (placeholder)",
        description: `Implement /maintenance/pm/checklists/${row.id}/export for PDF/CSV.`,
      });
    } catch (e) {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PM Checklist Library</h1>
            <p className="text-sm text-gray-600">
              Standard templates to run preventive maintenance across PCB manufacturing equipment (drill, plating, etch,
              AOI, E-test, routing, utilities).
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
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() =>
              toast({
                title: "Create PM checklist (placeholder)",
                description: "Create PMChecklistCreate.jsx and hook it here.",
              })
            }
          >
            <Plus className="h-4 w-4" />
            New Checklist
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Pill icon={Factory} title="Total Templates" value={stats.total} />
        <Pill icon={CheckCircle2} title="Active" value={stats.active} />
        <Pill icon={ShieldAlert} title="Critical (A)" value={stats.criticalA} />
        <Pill icon={AlertCircle} title="Has Safety Steps" value={stats.withSafety} />
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
              <p className="text-xs text-gray-500">Search, filter, and sort PM templates.</p>
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
                placeholder="Search by ID, checklist name, owner..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="equipmentType">Equipment Type</Label>
            <select
              id="equipmentType"
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              {equipmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All Types" : t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
            >
              <option value="all">All</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semiannual">Semi-Annual</option>
              <option value="annual">Annual</option>
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
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <Label htmlFor="criticality">Criticality</Label>
            <select
              id="criticality"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value)}
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

      {/* Table */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="h-28 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-28 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-28 animate-pulse rounded-2xl bg-gray-50" />
        </div>
      ) : !filtered.length ? (
        <EmptyState onReset={resetFilters} />
      ) : (
        <Card className="rounded-2xl border bg-white p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              Templates <span className="font-normal text-gray-500">({filtered.length})</span>
            </p>
            <p className="text-xs text-gray-500">Click headers to sort.</p>
          </div>

          <div className="w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button className="inline-flex items-center gap-2" onClick={() => toggleSort("id")}>
                      Checklist ID <span className="opacity-70">↕</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="inline-flex items-center gap-2" onClick={() => toggleSort("name")}>
                      Name <span className="opacity-70">↕</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Frequency</th>
                  <th className="px-4 py-3 text-left">Criticality</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Steps</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {r.safety ? (
                          <span className="inline-flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5 text-[#dc2551]" />
                            Safety
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5 text-gray-300" />
                            Safety
                          </span>
                        )}
                        {r.qa ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            QA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-gray-300" />
                            QA
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">{r.equipmentType}</td>
                    <td className="px-4 py-3">
                      <MetaBadge meta={FREQ_META} value={r.frequency} />
                    </td>
                    <td className="px-4 py-3">
                      <MetaBadge meta={CRIT_META} value={r.criticality} />
                    </td>
                    <td className="px-4 py-3">
                      <MetaBadge meta={STATUS_META} value={r.status} />
                    </td>
                    <td className="px-4 py-3">{r.steps}</td>
                    <td className="px-4 py-3">{r.owner}</td>
                    <td className="px-4 py-3">{r.lastUpdated}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          asChild
                        >
                          <Link to={`/maintenance/preventive/pm-checklists/${r.id}`}>
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
                              description: "Create PMChecklistEdit.jsx and link it here.",
                            })
                          }
                        >
                          <Wrench className="h-4 w-4" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => exportChecklist(r)}
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => requestDelete(r)}
                        >
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
            <AlertDialogTitle>Delete checklist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-semibold text-gray-900">{selected?.id}</span>{" "}
              from the PM template library. If PM history exists, you can enforce “retire” on backend instead.
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
