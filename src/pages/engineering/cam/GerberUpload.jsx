// src/pages/engineering/cam/GerberUpload.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  FileArchive,
  FileCode2,
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import camOutputsApi from "@/services/camOutputs.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function humanSize(bytes) {
  if (bytes == null) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = Number(bytes);
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function inferTypeFromName(name = "") {
  const n = name.toLowerCase();
  if (n.includes("odb")) return "ODB++";
  if (n.includes("ipc")) return "IPC2581";
  if (n.includes("gerber") || n.endsWith(".zip")) return "Gerber + Drill";
  return "Gerber + Drill";
}

function hasAllowedExt(fileName) {
  const n = (fileName || "").toLowerCase();
  // Accept ZIP for full CAM package; allow single layer files too.
  return (
    n.endsWith(".zip") ||
    n.endsWith(".rar") ||
    n.endsWith(".7z") ||
    n.endsWith(".tgz") ||
    n.endsWith(".gz") ||
    n.endsWith(".tar") ||
    n.endsWith(".gbr") ||
    n.endsWith(".gbx") ||
    n.endsWith(".drl") ||
    n.endsWith(".txt") ||
    n.endsWith(".csv") ||
    n.endsWith(".pho") ||
    n.endsWith(".art")
  );
}

export default function GerberUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Primary identifiers (traceability)
  const [rfqNo, setRfqNo] = useState("");
  const [salesOrderNo, setSalesOrderNo] = useState("");
  const [camNo, setCamNo] = useState("");
  const [boardName, setBoardName] = useState("");
  const [revision, setRevision] = useState("A");

  // Output metadata
  const [type, setType] = useState("Gerber + Drill");
  const [format, setFormat] = useState("zip");
  const [notes, setNotes] = useState("");

  // File
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Checks
  const [runQuickChecks, setRunQuickChecks] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progressHint, setProgressHint] = useState("");

  const inferred = useMemo(() => {
    const name = file?.name || "";
    const t = inferTypeFromName(name);
    const fmt = name.toLowerCase().endsWith(".zip")
      ? "zip"
      : name.toLowerCase().endsWith(".pdf")
      ? "pdf"
      : name.toLowerCase().endsWith(".txt")
      ? "txt"
      : name.toLowerCase().endsWith(".csv")
      ? "csv"
      : name.toLowerCase().endsWith(".drl")
      ? "drl"
      : name.toLowerCase().endsWith(".gbr") || name.toLowerCase().endsWith(".gbx")
      ? "gbr"
      : "zip";

    return { t, fmt };
  }, [file]);

  const canSubmit = useMemo(() => {
    if (!file) return false;
    // at least one reference number should exist for real ERP traceability
    if (!rfqNo.trim() && !salesOrderNo.trim() && !camNo.trim()) return false;
    return true;
  }, [file, rfqNo, salesOrderNo, camNo]);

  const warnings = useMemo(() => {
    const w = [];
    if (!file) return w;

    if (!hasAllowedExt(file.name)) {
      w.push("File extension is unusual for Gerber/CAM packages. Prefer ZIP (Gerbers + drill + readme).");
    }
    if (file.size > 250 * 1024 * 1024) {
      w.push("File is large (>250MB). Upload may take time. Consider compressing to ZIP.");
    }
    if (!boardName.trim()) {
      w.push("Board name is empty. Adding board name improves traceability.");
    }
    if (!revision.trim()) {
      w.push("Revision is empty. Use A/B/C or 01/02 etc to avoid mix-ups.");
    }
    return w;
  }, [file, boardName, revision]);

  const quickChecks = useMemo(() => {
    if (!file) return [];
    const checks = [];

    // Only “lightweight” checks without parsing gerbers
    const name = file.name.toLowerCase();
    checks.push({
      label: "Package format",
      ok: name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z") || name.endsWith(".tgz") || name.endsWith(".tar") || name.endsWith(".gz"),
      hint: "Recommended: one compressed package with all layers + drill + readme.",
    });

    checks.push({
      label: "Includes drill / tooling hint",
      ok: name.includes("drl") || name.includes("drill") || name.includes("nc") || name.includes("excellon") || name.endsWith(".zip"),
      hint: "Ensure drill file(s) are included (Excellon / .drl) inside the package.",
    });

    checks.push({
      label: "Has reference numbers",
      ok: Boolean(rfqNo.trim() || salesOrderNo.trim() || camNo.trim()),
      hint: "RFQ / Sales Order / CAM No is required for ERP traceability.",
    });

    checks.push({
      label: "Revision set",
      ok: Boolean(revision.trim()),
      hint: "Add Rev to prevent wrong build.",
    });

    return checks;
  }, [file, rfqNo, salesOrderNo, camNo, revision]);

  const applyInferred = () => {
    if (!file) return;
    setType(inferred.t);
    setFormat(inferred.fmt);
  };

  const clearFile = () => setFile(null);

  const onPickFile = (f) => {
    if (!f) return;
    setFile(f);
    // Auto infer on select
    setType(inferTypeFromName(f.name));
    const lower = f.name.toLowerCase();
    setFormat(lower.endsWith(".zip") ? "zip" : lower.endsWith(".pdf") ? "pdf" : lower.endsWith(".txt") ? "txt" : lower.endsWith(".csv") ? "csv" : lower.endsWith(".drl") ? "drl" : lower.endsWith(".gbr") ? "gbr" : "zip");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    onPickFile(f);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Missing required info",
        description: "Select a file and provide at least one reference number (RFQ / Sales Order / CAM No).",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgressHint("Preparing upload…");

    try {
      // Send as multipart/form-data
      const form = new FormData();
      form.append("file", file);

      // metadata
      form.append("type", type);
      form.append("format", format);
      form.append("rfq_no", rfqNo);
      form.append("sales_order_no", salesOrderNo);
      form.append("cam_no", camNo);
      form.append("board_name", boardName);
      form.append("revision", revision);
      form.append("notes", notes);

      // Backend suggestion:
      // POST /cam-outputs/upload-gerber
      // returns { id, output_no }
      setProgressHint("Uploading package…");
      const res = await camOutputsApi.uploadGerber(form);

      const createdId = res?.data?.id ?? res?.data?._id;
      const outputNo = res?.data?.output_no ?? res?.data?.outputNo;

      toast({
        title: "Upload successful",
        description: outputNo ? `Gerber package saved as ${outputNo}.` : "Gerber package saved.",
      });

      // Go to details if available, else back to list
      if (createdId) navigate(`/engineering/cam/outputs/${createdId}`);
      else navigate("/engineering/cam/outputs");
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err?.response?.data?.message || "Could not upload Gerber package.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgressHint("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gerber Upload</h1>
          <p className="text-sm text-gray-500">
            Upload manufacturing data packages (Gerber + Drill / ODB++ / IPC2581) and link them to RFQ / Sales Order / CAM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button
            className="bg-[#dc2551] hover:bg-[#b02045] gap-2"
            onClick={handleUpload}
            disabled={!canSubmit || uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleUpload} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: dropzone + quick checks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#dc2551]" />
                Package
              </CardTitle>
              <CardDescription>Recommended: one ZIP with all Gerber layers + drill + readme + stackup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cx(
                  "rounded-2xl border-2 border-dashed p-6 transition",
                  dragOver ? "border-[#dc2551] bg-[#dc2551]/5" : "border-gray-200 bg-gray-50"
                )}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                }}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                    <FileArchive className="h-6 w-6" />
                  </div>

                  <p className="mt-3 font-semibold text-gray-900">Drag & drop your Gerber package</p>
                  <p className="mt-1 text-sm text-gray-500">ZIP / RAR / 7Z / TGZ (preferred), or single files for quick tests</p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => onPickFile(e.target.files?.[0])}
                          accept=".zip,.rar,.7z,.tgz,.tar,.gz,.gbr,.gbx,.drl,.txt,.csv,.pho,.art,application/zip"
                        />
                        <Upload className="h-4 w-4 text-[#dc2551]" />
                        Choose file
                      </label>
                    </Button>

                    {file && (
                      <Button type="button" variant="outline" className="gap-2" onClick={clearFile}>
                        <Trash2 className="h-4 w-4 text-[#dc2551]" />
                        Remove
                      </Button>
                    )}
                  </div>

                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-5 w-full rounded-xl border bg-white p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">{file.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{humanSize(file.size)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full bg-gray-100 text-gray-700">{(format || "zip").toUpperCase()}</Badge>
                            <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">{type}</Badge>
                          </div>
                        </div>

                        <Button type="button" variant="outline" className="gap-2" onClick={applyInferred}>
                          <Info className="h-4 w-4 text-[#dc2551]" />
                          Auto-detect
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Recommendations</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900/90">
                        {warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {progressHint && (
                <div className="rounded-xl border bg-white p-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progressHint}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick checks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#dc2551]" />
                Pre-flight checks (light)
              </CardTitle>
              <CardDescription>No heavy parsing — just quick validations to prevent wrong builds</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-700">Run quick checks</Label>
                <button
                  type="button"
                  className={cx(
                    "inline-flex h-6 w-11 items-center rounded-full border px-1 transition",
                    runQuickChecks ? "bg-[#dc2551]/10 border-[#dc2551]/30" : "bg-gray-100 border-gray-200"
                  )}
                  onClick={() => setRunQuickChecks((v) => !v)}
                  aria-label="Toggle quick checks"
                >
                  <span
                    className={cx(
                      "h-4 w-4 rounded-full transition",
                      runQuickChecks ? "translate-x-5 bg-[#dc2551]" : "translate-x-0 bg-gray-400"
                    )}
                  />
                </button>
              </div>

              {runQuickChecks ? (
                <div className="space-y-2">
                  {quickChecks.map((c, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{c.hint}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.ok ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="h-4 w-4" />
                            Check
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Checks are off. You can still upload.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: traceability + metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#dc2551]" />
                Traceability
              </CardTitle>
              <CardDescription>At least one reference number is required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <Label>Revision</Label>
                <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="A" />
              </div>

              {!rfqNo.trim() && !salesOrderNo.trim() && !camNo.trim() && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  Provide at least one: <b>RFQ No</b>, <b>Sales Order No</b>, or <b>CAM No</b>.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-[#dc2551]" />
                Output metadata
              </CardTitle>
              <CardDescription>Helps routing into production & quality checks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="Gerber + Drill">Gerber + Drill</option>
                  <option value="ODB++">ODB++</option>
                  <option value="IPC2581">IPC2581</option>
                  <option value="Panel Drawing">Panel Drawing</option>
                  <option value="CAM Report">CAM Report</option>
                  <option value="Stackup Sheet">Stackup Sheet</option>
                  <option value="Netlist/ET">Netlist/ET</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  <option value="zip">ZIP</option>
                  <option value="pdf">PDF</option>
                  <option value="txt">TXT</option>
                  <option value="csv">CSV</option>
                  <option value="gbr">GBR</option>
                  <option value="drl">DRL</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-md border bg-white px-3 py-2 text-sm"
                  placeholder="Example: Use INCH 2:5, plated slots included, impedance on L2, soldermask green matte…"
                />
              </div>

              <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-900">Recommended ZIP content</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Top/Bottom copper, inner layers</li>
                  <li>Soldermask, silkscreen, paste (if needed)</li>
                  <li>Drill (plated/non-plated), slot files</li>
                  <li>Readme with units & scale, stackup, finished thickness</li>
                  <li>Panel drawing / tooling (if customer provides)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile submit bar */}
        <div className="lg:hidden">
          <div className="sticky bottom-3 rounded-2xl border bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{file ? file.name : "No file selected"}</p>
                <p className="text-xs text-gray-500">
                  {file ? humanSize(file.size) : "Choose a ZIP with Gerbers + drill."}
                </p>
              </div>
              <Button className="bg-[#dc2551] hover:bg-[#b02045] gap-2" disabled={!canSubmit || uploading} type="submit">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                Upload
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
