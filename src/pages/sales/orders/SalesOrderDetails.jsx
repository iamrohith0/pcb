// src/pages/sales/orders/SalesOrderDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  Download,
  Edit3,
  FileText,
  Loader2,
  PackageCheck,
  Printer,
  RefreshCw,
  Send,
  Trash2,
  Truck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import salesOrdersApi from "@/services/sales/salesOrders.service";

import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function money(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
}

function fmtDate(d) {
  if (!d) return "-";
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return String(d);
    return x.toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
}

function statusBadge(statusRaw) {
  const s = String(statusRaw || "Draft").toLowerCase();
  if (s.includes("draft")) return { label: "Draft", cls: "bg-gray-100 text-gray-800" };
  if (s.includes("submitted") || s.includes("intake")) return { label: "Submitted", cls: "bg-blue-100 text-blue-800" };
  if (s.includes("quoted")) return { label: "Quoted", cls: "bg-purple-100 text-purple-800" };
  if (s.includes("confirmed") || s.includes("approved")) return { label: "Confirmed", cls: "bg-emerald-100 text-emerald-800" };
  if (s.includes("in production") || s.includes("wip")) return { label: "In Production", cls: "bg-amber-100 text-amber-800" };
  if (s.includes("shipped") || s.includes("dispatch")) return { label: "Shipped", cls: "bg-indigo-100 text-indigo-800" };
  if (s.includes("delivered")) return { label: "Delivered", cls: "bg-green-100 text-green-800" };
  if (s.includes("cancel")) return { label: "Cancelled", cls: "bg-rose-100 text-rose-800" };
  return { label: statusRaw || "Draft", cls: "bg-gray-100 text-gray-800" };
}

export default function SalesOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const badge = useMemo(() => statusBadge(order?.status), [order?.status]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await salesOrdersApi.getById(id);
      const data = res?.data?.order ?? res?.data ?? null;
      setOrder(data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load Sales Order.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const lines = useMemo(() => {
    const raw = order?.items || order?.lines || [];
    return Array.isArray(raw) ? raw : [];
  }, [order]);

  const totals = useMemo(() => {
    const t = order?.totals || {};
    const sub = Number(t?.sub_total ?? t?.subTotal ?? 0);
    const tax = Number(t?.tax_total ?? t?.taxTotal ?? 0);
    const grand = Number(t?.grand_total ?? t?.grandTotal ?? 0);

    if (grand > 0 || sub > 0 || tax > 0) return { sub, tax, grand };

    // fallback compute if backend didn't send totals
    const rows = lines.map((it) => {
      const qty = Number(it.qty || 0);
      const unit = Number(it.unit_price ?? it.unitPrice ?? 0);
      const taxPct = Number(it.tax_pct ?? it.taxPct ?? 0);
      const base = qty * unit;
      const taxAmt = (base * taxPct) / 100;
      return { base, taxAmt, total: base + taxAmt };
    });
    return {
      sub: rows.reduce((a, r) => a + r.base, 0),
      tax: rows.reduce((a, r) => a + r.taxAmt, 0),
      grand: rows.reduce((a, r) => a + r.total, 0),
    };
  }, [order, lines]);

  // Actions (safe placeholders; you can wire to backend routes)
  const handleSubmitToEngineering = async () => {
    setActionLoading(true);
    try {
      // If backend supports it:
      // await salesOrdersApi.submitToEngineering(id);
      await salesOrdersApi.update(id, { status: "Submitted to Engineering" });

      toast({
        title: "Submitted",
        description: "Sales Order submitted to Engineering Intake.",
      });
      await fetchOrder();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit to engineering.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkConfirmed = async () => {
    setActionLoading(true);
    try {
      await salesOrdersApi.update(id, { status: "Confirmed" });
      toast({ title: "Confirmed", description: "Sales Order marked as Confirmed." });
      await fetchOrder();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to confirm order.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkShipped = async () => {
    setActionLoading(true);
    try {
      await salesOrdersApi.update(id, { status: "Shipped" });
      toast({ title: "Shipped", description: "Sales Order marked as Shipped." });
      await fetchOrder();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to mark shipped.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await salesOrdersApi.remove(id);
      toast({ title: "Deleted", description: "Sales Order deleted successfully." });
      navigate("/dashboard/sales/orders", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to delete Sales Order.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
      setDeleteOpen(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    try {
      // If backend offers PDF export:
      // const res = await salesOrdersApi.downloadPdf(id);
      // download file...
      toast({
        title: "PDF",
        description: "Hook backend endpoint: GET /sales/orders/:id/pdf to download.",
      });
    } catch (e) {
      toast({ title: "PDF failed", description: "Unable to download PDF.", variant: "destructive" });
    }
  };

  const headerTitle = order?.order_no || order?.orderNo || `Sales Order #${id}`;
  const customerName =
    order?.customer?.name ||
    order?.customer_name ||
    order?.customerName ||
    order?.customer?.company_name ||
    "-";

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
              <Badge className={cx("rounded-full", badge.cls)}>{badge.label}</Badge>
            </div>
            <p className="text-sm text-gray-500">
              PCBxpress • Sales → Orders • Order details & manufacturing handoff
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchOrder} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" className="gap-2" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4" />
            PDF
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={handleSubmitToEngineering}
            disabled={actionLoading || loading}
            title="Send Sales Order to Engineering Intake (DFM/CAM)"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to Engineering
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            asChild
            title="Edit (create this page later)"
          >
            <Link to={`/dashboard/sales/orders/${id}/edit`}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Printable header */}
      <div className="hidden print:block">
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#dc2551]" />
              <h2 className="text-lg font-bold">{headerTitle}</h2>
            </div>
            <p className="text-sm text-gray-600">Customer: {customerName}</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Order Date: {fmtDate(order?.order_date || order?.orderDate)}</div>
            <div>Status: {badge.label}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="border-dashed">
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Sales Order...
            </div>
          </CardContent>
        </Card>
      ) : !order ? (
        <Card className="border-dashed">
          <CardContent className="py-10">
            <p className="text-center text-sm text-gray-600">Sales Order not found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left (main) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-[#dc2551]" />
                  Order Information
                </CardTitle>
                <CardDescription className="text-sm">
                  Sales data used to start engineering intake (DFM/CAM), costing, and routing.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Sales Order No</p>
                  <p className="font-medium text-gray-900">{order?.order_no || order?.orderNo || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Order Date</p>
                  <p className="font-medium text-gray-900">{fmtDate(order?.order_date || order?.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PO Number</p>
                  <p className="font-medium text-gray-900">{order?.po?.number || order?.po_number || order?.poNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PO Date</p>
                  <p className="font-medium text-gray-900">{fmtDate(order?.po?.date || order?.po_date || order?.poDate)}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">Job / Project</p>
                  <p className="font-medium text-gray-900">{order?.job?.name || order?.job_name || order?.jobName || "-"}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <Badge className={cx("rounded-full", String(order?.job?.priority || order?.priority || "Normal") === "Urgent"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-gray-100 text-gray-800")}>
                    {order?.job?.priority || order?.priority || "Normal"}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Requested Delivery</p>
                  <p className="font-medium text-gray-900">{fmtDate(order?.job?.requested_delivery || order?.requested_delivery || order?.requestedDelivery)}</p>
                </div>

                {order?.notes ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{order.notes}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Line items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-[#dc2551]" />
                  Line Items
                </CardTitle>
                <CardDescription className="text-sm">
                  Typically used for PCB boards / panels / stencils / assembly services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!lines.length ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-600">
                    No line items.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border">
                    <div className="grid grid-cols-12 gap-3 border-b bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                      <div className="col-span-3">SKU</div>
                      <div className="col-span-4">Description</div>
                      <div className="col-span-1 text-right">Qty</div>
                      <div className="col-span-1">UOM</div>
                      <div className="col-span-1 text-right">Tax</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>

                    {lines.map((it, idx) => {
                      const sku = it.sku || "-";
                      const desc = it.description || "-";
                      const qty = Number(it.qty || 0);
                      const uom = it.uom || "pcs";

                      const unit = Number(it.unit_price ?? it.unitPrice ?? 0);
                      const taxPct = Number(it.tax_pct ?? it.taxPct ?? 0);
                      const base = qty * unit;
                      const taxAmt = (base * taxPct) / 100;
                      const total = base + taxAmt;

                      return (
                        <motion.div
                          key={it.id || idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-12 gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                        >
                          <div className="col-span-12 sm:col-span-3">
                            <p className="font-medium text-gray-900">{sku}</p>
                          </div>
                          <div className="col-span-12 sm:col-span-4">
                            <p className="text-gray-800">{desc}</p>
                            {it.lead_time_days || it.leadTimeDays ? (
                              <p className="mt-1 text-xs text-gray-500">
                                Lead time: {it.lead_time_days ?? it.leadTimeDays} days
                              </p>
                            ) : null}
                          </div>
                          <div className="col-span-4 sm:col-span-1 sm:text-right">
                            <p className="text-gray-800">{qty}</p>
                          </div>
                          <div className="col-span-4 sm:col-span-1">
                            <p className="text-gray-800">{uom}</p>
                          </div>
                          <div className="col-span-4 sm:col-span-1 sm:text-right">
                            <p className="text-gray-800">{taxPct}%</p>
                          </div>
                          <div className="col-span-12 sm:col-span-2 sm:text-right">
                            <p className="font-semibold text-gray-900">₹ {money(total)}</p>
                            <p className="text-xs text-gray-500">
                              {money(base)} + {money(taxAmt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Totals */}
                <div className="flex flex-col items-end gap-2 pt-2">
                  <div className="flex w-full max-w-sm items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">₹ {money(totals.sub)}</span>
                  </div>
                  <div className="flex w-full max-w-sm items-center justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">₹ {money(totals.tax)}</span>
                  </div>
                  <div className="flex w-full max-w-sm items-center justify-between rounded-lg bg-[#dc2551]/5 px-3 py-2">
                    <span className="text-sm font-semibold text-gray-900">Grand Total</span>
                    <span className="text-sm font-bold text-[#dc2551]">₹ {money(totals.grand)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Customer */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-[#dc2551]" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{customerName}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Contact</p>
                    <p className="text-sm text-gray-900">
                      {order?.contact?.name || order?.contact_name || "-"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {order?.contact?.phone || order?.contact_phone || "-"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {order?.contact?.email || order?.contact_email || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Shipping Address</p>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">
                      {order?.addresses?.shipping || order?.shipping_address || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Billing Address</p>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">
                      {order?.addresses?.billing || order?.billing_address || "-"}
                    </p>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/sales/customers">
                    <FileText className="h-4 w-4" />
                    View Customers
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Manufacturing handoff actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PackageCheck className="h-4 w-4 text-[#dc2551]" />
                  Manufacturing Actions
                </CardTitle>
                <CardDescription className="text-sm">
                  Move SO through Engineering → Production → Dispatch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                  onClick={handleSubmitToEngineering}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send to Engineering Intake
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleMarkConfirmed}
                  disabled={actionLoading}
                >
                  <FileText className="h-4 w-4" />
                  Mark Confirmed
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleMarkShipped}
                  disabled={actionLoading}
                >
                  <Truck className="h-4 w-4" />
                  Mark Shipped
                </Button>

                <p className="pt-1 text-xs text-gray-500">
                  Tip: After “Send to Engineering”, create DFM/CAM job, stackup, panelization & routing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Sales Order?"
        description="This action cannot be undone. This will permanently delete the Sales Order and its line items."
        confirmText={actionLoading ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
