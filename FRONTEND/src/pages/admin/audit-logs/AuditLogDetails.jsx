// src/pages/admin/audit-logs/AuditLogDetails.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Copy,
    Database,
    Eye,
    FileText,
    Globe,
    Info,
    RefreshCw,
    Shield,
    UserCircle2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

// If you already have an auditLog service, replace this demo loader with:
// import auditLogsService from "@/services/auditLogs.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function prettyJson(value) {
  try {
    if (typeof value === "string") {
      // if string contains json, pretty it; else show string
      const trimmed = value.trim();
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      }
      return value;
    }
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

function FieldRow({ label, value, mono }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-12 sm:items-start sm:gap-3">
      <div className="sm:col-span-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <div className="sm:col-span-8">
        <p className={cx("text-sm text-gray-900 break-words", mono ? "font-mono text-[12px]" : "")}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, desc, actions }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gray-50 text-gray-700">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            {desc ? <p className="text-xs text-gray-500">{desc}</p> : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function MethodPill({ method }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold";
  const m = (method || "").toUpperCase();
  if (m === "GET") return <span className={cx(base, "bg-blue-50 text-blue-700")}>GET</span>;
  if (m === "POST") return <span className={cx(base, "bg-emerald-50 text-emerald-700")}>POST</span>;
  if (m === "PUT" || m === "PATCH") return <span className={cx(base, "bg-amber-50 text-amber-700")}>{m}</span>;
  if (m === "DELETE") return <span className={cx(base, "bg-red-50 text-red-700")}>DELETE</span>;
  return <span className={cx(base, "bg-gray-100 text-gray-700")}>{m || "—"}</span>;
}

function StatusPill({ ok }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold";
  if (ok)
    return (
      <span className={cx(base, "bg-emerald-50 text-emerald-700")}>
        <CheckCircle2 className="h-4 w-4" /> Success
      </span>
    );
  return (
    <span className={cx(base, "bg-red-50 text-red-700")}>
      <AlertTriangle className="h-4 w-4" /> Failed
    </span>
  );
}

export default function AuditLogDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(null);

  const titleId = useMemo(() => id || "—", [id]);

  const copy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: label, description: "Saved to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      // Replace with real API later:
      // const res = await auditLogsService.getById(id);
      // setLog(res.data);
      await new Promise((r) => setTimeout(r, 450));

      // Demo record (PCBxpress flavored)
      const demo = {
        id: id ?? "AL-0001",
        createdAt: "2026-01-06T14:10:00",
        actor: {
          id: "U-102",
          name: "Admin",
          role: "admin",
          email: "admin@pcbxpress.local",
        },
        module: "Production",
        entityType: "WorkOrder",
        entityId: "WO-24046",
        action: "HOLD_APPLIED",
        severity: "high",
        ok: true,
        request: {
          method: "POST",
          path: "/api/v1/production/work-orders/WO-24046/hold",
          ip: "192.168.1.12",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          requestId: "req_8f1c2b9a9e",
        },
        diff: {
          before: { status: "In Progress", holdReason: null },
          after: { status: "On Hold", holdReason: "E-Test yield < 98%" },
        },
        meta: {
          plant: "Main Plant",
          line: "E-Test Line 1",
          station: "E-Test",
          notes: "Auto-hold triggered by SPC rule: open defects spike on netlist.",
        },
      };

      setLog(demo);
    } catch (e) {
      toast({ title: "Load failed", description: "Could not load audit log details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const severityBadge = (sev) => {
    const s = (sev || "low").toLowerCase();
    if (s === "critical") return <Badge className="bg-red-600 hover:bg-red-600">Critical</Badge>;
    if (s === "high") return <Badge className="bg-amber-600 hover:bg-amber-600">High</Badge>;
    if (s === "medium") return <Badge className="bg-blue-600 hover:bg-blue-600">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin • Audit Logs</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">Audit Log Details</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review who changed what, when, where (IP), and which entity in PCBxpress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            className="bg-cyan-600 hover:bg-cyan-500 gap-2"
            onClick={() => copy(String(titleId), "Log ID copied")}
          >
            <Copy className="h-4 w-4" />
            Copy Log ID
          </Button>
        </div>
      </div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-gray-600" />
                  Log <span className="font-mono text-[12px]">{titleId}</span>
                  {log ? severityBadge(log.severity) : null}
                  {log ? <StatusPill ok={log.ok} /> : null}
                </CardTitle>
                <CardDescription>
                  {log ? `${log.action} • ${log.module}` : "Loading audit record..."}
                </CardDescription>
              </div>

              {log?.entityType && log?.entityId ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{log.entityType}</Badge>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {log.entityId}
                  </Badge>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => copy(String(log.entityId), "Entity ID copied")}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Entity
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Actor */}
              <div className="rounded-2xl border bg-white p-4">
                <SectionHeader
                  icon={UserCircle2}
                  title="Actor"
                  desc="User who performed the action"
                  actions={
                    log?.actor?.email ? (
                      <Button variant="outline" className="gap-2" onClick={() => copy(log.actor.email, "Email copied")}>
                        <Copy className="h-4 w-4" />
                        Copy Email
                      </Button>
                    ) : null
                  }
                />
                <div className="mt-4 space-y-3">
                  <FieldRow label="Name" value={log?.actor?.name} />
                  <FieldRow label="Role" value={log?.actor?.role} />
                  <FieldRow label="Email" value={log?.actor?.email} />
                  <FieldRow label="User ID" value={log?.actor?.id} mono />
                </div>
              </div>

              {/* Request */}
              <div className="rounded-2xl border bg-white p-4">
                <SectionHeader icon={Globe} title="Request" desc="API call and client fingerprint" />
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Method</p>
                    <MethodPill method={log?.request?.method} />
                    <p className="ml-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Path</p>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {log?.request?.path || "—"}
                    </Badge>
                    {log?.request?.path ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => copy(log.request.path, "Path copied")}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    ) : null}
                  </div>

                  <FieldRow label="Timestamp" value={formatDateTime(log?.createdAt)} />
                  <FieldRow label="IP Address" value={log?.request?.ip} mono />
                  <FieldRow label="Request ID" value={log?.request?.requestId} mono />
                  <FieldRow label="User Agent" value={log?.request?.userAgent} />
                </div>
              </div>
            </div>

            {/* Entity */}
            <div className="rounded-2xl border bg-white p-4">
              <SectionHeader
                icon={Database}
                title="Entity"
                desc="ERP module entity that was affected"
                actions={
                  log?.entityType === "WorkOrder" && log?.entityId ? (
                    <Link to={`/production/work-orders/${log.entityId}`}>
                      <Button variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Open Work Order
                      </Button>
                    </Link>
                  ) : null
                }
              />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldRow label="Module" value={log?.module} />
                <FieldRow label="Action" value={log?.action} />
                <FieldRow label="Entity Type" value={log?.entityType} />
                <FieldRow label="Entity ID" value={log?.entityId} mono />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Diff */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            Change Details
          </CardTitle>
          <CardDescription>Before/after snapshot (or patch) for traceability and compliance.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Before</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copy(prettyJson(log?.diff?.before), "Before copied")}
                  disabled={!log?.diff?.before}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl bg-gray-50 p-3 text-[12px] text-gray-900">
                {log?.diff?.before ? prettyJson(log.diff.before) : "—"}
              </pre>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">After</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copy(prettyJson(log?.diff?.after), "After copied")}
                  disabled={!log?.diff?.after}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl bg-gray-50 p-3 text-[12px] text-gray-900">
                {log?.diff?.after ? prettyJson(log.diff.after) : "—"}
              </pre>
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-2xl border bg-white p-4">
            <SectionHeader icon={Info} title="Metadata" desc="Extra context recorded at the time of action" />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldRow label="Plant" value={log?.meta?.plant} />
              <FieldRow label="Line" value={log?.meta?.line} />
              <FieldRow label="Station" value={log?.meta?.station} />
              <FieldRow label="Notes" value={log?.meta?.notes} />
            </div>
          </div>

          {/* Helpful hint */}
          <div className="rounded-2xl border bg-amber-50 p-4 text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Tip</p>
                <p className="mt-1 text-sm">
                  For PCB compliance audits, store: actor, role, timestamp, IP, requestId, entityId, and a before/after
                  diff (or JSON Patch). This page is built to display all of them cleanly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading footer note */}
      {loading ? (
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading audit log…
        </p>
      ) : null}
    </div>
  );
}
