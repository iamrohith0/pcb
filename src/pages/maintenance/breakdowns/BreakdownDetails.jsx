// src/pages/maintenance/breakdowns/BreakdownDetails.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  Cpu,
  Download,
  FileText,
  HardHat,
  MapPin,
  Pencil,
  Save,
  Settings2,
  ShieldCheck,
  Timer,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

/**
 * BreakdownDetails.jsx (PCBxpress - Maintenance / Breakdowns)
 * Route suggestion:
 *  - /maintenance/breakdowns/:id
 *
 * Hook points (recommended service):
 *  - breakdownsService.get(id)
 *  - breakdownsService.update(id, payload)
 *  - breakdownsService.close(id, payload)
 *  - breakdownsService.assign(id, { assignee_id })
 *  - breakdownsService.delete(id)
 *  - breakdownsService.exportPdf(id)
 *
 * Notes:
 *  - This file is UI-first with MOCK data and local state.
 *  - Replace mocked calls with real API integration later.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = {
  open: { label: "Open", tone: "amber" },
  in_progress: { label: "In Progress", tone: "blue" },
  waiting_spares: { label: "Waiting Spares", tone: "gray" },
  resolved: { label: "Resolved", tone: "green" },
  closed: { label: "Closed", tone: "green" },
};

const PRIORITY = {
  low: { label: "Low", tone: "gray" },
  medium: { label: "Medium", tone: "blue" },
  high: { label: "High", tone: "amber" },
  critical: { label: "Critical", tone: "red" },
};

function Badge({ tone = "gray", children }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  };
  return <span className={cx(base, tones[tone] || tones.gray)}>{children}</span>;
}

const MOCK = {
  id: "bd-1021",
  breakdownNo: "BD-0001021",
  status: "in_progress",
  priority: "high",
  reportedAt: "2026-01-06 09:20",
  plant: "Plant-01",
  area: "Drill Bay",
  line: "Line-D",
  equipment: {
    id: "eq-011",
    code: "DRL-05",
    name: "CNC Drill Machine #05",
    category: "Drilling",
    make: "Schmoll",
    model: "MXY-2",
  },
  symptom: "Spindle vibration + abnormal noise",
  suspectedCause: "Worn bearing / imbalance",
  safetyImpact: "Medium",
  downtimeStart: "2026-01-06 09:10",
  downtimeEnd: null,
  assignedTo: { id: "u-22", name: "Arun (Maintenance)" },
  createdBy: { id: "u-7", name: "Line Supervisor" },
  spareRequirement: "Bearing set (spindle), lubrication kit",
  correctiveAction: "Inspected spindle assembly, planned bearing replacement",
  rootCause: "",
  preventiveAction: "",
  notes: [
    { at: "2026-01-06 09:30", by: "Arun", text: "Machine stopped, initial inspection done. Vibration observed." },
    { at: "2026-01-06 10:05", by: "Arun", text: "Requested bearing set from spares. Cleaning + lubrication done." },
  ],
  attachments: [
    { id: "att-1", name: "vibration-video.mp4", type: "video" },
    { id: "att-2", name: "inspection-photo.jpg", type: "image" },
  ],
};

export default function BreakdownDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const [data, setData] = useState(null);

  // Editable fields
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [symptom, setSymptom] = useState("");
  const [suspectedCause, setSuspectedCause] = useState("");
  const [spareRequirement, setSpareRequirement] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");

  // Add note
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // TODO: Replace with breakdownsService.get(id)
    setLoading(true);
    const t = setTimeout(() => {
      const payload = { ...MOCK, id: id || MOCK.id };
      setData(payload);

      setStatus(payload.status);
      setPriority(payload.priority);
      setSymptom(payload.symptom || "");
      setSuspectedCause(payload.suspectedCause || "");
      setSpareRequirement(payload.spareRequirement || "");
      setCorrectiveAction(payload.correctiveAction || "");
      setRootCause(payload.rootCause || "");
      setPreventiveAction(payload.preventiveAction || "");

      setLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, [id]);

  const statusMeta = STATUS[status] || STATUS.open;
  const priorityMeta = PRIORITY[priority] || PRIORITY.medium;

  const downtimeMins = useMemo(() => {
    if (!data?.downtimeStart) return null;
    // Lightweight UI calc (not timezone-aware). Backend should compute authoritative downtime.
    const start = new Date((data.downtimeStart || "").replace(" ", "T"));
    const endStr = data.downtimeEnd || null;
    const end = endStr ? new Date(endStr.replace(" ", "T")) : new Date();
    const ms = end.getTime() - start.getTime();
    if (Number.isNaN(ms) || ms < 0) return null;
    return Math.round(ms / 60000);
  }, [data]);

  const downtimeLabel = useMemo(() => {
    if (downtimeMins == null) return "—";
    const h = Math.floor(downtimeMins / 60);
    const m = downtimeMins % 60;
    if (h <= 0) return `${m} min`;
    return `${h}h ${m}m`;
  }, [downtimeMins]);

  const applyEditsToData = () => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status,
        priority,
        symptom,
        suspectedCause,
        spareRequirement,
        correctiveAction,
        rootCause,
        preventiveAction,
      };
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      // TODO: breakdownsService.update(id, payload)
      await new Promise((r) => setTimeout(r, 450));
      applyEditsToData();
      setEditMode(false);
      toast({ title: "Saved", description: "Breakdown updated successfully." });
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onCloseBreakdown = async () => {
    setSaving(true);
    try {
      // TODO: breakdownsService.close(id, { downtime_end, close_notes })
      await new Promise((r) => setTimeout(r, 450));
      setData((prev) => (prev ? { ...prev, status: "closed", downtimeEnd: new Date().toISOString() } : prev));
      setStatus("closed");
      setEditMode(false);
      toast({ title: "Closed", description: "Breakdown marked as closed." });
    } catch {
      toast({ title: "Close failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmCloseOpen(false);
    }
  };

  const onDelete = async () => {
    setSaving(true);
    try {
      // TODO: breakdownsService.delete(id)
      await new Promise((r) => setTimeout(r, 450));
      toast({ title: "Deleted", description: "Breakdown removed." });
      navigate("/maintenance/breakdowns", { replace: true });
    } catch {
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmDeleteOpen(false);
    }
  };

  const onAddNote = async () => {
    const text = noteText.trim();
    if (!text) return;

    setSaving(true);
    try {
      // TODO: breakdownsService.addNote(id, { text })
      await new Promise((r) => setTimeout(r, 300));
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: [
            { at: new Date().toISOString().slice(0, 16).replace("T", " "), by: "You", text },
            ...(prev.notes || []),
          ],
        };
      });
      setNoteText("");
      toast({ title: "Note added", description: "Activity note recorded." });
    } catch {
      toast({ title: "Failed", description: "Could not add note.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onExport = async () => {
    try {
      // TODO: breakdownsService.exportPdf(id) -> download
      toast({
        title: "Export",
        description: "Hook this to backend export endpoint (PDF/CSV) for maintenance reporting.",
      });
    } catch {
      toast({ title: "Export failed", description: "Try again.", variant: "destructive" });
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  const EquipmentIcon = Cpu;

  return (
    <div className="space-y-5">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="secondary" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{data.breakdownNo}</h1>
              <Badge tone={statusMeta.tone}>
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  {statusMeta.label}
                </span>
              </Badge>
              <Badge tone={priorityMeta.tone}>
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {priorityMeta.label} Priority
                </span>
              </Badge>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Reported <span className="font-medium text-gray-700">{data.reportedAt}</span> • Plant{" "}
              <span className="font-medium text-gray-700">{data.plant}</span> • {data.area} / {data.line}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={onExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          {!editMode ? (
            <Button variant="secondary" className="gap-2" onClick={() => setEditMode(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={onSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          )}

          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => setConfirmCloseOpen(true)}
            disabled={saving || status === "closed"}
            title={status === "closed" ? "Already closed" : "Close breakdown"}
          >
            <BadgeCheck className="h-4 w-4" />
            Close
          </Button>

          <Button
            variant="ghost"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Equipment</p>
          <div className="mt-2 flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551] ring-1 ring-inset ring-[#dc2551]/15">
              <EquipmentIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {data.equipment?.name} <span className="text-gray-400">({data.equipment?.code})</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {data.equipment?.category} • {data.equipment?.make} {data.equipment?.model}
              </p>
              <div className="mt-2">
                <Button variant="secondary" asChild className="h-8">
                  <Link to={`/maintenance/equipment/${data.equipment?.id || ""}`}>View Equipment</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Downtime</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{downtimeLabel}</p>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <div className="inline-flex items-center gap-2">
              <Timer className="h-4 w-4 text-gray-400" />
              Start: <span className="font-medium text-gray-700">{data.downtimeStart || "—"}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              End: <span className="font-medium text-gray-700">{data.downtimeEnd ? "Recorded" : "Ongoing"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-500">Ownership & Safety</p>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-600 inline-flex items-center gap-2">
                <HardHat className="h-4 w-4 text-gray-400" />
                Assigned
              </span>
              <span className="font-semibold text-gray-900">{data.assignedTo?.name || "Unassigned"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-600 inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-400" />
                Safety Impact
              </span>
              <span className="font-semibold text-gray-900">{data.safetyImpact || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-600 inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                Reported By
              </span>
              <span className="font-semibold text-gray-900">{data.createdBy?.name || "—"}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Details + Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Main editable details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#dc2551]" />
                <h2 className="text-sm font-semibold text-gray-900">Breakdown Details</h2>
              </div>
              <Badge tone="gray">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {data.area} / {data.line}
                </span>
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Status</Label>
                <select
                  className={cx(
                    "mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none",
                    "focus:ring-2 focus:ring-[#dc2551]/20 focus:border-[#dc2551]/40",
                    !editMode && "bg-gray-50 text-gray-600"
                  )}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!editMode}
                >
                  {Object.keys(STATUS).map((k) => (
                    <option key={k} value={k}>
                      {STATUS[k].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Priority</Label>
                <select
                  className={cx(
                    "mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none",
                    "focus:ring-2 focus:ring-[#dc2551]/20 focus:border-[#dc2551]/40",
                    !editMode && "bg-gray-50 text-gray-600"
                  )}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={!editMode}
                >
                  {Object.keys(PRIORITY).map((k) => (
                    <option key={k} value={k}>
                      {PRIORITY[k].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label>Symptom / Issue observed</Label>
                <Textarea
                  className={cx("mt-2", !editMode && "bg-gray-50")}
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  placeholder="Describe symptom (noise, vibration, motor trip, conveyor jam...)"
                  disabled={!editMode}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Suspected Cause</Label>
                <Textarea
                  className={cx("mt-2", !editMode && "bg-gray-50")}
                  value={suspectedCause}
                  onChange={(e) => setSuspectedCause(e.target.value)}
                  placeholder="Initial hypothesis (bearing wear, sensor failure, air pressure drop...)"
                  disabled={!editMode}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Spare Requirement</Label>
                <Input
                  className={cx("mt-2", !editMode && "bg-gray-50")}
                  value={spareRequirement}
                  onChange={(e) => setSpareRequirement(e.target.value)}
                  placeholder="List spares / consumables required"
                  disabled={!editMode}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Corrective Action (what you did)</Label>
                <Textarea
                  className={cx("mt-2", !editMode && "bg-gray-50")}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Immediate fix action, part replacement plan, calibration..."
                  disabled={!editMode}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Root Cause (RCA)</Label>
                <Textarea
                  className={cx("mt-2", !editMode && "bg-gray-50")}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="5-Why / Fishbone summary (fill when analysis complete)"
                  disabled={!editMode}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Preventive Action</Label>
                <Textarea
                  className={cx("mt-2", !editMode && "bg-gray-50")}
                  value={preventiveAction}
                  onChange={(e) => setPreventiveAction(e.target.value)}
                  placeholder="Changes to avoid repeat: PM frequency, training, spare min/max..."
                  disabled={!editMode}
                />
              </div>
            </div>

            {editMode && (
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    // reset edits
                    setStatus(data.status);
                    setPriority(data.priority);
                    setSymptom(data.symptom || "");
                    setSuspectedCause(data.suspectedCause || "");
                    setSpareRequirement(data.spareRequirement || "");
                    setCorrectiveAction(data.correctiveAction || "");
                    setRootCause(data.rootCause || "");
                    setPreventiveAction(data.preventiveAction || "");
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button className="bg-[#dc2551] hover:bg-[#b02045] gap-2" onClick={onSave} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Right: Notes + Attachments */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#dc2551]" />
              <h2 className="text-sm font-semibold text-gray-900">Activity Notes</h2>
            </div>

            <div className="mt-3 space-y-2">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add note (inspection result, vendor call, spare ETA, etc.)"
              />
              <Button
                className="w-full bg-[#dc2551] hover:bg-[#b02045]"
                onClick={onAddNote}
                disabled={saving || !noteText.trim()}
              >
                {saving ? "Adding..." : "Add Note"}
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {(data.notes || []).length === 0 ? (
                <div className="rounded-xl border bg-gray-50 p-4 text-center text-sm text-gray-600">No notes yet.</div>
              ) : (
                (data.notes || []).map((n, idx) => (
                  <div key={idx} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900">{n.by}</p>
                      <p className="text-xs text-gray-500">{n.at}</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{n.text}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#dc2551]" />
              <h2 className="text-sm font-semibold text-gray-900">Attachments</h2>
            </div>

            <div className="mt-3 space-y-2">
              {(data.attachments || []).length === 0 ? (
                <div className="rounded-xl border bg-gray-50 p-4 text-center text-sm text-gray-600">No attachments.</div>
              ) : (
                (data.attachments || []).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.type}</p>
                    </div>
                    <Button
                      variant="secondary"
                      className="h-8"
                      onClick={() =>
                        toast({
                          title: "Download",
                          description: "Hook to backend signed URL download.",
                        })
                      }
                    >
                      Download
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Close confirmation */}
      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close breakdown?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <span className="font-medium">{data.breakdownNo}</span> as closed and stop downtime.
              Make sure corrective action and notes are updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onCloseBreakdown} disabled={saving}>
              {saving ? "Closing..." : "Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete breakdown?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{data.breakdownNo}</span>. This action can’t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
