// src/pages/admin/permissions/PermissionCreate.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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

export default function PermissionCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const MODULES = useMemo(
    () => [
      { value: "dashboard", label: "Dashboard" },
      { value: "sales", label: "Sales" },
      { value: "engineering", label: "Engineering (DFM/CAM)" },
      { value: "production", label: "Production (MES)" },
      { value: "quality", label: "Quality" },
      { value: "inventory", label: "Inventory / Stores" },
      { value: "procurement", label: "Procurement" },
      { value: "warehouse", label: "Warehouse" },
      { value: "logistics", label: "Logistics / Dispatch" },
      { value: "maintenance", label: "Maintenance" },
      { value: "traceability", label: "Traceability" },
      { value: "reports", label: "Reports" },
      { value: "admin", label: "Admin" },
      { value: "settings", label: "Settings" },
    ],
    []
  );

  const ACTIONS = useMemo(
    () => [
      { value: "view", label: "View" },
      { value: "create", label: "Create" },
      { value: "edit", label: "Edit" },
      { value: "delete", label: "Delete" },
      { value: "approve", label: "Approve" },
      { value: "export", label: "Export" },
      { value: "manage", label: "Manage" },
    ],
    []
  );

  const SCOPES = useMemo(
    () => [
      { value: "self", label: "Self (own data only)" },
      { value: "team", label: "Team (same department/team)" },
      { value: "plant", label: "Plant (same plant)" },
      { value: "all", label: "All (global)" },
    ],
    []
  );

  const [form, setForm] = useState({
    name: "",
    key: "",
    module: "production",
    action: "view",
    scope: "all",
    description: "",
    is_active: true,
  });

  const [autoKey, setAutoKey] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const suggestedKey = useMemo(() => {
    const module = form.module || "module";
    const action = form.action || "action";
    const namePart = normalizeKey(form.name).replace(/_/g, "");
    const raw = `${module}:${action}${namePart ? `:${namePart}` : ""}`;
    return normalizeKey(raw);
  }, [form.module, form.action, form.name]);

  const canSuggestKey = autoKey;

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (canSuggestKey && (field === "name" || field === "module" || field === "action")) {
        next.key = suggestedKey;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name?.trim()) nextErrors.name = "Permission name is required.";
    if (!form.key?.trim()) nextErrors.key = "Permission key is required.";
    if (!form.module) nextErrors.module = "Module is required.";
    if (!form.action) nextErrors.action = "Action is required.";
    if (!form.scope) nextErrors.scope = "Scope is required.";

    // Key format guard
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
      // Common choices:
      // POST /admin/permissions
      // POST /permissions
      const payload = {
        name: form.name.trim(),
        key: normalizeKey(form.key),
        module: form.module,
        action: form.action,
        scope: form.scope,
        description: form.description?.trim() || null,
        is_active: !!form.is_active,
      };

      await api.post("/admin/permissions", payload);

      toast({
        title: "Permission created",
        description: `Added "${payload.name}"`,
      });

      navigate("/admin/permissions", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // Backend validation mapping (optional)
      if (status === 422 && data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      }

      let msg = "Failed to create permission. Please try again.";
      if (status === 409) msg = "A permission with this key already exists.";
      if (typeof data?.message === "string") msg = data.message;

      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => {
    const moduleLabel = MODULES.find((m) => m.value === form.module)?.label ?? form.module;
    const actionLabel = ACTIONS.find((a) => a.value === form.action)?.label ?? form.action;
    const scopeLabel = SCOPES.find((s) => s.value === form.scope)?.label ?? form.scope;

    return { moduleLabel, actionLabel, scopeLabel };
  }, [form.module, form.action, form.scope, MODULES, ACTIONS, SCOPES]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Permission</h1>
          <p className="text-sm text-gray-500">
            Define access rules for PCBxpress modules (Sales, CAM/DFM, Production, Quality, Inventory, etc.)
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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Permission Details</CardTitle>
          <CardDescription>
            Use a consistent key format like <span className="font-mono">production:view:wip</span>.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Permission Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g., View Work Orders"
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Module / Action / Scope */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select
                  value={form.module}
                  onValueChange={(v) => setField("module", v)}
                  options={MODULES.map((m) => ({ value: m.value, label: m.label }))}
                />
                {errors.module && <p className="text-xs text-red-600">{errors.module}</p>}
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={form.action}
                  onValueChange={(v) => setField("action", v)}
                  options={ACTIONS.map((a) => ({ value: a.value, label: a.label }))}
                />
                {errors.action && <p className="text-xs text-red-600">{errors.action}</p>}
              </div>

              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={form.scope}
                  onValueChange={(v) => setField("scope", v)}
                  options={SCOPES.map((s) => ({ value: s.value, label: s.label }))}
                />
                {errors.scope && <p className="text-xs text-red-600">{errors.scope}</p>}
              </div>
            </div>

            {/* Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="key">Permission Key</Label>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoKey}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAutoKey(checked);
                      if (checked) {
                        setForm((p) => ({ ...p, key: suggestedKey }));
                      }
                    }}
                  />
                  Auto-generate key
                </label>
              </div>

              <Input
                id="key"
                value={form.key}
                onChange={(e) => setField("key", e.target.value)}
                placeholder="e.g., production:view:wip"
                className={cx(errors.key && "border-red-500 focus-visible:ring-red-500")}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-mono">Suggested:</span>
                <Badge variant="secondary" className="font-mono">
                  {suggestedKey || "—"}
                </Badge>
                <span className="hidden sm:inline">•</span>
                <span>
                  Module: <span className="font-medium text-gray-700">{preview.moduleLabel}</span>
                </span>
                <span>Action: <span className="font-medium text-gray-700">{preview.actionLabel}</span></span>
                <span>Scope: <span className="font-medium text-gray-700">{preview.scopeLabel}</span></span>
              </div>
              {errors.key && <p className="text-xs text-red-600">{errors.key}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Explain what this permission allows. Example: Can view WIP dashboard, work order status, and stage history."
                rows={4}
              />
              {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            </div>

            {/* Active */}
            <div className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div>
                <p className="text-sm font-semibold">Active</p>
                <p className="text-xs text-gray-500">Inactive permissions won’t grant access even if assigned.</p>
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

            {/* Footer actions */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate("/admin/permissions")} disabled={saving}>
                Back to Permissions
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Permission"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tip card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm font-semibold">Tip: PCB ERP permission naming</p>
          <p className="mt-1 text-sm text-gray-600">
            Keep keys consistent: <span className="font-mono">module:action:resource</span>. Examples:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-mono">engineering:view:dfm</Badge>
            <Badge variant="secondary" className="font-mono">engineering:manage:cam_outputs</Badge>
            <Badge variant="secondary" className="font-mono">production:edit:wip_move</Badge>
            <Badge variant="secondary" className="font-mono">quality:create:ncr</Badge>
            <Badge variant="secondary" className="font-mono">inventory:export:stock_ledger</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
