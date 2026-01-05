// src/pages/admin/settings/AdminSettings.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Factory,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Globe,
  Save,
  RefreshCw,
  ShieldCheck,
  Network,
  KeyRound,
  Settings as SettingsIcon,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * AdminSettings.jsx
 * PCBxpress (PCB Manufacturing ERP) - Admin Settings page
 *
 * Expected backend endpoints (recommended):
 * - GET  /admin/settings
 * - PUT  /admin/settings
 *
 * This component is resilient to different response shapes:
 * - { data: { company: {...}, security: {...}, numbering: {...}, integrations: {...} } }
 * - { company: {...}, security: {...} ... }
 */
export default function AdminSettings() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const [initial, setInitial] = useState(null);

  // Company
  const [companyName, setCompanyName] = useState("PCBxpress");
  const [companyTagline, setCompanyTagline] = useState("PCB Manufacturing ERP");
  const [gstin, setGstin] = useState("");
  const [website, setWebsite] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  // Numbering
  const [rfqPrefix, setRfqPrefix] = useState("RFQ");
  const [quotationPrefix, setQuotationPrefix] = useState("QUO");
  const [salesOrderPrefix, setSalesOrderPrefix] = useState("SO");
  const [workOrderPrefix, setWorkOrderPrefix] = useState("WO");
  const [ncrPrefix, setNcrPrefix] = useState("NCR");
  const [capaPrefix, setCapaPrefix] = useState("CAPA");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [padDigits, setPadDigits] = useState(5);

  // Security
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState(""); // comma/newline separated
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(120);

  // Integrations
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");

  const [webhookUrl, setWebhookUrl] = useState("");
  const [erpPublicBaseUrl, setErpPublicBaseUrl] = useState("");

  const normalizeSettings = (payload) => {
    const root = payload?.data ?? payload ?? {};
    const company = root.company ?? {};
    const numbering = root.numbering ?? {};
    const security = root.security ?? {};
    const integrations = root.integrations ?? {};

    return {
      company: {
        name: company.name ?? "PCBxpress",
        tagline: company.tagline ?? "PCB Manufacturing ERP",
        gstin: company.gstin ?? "",
        website: company.website ?? "",
        supportEmail: company.supportEmail ?? company.support_email ?? "",
        supportPhone: company.supportPhone ?? company.support_phone ?? "",
        addressLine: company.addressLine ?? company.address ?? "",
        city: company.city ?? "",
        state: company.state ?? "",
        pincode: company.pincode ?? "",
        country: company.country ?? "India",
      },
      numbering: {
        rfqPrefix: numbering.rfqPrefix ?? numbering.rfq_prefix ?? "RFQ",
        quotationPrefix: numbering.quotationPrefix ?? numbering.quotation_prefix ?? "QUO",
        salesOrderPrefix: numbering.salesOrderPrefix ?? numbering.sales_order_prefix ?? "SO",
        workOrderPrefix: numbering.workOrderPrefix ?? numbering.work_order_prefix ?? "WO",
        ncrPrefix: numbering.ncrPrefix ?? numbering.ncr_prefix ?? "NCR",
        capaPrefix: numbering.capaPrefix ?? numbering.capa_prefix ?? "CAPA",
        invoicePrefix: numbering.invoicePrefix ?? numbering.invoice_prefix ?? "INV",
        padDigits: Number(numbering.padDigits ?? numbering.pad_digits ?? 5),
      },
      security: {
        ipWhitelistEnabled: Boolean(security.ipWhitelistEnabled ?? security.ip_whitelist_enabled ?? true),
        ipWhitelist: Array.isArray(security.ipWhitelist ?? security.ip_whitelist)
          ? (security.ipWhitelist ?? security.ip_whitelist).join("\n")
          : String(security.ipWhitelist ?? security.ip_whitelist ?? ""),
        sessionTimeoutMinutes: Number(security.sessionTimeoutMinutes ?? security.session_timeout_minutes ?? 120),
      },
      integrations: {
        smtpHost: integrations.smtpHost ?? integrations.smtp_host ?? "",
        smtpPort: integrations.smtpPort ?? integrations.smtp_port ?? "",
        smtpUser: integrations.smtpUser ?? integrations.smtp_user ?? "",
        smtpFromEmail: integrations.smtpFromEmail ?? integrations.smtp_from_email ?? "",
        smtpFromName: integrations.smtpFromName ?? integrations.smtp_from_name ?? "",
        webhookUrl: integrations.webhookUrl ?? integrations.webhook_url ?? "",
        erpPublicBaseUrl: integrations.erpPublicBaseUrl ?? integrations.public_base_url ?? "",
      },
    };
  };

  const hydrateForm = (s) => {
    setCompanyName(s.company.name);
    setCompanyTagline(s.company.tagline);
    setGstin(s.company.gstin);
    setWebsite(s.company.website);
    setSupportEmail(s.company.supportEmail);
    setSupportPhone(s.company.supportPhone);
    setAddressLine(s.company.addressLine);
    setCity(s.company.city);
    setState(s.company.state);
    setPincode(s.company.pincode);
    setCountry(s.company.country);

    setRfqPrefix(s.numbering.rfqPrefix);
    setQuotationPrefix(s.numbering.quotationPrefix);
    setSalesOrderPrefix(s.numbering.salesOrderPrefix);
    setWorkOrderPrefix(s.numbering.workOrderPrefix);
    setNcrPrefix(s.numbering.ncrPrefix);
    setCapaPrefix(s.numbering.capaPrefix);
    setInvoicePrefix(s.numbering.invoicePrefix);
    setPadDigits(s.numbering.padDigits);

    setIpWhitelistEnabled(s.security.ipWhitelistEnabled);
    setIpWhitelist(s.security.ipWhitelist);
    setSessionTimeoutMinutes(s.security.sessionTimeoutMinutes);

    setSmtpHost(s.integrations.smtpHost);
    setSmtpPort(s.integrations.smtpPort);
    setSmtpUser(s.integrations.smtpUser);
    setSmtpFromEmail(s.integrations.smtpFromEmail);
    setSmtpFromName(s.integrations.smtpFromName);
    setWebhookUrl(s.integrations.webhookUrl);
    setErpPublicBaseUrl(s.integrations.erpPublicBaseUrl);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      const normalized = normalizeSettings(res.data);
      setInitial(normalized);
      hydrateForm(normalized);
    } catch (err) {
      toast({
        title: "Failed to load settings",
        description: err?.response?.data?.message || "Server error. Please try again.",
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

  const payload = useMemo(() => {
    const ipList = ipWhitelist
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      company: {
        name: companyName.trim(),
        tagline: companyTagline.trim(),
        gstin: gstin.trim(),
        website: website.trim(),
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim(),
      },
      numbering: {
        rfqPrefix: rfqPrefix.trim(),
        quotationPrefix: quotationPrefix.trim(),
        salesOrderPrefix: salesOrderPrefix.trim(),
        workOrderPrefix: workOrderPrefix.trim(),
        ncrPrefix: ncrPrefix.trim(),
        capaPrefix: capaPrefix.trim(),
        invoicePrefix: invoicePrefix.trim(),
        padDigits: Number(padDigits) || 5,
      },
      security: {
        ipWhitelistEnabled: Boolean(ipWhitelistEnabled),
        ipWhitelist: ipList,
        sessionTimeoutMinutes: Number(sessionTimeoutMinutes) || 120,
      },
      integrations: {
        smtpHost: smtpHost.trim(),
        smtpPort: String(smtpPort).trim(),
        smtpUser: smtpUser.trim(),
        smtpFromEmail: smtpFromEmail.trim(),
        smtpFromName: smtpFromName.trim(),
        webhookUrl: webhookUrl.trim(),
        erpPublicBaseUrl: erpPublicBaseUrl.trim(),
      },
    };
  }, [
    addressLine,
    capaPrefix,
    city,
    companyName,
    companyTagline,
    country,
    erpPublicBaseUrl,
    gstin,
    invoicePrefix,
    ipWhitelist,
    ipWhitelistEnabled,
    ncrPrefix,
    padDigits,
    pincode,
    quotationPrefix,
    rfqPrefix,
    salesOrderPrefix,
    sessionTimeoutMinutes,
    smtpFromEmail,
    smtpFromName,
    smtpHost,
    smtpPort,
    smtpUser,
    state,
    supportEmail,
    supportPhone,
    website,
    webhookUrl,
    workOrderPrefix,
  ]);

  const isDirty = useMemo(() => {
    if (!initial) return false;
    try {
      const a = JSON.stringify(initial);
      const b = JSON.stringify(normalizeSettings({ data: payload }));
      return a !== b;
    } catch {
      return true;
    }
  }, [initial, payload]);

  const validate = () => {
    if (!payload.company.name) {
      toast({ title: "Company name required", description: "Enter company name.", variant: "destructive" });
      return false;
    }
    if (payload.security.sessionTimeoutMinutes < 15) {
      toast({
        title: "Invalid session timeout",
        description: "Session timeout should be at least 15 minutes.",
        variant: "destructive",
      });
      return false;
    }
    if (payload.numbering.padDigits < 3 || payload.numbering.padDigits > 10) {
      toast({
        title: "Invalid padding",
        description: "Number padding should be between 3 and 10 digits.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put("/admin/settings", payload);
      toast({ title: "Settings saved", description: "All settings updated successfully." });
      setInitial(normalizeSettings({ data: payload }));
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Could not save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initial) return;
    hydrateForm(initial);
    setConfirmResetOpen(false);
    toast({ title: "Changes reset", description: "Reverted to last saved settings." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <SettingsIcon className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Settings</h1>
              {isDirty ? <Badge variant="outline">Unsaved</Badge> : <Badge variant="outline">Saved</Badge>}
              {loading ? <Badge variant="secondary">Loading…</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Configure company, numbering, security, and integrations for PCBxpress.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchSettings} disabled={loading || saving}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setConfirmResetOpen(true)}
            disabled={!isDirty || loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Company */}
        <Card className="border border-gray-200 lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-sm text-gray-700">Company</CardTitle>
            </div>
            <CardDescription className="text-xs">Used across login, invoices, certificates, and exports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="PCBxpress Pvt Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyTagline">Tagline</Label>
                <Input
                  id="companyTagline"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  placeholder="PCB Manufacturing ERP"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstin" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  GSTIN
                </Label>
                <Input
                  id="gstin"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://pcbxpress.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supportEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Support Email
                </Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@pcbxpress.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  Support Phone
                </Label>
                <Input
                  id="supportPhone"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+91 9XXXXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                Address
              </Label>
              <Input
                id="addressLine"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Industrial Area, Phase-2, Plot No..."
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kochi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="Kerala" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="6820xx" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
            </div>
          </CardContent>
        </Card>

        {/* Numbering */}
        <Card className="border border-gray-200 lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-sm text-gray-700">Document Numbering</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Standard prefixes for PCB workflows (RFQ → QUO → SO → WO → QC).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rfqPrefix">RFQ</Label>
                <Input id="rfqPrefix" value={rfqPrefix} onChange={(e) => setRfqPrefix(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotationPrefix">Quotation</Label>
                <Input
                  id="quotationPrefix"
                  value={quotationPrefix}
                  onChange={(e) => setQuotationPrefix(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesOrderPrefix">Sales Order</Label>
                <Input
                  id="salesOrderPrefix"
                  value={salesOrderPrefix}
                  onChange={(e) => setSalesOrderPrefix(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="workOrderPrefix">Work Order</Label>
                <Input
                  id="workOrderPrefix"
                  value={workOrderPrefix}
                  onChange={(e) => setWorkOrderPrefix(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice</Label>
                <Input
                  id="invoicePrefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="padDigits">Pad Digits</Label>
                <Input
                  id="padDigits"
                  type="number"
                  min={3}
                  max={10}
                  value={padDigits}
                  onChange={(e) => setPadDigits(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ncrPrefix">NCR</Label>
                <Input id="ncrPrefix" value={ncrPrefix} onChange={(e) => setNcrPrefix(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capaPrefix">CAPA</Label>
                <Input id="capaPrefix" value={capaPrefix} onChange={(e) => setCapaPrefix(e.target.value)} />
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900">Example</div>
              <p className="mt-1">
                RFQ-00012 → QUO-00012 → SO-00012 → WO-00012 → NCR-00003 → CAPA-00001
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border border-gray-200 lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-sm text-gray-700">Security</CardTitle>
            </div>
            <CardDescription className="text-xs">Recommended for ERP deployments in factories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">IP Whitelist</div>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Allow access only from approved IPs (office/factory network).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIpWhitelistEnabled((s) => !s)}
                  className={cx(
                    "inline-flex h-7 w-12 items-center rounded-full p-1 transition",
                    ipWhitelistEnabled ? "bg-[#dc2551]" : "bg-gray-300"
                  )}
                  aria-label="Toggle IP whitelist"
                >
                  <span
                    className={cx(
                      "h-5 w-5 rounded-full bg-white shadow transition",
                      ipWhitelistEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className={cx("mt-3 space-y-2", !ipWhitelistEnabled && "opacity-60")}>
                <Label htmlFor="ipWhitelist" className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-gray-400" />
                  Allowed IPs (comma or newline separated)
                </Label>
                <Input
                  id="ipWhitelist"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  disabled={!ipWhitelistEnabled}
                  placeholder="203.0.113.10, 203.0.113.11"
                />
                <p className="text-xs text-gray-500">
                  Tip: Add your factory static IP(s). Also consider VPN for remote engineers.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min={15}
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
              />
              <p className="text-xs text-gray-500">Recommended: 60–240 minutes depending on floor usage.</p>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900">PCB note</div>
              <p className="mt-1">
                If engineers upload Gerbers from outside the plant, whitelist a VPN gateway IP instead of public home IPs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="border border-gray-200 lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-sm text-gray-700">Integrations</CardTitle>
            </div>
            <CardDescription className="text-xs">Email and external hooks for notifications and syncing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Mail className="h-4 w-4 text-gray-500" />
                SMTP (Email)
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input id="smtpHost" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input id="smtpUser" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="no-reply@pcbxpress.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpFromEmail">From Email</Label>
                  <Input id="smtpFromEmail" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} placeholder="no-reply@pcbxpress.com" />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="smtpFromName">From Name</Label>
                  <Input id="smtpFromName" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="PCBxpress ERP" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL (optional)</Label>
              <Input
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhooks/pcbxpress"
              />
              <p className="text-xs text-gray-500">Use for notifications to Slack/Teams/ERP bridge services.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicBaseUrl">Public Base URL</Label>
              <Input
                id="publicBaseUrl"
                value={erpPublicBaseUrl}
                onChange={(e) => setErpPublicBaseUrl(e.target.value)}
                placeholder="https://erp.pcbxpress.com"
              />
              <p className="text-xs text-gray-500">Used for links in emails, certificates and external pages.</p>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900">PCB note</div>
              <p className="mt-1">
                Email is useful for NCR/CAPA alerts, shipment notifications, and customer quotation approvals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset confirm dialog */}
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all unsaved changes and restore the last saved settings.
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
