// src/pages/procurement/suppliers/SupplierEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronLeft,
  Factory,
  FileCheck2,
  Globe,
  Hash,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

// If you already have a supplier service, wire it here.
// import suppliersService from "@/services/suppliers.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

function onlyDigits(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

function gstinLooksValid(v) {
  const s = String(v || "").trim().toUpperCase();
  return /^[0-9]{2}[A-Z0-9]{13}$/.test(s);
}

const PCB_CATEGORIES = [
  "Laminate / Prepreg",
  "Copper Foil",
  "Chemicals (Etch/Strip/Plating)",
  "Drill Bits / Tools",
  "Soldermask / Ink",
  "Packaging",
  "Outsource Service (Surface Finish)",
  "Outsource Service (Testing)",
  "Machinery Spares",
  "General Consumables",
];

const EMPTY_FORM = {
  name: "",
  code: "",
  category: "Laminate / Prepreg",
  supplierType: "Material", // Material | Service | Both
  status: "ACTIVE", // ACTIVE | INACTIVE | BLACKLISTED
  email: "",
  phone: "",
  website: "",

  gstin: "",
  pan: "",
  msme: "",
  paymentTerms: "Net 30",
  incoterm: "EXW",
  leadTimeDays: 7,
  minimumOrderValue: 0,

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",

  shipFromSameAsAddress: true,
  shipFromLine1: "",
  shipFromLine2: "",
  shipFromCity: "",
  shipFromState: "",
  shipFromCountry: "India",
  shipFromPincode: "",

  contactName: "",
  contactRole: "Sales",
  contactPhone: "",
  contactEmail: "",

  complianceMsds: false,
  complianceRohs: false,
  complianceReach: false,
  complianceIso9001: false,

  notes: "",
};

function mapApiToForm(data) {
  const d = data || {};
  return {
    ...EMPTY_FORM,
    ...d,
    leadTimeDays: Number(d.leadTimeDays ?? EMPTY_FORM.leadTimeDays),
    minimumOrderValue: Number(d.minimumOrderValue ?? EMPTY_FORM.minimumOrderValue),
    shipFromSameAsAddress: Boolean(d.shipFromSameAsAddress ?? true),
    gstin: (d.gstin || "").toUpperCase(),
    code: (d.code || "").toUpperCase(),
  };
}

function mapFormToPayload(form) {
  return {
    ...form,
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    gstin: form.gstin.trim().toUpperCase(),
    phone: onlyDigits(form.phone),
    contactPhone: onlyDigits(form.contactPhone),
  };
}

export default function SupplierEdit() {
  const navigate = useNavigate();
  const { id } = useParams(); // route: /procurement/suppliers/:id/edit (example)
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);

  // Optional doc placeholders
  const [docs, setDocs] = useState({
    msds: null,
    rohs: null,
    reach: null,
    iso: null,
  });

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Supplier name is required.";
    if (!form.code.trim()) e.code = "Supplier code is required.";
    if (form.email && !isEmail(form.email)) e.email = "Invalid email format.";
    if (form.contactEmail && !isEmail(form.contactEmail)) e.contactEmail = "Invalid contact email format.";

    const phone = onlyDigits(form.phone);
    if (form.phone && phone.length < 10) e.phone = "Phone should be at least 10 digits.";

    const cphone = onlyDigits(form.contactPhone);
    if (form.contactPhone && cphone.length < 10) e.contactPhone = "Contact phone should be at least 10 digits.";

    if (form.gstin && !gstinLooksValid(form.gstin)) e.gstin = "GSTIN should be 15 characters (basic format check).";

    if (!form.addressLine1.trim()) e.addressLine1 = "Address Line 1 is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.state.trim()) e.state = "State is required.";
    if (!String(form.pincode || "").trim()) e.pincode = "Pincode is required.";

    const ltd = Number(form.leadTimeDays);
    if (Number.isNaN(ltd) || ltd < 0) e.leadTimeDays = "Lead time must be 0 or greater.";

    const mov = Number(form.minimumOrderValue);
    if (Number.isNaN(mov) || mov < 0) e.minimumOrderValue = "Minimum order value must be 0 or greater.";

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const applyShipFromSame = (checked) => {
    setForm((p) => {
      if (!checked) return { ...p, shipFromSameAsAddress: false };
      return {
        ...p,
        shipFromSameAsAddress: true,
        shipFromLine1: p.addressLine1,
        shipFromLine2: p.addressLine2,
        shipFromCity: p.city,
        shipFromState: p.state,
        shipFromCountry: p.country,
        shipFromPincode: p.pincode,
      };
    });
  };

  // Load supplier
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // Wire to backend:
        // const res = await suppliersService.getById(id);
        // const data = res.data;

        // Mock load
        await new Promise((r) => setTimeout(r, 350));
        const data = {
          id,
          name: "LaminatePro",
          code: "SUP-LAM-001",
          category: "Laminate / Prepreg",
          supplierType: "Material",
          status: "ACTIVE",
          email: "sales@laminatepro.com",
          phone: "9876543210",
          website: "https://laminatepro.com",
          gstin: "32ABCDE1234F1Z5",
          pan: "ABCDE1234F",
          msme: "",
          paymentTerms: "Net 30",
          incoterm: "EXW",
          leadTimeDays: 7,
          minimumOrderValue: 0,
          addressLine1: "Industrial Area, Phase 2",
          addressLine2: "",
          city: "Kochi",
          state: "Kerala",
          country: "India",
          pincode: "682037",
          shipFromSameAsAddress: true,
          contactName: "Arun S",
          contactRole: "Sales",
          contactPhone: "9876543210",
          contactEmail: "arun@laminatepro.com",
          complianceMsds: false,
          complianceRohs: true,
          complianceReach: true,
          complianceIso9001: true,
          notes: "Approved vendor for FR4 1.6mm / 2oz.",
        };

        if (!mounted) return;
        setForm(mapApiToForm(data));
      } catch (err) {
        toast({
          title: "Failed to load supplier",
          description: err?.response?.data?.message || "Unable to fetch supplier details.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const onSave = async () => {
    if (!isValid) {
      toast({
        title: "Fix validation errors",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const payload = mapFormToPayload(form);

      // Wire to backend:
      // await suppliersService.update(id, payload);

      // Mock save
      await new Promise((r) => setTimeout(r, 450));

      toast({
        title: "Supplier updated",
        description: `${payload.name} (${payload.code}) saved successfully.`,
      });

      setConfirmSaveOpen(false);
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      // Wire to backend:
      // await suppliersService.remove(id);

      await new Promise((r) => setTimeout(r, 450));

      toast({
        title: "Supplier deleted",
        description: "Supplier removed successfully.",
      });

      navigate("/procurement/suppliers", { replace: true });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Unable to delete supplier.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setConfirmDeleteOpen(false);
    }
  };

  const goBack = () => navigate(-1);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="text-sm text-gray-500">Procurement • Suppliers</div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Edit Supplier</h1>
              <div className="mt-1 text-xs text-gray-500">ID: {id}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/procurement/suppliers")}
              disabled={busy}
              className="text-gray-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={busy}
              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>

            <Button
              onClick={() => setConfirmSaveOpen(true)}
              disabled={busy || !isValid || loading}
              className="bg-[#dc2551] hover:bg-[#b02045]"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-8 shadow-sm">
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
                <CardDescription>Please wait</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Loading supplier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 w-full animate-pulse rounded-xl bg-gray-100" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Main form */}
            <Card className="lg:col-span-8 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-700" />
                  Supplier Information
                </CardTitle>
                <CardDescription>Update supplier details for PCBxpress procurement</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Basic */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Supplier Name *</Label>
                    <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
                    {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Supplier Code *</Label>
                    <Input value={form.code} onChange={(e) => setField("code", e.target.value)} />
                    {errors.code ? <p className="text-xs text-rose-600">{errors.code}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                    >
                      {PCB_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Supplier Type</Label>
                    <select
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={form.supplierType}
                      onChange={(e) => setField("supplierType", e.target.value)}
                    >
                      <option value="Material">Material</option>
                      <option value="Service">Service</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="BLACKLISTED">BLACKLISTED</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Website</Label>
                    <div className="relative">
                      <Globe className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input className="pl-9" value={form.website} onChange={(e) => setField("website", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input className="pl-9" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                    </div>
                    {errors.email ? <p className="text-xs text-rose-600">{errors.email}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input className="pl-9" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                    </div>
                    {errors.phone ? <p className="text-xs text-rose-600">{errors.phone}</p> : null}
                  </div>
                </div>

                {/* Commercial */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Truck className="h-4 w-4 text-gray-600" />
                    Commercial Terms
                    <Badge className="ml-2 rounded-full border bg-white text-[11px] text-gray-700">PO defaults</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Input value={form.paymentTerms} onChange={(e) => setField("paymentTerms", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Incoterm</Label>
                      <Input value={form.incoterm} onChange={(e) => setField("incoterm", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Lead Time (days)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.leadTimeDays}
                        onChange={(e) => setField("leadTimeDays", e.target.value)}
                      />
                      {errors.leadTimeDays ? <p className="text-xs text-rose-600">{errors.leadTimeDays}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label>Minimum Order Value</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.minimumOrderValue}
                        onChange={(e) => setField("minimumOrderValue", e.target.value)}
                      />
                      {errors.minimumOrderValue ? <p className="text-xs text-rose-600">{errors.minimumOrderValue}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label>GSTIN</Label>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input className="pl-9" value={form.gstin} onChange={(e) => setField("gstin", e.target.value)} />
                      </div>
                      {errors.gstin ? <p className="text-xs text-rose-600">{errors.gstin}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label>PAN</Label>
                      <Input value={form.pan} onChange={(e) => setField("pan", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>MSME</Label>
                      <Input value={form.msme} onChange={(e) => setField("msme", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    Address (Billing / Registered) *
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Address Line 1 *</Label>
                      <Input value={form.addressLine1} onChange={(e) => setField("addressLine1", e.target.value)} />
                      {errors.addressLine1 ? <p className="text-xs text-rose-600">{errors.addressLine1}</p> : null}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Address Line 2</Label>
                      <Input value={form.addressLine2} onChange={(e) => setField("addressLine2", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
                      {errors.city ? <p className="text-xs text-rose-600">{errors.city}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input value={form.state} onChange={(e) => setField("state", e.target.value)} />
                      {errors.state ? <p className="text-xs text-rose-600">{errors.state}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input value={form.country} onChange={(e) => setField("country", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Pincode *</Label>
                      <Input value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} />
                      {errors.pincode ? <p className="text-xs text-rose-600">{errors.pincode}</p> : null}
                    </div>
                  </div>
                </div>

                {/* Ship From */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Factory className="h-4 w-4 text-gray-600" />
                      Ship From (Dispatch Location)
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={form.shipFromSameAsAddress}
                        onChange={(e) => applyShipFromSame(e.target.checked)}
                      />
                      Same as Address
                    </label>
                  </div>

                  {!form.shipFromSameAsAddress ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Ship From Line 1</Label>
                        <Input value={form.shipFromLine1} onChange={(e) => setField("shipFromLine1", e.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Ship From Line 2</Label>
                        <Input value={form.shipFromLine2} onChange={(e) => setField("shipFromLine2", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={form.shipFromCity} onChange={(e) => setField("shipFromCity", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input value={form.shipFromState} onChange={(e) => setField("shipFromState", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={form.shipFromCountry} onChange={(e) => setField("shipFromCountry", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Pincode</Label>
                        <Input value={form.shipFromPincode} onChange={(e) => setField("shipFromPincode", e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-600">
                      Dispatch location is copied from Address. Uncheck “Same as Address” to edit.
                    </div>
                  )}
                </div>

                {/* Primary Contact */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <ShieldCheck className="h-4 w-4 text-gray-600" />
                    Primary Contact
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input value={form.contactName} onChange={(e) => setField("contactName", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input value={form.contactRole} onChange={(e) => setField("contactRole", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-9"
                          value={form.contactPhone}
                          onChange={(e) => setField("contactPhone", e.target.value)}
                        />
                      </div>
                      {errors.contactPhone ? <p className="text-xs text-rose-600">{errors.contactPhone}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          className="pl-9"
                          value={form.contactEmail}
                          onChange={(e) => setField("contactEmail", e.target.value)}
                        />
                      </div>
                      {errors.contactEmail ? <p className="text-xs text-rose-600">{errors.contactEmail}</p> : null}
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <FileCheck2 className="h-4 w-4 text-gray-600" />
                    Compliance (PCB)
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-xl border bg-white p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                        checked={form.complianceMsds}
                        onChange={(e) => setField("complianceMsds", e.target.checked)}
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">MSDS Available</div>
                        <div className="text-xs text-gray-500">For chemicals, keep MSDS on file.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-xl border bg-white p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                        checked={form.complianceRohs}
                        onChange={(e) => setField("complianceRohs", e.target.checked)}
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">RoHS Compliant</div>
                        <div className="text-xs text-gray-500">Material declaration available.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-xl border bg-white p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                        checked={form.complianceReach}
                        onChange={(e) => setField("complianceReach", e.target.checked)}
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">REACH</div>
                        <div className="text-xs text-gray-500">SVHC / REACH statements if applicable.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-xl border bg-white p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                        checked={form.complianceIso9001}
                        onChange={(e) => setField("complianceIso9001", e.target.checked)}
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">ISO 9001</div>
                        <div className="text-xs text-gray-500">Quality system certificate.</div>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">MSDS</div>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <Upload className="h-4 w-4" />
                          <span>Upload</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setDocs((p) => ({ ...p, msds: e.target.files?.[0] || null }))}
                          />
                        </label>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{docs.msds ? docs.msds.name : "No file selected"}</div>
                    </div>

                    <div className="rounded-xl border bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">RoHS / REACH</div>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <Upload className="h-4 w-4" />
                          <span>Upload</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setDocs((p) => ({ ...p, rohs: e.target.files?.[0] || null }))}
                          />
                        </label>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{docs.rohs ? docs.rohs.name : "No file selected"}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    Upload is optional in UI; connect to backend multipart upload later.
                  </div>
                </div>

                {/* Notes */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                      N
                    </span>
                    Notes
                  </div>
                  <textarea
                    className="min-h-[90px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Vendor remarks, QA requirements, COA history, delivery constraints..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right: Summary */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-gray-700" />
                    Summary
                  </CardTitle>
                  <CardDescription>Quick review before saving</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-xl border bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Supplier</div>
                    <div className="mt-1 font-semibold text-gray-900">{form.name || "-"}</div>
                    <div className="mt-1 text-xs text-gray-600">{form.code ? form.code.toUpperCase() : "-"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border bg-white p-3">
                      <div className="text-xs text-gray-500">Category</div>
                      <div className="mt-1 font-semibold text-gray-900">{form.category}</div>
                    </div>
                    <div className="rounded-xl border bg-white p-3">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="mt-1 font-semibold text-gray-900">{form.status}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-xs text-gray-500">Terms</div>
                    <div className="mt-1 font-semibold text-gray-900">{form.paymentTerms || "-"}</div>
                    <div className="mt-1 text-xs text-gray-600">Incoterm: {form.incoterm || "-"}</div>
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-xs text-gray-500">Lead Time</div>
                    <div className="mt-1 font-semibold text-gray-900">{Number(form.leadTimeDays || 0)} days</div>
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-xs text-gray-500">Compliance</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.complianceMsds ? (
                        <Badge className="rounded-full border bg-emerald-50 text-emerald-700">MSDS</Badge>
                      ) : null}
                      {form.complianceRohs ? (
                        <Badge className="rounded-full border bg-emerald-50 text-emerald-700">RoHS</Badge>
                      ) : null}
                      {form.complianceReach ? (
                        <Badge className="rounded-full border bg-emerald-50 text-emerald-700">REACH</Badge>
                      ) : null}
                      {form.complianceIso9001 ? (
                        <Badge className="rounded-full border bg-emerald-50 text-emerald-700">ISO 9001</Badge>
                      ) : null}
                      {!form.complianceMsds &&
                      !form.complianceRohs &&
                      !form.complianceReach &&
                      !form.complianceIso9001 ? (
                        <Badge className="rounded-full border bg-gray-50 text-gray-700">None</Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation block */}
              {!isValid ? (
                <Card className="border-rose-200 bg-rose-50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base text-rose-800">Validation issues</CardTitle>
                    <CardDescription className="text-rose-700">
                      Fix these to save changes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-rose-800">
                    {Object.values(errors)
                      .slice(0, 7)
                      .map((msg, i) => (
                        <div key={i}>• {msg}</div>
                      ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </motion.div>

      {/* Save confirmation */}
      <ConfirmationDialog
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title="Save changes?"
        description="This will update supplier information and affect future RFQs/POs."
        confirmText={busy ? "Saving..." : "Save"}
        onConfirm={onSave}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete supplier?"
        description="This action cannot be undone. Existing POs will keep historical references."
        confirmText={busy ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={onDelete}
      />
    </>
  );
}
