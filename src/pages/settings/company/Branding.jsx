// src/pages/settings/company/Branding.jsx
import { useEffect, useMemo, useRef, useState } from "react";

import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Building2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Upload,
  XCircle,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

export default function Branding() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Current branding (server)
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#dc2551");
  const [accentColor, setAccentColor] = useState("#111827");

  const [logoUrl, setLogoUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState(""); // optional
  const [faviconUrl, setFaviconUrl] = useState("");

  // Uploads
  const logoInputRef = useRef(null);
  const logoDarkInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const [logoFile, setLogoFile] = useState(null);
  const [logoDarkFile, setLogoDarkFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [logoDarkPreview, setLogoDarkPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  const dirty = useMemo(() => {
    return (
      !!logoFile ||
      !!logoDarkFile ||
      !!faviconFile ||
      companyName.trim().length > 0 ||
      true
    );
  }, [logoFile, logoDarkFile, faviconFile, companyName]);

  const revokePreview = (url) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      revokePreview(logoPreview);
      revokePreview(logoDarkPreview);
      revokePreview(faviconPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildPreview = (file) => {
    if (!file) return "";
    return URL.createObjectURL(file);
  };

  const fetchBranding = async () => {
    setLoading(true);
    try {
      // Expected endpoint:
      // GET /settings/branding  -> { data: { company_name, tagline, primary_color, accent_color, logo_url, logo_dark_url, favicon_url } }
      // Also supports: GET /admin/settings or /settings/company etc. Adjust path if needed.
      const res = await api.get("/settings/branding");
      const data = res?.data?.data ?? res?.data ?? {};

      setCompanyName(safe(data.company_name, safe(data.companyName, "PCB Xpress")));
      setTagline(safe(data.tagline, safe(data.company_tagline, "PCB Manufacturing ERP")));
      setPrimaryColor(safe(data.primary_color, safe(data.primaryColor, "#dc2551")));
      setAccentColor(safe(data.accent_color, safe(data.accentColor, "#111827")));

      setLogoUrl(safe(data.logo_url, safe(data.logoUrl, "")));
      setLogoDarkUrl(safe(data.logo_dark_url, safe(data.logoDarkUrl, "")));
      setFaviconUrl(safe(data.favicon_url, safe(data.faviconUrl, "")));
    } catch (err) {
      console.warn("Branding fetch failed:", err);
      toast({
        title: "Failed to load branding",
        description: err?.response?.data?.message || "Using defaults for now.",
        variant: "destructive",
      });

      // Safe defaults for PCB manufacturing ERP
      setCompanyName((v) => v || "PCB Xpress");
      setTagline((v) => v || "PCB Manufacturing ERP");
      setPrimaryColor((v) => v || "#dc2551");
      setAccentColor((v) => v || "#111827");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickLogo = (file) => {
    setLogoFile(file || null);
    revokePreview(logoPreview);
    setLogoPreview(file ? buildPreview(file) : "");
  };

  const onPickLogoDark = (file) => {
    setLogoDarkFile(file || null);
    revokePreview(logoDarkPreview);
    setLogoDarkPreview(file ? buildPreview(file) : "");
  };

  const onPickFavicon = (file) => {
    setFaviconFile(file || null);
    revokePreview(faviconPreview);
    setFaviconPreview(file ? buildPreview(file) : "");
  };

  const clearLogo = () => {
    onPickLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const clearLogoDark = () => {
    onPickLogoDark(null);
    if (logoDarkInputRef.current) logoDarkInputRef.current.value = "";
  };

  const clearFavicon = () => {
    onPickFavicon(null);
    if (faviconInputRef.current) faviconInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Recommended: multipart/form-data so we can upload files.
      // POST /settings/branding (or PUT/PATCH)
      const fd = new FormData();
      fd.append("company_name", companyName.trim());
      fd.append("tagline", tagline.trim());
      fd.append("primary_color", primaryColor);
      fd.append("accent_color", accentColor);

      if (logoFile) fd.append("logo", logoFile);
      if (logoDarkFile) fd.append("logo_dark", logoDarkFile);
      if (faviconFile) fd.append("favicon", faviconFile);

      const res = await api.post("/settings/branding", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res?.data?.data ?? res?.data ?? {};
      // Update URLs if server returns them
      if (data.logo_url || data.logoUrl) setLogoUrl(data.logo_url || data.logoUrl);
      if (data.logo_dark_url || data.logoDarkUrl) setLogoDarkUrl(data.logo_dark_url || data.logoDarkUrl);
      if (data.favicon_url || data.faviconUrl) setFaviconUrl(data.favicon_url || data.faviconUrl);

      toast({
        title: "Branding saved",
        description: "Company identity updated successfully.",
      });

      // Clear picked files after successful save
      clearLogo();
      clearLogoDark();
      clearFavicon();
    } catch (err) {
      console.warn("Branding save failed:", err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const PreviewImage = ({ src, alt }) => {
    if (!src) {
      return (
        <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed bg-gray-50 text-gray-500">
          <div className="flex items-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4" />
            No image
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-xl border bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[72px] max-w-full object-contain"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading branding...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Branding</h1>
            <p className="text-sm text-gray-500">
              Configure company identity across login, reports, CoC, and customer documents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchBranding} disabled={saving}>
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

      {/* Company Identity */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <Label>Company Name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="PCB Xpress"
            />
            <p className="text-xs text-gray-500">
              Used across navbar title, login page, PDF exports, and certificates.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="PCB Manufacturing ERP"
            />
            <p className="text-xs text-gray-500">
              Optional short line under brand in login/exports.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#dc2551"
              />
              <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                Buttons / highlights
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-16 p-1"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#111827"
              />
              <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                Text / secondary
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Assets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Logo */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Logo (Light)</h2>
              <p className="text-xs text-gray-500">Used on white backgrounds.</p>
            </div>
            <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
              PNG/SVG
            </Badge>
          </div>

          <div className="mt-3 space-y-3">
            <PreviewImage src={logoPreview || logoUrl} alt="Company logo" />
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                type="button"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                type="button"
                onClick={clearLogo}
                disabled={!logoFile && !logoPreview}
              >
                <XCircle className="h-4 w-4" />
                Clear
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Recommended: transparent PNG/SVG, height ~48–72px.
            </p>
          </div>
        </Card>

        {/* Logo Dark */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Logo (Dark)</h2>
              <p className="text-xs text-gray-500">Used on dark/colored panels.</p>
            </div>
            <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
              Optional
            </Badge>
          </div>

          <div className="mt-3 space-y-3">
            <PreviewImage src={logoDarkPreview || logoDarkUrl} alt="Company logo dark" />
            <input
              ref={logoDarkInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickLogoDark(e.target.files?.[0] || null)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                type="button"
                onClick={() => logoDarkInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                type="button"
                onClick={clearLogoDark}
                disabled={!logoDarkFile && !logoDarkPreview}
              >
                <XCircle className="h-4 w-4" />
                Clear
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              If not provided, the light logo may be used everywhere.
            </p>
          </div>
        </Card>

        {/* Favicon */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Favicon</h2>
              <p className="text-xs text-gray-500">Browser tab / bookmarks.</p>
            </div>
            <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
              32×32+
            </Badge>
          </div>

          <div className="mt-3 space-y-3">
            <PreviewImage src={faviconPreview || faviconUrl} alt="Favicon" />
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFavicon(e.target.files?.[0] || null)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                type="button"
                onClick={() => faviconInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                type="button"
                onClick={clearFavicon}
                disabled={!faviconFile && !faviconPreview}
              >
                <XCircle className="h-4 w-4" />
                Clear
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              PNG recommended. Server can convert to ICO if needed.
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Preview */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Preview</p>
              <p className="text-xs text-gray-500">How your branding will look in UI highlights.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Primary</span>
            <span
              className="h-3 w-10 rounded-full border"
              style={{ backgroundColor: primaryColor }}
              aria-hidden="true"
            />
            <span className="text-xs text-gray-500">Accent</span>
            <span
              className="h-3 w-10 rounded-full border"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold" style={{ color: accentColor }}>
              {companyName || "PCB Xpress"}
            </p>
            <p className="truncate text-sm text-gray-500">{tagline || "PCB Manufacturing ERP"}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              style={{ backgroundColor: primaryColor }}
              className={cx("text-white hover:opacity-95")}
              onClick={() =>
                toast({
                  title: "Preview Action",
                  description: "Primary button preview clicked.",
                })
              }
            >
              Primary Action
            </Button>

            <Button type="button" variant="outline">
              Secondary
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
