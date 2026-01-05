// src/pages/settings/integrations/ERPWebhooks.jsx
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
  Copy,
  Globe,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Shield,
  Trash2,
  Webhook,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DEFAULT_WEBHOOKS = {
  enabled: false,
  signing_secret: "",
  delivery_timeout_ms: 6000,
  retry_count: 3,
  events: {
    // Sales
    "sales.rfq.created": true,
    "sales.quote.sent": true,
    "sales.order.confirmed": true,
    "sales.invoice.posted": true,

    // Engineering
    "engineering.dfm.completed": true,
    "engineering.cam.released": true,
    "engineering.panelization.released": false,
    "engineering.stackup.approved": false,

    // Production
    "production.wo.released": true,
    "production.wip.moved": true,
    "production.dispatch.ready": false,

    // Quality
    "quality.inspection.completed": true,
    "quality.ncr.created": true,
    "quality.capa.closed": false,
    "quality.etest.completed": true,

    // Inventory / Procurement
    "inventory.stock.changed": false,
    "procurement.po.approved": false,
    "procurement.grn.posted": true,
  },
  targets: [
    // { id, name, url, enabled, headers, description }
  ],
  last_delivery_at: null,
  last_delivery_status: null, // success | failed | null
  last_error: null,
};

function maskSecret(s) {
  if (!s) return "";
  if (s.length <= 8) return "••••••••";
  return `${s.slice(0, 4)}••••••••${s.slice(-4)}`;
}

function buildEventCategories(events) {
  const entries = Object.entries(events || {});
  const groups = {
    Sales: [],
    Engineering: [],
    Production: [],
    Quality: [],
    Inventory: [],
    Procurement: [],
    Other: [],
  };

  for (const [k, v] of entries) {
    const prefix = k.split(".")[0];
    if (prefix === "sales") groups.Sales.push([k, v]);
    else if (prefix === "engineering") groups.Engineering.push([k, v]);
    else if (prefix === "production") groups.Production.push([k, v]);
    else if (prefix === "quality") groups.Quality.push([k, v]);
    else if (prefix === "inventory") groups.Inventory.push([k, v]);
    else if (prefix === "procurement") groups.Procurement.push([k, v]);
    else groups.Other.push([k, v]);
  }

  return groups;
}

function safeJsonParse(s) {
  if (!s) return {};
  try {
    const obj = JSON.parse(s);
    return typeof obj === "object" && obj ? obj : {};
  } catch {
    return null;
  }
}

export default function ERPWebhooks() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [showSecret, setShowSecret] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_WEBHOOKS });

  // Add Target form
  const [newTarget, setNewTarget] = useState({
    name: "",
    url: "",
    enabled: true,
    description: "",
    headersText: `{\n  "Content-Type": "application/json"\n}`,
  });

  const statusPill = useMemo(() => {
    const s = form.last_delivery_status;
    if (!s) return { label: "No deliveries yet", tone: "bg-gray-100 text-gray-700 border-gray-200" };
    if (s === "success") return { label: "Last delivery: Success", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    if (s === "failed") return { label: "Last delivery: Failed", tone: "bg-rose-50 text-rose-800 border-rose-200" };
    return { label: String(s), tone: "bg-gray-100 text-gray-700 border-gray-200" };
  }, [form.last_delivery_status]);

  const groupedEvents = useMemo(() => buildEventCategories(form.events), [form.events]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /settings/integrations/webhooks
      // -> { data: { ...DEFAULT_WEBHOOKS } }
      const res = await api.get("/settings/integrations/webhooks");
      const data = res?.data?.data ?? res?.data ?? {};
      setForm((prev) => ({
        ...prev,
        ...data,
        events: { ...DEFAULT_WEBHOOKS.events, ...(data.events || {}) },
        targets: Array.isArray(data.targets) ? data.targets : [],
      }));
    } catch (err) {
      console.warn("Webhooks settings fetch failed:", err);
      toast({
        title: "Failed to load webhooks",
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

  const toggleEvent = (eventKey, enabled) => {
    setForm((p) => ({
      ...p,
      events: { ...(p.events || {}), [eventKey]: !!enabled },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // PUT /settings/integrations/webhooks
      await api.put("/settings/integrations/webhooks", form);
      toast({ title: "Saved", description: "Webhook settings updated." });
      await fetchSettings();
    } catch (err) {
      console.warn("Webhooks save failed:", err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: label, description: "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  const addTarget = () => {
    const url = (newTarget.url || "").trim();
    const name = (newTarget.name || "").trim();

    if (!name || !url) {
      toast({ title: "Missing fields", description: "Target name and URL are required.", variant: "destructive" });
      return;
    }

    // Basic URL validation
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid https:// webhook URL.", variant: "destructive" });
      return;
    }

    const headersObj = safeJsonParse(newTarget.headersText);
    if (headersObj === null) {
      toast({
        title: "Invalid headers JSON",
        description: "Headers must be valid JSON object format.",
        variant: "destructive",
      });
      return;
    }

    const target = {
      id: crypto?.randomUUID?.() || `t_${Date.now()}`,
      name,
      url,
      enabled: !!newTarget.enabled,
      description: (newTarget.description || "").trim(),
      headers: headersObj || {},
    };

    setForm((p) => ({ ...p, targets: [...(p.targets || []), target] }));
    setNewTarget({
      name: "",
      url: "",
      enabled: true,
      description: "",
      headersText: `{\n  "Content-Type": "application/json"\n}`,
    });

    toast({ title: "Target added", description: "Don't forget to Save." });
  };

  const updateTarget = (id, patch) => {
    setForm((p) => ({
      ...p,
      targets: (p.targets || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const requestDeleteTarget = (id) => setDeleteId(id);

  const confirmDeleteTarget = () => {
    if (!deleteId) return;
    setForm((p) => ({ ...p, targets: (p.targets || []).filter((t) => t.id !== deleteId) }));
    setDeleteId(null);
    toast({ title: "Target removed", description: "Don't forget to Save." });
  };

  const testTarget = async (target) => {
    setTestingId(target.id);
    try {
      // POST /settings/integrations/webhooks/test
      // body: { targetId }
      const res = await api.post("/settings/integrations/webhooks/test", {
        targetId: target.id,
      });
      toast({
        title: "Test sent",
        description: res?.data?.message || `A test event was delivered to "${target.name}".`,
      });
      await fetchSettings();
    } catch (err) {
      console.warn("Webhook test failed:", err);
      toast({
        title: "Test failed",
        description: err?.response?.data?.message || "Target not reachable or unauthorized.",
        variant: "destructive",
      });
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading webhooks...
        </div>
      </Card>
    );
  }

  const hasTargets = (form.targets || []).length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Webhook className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ERP Webhooks</h1>
            <p className="text-sm text-gray-500">
              Push real-time PCB ERP events (RFQ, Work Order, WIP moves, Inspection, eTest, CAPA, GRN, Invoice) to external systems.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cx("border", statusPill.tone)} variant="outline">
            {statusPill.label}
          </Badge>

          <Button variant="outline" className="gap-2" onClick={fetchSettings} disabled={saving}>
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

      {/* Enable + secret */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-gray-600" />
              <p className="text-sm font-semibold text-gray-900">Webhook delivery</p>
              <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                HMAC signed
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Each delivery includes a signature header so receivers can verify authenticity.
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
              onClick={() => setShowSecret((s) => !s)}
              title={showSecret ? "Secret is visible" : "Secret is hidden"}
            >
              <KeyRound className="h-4 w-4" />
              {showSecret ? "Hide secret" : "Show secret"}
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => copyText(form.signing_secret || "", "Signing secret copied")}
              disabled={!form.signing_secret}
              title={!form.signing_secret ? "No secret set" : "Copy to clipboard"}
            >
              <Copy className="h-4 w-4" />
              Copy secret
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <Label>Signing secret</Label>
            <Input
              value={showSecret ? (form.signing_secret || "") : (form.signing_secret ? maskSecret(form.signing_secret) : "")}
              placeholder={showSecret ? "Enter a strong secret" : "••••••••"}
              onChange={(e) => setField("signing_secret", e.target.value)}
              disabled={!showSecret}
            />
            <p className="text-[11px] text-gray-500">Turn on “Show secret” to edit.</p>
          </div>

          <div className="space-y-2">
            <Label>Delivery timeout (ms)</Label>
            <Input
              type="number"
              min={1000}
              max={30000}
              value={form.delivery_timeout_ms ?? 6000}
              onChange={(e) => setField("delivery_timeout_ms", Number(e.target.value || 0))}
            />
            <p className="text-[11px] text-gray-500">How long to wait for receiver before failing.</p>
          </div>

          <div className="space-y-2">
            <Label>Retry count</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={form.retry_count ?? 3}
              onChange={(e) => setField("retry_count", Number(e.target.value || 0))}
            />
            <p className="text-[11px] text-gray-500">How many retries for failed deliveries.</p>
          </div>
        </div>

        {!form.enabled && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">Webhooks are disabled</p>
                <p className="mt-1 text-amber-800">
                  Enable webhooks to start delivering ERP events to targets. You can still configure targets and events now.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Event selection */}
      <Card className="p-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">Event subscriptions</p>
          <p className="text-xs text-gray-500">
            Select which ERP events should be delivered. (PCB flow aware)
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Object.entries(groupedEvents).map(([groupName, entries]) => {
            if (!entries.length) return null;
            return (
              <div key={groupName} className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{groupName}</p>
                  <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                    {entries.filter(([, v]) => !!v).length}/{entries.length} enabled
                  </Badge>
                </div>

                <div className="mt-3 space-y-2">
                  {entries.map(([eventKey, enabled]) => (
                    <div key={eventKey} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-800">{eventKey}</p>
                        <p className="text-[11px] text-gray-500">
                          {eventKey.includes("wip") ? "Triggered on WIP station moves" : "ERP event"}
                        </p>
                      </div>
                      <Switch
                        checked={!!enabled}
                        onCheckedChange={(v) => toggleEvent(eventKey, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Targets */}
      <Card className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Targets</p>
            <p className="text-xs text-gray-500">
              Add one or more URLs to receive webhook deliveries.
            </p>
          </div>

          <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
            {hasTargets ? `${form.targets.length} target(s)` : "No targets"}
          </Badge>
        </div>

        {/* Add target */}
        <div className="mt-4 rounded-xl border bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target name</Label>
              <Input
                placeholder="Example: Finance middleware"
                value={newTarget.name}
                onChange={(e) => setNewTarget((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Target URL</Label>
              <Input
                placeholder="https://example.com/webhooks/pcbxpress"
                value={newTarget.url}
                onChange={(e) => setNewTarget((p) => ({ ...p, url: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional note (what this target is used for)"
                value={newTarget.description}
                onChange={(e) => setNewTarget((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Custom headers (JSON)</Label>
              <Textarea
                className="min-h-[110px]"
                value={newTarget.headersText}
                onChange={(e) => setNewTarget((p) => ({ ...p, headersText: e.target.value }))}
              />
              <p className="text-[11px] text-gray-500">
                Use this for auth headers like{" "}
                <span className="font-semibold">{"{\"Authorization\": \"Bearer ...\"}"}</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
                <span className="text-xs font-semibold text-gray-700">Enabled</span>
                <Switch
                  checked={!!newTarget.enabled}
                  onCheckedChange={(v) => setNewTarget((p) => ({ ...p, enabled: v }))}
                />
              </div>

              <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={addTarget}>
                <Globe className="h-4 w-4" />
                Add target
              </Button>
            </div>
          </div>
        </div>

        {/* Target list */}
        <div className="mt-4 space-y-3">
          {(form.targets || []).map((t) => (
            <div key={t.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5" />
                      <span className="truncate">{t.url}</span>
                    </span>
                  </p>
                  {t.description ? <p className="mt-2 text-xs text-gray-500">{t.description}</p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                    <span className="text-xs font-semibold text-gray-700">Enabled</span>
                    <Switch
                      checked={!!t.enabled}
                      onCheckedChange={(v) => updateTarget(t.id, { enabled: v })}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => copyText(t.url, "URL copied")}
                  >
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => testTarget(t)}
                    disabled={!form.enabled || !t.enabled || testingId === t.id}
                    title={!form.enabled ? "Enable webhooks to test" : !t.enabled ? "Enable target to test" : "Send test"}
                  >
                    {testingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Test
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => requestDeleteTarget(t.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>

              {/* Inline edit headers */}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Headers (JSON)</Label>
                  <Textarea
                    className="min-h-[110px]"
                    value={JSON.stringify(t.headers || {}, null, 2)}
                    onChange={(e) => {
                      const parsed = safeJsonParse(e.target.value);
                      if (parsed === null) return; // don't break UX on invalid JSON
                      updateTarget(t.id, { headers: parsed });
                    }}
                  />
                  <p className="text-[11px] text-gray-500">
                    Tip: invalid JSON won’t update until it becomes valid.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Quick payload example</Label>
                  <Textarea
                    readOnly
                    className="min-h-[110px] bg-gray-50"
                    value={JSON.stringify(
                      {
                        id: "evt_123",
                        type: "production.wo.released",
                        created_at: new Date().toISOString(),
                        data: {
                          work_order_no: "WO-2026-0012",
                          job_no: "JOB-1452",
                          layer_count: 6,
                          surface_finish: "ENIG",
                        },
                        signature_header: "X-ERP-Signature: t=..., v1=...",
                      },
                      null,
                      2
                    )}
                  />
                  <Button
                    variant="outline"
                    className="mt-2 gap-2"
                    onClick={() =>
                      copyText(
                        JSON.stringify(
                          {
                            id: "evt_123",
                            type: "production.wo.released",
                            created_at: new Date().toISOString(),
                            data: {
                              work_order_no: "WO-2026-0012",
                              job_no: "JOB-1452",
                              layer_count: 6,
                              surface_finish: "ENIG",
                            },
                          },
                          null,
                          2
                        ),
                        "Payload copied"
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                    Copy payload
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!hasTargets && (
            <div className="rounded-xl border bg-gray-50 p-4 text-xs text-gray-600">
              Add at least one target URL to start delivering events.
            </div>
          )}
        </div>

        {/* Last error */}
        {form.last_error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">Last delivery error</p>
                <p className="mt-1 text-rose-800">{String(form.last_error)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove target?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the webhook target from settings. You can add it back later. (Remember to Save.)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-700" onClick={confirmDeleteTarget}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
