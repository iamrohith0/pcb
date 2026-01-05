// src/pages/admin/roles/RoleCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function normalizeKey(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9:_-]/g, "");
}

export default function RoleCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ----- Form state -----
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    is_active: true,
  });

  const [autoKey, setAutoKey] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ----- Permissions state -----
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [permissions, setPermissions] = useState([]); // [{id, name, key, module, action, scope, is_active}]
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // search/filter
  const [q, setQ] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const MODULES = useMemo(
    () => [
      "all",
      "dashboard",
      "sales",
      "engineering",
      "production",
      "quality",
      "inventory",
      "procurement",
      "warehouse",
      "logistics",
      "maintenance",
      "traceability",
      "reports",
      "admin",
      "settings",
    ],
    []
  );

  // suggested key from role name
  const suggestedKey = useMemo(() => normalizeKey(form.name), [form.name]);

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (autoKey && field === "name") next.key = suggestedKey;
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ----- Fetch permissions -----
  useEffect(() => {
    const fetchPerms = async () => {
      setLoadingPerms(true);
      try {
        // ✅ Adjust endpoint to match your backend
        // Common: GET /admin/permissions (optionally supports ?q=)
        const res = await api.get("/admin/permissions");
        const rows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setPermissions(rows);
      } catch (err) {
        toast({
          title: "Failed to load permissions",
          description: "Could not fetch permission list. You can still create a role without permissions.",
          variant: "destructive",
        });
      } finally {
        setLoadingPerms(false);
      }
    };

    fetchPerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPermissions = useMemo(() => {
    const query = q.trim().toLowerCase();
    return permissions
      .filter((p) => {
        if (moduleFilter !== "all" && String(p.module || "").toLowerCase() !== moduleFilter) return false;
        if (!query) return true;
        const hay = `${p.name || ""} ${p.key || ""} ${p.module || ""} ${p.action || ""} ${p.scope || ""}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => {
        const am = String(a.module || "");
        const bm = String(b.module || "");
        if (am !== bm) return am.localeCompare(bm);
        return String(a.key || "").localeCompare(String(b.key || ""));
      });
  }, [permissions, q, moduleFilter]);

  const groupedByModule = useMemo(() => {
    const map = new Map();
    for (const p of filteredPermissions) {
      const mod = String(p.module || "other").toLowerCase();
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod).push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredPermissions]);

  const selectedCount = selectedKeys.size;

  const toggleKey = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      filteredPermissions.forEach((p) => p?.key && next.add(p.key));
      return next;
    });
  };

  const clearAll = () => setSelectedKeys(new Set());

  const validate = () => {
    const nextErrors = {};
    if (!form.name?.trim()) nextErrors.name = "Role name is required.";
    if (!form.key?.trim()) nextErrors.key = "Role key is required.";

    const key = form.key?.trim();
    if (key && !/^[a-z0-9:_-]+$/i.test(key)) {
      nextErrors.key = "Key can only contain letters, numbers, :, _, and - (no spaces).";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Fix validation errors",
        description: "Please check the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // ✅ Adjust endpoint to match your backend
      // Common: POST /admin/roles
      const payload = {
        name: form.name.trim(),
        key: normalizeKey(form.key),
        description: form.description?.trim() || null,
        is_active: !!form.is_active,

        // Recommended: assign permissions by keys (stable)
        permission_keys: Array.from(selectedKeys),

        // If your backend expects ids instead, you can map:
        // permission_ids: permissions.filter(p => selectedKeys.has(p.key)).map(p => p.id)
      };

      await api.post("/admin/roles", payload);

      toast({
        title: "Role created",
        description: `Added "${payload.name}" with ${payload.permission_keys.length} permission(s).`,
      });

      navigate("/admin/roles", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422 && data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      }

      let msg = "Failed to create role. Please try again.";
      if (status === 409) msg = "A role with this key already exists.";
      if (typeof data?.message === "string") msg = data.message;

      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Role</h1>
          <p className="text-sm text-gray-500">
            Roles group permissions for PCBxpress users (Sales, CAM/DFM, Production, Quality, Stores, etc.).
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Create"}
          </Button>
        </div>
      </div>

      {/* Role form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Role Details</CardTitle>
          <CardDescription>Use a clear name and a stable key (e.g., <span className="font-mono">production_operator</span>).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g., Production Operator"
                  className={cx(errors.name && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </div>

              {/* Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="key">Role Key</Label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoKey}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAutoKey(checked);
                        if (checked) setForm((p) => ({ ...p, key: suggestedKey }));
                      }}
                    />
                    Auto-generate
                  </label>
                </div>

                <Input
                  id="key"
                  value={form.key}
                  onChange={(e) => setField("key", e.target.value)}
                  placeholder="e.g., production_operator"
                  className={cx(errors.key && "border-red-500 focus-visible:ring-red-500")}
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">Suggested:</span>
                  <Badge variant="secondary" className="font-mono">
                    {suggestedKey || "—"}
                  </Badge>
                </div>
                {errors.key && <p className="text-xs text-red-600">{errors.key}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                placeholder="What does this role do? Example: Can view & update WIP stages, issue materials, and print travelers."
              />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div>
                <p className="text-sm font-semibold">Active</p>
                <p className="text-xs text-gray-500">Inactive roles cannot be used for login/access.</p>
              </div>
              <button
                type="button"
                onClick={() => setField("is_active", !form.is_active)}
                className={cx(
                  "inline-flex h-9 items-center rounded-full border px-2 transition-colors",
                  form.is_active ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                )}
                aria-label={form.is_active ? "Set inactive" : "Set active"}
              >
                <span
                  className={cx(
                    "h-5 w-5 rounded-full transition-transform",
                    form.is_active ? "translate-x-4 bg-green-600" : "translate-x-0 bg-gray-400"
                  )}
                />
              </button>
            </div>

            {/* Permissions */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Assign Permissions</CardTitle>
                    <CardDescription>Select what this role can access.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={selectAllVisible} disabled={loadingPerms}>
                      Select Visible
                    </Button>
                    <Button type="button" variant="ghost" onClick={clearAll} disabled={loadingPerms || selectedCount === 0}>
                      Clear
                    </Button>
                    <Badge variant="secondary">{selectedCount} selected</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Search</Label>
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search permissions (name, key, module, action...)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Module</Label>
                    <select
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {MODULES.map((m) => (
                        <option key={m} value={m}>
                          {m === "all" ? "All modules" : m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadingPerms ? (
                  <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">Loading permissions...</div>
                ) : groupedByModule.length === 0 ? (
                  <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
                    No permissions found. Create permissions first in <span className="font-mono">Admin → Permissions</span>.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedByModule.map(([mod, items]) => (
                      <div key={mod} className="rounded-xl border bg-white">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold capitalize">{mod}</p>
                            <Badge variant="secondary">{items.length}</Badge>
                          </div>

                          <button
                            type="button"
                            className="text-xs font-medium text-gray-600 hover:text-gray-900"
                            onClick={() => {
                              setSelectedKeys((prev) => {
                                const next = new Set(prev);
                                const allSelected = items.every((p) => p?.key && next.has(p.key));
                                items.forEach((p) => {
                                  if (!p?.key) return;
                                  if (allSelected) next.delete(p.key);
                                  else next.add(p.key);
                                });
                                return next;
                              });
                            }}
                          >
                            Toggle all
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
                          {items.map((p) => {
                            const key = p?.key || "";
                            const checked = key ? selectedKeys.has(key) : false;
                            return (
                              <label
                                key={p.id || key}
                                className={cx(
                                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                                  checked ? "border-[#dc2551]/30 bg-[#dc2551]/5" : "hover:bg-gray-50"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleKey(key)}
                                  disabled={!key}
                                  className="mt-1"
                                />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900">{p.name || key}</p>
                                    {p.action && <Badge variant="secondary" className="capitalize">{p.action}</Badge>}
                                    {p.scope && <Badge variant="outline" className="capitalize">{p.scope}</Badge>}
                                    {p.is_active === false && <Badge variant="destructive">Inactive</Badge>}
                                  </div>
                                  <p className="mt-1 truncate font-mono text-xs text-gray-500">{key}</p>
                                  {p.description ? <p className="mt-1 line-clamp-2 text-xs text-gray-600">{p.description}</p> : null}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer actions */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate("/admin/roles")} disabled={saving}>
                Back to Roles
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
