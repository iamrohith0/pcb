// src/pages/sales/customers/CustomerEdit.jsx
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    User2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import customersService from "@/services/sales/customers.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function pickErrors(err) {
  const data = err?.response?.data;
  // supports: { errors: { field: "msg" } } OR { errors: [{field,message}] } OR { message: "..." }
  if (data?.errors && !Array.isArray(data.errors) && typeof data.errors === "object") return data.errors;
  if (Array.isArray(data?.errors)) {
    const map = {};
    data.errors.forEach((e) => {
      if (e?.field) map[e.field] = e.message || "Invalid value";
    });
    return map;
  }
  return {};
}

function normalizeStatus(v) {
  const s = String(v || "ACTIVE").toUpperCase();
  if (["ACTIVE", "INACTIVE", "BLOCKED"].includes(s)) return s;
  return "ACTIVE";
}

export default function CustomerEdit() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // server row (for header / diff)
  const [original, setOriginal] = useState(null);

  // form
  const [form, setForm] = useState({
    customerCode: "",
    name: "",
    companyName: "",
    email: "",
    phone: "",
    status: "ACTIVE",

    gstin: "",
    pan: "",
    website: "",
    notes: "",

    billing: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },
    shipping: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },

    credit: {
      creditLimit: "",
      paymentTermsDays: "30",
      currency: "INR",
    },

    compliance: {
      ndaRequired: false,
      ipSensitive: false,
      exportRestricted: false,
    },

    preferences: {
      preferredFinish: "",
      preferredCopperOz: "",
      preferredSolderMask: "",
      preferredLegend: "",
      preferredPackaging: "",
      preferredCourier: "",
    },
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const isDirty = useMemo(() => {
    if (!original) return false;

    const o = original;
    const f = form;

    const flat = (x) => JSON.stringify(x ?? {});
    return (
      String(o.customerCode || o.code || "") !== String(f.customerCode || "") ||
      String(o.name || "") !== String(f.name || "") ||
      String(o.companyName || o.company || "") !== String(f.companyName || "") ||
      String(o.email || "") !== String(f.email || "") ||
      String(o.phone || "") !== String(f.phone || "") ||
      normalizeStatus(o.status) !== normalizeStatus(f.status) ||
      String(o.gstin || "") !== String(f.gstin || "") ||
      String(o.pan || "") !== String(f.pan || "") ||
      String(o.website || "") !== String(f.website || "") ||
      String(o.notes || "") !== String(f.notes || "") ||
      flat(o.billing || pickAddress(o, "billing")) !== flat(f.billing) ||
      flat(o.shipping || pickAddress(o, "shipping")) !== flat(f.shipping) ||
      flat(o.credit || {}) !== flat(f.credit) ||
      flat(o.compliance || {}) !== flat(f.compliance) ||
      flat(o.preferences || {}) !== flat(f.preferences)
    );
  }, [original, form]);

  function pickAddress(obj, prefix) {
    // fallback if backend stores address flat
    return {
      addressLine1: obj?.[`${prefix}AddressLine1`] ?? "",
      addressLine2: obj?.[`${prefix}AddressLine2`] ?? "",
      city: obj?.[`${prefix}City`] ?? "",
      state: obj?.[`${prefix}State`] ?? "",
      country: obj?.[`${prefix}Country`] ?? "India",
      pincode: obj?.[`${prefix}Pincode`] ?? "",
    };
  }

  const setVal = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setNested = (group, key, value) => {
    setForm((prev) => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [key]: value },
    }));
    setFieldErrors((prev) => ({ ...prev, [`${group}.${key}`]: undefined }));
  };

  const toggleNested = (group, key) => {
    setForm((prev) => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [key]: !prev?.[group]?.[key] },
    }));
  };

  const loadCustomer = async () => {
    setLoading(true);
    setFieldErrors({});
    try {
      const res = await customersService.get(id);
      const data = res?.data?.data ?? res?.data ?? {};

      const billing = data.billing || pickAddress(data, "billing");
      const shipping = data.shipping || pickAddress(data, "shipping");

      const next = {
        customerCode: data.customerCode ?? data.code ?? "",
        name: data.name ?? "",
        companyName: data.companyName ?? data.company ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        status: normalizeStatus(data.status),

        gstin: data.gstin ?? "",
        pan: data.pan ?? "",
        website: data.website ?? "",
        notes: data.notes ?? "",

        billing: {
          addressLine1: billing.addressLine1 ?? "",
          addressLine2: billing.addressLine2 ?? "",
          city: billing.city ?? "",
          state: billing.state ?? "",
          country: billing.country ?? "India",
          pincode: billing.pincode ?? "",
        },
        shipping: {
          addressLine1: shipping.addressLine1 ?? "",
          addressLine2: shipping.addressLine2 ?? "",
          city: shipping.city ?? "",
          state: shipping.state ?? "",
          country: shipping.country ?? "India",
          pincode: shipping.pincode ?? "",
        },

        credit: {
          creditLimit: data.credit?.creditLimit ?? "",
          paymentTermsDays: data.credit?.paymentTermsDays ?? "30",
          currency: data.credit?.currency ?? "INR",
        },

        compliance: {
          ndaRequired: Boolean(data.compliance?.ndaRequired ?? false),
          ipSensitive: Boolean(data.compliance?.ipSensitive ?? false),
          exportRestricted: Boolean(data.compliance?.exportRestricted ?? false),
        },

        preferences: {
          preferredFinish: data.preferences?.preferredFinish ?? "",
          preferredCopperOz: data.preferences?.preferredCopperOz ?? "",
          preferredSolderMask: data.preferences?.preferredSolderMask ?? "",
          preferredLegend: data.preferences?.preferredLegend ?? "",
          preferredPackaging: data.preferences?.preferredPackaging ?? "",
          preferredCourier: data.preferences?.preferredCourier ?? "",
        },
      };

      setOriginal(data);
      setForm(next);
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
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Customer name is required.";
    if (!form.companyName?.trim()) errs.companyName = "Company name is required.";
    if (!form.email?.trim()) errs.email = "Email is required.";
    if (!form.phone?.trim()) errs.phone = "Phone is required.";

    // Basic GSTIN length check (India) - optional field
    if (form.gstin?.trim() && form.gstin.trim().length !== 15) errs.gstin = "GSTIN must be 15 characters.";

    // billing minimal
    if (!form.billing?.addressLine1?.trim()) errs["billing.addressLine1"] = "Billing address line 1 is required.";
    if (!form.billing?.city?.trim()) errs["billing.city"] = "Billing city is required.";
    if (!form.billing?.state?.trim()) errs["billing.state"] = "Billing state is required.";
    if (!form.billing?.pincode?.trim()) errs["billing.pincode"] = "Billing pincode is required.";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toPayload = () => {
    // keep payload clean: trim strings
    const t = (v) => (typeof v === "string" ? v.trim() : v);

    return {
      customerCode: t(form.customerCode),
      name: t(form.name),
      companyName: t(form.companyName),
      email: t(form.email),
      phone: t(form.phone),
      status: normalizeStatus(form.status),

      gstin: t(form.gstin),
      pan: t(form.pan),
      website: t(form.website),
      notes: t(form.notes),

      billing: {
        addressLine1: t(form.billing.addressLine1),
        addressLine2: t(form.billing.addressLine2),
        city: t(form.billing.city),
        state: t(form.billing.state),
        country: t(form.billing.country),
        pincode: t(form.billing.pincode),
      },
      shipping: {
        addressLine1: t(form.shipping.addressLine1),
        addressLine2: t(form.shipping.addressLine2),
        city: t(form.shipping.city),
        state: t(form.shipping.state),
        country: t(form.shipping.country),
        pincode: t(form.shipping.pincode),
      },

      credit: {
        creditLimit: form.credit.creditLimit === "" ? null : Number(form.credit.creditLimit),
        paymentTermsDays: form.credit.paymentTermsDays === "" ? null : Number(form.credit.paymentTermsDays),
        currency: t(form.credit.currency || "INR"),
      },

      compliance: {
        ndaRequired: Boolean(form.compliance.ndaRequired),
        ipSensitive: Boolean(form.compliance.ipSensitive),
        exportRestricted: Boolean(form.compliance.exportRestricted),
      },

      preferences: {
        preferredFinish: t(form.preferences.preferredFinish),
        preferredCopperOz: t(form.preferences.preferredCopperOz),
        preferredSolderMask: t(form.preferences.preferredSolderMask),
        preferredLegend: t(form.preferences.preferredLegend),
        preferredPackaging: t(form.preferences.preferredPackaging),
        preferredCourier: t(form.preferences.preferredCourier),
      },
    };
  };

  const save = async () => {
    if (saving) return;
    if (!validate()) {
      toast({ title: "Fix validation errors", description: "Please review the highlighted fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      await customersService.update(id, toPayload());
      toast({ title: "Customer updated", description: "Changes saved successfully." });
      setConfirmOpen(false);
      loadCustomer(); // refresh original + form
    } catch (err) {
      const errs = pickErrors(err);
      if (Object.keys(errs).length) setFieldErrors(errs);

      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Could not update customer.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyBillingToShipping = () => {
    setForm((prev) => ({ ...prev, shipping: { ...prev.billing } }));
    toast({ title: "Copied", description: "Billing address copied to shipping." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading customer...
      </div>
    );
  }

  const customerTitle = form.companyName || form.name || "Customer";

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
            <span className="truncate">Edit Customer</span>
          </div>

          <h1 className="mt-2 truncate text-xl font-bold tracking-tight">{customerTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update customer details used across RFQ, quotations, orders, invoices and traceability documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px]">
            ID: {id}
          </Badge>

          <Button
            onClick={() => (isDirty ? setConfirmOpen(true) : toast({ title: "No changes", description: "Nothing to save." }))}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: main */}
          <div className="space-y-5 lg:col-span-2">
            {/* Identity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Customer Identity
                </CardTitle>
                <CardDescription>Basic details and primary contact.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Customer Code (optional)</Label>
                  <Input
                    value={form.customerCode}
                    onChange={(e) => setVal("customerCode", e.target.value)}
                    placeholder="e.g., CUST-0007"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {["ACTIVE", "INACTIVE", "BLOCKED"].map((s) => {
                      const active = form.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setVal("status", s)}
                          className={cx(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                            active ? "border-[#dc2551] bg-[#dc2551]/10 text-[#dc2551]" : "border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Customer Name <span className="text-rose-600">*</span>
                  </Label>
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.name}
                      onChange={(e) => setVal("name", e.target.value)}
                      placeholder="Contact person / buyer name"
                      className={cx("pl-9", fieldErrors.name ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                    />
                  </div>
                  {fieldErrors.name ? <p className="text-xs text-rose-600">{fieldErrors.name}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Company Name <span className="text-rose-600">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.companyName}
                      onChange={(e) => setVal("companyName", e.target.value)}
                      placeholder="Customer company / OEM"
                      className={cx("pl-9", fieldErrors.companyName ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                    />
                  </div>
                  {fieldErrors.companyName ? <p className="text-xs text-rose-600">{fieldErrors.companyName}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Email <span className="text-rose-600">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.email}
                      onChange={(e) => setVal("email", e.target.value)}
                      placeholder="buyer@company.com"
                      className={cx("pl-9", fieldErrors.email ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                    />
                  </div>
                  {fieldErrors.email ? <p className="text-xs text-rose-600">{fieldErrors.email}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Phone <span className="text-rose-600">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.phone}
                      onChange={(e) => setVal("phone", e.target.value)}
                      placeholder="+91..."
                      className={cx("pl-9", fieldErrors.phone ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                    />
                  </div>
                  {fieldErrors.phone ? <p className="text-xs text-rose-600">{fieldErrors.phone}</p> : null}
                </div>
              </CardContent>
            </Card>

            {/* Tax & Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Tax & Commercial Info
                </CardTitle>
                <CardDescription>Used for invoicing, compliance and RFQ approvals.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>GSTIN (optional)</Label>
                  <Input
                    value={form.gstin}
                    onChange={(e) => setVal("gstin", e.target.value.toUpperCase())}
                    placeholder="15-char GSTIN"
                    className={cx(fieldErrors.gstin ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                  />
                  {fieldErrors.gstin ? <p className="text-xs text-rose-600">{fieldErrors.gstin}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>PAN (optional)</Label>
                  <Input
                    value={form.pan}
                    onChange={(e) => setVal("pan", e.target.value.toUpperCase())}
                    placeholder="PAN number"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Website (optional)</Label>
                  <Input value={form.website} onChange={(e) => setVal("website", e.target.value)} placeholder="https://..." />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setVal("notes", e.target.value)}
                    placeholder="Any special instructions (NDA, packaging, terms, etc.)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Billing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Billing Address
                </CardTitle>
                <CardDescription>Default billing address used for quotations and invoices.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>
                    Address Line 1 <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    value={form.billing.addressLine1}
                    onChange={(e) => setNested("billing", "addressLine1", e.target.value)}
                    placeholder="Street / Building"
                    className={cx(fieldErrors["billing.addressLine1"] ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                  />
                  {fieldErrors["billing.addressLine1"] ? (
                    <p className="text-xs text-rose-600">{fieldErrors["billing.addressLine1"]}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label>Address Line 2 (optional)</Label>
                  <Input
                    value={form.billing.addressLine2}
                    onChange={(e) => setNested("billing", "addressLine2", e.target.value)}
                    placeholder="Area / Landmark"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    City <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    value={form.billing.city}
                    onChange={(e) => setNested("billing", "city", e.target.value)}
                    placeholder="City"
                    className={cx(fieldErrors["billing.city"] ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                  />
                  {fieldErrors["billing.city"] ? <p className="text-xs text-rose-600">{fieldErrors["billing.city"]}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    State <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    value={form.billing.state}
                    onChange={(e) => setNested("billing", "state", e.target.value)}
                    placeholder="State"
                    className={cx(fieldErrors["billing.state"] ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                  />
                  {fieldErrors["billing.state"] ? (
                    <p className="text-xs text-rose-600">{fieldErrors["billing.state"]}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input
                    value={form.billing.country}
                    onChange={(e) => setNested("billing", "country", e.target.value)}
                    placeholder="India"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Pincode <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    value={form.billing.pincode}
                    onChange={(e) => setNested("billing", "pincode", e.target.value)}
                    placeholder="6-digit"
                    className={cx(fieldErrors["billing.pincode"] ? "border-rose-400 focus-visible:ring-rose-300" : "")}
                  />
                  {fieldErrors["billing.pincode"] ? (
                    <p className="text-xs text-rose-600">{fieldErrors["billing.pincode"]}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Shipping Address
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={copyBillingToShipping}>
                    Copy billing
                  </Button>
                </CardTitle>
                <CardDescription>Default shipping address used for dispatch.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={form.shipping.addressLine1}
                    onChange={(e) => setNested("shipping", "addressLine1", e.target.value)}
                    placeholder="Street / Building"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={form.shipping.addressLine2}
                    onChange={(e) => setNested("shipping", "addressLine2", e.target.value)}
                    placeholder="Area / Landmark"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={form.shipping.city} onChange={(e) => setNested("shipping", "city", e.target.value)} placeholder="City" />
                </div>

                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input
                    value={form.shipping.state}
                    onChange={(e) => setNested("shipping", "state", e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input
                    value={form.shipping.country}
                    onChange={(e) => setNested("shipping", "country", e.target.value)}
                    placeholder="India"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Pincode</Label>
                  <Input
                    value={form.shipping.pincode}
                    onChange={(e) => setNested("shipping", "pincode", e.target.value)}
                    placeholder="6-digit"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: sidebar cards */}
          <div className="space-y-5">
            {/* Credit Terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Credit Terms</CardTitle>
                <CardDescription>Controls payment and risk for PCB orders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Credit Limit</Label>
                  <Input
                    type="number"
                    value={form.credit.creditLimit}
                    onChange={(e) => setNested("credit", "creditLimit", e.target.value)}
                    placeholder="e.g., 250000"
                  />
                  <p className="text-[11px] text-gray-500">Leave empty for no limit / handled on backend policy.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Payment Terms (days)</Label>
                  <Input
                    type="number"
                    value={form.credit.paymentTermsDays}
                    onChange={(e) => setNested("credit", "paymentTermsDays", e.target.value)}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input value={form.credit.currency} onChange={(e) => setNested("credit", "currency", e.target.value)} placeholder="INR" />
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-gray-500" />
                  Compliance Flags
                </CardTitle>
                <CardDescription>For controlled data and export-sensitive projects.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: "ndaRequired", label: "NDA required for files / drawings" },
                  { key: "ipSensitive", label: "IP sensitive customer (restricted access)" },
                  { key: "exportRestricted", label: "Export restricted / special approvals" },
                ].map((item) => {
                  const active = Boolean(form.compliance[item.key]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleNested("compliance", item.key)}
                      className={cx(
                        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
                        active ? "border-[#dc2551]/40 bg-[#dc2551]/10" : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-gray-800">{item.label}</span>
                      {active ? <CheckCircle2 className="h-4 w-4 text-[#dc2551]" /> : <span className="h-4 w-4 rounded-full border border-gray-300" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* PCB Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-gray-500" />
                  PCB Preferences (optional)
                </CardTitle>
                <CardDescription>Helps speed up quotation and DFM defaults.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Surface finish</Label>
                  <Input
                    value={form.preferences.preferredFinish}
                    onChange={(e) => setNested("preferences", "preferredFinish", e.target.value)}
                    placeholder="ENIG / HASL / OSP..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Copper (oz)</Label>
                  <Input
                    value={form.preferences.preferredCopperOz}
                    onChange={(e) => setNested("preferences", "preferredCopperOz", e.target.value)}
                    placeholder="1 / 2 / 3..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Solder mask</Label>
                  <Input
                    value={form.preferences.preferredSolderMask}
                    onChange={(e) => setNested("preferences", "preferredSolderMask", e.target.value)}
                    placeholder="Green / Black / Blue..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Legend</Label>
                  <Input
                    value={form.preferences.preferredLegend}
                    onChange={(e) => setNested("preferences", "preferredLegend", e.target.value)}
                    placeholder="White / Yellow..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Packaging</Label>
                  <Input
                    value={form.preferences.preferredPackaging}
                    onChange={(e) => setNested("preferences", "preferredPackaging", e.target.value)}
                    placeholder="Vacuum pack / Bubble wrap..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred courier</Label>
                  <Input
                    value={form.preferences.preferredCourier}
                    onChange={(e) => setNested("preferences", "preferredCourier", e.target.value)}
                    placeholder="DHL / FedEx / BlueDart..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>Useful navigation from this customer.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button asChild variant="outline" className="justify-start gap-2">
                  <Link to={`/dashboard/sales/customers/${id}`}>
                    <User2 className="h-4 w-4" />
                    View customer
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => navigate(`/sales/rfq/new?customerId=${encodeURIComponent(id)}`)}
                >
                  <FileText className="h-4 w-4" />
                  Create RFQ
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => navigate(`/sales/quotations/new?customerId=${encodeURIComponent(id)}`)}
                >
                  <FileText className="h-4 w-4" />
                  Create Quotation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Confirm Save Dialog */}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Save changes?"
        description="You have unsaved edits. Do you want to update this customer now?"
        confirmText={saving ? "Saving..." : "Save"}
        onConfirm={save}
        loading={saving}
      />
    </div>
  );
}
