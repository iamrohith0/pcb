// src/pages/settings/integrations/NotificationRules.jsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Bell,
  CheckCircle2,
  Clock,
  Factory,
  Info,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  Webhook,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const CHANNELS = [
  { key: "in_app", label: "In-app", icon: Bell },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS/WhatsApp", icon: MessageSquare },
  { key: "webhook", label: "Webhook", icon: Webhook },
];

const EVENTS = [
  {
    group: "Sales",
    icon: Info,
    items: [
      { key: "rfq.created", label: "RFQ Created" },
      { key: "quote.sent", label: "Quotation Sent" },
      { key: "order.confirmed", label: "Sales Order Confirmed" },
    ],
  },
  {
    group: "Engineering",
    icon: Factory,
    items: [
      { key: "gerber.received", label: "Gerber/ODB++ Received" },
      { key: "dfm.failed", label: "DFM Failed" },
      { key: "dfm.approved", label: "DFM Approved" },
      { key: "cam.completed", label: "CAM Completed" },
    ],
  },
  {
    group: "Production",
    icon: Clock,
    items: [
      { key: "wo.released", label: "Work Order Released" },
      { key: "wip.hold", label: "WIP Put on Hold" },
      { key: "wip.released", label: "WIP Hold Released" },
      { key: "capacity.alert", label: "Capacity Alert" },
    ],
  },
  {
    group: "Quality",
    icon: ShieldCheck,
    items: [
      { key: "aoi.failed", label: "AOI Failed" },
      { key: "etest.failed", label: "E-test Failed" },
      { key: "ncr.raised", label: "NCR Raised" },
      { key: "capa.created", label: "CAPA Created" },
    ],
  },
  {
    group: "Logistics",
    icon: Truck,
    items: [
      { key: "dispatch.created", label: "Dispatch Created" },
      { key: "shipment.delivered", label: "Shipment Delivered" },
    ],
  },
];

const DEFAULTS = {
  enabled: true,
  global: {
    quiet_hours_enabled: false,
    quiet_hours_from: "22:00",
    quiet_hours_to: "08:00",
    recipient_fallback_emails: "",
    recipient_fallback_phones: "",
  },
  rules: [
    {
      id: "rule-1",
      name: "Critical failures → QA + Production Manager",
      enabled: true,
      priority: "high", // low | normal | high
      events: ["dfm.failed", "aoi.failed", "etest.failed", "ncr.raised"],
      channels: { in_app: true, email: true, sms: false, webhook: false },
      recipients: {
        roles: ["quality_manager", "production_manager"],
        users: [],
      },
      throttle: { enabled: true, minutes: 15 },
      template_hint: "Include job/WO, panel/lot/serial and failure reason.",
    },
  ],
};

function makeId() {
  return `rule_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function NotificationRules() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState(DEFAULTS);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /admin/settings/notification-rules -> { data: { ... } } OR { ... }
      const res = await api.get("/admin/settings/notification-rules");
      const payload = res?.data?.data ?? res?.data ?? null;

      if (payload && typeof payload === "object") {
        setData((prev) => ({
          enabled: typeof payload.enabled === "boolean" ? payload.enabled : prev.enabled,
          global: { ...prev.global, ...(payload.global || {}) },
          rules: Array.isArray(payload.rules) ? payload.rules : prev.rules,
        }));
      } else {
        setData(DEFAULTS);
      }
    } catch (err) {
      toast({
        title: "Failed to load rules",
        description: "Could not fetch notification rules. Using defaults.",
        variant: "destructive",
      });
      setData(DEFAULTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateRule = (id, patch) => {
    setData((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const removeRule = (id) => {
    setData((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== id) }));
  };

  const addRule = () => {
    const id = makeId();
    setData((prev) => ({
      ...prev,
      rules: [
        {
          id,
          name: "New rule",
          enabled: true,
          priority: "normal",
          events: [],
          channels: { in_app: true, email: false, sms: false, webhook: false },
          recipients: { roles: [], users: [] },
          throttle: { enabled: false, minutes: 10 },
          template_hint: "",
        },
        ...prev.rules,
      ],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Expected:
      // PUT /admin/settings/notification-rules body -> { enabled, global, rules }
      await api.put("/admin/settings/notification-rules", data);
      toast({ title: "Saved", description: "Notification rules updated successfully." });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to save notification rules. Please verify values and try again.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setData(DEFAULTS);
    setConfirmResetOpen(false);
    toast({ title: "Reset done", description: "Defaults applied (not saved yet)." });
  };

  const eventIndex = useMemo(() => {
    const map = new Map();
    EVENTS.forEach((g) => g.items.forEach((it) => map.set(it.key, it.label)));
    return map;
  }, []);

  const countEnabledRules = useMemo(() => data.rules.filter((r) => r.enabled).length, [data.rules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notification Rules</h1>
          <p className="text-sm text-gray-500">
            Define who gets notified for PCB manufacturing events (DFM, CAM, AOI, E-test, WIP, dispatch).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="gap-2" onClick={fetchRules} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button variant="ghost" className="gap-2" onClick={addRule}>
            <Bell className="h-4 w-4" />
            Add Rule
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
            Save
          </Button>
        </div>
      </div>

      {/* Global toggle + summary */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Notifications</p>
                <p className="text-sm text-gray-600">
                  {data.enabled ? (
                    <>
                      Enabled. <span className="font-medium">{countEnabledRules}</span> active rule(s).
                    </>
                  ) : (
                    <>Disabled. No notifications will be sent.</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-500">Enabled</Label>
              <Switch checked={!!data.enabled} onCheckedChange={(v) => setPath("enabled", v)} />
              {data.enabled ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </Badge>
              ) : (
                <Badge variant="secondary">Off</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Global Settings</CardTitle>
          <CardDescription>Quiet hours and fallback recipients (used when rule recipients are empty).</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">Quiet Hours</p>
              <p className="text-xs text-gray-500">Suppress non-critical alerts during specified time window.</p>
            </div>
            <Switch
              checked={!!data.global.quiet_hours_enabled}
              onCheckedChange={(v) => setPath("global.quiet_hours_enabled", v)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Quiet Hours From</Label>
              <Input
                type="time"
                value={data.global.quiet_hours_from}
                onChange={(e) => setPath("global.quiet_hours_from", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quiet Hours To</Label>
              <Input
                type="time"
                value={data.global.quiet_hours_to}
                onChange={(e) => setPath("global.quiet_hours_to", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fallback Emails</Label>
              <Textarea
                rows={3}
                value={data.global.recipient_fallback_emails}
                onChange={(e) => setPath("global.recipient_fallback_emails", e.target.value)}
                placeholder="Comma-separated emails"
              />
              <p className="text-xs text-gray-500">Used if a rule has no recipients defined.</p>
            </div>
            <div className="space-y-2">
              <Label>Fallback Phones</Label>
              <Textarea
                rows={3}
                value={data.global.recipient_fallback_phones}
                onChange={(e) => setPath("global.recipient_fallback_phones", e.target.value)}
                placeholder="Comma-separated phone numbers (with country code)"
              />
              <p className="text-xs text-gray-500">Used for SMS/WhatsApp fallback only.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules list */}
      <div className="space-y-4">
        {loading ? (
          <Card className="shadow-sm">
            <CardContent className="p-6 text-sm text-gray-600">Loading rules…</CardContent>
          </Card>
        ) : data.rules.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-6 text-sm text-gray-600">
              No rules yet. Click <span className="font-medium">Add Rule</span> to create your first notification rule.
            </CardContent>
          </Card>
        ) : (
          data.rules.map((rule) => {
            const selectedEvents = rule.events || [];
            const channelKeys = Object.keys(rule.channels || {});
            const enabledChannels = channelKeys.filter((k) => rule.channels?.[k]);

            return (
              <Card key={rule.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        <Input
                          value={rule.name}
                          onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                          className="h-10"
                        />
                      </CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Factory className="h-3.5 w-3.5" />
                          {rule.priority === "high" ? "High" : rule.priority === "low" ? "Low" : "Normal"} priority
                        </Badge>

                        <Badge variant="secondary" className="gap-1">
                          <Bell className="h-3.5 w-3.5" />
                          {enabledChannels.length ? `${enabledChannels.length} channel(s)` : "No channels"}
                        </Badge>

                        <Badge variant="secondary" className="gap-1">
                          <Truck className="h-3.5 w-3.5" />
                          {selectedEvents.length ? `${selectedEvents.length} event(s)` : "No events"}
                        </Badge>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-500">Enabled</Label>
                      <Switch
                        checked={!!rule.enabled}
                        onCheckedChange={(v) => updateRule(rule.id, { enabled: v })}
                      />
                      <Button
                        variant="ghost"
                        className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => removeRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Priority */}
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <div className="flex flex-wrap gap-2">
                      {["low", "normal", "high"].map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant={rule.priority === p ? "default" : "ghost"}
                          onClick={() => updateRule(rule.id, { priority: p })}
                          className="capitalize"
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Tip: Use <span className="font-medium">High</span> for DFM/AOI/E-test failures and NCR/CAPA.
                    </p>
                  </div>

                  {/* Channels */}
                  <div className="space-y-2">
                    <Label>Channels</Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {CHANNELS.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center justify-between rounded-xl border p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{label}</span>
                          </div>
                          <Switch
                            checked={!!rule.channels?.[key]}
                            onCheckedChange={(v) =>
                              updateRule(rule.id, { channels: { ...rule.channels, [key]: v } })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Events</Label>
                      <Badge variant="secondary">{selectedEvents.length} selected</Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {EVENTS.map((group) => {
                        const GroupIcon = group.icon;
                        return (
                          <div key={group.group} className="rounded-xl border p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <GroupIcon className="h-4 w-4 text-gray-500" />
                              <p className="text-sm font-semibold">{group.group}</p>
                            </div>

                            <div className="space-y-2">
                              {group.items.map((ev) => {
                                const checked = selectedEvents.includes(ev.key);
                                return (
                                  <div key={ev.key} className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">{ev.label}</p>
                                      <p className="text-xs text-gray-500">{ev.key}</p>
                                    </div>
                                    <Switch
                                      checked={checked}
                                      onCheckedChange={(v) => {
                                        const next = v
                                          ? Array.from(new Set([...selectedEvents, ev.key]))
                                          : selectedEvents.filter((k) => k !== ev.key);
                                        updateRule(rule.id, { events: next });
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    <Label>Recipients</Label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Roles (comma-separated)</Label>
                        <Input
                          value={(rule.recipients?.roles || []).join(", ")}
                          onChange={(e) => {
                            const roles = e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean);
                            updateRule(rule.id, {
                              recipients: { ...(rule.recipients || {}), roles },
                            });
                          }}
                          placeholder="quality_manager, production_manager"
                        />
                        <p className="text-xs text-gray-500">
                          Use role keys from backend RBAC (example:{" "}
                          <span className="font-medium">quality_manager</span>).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Users (IDs/emails, comma-separated)</Label>
                        <Input
                          value={(rule.recipients?.users || []).join(", ")}
                          onChange={(e) => {
                            const users = e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean);
                            updateRule(rule.id, {
                              recipients: { ...(rule.recipients || {}), users },
                            });
                          }}
                          placeholder="john@pcbxpress.com, 1023"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        If recipients are empty, fallback recipients from <span className="font-medium">Global Settings</span> will be used.
                      </span>
                    </div>
                  </div>

                  {/* Throttle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Throttle</Label>
                      <Switch
                        checked={!!rule.throttle?.enabled}
                        onCheckedChange={(v) =>
                          updateRule(rule.id, {
                            throttle: { ...(rule.throttle || {}), enabled: v },
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Minutes</Label>
                        <Input
                          type="number"
                          min={1}
                          value={String(rule.throttle?.minutes ?? 10)}
                          onChange={(e) =>
                            updateRule(rule.id, {
                              throttle: {
                                ...(rule.throttle || {}),
                                minutes: Math.max(1, Number(e.target.value || 10)),
                              },
                            })
                          }
                          disabled={!rule.throttle?.enabled}
                        />
                        <p className="text-xs text-gray-500">
                          Prevent duplicate alerts for the same event within the specified minutes.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Template Hint</Label>
                        <Textarea
                          rows={3}
                          value={rule.template_hint || ""}
                          onChange={(e) => updateRule(rule.id, { template_hint: e.target.value })}
                          placeholder="Example: include job id, WO id, lot/serial, station, failure reason…"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick summary */}
                  <div className="rounded-xl border bg-white p-3 text-xs text-gray-700">
                    <p className="font-semibold">Rule Summary</p>
                    <p className="mt-1">
                      Events:{" "}
                      <span className="font-medium">
                        {selectedEvents.length
                          ? selectedEvents.map((k) => eventIndex.get(k) || k).join(", ")
                          : "None"}
                      </span>
                    </p>
                    <p className="mt-1">
                      Channels:{" "}
                      <span className="font-medium">
                        {enabledChannels.length ? enabledChannels.join(", ") : "None"}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Reset confirmation */}
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset notification rules?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the form to defaults. It will <span className="font-medium">not</span> save until you click{" "}
              <span className="font-medium">Save</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
