// src/pages/admin/permissions/PermissionAudit.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Activity,
  Download,
  Eye,
  Filter,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCircle2,
} from "lucide-react";

import api from "@/lib/axios";

// ---------------------------
// Helpers
// ---------------------------
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeString(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatWhen(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function normalizeActor(actor) {
  if (!actor) return { name: "System", role: "system", email: "" };
  if (typeof actor === "string") return { name: actor, role: "", email: "" };
  return {
    name: actor.name || actor.username || actor.email || "Unknown",
    role: actor.role || "",
    email: actor.email || "",
  };
}

// ---------------------------
// UI bits
// ---------------------------
function Pill({ tone = "neutral", children }) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "danger"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : tone === "warn"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : tone === "info"
            ? "bg-sky-50 text-sky-700 ring-sky-200"
            : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", cls)}>
      {children}
    </span>
  );
}

function getActionTone(action) {
  const a = (action || "").toLowerCase();
  if (a.includes("delete") || a.includes("revoke") || a.includes("remove")) return "danger";
  if (a.includes("create") || a.includes("grant") || a.includes("assign") || a.includes("enable")) return "success";
  if (a.includes("update") || a.includes("edit") || a.includes("change")) return "warn";
  if (a.includes("login") || a.includes("logout") || a.includes("imperson")) return "info";
  return "neutral";
}

function exportCSV(rows, filename = "permission_audit.csv") {
  const headers = [
    "timestamp",
    "actor_name",
    "actor_role",
    "action",
    "target_type",
    "target_id",
    "target_name",
    "resource",
    "permission",
    "ip",
    "notes",
  ];

  const esc = (v) => {
    const s = safeString(v).replaceAll("\r\n", "\n").replaceAll("\r", "\n");
    const needs = s.includes(",") || s.includes('"') || s.includes("\n");
    const out = s.replaceAll('"', '""');
    return needs ? `"${out}"` : out;
  };

  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r?.[h];
          return esc(v);
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------
// Main Page
// ---------------------------
export default function PermissionAudit() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [permission, setPermission] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState(""); // yyyy-mm-dd

  // UI state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState("90");
  const [purging, setPurging] = useState(false);

  // NOTE: This page is backend-ready:
  // - If your backend provides endpoints, it will use them.
  // - If not, it falls back to mock data so UI still works.
  const fetchAudit = async () => {
    setLoading(true);
    try {
      // Expected optional endpoint (recommended):
      // GET /admin/permissions/audit?query=&actor=&action=&resource=&permission=&from=&to=
      const params = {
        query: q || undefined,
        actor: actor || undefined,
        action: action || undefined,
        resource: resource || undefined,
        permission: permission || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      };

      let res;
      try {
        res = await api.get("/admin/permissions/audit", { params });
      } catch (e1) {
        // Fallback 1: common pattern
        try {
          res = await api.get("/admin/audit-logs", { params: { ...params, type: "permission" } });
        } catch (e2) {
          // No endpoint? fall back to mock
          res = null;
        }
      }

      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || [];
        setRows(
          list.map((it) => ({
            id: it.id ?? it._id ?? `${it.timestamp || it.createdAt || Date.now()}-${Math.random()}`,
            timestamp: it.timestamp ?? it.createdAt ?? it.time ?? null,
            actor_name: normalizeActor(it.actor).name,
            actor_role: normalizeActor(it.actor).role,
            action: it.action ?? it.event ?? it.type ?? "UNKNOWN",
            target_type: it.target_type ?? it.targetType ?? it.target?.type ?? "",
            target_id: it.target_id ?? it.targetId ?? it.target?.id ?? "",
            target_name: it.target_name ?? it.targetName ?? it.target?.name ?? "",
            resource: it.resource ?? it.module ?? it.subject ?? "",
            permission: it.permission ?? it.perm ?? it.permission_code ?? "",
            ip: it.ip ?? it.ip_address ?? it.meta?.ip ?? "",
            notes: it.notes ?? it.message ?? it.meta?.notes ?? "",
            raw: it,
          }))
        );
      } else {
        // Mock sample for PCBxpress ERP
        const now = new Date();
        const iso = (minsAgo) => new Date(now.getTime() - minsAgo * 60 * 1000).toISOString();
        setRows([
          {
            id: "a1",
            timestamp: iso(12),
            actor_name: "Admin",
            actor_role: "admin",
            action: "GRANT_PERMISSION",
            target_type: "role",
            target_id: "role_qc",
            target_name: "Quality Inspector",
            resource: "quality",
            permission: "quality.inspections.create",
            ip: "192.168.1.10",
            notes: "Enabled inspection creation for QC team",
            raw: { sample: true },
          },
          {
            id: "a2",
            timestamp: iso(45),
            actor_name: "Admin",
            actor_role: "admin",
            action: "REVOKE_PERMISSION",
            target_type: "user",
            target_id: "u_102",
            target_name: "Ravi (Stores)",
            resource: "inventory",
            permission: "inventory.stock.adjust",
            ip: "192.168.1.10",
            notes: "Restricted stock adjustments",
            raw: { sample: true },
          },
          {
            id: "a3",
            timestamp: iso(160),
            actor_name: "Priya",
            actor_role: "engineering_manager",
            action: "UPDATE_ROLE",
            target_type: "role",
            target_id: "role_cam",
            target_name: "CAM Engineer",
            resource: "engineering.cam",
            permission: "",
            ip: "192.168.1.22",
            notes: "Updated CAM role description",
            raw: { sample: true },
          },
        ]);
      }
    } catch (err) {
      toast({
        title: "Failed to load audit logs",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const aa = actor.trim().toLowerCase();
    const ac = action.trim().toLowerCase();
    const rr = resource.trim().toLowerCase();
    const pp = permission.trim().toLowerCase();

    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return rows.filter((r) => {
      const hay = [
        r.actor_name,
        r.actor_role,
        r.action,
        r.target_type,
        r.target_id,
        r.target_name,
        r.resource,
        r.permission,
        r.ip,
        r.notes,
      ]
        .map((x) => safeString(x).toLowerCase())
        .join(" | ");

      if (qq && !hay.includes(qq)) return false;

      if (aa) {
        const actorHay = `${safeString(r.actor_name)} ${safeString(r.actor_role)}`.toLowerCase();
        if (!actorHay.includes(aa)) return false;
      }

      if (ac && !safeString(r.action).toLowerCase().includes(ac)) return false;
      if (rr && !safeString(r.resource).toLowerCase().includes(rr)) return false;
      if (pp && !safeString(r.permission).toLowerCase().includes(pp)) return false;

      if (fromTime || toTime) {
        const t = r.timestamp ? new Date(r.timestamp).getTime() : null;
        if (!t || Number.isNaN(t)) return false;
        if (fromTime && t < fromTime) return false;
        if (toTime && t > toTime) return false;
      }

      return true;
    });
  }, [rows, q, actor, action, resource, permission, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const total = filtered.length;
    const grants = filtered.filter((r) => (r.action || "").toLowerCase().includes("grant")).length;
    const revokes = filtered.filter((r) => (r.action || "").toLowerCase().includes("revoke")).length;
    return { total, grants, revokes };
  }, [filtered]);

  const openDetails = (row) => {
    setSelected(row);
    setDetailsOpen(true);
  };

  const doExport = () => {
    const forExport = filtered.map((r) => ({
      timestamp: r.timestamp,
      actor_name: r.actor_name,
      actor_role: r.actor_role,
      action: r.action,
      target_type: r.target_type,
      target_id: r.target_id,
      target_name: r.target_name,
      resource: r.resource,
      permission: r.permission,
      ip: r.ip,
      notes: r.notes,
    }));
    exportCSV(forExport, `pcbxpress_permission_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Export started", description: "Downloaded CSV file." });
  };

  const purgeOldLogs = async () => {
    const days = Number(purgeDays);
    if (!Number.isFinite(days) || days <= 0) {
      toast({ title: "Invalid days", description: "Enter a valid number of days.", variant: "destructive" });
      return;
    }

    setPurging(true);
    try {
      // Recommended endpoint:
      // DELETE /admin/permissions/audit?older_than_days=90
      let ok = false;
      try {
        await api.delete("/admin/permissions/audit", { params: { older_than_days: days } });
        ok = true;
      } catch {
        // Fallback generic
        try {
          await api.delete("/admin/audit-logs", { params: { type: "permission", older_than_days: days } });
          ok = true;
        } catch {
          ok = false;
        }
      }

      if (ok) {
        toast({ title: "Purge complete", description: `Deleted logs older than ${days} days.` });
        setPurgeOpen(false);
        fetchAudit();
      } else {
        toast({
          title: "Purge not available",
          description: "Backend purge endpoint is not configured yet.",
          variant: "destructive",
        });
      }
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Permission Audit</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track who changed roles/permissions in PCBxpress ERP (security & compliance).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchAudit} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={doExport} disabled={loading || filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setPurgeOpen(true)}
            disabled={loading}
            title="Delete old logs (requires backend support)"
          >
            <Trash2 className="h-4 w-4" />
            Purge
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
              <Activity className="h-4 w-4 text-gray-500" /> Events
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
            <div className="text-xs text-gray-500">in current filters</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
              <ShieldCheck className="h-4 w-4 text-gray-500" /> Grants
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{counts.grants}</div>
            <div className="text-xs text-gray-500">permissions granted</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-700">
              <Filter className="h-4 w-4 text-gray-500" /> Revokes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{counts.revokes}</div>
            <div className="text-xs text-gray-500">permissions revoked</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search actor, target, permission, IP..."
              />
            </div>

            <div>
              <Label>Actor</Label>
              <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Admin / QC..." />
            </div>

            <div>
              <Label>Action</Label>
              <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="GRANT / REVOKE..." />
            </div>

            <div>
              <Label>Resource</Label>
              <Input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="quality / cam..." />
            </div>

            <div>
              <Label>Permission</Label>
              <Input
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                placeholder="quality.inspections.create"
              />
            </div>

            <div>
              <Label>Date From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div>
              <Label>Date To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            <div className="md:col-span-6 flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setQ("");
                  setActor("");
                  setAction("");
                  setResource("");
                  setPermission("");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear
              </Button>

              <Button className="gap-2" onClick={fetchAudit} disabled={loading}>
                <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Audit Events</CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">When</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Actor</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Action</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Target</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Resource</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Permission</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">IP</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-10 text-center text-gray-500" colSpan={8}>
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-10 text-center text-gray-500" colSpan={8}>
                      No audit events found for current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const tone = getActionTone(r.action);
                    return (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{formatWhen(r.timestamp)}</td>

                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700">
                              <UserCircle2 className="h-4 w-4" />
                            </span>
                            <div className="leading-tight">
                              <div className="font-medium text-gray-900">{r.actor_name || "Unknown"}</div>
                              <div className="text-xs text-gray-500">{r.actor_role || "-"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <Pill tone={tone}>{r.action || "UNKNOWN"}</Pill>
                        </td>

                        <td className="px-3 py-2">
                          <div className="leading-tight">
                            <div className="font-medium text-gray-900">
                              {r.target_name || r.target_id || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {r.target_type || "target"} {r.target_id ? `• ${r.target_id}` : ""}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <Badge variant="secondary">{r.resource || "-"}</Badge>
                        </td>

                        <td className="px-3 py-2">
                          <span className="text-gray-800">{r.permission || "-"}</span>
                        </td>

                        <td className="px-3 py-2 text-gray-700">{r.ip || "-"}</td>

                        <td className="px-3 py-2 text-right">
                          <Button variant="ghost" size="sm" className="gap-2" onClick={() => openDetails(r)}>
                            <Eye className="h-4 w-4" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 text-xs text-gray-500">
            Tip: For PCB manufacturing ERP, audit is critical for compliance (role changes for QC, CAM, Stores, Dispatch).
          </div>
        </CardContent>
      </Card>

      {/* Details dialog */}
      <AlertDialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gray-700" /> Permission Audit Details
            </AlertDialogTitle>
            <AlertDialogDescription>
              Full details for security review and traceability.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold text-gray-500">When</div>
              <div className="mt-1 text-sm text-gray-900">{formatWhen(selected?.timestamp)}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold text-gray-500">Action</div>
              <div className="mt-1 text-sm text-gray-900">{selected?.action || "-"}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold text-gray-500">Actor</div>
              <div className="mt-1 text-sm text-gray-900">{selected?.actor_name || "-"}</div>
              <div className="text-xs text-gray-500">{selected?.actor_role || "-"}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold text-gray-500">IP Address</div>
              <div className="mt-1 text-sm text-gray-900">{selected?.ip || "-"}</div>
            </div>

            <div className="rounded-lg border p-3 md:col-span-2">
              <div className="text-xs font-semibold text-gray-500">Target</div>
              <div className="mt-1 text-sm text-gray-900">
                {selected?.target_name || selected?.target_id || "-"}
              </div>
              <div className="text-xs text-gray-500">
                {selected?.target_type || "target"} {selected?.target_id ? `• ${selected?.target_id}` : ""}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold text-gray-500">Resource</div>
              <div className="mt-1 text-sm text-gray-900">{selected?.resource || "-"}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold text-gray-500">Permission</div>
              <div className="mt-1 text-sm text-gray-900">{selected?.permission || "-"}</div>
            </div>

            <div className="rounded-lg border p-3 md:col-span-2">
              <div className="text-xs font-semibold text-gray-500">Notes</div>
              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selected?.notes || "-"}</div>
            </div>

            <div className="rounded-lg border p-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500">Raw Event (debug)</div>
                  <div className="text-xs text-gray-500">
                    Use this for backend mapping during integration.
                  </div>
                </div>
                {selected?.raw && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      navigator.clipboard?.writeText(JSON.stringify(selected.raw, null, 2));
                      toast({ title: "Copied", description: "Raw event copied to clipboard." });
                    }}
                  >
                    Copy JSON
                  </Button>
                )}
              </div>

              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
{selected?.raw ? JSON.stringify(selected.raw, null, 2) : "{}"}
              </pre>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDetailsOpen(false)}
              className="gap-2"
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purge dialog */}
      <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purge old permission logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete audit entries older than the given number of days. This action requires backend support.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label>Older than (days)</Label>
            <Input value={purgeDays} onChange={(e) => setPurgeDays(e.target.value)} placeholder="90" />
            <p className="text-xs text-gray-500">
              Recommended for PCB ERP: keep at least 180 days for compliance, audits, and customer disputes.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={purging}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={purgeOldLogs} disabled={purging} className="gap-2">
              {purging ? "Purging..." : "Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer link */}
      <div className="text-xs text-gray-500">
        Want to manage permissions?{" "}
        <Link to="/admin/permissions" className="text-blue-600 hover:underline">
          Go to Permissions Matrix
        </Link>
      </div>
    </div>
  );
}
