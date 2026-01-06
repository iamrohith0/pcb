// src/pages/settings/integrations/CarrierIntegration.jsx
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
    CheckCircle2,
    Copy,
    KeyRound,
    Link2,
    RefreshCw,
    ShieldCheck,
    Truck,
    XCircle,
} from "lucide-react";

/**
 * PCBxpress - Carrier Integration
 * Path: src/pages/settings/integrations/CarrierIntegration.jsx
 *
 * Purpose:
 * - Configure courier/carrier API connections (BlueDart / DTDC / Delhivery / DHL etc.)
 * - Store credentials (API Key, Client ID, Secret) and webhook URL
 * - Enable/disable integration and test connectivity
 *
 * NOTE:
 * - This is a frontend-only scaffold with mock persistence.
 * - Replace mock APIs with your real backend endpoints later.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function maskSecret(val, keep = 4) {
  if (!val) return "";
  if (val.length <= keep) return "•".repeat(val.length);
  return "•".repeat(Math.max(6, val.length - keep)) + val.slice(-keep);
}

function genWebhookUrl() {
  // Use your backend base URL in real implementation
  return `${window.location.origin}/api/webhooks/carriers`;
}

// ---------------- Mock API ----------------
async function mockFetchCarrierConfig() {
  await new Promise((r) => setTimeout(r, 300));
  return {
    active: true,
    defaultCarrier: "BlueDart",
    webhookUrl: genWebhookUrl(),
    carriers: [
      {
        code: "BlueDart",
        enabled: true,
        accountName: "PCBxpress Dispatch",
        clientId: "BD-CLIENT-001",
        apiKey: "BD-API-KEY-EXAMPLE-1234",
        apiSecret: "BD-SECRET-EXAMPLE-9876",
        pickupPincode: "682001",
        mode: "Production",
        lastTest: { ok: true, at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), msg: "Authenticated" },
      },
      {
        code: "DTDC",
        enabled: false,
        accountName: "",
        clientId: "",
        apiKey: "",
        apiSecret: "",
        pickupPincode: "",
        mode: "Sandbox",
        lastTest: null,
      },
      {
        code: "Delhivery",
        enabled: false,
        accountName: "",
        clientId: "",
        apiKey: "",
        apiSecret: "",
        pickupPincode: "",
        mode: "Sandbox",
        lastTest: null,
      },
      {
        code: "DHL",
        enabled: false,
        accountName: "",
        clientId: "",
        apiKey: "",
        apiSecret: "",
        pickupPincode: "",
        mode: "Sandbox",
        lastTest: null,
      },
    ],
  };
}

async function mockSaveCarrierConfig(payload) {
  await new Promise((r) => setTimeout(r, 450));
  // pretend save ok
  return { ok: true, data: payload };
}

async function mockTestCarrierConnection(code) {
  await new Promise((r) => setTimeout(r, 650));
  // random-ish ok/fail
  const ok = Math.random() > 0.18;
  return ok
    ? { ok: true, msg: "Connection OK. Token issued successfully." }
    : { ok: false, msg: "Authentication failed. Please verify Client ID / Key / Secret." };
}
// ------------------------------------------

const CARRIER_LIST = [
  { code: "BlueDart", label: "BlueDart" },
  { code: "DTDC", label: "DTDC" },
  { code: "Delhivery", label: "Delhivery" },
  { code: "DHL", label: "DHL" },
];

const MODE_BADGE = {
  Production: "bg-green-100 text-green-800 hover:bg-green-100",
  Sandbox: "bg-gray-100 text-gray-700 hover:bg-gray-100",
};

export default function CarrierIntegration() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [selected, setSelected] = useState("BlueDart");
  const [form, setForm] = useState({
    active: true,
    defaultCarrier: "BlueDart",
    webhookUrl: genWebhookUrl(),
    carriers: [],
  });

  const selectedCarrier = useMemo(() => {
    return (form.carriers || []).find((c) => c.code === selected) || null;
  }, [form.carriers, selected]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await mockFetchCarrierConfig();
      setForm(data);
      setSelected(data.defaultCarrier || "BlueDart");
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load",
        description: "Could not fetch carrier integrations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCarrier = (code, patch) => {
    setForm((prev) => {
      const carriers = (prev.carriers || []).map((c) => (c.code === code ? { ...c, ...patch } : c));
      return { ...prev, carriers };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // minimal validation
      const enabledAny = (form.carriers || []).some((c) => c.enabled);
      if (form.active && !enabledAny) {
        toast({
          title: "Enable at least one carrier",
          description: "If carrier integration is active, enable at least one courier.",
          variant: "destructive",
        });
        return;
      }

      await mockSaveCarrierConfig(form);
      toast({ title: "Saved", description: "Carrier integrations updated." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: "Unable to save carrier settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!selectedCarrier) return;
    setTesting(true);
    try {
      if (!selectedCarrier.enabled) {
        toast({
          title: "Carrier disabled",
          description: "Enable this carrier before testing.",
          variant: "destructive",
        });
        return;
      }
      if (!selectedCarrier.clientId || !selectedCarrier.apiKey || !selectedCarrier.apiSecret) {
        toast({
          title: "Missing credentials",
          description: "Client ID, API Key, and Secret are required to test.",
          variant: "destructive",
        });
        return;
      }

      const res = await mockTestCarrierConnection(selectedCarrier.code);
      const stamp = {
        ok: !!res.ok,
        at: new Date().toISOString(),
        msg: res.msg,
      };

      updateCarrier(selectedCarrier.code, { lastTest: stamp });

      toast({
        title: res.ok ? "Test successful" : "Test failed",
        description: res.msg,
        variant: res.ok ? "default" : "destructive",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Test failed",
        description: "Unexpected error while testing integration.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(form.webhookUrl || "");
      toast({ title: "Copied", description: "Webhook URL copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy webhook URL.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">Carrier Integration</h1>
            <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">PCBxpress</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Connect couriers to generate AWB, schedule pickup, and sync tracking updates automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={handleSave} disabled={loading || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Global config */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-gray-500" />
            Global Settings
          </CardTitle>
          <CardDescription>Enable/disable carrier automation and configure webhook for status updates.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* active */}
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Integration</p>
                  <p className="mt-1 text-xs text-gray-500">
                    When off, shipments remain manual (no AWB/pickup automation).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                  className={cx(
                    "inline-flex h-9 w-16 items-center rounded-full border px-1 transition-colors",
                    form.active ? "border-[#dc2551]/30 bg-[#dc2551]/10" : "border-gray-200 bg-gray-50"
                  )}
                  aria-label="Toggle integration"
                >
                  <span
                    className={cx(
                      "h-7 w-7 rounded-full shadow-sm transition-transform",
                      form.active ? "translate-x-7 bg-[#dc2551]" : "translate-x-0 bg-white"
                    )}
                  />
                </button>
              </div>

              <div className="mt-3">
                <Badge className={form.active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}>
                  {form.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* default carrier */}
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Default Carrier</p>
              <p className="mt-1 text-xs text-gray-500">Used when creating shipments unless overridden.</p>

              <select
                value={form.defaultCarrier}
                onChange={(e) => {
                  const next = e.target.value;
                  setForm((p) => ({ ...p, defaultCarrier: next }));
                  setSelected(next);
                }}
                className="mt-3 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                {CARRIER_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* webhook */}
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Webhook URL</p>
              <p className="mt-1 text-xs text-gray-500">
                Carriers can push tracking events to your ERP (Delivered, In Transit, RTO, etc.).
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Input value={form.webhookUrl} readOnly />
                <Button variant="outline" className="gap-2" onClick={copyWebhook}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Link2 className="h-3.5 w-3.5" />
                Configure this URL in the courier dashboard.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carrier tabs + form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left list */}
        <Card className="border-gray-100 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-gray-500" />
              Carriers
            </CardTitle>
            <CardDescription>Select a carrier to configure credentials.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            {(form.carriers || []).map((c) => {
              const isActive = c.code === selected;
              const statusBadge = c.enabled
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : "bg-gray-100 text-gray-700 hover:bg-gray-100";

              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelected(c.code)}
                  className={cx(
                    "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                    isActive ? "border-[#dc2551]/30 bg-[#dc2551]/5" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.code}</p>
                      <p className="text-xs text-gray-500">
                        Mode:{" "}
                        <span className="font-medium">{c.mode || "—"}</span>
                      </p>
                    </div>
                    <Badge className={statusBadge}>{c.enabled ? "Enabled" : "Disabled"}</Badge>
                  </div>

                  {c.lastTest ? (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {c.lastTest.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-gray-600">
                        Last test: <span className="font-medium">{new Date(c.lastTest.at).toLocaleString()}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-400">No test run yet</div>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right details */}
        <Card className="border-gray-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-gray-500" />
              {selectedCarrier?.code || "Carrier"} Configuration
            </CardTitle>
            <CardDescription>
              Store credentials securely in backend. Frontend should never permanently store secrets.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
              </div>
            ) : !selectedCarrier ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
                Select a carrier from the list.
              </div>
            ) : (
              <div className="space-y-5">
                {/* header row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={MODE_BADGE[selectedCarrier.mode] || "bg-gray-100 text-gray-700"}>
                      {selectedCarrier.mode || "Sandbox"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Recommended: Sandbox for testing, Production for live shipments.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        updateCarrier(selectedCarrier.code, {
                          enabled: !selectedCarrier.enabled,
                        })
                      }
                    >
                      {selectedCarrier.enabled ? "Disable" : "Enable"}
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        updateCarrier(selectedCarrier.code, {
                          mode: selectedCarrier.mode === "Production" ? "Sandbox" : "Production",
                        })
                      }
                    >
                      Switch to {selectedCarrier.mode === "Production" ? "Sandbox" : "Production"}
                    </Button>

                    <Button
                      className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                      onClick={handleTest}
                      disabled={testing || !selectedCarrier.enabled}
                    >
                      {testing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* form */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input
                      value={selectedCarrier.accountName || ""}
                      onChange={(e) => updateCarrier(selectedCarrier.code, { accountName: e.target.value })}
                      placeholder="e.g., PCBxpress Dispatch Account"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pickup Pincode</Label>
                    <Input
                      value={selectedCarrier.pickupPincode || ""}
                      onChange={(e) => updateCarrier(selectedCarrier.code, { pickupPincode: e.target.value })}
                      placeholder="e.g., 682001"
                    />
                    <p className="text-xs text-gray-500">Used for pickup booking and serviceability checks.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input
                      value={selectedCarrier.clientId || ""}
                      onChange={(e) => updateCarrier(selectedCarrier.code, { clientId: e.target.value })}
                      placeholder="Enter Client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      value={selectedCarrier.apiKey || ""}
                      onChange={(e) => updateCarrier(selectedCarrier.code, { apiKey: e.target.value })}
                      placeholder="Enter API Key"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>API Secret</Label>
                    <Input
                      value={selectedCarrier.apiSecret || ""}
                      onChange={(e) => updateCarrier(selectedCarrier.code, { apiSecret: e.target.value })}
                      placeholder="Enter API Secret"
                    />
                    <p className="text-xs text-gray-500">
                      Display hint: <span className="font-medium">{maskSecret(selectedCarrier.apiSecret)}</span>
                    </p>
                  </div>
                </div>

                {/* last test */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedCarrier.lastTest ? (
                        selectedCarrier.lastTest.ok ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )
                      ) : (
                        <ShieldCheck className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Last Test Result</p>
                        <p className="text-xs text-gray-500">
                          {selectedCarrier.lastTest ? new Date(selectedCarrier.lastTest.at).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-gray-700">
                    {selectedCarrier.lastTest?.msg || "Run a test to verify authentication and connectivity."}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <Badge className="bg-white text-gray-700 hover:bg-white">AWB</Badge>
                    <Badge className="bg-white text-gray-700 hover:bg-white">Pickup</Badge>
                    <Badge className="bg-white text-gray-700 hover:bg-white">Tracking</Badge>
                    <Badge className="bg-white text-gray-700 hover:bg-white">RTO</Badge>
                  </div>
                </div>

                {/* security note */}
                <div className="flex items-start gap-2 rounded-xl border border-[#dc2551]/20 bg-[#dc2551]/5 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-[#dc2551]" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Security note</p>
                    <p className="mt-1 text-xs text-gray-600">
                      Store credentials encrypted in backend and return only masked values to UI. Restrict access to
                      Admin roles and audit all changes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
