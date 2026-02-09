// src/pages/logistics/dispatch/DispatchCreate.jsx
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronsUpDown,
  PackageCheck,
  Plus,
  Save,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// API Services
import dispatchService from "@/services/logistics/dispatch.service";
import salesOrdersService from "@/services/sales/salesOrders.service";
import customersService from "@/services/sales/customers.service";
import warehousesService from "@/services/warehouse/warehouses.service";

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

// Dispatch types must match backend Dispatch.DispatchType enum values
const DISPATCH_TYPES = [
  { value: "STANDARD", label: "Standard Delivery" },
  { value: "EXPRESS", label: "Express Delivery" },
  { value: "OVERNIGHT", label: "Overnight Delivery" },
  { value: "FREIGHT", label: "Freight Shipping" },
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

/**
 * Sanitize payload before API call:
 * - Remove keys with null, undefined, or empty string values
 * - Recursively clean nested objects
 * - Remove empty nested objects entirely
 * This prevents sending placeholder data to the backend.
 */
function sanitizePayload(obj) {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload).filter((v) => v !== undefined);
  }
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip null, undefined, and empty strings
    if (value === null || value === undefined || value === "") continue;
    // Recursively clean nested objects
    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizePayload(value);
      // Only include if nested object has keys
      if (nested && Object.keys(nested).length > 0) {
        cleaned[key] = nested;
      }
    } else if (Array.isArray(value)) {
      const arr = sanitizePayload(value);
      if (arr && arr.length > 0) {
        cleaned[key] = arr;
      }
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Convert empty string to null for optional fields
 */
function emptyToNull(value) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

/**
 * Convert string to number, returning null if empty/invalid
 */
function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export default function DispatchCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Header / basic fields
  const [dispatchNo, setDispatchNo] = useState("AUTO");
  const [dispatchDate, setDispatchDate] = useState(todayISO());
  const [dispatchType, setDispatchType] = useState("STANDARD");

  // === REQUIRED UUID FIELDS (API Contract) ===
  // These MUST be set before save - backend will reject without them
  const [orderId, setOrderId] = useState(null);       // UUID - required
  const [customerId, setCustomerId] = useState(null); // UUID - required  
  const [warehouseId, setWarehouseId] = useState(null); // UUID - required

  // Customer / destination (display fields)
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

  // === DROPDOWN DATA (Fetched from API) ===
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadError, setDataLoadError] = useState(null);

  // === LOAD DROPDOWN DATA ON MOUNT ===
  useEffect(() => {
    const loadDropdownData = async () => {
      setIsLoadingData(true);
      setDataLoadError(null);
      try {
        const [ordersRes, customersRes, warehousesRes] = await Promise.all([
          salesOrdersService.list({ limit: 100 }),
          customersService.list({ size: 100 }),
          warehousesService.getAll({ limit: 100 }),
        ]);

        // Extract data from responses (handle different response formats)
        const ordersData = ordersRes?.data?.data || ordersRes?.data || [];
        const customersData = customersRes?.data?.data || customersRes?.data || [];
        const warehousesData = warehousesRes?.data || warehousesRes || [];

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setDataLoadError("Failed to load orders, customers, or warehouses. Please refresh.");
        toast({
          title: "Data Load Error",
          description: "Could not load orders, customers, or warehouses. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDropdownData();
  }, [toast]);

  /**
   * STRICT VALIDATION for saving dispatch:
   * Backend requires: orderId, customerId, warehouseId
   * Without these, the API will return HTTP 400
   */
  const canSaveDraft = useMemo(() => {
    // Required UUID fields (API contract)
    if (!orderId) return false;
    if (!customerId) return false;
    if (!warehouseId) return false;
    // Required form fields
    if (!dispatchType) return false;
    if (!items.length) return false;
    return true;
  }, [orderId, customerId, warehouseId, dispatchType, items]);

  /**
   * Validation for finalizing dispatch (status = DISPATCHED/SHIPPED):
   * All draft requirements PLUS:
   * - Dispatch date is required
   * - At least ONE valid item (with partNo and quantity > 0)
   * - Carrier must be selected
   */
  const canFinalizeDispatch = useMemo(() => {
    if (!canSaveDraft) return false; // Must pass draft validation first
    if (!dispatchDate) return false;
    // At least 1 valid item line with partNo + qty > 0
    const validLine = items.some((x) => x.partNo.trim() && Number(x.quantity) > 0);
    if (!validLine) return false;
    // Carrier is required for dispatch
    const hasCarrier = carrier && (carrier !== "Other" || carrierOther.trim());
    if (!hasCarrier) return false;
    return true;
  }, [canSaveDraft, dispatchDate, items, carrier, carrierOther]);

  /**
   * Get user-friendly validation message explaining why action is blocked
   */
  const getValidationMessage = () => {
    // Required UUID fields first (most important)
    if (!orderId) return "Select an Order to continue";
    if (!customerId) return "Select a Customer to continue";
    if (!warehouseId) return "Select a Warehouse to continue";
    // Then form fields
    if (!dispatchType) return "Select Dispatch Type to continue";
    if (!items.length) return "Add at least one dispatch item";
    const validLine = items.some((x) => x.partNo.trim() && Number(x.quantity) > 0);
    if (!validLine) return "Enter Part No and Quantity for at least one item";
    if (!dispatchDate) return "Select a dispatch date";
    return null;
  };

  // Use canSaveDraft for enabling the button (lenient)
  // Full validation (canFinalizeDispatch) is checked in validateBeforeSave()
  const canSubmit = canSaveDraft;

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

  /**
   * STRICT validation before save - prevents API errors
   * Backend requires: orderId, customerId, warehouseId
   * If missing, API returns HTTP 400 - so we prevent the call entirely
   */
  const validateBeforeSave = () => {
    // === REQUIRED UUID FIELDS (API Contract) ===
    // These MUST be present or backend will reject with HTTP 400
    if (!orderId) return "Order is required. Please select a valid order.";
    if (!customerId) return "Customer is required. Please select a valid customer.";
    if (!warehouseId) return "Warehouse is required. Please select a valid warehouse.";

    // === REQUIRED FORM FIELDS ===
    if (!dispatchType) return "Dispatch Type is required.";
    if (!items.length) return "Add at least one dispatch item.";

    // Items validation - at least one must have partNo and qty
    const validLine = items.some((x) => x.partNo.trim() && Number(x.quantity) > 0);
    if (!validLine) return "Enter Part No and Quantity for at least one item.";

    // Carrier-specific validation
    if (carrier === "Other" && !carrierOther.trim()) return "Please specify the carrier name.";

    return null; // All validations passed
  };

  /**
   * Build payload for API call.
   * CRITICAL: Includes required UUID fields (orderId, customerId, warehouseId)
   * Uses camelCase field names to match backend DispatchPayload.java record.
   */
  const buildPayload = () => {
    // Get warehouse name for display field
    const selectedWarehouse = warehouses.find((w) => (w.id || w.warehouseId) === warehouseId);
    const warehouseName = selectedWarehouse?.name || selectedWarehouse?.warehouseName || null;

    // Get order code for display field
    const selectedOrder = orders.find((o) => (o.id || o.orderId) === orderId);
    const orderCode = selectedOrder?.orderNumber || selectedOrder?.code || null;

    // Build raw payload with required UUIDs - using camelCase to match backend
    const rawPayload = {
      // === REQUIRED UUID FIELDS (API Contract) ===
      // These are mandatory - backend validates and returns 400 if missing
      orderId: orderId,           // UUID string - required
      customerId: customerId,     // UUID string - required
      warehouseId: warehouseId,   // UUID string - required

      // === DISPATCH FIELDS (camelCase to match backend DispatchPayload) ===
      code: dispatchNo === "AUTO" ? null : emptyToNull(dispatchNo),
      dispatchDate: emptyToNull(dispatchDate) ? new Date(dispatchDate).toISOString() : null,
      dispatchType: emptyToNull(dispatchType), // Already uppercase from DISPATCH_TYPES
      status: "DRAFT",

      // Display fields - populated from selections
      orderCode: orderCode,
      customerName: emptyToNull(customerName.trim()),
      warehouseName: warehouseName,

      // Carrier info
      carrierName: carrier === "Other" ? emptyToNull(carrierOther.trim()) : emptyToNull(carrier),
      trackingNumber: emptyToNull(trackingNo.trim()),

      // Dimensions and weight
      weight: toNumberOrNull(grossWeightKg),
      weightUnit: grossWeightKg ? "kg" : null,

      // Notes
      notes: emptyToNull(remarks.trim()),

      // Priority and type with safe defaults
      priority: "NORMAL",
    };

    // Sanitize entire payload to remove null/undefined/empty values
    return sanitizePayload(rawPayload);
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
      console.log("Dispatch payload:", payload);

      // Call the actual dispatch API
      await dispatchService.create(payload);

      toast({
        title: "Dispatch created",
        description: "Dispatch has been saved successfully.",
      });

      navigate("/logistics/dispatch");
    } catch (e) {
      console.error("Dispatch save error:", e);
      // Extract error message from API response if available
      const errorMessage = e?.response?.data?.message
        || e?.response?.data?.error
        || e?.message
        || "Unable to create dispatch. Please try again.";
      toast({
        title: "Save failed",
        description: errorMessage,
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
          <div className="relative group">
            <Button
              disabled={!canSubmit || isSaving}
              onClick={() => setConfirmOpen(true)}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Dispatch"}
            </Button>
            {/* Tooltip hint when button is disabled */}
            {!canSubmit && getValidationMessage() && (
              <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                  {getValidationMessage()}
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
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

          {/* === REQUIRED SELECTIONS (Order, Customer, Warehouse) === */}
          {/* These are MANDATORY - backend will reject if not selected */}
          <Card className="p-4 sm:p-5 border-2 border-cyan-200 bg-cyan-50/30">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-gray-800">Required Selections</span>
              <span className="text-xs text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">Mandatory</span>
            </div>

            {isLoadingData && (
              <div className="text-sm text-gray-500 py-4 text-center">Loading orders, customers, and warehouses...</div>
            )}

            {dataLoadError && (
              <div className="text-sm text-red-600 py-4 text-center">{dataLoadError}</div>
            )}

            {!isLoadingData && !dataLoadError && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* ORDER SELECTOR (Required) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Sales Order <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={orderId || ""}
                    onValueChange={(val) => {
                      setOrderId(val);
                      // Auto-populate order code and customer if available
                      const selectedOrder = orders.find((o) => (o.id || o.orderId) === val);
                      if (selectedOrder) {
                        // If order has customer info, auto-select it
                        if (selectedOrder.customerId && !customerId) {
                          setCustomerId(selectedOrder.customerId);
                          setCustomerName(selectedOrder.customerName || "");
                        }
                      }
                    }}
                  >
                    <SelectTrigger className={!orderId ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
                      <SelectValue placeholder="Select an order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.length === 0 ? (
                        <SelectItem value="__none__" disabled>No orders available</SelectItem>
                      ) : (
                        orders.map((order) => (
                          <SelectItem key={order.id || order.orderId} value={order.id || order.orderId}>
                            {order.orderNumber || order.code || order.id} - {order.customerName || "N/A"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!orderId && <p className="text-xs text-red-500">Order is required</p>}
                  {orderId && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Order selected</p>}
                </div>

                {/* CUSTOMER SELECTOR (Required) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={customerId || ""}
                    onValueChange={(val) => {
                      setCustomerId(val);
                      // Auto-populate customer name
                      const selectedCustomer = customers.find((c) => (c.id || c.customerId) === val);
                      if (selectedCustomer) {
                        setCustomerName(selectedCustomer.name || selectedCustomer.customerName || "");
                        setCustomerCode(selectedCustomer.code || selectedCustomer.customerCode || "");
                      }
                    }}
                  >
                    <SelectTrigger className={!customerId ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
                      <SelectValue placeholder="Select a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <SelectItem value="__none__" disabled>No customers available</SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id || customer.customerId} value={customer.id || customer.customerId}>
                            {customer.name || customer.customerName} {customer.code ? `(${customer.code})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!customerId && <p className="text-xs text-red-500">Customer is required</p>}
                  {customerId && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Customer selected</p>}
                </div>

                {/* WAREHOUSE SELECTOR (Required) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Warehouse <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={warehouseId || ""}
                    onValueChange={(val) => {
                      setWarehouseId(val);
                    }}
                  >
                    <SelectTrigger className={!warehouseId ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
                      <SelectValue placeholder="Select a warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.length === 0 ? (
                        <SelectItem value="__none__" disabled>No warehouses available</SelectItem>
                      ) : (
                        warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id || warehouse.warehouseId} value={warehouse.id || warehouse.warehouseId}>
                            {warehouse.name || warehouse.warehouseName} {warehouse.code ? `(${warehouse.code})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!warehouseId && <p className="text-xs text-red-500">Warehouse is required</p>}
                  {warehouseId && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Warehouse selected</p>}
                </div>
              </div>
            )}
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

            <div className="relative group">
              <Button
                type="submit"
                disabled={!canSubmit || isSaving}
                className="gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Create Dispatch"}
              </Button>
              {/* Tooltip hint when button is disabled */}
              {!canSubmit && getValidationMessage() && (
                <div className="absolute right-0 bottom-full mb-2 z-50 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                    {getValidationMessage()}
                    <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
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
