// src/pages/settings/integrations/EmailSMTP.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Server,
  Lock,
  ShieldCheck,
  Save,
  RefreshCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Send,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import smtpApi from "@/services/smtp.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Badge({ variant = "neutral", children }) {
  const styles = {
    neutral: "bg-gray-100 text-gray-700 ring-gray-200",
    good: "bg-green-50 text-green-700 ring-green-200",
    bad: "bg-red-50 text-red-700 ring-red-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    brand: "bg-[#dc2551]/10 text-[#dc2551] ring-[#dc2551]/20",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", styles[variant])}>
      {children}
    </span>
  );
}

function FieldHint({ children }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

export default function EmailSMTP() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [showPass, setShowPass] = useState(false);

  // Form (safe defaults)
  const [form, setForm] = useState({
    enabled: false,
    host: "",
    port: 587,
    username: "",
    password: "",
    encryption: "tls", // none | tls | ssl
    from_name: "PCB Xpress",
    from_email: "",
    reply_to: "",
    timeout: 30,
  });

  // Test email
  const [testEmail, setTestEmail] = useState("");

  const hasBasics = useMemo(() => {
    if (!form.enabled) return true;
    return Boolean(form.host && form.port && form.username && form.from_email);
  }, [form]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await smtpApi.get();
      const data = res?.data || {};

      // Support different shapes from backend:
      // - { smtp: {...} }
      // - { ...smtpFields }
      const smtp = data.smtp ?? data;

      setForm((prev) => ({
        ...prev,
        enabled: Boolean(smtp.enabled ?? prev.enabled),
        host: smtp.host ?? prev.host,
        port: Number(smtp.port ?? prev.port),
        username: smtp.username ?? prev.username,
        // password is typically not returned; keep empty
        password: "",
        encryption: smtp.encryption ?? prev.encryption,
        from_name: smtp.from_name ?? prev.from_name,
        from_email: smtp.from_email ?? prev.from_email,
        reply_to: smtp.reply_to ?? prev.reply_to,
        timeout: Number(smtp.timeout ?? prev.timeout),
      }));
    } catch (err) {
      toast({
        title: "Failed to load SMTP settings",
        description: err?.response?.data?.message || "Please try again.",
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

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onSave = async () => {
    if (!hasBasics) {
      toast({
        title: "Missing required fields",
        description: "Host, Port, Username, and From Email are required when SMTP is enabled.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Do not send empty password unless user provided it
      const payload = {
        ...form,
        port: Number(form.port),
        timeout: Number(form.timeout),
      };

      if (!payload.password) delete payload.password;

      await smtpApi.update(payload);

      toast({
        title: "SMTP Saved",
        description: form.enabled ? "SMTP is enabled and saved successfully." : "SMTP is disabled and saved successfully.",
      });

      // Optional: reload to get sanitized values
      await load();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please check values and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    if (!form.enabled) {
      toast({
        title: "SMTP is disabled",
        description: "Enable SMTP first to send a test email.",
        variant: "destructive",
      });
      return;
    }

    if (!testEmail || !testEmail.includes("@")) {
      toast({
        title: "Invalid test email",
        description: "Enter a valid recipient email for the test.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      await smtpApi.test({ to: testEmail });
      toast({
        title: "Test email sent",
        description: `Sent a test email to ${testEmail}.`,
      });
    } catch (err) {
      toast({
        title: "SMTP test failed",
        description: err?.response?.data?.message || "Could not send test email. Verify credentials and firewall.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Email SMTP</h1>
            <Badge variant="brand">
              <Mail className="mr-1.5 h-4 w-4" />
              Integrations
            </Badge>
            {form.enabled ? (
              <Badge variant="good">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="warn">
                <AlertTriangle className="mr-1.5 h-4 w-4" />
                Disabled
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Configure outbound email for notifications: RFQ updates, order confirmations, NCR/CAPA alerts, and dispatch docs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
            onClick={onSave}
            disabled={loading || saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Config */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">SMTP Configuration</div>
              <div className="mt-1 text-xs text-gray-500">Use TLS (587) for most providers. Use SSL (465) when required.</div>
            </div>

            {/* Enabled toggle */}
            <button
              type="button"
              onClick={() => update("enabled", !form.enabled)}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                form.enabled
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}
              aria-label="Toggle SMTP"
            >
              <ShieldCheck className="h-4 w-4" />
              {form.enabled ? "SMTP Enabled" : "SMTP Disabled"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="host">
                <span className="inline-flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-500" />
                  SMTP Host <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input
                id="host"
                value={form.host}
                onChange={(e) => update("host", e.target.value)}
                placeholder="smtp.gmail.com"
                disabled={loading}
              />
              <FieldHint>Example: smtp.gmail.com, smtp.office365.com, smtp.sendgrid.net</FieldHint>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="port">
                  Port <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={form.port}
                  onChange={(e) => update("port", Number(e.target.value || 0))}
                  placeholder="587"
                  disabled={loading}
                  min={1}
                  max={65535}
                />
                <FieldHint>Common: 587 (TLS), 465 (SSL)</FieldHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encryption">Encryption</Label>
                <select
                  id="encryption"
                  value={form.encryption}
                  onChange={(e) => update("encryption", e.target.value)}
                  disabled={loading}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
                <FieldHint>Match your provider requirements</FieldHint>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="user@company.com"
                disabled={loading}
              />
              <FieldHint>Usually the same as your From Email for Gmail/Office365.</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password / App Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••••"
                  disabled={loading}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldHint>
                For Gmail, use an <span className="font-semibold">App Password</span> (not your normal password).
                Leave blank if you don’t want to change the saved password.
              </FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={form.from_name}
                onChange={(e) => update("from_name", e.target.value)}
                placeholder="PCB Xpress"
                disabled={loading}
              />
              <FieldHint>Shown as sender name in customer emails.</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_email">
                From Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="from_email"
                value={form.from_email}
                onChange={(e) => update("from_email", e.target.value)}
                placeholder="noreply@pcbxpress.com"
                disabled={loading}
              />
              <FieldHint>Must be allowed by your SMTP provider.</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply_to">Reply-To (Optional)</Label>
              <Input
                id="reply_to"
                value={form.reply_to}
                onChange={(e) => update("reply_to", e.target.value)}
                placeholder="sales@pcbxpress.com"
                disabled={loading}
              />
              <FieldHint>Customer replies go here (recommended: Sales/Support).</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={form.timeout}
                onChange={(e) => update("timeout", Number(e.target.value || 0))}
                placeholder="30"
                disabled={loading}
                min={5}
                max={120}
              />
              <FieldHint>Increase if network is slow; keep &lt; 60 usually.</FieldHint>
            </div>
          </div>

          {/* Warning if enabled but missing required */}
          {form.enabled && !hasBasics ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-semibold">Complete required fields</div>
                  <div className="text-xs text-amber-900/80">
                    Host, Port, Username, and From Email are required when SMTP is enabled.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Right: Test & Usage */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Send Test Email</div>
                <div className="mt-1 text-xs text-gray-500">Verify credentials and connectivity.</div>
              </div>
              <Badge variant={form.enabled ? "good" : "warn"}>{form.enabled ? "Ready" : "Disabled"}</Badge>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="test_to">Recipient Email</Label>
              <Input
                id="test_to"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={loading}
              />
              <FieldHint>We’ll send a short SMTP test message to this address.</FieldHint>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button
                className="w-full gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                onClick={onTest}
                disabled={loading || testing}
              >
                <Send className="h-4 w-4" />
                {testing ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-gray-900">Where SMTP is used</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                RFQ / Quotation status updates to customers
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                Work Order notifications & internal alerts
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                NCR / CAPA escalation emails
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                Dispatch documents & shipment tracking emails
              </li>
            </ul>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-700">Security tip</div>
              Use app-passwords, restrict outbound SMTP by IP, and store secrets encrypted on the server.
            </div>
          </Card>
        </div>
      </div>

      {/* Small footer note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-xs text-gray-500"
      >
        Note: Password is never shown back for security. Enter a value only when you want to update it.
      </motion.div>
    </div>
  );
}
