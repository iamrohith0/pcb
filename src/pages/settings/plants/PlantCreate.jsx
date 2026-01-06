// src/pages/settings/plants/PlantCreate.jsx
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
    ArrowLeft,
    Building2,
    Factory,
    Loader2,
    MapPin,
    Save,
    Settings2,
    ShieldCheck,
    Trash2,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DEFAULT_FORM = {
  name: "",
  code: "",
  is_active: true,

  // Address
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",

  // Contact
  phone: "",
  email: "",

  // Ops metadata (optional, but useful for PCB plants)
  timezone: "Asia/Kolkata",
  notes: "",
};

function upperNoSpace(v) {
  return (v || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9_-]/g, "");
}

function isEmail(v) {
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function PlantCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [defaultsLoading, setDefaultsLoading] = useState(true);

  // Try to prefill defaults (company country/state, etc) if your backend supports it.
  useEffect(() => {
    const loadDefaults = async () => {
      setDefaultsLoading(true);
      try {
        // Optional endpoint: GET /settings/company-profile
        // If not present, this will fail silently.
        const res = await api.get("/settings/company-profile");
        const data = res?.data?.data ?? res?.data ?? {};
        const company = data?.company || data;

        setForm((prev) => ({
          ...prev,
          country: company?.country || prev.country,
          state: company?.state || prev.state,
          city: company?.city || prev.city,
        }));
      } catch (e) {
        // ignore
      } finally {
        setDefaultsLoading(false);
      }
    };

    loadDefaults();
  }, []);

  const patch = (p) => setForm((prev) => ({ ...prev, ...p }));

  const validation = useMemo(() => {
    const errors = {};
    if (!form.name?.trim()) errors.name = "Plant name is required.";
    if (!form.code?.trim()) errors.code = "Plant code is required.";
    if (form.code && form.code.length < 2) errors.code = "Plant code must be at least 2 characters.";
    if (form.pincode && !/^\d{5,6}$/.test(form.pincode)) errors.pincode = "Enter a valid pincode (5–6 digits).";
    if (!isEmail(form.email)) errors.email = "Enter a valid email address.";
    return errors;
  }, [form]);

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(DEFAULT_FORM);
  }, [form]);

  const canSave = useMemo(() => Object.keys(validation).length === 0 && !saving, [validation, saving]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) {
      toast({
        title: "Fix errors",
        description: "Please correct the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Expected endpoint:
      // POST /settings/plants   body: form
      //
      // Fallback patterns supported:
      // POST /plants
      // POST /settings/plants/create
      let created = null;

      try {
        const res = await api.post("/settings/plants", form);
        created = res?.data?.data ?? res?.data ?? null;
      } catch (e) {
        const res2 = await api.post("/plants", form);
        created = res2?.data?.data ?? res2?.data ?? null;
      }

      toast({
        title: "Plant created",
        description: `Plant "${form.name}" has been added successfully.`,
      });

      const id = created?.id || created?._id;
      if (id) {
        navigate(`/settings/plants/${id}`, { replace: true });
      } else {
        navigate(`/settings/plants`, { replace: true });
      }
    } catch (err) {
      console.warn("Plant create failed:", err);
      toast({
        title: "Create failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) setCancelOpen(true);
    else navigate(-1);
  };

  const confirmDiscard = () => {
    setCancelOpen(false);
    navigate(-1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Plant</h1>
            <p className="text-sm text-gray-500">
              Add a manufacturing plant for PCBXpress (used in numbering, routing, WIP, QA, and dispatch).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)} disabled={saving}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleCancel} disabled={saving}>
            <Trash2 className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSubmit}
            disabled={!canSave}
            type="submit"
            form="plant-create-form"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Plant
          </Button>
        </div>
      </div>

      <form id="plant-create-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Basics */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Plant basics</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="name">Plant name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="PCBXpress Kochi Plant"
                className={cx(validation.name && "border-rose-300 focus-visible:ring-rose-200")}
                disabled={saving}
              />
              {validation.name && <p className="text-xs text-rose-600">{validation.name}</p>}
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="code">Plant code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => patch({ code: upperNoSpace(e.target.value) })}
                placeholder="KCH1"
                maxLength={10}
                className={cx(validation.code && "border-rose-300 focus-visible:ring-rose-200")}
                disabled={saving}
              />
              {validation.code ? (
                <p className="text-xs text-rose-600">{validation.code}</p>
              ) : (
                <p className="text-xs text-gray-500">Used in document numbering and travelers.</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Active</Label>
              <div className="flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ShieldCheck className="h-4 w-4 text-gray-500" />
                  Enable plant
                </div>
                <Switch checked={!!form.is_active} onCheckedChange={(v) => patch({ is_active: v })} />
              </div>
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={(e) => patch({ timezone: e.target.value })}
                placeholder="Asia/Kolkata"
                disabled={saving}
              />
              <p className="text-xs text-gray-500">Used for scheduling, WIP timestamps, and shift planning.</p>
            </div>

            <div className="space-y-2 md:col-span-8">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="E.g., HDI line, 8-layer capable, ENIG supported..."
                disabled={saving}
              />
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Address</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="address_line1">Address line 1</Label>
              <Input
                id="address_line1"
                value={form.address_line1}
                onChange={(e) => patch({ address_line1: e.target.value })}
                placeholder="Building / Street"
                disabled={saving || defaultsLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="address_line2">Address line 2</Label>
              <Input
                id="address_line2"
                value={form.address_line2}
                onChange={(e) => patch({ address_line2: e.target.value })}
                placeholder="Area / Landmark"
                disabled={saving || defaultsLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => patch({ city: e.target.value })}
                placeholder="Kochi"
                disabled={saving || defaultsLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => patch({ state: e.target.value })}
                placeholder="Kerala"
                disabled={saving || defaultsLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => patch({ country: e.target.value })}
                placeholder="India"
                disabled={saving || defaultsLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={form.pincode}
                onChange={(e) => patch({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                placeholder="6820xx"
                className={cx(validation.pincode && "border-rose-300 focus-visible:ring-rose-200")}
                disabled={saving || defaultsLoading}
              />
              {validation.pincode && <p className="text-xs text-rose-600">{validation.pincode}</p>}
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="+91 9xxxxxxxxx"
                disabled={saving}
              />
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="plant@pcbxpress.com"
                className={cx(validation.email && "border-rose-300 focus-visible:ring-rose-200")}
                disabled={saving}
              />
              {validation.email && <p className="text-xs text-rose-600">{validation.email}</p>}
            </div>

            <div className="space-y-2 md:col-span-12">
              <Label htmlFor="notes2">Operational notes (optional)</Label>
              <Textarea
                id="notes2"
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Shift timings, special processes, line capabilities, restrictions..."
                className="min-h-[92px]"
                disabled={saving}
              />
              <p className="text-xs text-gray-500">
                Helpful for scheduling and for setting correct expectations in Sales/Engineering handoff.
              </p>
            </div>
          </div>
        </Card>
      </form>

      {/* Discard changes confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you go back now, your entered data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-rose-600 text-white hover:bg-rose-700">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
