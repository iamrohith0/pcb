// src/pages/traceability/batch/BatchRegister.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Barcode,
    Calendar,
    ClipboardList,
    Factory,
    Hash,
    Layers,
    Loader2,
    Package,
    QrCode,
    Search,
    ShieldCheck,
    Tag,
    User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function statusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("HOLD")) return "border-amber-200 bg-amber-50 text-amber-700";
  if (s.includes("FAIL") || s.includes("REJECT")) return "border-red-200 bg-red-50 text-red-700";
  if (s.includes("PASS") || s.includes("APPROV")) return "border-green-200 bg-green-50 text-green-700";
  if (s.includes("OPEN") || s.includes("WIP")) return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

/**
 * PCBxpress ERP - Batch Register
 * Folder: src/pages/traceability/batch/BatchRegister.jsx
 *
 * What this page does:
 * - Create / Register a new manufacturing batch (from job/lot + specs)
 * - Shows a preview card (what will be printed on traveler label)
 * - Redirects to BatchPrint after successful creation (optional)
 *
 * Recommended routes:
 *  - /traceability/batch/register
 *
 * Recommended backend endpoints:
 *  - POST /traceability/batches
 *    body:
 *      {
 *        job_no, lot_no, customer, part_no, panel_rev,
 *        layer_count, thickness_mm, copper_oz,
 *        qty_panels, qty_pcs, uom,
 *        route_name, current_station,
 *        quality_status, notes
 *      }
 *    returns: { batch: { id, batch_no, ... } }
 *
 * Optional helpers:
 *  - GET /masters/routes   (for route dropdown)
 *  - GET /masters/stations (for station dropdown)
 */

export default function BatchRegister() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // prefill from query if coming from other screens
  const preJob = sp.get("job_no") || "";
  const preLot = sp.get("lot_no") || "";
  const preCustomer = sp.get("customer") || "";
  const prePart = sp.get("part_no") || "";
  const preRev = sp.get("rev") || "";

  const [form, setForm] = useState({
    job_no: preJob,
    lot_no: preLot,
    customer: preCustomer,
    part_no: prePart,
    panel_rev: preRev,
    layer_count: "",
    thickness_mm: "",
    copper_oz: "",
    qty_panels: "",
    qty_pcs: "",
    uom: "PCS",
    route_name: "",
    current_station: "",
    quality_status: "OPEN",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  // Optional: load routes/stations for suggestions
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMasters = async () => {
      setLoadingMasters(true);
      try {
        // If these endpoints do not exist in your backend, this will fail silently (and inputs remain manual).
        const [r1, r2] = await Promise.allSettled([api.get("/masters/routes"), api.get("/masters/stations")]);

        const routesPayload =
          r1.status === "fulfilled" ? r1.value?.data?.data ?? r1.value?.data?.routes ?? r1.value?.data : [];
        const stationsPayload =
          r2.status === "fulfilled" ? r2.value?.data?.data ?? r2.value?.data?.stations ?? r2.value?.data : [];

        if (!mounted) return;

        setRoutes(Array.isArray(routesPayload) ? routesPayload : []);
        setStations(Array.isArray(stationsPayload) ? stationsPayload : []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingMasters(false);
      }
    };

    loadMasters();
    return () => {
      mounted = false;
    };
  }, []);

  const preview = useMemo(() => {
    // Build a minimal preview object similar to BatchPrint expectations
    return {
      job_no: form.job_no,
      lot_no: form.lot_no,
      customer: form.customer,
      part_no: form.part_no,
      panel_rev: form.panel_rev,
      layer_count: form.layer_count,
      thickness_mm: form.thickness_mm,
      copper_oz: form.copper_oz,
      qty_panels: form.qty_panels,
      qty_pcs: form.qty_pcs,
      uom: form.uom,
      route_name: form.route_name,
      current_station: form.current_station,
      quality_status: form.quality_status,
      created_at: new Date().toISOString(),
      created_by: "You",
      barcode_payload: form.job_no || form.lot_no || form.part_no || "BATCH",
      qr_payload: JSON.stringify(
        {
          job: form.job_no || undefined,
          lot: form.lot_no || undefined,
          part: form.part_no || undefined,
          rev: form.panel_rev || undefined,
        },
        null,
        0
      ),
    };
  }, [form]);

  const update = (key) => (e) => {
    setForm((s) => ({ ...s, [key]: e.target.value }));
  };

  const validate = () => {
    // Minimal validation rules (tune as per your ERP)
    if (!form.job_no?.trim() && !form.lot_no?.trim()) {
      return "Provide at least Job No or Lot No.";
    }
    if (!form.part_no?.trim()) {
      return "Part No is required.";
    }
    if (!form.route_name?.trim()) {
      return "Route is required.";
    }
    if (!form.current_station?.trim()) {
      return "Current station is required.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        // normalize numeric fields if you want
        layer_count: form.layer_count ? Number(form.layer_count) : null,
        thickness_mm: form.thickness_mm ? Number(form.thickness_mm) : null,
        copper_oz: form.copper_oz ? Number(form.copper_oz) : null,
        qty_panels: form.qty_panels ? Number(form.qty_panels) : null,
        qty_pcs: form.qty_pcs ? Number(form.qty_pcs) : null,
      };

      const res = await api.post("/traceability/batches", payload);
      const created = res?.data?.batch ?? res?.data?.data?.batch ?? res?.data?.data ?? res?.data;

      const createdId = created?.id ?? created?._id ?? created?.batch_id;
      const createdBatchNo = created?.batch_no ?? created?.batchNo;

      toast({
        title: "Batch registered",
        description: createdBatchNo ? `Batch ${createdBatchNo} created successfully.` : "Batch created successfully.",
      });

      // Redirect to print page by default (common workflow in PCB)
      if (createdId) {
        navigate(`/traceability/batch/print?batch_id=${encodeURIComponent(createdId)}`, { replace: true });
      } else {
        // fallback: go to batch list if you have it
        navigate(`/traceability/batch`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 422 ? "Please check input values." : "Failed to register batch. Please try again.");
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="border bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#dc2551]/10 p-3">
                  <ClipboardList className="h-6 w-6 text-[#dc2551]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Batch Register</CardTitle>
                  <CardDescription>Create a new PCB manufacturing batch for traceability and traveler printing.</CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="ghost" className="gap-2">
                  <Link to="/traceability/batch">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Job / Lot / Customer */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="job_no">Job No</Label>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="job_no"
                          value={form.job_no}
                          onChange={update("job_no")}
                          placeholder="JOB-2026-001"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lot_no">Lot No</Label>
                      <div className="relative">
                        <Package className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="lot_no"
                          value={form.lot_no}
                          onChange={update("lot_no")}
                          placeholder="LOT-001"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="customer"
                          value={form.customer}
                          onChange={update("customer")}
                          placeholder="Customer name"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part / Rev */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="part_no">Part No *</Label>
                      <div className="relative">
                        <Tag className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="part_no"
                          value={form.part_no}
                          onChange={update("part_no")}
                          placeholder="PCB-PART-0001"
                          required
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="panel_rev">Panel / Gerber Rev</Label>
                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="panel_rev"
                          value={form.panel_rev}
                          onChange={update("panel_rev")}
                          placeholder="REV-A"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="layer_count">Layers</Label>
                      <div className="relative">
                        <Layers className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="layer_count"
                          value={form.layer_count}
                          onChange={update("layer_count")}
                          placeholder="2"
                          inputMode="numeric"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="thickness_mm">Thickness (mm)</Label>
                      <Input
                        id="thickness_mm"
                        value={form.thickness_mm}
                        onChange={update("thickness_mm")}
                        placeholder="1.6"
                        inputMode="decimal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="copper_oz">Copper (oz)</Label>
                      <Input
                        id="copper_oz"
                        value={form.copper_oz}
                        onChange={update("copper_oz")}
                        placeholder="1"
                        inputMode="decimal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quality_status">Status</Label>
                      <Input
                        id="quality_status"
                        value={form.quality_status}
                        onChange={update("quality_status")}
                        placeholder="OPEN / WIP / HOLD"
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="qty_panels">Qty Panels</Label>
                      <Input
                        id="qty_panels"
                        value={form.qty_panels}
                        onChange={update("qty_panels")}
                        placeholder="10"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qty_pcs">Qty Pieces</Label>
                      <Input
                        id="qty_pcs"
                        value={form.qty_pcs}
                        onChange={update("qty_pcs")}
                        placeholder="100"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uom">UOM</Label>
                      <Input id="uom" value={form.uom} onChange={update("uom")} placeholder="PCS" />
                    </div>
                  </div>

                  {/* Route + Station */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="route_name">Route *</Label>
                      <div className="relative">
                        <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="route_name"
                          value={form.route_name}
                          onChange={update("route_name")}
                          placeholder="Standard FR4 2L Route"
                          required
                          className="pl-9"
                          list="routes-list"
                        />
                        <datalist id="routes-list">
                          {routes.map((r) => {
                            const key = r?.id ?? r?._id ?? r?.name ?? JSON.stringify(r);
                            const name = r?.name ?? r?.route_name ?? r?.title ?? "";
                            return name ? <option key={key} value={name} /> : null;
                          })}
                        </datalist>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="current_station">Current Station *</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="current_station"
                          value={form.current_station}
                          onChange={update("current_station")}
                          placeholder="CAM / Imaging / Etching"
                          required
                          className="pl-9"
                          list="stations-list"
                        />
                        <datalist id="stations-list">
                          {stations.map((s) => {
                            const key = s?.id ?? s?._id ?? s?.name ?? JSON.stringify(s);
                            const name = s?.name ?? s?.station_name ?? s?.title ?? "";
                            return name ? <option key={key} value={name} /> : null;
                          })}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (special instructions)</Label>
                    <Input
                      id="notes"
                      value={form.notes}
                      onChange={update("notes")}
                      placeholder="e.g., Impedance controlled, 100% e-test, gold fingers…"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      type="submit"
                      className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                      {loading ? "Registering..." : "Register Batch"}
                    </Button>

                    {loadingMasters && (
                      <span className="text-xs text-gray-500">Loading route/station suggestions…</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Tip: You can register a batch and immediately print the traveler label for shop-floor scanning.
                  </p>
                </form>
              </div>

              {/* Preview */}
              <div className="lg:col-span-1">
                <Card className="border bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Preview</CardTitle>
                    <CardDescription className="text-xs">What will appear on the traveler label.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Status</div>
                      <Badge className={cx("border", statusBadgeClass(preview.quality_status))}>
                        {safe(preview.quality_status)}
                      </Badge>
                    </div>

                    <div className="rounded-xl border p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Hash className="h-4 w-4 text-[#dc2551]" />
                        Job / Lot
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Job</span>
                          <span className="font-semibold">{safe(preview.job_no)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Lot</span>
                          <span className="font-semibold">{safe(preview.lot_no)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Tag className="h-4 w-4 text-[#dc2551]" />
                        Part / Rev
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Part</span>
                          <span className="font-semibold">{safe(preview.part_no)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Rev</span>
                          <span className="font-semibold">{safe(preview.panel_rev)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Factory className="h-4 w-4 text-[#dc2551]" />
                        Route / Station
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Route</span>
                          <span className="font-semibold">{safe(preview.route_name)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Station</span>
                          <span className="font-semibold">{safe(preview.current_station)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Calendar className="h-4 w-4 text-[#dc2551]" />
                        Created
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">Time</span>
                          <span className="font-semibold">{fmtDate(preview.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <QrCode className="h-4 w-4 text-[#dc2551]" />
                          QR
                        </div>
                        <div className="grid h-20 place-items-center rounded-lg bg-gray-50 text-[10px] text-gray-600">
                          (QR render later)
                        </div>
                      </div>

                      <div className="rounded-xl border p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <Barcode className="h-4 w-4 text-[#dc2551]" />
                          Barcode
                        </div>
                        <div className="grid h-20 place-items-center rounded-lg bg-gray-50 font-mono text-[10px] text-gray-700">
                          {safe(preview.barcode_payload)}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      After registering, you’ll be redirected to the print page automatically.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
