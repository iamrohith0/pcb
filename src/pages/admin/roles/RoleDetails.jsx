// src/pages/admin/roles/RoleDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  Edit3,
  ShieldCheck,
  Trash2,
  RefreshCw,
  KeyRound,
  Users,
  ClipboardCheck,
  Factory,
  Layers,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PCB_RESOURCE_GROUPS = [
  {
    key: "sales",
    label: "Sales",
    icon: Layers,
    examples: ["RFQ", "Quotation", "Sales Order", "Invoice"],
  },
  {
    key: "engineering",
    label: "Engineering",
    icon: Factory,
    examples: ["DFM Review", "CAM Outputs", "Panelization", "Stackups", "Revisions (ECO)"],
  },
  {
    key: "production",
    label: "Production",
    icon: Factory,
    examples: ["Work Orders", "Routing", "Scheduling", "WIP"],
  },
  {
    key: "quality",
    label: "Quality",
    icon: ClipboardCheck,
    examples: ["Inspection", "AOI", "E-Test", "NCR", "CAPA", "Certificates"],
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: Layers,
    examples: ["Material Master", "Stock", "Lots", "Serials"],
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    examples: ["Users", "Roles", "Permissions", "Audit Logs", "Settings"],
  },
];

function guessGroupForPermissionKey(key = "") {
  const k = String(key).toLowerCase();
  const group = PCB_RESOURCE_GROUPS.find((g) => k.startsWith(`${g.key}.`));
  return group?.key || "other";
}

function normalizeRoleApi(data) {
  // supports many shapes:
  // {id, name, key, description, users_count, permissions:[...]}
  // {data:{...}}
  const role = data?.data?.role || data?.role || data?.data || data;
  if (!role || typeof role !== "object") return null;

  const permissions =
    role.permissions ||
    role.permission_keys ||
    role.permissionKeys ||
    role.perms ||
    role.abilities ||
    [];

  const permKeys = Array.isArray(permissions)
    ? permissions.map((p) => (typeof p === "string" ? p : p?.key || p?.code || p?.name)).filter(Boolean)
    : [];

  return {
    id: role.id ?? role._id ?? role.uuid ?? role.key ?? role.code ?? role.name,
    name: role.name ?? role.label ?? role.title ?? role.key ?? "Role",
    key: role.key ?? role.code ?? role.slug ?? role.name ?? "",
    description: role.description ?? role.notes ?? "",
    usersCount: role.users_count ?? role.usersCount ?? role.user_count ?? role.userCount ?? null,
    permissions: permKeys,
    createdAt: role.created_at ?? role.createdAt ?? null,
    updatedAt: role.updated_at ?? role.updatedAt ?? null,
    raw: role,
  };
}

export default function RoleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [role, setRole] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [permSearch, setPermSearch] = useState("");

  const loadRole = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Recommended: GET /admin/roles/:id
      const res = await api.get(`/admin/roles/${encodeURIComponent(id)}`);
      const normalized = normalizeRoleApi(res.data);
      if (!normalized) throw new Error("Invalid role payload");
      setRole(normalized);
    } catch (err) {
      toast({
        title: "Failed to load role",
        description: err?.response?.data?.message || "Role not found or server error.",
        variant: "destructive",
      });
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const groupedPermissions = useMemo(() => {
    const keys = role?.permissions || [];
    const q = permSearch.trim().toLowerCase();

    const filtered = !q
      ? keys
      : keys.filter((k) => String(k).toLowerCase().includes(q));

    const groups = {};
    for (const k of filtered) {
      const g = guessGroupForPermissionKey(k);
      if (!groups[g]) groups[g] = [];
      groups[g].push(k);
    }

    // keep stable ordering:
    const ordered = {};
    for (const g of ["sales", "engineering", "production", "quality", "inventory", "admin", "other"]) {
      if (groups[g]) ordered[g] = groups[g].sort((a, b) => a.localeCompare(b));
    }
    return ordered;
  }, [role, permSearch]);

  const permCounts = useMemo(() => {
    const all = role?.permissions?.length || 0;
    const shown = Object.values(groupedPermissions).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    return { all, shown };
  }, [role, groupedPermissions]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      // Recommended: DELETE /admin/roles/:id
      await api.delete(`/admin/roles/${encodeURIComponent(id)}`);
      toast({ title: "Role deleted", description: "The role has been removed successfully." });
      setDeleteOpen(false);
      navigate("/admin/roles", { replace: true });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Could not delete the role.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <ShieldCheck className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {loading ? "Loading..." : role?.name || "Role"}
              </h1>
              {role?.key ? <Badge variant="secondary">{role.key}</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              View role details and permission coverage for PCBxpress ERP modules.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" className="gap-2" onClick={loadRole} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link to={`/admin/roles/${encodeURIComponent(id)}/edit`}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="border border-gray-200 lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-700">Role Summary</CardTitle>
            <CardDescription className="text-xs">Core metadata and usage impact.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Name</div>
              <div className="font-semibold text-gray-900">{role?.name || "-"}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-500">Key</div>
              <div className="font-medium text-gray-900">{role?.key || "-"}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-500">Description</div>
              <div className="text-sm text-gray-800">{role?.description || <span className="text-gray-400">No description</span>}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="h-4 w-4" />
                  Users
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {role?.usersCount ?? <span className="text-gray-400">—</span>}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <KeyRound className="h-4 w-4" />
                  Permissions
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {role?.permissions?.length ?? 0}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900">PCB Factory Tip</div>
              <p className="mt-1">
                Keep CAM/DFM permissions separate from QC permissions. Use audit logs to track any permission changes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="border border-gray-200 lg:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm text-gray-700">Permissions</CardTitle>
                <CardDescription className="text-xs">
                  Showing {permCounts.shown} of {permCounts.all} permissions
                </CardDescription>
              </div>
              <div className="w-full sm:w-[320px]">
                <Label className="sr-only">Search permissions</Label>
                <div className="relative">
                  <Input
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    placeholder="Search permission key..."
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-gray-400">
                    {permSearch ? `${permCounts.shown}` : ""}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                Loading permissions...
              </div>
            ) : !role ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                Role not available.
              </div>
            ) : role.permissions.length === 0 ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                This role has no permissions assigned.
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([groupKey, keys]) => {
                const meta = PCB_RESOURCE_GROUPS.find((g) => g.key === groupKey);
                const Icon = meta?.icon || ShieldCheck;

                return (
                  <div key={groupKey} className="overflow-hidden rounded-2xl border border-gray-200">
                    <div className="flex flex-col gap-2 border-b bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border">
                          <Icon className="h-4 w-4 text-gray-700" />
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900">{meta?.label || groupKey}</div>
                          <div className="text-xs text-gray-500">
                            {meta?.examples?.length ? meta.examples.join(" • ") : "Other permissions"}
                          </div>
                        </div>
                      </div>

                      <Badge variant="secondary">{keys.length} items</Badge>
                    </div>

                    <div className="divide-y">
                      {keys.map((k) => (
                        <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-900">{k}</div>
                            <div className="text-xs text-gray-500">
                              Group: <span className="font-medium">{meta?.label || groupKey}</span>
                            </div>
                          </div>
                          <Badge variant="outline">Allowed</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-400" />
                Permissions displayed here are read-only. Edit using the Role Edit page or Permissions Matrix.
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/permissions/matrix">Open Matrix</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If this role is assigned to users, deleting it may block their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
