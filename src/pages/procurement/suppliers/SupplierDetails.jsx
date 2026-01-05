// src/pages/procurement/suppliers/SupplierDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CalendarDays,
  ClipboardList,
  Edit3,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  Truck,
  Users,
  BadgePercent,
} from "lucide-react";

/**
 * PCBxpress – Supplier Details
 * Location: src/pages/procurement/suppliers/SupplierDetails.jsx
 *
 * Suggested APIs (adjust to your backend):
 *  GET    /procurement/suppliers/:id
 *  PATCH  /procurement/suppliers/:id               (optional inline update)
 *  DELETE /procurement/suppliers/:id
 *
 * Related:
 *  GET /procurement/suppliers/:id/price-list       (optional)
 *  GET /procurement/purchase-orders?supplier_id=:id (optional)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function normalizeDate(v) {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}

function money(n, currency = "INR") {
  const num = Number(n || 0);
  return `${currency} ${Number.isFinite(num) ? num.toFixed(2) : "0.00"}`;
}

function statusBadge(status) {
  const s = String(status || "active").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border";
  if (s === "inactive")
    return <span className={cx(base, "border-gray-200 bg-gray-50 text-gray-700")}>Inactive</span>;
  if (s === "blocked")
    return <span className={cx(base, "border-red-200 bg-red-50 text-red-700")}>Blocked</span>;
  return <span className={cx(base, "border-emerald-200 bg-emerald-50 text-emerald-700")}>Active</span>;
}

export default function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [supplier, setSupplier] = useState(null);

  // Inline edit (optional)
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    status: "active",
    email: "",
    phone: "",
    gstin: "",
    payment_terms: "",
    lead_time_days: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    notes: "",
  });

  const header = useMemo(() => {
    if (!supplier) return { title: "Supplier", subtitle: "Loading supplier…" };
    return {
      title: supplier.name || "Supplier",
      subtitle: supplier.code ? `Supplier Code: ${supplier.code}` : "Supplier master record",
    };
  }, [supplier]);

  async function fetchSupplier() {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/suppliers/${id}`);
      const s = res.data?.data ?? res.data ?? null;

      if (!s) throw new Error("Supplier not found");

      const normalized = {
        id: s.id ?? s._id ?? id,
        name: s.name ?? "",
        code: s.code ?? s.supplier_code ?? "",
        status: s.status ?? "active",
        email: s.email ?? "",
        phone: s.phone ?? s.mobile ?? "",
        gstin: s.gstin ?? s.tax_id ?? "",
        payment_terms: s.payment_terms ?? s.paymentTerms ?? "",
        lead_time_days: s.lead_time_days ?? s.leadTimeDays ?? "",
        address_line1: s.address_line1 ?? s.address?.line1 ?? "",
        address_line2: s.address_line2 ?? s.address?.line2 ?? "",
        city: s.city ?? s.address?.city ?? "",
        state: s.state ?? s.address?.state ?? "",
        country: s.country ?? s.address?.country ?? "India",
        pincode: s.pincode ?? s.address?.pincode ?? "",
        notes: s.notes ?? "",
        created_at: normalizeDate(s.created_at ?? s.createdAt),
        updated_at: normalizeDate(s.updated_at ?? s.updatedAt),
        stats: {
          open_pos: s.stats?.open_pos ?? s.open_pos ?? 0,
          total_pos: s.stats?.total_pos ?? s.total_pos ?? 0,
          total_spend: s.stats?.total_spend ?? s.total_spend ?? 0,
          currency: s.stats?.currency ?? s.currency ?? "INR",
        },
        contacts: Array.isArray(s.contacts) ? s.contacts : [],
        approvals: Array.isArray(s.approvals) ? s.approvals : [],
      };

      setSupplier(normalized);
      setForm({
        name: normalized.name,
        code: normalized.code,
        status: normalized.status,
        email: normalized.email,
        phone: normalized.phone,
        gstin: normalized.gstin,
        payment_terms: normalized.payment_terms,
        lead_time_days: normalized.lead_time_days,
        address_line1: normalized.address_line1,
        address_line2: normalized.address_line2,
        city: normalized.city,
        state: normalized.state,
        country: normalized.country,
        pincode: normalized.pincode,
        notes: normalized.notes,
      });
    } catch (e) {
      toast({
        title: "Failed to load supplier",
        description: e?.response?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function updateField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        status: form.status,
        email: form.email,
        phone: form.phone,
        gstin: form.gstin,
        payment_terms: form.payment_terms,
        lead_time_days: form.lead_time_days ? Number(form.lead_time_days) : null,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        notes: form.notes,
      };

      await api.patch(`/procurement/suppliers/${id}`, payload);

      toast({ title: "Saved", description: "Supplier updated successfully." });
      setEditMode(false);
      fetchSupplier();
    } catch (e) {
      toast({
        title: "Save failed",
        description: e?.response?.data?.message || "Unable to save supplier details.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupplier() {
    try {
      await api.delete(`/procurement/suppliers/${id}`);
      toast({ title: "Deleted", description: "Supplier deleted successfully." });
      navigate("/procurement/suppliers", { replace: true });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || "Unable to delete supplier.",
        variant: "destructive",
      });
    }
  }

  const stats = supplier?.stats || { open_pos: 0, total_pos: 0, total_spend: 0, currency: "INR" };

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#dc2551]" />
              <h1 className="text-xl font-semibold text-gray-900">{header.title}</h1>
              {!loading && supplier && <div className="ml-1">{statusBadge(supplier.status)}</div>}
            </div>
            <p className="mt-1 text-sm text-gray-600">{header.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/procurement/suppliers/${id}/price-list`}>
              <BadgePercent className="h-4 w-4" />
              Price List
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/procurement/purchase-orders?supplier_id=${encodeURIComponent(id)}`}>
              <ClipboardList className="h-4 w-4" />
              View POs
            </Link>
          </Button>

          {!editMode ? (
            <Button className="gap-2" onClick={() => setEditMode(true)} disabled={loading || !supplier}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  // reset form from supplier
                  if (supplier) {
                    setForm({
                      name: supplier.name,
                      code: supplier.code,
                      status: supplier.status,
                      email: supplier.email,
                      phone: supplier.phone,
                      gstin: supplier.gstin,
                      payment_terms: supplier.payment_terms,
                      lead_time_days: supplier.lead_time_days,
                      address_line1: supplier.address_line1,
                      address_line2: supplier.address_line2,
                      city: supplier.city,
                      state: supplier.state,
                      country: supplier.country,
                      pincode: supplier.pincode,
                      notes: supplier.notes,
                    });
                  }
                }}
              >
                Cancel
              </Button>
              <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={saveChanges} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Save
              </Button>
            </>
          )}

          <Button
            variant="outline"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
            disabled={loading || !supplier}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading supplier details…
            </div>
          </CardContent>
        </Card>
      ) : !supplier ? (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#dc2551]/10">
              <FileText className="h-6 w-6 text-[#dc2551]" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900">Supplier not found</h3>
            <p className="mt-1 text-sm text-gray-600">Please check the supplier ID or go back to list.</p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/procurement/suppliers">Go to Suppliers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={ClipboardList}
              title="Open Purchase Orders"
              value={String(stats.open_pos ?? 0)}
              subtitle="POs not fully received/closed"
            />
            <StatCard
              icon={Truck}
              title="Total Purchase Orders"
              value={String(stats.total_pos ?? 0)}
              subtitle="Lifetime purchase orders"
            />
            <StatCard
              icon={BarMoneyIcon}
              title="Total Spend"
              value={money(stats.total_spend, stats.currency)}
              subtitle="Lifetime spend (approx.)"
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: Primary */}
            <Card className="border-gray-200 lg:col-span-7">
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
                <CardDescription>Master data for procurement and compliance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Supplier Name"
                    value={form.name}
                    disabled={!editMode}
                    onChange={(v) => updateField("name", v)}
                    placeholder="e.g., ABC Copper Foils"
                  />
                  <Field
                    label="Supplier Code"
                    value={form.code}
                    disabled={!editMode}
                    onChange={(v) => updateField("code", v)}
                    placeholder="e.g., SUP-00012"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <SelectField
                    label="Status"
                    value={form.status}
                    disabled={!editMode}
                    onChange={(v) => updateField("status", v)}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                      { value: "blocked", label: "Blocked" },
                    ]}
                  />
                  <Field
                    label="Lead Time (days)"
                    type="number"
                    value={String(form.lead_time_days ?? "")}
                    disabled={!editMode}
                    onChange={(v) => updateField("lead_time_days", v)}
                    placeholder="e.g., 7"
                  />
                  <Field
                    label="Payment Terms"
                    value={form.payment_terms}
                    disabled={!editMode}
                    onChange={(v) => updateField("payment_terms", v)}
                    placeholder="e.g., Net 30 / Advance"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Email"
                    value={form.email}
                    disabled={!editMode}
                    onChange={(v) => updateField("email", v)}
                    placeholder="purchase@supplier.com"
                    icon={Mail}
                  />
                  <Field
                    label="Phone"
                    value={form.phone}
                    disabled={!editMode}
                    onChange={(v) => updateField("phone", v)}
                    placeholder="+91 9XXXXXXXXX"
                    icon={Phone}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="GSTIN / Tax ID"
                    value={form.gstin}
                    disabled={!editMode}
                    onChange={(v) => updateField("gstin", v)}
                    placeholder="e.g., 32AAAAA0000A1Z5"
                  />
                  <div>
                    <Label>Created / Updated</Label>
                    <div className="mt-2 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        <span>
                          Created: <span className="font-medium">{supplier.created_at || "—"}</span>
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Updated: <span className="font-medium text-gray-700">{supplier.updated_at || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Address Line 1"
                    value={form.address_line1}
                    disabled={!editMode}
                    onChange={(v) => updateField("address_line1", v)}
                    placeholder="Street / Building"
                    icon={MapPin}
                  />
                  <Field
                    label="Address Line 2"
                    value={form.address_line2}
                    disabled={!editMode}
                    onChange={(v) => updateField("address_line2", v)}
                    placeholder="Area / Landmark"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Field
                    label="City"
                    value={form.city}
                    disabled={!editMode}
                    onChange={(v) => updateField("city", v)}
                    placeholder="City"
                  />
                  <Field
                    label="State"
                    value={form.state}
                    disabled={!editMode}
                    onChange={(v) => updateField("state", v)}
                    placeholder="State"
                  />
                  <Field
                    label="Pincode"
                    value={form.pincode}
                    disabled={!editMode}
                    onChange={(v) => updateField("pincode", v)}
                    placeholder="PIN"
                  />
                  <Field
                    label="Country"
                    value={form.country}
                    disabled={!editMode}
                    onChange={(v) => updateField("country", v)}
                    placeholder="India"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <textarea
                    className={cx(
                      "mt-2 w-full rounded-md border px-3 py-2 text-sm",
                      !editMode && "bg-gray-50 text-gray-700"
                    )}
                    rows={4}
                    disabled={!editMode}
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Material specialization, compliance notes, MOQ, freight terms…"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right: Contacts & Approvals */}
            <div className="space-y-4 lg:col-span-5">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    Contacts
                  </CardTitle>
                  <CardDescription>Purchase & logistics contact points.</CardDescription>
                </CardHeader>
                <CardContent>
                  {supplier.contacts?.length ? (
                    <div className="space-y-3">
                      {supplier.contacts.map((c, idx) => (
                        <div key={idx} className="rounded-xl border p-3">
                          <p className="text-sm font-semibold text-gray-900">{c.name || `Contact ${idx + 1}`}</p>
                          <div className="mt-1 space-y-1 text-sm text-gray-700">
                            {c.role ? <p className="text-xs text-gray-500">{c.role}</p> : null}
                            {c.email ? (
                              <p className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{c.email}</span>
                              </p>
                            ) : null}
                            {c.phone ? (
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{c.phone}</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No contacts found.</p>
                  )}

                  <div className="mt-4 text-xs text-gray-500">
                    Tip: add contacts in Supplier Create/Edit or via “Contacts” module (if enabled).
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-gray-600" />
                    Compliance / Approvals
                  </CardTitle>
                  <CardDescription>Documents & vendor qualification.</CardDescription>
                </CardHeader>
                <CardContent>
                  {supplier.approvals?.length ? (
                    <div className="space-y-2">
                      {supplier.approvals.map((a, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{a.type || "Approval"}</p>
                            <p className="mt-0.5 text-xs text-gray-600">{a.note || "—"}</p>
                          </div>
                          <span className="text-xs text-gray-500">{normalizeDate(a.date) || ""}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No compliance records yet (RoHS/REACH, ISO, COA, material declarations, etc.).
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="gap-2" asChild>
                      <Link to={`/procurement/suppliers/${id}/price-list`}>
                        <BadgePercent className="h-4 w-4" />
                        View Price List
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>Procurement workflows for this supplier.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to={`/procurement/purchase-orders/create?supplier_id=${encodeURIComponent(id)}`}>
                      <ClipboardList className="h-4 w-4" />
                      Create PO
                    </Link>
                  </Button>
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to={`/procurement/purchase-orders?supplier_id=${encodeURIComponent(id)}`}>
                      <Eye className="h-4 w-4" />
                      Purchase Orders
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{supplier?.name}</span>. If this supplier has
              linked purchase orders or GRNs, deletion may be blocked by the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#dc2551] hover:bg-[#b02045]" onClick={deleteSupplier}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function StatCard({ icon: Icon, title, value, subtitle }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10">
            <Icon className="h-5 w-5 text-[#dc2551]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Money icon fallback (lucide has no direct "money" icon named that)
function BarMoneyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 7.5C4 6.119 5.119 5 6.5 5h11C19.881 5 21 6.119 21 7.5v9c0 1.381-1.119 2.5-2.5 2.5h-11C5.119 19 4 17.881 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 9h10M7 12h10M7 15h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Field({ label, value, onChange, placeholder, disabled, type = "text", icon: Icon }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" /> : null}
        <Input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cx(Icon ? "pl-9" : "", disabled && "bg-gray-50 text-gray-700")}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className={cx("w-full rounded-md border px-3 py-2 text-sm", disabled && "bg-gray-50 text-gray-700")}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
