// src/pages/logistics/shipments/ShipmentCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import {
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
 * API is mocked. Replace mockCreateShipment + mockLookup with real services later.
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

// ---------------- Mock services ----------------
async function mockLookupOrder(query) {
  await new Promise((r) => setTimeout(r, 250));

  // Pretend we found an order based on SO/WO
  if (!query?.trim()) return null;

  return {
    customer: { name: "Acme Electronics", code: "ACME" },
    order: {
      soNo: query.startsWith("SO") ? query : "SO-1042",
      woNo: query.startsWith("WO") ? query : "WO-7781",
      poNo: "PO-ACME-221",
      incoterm: "DAP",
      shipTo: {
        name: "Acme Electronics - Receiving",
        address1: "Plot 21, Industrial Area",
        address2: "Whitefield",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560066",
        country: "India",
        phone: "+91 98xxxxxx12",
        email: "stores@acme.com",
        gstin: "29ABCDE1234F1Z5",
      },
    },
  };
}

async function mockCreateShipment(payload) {
  await new Promise((r) => setTimeout(r, 350));
  return {
    ok: true,
    id: `SHP-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
}
// ------------------------------------------------

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
  const { toast } = useToast();

  const [creating, setCreating] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Linkage
  const [dispatchId, setDispatchId] = useState(""); // optional
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
  const [carrier, setCarrier] = useState("BlueDart");
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

  const canCreate = useMemo(() => {
    // minimal: SO or WO + shipToName + address1 + city + state + pincode + boxes + weight
    const soOrWo = Boolean(soNo.trim() || woNo.trim());
    return (
      soOrWo &&
      shipToName.trim() &&
      shipToAddress1.trim() &&
      shipToCity.trim() &&
      shipToState.trim() &&
      shipToPincode.trim() &&
      safeNumber(boxes, 0) > 0 &&
      safeNumber(weightKg, 0) > 0
    );
  }, [soNo, woNo, shipToName, shipToAddress1, shipToCity, shipToState, shipToPincode, boxes, weightKg]);

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
      const res = await mockLookupOrder(q);
      if (!res) {
        toast({ title: "Not found", description: "No order found for the entered number.", variant: "destructive" });
        return;
      }
      setCustomerName(res.customer?.name || "");
      setCustomerCode(res.customer?.code || "");

      setSoNo(res.order?.soNo || soNo);
      setWoNo(res.order?.woNo || woNo);

      const s = res.order?.shipTo || {};
      setShipToName(s.name || "");
      setShipToAddress1(s.address1 || "");
      setShipToAddress2(s.address2 || "");
      setShipToCity(s.city || "");
      setShipToState(s.state || "");
      setShipToPincode(s.pincode || "");
      setShipToCountry(s.country || "India");
      setShipToPhone(s.phone || "");
      setShipToEmail(s.email || "");
      setShipToGSTIN(s.gstin || "");

      toast({ title: "Order loaded", description: "Customer and Ship-to details have been filled." });
    } catch (e) {
      console.error(e);
      toast({ title: "Lookup failed", description: "Unable to load order details.", variant: "destructive" });
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
      const payload = {
        dispatchId: dispatchId.trim() || null,
        order: { soNo: soNo.trim() || null, woNo: woNo.trim() || null },
        customer: { name: customerName.trim() || null, code: customerCode.trim() || null },
        shipTo: {
          name: shipToName.trim(),
          address1: shipToAddress1.trim(),
          address2: shipToAddress2.trim() || null,
          city: shipToCity.trim(),
          state: shipToState.trim(),
          pincode: shipToPincode.trim(),
          country: shipToCountry.trim() || "India",
          phone: shipToPhone.trim() || null,
          email: shipToEmail.trim() || null,
          gstin: shipToGSTIN.trim() || null,
        },
        shipment: {
          carrier: carrier.trim() || null,
          service: service.trim() || null,
          trackingNo: trackingNo.trim() || null,
          pickupAt: pickupAt ? new Date(pickupAt).toISOString() : null,
          boxes: safeNumber(boxes, 0),
          weightKg: safeNumber(weightKg, 0),
          dimensions: dimensions.trim() || null,
        },
        packaging: { fragile, insured, esd, desiccant, humidityCard },
        documents: {
          invoiceNo: invoiceNo.trim() || null,
          packingListNo: packingListNo.trim() || null,
          coc: includeCoc,
          testReport: includeTestReport,
        },
        notes: notes.trim() || null,
        status: trackingNo.trim() ? "Ready" : "Draft",
      };

      const created = await mockCreateShipment(payload);

      toast({
        title: "Shipment created",
        description: `Shipment ${created.id} created successfully.`,
      });

      // In your real app: navigate(`/logistics/shipments/${created.id}`)
      navigate("/logistics/shipments", { replace: true });
    } catch (e) {
      console.error(e);
      toast({ title: "Create failed", description: "Unable to create shipment. Try again.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    // small UX: if user types a tracking no, suggest Ready status in docs via message
  }, [trackingNo]);

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
            <Link to="/logistics/shipments">
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
                <Label htmlFor="soNo">Sales Order (SO)</Label>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCode">Customer Code</Label>
                <Input id="customerCode" value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} placeholder="Code" />
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
              <Label htmlFor="shipToName">Ship To Name</Label>
              <Input id="shipToName" value={shipToName} onChange={(e) => setShipToName(e.target.value)} placeholder="Receiving contact / location name" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr1">Address Line 1</Label>
                <Input id="addr1" value={shipToAddress1} onChange={(e) => setShipToAddress1(e.target.value)} placeholder="Street / building" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr2">Address Line 2 (optional)</Label>
                <Input id="addr2" value={shipToAddress2} onChange={(e) => setShipToAddress2(e.target.value)} placeholder="Area / landmark" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={shipToCity} onChange={(e) => setShipToCity(e.target.value)} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={shipToState} onChange={(e) => setShipToState(e.target.value)} placeholder="State" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">Pincode</Label>
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
                <Label htmlFor="carrier">Carrier</Label>
                <Input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="BlueDart / DTDC / DHL" />
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
                <Label htmlFor="boxes">Boxes</Label>
                <Input id="boxes" value={boxes} onChange={(e) => setBoxes(e.target.value)} placeholder="e.g., 2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-900">Validation</p>
            <p className="text-gray-600">
              Required: SO/WO, Ship-to (name/address/city/state/pincode), Boxes & Weight.
            </p>
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
