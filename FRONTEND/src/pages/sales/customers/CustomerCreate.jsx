// src/pages/sales/customers/CustomerCreate.jsx
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    CreditCard,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    ShieldCheck
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

const DEFAULTS = {
  // Identity
  name: "",
  companyName: "",
  customerCode: "",

  // Contact
  email: "",
  phone: "",
  website: "",

  // Tax
  gstin: "",
  pan: "",

  // Status
  status: "ACTIVE",

  // Addresses
  billing: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
  shipping: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },

  // Commercial
  credit: {
    creditLimit: "",
    paymentTermsDays: "",
    currency: "INR",
  },

  // Compliance
  compliance: {
    ndaRequired: false,
    ipSensitive: false,
    exportRestricted: false,
  },

  // PCB Preferences
  preferences: {
    preferredFinish: "",
    preferredCopperOz: "",
    preferredSolderMask: "",
    preferredLegend: "",
    preferredPackaging: "",
    preferredCourier: "",
  },

  notes: "",
};

function sanitizePayload(form) {
  const trim = (v) => (typeof v === "string" ? v.trim() : v);

  const payload = {
    name: trim(form.name),
    companyName: trim(form.companyName),
    customerCode: trim(form.customerCode),

    email: trim(form.email),
    phone: trim(form.phone),
    website: trim(form.website),

    gstin: trim(form.gstin),
    pan: trim(form.pan),

    status: form.status || "ACTIVE",

    billing: {
      addressLine1: trim(form.billing.addressLine1),
      addressLine2: trim(form.billing.addressLine2),
      city: trim(form.billing.city),
      state: trim(form.billing.state),
      pincode: trim(form.billing.pincode),
      country: trim(form.billing.country) || "India",
    },
    shipping: {
      addressLine1: trim(form.shipping.addressLine1),
      addressLine2: trim(form.shipping.addressLine2),
      city: trim(form.shipping.city),
      state: trim(form.shipping.state),
      pincode: trim(form.shipping.pincode),
      country: trim(form.shipping.country) || "India",
    },

    credit: {
      creditLimit: form.credit.creditLimit === "" ? null : Number(form.credit.creditLimit),
      paymentTermsDays: form.credit.paymentTermsDays === "" ? null : Number(form.credit.paymentTermsDays),
      currency: trim(form.credit.currency) || "INR",
    },

    compliance: { ...form.compliance },
    preferences: { ...form.preferences },

    notes: trim(form.notes),
  };

  // Remove empty optional fields if you prefer a cleaner backend payload:
  // (Keeping as-is is fine too.)
  return payload;
}

export default function CustomerCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const generateCustomerCode = () => {
    // Generate a more unique code using timestamp + random + additional entropy
    const timestamp = Date.now().toString(36).toUpperCase();
    const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 4).toUpperCase();
    const entropy = Math.floor(Math.random() * 1000).toString(36).toUpperCase();
    return `CUST-${timestamp}${random1}${random2}${entropy}`;
  };

  const handleGenerateCode = () => {
    const newCode = generateCustomerCode();
    setForm(prev => ({
      ...prev,
      customerCode: newCode
    }));
    // Clear any existing error for customer code
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.customerCode;
      return newErrors;
    });
  };

  const from = useMemo(() => {
    // allow redirect back if you came here from elsewhere
    const s = location.state;
    return (s && s.from) || "/sales/customers";
  }, [location.state]);

  const update = (path, value) => {
    // path examples: "name", "billing.city", "credit.creditLimit", "preferences.preferredFinish"
    setForm((prev) => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const toggle = (path) => update(path, !path.split(".").reduce((acc, k) => acc[k], form));

  const validate = () => {
    const newErrors = {};
    
    if (!form.name.trim() && !form.companyName.trim()) {
      newErrors.name = "Customer Name or Company Name is required";
      newErrors.companyName = "Customer Name or Company Name is required";
    }
    
    if (!form.email.trim() && !form.phone.trim()) {
      newErrors.email = "At least Email or Phone is required";
      newErrors.phone = "At least Email or Phone is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const extractFieldErrors = (errorResponse) => {
    const fieldErrors = {};
    
    // Handle different error response formats
    const errorData = errorResponse?.response?.data;
    
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      // Handle array of validation errors
      errorData.errors.forEach(error => {
        if (error.field) {
          fieldErrors[error.field] = error.message || error.defaultMessage;
        }
      });
    } else if (errorData?.message) {
      // Handle constraint violation messages
      const message = errorData.message;
      
      // Extract field names from constraint violation messages
      if (message.includes('chk_customer_gstin_format')) {
        fieldErrors.gstin = 'Invalid GSTIN format. Expected: 22AAAAA0000A1Z5';
      }
      if (message.includes('chk_customer_pan_format')) {
        fieldErrors.pan = 'Invalid PAN format. Expected: AAAAA0000A';
      }
      if (message.includes('chk_customer_pincode_format')) {
        fieldErrors['billing.pincode'] = 'Invalid billing pincode format. Expected: 6 digits';
        fieldErrors['shipping.pincode'] = 'Invalid shipping pincode format. Expected: 6 digits';
      }
      if (message.includes('chk_customer_credit_limit_positive')) {
        fieldErrors['credit.creditLimit'] = 'Credit limit must be positive';
      }
      if (message.includes('chk_customer_payment_terms_positive')) {
        fieldErrors['credit.paymentTermsDays'] = 'Payment terms must be positive';
      }
      
      // Handle duplicate key errors
      if (message.includes('customer_code')) {
        fieldErrors.customerCode = 'Customer code already exists';
      }
      if (message.includes('customers_email_key')) {
        fieldErrors.email = 'Email already exists';
      }
      if (message.includes('customers_phone_key')) {
        fieldErrors.phone = 'Phone number already exists';
      }
      if (message.includes('Customer name already exists')) {
        fieldErrors.name = 'Customer name already exists';
      }
      if (message.includes('Company name already exists')) {
        fieldErrors.companyName = 'Company name already exists';
      }
    }
    
    return fieldErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({}); // Clear previous errors
    
    try {
      const payload = sanitizePayload(form);
      const res = await customersService.create(payload);

      const created = res?.data?.data ?? res?.data;
      toast({
        title: "Customer created",
        description: `${created?.companyName || created?.name || "Customer"} added successfully.`,
      });

      // Go to details page if id exists, else back to list
      const newId = created?.id || created?._id;
      if (newId) navigate(`/sales/customers/${newId}`, { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        
        // Show a summary message
        const errorFields = Object.keys(fieldErrors);
        const summary = `Please fix the following fields: ${errorFields.join(", ")}`;
        toast({
          title: "Validation Error",
          description: summary,
          variant: "destructive"
        });
      } else {
        // Fallback to generic error message
        const msg =
          err?.response?.data?.message ||
          (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(", ") : null) ||
          "Failed to create customer. Please try again.";
        toast({ title: "Create failed", description: msg, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button asChild variant="ghost" className="h-8 px-2">
              <Link to={from} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <span className="text-gray-300">/</span>
            <span className="truncate">Create Customer</span>
          </div>

          <h1 className="mt-2 text-xl font-bold tracking-tight">New Customer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a customer profile used across RFQ → Quotation → Sales Order → Invoice, plus compliance & traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to={from}>Cancel</Link>
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-cyan-600 hover:bg-cyan-500"
            disabled={submitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Create
              </span>
            )}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-5 lg:col-span-2">
            {/* Identity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Identity
                </CardTitle>
                <CardDescription>Customer & company details.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Ramesh Kumar"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., PCBXpress Technologies Pvt Ltd"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    className={errors.companyName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.companyName && <p className="text-red-600 text-sm">{errors.companyName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerCode">Customer Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customerCode"
                      placeholder="e.g., CUST-0012"
                      value={form.customerCode}
                      onChange={(e) => update("customerCode", e.target.value)}
                      className={errors.customerCode ? "border-red-500 focus:border-red-500 focus:ring-red-500 flex-1" : "flex-1"}
                      readOnly={form.customerCode && form.customerCode.startsWith('CUST-')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateCode}
                      className="whitespace-nowrap"
                    >
                      Generate Code
                    </Button>
                  </div>
                  {errors.customerCode && <p className="text-red-600 text-sm">{errors.customerCode}</p>}
                  <p className="text-xs text-gray-500">
                    {form.customerCode && form.customerCode.startsWith('CUST-')
                      ? "Auto-generated code (read-only)"
                      : "Customer code will be auto-generated if left empty"
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {["ACTIVE", "INACTIVE", "BLOCKED"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update("status", s)}
                        className={cx(
                          "rounded-xl border px-3 py-1.5 text-sm transition",
                          form.status === s
                            ? "border-[#dc2551]/40 bg-[#dc2551]/10 text-[#dc2551]"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {s === "ACTIVE" ? "Active" : s === "INACTIVE" ? "Inactive" : "Blocked"}
                      </button>
                    ))}
                    <Badge variant="outline" className="text-[11px]">
                      Used for credit control & approvals
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Contact
                </CardTitle>
                <CardDescription>At least one of Email or Phone is required.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="purchasing@customer.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={`pl-9 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      placeholder="+91 9XXXXXXXXX"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={`pl-9 ${errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    placeholder="https://customer.com"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tax */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-gray-500" />
                  Tax & Compliance IDs
                </CardTitle>
                <CardDescription>Used for invoicing and verification.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (optional)</Label>
                  <Input
                    id="gstin"
                    placeholder="22AAAAA0000A1Z5"
                    value={form.gstin}
                    onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                    className={errors.gstin ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.gstin && <p className="text-red-600 text-sm">{errors.gstin}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN (optional)</Label>
                  <Input
                    id="pan"
                    placeholder="AAAAA0000A"
                    value={form.pan}
                    onChange={(e) => update("pan", e.target.value.toUpperCase())}
                    className={errors.pan ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.pan && <p className="text-red-600 text-sm">{errors.pan}</p>}
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
              <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Billing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Billing</p>
                    <Badge variant="outline" className="text-[11px]">Invoice</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Address Line 1</Label>
                    <Input
                      value={form.billing.addressLine1}
                      onChange={(e) => update("billing.addressLine1", e.target.value)}
                      placeholder="Street / Building"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={form.billing.addressLine2}
                      onChange={(e) => update("billing.addressLine2", e.target.value)}
                      placeholder="Area / Landmark"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={form.billing.city}
                        onChange={(e) => update("billing.city", e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={form.billing.state}
                        onChange={(e) => update("billing.state", e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input
                        value={form.billing.pincode}
                        onChange={(e) => update("billing.pincode", e.target.value)}
                        placeholder="6-digit"
                        className={errors['billing.pincode'] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                      />
                      {errors['billing.pincode'] && <p className="text-red-600 text-sm">{errors['billing.pincode']}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={form.billing.country}
                        onChange={(e) => update("billing.country", e.target.value)}
                        placeholder="India"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Shipping</p>
                    <Badge variant="outline" className="text-[11px]">Dispatch</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Address Line 1</Label>
                    <Input
                      value={form.shipping.addressLine1}
                      onChange={(e) => update("shipping.addressLine1", e.target.value)}
                      placeholder="Street / Building"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={form.shipping.addressLine2}
                      onChange={(e) => update("shipping.addressLine2", e.target.value)}
                      placeholder="Area / Landmark"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={form.shipping.city}
                        onChange={(e) => update("shipping.city", e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={form.shipping.state}
                        onChange={(e) => update("shipping.state", e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input
                        value={form.shipping.pincode}
                        onChange={(e) => update("shipping.pincode", e.target.value)}
                        placeholder="6-digit"
                        className={errors['shipping.pincode'] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                      />
                      {errors['shipping.pincode'] && <p className="text-red-600 text-sm">{errors['shipping.pincode']}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={form.shipping.country}
                        onChange={(e) => update("shipping.country", e.target.value)}
                        placeholder="India"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => update("shipping", { ...form.billing })}
                    >
                      Copy Billing → Shipping
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-5">
            {/* Credit */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Credit & Terms
                </CardTitle>
                <CardDescription>Optional. Used for approvals & invoice holds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Credit Limit</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 250000"
                    value={form.credit.creditLimit}
                    onChange={(e) => update("credit.creditLimit", e.target.value)}
                    className={errors['credit.creditLimit'] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors['credit.creditLimit'] && <p className="text-red-600 text-sm">{errors['credit.creditLimit']}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms (Days)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 30"
                    value={form.credit.paymentTermsDays}
                    onChange={(e) => update("credit.paymentTermsDays", e.target.value)}
                    className={errors['credit.paymentTermsDays'] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors['credit.paymentTermsDays'] && <p className="text-red-600 text-sm">{errors['credit.paymentTermsDays']}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    placeholder="INR"
                    value={form.credit.currency}
                    onChange={(e) => update("credit.currency", e.target.value.toUpperCase())}
                  />
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
                <CardDescription>Helps control access & approvals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: "ndaRequired", label: "NDA required" },
                  { key: "ipSensitive", label: "IP sensitive" },
                  { key: "exportRestricted", label: "Export restricted" },
                ].map((it) => (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => toggle(`compliance.${it.key}`)}
                    className={cx(
                      "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                      form.compliance[it.key] ? "border-[#dc2551]/40 bg-[#dc2551]/10" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800">{it.label}</span>
                      <Badge
                        variant="outline"
                        className={cx(
                          "text-[11px]",
                          form.compliance[it.key] ? "border-[#dc2551]/30 text-[#dc2551]" : ""
                        )}
                      >
                        {form.compliance[it.key] ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-gray-500" />
                  PCB Preferences
                </CardTitle>
                <CardDescription>Optional defaults for faster quotation & DFM.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Surface finish</Label>
                  <Input
                    placeholder="e.g., ENIG / HASL / OSP"
                    value={form.preferences.preferredFinish}
                    onChange={(e) => update("preferences.preferredFinish", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Copper (oz)</Label>
                  <Input
                    placeholder="e.g., 1 oz"
                    value={form.preferences.preferredCopperOz}
                    onChange={(e) => update("preferences.preferredCopperOz", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solder mask</Label>
                  <Input
                    placeholder="e.g., Green / Black / Blue"
                    value={form.preferences.preferredSolderMask}
                    onChange={(e) => update("preferences.preferredSolderMask", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Legend</Label>
                  <Input
                    placeholder="e.g., White"
                    value={form.preferences.preferredLegend}
                    onChange={(e) => update("preferences.preferredLegend", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Packaging</Label>
                  <Input
                    placeholder="e.g., Vacuum pack"
                    value={form.preferences.preferredPackaging}
                    onChange={(e) => update("preferences.preferredPackaging", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred courier</Label>
                  <Input
                    placeholder="e.g., DTDC / Blue Dart"
                    value={form.preferences.preferredCourier}
                    onChange={(e) => update("preferences.preferredCourier", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
                <CardDescription>Internal notes for sales/production coordination.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="min-h-[110px] w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#dc2551]/40"
                  placeholder="e.g., Preferred delivery slot, special handling, NDA on file..."
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* sticky footer for mobile submit */}
          <div className="lg:hidden">
            <div className="fixed bottom-4 left-0 right-0 z-20 px-4">
              <div className="mx-auto max-w-xl rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur">
                <Button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Create Customer"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
