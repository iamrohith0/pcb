// src/pages/warehouse/packing/LabelPrint.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Barcode,
  Building2,
  CheckCircle2,
  Copy,
  Factory,
  Hash,
  Package,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  Settings2,
  ShieldCheck,
  Truck,
  Wand2,
} from "lucide-react";

import api from "@/lib/axios";

/**
 * PCBxpress ERP — Warehouse → Packing → Label Print
 * File: src/pages/warehouse/packing/LabelPrint.jsx
 *
 * Supported label types:
 *  - RM (Raw Material)
 *  - WIP (Work In Progress)
 *  - FG (Finished Goods)
 *  - SHIP (Shipment/Package)
 *
 * Suggested endpoints (optional):
 *  - GET  /warehouse/labels/templates
 *  - POST /warehouse/labels/preview     { type, data, template_id }
 *  - POST /warehouse/labels/print       { printer_id, copies, payload, template_id }
 *  - POST /warehouse/labels/generate-id { type } -> { label_id }
 *
 * This page works even without backend by generating a local preview.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const LABEL_TYPES = [
  { value: "RM", label: "Raw Material (RM)", icon: Package },
  { value: "WIP", label: "WIP Tray / Lot", icon: Factory },
  { value: "FG", label: "Finished Goods (FG)", icon: CheckCircle2 },
  { value: "SHIP", label: "Shipment / Package", icon: Truck },
];

const DEFAULT_TEMPLATE = {
  id: "tpl-qr-2x2",
  name: "QR + Text (2x2 inch)",
  size: "2x2",
};

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <Label className="text-sm">{label}</Label>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function InfoChip({ icon: Icon, title, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 text-sm">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-xs text-gray-500">{title}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-gray-100" />;
}

function buildPayload(type, form) {
  // Normalized payload for printing/preview
  const base = {
    type,
    company: form.company || "PCBxpress",
    plant: form.plant || "Plant A",
    printed_at: new Date().toISOString(),
    label_id: form.labelId || "",
    qr: form.qrValue || form.labelId || "",
    text: {
      title: form.title || "",
      line1: form.line1 || "",
      line2: form.line2 || "",
      line3: form.line3 || "",
      line4: form.line4 || "",
    },
    meta: {
      part_no: form.partNo || "",
      lot_no: form.lotNo || "",
      batch_no: form.batchNo || "",
      job_no: form.jobNo || "",
      po_no: form.poNo || "",
      qty: form.qty || "",
      uom: form.uom || "",
      location: form.location || "",
      operator: form.operator || "",
      customer: form.customer || "",
      revision: form.revision || "",
    },
  };

  // Provide nice default title/lines by type if empty
  if (!base.text.title) {
    if (type === "RM") base.text.title = "RAW MATERIAL";
    if (type === "WIP") base.text.title = "WIP LOT";
    if (type === "FG") base.text.title = "FINISHED GOODS";
    if (type === "SHIP") base.text.title = "SHIPMENT";
  }

  return base;
}

function generateLabelId(prefix = "LBL") {
  // Example: LBL-20260106-7Q9K2
  const ymd = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${ymd}-${rnd}`;
}

function copyToClipboard(text, toast) {
  if (!text) return;
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast({ title: "Copied", description: "Value copied to clipboard." }))
    .catch(() => toast({ title: "Copy failed", description: "Unable to copy.", variant: "destructive" }));
}

function LabelPreview({ payload, template }) {
  const typeLabel =
    payload?.type === "RM"
      ? "RM"
      : payload?.type === "WIP"
      ? "WIP"
      : payload?.type === "FG"
      ? "FG"
      : payload?.type === "SHIP"
      ? "SHIP"
      : "—";

  return (
    <Card className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Label Preview</p>
          <p className="text-xs text-gray-500">
            Template: <span className="font-medium text-gray-700">{template?.name || "—"}</span>
          </p>
        </div>
        <Badge variant="outline" className="rounded-xl">
          {typeLabel}
        </Badge>
      </div>

      <Divider />

      {/* Print-only label area */}
      <div className="mt-4 flex justify-center">
        <div
          id="print-area"
          className={cx(
            "rounded-xl border bg-white p-3 text-[11px] leading-tight text-gray-900 shadow-sm",
            "w-[240px]"
          )}
          style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[12px] font-extrabold tracking-wide">{payload?.company || "PCBxpress"}</div>
              <div className="text-[10px] text-gray-600">{payload?.plant || "Plant"}</div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {/* Fake QR placeholder (backend/printer can replace with real QR) */}
              <div className="grid h-12 w-12 place-items-center rounded-md border bg-gray-50 text-gray-500">
                <QrCode className="h-6 w-6" />
              </div>
              <div className="text-[9px] text-gray-500">QR</div>
            </div>
          </div>

          <div className="mt-2 rounded-lg border bg-gray-50 px-2 py-1">
            <div className="text-[12px] font-bold">{payload?.text?.title || "LABEL"}</div>
            <div className="mt-0.5 text-[10px] text-gray-700">
              {payload?.text?.line1 || payload?.meta?.part_no || "—"}
            </div>
            <div className="text-[10px] text-gray-700">
              {payload?.text?.line2 || payload?.meta?.lot_no || payload?.meta?.batch_no || "—"}
            </div>
            <div className="text-[10px] text-gray-700">
              {payload?.text?.line3 || (payload?.meta?.qty ? `QTY: ${payload.meta.qty} ${payload.meta.uom || ""}` : "—")}
            </div>
            <div className="text-[10px] text-gray-700">{payload?.text?.line4 || payload?.meta?.location || "—"}</div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-gray-700">
            <div className="rounded-md border bg-white px-2 py-1">
              <div className="text-[9px] text-gray-500">Label ID</div>
              <div className="font-semibold">{payload?.label_id || "—"}</div>
            </div>
            <div className="rounded-md border bg-white px-2 py-1">
              <div className="text-[9px] text-gray-500">Job / PO</div>
              <div className="font-semibold">{payload?.meta?.job_no || payload?.meta?.po_no || "—"}</div>
            </div>
            <div className="rounded-md border bg-white px-2 py-1">
              <div className="text-[9px] text-gray-500">Revision</div>
              <div className="font-semibold">{payload?.meta?.revision || "—"}</div>
            </div>
            <div className="rounded-md border bg-white px-2 py-1">
              <div className="text-[9px] text-gray-500">Operator</div>
              <div className="font-semibold">{payload?.meta?.operator || "—"}</div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500">
            <span>{new Date(payload?.printed_at || Date.now()).toLocaleString()}</span>
            <span className="font-semibold">{payload?.type || ""}</span>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #print-area { 
            width: auto !important; 
            border: none !important; 
            box-shadow: none !important;
          }
        }
      `}</style>
    </Card>
  );
}

export default function LabelPrint() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [templates, setTemplates] = useState([DEFAULT_TEMPLATE]);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE.id);

  const [type, setType] = useState("RM");
  const [copies, setCopies] = useState(1);
  const [printerId, setPrinterId] = useState("DEFAULT");

  const [form, setForm] = useState({
    company: "PCBxpress",
    plant: "Plant A",
    labelId: "",
    qrValue: "",
    title: "",
    line1: "",
    line2: "",
    line3: "",
    line4: "",

    partNo: "",
    lotNo: "",
    batchNo: "",
    jobNo: "",
    poNo: "",
    qty: "",
    uom: "PCS",
    location: "",
    operator: "",
    customer: "",
    revision: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const template = useMemo(() => templates.find((t) => t.id === templateId) || templates[0], [templates, templateId]);
  const payload = useMemo(() => buildPayload(type, form), [type, form]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/warehouse/labels/templates");
      const list = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(list) && list.length) {
        setTemplates(list);
        setTemplateId(list[0].id);
      }
    } catch {
      // keep default template(s)
      setTemplates([DEFAULT_TEMPLATE]);
      setTemplateId(DEFAULT_TEMPLATE.id);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (key) => (e) => {
    const v = e?.target?.value ?? "";
    setForm((s) => ({ ...s, [key]: v }));
  };

  const genNewId = async () => {
    try {
      setLoading(true);
      // Try backend generator first
      const res = await api.post("/warehouse/labels/generate-id", { type });
      const id = res.data?.label_id || res.data?.id;
      if (id) {
        setForm((s) => ({ ...s, labelId: id, qrValue: s.qrValue || id }));
        toast({ title: "Label ID generated", description: id });
        return;
      }
      throw new Error("No id returned");
    } catch {
      const local = generateLabelId(type);
      setForm((s) => ({ ...s, labelId: local, qrValue: s.qrValue || local }));
      toast({ title: "Label ID generated", description: local });
    } finally {
      setLoading(false);
    }
  };

  const quickAutofill = () => {
    // Helpful demo fill for quick testing
    const id = form.labelId || generateLabelId(type);
    const demo = {
      RM: {
        title: "RAW MATERIAL",
        partNo: "FR4-CORE-1.6MM",
        lotNo: "LOT-2401-18A",
        qty: "25",
        uom: "SHEETS",
        location: "LOC-ST-Z1-A1-R1-B01",
        supplierOrCustomer: "Supplier: PCB Materials Co.",
      },
      WIP: {
        title: "WIP LOT",
        partNo: "JOB-10582 | PANEL",
        batchNo: "BATCH-WIP-0092",
        qty: "120",
        uom: "PANELS",
        location: "LOC-WIP-Z2-A2-R3-B08",
        supplierOrCustomer: "Process: AOI Queue",
      },
      FG: {
        title: "FINISHED GOODS",
        partNo: "PCB-CTRL-REV-C",
        lotNo: "FG-LOT-00031",
        qty: "500",
        uom: "PCS",
        location: "LOC-FG-Z5-A3-R2-B02",
        supplierOrCustomer: "Customer: Acme Electronics",
      },
      SHIP: {
        title: "SHIPMENT",
        partNo: "SHIP-CARTON-001",
        batchNo: "AWB: 1234 5678 9012",
        qty: "3",
        uom: "CARTONS",
        location: "LOC-DISP-Z7-A1-R1-B01",
        supplierOrCustomer: "Carrier: BlueDart",
      },
    };

    const d = demo[type] || demo.RM;
    setForm((s) => ({
      ...s,
      labelId: id,
      qrValue: s.qrValue || id,
      title: d.title,
      line1: d.partNo,
      line2: d.lotNo || d.batchNo,
      line3: `QTY: ${d.qty} ${d.uom}`,
      line4: d.location,
      partNo: d.partNo,
      lotNo: d.lotNo || "",
      batchNo: d.batchNo || "",
      qty: d.qty,
      uom: d.uom,
      location: d.location,
      operator: s.operator || "Operator 01",
      customer: type === "FG" ? "Acme Electronics" : s.customer,
      jobNo: type === "WIP" ? "JOB-10582" : s.jobNo,
      revision: s.revision || "C",
    }));

    toast({ title: "Autofilled", description: "Demo values added for quick testing." });
  };

  const validateBeforePrint = () => {
    if (!form.labelId) return "Label ID is required (Generate one).";
    if (!form.qrValue) return "QR value is required.";
    if (!copies || Number(copies) < 1) return "Copies must be at least 1.";
    return null;
  };

  const doPrint = async () => {
    const err = validateBeforePrint();
    if (err) {
      toast({ title: "Missing fields", description: err, variant: "destructive" });
      return;
    }

    // Attempt backend print. If fails, fallback to browser print.
    setLoading(true);
    try {
      await api.post("/warehouse/labels/print", {
        printer_id: printerId,
        copies: Number(copies),
        template_id: templateId,
        payload,
      });

      toast({ title: "Print queued", description: `Sent to printer: ${printerId} (${copies} copies)` });
    } catch (e) {
      console.warn("Backend print not available, using browser print:", e);
      toast({
        title: "Printing via browser",
        description: "Backend print endpoint not available. Using your browser print dialog.",
      });

      // Browser print fallback
      window.print();
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Label Print</h1>
            <p className="text-sm text-gray-600">
              Print QR/Barcode labels for RM, WIP, FG, and shipments for end-to-end traceability.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-xl gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Traceability Ready
              </Badge>
              <Badge variant="secondary" className="rounded-xl gap-1">
                <ScanLine className="h-3.5 w-3.5" />
                Scan-to-move / Scan-to-ship
              </Badge>
            </div>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={quickAutofill}>
            <Wand2 className="h-4 w-4" />
            Autofill demo
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(payload?.label_id, toast)} disabled={!form.labelId}>
            <Copy className="h-4 w-4" />
            Copy Label ID
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/warehouse/packing">Back to Packing</Link>
          </Button>
        </div>
      </div>

      {/* Top chips */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoChip icon={Barcode} title="Template" value={template?.name || "—"} />
        <InfoChip icon={QrCode} title="QR Data" value={form.qrValue ? "Set" : "Missing"} />
        <InfoChip icon={Package} title="Copies" value={String(copies)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <Card className="rounded-2xl border bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Label Settings</p>
              <p className="text-xs text-gray-500">Choose label type, template, printer and enter data.</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={fetchTemplates} disabled={loading}>
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Reload templates
            </Button>
          </div>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Label type" hint="RM / WIP / FG / SHIP">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {LABEL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Template" hint="Size & layout">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.size ? `(${t.size})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Printer" hint="Printer target id">
              <Input value={printerId} onChange={(e) => setPrinterId(e.target.value)} placeholder="DEFAULT / ZEBRA-1 / TSC-2" />
            </Field>

            <Field label="Copies" hint="Min 1">
              <Input
                type="number"
                min={1}
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value || 1))}
                placeholder="1"
              />
            </Field>
          </div>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company name">
              <Input value={form.company} onChange={onChange("company")} placeholder="PCBxpress" />
            </Field>
            <Field label="Plant">
              <Input value={form.plant} onChange={onChange("plant")} placeholder="Plant A" />
            </Field>

            <Field label="Label ID" hint="Generate for traceability">
              <div className="flex gap-2">
                <Input value={form.labelId} onChange={onChange("labelId")} placeholder="LBL-YYYYMMDD-XXXXX" />
                <Button variant="outline" className="gap-2" onClick={genNewId} disabled={loading}>
                  <Hash className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </Field>

            <Field label="QR value" hint="What scanner reads">
              <Input value={form.qrValue} onChange={onChange("qrValue")} placeholder="Use Label ID or custom QR payload" />
            </Field>
          </div>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title">
              <Input value={form.title} onChange={onChange("title")} placeholder="RAW MATERIAL / WIP LOT / FINISHED GOODS" />
            </Field>

            <Field label="Part No / Item">
              <Input value={form.partNo} onChange={onChange("partNo")} placeholder="FR4-CORE-1.6MM / PCB-CTRL-REV-C" />
            </Field>

            <Field label="Lot No">
              <Input value={form.lotNo} onChange={onChange("lotNo")} placeholder="LOT-2401-18A" />
            </Field>

            <Field label="Batch No (optional)">
              <Input value={form.batchNo} onChange={onChange("batchNo")} placeholder="BATCH-..." />
            </Field>

            <Field label="Job No (optional)">
              <Input value={form.jobNo} onChange={onChange("jobNo")} placeholder="JOB-10582" />
            </Field>

            <Field label="PO No (optional)">
              <Input value={form.poNo} onChange={onChange("poNo")} placeholder="PO-..." />
            </Field>

            <Field label="Quantity">
              <Input value={form.qty} onChange={onChange("qty")} placeholder="500" />
            </Field>

            <Field label="UOM">
              <Input value={form.uom} onChange={onChange("uom")} placeholder="PCS / PANELS / SHEETS" />
            </Field>

            <Field label="Location (bin)">
              <Input value={form.location} onChange={onChange("location")} placeholder="LOC-ST-Z1-A1-R1-B01" />
            </Field>

            <Field label="Operator">
              <Input value={form.operator} onChange={onChange("operator")} placeholder="Operator 01" />
            </Field>

            <Field label="Customer (FG/SHIP)">
              <Input value={form.customer} onChange={onChange("customer")} placeholder="Customer name" />
            </Field>

            <Field label="Revision">
              <Input value={form.revision} onChange={onChange("revision")} placeholder="A / B / C" />
            </Field>
          </div>

          <Divider />

          {/* Custom label lines (optional) */}
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Settings2 className="h-4 w-4 text-gray-400" />
              Custom Lines (optional)
            </div>
            <p className="mt-1 text-xs text-gray-500">
              These will appear prominently inside the label box.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Line 1">
                <Input value={form.line1} onChange={onChange("line1")} placeholder="Part No / Job / Item" />
              </Field>
              <Field label="Line 2">
                <Input value={form.line2} onChange={onChange("line2")} placeholder="Lot / Batch / AWB" />
              </Field>
              <Field label="Line 3">
                <Input value={form.line3} onChange={onChange("line3")} placeholder="QTY: 500 PCS" />
              </Field>
              <Field label="Line 4">
                <Input value={form.line4} onChange={onChange("line4")} placeholder="Location / Notes" />
              </Field>
            </div>
          </div>

          <div className="no-print mt-5 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (!form.labelId) {
                  toast({ title: "Generate Label ID", description: "Click Generate to create a label id first." });
                  return;
                }
                copyToClipboard(JSON.stringify(payload, null, 2), toast);
              }}
            >
              <Copy className="h-4 w-4" />
              Copy payload JSON
            </Button>

            <Button
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </Card>

        {/* Right: Preview */}
        <LabelPreview payload={payload} template={template} />
      </div>

      {/* Confirm print */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Print label?</AlertDialogTitle>
            <AlertDialogDescription>
              This will print <span className="font-semibold">{copies}</span> copy/copies to printer{" "}
              <span className="font-semibold">{printerId}</span> using template{" "}
              <span className="font-semibold">{template?.name}</span>.
              {!form.labelId ? (
                <div className="mt-2 rounded-xl border bg-[#dc2551]/5 p-3 text-sm text-[#b02045]">
                  Label ID is missing. Please generate a label id before printing.
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doPrint}>Print</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
