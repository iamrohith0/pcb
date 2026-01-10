// src/components/engineering/GerberUpload.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  File,
  Layers,
  Ruler,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import { dfmAnalyzer } from "@/lib/gerberParser";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const LAYER_ICONS = {
  top_copper: "Copper Top",
  bottom_copper: "Copper Bottom", 
  top_soldermask: "Soldermask Top",
  bottom_soldermask: "Soldermask Bottom",
  top_silkscreen: "Silkscreen Top",
  bottom_silkscreen: "Silkscreen Bottom",
  drill: "Drill",
  outline: "Outline",
  unknown: "Unknown",
};

const LAYER_COLORS = {
  top_copper: "bg-blue-100 text-blue-800",
  bottom_copper: "bg-blue-100 text-blue-800",
  top_soldermask: "bg-green-100 text-green-800",
  bottom_soldermask: "bg-green-100 text-green-800",
  top_silkscreen: "bg-yellow-100 text-yellow-800",
  bottom_silkscreen: "bg-yellow-100 text-yellow-800",
  drill: "bg-purple-100 text-purple-800",
  outline: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-800",
};

export default function GerberUpload({ onAnalysisComplete, disabled = false }) {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    // Filter for Gerber and drill files
    const gerberFiles = selectedFiles.filter(file => {
      const name = file.name.toLowerCase();
      const ext = name.split('.').pop();
      return ['gbr', 'ger', 'gbl', 'gbs', 'gbp', 'gko', 'gto', 'gbo', 'gts', 'gbs', 'txt', 'drl'].includes(ext) ||
             name.includes('gtl') || name.includes('gbl') || name.includes('drill');
    });

    if (gerberFiles.length !== selectedFiles.length) {
      toast({
        title: "Some files filtered",
        description: "Only Gerber and drill files are accepted.",
        variant: "default",
      });
    }

    setFiles(prev => [...prev, ...gerberFiles]);
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    if (analysisResult) {
      setAnalysisResult(null);
    }
  };

  const analyzeFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload Gerber files to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await dfmAnalyzer.analyze(files);
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
      
      toast({
        title: "Analysis complete",
        description: `${result.summary.totalViolations} violations, ${result.summary.totalWarnings} warnings found.`,
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze Gerber files.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setAnalysisResult(null);
    onAnalysisComplete?.(null);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#dc2551]" />
            Gerber File Upload
          </CardTitle>
          <CardDescription>
            Upload Gerber files (.gbr, .ger) and drill files (.drl, .txt) for DFM analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className={cx(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                "hover:border-[#dc2551]/50 hover:bg-[#dc2551]/5",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => !disabled && document.getElementById('gerber-file-input').click()}
            >
              <input
                id="gerber-file-input"
                type="file"
                multiple
                accept=".gbr,.ger,.gbl,.gbs,.gbp,.gko,.gto,.gbo,.gts,.txt,.drl"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
              />
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports Gerber RS-274X and Excellon drill formats
                </p>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected Files ({files.length})</span>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear All
                  </Button>
                </div>
                <div className="grid gap-2">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={LAYER_COLORS[dfmAnalyzer.detectLayerType(file.name)]}>
                          {LAYER_ICONS[dfmAnalyzer.detectLayerType(file.name)]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.name)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Controls */}
      {files.length > 0 && (
        <div className="flex gap-3">
          <Button
            className="bg-[#dc2551] hover:bg-[#dc2551]/90 gap-2"
            onClick={analyzeFiles}
            disabled={isAnalyzing || disabled}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Analyze Gerber Files
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <AnalysisResults result={analysisResult} />
      )}
    </div>
  );
}

function AnalysisResults({ result }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#dc2551]" />
          Analysis Results
        </CardTitle>
        <CardDescription>
          DFM validation results based on uploaded Gerber files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Files</p>
                <p className="text-lg font-bold text-gray-900">{result.files.length}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">{result.board.layerCount} layers</Badge>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Violations</p>
                <p className="text-lg font-bold text-rose-600">{result.summary.totalViolations}</p>
              </div>
              <Badge className="bg-rose-100 text-rose-800">Critical</Badge>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Warnings</p>
                <p className="text-lg font-bold text-amber-600">{result.summary.totalWarnings}</p>
              </div>
              <Badge className="bg-amber-100 text-amber-800">Advisory</Badge>
            </div>
          </div>
        </div>

        {/* Board Dimensions */}
        {result.board && (
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Board Dimensions</h4>
              <Ruler className="h-4 w-4 text-gray-500" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Width:</span>
                <span className="ml-2 font-medium">{result.board.dimensions.width.toFixed(2)} mm</span>
              </div>
              <div>
                <span className="text-gray-600">Height:</span>
                <span className="ml-2 font-medium">{result.board.dimensions.height.toFixed(2)} mm</span>
              </div>
              <div>
                <span className="text-gray-600">Min X:</span>
                <span className="ml-2 font-medium">{result.board.dimensions.minX.toFixed(2)} mm</span>
              </div>
              <div>
                <span className="text-gray-600">Min Y:</span>
                <span className="ml-2 font-medium">{result.board.dimensions.minY.toFixed(2)} mm</span>
              </div>
            </div>
          </div>
        )}

        {/* Layer Analysis */}
        {result.board && result.board.layers.length > 0 && (
          <div className="rounded-xl border bg-white p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Layer Analysis</h4>
            <div className="grid gap-2">
              {result.board.layers.map((layer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <Badge className={LAYER_COLORS[layer.name]}>
                      {LAYER_ICONS[layer.name]}
                    </Badge>
                    <span className="text-sm font-medium">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.summary.layerIssues[layer.name] && (
                      <>
                        {result.summary.layerIssues[layer.name].violations > 0 && (
                          <Badge className="bg-rose-100 text-rose-800">
                            {result.summary.layerIssues[layer.name].violations} violations
                          </Badge>
                        )}
                        {result.summary.layerIssues[layer.name].warnings > 0 && (
                          <Badge className="bg-amber-100 text-amber-800">
                            {result.summary.layerIssues[layer.name].warnings} warnings
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Issues */}
        {result.summary.criticalIssues.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <h4 className="font-semibold text-rose-900 mb-2">Critical Issues</h4>
            <ul className="space-y-1">
              {result.summary.criticalIssues.map((issue, index) => (
                <li key={index} className="text-sm text-rose-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All Violations */}
        {result.violations.length > 0 && (
          <div className="rounded-xl border bg-white p-4">
            <h4 className="font-semibold text-gray-900 mb-3">All Violations</h4>
            <div className="space-y-2">
              {result.violations.map((violation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-rose-200 rounded">
                  <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-rose-900">{violation.type}</span>
                      <Badge className="bg-rose-100 text-rose-800">{violation.severity}</Badge>
                      <Badge className={LAYER_COLORS[violation.layer]}>{violation.layer}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{violation.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="rounded-xl border bg-white p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Warnings</h4>
            <div className="space-y-2">
              {result.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-amber-200 rounded">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-amber-900">{warning.type}</span>
                      <Badge className="bg-amber-100 text-amber-800">{warning.severity}</Badge>
                      <Badge className={LAYER_COLORS[warning.layer]}>{warning.layer}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Status */}
        {result.files.length > 0 && (
          <div className="rounded-xl border bg-white p-4">
            <h4 className="font-semibold text-gray-900 mb-3">File Processing Status</h4>
            <div className="space-y-2">
              {result.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={LAYER_COLORS[file.type]}>{LAYER_ICONS[file.type]}</Badge>
                    {file.parsed ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}