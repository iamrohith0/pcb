// src/pages/maintenance/preventive/PMCreate.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    CalendarDays,
    ClipboardCheck,
    Clock,
    Hash,
    Layers,
    MapPin,
    Save,
    Settings2,
    User,
    Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * PMCreate.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/maintenance/preventive/PMCreate.jsx
 *
 * Purpose:
 * - Create / schedule a preventive maintenance (PM) job for an equipment
 *
 * Replace mock data with API:
 * - equipmentService.list({ q })
 * - pmChecklistService.list({ equipment_type })
 * - pmService.create(payload)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toLocalDateISO(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTimeHHMM(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const PRIORITIES = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

const PRIORITY_PILL = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const FREQUENCIES = [
  { key: "one_time", label: "One-time" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
];

export default function PMCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [pmId, setPmId] = useState(""); // optional; backend can generate
  const [title, setTitle] = useState("Preventive Maintenance");
  const [equipmentId, setEquipmentId] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentType, setEquipmentType] = useState("CNC"); // mock
  const [line, setLine] = useState("Line A");

  const [checklistCode, setChecklistCode] = useState("");
  const [frequency, setFrequency] = useState("one_time");

  const [scheduledDate, setScheduledDate] = useState(toLocalDateISO());
  const [scheduledTime, setScheduledTime] = useState(toLocalTimeHHMM());
  const [estMinutes, setEstMinutes] = useState("45");

  const [assignedTo, setAssignedTo] = useState("Arun");
  const [priority, setPriority] = useState("medium");
  const [location, setLocation] = useState("Plant 1 / Bay 2");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  // Mock masters (replace with API)
  const equipmentOptions = useMemo(
    () => [
      { id: "EQ-0001", name: "CNC Drill 01", type: "CNC", line: "Line A" },
      { id: "EQ-0002", name: "CNC Router 02", type: "CNC", line: "Line A" },
      { id: "EQ-0003", name: "AOI Line 02", type: "AOI", line: "Line B" },
      { id: "EQ-0004", name: "UV Exposure Unit", type: "PHOTO", line: "Line C" },
      { id: "EQ-0005", name: "Plating Rectifier", type: "PLATING", line: "Line C" },
      { id: "EQ-0006", name: "E-Test Fixture", type: "ETEST", line: "Line B" },
    ],
    []
  );

  const technicians = useMemo(() => ["Arun", "Nisha", "Faisal", "Rakesh"], []);

  const checklists = useMemo(() => {
    // Basic mapping by equipment type; replace with checklist templates from backend
    const base = [
      { code: "PM-GEN-SAFETY", name: "General Safety & Lubrication" },
      { code: "PM-GEN-CLEAN", name: "Cleaning, Filters & Air Lines" },
    ];

    const map = {
      CNC: [
        { code: "PM-CNC-DRL-MONTHLY", name: "CNC Drill Monthly Checklist" },
        { code: "PM-CNC-RTR-MONTHLY", name: "CNC Router Monthly Checklist" },
      ],
      AOI: [{ code: "PM-AOI-WEEKLY", name: "AOI Weekly Checklist" }],
      PHOTO: [{ code: "PM-UV-DAILY", name: "UV Exposure Daily Checklist" }],
      PLATING: [{ code: "PM-PLATE-RECT-WEEKLY", name: "Rectifier Weekly Checklist" }],
      ETEST: [{ code: "PM-ETEST-WEEKLY", name: "E-Test Weekly Checklist" }],
    };

    return [...(map[equipmentType] || []), ...base];
  }, [equipmentType]);

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 0 &&
      equipmentId.trim().length > 0 &&
      checklistCode.trim().length > 0 &&
      scheduledDate.trim().length > 0 &&
      scheduledTime.trim().length > 0 &&
      assignedTo.trim().length > 0
    );
  }, [title, equipmentId, checklistCode, scheduledDate, scheduledTime, assignedTo]);

  const onPickEquipment = (id) => {
    const eq = equipmentOptions.find((e) => e.id === id);
    setEquipmentId(id);
    setEquipmentName(eq?.name || "");
    setEquipmentType(eq?.type || "CNC");
    setLine(eq?.line || "Line A");

    // reset checklist to force selection
    setChecklistCode("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Missing fields",
        description: "Please fill required fields before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Replace with API: await pmService.create(payload)
      const payload = {
        pm_id: pmId || undefined,
        title,
        equipment_id: equipmentId,
        checklist_code: checklistCode,
        frequency,
        scheduled_at: `${scheduledDate}T${scheduledTime}:00`,
        est_minutes: Number(estMinutes || 0),
        assigned_to: assignedTo,
        priority,
        line,
        location,
        notes,
      };

      console.log("PM CREATE payload (demo):", payload);

      toast({
        title: "PM scheduled",
        description: `PM created for ${equipmentName || equipmentId} on ${scheduledDate} ${scheduledTime}`,
      });

      navigate("/maintenance/preventive/calendar", { replace: true });
    } catch (err) {
      toast({
        title: "Save failed",
        description: "Could not create PM. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <ClipboardCheck className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Schedule Preventive Maintenance</h1>
            <p className="text-sm text-gray-500">
              Create a PM job for critical PCB equipment (CNC, AOI, UV exposure, plating, E-test, etc.).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/maintenance/preventive/calendar">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Calendar
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={!canSubmit || saving}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save PM"}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Top: Summary */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">PM Details</CardTitle>
              <CardDescription>Define equipment, checklist and schedule.</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <div className="relative">
                  <Wrench className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Preventive Maintenance"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pmid">PM ID (optional)</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="pmid"
                    value={pmId}
                    onChange={(e) => setPmId(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <div className="relative">
                  <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="priority"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-1">
                  <Badge className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", PRIORITY_PILL[priority])}>
                    {priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment *</Label>
                <div className="relative">
                  <Layers className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="equipment"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={equipmentId}
                    onChange={(e) => onPickEquipment(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select equipment
                    </option>
                    {equipmentOptions.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.id})
                      </option>
                    ))}
                  </select>
                </div>
                {equipmentId ? (
                  <p className="text-xs text-gray-500">
                    Type: <span className="font-medium text-gray-800">{equipmentType}</span> • Line:{" "}
                    <span className="font-medium text-gray-800">{line}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="checklist">Checklist *</Label>
                <div className="relative">
                  <ClipboardCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="checklist"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={checklistCode}
                    onChange={(e) => setChecklistCode(e.target.value)}
                    required
                    disabled={!equipmentId}
                  >
                    <option value="" disabled>
                      {equipmentId ? "Select checklist" : "Select equipment first"}
                    </option>
                    {checklists.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <div className="relative">
                  <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="frequency"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Scheduled Date *</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Scheduled Time *</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="est">Estimated Minutes</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="est"
                    type="number"
                    min="0"
                    value={estMinutes}
                    onChange={(e) => setEstMinutes(e.target.value)}
                    placeholder="45"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned">Assign To *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="assigned"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                  >
                    {technicians.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Plant / Bay / Area"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add instructions: lockout/tagout, spare parts to keep ready, safety checks, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bottom actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Link to="/maintenance/preventive/calendar">
              <Button type="button" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </Link>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() =>
                  toast({
                    title: "Checklist templates",
                    description: "Connect checklist templates screen here (demo).",
                  })
                }
              >
                <ClipboardCheck className="h-4 w-4" />
                Manage Checklists
              </Button>

              <Button
                type="submit"
                disabled={!canSubmit || saving}
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save PM"}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
