// src/pages/logistics/shipments/ShipmentDocuments.jsx
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    ClipboardCopy,
    Download,
    Eye,
    FileDown,
    FileText,
    Image as ImageIcon,
    Link2,
    Plus,
    Printer,
    RefreshCcw,
    ShieldCheck,
    Trash2,
    UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

/**
 * ShipmentDocuments.jsx (PCBxpress)
 * - Upload / link / manage documents for a shipment
 * - Typical docs: Packing List, Invoice, AWB/Consignment note, CoC, Test Report, RoHS/REACH, Photos
 *
 * Hook points (recommended):
 * - shipmentDocsService.list(shipmentId)
 * - shipmentDocsService.upload(shipmentId, file, meta)
 * - shipmentDocsService.addLink(shipmentId, payload)
 * - shipmentDocsService.remove(shipmentId, docId)
 * - shipmentDocsService.download(shipmentId, docId)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DOC_TYPES = [
  { value: "packing_list", label: "Packing List" },
  { value: "invoice", label: "Commercial Invoice" },
  { value: "awb", label: "AWB / Consignment Note" },
  { value: "label", label: "Shipping Label" },
  { value: "coc", label: "Certificate of Conformance (CoC)" },
  { value: "etest_report", label: "E-Test Report" },
  { value: "aoi_report", label: "AOI Report" },
  { value: "rohs_reach", label: "RoHS / REACH" },
  { value: "photos", label: "Packing Photos" },
  { value: "other", label: "Other" },
];

const VISIBILITY = [
  { value: "internal", label: "Internal" },
  { value: "customer", label: "Customer-visible" },
];

const MOCK_SHIPMENT = {
  id: "shp-2011",
  shipmentNo: "SHP-000311",
  dispatchNo: "DSP-000214",
  dispatchId: "dq-1001",
  carrier: "Blue Dart",
  trackingNo: "BD123456789",
};

const MOCK_DOCS = [
  {
    id: "doc-1",
    type: "packing_list",
    name: "Packing_List_SHP-000311.pdf",
    source: "generated",
    visibility: "customer",
    sizeKb: 186,
    createdAt: "2026-01-05 11:40",
    url: "#",
  },
  {
    id: "doc-2",
    type: "invoice",
    name: "Invoice_INV-00912.pdf",
    source: "uploaded",
    visibility: "customer",
    sizeKb: 244,
    createdAt: "2026-01-05 12:05",
    url: "#",
  },
  {
    id: "doc-3",
    type: "coc",
    name: "CoC_Batch-LOT-1182.pdf",
    source: "uploaded",
    visibility: "customer",
    sizeKb: 92,
    createdAt: "2026-01-05 13:10",
    url: "#",
  },
  {
    id: "doc-4",
    type: "photos",
    name: "Packing_Photos_Gallery",
    source: "link",
    visibility: "internal",
    sizeKb: 0,
    createdAt: "2026-01-05 14:02",
    url: "#",
  },
];

function Badge({ tone = "gray", children }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return <span className={cx(base, tones[tone] || tones.gray)}>{children}</span>;
}

function typeLabel(value) {
  return DOC_TYPES.find((t) => t.value === value)?.label ?? value;
}

function typeIcon(type) {
  if (type === "photos") return ImageIcon;
  return FileText;
}

function visibilityTone(v) {
  return v === "customer" ? "green" : "gray";
}

function sourceTone(v) {
  if (v === "generated") return "violet";
  if (v === "uploaded") return "blue";
  if (v === "link") return "amber";
  return "gray";
}

function bytesLabelFromKb(kb) {
  if (!kb) return "—";
  const b = kb * 1024;
  if (b < 1024) return `${b} B`;
  const mb = b / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
}

export default function ShipmentDocuments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(null);
  const [docs, setDocs] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  // upload/link form
  const [mode, setMode] = useState("upload"); // upload | link
  const [docType, setDocType] = useState("packing_list");
  const [visibility, setVisibility] = useState("customer");
  const [file, setFile] = useState(null);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // confirmation
  const [confirm, setConfirm] = useState({ open: false, docId: null });

  useEffect(() => {
    // TODO: Replace with API calls
    // shipmentService.getById(id)
    // shipmentDocsService.list(id)
    setLoading(true);
    const t = setTimeout(() => {
      setShipment({ ...MOCK_SHIPMENT, id: id || MOCK_SHIPMENT.id });
      setDocs(MOCK_DOCS);
      setLoading(false);
    }, 250);

    return () => clearTimeout(t);
  }, [id]);

  const filteredDocs = useMemo(() => {
    const query = q.trim().toLowerCase();
    return docs.filter((d) => {
      const byQ =
        !query ||
        d.name.toLowerCase().includes(query) ||
        typeLabel(d.type).toLowerCase().includes(query) ||
        (d.source || "").toLowerCase().includes(query);

      const byType = typeFilter === "all" ? true : d.type === typeFilter;
      const byVis = visibilityFilter === "all" ? true : d.visibility === visibilityFilter;

      return byQ && byType && byVis;
    });
  }, [docs, q, typeFilter, visibilityFilter]);

  const headerTitle = shipment?.shipmentNo ? `Documents • ${shipment.shipmentNo}` : "Shipment Documents";

  const copy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: label, description: text });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setDocType("packing_list");
    setVisibility("customer");
    setFile(null);
    setLinkName("");
    setLinkUrl("");
  };

  const validateAndSubmit = async () => {
    if (mode === "upload") {
      if (!file) {
        toast({ title: "Missing file", description: "Please select a file to upload.", variant: "destructive" });
        return;
      }
    } else {
      if (!linkName.trim() || !linkUrl.trim()) {
        toast({
          title: "Missing link details",
          description: "Please provide link name and URL.",
          variant: "destructive",
        });
        return;
      }
      try {
        // basic URL validation
        // eslint-disable-next-line no-new
        new URL(linkUrl);
      } catch {
        toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
        return;
      }
    }

    try {
      // TODO:
      // if upload => shipmentDocsService.upload(id, file, { type: docType, visibility })
      // if link => shipmentDocsService.addLink(id, { name: linkName, url: linkUrl, type: docType, visibility })
      await new Promise((r) => setTimeout(r, 250));

      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const newDoc =
        mode === "upload"
          ? {
              id: `doc-${Date.now()}`,
              type: docType,
              name: file?.name || "Document",
              source: "uploaded",
              visibility,
              sizeKb: Math.max(1, Math.round((file?.size || 1024) / 1024)),
              createdAt: now,
              url: "#",
            }
          : {
              id: `doc-${Date.now()}`,
              type: docType,
              name: linkName.trim(),
              source: "link",
              visibility,
              sizeKb: 0,
              createdAt: now,
              url: linkUrl.trim(),
            };

      setDocs((prev) => [newDoc, ...prev]);
      resetForm();

      toast({
        title: "Added",
        description: mode === "upload" ? "Document uploaded successfully." : "Link added successfully.",
      });
    } catch {
      toast({ title: "Failed", description: "Could not add document. Try again.", variant: "destructive" });
    }
  };

  const requestDelete = (docId) => setConfirm({ open: true, docId });

  const confirmDelete = async () => {
    const docId = confirm.docId;
    setConfirm({ open: false, docId: null });
    if (!docId) return;

    try {
      // TODO: shipmentDocsService.remove(id, docId)
      await new Promise((r) => setTimeout(r, 250));
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast({ title: "Deleted", description: "Document removed from shipment." });
    } catch {
      toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const openDoc = (doc) => {
    if (doc.source === "link") {
      window.open(doc.url, "_blank", "noopener,noreferrer");
      return;
    }
    toast({ title: "Preview", description: "Hook document preview from backend (signed URL)." });
  };

  const downloadDoc = (doc) => {
    // TODO: shipmentDocsService.download(id, doc.id)
    toast({ title: "Download", description: "Hook document download from backend." });
  };

  const printDoc = (doc) => {
    toast({ title: "Print", description: "Hook printable view / PDF stream from backend." });
  };

  const syncFromDispatch = () => {
    toast({
      title: "Sync from Dispatch",
      description: "Hook: attach CoC/Test docs auto from dispatch/quality certificates.",
    });
  };

  if (loading || !shipment) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-10 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="secondary" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">{headerTitle}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>Dispatch:</span>
              <Link className="font-semibold text-[#dc2551] hover:underline" to={`/logistics/dispatch/${shipment.dispatchId}`}>
                {shipment.dispatchNo}
              </Link>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-2">
                <span className="text-gray-500">Tracking:</span>
                <button
                  className="inline-flex items-center gap-2 font-semibold text-gray-900 hover:text-[#dc2551]"
                  onClick={() => copy(shipment.trackingNo, "Tracking copied")}
                >
                  {shipment.trackingNo || "—"}
                  <ClipboardCopy className="h-4 w-4 text-gray-400" />
                </button>
              </span>
              <Badge tone="gray">{shipment.carrier}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={syncFromDispatch}>
            <RefreshCcw className="h-4 w-4" />
            Sync from Dispatch
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => {
              const el = document.getElementById("add-doc");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label>Search</Label>
              <div className="mt-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, type, source..."
                />
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <div className="mt-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Visibility</Label>
              <div className="mt-2">
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {VISIBILITY.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{filteredDocs.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{docs.length}</span>
          </div>
        </div>
      </Card>

      {/* Documents table */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ShieldCheck className="h-4 w-4 text-[#dc2551]" />
              Shipment Document Set
            </div>
            <Badge tone="gray">PCBxpress</Badge>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Maintain dispatch packet docs: CoC/Test reports, invoice/packing list, label/AWB, packing photos.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Document</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Visibility</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Size</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">
                    No documents match your filters.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const Icon = typeIcon(doc.type);
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551] ring-1 ring-inset ring-[#dc2551]/15">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{doc.name}</div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              {doc.source === "link" ? (
                                <span className="inline-flex items-center gap-1">
                                  <Link2 className="h-3.5 w-3.5" />
                                  External link
                                </span>
                              ) : doc.source === "generated" ? (
                                "Generated by ERP"
                              ) : (
                                "Uploaded file"
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-700">{typeLabel(doc.type)}</td>

                      <td className="px-5 py-3">
                        <Badge tone={visibilityTone(doc.visibility)}>
                          {doc.visibility === "customer" ? "Customer" : "Internal"}
                        </Badge>
                      </td>

                      <td className="px-5 py-3">
                        <Badge tone={sourceTone(doc.source)}>
                          {doc.source.charAt(0).toUpperCase() + doc.source.slice(1)}
                        </Badge>
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-600">{doc.createdAt}</td>

                      <td className="px-5 py-3 text-right text-sm text-gray-700">
                        {bytesLabelFromKb(doc.sizeKb)}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm" className="gap-2" onClick={() => openDoc(doc)}>
                            <Eye className="h-4 w-4" />
                            View
                          </Button>

                          <Button variant="secondary" size="sm" className="gap-2" onClick={() => downloadDoc(doc)}>
                            <Download className="h-4 w-4" />
                            Download
                          </Button>

                          <Button variant="secondary" size="sm" className="gap-2" onClick={() => printDoc(doc)}>
                            <Printer className="h-4 w-4" />
                            Print
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => requestDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add document */}
      <motion.div
        id="add-doc"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Add Document</h2>
              <p className="text-xs text-gray-500">
                Upload a file or attach an external link (Drive/SharePoint/etc.) to the shipment packet.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={mode === "upload" ? "default" : "secondary"}
                className={cx(mode === "upload" ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                onClick={() => {
                  setMode("upload");
                  resetForm();
                }}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload
              </Button>

              <Button
                variant={mode === "link" ? "default" : "secondary"}
                className={cx(mode === "link" ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                onClick={() => {
                  setMode("link");
                  resetForm();
                }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Link
              </Button>

              <Button variant="secondary" className="gap-2" onClick={syncFromDispatch}>
                <RefreshCcw className="h-4 w-4" />
                Auto-attach Quality Docs
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Document Type</Label>
              <div className="mt-2">
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Visibility</Label>
              <div className="mt-2">
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "upload" ? (
              <div>
                <Label>File</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.doc,.docx"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Allowed: PDF, images, CSV/XLSX, DOC/DOCX. (Backend should enforce limits)
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label>Link Name</Label>
                  <div className="mt-2">
                    <Input
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      placeholder="e.g., Packing Photos (Drive folder)"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>URL</Label>
                  <div className="mt-2">
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileDown className="h-4 w-4" />
              <span>Tip: auto-generate packing list/invoice/label from dispatch to keep docs consistent.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={resetForm}>
                Reset
              </Button>
              <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={validateAndSubmit}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((p) => ({ ...p, open }))}
        title="Delete document?"
        description="This will detach the document from the shipment. (If stored in a central DMS, only the link/association is removed.)"
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
