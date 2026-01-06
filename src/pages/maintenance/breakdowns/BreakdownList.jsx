// src/pages/maintenance/breakdowns/BreakdownList.jsx
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ClipboardList,
    Eye,
    Filter,
    Plus,
    RefreshCw,
    Search,
    Wrench,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * BreakdownList.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/maintenance/breakdowns/BreakdownList.jsx
 *
 * What it does:
 * - Lists breakdown tickets (machine downtime incidents)
 * - Search + status filter + date range filter
 * - Quick actions: view, edit, close, delete (UI-ready)
 * - Uses mock data by default (replace with API service later)
 */

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  open: { label: "Open", variant: "destructive" },
  in_progress: { label: "In Progress", variant: "secondary" },
  on_hold: { label: "On Hold", variant: "outline" },
  resolved: { label: "Resolved", variant: "default" },
  closed: { label: "Closed", variant: "default" },
};

const PRIORITY_META = {
  low: { label: "Low", className: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", className: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700" },
};

function formatDate(dt) {
  if (!dt) return "-";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function minutesToHM(mins) {
  if (mins == null || Number.isNaN(Number(mins))) return "-";
  const m = Math.max(0, Number(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
}

// ---------------------------------------------
// Mock Data (Replace with API)
// ---------------------------------------------
const MOCK_BREAKDOWNS = [
  {
    id: "BD-00071",
    machine: "CNC Drill 01",
    line: "Drilling",
    fault: "Spindle vibration alarm",
    status: "open",
    priority: "high",
    opened_at: "2026-01-05T08:42:00",
    reported_by: "Operator A",
    assigned_to: "Maintenance Tech 2",
    downtime_minutes: 95,
  },
  {
    id: "BD-00070",
    machine: "AOI 02",
    line: "Inspection",
    fault: "Conveyor jam",
    status: "in_progress",
    priority: "medium",
    opened_at: "2026-01-04T11:10:00",
    reported_by: "QA Inspector",
    assigned_to: "Maintenance Tech 1",
    downtime_minutes: 35,
  },
  {
    id: "BD-00069",
    machine: "Plating Line 01",
    line: "Plating",
    fault: "Pump overheating",
    status: "resolved",
    priority: "critical",
    opened_at: "2026-01-02T06:15:00",
    reported_by: "Shift Supervisor",
    assigned_to: "Maintenance Lead",
    downtime_minutes: 210,
  },
  {
    id: "BD-00068",
    machine: "Lamination Press 01",
    line: "Lamination",
    fault: "Temperature overshoot",
    status: "closed",
    priority: "low",
    opened_at: "2025-12-28T09:30:00",
    reported_by: "Operator C",
    assigned_to: "Maintenance Tech 3",
    downtime_minutes: 20,
  },
];

// ---------------------------------------------
// Component
// ---------------------------------------------
export default function BreakdownList() {
  const { toast } = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // actions
  const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });
  const [confirmClose, setConfirmClose] = useState({ open: false, row: null });

  // initial load (mock)
  useEffect(() => {
    let alive = true;
    setLoading(true);

    // Simulate fetch delay
    const t = setTimeout(() => {
      if (!alive) return;
      setRows(MOCK_BREAKDOWNS);
      setLoading(false);
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return rows
      .filter((r) => {
        if (status !== "all" && r.status !== status) return false;

        if (from) {
          const d = new Date(r.opened_at);
          if (d < from) return false;
        }

        if (to) {
          const d = new Date(r.opened_at);
          // inclusive end date
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }

        if (!needle) return true;

        const hay = [
          r.id,
          r.machine,
          r.line,
          r.fault,
          r.status,
          r.priority,
          r.reported_by,
          r.assigned_to,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(needle);
      })
      .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  }, [rows, q, status, fromDate, toDate]);

  const counters = useMemo(() => {
    const all = rows.length;
    const open = rows.filter((r) => r.status === "open").length;
    const inProg = rows.filter((r) => r.status === "in_progress").length;
    const resolved = rows.filter((r) => r.status === "resolved").length;
    const closed = rows.filter((r) => r.status === "closed").length;
    const downtime = rows.reduce((acc, r) => acc + (Number(r.downtime_minutes) || 0), 0);
    return { all, open, inProg, resolved, closed, downtime };
  }, [rows]);

  const handleReset = () => {
    setQ("");
    setStatus("all");
    setFromDate("");
    setToDate("");
    toast({ title: "Filters reset", description: "Showing all breakdown tickets." });
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Replace with: await breakdownService.list()
    setTimeout(() => {
      setRows(MOCK_BREAKDOWNS);
      setLoading(false);
      toast({ title: "Refreshed", description: "Breakdown list updated." });
    }, 350);
  };

  const requestClose = (row) => setConfirmClose({ open: true, row });
  const requestDelete = (row) => setConfirmDelete({ open: true, row });

  const confirmCloseNow = async () => {
    const row = confirmClose.row;
    setConfirmClose({ open: false, row: null });

    // Replace with API: breakdownService.close(row.id)
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "closed" } : r)));

    toast({
      title: "Breakdown closed",
      description: `${row.id} marked as Closed.`,
    });
  };

  const confirmDeleteNow = async () => {
    const row = confirmDelete.row;
    setConfirmDelete({ open: false, row: null });

    // Replace with API: breakdownService.remove(row.id)
    setRows((prev) => prev.filter((r) => r.id !== row.id));

    toast({
      title: "Breakdown deleted",
      description: `${row.id} removed successfully.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <Wrench className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Breakdowns</h1>
            <p className="text-sm text-gray-500">
              Track machine downtime incidents for PCB production lines (drilling, plating, AOI, lamination, etc.)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Link to="/maintenance/breakdowns/create">
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
              <Plus className="h-4 w-4" />
              New Breakdown
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500">All</p>
          <p className="mt-1 text-lg font-semibold">{counters.all}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Open</p>
          <p className="mt-1 text-lg font-semibold text-red-600">{counters.open}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">In Progress</p>
          <p className="mt-1 text-lg font-semibold">{counters.inProg}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Resolved</p>
          <p className="mt-1 text-lg font-semibold">{counters.resolved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Closed</p>
          <p className="mt-1 text-lg font-semibold">{counters.closed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Downtime</p>
          <p className="mt-1 text-lg font-semibold">{minutesToHM(counters.downtime)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by ID, machine, fault, line, user..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <XCircle className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-800">Breakdown Tickets</p>
            <Badge variant="outline" className="ml-2">
              {filtered.length} shown
            </Badge>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Machine</th>
                <th className="px-4 py-3">Line</th>
                <th className="px-4 py-3">Fault</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Downtime</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading breakdowns...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                      No breakdown tickets match your filters.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const s = STATUS_META[r.status] || { label: r.status, variant: "outline" };
                  const p = PRIORITY_META[r.priority] || PRIORITY_META.medium;

                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="bg-white hover:bg-gray-50/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{r.id}</div>
                        <div className="text-xs text-gray-500">
                          Reported by {r.reported_by || "-"}
                          {r.assigned_to ? ` • Assigned: ${r.assigned_to}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-800">{r.machine}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.line}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.fault}</td>

                      <td className="px-4 py-3">
                        <span className={cx("rounded-full px-2 py-1 text-xs font-semibold", p.className)}>
                          {p.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.opened_at)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{minutesToHM(r.downtime_minutes)}</td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link to={`/maintenance/breakdowns/${encodeURIComponent(r.id)}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>

                          {r.status !== "closed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => requestClose(r)}
                              className="gap-2"
                            >
                              <Wrench className="h-4 w-4" />
                              Close
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestDelete(r)}
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Close confirmation */}
      <ConfirmationDialog
        open={confirmClose.open}
        onOpenChange={(open) => setConfirmClose({ open, row: open ? confirmClose.row : null })}
        title="Close breakdown?"
        description={
          confirmClose.row
            ? `This will mark ${confirmClose.row.id} as Closed. You can still view it later.`
            : "This will mark the breakdown as Closed."
        }
        confirmText="Close"
        confirmVariant="default"
        onConfirm={confirmCloseNow}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, row: open ? confirmDelete.row : null })}
        title="Delete breakdown?"
        description={
          confirmDelete.row
            ? `This will permanently remove ${confirmDelete.row.id}. This action cannot be undone.`
            : "This will permanently remove the breakdown. This action cannot be undone."
        }
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={confirmDeleteNow}
      />
    </div>
  );
}
