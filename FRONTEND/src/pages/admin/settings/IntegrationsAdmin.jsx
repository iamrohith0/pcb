// src/pages/admin/settings/IntegrationsAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

import api from "@/lib/axios";

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
  CheckCircle2,
  Cloud,
  Cable,
  ClipboardCheck,
  Factory,
  Globe,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Webhook,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DEFAULTS = {
  erp: {
    webhook_enabled: false,
    webhook_url: "",
    webhook_secret: "",
    allowed_ips: "",
  },
  pcb: {
    cam_sync_enabled: false,
    cam_webhook_url: "",
    dfm_auto_create_enabled: false,
    aoi_result_ingest_enabled: false,
    etest_result_ingest_enabled: false,
  },
  smtp: {
    enabled: false,
    host: "",
    port: "587",
    username: "",
    password: "",
    from_name: "PCBxpress ERP",
    from_email: "",
    encryption: "tls", // tls | ssl | none
  },
  sms: {
    enabled: false,
    provider: "twilio", // twilio | msg91 | textlocal | custom
    api_key: "",
    sender_id: "",
    template_id: "",
    notes: "",
  },
  storage: {
    enabled: false,
    provider: "s3", // s3 | gcs | azure | local
    bucket: "",
    region: "",
    access_key: "",
    secret_key: "",
    endpoint: "",
    folder_prefix: "pcbxpress",
  },
  accounting: {
    enabled: false,
    provider: "tally", // tally | zoho | quickbooks | custom
    base_url: "",
    api_key: "",
    notes: "",
  },
};

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export default function IntegrationsAdmin() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [data, setData] = useState(DEFAULTS);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Helpers
  const setPath = (path, value) => {
    setData((prev) => {
      const copy = structuredClone(prev);
      const keys = path.split(".");
      let cur = copy;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Expected backend shape:
      // GET /admin/settings/integrations -> { data: { ...integrationsConfig } }
      // OR -> { ...integrationsConfig }
      const res = await api.get("/admin/settings/integrations");
      const payload = res?.data?.data ?? res?.data ?? {};
      setData((prev) => ({
        erp: { ...prev.erp, ...(payload.erp || {}) },
        pcb: { ...prev.pcb, ...(payload.pcb || {}) },
        smtp: { ...prev.smtp, ...(payload.smtp || {}) },
        sms: { ...prev.sms, ...(payload.sms || {}) },
        storage: { ...prev.storage, ...(payload.storage || {}) },
        accounting: { ...prev.accounting, ...(payload.accounting || {}) },
      }));
    } catch (err) {
      toast({
        title: "Failed to load integrations",
        description: "Could not fetch integration settings. Please try again.",
        variant: "destructive",
      });
      setData(DEFAULTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSecrets = useMemo(() => {
    return Boolean(
      data?.erp?.webhook_secret ||
        data?.smtp?.password ||
        data?.sms?.api_key ||
        data?.storage?.secret_key ||
        data?.accounting?.api_key
    );
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Expected:
      // PUT /admin/settings/integrations body -> { ...config }
      await api.put("/admin/settings/integrations", data);

      toast({
        title: "Saved",
        description: "Integrations settings updated successfully.",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to save integration settings. Please check values and try again.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setTesting(true);
    try {
      // Optional endpoint:
      // POST /admin/settings/integrations/test-webhook -> { ok: true, message: "..." }
      const res = await api.post("/admin/settings/integrations/test-webhook", {
        url: data.erp.webhook_url,
        secret: data.erp.webhook_secret,
      });

      toast({
        title: "Webhook test sent",
        description: res?.data?.message || "Test request sent successfully.",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Webhook test failed. Verify URL/secret and ensure endpoint is reachable.";
      toast({ title: "Test failed", description: msg, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleResetDefaults = () => {
    setData(DEFAULTS);
    setConfirmResetOpen(false);
    toast({ title: "Reset done", description: "Reverted to default (not saved yet)." });
  };

  const allowedIpsHint = "Comma-separated IPs/CIDR, e.g. 192.168.1.10, 10.0.0.0/24";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Integrations</h1>
          <p className="text-sm text-gray-500">
            Configure external services for PCBxpress (webhooks, CAM/DFM, AOI/E-test ingest, mail, SMS, storage, accounting).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="gap-2" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            variant="ghost"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setConfirmResetOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Reset
          </Button>

          <Button className="gap-2" onClick={handleSave} disabled={loading || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Security notice */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Security</p>
                <p className="text-sm text-gray-600">
                  Store secrets server-side. This UI sends values to your backend which must encrypt/mask secrets and never
                  return them in plain text.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasSecrets ? (
                <Badge variant="secondary" className="gap-1">
                  <KeyRound className="h-3.5 w-3.5" /> Secrets present
                </Badge>
              ) : (
                <Badge variant="secondary">No secrets set</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 text-sm text-gray-600">Loading integration settings…</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ERP Webhooks */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Webhook className="h-4 w-4" />
                    ERP Webhooks
                  </CardTitle>
                  <CardDescription>
                    Trigger events (RFQ created, WO released, dispatch done) to external systems.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Enabled</Label>
                  <Switch
                    checked={!!data.erp.webhook_enabled}
                    onCheckedChange={(v) => setPath("erp.webhook_enabled", v)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={data.erp.webhook_url}
                  onChange={(e) => setPath("erp.webhook_url", e.target.value)}
                  placeholder="https://example.com/webhooks/pcbxpress"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret (HMAC)</Label>
                <Input
                  value={data.erp.webhook_secret}
                  onChange={(e) => setPath("erp.webhook_secret", e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500">Used to sign payloads so receiver can verify authenticity.</p>
              </div>

              <div className="space-y-2">
                <Label>Allowed IPs</Label>
                <Textarea
                  value={data.erp.allowed_ips}
                  onChange={(e) => setPath("erp.allowed_ips", e.target.value)}
                  placeholder={allowedIpsHint}
                  rows={3}
                />
                <p className="text-xs text-gray-500">{allowedIpsHint}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={handleTestWebhook}
                  disabled={testing || !data.erp.webhook_url}
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Test Webhook
                </Button>

                <Badge variant="secondary" className="gap-1">
                  <ClipboardCheck className="h-3.5 w-3.5" /> Events: RFQ / WO / WIP / Dispatch
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* PCB Manufacturing: CAM/DFM/AOI/E-test */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Factory className="h-4 w-4" />
                PCB Manufacturing Feeds
              </CardTitle>
              <CardDescription>
                Configure integration points for CAM sync, DFM auto-creation, AOI and E-test result ingest.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="font-semibold">CAM Sync</p>
                  <p className="text-xs text-gray-500">
                    Push CAM job status updates and receive tool output notifications.
                  </p>
                </div>
                <Switch
                  checked={!!data.pcb.cam_sync_enabled}
                  onCheckedChange={(v) => setPath("pcb.cam_sync_enabled", v)}
                />
              </div>

              <div className="space-y-2">
                <Label>CAM Webhook URL</Label>
                <Input
                  value={data.pcb.cam_webhook_url}
                  onChange={(e) => setPath("pcb.cam_webhook_url", e.target.value)}
                  placeholder="https://cam.example.com/hooks/pcbxpress"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="font-semibold">Auto-create DFM Review</p>
                  <p className="text-xs text-gray-500">
                    When Gerbers arrive, create a DFM checklist task automatically.
                  </p>
                </div>
                <Switch
                  checked={!!data.pcb.dfm_auto_create_enabled}
                  onCheckedChange={(v) => setPath("pcb.dfm_auto_create_enabled", v)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="font-semibold">AOI Result Ingest</p>
                    <p className="text-xs text-gray-500">Import defect maps, pass/fail, images.</p>
                  </div>
                  <Switch
                    checked={!!data.pcb.aoi_result_ingest_enabled}
                    onCheckedChange={(v) => setPath("pcb.aoi_result_ingest_enabled", v)}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="font-semibold">E-test Result Ingest</p>
                    <p className="text-xs text-gray-500">Netlist/short-open results per panel/serial.</p>
                  </div>
                  <Switch
                    checked={!!data.pcb.etest_result_ingest_enabled}
                    onCheckedChange={(v) => setPath("pcb.etest_result_ingest_enabled", v)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Cable className="h-3.5 w-3.5" /> CAM/DFM/AOI/E-test
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Traceability ready
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* SMTP */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" />
                    Email (SMTP)
                  </CardTitle>
                  <CardDescription>Send RFQs, quotations, order updates and alerts.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Enabled</Label>
                  <Switch
                    checked={!!data.smtp.enabled}
                    onCheckedChange={(v) => setPath("smtp.enabled", v)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={data.smtp.host} onChange={(e) => setPath("smtp.host", e.target.value)} placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input value={data.smtp.port} onChange={(e) => setPath("smtp.port", e.target.value)} placeholder="587" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={data.smtp.username} onChange={(e) => setPath("smtp.username", e.target.value)} placeholder="user@domain.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password / App Key</Label>
                  <Input value={data.smtp.password} onChange={(e) => setPath("smtp.password", e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input value={data.smtp.from_name} onChange={(e) => setPath("smtp.from_name", e.target.value)} placeholder="PCBxpress ERP" />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input value={data.smtp.from_email} onChange={(e) => setPath("smtp.from_email", e.target.value)} placeholder="noreply@pcbxpress.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Encryption</Label>
                <div className="flex flex-wrap gap-2">
                  {["tls", "ssl", "none"].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant={data.smtp.encryption === v ? "default" : "ghost"}
                      onClick={() => setPath("smtp.encryption", v)}
                      className="capitalize"
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Cloud className="h-4 w-4" />
                    SMS / WhatsApp Gateway
                  </CardTitle>
                  <CardDescription>OTP, dispatch notifications, customer updates.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Enabled</Label>
                  <Switch checked={!!data.sms.enabled} onCheckedChange={(v) => setPath("sms.enabled", v)} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <div className="flex flex-wrap gap-2">
                  {["twilio", "msg91", "textlocal", "custom"].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={data.sms.provider === p ? "default" : "ghost"}
                      onClick={() => setPath("sms.provider", p)}
                      className="uppercase"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input value={data.sms.api_key} onChange={(e) => setPath("sms.api_key", e.target.value)} placeholder="••••••••" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sender ID</Label>
                  <Input value={data.sms.sender_id} onChange={(e) => setPath("sms.sender_id", e.target.value)} placeholder="PCBXPR" />
                </div>
                <div className="space-y-2">
                  <Label>Template ID</Label>
                  <Input value={data.sms.template_id} onChange={(e) => setPath("sms.template_id", e.target.value)} placeholder="OTP_001" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={data.sms.notes} onChange={(e) => setPath("sms.notes", e.target.value)} rows={3} placeholder="Any provider-specific notes..." />
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Cloud className="h-4 w-4" />
                    File Storage
                  </CardTitle>
                  <CardDescription>
                    Store Gerbers, drill files, AOI images, certificates and reports.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Enabled</Label>
                  <Switch
                    checked={!!data.storage.enabled}
                    onCheckedChange={(v) => setPath("storage.enabled", v)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <div className="flex flex-wrap gap-2">
                  {["s3", "gcs", "azure", "local"].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={data.storage.provider === p ? "default" : "ghost"}
                      onClick={() => setPath("storage.provider", p)}
                      className="uppercase"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bucket</Label>
                  <Input value={data.storage.bucket} onChange={(e) => setPath("storage.bucket", e.target.value)} placeholder="pcbxpress-prod" />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={data.storage.region} onChange={(e) => setPath("storage.region", e.target.value)} placeholder="ap-south-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Access Key</Label>
                  <Input value={data.storage.access_key} onChange={(e) => setPath("storage.access_key", e.target.value)} placeholder="AKIA..." />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input value={data.storage.secret_key} onChange={(e) => setPath("storage.secret_key", e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Endpoint (optional)</Label>
                  <Input value={data.storage.endpoint} onChange={(e) => setPath("storage.endpoint", e.target.value)} placeholder="https://s3.amazonaws.com" />
                </div>
                <div className="space-y-2">
                  <Label>Folder Prefix</Label>
                  <Input value={data.storage.folder_prefix} onChange={(e) => setPath("storage.folder_prefix", e.target.value)} placeholder="pcbxpress" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accounting */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardCheck className="h-4 w-4" />
                    Accounting Integration
                  </CardTitle>
                  <CardDescription>Sync invoices, payments, customer masters (optional).</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Enabled</Label>
                  <Switch
                    checked={!!data.accounting.enabled}
                    onCheckedChange={(v) => setPath("accounting.enabled", v)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <div className="flex flex-wrap gap-2">
                  {["tally", "zoho", "quickbooks", "custom"].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={data.accounting.provider === p ? "default" : "ghost"}
                      onClick={() => setPath("accounting.provider", p)}
                      className="uppercase"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input value={data.accounting.base_url} onChange={(e) => setPath("accounting.base_url", e.target.value)} placeholder="http://localhost:9000/api" />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input value={data.accounting.api_key} onChange={(e) => setPath("accounting.api_key", e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes / Mapping</Label>
                <Textarea
                  value={data.accounting.notes}
                  onChange={(e) => setPath("accounting.notes", e.target.value)}
                  rows={4}
                  placeholder="Example: Map ERP invoice series to accounting voucher series..."
                />
                <p className="text-xs text-gray-500">
                  Typically used for mapping tax, invoice series, customer codes, etc.
                </p>
              </div>

              <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                Tip: For PCB manufacturing, you usually sync <span className="font-medium">Invoices</span> and{" "}
                <span className="font-medium">Customer masters</span>, while production/WIP stays inside ERP.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset confirmation */}
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset integration settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the form to defaults. It will <span className="font-medium">not</span> save until you click{" "}
              <span className="font-medium">Save Changes</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDefaults}
              className="bg-red-600 hover:bg-red-700"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
