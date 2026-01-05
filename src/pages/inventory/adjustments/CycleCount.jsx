// src/pages/inventory/stock/CycleCount.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
  Barcode,
  CheckCircle2,
  ClipboardList,
  Filter,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  Warehouse,
} from "lucide-react";

/**
 * CycleCount.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Folder: src/pages/inventory/stock/CycleCount.jsx
 * Suggested route: /inventory/stock/cycle-count
 *
 * What it does:
 *  - Create cycle count sessions (planned)
 *  - Add count lines (item/lot/location) and record counted qty
 *  - Variance calculation and approval
 *  - Post adjustments (stub) -> typically writes to Stock Ledger + Adjustments module
 *
 * Replace MOCK service with real API:
 *   /src/services/cycleCount.service.js
 */

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function safeNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "draft") return <Badge className="bg-gray-200 text-gray-900">Draft</Badge>;
  if (s === "in_progress") return <Badge className="bg-sky-600 text-white">In Progress</Badge>;
  if (s === "submitted") return <Badge className="bg-amber-500 text-white">Submitted</Badge>;
  if (s === "approved") return <Badge className="bg-emerald-600 text-white">Approved</Badge>;
  if (s === "posted") return <Badge className="bg-gray-900 text-white">Posted</Badge>;
  return <Badge className="bg-gray-200 text-gray-900">{status || "—"}</Badge>;
}

/** MOCK DATA */
const MOCK_SESSIONS = [
  {
    id: "cc_301",
    sessionNo: "CC-2026-0007",
    plant: "Plant A",
    warehouse: "Main Stores",
    scope: "A-Class",
    status: "in_progress",
    createdBy: "Store Admin",
    createdAt: "2026-01-04T09:10:00.000Z",
    updatedAt: "2026-01-04T12:30:00.000Z",
    lines: [
      {
        id: "ln_1",
        itemCode: "CU-FOIL-18UM",
        itemName: "Copper Foil 18µm",
        uom: "sqm",
        location: "R1-A-03",
        lot: "LOT-CU-2401-18",
        systemQty: 120.0,
        countedQty: 118.0,
        reason: "",
      },
      {
        id: "ln_2",
        itemCode: "PP-2116",
        itemName: "Prepreg 2116",
        uom: "sheets",
        location: "R1-B-01",
        lot: "LOT-PP-2116-0102",
        systemQty: 500,
        countedQty: 500,
        reason: "",
      },
    ],
  },
  {
    id: "cc_302",
    sessionNo: "CC-2026-0006",
    plant: "Plant A",
    warehouse: "Chem Store",
    scope: "Chemicals",
    status: "submitted",
    createdBy: "Kiran",
    createdAt: "2026-01-03T08:05:00.000Z",
    updatedAt: "2026-01-03T17:20:00.000Z",
    lines: [
      {
        id: "ln_1",
        itemCode: "CHEM-H2SO4",
        itemName: "Sulfuric Acid",
        uom: "L",
        location: "CHEM-02",
        lot: "LOT-ACID-1201",
        systemQty: 250,
        countedQty: 247,
        reason: "Evaporation / handling loss",
      },
    ],
  },
  {
    id: "cc_303",
    sessionNo: "CC-2025-0051",
    plant: "Plant A",
    warehouse: "Main Stores",
    scope: "Random",
    status: "posted",
    createdBy: "Admin",
    createdAt: "2025-12-22T10:00:00.000Z",
    updatedAt: "2025-12-22T18:00:00.000Z",
    lines: [],
  },
];

/** Mock service */
const cycleCountService = {
  async list() {
    await new Promise((r) => setTimeout(r, 250));
    return { data: [...MOCK_SESSIONS] };
  },
  async create(payload) {
    await new Promise((r) => setTimeout(r, 320));
    const n = String(Math.floor(Math.random() * 9000) + 1000);
    const id = `cc_${n}`;
    const sessionNo = `CC-2026-${n.padStart(4, "0")}`;
    const row = {
      id,
      sessionNo,
      plant: payload.plant || "Plant A",
      warehouse: payload.warehouse || "Main Stores",
      scope: payload.scope || "Random",
      status: "draft",
      createdBy: "You",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [],
    };
    MOCK_SESSIONS.unshift(row);
    return { data: row };
  },
  async remove(id) {
    await new Promise((r) => setTimeout(r, 260));
    const idx = MOCK_SESSIONS.findIndex((x) => x.id === id);
    if (idx >= 0) MOCK_SESSIONS.splice(idx, 1);
    return { ok: true };
  },
  async updateSession(id, patch) {
    await new Promise((r) => setTimeout(r, 280));
    const row = MOCK_SESSIONS.find((x) => x.id === id);
    if (!row) throw new Error("Not found");
    Object.assign(row, patch, { updatedAt: new Date().toISOString() });
    return { data: row };
  },
  async updateLine(sessionId, lineId, patch) {
    await new Promise((r) => setTimeout(r, 220));
    const sess = MOCK_SESSIONS.find((x) => x.id === sessionId);
    if (!sess) throw new Error("Not found");
    const line = (sess.lines || []).find((l) => l.id === lineId);
    if (!line) throw new Error("Line not found");
    Object.assign(line, patch);
    sess.updatedAt = new Date().toISOString();
    return { data: sess };
  },
  async addLine(sessionId, payload) {
    await new Promise((r) => setTimeout(r, 240));
    const sess = MOCK_SESSIONS.find((x) => x.id === sessionId);
    if (!sess) throw new Error("Not found");
    const id = `ln_${Math.floor(Math.random() * 9000) + 1000}`;
    const line = {
      id,
      itemCode: payload.itemCode || "",
      itemName: payload.itemName || "",
      uom: payload.uom || "pcs",
      location: payload.location || "",
      lot: payload.lot || "",
      systemQty: safeNum(payload.systemQty, 0),
      countedQty: safeNum(payload.countedQty, 0),
      reason: payload.reason || "",
    };
    sess.lines = [line, ...(sess.lines || [])];
    sess.updatedAt = new Date().toISOString();
    return { data: sess };
  },
  async submit(sessionId) {
    await new Promise((r) => setTimeout(r, 260));
    const sess = MOCK_SESSIONS.find((x) => x.id === sessionId);
    if (!sess) throw new Error("Not found");
    sess.status = "submitted";
    sess.updatedAt = new Date().toISOString();
    return { data: sess };
  },
  async approve(sessionId) {
    await new Promise((r) => setTimeout(r, 280));
    const sess = MOCK_SESSIONS.find((x) => x.id === sessionId);
    if (!sess) throw new Error("Not found");
    sess.status = "approved";
    sess.updatedAt = new Date().toISOString();
    return { data: sess };
  },
  async post(sessionId) {
    await new Promise((r) => setTimeout(r, 320));
    const sess = MOCK_SESSIONS.find((x) => x.id === sessionId);
    if (!sess) throw new Error("Not found");
    sess.status = "posted";
    sess.updatedAt = new Date().toISOString();
    return { data: sess };
  },
};

function variance(systemQty, countedQty) {
  const sys = safeNum(systemQty, 0);
  const cnt = safeNum(countedQty, 0);
  return cnt - sys;
}

function VarBadge({ v }) {
  const n = safeNum(v, 0);
  if (n === 0) return <Badge className="bg-gray-200 text-gray-900">0</Badge>;
  if (n > 0) return <Badge className="bg-emerald-600 text-white">+{n}</Badge>;
  return <Badge className="bg-red-600 text-white">{n}</Badge>;
}

export default function CycleCount() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  // list filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all|draft|in_progress|submitted|approved|posted
  const [scope, setScope] = useState("all"); // all|A-Class|Chemicals|Random etc
  const [sortBy, setSortBy] = useState("updated_desc");

  // create session (simple inline)
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlant, setNewPlant] = useState("Plant A");
  const [newWarehouse, setNewWarehouse] = useState("Main Stores");
  const [newScope, setNewScope] = useState("Random");

  // details pane
  const [activeId, setActiveId] = useState(null);
  const active = useMemo(() => sessions.find((s) => s.id === activeId) || null, [sessions, activeId]);

  // line add form
  const [lineItemCode, setLineItemCode] = useState("");
  const [lineItemName, setLineItemName] = useState("");
  const [lineUom, setLineUom] = useState("pcs");
  const [lineLocation, setLineLocation] = useState("");
  const [lineLot, setLineLot] = useState("");
  const [lineSystemQty, setLineSystemQty] = useState("");
  const [lineCountedQty, setLineCountedQty] = useState("");
  const [lineReason, setLineReason] = useState("");
  const [lineSaving, setLineSaving] = useState(false);

  // confirmations
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false); // submit/approve/post

  const load = async () => {
    setLoading(true);
    try {
      const res = await cycleCountService.list();
      const data = res.data || [];
      setSessions(data);
      if (!activeId && data[0]?.id) setActiveId(data[0].id);
    } catch {
      toast({ title: "Load failed", description: "Could not load cycle count sessions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scopes = useMemo(() => {
    const set = new Set(sessions.map((s) => s.scope).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [sessions]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = sessions.filter((s) => {
      const matchQ =
        !query ||
        String(s.sessionNo || "").toLowerCase().includes(query) ||
        String(s.warehouse || "").toLowerCase().includes(query) ||
        String(s.scope || "").toLowerCase().includes(query) ||
        String(s.createdBy || "").toLowerCase().includes(query);

      const matchStatus = status === "all" ? true : String(s.status) === status;
      const matchScope = scope === "all" ? true : String(s.scope) === scope;

      return matchQ && matchStatus && matchScope;
    });

    const byUpdated = (a, b) =>
      safeNum(new Date(a.updatedAt).getTime(), 0) - safeNum(new Date(b.updatedAt).getTime(), 0);

    if (sortBy === "updated_desc") out.sort((a, b) => byUpdated(b, a));
    if (sortBy === "updated_asc") out.sort((a, b) => byUpdated(a, b));
    if (sortBy === "created_desc")
      out.sort((a, b) => safeNum(new Date(b.createdAt).getTime(), 0) - safeNum(new Date(a.createdAt).getTime(), 0));

    return out;
  }, [sessions, q, status, scope, sortBy]);

  const kpis = useMemo(() => {
    const total = sessions.length;
    const inProg = sessions.filter((s) => s.status === "in_progress").length;
    const submitted = sessions.filter((s) => s.status === "submitted").length;
    const posted = sessions.filter((s) => s.status === "posted").length;
    return { total, inProg, submitted, posted };
  }, [sessions]);

  const openDelete = (sess) => {
    setDeleteTarget(sess);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try {
      await cycleCountService.remove(deleteTarget.id);
      setSessions((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      if (activeId === deleteTarget.id) setActiveId(null);
      toast({ title: "Deleted", description: "Cycle count session deleted." });
    } catch {
      toast({ title: "Delete failed", description: "Could not delete session.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const createSession = async () => {
    setCreating(true);
    try {
      const res = await cycleCountService.create({
        plant: newPlant,
        warehouse: newWarehouse,
        scope: newScope,
      });
      const row = res.data;
      setSessions((prev) => [row, ...prev]);
      setActiveId(row.id);
      setCreateOpen(false);
      toast({ title: "Created", description: `New session ${row.sessionNo} created.` });
    } catch {
      toast({ title: "Create failed", description: "Could not create session.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const addLine = async () => {
    if (!active?.id) return;

    if (!lineItemCode.trim() || !lineLocation.trim()) {
      toast({
        title: "Missing fields",
        description: "Item Code and Location are required.",
        variant: "destructive",
      });
      return;
    }

    setLineSaving(true);
    try {
      const res = await cycleCountService.addLine(active.id, {
        itemCode: lineItemCode.trim(),
        itemName: lineItemName.trim(),
        uom: lineUom.trim() || "pcs",
        location: lineLocation.trim(),
        lot: lineLot.trim(),
        systemQty: lineSystemQty,
        countedQty: lineCountedQty,
        reason: lineReason.trim(),
      });

      setSessions((prev) => prev.map((s) => (s.id === active.id ? res.data : s)));

      setLineItemCode("");
      setLineItemName("");
      setLineUom("pcs");
      setLineLocation("");
      setLineLot("");
      setLineSystemQty("");
      setLineCountedQty("");
      setLineReason("");

      toast({ title: "Line added", description: "Count line added to session." });
    } catch {
      toast({ title: "Failed", description: "Could not add count line.", variant: "destructive" });
    } finally {
      setLineSaving(false);
    }
  };

  const updateCountedQty = async (lineId, countedQty) => {
    if (!active?.id) return;
    try {
      const res = await cycleCountService.updateLine(active.id, lineId, {
        countedQty: safeNum(countedQty, 0),
      });
      setSessions((prev) => prev.map((s) => (s.id === active.id ? res.data : s)));
    } catch {
      toast({ title: "Update failed", description: "Could not update counted qty.", variant: "destructive" });
    }
  };

  const updateReason = async (lineId, reason) => {
    if (!active?.id) return;
    try {
      const res = await cycleCountService.updateLine(active.id, lineId, { reason });
      setSessions((prev) => prev.map((s) => (s.id === active.id ? res.data : s)));
    } catch {
      toast({ title: "Update failed", description: "Could not update reason.", variant: "destructive" });
    }
  };

  const doAction = async (action) => {
    if (!active?.id) return;

    setActionLoading(true);
    try {
      let res;
      if (action === "submit") res = await cycleCountService.submit(active.id);
      if (action === "approve") res = await cycleCountService.approve(active.id);
      if (action === "post") res = await cycleCountService.post(active.id);

      if (res?.data) {
        setSessions((prev) => prev.map((s) => (s.id === active.id ? res.data : s)));
      }

      const msg =
        action === "submit"
          ? "Submitted for approval."
          : action === "approve"
          ? "Approved successfully."
          : "Posted adjustments (ledger update).";

      toast({ title: "Success", description: msg });
    } catch {
      toast({ title: "Action failed", description: "Could not complete action.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const sessionTotals = useMemo(() => {
    const lines = active?.lines || [];
    const totalLines = lines.length;
    const variances = lines.map((l) => variance(l.systemQty, l.countedQty));
    const nonZero = variances.filter((v) => safeNum(v, 0) !== 0).length;
    const absSum = variances.reduce((a, v) => a + Math.abs(safeNum(v, 0)), 0);
    return { totalLines, nonZero, absSum };
  }, [active]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cycle Count</h1>
          <p className="mt-1 text-sm text-gray-600">
            Periodic inventory verification for PCB materials (copper foil, prepreg, laminates, chemicals, drills, etc.).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button className="gap-2 bg-[#DC2551] hover:bg-[#B02045]" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessions</CardTitle>
            <CardDescription>Total cycle counts</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{kpis.total}</div>
            <Badge className="bg-gray-900 text-white">
              <ClipboardList className="mr-1 h-4 w-4" />
              All
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
            <CardDescription>Ongoing counts</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{kpis.inProg}</div>
            <Badge className="bg-sky-600 text-white">
              <Warehouse className="mr-1 h-4 w-4" />
              Active
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Submitted</CardTitle>
            <CardDescription>Awaiting approval</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{kpis.submitted}</div>
            <Badge className="bg-amber-500 text-white">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Pending
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Posted</CardTitle>
            <CardDescription>Adjusted in ledger</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{kpis.posted}</div>
            <Badge className="bg-gray-900 text-white">
              <UploadCloud className="mr-1 h-4 w-4" />
              Posted
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left list */}
        <Card className="shadow-sm lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageSearch className="h-4 w-4 text-gray-700" />
              Sessions
            </CardTitle>
            <CardDescription>Choose a session to record count lines and variance reasons.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-6">
                <Label>Search</Label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    className="pl-9"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Session no, warehouse, scope, user…"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <Label>Status</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="posted">Posted</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <Label>Scope</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  {scopes.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All" : s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-6">
                <Label>Sort</Label>
                <select
                  className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DC2551]/20"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="updated_desc">Updated (newest)</option>
                  <option value="updated_asc">Updated (oldest)</option>
                  <option value="created_desc">Created (newest)</option>
                </select>
              </div>

              <div className="md:col-span-6 flex items-end">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setQ("");
                    setStatus("all");
                    setScope("all");
                    setSortBy("updated_desc");
                  }}
                >
                  <Filter className="h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-700">
                No sessions found.
                <div className="mt-3">
                  <Button className="bg-[#DC2551] hover:bg-[#B02045]" onClick={() => setCreateOpen(true)}>
                    Create Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => {
                  const selected = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      className={cx(
                        "w-full rounded-xl border p-3 text-left transition",
                        selected ? "border-[#DC2551] bg-[#DC2551]/5" : "hover:bg-gray-50"
                      )}
                      onClick={() => setActiveId(s.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{s.sessionNo}</span>
                            <StatusBadge status={s.status} />
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {s.plant} • {s.warehouse} • {s.scope}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openDelete(s);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>By {s.createdBy || "—"}</span>
                        <span>Updated: {fmtDate(s.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right details */}
        <Card className="shadow-sm lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Barcode className="h-4 w-4 text-gray-700" />
              Session Details
            </CardTitle>
            <CardDescription>
              Record counted quantities, review variances, submit for approval, and post adjustments.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {!active ? (
              <div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-700">
                Select a session from the left.
              </div>
            ) : (
              <>
                {/* Session meta */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-gray-900">{active.sessionNo}</div>
                        <StatusBadge status={active.status} />
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {active.plant} • {active.warehouse} • {active.scope}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {fmtDate(active.createdAt)} • Updated: {fmtDate(active.updatedAt)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={actionLoading || active.status === "posted"}
                        onClick={() =>
                          toast({
                            title: "Import (stub)",
                            description: "In real ERP, this imports count list by ABC class / bin / item group.",
                          })
                        }
                      >
                        <UploadCloud className="h-4 w-4" />
                        Import List
                      </Button>

                      {active.status === "draft" || active.status === "in_progress" ? (
                        <Button
                          className="gap-2 bg-[#DC2551] hover:bg-[#B02045]"
                          disabled={actionLoading}
                          onClick={() => doAction("submit")}
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Submit
                        </Button>
                      ) : null}

                      {active.status === "submitted" ? (
                        <Button
                          className="gap-2 bg-gray-900 hover:bg-black"
                          disabled={actionLoading}
                          onClick={() => doAction("approve")}
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve
                        </Button>
                      ) : null}

                      {active.status === "approved" ? (
                        <Button
                          className="gap-2 bg-gray-900 hover:bg-black"
                          disabled={actionLoading}
                          onClick={() => doAction("post")}
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                          Post
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Lines</div>
                      <div className="text-xl font-bold">{sessionTotals.totalLines}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Non-zero variances</div>
                      <div className="text-xl font-bold">{sessionTotals.nonZero}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Abs variance sum</div>
                      <div className="text-xl font-bold">{sessionTotals.absSum}</div>
                    </div>
                  </div>
                </div>

                {/* Add line */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">Add Count Line</div>
                      <div className="text-xs text-gray-500">Item + Location + Lot, then enter system vs counted.</div>
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        toast({
                          title: "Scan (stub)",
                          description: "In real ERP, barcode scan fills item/lot/location automatically.",
                        })
                      }
                    >
                      <Barcode className="h-4 w-4" />
                      Scan
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <Label>Item Code *</Label>
                      <Input className="mt-2" value={lineItemCode} onChange={(e) => setLineItemCode(e.target.value)} placeholder="e.g., CU-FOIL-18UM" />
                    </div>
                    <div className="md:col-span-4">
                      <Label>Item Name</Label>
                      <Input className="mt-2" value={lineItemName} onChange={(e) => setLineItemName(e.target.value)} placeholder="Copper Foil 18µm" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>UOM</Label>
                      <Input className="mt-2" value={lineUom} onChange={(e) => setLineUom(e.target.value)} placeholder="sqm / sheets / L" />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Location *</Label>
                      <Input className="mt-2" value={lineLocation} onChange={(e) => setLineLocation(e.target.value)} placeholder="R1-A-03" />
                    </div>

                    <div className="md:col-span-3">
                      <Label>Lot</Label>
                      <Input className="mt-2" value={lineLot} onChange={(e) => setLineLot(e.target.value)} placeholder="LOT-XXXX" />
                    </div>
                    <div className="md:col-span-3">
                      <Label>System Qty</Label>
                      <Input className="mt-2" value={lineSystemQty} onChange={(e) => setLineSystemQty(e.target.value)} placeholder="e.g., 120" />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Counted Qty</Label>
                      <Input className="mt-2" value={lineCountedQty} onChange={(e) => setLineCountedQty(e.target.value)} placeholder="e.g., 118" />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Reason (if variance)</Label>
                      <Input className="mt-2" value={lineReason} onChange={(e) => setLineReason(e.target.value)} placeholder="Damage, evaporation, scrap…" />
                    </div>

                    <div className="md:col-span-12 flex items-end justify-end">
                      <Button
                        className="gap-2 bg-[#DC2551] hover:bg-[#B02045]"
                        onClick={addLine}
                        disabled={lineSaving || active.status === "posted"}
                      >
                        {lineSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add Line
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lines table */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900">Count Lines</div>
                      <div className="text-xs text-gray-500">Edit counted qty and variance reason (autosave).</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-900">
                        <ArrowUpDown className="mr-1 h-4 w-4" />
                        Variance = Counted − System
                      </Badge>
                    </div>
                  </div>

                  {(active.lines || []).length === 0 ? (
                    <div className="mt-4 rounded-xl border bg-gray-50 p-6 text-sm text-gray-700">
                      No lines yet. Add a line or import a list.
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[920px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-gray-500">
                            <th className="py-2 pr-3">Item</th>
                            <th className="py-2 pr-3">Location</th>
                            <th className="py-2 pr-3">Lot</th>
                            <th className="py-2 pr-3">System</th>
                            <th className="py-2 pr-3">Counted</th>
                            <th className="py-2 pr-3">Var</th>
                            <th className="py-2 pr-3">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {active.lines.map((l) => {
                            const v = variance(l.systemQty, l.countedQty);
                            const locked = active.status === "posted";
                            return (
                              <tr key={l.id} className="border-b last:border-b-0">
                                <td className="py-3 pr-3">
                                  <div className="font-semibold text-gray-900">{l.itemCode}</div>
                                  <div className="text-xs text-gray-500">
                                    {l.itemName || "—"} • {l.uom}
                                  </div>
                                </td>
                                <td className="py-3 pr-3">
                                  <Badge className="bg-gray-100 text-gray-900">{l.location || "—"}</Badge>
                                </td>
                                <td className="py-3 pr-3">{l.lot || "—"}</td>
                                <td className="py-3 pr-3">
                                  <Badge className="bg-gray-900 text-white">{safeNum(l.systemQty, 0)}</Badge>
                                </td>
                                <td className="py-3 pr-3">
                                  <Input
                                    disabled={locked}
                                    className="h-9 w-32"
                                    defaultValue={safeNum(l.countedQty, 0)}
                                    onBlur={(e) => updateCountedQty(l.id, e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-3 pr-3">
                                  <VarBadge v={v} />
                                </td>
                                <td className="py-3 pr-3">
                                  <Input
                                    disabled={locked}
                                    className="h-9 min-w-[240px]"
                                    defaultValue={l.reason || ""}
                                    onBlur={(e) => updateReason(l.id, e.target.value)}
                                    placeholder={safeNum(v, 0) === 0 ? "—" : "Explain variance"}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="mt-3 text-xs text-gray-500">
                        Posting will create a stock adjustment entry for each non-zero variance line and update the stock ledger.
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Session Dialog */}
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Cycle Count Session</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the warehouse and scope. You can then import a count list or add lines manually.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plant</Label>
              <Input value={newPlant} onChange={(e) => setNewPlant(e.target.value)} placeholder="Plant A" />
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Input value={newWarehouse} onChange={(e) => setNewWarehouse(e.target.value)} placeholder="Main Stores" />
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <Input value={newScope} onChange={(e) => setNewScope(e.target.value)} placeholder="A-Class / Chemicals / Random" />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={createSession}
              className="bg-[#DC2551] hover:bg-[#B02045]"
              disabled={creating}
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-gray-900">{deleteTarget?.sessionNo}</span>. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
