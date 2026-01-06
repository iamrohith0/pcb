// src/pages/maintenance/spares/SpareReturn.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  Hash,
  MapPin,
  Package,
  RotateCcw,
  Save,
  Search,
  Settings2,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * SpareReturn.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/maintenance/spares/SpareReturn.jsx
 *
 * Purpose:
 * - Return unused / wrong-issued / surplus spares back to stores.
 * - Supports linking to:
 *    1) Spare Issue (Issue No)
 *    2) Breakdown (BD-xxxx)
 *    3) PM (PM-xxxx)
 * - Supports serial-controlled returns too.
 *
 * Replace mocks with API:
 * - spareIssueService.search({ q })
 * - spareReturnService.create(payload)
 * - spareService.search({ q, warehouse })
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const RETURN_REASONS = [
  { key: "unused", label: "Unused" },
  { key: "wrong_issue", label: "Wrong Issue" },
  { key: "surplus", label: "Surplus" },
  { key: "repair_cancelled", label: "Repair Cancelled" },
  { key: "other", label: "Other" },
];

const CONDITION_OPTIONS = [
  { key: "new", label: "New / Unused" },
  { key: "opened", label: "Opened (Good)" },
  { key: "damaged", label: "Damaged" },
  { key: "repairable", label: "Repairable" },
];

const CONDITION_PILL = {
  new: "bg-green-100 text-green-700",
  opened: "bg-blue-100 text-blue-700",
  damaged: "bg-red-100 text-red-700",
  repairable: "bg-yellow-100 text-yellow-700",
};

function formatINR(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
}

export default function SpareReturn() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Header fields
  const [returnNo, setReturnNo] = useState(""); // optional (backend generate)
  const [warehouse, setWarehouse] = useState("Maintenance Store");
  const [location, setLocation] = useState("Plant 1 / Stores");

  const [linkedIssueNo, setLinkedIssueNo] = useState("ISS-3091"); // optional link to issue
  const [linkedRefType, setLinkedRefType] = useState("breakdown"); // breakdown | pm | none
  const [linkedRefId, setLinkedRefId] = useState("BD-1042");

  const [equipmentId, setEquipmentId] = useState("EQ-0001");
  const [equipmentName, setEquipmentName] = useState("CNC Drill 01");

  const [returnedBy, setReturnedBy] = useState("Technician - Arun");
  const [receivedBy, setReceivedBy] = useState("Stores - Keeper");
  const [reason, setReason] = useState("unused");
  const [remarks, setRemarks] = useState("");

  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  // Mock masters (replace with API)
  const warehouses = useMemo(() => ["Maintenance Store", "Central Stores", "Tool Crib"], []);
  const technicians = useMemo(
    () => ["Technician - Arun", "Technician - Nisha", "Technician - Faisal", "Technician - Rakesh"],
    []
  );
  const storeStaff = useMemo(() => ["Stores - Keeper", "Stores - Assistant", "Stores - Supervisor"], []);
  const equipmentOptions = useMemo(
    () => [
      { id: "EQ-0001", name: "CNC Drill 01" },
      { id: "EQ-0002", name: "CNC Router 02" },
      { id: "EQ-0003", name: "AOI Line 02" },
      { id: "EQ-0004", name: "UV Exposure Unit" },
      { id: "EQ-0005", name: "Plating Rectifier" },
    ],
    []
  );

  // Mock spares (replace with API search)
  const spareCatalog = useMemo(
    () => [
      {
        id: "SP-00021",
        code: "BELT-HTD-8M",
        name: "Timing Belt HTD 8M",
        uom: "Nos",
        onHand: 18,
        bin: "A-02-11",
        unitCost: 240,
        lot: "LOT-8M-122",
        serializable: false,
      },
      {
        id: "SP-00034",
        code: "BEARING-6204ZZ",
        name: "Bearing 6204ZZ",
        uom: "Nos",
        onHand: 42,
        bin: "A-01-04",
        unitCost: 65,
        lot: "LOT-BR-014",
        serializable: false,
      },
      {
        id: "SP-00201",
        code: "SENSOR-IND-M12",
        name: "Inductive Sensor M12",
        uom: "Nos",
        onHand: 3,
        bin: "C-01-01",
        unitCost: 920,
        lot: "LOT-SN-005",
        serializable: true,
      },
      {
        id: "SP-00308",
        code: "FUSE-10A-SLOW",
        name: "Fuse 10A Slow-blow",
        uom: "Nos",
        onHand: 120,
        bin: "D-02-05",
        unitCost: 8,
        lot: "LOT-FS-220",
        serializable: false,
      },
    ],
    []
  );

  const spareById = useMemo(() => {
    const m = new Map();
    spareCatalog.forEach((s) => m.set(s.id, s));
    return m;
  }, [spareCatalog]);

  const filteredSpares = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return spareCatalog;
    return spareCatalog.filter(
      (x) =>
        x.code.toLowerCase().includes(s) ||
        x.name.toLowerCase().includes(s) ||
        x.id.toLowerCase().includes(s)
    );
  }, [q, spareCatalog]);

  // Return lines
  const [lines, setLines] = useState([
    {
      lineId: "R1",
      spareId: "SP-00034",
      qty: 1,
      condition: "new",
      note: "",
      serials: [],
    },
  ]);

  const totals = useMemo(() => {
    let totalItems = 0;
    let totalQty = 0;
    let totalValue = 0;

    for (const ln of lines) {
      const sp = spareById.get(ln.spareId);
      if (!sp) continue;
      totalItems += 1;
      totalQty += Number(ln.qty || 0);
      totalValue += Number(ln.qty || 0) * Number(sp.unitCost || 0);
    }
    return { totalItems, totalQty, totalValue };
  }, [lines, spareById]);

  const canSubmit = useMemo(() => {
    if (!equipmentId) return false;
    if (!returnedBy) return false;
    if (!receivedBy) return false;
    if (!lines.length) return false;

    // Ref checks
    if (linkedRefType !== "none" && !linkedRefId) return false;

    for (const ln of lines) {
      const qn = Number(ln.qty || 0);
      if (!ln.spareId || qn <= 0) return false;
      const sp = spareById.get(ln.spareId);
      if (!sp) return false;
      if (sp.serializable && (ln.serials?.length || 0) !== qn) return false;
      // if damaged, allow qty but still needs reason in note (optional soft rule)
    }

    return true;
  }, [equipmentId, returnedBy, receivedBy, lines, linkedRefType, linkedRefId, spareById]);

  const addLine = (spareId = "") => {
    setLines((prev) => [
      ...prev,
      { lineId: `R${prev.length + 1}`, spareId, qty: 1, condition: "new", note: "", serials: [] },
    ]);
  };

  const removeLine = (lineId) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const updateLine = (lineId, patch) => {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  };

  const onPickEquipment = (id) => {
    const eq = equipmentOptions.find((e) => e.id === id);
    setEquipmentId(id);
    setEquipmentName(eq?.name || "");
  };

  const quickAddFromSearch = (spareId) => {
    const idx = lines.findIndex((l) => l.spareId === spareId);
    if (idx >= 0) {
      const ln = lines[idx];
      updateLine(ln.lineId, { qty: Number(ln.qty || 0) + 1 });
      return;
    }
    addLine(spareId);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Cannot create return",
        description: "Please check required fields and serial entries (if applicable).",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        return_no: returnNo || undefined,
        warehouse,
        location,
        linked_issue_no: linkedIssueNo || undefined,
        linked_ref_type: linkedRefType === "none" ? undefined : linkedRefType,
        linked_ref_id: linkedRefType === "none" ? undefined : linkedRefId,
        equipment_id: equipmentId,
        returned_by: returnedBy,
        received_by: receivedBy,
        reason,
        remarks,
        lines: lines.map((ln) => ({
          spare_id: ln.spareId,
          qty: Number(ln.qty),
          condition: ln.condition,
          note: ln.note,
          serials: ln.serials,
        })),
      };

      console.log("SPARE RETURN payload (demo):", payload);

      toast({
        title: "Spare return created",
        description: `Returned ${totals.totalQty} qty (${totals.totalItems} items) to ${warehouse}.`,
      });

      navigate("/maintenance/spares", { replace: true });
    } catch (err) {
      toast({
        title: "Save failed",
        description: "Could not create spare return. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <RotateCcw className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Return Spares</h1>
            <p className="text-sm text-gray-500">
              Return unused or surplus spares back to store with reference and condition tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/maintenance/spares">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={!canSubmit || saving}
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Return"}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Return Header */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Return Header</CardTitle>
              <CardDescription>Store, equipment, reference link, return reason, and personnel.</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="returnNo">Return No (optional)</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="returnNo"
                    value={returnNo}
                    onChange={(e) => setReturnNo(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse / Store</Label>
                <div className="relative">
                  <Package className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="warehouse"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                  >
                    {warehouses.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Plant / Stores"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment *</Label>
                <div className="relative">
                  <Wrench className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="equipment"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={equipmentId}
                    onChange={(e) => onPickEquipment(e.target.value)}
                    required
                  >
                    {equipmentOptions.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.id})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  Selected: <span className="font-medium text-gray-800">{equipmentName}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedIssue">Linked Issue No (optional)</Label>
                <div className="relative">
                  <CheckCircle2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="linkedIssue"
                    value={linkedIssueNo}
                    onChange={(e) => setLinkedIssueNo(e.target.value)}
                    placeholder="ISS-xxxx (optional)"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  If this return is from a specific issue, link it for full traceability.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Linked Ref</Label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="relative">
                    <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={linkedRefType}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLinkedRefType(v);
                        setLinkedRefId(v === "breakdown" ? "BD-1042" : v === "pm" ? "PM-2201" : "");
                      }}
                    >
                      <option value="breakdown">Breakdown</option>
                      <option value="pm">PM</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <Input
                    value={linkedRefId}
                    onChange={(e) => setLinkedRefId(e.target.value)}
                    placeholder={linkedRefType === "breakdown" ? "BD-xxxx" : linkedRefType === "pm" ? "PM-xxxx" : "—"}
                    disabled={linkedRefType === "none"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnedBy">Returned By *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="returnedBy"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={returnedBy}
                    onChange={(e) => setReturnedBy(e.target.value)}
                    required
                  >
                    {technicians.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedBy">Received By *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="receivedBy"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    required
                  >
                    {storeStaff.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Return Reason</Label>
                <div className="relative">
                  <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="reason"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {RETURN_REASONS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Explain return context, part usage, and any notes for store."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spare Search */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Spare Search</CardTitle>
              <CardDescription>Search and add spare items to return lines.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by spare code / name / ID"
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    toast({
                      title: "Barcode scan",
                      description: "Connect scanner input to search/auto-add (demo).",
                    })
                  }
                >
                  <Barcode className="h-4 w-4" />
                  Scan
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {filteredSpares.slice(0, 6).map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => quickAddFromSearch(sp.id)}
                    className="text-left rounded-xl border border-gray-200 p-3 transition hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{sp.name}</p>
                        <p className="text-xs text-gray-500">
                          {sp.code} • {sp.id} • Bin {sp.bin}
                        </p>
                      </div>
                      <Badge className="rounded-full bg-gray-100 text-gray-700">On hand: {sp.onHand}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>UOM: {sp.uom}</span>
                      <span>Unit: {formatINR(sp.unitCost)}</span>
                    </div>
                    {sp.serializable ? (
                      <div className="mt-2">
                        <Badge className="rounded-full bg-blue-100 text-blue-700">Serializable</Badge>
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                Click an item card to add it to return lines. If already added, it increments qty.
              </p>
            </CardContent>
          </Card>

          {/* Return Lines */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Return Lines</CardTitle>
              <CardDescription>Quantity, condition, and serial numbers (if applicable).</CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Items: {totals.totalItems}</Badge>
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Total Qty: {totals.totalQty}</Badge>
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Value: {formatINR(totals.totalValue)}</Badge>
                </div>

                <Button type="button" variant="outline" className="gap-2" onClick={() => addLine("")}>
                  <Package className="h-4 w-4" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-3">
                {lines.map((ln) => {
                  const sp = spareById.get(ln.spareId);
                  const unit = sp?.unitCost ?? 0;
                  const lineValue = Number(ln.qty || 0) * Number(unit || 0);

                  return (
                    <div key={ln.lineId} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                          <div className="space-y-2 lg:col-span-2">
                            <Label>Spare *</Label>
                            <div className="relative">
                              <Package className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <select
                                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={ln.spareId}
                                onChange={(e) =>
                                  updateLine(ln.lineId, { spareId: e.target.value, qty: 1, serials: [] })
                                }
                                required
                              >
                                <option value="" disabled>
                                  Select spare
                                </option>
                                {spareCatalog.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                  </option>
                                ))}
                              </select>
                            </div>
                            {sp ? (
                              <p className="text-xs text-gray-500">
                                {sp.id} • Bin {sp.bin} • Lot {sp.lot}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">Choose a spare part for this line.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Qty *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={ln.qty}
                              onChange={(e) => updateLine(ln.lineId, { qty: Number(e.target.value || 1), serials: [] })}
                              className="h-10"
                              disabled={!ln.spareId}
                            />
                            {sp?.serializable ? (
                              <p className="text-xs text-gray-500">Serializable: needs {ln.qty} serial(s).</p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label>Condition</Label>
                            <div className="relative">
                              <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <select
                                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={ln.condition}
                                onChange={(e) => updateLine(ln.lineId, { condition: e.target.value })}
                              >
                                {CONDITION_OPTIONS.map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="pt-1">
                              <Badge
                                className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", CONDITION_PILL[ln.condition])}
                              >
                                {ln.condition.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Line Value</Label>
                            <div className="h-10 rounded-md border bg-gray-50 px-3 flex items-center text-sm text-gray-700">
                              {formatINR(lineValue)}
                            </div>
                            <p className="text-xs text-gray-500">Unit: {formatINR(unit)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                              toast({
                                title: "Quality hold (demo)",
                                description:
                                  "If condition is Damaged, you can route to NCR/Repair process in future.",
                              })
                            }
                          >
                            <XCircle className="h-4 w-4" />
                            Hold
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2 text-red-700 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeLine(ln.lineId)}
                            disabled={lines.length === 1}
                            title={lines.length === 1 ? "At least one line required" : "Remove line"}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Serializable section */}
                      {sp?.serializable ? (
                        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-900">Serial Numbers Returned</p>
                            <Badge className="rounded-full bg-blue-100 text-blue-700">
                              {ln.serials?.length || 0}/{Number(ln.qty || 0)}
                            </Badge>
                          </div>

                          <p className="mt-1 text-xs text-gray-600">
                            Add exactly <span className="font-semibold">{ln.qty}</span> serial numbers for this return line.
                          </p>

                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: Number(ln.qty || 0) }).map((_, i) => {
                              const value = ln.serials?.[i] ?? "";
                              return (
                                <div key={`${ln.lineId}-sn-${i}`} className="space-y-1">
                                  <Label className="text-xs">Serial #{i + 1}</Label>
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const next = [...(ln.serials || [])];
                                      next[i] = e.target.value;
                                      updateLine(ln.lineId, { serials: next });
                                    }}
                                    placeholder="e.g., SN-AX19-00012"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-2">
                        <Label>Line Note</Label>
                        <Textarea
                          value={ln.note}
                          onChange={(e) => updateLine(ln.lineId, { note: e.target.value })}
                          placeholder="Reason/notes for store inspection (opened pack, damaged, etc.)"
                          rows={2}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500">
                Validation: Serializable spares require serial count = qty. Condition is recorded for store action.
              </p>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Link to="/maintenance/spares">
              <Button type="button" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={!canSubmit || saving}
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Create Return"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
