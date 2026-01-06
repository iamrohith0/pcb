// src/pages/traceability/batch/BatchScan.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Barcode,
  Camera,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
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

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    released: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    wip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    hold: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
    closed: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{status || "—"}</span>;
}

function normalizeScan(text) {
  if (!text) return "";
  return String(text).trim();
}

/**
 * BatchScan (PCBxpress)
 *
 * Supports two modes:
 * 1) Manual scan: user pastes/scans barcode into input (works with handheld scanners)
 * 2) Camera scan (optional): if BarcodeDetector API is available in the browser
 *
 * Expected APIs (adjust to match your backend):
 *  - GET /traceability/batches/lookup?q=<code>
 *    -> { data: { id, batch_no, status, product_name, work_order_no, created_at } }
 * OR if you don't have lookup:
 *  - GET /traceability/batches/:id  (if scanned value is the id)
 *
 * After successful lookup:
 *  - navigate to /traceability/batch/:id  (BatchDetails)
 */

export default function BatchScan() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [result, setResult] = useState(null);

  // Camera scan states
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const hasBarcodeDetector = useMemo(() => typeof window !== "undefined" && "BarcodeDetector" in window, []);

  const canSearch = query.trim().length > 0 && !isSearching;

  const stopCamera = async () => {
    try {
      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;

      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch {
      // ignore
    } finally {
      setCameraOpen(false);
      setCameraBusy(false);
    }
  };

  const startCamera = async () => {
    setCameraError("");
    setCameraBusy(true);
    setResult(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOpen(true);

      // Start scanning loop if BarcodeDetector exists
      if (hasBarcodeDetector) {
        const detector = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "data_matrix"],
        });

        scanTimerRef.current = setInterval(async () => {
          try {
            if (!videoRef.current) return;
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes?.length) {
              const raw = barcodes[0]?.rawValue || "";
              const text = normalizeScan(raw);
              if (text) {
                setQuery(text);
                await stopCamera();
                await handleLookup(text, { auto: true });
              }
            }
          } catch {
            // ignore scan errors (lighting, focus, etc.)
          }
        }, 350);
      }
    } catch (err) {
      console.error(err);
      setCameraError(err?.message || "Failed to open camera.");
      toast({
        title: "Camera Error",
        description: err?.message || "Failed to open camera.",
        variant: "destructive",
      });
      await stopCamera();
    } finally {
      setCameraBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLookup = async (value, opts = {}) => {
    const q = normalizeScan(value);
    if (!q) return;

    setIsSearching(true);
    setResult(null);

    try {
      // Prefer a lookup endpoint (scan value can be batch no / barcode / wo+batch etc.)
      // Change this path to match your backend.
      const res = await api.get(`/traceability/batches/lookup`, { params: { q } });
      const data = res?.data?.data ?? res?.data;

      if (!data?.id) {
        throw new Error("Batch not found for this code.");
      }

      setResult(data);

      toast({
        title: opts.auto ? "Batch detected" : "Batch found",
        description: `Batch ${data.batch_no || data.batchNo || data.id} loaded.`,
      });
    } catch (err) {
      // Fallback: if scan value is actually the batch id and lookup endpoint doesn't exist
      const status = err?.response?.status;

      try {
        if (status === 404 || status === 405 || status === 501) {
          const res2 = await api.get(`/traceability/batches/${encodeURIComponent(q)}`);
          const data2 = res2?.data?.data ?? res2?.data;
          if (!data2?.id) throw new Error("Batch not found.");
          setResult(data2);
          toast({
            title: "Batch found",
            description: `Batch ${data2.batch_no || data2.batchNo || data2.id} loaded.`,
          });
        } else {
          throw err;
        }
      } catch (err2) {
        console.error(err2);
        toast({
          title: "Lookup failed",
          description: err2?.response?.data?.message || err2?.message || "Unable to find batch for this code.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleLookup(query);
  };

  const goToDetails = () => {
    if (!result?.id) return;
    navigate(`/traceability/batch/${result.id}`);
  };

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
              <h1 className="text-xl font-bold text-gray-900">Batch Scan</h1>
              <p className="text-sm text-gray-600">
                Scan a barcode/QR or paste a Batch No to instantly open traceability details.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Barcode className="h-3.5 w-3.5" />
              Supports Batch No / Lot barcode / QR
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Audit-ready trace history
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/traceability/batch">
            <Button variant="outline" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Batch List
            </Button>
          </Link>

          {hasBarcodeDetector ? (
            <Button
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              onClick={() => (cameraOpen ? stopCamera() : startCamera())}
              disabled={cameraBusy}
            >
              {cameraBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {cameraOpen ? "Close Camera" : "Scan with Camera"}
            </Button>
          ) : (
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={startCamera} disabled={cameraBusy}>
              {cameraBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Open Camera
            </Button>
          )}
        </div>
      </div>

      {/* Manual scan/search */}
      <Card className="p-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan/paste Batch No or barcode value…"
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
              {isSearching ? "Searching..." : "Find Batch"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Tip: handheld scanners usually auto-submit with Enter.
            </span>
          </div>
        </form>
      </Card>

      {/* Camera panel */}
      {cameraOpen && (
        <Card className="overflow-hidden">
          <div className="border-b bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Camera Scanner</p>
              <Badge variant="secondary">{hasBarcodeDetector ? "Auto-detect enabled" : "Manual capture"}</Badge>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Point the camera to the barcode/QR. Ensure good lighting and steady focus.
            </p>
          </div>

          <div className="p-4">
            {cameraError ? (
              <div className="rounded-2xl border bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <XCircle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Camera error</p>
                    <p className="mt-1 text-xs">{cameraError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <div className="relative overflow-hidden rounded-2xl border bg-black">
                    <video ref={videoRef} className="h-[340px] w-full object-cover" playsInline muted />
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                      <div className="h-48 w-72 rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="space-y-3 rounded-2xl border bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">How to scan</p>
                    <ul className="space-y-2 text-xs text-gray-600">
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Keep the code inside the box.
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Avoid glare on glossy labels.
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Hold steady for 1–2 seconds.
                      </li>
                    </ul>

                    {!hasBarcodeDetector && (
                      <div className="rounded-2xl border bg-amber-50 p-3 text-xs text-amber-800">
                        Auto barcode detection not available in this browser. Use the manual input above after reading the
                        label text.
                      </div>
                    )}

                    <Button variant="outline" className="w-full gap-2" onClick={stopCamera}>
                      <XCircle className="h-4 w-4" />
                      Close Camera
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Result */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Result</p>
          <p className="text-xs text-gray-500">If a batch is found, open the Batch Details page.</p>
        </div>

        <div className="p-4">
          {isSearching ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Looking up batch…
            </div>
          ) : !result ? (
            <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
              Scan a barcode or enter a batch number to see results here.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {result.batch_no || result.batchNo || `Batch ${result.id}`}
                      </h3>
                      <StatusBadge status={result.status} />
                    </div>

                    <p className="text-sm text-gray-600">
                      {result.product_name || result.product?.name || "PCB product"}{" "}
                      {result.revision ? `(Rev ${result.revision})` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        WO: {result.work_order_no || result.workOrder?.number || "—"}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Barcode className="h-3.5 w-3.5" />
                        ID: {result.id}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        Created: {fmtDate(result.created_at || result.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={goToDetails}>
                      <Barcode className="h-4 w-4" />
                      Open Batch Details
                    </Button>

                    <Link to={`/traceability/batch/${result.id}`} className="text-xs text-gray-500 hover:underline">
                      Or open in new route
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-emerald-50 p-3 text-xs text-emerald-800">
                <span className="font-semibold">Next:</span> Use Batch Details to verify lots, materials, tests, and
                shipment history.
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
