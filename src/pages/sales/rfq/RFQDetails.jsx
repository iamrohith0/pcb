// src/pages/sales/rfq/RFQDetails.jsx
import { motion } from "framer-motion";
import {
    ArrowLeft,
    BadgeCheck,
    Calendar,
    Check,
    ClipboardCopy,
    Download,
    Edit3,
    FileText,
    Loader2,
    Mail,
    Phone,
    Trash2,
    Truck,
    User2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import rfqApi from "@/services/sales/rfq.service";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}

function SpecPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-xs text-gray-700">
      <span className="font-semibold text-gray-900">{label}:</span>
      <span>{value ?? "—"}</span>
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return String(d);
  }
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rfq, setRfq] = useState(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const lines = useMemo(() => {
    // supports: rfq.lines, rfq.items, rfq.requirements
    const raw = rfq?.lines ?? rfq?.items ?? rfq?.requirements ?? [];
    return safeArr(raw);
  }, [rfq]);

  const header = useMemo(() => {
    const r = rfq || {};
    return {
      rfqNo: r.rfq_no ?? r.rfqNo ?? r.number ?? "",
      rfqDate: r.rfq_date ?? r.rfqDate ?? r.date ?? "",
      priority: r.priority ?? "Normal",
      status: r.status ?? "Open",
      currency: r.currency ?? "INR",
      customerName:
        r.customer?.name ??
        r.customer_name ??
        r.customerName ??
        (r.customer_id ? `Customer #${r.customer_id}` : ""),
      contactName: r.contact_name ?? r.contactName ?? r.customer?.contact_name ?? "",
      contactEmail: r.contact_email ?? r.contactEmail ?? r.customer?.email ?? "",
      contactPhone: r.contact_phone ?? r.contactPhone ?? r.customer?.phone ?? "",
      instructions: r.special_instructions ?? r.specialInstructions ?? r.instructions ?? "",
      attachments: safeArr(r.attachments ?? r.files ?? []),
    };
  }, [rfq]);

  const totals = useMemo(() => {
    // RFQ doesn't have pricing yet; still useful totals
    const totalQty = lines.reduce((sum, l) => sum + Number(l.qty ?? l.quantity ?? 0), 0);
    const uniqueLayers = Array.from(
      new Set(lines.map((l) => Number(l.layers ?? l.layer_count ?? l.layerCount ?? 0)).filter(Boolean))
    );
    return { totalQty, uniqueLayers };
  }, [lines]);

  const fetchRfq = async () => {
    setLoading(true);
    try {
      const res = await rfqApi.getById(id);
      const data = res?.data?.rfq ?? res?.data?.data ?? res?.data;
      setRfq(data || null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load RFQ.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setRfq(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyText = async (text, okMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: okMsg || "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const downloadAttachment = async (att) => {
    // supports { url, name } or just a url string
    const url = typeof att === "string" ? att : att?.url || att?.download_url || att?.href;
    const name = typeof att === "string" ? "" : att?.name || att?.filename || "attachment";

    if (!url) {
      toast({ title: "No download link", description: "This attachment has no URL.", variant: "destructive" });
      return;
    }

    // basic open in new tab (most backends require auth cookie/token; axios blob could be added later)
    window.open(url, "_blank", "noopener,noreferrer");
    toast({ title: "Downloading", description: name ? `Opening ${name}` : "Opening attachment…" });
  };

  const handleDelete = async () => {
    if (!id) return;
    setRemoving(true);
    try {
      await rfqApi.remove(id);
      toast({ title: "Deleted", description: "RFQ has been deleted." });
      navigate("/sales/rfq", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete RFQ.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setRemoving(false);
      setRemoveOpen(false);
    }
  };

  const statusBadge = useMemo(() => {
    const s = String(header.status || "Open").toLowerCase();
    if (s.includes("closed") || s.includes("lost") || s.includes("cancel")) {
      return { cls: "bg-gray-100 text-gray-700", label: header.status };
    }
    if (s.includes("quoted") || s.includes("sent")) {
      return { cls: "bg-blue-50 text-blue-700", label: header.status };
    }
    if (s.includes("won") || s.includes("ordered")) {
      return { cls: "bg-emerald-50 text-emerald-700", label: header.status };
    }
    return { cls: "bg-[#dc2551]/10 text-[#dc2551]", label: header.status || "Open" };
  }, [header.status]);

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border bg-white p-10">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading RFQ…
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="space-y-4 rounded-2xl border bg-white p-8">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#dc2551]" />
          <h2 className="text-lg font-bold text-gray-900">RFQ not found</h2>
        </div>
        <p className="text-sm text-gray-600">The RFQ you’re trying to view doesn’t exist or you don’t have access.</p>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/dashboard/sales/rfq">
            <ArrowLeft className="h-4 w-4" />
            Back to RFQs
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-3">
            <FileText className="h-6 w-6 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{header.rfqNo || `RFQ #${id}`}</h1>
              <Badge className={cx("rounded-full", statusBadge.cls)}>{statusBadge.label}</Badge>
              <Badge className="rounded-full bg-gray-100 text-gray-700">{header.priority}</Badge>
              <Badge className="rounded-full bg-emerald-50 text-emerald-700">PCB Manufacturing</Badge>
            </div>
            <p className="text-sm text-gray-500">
              View customer requirements, PCB specs, and attachments. Create quotation from this RFQ when ready.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/dashboard/sales/rfq">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => navigate(`/sales/rfq/${id}/edit`)}>
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={() => {
              // Optional route you can implement later:
              // /sales/quotations/create?fromRfq=ID
              navigate(`/sales/quotations/create?fromRfq=${encodeURIComponent(id)}`);
            }}
          >
            <BadgeCheck className="h-4 w-4" />
            Create Quotation
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setRemoveOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">RFQ Summary</CardTitle>
            <CardDescription>Customer + dates + quick totals</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wide">RFQ Date</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-900">{fmtDate(header.rfqDate) || "—"}</p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wide">Lines</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-900">{lines.length}</p>
              <p className="text-xs text-gray-500">Total Qty: {totals.totalQty || 0}</p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Check className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wide">Layer Sets</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {totals.uniqueLayers.length ? totals.uniqueLayers.join(", ") : "—"}
              </p>
              <p className="text-xs text-gray-500">Unique layer counts</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{header.customerName || "—"}</p>
                  <p className="text-xs text-gray-500">
                    {header.currency ? `Currency: ${header.currency}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copyText(header.customerName || "", "Customer name copied.")}
                  disabled={!header.customerName}
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
            <CardDescription>Customer contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border p-3">
              <User2 className="mt-0.5 h-4 w-4 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</p>
                <p className="truncate text-sm font-medium text-gray-900">{header.contactName || "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border p-3">
              <Mail className="mt-0.5 h-4 w-4 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                <p className="truncate text-sm font-medium text-gray-900">{header.contactEmail || "—"}</p>
                {header.contactEmail ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => copyText(header.contactEmail, "Email copied.")}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                      onClick={() => window.open(`mailto:${header.contactEmail}`, "_blank")}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border p-3">
              <Phone className="mt-0.5 h-4 w-4 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
                <p className="truncate text-sm font-medium text-gray-900">{header.contactPhone || "—"}</p>
                {header.contactPhone ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => copyText(header.contactPhone, "Phone copied.")}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                      onClick={() => window.open(`tel:${header.contactPhone}`, "_blank")}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PCB Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PCB Requirements</CardTitle>
          <CardDescription>All PCB spec lines captured in this RFQ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
              No PCB lines found in this RFQ.
            </div>
          ) : (
            lines.map((l, idx) => {
              const pcbType = l.pcb_type ?? l.pcbType ?? "FR4";
              const layers = l.layers ?? l.layer_count ?? l.layerCount ?? "—";
              const thickness = l.thickness_mm ?? l.thicknessMm ?? "—";
              const copper = l.copper_oz ?? l.copperOz ?? "—";
              const finish = l.finish ?? "—";
              const mask = l.solder_mask ?? l.solderMask ?? "—";
              const silk = l.silkscreen ?? "—";
              const panel = l.panelization ?? "—";
              const qty = l.qty ?? l.quantity ?? "—";
              const unit = l.unit ?? "PCS";
              const days = l.delivery_days ?? l.deliveryDays ?? "—";
              const notes = l.notes ?? l.note ?? "";

              return (
                <motion.div
                  key={l.id ?? idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-gray-100 text-gray-700">Line {idx + 1}</Badge>
                      <Badge className="rounded-full bg-emerald-50 text-emerald-700">{layers}-Layer</Badge>
                      <Badge className="rounded-full bg-blue-50 text-blue-700">{pcbType}</Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">
                        {qty} {unit}
                      </Badge>
                      <Badge className="rounded-full bg-gray-100 text-gray-700">{days} days</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <SpecPill label="Thickness" value={`${thickness} mm`} />
                    <SpecPill label="Copper" value={`${copper} oz`} />
                    <SpecPill label="Finish" value={finish} />
                    <SpecPill label="Mask" value={mask} />
                    <SpecPill label="Silk" value={silk} />
                    <SpecPill label="Panel" value={panel} />
                  </div>

                  {notes ? (
                    <div className="mt-3 rounded-xl bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                      <p className="mt-1 text-sm text-gray-700">{notes}</p>
                    </div>
                  ) : null}
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Instructions + Attachments */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Special Instructions</CardTitle>
            <CardDescription>Process notes, IPC class, impedance, packaging, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-white p-4 text-sm text-gray-700">
              {header.instructions || <span className="text-gray-500">No special instructions.</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attachments</CardTitle>
            <CardDescription>Gerber / ODB++, drill, drawings, BOM, etc.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {header.attachments.length === 0 ? (
              <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
                No attachments uploaded.
              </div>
            ) : (
              header.attachments.map((a, idx) => {
                const name =
                  typeof a === "string"
                    ? `Attachment ${idx + 1}`
                    : a.name || a.filename || a.original_name || `Attachment ${idx + 1}`;

                const url =
                  typeof a === "string" ? a : a.url || a.download_url || a.href;

                return (
                  <div key={idx} className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                      <p className="truncate text-xs text-gray-500">{url ? url : "No URL"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => copyText(url || name, "Attachment info copied.")}
                      >
                        <ClipboardCopy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                        onClick={() => downloadAttachment(a)}
                        disabled={!url}
                      >
                        <Download className="h-4 w-4" />
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RFQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{header.rfqNo || `RFQ #${id}`}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
