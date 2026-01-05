// src/pages/admin/audit-logs/AuditLogList.jsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  Calendar,
  Download,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.jsx";

/**
 * AuditLogList.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Purpose:
 * - View and search audit logs across all modules (Sales, Engineering, Production, Quality, Inventory, Admin)
 * - Track: who did what, when, from where, on which entity, with before/after changes
 *
 * Recommended backend endpoints:
 * - GET  /admin/audit-logs?from=YYYY-MM-DD&to=YYYY-MM-DD&actor=...&module=...&action=...&entity=...&q=...&page=1&page_size=20
 * - GET  /admin/audit-logs/:id
 * - GET  /admin/audit-logs/export?same_filters...  (CSV)
 * - DELETE /admin/audit-logs?older_than=YYYY-MM-DD   (optional retention purge)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function jsonPreview(obj, maxLen = 220) {
  try {
    const s = JSON.stringify(obj, null, 2);
    return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
  } catch {
    return "—";
  }
}

const MODULES = [
  "Sales",
  "Engineering",
  "Production",
  "Quality",
  "Inventory",
  "Procurement",
  "Warehouse",
  "Logistics",
  "Maintenance",
  "Traceability",
  "Admin",
];

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "LOGIN", "LOGOUT", "EXPORT", "PRINT", "MOVE", "ISSUE"];

const SEVERITIES = ["INFO", "WARN", "CRITICAL"];

export default function AuditLogList() {
  const { toast } = useToast();

  // Filters
  const [q, setQ] = useState("");
  const [module, setModule] = useState("All");
  const [action, setAction] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState(format(new Date(Date.now() - 7 * 24 * 3600 * 1000), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  // Table
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });

  const [loading, setLoading] = useState(false);

  // Drawer / Modal-like details
  const [selected, setSelected] = useState(null);

  // Confirmations
  const [confirmExport, setConfirmExport] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [purging, setPurging] = useState(false);

  const pageCount = useMemo(() => {
    const total = Number(meta.total || 0);
    const size = Number(meta.pageSize || 20);
    return Math.max(1, Math.ceil(total / size));
  }, [meta.total, meta.pageSize]);

  const queryParams = useMemo(() => {
    const params = {
      q: q.trim() || undefined,
      module: module !== "All" ? module : undefined,
      action: action !== "All" ? action : undefined,
      severity: severity !== "All" ? severity : undefined,
      actor: actor.trim() || undefined,
      entity: entity.trim() || undefined,
      from,
      to,
      page: meta.page,
      page_size: meta.pageSize,
    };
    return params;
  }, [q, module, action, severity, actor, entity, from, to, meta.page, meta.pageSize]);

  // Mock fetch
  async function fetchLogs() {
    setLoading(true);
    try {
      // Replace with: auditLogsApi.list(queryParams)
      await new Promise((r) => setTimeout(r, 450));

      // Generate some UI-mock data with filter influence
      const base = [
        {
          id: "AL-10021",
          ts: new Date(Date.now() - 30 * 60 * 1000),
          severity: "INFO",
          module: "Engineering",
          action: "UPDATE",
          entity: "DFMReport",
          entity_id: "DFM-0901",
          actor: "Irfan (eng_mgr)",
          ip: "192.168.1.11",
          message: "Updated DFM checklist rule: annular ring min",
          before: { min_annular_ring: "0.12mm" },
          after: { min_annular_ring: "0.15mm" },
        },
        {
          id: "AL-10020",
          ts: new Date(Date.now() - 55 * 60 * 1000),
          severity: "WARN",
          module: "Production",
          action: "MOVE",
          entity: "WIPMove",
          entity_id: "WIP-4412",
          actor: "Anil (supervisor)",
          ip: "192.168.1.22",
          message: "Moved lot LOT-CCL-2410-03 to Etching without QC hold release",
          before: { station: "AOI" },
          after: { station: "Etching" },
        },
        {
          id: "AL-10019",
          ts: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: "INFO",
          module: "Inventory",
          action: "ISSUE",
          entity: "MaterialIssue",
          entity_id: "MI-7781",
          actor: "Store (kiran)",
          ip: "192.168.1.8",
          message: "Issued FR4 Core & CCL to WO-250106-004",
          before: null,
          after: { wo: "WO-250106-004", lines: 2 },
        },
        {
          id: "AL-10018",
          ts: new Date(Date.now() - 5 * 60 * 60 * 1000),
          severity: "CRITICAL",
          module: "Admin",
          action: "LOGIN",
          entity: "Auth",
          entity_id: "-",
          actor: "Unknown",
          ip: "103.21.88.14",
          message: "Blocked login attempt (IP not whitelisted)",
          before: null,
          after: { blocked: true },
        },
      ];

      // naive filter
      const qLower = q.trim().toLowerCase();
      let filtered = base.filter((x) => {
        const hay = `${x.id} ${x.module} ${x.action} ${x.entity} ${x.entity_id} ${x.actor} ${x.ip} ${x.message}`.toLowerCase();
        const okQ = !qLower || hay.includes(qLower);
        const okModule = module === "All" || x.module === module;
        const okAction = action === "All" || x.action === action;
        const okSev = severity === "All" || x.severity === severity;
        const okActor = !actor.trim() || x.actor.toLowerCase().includes(actor.trim().toLowerCase());
        const okEntity = !entity.trim() || x.entity.toLowerCase().includes(entity.trim().toLowerCase());
        return okQ && okModule && okAction && okSev && okActor && okEntity;
      });

      // paginate
      const total = filtered.length;
      const page = clamp(meta.page, 1, 999);
      const start = (page - 1) * meta.pageSize;
      const end = start + meta.pageSize;
      filtered = filtered.slice(start, end);

      setRows(filtered);
      setMeta((m) => ({ ...m, total, page }));
    } catch (e) {
      toast({ title: "Failed to load logs", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams.module, queryParams.action, queryParams.severity, queryParams.actor, queryParams.entity, queryParams.from, queryParams.to, queryParams.q, queryParams.page, queryParams.page_size]);

  function resetFilters() {
    setQ("");
    setModule("All");
    setAction("All");
    setSeverity("All");
    setActor("");
    setEntity("");
    setFrom(format(new Date(Date.now() - 7 * 24 * 3600 * 1000), "yyyy-MM-dd"));
    setTo(format(new Date(), "yyyy-MM-dd"));
    setMeta((m) => ({ ...m, page: 1 }));
  }

  function severityBadge(sev) {
    if (sev === "CRITICAL") return <Badge className="bg-rose-600 hover:bg-rose-600">CRITICAL</Badge>;
    if (sev === "WARN") return <Badge className="bg-amber-500 hover:bg-amber-500">WARN</Badge>;
    return <Badge variant="outline">INFO</Badge>;
  }

  function actionBadge(act) {
    const base = "rounded-full border px-2 py-0.5 text-[11px] font-semibold";
    const map = {
      CREATE: "border-emerald-200 bg-emerald-50 text-emerald-700",
      UPDATE: "border-blue-200 bg-blue-50 text-blue-700",
      DELETE: "border-rose-200 bg-rose-50 text-rose-700",
      APPROVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
      REJECT: "border-rose-200 bg-rose-50 text-rose-700",
      LOGIN: "border-slate-200 bg-slate-50 text-slate-700",
      LOGOUT: "border-slate-200 bg-slate-50 text-slate-700",
      EXPORT: "border-indigo-200 bg-indigo-50 text-indigo-700",
      PRINT: "border-indigo-200 bg-indigo-50 text-indigo-700",
      MOVE: "border-amber-200 bg-amber-50 text-amber-800",
      ISSUE: "border-purple-200 bg-purple-50 text-purple-700",
    };
    return <span className={cx(base, map[act] || "border-slate-200 bg-slate-50 text-slate-700")}>{act}</span>;
  }

  async function exportCsv() {
    try {
      // Replace with: window.location = `/admin/audit-logs/export?....`
      toast({ title: "Export started", description: "CSV export (mock). Wire this to backend." });
    } catch (e) {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  }

  async function purgeOld() {
    setPurging(true);
    try {
      // Replace with: DELETE /admin/audit-logs?older_than=...
      await new Promise((r) => setTimeout(r, 650));
      toast({ title: "Purge completed", description: "Old audit logs removed (mock)." });
      await fetchLogs();
    } catch (e) {
      toast({ title: "Purge failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setPurging(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#dc2551]" />
              Audit Logs
            </CardTitle>
            <CardDescription>System-wide trace of critical actions across PCBxpress modules.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => fetchLogs()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setConfirmExport(true)}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <Button
              variant="ghost"
              className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setConfirmPurge(true)}
            >
              <Trash2 className="h-4 w-4" />
              Purge Old
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Filter className="h-4 w-4 text-gray-600" />
                Filters
              </div>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-600">
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4 space-y-1.5">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={q}
                    onChange={(e) => {
                      setMeta((m) => ({ ...m, page: 1 }));
                      setQ(e.target.value);
                    }}
                    placeholder="ID, actor, IP, entity, message…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Module</Label>
                <select
                  value={module}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setModule(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {MODULES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Action</Label>
                <select
                  value={action}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setAction(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Severity</Label>
                <select
                  value={severity}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setSeverity(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  <option value="All">All</option>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Actor</Label>
                <Input
                  value={actor}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setActor(e.target.value);
                  }}
                  placeholder="e.g., Irfan"
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label>Entity</Label>
                <Input
                  value={entity}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    setEntity(e.target.value);
                  }}
                  placeholder="e.g., WorkOrder"
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label>From</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setMeta((m) => ({ ...m, page: 1 }));
                      setFrom(e.target.value);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label>To</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setMeta((m) => ({ ...m, page: 1 }));
                      setTo(e.target.value);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex items-end gap-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setMeta((m) => ({ ...m, page: 1 }));
                    fetchLogs();
                  }}
                  disabled={loading}
                >
                  <Activity className="h-4 w-4" />
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="text-sm font-semibold text-gray-900">Results</div>
              <div className="text-xs text-gray-500">
                Total: <span className="font-medium text-gray-700">{meta.total}</span>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[1060px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Time</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Severity</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Module</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Action</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Entity</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Actor</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">IP</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Message</th>
                    <th className="px-3 py-2 font-semibold text-gray-700 w-[120px]"> </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-gray-600">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading logs…
                        </div>
                      </td>
                    </tr>
                  ) : rows.length ? (
                    rows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2 text-gray-900">
                          <div className="font-medium">{format(new Date(r.ts), "dd MMM yyyy")}</div>
                          <div className="text-xs text-gray-500">{format(new Date(r.ts), "HH:mm:ss")}</div>
                        </td>
                        <td className="px-3 py-2">{severityBadge(r.severity)}</td>
                        <td className="px-3 py-2 text-gray-900">{r.module}</td>
                        <td className="px-3 py-2">{actionBadge(r.action)}</td>
                        <td className="px-3 py-2 text-gray-900">
                          <div className="font-medium">{r.entity}</div>
                          <div className="text-xs text-gray-500">{r.entity_id}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-900">{r.actor}</td>
                        <td className="px-3 py-2 text-gray-700">{r.ip}</td>
                        <td className="px-3 py-2 text-gray-700">
                          <div className="max-w-[420px] truncate">{r.message}</div>
                        </td>
                        <td className="px-3 py-2">
                          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setSelected(r)}>
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-gray-600">
                        No audit logs found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
              <div className="text-xs text-gray-500">
                Page <span className="font-medium text-gray-700">{meta.page}</span> of{" "}
                <span className="font-medium text-gray-700">{pageCount}</span>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500">Rows</Label>
                <select
                  value={meta.pageSize}
                  onChange={(e) => setMeta((m) => ({ ...m, pageSize: Number(e.target.value), page: 1 }))}
                  className="h-9 rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMeta((m) => ({ ...m, page: clamp(m.page - 1, 1, 999) }))}
                  disabled={meta.page <= 1 || loading}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMeta((m) => ({ ...m, page: clamp(m.page + 1, 1, 999) }))}
                  disabled={meta.page >= pageCount || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Details drawer */}
          {selected ? (
            <div className="rounded-xl border bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{selected.id}</Badge>
                    {severityBadge(selected.severity)}
                    {actionBadge(selected.action)}
                    <Badge variant="outline">{selected.module}</Badge>
                  </div>

                  <div className="text-sm font-semibold text-gray-900">{selected.message}</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(selected.ts), "dd MMM yyyy HH:mm:ss")} • Actor:{" "}
                    <span className="font-medium text-gray-700">{selected.actor}</span> • IP:{" "}
                    <span className="font-medium text-gray-700">{selected.ip}</span>
                  </div>
                </div>

                <Button variant="ghost" className="text-gray-600" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700">Entity</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.entity} <span className="text-gray-500">({selected.entity_id})</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700">Change Preview</div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded-md border bg-white p-2">
                      <div className="text-[11px] font-semibold text-gray-600">Before</div>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-gray-700">
                        {selected.before ? jsonPreview(selected.before, 420) : "—"}
                      </pre>
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      <div className="text-[11px] font-semibold text-gray-600">After</div>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-gray-700">
                        {selected.after ? jsonPreview(selected.after, 420) : "—"}
                      </pre>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">
                    In production: show field-level diffs, approval trail, and related references.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Confirm Export */}
      <ConfirmationDialog
        open={confirmExport}
        onOpenChange={setConfirmExport}
        title="Export audit logs?"
        description="A CSV will be generated using the current filters."
        confirmText="Export"
        confirmVariant="default"
        onConfirm={async () => {
          setConfirmExport(false);
          await exportCsv();
        }}
      />

      {/* Confirm Purge */}
      <ConfirmationDialog
        open={confirmPurge}
        onOpenChange={setConfirmPurge}
        title="Purge old audit logs?"
        description="This is destructive. Use only if you have retention rules and backups."
        confirmText={purging ? "Purging..." : "Purge"}
        confirmVariant="destructive"
        onConfirm={async () => {
          setConfirmPurge(false);
          await purgeOld();
        }}
      />
    </div>
  );
}
