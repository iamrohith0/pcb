// src/pages/procurement/grn/GRNDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Package,
  Printer,
  RefreshCcw,
  Truck,
  User2,
  Warehouse,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function money(n, currency = "₹") {
  const v = Number(n || 0);
  return `${currency}${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  if (!d) return "-";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return String(d);
  }
}

function StatusBadge({ status }) {
  const s = String(status || "DRAFT").toUpperCase();

  const conf = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
    RECEIVED: { label: "Received", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    PARTIAL: { label: "Partial", className: "bg-amber-50 text-amber-700 border-amber-200" },
    QC_PENDING: { label: "QC Pending", className: "bg-blue-50 text-blue-700 border-blue-200" },
    QC_PASSED: { label: "QC Passed", className: "bg-green-50 text-green-700 border-green-200" },
    QC_FAILED: { label: "QC Failed", className: "bg-rose-50 text-rose-700 border-rose-200" },
    PUTAWAY: { label: "Putaway", className: "bg-violet-50 text-violet-700 border-violet-200" },
    CANCELLED: { label: "Cancelled", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  }[s] || { label: s, className: "bg-slate-100 text-slate-700 border-slate-200" };

  return (
    <Badge className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", conf.className)}>
      {conf.label}
    </Badge>
  );
}

/**
 * This is a UI-first page.
 * Replace the `mockFetchGRN` and `mockActions` with real API calls later:
 * - GET    /procurement/grn/:id
 * - POST   /procurement/grn/:id/receive
 * - POST   /procurement/grn/:id/qc-pass
 * - POST   /procurement/grn/:id/qc-fail
 * - POST   /procurement/grn/:id/putaway
 * - GET    /procurement/grn/:id/print  (pdf/html)
 */
function mockFetchGRN(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        grnNo: `GRN-${String(id).padStart(4, "0")}`,
        status: "QC_PENDING",
        receivedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        poNo: "PO-2026-0112",
        supplier: {
          name: "Shree Copper Suppliers",
          contact: "Vishnu",
          phone: "+91 98765 43210",
          email: "sales@shreecopper.example",
        },
        vehicleNo: "KL-07-AB-4521",
        challanNo: "CH-8891",
        transporter: "BlueDart Freight",
        warehouse: { name: "Main Stores", location: "Plant 1" },
        currency: "₹",
        qc: {
          inspector: "QC - Sreeram",
          result: null,
          notes: "",
        },
        totals: {
          subTotal: 68250,
          tax: 12285,
          grandTotal: 80535,
        },
        items: [
          {
            line: 1,
            itemCode: "RM-CU-FOIL-35UM",
            itemName: "Copper Foil 35µm",
            uom: "KG",
            orderedQty: 50,
            receivedQty: 50,
            acceptedQty: 0,
            rejectedQty: 0,
            unitPrice: 900,
            taxPct: 18,
            lotNo: "LOT-CU-0126-A",
            expiry: null,
            remarks: "For inner layers",
          },
          {
            line: 2,
            itemCode: "RM-FR4-1.6",
            itemName: "FR4 Laminate 1.6mm",
            uom: "SHEET",
            orderedQty: 120,
            receivedQty: 110,
            acceptedQty: 0,
            rejectedQty: 0,
            unitPrice: 210,
            taxPct: 18,
            lotNo: "LOT-FR4-0126-B",
            expiry: null,
            remarks: "Partial received",
          },
        ],
        attachments: [
          { name: "Supplier Invoice.pdf", url: "#" },
          { name: "Packing List.pdf", url: "#" },
        ],
      });
    }, 450);
  });
}

export default function GRNDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [grn, setGrn] = useState(null);

  // QC form controls
  const [qcNotes, setQcNotes] = useState("");
  const [qcAcceptedOverride, setQcAcceptedOverride] = useState({}); // { [line]: acceptedQty }

  const load = async () => {
    setLoading(true);
    try {
      const data = await mockFetchGRN(id);
      setGrn(data);
      setQcNotes(data?.qc?.notes || "");
      // prime accepted override from existing
      const init = {};
      (data?.items || []).forEach((it) => {
        init[it.line] = Number(it.acceptedQty || 0);
      });
      setQcAcceptedOverride(init);
    } catch (e) {
      toast({
        title: "Failed to load GRN",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const computed = useMemo(() => {
    const items = grn?.items || [];
    const receivedLines = items.reduce((acc, it) => acc + (Number(it.receivedQty || 0) > 0 ? 1 : 0), 0);
    const totalReceivedQty = items.reduce((acc, it) => acc + Number(it.receivedQty || 0), 0);
    const totalOrderedQty = items.reduce((acc, it) => acc + Number(it.orderedQty || 0), 0);

    const accepted = items.reduce((acc, it) => acc + Number(qcAcceptedOverride[it.line] ?? it.acceptedQty ?? 0), 0);
    const rejected = items.reduce((acc, it) => {
      const recv = Number(it.receivedQty || 0);
      const accQty = Number(qcAcceptedOverride[it.line] ?? it.acceptedQty ?? 0);
      return acc + Math.max(0, recv - accQty);
    }, 0);

    const isPartial = totalReceivedQty > 0 && totalReceivedQty < totalOrderedQty;

    return {
      receivedLines,
      totalReceivedQty,
      totalOrderedQty,
      accepted,
      rejected,
      isPartial,
    };
  }, [grn, qcAcceptedOverride]);

  const canQC = useMemo(() => {
    const s = String(grn?.status || "").toUpperCase();
    return s === "QC_PENDING" || s === "RECEIVED" || s === "PARTIAL";
  }, [grn?.status]);

  const canPutaway = useMemo(() => String(grn?.status || "").toUpperCase() === "QC_PASSED", [grn?.status]);

  const handlePrint = () => {
    toast({ title: "Print", description: "Hook this to your print endpoint (PDF/HTML)." });
    // window.open(`/api/procurement/grn/${id}/print`, "_blank");
  };

  const handleDownload = () => {
    toast({ title: "Download", description: "Hook this to your GRN PDF download endpoint." });
    // window.location.href = `/api/procurement/grn/${id}/pdf`;
  };

  const handleQcPass = async () => {
    if (!grn) return;

    const items = (grn.items || []).map((it) => {
      const acceptedQty = Number(qcAcceptedOverride[it.line] ?? 0);
      const receivedQty = Number(it.receivedQty || 0);
      const rejectedQty = Math.max(0, receivedQty - acceptedQty);

      return {
        line: it.line,
        acceptedQty,
        rejectedQty,
      };
    });

    const invalid = items.some((it) => it.acceptedQty < 0 || Number.isNaN(it.acceptedQty));
    if (invalid) {
      toast({ title: "Invalid QC quantities", description: "Accepted quantities must be >= 0.", variant: "destructive" });
      return;
    }

    // TODO: Replace with API:
    // await grnApi.qcPass(id, { notes: qcNotes, items })
    setGrn((prev) => ({
      ...prev,
      status: "QC_PASSED",
      qc: { ...(prev.qc || {}), result: "PASSED", notes: qcNotes },
      items: (prev.items || []).map((it) => {
        const acceptedQty = Number(qcAcceptedOverride[it.line] ?? 0);
        const receivedQty = Number(it.receivedQty || 0);
        const rejectedQty = Math.max(0, receivedQty - acceptedQty);
        return { ...it, acceptedQty, rejectedQty };
      }),
    }));

    toast({ title: "QC Passed", description: "GRN marked as QC Passed." });
  };

  const handleQcFail = async () => {
    if (!grn) return;

    // TODO: Replace with API
    setGrn((prev) => ({
      ...prev,
      status: "QC_FAILED",
      qc: { ...(prev.qc || {}), result: "FAILED", notes: qcNotes },
    }));

    toast({ title: "QC Failed", description: "GRN marked as QC Failed.", variant: "destructive" });
  };

  const handlePutaway = async () => {
    if (!grn) return;

    // TODO: Replace with API
    setGrn((prev) => ({
      ...prev,
      status: "PUTAWAY",
    }));

    toast({ title: "Putaway Complete", description: "Items moved to stock locations." });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-44 rounded-md bg-gray-100" />
          <div className="h-9 w-52 rounded-md bg-gray-100" />
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-64 rounded bg-gray-100" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
            <div className="h-4 w-2/3 rounded bg-gray-100" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!grn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GRN not found</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={load}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="px-2" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{grn.grnNo}</h1>
              <StatusBadge status={grn.status} />
              {computed.isPartial && (
                <Badge className="rounded-full border bg-amber-50 text-amber-700 border-amber-200">Partial Receipt</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Purchase Order: <span className="font-medium text-gray-900">{grn.poNo}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-gray-600" />
              GRN Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Received Date
              </div>
              <div className="text-sm font-semibold text-gray-900">{formatDate(grn.receivedDate)}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Warehouse className="h-4 w-4" />
                Warehouse
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {grn.warehouse?.name} <span className="text-gray-500 font-medium">• {grn.warehouse?.location}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                Transport
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {grn.transporter || "-"}{" "}
                <span className="text-gray-500 font-medium">{grn.vehicleNo ? `• ${grn.vehicleNo}` : ""}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="h-4 w-4" />
                Challan No.
              </div>
              <div className="text-sm font-semibold text-gray-900">{grn.challanNo || "-"}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="h-4 w-4" />
                Qty Received
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {computed.totalReceivedQty}{" "}
                <span className="text-gray-500 font-medium">/ {computed.totalOrderedQty} ordered</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BadgeCheck className="h-4 w-4" />
                QC Snapshot
              </div>
              <div className="text-sm font-semibold text-gray-900">
                Accepted: {computed.accepted}{" "}
                <span className="text-gray-500 font-medium">• Rejected: {computed.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User2 className="h-4 w-4 text-gray-600" />
              Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">{grn.supplier?.name || "-"}</div>
              <div className="text-xs text-gray-500">{grn.supplier?.contact ? `Contact: ${grn.supplier.contact}` : ""}</div>
            </div>

            <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{grn.supplier?.phone || "-"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{grn.supplier?.email || "-"}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/procurement/suppliers">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Suppliers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-gray-600" />
            Items Received
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">UOM</th>
                  <th className="px-3 py-2 text-right">Ordered</th>
                  <th className="px-3 py-2 text-right">Received</th>
                  <th className="px-3 py-2 text-right">Accepted (QC)</th>
                  <th className="px-3 py-2 text-right">Rejected</th>
                  <th className="px-3 py-2 text-left">Lot</th>
                  <th className="px-3 py-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(grn.items || []).map((it) => {
                  const accepted = Number(qcAcceptedOverride[it.line] ?? 0);
                  const received = Number(it.receivedQty || 0);
                  const rejected = Math.max(0, received - accepted);

                  return (
                    <tr key={it.line} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2 text-gray-600">{it.line}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{it.itemName}</div>
                        <div className="text-xs text-gray-500">{it.itemCode}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{it.uom}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{it.orderedQty}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{it.receivedQty}</td>

                      <td className="px-3 py-2 text-right">
                        {canQC ? (
                          <div className="ml-auto w-[120px]">
                            <Input
                              type="number"
                              min={0}
                              max={received}
                              value={Number.isNaN(accepted) ? "" : accepted}
                              onChange={(e) =>
                                setQcAcceptedOverride((p) => ({
                                  ...p,
                                  [it.line]: e.target.value === "" ? 0 : Number(e.target.value),
                                }))
                              }
                              className="h-9 text-right"
                            />
                            <div className="mt-1 text-[11px] text-gray-500">
                              max: <span className="font-medium">{received}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">{it.acceptedQty ?? 0}</span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">
                        <span className={cx("font-semibold", rejected > 0 ? "text-rose-700" : "text-gray-700")}>
                          {rejected}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-gray-700">{it.lotNo || "-"}</td>
                      <td className="px-3 py-2 text-gray-600">{it.remarks || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Sub Total</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{money(grn.totals?.subTotal, grn.currency)}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Tax</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{money(grn.totals?.tax, grn.currency)}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Grand Total</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{money(grn.totals?.grandTotal, grn.currency)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QC Panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            Incoming QC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Inspector</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{grn.qc?.inspector || "-"}</div>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-xs text-gray-500">QC Result</div>
              <div className="mt-1">
                {grn.qc?.result ? (
                  <Badge className={cx("rounded-full border", grn.qc.result === "PASSED" ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                    {grn.qc.result}
                  </Badge>
                ) : (
                  <Badge className="rounded-full border bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>
                )}
              </div>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Actions</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  onClick={handleQcPass}
                  disabled={!canQC}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  QC Pass
                </Button>
                <Button onClick={handleQcFail} disabled={!canQC} variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  QC Fail
                </Button>
                <Button onClick={handlePutaway} disabled={!canPutaway} variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Putaway
                </Button>
              </div>
              {!canQC && (
                <p className="mt-2 text-xs text-gray-500">
                  QC actions are available only in <span className="font-medium">Received / Partial / QC Pending</span>.
                </p>
              )}
              {canPutaway && (
                <p className="mt-2 text-xs text-gray-500">
                  QC is passed. You can now move items to stock locations (Putaway).
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qcNotes">QC Notes</Label>
            <textarea
              id="qcNotes"
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              placeholder="Inspection notes, deviations, measurements..."
              className="min-h-[110px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              disabled={!canQC}
            />
            {!canQC && (
              <div className="text-xs text-gray-500">
                Notes are locked after QC decision (hook it to backend permissions if needed).
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-gray-600" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(grn.attachments || []).length === 0 ? (
            <div className="text-sm text-gray-600">No attachments.</div>
          ) : (
            (grn.attachments || []).map((a) => (
              <a
                key={a.name}
                href={a.url}
                className="group flex items-center justify-between rounded-xl border bg-white p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{a.name}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </a>
            ))
          )}
        </CardContent>
      </Card>

      {/* Footer links */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="outline">
          <Link to="/procurement/grn">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to GRN List
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/procurement/purchase-orders">
              <FileText className="mr-2 h-4 w-4" />
              Purchase Orders
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
