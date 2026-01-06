// src/pages/traceability/recall/RecallCreate.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    ClipboardList,
    FileSearch2,
    Hash,
    Link as LinkIcon,
    Loader2,
    PackageSearch,
    Plus,
    ShieldAlert,
    Trash2,
    Truck,
    XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function pill(kind) {
  switch (kind) {
    case "success":
      return "border-green-200 bg-green-50 text-green-700";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

// Simple helper to create stable ids for UI rows
function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * PCBxpress ERP — Recall Create
 * Path: src/pages/traceability/recall/RecallCreate.jsx
 *
 * What this page does:
 * - Create a recall "case" for a supplier lot / internal lot / shipment / work order / customer complaint.
 * - Helps capture scope, reason, risk assessment, actions, and affected items.
 *
 * Suggested backend endpoints (adjust to your system):
 * - POST /recalls
 * - POST /recalls/validate-scope  (optional)
 * - GET  /traceability/supplier-trace?query=... (we used on SupplierTrace page)
 *
 * If you don't have backend yet, this page still works in UI-only mode (it will show toast errors on save).
 */

export default function RecallCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Core recall meta
  const [recallTitle, setRecallTitle] = useState("");
  const [recallType, setRecallType] = useState("Supplier Lot"); // Supplier Lot | Internal Lot | Shipment | Work Order | Customer Complaint | Other
  const [severity, setSeverity] = useState("Major"); // Minor | Major | Critical
  const [priority, setPriority] = useState("High"); // Low | Medium | High
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  // Trace anchors
  const [supplierName, setSupplierName] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [supplierLot, setSupplierLot] = useState("");
  const [internalLot, setInternalLot] = useState("");
  const [poNo, setPoNo] = useState("");
  const [grnNo, setGrnNo] = useState("");
  const [woNo, setWoNo] = useState("");
  const [shipmentNo, setShipmentNo] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Dates & control
  const [incidentDate, setIncidentDate] = useState("");
  const [discoveredDate, setDiscoveredDate] = useState("");
  const [targetCloseDate, setTargetCloseDate] = useState("");
  const [containsRegulatoryRisk, setContainsRegulatoryRisk] = useState(false);

  // Affected scope items (lots/shipments/WO/customer batches)
  const [affectedItems, setAffectedItems] = useState([
    {
      id: uid(),
      type: "Lot",
      ref: "",
      itemName: "",
      qty: "",
      uom: "PCS",
      location: "",
      note: "",
    },
  ]);

  // Actions & tasks
  const [containmentActions, setContainmentActions] = useState("");
  const [correctionActions, setCorrectionActions] = useState("");
  const [communicationPlan, setCommunicationPlan] = useState("");

  // Validation preview (optional)
  const [scopePreview, setScopePreview] = useState(null);

  const canValidate = useMemo(() => {
    return (
      supplierLot.trim() ||
      internalLot.trim() ||
      grnNo.trim() ||
      poNo.trim() ||
      woNo.trim() ||
      shipmentNo.trim()
    );
  }, [supplierLot, internalLot, grnNo, poNo, woNo, shipmentNo]);

  const addAffectedRow = () => {
    setAffectedItems((prev) => [
      ...prev,
      {
        id: uid(),
        type: "Lot",
        ref: "",
        itemName: "",
        qty: "",
        uom: "PCS",
        location: "",
        note: "",
      },
    ]);
  };

  const removeAffectedRow = (id) => {
    setAffectedItems((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.id !== id)));
  };

  const updateAffectedRow = (id, patch) => {
    setAffectedItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const validateScope = async () => {
    if (!canValidate) {
      toast({
        title: "Nothing to validate",
        description: "Enter at least one reference like Supplier Lot / Internal Lot / GRN / WO / Shipment.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setScopePreview(null);

    try {
      // Optional endpoint — if you don’t have it yet, you can remove this call.
      const res = await api.post("/recalls/validate-scope", {
        recall_type: recallType,
        supplier_lot: supplierLot || null,
        internal_lot: internalLot || null,
        po_no: poNo || null,
        grn_no: grnNo || null,
        wo_no: woNo || null,
        shipment_no: shipmentNo || null,
      });

      const data = res?.data?.data ?? res?.data ?? null;
      setScopePreview(data);

      toast({
        title: "Scope validated",
        description: "We found linked records. Review the preview before creating the recall.",
      });
    } catch (err) {
      console.warn(err);
      toast({
        title: "Validation not available",
        description:
          err?.response?.data?.message ||
          "Could not validate scope. You can still create the recall and investigate manually.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const buildPayload = () => {
    const cleanedAffected = affectedItems
      .map((x) => ({
        type: x.type?.trim() || "Lot",
        ref: x.ref?.trim() || null,
        item_name: x.itemName?.trim() || null,
        qty: x.qty === "" ? null : Number(x.qty),
        uom: x.uom?.trim() || "PCS",
        location: x.location?.trim() || null,
        note: x.note?.trim() || null,
      }))
      .filter((x) => x.ref || x.item_name || x.qty || x.location || x.note);

    return {
      title: recallTitle?.trim() || null,
      recall_type: recallType,
      severity,
      priority,
      reason: reason?.trim() || null,
      description: description?.trim() || null,

      supplier: {
        code: supplierCode?.trim() || null,
        name: supplierName?.trim() || null,
      },

      anchors: {
        supplier_lot: supplierLot?.trim() || null,
        internal_lot: internalLot?.trim() || null,
        po_no: poNo?.trim() || null,
        grn_no: grnNo?.trim() || null,
        wo_no: woNo?.trim() || null,
        shipment_no: shipmentNo?.trim() || null,
        customer_name: customerName?.trim() || null,
      },

      dates: {
        incident_date: incidentDate || null,
        discovered_date: discoveredDate || null,
        target_close_date: targetCloseDate || null,
      },

      regulatory_risk: !!containsRegulatoryRisk,

      actions: {
        containment: containmentActions?.trim() || null,
        correction: correctionActions?.trim() || null,
        communication_plan: communicationPlan?.trim() || null,
      },

      affected_items: cleanedAffected,
    };
  };

  const validateForm = () => {
    if (!recallTitle.trim()) {
      toast({ title: "Missing title", description: "Enter a recall title.", variant: "destructive" });
      return false;
    }
    if (!reason.trim()) {
      toast({ title: "Missing reason", description: "Enter the recall reason.", variant: "destructive" });
      return false;
    }
    const hasAnyAnchor =
      supplierLot.trim() ||
      internalLot.trim() ||
      grnNo.trim() ||
      poNo.trim() ||
      woNo.trim() ||
      shipmentNo.trim() ||
      customerName.trim();

    if (!hasAnyAnchor) {
      toast({
        title: "Missing reference",
        description: "Provide at least one reference (Lot/GRN/WO/Shipment/Customer) to track the scope.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = buildPayload();
    setIsSaving(true);

    try {
      const res = await api.post("/recalls", payload);
      const data = res?.data?.data ?? res?.data ?? null;

      toast({ title: "Recall created", description: "Recall case created successfully." });

      // Navigate to details page if you have one, otherwise go back to list.
      const recallId = data?.id ?? data?._id ?? data?.recall_id ?? null;
      if (recallId) {
        navigate(`/traceability/recall/details?id=${encodeURIComponent(recallId)}`, { replace: true });
      } else {
        navigate(`/traceability/recall`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Unable to create recall. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const severityBadge = useMemo(() => {
    if (severity === "Critical") return pill("danger");
    if (severity === "Major") return pill("warn");
    return pill("default");
  }, [severity]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="border bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#dc2551]/10 p-3">
                  <ShieldAlert className="h-6 w-6 text-[#dc2551]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create Recall</CardTitle>
                  <CardDescription>
                    Create a traceable recall case for supplier lots, internal lots, work orders, or shipments.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="ghost" className="gap-2">
                  <Link to="/traceability/recall">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={validateScope}
                  disabled={isValidating || !canValidate}
                  title={!canValidate ? "Enter a reference to validate scope" : "Validate linked records"}
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
                  Validate Scope
                </Button>

                <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Create Recall
                </Button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={cx("border", severityBadge)}>
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                Severity: {severity}
              </Badge>
              <Badge className={cx("border", pill("default"))}>Priority: {priority}</Badge>
              {containsRegulatoryRisk ? (
                <Badge className={cx("border", pill("danger"))}>Regulatory Risk</Badge>
              ) : (
                <Badge className={cx("border", pill("default"))}>No Regulatory Flag</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Section: Recall basics */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-2">
                <Label htmlFor="title">Recall Title *</Label>
                <Input
                  id="title"
                  value={recallTitle}
                  onChange={(e) => setRecallTitle(e.target.value)}
                  placeholder="Example: Copper foil lot issue — delamination risk"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Recall Type</Label>
                <select
                  id="type"
                  value={recallType}
                  onChange={(e) => setRecallType(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option>Supplier Lot</option>
                  <option>Internal Lot</option>
                  <option>Work Order</option>
                  <option>Shipment</option>
                  <option>Customer Complaint</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option>Minor</option>
                  <option>Major</option>
                  <option>Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Example: Incoming IQC found copper thickness out of spec"
                />
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue, suspected root cause, and any observed failures."
                  className="min-h-[110px]"
                />
              </div>
            </div>

            {/* Section: References / Anchors */}
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[#dc2551]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Trace Anchors *</p>
                  <p className="text-xs text-gray-600">
                    Provide at least one reference (lot/GRN/WO/shipment/customer) to identify scope.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Supplier Name</Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Supplier Code</Label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Supplier Lot / Batch</Label>
                  <Input value={supplierLot} onChange={(e) => setSupplierLot(e.target.value)} placeholder="LOT-..." />
                </div>

                <div className="space-y-2">
                  <Label>Internal Lot</Label>
                  <Input value={internalLot} onChange={(e) => setInternalLot(e.target.value)} placeholder="INT-LOT-..." />
                </div>

                <div className="space-y-2">
                  <Label>PO No</Label>
                  <Input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="PO-..." />
                </div>

                <div className="space-y-2">
                  <Label>GRN No</Label>
                  <Input value={grnNo} onChange={(e) => setGrnNo(e.target.value)} placeholder="GRN-..." />
                </div>

                <div className="space-y-2">
                  <Label>Work Order No</Label>
                  <Input value={woNo} onChange={(e) => setWoNo(e.target.value)} placeholder="WO-..." />
                </div>

                <div className="space-y-2">
                  <Label>Shipment No</Label>
                  <div className="relative">
                    <Truck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      value={shipmentNo}
                      onChange={(e) => setShipmentNo(e.target.value)}
                      className="pl-9"
                      placeholder="SHP-..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
                </div>
              </div>
            </div>

            {/* Section: Dates & compliance */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Incident Date</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Discovered Date</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={discoveredDate}
                    onChange={(e) => setDiscoveredDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Close Date</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={targetCloseDate}
                    onChange={(e) => setTargetCloseDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Regulatory Risk</Label>
                <button
                  type="button"
                  onClick={() => setContainsRegulatoryRisk((s) => !s)}
                  className={cx(
                    "h-10 w-full rounded-md border px-3 text-sm text-left",
                    containsRegulatoryRisk ? "border-red-200 bg-red-50 text-red-700" : "bg-white"
                  )}
                >
                  {containsRegulatoryRisk ? "Yes — requires compliance review" : "No"}
                </button>
              </div>
            </div>

            {/* Section: Affected Items */}
            <div className="rounded-2xl border bg-white p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#dc2551]" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Affected Items</p>
                    <p className="text-xs text-gray-600">
                      List specific lots/shipments/WO batches affected (optional but recommended).
                    </p>
                  </div>
                </div>

                <Button type="button" variant="outline" className="gap-2" onClick={addAffectedRow}>
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-600">
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Reference</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">UOM</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Note</th>
                      <th className="px-3 py-2 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {affectedItems.map((row) => (
                      <tr key={row.id} className="text-sm">
                        <td className="px-3 py-2">
                          <select
                            value={row.type}
                            onChange={(e) => updateAffectedRow(row.id, { type: e.target.value })}
                            className="h-9 rounded-md border bg-white px-2 text-sm"
                          >
                            <option>Lot</option>
                            <option>Work Order</option>
                            <option>Shipment</option>
                            <option>Customer Batch</option>
                            <option>Other</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.ref}
                            onChange={(e) => updateAffectedRow(row.id, { ref: e.target.value })}
                            placeholder="LOT- / WO- / SHP-"
                            className="h-9"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.itemName}
                            onChange={(e) => updateAffectedRow(row.id, { itemName: e.target.value })}
                            placeholder="Copper foil / Prepreg / Ink..."
                            className="h-9"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.qty}
                            onChange={(e) => updateAffectedRow(row.id, { qty: e.target.value })}
                            placeholder="0"
                            className="h-9 w-24"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.uom}
                            onChange={(e) => updateAffectedRow(row.id, { uom: e.target.value })}
                            className="h-9 w-20"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.location}
                            onChange={(e) => updateAffectedRow(row.id, { location: e.target.value })}
                            placeholder="WH-A / RACK-2"
                            className="h-9"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.note}
                            onChange={(e) => updateAffectedRow(row.id, { note: e.target.value })}
                            placeholder="Quarantine / Returned / Used..."
                            className="h-9"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeAffectedRow(row.id)}
                            disabled={affectedItems.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Actions */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-1">
                <Label>Containment Actions</Label>
                <Textarea
                  value={containmentActions}
                  onChange={(e) => setContainmentActions(e.target.value)}
                  placeholder="Example: Quarantine remaining lots, block WO issue, stop shipment hold..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <Label>Correction Actions</Label>
                <Textarea
                  value={correctionActions}
                  onChange={(e) => setCorrectionActions(e.target.value)}
                  placeholder="Example: Replace material, rework boards, update incoming spec checks..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <Label>Communication Plan</Label>
                <Textarea
                  value={communicationPlan}
                  onChange={(e) => setCommunicationPlan(e.target.value)}
                  placeholder="Example: Inform customers, notify supplier, internal QA notice, shipment hold message..."
                  className="min-h-[120px]"
                />
              </div>
            </div>

            {/* Scope preview (optional) */}
            {scopePreview && (
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileSearch2 className="h-4 w-4 text-[#dc2551]" />
                  <p className="text-sm font-semibold text-gray-800">Scope Preview</p>
                  <Badge className={cx("border", pill("default"))}>Auto-detected</Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-white p-3">
                    <div className="text-xs font-semibold text-gray-600">Lots</div>
                    <div className="mt-1 text-lg font-bold text-gray-800">{safe(scopePreview?.lots_count)}</div>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <div className="text-xs font-semibold text-gray-600">GRNs</div>
                    <div className="mt-1 text-lg font-bold text-gray-800">{safe(scopePreview?.grns_count)}</div>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <div className="text-xs font-semibold text-gray-600">Work Orders</div>
                    <div className="mt-1 text-lg font-bold text-gray-800">{safe(scopePreview?.work_orders_count)}</div>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <div className="text-xs font-semibold text-gray-600">Shipments</div>
                    <div className="mt-1 text-lg font-bold text-gray-800">{safe(scopePreview?.shipments_count)}</div>
                  </div>
                </div>

                {Array.isArray(scopePreview?.notes) && scopePreview.notes.length > 0 && (
                  <div className="mt-3 rounded-xl border bg-white p-3 text-sm text-gray-700">
                    <div className="font-semibold text-gray-800">Notes</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {scopePreview.notes.map((n, idx) => (
                        <li key={idx}>{safe(n)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Footer help */}
            <div className="rounded-2xl border bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-semibold">Tip for PCB manufacturing recalls</div>
                  <div className="mt-1 text-xs text-amber-800">
                    Always bind recall scope to <span className="font-semibold">lots at GRN</span> and enforce
                    issue-to-WO and ship-by-WO mapping. That’s what makes “where-used” reports reliable.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/traceability/recall">
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Link>
              </Button>
              <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Create Recall
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
