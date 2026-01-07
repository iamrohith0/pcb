// src/pages/production/wip/WIPMove.jsx
import { format } from "date-fns";
import {
    ArrowRight,
    Barcode,
    CheckCircle2,
    ClipboardList,
    Factory,
    Info,
    Loader2,
    PackageCheck,
    PlayCircle,
    RefreshCw,
    ScanLine,
    ShieldAlert,
    Wrench,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

/**
 * WIPMove.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Purpose:
 * - Move WIP between PCB operations (IN / OUT / HOLD / REWORK / SCRAP / PASS / FAIL)
 * - Support barcode entry (Batch/Lot/Serial), confirm qty, machine, operator, remarks
 * - Shows a "next operation" suggestion and validates flow rules (basic front-end checks)
 *
 * Later backend endpoints (suggested):
 * - POST /production/wip/move
 *      body: { barcode, wo, batch, lot, serial, plant, line, operation, status, qty, machine, operator, remarks, ts }
 * - GET  /production/wip/lookup?barcode=...
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PLANTS = ["Plant 1", "Plant 2"];
const LINES = ["Imaging", "Etching", "Drilling", "Plating", "Solder Mask", "AOI", "E-Test", "Routing"];
const OPERATIONS = [
  "CAM",
  "DFM",
  "Panelization",
  "Imaging",
  "Etching",
  "Drilling",
  "Plating",
  "Solder Mask",
  "Silkscreen",
  "AOI",
  "E-Test",
  "Routing",
  "Final Inspection",
  "Packing",
  "Dispatch",
];
const STATUS = ["IN", "OUT", "HOLD", "REWORK", "SCRAP", "PASS", "FAIL"];

const FLOW = [
  "CAM",
  "DFM",
  "Panelization",
  "Imaging",
  "Etching",
  "Drilling",
  "Plating",
  "Solder Mask",
  "Silkscreen",
  "AOI",
  "E-Test",
  "Routing",
  "Final Inspection",
  "Packing",
  "Dispatch",
];

function getNextOperation(current) {
  const idx = FLOW.indexOf(current);
  if (idx === -1) return "";
  return FLOW[idx + 1] || "";
}

function statusBadgeClass(status) {
  switch (status) {
    case "PASS":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "FAIL":
    case "SCRAP":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "HOLD":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "REWORK":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

async function mockLookup(barcode) {
  // Demo lookup. Replace with API call.
  await new Promise((r) => setTimeout(r, 250));
  if (!barcode) return null;

  // Simple deterministic mock
  if (barcode.toUpperCase().includes("WO")) {
    return {
      wo: barcode.toUpperCase(),
      batch: "BATCH-2401-A",
      lot: "LOT-ETCH-12",
      serial: "",
      currentOperation: "Etching",
      currentStatus: "IN",
      qtyAvailable: 18,
      plant: "Plant 1",
      line: "Etching",
    };
  }

  return {
    wo: "WO-2410",
    batch: "BATCH-2410-B",
    lot: barcode.toUpperCase().startsWith("LOT") ? barcode.toUpperCase() : "LOT-AOI-04",
    serial: barcode.toUpperCase().startsWith("SR") ? barcode.toUpperCase() : "",
    currentOperation: "AOI",
    currentStatus: "PASS",
    qtyAvailable: 10,
    plant: "Plant 2",
    line: "AOI",
  };
}

async function mockSubmitMove(payload) {
  // Demo submit. Replace with POST API call.
  await new Promise((r) => setTimeout(r, 450));
  // Simulate occasional validation
  if (!payload?.barcode || !payload?.operation || !payload?.status) {
    const err = new Error("Validation failed");
    err.code = "VALIDATION";
    throw err;
  }
  return { ok: true, id: `MOVE-${Math.floor(Math.random() * 90000 + 10000)}` };
}

export default function WIPMove() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Scan / lookup
  const [barcode, setBarcode] = useState("");
  const [lookup, setLookup] = useState(null);

  // Move form
  const [plant, setPlant] = useState("Plant 1");
  const [line, setLine] = useState("");
  const [operation, setOperation] = useState("");
  const [status, setStatus] = useState("IN");
  const [qty, setQty] = useState("");
  const [machine, setMachine] = useState("");
  const [operator, setOperator] = useState("");
  const [remarks, setRemarks] = useState("");

  const [lastMoveId, setLastMoveId] = useState("");

  const nowStr = useMemo(() => format(new Date(), "dd MMM yyyy, HH:mm"), []);

  const nextOp = useMemo(() => getNextOperation(operation), [operation]);

  useEffect(() => {
    // default line follows operation if line empty
    if (!line && operation) {
      const canLine = LINES.includes(operation) ? operation : "";
      if (canLine) setLine(canLine);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation]);

  async function runLookup() {
    if (!barcode.trim()) {
      toast({ title: "Enter barcode", description: "Scan or type Batch / Lot / Serial / Work Order code." });
      return;
    }
    setLookupLoading(true);
    setLastMoveId("");
    try {
      const res = await mockLookup(barcode.trim());
      setLookup(res);

      // Prefill form from lookup
      if (res?.plant) setPlant(res.plant);
      if (res?.line) setLine(res.line);
      if (res?.currentOperation) setOperation(res.currentOperation);
      if (res?.qtyAvailable != null) setQty(String(res.qtyAvailable));

      toast({ title: "Loaded WIP", description: `WO ${res?.wo || "-"} • Current: ${res?.currentOperation || "-"}` });
    } catch (e) {
      toast({ title: "Lookup failed", description: "Could not fetch WIP details.", variant: "destructive" });
      setLookup(null);
    } finally {
      setLookupLoading(false);
    }
  }

  function resetAll() {
    setBarcode("");
    setLookup(null);
    setPlant("Plant 1");
    setLine("");
    setOperation("");
    setStatus("IN");
    setQty("");
    setMachine("");
    setOperator("");
    setRemarks("");
    setLastMoveId("");
  }

  function validate() {
    const problems = [];
    const qtyNum = Number(qty);

    if (!barcode.trim()) problems.push("Barcode is required.");
    if (!plant) problems.push("Plant is required.");
    if (!operation) problems.push("Operation is required.");
    if (!status) problems.push("Status is required.");
    if (!qty || Number.isNaN(qtyNum) || qtyNum <= 0) problems.push("Quantity must be a positive number.");

    // Basic flow sanity
    if (status === "OUT" && nextOp) {
      // ok
    }
    if (status === "PASS" && ["AOI", "E-Test", "Final Inspection"].includes(operation) === false) {
      problems.push("PASS is usually recorded at AOI / E-Test / Final Inspection.");
    }
    if (status === "FAIL" && ["AOI", "E-Test", "Final Inspection"].includes(operation) === false) {
      problems.push("FAIL is usually recorded at AOI / E-Test / Final Inspection.");
    }

    // If lookup exists, prevent qty exceeding available (basic)
    if (lookup?.qtyAvailable != null && qtyNum > Number(lookup.qtyAvailable)) {
      problems.push(`Qty cannot exceed available (${lookup.qtyAvailable}).`);
    }

    return problems;
  }

  async function submitMove() {
    const errors = validate();
    if (errors.length) {
      toast({
        title: "Fix errors",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setLastMoveId("");

    try {
      const payload = {
        barcode: barcode.trim(),
        wo: lookup?.wo || "",
        batch: lookup?.batch || "",
        lot: lookup?.lot || "",
        serial: lookup?.serial || "",
        plant,
        line,
        operation,
        status,
        qty: Number(qty),
        machine: machine.trim(),
        operator: operator.trim(),
        remarks: remarks.trim(),
        ts: new Date().toISOString(),
      };

      const res = await mockSubmitMove(payload);
      setLastMoveId(res?.id || "");

      toast({
        title: "WIP moved",
        description: res?.id ? `Move ID: ${res.id}` : "Movement saved.",
      });

      // Helpful: if OUT, auto-suggest next operation for quick next scan
      if (status === "OUT" && nextOp) {
        setOperation(nextOp);
        setStatus("IN");
        setLine(LINES.includes(nextOp) ? nextOp : "");
      }
      setRemarks("");
      setMachine("");
      setOperator("");
    } catch (e) {
      toast({
        title: "Move failed",
        description: "Could not save WIP move. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-[#dc2551]" />
              WIP Move
            </CardTitle>
            <CardDescription>
              Scan a Batch/Lot/Serial and record movement between PCB operations (IN/OUT/HOLD/REWORK/PASS/FAIL/SCRAP).
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Info className="h-3.5 w-3.5" />
              {nowStr}
            </Badge>

            <Button variant="outline" className="gap-2" onClick={resetAll}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Scan / Lookup */}
          <div className="rounded-xl border bg-white p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-gray-500" />
                  Barcode / Code
                </Label>
                <div className="relative">
                  <Barcode className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="pl-9"
                    placeholder="Scan: BATCH-XXXX, LOT-XXXX, SR-XXXX, or WO-XXXX"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runLookup();
                      }
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Tip: Barcode can map to Work Order, Panel Batch, Lot, or Serial (unit) based on your labeling system.
                </p>
              </div>

              <Button
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                onClick={runLookup}
                disabled={lookupLoading}
              >
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                Lookup
              </Button>
            </div>

            {lookup ? (
              <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border bg-gray-50 p-3 md:grid-cols-4">
                <div>
                  <div className="text-[11px] text-gray-500">WO</div>
                  <div className="text-sm font-semibold text-gray-900">{lookup.wo || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Batch</div>
                  <div className="text-sm font-semibold text-gray-900">{lookup.batch || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Lot</div>
                  <div className="text-sm font-semibold text-gray-900">{lookup.lot || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Available Qty</div>
                  <div className="text-sm font-semibold text-gray-900">{lookup.qtyAvailable ?? "-"}</div>
                </div>

                <div className="md:col-span-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-2">
                    <Factory className="h-3.5 w-3.5" />
                    {lookup.plant || "-"}
                  </Badge>
                  <Badge variant="outline" className="gap-2">
                    <Wrench className="h-3.5 w-3.5" />
                    {lookup.line || "-"}
                  </Badge>
                  <Badge className={cx("border", statusBadgeClass(lookup.currentStatus))}>
                    {lookup.currentStatus || "-"}
                  </Badge>
                  <Badge variant="outline" className="gap-2">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Current: {lookup.currentOperation || "-"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-[12px] text-gray-600">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-semibold text-gray-800">No WIP loaded</div>
                    <div className="text-gray-600">
                      Scan a code and click <span className="font-medium">Lookup</span> to prefill WO/Batch/Lot and the
                      current operation.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Move Form */}
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Movement Details</div>
              {nextOp ? (
                <Badge variant="outline" className="gap-2">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Next suggested: <span className="font-semibold">{nextOp}</span>
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-1.5">
                <Label>Plant</Label>
                <select
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                >
                  {PLANTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Line</Label>
                <select
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                >
                  <option value="">Select</option>
                  {LINES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Operation</Label>
                <select
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                >
                  <option value="">Select</option>
                  {OPERATIONS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-gray-500">
                  Use <span className="font-medium">IN/OUT</span> for movement,{" "}
                  <span className="font-medium">HOLD/REWORK</span> for exceptions,{" "}
                  <span className="font-medium">PASS/FAIL</span> for inspection/test.
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g., 18"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Machine</Label>
                <Input value={machine} onChange={(e) => setMachine(e.target.value)} placeholder="e.g., AOI-01" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Operator</Label>
                <Input value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="e.g., Imran" />
              </div>

              <div className="space-y-1.5 lg:col-span-6">
                <Label>Remarks</Label>
                <textarea
                  className="min-h-[90px] w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any notes: chemistry adjustments, defect type, rework reason, hold reason, etc."
                />
              </div>
            </div>

            {lastMoveId ? (
              <div className="mt-3 rounded-xl border bg-emerald-50 p-3 text-sm text-emerald-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-semibold">Move saved</div>
                    <div className="text-emerald-700">Move ID: {lastMoveId}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <PackageCheck className="h-4 w-4" />
                  Record movement event for full PCB traceability.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={resetAll} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Clear
                </Button>

                <Button
                  onClick={submitMove}
                  disabled={loading}
                  className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save Move
                </Button>
              </div>
            </div>
          </div>

          {/* Quick guide */}
          <div className="rounded-xl border bg-gray-50 p-3 text-[12px] text-gray-600">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 text-gray-500" />
              <div>
                <div className="font-semibold text-gray-800">Common usage</div>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>
                    When a batch reaches a process: set <b>Status = IN</b>, Operation = that process.
                  </li>
                  <li>
                    When leaving a process: set <b>Status = OUT</b> (system can suggest next operation).
                  </li>
                  <li>
                    If defect found: use <b>HOLD</b> with remarks; if fix needed use <b>REWORK</b>.
                  </li>
                  <li>
                    For AOI / E-Test: record <b>PASS</b> or <b>FAIL</b> with defect notes.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
