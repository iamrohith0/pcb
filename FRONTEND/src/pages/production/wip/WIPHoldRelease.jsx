// src/pages/production/wip/WIPHoldRelease.jsx
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    Factory,
    Filter,
    PauseCircle,
    PlayCircle,
    RefreshCw,
    Search,
    ShieldCheck,
    Tag,
    UserCircle2,
    Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress – WIP Hold & Release
 * - Left: list of current holds (filter/search)
 * - Right: hold details + actions (Release / Convert to Rework / Scrap)
 *
 * Hook to backend later:
 * - GET  /production/wip/holds?plant=&q=&reason=&stage=
 * - POST /production/wip/holds/:id/release   { releaseNote }
 * - POST /production/wip/holds/:id/rework    { reworkRoute?, note }
 * - POST /production/wip/holds/:id/scrap     { qty, note }
 */

const PLANTS = ["Main Plant", "Plant-2", "Proto Lab"];

const STAGES = [
  "CAM Prep",
  "Imaging",
  "Etching",
  "Drilling",
  "Plating",
  "Solder Mask",
  "AOI",
  "E-Test",
  "Final QC",
];

const HOLD_REASONS = [
  "Copper thickness variation",
  "Open/Short suspected",
  "Solder mask defect",
  "Drill misregistration",
  "Customer data issue",
  "Panel warpage",
  "AOI false call verification",
  "Machine parameter check",
];

function formatDT(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function minutesSince(d) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  return Math.max(0, mins);
}

function durationLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function priorityBadge(p) {
  const base = "rounded-full px-2 py-1 text-[11px] font-semibold";
  if (p === "Critical") return <span className={cx(base, "bg-red-50 text-red-700")}>Critical</span>;
  if (p === "High") return <span className={cx(base, "bg-amber-50 text-amber-700")}>High</span>;
  return <span className={cx(base, "bg-gray-100 text-gray-700")}>Normal</span>;
}

function statusBadge() {
  return (
    <Badge className="bg-amber-600 hover:bg-amber-600">
      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
      On Hold
    </Badge>
  );
}

function ListRow({ row, selected, onSelect }) {
  const mins = minutesSince(row.heldAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      className={cx(
        "w-full rounded-2xl border p-3 text-left transition",
        selected ? "border-[#dc2551] bg-[#dc2551]/5" : "bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "grid h-8 w-8 place-items-center rounded-xl",
                selected ? "bg-[#dc2551] text-white" : "bg-gray-100 text-gray-700"
              )}
            >
              <PauseCircle className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{row.workOrderNo}</p>
              <p className="truncate text-xs text-gray-500">
                {row.customer} • {row.partNo}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{row.plant}</Badge>
            <Badge variant="secondary">{row.stage}</Badge>
            <Badge variant="secondary">Lot {row.lotNo}</Badge>
            <Badge variant="secondary">Qty {row.qty}</Badge>
            {row.tags?.slice(0, 2)?.map((t) => (
              <Badge key={t} className="bg-gray-900 hover:bg-gray-900">
                <Tag className="mr-1 h-3.5 w-3.5" />
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-500">Held</p>
          <p className="text-xs font-semibold text-gray-900">{formatDT(row.heldAt)}</p>
          <div className="mt-2 flex items-center justify-end gap-2">
            {priorityBadge(row.priority)}
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              {durationLabel(mins)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 line-clamp-2 text-xs text-gray-600">
        <span className="font-semibold text-gray-800">Reason: </span>
        {row.reason}
      </div>
    </button>
  );
}

export default function WIPHoldRelease() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // Filters
  const [plant, setPlant] = useState("Main Plant");
  const [stage, setStage] = useState("all");
  const [reason, setReason] = useState("all");
  const [q, setQ] = useState("");

  // Actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionMode, setActionMode] = useState("release"); // release | rework | scrap
  const [actionNote, setActionNote] = useState("");

  // Selection
  const [selectedId, setSelectedId] = useState("HOLD-0007");

  // Demo data
  const [rows, setRows] = useState(() => [
    {
      id: "HOLD-0007",
      workOrderNo: "WO-24033",
      customer: "Helio Tech",
      partNo: "HEL-IO-LOGIC",
      plant: "Main Plant",
      stage: "Plating",
      lotNo: "LOT-33A",
      qty: 60,
      priority: "High",
      heldAt: "2026-01-04T18:20:00",
      reason: "Copper thickness variation – re-check bath parameters.",
      tags: ["Quality", "Plating"],
      owner: "QC Lead",
      machine: "PLT-01",
      evidence: "Micrometer readings show variance near edge; bath log needs verification.",
    },
    {
      id: "HOLD-0011",
      workOrderNo: "WO-24041",
      customer: "ByteWave",
      partNo: "BW-SENSOR-FLEX",
      plant: "Main Plant",
      stage: "CAM Prep",
      lotNo: "LOT-41B",
      qty: 40,
      priority: "Normal",
      heldAt: "2026-01-03T11:10:00",
      reason: "Missing drill file in customer package; request updated data.",
      tags: ["Customer", "CAM"],
      owner: "Sales",
      machine: "—",
      evidence: "Gerber set received without drill; pending customer response.",
    },
    {
      id: "HOLD-0016",
      workOrderNo: "WO-24046",
      customer: "Raven Systems",
      partNo: "RVN-MCU-BASE",
      plant: "Main Plant",
      stage: "E-Test",
      lotNo: "LOT-46C",
      qty: 110,
      priority: "Critical",
      heldAt: "2026-01-05T10:25:00",
      reason: "Open/Short suspected on net group B; isolate panels and verify fixture.",
      tags: ["E-Test", "Critical"],
      owner: "Test Engineer",
      machine: "ET-02",
      evidence: "Fail pattern repeats on 6 panels; fixture pin wear suspected.",
    },
  ]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows
      .filter((r) => r.plant === plant)
      .filter((r) => (stage === "all" ? true : r.stage === stage))
      .filter((r) => (reason === "all" ? true : r.reason.toLowerCase().includes(reason.toLowerCase())))
      .filter((r) => {
        if (!qq) return true;
        return (
          r.workOrderNo.toLowerCase().includes(qq) ||
          r.customer.toLowerCase().includes(qq) ||
          r.partNo.toLowerCase().includes(qq) ||
          r.lotNo.toLowerCase().includes(qq)
        );
      })
      .sort((a, b) => new Date(b.heldAt).getTime() - new Date(a.heldAt).getTime());
  }, [rows, plant, stage, reason, q]);

  useEffect(() => {
    // keep selection valid
    const exists = filtered.some((x) => x.id === selectedId);
    if (!exists && filtered.length) setSelectedId(filtered[0].id);
    if (!filtered.length) setSelectedId("");
  }, [filtered, selectedId]);

  const refresh = async () => {
    setLoading(true);
    try {
      // Hook API here
      await new Promise((r) => setTimeout(r, 450));
      toast({ title: "Holds refreshed", description: "Latest hold list loaded." });
    } catch {
      toast({ title: "Refresh failed", description: "Could not load holds.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (mode) => {
    setActionMode(mode);
    setActionNote("");
    setConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (!selected) return;

    setConfirmOpen(false);
    setLoading(true);

    try {
      // Hook API call here based on actionMode.
      await new Promise((r) => setTimeout(r, 550));

      if (actionMode === "release") {
        setRows((prev) => prev.filter((x) => x.id !== selected.id));
        toast({
          title: "Released",
          description: `${selected.workOrderNo} released from hold and returned to WIP.`,
        });
      } else if (actionMode === "rework") {
        setRows((prev) => prev.filter((x) => x.id !== selected.id));
        toast({
          title: "Sent to Rework",
          description: `${selected.workOrderNo} moved to rework flow.`,
        });
      } else {
        setRows((prev) => prev.filter((x) => x.id !== selected.id));
        toast({
          title: "Scrapped",
          description: `${selected.workOrderNo} marked as scrap (partial/complete).`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Action failed",
        description: "Could not update hold state. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const headerStats = useMemo(() => {
    const total = filtered.length;
    const critical = filtered.filter((x) => x.priority === "Critical").length;
    const high = filtered.filter((x) => x.priority === "High").length;
    return { total, critical, high };
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <span className="text-sm">←</span>
            Back
          </Button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production</p>
            <h1 className="text-xl font-bold text-gray-900">WIP Hold & Release</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage holds from critical process stages (Quality, CAM, AOI/E-Test) with clear accountability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => toast({ title: "Export", description: "Hook to API: export holds CSV/Excel." })}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button onClick={refresh} className="bg-cyan-600 hover:bg-cyan-500 gap-2" disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            Filters
          </CardTitle>
          <CardDescription>Filter holds by plant, stage, reason and keyword.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <Label className="text-xs text-gray-500">Plant</Label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
            >
              {PLANTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs text-gray-500">Stage</Label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
            >
              <option value="all">All stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs text-gray-500">Reason (quick)</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
            >
              <option value="all">All reasons</option>
              {HOLD_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs text-gray-500">Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="WO / Customer / Part / Lot"
                className="pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-12">
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{headerStats.total} holds</Badge>
              <Badge className="bg-red-600 hover:bg-red-600">{headerStats.critical} critical</Badge>
              <Badge className="bg-amber-600 hover:bg-amber-600">{headerStats.high} high</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Holds list */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Holds</CardTitle>
            <CardDescription>Pick one to review and release / rework / scrap.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-700">No holds found</p>
                <p className="mt-1 text-xs text-gray-500">Try changing plant or filters.</p>
              </div>
            ) : (
              filtered.map((r) => (
                <ListRow key={r.id} row={r} selected={r.id === selectedId} onSelect={setSelectedId} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Details + Actions */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Hold Details</CardTitle>
                <CardDescription>
                  {selected ? (
                    <>
                      <span className="font-semibold text-gray-800">{selected.workOrderNo}</span> • {selected.customer} •{" "}
                      {selected.partNo}
                    </>
                  ) : (
                    "Select a hold to view details."
                  )}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selected ? (
                  <>
                    {statusBadge()}
                    {priorityBadge(selected.priority)}
                    <Badge variant="secondary">{selected.stage}</Badge>
                    <Badge variant="secondary">Lot {selected.lotNo}</Badge>
                    <Badge variant="secondary">Qty {selected.qty}</Badge>
                  </>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {!selected ? (
              <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-700">No selection</p>
                <p className="mt-1 text-xs text-gray-500">Choose a hold record from the list.</p>
              </div>
            ) : (
              <>
                {/* Key info */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plant</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Factory className="h-4 w-4 text-gray-600" />
                      {selected.plant}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Owner</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <UserCircle2 className="h-4 w-4 text-gray-600" />
                      {selected.owner || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Machine</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-600" />
                      {selected.machine || "—"}
                    </p>
                  </div>
                </div>

                {/* Reason + Evidence */}
                <div className="rounded-2xl border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{selected.reason}</p>

                  {selected.evidence ? (
                    <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                      <p className="font-semibold text-gray-800">Evidence / Notes</p>
                      <p className="mt-1">{selected.evidence}</p>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selected.tags ?? []).map((t) => (
                      <Badge key={t} className="bg-gray-900 hover:bg-gray-900">
                        <Tag className="mr-1 h-3.5 w-3.5" />
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Held timing */}
                <div className="rounded-2xl border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Held at</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{formatDT(selected.heldAt)}</Badge>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      <Clock className="h-4 w-4" />
                      {durationLabel(minutesSince(selected.heldAt))} on hold
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="rounded-2xl border bg-white p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Actions</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Release will return the lot to the queue. Rework will route it for corrective processing. Scrap is irreversible.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                        onClick={() => openConfirm("release")}
                        disabled={loading}
                      >
                        <PlayCircle className="h-4 w-4" />
                        Release
                      </Button>

                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => openConfirm("rework")}
                        disabled={loading}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Convert to Rework
                      </Button>

                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => openConfirm("scrap")}
                        disabled={loading}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Scrap
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick links (optional) */}
                <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-800">Next improvements</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li>Link holds to NCR/CAPA IDs and show attachments (AOI image, measurement sheet, etc.).</li>
                    <li>Add role-based approvals for releasing “Critical” holds (QA manager).</li>
                    <li>Support partial release (split lot) and automatic WIP movement logs.</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionMode === "release"
                ? "Release from hold?"
                : actionMode === "rework"
                ? "Convert to rework?"
                : "Mark as scrap?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected ? (
                <>
                  This will update <span className="font-semibold">{selected.workOrderNo}</span> • Lot{" "}
                  <span className="font-semibold">{selected.lotNo}</span>. Please add a note for traceability.
                </>
              ) : (
                "Please select a hold first."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label>Action note</Label>
            <Input
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="e.g., Bath parameters corrected and verified..."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={cx(
                actionMode === "release"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : actionMode === "rework"
                  ? "bg-gray-900 hover:bg-gray-900"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {actionMode === "release" ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Release
                </span>
              ) : actionMode === "rework" ? (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Move to Rework
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Scrap
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
