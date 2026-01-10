// src/pages/engineering/dfm/DFMChecklist.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    Download,
    FilePlus2,
    Filter,
    Loader2,
    Save,
    Search,
    Settings,
    ShieldCheck,
    Upload,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import dfmApi from "@/services/engineering/dfm.service";
import GerberUpload from "@/components/engineering/GerberUpload";
import CapabilityRulesConfig from "@/components/engineering/CapabilityRulesConfig";
import { dfmAnalyzer } from "@/lib/gerberParser";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const SEVERITY = {
  pass: { label: "PASS", className: "bg-emerald-100 text-emerald-800" },
  warn: { label: "WARN", className: "bg-amber-100 text-amber-800" },
  fail: { label: "FAIL", className: "bg-rose-100 text-rose-800" },
  na: { label: "N/A", className: "bg-gray-100 text-gray-700" },
};

const DEFAULT_CATEGORIES = [
  { key: "stackup", name: "Stackup & Materials" },
  { key: "drill", name: "Drill / Vias" },
  { key: "copper", name: "Copper / Etch" },
  { key: "soldermask", name: "Soldermask / Legend" },
  { key: "outline", name: "Board Outline / Panelization" },
  { key: "impedance", name: "Impedance / Controlled Lines" },
  { key: "fab", name: "Fabrication Notes" },
  { key: "test", name: "Test / Quality" },
];

const BASE_CHECKS = [
  // Stackup & Materials
  {
    id: "stk-1",
    category: "stackup",
    title: "Finished thickness specified",
    desc: "Finished board thickness and tolerance present (e.g., 1.6mm ±10%).",
    recommended: "Provide finished thickness + tolerance.",
  },
  {
    id: "stk-2",
    category: "stackup",
    title: "Copper weight specified",
    desc: "Outer/inner copper weight defined (e.g., 1oz/0.5oz).",
    recommended: "Specify copper weights per layer.",
  },
  {
    id: "stk-3",
    category: "stackup",
    title: "Material & Tg specified",
    desc: "FR4 grade, Tg, and any special material constraints listed.",
    recommended: "Specify laminate system (e.g., FR4 Tg150, low-loss).",
  },

  // Drill / Vias
  {
    id: "dr-1",
    category: "drill",
    title: "Drill file present and readable",
    desc: "Excellon/NC drill exists and units/format are known.",
    recommended: "Include drill file with units + tool list.",
  },
  {
    id: "dr-2",
    category: "drill",
    title: "PTH/NPTH clearly separated",
    desc: "Plated and non-plated holes are clearly distinguished.",
    recommended: "Separate PTH and NPTH drills or mark in notes.",
  },
  {
    id: "dr-3",
    category: "drill",
    title: "Via-in-pad / plugged vias called out",
    desc: "VIPPO / epoxy fill / cap requirements are specified if needed.",
    recommended: "Call out VIPPO needs (fill + cap + planarize).",
  },

  // Copper / Etch
  {
    id: "cu-1",
    category: "copper",
    title: "Minimum track/space manufacturable",
    desc: "Min trace/space meets your shop capability (or is flagged).",
    recommended: "Confirm min trace/space vs capability table.",
  },
  {
    id: "cu-2",
    category: "copper",
    title: "Copper-to-edge clearance",
    desc: "Copper keeps safe clearance from board outline and slots.",
    recommended: "Keep copper ≥0.25mm from edge (or shop rule).",
  },

  // Soldermask / Legend
  {
    id: "sm-1",
    category: "soldermask",
    title: "Soldermask expansion defined",
    desc: "Mask opening rules present or defaults acceptable.",
    recommended: "Specify mask expansion or accept standard.",
  },
  {
    id: "sm-2",
    category: "soldermask",
    title: "Legend/silkscreen clearance OK",
    desc: "Silkscreen does not overlap pads or mask openings.",
    recommended: "Maintain legend clearance to pads.",
  },

  // Outline / Panelization
  {
    id: "ol-1",
    category: "outline",
    title: "Board outline layer clear",
    desc: "Outline is single continuous profile, no duplicates.",
    recommended: "Provide outline in mechanical layer.",
  },
  {
    id: "ol-2",
    category: "outline",
    title: "Slots / cutouts defined",
    desc: "Milled slots/cutouts are present and dimensioned.",
    recommended: "Provide slots on mech layer + notes.",
  },
  {
    id: "ol-3",
    category: "outline",
    title: "Panelization instructions",
    desc: "Panel requirement, rails, fiducials, breakaways defined if needed.",
    recommended: "Provide panel drawing or accept shop panelization.",
  },

  // Impedance
  {
    id: "imp-1",
    category: "impedance",
    title: "Controlled impedance lines identified",
    desc: "Impedance nets and target values stated (e.g., 50Ω, 90Ω diff).",
    recommended: "Identify nets + targets + stackup reference.",
  },
  {
    id: "imp-2",
    category: "impedance",
    title: "Stackup supports impedance",
    desc: "Dielectric thicknesses and copper allow target impedances.",
    recommended: "Provide stackup or approve fab-proposed stackup.",
  },

  // Fab notes
  {
    id: "fab-1",
    category: "fab",
    title: "Surface finish specified",
    desc: "HASL, ENIG, OSP, etc. specified.",
    recommended: "Specify finish + any RoHS requirement.",
  },
  {
    id: "fab-2",
    category: "fab",
    title: "Soldermask color / legend color",
    desc: "Mask and legend colors specified (or default).",
    recommended: "Specify mask/legend color or accept standard.",
  },
  {
    id: "fab-3",
    category: "fab",
    title: "Special instructions included",
    desc: "Any chamfer, countersink, peelable mask, etc. called out.",
    recommended: "List special fab instructions explicitly.",
  },

  // Test / Quality
  {
    id: "tst-1",
    category: "test",
    title: "E-test requirement specified",
    desc: "Electrical test requirement is specified for the job.",
    recommended: "Specify 100% e-test / sample e-test.",
  },
  {
    id: "tst-2",
    category: "test",
    title: "Netlist provided (optional)",
    desc: "IPC-D-356 netlist provided (if you require).",
    recommended: "Provide IPC-356 netlist for stronger QA.",
  },
];

function createInitialRows(checks) {
  return checks.map((c) => ({
    ...c,
    status: "na", // pass | warn | fail | na
    comment: "",
  }));
}

export default function DFMChecklist() {
  const { toast } = useToast();

  // Header fields (traceability)
  const [rfqNo, setRfqNo] = useState("");
  const [salesOrderNo, setSalesOrderNo] = useState("");
  const [camNo, setCamNo] = useState("");
  const [boardName, setBoardName] = useState("");
  const [revision, setRevision] = useState("A");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // UI
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyIssues, setOnlyIssues] = useState(false);

  // DFM rows
  const [rows, setRows] = useState(() => createInitialRows(BASE_CHECKS));

  // Gerber analysis state
  const [gerberAnalysis, setGerberAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Capability rules state
  const [capabilityRules, setCapabilityRules] = useState({
    minTraceWidth: 0.1,
    minSpace: 0.1,
    minAnnularRing: 0.15,
    maxDrillAspectRatio: 10,
    minDrillSize: 0.2,
    maxBoardSize: { width: 600, height: 600 },
    minBoardSize: { width: 10, height: 10 },
  });

  // optional: load existing from backend when you add route param (?id= or ?rfq= etc.)
  useEffect(() => {
    // You can implement: dfmApi.getLatest({rfq_no, sales_order_no, cam_no}) etc.
  }, []);

  // Handle Gerber analysis completion
  const handleGerberAnalysisComplete = (analysisResult) => {
    setGerberAnalysis(analysisResult);
    setUploadedFiles(analysisResult?.files || []);
    
    // Update DFM checklist based on analysis results
    if (analysisResult) {
      updateChecklistFromAnalysis(analysisResult);
    }
  };

  // Update checklist based on Gerber analysis
  const updateChecklistFromAnalysis = (analysisResult) => {
    setRows(prevRows => prevRows.map(row => {
      let updatedRow = { ...row };
      
      // Update based on analysis results
      if (analysisResult.summary.totalViolations > 0) {
        // Set relevant checks to fail based on violations
        if (row.category === 'outline' && analysisResult.summary.criticalIssues.some(issue => issue.includes('outline'))) {
          updatedRow.status = 'fail';
          updatedRow.comment = 'Board outline issues detected in Gerber analysis';
        }
        if (row.category === 'drill' && analysisResult.summary.criticalIssues.some(issue => issue.includes('drill'))) {
          updatedRow.status = 'fail';
          updatedRow.comment = 'Drill file issues detected in Gerber analysis';
        }
        if (row.category === 'copper' && analysisResult.summary.criticalIssues.some(issue => issue.includes('copper'))) {
          updatedRow.status = 'fail';
          updatedRow.comment = 'Copper layer issues detected in Gerber analysis';
        }
      }

      // Update based on layer detection
      if (row.id === 'stk-1' && analysisResult.board) {
        // Board dimensions check
        const { width, height } = analysisResult.board.dimensions;
        if (width < 10 || height < 10) {
          updatedRow.status = 'fail';
          updatedRow.comment = `Board dimensions too small: ${width.toFixed(2)} x ${height.toFixed(2)}mm`;
        } else if (width > 600 || height > 600) {
          updatedRow.status = 'fail';
          updatedRow.comment = `Board dimensions too large: ${width.toFixed(2)} x ${height.toFixed(2)}mm`;
        } else {
          updatedRow.status = 'pass';
          updatedRow.comment = `Board dimensions: ${width.toFixed(2)} x ${height.toFixed(2)}mm`;
        }
      }

      if (row.id === 'dr-1') {
        // Drill file check
        const hasDrill = analysisResult.board.hasDrill;
        if (!hasDrill) {
          updatedRow.status = 'warn';
          updatedRow.comment = 'No drill file detected - assuming no through-hole components';
        } else {
          updatedRow.status = 'pass';
          updatedRow.comment = 'Drill file detected and parsed successfully';
        }
      }

      if (row.id === 'ol-1') {
        // Outline check
        const hasOutline = analysisResult.board.hasOutline;
        if (!hasOutline) {
          updatedRow.status = 'fail';
          updatedRow.comment = 'No board outline detected in Gerber files';
        } else {
          updatedRow.status = 'pass';
          updatedRow.comment = 'Board outline detected and validated';
        }
      }

      return updatedRow;
    }));
  };

  // Reset Gerber analysis
  const resetGerberAnalysis = () => {
    setGerberAnalysis(null);
    setUploadedFiles([]);
    // Reset checklist items affected by Gerber analysis
    setRows(prevRows => prevRows.map(row => {
      if (['stk-1', 'dr-1', 'ol-1'].includes(row.id)) {
        return { ...row, status: 'na', comment: '' };
      }
      return row;
    }));
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const catOk = category === "all" ? true : r.category === category;
      const qOk = !q
        ? true
        : `${r.title} ${r.desc} ${r.recommended} ${r.comment}`.toLowerCase().includes(q);
      const issuesOk = !onlyIssues ? true : r.status === "fail" || r.status === "warn";
      return catOk && qOk && issuesOk;
    });
  }, [rows, query, category, onlyIssues]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pass = rows.filter((r) => r.status === "pass").length;
    const warn = rows.filter((r) => r.status === "warn").length;
    const fail = rows.filter((r) => r.status === "fail").length;
    const na = rows.filter((r) => r.status === "na").length;

    const issueCount = warn + fail;
    const health =
      total === 0 ? 0 : Math.round(((pass + na * 0.5) / total) * 100); // rough “health” indicator

    return { total, pass, warn, fail, na, issueCount, health };
  }, [rows]);

  const setStatus = (id, status) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const setComment = (id, comment) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, comment } : r)));
  };

  const resetAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, status: "na", comment: "" })));
    toast({ title: "Reset done", description: "All checklist items set to N/A." });
  };

  const canSave = useMemo(() => {
    return Boolean(rfqNo.trim() || salesOrderNo.trim() || camNo.trim());
  }, [rfqNo, salesOrderNo, camNo]);

  const handleSave = async () => {
    if (!canSave) {
      toast({
        title: "Missing reference number",
        description: "Provide at least one: RFQ No / Sales Order No / CAM No to save DFM checklist.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        rfq_no: rfqNo || null,
        sales_order_no: salesOrderNo || null,
        cam_no: camNo || null,
        board_name: boardName || null,
        revision: revision || null,
        summary: {
          total: stats.total,
          pass: stats.pass,
          warn: stats.warn,
          fail: stats.fail,
          na: stats.na,
          health: stats.health,
        },
        items: rows.map((r) => ({
          id: r.id,
          category: r.category,
          title: r.title,
          desc: r.desc,
          recommended: r.recommended,
          status: r.status,
          comment: r.comment,
        })),
      };

      await dfmApi.saveChecklist(payload);
      toast({ title: "Saved", description: "DFM checklist saved successfully." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Could not save DFM checklist.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportJson = () => {
    const data = {
      rfq_no: rfqNo || null,
      sales_order_no: salesOrderNo || null,
      cam_no: camNo || null,
      board_name: boardName || null,
      revision: revision || null,
      exported_at: new Date().toISOString(),
      stats,
      items: rows,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dfm-checklist_${rfqNo || salesOrderNo || camNo || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "DFM checklist exported as JSON." });
  };

  const statusChip = (status) => {
    const s = SEVERITY[status] || SEVERITY.na;
    return <Badge className={cx("rounded-full", s.className)}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DFM Checklist</h1>
          <p className="text-sm text-gray-500">
            Run a lightweight Design-for-Manufacturing review before CAM release and Work Order creation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={exportJson}>
            <Download className="h-4 w-4 text-[#dc2551]" />
            Export
          </Button>

          <Button variant="outline" className="gap-2" onClick={resetAll}>
            <XCircle className="h-4 w-4 text-[#dc2551]" />
            Reset
          </Button>

          <Button
            className="bg-cyan-600 hover:bg-cyan-500 gap-2"
            onClick={handleSave}
            disabled={saving || loading || !canSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Checklist"}
          </Button>
        </div>
      </div>

      {/* Traceability + Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Traceability */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[#dc2551]" />
              Traceability
            </CardTitle>
            <CardDescription>Link checklist to RFQ / Sales Order / CAM and board revision</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>RFQ No</Label>
              <Input value={rfqNo} onChange={(e) => setRfqNo(e.target.value)} placeholder="RFQ-000123" />
            </div>
            <div className="space-y-2">
              <Label>Sales Order No</Label>
              <Input value={salesOrderNo} onChange={(e) => setSalesOrderNo(e.target.value)} placeholder="SO-000045" />
            </div>
            <div className="space-y-2">
              <Label>CAM No</Label>
              <Input value={camNo} onChange={(e) => setCamNo(e.target.value)} placeholder="CAM-000019" />
            </div>
            <div className="space-y-2">
              <Label>Board Name</Label>
              <Input value={boardName} onChange={(e) => setBoardName(e.target.value)} placeholder="Customer_Product_RevA" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Revision</Label>
              <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="A" />
              {!canSave && (
                <p className="text-xs text-rose-600 mt-1">
                  Provide at least one reference number (RFQ / Sales Order / CAM) to save.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#dc2551]" />
              Summary
            </CardTitle>
            <CardDescription>Quick health view of the checklist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">PASS</span>
              <span className="font-semibold text-gray-900">{stats.pass}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">WARN</span>
              <span className="font-semibold text-gray-900">{stats.warn}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">FAIL</span>
              <span className="font-semibold text-gray-900">{stats.fail}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">N/A</span>
              <span className="font-semibold text-gray-900">{stats.na}</span>
            </div>

            <div className="mt-3 rounded-xl border bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Health</p>
                  <p className="text-lg font-bold text-gray-900">{stats.health}%</p>
                </div>
                <Badge
                  className={cx(
                    "rounded-full",
                    stats.issueCount === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  )}
                >
                  {stats.issueCount === 0 ? "No issues" : `${stats.issueCount} issue(s)`}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                <p className="text-xs text-amber-900/90">
                  For full DFM, integrate Gerber parsing + capability rules (min trace/space, annular ring, drill aspect ratio).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gerber Upload */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-[#dc2551]" />
              Gerber File Analysis
            </CardTitle>
            <CardDescription>
              Upload Gerber files for automated DFM validation and capability rule checking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GerberUpload
              onAnalysisComplete={handleGerberAnalysisComplete}
              disabled={isAnalyzing}
            />
          </CardContent>
        </Card>

        {/* Capability Rules Configuration */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#dc2551]" />
              Capability Rules
            </CardTitle>
            <CardDescription>
              Configure manufacturing capability limits for DFM validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CapabilityRulesConfig
              initialRules={capabilityRules}
              onUpdate={(newRules) => {
                setCapabilityRules(newRules);
                // Update the analyzer with new rules
                dfmAnalyzer.rulesEngine.rules = { ...dfmAnalyzer.rulesEngine.rules, ...newRules };
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#dc2551]" />
            Filters
          </CardTitle>
          <CardDescription>Search and focus on warnings/failures</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search checklist items…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            >
              <option value="all">All</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="mt-3 flex items-center justify-between">
              <Label className="text-sm text-gray-700">Only issues (WARN/FAIL)</Label>
              <button
                type="button"
                className={cx(
                  "inline-flex h-6 w-11 items-center rounded-full border px-1 transition",
                  onlyIssues ? "bg-[#dc2551]/10 border-[#dc2551]/30" : "bg-gray-100 border-gray-200"
                )}
                onClick={() => setOnlyIssues((v) => !v)}
                aria-label="Toggle issues filter"
              >
                <span
                  className={cx(
                    "h-4 w-4 rounded-full transition",
                    onlyIssues ? "translate-x-5 bg-[#dc2551]" : "translate-x-0 bg-gray-400"
                  )}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist table/cards */}
      <div className="space-y-4">
        {DEFAULT_CATEGORIES.filter((c) => category === "all" || c.key === category).map((cat) => {
          const catRows = filteredRows.filter((r) => r.category === cat.key);
          if (catRows.length === 0) return null;

          return (
            <Card key={cat.key}>
              <CardHeader>
                <CardTitle className="text-base">{cat.name}</CardTitle>
                <CardDescription>{catRows.length} item(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {catRows.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-2xl border bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{r.title}</p>
                          {statusChip(r.status)}
                        </div>
                        <p className="mt-1 text-xs text-gray-600">{r.desc}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">Recommended:</span> {r.recommended}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setStatus(r.id, "pass")}
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                          Pass
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setStatus(r.id, "warn")}
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-700" />
                          Warn
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setStatus(r.id, "fail")}
                        >
                          <XCircle className="h-4 w-4 text-rose-700" />
                          Fail
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setStatus(r.id, "na")}
                        >
                          <FilePlus2 className="h-4 w-4 text-gray-600" />
                          N/A
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Label className="text-xs">Comment / Action</Label>
                      <textarea
                        value={r.comment}
                        onChange={(e) => setComment(r.id, e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-md border bg-white px-3 py-2 text-sm"
                        placeholder="Example: Min trace/space is 3/3 mil — confirm capability or redesign."
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {filteredRows.length === 0 && (
          <Card>
            <CardContent className="py-10">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-100">
                  <ClipboardCheck className="h-6 w-6 text-gray-700" />
                </div>
                <p className="mt-3 font-semibold text-gray-900">No checklist items found</p>
                <p className="mt-1 text-sm text-gray-500">Try clearing filters or search.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
