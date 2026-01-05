// src/pages/engineering/revisions/RevisionCompare.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/components/ui/use-toast";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  FileDiff,
  FileText,
  GitCompare,
  Hash,
  Layers,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Shuffle,
  TriangleAlert,
} from "lucide-react";

/**
 * RevisionCompare.jsx
 * PCBxpress – Revision Comparison
 *
 * What this page does:
 * - Compare two revisions of a PCB job (A vs B)
 * - Show summary deltas (stackup, rules, drill, artwork, BOM, panels, routing)
 * - Display a structured "diff" table
 *
 * Routing:
 * - Recommended route: /engineering/revisions/compare
 * - Optional query params:
 *    ?job=PCBXP-ALPHA-12&from=R1&to=R2
 *
 * Backend integration:
 * Replace mock service with real API:
 *  - GET /engineering/revisions/compare?job=&from=&to=
 * Response example:
 *  {
 *    jobCode: "...",
 *    from: "R1",
 *    to: "R2",
 *    meta: { customer, projectName, updatedBy, updatedAt },
 *    summary: { changedFiles, ruleChanges, stackupChanges, drillChanges, bomChanges, panelChanges, routingChanges },
 *    diffs: [
 *      { area:"Stackup", field:"Dielectric", from:"FR4 TG150", to:"FR4 TG170", severity:"major", note:"Supply constraint" },
 *      ...
 *    ]
 *  }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const SEVERITY = {
  minor: { label: "Minor", className: "bg-gray-100 text-gray-800" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-900" },
  major: { label: "Major", className: "bg-rose-100 text-rose-900" },
  critical: { label: "Critical", className: "bg-red-100 text-red-900" },
};

function SeverityBadge({ sev }) {
  const s = SEVERITY[sev] || { label: sev || "—", className: "bg-gray-100 text-gray-800" };
  return <Badge className={cx("rounded-full px-2.5 py-0.5", s.className)}>{s.label}</Badge>;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "—";
  }
}

/** Mock API – replace with real service (axios/fetch) */
const revisionService = {
  async compare({ job, from, to }) {
    await new Promise((r) => setTimeout(r, 350));

    if (!job || !from || !to) {
      return {
        jobCode: job || "",
        from: from || "",
        to: to || "",
        meta: null,
        summary: null,
        diffs: [],
      };
    }

    return {
      jobCode: job,
      from,
      to,
      meta: {
        customer: "Aster Devices",
        projectName: "Outdoor Controller PCB",
        updatedBy: "CAM",
        updatedAt: "2026-01-03T12:20:00.000Z",
      },
      summary: {
        changedFiles: 6,
        stackupChanges: 1,
        ruleChanges: 2,
        drillChanges: 1,
        artworkChanges: 1,
        bomChanges: 0,
        panelChanges: 1,
        routingChanges: 1,
      },
      diffs: [
        {
          area: "Stackup",
          field: "Laminate (Core)",
          from: "FR4 TG150",
          to: "FR4 TG170",
          severity: "major",
          note: "Improves thermal margin; aligns with available stock.",
        },
        {
          area: "DFM Rules",
          field: "Solder mask expansion",
          from: "3 mil",
          to: "4 mil",
          severity: "medium",
          note: "Reduce bridging on fine pitch.",
        },
        {
          area: "DFM Rules",
          field: "Min annular ring",
          from: "4 mil",
          to: "5 mil",
          severity: "minor",
          note: "Improves drill tolerance.",
        },
        {
          area: "Drill",
          field: "Via drill size",
          from: "0.20 mm",
          to: "0.25 mm",
          severity: "medium",
          note: "Higher yield at plating step.",
        },
        {
          area: "Panelization",
          field: "Rails",
          from: "5 mm",
          to: "7 mm",
          severity: "minor",
          note: "Improved conveyor stability.",
        },
        {
          area: "Routing",
          field: "Route tool diameter",
          from: "2.0 mm",
          to: "2.4 mm",
          severity: "minor",
          note: "Spindle availability & tool life.",
        },
      ],
    };
  },
};

export default function RevisionCompare() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [jobCode, setJobCode] = useState(sp.get("job") || "");
  const [fromRev, setFromRev] = useState(sp.get("from") || "");
  const [toRev, setToRev] = useState(sp.get("to") || "");

  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);

  const canCompare = useMemo(() => {
    return jobCode.trim() && fromRev.trim() && toRev.trim() && fromRev.trim() !== toRev.trim();
  }, [jobCode, fromRev, toRev]);

  const summary = payload?.summary || null;
  const meta = payload?.meta || null;
  const diffs = payload?.diffs || [];

  const severityCounts = useMemo(() => {
    const base = { minor: 0, medium: 0, major: 0, critical: 0 };
    for (const d of diffs) {
      if (base[d.severity] !== undefined) base[d.severity] += 1;
    }
    return base;
  }, [diffs]);

  const runCompare = async (opts) => {
    const job = (opts?.job ?? jobCode).trim();
    const from = (opts?.from ?? fromRev).trim();
    const to = (opts?.to ?? toRev).trim();

    if (!job || !from || !to) {
      toast({ title: "Missing fields", description: "Enter Job Code, From revision and To revision.", variant: "destructive" });
      return;
    }
    if (from === to) {
      toast({ title: "Invalid selection", description: "From and To revisions must be different.", variant: "destructive" });
      return;
    }

    // Set query params for shareable URL
    setSp({ job, from, to }, { replace: true });

    setLoading(true);
    try {
      const res = await revisionService.compare({ job, from, to });
      setPayload(res);

      toast({
        title: "Comparison ready",
        description: `Compared ${job}: ${from} → ${to}`,
      });
    } catch (e) {
      toast({
        title: "Compare failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-compare if URL has parameters
    const job = sp.get("job");
    const from = sp.get("from");
    const to = sp.get("to");
    if (job && from && to) runCompare({ job, from, to });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swap = () => {
    setFromRev(toRev);
    setToRev(fromRev);
  };

  const copyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Shareable compare link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy the link.", variant: "destructive" });
    }
  };

  const goBack = () => navigate(-1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Revision Compare</h1>
          <p className="mt-1 text-sm text-gray-600">
            Compare two PCB job revisions across stackup, DFM rules, drill, artwork, panelization and routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" className="gap-2" onClick={copyLink} disabled={!payload}>
            <LinkIcon className="h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </div>

      {/* Compare inputs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompare className="h-4 w-4 text-gray-600" />
            Compare Inputs
          </CardTitle>
          <CardDescription>Provide Job Code and revisions you want to compare.</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label htmlFor="job">Job Code</Label>
              <div className="relative mt-2">
                <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="job"
                  value={jobCode}
                  onChange={(e) => setJobCode(e.target.value)}
                  placeholder="e.g., PCBXP-ALPHA-12"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="from">From (Revision)</Label>
              <Input
                id="from"
                value={fromRev}
                onChange={(e) => setFromRev(e.target.value)}
                placeholder="e.g., R1"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="to">To (Revision)</Label>
              <Input
                id="to"
                value={toRev}
                onChange={(e) => setToRev(e.target.value)}
                placeholder="e.g., R2"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2 flex items-end gap-2">
              <Button type="button" variant="outline" className="w-full gap-2" onClick={swap}>
                <Shuffle className="h-4 w-4" />
                Swap
              </Button>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => runCompare({ job: jobCode, from: fromRev, to: toRev })}
                disabled={!canCompare || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Compare
              </Button>

              <Button
                type="button"
                className="gap-2 bg-[#DC2551] hover:bg-[#B02045]"
                onClick={() => runCompare({ job: jobCode, from: fromRev, to: toRev })}
                disabled={!canCompare || loading}
              >
                <FileDiff className="h-4 w-4" />
                Run Diff
              </Button>
            </div>

            {!canCompare && (
              <div className="md:col-span-12 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <TriangleAlert className="h-4 w-4" />
                Enter Job Code, From and To revisions (From and To must be different).
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary / Meta */}
      {payload && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="shadow-sm lg:col-span-8">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-gray-600" />
                Change Summary
              </CardTitle>
              <CardDescription>
                {payload.jobCode} — {payload.from} → {payload.to}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {summary ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Kpi label="Changed Files" value={summary.changedFiles} icon={FileText} />
                  <Kpi label="Stackup" value={summary.stackupChanges} icon={Layers} />
                  <Kpi label="DFM Rules" value={summary.ruleChanges} icon={ShieldCheck} />
                  <Kpi label="Drill" value={summary.drillChanges} icon={FileText} />
                  <Kpi label="Artwork" value={summary.artworkChanges} icon={FileText} />
                  <Kpi label="BOM" value={summary.bomChanges} icon={FileText} />
                  <Kpi label="Panelization" value={summary.panelChanges} icon={FileText} />
                  <Kpi label="Routing" value={summary.routingChanges} icon={FileText} />
                </div>
              ) : (
                <div className="text-sm text-gray-600">No summary available.</div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <Badge className="rounded-full bg-gray-100 text-gray-800">Minor: {severityCounts.minor}</Badge>
                <Badge className="rounded-full bg-amber-100 text-amber-900">Medium: {severityCounts.medium}</Badge>
                <Badge className="rounded-full bg-rose-100 text-rose-900">Major: {severityCounts.major}</Badge>
                <Badge className="rounded-full bg-red-100 text-red-900">Critical: {severityCounts.critical}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm lg:col-span-4">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Context</CardTitle>
              <CardDescription>Who/when and what job this belongs to.</CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {meta ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Customer</div>
                    <div className="font-medium text-gray-900">{meta.customer}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Project</div>
                    <div className="font-medium text-gray-900">{meta.projectName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Updated By</div>
                      <div className="font-medium text-gray-900">{meta.updatedBy}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Updated At</div>
                      <div className="font-medium text-gray-900">{formatDate(meta.updatedAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    Diff is ready for ECO review & release checks.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No metadata.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diffs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileDiff className="h-4 w-4 text-gray-600" />
            Detailed Diffs
          </CardTitle>
          <CardDescription>Field-level changes between revisions.</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {!payload && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-600">
              Run a comparison to view diffs.
            </div>
          )}

          {payload && diffs.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-600">
              No diffs found for this comparison.
            </div>
          )}

          {payload && diffs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                    <th className="p-3">Area</th>
                    <th className="p-3">Field</th>
                    <th className="p-3">From</th>
                    <th className="p-3">To</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {diffs.map((d, idx) => (
                    <tr key={`${d.area}-${d.field}-${idx}`} className="border-b hover:bg-gray-50/70">
                      <td className="p-3 font-medium text-gray-900">{d.area}</td>
                      <td className="p-3 text-gray-900">{d.field}</td>
                      <td className="p-3">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs">{d.from || "—"}</code>
                      </td>
                      <td className="p-3">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs">{d.to || "—"}</code>
                      </td>
                      <td className="p-3">
                        <SeverityBadge sev={d.severity} />
                      </td>
                      <td className="p-3 text-gray-700">{d.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom actions */}
          {payload && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4" />
                Tip: lock releases to approved ECOs, and store compare snapshots for audit.
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <Link to={`/engineering/revisions/eco/new?job=${encodeURIComponent(payload.jobCode)}&from=${encodeURIComponent(payload.from)}&to=${encodeURIComponent(payload.to)}`}>
                    <FileText className="h-4 w-4" />
                    Create ECO from Diff
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  type="button"
                  className="gap-2 bg-[#DC2551] hover:bg-[#B02045]"
                  onClick={() => {
                    const text = JSON.stringify(payload, null, 2);
                    navigator.clipboard
                      .writeText(text)
                      .then(() => toast({ title: "Copied", description: "Diff JSON copied to clipboard." }))
                      .catch(() => toast({ title: "Copy failed", description: "Could not copy JSON.", variant: "destructive" }));
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy JSON
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{label}</div>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value ?? 0}</div>
    </div>
  );
}
