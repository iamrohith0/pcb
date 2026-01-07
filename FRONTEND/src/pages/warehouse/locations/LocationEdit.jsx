// src/pages/warehouse/locations/LocationEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    ArrowLeft,
    Building2,
    CheckCircle2,
    Hash,
    MapPin,
    RefreshCw,
    Save,
    ShieldAlert,
    Trash2,
    Warehouse,
} from "lucide-react";

/**
 * PCBxpress ERP — Warehouse → Locations → Edit
 * File: src/pages/warehouse/locations/LocationEdit.jsx
 *
 * Suggested API endpoints:
 * - GET    /warehouse/locations/:id
 * - PUT    /warehouse/locations/:id
 * - DELETE /warehouse/locations/:id
 * - GET    /warehouse/warehouses (for dropdown)
 *
 * Location model (example):
 * {
 *   id, code, name, warehouse_id, warehouse_name,
 *   plant, type, is_active, notes,
 *   path: { zone, aisle, rack, shelf, bin },
 *   capacity: { uom, max_qty, max_weight_kg },
 *   audit: { created_at, updated_at }
 * }
 */

// Optional: replace with your axios instance if available
import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function FieldHint({ children }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

export default function LocationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // master dropdowns
  const [warehouses, setWarehouses] = useState([]);

  // form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [plant, setPlant] = useState("Plant A");
  const [type, setType] = useState("Stores"); // Stores | WIP | Finished Goods | RM | Chemicals | Dispatch | Quarantine
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");

  // location path
  const [zone, setZone] = useState("");
  const [aisle, setAisle] = useState("");
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");
  const [bin, setBin] = useState("");

  // capacity
  const [capUom, setCapUom] = useState("Nos");
  const [capMaxQty, setCapMaxQty] = useState("");
  const [capMaxWeightKg, setCapMaxWeightKg] = useState("");

  const locationLabel = useMemo(() => {
    const parts = [zone, aisle, rack, shelf, bin].filter(Boolean);
    return parts.length ? parts.join(" / ") : "—";
  }, [zone, aisle, rack, shelf, bin]);

  const loadWarehouses = async () => {
    try {
      // TODO: replace with real API
      const res = await api.get("/warehouse/warehouses");
      const list = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(list)) setWarehouses(list);
    } catch (e) {
      // Fallback mock (safe)
      setWarehouses([
        { id: "WH-PLANTA", name: "Main Warehouse - Plant A", plant: "Plant A" },
        { id: "WH-PLANTB", name: "Main Warehouse - Plant B", plant: "Plant B" },
      ]);
    }
  };

  const loadLocation = async () => {
    setLoading(true);
    try {
      // TODO: replace with real API
      const res = await api.get(`/warehouse/locations/${id}`);

      const data = res.data?.data ?? res.data ?? {};
      setCode(data.code ?? "");
      setName(data.name ?? "");
      setWarehouseId(String(data.warehouse_id ?? data.warehouseId ?? ""));
      setPlant(data.plant ?? "Plant A");
      setType(data.type ?? "Stores");
      setIsActive(Boolean(data.is_active ?? data.isActive ?? true));
      setNotes(data.notes ?? "");

      const path = data.path ?? {};
      setZone(path.zone ?? "");
      setAisle(path.aisle ?? "");
      setRack(path.rack ?? "");
      setShelf(path.shelf ?? "");
      setBin(path.bin ?? "");

      const cap = data.capacity ?? {};
      setCapUom(cap.uom ?? "Nos");
      setCapMaxQty(cap.max_qty != null ? String(cap.max_qty) : "");
      setCapMaxWeightKg(cap.max_weight_kg != null ? String(cap.max_weight_kg) : "");
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load location",
        description: "Please check the location ID or try again.",
        variant: "destructive",
      });

      // Minimal fallback to allow UI demo without API
      setCode(`LOC-${String(id ?? "").slice(-4).toUpperCase() || "0001"}`);
      setName("Sample Location");
      setWarehouseId("WH-PLANTA");
      setPlant("Plant A");
      setType("Stores");
      setIsActive(true);
      setNotes("");
      setZone("Z1");
      setAisle("A2");
      setRack("R3");
      setShelf("S1");
      setBin("B08");
      setCapUom("Nos");
      setCapMaxQty("500");
      setCapMaxWeightKg("250");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!id) return;
    loadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    if (!code.trim()) return "Location code is required.";
    if (!name.trim()) return "Location name is required.";
    if (!warehouseId) return "Warehouse is required.";
    return null;
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const err = validate();
    if (err) {
      toast({ title: "Fix required fields", description: err, variant: "destructive" });
      return;
    }

    const payload = {
      code: code.trim(),
      name: name.trim(),
      warehouse_id: warehouseId,
      plant,
      type,
      is_active: isActive,
      notes: notes?.trim() || null,
      path: { zone, aisle, rack, shelf, bin },
      capacity: {
        uom: capUom,
        max_qty: capMaxQty === "" ? null : Number(capMaxQty),
        max_weight_kg: capMaxWeightKg === "" ? null : Number(capMaxWeightKg),
      },
    };

    setSaving(true);
    try {
      // TODO: PUT /warehouse/locations/:id
      await api.put(`/warehouse/locations/${id}`, payload);

      toast({
        title: "Location updated",
        description: `${payload.code} • ${payload.name}`,
      });

      navigate("/warehouse/locations", { replace: true });
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: e?.response?.data?.message || "Could not update location. Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // TODO: DELETE /warehouse/locations/:id
      await api.delete(`/warehouse/locations/${id}`);
      toast({ title: "Location deleted", description: "The location has been removed." });
      navigate("/warehouse/locations", { replace: true });
    } catch (e) {
      console.error(e);
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || "Could not delete. It may be in use by stock/WIP.",
        variant: "destructive",
      });
    } finally {
      setDeleteOpen(false);
    }
  };

  const warehouseName = useMemo(() => {
    const w = warehouses.find((x) => String(x.id) === String(warehouseId));
    return w?.name || "—";
  }, [warehouses, warehouseId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Location</h1>
            <p className="text-sm text-gray-600">
              Update warehouse location details, path structure and capacity limits.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Hash className="h-3.5 w-3.5" />
                {code || "—"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Warehouse className="h-3.5 w-3.5" />
                {warehouseName}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {plant}
              </Badge>
              <Badge variant={isActive ? "secondary" : "destructive"} className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/warehouse/locations">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" onClick={loadLocation} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Reload
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSave}
            disabled={saving || loading}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-[#dc2551] hover:bg-[#dc2551]/10 hover:text-[#dc2551]"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="h-36 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-36 animate-pulse rounded-2xl bg-gray-50" />
          <Card className="h-36 animate-pulse rounded-2xl bg-gray-50" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Main */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="rounded-2xl border bg-white p-4 lg:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Location info</h2>
                  <p className="text-sm text-gray-600">Core fields used by stock, WIP and dispatch movement.</p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {locationLabel}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="code">Location Code *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. LOC-ST-A1-R3-S2-B08"
                    autoComplete="off"
                  />
                  <FieldHint>Unique code used in scanning & stock movement.</FieldHint>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Stores Rack A1 Bin B08"
                    autoComplete="off"
                  />
                  <FieldHint>Human friendly label for operators.</FieldHint>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="warehouse">Warehouse *</Label>
                  <select
                    id="warehouse"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <FieldHint>Warehouse/Stores this location belongs to.</FieldHint>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="plant">Plant</Label>
                  <select
                    id="plant"
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  >
                    <option value="Plant A">Plant A</option>
                    <option value="Plant B">Plant B</option>
                    <option value="Plant C">Plant C</option>
                  </select>
                  <FieldHint>Useful for multi-plant PCB manufacturing setups.</FieldHint>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="type">Location Type</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  >
                    <option value="Stores">Stores</option>
                    <option value="RM">Raw Material</option>
                    <option value="Chemicals">Chemicals</option>
                    <option value="WIP">WIP</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Dispatch">Dispatch</option>
                    <option value="Quarantine">Quarantine</option>
                  </select>
                  <FieldHint>Used to enforce movement rules (eg. Quarantine → QA release).</FieldHint>
                </div>

                <div className="space-y-1">
                  <Label>Status</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsActive(true)}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-sm",
                        isActive ? "border-[#dc2551] bg-[#dc2551]/10 text-[#dc2551]" : "border-gray-200 bg-white"
                      )}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsActive(false)}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-sm",
                        !isActive ? "border-[#dc2551] bg-[#dc2551]/10 text-[#dc2551]" : "border-gray-200 bg-white"
                      )}
                    >
                      Inactive
                    </button>
                  </div>
                  <FieldHint>Inactive locations are hidden from normal movement.</FieldHint>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes (handling rules, hazards, access...)"
                  />
                </div>
              </div>
            </Card>

            {/* Right - Capacity + quick info */}
            <Card className="rounded-2xl border bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
                  <Warehouse className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Capacity</h2>
                  <p className="text-sm text-gray-600">Optional limits for planning and safety.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="capUom">UoM</Label>
                  <select
                    id="capUom"
                    value={capUom}
                    onChange={(e) => setCapUom(e.target.value)}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Sheets">Sheets</option>
                    <option value="Panels">Panels</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="capQty">Max Qty</Label>
                  <Input
                    id="capQty"
                    value={capMaxQty}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.]/g, "");
                      setCapMaxQty(v);
                    }}
                    placeholder="e.g. 500"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="capW">Max Weight (kg)</Label>
                  <Input
                    id="capW"
                    value={capMaxWeightKg}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.]/g, "");
                      setCapMaxWeightKg(v);
                    }}
                    placeholder="e.g. 250"
                    inputMode="decimal"
                  />
                </div>

                <div className="rounded-2xl border bg-gray-50 p-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">Tip</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Use capacity limits to prevent over-stocking in chemical stores and to enforce safe stacking on racks.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Path builder */}
          <Card className="rounded-2xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Path structure</h2>
                <p className="text-sm text-gray-600">
                  Standardize locations for scanning: Zone → Aisle → Rack → Shelf → Bin
                </p>
              </div>
              <Badge variant="outline">{locationLabel}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="space-y-1">
                <Label htmlFor="zone">Zone</Label>
                <Input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="e.g. Z1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="aisle">Aisle</Label>
                <Input id="aisle" value={aisle} onChange={(e) => setAisle(e.target.value)} placeholder="e.g. A2" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rack">Rack</Label>
                <Input id="rack" value={rack} onChange={(e) => setRack(e.target.value)} placeholder="e.g. R3" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shelf">Shelf</Label>
                <Input id="shelf" value={shelf} onChange={(e) => setShelf(e.target.value)} placeholder="e.g. S1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bin">Bin</Label>
                <Input id="bin" value={bin} onChange={(e) => setBin(e.target.value)} placeholder="e.g. B08" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // helper: auto-generate a reasonable code if empty
                  const parts = [plant, type, zone, aisle, rack, shelf, bin].filter(Boolean);
                  const gen = parts
                    .join("-")
                    .replace(/\s+/g, "")
                    .toUpperCase()
                    .slice(0, 40);
                  if (!code.trim()) setCode(`LOC-${gen || "NEW"}`);
                  toast({ title: "Generated", description: "Generated a location code from the path fields." });
                }}
              >
                <Hash className="h-4 w-4" />
                Generate Code
              </Button>

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setZone("");
                  setAisle("");
                  setRack("");
                  setShelf("");
                  setBin("");
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Clear Path
              </Button>
            </div>
          </Card>

          {/* Bottom actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" asChild>
              <Link to="/warehouse/locations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Locations
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-[#dc2551] hover:bg-[#dc2551]/10 hover:text-[#dc2551]"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>

              <Button type="submit" className="gap-2 bg-cyan-600 hover:bg-cyan-500" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the location. If the location is used in stock movements, WIP, or traceability,
              deletion should be blocked by the backend.
              <span className="mt-2 block text-xs text-gray-500">
                Location: <span className="font-semibold text-gray-900">{code || "—"}</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
