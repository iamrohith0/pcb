// src/pages/admin/settings/IPWhitelist.jsx
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { Info, Network, RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * IPWhitelist.jsx (PCBxpress - PCB Manufacturing ERP)
 *
 * Recommended backend endpoints:
 * - GET  /admin/security/ip-whitelist
 * - PUT  /admin/security/ip-whitelist
 *
 * Acceptable response shapes:
 * - { enabled: true, ips: ["1.1.1.1"] }
 * - { data: { enabled: true, ips: [...] } }
 * - { data: { security: { ipWhitelistEnabled: true, ipWhitelist: [...] } } }
 */
export default function IPWhitelist() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [rawIps, setRawIps] = useState("");
  const [initial, setInitial] = useState(null);

  const parseFromApi = (payload) => {
    const root = payload?.data ?? payload ?? {};

    // Try direct
    if (typeof root.enabled === "boolean" || Array.isArray(root.ips)) {
      return {
        enabled: Boolean(root.enabled ?? true),
        ips: Array.isArray(root.ips) ? root.ips : [],
      };
    }

    // Try nested security
    const sec = root.security ?? root.data?.security ?? {};
    const nestedEnabled = sec.ipWhitelistEnabled ?? sec.ip_whitelist_enabled;
    const nestedList = sec.ipWhitelist ?? sec.ip_whitelist;

    return {
      enabled: Boolean(nestedEnabled ?? true),
      ips: Array.isArray(nestedList) ? nestedList : [],
    };
  };

  const toText = (ips) => (Array.isArray(ips) ? ips.join("\n") : "");

  const normalizeIps = (text) =>
    text
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean)
      // remove duplicates
      .filter((v, i, a) => a.indexOf(v) === i);

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/security/ip-whitelist");
      const parsed = parseFromApi(res.data);
      const stateObj = { enabled: parsed.enabled, ips: parsed.ips };

      setInitial(stateObj);
      setEnabled(stateObj.enabled);
      setRawIps(toText(stateObj.ips));

      toast({ title: "Loaded", description: "IP whitelist settings loaded." });
    } catch (err) {
      toast({
        title: "Failed to load IP whitelist",
        description: err?.response?.data?.message || "Server error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payload = useMemo(() => {
    const ips = normalizeIps(rawIps);
    return { enabled: Boolean(enabled), ips };
  }, [enabled, rawIps]);

  const isDirty = useMemo(() => {
    if (!initial) return false;
    try {
      return JSON.stringify(initial) !== JSON.stringify(payload);
    } catch {
      return true;
    }
  }, [initial, payload]);

  const validate = () => {
    if (!payload.enabled) return true;

    // Minimal sanity check (do not block private CIDR ranges; ERP often uses them behind NAT)
    // Allow: IPv4 / IPv6 / CIDR / "x.x.x.x-y.y.y.y" is not supported here (keep simple).
    const bad = payload.ips.find((ip) => ip.length < 3);
    if (bad) {
      toast({ title: "Invalid entry", description: `Check IP entry: "${bad}"`, variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put("/admin/security/ip-whitelist", payload);
      setInitial(payload);
      toast({ title: "Saved", description: "IP whitelist updated successfully." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Could not update whitelist.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initial) return;
    setEnabled(initial.enabled);
    setRawIps(toText(initial.ips));
    toast({ title: "Reset", description: "Reverted to last saved whitelist." });
  };

  const handleClear = () => {
    setRawIps("");
    setConfirmClearOpen(false);
    toast({ title: "Cleared", description: "All IP entries cleared (not saved yet)." });
  };

  const stats = useMemo(() => {
    const ips = normalizeIps(rawIps);
    return { count: ips.length, list: ips };
  }, [rawIps]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <ShieldCheck className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">IP Whitelist</h1>
              <Badge variant="outline">{enabled ? "Enabled" : "Disabled"}</Badge>
              {isDirty ? <Badge variant="outline">Unsaved</Badge> : <Badge variant="outline">Saved</Badge>}
              {loading ? <Badge variant="secondary">Loading…</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Restrict ERP access to factory/office networks for PCBxpress.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchWhitelist} disabled={loading || saving}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={handleReset} disabled={!initial || !isDirty || saving || loading}>
            Reset
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-sm text-gray-700">Whitelist Configuration</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Add static IPs for office, factory gateway, or VPN egress. One per line or comma-separated.
              </CardDescription>
            </div>

            {/* Toggle */}
            <button
              type="button"
              onClick={() => setEnabled((s) => !s)}
              className={cx(
                "inline-flex h-7 w-12 items-center rounded-full p-1 transition",
                enabled ? "bg-[#dc2551]" : "bg-gray-300"
              )}
              aria-label="Toggle IP whitelist"
            >
              <span
                className={cx(
                  "h-5 w-5 rounded-full bg-white shadow transition",
                  enabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className={cx("space-y-2", !enabled && "opacity-60")}>
            <Label htmlFor="ips">Allowed IPs / CIDR</Label>
            <Input
              id="ips"
              value={rawIps}
              onChange={(e) => setRawIps(e.target.value)}
              disabled={!enabled}
              placeholder={`203.0.113.10\n203.0.113.11\n10.0.0.0/24`}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <Info className="h-4 w-4 text-gray-400" />
              <span>
                Entries: <span className="font-semibold text-gray-900">{stats.count}</span>
              </span>
              <span className="text-gray-400">•</span>
              <span>Duplicates are auto-removed on save.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-gray-300 p-3">
            <div className="text-xs text-gray-600">
              <div className="font-semibold text-gray-900">PCB note</div>
              <p className="mt-1">
                Best practice: whitelist your VPN gateway IP for remote engineers instead of individual home networks.
              </p>
            </div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setConfirmClearOpen(true)}
              disabled={!rawIps || saving || loading}
            >
              <Trash2 className="h-4 w-4" />
              Clear list
            </Button>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs font-semibold text-gray-900">Preview</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {stats.list.length === 0 ? (
                <span className="text-xs text-gray-500">No IPs added yet.</span>
              ) : (
                stats.list.slice(0, 20).map((ip) => (
                  <Badge key={ip} variant="outline" className="font-mono">
                    {ip}
                  </Badge>
                ))
              )}
              {stats.list.length > 20 ? (
                <Badge variant="secondary">+{stats.list.length - 20} more</Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear confirm */}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear IP list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all IP entries from the form. You can still cancel or reset after this.
              (Not saved until you click <span className="font-semibold">Save</span>.)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-red-600 hover:bg-red-700">
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
