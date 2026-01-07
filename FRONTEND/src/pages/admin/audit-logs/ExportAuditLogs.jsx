// src/pages/admin/audit-logs/ExportAuditLogs.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    CalendarRange,
    CheckCircle2,
    Download,
    FileDown,
    FileText,
    Filter,
    Info,
    RefreshCw,
    Shield,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

/**
 * PCBxpress - Export Audit Logs
 * -------------------------------------------------------
 * Expected backend endpoints (recommended):
 * 1) GET /admin/audit-logs/export/meta
 *    -> { minDate, maxDate, modules[], actions[], users[] }
 *
 * 2) GET /admin/audit-logs/export?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv|xlsx|pdf&...
 *    -> returns a file download (binary)
 *
 * If you already have a service file, feel free to replace api calls with:
 *   import auditLogsService from "@/services/auditLogs.service";
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function yyyyMmDd(d) {
  if (!d) return "";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function Pill({ children, tone = "gray" }) {
  const base = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold";
  const map = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-800",
  };
  return <span className={cx(base, map[tone] || map.gray)}>{children}</span>;
}

export default function ExportAuditLogs() {
  const { toast } = useToast();

  // Filters
  const [fromDate, setFromDate] = useState(yyyyMmDd(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [toDate, setToDate] = useState(yyyyMmDd(new Date()));
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [ip, setIp] = useState("");
  const [ok, setOk] = useState(""); // "", "true", "false"
  const [q, setQ] = useState("");

  // Format
  const [format, setFormat] = useState("csv"); // csv | xlsx | pdf

  // Meta
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [users, setUsers] = useState([]);

  // Export
  const [exporting, setExporting] = useState(false);

  const canExport = useMemo(() => {
    if (!fromDate || !toDate) return false;
    return true;
  }, [fromDate, toDate]);

  const activeFiltersCount = useMemo(() => {
    const vals = [module, action, actor, entityType, entityId, ip, ok, q];
    return vals.filter((v) => String(v || "").trim().length > 0).length;
  }, [module, action, actor, entityType, entityId, ip, ok, q]);

  const resetFilters = () => {
    setModule("");
    setAction("");
    setActor("");
    setEntityType("");
    setEntityId("");
    setIp("");
    setOk("");
    setQ("");
    toast({ title: "Filters cleared", description: "All optional filters were reset." });
  };

  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      // Optional meta endpoint. If your backend doesn't support it, we fall back gracefully.
      const res = await api.get("/admin/audit-logs/export/meta");
      setModules(safeArr(res.data?.modules));
      setActions(safeArr(res.data?.actions));
      setUsers(safeArr(res.data?.users));
    } catch (e) {
      // Fallback: keep dropdowns empty (still usable with manual input)
      console.warn("Export meta not available:", e);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set("from", fromDate);
    params.set("to", toDate);
    params.set("format", format);

    if (module) params.set("module", module);
    if (action) params.set("action", action);
    if (actor) params.set("actor", actor);
    if (entityType) params.set("entityType", entityType);
    if (entityId) params.set("entityId", entityId);
    if (ip) params.set("ip", ip);
    if (ok) params.set("ok", ok);
    if (q) params.set("q", q);

    return params;
  };

  const inferExt = () => {
    if (format === "xlsx") return "xlsx";
    if (format === "pdf") return "pdf";
    return "csv";
  };

  const doExport = async () => {
    if (!canExport) {
      toast({ title: "Missing dates", description: "Please select both From and To dates.", variant: "destructive" });
      return;
    }

    if (fromDate > toDate) {
      toast({ title: "Invalid date range", description: "From date cannot be after To date.", variant: "destructive" });
      return;
    }

    setExporting(true);
    try {
      const params = buildParams();
      const endpoint = `/admin/audit-logs/export?${params.toString()}`;

      const res = await api.get(endpoint, {
        responseType: "blob",
      });

      const ext = inferExt();
      const filename = `pcbxpress_audit_logs_${fromDate}_to_${toDate}.${ext}`;
      downloadBlob(res.data, filename);

      toast({
        title: "Export ready",
        description: `Downloaded ${filename}`,
      });
    } catch (e) {
      const status = e?.response?.status;
      let msg = "Failed to export audit logs.";
      if (status === 401) msg = "You are not authenticated. Please log in again.";
      if (status === 403) msg = "Access denied. You may not have permission to export audit logs.";
      if (status === 422) msg = "Invalid filters. Please review your export settings.";
      toast({ title: "Export failed", description: msg, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin • Audit Logs</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">Export Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Export traceability events for compliance, customer reports, or internal investigations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={loadMeta} disabled={loadingMeta}>
            <RefreshCw className={cx("h-4 w-4", loadingMeta ? "animate-spin" : "")} />
            Refresh options
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={resetFilters}
            disabled={activeFiltersCount === 0}
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>

          <Button
            className="bg-cyan-600 hover:bg-cyan-500 gap-2"
            onClick={doExport}
            disabled={!canExport || exporting}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* Quick summary pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="blue">
          <CalendarRange className="h-4 w-4" />
          {fromDate} → {toDate}
        </Pill>
        <Pill tone="gray">
          <Filter className="h-4 w-4" />
          {activeFiltersCount} filter{activeFiltersCount === 1 ? "" : "s"}
        </Pill>
        <Pill tone="green">
          <FileDown className="h-4 w-4" />
          Format: {format.toUpperCase()}
        </Pill>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-gray-700" />
              Export Configuration
            </CardTitle>
            <CardDescription>
              Choose a date range and optionally filter by module, action, entity, user, or IP.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Date range + format */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="from"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="to"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={format === "csv" ? "default" : "outline"}
                    className={cx("w-full", format === "csv" ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                    onClick={() => setFormat("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant={format === "xlsx" ? "default" : "outline"}
                    className={cx("w-full", format === "xlsx" ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                    onClick={() => setFormat("xlsx")}
                  >
                    XLSX
                  </Button>
                  <Button
                    type="button"
                    variant={format === "pdf" ? "default" : "outline"}
                    className={cx("w-full", format === "pdf" ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                    onClick={() => setFormat("pdf")}
                  >
                    PDF
                  </Button>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  CSV is fastest; XLSX is best for audit reviews; PDF is best for sharing.
                </p>
              </div>
            </div>

            {/* Optional filters */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Module</Label>
                <Input
                  placeholder={modules.length ? "Choose or type module (e.g., Production)" : "Type module (e.g., Production)"}
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  list="audit-modules"
                />
                {modules.length ? (
                  <datalist id="audit-modules">
                    {modules.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Input
                  placeholder={actions.length ? "Choose or type action (e.g., HOLD_APPLIED)" : "Type action (e.g., HOLD_APPLIED)"}
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  list="audit-actions"
                />
                {actions.length ? (
                  <datalist id="audit-actions">
                    {actions.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Actor (user/email)</Label>
                <Input
                  placeholder={users.length ? "Choose or type (e.g., admin@pcbxpress.com)" : "Type actor identifier"}
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  list="audit-users"
                />
                {users.length ? (
                  <datalist id="audit-users">
                    {users.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Input
                  placeholder="e.g., WorkOrder, Lot, PurchaseOrder"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Entity ID</Label>
                <Input
                  placeholder="e.g., WO-24046"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="e.g., 192.168.1.12"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant={ok === "" ? "default" : "outline"} onClick={() => setOk("")}
                    className={cx(ok === "" ? "bg-cyan-600 hover:bg-cyan-500" : "")}>
                    Any
                  </Button>
                  <Button type="button" variant={ok === "true" ? "default" : "outline"} onClick={() => setOk("true")}
                    className={cx(ok === "true" ? "bg-cyan-600 hover:bg-cyan-500" : "")}>
                    Success
                  </Button>
                  <Button type="button" variant={ok === "false" ? "default" : "outline"} onClick={() => setOk("false")}
                    className={cx(ok === "false" ? "bg-cyan-600 hover:bg-cyan-500" : "")}>
                    Failed
                  </Button>
                </div>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search notes, paths, request IDs, etc."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {module ? <Badge variant="secondary">Module: {module}</Badge> : null}
                {action ? <Badge variant="secondary">Action: {action}</Badge> : null}
                {actor ? <Badge variant="secondary">Actor: {actor}</Badge> : null}
                {entityType ? <Badge variant="secondary">Entity: {entityType}</Badge> : null}
                {entityId ? <Badge variant="secondary" className="font-mono text-[11px]">ID: {entityId}</Badge> : null}
                {ip ? <Badge variant="secondary">IP: {ip}</Badge> : null}
                {ok ? (
                  <Badge variant="secondary" className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {ok === "true" ? "Success only" : "Failed only"}
                  </Badge>
                ) : null}
              </div>

              <Button
                className="bg-cyan-600 hover:bg-cyan-500 gap-2"
                onClick={doExport}
                disabled={!canExport || exporting}
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Compliance note */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-700" />
            What gets exported?
          </CardTitle>
          <CardDescription>Recommended fields for PCB manufacturing traceability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2 rounded-2xl border bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="font-semibold">Best practice</p>
              <p className="mt-1">
                Include actor, role, timestamp, IP, requestId, module, entityType/entityId, action, and the before/after
                diff. This supports investigations (NCR/CAPA), customer disputes, and ISO-style audits.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <li className="rounded-2xl border bg-white p-3">Log ID, Timestamp</li>
            <li className="rounded-2xl border bg-white p-3">Actor (User, Role, Email)</li>
            <li className="rounded-2xl border bg-white p-3">Module / Action</li>
            <li className="rounded-2xl border bg-white p-3">Entity Type / Entity ID</li>
            <li className="rounded-2xl border bg-white p-3">API Method / Path</li>
            <li className="rounded-2xl border bg-white p-3">Request ID / IP / User Agent</li>
            <li className="rounded-2xl border bg-white p-3">Status (Success/Failed)</li>
            <li className="rounded-2xl border bg-white p-3">Before/After snapshot (JSON)</li>
          </ul>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Info className="h-4 w-4" />
            If your backend does not yet support XLSX/PDF, start with CSV and add formats later.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
