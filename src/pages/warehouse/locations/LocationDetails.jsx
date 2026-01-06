// src/pages/warehouse/locations/LocationDetails.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Box,
    Building2,
    CalendarDays,
    ClipboardList,
    Factory,
    Hash,
    MapPin,
    Package,
    Pencil,
    RefreshCw,
    Route,
    Search,
    ShieldCheck,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

/**
 * LocationDetails.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/locations/LocationDetails.jsx
 *
 * What this page does:
 * - Shows a single location details: code, zone, aisle, rack, bin, type, status
 * - Shows storage summary: current stock, capacity, reserved items
 * - Shows quick links: Stock Ledger, Move Items, Cycle Count
 *
 * Replace mocks with APIs:
 * - locationService.getById(id)
 * - locationService.update(id, payload)
 * - stockService.list({ location_id })
 * - stockService.summary({ location_id })
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const LOCATION_TYPE = {
  BIN: "Bin",
  DOCK: "Dock",
  HOLD: "Hold",
  QC: "QC",
  PICK: "Pick",
  PACK: "Pack",
};

const STATUS = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  restricted: "RESTRICTED",
};

const statusBadge = (s) => {
  if (s === "restricted") return "bg-amber-100 text-amber-800";
  if (s === "inactive") return "bg-gray-100 text-gray-700";
  return "bg-green-100 text-green-800";
};

const typeBadge = (t) => {
  if (t === "HOLD") return "bg-amber-100 text-amber-800";
  if (t === "QC") return "bg-blue-100 text-blue-800";
  if (t === "PICK") return "bg-purple-100 text-purple-800";
  if (t === "PACK") return "bg-indigo-100 text-indigo-800";
  if (t === "DOCK") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-800";
};

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gray-50">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="text-lg font-extrabold text-gray-900">{value}</p>
        {hint ? <p className="text-[11px] text-gray-500">{hint}</p> : null}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-gray-100" />;
}

export default function LocationDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams(); // e.g., "LOC-001" or location code

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // location data (mock)
  const [location, setLocation] = useState(null);

  // edit form
  const [form, setForm] = useState({
    code: "",
    zone: "",
    aisle: "",
    rack: "",
    bin: "",
    type: "BIN",
    status: "active",
    capacity: 0,
    reserved: false,
    is_qc_required: false,
  });

  // related summaries (mock)
  const [stockSummary, setStockSummary] = useState({
    sku_count: 0,
    total_qty: 0,
    reserved_qty: 0,
    last_activity: "",
  });

  // search for stock items list preview
  const [stockQuery, setStockQuery] = useState("");

  const headerTitle = useMemo(() => {
    if (!location) return "Location Details";
    return `${location.code} — ${location.zone}-${location.aisle}-${location.rack}-${location.bin}`;
  }, [location]);

  const filteredStock = useMemo(() => {
    const q = stockQuery.trim().toLowerCase();
    if (!q) return [];
    // Mock stock items for preview
    return [
      { sku: "FR4-1.6mm", qty: 150, lot: "L-20260101-001", expiry: "2026-12-31" },
      { sku: "Copper-1oz", qty: 89, lot: "L-20260102-002", expiry: "2026-11-15" },
    ].filter(item => 
      item.sku.toLowerCase().includes(q) || 
      item.lot.toLowerCase().includes(q)
    );
  }, [stockQuery]);

  const capacity = useMemo(() => {
    if (!location) return { used: 0, total: 0, pct: 0 };
    const total = location.capacity || 100;
    const used = stockSummary.total_qty || 0;
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return { used, total, pct };
  }, [location, stockSummary]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // const loc = await locationService.getById(id)
      // const sum = await stockService.summary({ location_id: id })
      await new Promise((r) => setTimeout(r, 350));

      // Mock location
      const loc = {
        id: id || "LOC-001",
        code: (id || "LOC-001").toUpperCase(),
        zone: "A",
        aisle: "01",
        rack: "R1",
        bin: "B01",
        type: "BIN",
        status: "active",
        capacity: 200,
        reserved: false,
        is_qc_required: false,
        created_at: "2025-10-12",
        updated_at: "2026-01-04",
        notes: "Standard storage bin for laminates and prepreg materials.",
      };

      // Mock summary
      const sum = { sku_count: 2, total_qty: 239, reserved_qty: 0, last_activity: "2026-01-05" };

      setLocation(loc);
      setStockSummary(sum);

      setForm({
        code: loc.code,
        zone: loc.zone,
        aisle: loc.aisle,
        rack: loc.rack,
        bin: loc.bin,
        type: loc.type,
        status: loc.status,
        capacity: loc.capacity,
        reserved: loc.reserved,
        is_qc_required: loc.is_qc_required,
      });
    } catch (e) {
      toast({
        title: "Failed",
        description: "Could not load location details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const save = async () => {
    if (!form.code.trim() || !form.zone.trim() || !form.aisle.trim() || !form.rack.trim() || !form.bin.trim()) {
      toast({
        title: "Missing fields",
        description: "Location code, zone, aisle, rack, and bin are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // await locationService.update(id, form)
      await new Promise((r) => setTimeout(r, 350));

      setLocation((prev) => ({
        ...(prev || {}),
        code: form.code.trim().toUpperCase(),
        zone: form.zone.trim().toUpperCase(),
        aisle: form.aisle.trim(),
        rack: form.rack.trim().toUpperCase(),
        bin: form.bin.trim().toUpperCase(),
        type: form.type,
        status: form.status,
        capacity: parseInt(form.capacity) || 0,
        reserved: form.reserved,
        is_qc_required: form.is_qc_required,
        updated_at: "2026-01-06",
      }));
      setEditMode(false);

      toast({ title: "Saved", description: "Location updated successfully." });
    } catch (e) {
      toast({
        title: "Failed",
        description: "Could not save changes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    if (!location) return;
    setForm({
      code: location.code,
      zone: location.zone,
      aisle: location.aisle,
      rack: location.rack,
      bin: location.bin,
      type: location.type,
      status: location.status,
      capacity: location.capacity,
      reserved: location.reserved,
      is_qc_required: location.is_qc_required,
    });
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <MapPin className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
            <p className="text-sm text-gray-500">
              Manage location settings, capacity, and inventory overview for PCB operations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" onClick={fetchAll} disabled={loading} className="gap-2">
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          {!editMode ? (
            <Button
              onClick={() => setEditMode(true)}
              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
              disabled={loading}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={cancel} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={save} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500">
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Package} label="SKUs" value={stockSummary.sku_count} hint="Items stored" />
        <Stat icon={Box} label="Total Qty" value={stockSummary.total_qty} hint="Current stock" />
        <Stat icon={ClipboardList} label="Reserved Qty" value={stockSummary.reserved_qty} hint="Allocated items" />
        <Stat icon={CalendarDays} label="Last Activity" value={stockSummary.last_activity} hint="Stock movement" />
      </div>

      {/* Details + Capacity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Location Information</CardTitle>
            <CardDescription>Zone mapping, capacity limits, and operational flags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* Top badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cx("rounded-full", typeBadge(form.type))}>
                {form.type} · {LOCATION_TYPE[form.type]}
              </Badge>
              <Badge className={cx("rounded-full", statusBadge(form.status))}>
                {STATUS[form.status]}
              </Badge>
              {form.reserved ? (
                <Badge className="rounded-full bg-amber-100 text-amber-800">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Reserved
                </Badge>
              ) : null}
              {form.is_qc_required ? (
                <Badge className="rounded-full bg-blue-100 text-blue-800">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                  QC Required
                </Badge>
              ) : null}
            </div>

            <Divider />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Location Code</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.code}
                    onChange={(e) => onChange("code", e.target.value.toUpperCase())}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., LOC-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zone</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.zone}
                    onChange={(e) => onChange("zone", e.target.value.toUpperCase())}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., A"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aisle</Label>
                <div className="relative">
                  <Route className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.aisle}
                    onChange={(e) => onChange("aisle", e.target.value)}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., 01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rack</Label>
                <div className="relative">
                  <WarehouseIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.rack}
                    onChange={(e) => onChange("rack", e.target.value.toUpperCase())}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., R1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bin</Label>
                <div className="relative">
                  <Box className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.bin}
                    onChange={(e) => onChange("bin", e.target.value.toUpperCase())}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., B01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <div className="relative">
                  <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    value={form.type}
                    onChange={(e) => onChange("type", e.target.value)}
                    disabled={!editMode}
                    className={cx(
                      "h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none",
                      "focus:ring-2 focus:ring-black/10 disabled:bg-gray-50 disabled:text-gray-700"
                    )}
                  >
                    <option value="BIN">BIN — Storage Bin</option>
                    <option value="DOCK">DOCK — Receiving Dock</option>
                    <option value="HOLD">HOLD — Quarantine/Hold</option>
                    <option value="QC">QC — Quality Check</option>
                    <option value="PICK">PICK — Picking Zone</option>
                    <option value="PACK">PACK — Packing Zone</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capacity</Label>
                <div className="relative">
                  <Package className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => onChange("capacity", parseInt(e.target.value) || 0)}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., 200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  disabled={!editMode}
                  className={cx(
                    "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                    "focus:ring-2 focus:ring-black/10 disabled:bg-gray-50 disabled:text-gray-700"
                  )}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
            </div>

            <Divider />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Operational Flags</Label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="checkbox"
                    checked={form.reserved}
                    onChange={(e) => onChange("reserved", e.target.checked)}
                    disabled={!editMode}
                    className="h-4 w-4 accent-[#dc2551]"
                  />
                  <Label className="text-sm font-medium text-gray-900">Reserved Location</Label>
                </div>
                <p className="text-xs text-gray-500">Prevents automatic stock allocation to this location.</p>
              </div>

              <div className="space-y-2">
                <Label>Quality Control</Label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_qc_required}
                    onChange={(e) => onChange("is_qc_required", e.target.checked)}
                    disabled={!editMode}
                    className="h-4 w-4 accent-[#dc2551]"
                  />
                  <Label className="text-sm font-medium text-gray-900">QC Required</Label>
                </div>
                <p className="text-xs text-gray-500">Items in this location require quality inspection before use.</p>
              </div>
            </div>

            {location?.notes ? (
              <>
                <Divider />
                <div className="rounded-2xl border bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-gray-700" />
                    <p className="text-sm font-semibold text-gray-900">Notes</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{location.notes}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Capacity & Quick Actions</CardTitle>
            <CardDescription>Storage utilization and navigation shortcuts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Capacity Utilization</p>
                  <p className="text-xs text-gray-500">
                    Used {capacity.used} / {capacity.total}
                  </p>
                </div>
                <Badge className="rounded-full bg-gray-100 text-gray-700">{capacity.pct}%</Badge>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-[#dc2551]"
                  style={{ width: `${capacity.pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Tip: keep capacity below 80% for easy picking and put-away operations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button asChild variant="outline" className="justify-between">
                <Link to="/inventory/stock">
                  Stock Ledger
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-between">
                <Link to="/warehouse/picking">
                  Picking
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-between">
                <Link to="/warehouse/packing">
                  Packing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild className="justify-between bg-cyan-600 hover:bg-cyan-500">
                <Link to="/inventory/stock/cycle-count">
                  Cycle Count
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {location ? (
              <div className="rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-700" />
                  <p className="font-semibold text-gray-900">Audit Trail</p>
                </div>
                <div className="mt-2 space-y-1">
                  <p>
                    Created: <span className="font-medium text-gray-900">{location.created_at}</span>
                  </p>
                  <p>
                    Updated: <span className="font-medium text-gray-900">{location.updated_at}</span>
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Stock preview */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-base">Current Stock (Preview)</CardTitle>
          <CardDescription>
            Items currently stored in this location with lot tracking and expiry information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-lg">
              <Label htmlFor="stockSearch">Search stock items</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="stockSearch"
                  value={stockQuery}
                  onChange={(e) => setStockQuery(e.target.value)}
                  placeholder="Search by SKU, lot number..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/warehouse/locations">
                  <MapPin className="h-4 w-4" />
                  All Locations
                </Link>
              </Button>

              <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-500">
                <Link to="/warehouse/locations/map">
                  <Route className="h-4 w-4" />
                  Location Map
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredStock.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="rounded-2xl border bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-gray-900">{item.sku}</p>
                      <Badge className="rounded-full bg-gray-100 text-gray-700">LOT: {item.lot}</Badge>
                      {item.expiry && (
                        <Badge className="rounded-full bg-amber-100 text-amber-800">
                          EXP: {item.expiry}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-black/5">
                        Qty: <span className="font-semibold text-gray-900">{item.qty}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button asChild variant="outline" className="gap-2">
                      <Link to={`/inventory/stock/${encodeURIComponent(item.sku)}`}>
                        Details
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredStock.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
                  <Package className="h-5 w-5 text-gray-700" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">No stock found</p>
                <p className="mt-1 text-sm text-gray-500">This location is currently empty or no items match your search.</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}