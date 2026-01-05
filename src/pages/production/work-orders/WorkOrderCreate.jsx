// src/pages/production/work-orders/WorkOrderCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  BadgeCheck,
  ClipboardList,
  Factory,
  FileUp,
  Hash,
  Layers,
  Loader2,
  Package,
  Plus,
  Save,
  Settings2,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.jsx";

/**
 * WorkOrderCreate.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * This page creates a production Work Order:
 * - Links to Sales Order / Customer / Part Number
 * - Captures PCB build parameters (layer count, thickness, copper, finish, solder mask, etc.)
 * - Uploads job pack (Gerbers, drill, readme) - UI only (wire to API later)
 * - Generates batches/panels/lot plan fields (basic)
 *
 * Suggested backend endpoints:
 * - GET  /masters/customers
 * - GET  /masters/parts?customer_id=...
 * - POST /production/work-orders
 * - POST /files/upload (job pack)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PLANTS = ["Plant 1", "Plant 2"];
const PRIORITIES = ["Normal", "High", "Urgent"];
const PCB_CLASSES = ["Single Layer", "Double Layer", "Multilayer"];
const SURFACE_FINISH = ["HASL", "Lead Free HASL", "ENIG", "OSP", "Immersion Silver", "Immersion Tin"];
const SOLDERMASK = ["Green", "Black", "Blue", "Red", "White", "Yellow"];
const SILKSCREEN = ["White", "Black", "None"];
const COPPER_OZ = ["0.5 oz", "1 oz", "2 oz", "3 oz"];
const THICKNESS_MM = ["0.8", "1.0", "1.2", "1.6", "2.0", "2.4"];

function makeWoNo() {
  // UI-only "WO" generator (replace with server numbering)
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `WO-${yy}${mm}${dd}-${rand}`;
}

function isPositiveNumber(v) {
  const n = Number(v);
  return !Number.isNaN(n) && n > 0;
}

export default function WorkOrderCreate() {
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);

  // Header identifiers
  const [woNo, setWoNo] = useState(makeWoNo());
  const [createdOn] = useState(format(new Date(), "dd MMM yyyy, HH:mm"));

  // Sales link (optional)
  const [salesOrderNo, setSalesOrderNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPoNo, setCustomerPoNo] = useState("");

  // Part details
  const [partNo, setPartNo] = useState("");
  const [revision, setRevision] = useState("A");
  const [description, setDescription] = useState("");

  // Quantity / schedule
  const [plant, setPlant] = useState("Plant 1");
  const [priority, setPriority] = useState("Normal");
  const [targetDate, setTargetDate] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [panelQty, setPanelQty] = useState("");
  const [customerType, setCustomerType] = useState("Prototype"); // Prototype / Production
  const [notes, setNotes] = useState("");

  // PCB build specs
  const [pcbClass, setPcbClass] = useState("Double Layer");
  const [layers, setLayers] = useState("2");
  const [thickness, setThickness] = useState("1.6");
  const [copperOuter, setCopperOuter] = useState("1 oz");
  const [copperInner, setCopperInner] = useState("1 oz");
  const [surfaceFinish, setSurfaceFinish] = useState("ENIG");
  const [solderMask, setSolderMask] = useState("Green");
  const [silkscreen, setSilkscreen] = useState("White");
  const [impedanceControlled, setImpedanceControlled] = useState(false);

  // Dimensions / tooling
  const [boardSizeX, setBoardSizeX] = useState("");
  const [boardSizeY, setBoardSizeY] = useState("");
  const [panelSizeX, setPanelSizeX] = useState("");
  const [panelSizeY, setPanelSizeY] = useState("");
  const [minTrack, setMinTrack] = useState("");
  const [minSpace, setMinSpace] = useState("");
  const [minHole, setMinHole] = useState("");
  const [finishCu, setFinishCu] = useState("");

  // Job pack uploads (UI)
  const [jobFiles, setJobFiles] = useState([]);

  // BOM / materials (simple rows)
  const [materials, setMaterials] = useState([
    { id: cryptoRandomId(), item: "FR4 Core", spec: "Tg 150", uom: "Sheet", qty: "1" },
  ]);

  // Confirmations
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const computedPcbClass = useMemo(() => {
    const l = Number(layers);
    if (!Number.isNaN(l) && l >= 4) return "Multilayer";
    if (l === 1) return "Single Layer";
    return "Double Layer";
  }, [layers]);

  useEffect(() => {
    // Keep pcbClass aligned to layers if user changes layers
    setPcbClass(computedPcbClass);
  }, [computedPcbClass]);

  function cryptoRandomId() {
    try {
      return crypto.randomUUID();
    } catch {
      return String(Date.now() + Math.random());
    }
  }

  function addMaterial() {
    setMaterials((prev) => [
      ...prev,
      { id: cryptoRandomId(), item: "", spec: "", uom: "Nos", qty: "" },
    ]);
  }

  function removeMaterial(id) {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMaterial(id, key, value) {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  }

  function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setJobFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removeFile(idx) {
    setJobFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    const errors = [];

    if (!customerName.trim()) errors.push("Customer name is required.");
    if (!partNo.trim()) errors.push("Part number is required.");
    if (!orderQty || !isPositiveNumber(orderQty)) errors.push("Order quantity must be a positive number.");
    if (!layers || !isPositiveNumber(layers)) errors.push("Layers must be a positive number.");
    if (!thickness) errors.push("Thickness is required.");

    // Dimensions if provided must be positive
    const dimFields = [
      { label: "Board size X", v: boardSizeX },
      { label: "Board size Y", v: boardSizeY },
      { label: "Panel size X", v: panelSizeX },
      { label: "Panel size Y", v: panelSizeY },
    ];
    dimFields.forEach(({ label, v }) => {
      if (String(v || "").trim() && !isPositiveNumber(v)) errors.push(`${label} must be positive.`);
    });

    // Material rows basic check
    const badMat = materials.find((m) => (m.item || m.spec || m.qty) && (!m.item || !m.qty));
    if (badMat) errors.push("Each material row must have Item and Qty filled (or leave the row blank).");

    return errors;
  }

  async function submit() {
    const errors = validate();
    if (errors.length) {
      toast({ title: "Fix errors", description: errors[0], variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        wo_no: woNo,
        sales_order_no: salesOrderNo,
        customer: { name: customerName, po_no: customerPoNo, type: customerType },
        part: { part_no: partNo, revision, description },
        schedule: { plant, priority, target_date: targetDate || null },
        qty: { order_qty: Number(orderQty), panel_qty: panelQty ? Number(panelQty) : null },
        pcb: {
          pcb_class: pcbClass,
          layers: Number(layers),
          thickness_mm: Number(thickness),
          copper_outer: copperOuter,
          copper_inner: pcbClass === "Multilayer" ? copperInner : null,
          surface_finish: surfaceFinish,
          solder_mask: solderMask,
          silkscreen,
          impedance_controlled: impedanceControlled,
        },
        dims: {
          board_x_mm: boardSizeX ? Number(boardSizeX) : null,
          board_y_mm: boardSizeY ? Number(boardSizeY) : null,
          panel_x_mm: panelSizeX ? Number(panelSizeX) : null,
          panel_y_mm: panelSizeY ? Number(panelSizeY) : null,
        },
        capabilities: {
          min_track_mm: minTrack ? Number(minTrack) : null,
          min_space_mm: minSpace ? Number(minSpace) : null,
          min_hole_mm: minHole ? Number(minHole) : null,
          finish_cu_oz: finishCu ? Number(finishCu) : null,
        },
        materials: materials
          .filter((m) => (m.item || "").trim() || (m.spec || "").trim() || (m.qty || "").trim())
          .map((m) => ({ item: m.item.trim(), spec: m.spec.trim(), uom: m.uom, qty: Number(m.qty) })),
        notes: notes.trim(),
        job_files_count: jobFiles.length,
      };

      // TODO: Replace with API call:
      // await workOrdersApi.create(payload)
      await new Promise((r) => setTimeout(r, 650));

      toast({
        title: "Work Order created",
        description: `${payload.wo_no} saved successfully.`,
      });

      // Fresh WO number for next creation
      setWoNo(makeWoNo());
      setSalesOrderNo("");
      setCustomerName("");
      setCustomerPoNo("");
      setPartNo("");
      setRevision("A");
      setDescription("");
      setTargetDate("");
      setOrderQty("");
      setPanelQty("");
      setCustomerType("Prototype");
      setNotes("");
      setLayers("2");
      setThickness("1.6");
      setCopperOuter("1 oz");
      setCopperInner("1 oz");
      setSurfaceFinish("ENIG");
      setSolderMask("Green");
      setSilkscreen("White");
      setImpedanceControlled(false);
      setBoardSizeX("");
      setBoardSizeY("");
      setPanelSizeX("");
      setPanelSizeY("");
      setMinTrack("");
      setMinSpace("");
      setMinHole("");
      setFinishCu("");
      setJobFiles([]);
      setMaterials([{ id: cryptoRandomId(), item: "FR4 Core", spec: "Tg 150", uom: "Sheet", qty: "1" }]);
    } catch (e) {
      toast({
        title: "Save failed",
        description: "Could not create work order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setConfirmReset(false);
    setWoNo(makeWoNo());
    setSalesOrderNo("");
    setCustomerName("");
    setCustomerPoNo("");
    setPartNo("");
    setRevision("A");
    setDescription("");
    setPlant("Plant 1");
    setPriority("Normal");
    setTargetDate("");
    setOrderQty("");
    setPanelQty("");
    setCustomerType("Prototype");
    setNotes("");
    setLayers("2");
    setThickness("1.6");
    setCopperOuter("1 oz");
    setCopperInner("1 oz");
    setSurfaceFinish("ENIG");
    setSolderMask("Green");
    setSilkscreen("White");
    setImpedanceControlled(false);
    setBoardSizeX("");
    setBoardSizeY("");
    setPanelSizeX("");
    setPanelSizeY("");
    setMinTrack("");
    setMinSpace("");
    setMinHole("");
    setFinishCu("");
    setJobFiles([]);
    setMaterials([{ id: cryptoRandomId(), item: "FR4 Core", spec: "Tg 150", uom: "Sheet", qty: "1" }]);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#dc2551]" />
              Create Work Order
            </CardTitle>
            <CardDescription>
              Create a PCB manufacturing WO with build specs, targets, and job pack attachments.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Hash className="h-3.5 w-3.5" />
              {woNo}
            </Badge>
            <Badge variant="outline">{createdOn}</Badge>
            <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sales + Customer */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Sales Order No (optional)</Label>
              <Input value={salesOrderNo} onChange={(e) => setSalesOrderNo(e.target.value)} placeholder="SO-2410-0012" />
            </div>

            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="ABC Electronics" />
            </div>

            <div className="space-y-1.5">
              <Label>Customer PO No</Label>
              <Input value={customerPoNo} onChange={(e) => setCustomerPoNo(e.target.value)} placeholder="PO-88421" />
            </div>

            <div className="space-y-1.5">
              <Label>Customer Type</Label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="Prototype">Prototype</option>
                <option value="Production">Production</option>
              </select>
              <p className="text-[11px] text-gray-500">Prototype typically has tighter turn-time and engineering focus.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Plant</Label>
              <div className="relative">
                <Factory className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {PLANTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Part details */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Part Number *</Label>
              <Input value={partNo} onChange={(e) => setPartNo(e.target.value)} placeholder="PCB-CTRL-12V" />
            </div>
            <div className="space-y-1.5">
              <Label>Revision</Label>
              <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="A" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Motor controller board"
              />
            </div>
          </div>

          {/* Qty + schedule */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Order Qty *</Label>
              <Input value={orderQty} onChange={(e) => setOrderQty(e.target.value)} placeholder="e.g., 100" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label>Panel Qty (optional)</Label>
              <Input value={panelQty} onChange={(e) => setPanelQty(e.target.value)} placeholder="e.g., 10" inputMode="numeric" />
              <p className="text-[11px] text-gray-500">If you already know panels, record it; else plan during panelization.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input value={targetDate} onChange={(e) => setTargetDate(e.target.value)} type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Turnaround, special handling..." />
            </div>
          </div>

          {/* PCB build specs */}
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-600" />
                PCB Build Specs
              </div>
              <Badge variant="outline" className="gap-2">
                <Settings2 className="h-3.5 w-3.5" />
                Class: <span className="font-semibold">{pcbClass}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1.5">
                <Label>Layers *</Label>
                <Input value={layers} onChange={(e) => setLayers(e.target.value)} placeholder="2" inputMode="numeric" />
              </div>

              <div className="space-y-1.5">
                <Label>Thickness (mm) *</Label>
                <select
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {THICKNESS_MM.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Copper Outer</Label>
                <select
                  value={copperOuter}
                  onChange={(e) => setCopperOuter(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {COPPER_OZ.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Copper Inner</Label>
                <select
                  value={copperInner}
                  onChange={(e) => setCopperInner(e.target.value)}
                  disabled={pcbClass !== "Multilayer"}
                  className={cx(
                    "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30",
                    pcbClass !== "Multilayer" && "opacity-60"
                  )}
                >
                  {COPPER_OZ.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {pcbClass !== "Multilayer" ? (
                  <p className="text-[11px] text-gray-500">Inner copper applies to multilayer builds.</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Surface Finish</Label>
                <select
                  value={surfaceFinish}
                  onChange={(e) => setSurfaceFinish(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {SURFACE_FINISH.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Solder Mask</Label>
                <select
                  value={solderMask}
                  onChange={(e) => setSolderMask(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {SOLDERMASK.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Silkscreen</Label>
                <select
                  value={silkscreen}
                  onChange={(e) => setSilkscreen(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {SILKSCREEN.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Impedance Controlled</Label>
                <div className="flex h-10 items-center gap-3 rounded-md border bg-white px-3">
                  <input
                    type="checkbox"
                    checked={impedanceControlled}
                    onChange={(e) => setImpedanceControlled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">Requires stackup + coupon plan</span>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-3 lg:col-span-6">
                <Label>WO Notes / Special Instructions</Label>
                <textarea
                  className="min-h-[88px] w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special handling, plating requirements, IPC class, microvias, controlled impedance notes..."
                />
              </div>
            </div>
          </div>

          {/* Dimensions / rules */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-600" />
                Board / Panel Dimensions (mm)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Board X</Label>
                  <Input value={boardSizeX} onChange={(e) => setBoardSizeX(e.target.value)} placeholder="e.g., 80" inputMode="numeric" />
                </div>
                <div className="space-y-1.5">
                  <Label>Board Y</Label>
                  <Input value={boardSizeY} onChange={(e) => setBoardSizeY(e.target.value)} placeholder="e.g., 60" inputMode="numeric" />
                </div>
                <div className="space-y-1.5">
                  <Label>Panel X</Label>
                  <Input value={panelSizeX} onChange={(e) => setPanelSizeX(e.target.value)} placeholder="e.g., 457" inputMode="numeric" />
                </div>
                <div className="space-y-1.5">
                  <Label>Panel Y</Label>
                  <Input value={panelSizeY} onChange={(e) => setPanelSizeY(e.target.value)} placeholder="e.g., 610" inputMode="numeric" />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">Panel size may be finalized during panelization.</p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-gray-600" />
                Capability / DFM Limits
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Min Track (mm)</Label>
                  <Input value={minTrack} onChange={(e) => setMinTrack(e.target.value)} placeholder="e.g., 0.10" inputMode="decimal" />
                </div>
                <div className="space-y-1.5">
                  <Label>Min Space (mm)</Label>
                  <Input value={minSpace} onChange={(e) => setMinSpace(e.target.value)} placeholder="e.g., 0.10" inputMode="decimal" />
                </div>
                <div className="space-y-1.5">
                  <Label>Min Hole (mm)</Label>
                  <Input value={minHole} onChange={(e) => setMinHole(e.target.value)} placeholder="e.g., 0.20" inputMode="decimal" />
                </div>
                <div className="space-y-1.5">
                  <Label>Finish Cu (oz)</Label>
                  <Input value={finishCu} onChange={(e) => setFinishCu(e.target.value)} placeholder="e.g., 1" inputMode="decimal" />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">These help engineering validate jobs early.</p>
            </div>
          </div>

          {/* Job pack uploads */}
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileUp className="h-4 w-4 text-gray-600" />
                Job Pack (Gerbers / Drill / Readme)
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50">
                <UploadCloud className="h-4 w-4 text-gray-600" />
                Add files
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={onPickFiles}
                  accept=".zip,.rar,.7z,.gbr,.zipx,.txt,.pdf,.drl,.xln,.csv,.png,.jpg,.jpeg"
                />
              </label>
            </div>

            {jobFiles.length ? (
              <div className="space-y-2">
                {jobFiles.map((f, idx) => (
                  <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">{f.name}</div>
                      <div className="text-[11px] text-gray-500">
                        {(f.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => removeFile(idx)}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                      Remove
                    </Button>
                  </div>
                ))}
                <p className="text-[11px] text-gray-500">
                  Backend upload can be done after WO save (recommended) to attach to WO record.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
                Drop your Gerber ZIP here (or click <b>Add files</b>). Attachments help CAM/DFM start faster.
              </div>
            )}
          </div>

          {/* Materials */}
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Materials / BOM (basic)</div>
              <Button variant="outline" className="gap-2" onClick={addMaterial}>
                <Plus className="h-4 w-4" />
                Add row
              </Button>
            </div>

            <div className="overflow-auto rounded-lg border">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Item</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Spec</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">UOM</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Qty</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 w-[84px]"> </th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">
                        <Input value={m.item} onChange={(e) => updateMaterial(m.id, "item", e.target.value)} placeholder="e.g., FR4 Core" />
                      </td>
                      <td className="px-3 py-2">
                        <Input value={m.spec} onChange={(e) => updateMaterial(m.id, "spec", e.target.value)} placeholder="e.g., Tg 150" />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={m.uom}
                          onChange={(e) => updateMaterial(m.id, "uom", e.target.value)}
                          className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Sheet">Sheet</option>
                          <option value="Kg">Kg</option>
                          <option value="Ltr">Ltr</option>
                          <option value="Set">Set</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Input value={m.qty} onChange={(e) => updateMaterial(m.id, "qty", e.target.value)} placeholder="e.g., 1" inputMode="decimal" />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => removeMaterial(m.id)}
                          disabled={materials.length === 1}
                          title={materials.length === 1 ? "Keep at least 1 row" : "Remove row"}
                        >
                          <Trash2 className={cx("h-4 w-4", materials.length === 1 ? "text-gray-400" : "text-rose-600")} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-[11px] text-gray-500">
              Keep this minimal at WO stage; detailed BOM can be finalized in Engineering/Procurement.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setConfirmReset(true)}>
              <Trash2 className="h-4 w-4" />
              Reset
            </Button>
            <Button
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              onClick={() => setConfirmSubmit(true)}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Work Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm reset */}
      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset Work Order form?"
        description="This will clear all entered fields and attachments."
        confirmText="Reset"
        confirmVariant="destructive"
        onConfirm={resetForm}
      />

      {/* Confirm submit */}
      <ConfirmationDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Create this Work Order?"
        description="This will create a new WO and make it available for CAM/DFM and production planning."
        confirmText="Create WO"
        confirmVariant="default"
        onConfirm={async () => {
          setConfirmSubmit(false);
          await submit();
        }}
      />
    </div>
  );
}
