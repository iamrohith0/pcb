// src/pages/admin/users/UserDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

import api from "@/lib/axios";

import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CircleSlash2,
  Edit3,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  User2,
  Users,
  Wrench,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDateTime(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function fmtDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

function StatusPill({ active }) {
  if (active) {
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-gray-700">
      <CircleSlash2 className="h-3.5 w-3.5" />
      Inactive
    </Badge>
  );
}

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const [user, setUser] = useState(null);
  const [audit, setAudit] = useState([]);

  const [auditQuery, setAuditQuery] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /admin/users/:id -> { data: { ...user } } OR { ...user }
      const res = await api.get(`/admin/users/${id}`);
      const payload = res?.data?.data ?? res?.data ?? null;
      setUser(payload);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load user details.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudit = async () => {
    try {
      // Optional endpoint (works if you have audit log APIs):
      // GET /admin/audit-logs?entity=user&entity_id=:id&limit=50
      const res = await api.get("/admin/audit-logs", {
        params: { entity: "user", entity_id: id, limit: 50 },
      });
      const payload = res?.data?.data ?? res?.data ?? [];
      setAudit(Array.isArray(payload) ? payload : []);
    } catch {
      // If audit endpoint doesn't exist, we just hide the section by leaving it empty.
      setAudit([]);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const roleLabel = useMemo(() => {
    const role = user?.role;
    if (!role) return "—";
    // Convert snake/kebab to Title Case
    return String(role)
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  }, [user?.role]);

  const isActive = useMemo(() => {
    // supports different backends: active, is_active, status
    if (!user) return false;
    if (typeof user.active === "boolean") return user.active;
    if (typeof user.is_active === "boolean") return user.is_active;
    if (typeof user.status === "string") return user.status.toLowerCase() === "active";
    return true;
  }, [user]);

  const plantLabel = useMemo(() => {
    // supports plant fields: plant, plant_name, plantId, etc.
    const plant = user?.plant || user?.plant_name || user?.plantName;
    return plant || "—";
  }, [user]);

  const deptLabel = useMemo(() => {
    const d = user?.department || user?.dept || user?.department_name;
    return d || "—";
  }, [user]);

  const handleToggleActive = async () => {
    setActing(true);
    try {
      // Expected:
      // PATCH /admin/users/:id/status { active: boolean }
      // OR POST /admin/users/:id/toggle
      await api.patch(`/admin/users/${id}/status`, { active: !isActive });

      toast({
        title: "Updated",
        description: `User is now ${!isActive ? "Active" : "Inactive"}.`,
      });

      setConfirmToggleOpen(false);
      await fetchUser();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update user status.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    setActing(true);
    try {
      // Expected:
      // DELETE /admin/users/:id
      await api.delete(`/admin/users/${id}`);

      toast({ title: "Deleted", description: "User deleted successfully." });
      setConfirmDeleteOpen(false);
      navigate("/admin/users", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete user.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const filteredAudit = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    if (!q) return audit;

    return audit.filter((row) => {
      const s = JSON.stringify(row).toLowerCase();
      return s.includes(q);
    });
  }, [audit, auditQuery]);

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">User Details</h1>
            <p className="text-sm text-gray-500">
              Admin → Users → <span className="font-medium">{user?.name || id}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="gap-2" onClick={fetchUser} disabled={loading || acting}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Refresh
          </Button>

          <Link to={`/admin/users/${id}/edit`}>
            <Button className="gap-2" disabled={loading || !user}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          </Link>

          <Button
            variant="ghost"
            className={cx(
              "gap-2",
              isActive ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"
            )}
            disabled={loading || !user || acting}
            onClick={() => setConfirmToggleOpen(true)}
          >
            {isActive ? <CircleSlash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {isActive ? "Deactivate" : "Activate"}
          </Button>

          <Button
            variant="ghost"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={loading || !user || acting}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                <span className="text-sm font-extrabold">{initials(user?.name)}</span>
              </div>

              <div className="min-w-0">
                <CardTitle className="truncate">{user?.name || (loading ? "Loading…" : "—")}</CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email || "—"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {roleLabel}
                  </span>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill active={isActive} />
              {user?.is_verified ? (
                <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">Unverified</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick facts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User2 className="h-4 w-4" />
                Employee Code
              </div>
              <p className="mt-1 text-base font-semibold text-gray-900">{user?.employee_code || user?.code || "—"}</p>
              <p className="mt-1 text-xs text-gray-500">Internal identifier for ERP usage</p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                Plant / Location
              </div>
              <p className="mt-1 text-base font-semibold text-gray-900">{plantLabel}</p>
              <p className="mt-1 text-xs text-gray-500">PCB plant assignment</p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wrench className="h-4 w-4" />
                Department
              </div>
              <p className="mt-1 text-base font-semibold text-gray-900">{deptLabel}</p>
              <p className="mt-1 text-xs text-gray-500">Sales / CAM / Production / QA</p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Created
              </div>
              <p className="mt-1 text-base font-semibold text-gray-900">{fmtDate(user?.created_at || user?.createdAt)}</p>
              <p className="mt-1 text-xs text-gray-500">Account creation date</p>
            </div>
          </div>

          {/* Contact & meta */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="font-semibold text-gray-900">Contact</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" /> Email
                  </span>
                  <span className="font-medium text-gray-900">{user?.email || "—"}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" /> Phone
                  </span>
                  <span className="font-medium text-gray-900">{user?.phone || user?.mobile || "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <p className="font-semibold text-gray-900">Security & Activity</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <ShieldCheck className="h-4 w-4" /> Role
                  </span>
                  <span className="font-medium text-gray-900">{roleLabel}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" /> Last Login
                  </span>
                  <span className="font-medium text-gray-900">
                    {fmtDateTime(user?.last_login_at || user?.lastLoginAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-4 w-4" /> Status
                  </span>
                  <span className="font-medium text-gray-900">{isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit log */}
          {audit.length > 0 && (
            <div className="rounded-2xl border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Audit Activity</p>
                  <p className="text-xs text-gray-500">Recent admin actions related to this user.</p>
                </div>

                <div className="w-full sm:w-80">
                  <Label className="sr-only">Search audit logs</Label>
                  <Input
                    value={auditQuery}
                    onChange={(e) => setAuditQuery(e.target.value)}
                    placeholder="Search audit…"
                  />
                </div>
              </div>

              <div className="mt-4 divide-y rounded-xl border">
                {filteredAudit.slice(0, 20).map((row, idx) => (
                  <div key={row.id || idx} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.action || row.event || "Activity"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {row.message || row.description || (row.meta ? JSON.stringify(row.meta) : "")}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{fmtDateTime(row.created_at || row.createdAt)}</p>
                  </div>
                ))}
              </div>

              {filteredAudit.length > 20 && (
                <p className="mt-2 text-xs text-gray-500">Showing first 20 results. Refine search to see specific items.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle status dialog */}
      <AlertDialog open={confirmToggleOpen} onOpenChange={setConfirmToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isActive ? "Deactivate user?" : "Activate user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isActive ? (
                <>
                  This will prevent the user from accessing PCBXpress ERP modules. You can re-enable the user anytime.
                </>
              ) : (
                <>This will allow the user to log in and access assigned modules based on role & permissions.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive} disabled={acting}>
              {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be removed from PCBXpress ERP.
              Consider deactivating instead if you may need the account later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={acting}
              className="bg-red-600 hover:bg-red-700"
            >
              {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
