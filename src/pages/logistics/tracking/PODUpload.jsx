// src/pages/logistics/shipments/PODUpload.jsx
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
  CheckCircle2,
  FileImage,
  FileText,
  Link2,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UploadCloud,
  XCircle,
} from "lucide-react";

/**
 * PCBxpress - POD Upload (Proof of Delivery)
 * Path: src/pages/logistics/shipments/PODUpload.jsx
 *
 * Features:
 * - Search shipment by Shipment No / AWB / Invoice No
 * - Upload POD document(s): image/pdf
 * - Add POD reference link (optional)
 * - Mark delivery status as Delivered + store POD metadata
 *
 * NOTE: This is a frontend scaffold with mock APIs.
 * Replace mock endpoints with your real backend:
 *  - GET  /shipments/search?q=
 *  - POST /shipments/:id/pod (multipart)
 *  - POST /shipments/:id/mark-delivered
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fileKind(file) {
  const t = (file?.type || "").toLowerCase();
  if (t.includes("pdf")) return "pdf";
  if (t.includes("image")) return "image";
  return "file";
}

function prettyBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------------- Mock API ----------------
async function mockSearchShipment(q) {
  await new Promise((r) => setTimeout(r, 450));
  if (!q || q.trim().length < 3) return [];

  const base = [
    {
      id: "shp_10021",
      shipmentNo: "SHP-2026-00021",
      awbNo: "BD1234567890",
      invoiceNo: "INV-2026-00118",
      customer: "Aster Robotics Pvt Ltd",
      destination: "Bengaluru, KA",
      carrier: "BlueDart",
      status: "In Transit",
      dispatchDate: "2026-01-03",
      deliveredDate: null,
      podFiles: [],
      podLink: "",
    },
    {
      id: "shp_10018",
      shipmentNo: "SHP-2026-00018",
      awbNo: "DTDC5544332211",
      invoiceNo: "INV-2026-00109",
      customer: "Nova Circuits",
      destination: "Chennai, TN",
      carrier: "DTDC",
      status: "Delivered",
      dispatchDate: "2026-01-01",
      deliveredDate: "2026-01-04",
      podFiles: [{ name: "pod_signed.pdf", size: 248123, type: "application/pdf" }],
      podLink: "https://carrier.example/pod/DTDC5544332211",
    },
  ];

  const needle = q.trim().toLowerCase();
  return base.filter((x) =>
    [x.shipmentNo, x.awbNo, x.invoiceNo, x.customer].some((v) => String(v).toLowerCase().includes(needle))
  );
}

async function mockUploadPOD(shipmentId, files, podLink) {
  await new Promise((r) => setTimeout(r, 900));
  if (!shipmentId) throw new Error("Missing shipment id");

  // simulate upload ok
  return {
    ok: true,
    uploaded: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    podLink: podLink || "",
  };
}

async function mockMarkDelivered(shipmentId, deliveredDateISO) {
  await new Promise((r) => setTimeout(r, 600));
  if (!shipmentId) throw new Error("Missing shipment id");
  return { ok: true, status: "Delivered", deliveredDate: deliveredDateISO };
}
// ------------------------------------------

function FileIcon({ kind }) {
  if (kind === "pdf") return <FileText className="h-4 w-4 text-gray-600" />;
  if (kind === "image") return <FileImage className="h-4 w-4 text-gray-600" />;
  return <FileText className="h-4 w-4 text-gray-600" />;
}

export default function PODUpload() {
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  const [podLink, setPodLink] = useState("");
  const [deliveredDate, setDeliveredDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [marking, setMarking] = useState(false);

  const inputRef = useRef(null);

  const canUpload = useMemo(() => {
    return !!selected && (files.length > 0 || (podLink || "").trim().length > 0);
  }, [selected, files, podLink]);

  const hasDelivered = selected?.status === "Delivered";

  const doSearch = async () => {
    setSearching(true);
    setSelected(null);
    setResults([]);
    try {
      const rows = await mockSearchShipment(query);
      setResults(rows);
      if (rows.length === 0) {
        toast({ title: "No results", description: "No shipments matched your search." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Search failed", description: "Could not search shipments.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const pickShipment = (row) => {
    setSelected(row);
    setPodLink(row.podLink || "");
    setFiles([]);
    setDeliveredDate((row.deliveredDate || new Date().toISOString().slice(0, 10)).slice(0, 10));
  };

  const onPickFiles = (picked) => {
    const arr = Array.from(picked || []);
    const allowed = arr.filter((f) => {
      const t = (f.type || "").toLowerCase();
      return t.includes("pdf") || t.includes("image");
    });

    if (allowed.length !== arr.length) {
      toast({
        title: "Some files skipped",
        description: "Only PDF and image files are allowed for POD.",
        variant: "destructive",
      });
    }

    // limit: 5 files, 10MB each (client-side hint)
    const MAX_FILES = 5;
    const MAX_SIZE = 10 * 1024 * 1024;

    const filtered = allowed
      .slice(0, MAX_FILES)
      .filter((f) => {
        if (f.size > MAX_SIZE) {
          toast({
            title: "File too large",
            description: `${f.name} exceeds 10MB.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

    setFiles((prev) => {
      const merged = [...prev, ...filtered].slice(0, MAX_FILES);
      return merged;
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearFiles = () => setFiles([]);

  const handleUpload = async () => {
    if (!selected) return;

    const link = (podLink || "").trim();
    if (files.length === 0 && !link) {
      toast({
        title: "Nothing to upload",
        description: "Add a POD file or a POD link.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const res = await mockUploadPOD(selected.id, files, link);

      const next = {
        ...selected,
        podFiles: [...(selected.podFiles || []), ...(res.uploaded || [])],
        podLink: res.podLink || link,
      };

      setSelected(next);
      setResults((prev) => prev.map((r) => (r.id === next.id ? next : r)));

      toast({ title: "POD uploaded", description: "POD document saved to shipment record." });
    } catch (e) {
      console.error(e);
      toast({ title: "Upload failed", description: "Could not upload POD.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selected) return;
    if (!selected.podFiles?.length && !(selected.podLink || "").trim()) {
      toast({
        title: "POD required",
        description: "Upload at least one POD file or add a POD link before marking Delivered.",
        variant: "destructive",
      });
      return;
    }

    setMarking(true);
    try {
      const iso = new Date(`${deliveredDate}T12:00:00`).toISOString();
      const res = await mockMarkDelivered(selected.id, iso);

      const next = { ...selected, status: res.status, deliveredDate: deliveredDate };
      setSelected(next);
      setResults((prev) => prev.map((r) => (r.id === next.id ? next : r)));

      toast({ title: "Shipment delivered", description: "Status updated to Delivered." });
    } catch (e) {
      console.error(e);
      toast({ title: "Update failed", description: "Could not mark Delivered.", variant: "destructive" });
    } finally {
      setMarking(false);
    }
  };

  // Enter key triggers search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && (document.activeElement?.id === "pod-search")) {
        e.preventDefault();
        doSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">POD Upload</h1>
            <Badge className="bg-[#dc2551]/10 text-[#dc2551] hover:bg-[#dc2551]/10">PCBxpress</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Attach Proof of Delivery documents and close shipments with delivery confirmation.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-gray-500" />
            Find Shipment
          </CardTitle>
          <CardDescription>Search by Shipment No, AWB No, Invoice No, or Customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Label htmlFor="pod-search" className="sr-only">
                Search
              </Label>
              <Input
                id="pod-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., SHP-2026-00021 or BD1234567890 or INV-2026-00118"
              />
            </div>
            <Button
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              onClick={doSearch}
              disabled={searching || (query || "").trim().length < 3}
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          {results.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border">
              <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                <div className="col-span-3">Shipment</div>
                <div className="col-span-2">AWB</div>
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Carrier</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              <div className="divide-y">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => pickShipment(r)}
                    className={cx(
                      "grid w-full grid-cols-12 px-3 py-3 text-left text-sm hover:bg-gray-50",
                      selected?.id === r.id ? "bg-[#dc2551]/5" : "bg-white"
                    )}
                  >
                    <div className="col-span-3">
                      <p className="font-semibold text-gray-900">{r.shipmentNo}</p>
                      <p className="text-xs text-gray-500">Inv: {r.invoiceNo}</p>
                    </div>
                    <div className="col-span-2 text-gray-700">{r.awbNo}</div>
                    <div className="col-span-3">
                      <p className="text-gray-900">{r.customer}</p>
                      <p className="text-xs text-gray-500">{r.destination}</p>
                    </div>
                    <div className="col-span-2 text-gray-700">{r.carrier}</div>
                    <div className="col-span-2 flex items-center justify-end">
                      <Badge
                        className={cx(
                          r.status === "Delivered"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-amber-100 text-amber-900 hover:bg-amber-100"
                        )}
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Shipment summary */}
        <Card className="border-gray-100 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              Shipment Summary
            </CardTitle>
            <CardDescription>Verify shipment before uploading POD.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                Select a shipment from search results.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Shipment No</p>
                  <p className="font-semibold text-gray-900">{selected.shipmentNo}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">AWB</p>
                    <p className="font-semibold text-gray-900">{selected.awbNo}</p>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">Carrier</p>
                    <p className="font-semibold text-gray-900">{selected.carrier}</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-900">{selected.customer}</p>
                  <p className="mt-1 text-xs text-gray-500">{selected.destination}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">Dispatch</p>
                    <p className="font-semibold text-gray-900">{selected.dispatchDate}</p>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="mt-1">
                      <Badge
                        className={cx(
                          selected.status === "Delivered"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-amber-100 text-amber-900 hover:bg-amber-100"
                        )}
                      >
                        {selected.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-700">Existing POD</p>
                  <div className="mt-2 space-y-2">
                    {(selected.podFiles || []).length === 0 && !(selected.podLink || "").trim() ? (
                      <p className="text-xs text-gray-500">No POD attached yet.</p>
                    ) : (
                      <>
                        {(selected.podFiles || []).map((f, idx) => (
                          <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-white p-2">
                            <div className="flex items-center gap-2">
                              <FileIcon kind={fileKind(f)} />
                              <div className="leading-tight">
                                <p className="text-sm font-medium text-gray-900">{f.name}</p>
                                <p className="text-xs text-gray-500">{prettyBytes(f.size)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(selected.podLink || "").trim() && (
                          <div className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm text-gray-700">
                            <Link2 className="h-4 w-4 text-gray-500" />
                            <span className="truncate">{selected.podLink}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload panel */}
        <Card className="border-gray-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UploadCloud className="h-4 w-4 text-gray-500" />
              Upload POD
            </CardTitle>
            <CardDescription>Upload signed POD (PDF/Image) or paste a carrier POD link.</CardDescription>
          </CardHeader>

          <CardContent>
            {!selected ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
                Search and select a shipment to upload POD.
              </div>
            ) : (
              <div className="space-y-5">
                {/* POD link */}
                <div className="space-y-2">
                  <Label>POD Reference Link (optional)</Label>
                  <Input
                    value={podLink}
                    onChange={(e) => setPodLink(e.target.value)}
                    placeholder="https://carrier.example/pod/awb..."
                  />
                  <p className="text-xs text-gray-500">
                    Use this if the carrier provides a hosted POD URL.
                  </p>
                </div>

                {/* file upload */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">POD Files</p>
                      <p className="text-xs text-gray-500">Allowed: PDF/JPG/PNG. Max 5 files, 10MB each.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf,image/*"
                        multiple
                        onChange={(e) => onPickFiles(e.target.files)}
                        className="hidden"
                        id="pod-files"
                      />
                      <Button variant="outline" className="gap-2" onClick={() => document.getElementById("pod-files")?.click()}>
                        <Upload className="h-4 w-4" />
                        Add Files
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={clearFiles} disabled={files.length === 0}>
                        <Trash2 className="h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-lg border p-2">
                          <div className="flex items-center gap-2">
                            <FileIcon kind={fileKind(f)} />
                            <div className="leading-tight">
                              <p className="text-sm font-medium text-gray-900">{f.name}</p>
                              <p className="text-xs text-gray-500">
                                {prettyBytes(f.size)} • {f.type || "file"}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-2" onClick={() => removeFile(idx)}>
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* actions */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="h-4 w-4" />
                    POD is stored against the shipment for audit and customer support.
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                      onClick={handleUpload}
                      disabled={!canUpload || uploading}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      {uploading ? "Uploading..." : "Upload POD"}
                    </Button>
                  </div>
                </div>

                {/* mark delivered */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Mark as Delivered</p>
                      <p className="text-xs text-gray-500">
                        Requires POD attached (file or link). Updates shipment status and closes dispatch workflow.
                      </p>
                    </div>

                    <Badge
                      className={cx(
                        hasDelivered
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-amber-100 text-amber-900 hover:bg-amber-100"
                      )}
                    >
                      {selected.status}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                    <div className="space-y-2 sm:col-span-1">
                      <Label>Delivered Date</Label>
                      <Input
                        type="date"
                        value={deliveredDate}
                        onChange={(e) => setDeliveredDate(e.target.value)}
                        disabled={hasDelivered}
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => toast({ title: "Tip", description: "In production, add a signature + receiver name fields." })}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Audit Tip
                      </Button>

                      <Button
                        className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                        onClick={handleMarkDelivered}
                        disabled={hasDelivered || marking}
                      >
                        {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {marking ? "Updating..." : "Mark Delivered"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-white p-3 text-xs text-gray-600">
                    {hasDelivered ? (
                      <>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                        <div>
                          Delivered on <span className="font-medium">{selected.deliveredDate || deliveredDate}</span>. POD is archived in shipment history.
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          Status not Delivered yet. Upload POD then mark delivered to complete the shipment.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
