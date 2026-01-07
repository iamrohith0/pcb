// src/pages/sales/customers/CustomerDetails.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    Building2,
    ClipboardCopy,
    CreditCard,
    ExternalLink,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Package,
    Pencil,
    Phone,
    ShieldCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import customersService from "@/services/sales/customers.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeText(v, fallback = "—") {
  const s = typeof v === "string" ? v.trim() : v;
  if (s === null || s === undefined || s === "") return fallback;
  return String(s);
}

function normalizeStatus(v) {
  const s = String(v || "ACTIVE").toUpperCase();
  if (["ACTIVE", "INACTIVE", "BLOCKED"].includes(s)) return s;
  return "ACTIVE";
}

function statusBadge(status) {
  const s = normalizeStatus(status);
  if (s === "ACTIVE") return { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (s === "INACTIVE") return { label: "Inactive", cls: "bg-gray-50 text-gray-700 border-gray-200" };
  return { label: "Blocked", cls: "bg-rose-50 text-rose-700 border-rose-200" };
}

function fmtMoney(amount, currency = "INR") {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-IN")}`;
  }
}

function addrLine(a) {
  if (!a) return "—";
  const parts = [a.addressLine1, a.addressLine2, a.city, a.state, a.pincode, a.country]
    .map((x) => (typeof x === "string" ? x.trim() : x))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function copyToClipboard(text) {
  if (!text) return Promise.resolve(false);
  if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  // fallback
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  // optional: delete flow (if your backend supports)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await customersService.get(id);
      const data = res?.data?.data ?? res?.data ?? {};
      setCustomer(data);
    } catch (err) {
      toast({
        title: "Failed to load customer",
        description: err?.response?.data?.message || "Customer not found or server error.",
        variant: "destructive",
      });
      navigate("/sales/customers", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const derived = useMemo(() => {
    const c = customer || {};

    const billing =
      c.billing ||
      (c.billingAddressLine1 || c.billingCity
        ? {
            addressLine1: c.billingAddressLine1,
            addressLine2: c.billingAddressLine2,
            city: c.billingCity,
            state: c.billingState,
            country: c.billingCountry || "India",
            pincode: c.billingPincode,
          }
        : null);

    const shipping =
      c.shipping ||
      (c.shippingAddressLine1 || c.shippingCity
        ? {
            addressLine1: c.shippingAddressLine1,
            addressLine2: c.shippingAddressLine2,
            city: c.shippingCity,
            state: c.shippingState,
            country: c.shippingCountry || "India",
            pincode: c.shippingPincode,
          }
        : null);

    const s = normalizeStatus(c.status);
    const badge = statusBadge(s);

    return {
      id: c.id ?? c._id ?? id,
      code: c.customerCode ?? c.code ?? "",
      status: s,
      statusBadge: badge,
      name: c.name ?? "",
      companyName: c.companyName ?? c.company ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      gstin: c.gstin ?? "",
      pan: c.pan ?? "",
      website: c.website ?? "",
      notes: c.notes ?? "",
      billing,
      shipping,
      credit: c.credit || { creditLimit: null, paymentTermsDays: null, currency: "INR" },
      compliance: c.compliance || { ndaRequired: false, ipSensitive: false, exportRestricted: false },
      preferences: c.preferences || {},
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }, [customer, id]);

  const title = derived.companyName || derived.name || "Customer";

  const handleCopy = async (text, label = "Copied") => {
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? label : "Copy failed",
      description: ok ? "Saved to clipboard." : "Your browser blocked clipboard access.",
      variant: ok ? "default" : "destructive",
    });
  };

  const handleDelete = async () => {
    // Optional delete support (only if your backend has it)
    setDeleting(true);
    try {
      await customersService.remove?.(id);
      toast({ title: "Customer deleted", description: "Customer removed successfully." });
      setDeleteOpen(false);
      navigate("/sales/customers");
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "This action may be restricted or not supported.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading customer...
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button asChild variant="ghost" className="h-8 px-2">
              <Link to="/dashboard/sales/customers" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <span className="text-gray-300">/</span>
            <span className="truncate">Customer Details</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
            <Badge variant="outline" className={cx("border", derived.statusBadge.cls)}>
              {derived.statusBadge.label}
            </Badge>
            {derived.code ? (
              <Badge variant="outline" className="text-[11px]">
                Code: {derived.code}
              </Badge>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Customer profile used across RFQ → Quotation → Sales Order → Invoice, plus compliance & traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/sales/customers/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/sales/rfq/new?customerId=${encodeURIComponent(id)}`)}
          >
            <FileText className="h-4 w-4" />
            New RFQ
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => navigate(`/sales/quotations/new?customerId=${encodeURIComponent(id)}`)}
          >
            <FileText className="h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Body */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: main */}
          <div className="space-y-5 lg:col-span-2">
            {/* Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Overview
                </CardTitle>
                <CardDescription>Primary contact and commercial identifiers.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Customer Name</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.name)}</p>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.companyName)}</p>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">Email</p>
                    {derived.email ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                        onClick={() => handleCopy(derived.email, "Email copied")}
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {safeText(derived.email)}
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">Phone</p>
                    {derived.phone ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                        onClick={() => handleCopy(derived.phone, "Phone copied")}
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {safeText(derived.phone)}
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">GSTIN</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.gstin)}</p>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">PAN</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.pan)}</p>
                </div>

                <div className="rounded-xl border bg-white p-3 md:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">Website</p>
                    {derived.website ? (
                      <a
                        href={derived.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.website)}</p>
                </div>

                <div className="rounded-xl border bg-white p-3 md:col-span-2">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-800">{safeText(derived.notes)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Addresses
                </CardTitle>
                <CardDescription>Billing for invoices, shipping for dispatch.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Billing Address</p>
                  <p className="mt-1 text-sm text-gray-900">{addrLine(derived.billing)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Shipping Address</p>
                  <p className="mt-1 text-sm text-gray-900">{addrLine(derived.shipping)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder: linked business docs (later wire to your API) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Linked Documents
                </CardTitle>
                <CardDescription>Quick access to customer’s RFQs, quotations, orders and invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">RFQs</p>
                    <p className="mt-1 text-sm text-gray-700">
                      Connect: <span className="font-medium">/sales/rfq</span> filter by customerId
                    </p>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">Quotations</p>
                    <p className="mt-1 text-sm text-gray-700">
                      Connect: <span className="font-medium">/sales/quotations</span> filter by customerId
                    </p>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">Sales Orders</p>
                    <p className="mt-1 text-sm text-gray-700">
                      Connect: <span className="font-medium">/sales/orders</span> filter by customerId
                    </p>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">Invoices</p>
                    <p className="mt-1 text-sm text-gray-700">
                      Connect: <span className="font-medium">/sales/invoices</span> filter by customerId
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/sales/rfq?customerId=${encodeURIComponent(id)}`)}
                  >
                    <FileText className="h-4 w-4" />
                    View RFQs
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/sales/quotations?customerId=${encodeURIComponent(id)}`)}
                  >
                    <FileText className="h-4 w-4" />
                    View Quotations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">
            {/* Credit terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Credit & Payment
                </CardTitle>
                <CardDescription>Payment risk settings for PCB orders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Credit Limit</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {fmtMoney(derived.credit?.creditLimit, derived.credit?.currency || "INR")}
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Payment Terms</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {derived.credit?.paymentTermsDays ? `${derived.credit.paymentTermsDays} days` : "—"}
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Currency</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.credit?.currency || "INR")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-gray-500" />
                  Compliance
                </CardTitle>
                <CardDescription>Controls access and approvals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: "ndaRequired", label: "NDA required", icon: BadgeCheck },
                  { key: "ipSensitive", label: "IP sensitive", icon: ShieldCheck },
                  { key: "exportRestricted", label: "Export restricted", icon: AlertTriangle },
                ].map((item) => {
                  const active = Boolean(derived.compliance?.[item.key]);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={cx(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                        active ? "border-[#dc2551]/30 bg-[#dc2551]/10" : "border-gray-200 bg-white"
                      )}
                    >
                      <span className="inline-flex items-center gap-2 text-gray-800">
                        <Icon className={cx("h-4 w-4", active ? "text-[#dc2551]" : "text-gray-400")} />
                        {item.label}
                      </span>
                      <Badge variant="outline" className={cx("text-[11px]", active ? "border-[#dc2551]/30 text-[#dc2551]" : "")}>
                        {active ? "Yes" : "No"}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-gray-500" />
                  PCB Preferences
                </CardTitle>
                <CardDescription>Defaults for faster quotation & DFM.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Surface finish</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.preferences?.preferredFinish)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Copper (oz)</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.preferences?.preferredCopperOz)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Solder mask</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.preferences?.preferredSolderMask)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Legend</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.preferences?.preferredLegend)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Packaging</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.preferences?.preferredPackaging)}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Preferred courier</p>
                  <p className="mt-1 font-medium text-gray-900">{safeText(derived.preferences?.preferredCourier)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Optional Danger Zone (only if delete exists) */}
            {typeof customersService.remove === "function" ? (
              <Card className="border-rose-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-rose-700">Danger Zone</CardTitle>
                  <CardDescription>Deleting a customer can affect RFQs, orders and invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => setDeleteOpen(true)}>
                    Delete Customer
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirm */}
      {typeof customersService.remove === "function" ? (
        <ConfirmationDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete this customer?"
          description="This will permanently remove the customer (and may break linked documents). Continue?"
          confirmText={deleting ? "Deleting..." : "Delete"}
          onConfirm={handleDelete}
          loading={deleting}
        />
      ) : null}
    </div>
  );
}
