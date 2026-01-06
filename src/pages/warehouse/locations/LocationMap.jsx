// src/pages/warehouse/locations/LocationMap.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Box,
  Boxes,
  Building2,
  Grid3X3,
  Layers3,
  MapPin,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * LocationMap.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/warehouse/locations/LocationMap.jsx
 *
 * Purpose:
 * - Visual map of warehouse locations (Zone -> Rack -> Row -> Bin)
 * - Fast lookup + occupancy + status, useful for Stores, Picking, Dispatch, QA Hold.
 *
 * Replace mocks with API:
 * - warehouseService.list({ plant })
 * - locationService.getMap({ warehouse_id, zone, q })
 * - locationService.block(id) / unblock(id)
 * - locationService.getById(id) to show detailed hover info
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  blocked: "bg-red-100 text-red-700",
};

const OCC_STYLE = {
  empty: "bg-white border-gray-200 hover:border-gray-300",
  low: "bg-amber-50 border-amber-200 hover:border-amber-300",
  medium: "bg-blue-50 border-blue-200 hover:border-blue-300",
  high: "bg-green-50 border-green-200 hover:border-green-300",
  full: "bg-red-50 border-red-200 hover:border-red-300",
};

function occBucket(pct) {
  if (pct == null) return "empty";
  if (pct <= 0) return "empty";
  if (pct < 30) return "low";
  if (pct < 60) return "medium";
  if (pct < 85) return "high";
  if (pct < 100) return "full";
  return "full";
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function LegendDot({ label, className }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <span className={cx("h-3 w-3 rounded-sm border", className)} />
      <span>{label}</span>
    </div>
  );
}

export default function LocationMap() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock plants/warehouses/zones (replace with backend)
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

  const zonesByWarehouse = useMemo(
    () => ({
      "WH-001": ["Stores", "ESD", "Incoming", "Dispatch"],
      "WH-002": ["Raw", "Chemicals", "Laminates"],
      "WH-003": ["WIP", "QA Hold"],
      "WH-004": ["FG", "Dispatch"],
      "WH-005": ["Spares", "Tools", "Quarantine"],
    }),
    []
  );

  const [plant, setPlant] = useState("Plant 1");
  const [warehouseId, setWarehouseId] = useState("WH-001");
  const [zone, setZone] = useState("Stores");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|active|blocked|inactive
  const [onlyBins, setOnlyBins] = useState(true);

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);

  const filteredWarehouses = useMemo(() => warehouses.filter((w) => w.plant === plant), [warehouses, plant]);
  const zoneOptions = useMemo(() => zonesByWarehouse[warehouseId] || ["Stores"], [zonesByWarehouse, warehouseId]);

  // Mock map data
  const mapData = useMemo(() => {
    // Create: 6 racks * 4 rows * 8 bins = 192 bins
    const racks = Array.from({ length: 6 }, (_, i) => String.fromCharCode(65 + i)); // A-F
    const rows = Array.from({ length: 4 }, (_, i) => `${i + 1}`.padStart(2, "0")); // 01-04
    const bins = Array.from({ length: 8 }, (_, i) => `${i + 1}`.padStart(2, "0")); // 01-08

    const items = [];
    racks.forEach((r) => {
      rows.forEach((rw) => {
        bins.forEach((b) => {
          const code = `${r}-${rw}-${b}`;
          // deterministic-ish occupancy based on char codes
          const seed = (r.charCodeAt(0) * 13 + parseInt(rw) * 7 + parseInt(b) * 5) % 101;
          const pct = Math.max(0, Math.min(100, seed));
          const status = seed % 17 === 0 ? "blocked" : seed % 29 === 0 ? "inactive" : "active";

          items.push({
            id: `LOC-${warehouseId}-${zone}-${code}`,
            code,
            name: `Rack ${r} Row ${rw} Bin ${b}`,
            type: "bin",
            status,
            occupancy_pct: pct,
            zone,
            warehouse_id: warehouseId,
            barcode: `LOC-${r}-${rw}-${b}`,
            last_move: "Today 12:40", // mock
            sku_count: Math.max(0, Math.floor((seed % 9) - 1)),
          });
        });
      });
    });

    // Add some non-bin nodes (rack markers)
    const rackNodes = racks.map((r) => ({
      id: `RACK-${warehouseId}-${zone}-${r}`,
      code: `RACK-${r}`,
      name: `Rack ${r}`,
      type: "rack",
      status: "active",
      occupancy_pct: null,
      zone,
      warehouse_id: warehouseId,
      barcode: `RACK-${r}`,
      last_move: "-",
      sku_count: "-",
    }));

    return { racks, rows, bins, rackNodes, binsData: items };
  }, [warehouseId, zone]);

  // Simulate fetch
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [plant, warehouseId, zone, q, statusFilter, onlyBins]);

  const visibleBins = useMemo(() => {
    let items = [...mapData.binsData];

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (x) =>
          x.code.toLowerCase().includes(needle) ||
          x.name.toLowerCase().includes(needle) ||
          (x.barcode || "").toLowerCase().includes(needle)
      );
    }

    if (statusFilter !== "all") {
      items = items.filter((x) => x.status === statusFilter);
    }

    if (!onlyBins) return items;

    return items.filter((x) => x.type === "bin");
  }, [mapData.binsData, q, statusFilter, onlyBins]);

  const totals = useMemo(() => {
    const all = mapData.binsData;
    const active = all.filter((x) => x.status === "active").length;
    const blocked = all.filter((x) => x.status === "blocked").length;
    const inactive = all.filter((x) => x.status === "inactive").length;

    const fullish = all.filter((x) => (x.occupancy_pct ?? 0) >= 85).length;
    const empty = all.filter((x) => (x.occupancy_pct ?? 0) <= 0).length;

    return { total: all.length, active, blocked, inactive, fullish, empty };
  }, [mapData.binsData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // await locationService.getMap(...)
      await new Promise((r) => setTimeout(r, 350));
      toast({ title: "Map refreshed", description: "Latest location status loaded." });
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (loc) => setSelected(loc);

  const requestToggleBlock = () => setConfirmBlockOpen(true);

  const confirmToggleBlock = async () => {
    setConfirmBlockOpen(false);
    if (!selected) return;

    try {
      const next = selected.status === "blocked" ? "active" : "blocked";
      // await locationService.setStatus(selected.id, next)
      toast({
        title: next === "blocked" ? "Location blocked" : "Location unblocked",
        description: `${selected.code} is now ${next}.`,
      });
      setSelected((s) => ({ ...s, status: next }));
    } catch (e) {
      toast({ title: "Update failed", description: "Could not update location status.", variant: "destructive" });
    }
  };

  const currentWarehouseName =
    filteredWarehouses.find((w) => w.id === warehouseId)?.name || "Warehouse";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <Grid3X3 className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Location Map</h1>
            <p className="text-sm text-gray-500">
              Visualize bins, occupancy, and blocked areas for fast put-away & picking (PCBxpress).
            </p>
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
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
            title="Refresh map"
          >
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={() => navigate("/warehouse/locations/create")}
          >
            <MapPin className="h-4 w-4" />
            New Location
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Select plant, warehouse, and zone to view the bin map.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Plant</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={plant}
                onChange={(e) => {
                  const nextPlant = e.target.value;
                  setPlant(nextPlant);

                  const firstWH = warehouses.find((w) => w.plant === nextPlant);
                  if (firstWH) {
                    setWarehouseId(firstWH.id);
                    const z = (zonesByWarehouse[firstWH.id] || ["Stores"])[0];
                    setZone(z);
                  }
                  setSelected(null);
                }}
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
            <Label>Warehouse</Label>
            <div className="relative">
              <WarehouseIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={warehouseId}
                onChange={(e) => {
                  const next = e.target.value;
                  setWarehouseId(next);
                  const z = (zonesByWarehouse[next] || ["Stores"])[0];
                  setZone(z);
                  setSelected(null);
                }}
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
            <Label>Zone</Label>
            <div className="relative">
              <Layers3 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  setSelected(null);
                }}
              >
                {zoneOptions.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Code / name / barcode"
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="onlyBins"
                  type="checkbox"
                  checked={onlyBins}
                  onChange={(e) => setOnlyBins(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="onlyBins" className="text-sm font-normal text-gray-700">
                  Show bins only
                </Label>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <LegendDot label="Empty" className="bg-white border-gray-200" />
                <LegendDot label="Low" className="bg-amber-50 border-amber-200" />
                <LegendDot label="Medium" className="bg-blue-50 border-blue-200" />
                <LegendDot label="High" className="bg-green-50 border-green-200" />
                <LegendDot label="Full" className="bg-red-50 border-red-200" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <MiniStat icon={Boxes} label="Total bins" value={totals.total} />
        <MiniStat icon={Box} label="Active" value={totals.active} />
        <MiniStat icon={ShieldAlert} label="Blocked" value={totals.blocked} />
        <MiniStat icon={Layers3} label="Inactive" value={totals.inactive} />
        <MiniStat icon={Boxes} label="≥85% full" value={totals.fullish} />
        <MiniStat icon={Box} label="Empty" value={totals.empty} />
      </div>

      {/* Map + Details */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">
                {currentWarehouseName} — {zone} Map
              </CardTitle>
              <CardDescription>
                Click a bin to view details. Block bins for quarantine/hold to prevent picking.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              {loading ? (
                <div className="grid place-items-center rounded-xl border bg-gray-50 p-10 text-sm text-gray-600">
                  <RefreshCw className="mb-2 h-5 w-5 animate-spin" />
                  Loading location map...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Rack headers */}
                  <div className="grid grid-cols-6 gap-2">
                    {mapData.rackNodes.map((rack) => (
                      <div
                        key={rack.id}
                        className="rounded-xl border bg-white px-3 py-2 text-center text-xs font-semibold text-gray-700"
                        title={rack.name}
                      >
                        {rack.code.replace("RACK-", "Rack ")}
                      </div>
                    ))}
                  </div>

                  {/* Bins grid (6 racks across) */}
                  <div className="grid grid-cols-6 gap-2">
                    {visibleBins.map((bin) => {
                      const occ = occBucket(bin.occupancy_pct);
                      const isSelected = selected?.id === bin.id;

                      return (
                        <button
                          key={bin.id}
                          type="button"
                          onClick={() => openDetails(bin)}
                          className={cx(
                            "group rounded-xl border p-2 text-left transition",
                            OCC_STYLE[occ],
                            bin.status === "blocked" ? "ring-1 ring-inset ring-red-200" : "",
                            isSelected ? "ring-2 ring-inset ring-[#dc2551]" : ""
                          )}
                          title={`${bin.name} • ${bin.occupancy_pct}% • ${bin.status}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-900">{bin.code}</p>
                            <Badge className={cx("rounded-full px-2 py-0.5 text-[10px]", STATUS_STYLE[bin.status])}>
                              {bin.status}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 w-full rounded-full bg-black/5">
                              <div
                                className="h-2 rounded-full bg-black/20"
                                style={{ width: `${Math.max(0, Math.min(100, bin.occupancy_pct ?? 0))}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-gray-600">{bin.occupancy_pct}% used</p>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                            <span>{bin.sku_count} SKU</span>
                            <span className="inline-flex items-center gap-1">
                              <QrCode className="h-3.5 w-3.5" />
                              Scan
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {visibleBins.length === 0 && (
                    <div className="rounded-xl border bg-gray-50 p-8 text-center text-sm text-gray-600">
                      No locations match your filters.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Details panel */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Location Details</CardTitle>
              <CardDescription>Inspect status, occupancy and quick actions.</CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              {!selected ? (
                <div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800">Select a bin</p>
                  <p className="mt-1">Click any location tile from the map to view details here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Code</p>
                        <p className="text-base font-bold text-gray-900">{selected.code}</p>
                        <p className="mt-1 text-sm text-gray-600">{selected.name}</p>
                      </div>
                      <Badge className={cx("rounded-full", STATUS_STYLE[selected.status])}>
                        {selected.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Occupancy</p>
                        <p className="text-lg font-bold text-gray-900">{selected.occupancy_pct}%</p>
                        <p className="text-[11px] text-gray-600">Used capacity</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">SKU count</p>
                        <p className="text-lg font-bold text-gray-900">{selected.sku_count}</p>
                        <p className="text-[11px] text-gray-600">Distinct items</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        {selected.barcode}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        {selected.last_move}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => navigate(`/warehouse/locations/${encodeURIComponent(selected.id)}`)}
                    >
                      <MapPin className="h-4 w-4" />
                      Open Location Page
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => navigate(`/inventory/stock?location=${encodeURIComponent(selected.code)}`)}
                    >
                      <Boxes className="h-4 w-4" />
                      View Stock in this Location
                    </Button>

                    <Button
                      className={cx(
                        "justify-start gap-2",
                        selected.status === "blocked"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-[#dc2551] hover:bg-[#b02045]"
                      )}
                      onClick={requestToggleBlock}
                    >
                      {selected.status === "blocked" ? (
                        <>
                          <Box className="h-4 w-4" />
                          Unblock Location
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4" />
                          Block Location (Hold)
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-semibold">Blocking rule</p>
                        <p className="mt-1 text-xs text-amber-900/80">
                          Blocked locations should not allow put-away or picking. Use for quarantine, QC hold, or
                          maintenance shutdown.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirm block/unblock */}
      <AlertDialog open={confirmBlockOpen} onOpenChange={setConfirmBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selected?.status === "blocked" ? "Unblock this location?" : "Block this location?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.status === "blocked"
                ? "This will allow picking/put-away again."
                : "This will prevent picking/put-away from this bin (recommended for QA Hold / quarantine)."}
              {selected?.code ? (
                <span className="block pt-2">
                  Location: <span className="font-medium">{selected.code}</span>
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleBlock}>
              {selected?.status === "blocked" ? "Unblock" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Local helper icon used in a select, keeps code tidy */
