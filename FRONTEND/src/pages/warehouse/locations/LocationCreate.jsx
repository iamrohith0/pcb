// src/pages/warehouse/locations/LocationCreate.jsx
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
    Building2,
    Hash,
    MapPin,
    Save,
    ShieldCheck,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * LocationCreate.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/locations/LocationCreate.jsx
 *
 * Purpose:
 * - Create a warehouse location / bin (rack-row-bin).
 * - Used by: inventory, picking/packing, stores, traceability, maintenance spares.
 *
 * Replace mocks with API:
 * - warehouseService.list()
 * - locationService.create(payload)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const LOCATION_TYPES = [
  { key: "rack", label: "Rack" },
  { key: "bin", label: "Bin" },
  { key: "floor", label: "Floor" },
  { key: "qa_hold", label: "QA Hold" },
  { key: "incoming", label: "Incoming" },
  { key: "dispatch", label: "Dispatch" },
];

const STATUS_BADGE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  blocked: "bg-red-100 text-red-700",
};

export default function LocationCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock warehouses/plants (replace with backend)
  const plants = useMemo(() => ["Plant 1", "Plant 2"], []);
  const warehouses = useMemo(
    () => [
      { id: "WH-001", name: "Central Stores", plant: "Plant 1" },
      { id: "WH-002", name: "Raw Material Store", plant: "Plant 1" },
      { id: "WH-003", name: "WIP Store", plant: "Plant 1" },
      { id: "WH-004", name: "Finished Goods", plant: "Plant 1" },
      { id: "WH-005", name: "Maintenance Spares", plant: "Plant 1" },
    ],
    []
  );

  const [saving, setSaving] = useState(false);

  // Form
  const [plant, setPlant] = useState("Plant 1");
  const [warehouseId, setWarehouseId] = useState("WH-001");

  const [code, setCode] = useState(""); // e.g., A-02-11
  const [name, setName] = useState(""); // e.g., Rack A Row 02 Bin 11
  const [type, setType] = useState("bin");
  const [status, setStatus] = useState("active");

  const [parentLocation, setParentLocation] = useState(""); // e.g., RACK-A-02
  const [zone, setZone] = useState("Stores");
  const [capacity, setCapacity] = useState(""); // optional (qty or weight in future)
  const [barcode, setBarcode] = useState(""); // optional
  const [notes, setNotes] = useState("");

  // Demo: existing locations list for parent dropdown (replace with API)
  const parentLocations = useMemo(
    () => [
      { id: "LOC-100", code: "RACK-A", name: "Rack A", warehouseId: "WH-001" },
      { id: "LOC-101", code: "RACK-B", name: "Rack B", warehouseId: "WH-001" },
      { id: "LOC-200", code: "WIP-01", name: "WIP Zone 01", warehouseId: "WH-003" },
      { id: "LOC-300", code: "QA-HOLD", name: "QA Hold Area", warehouseId: "WH-003" },
    ],
    []
  );

  const filteredWarehouses = useMemo(() => warehouses.filter((w) => w.plant === plant), [warehouses, plant]);

  const availableParents = useMemo(
    () => parentLocations.filter((p) => p.warehouseId === warehouseId),
    [parentLocations, warehouseId]
  );

  const canSave = useMemo(() => {
    if (!plant) return false;
    if (!warehouseId) return false;
    if (!code.trim()) return false;
    if (!name.trim()) return false;
    if (!type) return false;
    if (!status) return false;
    return true;
  }, [plant, warehouseId, code, name, type, status]);

  const autoFillName = () => {
    const parts = [];
    if (zone) parts.push(zone);
    if (code) parts.push(code);
    setName(parts.join(" - "));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) {
      toast({
        title: "Missing required fields",
        description: "Please fill Plant, Warehouse, Location Code, and Location Name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        plant,
        warehouse_id: warehouseId,
        code: code.trim(),
        name: name.trim(),
        type,
        status,
        parent_location: parentLocation || undefined,
        zone: zone || undefined,
        capacity: capacity || undefined,
        barcode: barcode || undefined,
        notes: notes || undefined,
      };

      console.log("LOCATION CREATE payload (demo):", payload);

      toast({
        title: "Location created",
        description: `${code.trim()} added to ${filteredWarehouses.find((w) => w.id === warehouseId)?.name || "warehouse"}.`,
      });

      navigate("/warehouse/locations", { replace: true });
    } catch (err) {
      toast({
        title: "Save failed",
        description: "Could not create location. Please try again.",
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
            <WarehouseIcon className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Location</h1>
            <p className="text-sm text-gray-500">Add a new warehouse bin/rack/location for PCBxpress stores operations.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/warehouse/locations">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Location"}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Core */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Location Details</CardTitle>
              <CardDescription>Define where items are stored for inventory, picking, QC hold, and dispatch.</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="plant">Plant *</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="plant"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={plant}
                    onChange={(e) => {
                      setPlant(e.target.value);
                      // switch warehouse to first of plant
                      const wh = warehouses.find((w) => w.plant === e.target.value);
                      if (wh) setWarehouseId(wh.id);
                      setParentLocation("");
                    }}
                    required
                  >
                    {plants.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <div className="relative">
                  <WarehouseIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="warehouse"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={warehouseId}
                    onChange={(e) => {
                      setWarehouseId(e.target.value);
                      setParentLocation("");
                    }}
                    required
                  >
                    {filteredWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="Stores / WIP / QA / Dispatch / Incoming"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Location Code *</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., A-02-11, QA-HOLD, DISPATCH-01"
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Tip: Use a consistent rack-row-bin scheme for easy scanning.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Rack A Row 02 Bin 11"
                  required
                />
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={autoFillName}>
                    <MapPin className="h-4 w-4" />
                    Auto-fill from Zone + Code
                  </Button>
                  <Badge className={cx("rounded-full", STATUS_BADGE[status])}>{status.toUpperCase()}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Location Type *</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="type"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                  >
                    {LOCATION_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500">Bin locations are used for picking. QA Hold/Dispatch are process zones.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent">Parent Location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="parent"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={parentLocation}
                    onChange={(e) => setParentLocation(e.target.value)}
                  >
                    <option value="">None</option>
                    {availableParents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500">Optional: assign bins under a rack/zone parent.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="status"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  Blocked = no put-away / no picking (use for quarantine or maintenance).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (optional)</Label>
                <Input
                  id="capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g., 1000 pcs or 250 kg (demo field)"
                />
                <p className="text-xs text-gray-500">You can enforce capacity rules later with backend validation.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode / QR (optional)</Label>
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g., LOC-A-02-11"
                />
                <p className="text-xs text-gray-500">Used for scanning during put-away and picking.</p>
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special handling notes (ESD zone, humidity control, fragile items, etc.)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Link to="/warehouse/locations">
              <Button type="button" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={!canSave || saving}
              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Create Location"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
