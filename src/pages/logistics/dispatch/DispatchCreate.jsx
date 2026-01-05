// src/pages/logistics/dispatch/DispatchCreate.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  PackageCheck,
  Plus,
  Save,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * DispatchCreate.jsx (PCBxpress)
 * - Create a dispatch record for finished PCB shipments
 * - Add items (Work Order / Sales Order line style)
 * - Capture courier / tracking / invoice / packing details
 *
 * NOTE:
 * Wire the "dispatchService.create(payload)" to backend when ready.
 * For now this page is UI-complete + payload-ready.
 */

const DISPATCH_TYPES = [
  { value: "customer_delivery", label: "Customer Delivery" },
  { value: "sample_dispatch", label: "Sample Dispatch" },
  { value: "inter_plant", label: "Inter-Plant Transfer" },
  { value: "return_to_vendor", label: "Return to Vendor" },
];

const CARRIERS = [
  "DHL",
  "FedEx",
  "Blue Dart",
  "DTDC",
  "Delhivery",
  "India Post",
  "Customer Pickup",
  "Other",
];

const PACKING_TYPES = [
  "ESD Bag",
  "Vacuum Pack",
  "Bubble Wrap",
  "Foam",
  "Carton Box",
  "Wooden Crate",
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatMoneyINR(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DispatchCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Header / basic fields
  const [dispatchNo, setDispatchNo] = useState("AUTO");
  const [dispatchDate, setDispatchDate] = useState(todayISO());
  const [dispatchType, setDispatchType] = useState("customer_delivery");

  // Customer / destination
  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [shipTo, setShipTo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Shipping details
  const [carrier, setCarrier] = useState("Blue Dart");
  const [carrierOther, setCarrierOther] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");

  // Packing
  const [packingType, setPackingType] = useState("ESD Bag");
  const [noOfBoxes, setNoOfBoxes] = useState("1");
  const [grossWeightKg, setGrossWeightKg] = useState("");
  const [remarks, setRemarks] = useState("");

  // Items (dispatch lines)
  const [items, setItems] = useState([
    {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      refType: "work_order", // work_order | sales_order
      refNo: "",
      partNo: "",
      description: "",
      quantity: "1",
      uom: "pcs",
      packQty: "",
      lotNo: "",
      serialFrom: "",
      serialTo: "",
      unitPrice: "",
      hsn: "",
    },
  ]);

  // Search / helper bar (UI only)
  const [quickFind, setQuickFind] = useState("");

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit = useMemo(() => {
    if (!dispatchDate) return false;
    if (!dispatchType) return false;
    if (!customerName.trim()) return false;
    if (!shipTo.trim()) return false;
    if (!items.length) return false;
    // At least 1 valid item line
    const validLine = items.some((x) => x.partNo.trim() && Number(x.quantity) > 0);
    return validLine;
  }, [dispatchDate, dispatchType, customerName, shipTo, items]);

  const totals = useMemo(() => {
    const qty = items.reduce((sum, x) => sum + (Number(x.quantity) || 0), 0);
    const amount = items.reduce((sum, x) => {
      const q = Number(x.quantity) || 0;
      const p = Number(x.unitPrice) || 0;
      return sum + q * p;
    }, 0);
    return { qty, amount };
  }, [items]);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
        refType: "work_order",
        refNo: "",
        partNo: "",
        description: "",
        quantity: "1",
        uom: "pcs",
        packQty: "",
        lotNo: "",
        serialFrom: "",
        serialTo: "",
        unitPrice: "",
        hsn: "",
      },
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const validateBeforeSave = () => {
    if (!customerName.trim()) return "Customer name is required.";
    if (!shipTo.trim()) return "Ship-to address is required.";
    const validLine = items.some((x) => x.partNo.trim() && Number(x.quantity) > 0);
    if (!validLine) return "Add at least one item with Part No and Quantity > 0.";
    if (carrier === "Other" && !carrierOther.trim()) return "Please specify the carrier name.";
    if (Number(noOfBoxes) <= 0) return "No. of boxes must be at least 1.";
    return null;
  };

  const buildPayload = () => {
    return {
      dispatch_no: dispatchNo === "AUTO" ? null : dispatchNo,
      dispatch_date: dispatchDate,
      dispatch_type: dispatchType,

      customer: {
        name: customerName.trim(),
        code: customerCode.trim() || null,
        contact_person: contactPerson.trim() || null,
        contact_phone: contactPhone.trim() || null,
      },

      ship_to: shipTo.trim(),

      shipping: {
        carrier: carrier === "Other" ? carrierOther.trim() : carrier,
        tracking_no: trackingNo.trim() || null,
        eway_bill_no: ewayBillNo.trim() || null,
        invoice_no: invoiceNo.trim() || null,
        vehicle_no: vehicleNo.trim() || null,
      },

      packing: {
        packing_type: packingType,
        no_of_boxes: Number(noOfBoxes) || 1,
        gross_weight_kg: grossWeightKg ? Number(grossWeightKg) : null,
      },

      remarks: remarks.trim() || null,

      items: items
        .filter((x) => x.partNo.trim() && Number(x.quantity) > 0)
        .map((x) => ({
          ref_type: x.refType,
          ref_no: x.refNo.trim() || null,
          part_no: x.partNo.trim(),
          description: x.description.trim() || null,
          quantity: Number(x.quantity) || 0,
          uom: x.uom || "pcs",
          pack_qty: x.packQty ? Number(x.packQty) : null,
          lot_no: x.lotNo.trim() || null,
          serial_from: x.serialFrom.trim() || null,
          serial_to: x.serialTo.trim() || null,
          unit_price: x.unitPrice ? Number(x.unitPrice) : null,
          hsn: x.hsn.trim() || null,
        })),
    };
  };

  const handleSave = async () => {
    const err = validateBeforeSave();
    if (err) {
      toast({ title: "Fix required", description: err, variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();

      // TODO: Replace with backend call
      // await dispatchService.create(payload);

      // For now: simulate success
      console.log("Dispatch payload:", payload);

      toast({
        title: "Dispatch created",
        description: "Dispatch has been saved successfully.",
      });

      navigate("/logistics/dispatch");
    } catch (e) {
      toast({
        title: "Save failed",
        description: "Unable to create dispatch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setConfirmOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Create Dispatch</h1>
          <p className="text-sm text-gray-500">
            Create a dispatch record for finished PCBs with shipping & packing details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" asChild>
            <Link to="/logistics/dispatch">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canSubmit || isSaving}
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Dispatch"}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dispatch meta */}
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <CalendarClock className="h-4 w-4 text-[#dc2551]" />
              Dispatch Details
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Dispatch No</Label>
                <Input
                  value={dispatchNo}
                  onChange={(e) => setDispatchNo(e.target.value)}
                  placeholder="AUTO"
                />
                <p className="text-xs text-gray-500">Keep AUTO to let system generate number.</p>
              </div>

              <div className="space-y-2">
                <Label>Dispatch Date</Label>
                <Input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Dispatch Type</Label>
                <Select value={dispatchType} onValueChange={setDispatchType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPATCH_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Customer / Destination */}
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Truck className="h-4 w-4 text-[#dc2551]" />
              Customer & Ship-To
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., ABC Electronics Pvt Ltd"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Code (optional)</Label>
                <Input
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  placeholder="e.g., CUST-0012"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Person (optional)</Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g., Purchase Manager"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Ship-To Address</Label>
                <Textarea
                  value={shipTo}
                  onChange={(e) => setShipTo(e.target.value)}
                  placeholder="Full delivery address..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Phone (optional)</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />

                <div className="mt-4 rounded-xl border bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <PackageCheck className="h-4 w-4 text-[#dc2551]" />
                    Quick Tips
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li>• Mention PO/WO references in items</li>
                    <li>• Add lot/serial for traceability</li>
                    <li>• Keep invoice / eWay ready</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping & Packing */}
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Truck className="h-4 w-4 text-[#dc2551]" />
              Shipping & Packing
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {carrier === "Other" && (
                  <div className="pt-2">
                    <Label>Carrier Name</Label>
                    <Input
                      value={carrierOther}
                      onChange={(e) => setCarrierOther(e.target.value)}
                      placeholder="Enter carrier name"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tracking No</Label>
                <Input
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="AWB / Tracking number"
                />
              </div>

              <div className="space-y-2">
                <Label>Invoice No</Label>
                <Input
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Invoice reference"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>eWay Bill No (optional)</Label>
                <Input value={ewayBillNo} onChange={(e) => setEwayBillNo(e.target.value)} placeholder="eWay bill no" />
              </div>
              <div className="space-y-2">
                <Label>Vehicle No (optional)</Label>
                <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="e.g., KL-07-XXXX" />
              </div>
              <div className="space-y-2">
                <Label>Packing Type</Label>
                <Select value={packingType} onValueChange={setPackingType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select packing" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKING_TYPES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>No. of Boxes</Label>
                <Input
                  type="number"
                  min={1}
                  value={noOfBoxes}
                  onChange={(e) => setNoOfBoxes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gross Weight (kg)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={grossWeightKg}
                  onChange={(e) => setGrossWeightKg(e.target.value)}
                  placeholder="e.g., 12.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any dispatch notes..."
                />
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <PackageCheck className="h-4 w-4 text-[#dc2551]" />
                Dispatch Items
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={quickFind}
                    onChange={(e) => setQuickFind(e.target.value)}
                    className="pl-9"
                    placeholder="Quick find (UI only)"
                  />
                </div>
                <Button type="button" variant="secondary" className="gap-2" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className={cx(
                    "rounded-2xl border bg-white p-3",
                    "shadow-sm hover:shadow transition-shadow"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Line #{idx + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeItem(it.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Ref Type</Label>
                      <Select value={it.refType} onValueChange={(v) => updateItem(it.id, { refType: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ref" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work_order">Work Order</SelectItem>
                          <SelectItem value="sales_order">Sales Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ref No</Label>
                      <Input
                        value={it.refNo}
                        onChange={(e) => updateItem(it.id, { refNo: e.target.value })}
                        placeholder="WO-XXXX / SO-XXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Part No</Label>
                      <Input
                        value={it.partNo}
                        onChange={(e) => updateItem(it.id, { partNo: e.target.value })}
                        placeholder="PCB Part No"
                        required={idx === 0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={it.quantity}
                        onChange={(e) => updateItem(it.id, { quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={it.description}
                        onChange={(e) => updateItem(it.id, { description: e.target.value })}
                        placeholder="e.g., 4L FR4 1.6mm ENIG, 100x80mm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>UOM</Label>
                      <Input
                        value={it.uom}
                        onChange={(e) => updateItem(it.id, { uom: e.target.value })}
                        placeholder="pcs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pack Qty (optional)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={it.packQty}
                        onChange={(e) => updateItem(it.id, { packQty: e.target.value })}
                        placeholder="e.g., 25"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Lot No</Label>
                      <Input
                        value={it.lotNo}
                        onChange={(e) => updateItem(it.id, { lotNo: e.target.value })}
                        placeholder="LOT-xxxx"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Serial From</Label>
                      <Input
                        value={it.serialFrom}
                        onChange={(e) => updateItem(it.id, { serialFrom: e.target.value })}
                        placeholder="S0001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Serial To</Label>
                      <Input
                        value={it.serialTo}
                        onChange={(e) => updateItem(it.id, { serialTo: e.target.value })}
                        placeholder="S0100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) => updateItem(it.id, { unitPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>HSN (optional)</Label>
                      <Input
                        value={it.hsn}
                        onChange={(e) => updateItem(it.id, { hsn: e.target.value })}
                        placeholder="HSN code"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2">
                        <span className="text-xs font-medium text-gray-600">Line Amount</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatMoneyINR((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold text-gray-600">Total Quantity</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{totals.qty}</p>
              </div>
              <div className="rounded-2xl border bg-white p-4 md:col-span-2">
                <p className="text-xs font-semibold text-gray-600">Estimated Dispatch Value</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatMoneyINR(totals.amount)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  This is based on unit price in dispatch lines (optional).
                </p>
              </div>
            </div>
          </Card>

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!canSubmit || isSaving}
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Create Dispatch"}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Confirm dialog */}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Create Dispatch?"
        description="Please confirm. This will create a dispatch record and lock the shipment details."
        confirmText={isSaving ? "Saving..." : "Confirm & Save"}
        confirmVariant="destructive"
        onConfirm={handleSave}
        loading={isSaving}
      />
    </div>
  );
}
