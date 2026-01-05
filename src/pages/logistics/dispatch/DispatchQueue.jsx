// src/pages/logistics/dispatch/DispatchQueue.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  FileDown,
  PackageCheck,
  Plus,
  RefreshCcw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * DispatchQueue.jsx (PCBxpress)
 * Queue view for dispatch operations:
 * - Filter by status, date range, customer
 * - Quick search by dispatch no / invoice / tracking / WO/SO
 * - Bulk actions (mark packed, mark dispatched) via confirmation
 *
 * NOTE:
 * Replace mock fetch with dispatchService.getQueue(filters)
 * Replace actions with dispatchService.bulkUpdate(...)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const STATUS = [
  { value: "all", label: "All" },
  { value: "pending_pack", label: "Pending Packing" },
  { value: "packed", label: "Packed (Ready to Dispatch)" },
  { value: "dispatched", label: "Dispatched" },
  { value: "on_hold", label: "On Hold" },
];

const DISPATCH_TYPES = [
  { value: "all", label: "All Types" },
  { value: "customer_delivery", label: "Customer Delivery" },
  { value: "sample_dispatch", label: "Sample Dispatch" },
  { value: "inter_plant", label: "Inter-Plant Transfer" },
  { value: "return_to_vendor", label: "Return to Vendor" },
];

const CARRIERS = [
  { value: "all", label: "All Carriers" },
  { value: "DHL", label: "DHL" },
  { value: "FedEx", label: "FedEx" },
  { value: "Blue Dart", label: "Blue Dart" },
  { value: "DTDC", label: "DTDC" },
  { value: "Delhivery", label: "Delhivery" },
  { value: "India Post", label: "India Post" },
  { value: "Customer Pickup", label: "Customer Pickup" },
  { value: "Other", label: "Other" },
];

// Mock queue rows (replace with API)
const MOCK = [
  {
    id: "dq-1001",
    dispatchNo: "DSP-000214",
    dispatchDate: "2026-01-05",
    customer: "Apex Instruments",
    type: "customer_delivery",
    carrier: "Blue Dart",
    trackingNo: "BD123456789",
    invoiceNo: "INV-00921",
    items: 3,
    qty: 250,
    status: "pending_pack",
    priority: "high",
  },
  {
    id: "dq-1002",
    dispatchNo: "DSP-000215",
    dispatchDate: "2026-01-05",
    customer: "Nova Robotics",
    type: "sample_dispatch",
    carrier: "Customer Pickup",
    trackingNo: "",
    invoiceNo: "INV-00922",
    items: 1,
    qty: 10,
    status: "packed",
    priority: "normal",
  },
  {
    id: "dq-1003",
    dispatchNo: "DSP-000212",
    dispatchDate: "2026-01-03",
    customer: "Kite Electronics",
    type: "customer_delivery",
    carrier: "DHL",
    trackingNo: "DHL99220011",
    invoiceNo: "INV-00919",
    items: 4,
    qty: 1200,
    status: "dispatched",
    priority: "normal",
  },
  {
    id: "dq-1004",
    dispatchNo: "DSP-000211",
    dispatchDate: "2026-01-02",
    customer: "Orbit EMS",
    type: "inter_plant",
    carrier: "Other",
    trackingNo: "INT-TRK-44",
    invoiceNo: "",
    items: 2,
    qty: 480,
    status: "on_hold",
    priority: "high",
  },
];

function Badge({ tone = "gray", children }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return <span className={cx(base, tones[tone] || tones.gray)}>{children}</span>;
}

function statusMeta(status) {
  switch (status) {
    case "pending_pack":
      return { label: "Pending Packing", tone: "amber", icon: Clock3 };
    case "packed":
      return { label: "Packed", tone: "blue", icon: PackageCheck };
    case "dispatched":
      return { label: "Dispatched", tone: "green", icon: Truck };
    case "on_hold":
      return { label: "On Hold", tone: "red", icon: XCircle };
    default:
      return { label: "Unknown", tone: "gray", icon: Clock3 };
  }
}

function typeLabel(v) {
  const map = {
    customer_delivery: "Customer Delivery",
    sample_dispatch: "Sample Dispatch",
    inter_plant: "Inter-Plant Transfer",
    return_to_vendor: "Return to Vendor",
  };
  return map[v] || v;
}

export default function DispatchQueue() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [carrier, setCarrier] = useState("all");
  const [from, setFrom] = useState(daysAgoISO(14));
  const [to, setTo] = useState(todayISO());

  // Selection + bulk actions
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState({ open: false, action: null });

  useEffect(() => {
    // TODO: Replace with API fetch:
    // const res = await dispatchService.getQueue({ q, status, type, carrier, from, to });
    // setRows(res.data)
    setLoading(true);
    const t = setTimeout(() => {
      setRows(MOCK);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (type !== "all" && r.type !== type) return false;
      if (carrier !== "all" && r.carrier !== carrier) return false;

      // date range
      if (from && r.dispatchDate < from) return false;
      if (to && r.dispatchDate > to) return false;

      if (!needle) return true;

      const hay = [
        r.dispatchNo,
        r.customer,
        r.trackingNo,
        r.invoiceNo,
        r.carrier,
        typeLabel(r.type),
        r.status,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(needle);
    });
  }, [rows, q, status, type, carrier, from, to]);

  const stats = useMemo(() => {
    const by = (s) => filtered.filter((r) => r.status === s).length;
    return {
      total: filtered.length,
      pending: by("pending_pack"),
      packed: by("packed"),
      dispatched: by("dispatched"),
      hold: by("on_hold"),
    };
  }, [filtered]);

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const someChecked = filtered.some((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        filtered.forEach((r) => next.delete(r.id));
      } else {
        filtered.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const refresh = async () => {
    setLoading(true);
    try {
      // TODO: fetch again
      await new Promise((r) => setTimeout(r, 300));
      setRows(MOCK);
      toast({ title: "Queue refreshed", description: "Latest dispatch queue loaded." });
    } catch {
      toast({ title: "Refresh failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const requestBulk = (action) => {
    if (selected.size === 0) {
      toast({
        title: "No selection",
        description: "Select at least one dispatch to perform bulk action.",
        variant: "destructive",
      });
      return;
    }
    setConfirm({ open: true, action });
  };

  const runBulkAction = async () => {
    const action = confirm.action;
    setConfirm({ open: false, action: null });

    try {
      // TODO: dispatchService.bulkUpdate([...selected], action)
      // For now: update local rows
      setRows((prev) =>
        prev.map((r) => {
          if (!selected.has(r.id)) return r;
          if (action === "mark_packed") return { ...r, status: "packed" };
          if (action === "mark_dispatched") return { ...r, status: "dispatched" };
          if (action === "release_hold") return { ...r, status: "pending_pack" };
          return r;
        })
      );

      toast({
        title: "Bulk action applied",
        description:
          action === "mark_packed"
            ? "Selected dispatches marked as packed."
            : action === "mark_dispatched"
            ? "Selected dispatches marked as dispatched."
            : "Selected dispatches moved back to pending packing.",
      });

      clearSelection();
    } catch {
      toast({ title: "Action failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const confirmText = useMemo(() => {
    if (confirm.action === "mark_packed") return "Mark as Packed";
    if (confirm.action === "mark_dispatched") return "Mark as Dispatched";
    if (confirm.action === "release_hold") return "Release Hold";
    return "Confirm";
  }, [confirm.action]);

  const confirmDesc = useMemo(() => {
    if (confirm.action === "mark_packed")
      return "This will mark the selected dispatch records as packed (ready to dispatch).";
    if (confirm.action === "mark_dispatched")
      return "This will mark the selected dispatch records as dispatched. Ensure tracking/invoice details are ready.";
    if (confirm.action === "release_hold")
      return "This will move selected dispatch records from hold to pending packing.";
    return "Proceed with bulk update?";
  }, [confirm.action]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dispatch Queue</h1>
          <p className="text-sm text-gray-500">
            Manage packing & dispatch operations for finished PCB shipments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={refresh} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="secondary" className="gap-2" onClick={() => toast({ title: "Export", description: "Hook CSV/PDF export to backend." })}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/logistics/dispatch/create">
              <Plus className="h-4 w-4" />
              New Dispatch
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-600">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-600">Pending Packing</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-600">Packed</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.packed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-600">Dispatched</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.dispatched}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-600">On Hold</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.hold}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label>Search</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Dispatch no, customer, invoice, tracking..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <div className="mt-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Type</Label>
            <div className="mt-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {DISPATCH_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Carrier</Label>
            <div className="mt-2">
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  {CARRIERS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="md:col-span-1">
            <Label>From</Label>
            <div className="mt-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
          </div>

          <div className="md:col-span-1">
            <Label>To</Label>
            <div className="mt-2">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex h-2 w-2 rounded-full bg-gray-300" />
            {selected.size > 0 ? (
              <span>
                <span className="font-semibold text-gray-900">{selected.size}</span> selected
              </span>
            ) : (
              <span>Select dispatches to perform bulk actions</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => requestBulk("mark_packed")}
              disabled={selected.size === 0}
            >
              <PackageCheck className="h-4 w-4" />
              Mark Packed
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => requestBulk("mark_dispatched")}
              disabled={selected.size === 0}
            >
              <Truck className="h-4 w-4" />
              Mark Dispatched
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => requestBulk("release_hold")}
              disabled={selected.size === 0}
            >
              <CheckCircle2 className="h-4 w-4" />
              Release Hold
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="overflow-hidden">
          <div className="border-b bg-white px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Calendar className="h-4 w-4 text-[#dc2551]" />
                Queue List
              </div>
              <div className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-800">{filtered.length}</span> records
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = !allChecked && someChecked;
                      }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-3">Dispatch</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Carrier / Tracking</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-4 w-4 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-44 rounded bg-gray-200" />
                        <div className="mt-2 h-3 w-28 rounded bg-gray-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-40 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-40 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-10 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-14 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-6 w-28 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-8 w-24 rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500">
                      No dispatches found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const meta = statusMeta(r.status);
                    const Icon = meta.icon;
                    const isChecked = selected.has(r.id);

                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 align-middle">
                          <input type="checkbox" checked={isChecked} onChange={() => toggleOne(r.id)} />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{r.dispatchNo}</span>
                            <span className="text-xs text-gray-500">{r.dispatchDate}</span>
                            {r.priority === "high" && (
                              <div className="mt-1">
                                <Badge tone="red">High Priority</Badge>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="text-sm font-medium text-gray-900">{r.customer}</div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <Badge tone="violet">{typeLabel(r.type)}</Badge>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="text-sm font-medium text-gray-900">{r.carrier}</div>
                          <div className="text-xs text-gray-500">
                            {r.trackingNo ? r.trackingNo : "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="text-sm text-gray-900">{r.invoiceNo || "—"}</div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="text-sm font-semibold text-gray-900">{r.items}</div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="text-sm font-semibold text-gray-900">{r.qty}</div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <Badge tone={meta.tone}>
                            <span className="inline-flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5" />
                              {meta.label}
                            </span>
                          </Badge>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="gap-2"
                              onClick={() => navigate(`/logistics/dispatch/${r.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      <ConfirmationDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((p) => ({ ...p, open }))}
        title={`${confirmText}?`}
        description={confirmDesc}
        confirmText={confirmText}
        confirmVariant="destructive"
        onConfirm={runBulkAction}
      />
    </div>
  );
}
