// src/pages/procurement/purchase-orders/PurchaseOrderDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Download,
  FileText,
  Hash,
  Info,
  Mail,
  MapPin,
  Package,
  Printer,
  RefreshCcw,
  Send,
  ShieldCheck,
  Truck,
  UserCircle2,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ConfirmationDialog from "@/components/ConfirmationDialog";

// If you have a PO service, wire it here.
// import purchaseOrdersService from "@/services/purchaseOrders.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
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

function money(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(num);
}

function statusPill(status) {
  const s = (status || "").toUpperCase();
  const cls =
    s === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "REJECTED"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : s === "PENDING_APPROVAL"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : s === "CLOSED"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return <Badge className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls)}>{s}</Badge>;
}

function calcTotals(po) {
  const lines = po?.lines || [];
  const subTotal = lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.rate || 0), 0);
  const taxTotal = lines.reduce(
    (sum, l) => sum + (Number(l.qty || 0) * Number(l.rate || 0) * Number(l.taxPct || 0)) / 100,
    0
  );
  const freight = Number(po?.freight || 0);
  const discount = Number(po?.discount || 0);
  const rounding = Number(po?.rounding || 0);
  const grandTotal = subTotal + taxTotal + freight - discount + rounding;
  return { subTotal, taxTotal, freight, discount, rounding, grandTotal };
}

/**
 * MOCK DATA — replace with:
 * GET /procurement/purchase-orders/:id
 */
async function mockFetchPO(id) {
  const dataset = {
    "PO-2026-00021": {
      id: "PO-2026-00021",
      status: "PENDING_APPROVAL",
      plant: "Plant A",
      createdAt: "2026-01-03",
      requiredBy: "2026-01-10",
      buyer: "Procurement Team",
      requester: "Production Planner",
      supplier: {
        name: "LaminatePro",
        email: "sales@laminatepro.example",
        phone: "+91 90000 00000",
        gstin: "32AAAAA0000A1Z5",
        address: "Bangalore, Karnataka, India",
      },
      shipTo: {
        name: "PCBxpress Plant A",
        address: "Industrial Area, Kochi, Kerala, India",
        contact: "Stores Incharge",
        phone: "+91 95555 55555",
      },
      billTo: {
        name: "PCBxpress HQ",
        address: "MG Road, Kochi, Kerala, India",
        gstin: "32BBBBB0000B1Z5",
      },
      remarks: "Urgent FR4 core for WO-1187",
      currency: "INR",
      incoterm: "EXW",
      paymentTerms: "Net 30",
      deliveryTerms: "Ex-Works",
      attachments: [
        { name: "Vendor_Quote_LaminatePro.pdf", type: "quote" },
        { name: "Spec_FR4_HTG_1.6.pdf", type: "spec" },
      ],
      freight: 0,
      discount: 0,
      rounding: 0,
      lines: [
        {
          code: "RM-FR4-HTG-1.6",
          name: "FR4 Core High TG 1.6mm",
          uom: "SHEET",
          qty: 120,
          rate: 285,
          taxPct: 18,
          needBy: "2026-01-10",
          remark: "For multilayer build-up",
        },
        {
          code: "RM-CU-FOIL-18",
          name: "Copper Foil 18µm",
          uom: "KG",
          qty: 10,
          rate: 980,
          taxPct: 18,
          needBy: "2026-01-10",
          remark: "ED copper, RA not accepted",
        },
      ],
      approvals: [
        { step: "Request Created", by: "Production Planner", at: "2026-01-03", status: "DONE" },
        { step: "Procurement Review", by: "Procurement Team", at: "2026-01-03", status: "DONE" },
        { step: "Finance Approval", by: "Finance Head", at: null, status: "PENDING" },
      ],
      grn: null,
    },
    "PO-2026-00022": {
      id: "PO-2026-00022",
      status: "APPROVED",
      plant: "Plant A",
      createdAt: "2026-01-04",
      requiredBy: "2026-01-09",
      buyer: "Procurement Team",
      requester: "Process Engineer",
      supplier: {
        name: "ChemX",
        email: "orders@chemx.example",
        phone: "+91 91111 11111",
        gstin: "32CCCCC0000C1Z5",
        address: "Chennai, Tamil Nadu, India",
      },
      shipTo: {
        name: "PCBxpress Plant A",
        address: "Industrial Area, Kochi, Kerala, India",
        contact: "Stores Incharge",
        phone: "+91 95555 55555",
      },
      billTo: {
        name: "PCBxpress HQ",
        address: "MG Road, Kochi, Kerala, India",
        gstin: "32BBBBB0000B1Z5",
      },
      remarks: "Etchant replenish for line 2",
      currency: "INR",
      incoterm: "DAP",
      paymentTerms: "Advance 50%",
      deliveryTerms: "Door Delivery",
      attachments: [{ name: "MSDS_ChemX.zip", type: "msds" }],
      freight: 350,
      discount: 0,
      rounding: -0.23,
      lines: [
        { code: "CHEM-ETCH-CL", name: "Chloride Etchant", uom: "CAN", qty: 12, rate: 1650, taxPct: 18, needBy: "2026-01-09" },
        { code: "CHEM-STRIP", name: "Resist Stripper", uom: "CAN", qty: 6, rate: 1290, taxPct: 18, needBy: "2026-01-09" },
      ],
      approvals: [
        { step: "Request Created", by: "Process Engineer", at: "2026-01-04", status: "DONE" },
        { step: "Procurement Review", by: "Procurement Team", at: "2026-01-04", status: "DONE" },
        { step: "Finance Approval", by: "Finance Head", at: "2026-01-04", status: "DONE" },
      ],
      grn: { id: "GRN-2026-00111", status: "PARTIAL", receivedPct: 60 },
    },
  };

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!id || !dataset[id]) return reject(new Error("Not found"));
      resolve(dataset[id]);
    }, 350);
  });
}

export default function PurchaseOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState(null);
  const [busy, setBusy] = useState(false);

  const [sendOpen, setSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendNote, setSendNote] = useState("");

  const totals = useMemo(() => (po ? calcTotals(po) : null), [po]);

  const refresh = async () => {
    setLoading(true);
    try {
      // const res = await purchaseOrdersService.getById(id);
      // setPo(res.data);
      const data = await mockFetchPO(id);
      setPo(data);
      setSendTo(data?.supplier?.email || "");
    } catch (e) {
      toast({ title: "PO not found", description: "The purchase order could not be loaded.", variant: "destructive" });
      navigate("/procurement/purchase-orders", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const goBack = () => {
    const from = location.state?.from;
    if (from) return navigate(from);
    navigate(-1);
  };

  const printPO = () => {
    toast({ title: "Print", description: "Wire this to /purchase-orders/:id/print (PDF/HTML)." });
  };

  const downloadPO = () => {
    toast({ title: "Download", description: "Wire this to /purchase-orders/:id/download (PDF)." });
  };

  const approvePO = async () => {
    setBusy(true);
    try {
      // await purchaseOrdersService.approve(id);
      setPo((p) => ({ ...p, status: "APPROVED" }));
      toast({ title: "Approved", description: `PO ${id} approved.` });
    } catch (e) {
      toast({ title: "Approve failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const rejectPO = async () => {
    setBusy(true);
    try {
      // await purchaseOrdersService.reject(id, { reason: "..." });
      setPo((p) => ({ ...p, status: "REJECTED" }));
      toast({ title: "Rejected", description: `PO ${id} rejected.` });
    } catch (e) {
      toast({ title: "Reject failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const sendSupplier = async () => {
    const to = sendTo.trim();
    if (!to) {
      toast({ title: "Email required", description: "Please enter supplier email.", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      // await purchaseOrdersService.sendToSupplier(id, { to, note: sendNote });
      toast({ title: "Sent", description: `PO ${id} sent to ${to}.` });
      setSendOpen(false);
      setSendNote("");
    } catch (e) {
      toast({ title: "Send failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="text-sm text-gray-500">Procurement • Purchase Orders</div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{id}</h1>
                {po ? statusPill(po.status) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={printPO} disabled={loading}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={downloadPO} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>

            {po?.status === "PENDING_APPROVAL" ? (
              <>
                <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy || loading} onClick={approvePO}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" className="text-rose-700" disabled={busy || loading} onClick={rejectPO}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            ) : null}

            <Button variant="outline" disabled={busy || loading} onClick={() => setSendOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Email Supplier
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: Header + addresses */}
          <Card className="lg:col-span-8 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-700" />
                Purchase Order Details
              </CardTitle>
              <CardDescription>PCB manufacturing procurement order — materials, chemicals, tooling, services.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Plant</div>
                    <div className="font-semibold text-gray-900">{po?.plant || "-"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Created / Required By</div>
                    <div className="font-semibold text-gray-900">
                      {formatDate(po?.createdAt)} • {formatDate(po?.requiredBy)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <UserCircle2 className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Buyer / Requester</div>
                    <div className="font-semibold text-gray-900">
                      {po?.buyer || "-"} • {po?.requester || "-"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Truck className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Incoterm / Delivery</div>
                    <div className="font-semibold text-gray-900">
                      {po?.incoterm || "-"} • {po?.deliveryTerms || "-"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Payment Terms</div>
                    <div className="font-semibold text-gray-900">{po?.paymentTerms || "-"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Remarks</div>
                    <div className="font-semibold text-gray-900">{po?.remarks || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    Supplier
                  </div>
                  <div className="mt-2 text-sm text-gray-800">
                    <div className="font-semibold">{po?.supplier?.name || "-"}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{po?.supplier?.email || "-"}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{po?.supplier?.address || "-"}</div>
                    <div className="mt-2 text-xs text-gray-600">
                      GSTIN: <span className="font-semibold text-gray-800">{po?.supplier?.gstin || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    Ship To
                  </div>
                  <div className="mt-2 text-sm text-gray-800">
                    <div className="font-semibold">{po?.shipTo?.name || "-"}</div>
                    <div className="mt-2 text-xs text-gray-600">{po?.shipTo?.address || "-"}</div>
                    <div className="mt-2 text-xs text-gray-600">
                      Contact: <span className="font-semibold text-gray-800">{po?.shipTo?.contact || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Hash className="h-4 w-4 text-gray-600" />
                    Bill To
                  </div>
                  <div className="mt-2 text-sm text-gray-800">
                    <div className="font-semibold">{po?.billTo?.name || "-"}</div>
                    <div className="mt-2 text-xs text-gray-600">{po?.billTo?.address || "-"}</div>
                    <div className="mt-2 text-xs text-gray-600">
                      GSTIN: <span className="font-semibold text-gray-800">{po?.billTo?.gstin || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lines */}
              <div className="rounded-xl border bg-white">
                <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Line Items</div>
                  <div className="text-xs text-gray-500">
                    Currency: <span className="font-semibold text-gray-700">{po?.currency || "INR"}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white text-xs uppercase text-gray-500">
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-left">UoM</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                        <th className="px-4 py-2 text-right">Tax %</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Need By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(po?.lines || []).map((l, idx) => {
                        const amt = Number(l.qty || 0) * Number(l.rate || 0);
                        return (
                          <tr key={`${l.code}-${idx}`} className="hover:bg-gray-50/60">
                            <td className="px-4 py-2">
                              <div className="font-semibold text-gray-900">{l.name}</div>
                              <div className="text-xs text-gray-500">{l.code}</div>
                              {l.remark ? <div className="mt-1 text-xs text-gray-500">{l.remark}</div> : null}
                            </td>
                            <td className="px-4 py-2">{l.uom}</td>
                            <td className="px-4 py-2 text-right">{Number(l.qty || 0)}</td>
                            <td className="px-4 py-2 text-right">{money(l.rate)}</td>
                            <td className="px-4 py-2 text-right">{Number(l.taxPct || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-semibold">{money(amt)}</td>
                            <td className="px-4 py-2">{formatDate(l.needBy)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attachments */}
              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FileText className="h-4 w-4 text-gray-600" />
                  Attachments
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(po?.attachments || []).length === 0 ? (
                    <div className="text-sm text-gray-500">No attachments.</div>
                  ) : (
                    po.attachments.map((a, idx) => (
                      <div key={`${a.name}-${idx}`} className="flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                            <div className="text-xs text-gray-500">{a.type || "file"}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast({ title: "Open", description: "Wire this to file download / viewer." })}
                        >
                          Open
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: totals + approvals */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-700" />
                  Totals
                </CardTitle>
                <CardDescription>Commercial summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{money(totals?.subTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">{money(totals?.taxTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Freight</span>
                  <span className="font-semibold text-gray-900">{money(totals?.freight)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-gray-900">- {money(totals?.discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rounding</span>
                  <span className="font-semibold text-gray-900">{money(totals?.rounding)}</span>
                </div>

                <div className="my-2 border-t pt-2" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Grand Total</span>
                  <span className="text-lg font-extrabold text-gray-900">{money(totals?.grandTotal)}</span>
                </div>

                {po?.grn ? (
                  <div className="mt-3 rounded-xl border bg-emerald-50 p-3 text-sm text-emerald-800">
                    <div className="font-semibold">GRN Linked</div>
                    <div className="text-xs">
                      {po.grn.id} • {po.grn.status} • Received {po.grn.receivedPct}%
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                    <div className="font-semibold">GRN</div>
                    <div className="text-xs text-gray-500">No GRN created yet.</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-gray-700" />
                  Approval Trail
                </CardTitle>
                <CardDescription>Step-wise internal approval status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(po?.approvals || []).length === 0 ? (
                  <div className="text-sm text-gray-500">No approval steps.</div>
                ) : (
                  po.approvals.map((a, idx) => (
                    <div key={`${a.step}-${idx}`} className="rounded-xl border bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{a.step}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            By <span className="font-semibold text-gray-700">{a.by}</span>
                          </div>
                        </div>
                        <Badge
                          className={cx(
                            "rounded-full border bg-white text-[11px]",
                            a.status === "DONE"
                              ? "border-emerald-200 text-emerald-700"
                              : "border-amber-200 text-amber-800"
                          )}
                        >
                          {a.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {a.at ? `On ${formatDate(a.at)}` : "Awaiting action"}
                      </div>
                    </div>
                  ))
                )}

                <div className="mt-2 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      PCB note: approvals usually validate vendor compliance (COA/MSDS), price rules, MOQ, lead-time,
                      and mapping to Work Orders / Routing.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Email supplier dialog */}
      <ConfirmationDialog
        open={sendOpen}
        title="Email this PO to supplier?"
        description="This will send the PO PDF/details to the supplier email."
        confirmText="Send"
        confirmVariant="default"
        onOpenChange={setSendOpen}
        onConfirm={sendSupplier}
        footerExtra={
          <div className="w-full space-y-3">
            <div className="space-y-1">
              <Label>To</Label>
              <Input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="supplier@email.com" />
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <textarea
                className="min-h-[70px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                value={sendNote}
                onChange={(e) => setSendNote(e.target.value)}
                placeholder="Example: Please confirm lead time and attach COA/MSDS."
              />
            </div>
          </div>
        }
      />
    </>
  );
}
