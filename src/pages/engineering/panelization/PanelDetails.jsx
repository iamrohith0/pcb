// src/pages/engineering/panelization/PanelDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  ClipboardCopy,
  FileDown,
  LayoutGrid,
  Loader2,
  Pencil,
  RefreshCw,
  SquareStack,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import panelizationService from "@/services/engineering/panelization.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmt(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(digits);
}

function areaMm2ToM2(mm2) {
  return mm2 / 1_000_000;
}

function panelAreaMm2(w, h) {
  return safeNum(w) * safeNum(h);
}

function boardAreaMm2(w, h) {
  return safeNum(w) * safeNum(h);
}

function computeGaps(totalW, totalH, cols, rows, boardW, boardH, railL, railR, railT, railB) {
  const innerW = safeNum(totalW) - safeNum(railL) - safeNum(railR);
  const innerH = safeNum(totalH) - safeNum(railT) - safeNum(railB);
  const c = Math.max(1, safeNum(cols, 1));
  const r = Math.max(1, safeNum(rows, 1));

  const gapX = (innerW - c * safeNum(boardW)) / Math.max(1, c - 1);
  const gapY = (innerH - r * safeNum(boardH)) / Math.max(1, r - 1);

  return { innerW, innerH, gapX, gapY };
}

/** Mock (used if backend not wired yet) */
function mockPanel(panelId, jobId) {
  return {
    id: panelId || "PNL-001",
    jobId: jobId || "JOB-10021",
    panelName: "PNL-ACME-CTRL-02-REVB",
    createdAt: new Date().toISOString(),
    createdBy: "System",

    panelSize: { wMm: 457, hMm: 610 },
    boardSize: { wMm: 120, hMm: 85 },
    rails: { leftMm: 10, rightMm: 10, topMm: 10, bottomMm: 10 },

    array: { rows: 4, cols: 3 },
    separation: { type: "V_SCORE", tabCount: 0, mouseBites: false },

    options: {
      toolingHoles: { enabled: true, count: 4, diaMm: 3.2 },
      fiducials: { enabled: true, count: 3 },
      coupons: { enabled: false, type: "IMPEDANCE", count: 1 },
    },

    notes:
      "Keep copper 0.5mm away from score lines. Add barcode on bottom rail. Confirm fiducial placement with SMT line.",
  };
}

export default function PanelDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { panelId } = useParams();
  const [searchParams] = useSearchParams();
  const jobIdFromQuery = searchParams.get("jobId") || "";

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [panel, setPanel] = useState(null);

  const fetchPanel = async () => {
    setLoading(true);
    try {
      // When backend is ready:
      // const res = await panelizationService.getPanel({ panelId });
      // setPanel(res.data);

      setPanel(mockPanel(panelId, jobIdFromQuery));
    } catch (e) {
      toast({ title: "Failed to load panel", description: "Could not fetch panel details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId]);

  const computed = useMemo(() => {
    if (!panel) return null;

    const w = panel?.panelSize?.wMm;
    const h = panel?.panelSize?.hMm;

    const bw = panel?.boardSize?.wMm;
    const bh = panel?.boardSize?.hMm;

    const rows = panel?.array?.rows ?? 1;
    const cols = panel?.array?.cols ?? 1;

    const rails = panel?.rails || {};
    const { innerW, innerH, gapX, gapY } = computeGaps(
      w,
      h,
      cols,
      rows,
      bw,
      bh,
      rails.leftMm,
      rails.rightMm,
      rails.topMm,
      rails.bottomMm
    );

    const total = panelAreaMm2(w, h);
    const bArea = boardAreaMm2(bw, bh);
    const units = Math.max(1, safeNum(rows, 1)) * Math.max(1, safeNum(cols, 1));
    const unitAreaTotal = units * bArea;
    const utilization = total > 0 ? (unitAreaTotal / total) * 100 : 0;

    const okFit =
      innerW > 0 &&
      innerH > 0 &&
      safeNum(bw) > 0 &&
      safeNum(bh) > 0 &&
      gapX >= 0 &&
      gapY >= 0;

    return {
      innerW,
      innerH,
      gapX,
      gapY,
      units,
      totalMm2: total,
      totalM2: areaMm2ToM2(total),
      unitAreaTotalMm2: unitAreaTotal,
      utilization,
      okFit,
    };
  }, [panel]);

  const warnings = useMemo(() => {
    if (!panel || !computed) return [];
    const w = [];

    if (computed.innerW <= 0 || computed.innerH <= 0) w.push("Rails exceed panel size (inner area is negative).");
    if (computed.gapX < 0 || computed.gapY < 0) w.push("Array does not fit within rails (negative gap).");
    if (panel?.separation?.type === "V_SCORE" && (panel?.boardSize?.wMm < 20 || panel?.boardSize?.hMm < 20)) {
      w.push("V-score on very small units can be risky; consider tab-route.");
    }
    if (panel?.options?.toolingHoles?.enabled && (panel?.options?.toolingHoles?.count ?? 0) < 2) {
      w.push("Tooling holes usually require at least 2 points (often 4).");
    }

    return w;
  }, [panel, computed]);

  const handleCopy = async () => {
    if (!panel || !computed) return;

    const rails = panel.rails || {};
    const text = [
      `Panel: ${panel.panelName} (${panel.id})`,
      `Job: ${panel.jobId}`,
      `Panel Size: ${panel.panelSize?.wMm} x ${panel.panelSize?.hMm} mm`,
      `Board Size: ${panel.boardSize?.wMm} x ${panel.boardSize?.hMm} mm`,
      `Rails (L/R/T/B): ${rails.leftMm}/${rails.rightMm}/${rails.topMm}/${rails.bottomMm} mm`,
      `Array: ${panel.array?.rows} rows x ${panel.array?.cols} cols = ${computed.units} up`,
      `Gap (X/Y): ${fmt(computed.gapX)} / ${fmt(computed.gapY)} mm`,
      `Separation: ${panel.separation?.type}` +
        (panel.separation?.type === "V_SCORE"
          ? ""
          : ` | Tabs: ${panel.separation?.tabCount ?? 0} | Mouse-bites: ${panel.separation?.mouseBites ? "Yes" : "No"}`),
      `Tooling Holes: ${
        panel.options?.toolingHoles?.enabled
          ? `Yes (${panel.options.toolingHoles.count} @ Ø${panel.options.toolingHoles.diaMm}mm)`
          : "No"
      }`,
      `Fiducials: ${panel.options?.fiducials?.enabled ? `Yes (${panel.options.fiducials.count})` : "No"}`,
      `Coupons: ${panel.options?.coupons?.enabled ? `Yes (${panel.options.coupons.type} x${panel.options.coupons.count})` : "No"}`,
      `Utilization: ${fmt(computed.utilization, 1)}%`,
      warnings.length ? `Warnings: ${warnings.join(" | ")}` : "Warnings: None",
      panel.notes ? `Notes: ${panel.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Panel summary copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy panel summary.", variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // When backend ready:
      // const res = await panelizationService.downloadPanelReport({ panelId });
      // window.open(res.data?.url, "_blank");

      // Mock: download JSON
      const blob = new Blob([JSON.stringify(panel, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${panel?.panelName || "panel"}-${panelId}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Downloaded", description: "Mock report exported as JSON." });
    } catch (e) {
      toast({ title: "Download failed", description: "Could not download report.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Panel Details</h1>
              <Badge variant="secondary" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Panelization
              </Badge>
              {panel?.jobId && <Badge variant="outline">Job: {panel.jobId}</Badge>}
              {panel?.id && <Badge variant="outline">ID: {panel.id}</Badge>}
            </div>
            <p className="mt-1 text-sm text-gray-600">Review panel setup, array fit, and manufacturing add-ons.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchPanel} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleCopy} disabled={loading || !panel}>
            <ClipboardCopy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={loading || downloading || !panel}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Download
          </Button>
          <Link to={`/engineering/panelization/${panelId}/edit`} className="inline-flex">
            <Button className="gap-2" disabled={loading || !panel}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading panel details...
          </div>
        </Card>
      )}

      {!loading && panel && computed && (
        <>
          {/* Title card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-500">Panel Name</p>
                  <p className="text-lg font-extrabold text-gray-900">{panel.panelName || "—"}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Created by <span className="font-semibold text-gray-900">{panel.createdBy || "—"}</span>{" "}
                    {panel.createdAt ? (
                      <span className="text-gray-500">• {new Date(panel.createdAt).toLocaleString()}</span>
                    ) : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={computed.okFit ? "bg-emerald-600 hover:bg-emerald-600" : "bg-amber-600 hover:bg-amber-600"}>
                    {computed.okFit ? (
                      <span className="inline-flex items-center gap-1.5">
                        <BadgeCheck className="h-4 w-4" />
                        Fit OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        Needs review
                      </span>
                    )}
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5">
                    <SquareStack className="h-3.5 w-3.5" />
                    {computed.units} up
                  </Badge>
                  <Badge variant="outline">Utilization: {fmt(computed.utilization, 1)}%</Badge>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* KPIs + core sizes */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <p className="text-sm font-semibold text-gray-900">Core Dimensions</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Panel Size</p>
                  <p className="font-semibold text-gray-900">
                    {panel.panelSize?.wMm} x {panel.panelSize?.hMm} mm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Board Size</p>
                  <p className="font-semibold text-gray-900">
                    {panel.boardSize?.wMm} x {panel.boardSize?.hMm} mm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Array</p>
                  <p className="font-semibold text-gray-900">
                    {panel.array?.rows} x {panel.array?.cols} ({computed.units} up)
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Inner Area</p>
                  <p className="font-semibold text-gray-900">
                    {fmt(computed.innerW)} x {fmt(computed.innerH)} mm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gap X / Y</p>
                  <p className="font-semibold text-gray-900">
                    {fmt(computed.gapX)} / {fmt(computed.gapY)} mm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Panel Area</p>
                  <p className="font-semibold text-gray-900">{fmt(computed.totalM2, 4)} m²</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Rails (mm)</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border bg-white p-2">
                    <p className="text-xs text-gray-500">Left</p>
                    <p className="font-bold">{panel.rails?.leftMm}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-2">
                    <p className="text-xs text-gray-500">Right</p>
                    <p className="font-bold">{panel.rails?.rightMm}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-2">
                    <p className="text-xs text-gray-500">Top</p>
                    <p className="font-bold">{panel.rails?.topMm}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-2">
                    <p className="text-xs text-gray-500">Bottom</p>
                    <p className="font-bold">{panel.rails?.bottomMm}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Manufacturing Options</p>

              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Separation</p>
                  <p className="font-semibold text-gray-900">{panel.separation?.type?.replace("_", " ") || "—"}</p>
                  {panel.separation?.type !== "V_SCORE" && (
                    <p className="mt-1 text-xs text-gray-600">
                      Tabs: <span className="font-semibold">{panel.separation?.tabCount ?? 0}</span> • Mouse-bites:{" "}
                      <span className="font-semibold">{panel.separation?.mouseBites ? "Yes" : "No"}</span>
                    </p>
                  )}
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Tooling holes</p>
                  <p className="font-semibold text-gray-900">
                    {panel.options?.toolingHoles?.enabled
                      ? `Yes • ${panel.options.toolingHoles.count} @ Ø${panel.options.toolingHoles.diaMm}mm`
                      : "No"}
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Fiducials</p>
                  <p className="font-semibold text-gray-900">
                    {panel.options?.fiducials?.enabled ? `Yes • ${panel.options.fiducials.count}` : "No"}
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Coupons</p>
                  <p className="font-semibold text-gray-900">
                    {panel.options?.coupons?.enabled
                      ? `Yes • ${panel.options.coupons.type} x${panel.options.coupons.count}`
                      : "No"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Notes + checks */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <p className="text-sm font-semibold text-gray-900">Notes</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                {panel.notes || "—"}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  to={`/engineering/dfm/review?jobId=${encodeURIComponent(panel.jobId)}&panelId=${encodeURIComponent(panel.id)}`}
                  className="inline-flex"
                >
                  <Button variant="outline">Go to DFM Review</Button>
                </Link>
                <Link
                  to={`/dashboard/production/work-orders/create?jobId=${encodeURIComponent(panel.jobId)}&panelId=${encodeURIComponent(panel.id)}`}
                  className="inline-flex"
                >
                  <Button>Create Work Order</Button>
                </Link>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Checks</p>
              <div className="mt-3 space-y-2">
                {warnings.length === 0 ? (
                  <div className="rounded-xl border bg-emerald-50 p-3 text-xs text-emerald-800">
                    <div className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4" />
                      <p>No warnings. Panel parameters look consistent.</p>
                    </div>
                  </div>
                ) : (
                  warnings.map((msg, idx) => (
                    <div key={idx} className="rounded-xl border bg-amber-50 p-3 text-xs text-amber-900">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <p>{msg}</p>
                      </div>
                    </div>
                  ))
                )}

                <div className="rounded-xl border bg-white p-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-900">Tip</p>
                  <p className="mt-1">
                    Confirm rail space for barcode + fiducials + tooling holes per your SMT/AOI line fixtures.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {!loading && !panel && (
        <Card className="p-6">
          <p className="text-sm text-gray-700">No panel found.</p>
        </Card>
      )}
    </div>
  );
}
