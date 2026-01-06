// src/pages/maintenance/equipment/EquipmentDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    Factory,
    FileText,
    History,
    MapPin,
    Pencil,
    QrCode,
    RefreshCw,
    Settings2,
    ShieldCheck,
    Timer,
    Trash2,
    Wrench,
} from "lucide-react";


/**
 * EquipmentDetails.jsx (PCBxpress - PCB Manufacturing ERP)
 * Location: src/pages/maintenance/equipment/EquipmentDetails.jsx
 *
 * Features:
 * - Equipment profile (asset info, line/process, plant, location)
 * - Status badge (Running/Down/PM/Hold)
 * - KPIs (MTBF, MTTR, uptime, criticality)
 * - Documents list (manuals, calibration certs, SOPs)
 * - Maintenance logs (breakdowns/PM) + quick add (placeholder)
 * - Editable notes + safety checklist
 *
 * Replace mock API with real endpoints when backend is ready:
 * - GET   /maintenance/equipment/:id
 * - PUT   /maintenance/equipment/:id
 * - GET   /maintenance/equipment/:id/logs
 * - GET   /maintenance/equipment/:id/docs
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

const mockEquipmentById = (id) => {
  // A few realistic PCB shop assets
  const base = [
    {
      id: "DRL-01",
      name: "CNC Drill #1",
      category: "Drilling",
      plant: "Plant A",
      line: "Drilling",
      location: "Bay D1",
      vendor: "Schmoll",
      model: "X3000",
      serial: "SCH-DRL-23911",
      installDate: "2022-06-14",
      status: "running",
      criticality: "A",
      warrantyUntil: "2026-06-14",
      lastCalibration: "2025-11-10",
      nextCalibration: "2026-05-10",
      pmFrequencyDays: 30,
      lastPM: "2025-12-12",
      nextPM: "2026-01-11",
      notes:
        "Keep spindle temperature log. Replace air filter monthly. Verify drill bit runout weekly.",
      safety: {
        lOTO: true,
        chemicalPPE: false,
        guardsOK: true,
        estopOK: true,
        groundingOK: true,
      },
      kpis: { mtbfHours: 118, mttrMin: 62, uptimePct: 96.2, oeeLossPct: 3.8 },
      tags: ["High speed", "Microvias", "SMT-ready"],
    },
    {
      id: "PLT-01",
      name: "Plating Line #1",
      category: "Plating",
      plant: "Plant A",
      line: "Plating",
      location: "Bay P2",
      vendor: "Atotech",
      model: "CuProLine",
      serial: "ATO-PLT-88201",
      installDate: "2021-02-03",
      status: "pm",
      criticality: "A",
      warrantyUntil: "2026-02-03",
      lastCalibration: "2025-10-01",
      nextCalibration: "2026-04-01",
      pmFrequencyDays: 14,
      lastPM: "2026-01-02",
      nextPM: "2026-01-16",
      notes:
        "Monitor bath chemistry daily. Ensure rectifier logs are reviewed weekly. Keep spare pump ready.",
      safety: {
        lOTO: true,
        chemicalPPE: true,
        guardsOK: true,
        estopOK: true,
        groundingOK: true,
      },
      kpis: { mtbfHours: 82, mttrMin: 95, uptimePct: 93.4, oeeLossPct: 6.6 },
      tags: ["Chemistry", "Rectifiers", "Bath control"],
    },
    {
      id: "AOI-01",
      name: "AOI Station #1",
      category: "Inspection",
      plant: "Plant B",
      line: "AOI",
      location: "QC Lab",
      vendor: "Mirtec",
      model: "MV-9",
      serial: "MIR-AOI-55018",
      installDate: "2023-04-18",
      status: "down",
      criticality: "B",
      warrantyUntil: "2026-04-18",
      lastCalibration: "2025-09-15",
      nextCalibration: "2026-03-15",
      pmFrequencyDays: 45,
      lastPM: "2025-12-01",
      nextPM: "2026-01-15",
      notes:
        "Lens cleaning every shift. Verify lighting profile weekly. Backup inspection recipes monthly.",
      safety: {
        lOTO: false,
        chemicalPPE: false,
        guardsOK: true,
        estopOK: true,
        groundingOK: true,
      },
      kpis: { mtbfHours: 145, mttrMin: 40, uptimePct: 97.1, oeeLossPct: 2.9 },
      tags: ["Vision", "Recipes", "SPC"],
    },
  ];

  const found = base.find((x) => x.id === id);
  if (found) return found;

  // fallback generic
  return {
    id,
    name: `Equipment ${id}`,
    category: "Process",
    plant: "Plant A",
    line: "CAM",
    location: "Main Floor",
    vendor: "—",
    model: "—",
    serial: "—",
    installDate: "2024-01-01",
    status: "hold",
    criticality: "C",
    warrantyUntil: "—",
    lastCalibration: "—",
    nextCalibration: "—",
    pmFrequencyDays: 30,
    lastPM: "—",
    nextPM: "—",
    notes: "",
    safety: { lOTO: false, chemicalPPE: false, guardsOK: false, estopOK: false, groundingOK: false },
    kpis: { mtbfHours: 0, mttrMin: 0, uptimePct: 0, oeeLossPct: 0 },
    tags: [],
  };
};

const mockDocs = (assetId) => [
  { id: `${assetId}-DOC-01`, name: "Operator Manual", type: "Manual", updated: "2025-08-01" },
  { id: `${assetId}-DOC-02`, name: "PM Checklist", type: "Checklist", updated: "2025-12-12" },
  { id: `${assetId}-DOC-03`, name: "Calibration Certificate", type: "Certificate", updated: "2025-11-10" },
];

const mockLogs = (assetId) => [
  {
    id: `${assetId}-LOG-101`,
    type: "Breakdown",
    severity: "major",
    title: "Air pressure dropped",
    when: "2025-12-28T10:15:00Z",
    durationMin: 55,
    ticket: "MT-1452",
    note: "Checked compressor + replaced line coupler.",
  },
  {
    id: `${assetId}-LOG-099`,
    type: "PM",
    severity: "minor",
    title: "Monthly PM completed",
    when: "2025-12-12T08:40:00Z",
    durationMin: 75,
    ticket: "PM-223",
    note: "Cleaned filters, checked spindle runout, greased guides.",
  },
  {
    id: `${assetId}-LOG-095`,
    type: "Calibration",
    severity: "minor",
    title: "Calibration done",
    when: "2025-11-10T12:00:00Z",
    durationMin: 40,
    ticket: "CAL-48",
    note: "Calibration within tolerance.",
  },
];

function SeverityBadge({ value }) {
  const map = {
    critical: "destructive",
    major: "default",
    minor: "secondary",
  };
  return <Badge variant={map[value] ?? "outline"}>{(value || "n/a").toUpperCase()}</Badge>;
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
      <div className="rounded-lg bg-[#dc2551]/10 p-2 text-[#dc2551]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {sub ? <p className="text-sm text-gray-600">{sub}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default function EquipmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [equipment, setEquipment] = useState(null);
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);

  const [editMode, setEditMode] = useState(false);

  // editable fields
  const [notes, setNotes] = useState("");
  const [safety, setSafety] = useState({
    lOTO: false,
    chemicalPPE: false,
    guardsOK: false,
    estopOK: false,
    groundingOK: false,
  });

  const statusMeta = STATUS_META[equipment?.status] ?? STATUS_META.hold;
  const critMeta = CRIT_META[equipment?.criticality] ?? CRIT_META.C;

  const derived = useMemo(() => {
    if (!equipment) return null;

    const today = new Date();
    const nextPM = equipment.nextPM && equipment.nextPM !== "—" ? new Date(equipment.nextPM) : null;
    const nextCal = equipment.nextCalibration && equipment.nextCalibration !== "—" ? new Date(equipment.nextCalibration) : null;

    const pmDueSoon = nextPM ? (nextPM - today) / (1000 * 60 * 60 * 24) <= 3 : false;
    const calDueSoon = nextCal ? (nextCal - today) / (1000 * 60 * 60 * 24) <= 7 : false;

    return { pmDueSoon, calDueSoon };
  }, [equipment]);

  const load = async () => {
    setLoading(true);
    try {
      // TODO: replace with API calls
      const eq = mockEquipmentById(id);
      const d = mockDocs(id);
      const l = mockLogs(id);

      setEquipment(eq);
      setDocs(d);
      setLogs(l);

      setNotes(eq.notes || "");
      setSafety(eq.safety || safety);
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
  }, [id]);

  const onSave = async () => {
    if (!equipment) return;
    setSaving(true);
    try {
      // TODO: replace with PUT API
      const updated = {
        ...equipment,
        notes,
        safety,
      };
      setEquipment(updated);
      setEditMode(false);

      toast({ title: "Saved", description: "Equipment notes & safety checklist updated." });
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onCancelEdit = () => {
    if (!equipment) return;
    setNotes(equipment.notes || "");
    setSafety(equipment.safety || safety);
    setEditMode(false);
  };

  const downloadDoc = (doc) => {
    // placeholder
    toast({
      title: "Download (placeholder)",
      description: `Integrate real file download for: ${doc.name}`,
    });
  };

  const openCreatePM = () => {
    toast({
      title: "Create PM (placeholder)",
      description: "Hook this to your Preventive Maintenance create page / modal.",
    });
  };

  const requestDelete = () => {
    // placeholder
    toast({
      title: "Delete (placeholder)",
      description: "Add delete integration after backend endpoints are ready.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-64 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="h-40 animate-pulse bg-gray-50" />
          <Card className="h-40 animate-pulse bg-gray-50" />
          <Card className="h-40 animate-pulse bg-gray-50" />
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">Equipment not found</p>
            <p className="text-sm text-gray-600">The requested equipment ID does not exist.</p>
            <Button variant="outline" className="mt-2 gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {equipment.id} — {equipment.name}
              </h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              <Badge variant={critMeta.variant}>{critMeta.label}</Badge>
              {derived?.pmDueSoon ? <Badge variant="destructive">PM Due Soon</Badge> : null}
              {derived?.calDueSoon ? <Badge variant="destructive">Calibration Due Soon</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {equipment.plant} • {equipment.line} • {equipment.location}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {equipment.tags?.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
              {equipment.tags?.length ? null : <Badge variant="outline">No tags</Badge>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={load}
            disabled={loading || saving}
            aria-label="Refresh"
          >
            <RefreshCw className={cx("h-4 w-4", (loading || saving) && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={openCreatePM}
            disabled={saving}
          >
            <ClipboardList className="h-4 w-4" />
            Create PM
          </Button>

          {!editMode ? (
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={() => setEditMode(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={onCancelEdit} disabled={saving}>
                Cancel
              </Button>
            </>
          )}

          <Button variant="outline" className="gap-2" onClick={requestDelete}>
            <Trash2 className="h-4 w-4 text-[#dc2551]" />
            Delete
          </Button>
        </div>
      </div>

      {/* KPI Pills */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatPill icon={Timer} label="MTBF" value={`${equipment.kpis.mtbfHours} hrs`} />
        <StatPill icon={Clock} label="MTTR" value={`${equipment.kpis.mttrMin} min`} />
        <StatPill icon={Activity} label="Uptime" value={`${equipment.kpis.uptimePct}%`} />
        <StatPill icon={AlertTriangle} label="OEE Loss" value={`${equipment.kpis.oeeLossPct}%`} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Asset profile */}
        <Card className="p-4 lg:col-span-2">
          <SectionTitle
            icon={Factory}
            title="Asset Profile"
            sub="Core equipment information used across routing, maintenance, and quality traceability."
          />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Identity</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600">Asset ID</span>
                  <span className="font-medium text-gray-900">{equipment.id}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">{equipment.category}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600">Vendor</span>
                  <span className="font-medium text-gray-900">{equipment.vendor}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium text-gray-900">{equipment.model}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600">Serial</span>
                  <span className="font-medium text-gray-900">{equipment.serial}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600">Plant</span>
                  <span className="font-medium text-gray-900">{equipment.plant}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600">Line / Process</span>
                  <span className="font-medium text-gray-900">{equipment.line}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Location
                  </span>
                  <span className="font-medium text-gray-900">{equipment.location}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#dc2551]/5 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <QrCode className="mt-0.5 h-4 w-4 text-[#dc2551]" />
                  <div>
                    <p className="font-semibold text-gray-900">QR / Asset Tag</p>
                    <p className="text-xs text-gray-600">
                      Print QR labels for quick lookup, breakdown reporting, and PM checklists.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Service & Compliance</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Installed
                  </span>
                  <span className="font-medium text-gray-900">{equipment.installDate}</span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-gray-400" />
                    Warranty Until
                  </span>
                  <span className="font-medium text-gray-900">{equipment.warrantyUntil}</span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-gray-400" />
                    PM Frequency
                  </span>
                  <span className="font-medium text-gray-900">{equipment.pmFrequencyDays} days</span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-gray-400" />
                    Next PM
                  </span>
                  <span className={cx("font-medium", derived?.pmDueSoon ? "text-[#dc2551]" : "text-gray-900")}>
                    {equipment.nextPM}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Last Calibration
                  </span>
                  <span className="font-medium text-gray-900">{equipment.lastCalibration}</span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-400" />
                    Next Calibration
                  </span>
                  <span className={cx("font-medium", derived?.calDueSoon ? "text-[#dc2551]" : "text-gray-900")}>
                    {equipment.nextCalibration}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + Safety */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <SectionTitle
                icon={FileText}
                title="Notes"
                sub="Store machine-specific operating and maintenance notes."
              />
              <div className="mt-3">
                {editMode ? (
                  <>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={7}
                      placeholder="Add notes: chemical checks, spare part refs, known issues..."
                      className="mt-2"
                    />
                  </>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {notes?.trim() ? notes : "No notes added."}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <SectionTitle
                icon={ShieldCheck}
                title="Safety & Checklist"
                sub="Quick checks used before working on the equipment."
              />
              <div className="mt-3 space-y-3 text-sm">
                {[
                  { key: "lOTO", label: "Lockout/Tagout (LOTO) available" },
                  { key: "chemicalPPE", label: "Chemical PPE required & available" },
                  { key: "guardsOK", label: "Safety guards in place" },
                  { key: "estopOK", label: "Emergency stop tested OK" },
                  { key: "groundingOK", label: "Grounding / ESD check OK" },
                ].map((row) => (
                  <label key={row.key} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-gray-700">{row.label}</span>
                    <input
                      type="checkbox"
                      checked={!!safety[row.key]}
                      onChange={(e) => setSafety((p) => ({ ...p, [row.key]: e.target.checked }))}
                      disabled={!editMode}
                      className="h-4 w-4 accent-[#dc2551]"
                    />
                  </label>
                ))}

                {!editMode ? (
                  <p className="text-xs text-gray-500">
                    Click <span className="font-medium">Edit</span> to update safety checklist.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Docs + Recent Logs */}
        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle
              icon={FileText}
              title="Documents"
              sub="Manuals, SOPs, calibration certificates, and checklists."
              action={
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    toast({
                      title: "Upload (placeholder)",
                      description: "Create a document upload page/modal for equipment docs.",
                    })
                  }
                >
                  <Download className="h-4 w-4" />
                  Upload
                </Button>
              }
            />

            <div className="mt-3 space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500">
                      {d.type} • Updated {d.updated}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadDoc(d)}>
                    <Download className="h-4 w-4" />
                    Get
                  </Button>
                </div>
              ))}

              {!docs.length ? <p className="text-sm text-gray-500">No documents found.</p> : null}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle
              icon={History}
              title="Recent Maintenance Logs"
              sub="Breakdowns, PM, calibration records."
              action={
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    toast({
                      title: "Open logs (placeholder)",
                      description: "Link this to breakdowns/log list route with asset filter.",
                    })
                  }
                >
                  <ClipboardList className="h-4 w-4" />
                  View All
                </Button>
              }
            />

            <div className="mt-3 space-y-2">
              {logs.slice(0, 6).map((l) => (
                <div key={l.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{l.title}</p>
                      <p className="text-xs text-gray-500">
                        {l.type} • {new Date(l.when).toLocaleString()} • {l.durationMin} min
                      </p>
                    </div>
                    <SeverityBadge value={l.severity} />
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{l.note}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{l.ticket ? `Ticket: ${l.ticket}` : "No ticket"}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {l.durationMin}m
                    </span>
                  </div>
                </div>
              ))}
              {!logs.length ? <p className="text-sm text-gray-500">No logs available.</p> : null}
            </div>
          </Card>

          {/* Quick links */}
          <Card className="p-4">
            <SectionTitle
              icon={Wrench}
              title="Quick Actions"
              sub="Shortcuts for maintenance workflow."
            />
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() =>
                  toast({
                    title: "Raise breakdown (placeholder)",
                    description: "Navigate to breakdown create page with asset preselected.",
                  })
                }
              >
                <AlertTriangle className="h-4 w-4 text-[#dc2551]" />
                Raise Breakdown
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() =>
                  toast({
                    title: "Schedule PM (placeholder)",
                    description: "Navigate to PM schedule page with asset preselected.",
                  })
                }
              >
                <Calendar className="h-4 w-4" />
                Schedule Preventive Maintenance
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() =>
                  toast({
                    title: "Spare parts (placeholder)",
                    description: "Navigate to spares list filtered by this asset.",
                  })
                }
              >
                <Wrench className="h-4 w-4" />
                View Linked Spares
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Suggested navigation hint (optional) */}
      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Tip for PCB factories</p>
              <p className="text-sm text-gray-600">
                Link equipment to routing steps (drilling → plating → etching → AOI → E-test). That makes downtime
                impact visible on WIP and delivery ETA.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/maintenance/breakdowns">Go to Breakdowns</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/maintenance/preventive">Go to Preventive</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
