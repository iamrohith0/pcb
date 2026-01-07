// src/pages/maintenance/spares/SpareIssue.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Barcode,
    ClipboardCheck,
    Hash,
    MapPin,
    Minus,
    Package,
    Plus,
    Save,
    Search,
    Settings2,
    User,
    Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * SpareIssue.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/maintenance/spares/SpareIssue.jsx
 *
 * Purpose:
 * - Issue spare parts from maintenance stores to:
 *    1) Equipment breakdown work order
 *    2) Preventive maintenance (PM)
 *    3) General maintenance consumption
 *
 * Replace mocks with API:
 * - spareService.search({ q, warehouse })
 * - equipmentService.list()
 * - breakdownService.listOpen()
 * - pmService.listUpcoming()
 * - spareIssueService.create(payload)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const ISSUE_TYPES = [
  { key: "breakdown", label: "Breakdown" },
  { key: "pm", label: "Preventive Maintenance" },
  { key: "general", label: "General Maintenance" },
];

const PRIORITIES = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

const PRIORITY_PILL = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function formatINR(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
}

export default function SpareIssue() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Header fields
  const [issueNo, setIssueNo] = useState(""); // optional (backend generate)
  const [issueType, setIssueType] = useState("breakdown");
  const [priority, setPriority] = useState("medium");

  const [warehouse, setWarehouse] = useState("Maintenance Store");
  const [location, setLocation] = useState("Plant 1 / Stores");

  const [equipmentId, setEquipmentId] = useState("EQ-0001");
  const [equipmentName, setEquipmentName] = useState("CNC Drill 01");

  const [refId, setRefId] = useState("BD-1042"); // Breakdown ID / PM ID etc.
  const [issuedTo, setIssuedTo] = useState("Technician - Arun");
  const [requestedBy, setRequestedBy] = useState("Maintenance - Supervisor");
  const [remarks, setRemarks] = useState("");

  // Item search
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  // Mock masters (replace with API)
  const warehouses = useMemo(() => ["Maintenance Store", "Central Stores", "Tool Crib"], []);
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

  const technicians = useMemo(
    () => ["Technician - Arun", "Technician - Nisha", "Technician - Faisal", "Technician - Rakesh"],
    []
  );

  const refSuggestions = useMemo(() => {
    if (issueType === "breakdown") return ["BD-1042", "BD-1039", "BD-1032"];
    if (issueType === "pm") return ["PM-2201", "PM-2198", "PM-2192"];
    return ["GEN-0007", "GEN-0006"];
  }, [issueType]);

  // Mock spares (replace with API search)
  const spareCatalog = useMemo(
    () => [
      {
        id: "SP-00021",
        code: "BELT-HTD-8M",
        name: "Timing Belt HTD 8M",
        uom: "Nos",
        onHand: 18,
        min: 5,
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
        min: 10,
        bin: "A-01-04",
        unitCost: 65,
        lot: "LOT-BR-014",
        serializable: false,
      },
      {
        id: "SP-00112",
        code: "FILTER-AIR-1/4",
        name: "Air Filter 1/4 inch",
        uom: "Nos",
        onHand: 7,
        min: 8,
        bin: "B-03-02",
        unitCost: 180,
        lot: "LOT-AF-077",
        serializable: false,
      },
      {
        id: "SP-00201",
        code: "SENSOR-IND-M12",
        name: "Inductive Sensor M12",
        uom: "Nos",
        onHand: 3,
        min: 2,
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
        min: 50,
        bin: "D-02-05",
        unitCost: 8,
        lot: "LOT-FS-220",
        serializable: false,
      },
    ],
    []
  );

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

  // Issued line items
  const [lines, setLines] = useState([
    {
      lineId: "L1",
      spareId: "SP-00034",
      qty: 2,
      note: "",
      serials: [], // for serializable items
    },
  ]);

  const spareById = useMemo(() => {
    const map = new Map();
    spareCatalog.forEach((s) => map.set(s.id, s));
    return map;
  }, [spareCatalog]);

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
    if (!issuedTo) return false;
    if (!refId && issueType !== "general") return false;
    if (!lines.length) return false;

    // basic qty check
    for (const ln of lines) {
      const qn = Number(ln.qty || 0);
      if (!ln.spareId || qn <= 0) return false;
      const sp = spareById.get(ln.spareId);
      if (!sp) return false;
      if (qn > sp.onHand) return false;
      if (sp.serializable && (ln.serials?.length || 0) !== qn) return false;
    }
    return true;
  }, [equipmentId, issuedTo, refId, issueType, lines, spareById]);

  const addLine = (spareId = "") => {
    setLines((prev) => [
      ...prev,
      { lineId: `L${prev.length + 1}`, spareId, qty: 1, note: "", serials: [] },
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
    // If already exists, increment qty
    const idx = lines.findIndex((l) => l.spareId === spareId);
    if (idx >= 0) {
      const ln = lines[idx];
      const sp = spareById.get(spareId);
      const nextQty = Number(ln.qty || 0) + 1;
      const max = sp?.onHand ?? nextQty;
      updateLine(ln.lineId, { qty: Math.min(nextQty, max) });
      return;
    }
    addLine(spareId);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Cannot issue spares",
        description:
          "Please check required fields, quantities, stock availability, and serial selection (if needed).",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        issue_no: issueNo || undefined,
        issue_type: issueType,
        priority,
        warehouse,
        location,
        equipment_id: equipmentId,
        ref_id: issueType === "general" ? undefined : refId,
        issued_to: issuedTo,
        requested_by: requestedBy,
        remarks,
        lines: lines.map((ln) => ({
          spare_id: ln.spareId,
          qty: Number(ln.qty),
          note: ln.note,
          serials: ln.serials,
        })),
      };

      console.log("SPARE ISSUE payload (demo):", payload);

      toast({
        title: "Spare issue created",
        description: `Issued ${totals.totalQty} qty (${totals.totalItems} items) from ${warehouse}.`,
      });

      navigate("/maintenance/spares", { replace: true });
    } catch (err) {
      toast({
        title: "Save failed",
        description: "Could not create spare issue. Please try again.",
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
            <Package className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Issue Spares</h1>
            <p className="text-sm text-gray-500">
              Issue spare parts for breakdowns, preventive maintenance, or general maintenance usage.
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
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Issue"}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Issue Header */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Issue Header</CardTitle>
              <CardDescription>Reference, equipment, store, assignee, and priority.</CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="issueNo">Issue No (optional)</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="issueNo"
                    value={issueNo}
                    onChange={(e) => setIssueNo(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueType">Issue Type</Label>
                <div className="relative">
                  <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="issueType"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={issueType}
                    onChange={(e) => {
                      const v = e.target.value;
                      setIssueType(v);
                      setRefId(v === "breakdown" ? "BD-1042" : v === "pm" ? "PM-2201" : "");
                    }}
                  >
                    {ISSUE_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <div className="relative">
                  <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="priority"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-1">
                  <Badge className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", PRIORITY_PILL[priority])}>
                    {priority.toUpperCase()}
                  </Badge>
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
                <Label htmlFor="refId">{issueType === "breakdown" ? "Breakdown ID *" : issueType === "pm" ? "PM ID *" : "Reference (optional)"}</Label>
                <div className="relative">
                  <ClipboardCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="refId"
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                    placeholder={issueType === "general" ? "Optional reference" : "Enter reference ID"}
                    className="pl-9"
                    required={issueType !== "general"}
                    list="ref-suggestions"
                  />
                  <datalist id="ref-suggestions">
                    {refSuggestions.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-gray-500">
                  Tip: Link issued spares to breakdown/PM for traceability & cost.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuedTo">Issued To *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="issuedTo"
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={issuedTo}
                    onChange={(e) => setIssuedTo(e.target.value)}
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
                <Label htmlFor="requestedBy">Requested By</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="requestedBy"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    placeholder="Supervisor / Engineer"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Reason for issue, symptoms, part replacement notes, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spare Search & Quick Add */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Spare Search</CardTitle>
              <CardDescription>Search spares and quick-add to the issue lines.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by spare code / name / ID (e.g., BEARING, SENSOR, FUSE)"
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
                {filteredSpares.slice(0, 6).map((sp) => {
                  const low = sp.onHand < sp.min;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => quickAddFromSearch(sp.id)}
                      className={cx(
                        "text-left rounded-xl border p-3 transition hover:bg-gray-50",
                        low ? "border-red-200" : "border-gray-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{sp.name}</p>
                          <p className="text-xs text-gray-500">
                            {sp.code} • {sp.id} • Bin {sp.bin}
                          </p>
                        </div>
                        <Badge className={cx("rounded-full", low ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>
                          On hand: {sp.onHand}
                        </Badge>
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
                  );
                })}
              </div>

              <p className="text-xs text-gray-500">
                Click an item card to add it to issue lines. If already added, it increments qty (up to stock).
              </p>
            </CardContent>
          </Card>

          {/* Issue Lines */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-base">Issue Lines</CardTitle>
              <CardDescription>Add spares, quantities, and serials (if applicable).</CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Items: {totals.totalItems}</Badge>
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Total Qty: {totals.totalQty}</Badge>
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Value: {formatINR(totals.totalValue)}</Badge>
                </div>

                <Button type="button" variant="outline" className="gap-2" onClick={() => addLine("")}>
                  <Plus className="h-4 w-4" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-3">
                {lines.map((ln, idx) => {
                  const sp = spareById.get(ln.spareId);
                  const onHand = sp?.onHand ?? 0;
                  const unit = sp?.unitCost ?? 0;
                  const lineValue = Number(ln.qty || 0) * Number(unit || 0);
                  const invalidQty = Number(ln.qty || 0) > onHand;

                  return (
                    <div key={ln.lineId} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-2 lg:col-span-2">
                            <Label>Spare *</Label>
                            <div className="relative">
                              <Package className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <select
                                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={ln.spareId}
                                onChange={(e) => updateLine(ln.lineId, { spareId: e.target.value, qty: 1, serials: [] })}
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
                                {sp.id} • Bin {sp.bin} • Lot {sp.lot} • On hand{" "}
                                <span className={cx("font-semibold", sp.onHand < sp.min ? "text-red-700" : "text-gray-800")}>
                                  {sp.onHand}
                                </span>
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">Choose a spare part for this line.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Qty *</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateLine(ln.lineId, { qty: Math.max(1, Number(ln.qty || 1) - 1) })}
                                className="h-10 w-10 p-0"
                                disabled={!ln.spareId}
                                aria-label="Decrease qty"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={ln.qty}
                                onChange={(e) => updateLine(ln.lineId, { qty: Number(e.target.value || 1) })}
                                className={cx("h-10", invalidQty ? "border-red-400 focus-visible:ring-red-300" : "")}
                                disabled={!ln.spareId}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const next = Number(ln.qty || 0) + 1;
                                  const max = onHand || next;
                                  updateLine(ln.lineId, { qty: Math.min(next, max) });
                                }}
                                className="h-10 w-10 p-0"
                                disabled={!ln.spareId}
                                aria-label="Increase qty"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {invalidQty ? (
                              <p className="text-xs text-red-700">Qty exceeds on-hand stock ({onHand}).</p>
                            ) : null}
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
                                title: "Traceability",
                                description: "Attach photo / doc / replacement proof here (demo).",
                              })
                            }
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Attach
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
                            <p className="text-sm font-semibold text-gray-900">Serial Numbers Required</p>
                            <Badge className="rounded-full bg-blue-100 text-blue-700">
                              {ln.serials?.length || 0}/{Number(ln.qty || 0)}
                            </Badge>
                          </div>

                          <p className="mt-1 text-xs text-gray-600">
                            This spare is serializable. Add exactly <span className="font-semibold">{ln.qty}</span> serial numbers.
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
                          placeholder="Replacement reason / part position / observations"
                          rows={2}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500">
                Validation rules: Qty must be ≤ on-hand. Serializable spares require serial count = qty.
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
              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Create Issue"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
