// src/pages/production/work-orders/WorkOrderDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Barcode,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  Factory,
  FileText,
  Flag,
  Hash,
  Layers,
  Package,
  PauseCircle,
  PlayCircle,
  Printer,
  RefreshCw,
  ShieldCheck,
  Tag,
  Timer,
  Trash2,
  UserCircle2,
  Wrench,
  AlertTriangle,
  ScanLine,
  Route,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDT(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatDate(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

function StatusPill({ status }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold";
  if (status === "In Progress") {
    return (
      <span className={cx(base, "bg-blue-50 text-blue-700")}>
        <PlayCircle className="h-4 w-4" />
        In Progress
      </span>
    );
  }
  if (status === "Completed") {
    return (
      <span className={cx(base, "bg-emerald-50 text-emerald-700")}>
        <CheckCircle2 className="h-4 w-4" />
        Completed
      </span>
    );
  }
  if (status === "On Hold") {
    return (
      <span className={cx(base, "bg-amber-50 text-amber-700")}>
        <PauseCircle className="h-4 w-4" />
        On Hold
      </span>
    );
  }
  if (status === "Cancelled") {
    return (
      <span className={cx(base, "bg-red-50 text-red-700")}>
        <Flag className="h-4 w-4" />
        Cancelled
      </span>
    );
  }
  return (
    <span className={cx(base, "bg-gray-100 text-gray-700")}>
      <Timer className="h-4 w-4" />
      Planned
    </span>
  );
}

function PriorityPill({ priority }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold";
  if (priority === "Critical") return <span className={cx(base, "bg-red-50 text-red-700")}>Critical</span>;
  if (priority === "High") return <span className={cx(base, "bg-amber-50 text-amber-700")}>High</span>;
  return <span className={cx(base, "bg-gray-100 text-gray-700")}>Normal</span>;
}

function MiniStat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 truncate text-sm font-semibold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50 text-gray-700">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function Tab({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cx(
          "rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive ? "bg-[#dc2551]/10 text-[#dc2551]" : "text-gray-600 hover:bg-gray-100"
        )
      }
    >
      {label}
    </NavLink>
  );
}

/**
 * PCBxpress – Work Order Details
 * Hook backend later:
 * - GET  /production/work-orders/:id
 * - GET  /production/work-orders/:id/routing
 * - GET  /production/work-orders/:id/wip-events
 * - POST /production/work-orders/:id/start
 * - POST /production/work-orders/:id/hold
 * - POST /production/work-orders/:id/release
 * - POST /production/work-orders/:id/complete
 * - GET  /production/work-orders/:id/export (pdf)
 */

export default function WorkOrderDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();

  // if you route like /production/work-orders/:id/details
  const workOrderId = params?.id || "WO-24046";

  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState("hold"); // start | hold | release | complete | cancel
  const [note, setNote] = useState("");

  // Demo data
  const [wo, setWo] = useState(null);

  useEffect(() => {
    // initial fetch
    const load = async () => {
      setLoading(true);
      try {
        // Hook API call here
        await new Promise((r) => setTimeout(r, 450));

        setWo({
          id: workOrderId,
          workOrderNo: workOrderId,
          status: "On Hold",
          priority: "Critical",
          plant: "Main Plant",
          customer: "Raven Systems",
          poNo: "PO-7712",
          partNo: "RVN-MCU-BASE",
          revision: "R3",
          layers: 4,
          boardSize: "120mm × 85mm",
          finish: "ENIG",
          solderMask: "Green",
          legend: "White",
          thickness: "1.6mm",
          copper: "1oz",
          qty: 110,
          panelQty: 10,
          panels: 11,
          dueDate: "2026-01-08T17:30:00",
          createdAt: "2026-01-02T10:05:00",
          createdBy: "Planner",
          currentStage: "E-Test",
          currentMachine: "ET-02",
          routeName: "4L Standard – ENIG",
          tags: ["E-Test", "Critical", "Priority Customer"],
          lastHold: {
            holdId: "HOLD-0016",
            heldAt: "2026-01-05T10:25:00",
            reason: "Open/Short suspected on net group B; isolate panels and verify fixture.",
            owner: "Test Engineer",
          },
          docs: [
            { name: "Job Traveler", type: "PDF", kind: "traveler" },
            { name: "Panel Drawing", type: "PDF", kind: "panel_drawing" },
            { name: "Stackup Sheet", type: "PDF", kind: "stackup" },
            { name: "E-Test Report", type: "PDF", kind: "etest" },
          ],
          routing: [
            { step: 10, stage: "CAM Prep", owner: "CAM", status: "Done", startedAt: "2026-01-02T11:10:00", endedAt: "2026-01-02T13:10:00" },
            { step: 20, stage: "Imaging", owner: "Production", status: "Done", startedAt: "2026-01-03T09:00:00", endedAt: "2026-01-03T12:20:00" },
            { step: 30, stage: "Etching", owner: "Production", status: "Done", startedAt: "2026-01-03T13:30:00", endedAt: "2026-01-03T15:30:00" },
            { step: 40, stage: "Drilling", owner: "Production", status: "Done", startedAt: "2026-01-04T09:10:00", endedAt: "2026-01-04T12:05:00" },
            { step: 50, stage: "Plating", owner: "Production", status: "Done", startedAt: "2026-01-04T13:00:00", endedAt: "2026-01-04T18:00:00" },
            { step: 60, stage: "Solder Mask", owner: "Production", status: "In Progress", startedAt: "2026-01-05T08:20:00", endedAt: null },
            { step: 70, stage: "AOI", owner: "Quality", status: "Pending", startedAt: null, endedAt: null },
            { step: 80, stage: "E-Test", owner: "Quality", status: "Hold", startedAt: "2026-01-05T10:10:00", endedAt: null },
            { step: 90, stage: "Final QC", owner: "Quality", status: "Pending", startedAt: null, endedAt: null },
          ],
          wipEvents: [
            { at: "2026-01-05T10:25:00", type: "HOLD", by: "Test Engineer", note: "Suspected opens; fixture check.", stage: "E-Test" },
            { at: "2026-01-05T08:20:00", type: "MOVE", by: "Shift Lead", note: "Moved to solder mask line.", stage: "Solder Mask" },
            { at: "2026-01-04T18:05:00", type: "MOVE", by: "Shift Lead", note: "Moved to plating complete.", stage: "Plating" },
            { at: "2026-01-02T10:05:00", type: "CREATE", by: "Planner", note: "WO released to shopfloor.", stage: "Planning" },
          ],
        });
      } catch {
        toast({ title: "Load failed", description: "Could not load work order.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId]);

  const dueIn = useMemo(() => {
    if (!wo?.dueDate) return "";
    const mins = Math.floor((new Date(wo.dueDate).getTime() - Date.now()) / 60000);
    const sign = mins < 0 ? "-" : "";
    return `${sign}${durationLabel(Math.abs(mins))}`;
  }, [wo]);

  const openConfirm = (mode) => {
    setConfirmMode(mode);
    setNote("");
    setConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (!wo) return;

    setConfirmOpen(false);
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 600));

      if (confirmMode === "start") setWo((p) => ({ ...p, status: "In Progress" }));
      if (confirmMode === "hold") setWo((p) => ({ ...p, status: "On Hold" }));
      if (confirmMode === "release") setWo((p) => ({ ...p, status: "In Progress" }));
      if (confirmMode === "complete") setWo((p) => ({ ...p, status: "Completed" }));
      if (confirmMode === "cancel") setWo((p) => ({ ...p, status: "Cancelled" }));

      toast({
        title:
          confirmMode === "start"
            ? "Work started"
            : confirmMode === "hold"
            ? "Placed on hold"
            : confirmMode === "release"
            ? "Released from hold"
            : confirmMode === "complete"
            ? "Completed"
            : "Cancelled",
        description: note ? `Note saved: ${note}` : "Status updated successfully.",
      });
    } catch {
      toast({ title: "Action failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () =>
    toast({ title: "Export", description: "Hook to API: export traveler/WO PDF." });

  const printTraveler = () =>
    toast({ title: "Print", description: "Hook to printing service: traveler label / traveler PDF." });

  const goToHoldScreen = () => navigate("/production/wip/hold-release");

  if (!wo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Work Order Details</h1>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
              Loading work order...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production • Work Order</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{wo.workOrderNo}</h1>
              <StatusPill status={wo.status} />
              <PriorityPill priority={wo.priority} />
              <Badge variant="secondary">{wo.currentStage}</Badge>
              <Badge variant="secondary">{wo.plant}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {wo.customer} • {wo.partNo} • Rev {wo.revision}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={exportPdf}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2" onClick={printTraveler}>
            <Printer className="h-4 w-4" />
            Print Traveler
          </Button>

          {wo.status === "Planned" && (
            <Button className="bg-[#dc2551] hover:bg-[#b02045] gap-2" onClick={() => openConfirm("start")} disabled={loading}>
              <PlayCircle className="h-4 w-4" />
              Start
            </Button>
          )}

          {wo.status !== "Completed" && wo.status !== "Cancelled" && (
            <>
              {wo.status === "On Hold" ? (
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => openConfirm("release")} disabled={loading}>
                  <PlayCircle className="h-4 w-4" />
                  Release
                </Button>
              ) : (
                <Button variant="outline" className="gap-2" onClick={() => openConfirm("hold")} disabled={loading}>
                  <PauseCircle className="h-4 w-4" />
                  Hold
                </Button>
              )}

              <Button className="bg-gray-900 hover:bg-gray-900 gap-2" onClick={() => openConfirm("complete")} disabled={loading}>
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>

              <Button variant="destructive" className="gap-2" onClick={() => openConfirm("cancel")} disabled={loading}>
                <Trash2 className="h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Package} label="Quantity" value={`${wo.qty} boards`} hint={`${wo.panels} panels • ${wo.panelQty} boards/panel`} />
        <MiniStat icon={Calendar} label="Due Date" value={formatDate(wo.dueDate)} hint={`Due in ${dueIn}`} />
        <MiniStat icon={Layers} label="Build" value={`${wo.layers} layers • ${wo.thickness}`} hint={`${wo.copper} • ${wo.finish}`} />
        <MiniStat icon={Wrench} label="Current Machine" value={wo.currentMachine || "—"} hint={`Route: ${wo.routeName}`} />
      </div>

      {/* Tabs (single-page feel; still helpful for routing later) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Work Order Workspace</CardTitle>
          <CardDescription>Traveler, routing steps, WIP log, traceability references.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs row (not required to be nested routes) */}
          <div className="flex flex-wrap items-center gap-2">
            <Tab to="" label="Overview" />
            <Tab to="routing" label="Routing" />
            <Tab to="wip-log" label="WIP Log" />
            <Tab to="docs" label="Documents" />
            <Tab to="trace" label="Traceability" />
          </div>

          {/* OVERVIEW */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Left: Technical build */}
              <Card className="shadow-none lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-600" />
                    Build Specs
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Board Size</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{wo.boardSize}</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Finish</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{wo.finish}</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Solder Mask</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{wo.solderMask}</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Legend</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{wo.legend}</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Copper</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{wo.copper}</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thickness</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{wo.thickness}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Administrative & Hold */}
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-gray-600" />
                    Administrative
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer PO</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{wo.poNo}</p>
                  </div>

                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{formatDT(wo.createdAt)}</Badge>
                      <Badge variant="secondary">
                        <UserCircle2 className="mr-1 h-3.5 w-3.5" />
                        {wo.createdBy}
                      </Badge>
                    </div>
                  </div>

                  {wo.lastHold ? (
                    <div className="rounded-2xl border bg-amber-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Active Hold</p>
                          <p className="mt-2 text-sm font-semibold text-gray-900">{wo.lastHold.reason}</p>
                          <p className="mt-1 text-xs text-gray-700">
                            By <span className="font-semibold">{wo.lastHold.owner}</span> at{" "}
                            <span className="font-semibold">{formatDT(wo.lastHold.heldAt)}</span>
                          </p>
                        </div>
                        <Button variant="outline" className="gap-2" onClick={goToHoldScreen}>
                          <ExternalLink className="h-4 w-4" />
                          Open Holds
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(wo.tags ?? []).map((t) => (
                        <Badge key={t} className="bg-gray-900 hover:bg-gray-900">
                          <Tag className="mr-1 h-3.5 w-3.5" />
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Routing snapshot */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Route className="h-4 w-4 text-gray-600" />
                    Routing Snapshot
                  </CardTitle>
                  <CardDescription>Quick view of step progress.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {wo.routing.slice(0, 6).map((s) => {
                    const isHold = s.status === "Hold";
                    const isDone = s.status === "Done";
                    const isIP = s.status === "In Progress";
                    const pill =
                      isHold ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Hold</span>
                      ) : isDone ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Done</span>
                      ) : isIP ? (
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">In progress</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">Pending</span>
                      );

                    return (
                      <div key={s.step} className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {s.step}. {s.stage}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Owner: {s.owner} {s.startedAt ? `• Started ${formatDT(s.startedAt)}` : ""}
                          </p>
                        </div>
                        {pill}
                      </div>
                    );
                  })}

                  <div className="pt-1">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => toast({ title: "Routing", description: "Hook route to /production/work-orders/:id/routing" })}
                    >
                      View Full Routing
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-gray-600" />
                    Traceability Quick Actions
                  </CardTitle>
                  <CardDescription>Scan labels, print barcodes, open genealogy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => toast({ title: "Scan", description: "Hook scanner for panel/lot barcode." })}
                    >
                      <Barcode className="h-4 w-4" />
                      Scan Lot/Panel
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => toast({ title: "Print", description: "Hook label printing: lot/panel labels." })}
                    >
                      <Printer className="h-4 w-4" />
                      Print Labels
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => toast({ title: "Genealogy", description: "Route to /traceability/lot-genealogy" })}
                    >
                      <Hash className="h-4 w-4" />
                      Lot Genealogy
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => toast({ title: "QC", description: "Route to /quality/inspections" })}
                    >
                      <BadgeCheck className="h-4 w-4" />
                      QC Checks
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                    Tip: Connect labels to lot/panel serialization so every scan shows current stage + hold status.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* WIP events */}
            <div className="mt-4">
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    Recent WIP Events
                  </CardTitle>
                  <CardDescription>Latest movements, holds, and updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {wo.wipEvents.map((e, idx) => {
                    const isHold = e.type === "HOLD";
                    const pill = isHold ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Hold</span>
                    ) : e.type === "MOVE" ? (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Move</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">Create</span>
                    );

                    return (
                      <div key={`${e.at}-${idx}`} className="flex items-start justify-between gap-3 rounded-2xl border bg-white p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{e.stage}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDT(e.at)} • {e.by}
                          </p>
                          <p className="mt-2 text-xs text-gray-700">{e.note}</p>
                        </div>
                        {pill}
                      </div>
                    );
                  })}

                  <div className="pt-1">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => toast({ title: "WIP Log", description: "Hook route to /production/wip/history" })}
                    >
                      View Full WIP History
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents */}
            <div className="mt-4">
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Documents
                  </CardTitle>
                  <CardDescription>Traveler pack and inspection reports.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {wo.docs.map((d) => (
                    <div key={d.kind} className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{d.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{d.type}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => toast({ title: "Open document", description: `Hook viewer for: ${d.name}` })}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMode === "start"
                ? "Start work order?"
                : confirmMode === "hold"
                ? "Place on hold?"
                : confirmMode === "release"
                ? "Release from hold?"
                : confirmMode === "complete"
                ? "Complete work order?"
                : "Cancel work order?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update status for <span className="font-semibold">{wo.workOrderNo}</span>. Add a note for traceability.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., Hold due to E-test fixture check..." />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={cx(
                confirmMode === "release"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : confirmMode === "complete"
                  ? "bg-gray-900 hover:bg-gray-900"
                  : confirmMode === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {confirmMode === "start" ? "Start" : confirmMode === "hold" ? "Hold" : confirmMode === "release" ? "Release" : confirmMode === "complete" ? "Complete" : "Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
