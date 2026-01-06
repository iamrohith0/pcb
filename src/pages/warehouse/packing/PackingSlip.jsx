// src/pages/warehouse/packing/PackingSlip.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
  Box,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Hash,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  Wand2,
} from "lucide-react";

import api from "@/lib/axios";

/**
 * PCBxpress ERP — Warehouse → Packing → Packing Slip
 * File: src/pages/warehouse/packing/PackingSlip.jsx
 *
 * Purpose:
 *  - Create/Preview/Print a packing slip for a shipment/carton.
 *  - Intended to link with Dispatch/Shipments modules.
 *
 * Suggested endpoints (optional):
 *  - GET  /warehouse/packing-slips/:id
 *  - POST /warehouse/packing-slips/preview   { ...payload }
 *  - POST /warehouse/packing-slips/print     { ...payload, printer_id }
 *  - POST /warehouse/packing-slips/export-pdf { ...payload } -> PDF
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Divider() {
  return <div className="h-px w-full bg-gray-100" />;
}

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

function money(v) {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function generateSlipNo() {
  // Example: PS-20260106-7Q9K2
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PS-${ymd}-${rnd}`;
}

function copyToClipboard(text, toast) {
  if (!text) return;
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast({ title: "Copied", description: "Copied to clipboard." }))
    .catch(() => toast({ title: "Copy failed", description: "Unable to copy.", variant: "destructive" }));
}

function parseQuery(search) {
  const params = new URLSearchParams(search || "");
  const shipmentId = params.get("shipmentId") || "";
  const orderNo = params.get("orderNo") || "";
  return { shipmentId, orderNo };
}

function buildPayload(form, items) {
  const subtotal = items.reduce((acc, it) => acc + Number(it.amount || 0), 0);
  const totalQty = items.reduce((acc, it) => acc + Number(it.qty || 0), 0);

  return {
    slip_no: form.slipNo,
    company: form.company,
    plant: form.plant,
    address: form.companyAddress,
    gstin: form.gstin,
    phone: form.phone,
    email: form.email,

    shipment_id: form.shipmentId,
    awb: form.awb,
    carrier: form.carrier,
    dispatch_date: form.dispatchDate,
    mode: form.mode,

    customer: {
      name: form.customerName,
      address: form.customerAddress,
      gstin: form.customerGstin,
      phone: form.customerPhone,
      email: form.customerEmail,
    },

    order: {
      order_no: form.orderNo,
      po_no: form.poNo,
      invoice_no: form.invoiceNo,
      job_no: form.jobNo,
      currency: form.currency,
      notes: form.notes,
    },

    packaging: {
      carton_no: form.cartonNo,
      cartons: form.cartons,
      gross_wt: form.grossWt,
      net_wt: form.netWt,
      dims: form.dims,
      seal_no: form.sealNo,
    },

    items,
    totals: {
      qty: totalQty,
      subtotal: subtotal,
    },

    printed_at: new Date().toISOString(),
  };
}

function PackingSlipPreview({ payload }) {
  const items = payload?.items || [];
  return (
    <Card className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">Packing Slip Preview</p>
          <p className="text-xs text-gray-500">
            Slip No: <span className="font-medium text-gray-700">{payload?.slip_no || "—"}</span>
          </p>
        </div>
        <Badge variant="outline" className="rounded-xl gap-1">
          <FileText className="h-3.5 w-3.5" />
          Packing Slip
        </Badge>
      </div>

      <Divider />

      <div className="mt-4 flex justify-center">
        <div
          id="print-area"
          className="w-full max-w-[820px] rounded-xl border bg-white p-6 text-[12px] leading-relaxed text-gray-900 shadow-sm"
          style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="text-[16px] font-extrabold tracking-wide">{payload?.company || "PCBxpress"}</div>
              <div className="mt-1 text-[11px] text-gray-600 whitespace-pre-line">{payload?.address || ""}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-700">
                {payload?.gstin ? <span>GSTIN: {payload.gstin}</span> : null}
                {payload?.phone ? <span>• {payload.phone}</span> : null}
                {payload?.email ? <span>• {payload.email}</span> : null}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[18px] font-extrabold tracking-wide">PACKING SLIP</div>
              <div className="mt-2 grid gap-1 text-[11px]">
                <div>
                  <span className="text-gray-500">Slip No:</span>{" "}
                  <span className="font-semibold">{payload?.slip_no || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Dispatch Date:</span>{" "}
                  <span className="font-semibold">{payload?.dispatch_date || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Shipment ID:</span>{" "}
                  <span className="font-semibold">{payload?.shipment_id || "—"}</span>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-gray-50 px-3 py-2 text-[11px] text-gray-700">
                <ShieldCheck className="h-4 w-4 text-gray-500" />
                Scan & Trace Ready
              </div>
            </div>
          </div>

          <Divider />

          {/* Addresses */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] font-semibold text-gray-700">Ship To</div>
              <div className="mt-1 text-[12px] font-bold">{payload?.customer?.name || "—"}</div>
              <div className="mt-1 text-[11px] text-gray-700 whitespace-pre-line">{payload?.customer?.address || ""}</div>
              <div className="mt-2 grid gap-1 text-[11px] text-gray-700">
                {payload?.customer?.gstin ? <div>GSTIN: {payload.customer.gstin}</div> : null}
                {payload?.customer?.phone ? <div>Phone: {payload.customer.phone}</div> : null}
                {payload?.customer?.email ? <div>Email: {payload.customer.email}</div> : null}
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] font-semibold text-gray-700">Shipment</div>
              <div className="mt-2 grid gap-1 text-[11px] text-gray-700">
                <div>
                  <span className="text-gray-500">Carrier:</span>{" "}
                  <span className="font-semibold">{payload?.carrier || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">AWB:</span>{" "}
                  <span className="font-semibold">{payload?.awb || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Mode:</span>{" "}
                  <span className="font-semibold">{payload?.mode || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Order No:</span>{" "}
                  <span className="font-semibold">{payload?.order?.order_no || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">PO No:</span>{" "}
                  <span className="font-semibold">{payload?.order?.po_no || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Invoice No:</span>{" "}
                  <span className="font-semibold">{payload?.order?.invoice_no || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Packaging */}
          <div className="mt-4 rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-gray-700">Packaging</div>
              <div className="text-[11px] text-gray-600">
                Carton: <span className="font-semibold">{payload?.packaging?.carton_no || "—"}</span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-6 text-[11px] text-gray-700">
              <div className="rounded-lg border bg-gray-50 p-2">
                <div className="text-[10px] text-gray-500">Cartons</div>
                <div className="font-semibold">{payload?.packaging?.cartons || "—"}</div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-2">
                <div className="text-[10px] text-gray-500">Gross Wt</div>
                <div className="font-semibold">{payload?.packaging?.gross_wt || "—"}</div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-2">
                <div className="text-[10px] text-gray-500">Net Wt</div>
                <div className="font-semibold">{payload?.packaging?.net_wt || "—"}</div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-2 md:col-span-2">
                <div className="text-[10px] text-gray-500">Dimensions</div>
                <div className="font-semibold">{payload?.packaging?.dims || "—"}</div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-2">
                <div className="text-[10px] text-gray-500">Seal No</div>
                <div className="font-semibold">{payload?.packaging?.seal_no || "—"}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[12px] font-bold">Items</div>
              <div className="text-[11px] text-gray-600">
                Total Qty: <span className="font-semibold">{payload?.totals?.qty ?? 0}</span>
              </div>
            </div>

            <div className="mt-2 overflow-hidden rounded-xl border">
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">#</th>
                    <th className="px-3 py-2 text-left font-semibold">Item / Part</th>
                    <th className="px-3 py-2 text-left font-semibold">Description</th>
                    <th className="px-3 py-2 text-left font-semibold">Lot/Batch</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-left font-semibold">UOM</th>
                    <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 font-semibold">{it.part_no || "—"}</td>
                        <td className="px-3 py-2">{it.description || ""}</td>
                        <td className="px-3 py-2">{it.lot_or_batch || ""}</td>
                        <td className="px-3 py-2 text-right font-semibold">{it.qty || ""}</td>
                        <td className="px-3 py-2">{it.uom || ""}</td>
                        <td className="px-3 py-2">{it.remarks || ""}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t">
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                        No items added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes + sign */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] font-semibold text-gray-700">Notes</div>
              <div className="mt-1 whitespace-pre-line text-[11px] text-gray-700">{payload?.order?.notes || "—"}</div>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="text-[11px] font-semibold text-gray-700">Authorized Signature</div>
              <div className="mt-10 text-[11px] text-gray-700">Name: ____________________________</div>
              <div className="mt-2 text-[11px] text-gray-700">Date: _____________________________</div>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-gray-500">
            Printed at: {new Date(payload?.printed_at || Date.now()).toLocaleString()}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </Card>
  );
}

export default function PackingSlip() {
  const { toast } = useToast();
  const location = useLocation();

  const { shipmentId: shipmentIdFromQuery, orderNo: orderNoFromQuery } = useMemo(
    () => parseQuery(location.search),
    [location.search]
  );

  const [loading, setLoading] = useState(false);
  const [confirmPrint, setConfirmPrint] = useState(false);

  const [searchId, setSearchId] = useState(shipmentIdFromQuery || "");
  const [form, setForm] = useState({
    slipNo: "",
    company: "PCBxpress",
    plant: "Plant A",
    companyAddress: "PCBxpress Manufacturing Unit\nIndustrial Area, India",
    gstin: "",
    phone: "",
    email: "",

    shipmentId: shipmentIdFromQuery || "",
    awb: "",
    carrier: "",
    dispatchDate: "",
    mode: "Air",

    customerName: "",
    customerAddress: "",
    customerGstin: "",
    customerPhone: "",
    customerEmail: "",

    orderNo: orderNoFromQuery || "",
    poNo: "",
    invoiceNo: "",
    jobNo: "",
    currency: "INR",
    notes: "Handle with care. Keep away from moisture.\nESD safe packing as per standard.",

    cartonNo: "",
    cartons: "1",
    grossWt: "",
    netWt: "",
    dims: "",
    sealNo: "",
  });

  const [items, setItems] = useState([
    {
      part_no: "PCB-CTRL-REV-C",
      description: "Controller PCB, 4L, ENIG, 1.6mm",
      lot_or_batch: "FG-LOT-00031",
      qty: "500",
      uom: "PCS",
      remarks: "ESD bag + bubble wrap",
      amount: "0",
    },
  ]);

  const payload = useMemo(() => buildPayload(form, items), [form, items]);

  const onChange = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const genSlip = () => {
    const slipNo = form.slipNo || generateSlipNo();
    setForm((s) => ({ ...s, slipNo }));
    toast({ title: "Slip number ready", description: slipNo });
  };

  const addItem = () => {
    setItems((s) => [
      ...s,
      { part_no: "", description: "", lot_or_batch: "", qty: "", uom: "PCS", remarks: "", amount: "0" },
    ]);
  };

  const updateItem = (idx, key, val) => {
    setItems((s) => s.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  };

  const removeItem = (idx) => {
    setItems((s) => s.filter((_, i) => i !== idx));
  };

  const quickAutofill = () => {
    const slipNo = form.slipNo || generateSlipNo();
    setForm((s) => ({
      ...s,
      slipNo,
      shipmentId: s.shipmentId || "SHIP-10582",
      awb: s.awb || "1234 5678 9012",
      carrier: s.carrier || "BlueDart",
      dispatchDate: s.dispatchDate || new Date().toISOString().slice(0, 10),
      mode: s.mode || "Air",
      customerName: s.customerName || "Acme Electronics",
      customerAddress: s.customerAddress || "Acme Electronics Pvt Ltd\nCity, State, India\nPIN: 000000",
      orderNo: s.orderNo || "SO-450019",
      poNo: s.poNo || "PO-ACME-7781",
      invoiceNo: s.invoiceNo || "INV-00988",
      jobNo: s.jobNo || "JOB-10582",
      cartonNo: s.cartonNo || "CTN-001",
      cartons: s.cartons || "3",
      grossWt: s.grossWt || "12.5 kg",
      netWt: s.netWt || "10.8 kg",
      dims: s.dims || "45 x 35 x 30 cm",
      sealNo: s.sealNo || "SEAL-8932",
    }));
    setItems([
      {
        part_no: "PCB-CTRL-REV-C",
        description: "Controller PCB, 4L, ENIG, 1.6mm",
        lot_or_batch: "FG-LOT-00031",
        qty: "500",
        uom: "PCS",
        remarks: "ESD safe packing",
        amount: "0",
      },
      {
        part_no: "PCB-SNS-REV-A",
        description: "Sensor PCB, 2L, HASL, 1.0mm",
        lot_or_batch: "FG-LOT-00044",
        qty: "250",
        uom: "PCS",
        remarks: "Moisture barrier bag",
        amount: "0",
      },
    ]);

    toast({ title: "Autofilled", description: "Demo data added." });
  };

  const loadFromShipment = async () => {
    if (!searchId) {
      toast({ title: "Enter shipment ID", description: "Please enter a Shipment ID to load.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/warehouse/packing-slips/${encodeURIComponent(searchId)}`);
      const data = res.data?.data || res.data;

      // Best-effort mapping
      setForm((s) => ({
        ...s,
        slipNo: data?.slip_no || s.slipNo,
        shipmentId: data?.shipment_id || searchId,
        awb: data?.awb || "",
        carrier: data?.carrier || "",
        dispatchDate: data?.dispatch_date || "",
        mode: data?.mode || "Air",
        customerName: data?.customer?.name || "",
        customerAddress: data?.customer?.address || "",
        customerGstin: data?.customer?.gstin || "",
        customerPhone: data?.customer?.phone || "",
        customerEmail: data?.customer?.email || "",
        orderNo: data?.order?.order_no || "",
        poNo: data?.order?.po_no || "",
        invoiceNo: data?.order?.invoice_no || "",
        jobNo: data?.order?.job_no || "",
        notes: data?.order?.notes || s.notes,
        cartonNo: data?.packaging?.carton_no || "",
        cartons: data?.packaging?.cartons || "1",
        grossWt: data?.packaging?.gross_wt || "",
        netWt: data?.packaging?.net_wt || "",
        dims: data?.packaging?.dims || "",
        sealNo: data?.packaging?.seal_no || "",
      }));

      if (Array.isArray(data?.items)) setItems(data.items);

      toast({ title: "Loaded", description: `Shipment ${searchId} loaded.` });
    } catch (e) {
      console.warn("Load shipment failed:", e);
      toast({
        title: "Load failed",
        description: "Backend endpoint not available or shipment not found. Use manual entry / demo autofill.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!form.slipNo) return "Packing Slip No is required (Generate one).";
    if (!form.shipmentId) return "Shipment ID is required.";
    if (!form.customerName) return "Customer name is required.";
    if (!items.length) return "Add at least one item.";
    const bad = items.find((it) => !it.part_no || !it.qty);
    if (bad) return "Each item must have Part No and Qty.";
    return null;
  };

  const doPrint = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Missing fields", description: err, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await api.post("/warehouse/packing-slips/print", payload);
      toast({ title: "Print queued", description: "Packing slip sent to print queue." });
    } catch (e) {
      console.warn("Print endpoint not available, using browser print:", e);
      toast({ title: "Printing via browser", description: "Using your browser print dialog." });
      window.print();
    } finally {
      setLoading(false);
      setConfirmPrint(false);
    }
  };

  const exportPdf = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Missing fields", description: err, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/warehouse/packing-slips/export-pdf", payload, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.slipNo || "packing-slip"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Packing slip PDF downloaded." });
    } catch (e) {
      console.warn("Export PDF failed:", e);
      toast({
        title: "Export not available",
        description: "Backend PDF endpoint not available. You can still print from browser.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate slip on first load if empty
  useEffect(() => {
    if (!form.slipNo) {
      setForm((s) => ({ ...s, slipNo: generateSlipNo() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Packing Slip</h1>
            <p className="text-sm text-gray-600">
              Create a shipment packing slip for PCB cartons with customer, items, and packaging details.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-xl gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Audit Friendly
              </Badge>
              <Badge variant="secondary" className="rounded-xl gap-1">
                <Package className="h-3.5 w-3.5" />
                Carton-wise listing
              </Badge>
            </div>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={quickAutofill}>
            <Wand2 className="h-4 w-4" />
            Autofill demo
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => copyToClipboard(JSON.stringify(payload, null, 2), toast)}
          >
            <Copy className="h-4 w-4" />
            Copy JSON
          </Button>

          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" asChild>
            <Link to="/warehouse/packing">Back to Packing</Link>
          </Button>
        </div>
      </div>

      {/* Load shipment */}
      <Card className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <Field label="Load by Shipment ID" hint="Optional (if backend exists)">
              <div className="flex gap-2">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="SHIP-10582"
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" className="gap-2" onClick={loadFromShipment} disabled={loading}>
                  <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
                  Load
                </Button>
              </div>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={genSlip}>
              <Hash className="h-4 w-4" />
              Generate Slip No
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportPdf} disabled={loading}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={() => setConfirmPrint(true)} disabled={loading}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left editor */}
        <Card className="rounded-2xl border bg-white p-4">
          <p className="text-sm font-semibold text-gray-900">Slip Details</p>
          <p className="text-xs text-gray-500">Fill shipment, customer, order and packaging fields.</p>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Slip No">
              <Input value={form.slipNo} onChange={onChange("slipNo")} />
            </Field>
            <Field label="Dispatch Date">
              <Input type="date" value={form.dispatchDate} onChange={onChange("dispatchDate")} />
            </Field>

            <Field label="Shipment ID">
              <Input value={form.shipmentId} onChange={onChange("shipmentId")} placeholder="SHIP-10582" />
            </Field>

            <Field label="Carrier / AWB">
              <div className="grid grid-cols-2 gap-2">
                <Input value={form.carrier} onChange={onChange("carrier")} placeholder="BlueDart" />
                <Input value={form.awb} onChange={onChange("awb")} placeholder="1234 5678 9012" />
              </div>
            </Field>

            <Field label="Mode">
              <Input value={form.mode} onChange={onChange("mode")} placeholder="Air / Road / Sea" />
            </Field>

            <Field label="Plant">
              <Input value={form.plant} onChange={onChange("plant")} />
            </Field>
          </div>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Customer Name">
              <Input value={form.customerName} onChange={onChange("customerName")} placeholder="Acme Electronics" />
            </Field>
            <Field label="Customer GSTIN (optional)">
              <Input value={form.customerGstin} onChange={onChange("customerGstin")} placeholder="29ABCDE1234F1Z5" />
            </Field>
            <Field label="Customer Phone (optional)">
              <Input value={form.customerPhone} onChange={onChange("customerPhone")} placeholder="+91..." />
            </Field>
            <Field label="Customer Email (optional)">
              <Input value={form.customerEmail} onChange={onChange("customerEmail")} placeholder="buyer@acme.com" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Customer Address">
                <textarea
                  value={form.customerAddress}
                  onChange={(e) => setForm((s) => ({ ...s, customerAddress: e.target.value }))}
                  className="min-h-[90px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                  placeholder="Full shipping address..."
                />
              </Field>
            </div>
          </div>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Order No">
              <Input value={form.orderNo} onChange={onChange("orderNo")} placeholder="SO-450019" />
            </Field>
            <Field label="PO No">
              <Input value={form.poNo} onChange={onChange("poNo")} placeholder="PO-ACME-7781" />
            </Field>
            <Field label="Invoice No">
              <Input value={form.invoiceNo} onChange={onChange("invoiceNo")} placeholder="INV-00988" />
            </Field>
            <Field label="Job No">
              <Input value={form.jobNo} onChange={onChange("jobNo")} placeholder="JOB-10582" />
            </Field>
          </div>

          <Divider />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Carton No">
              <Input value={form.cartonNo} onChange={onChange("cartonNo")} placeholder="CTN-001" />
            </Field>
            <Field label="No. of Cartons">
              <Input value={form.cartons} onChange={onChange("cartons")} placeholder="3" />
            </Field>
            <Field label="Gross Weight">
              <Input value={form.grossWt} onChange={onChange("grossWt")} placeholder="12.5 kg" />
            </Field>
            <Field label="Net Weight">
              <Input value={form.netWt} onChange={onChange("netWt")} placeholder="10.8 kg" />
            </Field>
            <Field label="Dimensions" hint="L x W x H">
              <Input value={form.dims} onChange={onChange("dims")} placeholder="45 x 35 x 30 cm" />
            </Field>
            <Field label="Seal No (optional)">
              <Input value={form.sealNo} onChange={onChange("sealNo")} placeholder="SEAL-8932" />
            </Field>
          </div>

          <Divider />

          <div className="mt-4">
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                className="min-h-[90px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                placeholder="Packing instructions / ESD / moisture notes..."
              />
            </Field>
          </div>

          <Divider />

          {/* Items editor */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">Items</p>
              <Button variant="outline" className="gap-2" onClick={addItem}>
                <Box className="h-4 w-4" />
                Add item
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-2xl border bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Package className="h-4 w-4 text-gray-500" />
                      Item #{idx + 1}
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-600" onClick={() => removeItem(idx)}>
                      Remove
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Part No / Item">
                      <Input
                        value={it.part_no}
                        onChange={(e) => updateItem(idx, "part_no", e.target.value)}
                        placeholder="PCB-CTRL-REV-C"
                      />
                    </Field>
                    <Field label="Lot / Batch">
                      <Input
                        value={it.lot_or_batch}
                        onChange={(e) => updateItem(idx, "lot_or_batch", e.target.value)}
                        placeholder="FG-LOT-00031"
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Description">
                        <Input
                          value={it.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder="Controller PCB, 4L, ENIG, 1.6mm"
                        />
                      </Field>
                    </div>

                    <Field label="Qty">
                      <Input value={it.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} placeholder="500" />
                    </Field>

                    <Field label="UOM">
                      <Input value={it.uom} onChange={(e) => updateItem(idx, "uom", e.target.value)} placeholder="PCS" />
                    </Field>

                    <div className="md:col-span-2">
                      <Field label="Remarks">
                        <Input
                          value={it.remarks}
                          onChange={(e) => updateItem(idx, "remarks", e.target.value)}
                          placeholder="ESD bag + bubble wrap"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right preview */}
        <PackingSlipPreview payload={payload} />
      </div>

      {/* Confirm print */}
      <AlertDialog open={confirmPrint} onOpenChange={setConfirmPrint}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Print Packing Slip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will print packing slip <span className="font-semibold">{form.slipNo || "—"}</span> for shipment{" "}
              <span className="font-semibold">{form.shipmentId || "—"}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doPrint}>Print</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #print-area {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
