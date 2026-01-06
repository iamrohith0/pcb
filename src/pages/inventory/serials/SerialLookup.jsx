// src/pages/inventory/serials/SerialLookup.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Loader2,
  RefreshCw,
  Hash,
  PackageSearch,
  MapPin,
  BadgeCheck,
  BadgeX,
  ClipboardList,
  ExternalLink,
  History,
  ScanLine,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import serialsService from "@/services/inventory/serials.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeStr(v) {
  return v === null || v === undefined ? "" : String(v);
}

function statusPill(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("active") || s.includes("available") || s.includes("in_stock")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (s.includes("scrap") || s.includes("rejected") || s.includes("inactive")) {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }
  if (s.includes("issued") || s.includes("wip") || s.includes("in_process")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  return "bg-gray-100 text-gray-700 border border-gray-200";
}

function Field({ label, value, icon: Icon, mono }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-white p-3">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 text-gray-400" /> : null}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className={cx("truncate text-sm font-medium text-gray-900", mono ? "font-mono" : "")}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

export default function SerialLookup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSerial = searchParams.get("serial") || "";

  const [serial, setSerial] = useState(initialSerial);
  const [query, setQuery] = useState(initialSerial); // input field
  const [loading, setLoading] = useState(false);
  const [serialInfo, setSerialInfo] = useState(null);

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  const doLookup = async (value) => {
    const s = (value ?? query).trim();
    if (!s) return;

    setLoading(true);
    setSerialInfo(null);

    try {
      // Sync URL param
      const next = new URLSearchParams(searchParams);
      next.set("serial", s);
      setSearchParams(next, { replace: true });

      const res = await serialsService.getSerial(s);
      const payload = res?.data ?? res;

      setSerial(s);
      setSerialInfo(payload);

      toast({
        title: "Serial found",
        description: `Loaded details for ${s}`,
      });
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to lookup serial. Please try again.";

      setSerial(s);
      setSerialInfo(null);

      toast({
        title: status === 404 ? "Serial not found" : "Lookup failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuery("");
    setSerial("");
    setSerialInfo(null);
    setSearchParams({}, { replace: true });
  };

  // Auto-lookup if serial query param exists
  useEffect(() => {
    if (initialSerial) {
      setQuery(initialSerial);
      doLookup(initialSerial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = serialInfo?.status || serialInfo?.state || "—";
  const itemName = serialInfo?.itemName || serialInfo?.item?.name || "—";
  const itemCode = serialInfo?.itemCode || serialInfo?.item?.code || serialInfo?.sku || "—";
  const location = serialInfo?.locationName || serialInfo?.location || serialInfo?.warehouseLocation || "—";
  const lotNo = serialInfo?.lotNo || serialInfo?.lot?.lotNo || "—";
  const uom = serialInfo?.uom || serialInfo?.item?.uom || "—";
  const plant = serialInfo?.plant || serialInfo?.plantName || "—";
  const lastRefType = serialInfo?.lastRefType || serialInfo?.last_reference_type || "—";
  const lastRefNo = serialInfo?.lastRefNo || serialInfo?.last_reference_no || "—";
  const lastUpdated = serialInfo?.updatedAt || serialInfo?.lastUpdatedAt || serialInfo?.last_moved_at || "—";

  const historyLink = serial ? `/inventory/serials/history?serial=${encodeURIComponent(serial)}` : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Serial Lookup</h1>
            <p className="text-sm text-gray-500">
              Quick trace view for a serial number (stores → production → dispatch).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => doLookup()} disabled={loading || !canSearch}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Lookup
          </Button>

          <Button variant="outline" onClick={reset} disabled={loading && !serialInfo}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>

          <Button
            className="bg-cyan-600 hover:bg-cyan-500"
            onClick={() => doLookup()}
            disabled={loading || !canSearch}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
            Search Serial
          </Button>
        </div>
      </div>

      {/* Search box */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-500" />
            Enter Serial Number
          </CardTitle>
          <CardDescription>Example: SN-000123 / PCBX-SN-2026-001 / QR content</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-9">
            <Label>Serial</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type serial number and press Enter"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") doLookup(e.currentTarget.value);
              }}
              autoFocus
            />
          </div>
          <div className="md:col-span-3 flex items-end gap-2">
            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-500"
              onClick={() => doLookup()}
              disabled={loading || !canSearch}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Lookup
            </Button>
            <Button variant="outline" className="w-full" onClick={fetchAgain} disabled={loading || !serial}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex flex-wrap items-center gap-2">
                Result
                {serial ? (
                  <Badge className="bg-[#DC2551]/10 text-[#DC2551] hover:bg-[#DC2551]/10">{serial}</Badge>
                ) : null}
                {serialInfo ? (
                  <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusPill(status))}>
                    {safeStr(status) || "—"}
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription>
                {serialInfo ? "Serial details loaded successfully." : "No serial loaded yet. Search to view details."}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {historyLink ? (
                <Link to={historyLink}>
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!serialInfo ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm font-medium text-gray-900">No data</p>
                <p className="mt-1 text-sm text-gray-500">Lookup a serial number to view item, status, and location.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Field label="Item / Material" value={itemName} icon={PackageSearch} />
                  <Field label="Item Code / SKU" value={itemCode} icon={ClipboardList} mono />
                  <Field label="Current Location" value={location} icon={MapPin} />
                  <Field label="Plant" value={plant} icon={Building2} />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Field label="Lot No" value={lotNo} icon={Hash} mono />
                  <Field label="UOM" value={uom} icon={BadgeCheck} />
                  <Field label="Last Reference" value={`${safeStr(lastRefType)} • ${safeStr(lastRefNo)}`} icon={ExternalLink} />
                  <Field label="Last Updated" value={safeStr(lastUpdated)} icon={RefreshCw} />
                </div>

                {/* Raw JSON (optional) - useful for dev/testing */}
                <details className="mt-4 rounded-xl border bg-gray-50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-800">Raw payload (debug)</summary>
                  <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700">
{JSON.stringify(serialInfo, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  function fetchAgain() {
    if (!serial) return;
    doLookup(serial);
  }
}
