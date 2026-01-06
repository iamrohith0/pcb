// src/pages/maintenance/equipment/EquipmentCreate.jsx
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
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
    BadgeCheck,
    Building2,
    CalendarDays,
    Factory,
    Hash,
    MapPin,
    Plus,
    Save,
    Settings,
    ShieldAlert,
    Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * EquipmentCreate.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/maintenance/equipment/EquipmentCreate.jsx
 *
 * UI-only version (ready for API integration):
 * - Create / register factory equipment (Drill, Router, Plating line, AOI, Press, etc.)
 * - Validations, clean layout, confirmation dialog
 *
 * Replace handleSubmit with your API call later (equipmentService.create).
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const EQUIPMENT_TYPES = [
  "CNC Drill",
  "CNC Router",
  "Laser Driller",
  "AOI Machine",
  "Flying Probe",
  "E-Test",
  "Lamination Press",
  "Hot Air Leveling (HASL)",
  "ENIG Line",
  "Plating Line",
  "Dry Film Laminator",
  "Exposure Unit",
  "Developing / Stripping Line",
  "Etching Line",
  "V-Cut / Depanelizer",
  "Conveyor / Handling",
  "Compressor / Utility",
  "Other",
];

const DEPARTMENTS = [
  "CAM / Engineering",
  "Drilling",
  "Imaging",
  "Plating",
  "Etching",
  "Solder Mask",
  "Surface Finish",
  "Lamination",
  "Routing / Profiling",
  "AOI / Inspection",
  "E-Test",
  "Packing",
  "Utilities",
];

const CRITICALITY = [
  { key: "low", label: "Low", cls: "bg-gray-100 text-gray-700" },
  { key: "medium", label: "Medium", cls: "bg-yellow-100 text-yellow-700" },
  { key: "high", label: "High", cls: "bg-orange-100 text-orange-700" },
  { key: "critical", label: "Critical", cls: "bg-red-100 text-red-700" },
];

export default function EquipmentCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Core
  const [name, setName] = useState(""); // e.g., "CNC Drill 01"
  const [type, setType] = useState("CNC Drill");
  const [department, setDepartment] = useState("Drilling");
  const [assetTag, setAssetTag] = useState(""); // e.g., "ASSET-DRL-001"
  const [serialNo, setSerialNo] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");

  // Location / Plant
  const [plant, setPlant] = useState("Main Plant");
  const [area, setArea] = useState(""); // e.g., "Line A"
  const [location, setLocation] = useState(""); // e.g., "Bay 3"

  // Maintenance
  const [criticality, setCriticality] = useState("high");
  const [installDate, setInstallDate] = useState("");
  const [warrantyUntil, setWarrantyUntil] = useState("");
  const [pmIntervalDays, setPmIntervalDays] = useState("30"); // default monthly
  const [serviceVendor, setServiceVendor] = useState("");
  const [serviceContact, setServiceContact] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  const requiredErrors = useMemo(() => {
    const errors = {};
    if (!name.trim()) errors.name = "Equipment name is required.";
    if (!type) errors.type = "Equipment type is required.";
    if (!department) errors.department = "Department is required.";
    if (!assetTag.trim()) errors.assetTag = "Asset Tag is required.";
    if (pmIntervalDays && Number(pmIntervalDays) < 1) errors.pmIntervalDays = "PM interval must be at least 1 day.";
    return errors;
  }, [name, type, department, assetTag, pmIntervalDays]);

  const canSubmit = Object.keys(requiredErrors).length === 0 && !saving;

  const payloadPreview = useMemo(() => {
    return {
      name: name.trim(),
      type,
      department,
      asset_tag: assetTag.trim(),
      serial_no: serialNo.trim() || null,
      model: model.trim() || null,
      manufacturer: manufacturer.trim() || null,
      plant: plant.trim() || null,
      area: area.trim() || null,
      location: location.trim() || null,
      criticality,
      install_date: installDate || null,
      warranty_until: warrantyUntil || null,
      pm_interval_days: pmIntervalDays ? Number(pmIntervalDays) : null,
      service_vendor: serviceVendor.trim() || null,
      service_contact: serviceContact.trim() || null,
      notes: notes.trim() || null,
    };
  }, [
    name,
    type,
    department,
    assetTag,
    serialNo,
    model,
    manufacturer,
    plant,
    area,
    location,
    criticality,
    installDate,
    warrantyUntil,
    pmIntervalDays,
    serviceVendor,
    serviceContact,
    notes,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    // open confirm dialog
    setConfirmOpen(true);
  };

  const createNow = async () => {
    setConfirmOpen(false);
    setSaving(true);

    try {
      // TODO: Replace with API call:
      // await equipmentService.create(payloadPreview)
      await new Promise((r) => setTimeout(r, 600));

      toast({
        title: "Equipment created",
        description: `${payloadPreview.name} added to equipment registry.`,
      });

      navigate("/maintenance/equipment", { replace: true });
    } catch (err) {
      toast({
        title: "Create failed",
        description: "Something went wrong while saving equipment. Please try again.",
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
            <Wrench className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Equipment</h1>
            <p className="text-sm text-gray-500">
              Register a new machine/asset for PCB manufacturing maintenance and breakdown tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/maintenance/equipment">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Equipment
            </Button>
          </Link>

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canSubmit}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Equipment"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-base">Core Details</CardTitle>
              </div>
              <CardDescription>Machine identity, department, and traceable identifiers.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Equipment Name *</Label>
                <div className="relative">
                  <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g., "CNC Drill 01"' className="pl-9" />
                </div>
                {requiredErrors.name && <p className="text-xs text-red-600">{requiredErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>Equipment Type *</Label>
                <div className="relative">
                  <Settings className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {EQUIPMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                {requiredErrors.type && <p className="text-xs text-red-600">{requiredErrors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label>Department *</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {requiredErrors.department && <p className="text-xs text-red-600">{requiredErrors.department}</p>}
              </div>

              <div className="space-y-2">
                <Label>Asset Tag *</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} placeholder="e.g., ASSET-DRL-001" className="pl-9" />
                </div>
                {requiredErrors.assetTag && <p className="text-xs text-red-600">{requiredErrors.assetTag}</p>}
              </div>

              <div className="space-y-2">
                <Label>Serial No</Label>
                <Input value={serialNo} onChange={(e) => setSerialNo(e.target.value)} placeholder="Optional" />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Optional" />
              </div>

              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Optional" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-base">Plant & Location</CardTitle>
              </div>
              <CardDescription>Where this equipment sits inside the factory.</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Plant</Label>
                <Input value={plant} onChange={(e) => setPlant(e.target.value)} placeholder="e.g., Main Plant" />
              </div>

              <div className="space-y-2">
                <Label>Area / Line</Label>
                <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder='e.g., "Line A"' />
              </div>

              <div className="space-y-2">
                <Label>Location / Bay</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder='e.g., "Bay 3"' />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Maintenance configuration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-base">Maintenance Settings</CardTitle>
              </div>
              <CardDescription>Criticality and preventive maintenance scheduling.</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Criticality</Label>
                <div className="flex flex-wrap gap-2">
                  {CRITICALITY.map((c) => (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => setCriticality(c.key)}
                      className={cx(
                        "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition",
                        c.cls,
                        criticality === c.key ? "ring-gray-400" : "ring-transparent hover:ring-gray-300"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    Selected: {CRITICALITY.find((c) => c.key === criticality)?.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Install Date</Label>
                <Input type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Warranty Until</Label>
                <Input type="date" value={warrantyUntil} onChange={(e) => setWarrantyUntil(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>PM Interval (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={pmIntervalDays}
                  onChange={(e) => setPmIntervalDays(e.target.value)}
                  placeholder="e.g., 30"
                />
                {requiredErrors.pmIntervalDays && <p className="text-xs text-red-600">{requiredErrors.pmIntervalDays}</p>}
              </div>

              <div className="space-y-2">
                <Label>Service Vendor</Label>
                <Input value={serviceVendor} onChange={(e) => setServiceVendor(e.target.value)} placeholder="Optional" />
              </div>

              <div className="space-y-2">
                <Label>Service Contact</Label>
                <Input value={serviceContact} onChange={(e) => setServiceContact(e.target.value)} placeholder="Phone / Email (optional)" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-base">Notes</CardTitle>
              </div>
              <CardDescription>Optional technical notes, safety notes, and operating guidance.</CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Keep spindle warm-up 10 min; check coolant filter weekly; AOI belt tension spec..."
                  className="min-h-[110px]"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/maintenance/equipment" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          </Link>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto gap-2"
              onClick={() => {
                setName("");
                setAssetTag("");
                setSerialNo("");
                setModel("");
                setManufacturer("");
                setArea("");
                setLocation("");
                setInstallDate("");
                setWarrantyUntil("");
                setPmIntervalDays("30");
                setServiceVendor("");
                setServiceContact("");
                setNotes("");
                setCriticality("high");
                setType("CNC Drill");
                setDepartment("Drilling");
                setPlant("Main Plant");
                toast({ title: "Cleared", description: "Form reset to defaults." });
              }}
            >
              <Plus className="h-4 w-4" />
              Clear
            </Button>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:w-auto gap-2 bg-cyan-600 hover:bg-cyan-500"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Equipment"}
            </Button>
          </div>
        </div>
      </form>

      {/* Create confirmation */}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Create equipment?"
        description="This will add the equipment to the maintenance registry. You can then log breakdowns and preventive maintenance against it."
        confirmText={saving ? "Saving..." : "Create"}
        confirmVariant="default"
        onConfirm={createNow}
      />

      {/* Payload preview (dev helper) */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">Payload Preview</p>
          <Badge variant="outline">Dev</Badge>
        </div>
        <pre className="mt-3 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
{JSON.stringify(payloadPreview, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
