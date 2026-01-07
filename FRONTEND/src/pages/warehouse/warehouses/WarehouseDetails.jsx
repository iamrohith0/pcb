// src/pages/warehouse/warehouses/WarehouseDetails.jsx
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
 * WarehouseDetails.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/warehouses/WarehouseDetails.jsx
 *
 * What this page does:
 * - Shows a single warehouse (WH) details: code, type (RM/WIP/FG/Chem), plant, address, status
 * - Shows storage summary: locations, bins, capacity usage, restricted zones (chemicals)
 * - Shows quick links: Locations, Picking, Packing, Stock Ledger, Cycle Count
 *
 * Replace mocks with APIs:
 * - warehouseService.getById(id)
 * - warehouseService.update(id, payload)
 * - locationService.list({ warehouse_id })
 * - stockService.summary({ warehouse_id })
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const WH_TYPE = {
  RM: "Raw Materials",
  WIP: "WIP Stores",
  FG: "Finished Goods",
  CHEM: "Chemicals",
  PKG: "Packing",
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
  if (t === "CHEM") return "bg-[#dc2551]/10 text-[#dc2551]";
  if (t === "FG") return "bg-blue-100 text-blue-800";
  if (t === "WIP") return "bg-purple-100 text-purple-800";
  if (t === "PKG") return "bg-indigo-100 text-indigo-800";
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

export default function WarehouseDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams(); // e.g., "WH1" or numeric id depending on your router

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // warehouse data (mock)
  const [warehouse, setWarehouse] = useState(null);

  // edit form
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "RM",
    plant: "Plant-1",
    address: "",
    status: "active",
    is_ip_restricted: false,
  });

  // related summaries (mock)
  const [locations, setLocations] = useState([]);
  const [stockSummary, setStockSummary] = useState({
    sku_count: 0,
    total_qty: 0,
    low_stock: 0,
    expiring_lots: 0,
  });

  // search for locations list preview
  const [locQuery, setLocQuery] = useState("");

  const headerTitle = useMemo(() => {
    if (!warehouse) return "Warehouse Details";
    return `${warehouse.code} — ${warehouse.name}`;
  }, [warehouse]);

  const filteredLocations = useMemo(() => {
    const q = locQuery.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => {
      const hay = [l.code, l.zone, l.aisle, l.rack, l.bin, l.type].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [locations, locQuery]);

  const capacity = useMemo(() => {
    if (!warehouse) return { used: 0, total: 0, pct: 0 };
    const total = warehouse.capacity_total;
    const used = warehouse.capacity_used;
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return { used, total, pct };
  }, [warehouse]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // const wh = await warehouseService.getById(id)
      // const locs = await locationService.list({ warehouse_id: id })
      // const sum = await stockService.summary({ warehouse_id: id })
      await new Promise((r) => setTimeout(r, 350));

      // Mock warehouse
      const wh = {
        id: id || "WH1",
        code: (id || "WH1").toUpperCase(),
        name: "Main Stores",
        type: "RM",
        plant: "Plant-1",
        address: "Industrial Estate, Block C, Kerala",
        status: "active",
        is_ip_restricted: true,
        created_at: "2025-10-12",
        updated_at: "2026-01-04",
        capacity_total: 12000, // bin capacity units (example)
        capacity_used: 6450,
        safety_notes:
          "RM warehouse: keep laminates in humidity-controlled zone. Chemicals only in CHEM store.",
      };

      // Mock locations
      const locs = [
        { id: "LOC-001", code: "WH1-A-01-R1-B01", zone: "A", aisle: "01", rack: "R1", bin: "B01", type: "BIN", status: "active" },
        { id: "LOC-002", code: "WH1-A-01-R1-B02", zone: "A", aisle: "01", rack: "R1", bin: "B02", type: "BIN", status: "active" },
        { id: "LOC-003", code: "WH1-B-02-R2-B05", zone: "B", aisle: "02", rack: "R2", bin: "B05", type: "BIN", status: "active" },
        { id: "LOC-004", code: "WH1-QA-HOLD", zone: "QA", aisle: "-", rack: "-", bin: "-", type: "HOLD", status: "restricted" },
        { id: "LOC-005", code: "WH1-RECEIVE-DOCK", zone: "RCV", aisle: "-", rack: "-", bin: "-", type: "DOCK", status: "active" },
      ];

      // Mock summary
      const sum = { sku_count: 318, total_qty: 28940, low_stock: 14, expiring_lots: 3 };

      setWarehouse(wh);
      setLocations(locs);
      setStockSummary(sum);

      setForm({
        name: wh.name,
        code: wh.code,
        type: wh.type,
        plant: wh.plant,
        address: wh.address,
        status: wh.status,
        is_ip_restricted: wh.is_ip_restricted,
      });
    } catch (e) {
      toast({
        title: "Failed",
        description: "Could not load warehouse details.",
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
    if (!form.name.trim() || !form.code.trim()) {
      toast({
        title: "Missing fields",
        description: "Warehouse name and code are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // await warehouseService.update(id, form)
      await new Promise((r) => setTimeout(r, 350));

      setWarehouse((prev) => ({
        ...(prev || {}),
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        type: form.type,
        plant: form.plant.trim(),
        address: form.address.trim(),
        status: form.status,
        is_ip_restricted: form.is_ip_restricted,
        updated_at: "2026-01-06",
      }));
      setEditMode(false);

      toast({ title: "Saved", description: "Warehouse updated successfully." });
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
    if (!warehouse) return;
    setForm({
      name: warehouse.name,
      code: warehouse.code,
      type: warehouse.type,
      plant: warehouse.plant,
      address: warehouse.address,
      status: warehouse.status,
      is_ip_restricted: warehouse.is_ip_restricted,
    });
    setEditMode(false);
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
            <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
            <p className="text-sm text-gray-500">
              Manage warehouse settings, locations, and inventory overview for PCB operations.
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
        <Stat icon={Box} label="Total Qty" value={stockSummary.total_qty} hint="Across all bins" />
        <Stat icon={ClipboardList} label="Low Stock" value={stockSummary.low_stock} hint="Needs replenishment" />
        <Stat icon={CalendarDays} label="Expiring Lots" value={stockSummary.expiring_lots} hint="Chemicals / prepreg" />
      </div>

      {/* Details + Capacity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Warehouse Information</CardTitle>
            <CardDescription>Core identity, plant mapping, and compliance controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* Top badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cx("rounded-full", typeBadge(form.type))}>
                {form.type} · {WH_TYPE[form.type]}
              </Badge>
              <Badge className={cx("rounded-full", statusBadge(form.status))}>
                {STATUS[form.status]}
              </Badge>
              {form.is_ip_restricted ? (
                <Badge className="rounded-full bg-blue-100 text-blue-800">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  IP Restricted
                </Badge>
              ) : (
                <Badge className="rounded-full bg-gray-100 text-gray-700">Standard Access</Badge>
              )}
            </div>

            <Divider />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Warehouse Name</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., Main Stores"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Warehouse Code</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.code}
                    onChange={(e) => onChange("code", e.target.value.toUpperCase())}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., WH1"
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
                    <option value="RM">RM — Raw Materials</option>
                    <option value="WIP">WIP — Work In Progress</option>
                    <option value="FG">FG — Finished Goods</option>
                    <option value="CHEM">CHEM — Chemicals</option>
                    <option value="PKG">PKG — Packing</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Plant</Label>
                <div className="relative">
                  <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.plant}
                    onChange={(e) => onChange("plant", e.target.value)}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="e.g., Plant-1"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Address</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.address}
                    onChange={(e) => onChange("address", e.target.value)}
                    disabled={!editMode}
                    className="pl-9"
                    placeholder="Warehouse address"
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

              <div className="space-y-2">
                <Label>Security</Label>
                <div className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-gray-600" />
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-900">IP Restricted</p>
                      <p className="text-xs text-gray-500">Limit warehouse actions to whitelisted IPs</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_ip_restricted}
                    onChange={(e) => onChange("is_ip_restricted", e.target.checked)}
                    disabled={!editMode}
                    className="h-4 w-4 accent-[#dc2551]"
                  />
                </div>
              </div>
            </div>

            {warehouse?.safety_notes ? (
              <>
                <Divider />
                <div className="rounded-2xl border bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-gray-700" />
                    <p className="text-sm font-semibold text-gray-900">Safety / Handling Notes</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{warehouse.safety_notes}</p>
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
                Tip: keep CHEM store below 70% for safe segregation & access.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button asChild variant="outline" className="justify-between">
                <Link to="/warehouse/locations">
                  Locations
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

              <Button asChild variant="outline" className="justify-between">
                <Link to="/inventory/stock">
                  Stock (Ledger)
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

            {warehouse ? (
              <div className="rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-700" />
                  <p className="font-semibold text-gray-900">Audit Trail</p>
                </div>
                <div className="mt-2 space-y-1">
                  <p>
                    Created: <span className="font-medium text-gray-900">{warehouse.created_at}</span>
                  </p>
                  <p>
                    Updated: <span className="font-medium text-gray-900">{warehouse.updated_at}</span>
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Locations preview */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-white">
          <CardTitle className="text-base">Locations (Preview)</CardTitle>
          <CardDescription>
            Common storage locations and special zones like QA HOLD / Receiving Dock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-lg">
              <Label htmlFor="locSearch">Search locations</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="locSearch"
                  value={locQuery}
                  onChange={(e) => setLocQuery(e.target.value)}
                  placeholder="Search by code, zone, aisle, rack, bin..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/warehouse/locations/create">
                  <Box className="h-4 w-4" />
                  Create Location
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
            {filteredLocations.map((l) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="rounded-2xl border bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-gray-900">{l.code}</p>
                      <Badge className={cx("rounded-full", statusBadge(l.status))}>
                        {l.status === "active" ? "ACTIVE" : "RESTRICTED"}
                      </Badge>
                      <Badge className="rounded-full bg-gray-100 text-gray-700">{l.type}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-black/5">
                        Zone: <span className="font-semibold text-gray-900">{l.zone}</span>
                      </span>
                      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-black/5">
                        Aisle: <span className="font-semibold text-gray-900">{l.aisle}</span>
                      </span>
                      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-black/5">
                        Rack: <span className="font-semibold text-gray-900">{l.rack}</span>
                      </span>
                      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-black/5">
                        Bin: <span className="font-semibold text-gray-900">{l.bin}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button asChild variant="outline" className="gap-2">
                      <Link to={`/warehouse/locations/${encodeURIComponent(l.id)}`}>
                        Details
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredLocations.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
                  <MapPin className="h-5 w-5 text-gray-700" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">No locations found</p>
                <p className="mt-1 text-sm text-gray-500">Try another search term.</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
