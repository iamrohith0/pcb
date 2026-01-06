// src/pages/admin/roles/RoleEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    CheckCircle2,
    ClipboardCheck,
    Factory,
    KeyRound,
    Layers,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Users,
    XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PCB_GROUPS = [
  {
    key: "sales",
    label: "Sales",
    icon: Layers,
    hint: "RFQ, Quotations, Sales Orders, Invoices",
  },
  {
    key: "engineering",
    label: "Engineering",
    icon: Factory,
    hint: "DFM, CAM, Panelization, Stackups, ECO/Revisions",
  },
  {
    key: "production",
    label: "Production",
    icon: Factory,
    hint: "Work Orders, Routing, Scheduling, WIP",
  },
  {
    key: "quality",
    label: "Quality",
    icon: ClipboardCheck,
    hint: "Inspections, AOI, E-Test, NCR, CAPA, Certificates",
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: Layers,
    hint: "Material Master, Stock, Lots, Serials",
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    hint: "Users, Roles, Permissions, Settings, Audit Logs",
  },
];

function groupKeyForPermissionKey(key = "") {
  const k = String(key).toLowerCase();
  const hit = PCB_GROUPS.find((g) => k.startsWith(`${g.key}.`));
  return hit?.key || "other";
}

function normalizeRoleApi(data) {
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
    ? permissions
        .map((p) => (typeof p === "string" ? p : p?.key || p?.code || p?.name))
        .filter(Boolean)
    : [];

  return {
    id: role.id ?? role._id ?? role.uuid ?? role.key ?? role.code ?? role.name,
    name: role.name ?? role.label ?? role.title ?? role.key ?? "Role",
    key: role.key ?? role.code ?? role.slug ?? role.name ?? "",
    description: role.description ?? role.notes ?? "",
    usersCount: role.users_count ?? role.usersCount ?? role.user_count ?? role.userCount ?? null,
    permissions: permKeys,
    raw: role,
  };
}

function normalizePermissionsCatalogApi(data) {
  // Supports:
  // - ["sales.rfq.read", ...]
  // - [{key:"sales.rfq.read", label:"Read RFQ"}]
  // - {data:[...]} or {permissions:[...]}
  const payload = data?.data || data?.permissions || data;
  if (!payload) return [];

  const arr = Array.isArray(payload) ? payload : payload?.data || [];
  if (!Array.isArray(arr)) return [];

  return arr
    .map((p) => {
      if (typeof p === "string") {
        return { key: p, label: p, description: "" };
      }
      const key = p?.key || p?.code || p?.name;
      if (!key) return null;
      return {
        key,
        label: p?.label || p?.title || key,
        description: p?.description || p?.desc || "",
      };
    })
    .filter(Boolean);
}

export default function RoleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [role, setRole] = useState(null);

  // form fields
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");

  // permission management
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [permissionCatalog, setPermissionCatalog] = useState([]); // all possible permissions
  const [selected, setSelected] = useState(new Set()); // Set<string>

  const [search, setSearch] = useState("");
  const [unsavedOpen, setUnsavedOpen] = useState(false);

  const isDirty = useMemo(() => {
    if (!role) return false;
    const basePerms = new Set(role.permissions || []);
    if (name !== (role.name || "")) return true;
    if (key !== (role.key || "")) return true;
    if (description !== (role.description || "")) return true;

    const current = selected;
    if (current.size !== basePerms.size) return true;
    for (const p of current) if (!basePerms.has(p)) return true;
    return false;
  }, [role, name, key, description, selected]);

  const loadRole = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/roles/${encodeURIComponent(id)}`);
      const normalized = normalizeRoleApi(res.data);
      if (!normalized) throw new Error("Invalid role payload");
      setRole(normalized);

      setName(normalized.name || "");
      setKey(normalized.key || "");
      setDescription(normalized.description || "");
      setSelected(new Set(normalized.permissions || []));
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

  const loadPermissionCatalog = async () => {
    setCatalogLoading(true);
    try {
      // Recommended: GET /admin/permissions (or /admin/permissions/catalog)
      // If you don't have it, this gracefully falls back to role.permissions list.
      const res = await api.get(`/admin/permissions`);
      const catalog = normalizePermissionsCatalogApi(res.data);

      if (catalog.length) setPermissionCatalog(catalog);
      else setPermissionCatalog((role?.permissions || []).map((k) => ({ key: k, label: k, description: "" })));
    } catch (err) {
      // fallback
      setPermissionCatalog((role?.permissions || []).map((k) => ({ key: k, label: k, description: "" })));
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (role) loadPermissionCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role?.id]);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = !q
      ? permissionCatalog
      : permissionCatalog.filter((p) => {
          const hay = `${p.key} ${p.label || ""} ${p.description || ""}`.toLowerCase();
          return hay.includes(q);
        });

    const map = {};
    for (const p of filtered) {
      const g = groupKeyForPermissionKey(p.key);
      if (!map[g]) map[g] = [];
      map[g].push(p);
    }

    // stable order
    const ordered = {};
    for (const g of ["sales", "engineering", "production", "quality", "inventory", "admin", "other"]) {
      if (map[g]) ordered[g] = map[g].sort((a, b) => a.key.localeCompare(b.key));
    }
    return ordered;
  }, [permissionCatalog, search]);

  const stats = useMemo(() => {
    const total = permissionCatalog.length;
    const selectedCount = selected.size;

    const visible = Object.values(groups).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    return { total, visible, selectedCount };
  }, [permissionCatalog, groups, selected]);

  const togglePermission = (permKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permKey)) next.delete(permKey);
      else next.add(permKey);
      return next;
    });
  };

  const setGroupSelection = (groupKey, enabled) => {
    const perms = groups[groupKey] || [];
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of perms) {
        if (enabled) next.add(p.key);
        else next.delete(p.key);
      }
      return next;
    });
  };

  const clearSearch = () => setSearch("");

  const handleSave = async () => {
    if (!id) return;

    const payload = {
      name: name.trim(),
      key: key.trim(),
      description: description.trim(),
      permissions: Array.from(selected),
    };

    if (!payload.name) {
      toast({ title: "Name is required", description: "Please enter a role name.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Recommended: PUT /admin/roles/:id
      await api.put(`/admin/roles/${encodeURIComponent(id)}`, payload);
      toast({ title: "Role updated", description: "Changes saved successfully." });
      await loadRole(); // refresh from server
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Could not save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) setUnsavedOpen(true);
    else navigate(-1);
  };

  const confirmDiscard = () => {
    setUnsavedOpen(false);
    navigate(-1);
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
                {loading ? "Loading..." : `Edit Role: ${role?.name || "—"}`}
              </h1>
              {role?.key ? <Badge variant="secondary">{role.key}</Badge> : null}
              {isDirty ? <Badge variant="outline">Unsaved</Badge> : <Badge variant="outline">Saved</Badge>}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Configure role identity and module permissions for PCBxpress (PCB Manufacturing ERP).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={loadRole}
            disabled={loading || saving}
            title="Reload from server"
          >
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            onClick={handleSave}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            disabled={saving || loading}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: role fields */}
        <Card className="border border-gray-200 lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-700">Role Information</CardTitle>
            <CardDescription className="text-xs">This role can be assigned to PCB factory users.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CAM Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Role Key (unique)</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g., cam_engineer"
              />
              <p className="text-xs text-gray-500">
                Use a stable identifier for integrations, audit logs and permission mapping.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short purpose of this role"
              />
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
                  Selected
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{selected.size}</div>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900">PCB Best Practice</div>
              <p className="mt-1">
                Give CAM & DFM edit permissions only to engineering users. QC should have hold/release + NCR/CAPA, not CAM output edit.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" size="sm">
                <Link to={`/admin/roles/${encodeURIComponent(id)}`}>View Details</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/permissions/matrix">Permissions Matrix</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: permissions */}
        <Card className="border border-gray-200 lg:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm text-gray-700">Permission Selection</CardTitle>
                <CardDescription className="text-xs">
                  {catalogLoading ? "Loading catalog..." : `Visible ${stats.visible} / Total ${stats.total} • Selected ${stats.selectedCount}`}
                </CardDescription>
              </div>

              <div className="w-full sm:w-[360px]">
                <Label className="sr-only" htmlFor="permSearch">
                  Search permissions
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="permSearch"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search e.g. production.work-orders.create"
                    className="pl-9 pr-10"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                      aria-label="Clear search"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                Loading role...
              </div>
            ) : !role ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                Role not available.
              </div>
            ) : permissionCatalog.length === 0 ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                No permission catalog found. Add an endpoint like <span className="font-mono">GET /admin/permissions</span>.
              </div>
            ) : (
              Object.entries(groups).map(([groupKey, perms]) => {
                const meta = PCB_GROUPS.find((g) => g.key === groupKey);
                const Icon = meta?.icon || ShieldCheck;

                const enabledCount = perms.reduce((sum, p) => sum + (selected.has(p.key) ? 1 : 0), 0);
                const allSelected = enabledCount === perms.length && perms.length > 0;
                const noneSelected = enabledCount === 0;

                return (
                  <div key={groupKey} className="overflow-hidden rounded-2xl border border-gray-200">
                    <div className="flex flex-col gap-3 border-b bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border">
                          <Icon className="h-4 w-4 text-gray-700" />
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900">{meta?.label || groupKey}</div>
                          <div className="text-xs text-gray-500">{meta?.hint || "Other permissions"}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {enabledCount}/{perms.length} enabled
                        </Badge>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setGroupSelection(groupKey, true)}
                          disabled={perms.length === 0 || allSelected}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Enable All
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setGroupSelection(groupKey, false)}
                          disabled={perms.length === 0 || noneSelected}
                        >
                          <XCircle className="h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="divide-y">
                      {perms.map((p) => {
                        const checked = selected.has(p.key);
                        return (
                          <label
                            key={p.key}
                            className={cx(
                              "flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors",
                              checked ? "bg-[#dc2551]/5" : "bg-white",
                              "hover:bg-gray-50"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate font-medium text-gray-900">{p.label || p.key}</span>
                                <Badge variant="outline" className="font-mono text-[11px]">
                                  {p.key}
                                </Badge>
                              </div>
                              {p.description ? (
                                <div className="mt-1 text-xs text-gray-500">{p.description}</div>
                              ) : (
                                <div className="mt-1 text-xs text-gray-400">
                                  No description. (Optional: add descriptions in the permission catalog.)
                                </div>
                              )}
                            </div>

                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[#dc2551]"
                              checked={checked}
                              onChange={() => togglePermission(p.key)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-400" />
                Save changes to apply new permissions. Changes are tracked in audit logs (recommended).
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                  disabled={saving || loading}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unsaved changes dialog */}
      <AlertDialog open={unsavedOpen} onOpenChange={setUnsavedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you go back now, your updates will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-red-600 hover:bg-red-700">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
