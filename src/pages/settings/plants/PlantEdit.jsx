// src/pages/settings/plants/PlantEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Factory,
  MapPin,
  Phone,
  Mail,
  Save,
  ArrowLeft,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Hash,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import plantsApi from "@/services/plants.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Badge({ variant = "neutral", children }) {
  const styles = {
    neutral: "bg-gray-100 text-gray-700 ring-gray-200",
    good: "bg-green-50 text-green-700 ring-green-200",
    bad: "bg-red-50 text-red-700 ring-red-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    brand: "bg-[#dc2551]/10 text-[#dc2551] ring-[#dc2551]/20",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", styles[variant])}>
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <Badge variant="brand">
            <Factory className="mr-1.5 h-4 w-4" />
            Plant
          </Badge>
        </div>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <Icon className="h-7 w-7 text-[#dc2551]" />
    </div>
  );
}

const DEFAULTS = {
  name: "",
  code: "",
  status: "active", // active | inactive
  timezone: "Asia/Kolkata",
  phone: "",
  email: "",
  website: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
};

export default function PlantEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULTS);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const hasErrors = useMemo(() => {
    if (!form.name?.trim()) return true;
    if (!form.code?.trim()) return true;
    if (String(form.code).length > 10) return true;
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return true;
    if (form.website && !/^https?:\/\/.+/i.test(form.website)) return true;
    if (form.pincode && String(form.pincode).length < 5) return false; // allow short, backend can validate
    return false;
  }, [form]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await plantsApi.getById(id);
      const p = res?.data?.plant ?? res?.data ?? {};

      setForm({
        name: p.name ?? "",
        code: p.code ?? "",
        status: (p.status ?? "active") === "inactive" ? "inactive" : "active",
        timezone: p.timezone ?? "Asia/Kolkata",
        phone: p.phone ?? "",
        email: p.email ?? "",
        website: p.website ?? "",
        address_line1: p.address_line1 ?? p.address?.line1 ?? "",
        address_line2: p.address_line2 ?? p.address?.line2 ?? "",
        city: p.city ?? p.address?.city ?? "",
        state: p.state ?? p.address?.state ?? "",
        country: p.country ?? p.address?.country ?? "India",
        pincode: p.pincode ?? p.address?.pincode ?? "",
      });
    } catch (err) {
      toast({
        title: "Failed to load plant",
        description: err?.response?.data?.message || "Please try again.",
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

  const onSave = async (e) => {
    e?.preventDefault?.();
    if (hasErrors) {
      toast({
        title: "Fix validation errors",
        description: "Plant Name and Plant Code are required. Check email/website format if provided.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim(),
        code: form.code?.trim().toUpperCase(),
        status: form.status,
        timezone: form.timezone,
        phone: form.phone?.trim(),
        email: form.email?.trim(),
        website: form.website?.trim(),
        address_line1: form.address_line1?.trim(),
        address_line2: form.address_line2?.trim(),
        city: form.city?.trim(),
        state: form.state?.trim(),
        country: form.country?.trim(),
        pincode: form.pincode?.trim(),
      };

      await plantsApi.update(id, payload);

      toast({
        title: "Saved",
        description: "Plant details updated successfully.",
      });

      navigate("/settings/plants", { replace: true });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please check values and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = () => update("status", form.status === "active" ? "inactive" : "active");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SectionTitle
            icon={Building2}
            title="Edit Plant"
            subtitle="Update plant identity, contact details, and address for PCB manufacturing operations."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={form.status === "active" ? "good" : "warn"}>
              {form.status === "active" ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Active
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1.5 h-4 w-4" /> Inactive
                </>
              )}
            </Badge>
            {form.code ? (
              <Badge variant="neutral">
                <Hash className="mr-1.5 h-4 w-4" />
                {form.code}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/settings/plants">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={onSave}
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            disabled={loading || saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <form onSubmit={onSave} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Plant Information</div>
              <div className="mt-1 text-xs text-gray-500">
                Plant Code is used for lot numbering, routing, and traceability labels across the shopfloor.
              </div>
            </div>

            <button
              type="button"
              onClick={toggleStatus}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                form.status === "active"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}
              aria-label="Toggle plant status"
            >
              {form.status === "active" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {form.status === "active" ? "Active" : "Inactive"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Plant Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="PCBxpress Kerala Plant"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Plant Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => update("code", e.target.value.toUpperCase())}
                placeholder="PCB"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Max 10 chars. Used in labels & lot IDs.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                placeholder="Asia/Kolkata"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Affects production calendar, shifts, due dates, and reports.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-gray-500" />
                  Website
                </span>
              </Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://pcbxpress.in"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Include http(s):// if provided.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  Phone
                </span>
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 9XXXXXXXXX"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email
                </span>
              </Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="plant@pcbxpress.in"
                disabled={loading}
              />
              {form.email && !/^\S+@\S+\.\S+$/.test(form.email) ? (
                <p className="text-xs text-red-600">Invalid email format</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 border-t pt-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div className="text-sm font-semibold text-gray-900">Address</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  value={form.address_line1}
                  onChange={(e) => update("address_line1", e.target.value)}
                  placeholder="Building / Street"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={form.address_line2}
                  onChange={(e) => update("address_line2", e.target.value)}
                  placeholder="Area / Landmark"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Kochi"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="Kerala"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  placeholder="India"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={form.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                  placeholder="6820xx"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {form.status !== "active" ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-semibold">Inactive plant</div>
                  <div className="text-xs text-amber-900/80">
                    Inactive plants should not receive new work orders or lot allocations. Existing records remain searchable.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-semibold text-gray-900">PCB Shopfloor Impact</div>
            <p className="mt-2 text-xs text-gray-600">
              Plant configuration influences how your ERP runs core manufacturing flows:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-gray-600">
              <li>Lot numbering & labels (RM/WIP/FG)</li>
              <li>Production calendar & shifts</li>
              <li>Routing & capacity planning per plant</li>
              <li>Quality inspections and certificates</li>
              <li>Traceability across processes (drill → plating → etch → AOI → e-test)</li>
            </ul>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="p-5">
              <div className="text-sm font-semibold text-gray-900">Quick checks</div>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    Plant Code
                  </span>
                  <Badge variant={form.code ? "good" : "warn"}>{form.code ? "Set" : "Required"}</Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Email
                  </span>
                  <Badge
                    variant={!form.email ? "neutral" : /^\S+@\S+\.\S+$/.test(form.email) ? "good" : "bad"}
                  >
                    {!form.email ? "Optional" : /^\S+@\S+\.\S+$/.test(form.email) ? "OK" : "Invalid"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-gray-500" />
                    Website
                  </span>
                  <Badge
                    variant={!form.website ? "neutral" : /^https?:\/\/.+/i.test(form.website) ? "good" : "bad"}
                  >
                    {!form.website ? "Optional" : /^https?:\/\/.+/i.test(form.website) ? "OK" : "Invalid"}
                  </Badge>
                </div>
              </div>

              {hasErrors ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-semibold">Please fix errors</div>
                      <div className="text-amber-900/80">
                        Plant Name & Code required. Validate email/website if entered.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
