// src/pages/admin/permissions/PermissionsMatrix.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ShieldCheck, RefreshCw, Save, Search, Undo2, Eye, Factory, Layers, Settings, ClipboardCheck } from "lucide-react";

// ---------------------------
// Helpers
// ---------------------------
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const ROLE_LABELS = {
  admin: "Admin",
  sales_engineer: "Sales Engineer",
  engineering_manager: "Engineering Manager",
  cam_engineer: "CAM Engineer",
  production_planner: "Production Planner",
  qc_inspector: "Quality Inspector",
  store_keeper: "Stores / Inventory",
  maintenance_tech: "Maintenance Technician",
  dispatch: "Dispatch / Logistics",
  accountant: "Accounts",
};

const PCB_RESOURCES = [
  {
    key: "sales",
    label: "Sales",
    icon: Layers,
    permissions: [
      { key: "sales.rfq.view", label: "View RFQ" },
      { key: "sales.rfq.create", label: "Create RFQ" },
      { key: "sales.quotation.create", label: "Create Quotation" },
      { key: "sales.order.create", label: "Create Sales Order" },
      { key: "sales.invoice.view", label: "View Invoices" },
      { key: "sales.customer.manage", label: "Manage Customers" },
    ],
  },
  {
    key: "engineering",
    label: "Engineering",
    icon: Factory,
    permissions: [
      { key: "engineering.dfm.view", label: "View DFM Queue" },
      { key: "engineering.dfm.review", label: "Approve / Reject DFM" },
      { key: "engineering.cam.generate", label: "Generate CAM Outputs" },
      { key: "engineering.panelization.edit", label: "Edit Panelization" },
      { key: "engineering.stackup.edit", label: "Edit Stackups" },
      { key: "engineering.revisions.manage", label: "Manage Revisions (ECO)" },
    ],
  },
  {
    key: "production",
    label: "Production",
    icon: Settings,
    permissions: [
      { key: "production.workorders.create", label: "Create Work Orders" },
      { key: "production.workorders.issue", label: "Issue Materials" },
      { key: "production.wip.move", label: "Move WIP Stages" },
      { key: "production.scheduling.manage", label: "Manage Scheduling" },
      { key: "production.capacity.view", label: "View Capacity" },
    ],
  },
  {
    key: "quality",
    label: "Quality",
    icon: ClipboardCheck,
    permissions: [
      { key: "quality.inspections.create", label: "Create Inspections" },
      { key: "quality.aoi.view", label: "View AOI Results" },
      { key: "quality.etest.view", label: "View E-Test Results" },
      { key: "quality.ncr.create", label: "Create NCR" },
      { key: "quality.capa.manage", label: "Manage CAPA" },
      { key: "quality.certificates.issue", label: "Issue Certificates" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: Layers,
    permissions: [
      { key: "inventory.items.manage", label: "Manage Items (Material Master)" },
      { key: "inventory.stock.view", label: "View Stock" },
      { key: "inventory.stock.adjust", label: "Stock Adjustments" },
      { key: "inventory.lots.manage", label: "Manage Lots / Batches" },
      { key: "inventory.serials.manage", label: "Manage Serials" },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    permissions: [
      { key: "admin.users.manage", label: "Manage Users" },
      { key: "admin.roles.manage", label: "Manage Roles" },
      { key: "admin.permissions.manage", label: "Manage Permissions" },
      { key: "admin.audit.view", label: "View Audit Logs" },
      { key: "admin.settings.manage", label: "Manage Settings" },
    ],
  },
];

function buildDefaultMatrix() {
  // sensible PCBxpress defaults (editable in UI)
  const roleKeys = Object.keys(ROLE_LABELS);
  const permKeys = PCB_RESOURCES.flatMap((r) => r.permissions.map((p) => p.key));
  const matrix = {};
  for (const role of roleKeys) {
    matrix[role] = {};
    for (const perm of permKeys) matrix[role][perm] = false;
  }

  // Defaults:
  // admin: all
  for (const perm of permKeys) matrix.admin[perm] = true;

  // sales_engineer:
  [
    "sales.rfq.view",
    "sales.rfq.create",
    "sales.quotation.create",
    "sales.order.create",
    "sales.invoice.view",
    "sales.customer.manage",
  ].forEach((p) => (matrix.sales_engineer[p] = true));

  // engineering_manager:
  [
    "engineering.dfm.view",
    "engineering.dfm.review",
    "engineering.revisions.manage",
    "engineering.stackup.edit",
    "engineering.panelization.edit",
  ].forEach((p) => (matrix.engineering_manager[p] = true));

  // cam_engineer:
  ["engineering.dfm.view", "engineering.cam.generate", "engineering.panelization.edit"].forEach((p) => (matrix.cam_engineer[p] = true));

  // production_planner:
  ["production.workorders.create", "production.workorders.issue", "production.scheduling.manage", "production.capacity.view"].forEach(
    (p) => (matrix.production_planner[p] = true)
  );

  // qc_inspector:
  ["quality.inspections.create", "quality.aoi.view", "quality.etest.view", "quality.ncr.create"].forEach((p) => (matrix.qc_inspector[p] = true));

  // store_keeper:
  ["inventory.stock.view", "inventory.stock.adjust", "inventory.lots.manage", "inventory.serials.manage"].forEach((p) => (matrix.store_keeper[p] = true));

  // maintenance_tech:
  ["production.capacity.view"].forEach((p) => (matrix.maintenance_tech[p] = true));

  // dispatch:
  ["sales.invoice.view", "inventory.stock.view"].forEach((p) => (matrix.dispatch[p] = true));

  // accountant:
  ["sales.invoice.view"].forEach((p) => (matrix.accountant[p] = true));

  return matrix;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ---------------------------
// Page
// ---------------------------
export default function PermissionsMatrix() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roleKeys, setRoleKeys] = useState(Object.keys(ROLE_LABELS));
  const [resources, setResources] = useState(PCB_RESOURCES);

  const [matrix, setMatrix] = useState(() => buildDefaultMatrix());
  const [initialMatrix, setInitialMatrix] = useState(() => buildDefaultMatrix());

  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("admin");

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(matrix) !== JSON.stringify(initialMatrix);
  }, [matrix, initialMatrix]);

  const permList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = resources.flatMap((r) =>
      r.permissions.map((p) => ({
        resourceKey: r.key,
        resourceLabel: r.label,
        icon: r.icon,
        permKey: p.key,
        permLabel: p.label,
      }))
    );

    if (!q) return all;
    return all.filter((x) => {
      const hay = `${x.resourceLabel} ${x.permKey} ${x.permLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [resources, search]);

  const roleStats = useMemo(() => {
    const allPermKeys = resources.flatMap((r) => r.permissions.map((p) => p.key));
    const out = {};
    for (const role of roleKeys) {
      const enabled = allPermKeys.filter((p) => !!matrix?.[role]?.[p]).length;
      out[role] = { enabled, total: allPermKeys.length };
    }
    return out;
  }, [matrix, roleKeys, resources]);

  const loadFromBackend = async () => {
    setLoading(true);
    try {
      // Recommended endpoints:
      // GET  /admin/roles
      // GET  /admin/permissions/matrix
      // If missing, uses local defaults.

      let roles = null;
      try {
        const r = await api.get("/admin/roles");
        roles = Array.isArray(r.data) ? r.data : r.data?.items || r.data?.data || null;
      } catch {
        roles = null;
      }

      if (roles && Array.isArray(roles) && roles.length) {
        const roleIds = roles.map((x) => x.key || x.code || x.name).filter(Boolean);
        // keep stable ordering: admin first if present
        roleIds.sort((a, b) => (a === "admin" ? -1 : b === "admin" ? 1 : a.localeCompare(b)));
        setRoleKeys(roleIds);
      }

      let serverMatrix = null;
      try {
        const m = await api.get("/admin/permissions/matrix");
        serverMatrix = m.data?.matrix || m.data?.data || m.data;
      } catch {
        serverMatrix = null;
      }

      if (serverMatrix && typeof serverMatrix === "object") {
        // normalize: ensure all roles + perms exist
        const allPermKeys = resources.flatMap((r) => r.permissions.map((p) => p.key));
        const normalized = {};
        const useRoles = roles
          ? roles.map((x) => x.key || x.code || x.name).filter(Boolean)
          : roleKeys;

        for (const role of useRoles) {
          normalized[role] = {};
          for (const permKey of allPermKeys) normalized[role][permKey] = !!serverMatrix?.[role]?.[permKey];
        }

        setMatrix(normalized);
        setInitialMatrix(deepClone(normalized));
      } else {
        const d = buildDefaultMatrix();
        setMatrix(d);
        setInitialMatrix(deepClone(d));
      }
    } catch (err) {
      toast({
        title: "Failed to load permissions",
        description: err?.response?.data?.message || "Using default permission matrix.",
        variant: "destructive",
      });
      const d = buildDefaultMatrix();
      setMatrix(d);
      setInitialMatrix(deepClone(d));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePermission = (role, permKey, value) => {
    setMatrix((prev) => {
      const next = deepClone(prev);
      if (!next[role]) next[role] = {};
      next[role][permKey] = !!value;
      return next;
    });
  };

  const bulkSetRole = (role, value) => {
    const allPermKeys = resources.flatMap((r) => r.permissions.map((p) => p.key));
    setMatrix((prev) => {
      const next = deepClone(prev);
      if (!next[role]) next[role] = {};
      for (const p of allPermKeys) next[role][p] = !!value;
      return next;
    });
  };

  const bulkSetResourceForRole = (role, resourceKey, value) => {
    const res = resources.find((r) => r.key === resourceKey);
    if (!res) return;

    setMatrix((prev) => {
      const next = deepClone(prev);
      if (!next[role]) next[role] = {};
      for (const p of res.permissions) next[role][p.key] = !!value;
      return next;
    });
  };

  const saveToBackend = async () => {
    setSaving(true);
    try {
      // Recommended endpoint:
      // PUT /admin/permissions/matrix  { matrix: {...} }
      // Fallback: POST /admin/permissions/matrix
      let ok = false;
      try {
        await api.put("/admin/permissions/matrix", { matrix });
        ok = true;
      } catch {
        try {
          await api.post("/admin/permissions/matrix", { matrix });
          ok = true;
        } catch {
          ok = false;
        }
      }

      if (ok) {
        setInitialMatrix(deepClone(matrix));
        toast({ title: "Saved", description: "Permission matrix updated successfully." });
        setConfirmSaveOpen(false);
      } else {
        toast({
          title: "Save not available",
          description: "Backend endpoint for saving permission matrix is not configured yet.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const resetToInitial = () => {
    setMatrix(deepClone(initialMatrix));
    setConfirmResetOpen(false);
    toast({ title: "Reset", description: "Reverted changes." });
  };

  const activePermRows = useMemo(() => {
    // group by resource for the active role view
    const groups = {};
    for (const row of permList) {
      if (!groups[row.resourceKey]) {
        groups[row.resourceKey] = {
          resourceKey: row.resourceKey,
          resourceLabel: row.resourceLabel,
          icon: row.icon,
          items: [],
        };
      }
      groups[row.resourceKey].items.push(row);
    }
    return Object.values(groups);
  }, [permList]);

  const roleAllEnabled = useMemo(() => {
    const allPermKeys = resources.flatMap((r) => r.permissions.map((p) => p.key));
    const enabled = allPermKeys.filter((p) => !!matrix?.[activeRole]?.[p]).length;
    return enabled === allPermKeys.length;
  }, [matrix, activeRole, resources]);

  const roleNoneEnabled = useMemo(() => {
    const allPermKeys = resources.flatMap((r) => r.permissions.map((p) => p.key));
    const enabled = allPermKeys.filter((p) => !!matrix?.[activeRole]?.[p]).length;
    return enabled === 0;
  }, [matrix, activeRole, resources]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Permissions Matrix</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define role-based access for PCBxpress ERP modules (Sales → Engineering → Production → Quality → Inventory).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={loadFromBackend} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setConfirmResetOpen(true)}
            disabled={loading || !hasUnsavedChanges}
          >
            <Undo2 className="h-4 w-4" />
            Reset
          </Button>

          <Button
            className="gap-2"
            onClick={() => setConfirmSaveOpen(true)}
            disabled={loading || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/permissions/audit">
              <Eye className="h-4 w-4" />
              View Audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Role list */}
        <Card className="border border-gray-200 lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              Roles
            </CardTitle>
            <CardDescription className="text-xs">
              Select a role to edit its access across PCB manufacturing modules.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            {roleKeys.map((rk) => {
              const isActive = rk === activeRole;
              const label = ROLE_LABELS[rk] || rk;
              const stat = roleStats?.[rk];
              return (
                <button
                  key={rk}
                  onClick={() => setActiveRole(rk)}
                  className={cx(
                    "w-full rounded-xl border px-3 py-2 text-left transition",
                    isActive ? "border-[#dc2551]/30 bg-[#dc2551]/5" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={cx("inline-flex h-8 w-8 items-center justify-center rounded-lg", isActive ? "bg-[#dc2551] text-white" : "bg-gray-100 text-gray-700")}>
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div className="leading-tight">
                        <div className="font-semibold text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500">{rk}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">Enabled</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {stat ? `${stat.enabled}/${stat.total}` : "-"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="border border-gray-200 lg:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm text-gray-700">
                  Edit: <span className="text-gray-900">{ROLE_LABELS[activeRole] || activeRole}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Toggle permissions. Use bulk actions to speed up role setup for your PCB factory.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkSetRole(activeRole, true)}
                  disabled={loading || roleAllEnabled}
                >
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkSetRole(activeRole, false)}
                  disabled={loading || roleNoneEnabled}
                >
                  Disable All
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label>Search permissions</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search: DFM, WIP, NCR, stock..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <div className="text-xs text-gray-500">
                  Tip: Keep QC permissions limited (NCR/CAPA) and CAM permissions specific (outputs/panelization).
                </div>
              </div>
            </div>

            {/* Permission groups */}
            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                  Loading permission matrix...
                </div>
              ) : activePermRows.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                  No permissions match your search.
                </div>
              ) : (
                activePermRows.map((group) => {
                  const Icon = group.icon || ShieldCheck;
                  const keys = group.items.map((x) => x.permKey);

                  const enabledCount = keys.filter((k) => !!matrix?.[activeRole]?.[k]).length;
                  const allEnabled = enabledCount === keys.length;
                  const noneEnabled = enabledCount === 0;

                  return (
                    <div key={group.resourceKey} className="rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="flex flex-col gap-2 border-b bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border">
                            <Icon className="h-4 w-4 text-gray-700" />
                          </span>
                          <div>
                            <div className="font-semibold text-gray-900">{group.resourceLabel}</div>
                            <div className="text-xs text-gray-500">{group.resourceKey}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {enabledCount}/{keys.length} enabled
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => bulkSetResourceForRole(activeRole, group.resourceKey, true)}
                            disabled={allEnabled}
                          >
                            Enable
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => bulkSetResourceForRole(activeRole, group.resourceKey, false)}
                            disabled={noneEnabled}
                          >
                            Disable
                          </Button>
                        </div>
                      </div>

                      <div className="divide-y">
                        {group.items.map((p) => {
                          const enabled = !!matrix?.[activeRole]?.[p.permKey];
                          return (
                            <div key={p.permKey} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="font-medium text-gray-900">{p.permLabel}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {p.permKey}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Resource: <span className="font-medium">{p.resourceLabel}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={cx("text-xs", enabled ? "text-emerald-700" : "text-gray-500")}>
                                  {enabled ? "Enabled" : "Disabled"}
                                </span>
                                <Switch
                                  checked={enabled}
                                  onCheckedChange={(v) => togglePermission(activeRole, p.permKey, v)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer note */}
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-semibold text-gray-900">Best practice for PCB factories</div>
                  <ul className="mt-1 list-disc pl-4 space-y-1">
                    <li>QC should create NCR/CAPA but not edit CAM outputs or change stackups.</li>
                    <li>Stores can adjust stock but should not issue certificates or approve DFM.</li>
                    <li>Production planners can create work orders but engineering must own DFM/CAM.</li>
                    <li>Admins keep audit enabled and review regularly.</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Save */}
      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save permission changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update access rules for roles in PCBxpress ERP. Changes should be audited for compliance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveToBackend} disabled={saving} className="gap-2">
              {saving ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reset */}
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert your edits for the current matrix back to the last loaded/saved state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetToInitial} className="gap-2">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom links */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Layers className="h-3.5 w-3.5" />
            PCBxpress ERP
          </Badge>
          <span>Role-based access control for PCB manufacturing operations.</span>
        </div>
        <div>
          Need detailed change history?{" "}
          <Link to="/admin/permissions/audit" className="text-blue-600 hover:underline">
            Open Permission Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
