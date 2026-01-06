// src/pages/traceability/batch/BatchPrint.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Barcode,
    Building2,
    Calendar,
    Factory,
    Hash,
    Printer,
    QrCode,
    ShieldCheck,
    User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * PCBxpress ERP - Batch Print
 * Folder: src/pages/traceability/batch/BatchPrint.jsx
 *
 * Route suggestion:
 *   /traceability/batch/print?batch_id=123
 *
 * Recommended backend endpoint:
 *   GET /traceability/batches/:id/print
 *   returns:
 *   {
 *     batch: {
 *       id, batch_no, lot_no, job_no, customer, part_no,
 *       panel_rev, layer_count, thickness_mm, copper_oz,
 *       qty_panels, qty_pcs, uom,
 *       route_name, current_station,
 *       plant_name, created_by, created_at,
 *       quality_status, notes,
 *       qr_payload, barcode_payload
 *     }
 *   }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// A4 page sizing for print preview
const A4 = {
  width: "210mm",
  minHeight: "297mm",
  padding: "14mm",
};

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function pickBadge(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("HOLD")) return "border-amber-200 bg-amber-50 text-amber-700";
  if (s.includes("FAIL") || s.includes("REJECT")) return "border-red-200 bg-red-50 text-red-700";
  if (s.includes("PASS") || s.includes("APPROV")) return "border-green-200 bg-green-50 text-green-700";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default function BatchPrint() {
  const { toast } = useToast();
  const [sp] = useSearchParams();

  const batchId = sp.get("batch_id") || sp.get("id") || "";
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);

  const printRef = useRef(null);

  const headerTitle = useMemo(() => {
    const bn = batch?.batch_no || batch?.batchNo;
    return bn ? `Batch ${bn}` : "Batch Print";
  }, [batch]);

  useEffect(() => {
    let mounted = true;

    const fetchBatch = async () => {
      if (!batchId) {
        setLoading(false);
        toast({
          title: "Missing batch_id",
          description: "Open this page with ?batch_id=YOUR_BATCH_ID",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/traceability/batches/${batchId}/print`);
        const payload = res?.data?.batch ?? res?.data?.data?.batch ?? res?.data?.data ?? res?.data;
        if (!mounted) return;
        setBatch(payload);
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to load batch",
          description: "Could not fetch batch print details. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBatch();
    return () => {
      mounted = false;
    };
  }, [batchId, toast]);

  const handlePrint = () => {
    // print only the printable panel using CSS @media print
    window.print();
  };

  // Fallback values for different API naming styles
  const bn = batch?.batch_no ?? batch?.batchNo;
  const ln = batch?.lot_no ?? batch?.lotNo;
  const job = batch?.job_no ?? batch?.jobNo;
  const customer = batch?.customer ?? batch?.customer_name ?? batch?.customerName;
  const partNo = batch?.part_no ?? batch?.partNo;
  const rev = batch?.panel_rev ?? batch?.rev ?? batch?.revision;
  const layers = batch?.layer_count ?? batch?.layers;
  const thick = batch?.thickness_mm ?? batch?.thickness;
  const cu = batch?.copper_oz ?? batch?.copper;
  const qtyPanels = batch?.qty_panels ?? batch?.qtyPanels;
  const qtyPcs = batch?.qty_pcs ?? batch?.qtyPcs;
  const uom = batch?.uom ?? "PCS";
  const route = batch?.route_name ?? batch?.routeName;
  const station = batch?.current_station ?? batch?.currentStation;
  const plant = batch?.plant_name ?? batch?.plantName;
  const createdBy = batch?.created_by ?? batch?.createdBy;
  const createdAt = batch?.created_at ?? batch?.createdAt;
  const qStatus = batch?.quality_status ?? batch?.qualityStatus ?? "—";
  const notes = batch?.notes;

  // If backend provides prebuilt payload strings for code symbologies.
  const qrPayload = batch?.qr_payload ?? batch?.qrPayload ?? bn ?? batchId;
  const barcodePayload = batch?.barcode_payload ?? batch?.barcodePayload ?? bn ?? batchId;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          .print-page { margin: 0 !important; }
          .a4 { width: 210mm !important; min-height: 297mm !important; padding: 14mm !important; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      {/* Top actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="no-print flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#dc2551]/10 p-3">
            <Printer className="h-6 w-6 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{headerTitle}</h1>
              <Badge className={cx("border", pickBadge(qStatus))}>{safe(qStatus)}</Badge>
            </div>
            <p className="text-sm text-gray-600">
              Print-ready batch traveler label for PCB manufacturing traceability (A4).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/traceability/batch">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-cyan-600 hover:bg-cyan-500" disabled={loading || !batch}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </motion.div>

      {/* Printable page */}
      <div className="print-page flex justify-center">
        <Card ref={printRef} className="print-area w-full border bg-white shadow-sm">
          <CardContent className="a4" style={A4}>
            {/* Header */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551] text-white">
                    <span className="text-[12px] font-extrabold leading-none">PCB</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">PCBxpress Manufacturing ERP</h2>
                    <p className="text-xs text-gray-600">Batch Traveler / Traceability Label</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Batch:</span>
                    <span className="font-semibold text-gray-900">{safe(bn)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Lot:</span>
                    <span className="font-semibold text-gray-900">{safe(ln)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Job:</span>
                    <span className="font-semibold text-gray-900">{safe(job)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Plant:</span>
                    <span className="font-semibold text-gray-900">{safe(plant)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Created By:</span>
                    <span className="font-semibold text-gray-900">{safe(createdBy)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Created At:</span>
                    <span className="font-semibold text-gray-900">{safe(fmtDate(createdAt))}</span>
                  </div>
                </div>
              </div>

              {/* Codes */}
              <div className="min-w-[220px] space-y-3">
                <div className="rounded-xl border p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <QrCode className="h-4 w-4 text-[#dc2551]" />
                    QR (for scan)
                  </div>

                  {/* If you have a QR component/library, replace this box with the QR image */}
                  <div className="grid h-40 place-items-center rounded-lg bg-gray-50 text-center text-[10px] text-gray-600">
                    <div className="px-3">
                      <div className="font-semibold text-gray-800">QR Payload</div>
                      <div className="mt-1 break-all">{safe(qrPayload)}</div>
                      <div className="mt-2 text-gray-500">(Integrate QR render later)</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Barcode className="h-4 w-4 text-[#dc2551]" />
                    Barcode (for label)
                  </div>

                  {/* If you have a barcode component/library, replace this box with barcode SVG */}
                  <div className="grid h-16 place-items-center rounded-lg bg-gray-50 text-[11px] text-gray-700">
                    <span className="font-mono">{safe(barcodePayload)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-6 h-px w-full bg-gray-200" />

            {/* PCB Specs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="mb-3 text-sm font-semibold text-gray-900">Customer & Part</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-semibold text-gray-900">{safe(customer)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Part No</span>
                    <span className="font-semibold text-gray-900">{safe(partNo)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Revision</span>
                    <span className="font-semibold text-gray-900">{safe(rev)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-3 text-sm font-semibold text-gray-900">Board Specs</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Layers</span>
                    <span className="font-semibold text-gray-900">{safe(layers)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Thickness</span>
                    <span className="font-semibold text-gray-900">{thick ? `${thick} mm` : "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Copper</span>
                    <span className="font-semibold text-gray-900">{cu ? `${cu} oz` : "—"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-3 text-sm font-semibold text-gray-900">Quantity</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Panels</span>
                    <span className="font-semibold text-gray-900">{safe(qtyPanels)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Pieces</span>
                    <span className="font-semibold text-gray-900">
                      {qtyPcs !== undefined && qtyPcs !== null ? `${qtyPcs} ${uom}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-3 text-sm font-semibold text-gray-900">Routing / Station</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Route</span>
                    <span className="font-semibold text-gray-900">{safe(route)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Current Station</span>
                    <span className="font-semibold text-gray-900">{safe(station)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes + Signoffs */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="mb-2 text-sm font-semibold text-gray-900">Special Notes</div>
                <p className="min-h-[84px] whitespace-pre-wrap text-sm text-gray-700">{safe(notes)}</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ShieldCheck className="h-4 w-4 text-[#dc2551]" />
                  QC Sign-off
                </div>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Inspector Name</p>
                      <div className="mt-1 h-9 rounded-lg border bg-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Signature</p>
                      <div className="mt-1 h-9 rounded-lg border bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <div className="mt-1 h-9 rounded-lg border bg-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <div className="mt-1 h-9 rounded-lg border bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
              <span>Generated by PCBxpress ERP • Traceability Module</span>
              <span>Batch ID: {safe(batchId)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* small helper */}
      {!batchId && (
        <div className="no-print">
          <Card className="border bg-white">
            <CardContent className="py-4 text-sm text-gray-600">
              Open this screen as: <span className="font-mono">/traceability/batch/print?batch_id=123</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
