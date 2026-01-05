// src/pages/settings/integrations/AccountingSync.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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
  Calculator,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Loader2,
  Plug,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Unplug,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PROVIDERS = [
  { key: "tally", label: "Tally" },
  { key: "zoho_books", label: "Zoho Books" },
  { key: "quickbooks", label: "QuickBooks" },
  { key: "sap", label: "SAP (Generic)" },
];

const DEFAULT_STATE = {
  enabled: false,
  provider: "tally",
  base_url: "",
  api_key: "",
  client_id: "",
  client_secret: "",
  company_id: "",
  webhook_secret: "",
  auto_push_invoices: true,
  auto_push_receipts: true,
  auto_push_credit_notes: false,
  auto_push_debit_notes: false,
  auto_push_purchase_invoices: true,
  auto_push_grn: false,
  auto_push_payments: true,
  schedule: "realtime", // realtime | hourly | daily
  last_sync_at: null,
  last_sync_status: null, // success | failed | running | null
  last_error: null,
  notes: "",
};

function maskKey(v) {
  if (!v) return "";
  if (v.length <= 8) return "••••••••";
  return `${v.slice(0, 4)}••••••••${v.slice(-4)}`;
}

export default function AccountingSync() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const [form, setForm] = useState({ ...DEFAULT_STATE });
  const [showSecrets, setShowSecrets] = useState(false);

  const providerMeta = useMemo(() => {
    return PROVIDERS.find((p) => p.key === form.provider) || PROVIDERS[0];
  }, [form.provider]);

  const statusPill = useMemo(() => {
    const s = form.last_sync_status;
    if (!s) return { label: "Not synced", tone: "bg-gray-100 text-gray-700 border-gray-200" };
    if (s === "success") return { label: "Last sync: Success", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    if (s === "failed") return { label: "Last sync: Failed", tone: "bg-rose-50 text-rose-800 border-rose-200" };
    if (s === "running") return { label: "Sync running", tone: "bg-amber-50 text-amber-800 border-amber-200" };
    return { label: String(s), tone: "bg-gray-100 text-gray-700 border-gray-200" };
  }, [form.last_sync_status]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /settings/integrations/accounting
      // -> { data: { ...DEFAULT_STATE } }
      const res = await api.get("/settings/integrations/accounting");
      const data = res?.data?.data ?? res?.data ?? {};
      setForm((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.warn("Accounting sync settings fetch failed:", err);
      toast({
        title: "Failed to load accounting sync",
        description: err?.response?.data?.message || "Using defaults for now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // PUT /settings/integrations/accounting
      await api.put("/settings/integrations/accounting", form);
      toast({ title: "Saved", description: "Accounting sync settings updated." });
      await fetchSettings();
    } catch (err) {
      console.warn("Accounting sync save failed:", err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // POST /settings/integrations/accounting/test
      const res = await api.post("/settings/integrations/accounting/test", { provider: form.provider });
      toast({
        title: "Connection OK",
        description: res?.data?.message || `Connected to ${providerMeta.label} successfully.`,
      });
    } catch (err) {
      console.warn("Accounting sync test failed:", err);
      toast({
        title: "Connection failed",
        description: err?.response?.data?.message || "Check credentials/base URL and try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunSync = async () => {
    setSyncing(true);
    try {
      // POST /settings/integrations/accounting/sync
      const res = await api.post("/settings/integrations/accounting/sync", { mode: "manual" });
      toast({
        title: "Sync triggered",
        description: res?.data?.message || "Manual sync started.",
      });
      await fetchSettings();
    } catch (err) {
      console.warn("Accounting sync run failed:", err);
      toast({
        title: "Failed to start sync",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // POST /settings/integrations/accounting/disconnect
      await api.post("/settings/integrations/accounting/disconnect");
      setDisconnectOpen(false);
      toast({ title: "Disconnected", description: "Accounting integration disabled and secrets cleared." });
      await fetchSettings();
    } catch (err) {
      console.warn("Accounting disconnect failed:", err);
      toast({
        title: "Disconnect failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading accounting sync...
        </div>
      </Card>
    );
  }

  const secretsMaskedHint = showSecrets ? "Secrets are visible" : "Secrets are hidden";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Accounting Sync</h1>
            <p className="text-sm text-gray-500">
              Connect your PCB manufacturing ERP to accounting tools to sync invoices, receipts, GRN and payments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cx("border", statusPill.tone)} variant="outline">
            {statusPill.label}
          </Badge>

          <Button variant="outline" className="gap-2" onClick={fetchSettings} disabled={saving || testing || syncing}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Enable + provider */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-gray-600" />
              <p className="text-sm font-semibold text-gray-900">Integration</p>
              <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                {providerMeta.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, finance postings can be pushed automatically based on rules below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <span className="text-xs font-semibold text-gray-700">Enabled</span>
              <Switch checked={!!form.enabled} onCheckedChange={(v) => setField("enabled", v)} />
            </div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowSecrets((s) => !s)}
              title={secretsMaskedHint}
            >
              {showSecrets ? <Cloud className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
              {showSecrets ? "Hide secrets" : "Show secrets"}
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={handleTestConnection}
              disabled={!form.enabled || testing}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Test connection
            </Button>

            <Button
              className="gap-2 bg-gray-900 text-white hover:bg-gray-800"
              onClick={handleRunSync}
              disabled={!form.enabled || syncing}
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Run sync
            </Button>

            <Button
              variant="outline"
              className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={() => setDisconnectOpen(true)}
              disabled={!form.enabled}
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <select
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              value={form.provider}
              onChange={(e) => setField("provider", e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              For Tally, base URL typically points to a middleware/connector running in your network.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Schedule</Label>
            <select
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              value={form.schedule}
              onChange={(e) => setField("schedule", e.target.value)}
            >
              <option value="realtime">Realtime (on events)</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
            <p className="text-xs text-gray-500">
              Realtime pushes whenever invoices/receipts are posted. Hourly/Daily runs in batches.
            </p>
          </div>
        </div>

        {/* last sync info */}
        <div className="mt-4 rounded-xl border bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {form.last_sync_status === "failed" ? (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
              <p className="text-sm font-semibold text-gray-900">Sync status</p>
            </div>

            <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
              Last sync: {form.last_sync_at ? new Date(form.last_sync_at).toLocaleString() : "—"}
            </Badge>
          </div>

          {form.last_error ? (
            <p className="mt-2 text-xs text-rose-700">
              <span className="font-semibold">Last error:</span> {String(form.last_error)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-600">
              No recent errors recorded.
            </p>
          )}
        </div>
      </Card>

      {/* Connection details */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Connection Details</p>
            <p className="text-xs text-gray-500">Credentials are stored securely on the server.</p>
          </div>
          <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
            {showSecrets ? "Visible" : "Masked"}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              placeholder="https://connector.yourcompany.local"
              value={form.base_url || ""}
              onChange={(e) => setField("base_url", e.target.value)}
              disabled={!form.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Company / Tenant ID</Label>
            <Input
              placeholder="Company ID / Org ID"
              value={form.company_id || ""}
              onChange={(e) => setField("company_id", e.target.value)}
              disabled={!form.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              placeholder={showSecrets ? "Paste API key" : maskKey(form.api_key)}
              value={showSecrets ? (form.api_key || "") : (form.api_key ? maskKey(form.api_key) : "")}
              onChange={(e) => setField("api_key", e.target.value)}
              disabled={!form.enabled || !showSecrets}
            />
            <p className="text-[11px] text-gray-500">
              Turn on “Show secrets” to edit.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input
              placeholder={showSecrets ? "Webhook secret" : maskKey(form.webhook_secret)}
              value={showSecrets ? (form.webhook_secret || "") : (form.webhook_secret ? maskKey(form.webhook_secret) : "")}
              onChange={(e) => setField("webhook_secret", e.target.value)}
              disabled={!form.enabled || !showSecrets}
            />
          </div>

          <div className="space-y-2">
            <Label>Client ID (OAuth)</Label>
            <Input
              placeholder={showSecrets ? "Client ID" : maskKey(form.client_id)}
              value={showSecrets ? (form.client_id || "") : (form.client_id ? maskKey(form.client_id) : "")}
              onChange={(e) => setField("client_id", e.target.value)}
              disabled={!form.enabled || !showSecrets}
            />
          </div>

          <div className="space-y-2">
            <Label>Client Secret (OAuth)</Label>
            <Input
              placeholder={showSecrets ? "Client Secret" : maskKey(form.client_secret)}
              value={showSecrets ? (form.client_secret || "") : (form.client_secret ? maskKey(form.client_secret) : "")}
              onChange={(e) => setField("client_secret", e.target.value)}
              disabled={!form.enabled || !showSecrets}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Notes</Label>
          <Textarea
            placeholder="Example: Ledger mapping rules, connector location, GST config notes..."
            value={form.notes || ""}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={!form.enabled}
          />
        </div>
      </Card>

      {/* Sync rules */}
      <Card className="p-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">Sync Rules</p>
          <p className="text-xs text-gray-500">
            Choose which ERP documents should auto-post to accounting. (Typical PCB ERP flow: Quote → SO → Work Order → GRN → Invoice → Receipt)
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <RuleToggle
            title="Sales Invoices"
            desc="Push posted invoices (GST-ready)"
            checked={!!form.auto_push_invoices}
            onChange={(v) => setField("auto_push_invoices", v)}
            disabled={!form.enabled}
          />
          <RuleToggle
            title="Receipts"
            desc="Push payment receipts & allocations"
            checked={!!form.auto_push_receipts}
            onChange={(v) => setField("auto_push_receipts", v)}
            disabled={!form.enabled}
          />
          <RuleToggle
            title="Payments"
            desc="Push outgoing payments to suppliers"
            checked={!!form.auto_push_payments}
            onChange={(v) => setField("auto_push_payments", v)}
            disabled={!form.enabled}
          />
          <RuleToggle
            title="Purchase Invoices"
            desc="Push supplier bills"
            checked={!!form.auto_push_purchase_invoices}
            onChange={(v) => setField("auto_push_purchase_invoices", v)}
            disabled={!form.enabled}
          />
          <RuleToggle
            title="GRN"
            desc="Push goods receipt notes (optional)"
            checked={!!form.auto_push_grn}
            onChange={(v) => setField("auto_push_grn", v)}
            disabled={!form.enabled}
          />
          <RuleToggle
            title="Credit Notes"
            desc="Push credit notes (returns/price adj.)"
            checked={!!form.auto_push_credit_notes}
            onChange={(v) => setField("auto_push_credit_notes", v)}
            disabled={!form.enabled}
          />
          <RuleToggle
            title="Debit Notes"
            desc="Push debit notes (supplier claims)"
            checked={!!form.auto_push_debit_notes}
            onChange={(v) => setField("auto_push_debit_notes", v)}
            disabled={!form.enabled}
          />
        </div>

        <div className="mt-4 rounded-xl border bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Recommended mapping (PCB context)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
            <li>Customers → Accounting parties/contacts</li>
            <li>Items (laminate, solder mask, chemicals) → Stock/expense ledgers</li>
            <li>Jobs/Work Orders → Cost centers (optional)</li>
            <li>GRN → Inventory valuation updates (if supported)</li>
            <li>Invoices/Receipts → GST postings and receivables</li>
          </ul>
        </div>
      </Card>

      {/* Disconnect dialog */}
      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-600" />
              Disconnect accounting integration?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will disable sync and clear stored secrets on the server. You can reconnect anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RuleToggle({ title, desc, checked, onChange, disabled }) {
  return (
    <div className={cx("rounded-xl border p-4", disabled ? "bg-gray-50 opacity-80" : "bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
}
