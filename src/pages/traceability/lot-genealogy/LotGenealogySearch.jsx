// src/pages/traceability/lot-genealogy/LotGenealogySearch.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Barcode,
  ChevronRight,
  Filter,
  GitBranch,
  Loader2,
  Search,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function safeText(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    released: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    wip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    hold: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    quarantined: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
    scrapped: "bg-red-50 text-red-700 ring-1 ring-red-200",
    closed: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>
      {status || "—"}
    </span>
  );
}

/**
 * LotGenealogySearch (PCBxpress)
 *
 * Purpose:
 * - Search end-to-end genealogy by Lot/Batch/Serial/WO/Shipment QR.
 * - Shows quick summary + upstream/downstream counts (if available),
 *   and link to a dedicated Genealogy Viewer page.
 *
 * Expected endpoints (adjust to your backend):
 * - GET /traceability/genealogy/search?q=<code>&include=summary
 *   -> { data: { id, type, code, status, product_name, revision, work_order_no, created_at,
 *                upstream_count, downstream_count, last_event_at } }
 *
 * Optional:
 * - GET /traceability/genealogy/:id   (viewer page)
 */

export default function LotGenealogySearch() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [result, setResult] = useState(null);

  // filters (optional; backend can ignore if not supported)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [scope, setScope] = useState("any"); // any | lot | batch | serial | wo | shipment
  const [includeQuality, setIncludeQuality] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeShipments, setIncludeShipments] = useState(true);

  const canSearch = query.trim().length > 0 && !isSearching;

  const filterParams = useMemo(
    () => ({
      scope,
      include_quality: includeQuality ? 1 : 0,
      include_materials: includeMaterials ? 1 : 0,
      include_shipments: includeShipments ? 1 : 0,
      include: "summary",
    }),
    [scope, includeQuality, includeMaterials, includeShipments]
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setResult(null);

    try {
      const res = await api.get("/traceability/genealogy/search", {
        params: { q, ...filterParams },
      });

      const data = res?.data?.data ?? res?.data;

      if (!data?.id) {
        throw new Error("No genealogy record found for this code.");
      }

      setResult(data);
      toast({
        title: "Genealogy found",
        description: `Loaded ${data.type || "record"}: ${data.code || q}`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Search failed",
        description: err?.response?.data?.message || err?.message || "Unable to find genealogy for this code.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const openViewer = () => {
    if (!result?.id) return;
    navigate(`/traceability/lot-genealogy/${result.id}`);
  };

  // nice: auto-clear result when query changes
  useEffect(() => {
    if (!query) setResult(null);
  }, [query]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lot Genealogy Search</h1>
              <p className="text-sm text-gray-600">
                Trace upstream materials and downstream usage for any lot / batch / serial in PCB manufacturing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Workflow className="h-3.5 w-3.5" />
              End-to-end traceability
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Audit & compliance ready
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setFiltersOpen((s) => !s)}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          <Link to="/traceability/batch/scan">
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
              <Barcode className="h-4 w-4" />
              Batch Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Lot No / Batch No / Serial / Work Order / Shipment code…"
                className="pl-9"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              disabled={!canSearch}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {filtersOpen && (
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Search filters</p>
                  <p className="text-xs text-gray-500">These help refine genealogy resolution (backend may ignore).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <label className="text-xs font-semibold text-gray-600">Scope</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { key: "any", label: "Any" },
                      { key: "lot", label: "Lot" },
                      { key: "batch", label: "Batch" },
                      { key: "serial", label: "Serial" },
                      { key: "wo", label: "Work Order" },
                      { key: "shipment", label: "Shipment" },
                    ].map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => setScope(o.key)}
                        className={cx(
                          "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                          scope === o.key ? "border-[#dc2551] bg-[#dc2551]/10 text-[#dc2551]" : "hover:bg-gray-50"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <label className="text-xs font-semibold text-gray-600">Include in genealogy</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIncludeMaterials((s) => !s)}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-xs font-semibold",
                        includeMaterials ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "hover:bg-gray-50"
                      )}
                    >
                      Materials
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludeQuality((s) => !s)}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-xs font-semibold",
                        includeQuality ? "border-blue-200 bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      )}
                    >
                      Quality
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludeShipments((s) => !s)}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-xs font-semibold",
                        includeShipments ? "border-purple-200 bg-purple-50 text-purple-700" : "hover:bg-gray-50"
                      )}
                    >
                      Shipments
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Example: disable Shipments to focus only on upstream material trace.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* Result */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Result</p>
          <p className="text-xs text-gray-500">View upstream/downstream links and events.</p>
        </div>

        <div className="p-4">
          {isSearching ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching genealogy…
            </div>
          ) : !result ? (
            <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
              Enter a lot/batch/serial/work-order/shipment code to see its genealogy.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {safeText(result.code)}{" "}
                        <span className="text-sm font-semibold text-gray-500">
                          ({safeText(result.type)})
                        </span>
                      </h3>
                      <StatusBadge status={result.status} />
                    </div>

                    <p className="text-sm text-gray-600">
                      {safeText(result.product_name || result.product?.name)}{" "}
                      {result.revision ? `(Rev ${result.revision})` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5" />
                        Upstream: {safeText(result.upstream_count ?? result.upstreamCount ?? 0)}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5 rotate-180" />
                        Downstream: {safeText(result.downstream_count ?? result.downstreamCount ?? 0)}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Workflow className="h-3.5 w-3.5" />
                        Last event: {fmtDate(result.last_event_at || result.lastEventAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <Badge variant="secondary">WO: {safeText(result.work_order_no || result.workOrder?.number)}</Badge>
                      <Badge variant="secondary">Created: {fmtDate(result.created_at || result.createdAt)}</Badge>
                      {scope !== "any" && <Badge variant="secondary">Scope: {scope}</Badge>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={openViewer}>
                      <ChevronRight className="h-4 w-4" />
                      Open Genealogy Viewer
                    </Button>

                    <Link
                      to={`/traceability/lot-genealogy/${result.id}`}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Open in route
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-emerald-50 p-3 text-xs text-emerald-800">
                <span className="font-semibold">Tip:</span> In the viewer, verify material lots (laminate/copper/prepreg),
                process steps, AOI/eTest results, and shipment links for full PCB compliance.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Card className="p-4 lg:col-span-6">
          <p className="text-sm font-semibold text-gray-900">Common searches</p>
          <p className="mt-1 text-xs text-gray-500">Examples of codes you can search.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">LOT-24-000812</Badge>
            <Badge variant="secondary">BATCH-01-REV2</Badge>
            <Badge variant="secondary">SER-00012988</Badge>
            <Badge variant="secondary">WO-2026-00127</Badge>
            <Badge variant="secondary">SHIP-INV-8891</Badge>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-6">
          <p className="text-sm font-semibold text-gray-900">Next steps</p>
          <div className="mt-2 space-y-2 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-500" />
              Use genealogy for recall, complaint investigation, and audit evidence.
            </div>
            <div className="flex items-start gap-2">
              <Workflow className="mt-0.5 h-4 w-4 text-gray-500" />
              Ensure every process step logs operator/machine/time and inspection outcome.
            </div>
            <div className="flex items-start gap-2">
              <Barcode className="mt-0.5 h-4 w-4 text-gray-500" />
              Enforce barcode scanning at material issue and dispatch for accurate linking.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
