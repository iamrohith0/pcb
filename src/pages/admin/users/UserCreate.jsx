// src/pages/admin/users/UserCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

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
  Building2,
  ChevronLeft,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  User,
  KeyRound,
  Hash,
  BadgeCheck,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * UserCreate.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Recommended backend endpoints:
 * - GET  /admin/roles                      -> { roles: [{ id, name }] }  (or array)
 * - POST /admin/users                      -> create user
 *
 * Request body (suggested):
 * {
 *   name, email, phone, employeeCode,
 *   role, password, confirmPassword,
 *   department, plant, isActive
 * }
 */
export default function UserCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState([]);
  const [plants, setPlants] = useState(["Main Plant", "CAM Office", "Quality Lab", "Warehouse"]);
  const [departments] = useState([
    "Sales",
    "Engineering (DFM/CAM)",
    "Production",
    "Quality",
    "Stores & Inventory",
    "Procurement",
    "Maintenance",
    "Logistics",
    "Admin",
  ]);

  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    employeeCode: "",
    role: "",
    department: "",
    plant: "Main Plant",
    password: "",
    confirmPassword: "",
    isActive: true,
  });

  const [touched, setTouched] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const fetchRoles = async () => {
    setLoadingMeta(true);
    try {
      const res = await api.get("/admin/roles");
      const root = res?.data?.data ?? res?.data ?? {};
      const list = Array.isArray(root) ? root : root.roles ?? root.items ?? [];
      setRoles(
        (Array.isArray(list) ? list : []).map((r) => ({
          id: r.id ?? r._id ?? r.name,
          name: r.name ?? r.role ?? String(r.id ?? ""),
        }))
      );
    } catch (err) {
      toast({
        title: "Failed to load roles",
        description: err?.response?.data?.message || "Could not fetch roles from server.",
        variant: "destructive",
      });
      // fallback roles (common PCB ERP roles)
      setRoles([
        { id: "admin", name: "admin" },
        { id: "Sales Engineer", name: "Sales Engineer" },
        { id: "engineering_manager", name: "engineering_manager" },
        { id: "Engineer/Draftsman", name: "Engineer/Draftsman" },
        { id: "production_supervisor", name: "production_supervisor" },
        { id: "quality_inspector", name: "quality_inspector" },
        { id: "store_keeper", name: "store_keeper" },
      ]);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validation = useMemo(() => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email address.";

    if (form.phone && !/^[0-9+\-\s()]{6,20}$/.test(form.phone)) errors.phone = "Enter a valid phone number.";
    if (!form.employeeCode.trim()) errors.employeeCode = "Employee code is required.";

    if (!form.role) errors.role = "Role is required.";
    if (!form.department) errors.department = "Department is required.";
    if (!form.plant) errors.plant = "Plant is required.";

    if (!form.password) errors.password = "Password is required.";
    if (form.password && form.password.length < 6) errors.password = "Password must be at least 6 characters.";
    if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match.";

    return errors;
  }, [form]);

  const isValid = Object.keys(validation).length === 0;

  const isDirty = useMemo(() => {
    return Object.values(form).some((v) => (typeof v === "string" ? v.trim().length > 0 : true)) && touched && Object.keys(touched).length > 0;
  }, [form, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // mark all as touched so errors show
    setTouched({
      name: true,
      email: true,
      phone: true,
      employeeCode: true,
      role: true,
      department: true,
      plant: true,
      password: true,
      confirmPassword: true,
      isActive: true,
    });

    if (!isValid) {
      toast({ title: "Fix errors", description: "Please correct the highlighted fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        employeeCode: form.employeeCode.trim(),
        role: form.role,
        department: form.department,
        plant: form.plant,
        isActive: Boolean(form.isActive),
        password: form.password,
      };

      await api.post("/admin/users", payload);

      toast({ title: "User created", description: `Created ${payload.name} successfully.` });
      navigate("/admin/users");
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 409 ? "User already exists (email/employee code)." : "Failed to create user.");
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const requestExit = () => {
    if (isDirty && !saving) setConfirmExitOpen(true);
    else navigate(-1);
  };

  const FieldError = ({ name }) => {
    if (!touched[name]) return null;
    if (!validation[name]) return null;
    return <p className="mt-1 text-xs text-red-600">{validation[name]}</p>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <UserPlus className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create User</h1>
              <Badge variant="outline">PCBxpress</Badge>
              {loadingMeta ? <Badge variant="secondary">Loading…</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Add a new user for Sales, DFM/CAM, Production, Quality, Stores, or Admin.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={requestExit} disabled={saving}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={handleSubmit}
            disabled={saving || loadingMeta || !isValid}
          >
            <BadgeCheck className="h-4 w-4" />
            {saving ? "Creating..." : "Create User"}
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm text-gray-700">User Details</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Use employee code for traceability in work orders, approvals, and audit logs.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g., Irfan K"
                    className={cx("pl-9", touched.name && validation.name ? "border-red-500 focus-visible:ring-red-500" : "")}
                    autoComplete="name"
                  />
                </div>
                <FieldError name="name" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="e.g., irfan@pcbxpress.com"
                    className={cx("pl-9", touched.email && validation.email ? "border-red-500 focus-visible:ring-red-500" : "")}
                    autoComplete="email"
                  />
                </div>
                <FieldError name="email" />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="e.g., +91 9xxxxxxxxx"
                    className={cx("pl-9", touched.phone && validation.phone ? "border-red-500 focus-visible:ring-red-500" : "")}
                    autoComplete="tel"
                  />
                </div>
                <FieldError name="phone" />
              </div>

              {/* Employee Code */}
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Employee code</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="employeeCode"
                    value={form.employeeCode}
                    onChange={(e) => setField("employeeCode", e.target.value)}
                    placeholder="e.g., PCBX-ENG-014"
                    className={cx(
                      "pl-9",
                      touched.employeeCode && validation.employeeCode ? "border-red-500 focus-visible:ring-red-500" : ""
                    )}
                  />
                </div>
                <FieldError name="employeeCode" />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setField("role", e.target.value)}
                  className={cx(
                    "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                    "focus-visible:ring-2 focus-visible:ring-[#dc2551]/30",
                    touched.role && validation.role ? "border-red-500" : "border-input"
                  )}
                >
                  <option value="" disabled>
                    Select role
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <FieldError name="role" />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={form.department}
                  onChange={(e) => setField("department", e.target.value)}
                  className={cx(
                    "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                    "focus-visible:ring-2 focus-visible:ring-[#dc2551]/30",
                    touched.department && validation.department ? "border-red-500" : "border-input"
                  )}
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FieldError name="department" />
              </div>

              {/* Plant */}
              <div className="space-y-2">
                <Label htmlFor="plant">Plant / Location</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <select
                    id="plant"
                    value={form.plant}
                    onChange={(e) => setField("plant", e.target.value)}
                    className={cx(
                      "h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none",
                      "focus-visible:ring-2 focus-visible:ring-[#dc2551]/30",
                      touched.plant && validation.plant ? "border-red-500" : "border-input"
                    )}
                  >
                    {plants.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <FieldError name="plant" />
              </div>

              {/* Active */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Active user</div>
                    <div className="text-xs text-gray-500">Inactive users cannot log in.</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setField("isActive", !form.isActive)}
                    className={cx(
                      "inline-flex h-7 w-12 items-center rounded-full p-1 transition",
                      form.isActive ? "bg-[#dc2551]" : "bg-gray-300"
                    )}
                    aria-label="Toggle active"
                  >
                    <span className={cx("h-5 w-5 rounded-full bg-white shadow transition", form.isActive ? "translate-x-5" : "translate-x-0")} />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder="Set a password"
                    className={cx(
                      "pl-9",
                      touched.password && validation.password ? "border-red-500 focus-visible:ring-red-500" : ""
                    )}
                    autoComplete="new-password"
                  />
                </div>
                <FieldError name="password" />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
                    placeholder="Re-enter password"
                    className={cx(
                      "pl-9",
                      touched.confirmPassword && validation.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""
                    )}
                    autoComplete="new-password"
                  />
                </div>
                <FieldError name="confirmPassword" />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
                Cancel and go back
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" type="button" onClick={() => setConfirmExitOpen(true)} disabled={!isDirty || saving}>
                  Discard
                </Button>
                <Button
                  type="submit"
                  className="bg-[#dc2551] hover:bg-[#b02045]"
                  disabled={saving || loadingMeta || !isValid}
                >
                  {saving ? "Creating..." : "Create User"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Discard confirm */}
      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your entered details will be lost. This action won’t create the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmExitOpen(false);
                navigate(-1);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
