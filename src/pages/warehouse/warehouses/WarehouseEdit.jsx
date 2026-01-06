// src/pages/warehouse/warehouses/WarehouseEdit.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Save,
  Trash2,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";

/**
 * PCBxpress ERP - Warehouse Edit
 * Route suggestion: /warehouse/warehouses/:id/edit
 *
 * Backend endpoints (recommended):
 * GET    /warehouse/warehouses/:id
 * PUT    /warehouse/warehouses/:id
 * DELETE /warehouse/warehouses/:id
 */

const EMPTY = {
  code: "",
  name: "",
  type: "RM", // RM | WIP | FG | TOOLING | CHEM | SCRAP | GENERAL
  status: "ACTIVE", // ACTIVE | INACTIVE
  plant_id: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  contact_person: "",
  phone: "",
  email: "",
  notes: "",
};

const TYPE_OPTIONS = [
  { value: "RM", label: "Raw Material (RM)" },
  { value: "WIP", label: "Work In Progress (WIP)" },
  { value: "FG", label: "Finished Goods (FG)" },
  { value: "TOOLING", label: "Tooling & Fixtures" },
  { value: "CHEM", label: "Chemicals" },
  { value: "SCRAP", label: "Scrap / Rework Hold" },
  { value: "GENERAL", label: "General" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function isEmail(v) {
  if (!v) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isIndianPincode(v) {
  if (!v) return true; // optional
  return /^[1-9][0-9]{5}$/.test(String(v).trim());
}

export default function WarehouseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [plants, setPlants] = useState([]);
  const [form, setForm] = useState({ ...EMPTY });

  const [initialSnapshot, setInitialSnapshot] = useState(null);

  const errors = useMemo(() => {
    const e = {};
    if (!form.code?.trim()) e.code = "Warehouse code is required.";
    if (!form.name?.trim()) e.name = "Warehouse name is required.";
    if (!form.type) e.type = "Warehouse type is required.";
    if (!form.status) e.status = "Status is required.";
    if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!isIndianPincode(form.pincode)) e.pincode = "Enter a valid 6-digit pincode.";
    return e;
  }, [form]);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return JSON.stringify(initialSnapshot) !== JSON.stringify(form);
  }, [initialSnapshot, form]);

  const canSave = useMemo(() => Object.keys(errors).length === 0 && isDirty && !saving, [errors, isDirty, saving]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Load warehouse + plants in parallel (plants optional but recommended)
        const [whRes, plantsRes] = await Promise.allSettled([
          api.get(`/warehouse/warehouses/${id}`),
          api.get(`/settings/plants`),
        ]);

        if (!mounted) return;

        if (plantsRes.status === "fulfilled") {
          const list = plantsRes.value?.data?.data ?? plantsRes.value?.data ?? [];
          setPlants(Array.isArray(list) ? list : []);
        }

        if (whRes.status === "fulfilled") {
          const w = whRes.value?.data?.data ?? whRes.value?.data;
          const normalized = {
            ...EMPTY,
            ...w,
            plant_id: w?.plant_id ?? w?.plantId ?? "",
          };
          setForm(normalized);
          setInitialSnapshot(normalized);
        } else {
          throw whRes.reason;
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to load warehouse",
          description: "Could not fetch warehouse details. Please try again.",
          variant: "destructive",
        });
        navigate("/warehouse/warehouses", { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [id, navigate, toast]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length) {
      toast({ title: "Fix validation errors", description: "Please review the form fields.", variant: "destructive" });
      return;
    }
    if (!isDirty) {
      toast({ title: "No changes", description: "Nothing to save." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code?.trim(),
        name: form.name?.trim(),
        type: form.type,
        status: form.status,
        plant_id: form.plant_id || null,
        address_line1: form.address_line1?.trim(),
        address_line2: form.address_line2?.trim(),
        city: form.city?.trim(),
        state: form.state?.trim(),
        pincode: form.pincode?.trim(),
        country: form.country?.trim() || "India",
        contact_person: form.contact_person?.trim(),
        phone: form.phone?.trim(),
        email: form.email?.trim(),
        notes: form.notes?.trim(),
      };

      const res = await api.put(`/warehouse/warehouses/${id}`, payload);
      const updated = res?.data?.data ?? res?.data ?? payload;

      setForm((p) => ({ ...p, ...updated }));
      setInitialSnapshot((p) => ({ ...(p ?? payload), ...updated }));

      toast({
        title: "Warehouse updated",
        description: "Changes saved successfully.",
      });

      // optional: navigate back to details
      navigate(`/warehouse/warehouses/${id}`, { replace: true });
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to update warehouse. Please check server logs.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/warehouse/warehouses/${id}`);
      toast({ title: "Warehouse deleted", description: "The warehouse has been removed." });
      navigate("/warehouse/warehouses", { replace: true });
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to delete warehouse. It may be linked to stock or locations.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="border bg-white">
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading warehouse...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#dc2551]/10 p-3">
            <WarehouseIcon className="h-6 w-6 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Edit Warehouse</h1>
              <Badge className={cx("border", form.status === "ACTIVE" ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-700")}>
                {form.status === "ACTIVE" ? "Active" : "Inactive"}
              </Badge>
              <Badge className="border border-[#dc2551]/20 bg-[#dc2551]/10 text-[#dc2551]">{form.type}</Badge>
            </div>
            <p className="text-sm text-gray-600">
              Update warehouse details for PCB manufacturing inventory flow (RM/WIP/FG/Chemicals/Tooling).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/warehouse/warehouses">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>

          <Button
            type="submit"
            form="warehouse-edit-form"
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            disabled={!canSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </motion.div>

      <form id="warehouse-edit-form" onSubmit={handleSave} className="space-y-6">
        {/* Basic */}
        <Card className="border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#dc2551]" />
              Basic Information
            </CardTitle>
            <CardDescription>Core identifiers used across WIP moves, picking, packing and dispatch.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Warehouse Code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                placeholder="e.g., RM-01"
              />
              {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g., Raw Material Store"
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Warehouse Type *</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-xs text-red-600">{errors.status}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="plant">Plant (optional)</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="plant"
                  value={form.plant_id || ""}
                  onChange={(e) => setField("plant_id", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">— Not assigned —</option>
                  {plants.map((p) => (
                    <option key={p.id ?? p._id ?? p.value} value={p.id ?? p._id ?? p.value}>
                      {p.name ?? p.label ?? "Plant"}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">Useful when you run multiple PCB plants/lines.</p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#dc2551]" />
              Address & Location
            </CardTitle>
            <CardDescription>Helps dispatch, GRN and internal transfers.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="a1">Address Line 1</Label>
              <Input id="a1" value={form.address_line1} onChange={(e) => setField("address_line1", e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="a2">Address Line 2</Label>
              <Input id="a2" value={form.address_line2} onChange={(e) => setField("address_line2", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={(e) => setField("state", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} />
              {errors.pincode && <p className="text-xs text-red-600">{errors.pincode}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={(e) => setField("country", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#dc2551]" />
              Contact (optional)
            </CardTitle>
            <CardDescription>Used for internal escalation and vendor/dispatch coordination.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={form.contact_person}
                onChange={(e) => setField("contact_person", e.target.value)}
                placeholder="Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+91..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="store@pcbxpress.com"
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Special handling rules: ESD, chemical storage, humidity control, FIFO/FEFO..."
                className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {isDirty ? (
              <div className="md:col-span-2">
                <p className="text-xs text-amber-700">
                  You have unsaved changes. Click <span className="font-medium">Save Changes</span> to update this warehouse.
                </p>
              </div>
            ) : (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500">No pending changes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Delete confirm */}
      <ConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete warehouse?"
        description="This warehouse may be linked to locations, stock ledger, picking/packing, or work orders. Deleting can break traceability. Consider setting status to Inactive instead."
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
