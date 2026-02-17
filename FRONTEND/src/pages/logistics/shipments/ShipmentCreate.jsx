// src/pages/logistics/shipments/ShipmentCreate.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import salesOrdersService from "@/services/sales/salesOrders.service";
import shipmentService from "@/services/logistics/shipments.service";
import warehousesService from "@/services/warehouse/warehouses.service";

import {
  AlertCircle,
  ArrowLeft,
  Box,
  ClipboardList,
  Copy,
  FileText,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";

/**
 * PCBxpress - ShipmentCreate
 * Folder: src/pages/logistics/shipments/ShipmentCreate.jsx
 *
 * Creates a shipment record used by Dispatch/Logistics:
 * - Link to SO/WO/Dispatch
 * - Customer + Ship-to
 * - Carrier + service + pickup + tracking
 * - Packaging flags (fragile/insured/ESD/desiccant)
 * - Notes + optional document refs
 *
 * Context detection:
 *   Opened via sidebar (no context)  → shows guidance banner
 *   Opened via Order/Dispatch (with context) → auto-populates fields
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function nowLocalDatetimeValue() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// Known carriers with stable UUIDs (no carrier table exists in DB;
// carrier_id is a plain UUID column with NOT NULL constraint).
const KNOWN_CARRIERS = [
  { id: "c0a80101-0001-4000-8000-000000000001", name: "BlueDart" },
  { id: "c0a80101-0002-4000-8000-000000000002", name: "DTDC" },
  { id: "c0a80101-0003-4000-8000-000000000003", name: "Delhivery" },
  { id: "c0a80101-0004-4000-8000-000000000004", name: "DHL" },
  { id: "c0a80101-0005-4000-8000-000000000005", name: "FedEx" },
];

function SectionTitle({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {desc ? <p className="text-xs text-gray-500">{desc}</p> : null}
      </div>
    </div>
  );
}

export default function ShipmentCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [creating, setCreating] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  // Linkage
  const [dispatchId, setDispatchId] = useState(""); // optional
  const [orderId, setOrderId] = useState("");        // UUID from context
  const [customerId, setCustomerId] = useState("");   // UUID from context
  const [warehouseId, setWarehouseId] = useState(""); // UUID from context
  const [soNo, setSoNo] = useState("");
  const [woNo, setWoNo] = useState("");

  // Customer / address (can be auto-filled by lookup)
  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");

  const [shipToName, setShipToName] = useState("");
  const [shipToAddress1, setShipToAddress1] = useState("");
  const [shipToAddress2, setShipToAddress2] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToPincode, setShipToPincode] = useState("");
  const [shipToCountry, setShipToCountry] = useState("India");
  const [shipToPhone, setShipToPhone] = useState("");
  const [shipToEmail, setShipToEmail] = useState("");
  const [shipToGSTIN, setShipToGSTIN] = useState("");

  // Carrier / shipment
  const [carrierId, setCarrierId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [service, setService] = useState("Air Express");
  const [trackingNo, setTrackingNo] = useState("");
  const [pickupAt, setPickupAt] = useState(nowLocalDatetimeValue());

  const [boxes, setBoxes] = useState("1");
  const [weightKg, setWeightKg] = useState("");
  const [dimensions, setDimensions] = useState("");

  // Packaging / controls
  const [fragile, setFragile] = useState(true);
  const [insured, setInsured] = useState(false);
  const [esd, setEsd] = useState(true);
  const [desiccant, setDesiccant] = useState(true);
  const [humidityCard, setHumidityCard] = useState(true);

  // Docs (optional references)
  const [invoiceNo, setInvoiceNo] = useState("");
  const [packingListNo, setPackingListNo] = useState("");
  const [includeCoc, setIncludeCoc] = useState(true);
  const [includeTestReport, setIncludeTestReport] = useState(true);

  const [notes, setNotes] = useState("");

  // ---- Context detection ----
  // The page can receive context via:
  //   1. URL search params: ?orderId=...&soNo=...&customerId=...&customerName=...
  //   2. React Router location.state: { orderId, soNo, ... }
  const hasContext = useMemo(() => {
    const fromParams = searchParams.get("orderId") || searchParams.get("soNo") || searchParams.get("woNo");
    const fromState = location.state?.orderId || location.state?.soNo || location.state?.woNo;
    return Boolean(fromParams || fromState);
  }, [searchParams, location.state]);

  // Hydrate state from URL params or location.state on mount
  useEffect(() => {
    const state = location.state || {};
    const pOrderId = searchParams.get("orderId") || state.orderId || "";
    const pCustomerId = searchParams.get("customerId") || state.customerId || "";
    const pWarehouseId = searchParams.get("warehouseId") || state.warehouseId || "";
    const pSoNo = searchParams.get("soNo") || state.soNo || "";
    const pWoNo = searchParams.get("woNo") || state.woNo || "";
    const pDispatchId = searchParams.get("dispatchId") || state.dispatchId || "";
    const pCustomerName = searchParams.get("customerName") || state.customerName || "";
    const pWarehouseName = searchParams.get("warehouseName") || state.warehouseName || "";

    if (pOrderId) setOrderId(pOrderId);
    if (pCustomerId) setCustomerId(pCustomerId);
    if (pWarehouseId) setWarehouseId(pWarehouseId);
    if (pSoNo) setSoNo(pSoNo);
    if (pWoNo) setWoNo(pWoNo);
    if (pDispatchId) setDispatchId(pDispatchId);
    if (pCustomerName) setCustomerName(pCustomerName);

    console.log("[ShipmentCreate] Context hydrated:", {
      orderId: pOrderId || "(none)",
      customerId: pCustomerId || "(none)",
      soNo: pSoNo || "(none)",
      woNo: pWoNo || "(none)",
      dispatchId: pDispatchId || "(none)",
      hasContext: Boolean(pOrderId || pSoNo || pWoNo),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch warehouses on mount for the dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await warehousesService.getAll();
        const list = Array.isArray(res) ? res : res?.items ?? res?.content ?? res?.data ?? [];
        setWarehouses(list);
        console.log("[ShipmentCreate] Warehouses loaded:", list.length);
      } catch (e) {
        console.error("[ShipmentCreate] Failed to load warehouses:", e);
      }
    })();
  }, []);

  // ---- Validation ----
  const canCreate = useMemo(() => {
    // minimal: SO or WO + shipToName + address1 + city + state + pincode + boxes + weight + carrier
    const soOrWo = Boolean(soNo.trim() || woNo.trim());
    return (
      soOrWo &&
      carrierId &&
      warehouseId &&
      shipToName.trim() &&
      shipToAddress1.trim() &&
      shipToCity.trim() &&
      shipToState.trim() &&
      shipToPincode.trim() &&
      safeNumber(boxes, 0) > 0 &&
      safeNumber(weightKg, 0) > 0
    );
  }, [soNo, woNo, carrierId, warehouseId, shipToName, shipToAddress1, shipToCity, shipToState, shipToPincode, boxes, weightKg]);

  // Compute granular missing reasons for UI feedback
  const missingReasons = useMemo(() => {
    const reasons = [];
    if (!soNo.trim() && !woNo.trim()) reasons.push("Sales Order (SO) or Work Order (WO)");
    if (!carrierId) reasons.push("Carrier (select a carrier)");
    if (!warehouseId) reasons.push("Warehouse (select a warehouse)");
    if (!shipToName.trim()) reasons.push("Ship-to Name");
    if (!shipToAddress1.trim()) reasons.push("Ship-to Address");
    if (!shipToCity.trim()) reasons.push("Ship-to City");
    if (!shipToState.trim()) reasons.push("Ship-to State");
    if (!shipToPincode.trim()) reasons.push("Ship-to Pincode");
    if (safeNumber(boxes, 0) <= 0) reasons.push("Boxes (> 0)");
    if (safeNumber(weightKg, 0) <= 0) reasons.push("Weight (> 0 kg)");
    return reasons;
  }, [soNo, woNo, carrierId, warehouseId, shipToName, shipToAddress1, shipToCity, shipToState, shipToPincode, boxes, weightKg]);

  const doCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission blocked.", variant: "destructive" });
    }
  };

  const handleLookup = async () => {
    const q = (soNo || woNo || "").trim();
    if (!q) {
      toast({ title: "Enter SO/WO", description: "Type a Sales Order (SO-xxxx) or Work Order (WO-xxxx).", variant: "destructive" });
      return;
    }
    setLookupLoading(true);
    try {
      // Try to find a matching sales order from the API
      const orders = await salesOrdersService.list({ q });
      const list = Array.isArray(orders) ? orders : orders?.content || orders?.data || [];

      if (list.length === 0) {
        toast({ title: "Not found", description: "No order found for the entered number.", variant: "destructive" });
        return;
      }

      // Use the first matching order
      const order = list[0];
      console.log("[ShipmentCreate] Order lookup result:", order);

      // Populate fields from the order
      if (order.id) setOrderId(order.id);
      if (order.customerId) setCustomerId(order.customerId);
      if (order.customerName) setCustomerName(order.customerName);
      if (order.code) setSoNo(order.code);
      if (order.warehouseId) setWarehouseId(order.warehouseId);

      // Try to populate ship-to from order's shipping address if available
      const shipTo = order.shippingAddress || order.shipTo || {};
      if (shipTo.name) setShipToName(shipTo.name);
      if (shipTo.address1 || shipTo.addressLine1) setShipToAddress1(shipTo.address1 || shipTo.addressLine1 || "");
      if (shipTo.address2 || shipTo.addressLine2) setShipToAddress2(shipTo.address2 || shipTo.addressLine2 || "");
      if (shipTo.city) setShipToCity(shipTo.city);
      if (shipTo.state) setShipToState(shipTo.state);
      if (shipTo.pincode || shipTo.postalCode || shipTo.zip) setShipToPincode(shipTo.pincode || shipTo.postalCode || shipTo.zip || "");
      if (shipTo.country) setShipToCountry(shipTo.country);
      if (shipTo.phone) setShipToPhone(shipTo.phone);
      if (shipTo.email) setShipToEmail(shipTo.email);

      toast({ title: "Order loaded", description: "Customer and shipping details populated from order." });
    } catch (e) {
      console.error("[ShipmentCreate] Lookup failed:", e);
      toast({ title: "Lookup failed", description: "Unable to load order details. Check console for details.", variant: "destructive" });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      toast({
        title: "Missing required fields",
        description: "Fill SO/WO, Ship-to address, and shipment package details (boxes & weight).",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Build a payload matching backend ShipmentPayload record fields
      const destParts = [shipToAddress1.trim(), shipToAddress2.trim(), shipToCity.trim(), shipToState.trim(), shipToPincode.trim(), shipToCountry.trim()].filter(Boolean);
      const payload = {
        orderId: orderId || null,
        orderCode: soNo.trim() || woNo.trim() || null,
        customerId: customerId || null,
        customerName: customerName.trim() || null,
        warehouseId: warehouseId || null,
        carrierId: carrierId || null,
        carrierName: carrier.trim() || null,
        trackingNumber: trackingNo.trim() || null,
        shipmentDate: pickupAt ? new Date(pickupAt).toISOString() : null,
        weight: safeNumber(weightKg, 0) || null,
        weightUnit: "kg",
        packageCount: safeNumber(boxes, 0) || null,
        destinationAddress: destParts.join(", ") || null,
        destinationContact: shipToName.trim() || null,
        destinationPhone: shipToPhone.trim() || null,
        notes: [
          notes.trim(),
          fragile ? "[FRAGILE]" : "",
          esd ? "[ESD]" : "",
          desiccant ? "[DESICCANT]" : "",
          humidityCard ? "[HUMIDITY-CARD]" : "",
          insured ? "[INSURED]" : "",
          includeCoc ? "[COC]" : "",
          includeTestReport ? "[TEST-REPORT]" : "",
          invoiceNo.trim() ? `Invoice: ${invoiceNo.trim()}` : "",
          packingListNo.trim() ? `PL: ${packingListNo.trim()}` : "",
          dispatchId.trim() ? `Dispatch: ${dispatchId.trim()}` : "",
        ].filter(Boolean).join(" | ") || null,
      };

      console.log("[ShipmentCreate] Sending payload:", payload);

      const created = await shipmentService.create(payload);

      toast({
        title: "Shipment created",
        description: `Shipment ${created.code || created.id} created successfully.`,
      });

      // Navigate to shipments list
      navigate("/dashboard/logistics/shipments", { replace: true });
    } catch (e) {
      console.error("[ShipmentCreate] Create failed:", e);
      const msg = e?.response?.data?.message || e?.message || "Unable to create shipment. Try again.";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Create Shipment</h1>
              <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">PCBxpress Logistics</Badge>
            </div>
            <p className="text-sm text-gray-500">Create a shipment for PCB dispatch with traceable packaging and documents.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/dashboard/logistics/shipments">
              <ClipboardList className="h-4 w-4" />
              Shipments List
            </Link>
          </Button>
          <Button
            onClick={() =>
              toast({
                title: "Tip",
                description: "Use SO/WO lookup to auto-fill customer and ship-to address.",
              })
            }
            variant="outline"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Help
          </Button>
        </div>
      </div>

      {/* ---- CONTEXT BANNER: shown when opened without order context ---- */}
      {!hasContext && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-semibold text-amber-900">
                  No order context detected
                </p>
                <p className="text-sm text-amber-800">
                  Shipments must be linked to a <strong>Sales Order</strong> or <strong>Work Order</strong>.
                  You can either enter the SO/WO number below and use <em>"Lookup SO/WO"</em> to auto-fill details,
                  or navigate to an order and create the shipment from there.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" asChild className="gap-2 border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                    <Link to="/dashboard/logistics/dispatch">
                      <Truck className="h-4 w-4" />
                      Go to Dispatch Queue
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="gap-2 border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                    <Link to="/dashboard/sales/orders">
                      <Package className="h-4 w-4" />
                      Go to Sales Orders
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Linkage */}
        <Card className="border-gray-100">
          <CardHeader>
            <SectionTitle icon={Package} title="Order Linkage" desc="Connect shipment to SO/WO (and optionally a Dispatch)" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dispatchId">Dispatch ID (optional)</Label>
                <Input
                  id="dispatchId"
                  placeholder="e.g., DSP-000124"
                  value={dispatchId}
                  onChange={(e) => setDispatchId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soNo">Sales Order (SO) <span className="text-red-500">*</span></Label>
                <Input id="soNo" placeholder="SO-1042" value={soNo} onChange={(e) => setSoNo(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="woNo">Work Order (WO)</Label>
                <Input id="woNo" placeholder="WO-7781" value={woNo} onChange={(e) => setWoNo(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={handleLookup} disabled={lookupLoading}>
                <User className="h-4 w-4" />
                {lookupLoading ? "Looking up..." : "Lookup SO/WO"}
              </Button>
              <p className="text-xs text-gray-500">Auto-fill customer + shipping address from order master.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCode">Customer Code</Label>
                <Input id="customerCode" value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} placeholder="Code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse <span className="text-red-500">*</span></Label>
                <select
                  id="warehouseId"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className={cx(
                    "h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30",
                    warehouseId ? "border-input bg-background" : "border-red-300 bg-red-50/30"
                  )}
                >
                  <option value="">— Select warehouse —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name || w.code || w.id}
                    </option>
                  ))}
                </select>
                {!warehouseId && (
                  <p className="text-xs text-red-500">Warehouse is required.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ship-to */}
        <Card className="border-gray-100">
          <CardHeader>
            <SectionTitle icon={MapPin} title="Ship To Address" desc="Delivery address used for label printing and courier booking" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipToName">Ship To Name <span className="text-red-500">*</span></Label>
              <Input id="shipToName" value={shipToName} onChange={(e) => setShipToName(e.target.value)} placeholder="Receiving contact / location name" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr1">Address Line 1 <span className="text-red-500">*</span></Label>
                <Input id="addr1" value={shipToAddress1} onChange={(e) => setShipToAddress1(e.target.value)} placeholder="Street / building" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr2">Address Line 2 (optional)</Label>
                <Input id="addr2" value={shipToAddress2} onChange={(e) => setShipToAddress2(e.target.value)} placeholder="Area / landmark" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                <Input id="city" value={shipToCity} onChange={(e) => setShipToCity(e.target.value)} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                <Input id="state" value={shipToState} onChange={(e) => setShipToState(e.target.value)} placeholder="State" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">Pincode <span className="text-red-500">*</span></Label>
                <Input id="pin" value={shipToPincode} onChange={(e) => setShipToPincode(e.target.value)} placeholder="Pincode" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={shipToCountry} onChange={(e) => setShipToCountry(e.target.value)} placeholder="Country" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={shipToPhone} onChange={(e) => setShipToPhone(e.target.value)} placeholder="+91..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" value={shipToEmail} onChange={(e) => setShipToEmail(e.target.value)} placeholder="stores@customer.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN (optional)</Label>
                <Input id="gstin" value={shipToGSTIN} onChange={(e) => setShipToGSTIN(e.target.value)} placeholder="GSTIN" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment */}
        <Card className="border-gray-100">
          <CardHeader>
            <SectionTitle icon={Truck} title="Carrier & Package" desc="Courier details, pickup schedule and package metrics" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier <span className="text-red-500">*</span></Label>
                <select
                  id="carrier"
                  value={carrierId}
                  onChange={(e) => {
                    const selected = KNOWN_CARRIERS.find((c) => c.id === e.target.value);
                    setCarrierId(e.target.value);
                    setCarrier(selected?.name || "");
                  }}
                  className={cx(
                    "h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30",
                    carrierId ? "border-input bg-background" : "border-red-300 bg-red-50/30"
                  )}
                >
                  <option value="">— Select carrier —</option>
                  {KNOWN_CARRIERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!carrierId && (
                  <p className="text-xs text-red-500">Carrier is required for shipment creation.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Input id="service" value={service} onChange={(e) => setService(e.target.value)} placeholder="Air / Surface / Express" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupAt">Pickup Date & Time</Label>
                <Input id="pickupAt" type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking / AWB (optional)</Label>
                <div className="flex gap-2">
                  <Input id="tracking" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Enter tracking number" />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => doCopy(trackingNo)} disabled={!trackingNo}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="boxes">Boxes <span className="text-red-500">*</span></Label>
                <Input id="boxes" value={boxes} onChange={(e) => setBoxes(e.target.value)} placeholder="e.g., 2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg) <span className="text-red-500">*</span></Label>
                <Input id="weightKg" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g., 8.4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dims">Dimensions (optional)</Label>
              <Input id="dims" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g., 40x30x25 cm (each)" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fragile</p>
                    <p className="text-xs text-gray-500">Handle with care</p>
                  </div>
                </div>
                <Switch checked={fragile} onCheckedChange={setFragile} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Insured</p>
                    <p className="text-xs text-gray-500">Enable insurance</p>
                  </div>
                </div>
                <Switch checked={insured} onCheckedChange={setInsured} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">ESD Packaging</p>
                    <p className="text-xs text-gray-500">ESD bags / ESD labels</p>
                  </div>
                </div>
                <Switch checked={esd} onCheckedChange={setEsd} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Desiccant</p>
                    <p className="text-xs text-gray-500">Moisture protection</p>
                  </div>
                </div>
                <Switch checked={desiccant} onCheckedChange={setDesiccant} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Humidity Card</p>
                    <p className="text-xs text-gray-500">Moisture indicator</p>
                  </div>
                </div>
                <Switch checked={humidityCard} onCheckedChange={setHumidityCard} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Docs */}
        <Card className="border-gray-100">
          <CardHeader>
            <SectionTitle icon={FileText} title="Documents (Optional)" desc="Reference numbers for invoice / packing list and compliance docs" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoiceNo">Invoice No</Label>
                <Input id="invoiceNo" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="INV-2026-00142" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packingListNo">Packing List No</Label>
                <Input id="packingListNo" value={packingListNo} onChange={(e) => setPackingListNo(e.target.value)} placeholder="PL-2026-00101" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">Include CoC</p>
                  <p className="text-xs text-gray-500">Certificate of Conformance</p>
                </div>
                <Switch checked={includeCoc} onCheckedChange={setIncludeCoc} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">Include Test Report</p>
                  <p className="text-xs text-gray-500">E-test / AOI / inspection docs</p>
                </div>
                <Switch checked={includeTestReport} onCheckedChange={setIncludeTestReport} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-gray-100">
          <CardHeader>
            <SectionTitle icon={FileText} title="Notes" desc="Special instructions for courier booking / packing / customer" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: Add microsection report. Mark carton 'FRAGILE'. Partial shipment—balance next batch."
              rows={5}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-medium text-gray-900">Validation</p>
              <p className="text-gray-600">
                Required: SO/WO, Carrier, Ship-to (name/address/city/state/pincode), Boxes &amp; Weight.
              </p>
            </div>

            {/* ---- Missing reasons indicator ---- */}
            {!canCreate && missingReasons.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">Cannot create — missing fields:</span>
                </div>
                <ul className="ml-6 mt-1 list-disc space-y-0.5 text-red-600">
                  {missingReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !canCreate}
              className={cx(
                "gap-2",
                canCreate ? "bg-cyan-600 hover:bg-cyan-500" : "bg-gray-300 text-gray-700 hover:bg-gray-300"
              )}
              title={!canCreate ? "Fill required fields" : "Create shipment"}
            >
              <Truck className="h-4 w-4" />
              {creating ? "Creating..." : "Create Shipment"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
