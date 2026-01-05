// src/pages/procurement/purchase-orders/PurchaseOrderApprove.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Hash,
  Mail,
  MessageSquare,
  Package,
  Printer,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Truck,
  UserCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

// If you have a PO service, plug it in here.
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

function statusBadge(status) {
  const s = (status || "").toUpperCase();
  const cls =
    s === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "REJECTED"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : s === "PENDING_APPROVAL"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return <Badge className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls)}>{s}</Badge>;
}

/**
 * Replace these mocks with API calls:
 * GET    /procurement/purchase-orders?status=PENDING_APPROVAL&q=
 * GET    /procurement/purchase-orders/:id
 * POST   /procurement/purchase-orders/:id/approve
 * POST   /procurement/purchase-orders/:id/reject
 * POST   /procurement/purchase-orders/:id/send (email)
 * GET    /procurement/purchase-orders/:id/print
 */
async function mockFetchPendingPOs(q = "") {
  const data = [
    {
      id: "PO-2026-00021",
      supplier: "LaminatePro",
      supplierEmail: "sales@laminatepro.example",
      buyer: "Procurement Team",
      createdAt: "2026-01-03",
      requiredBy: "2026-01-10",
      plant: "Plant A",
      status: "PENDING_APPROVAL",
      remarks: "Urgent FR4 core for WO-1187",
      currency: "INR",
      lines: [
        { code: "RM-FR4-HTG-1.6", name: "FR4 Core High TG 1.6mm", uom: "SHEET", qty: 120, rate: 285, taxPct: 18 },
        { code: "RM-CU-FOIL-18", name: "Copper Foil 18µm", uom: "KG", qty: 10, rate: 980, taxPct: 18 },
      ],
      freight: 0,
      discount: 0,
      terms: {
        payment: "Net 30",
        delivery: "Ex-Works",
        incoterm: "EXW",
        notes: "Provide COA with each batch",
      },
    },
    {
      id: "PO-2026-00022",
      supplier: "ChemX",
      supplierEmail: "orders@chemx.example",
      buyer: "Procurement Team",
      createdAt: "2026-01-04",
      requiredBy: "2026-01-09",
      plant: "Plant A",
      status: "PENDING_APPROVAL",
      remarks: "Etchant replenish for line 2",
      currency: "INR",
      lines: [
        { code: "CHEM-ETCH-CL", name: "Chloride Etchant", uom: "CAN", qty: 12, rate: 1650, taxPct: 18 },
        { code: "CHEM-STRIP", name: "Resist Stripper", uom: "CAN", qty: 6, rate: 1290, taxPct: 18 },
      ],
      freight: 350,
      discount: 0,
      terms: {
        payment: "Advance 50%",
        delivery: "Door Delivery",
        incoterm: "DAP",
        notes: "MSDS mandatory",
      },
    },
  ];

  const qq = q.trim().toLowerCase();
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!qq) return resolve(data);
      resolve(
        data.filter(
          (p) =>
            p.id.toLowerCase().includes(qq) ||
            p.supplier.toLowerCase().includes(qq) ||
            (p.remarks || "").toLowerCase().includes(qq) ||
            p.lines.some((l) => l.code.toLowerCase().includes(qq) || l.name.toLowerCase().includes(qq))
        )
      );
    }, 350);
  });
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
  const grandTotal = subTotal + taxTotal + freight - discount;
  return { subTotal, taxTotal, freight, discount, grandTotal };
}

export default function PurchaseOrderApprove() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [query, setQuery] = useState("");
  const [pos, setPos] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const selectedPO = useMemo(() => pos.find((p) => p.id === selectedId) || null, [pos, selectedId]);

  const [approveConfirm, setApproveConfirm] = useState({ open: false, id: null });
  const [rejectConfirm, setRejectConfirm] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await mockFetchPendingPOs(query);
      setPos(data);
      if (data.length && (!selectedId || !data.find((x) => x.id === selectedId))) {
        setSelectedId(data[0].id);
      }
      if (!data.length) setSelectedId(null);
    } catch (e) {
      toast({ title: "Failed to load POs", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh list on query (debounced-ish light)
  useEffect(() => {
    const t = setTimeout(() => refresh(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const doApprove = async (id) => {
    setApproveConfirm({ open: false, id: null });
    if (!id) return;

    setBusyId(id);
    try {
      // await purchaseOrdersService.approve(id);
      setPos((prev) => prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p)));
      toast({ title: "Approved", description: `PO ${id} approved successfully.` });
    } catch (e) {
      toast({ title: "Approve failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async (id) => {
    setRejectConfirm({ open: false, id: null });
    const reason = rejectReason.trim();
    setRejectReason("");

    if (!id) return;
    if (!reason) {
      toast({ title: "Reason required", description: "Please enter a rejection reason.", variant: "destructive" });
      return;
    }

    setBusyId(id);
    try {
      // await purchaseOrdersService.reject(id, { reason });
      setPos((prev) => prev.map((p) => (p.id === id ? { ...p, status: "REJECTED", rejectedReason: reason } : p)));
      toast({ title: "Rejected", description: `PO ${id} rejected.` });
    } catch (e) {
      toast({ title: "Reject failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const sendToSupplier = async (id) => {
    if (!id) return;
    setBusyId(id);
    try {
      // await purchaseOrdersService.sendToSupplier(id);
      toast({ title: "Sent", description: `PO ${id} emailed to supplier.` });
    } catch (e) {
      toast({ title: "Send failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const printPO = (id) => {
    toast({
      title: "Print",
      description: "Connect to a printable endpoint like /purchase-orders/:id/print (PDF/HTML).",
    });
  };

  const downloadPO = (id) => {
    toast({
      title: "Download",
      description: "Connect to /purchase-orders/:id/download to export PDF.",
    });
  };

  const pendingOnly = useMemo(() => (pos || []).filter((p) => p.status === "PENDING_APPROVAL"), [pos]);

  const totals = useMemo(() => (selectedPO ? calcTotals(selectedPO) : null), [selectedPO]);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-gray-700" />
                  Purchase Order Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve procurement POs for PCB materials, chemicals, tooling, and services.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={refresh} disabled={loading}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Badge className="rounded-full border bg-white text-gray-700 border-gray-200">
                  Pending: <span className="ml-1 font-semibold">{pendingOnly.length}</span>
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-12">
              <div className="md:col-span-6">
                <Label className="text-xs text-gray-500">Search</Label>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="PO number / supplier / item code / remarks..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-6 flex items-end justify-end gap-2">
                <div className="text-xs text-gray-500">
                  Tip: Approvals should enforce{" "}
                  <span className="font-semibold text-gray-700">budget limits</span>,{" "}
                  <span className="font-semibold text-gray-700">price rules</span>, and{" "}
                  <span className="font-semibold text-gray-700">role-based thresholds</span>.
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left list */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border">
                  <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending POs</div>
                    <div className="text-xs text-gray-500">{loading ? "Loading..." : `${pos.length} found`}</div>
                  </div>

                  <div className="max-h-[560px] overflow-y-auto">
                    {pos.length === 0 ? (
                      <div className="px-3 py-10 text-center text-sm text-gray-500">
                        {loading ? "Loading..." : "No purchase orders found."}
                      </div>
                    ) : (
                      pos.map((p) => {
                        const active = p.id === selectedId;
                        const t = calcTotals(p);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedId(p.id)}
                            className={cx(
                              "w-full text-left px-3 py-3 border-b last:border-b-0 transition-colors",
                              active ? "bg-[#DC2551]/5" : "hover:bg-gray-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={cx("font-semibold", active ? "text-[#B02045]" : "text-gray-900")}>
                                    {p.id}
                                  </span>
                                  {statusBadge(p.status)}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  <span className="font-medium text-gray-700">{p.supplier}</span> • Plant: {p.plant}
                                </div>
                                <div className="mt-1 line-clamp-1 text-xs text-gray-500">{p.remarks || "-"}</div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">{money(t.grandTotal)}</div>
                                <div className="text-xs text-gray-500">{p.lines.length} items</div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right details */}
              <div className="lg:col-span-7">
                {!selectedPO ? (
                  <div className="grid place-items-center rounded-xl border py-20 text-sm text-gray-500">
                    Select a purchase order to review.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-lg font-bold text-gray-900">{selectedPO.id}</div>
                            {statusBadge(selectedPO.status)}
                          </div>

                          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              <span>
                                Supplier: <span className="font-semibold">{selectedPO.supplier}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <UserCircle2 className="h-4 w-4 text-gray-500" />
                              <span>
                                Buyer: <span className="font-semibold">{selectedPO.buyer}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>
                                Created: <span className="font-semibold">{formatDate(selectedPO.createdAt)}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-gray-500" />
                              <span>
                                Required by: <span className="font-semibold">{formatDate(selectedPO.requiredBy)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">Remarks:</span> {selectedPO.remarks || "-"}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => printPO(selectedPO.id)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </Button>
                          <Button variant="outline" onClick={() => downloadPO(selectedPO.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                          <Button variant="outline" onClick={() => sendToSupplier(selectedPO.id)} disabled={busyId === selectedPO.id}>
                            <Send className="mr-2 h-4 w-4" />
                            Email Supplier
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Lines */}
                    <div className="rounded-xl border bg-white">
                      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Line Items</div>
                        <div className="text-xs text-gray-500">
                          Currency: <span className="font-semibold text-gray-700">{selectedPO.currency || "INR"}</span>
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
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedPO.lines.map((l, idx) => {
                              const amt = Number(l.qty || 0) * Number(l.rate || 0);
                              return (
                                <tr key={`${l.code}-${idx}`} className="hover:bg-gray-50/60">
                                  <td className="px-4 py-2">
                                    <div className="font-semibold text-gray-900">{l.name}</div>
                                    <div className="text-xs text-gray-500">{l.code}</div>
                                  </td>
                                  <td className="px-4 py-2">{l.uom}</td>
                                  <td className="px-4 py-2 text-right">{Number(l.qty || 0)}</td>
                                  <td className="px-4 py-2 text-right">{money(l.rate)}</td>
                                  <td className="px-4 py-2 text-right">{Number(l.taxPct || 0).toFixed(2)}</td>
                                  <td className="px-4 py-2 text-right font-semibold">{money(amt)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Totals + Terms + Actions */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-7 space-y-4">
                        <div className="rounded-xl border bg-white p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <FileText className="h-4 w-4 text-gray-600" />
                            Commercial Terms
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Payment</div>
                              <div className="mt-1 font-semibold text-gray-900">{selectedPO.terms?.payment || "-"}</div>
                            </div>
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Delivery</div>
                              <div className="mt-1 font-semibold text-gray-900">{selectedPO.terms?.delivery || "-"}</div>
                            </div>
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Incoterm</div>
                              <div className="mt-1 font-semibold text-gray-900">{selectedPO.terms?.incoterm || "-"}</div>
                            </div>
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Supplier Email</div>
                              <div className="mt-1 font-semibold text-gray-900">{selectedPO.supplierEmail || "-"}</div>
                            </div>

                            <div className="sm:col-span-2 rounded-lg border bg-gray-50 p-3">
                              <div className="text-xs text-gray-500">Notes</div>
                              <div className="mt-1 text-gray-800">{selectedPO.terms?.notes || "-"}</div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border bg-gray-50 p-4">
                          <div className="flex items-start gap-2">
                            <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-600" />
                            <div className="text-xs text-gray-600">
                              Approval checklist (PCB context): validate <span className="font-semibold text-gray-800">price rules</span>,{" "}
                              <span className="font-semibold text-gray-800">MOQ/slabs</span>,{" "}
                              <span className="font-semibold text-gray-800">COA/MSDS</span>,{" "}
                              and ensure materials map to required{" "}
                              <span className="font-semibold text-gray-800">work orders & routing</span>.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-4">
                        <div className="rounded-xl border bg-white p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Package className="h-4 w-4 text-gray-600" />
                            Totals
                          </div>

                          <div className="mt-3 space-y-2 text-sm">
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

                            <div className="my-2 border-t pt-2" />

                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">Grand Total</span>
                              <span className="text-lg font-extrabold text-gray-900">{money(totals?.grandTotal)}</span>
                            </div>
                          </div>
                        </div>

                        {selectedPO.status === "PENDING_APPROVAL" ? (
                          <div className="rounded-xl border bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <BadgeCheck className="h-4 w-4 text-gray-600" />
                              Decision
                            </div>

                            <div className="mt-3 flex flex-col gap-2">
                              <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={busyId === selectedPO.id}
                                onClick={() => setApproveConfirm({ open: true, id: selectedPO.id })}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve PO
                              </Button>

                              <div className="rounded-xl border bg-gray-50 p-3">
                                <Label className="text-xs text-gray-500">Rejection reason</Label>
                                <textarea
                                  className="mt-1 min-h-[70px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Example: Rate above approved price rule. Please revise."
                                />
                                <Button
                                  variant="outline"
                                  className="mt-2 w-full text-rose-700"
                                  disabled={busyId === selectedPO.id}
                                  onClick={() => setRejectConfirm({ open: true, id: selectedPO.id })}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject PO
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <CheckCircle2 className="h-4 w-4 text-gray-600" />
                              Decision Complete
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              Status: <span className="font-semibold">{selectedPO.status}</span>
                            </div>
                            {selectedPO.status === "REJECTED" && selectedPO.rejectedReason ? (
                              <div className="mt-2 text-sm text-gray-700">
                                Reason: <span className="font-semibold">{selectedPO.rejectedReason}</span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirm approve */}
      <ConfirmationDialog
        open={approveConfirm.open}
        title="Approve this Purchase Order?"
        description="This will mark the PO as APPROVED and allow downstream GRN / receiving."
        confirmText="Approve"
        confirmVariant="default"
        onOpenChange={(open) => setApproveConfirm((p) => ({ ...p, open }))}
        onConfirm={() => doApprove(approveConfirm.id)}
      />

      {/* Confirm reject */}
      <ConfirmationDialog
        open={rejectConfirm.open}
        title="Reject this Purchase Order?"
        description="The requester will need to revise and resubmit the PO."
        confirmText="Reject"
        confirmVariant="destructive"
        onOpenChange={(open) => setRejectConfirm((p) => ({ ...p, open }))}
        onConfirm={() => doReject(rejectConfirm.id)}
      />
    </>
  );
}
