// src/pages/engineering/panelization/PanelCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Copy,
  FileUp,
  Layers,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  Shuffle,
  SquareStack,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import panelizationService from "@/services/engineering/panelization.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
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

const MOCK_JOB = (jobId) => ({
  jobId: jobId || "JOB-NEW",
  customer: "Acme Electronics",
  partNumber: "ACME-CTRL-02",
  revision: "B",
  layerCount: 6,
  boardWmm: 120,
  boardHmm: 85,
  thicknessMm: 1.6,
  finish: "ENIG",
  toolingSide: "TOP",
});

export default function PanelCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const jobId = params.get("jobId") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Job snapshot
  const [job, setJob] = useState(null);

  // Panel inputs
  const [panelName, setPanelName] = useState("");
  const [panelW, setPanelW] = useState(457); // 18" ~ 457mm common
  const [panelH, setPanelH] = useState(610); // 24" ~ 610mm common
  const [boardW, setBoardW] = useState(120);
  const [boardH, setBoardH] = useState(85);

  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(3);

  // Rails & margins
  const [railL, setRailL] = useState(10);
  const [railR, setRailR] = useState(10);
  const [railT, setRailT] = useState(10);
  const [railB, setRailB] = useState(10);

  // Process add-ons
  const [addToolHoles, setAddToolHoles] = useState(true);
  const [toolHoleDia, setToolHoleDia] = useState(3.2);
  const [toolHoleCount, setToolHoleCount] = useState(4);

  const [addFiducials, setAddFiducials] = useState(true);
  const [fidCount, setFidCount] = useState(3);

  const [addCoupons, setAddCoupons] = useState(false);
  const [couponType, setCouponType] = useState("IMPEDANCE"); // IMPEDANCE|SOLDERABILITY|MICROSECTION
  const [couponCount, setCouponCount] = useState(1);

  // Separation / routing
  const [separation, setSeparation] = useState("V_SCORE"); // V_SCORE|TAB_ROUTE|FULL_ROUTE
  const [tabCount, setTabCount] = useState(6);
  const [mouseBites, setMouseBites] = useState(true);

  // Notes
  const [notes, setNotes] = useState("");

  // Simple “auto fit” helper
  const tryAutoFit = () => {
    const innerW = safeNum(panelW) - safeNum(railL) - safeNum(railR);
    const innerH = safeNum(panelH) - safeNum(railT) - safeNum(railB);

    const maxCols = Math.max(1, Math.floor(innerW / Math.max(1, safeNum(boardW))));
    const maxRows = Math.max(1, Math.floor(innerH / Math.max(1, safeNum(boardH))));

    setCols(clamp(maxCols, 1, 50));
    setRows(clamp(maxRows, 1, 50));

    toast({
      title: "Auto-fit applied",
      description: `Suggested: ${maxRows} rows x ${maxCols} cols (based on rails and board size).`,
    });
  };

  const shuffleCommonPanels = () => {
    // A few common panel sizes (mm)
    const options = [
      { w: 457, h: 610, name: "18x24" },
      { w: 508, h: 610, name: "20x24" },
      { w: 460, h: 620, name: "460x620" },
      { w: 510, h: 600, name: "510x600" },
    ];
    const pick = options[Math.floor(Math.random() * options.length)];
    setPanelW(pick.w);
    setPanelH(pick.h);
    toast({ title: "Panel size updated", description: `Selected ${pick.name} (${pick.w} x ${pick.h} mm).` });
  };

  const computed = useMemo(() => {
    const total = panelAreaMm2(panelW, panelH);
    const bArea = boardAreaMm2(boardW, boardH);

    const units = Math.max(1, safeNum(rows, 1)) * Math.max(1, safeNum(cols, 1));

    const { innerW, innerH, gapX, gapY } = computeGaps(
      panelW,
      panelH,
      cols,
      rows,
      boardW,
      boardH,
      railL,
      railR,
      railT,
      railB
    );

    const usedW = safeNum(boardW) * safeNum(cols) + Math.max(0, safeNum(cols) - 1) * Math.max(0, gapX);
    const usedH = safeNum(boardH) * safeNum(rows) + Math.max(0, safeNum(rows) - 1) * Math.max(0, gapY);

    const okFit =
      innerW > 0 &&
      innerH > 0 &&
      safeNum(boardW) > 0 &&
      safeNum(boardH) > 0 &&
      safeNum(cols) >= 1 &&
      safeNum(rows) >= 1 &&
      gapX >= 0 &&
      gapY >= 0 &&
      usedW <= innerW + 1e-6 &&
      usedH <= innerH + 1e-6;

    const unitAreaTotal = units * bArea;
    const utilization = total > 0 ? (unitAreaTotal / total) * 100 : 0;

    // crude “waste” approx = panel area - unit area (ignores rails/space complexity)
    const waste = Math.max(0, total - unitAreaTotal);

    return {
      totalMm2: total,
      totalM2: areaMm2ToM2(total),
      units,
      boardAreaMm2: bArea,
      unitAreaTotalMm2: unitAreaTotal,
      utilization,
      wasteMm2: waste,
      wasteM2: areaMm2ToM2(waste),
      innerW,
      innerH,
      gapX,
      gapY,
      okFit,
    };
  }, [panelW, panelH, boardW, boardH, rows, cols, railL, railR, railT, railB]);

  const warnings = useMemo(() => {
    const w = [];

    if (computed.innerW <= 0 || computed.innerH <= 0) {
      w.push("Rails exceed panel size (inner area is negative).");
    }
    if (safeNum(boardW) <= 0 || safeNum(boardH) <= 0) {
      w.push("Board dimensions must be > 0.");
    }
    if (computed.gapX < 0 || computed.gapY < 0) {
      w.push("Rows/Cols do not fit within the panel (negative gap). Reduce rows/cols or increase panel size.");
    }
    if (computed.utilization > 100) {
      w.push("Utilization exceeds 100% (check sizes/values).");
    }
    if (separation === "V_SCORE" && (safeNum(boardW) < 20 || safeNum(boardH) < 20)) {
      w.push("V-score on very small units can be risky; consider tab-route.");
    }
    if (addToolHoles && safeNum(toolHoleCount) < 2) {
      w.push("Tooling holes usually require at least 2 points (often 4).");
    }
    return w;
  }, [computed, separation, addToolHoles, toolHoleCount, boardW, boardH]);

  const fetchJobSnapshot = async () => {
    setLoading(true);
    try {
      // When backend ready:
      // const res = await panelizationService.getJobSnapshot({ jobId });
      // setJob(res.data);

      const mock = MOCK_JOB(jobId || "JOB-NEW");
      setJob(mock);

      setBoardW(mock.boardWmm);
      setBoardH(mock.boardHmm);
      setPanelName(`PNL-${mock.partNumber}-REV${mock.revision}`);
    } catch (e) {
      toast({
        title: "Failed to load job",
        description: "Could not fetch job snapshot.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleCopySummary = async () => {
    const text = [
      `Panel: ${panelName}`,
      `Job: ${job?.jobId || "—"} | ${job?.customer || "—"} | ${job?.partNumber || "—"} Rev ${job?.revision || "—"}`,
      `Panel Size: ${panelW} x ${panelH} mm`,
      `Rails (L/R/T/B): ${railL}/${railR}/${railT}/${railB} mm`,
      `Array: ${rows} rows x ${cols} cols = ${computed.units} up`,
      `Gap (X/Y): ${fmt(computed.gapX)} / ${fmt(computed.gapY)} mm`,
      `Separation: ${separation}${separation !== "V_SCORE" ? ` | Tabs: ${tabCount} | Mouse-bites: ${mouseBites ? "Yes" : "No"}` : ""}`,
      `Tooling Holes: ${addToolHoles ? `Yes (${toolHoleCount} @ Ø${toolHoleDia}mm)` : "No"}`,
      `Fiducials: ${addFiducials ? `Yes (${fidCount})` : "No"}`,
      `Coupons: ${addCoupons ? `Yes (${couponType} x${couponCount})` : "No"}`,
      `Utilization: ${fmt(computed.utilization, 1)}%`,
      warnings.length ? `Warnings: ${warnings.join(" | ")}` : "Warnings: None",
      notes ? `Notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Panel summary copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy summary.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        jobId: jobId || job?.jobId,
        panelName,
        panelSize: { wMm: safeNum(panelW), hMm: safeNum(panelH) },
        boardSize: { wMm: safeNum(boardW), hMm: safeNum(boardH) },
        rails: { leftMm: safeNum(railL), rightMm: safeNum(railR), topMm: safeNum(railT), bottomMm: safeNum(railB) },
        array: { rows: safeNum(rows, 1), cols: safeNum(cols, 1), gapXmm: computed.gapX, gapYmm: computed.gapY },
        separation: { type: separation, tabCount: separation === "V_SCORE" ? 0 : safeNum(tabCount), mouseBites: !!mouseBites },
        options: {
          toolingHoles: addToolHoles ? { enabled: true, count: safeNum(toolHoleCount), diaMm: safeNum(toolHoleDia) } : { enabled: false },
          fiducials: addFiducials ? { enabled: true, count: safeNum(fidCount) } : { enabled: false },
          coupons: addCoupons ? { enabled: true, type: couponType, count: safeNum(couponCount) } : { enabled: false },
        },
        utilizationPct: computed.utilization,
        notes,
      };

      // Backend later:
      // await panelizationService.createPanel({ payload });

      toast({ title: "Saved", description: "Panel created (mock). You can wire API later." });
      // Optional: navigate to details page when you have it
      // navigate(`/dashboard/engineering/panelization/${newId}`);
    } catch (e) {
      toast({ title: "Save failed", description: "Could not create panel.", variant: "destructive" });
    } finally {
      setSaving(false);
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
              <h1 className="text-xl font-bold text-gray-900">Create Panel</h1>
              <Badge variant="secondary" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Panelization
              </Badge>
              {jobId ? (
                <Badge variant="outline">Job: {jobId}</Badge>
              ) : (
                <Badge className="bg-amber-600 hover:bg-amber-600">No JobId</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Define array, rails, separation method and manufacturing add-ons for PCB fabrication panels.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchJobSnapshot} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={shuffleCommonPanels} disabled={loading}>
            <Shuffle className="h-4 w-4" />
            Random panel size
          </Button>
          <Button variant="outline" className="gap-2" onClick={tryAutoFit} disabled={loading}>
            <Calculator className="h-4 w-4" />
            Auto-fit
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={loading || saving || !panelName}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading job snapshot...
          </div>
        </Card>
      )}

      {!loading && (
        <>
          {/* Job Snapshot */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Job Snapshot</p>
                <Badge variant="secondary">{job?.jobId || "—"}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{job?.customer || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Part / Rev</p>
                  <p className="font-medium text-gray-900">
                    {job?.partNumber || "—"} / {job?.revision || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Layers</p>
                  <p className="font-medium text-gray-900">{job?.layerCount ?? "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Board Size</p>
                  <p className="font-medium text-gray-900">
                    {job?.boardWmm ?? "—"} x {job?.boardHmm ?? "—"} mm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thickness</p>
                  <p className="font-medium text-gray-900">{job?.thicknessMm ?? "—"} mm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Finish</p>
                  <p className="font-medium text-gray-900">{job?.finish || "—"}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={handleCopySummary}>
                  <Copy className="h-4 w-4" />
                  Copy summary
                </Button>

                <Link
                  to={`/dashboard/engineering/dfm/review?jobId=${encodeURIComponent(job?.jobId || jobId)}`}
                  className="text-xs font-semibold text-[#dc2551] hover:underline"
                >
                  Go to DFM Review →
                </Link>
              </div>
            </Card>

            {/* Quick KPI */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Panel KPIs</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">UP</p>
                  <p className="text-2xl font-extrabold text-gray-900">{computed.units}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Utilization</p>
                  <p className="text-2xl font-extrabold text-gray-900">{fmt(computed.utilization, 1)}%</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Panel Area</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(computed.totalM2, 4)} m²</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Waste (approx)</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(computed.wasteM2, 4)} m²</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  {computed.okFit ? (
                    <>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <p>
                        Array fits within rails. Gaps (X/Y):{" "}
                        <span className="font-semibold">
                          {fmt(computed.gapX)} / {fmt(computed.gapY)} mm
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                      <p>
                        Array does not fit. Reduce rows/cols or increase panel size / rails.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Main Panel Inputs */}
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Panel Definition</p>
                <Badge variant="secondary" className="gap-1.5">
                  <SquareStack className="h-3.5 w-3.5" />
                  Array + Rails
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="panelName">Panel Name</Label>
                  <Input
                    id="panelName"
                    value={panelName}
                    onChange={(e) => setPanelName(e.target.value)}
                    placeholder="PNL-<PART>-REV<REV>"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Separation Method</Label>
                  <div className="flex flex-wrap gap-2">
                    {["V_SCORE", "TAB_ROUTE", "FULL_ROUTE"].map((t) => (
                      <Button
                        key={t}
                        variant={separation === t ? "default" : "outline"}
                        className="h-9"
                        onClick={() => setSeparation(t)}
                      >
                        {t.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Panel Size (mm)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input type="number" value={panelW} onChange={(e) => setPanelW(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Width</p>
                    </div>
                    <div>
                      <Input type="number" value={panelH} onChange={(e) => setPanelH(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Height</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Board Size (mm)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input type="number" value={boardW} onChange={(e) => setBoardW(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Width</p>
                    </div>
                    <div>
                      <Input type="number" value={boardH} onChange={(e) => setBoardH(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Height</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Array (Rows x Cols)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input type="number" value={rows} onChange={(e) => setRows(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Rows</p>
                    </div>
                    <div>
                      <Input type="number" value={cols} onChange={(e) => setCols(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Cols</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rails (mm)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input type="number" value={railL} onChange={(e) => setRailL(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Left</p>
                    </div>
                    <div>
                      <Input type="number" value={railR} onChange={(e) => setRailR(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Right</p>
                    </div>
                    <div>
                      <Input type="number" value={railT} onChange={(e) => setRailT(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Top</p>
                    </div>
                    <div>
                      <Input type="number" value={railB} onChange={(e) => setRailB(e.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">Bottom</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gap preview */}
              <div className="mt-5 rounded-xl border bg-gray-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-600" />
                    <p className="text-sm font-semibold text-gray-900">Computed Gaps</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">Inner W: {fmt(computed.innerW)} mm</Badge>
                    <Badge variant="secondary">Inner H: {fmt(computed.innerH)} mm</Badge>
                    <Badge className={computed.gapX >= 0 ? "bg-emerald-600 hover:bg-emerald-600" : "bg-red-600 hover:bg-red-600"}>
                      Gap X: {fmt(computed.gapX)} mm
                    </Badge>
                    <Badge className={computed.gapY >= 0 ? "bg-emerald-600 hover:bg-emerald-600" : "bg-red-600 hover:bg-red-600"}>
                      Gap Y: {fmt(computed.gapY)} mm
                    </Badge>
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-600">
                  Gaps are auto-computed assuming equal spacing between units within the inner area (panel minus rails).
                </p>
              </div>

              {/* Separation options */}
              <div className="mt-5 rounded-xl border bg-white p-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-semibold text-gray-900">Separation Options</p>
                </div>

                {separation === "V_SCORE" ? (
                  <p className="mt-2 text-sm text-gray-600">
                    V-score requires straight lines across the panel and adequate copper keep-out near score lines.
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tab Count (approx)</Label>
                      <Input type="number" value={tabCount} onChange={(e) => setTabCount(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mouse-bites</p>
                        <p className="text-xs text-gray-500">Perforations for easy depanel</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMouseBites((v) => !v)}
                        className={cx(
                          "inline-flex h-8 w-14 items-center rounded-full border transition",
                          mouseBites ? "bg-emerald-600 border-emerald-600" : "bg-gray-200 border-gray-300"
                        )}
                        aria-label="Toggle mouse-bites"
                      >
                        <span
                          className={cx(
                            "h-7 w-7 rounded-full bg-white shadow transition-transform",
                            mouseBites ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Add-ons */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Manufacturing Add-ons</p>
              <p className="mt-1 text-sm text-gray-600">
                Rails features used for SMT, tooling, AOI, impedance coupons, and traceability.
              </p>

              <div className="mt-4 space-y-4">
                {/* Tooling holes */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Tooling holes</p>
                    <button
                      type="button"
                      onClick={() => setAddToolHoles((v) => !v)}
                      className={cx(
                        "inline-flex h-8 w-14 items-center rounded-full border transition",
                        addToolHoles ? "bg-emerald-600 border-emerald-600" : "bg-gray-200 border-gray-300"
                      )}
                      aria-label="Toggle tooling holes"
                    >
                      <span
                        className={cx(
                          "h-7 w-7 rounded-full bg-white shadow transition-transform",
                          addToolHoles ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {addToolHoles && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Count</Label>
                        <Input type="number" value={toolHoleCount} onChange={(e) => setToolHoleCount(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Dia (mm)</Label>
                        <Input type="number" value={toolHoleDia} onChange={(e) => setToolHoleDia(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fiducials */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Fiducials</p>
                    <button
                      type="button"
                      onClick={() => setAddFiducials((v) => !v)}
                      className={cx(
                        "inline-flex h-8 w-14 items-center rounded-full border transition",
                        addFiducials ? "bg-emerald-600 border-emerald-600" : "bg-gray-200 border-gray-300"
                      )}
                      aria-label="Toggle fiducials"
                    >
                      <span
                        className={cx(
                          "h-7 w-7 rounded-full bg-white shadow transition-transform",
                          addFiducials ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {addFiducials && (
                    <div className="mt-3 space-y-1">
                      <Label>Count</Label>
                      <Input type="number" value={fidCount} onChange={(e) => setFidCount(e.target.value)} />
                    </div>
                  )}
                </div>

                {/* Coupons */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Coupons</p>
                    <button
                      type="button"
                      onClick={() => setAddCoupons((v) => !v)}
                      className={cx(
                        "inline-flex h-8 w-14 items-center rounded-full border transition",
                        addCoupons ? "bg-emerald-600 border-emerald-600" : "bg-gray-200 border-gray-300"
                      )}
                      aria-label="Toggle coupons"
                    >
                      <span
                        className={cx(
                          "h-7 w-7 rounded-full bg-white shadow transition-transform",
                          addCoupons ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {addCoupons && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {["IMPEDANCE", "SOLDERABILITY", "MICROSECTION"].map((t) => (
                          <Button
                            key={t}
                            variant={couponType === t ? "default" : "outline"}
                            className="h-9"
                            onClick={() => setCouponType(t)}
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <Label>Count</Label>
                        <Input type="number" value={couponCount} onChange={(e) => setCouponCount(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Notes + Warnings */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-900">Notes</p>
              </div>
              <Textarea
                className="mt-3 min-h-[130px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add special instructions: score keep-out, copper thieving, break-away tabs, fiducial placement, coupon requirements..."
              />
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Checks</p>
              <div className="mt-3 space-y-2">
                {warnings.length === 0 ? (
                  <div className="rounded-xl border bg-emerald-50 p-3 text-xs text-emerald-800">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
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
                    For SMT lines, ensure rails have space for fiducials + tooling holes + barcode/label area.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom action */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <LayoutGrid className="h-4 w-4 text-gray-600" />
              <span className="font-semibold">Result:</span>
              <span>
                {rows} x {cols} = <span className="font-semibold">{computed.units} up</span> | Utilization{" "}
                <span className="font-semibold">{fmt(computed.utilization, 1)}%</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleCopySummary} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button onClick={handleSave} disabled={saving || !panelName} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Panel
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
