// src/pages/sales/rfq/RFQEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Save,
  Plus,
  Trash2,
  Upload,
  ClipboardCopy,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import rfqApi from "@/services/rfq.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDateISO(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeRfqPayload(data) {
  // Supports:
  // { rfq: {...} } OR { data: {...} } OR direct rfq object
  const rfq = data?.rfq ?? data?.data ?? data ?? null;
  if (!rfq) return null;

  const linesRaw = rfq.lines ?? rfq.items ?? rfq.requirements ?? [];
  const attachmentsRaw = rfq.attachments ?? rfq.files ?? [];

  return {
    id: rfq.id ?? rfq._id ?? rfq.rfq_id ?? "",
    rfqNo: rfq.rfq_no ?? rfq.rfqNo ?? rfq.number ?? "",
    rfqDate: rfq.rfq_date ?? rfq.rfqDate ?? rfq.date ?? "",
    status: rfq.status ?? "Open",
    priority: rfq.priority ?? "Normal",
    currency: rfq.currency ?? "INR",

    customerName:
      rfq.customer?.name ??
      rfq.customer_name ??
      rfq.customerName ??
      (rfq.customer_id ? `Customer #${rfq.customer_id}` : ""),
    contactName: rfq.contact_name ?? rfq.contactName ?? rfq.customer?.contact_name ?? "",
    contactEmail: rfq.contact_email ?? rfq.contactEmail ?? rfq.customer?.email ?? "",
    contactPhone: rfq.contact_phone ?? rfq.contactPhone ?? rfq.customer?.phone ?? "",

    instructions: rfq.special_instructions ?? rfq.specialInstructions ?? rfq.instructions ?? "",

    // keep original objects if possible
    attachments: safeArr(attachmentsRaw).map((a) => {
      if (typeof a === "string") return { name: "", url: a };
      return {
        name: a.name ?? a.filename ?? a.original_name ?? "",
        url: a.url ?? a.download_url ?? a.href ?? "",
      };
    }),

    lines: safeArr(linesRaw).map((l, idx) => ({
      id: l.id ?? l._id ?? `line-${idx}`,
      pcbType: l.pcb_type ?? l.pcbType ?? "FR4",
      layers: String(l.layers ?? l.layer_count ?? l.layerCount ?? "2"),
      thicknessMm: String(l.thickness_mm ?? l.thicknessMm ?? "1.6"),
      copperOz: String(l.copper_oz ?? l.copperOz ?? "1"),
      finish: l.finish ?? "HASL",
      solderMask: l.solder_mask ?? l.solderMask ?? "Green",
      silkscreen: l.silkscreen ?? "White",
      panelization: l.panelization ?? "Single",
      qty: String(l.qty ?? l.quantity ?? "10"),
      unit: l.unit ?? "PCS",
      deliveryDays: String(l.delivery_days ?? l.deliveryDays ?? "7"),
      notes: l.notes ?? l.note ?? "",
    })),
  };
}

function emptyLine() {
  return {
    id: `tmp-${Math.random().toString(16).slice(2)}`,
    pcbType: "FR4",
    layers: "2",
    thicknessMm: "1.6",
    copperOz: "1",
    finish: "HASL",
    solderMask: "Green",
    silkscreen: "White",
    panelization: "Single",
    qty: "10",
    unit: "PCS",
    deliveryDays: "7",
    notes: "",
  };
}

function buildUpdatePayload(form) {
  // Keep it backend-friendly. Your backend can map these.
  return {
    rfq_no: form.rfqNo,
    rfq_date: form.rfqDate,
    status: form.status,
    priority: form.priority,
    currency: form.currency,

    customer_name: form.customerName,
    contact_name: form.contactName,
    contact_email: form.contactEmail,
    contact_phone: form.contactPhone,

    special_instructions: form.instructions,

    // Attachments: just store urls + names
    attachments: form.attachments
      .filter((a) => a.url || a.name)
      .map((a) => ({ name: a.name, url: a.url })),

    // Lines
    lines: form.lines.map((l) => ({
      id: l.id?.startsWith("tmp-") ? undefined : l.id,
      pcb_type: l.pcbType,
      layers: Number(l.layers || 0),
      thickness_mm: Number(l.thicknessMm || 0),
      copper_oz: Number(l.copperOz || 0),
      finish: l.finish,
      solder_mask: l.solderMask,
      silkscreen: l.silkscreen,
      panelization: l.panelization,
      qty: Number(l.qty || 0),
      unit: l.unit,
      delivery_days: Number(l.deliveryDays || 0),
      notes: l.notes,
    })),
  };
}

export default function RFQEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    rfqNo: "",
    rfqDate: "",
    status: "Open",
    priority: "Normal",
    currency: "INR",

    customerName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",

    instructions: "",
    attachments: [],
    lines: [emptyLine()],
  });

  const [initialLoaded, setInitialLoaded] = useState(false);

  const totals = useMemo(() => {
    const totalQty = form.lines.reduce((sum, l) => sum + Number(l.qty || 0), 0);
    const uniqueLayers = Array.from(new Set(form.lines.map((l) => Number(l.layers || 0)).filter(Boolean)));
    return { totalQty, uniqueLayers };
  }, [form.lines]);

  const loadRfq = async () => {
    setLoading(true);
    try {
      const res = await rfqApi.getById(id);
      const normalized = normalizeRfqPayload(res?.data);
      if (!normalized) throw new Error("RFQ not found");

      setForm((prev) => ({
        ...prev,
        rfqNo: normalized.rfqNo || prev.rfqNo,
        rfqDate: fmtDateISO(normalized.rfqDate) || fmtDateISO(new Date()),
        status: normalized.status || "Open",
        priority: normalized.priority || "Normal",
        currency: normalized.currency || "INR",

        customerName: normalized.customerName || "",
        contactName: normalized.contactName || "",
        contactEmail: normalized.contactEmail || "",
        contactPhone: normalized.contactPhone || "",

        instructions: normalized.instructions || "",
        attachments: normalized.attachments || [],
        lines: normalized.lines?.length ? normalized.lines : [emptyLine()],
      }));

      setInitialLoaded(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load RFQ.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Optional: support query param prefill (e.g., ?customer=ABC) if you later implement RFQCreate
  useEffect(() => {
    if (!initialLoaded) return;
    const customer = searchParams.get("customer");
    if (customer) setForm((p) => ({ ...p, customerName: customer }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoaded]);

  const update = (patch) => setForm((p) => ({ ...p, ...patch }));

  const updateLine = (lineId, patch) => {
    setForm((p) => ({
      ...p,
      lines: p.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    }));
  };

  const addLine = () => setForm((p) => ({ ...p, lines: [...p.lines, emptyLine()] }));

  const removeLine = (lineId) =>
    setForm((p) => {
      const next = p.lines.filter((l) => l.id !== lineId);
      return { ...p, lines: next.length ? next : [emptyLine()] };
    });

  const addAttachmentRow = () =>
    setForm((p) => ({
      ...p,
      attachments: [...p.attachments, { name: "", url: "" }],
    }));

  const removeAttachmentRow = (idx) =>
    setForm((p) => ({
      ...p,
      attachments: p.attachments.filter((_, i) => i !== idx),
    }));

  const updateAttachmentRow = (idx, patch) =>
    setForm((p) => ({
      ...p,
      attachments: p.attachments.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));

  const validate = () => {
    if (!form.customerName?.trim()) return "Customer name is required.";
    if (!form.rfqNo?.trim()) return "RFQ number is required.";
    if (!form.rfqDate?.trim()) return "RFQ date is required.";
    if (!form.lines.length) return "At least one PCB line is required.";

    for (const [i, l] of form.lines.entries()) {
      if (!String(l.layers || "").trim()) return `Line ${i + 1}: layers is required.`;
      if (!String(l.thicknessMm || "").trim()) return `Line ${i + 1}: thickness is required.`;
      if (!String(l.copperOz || "").trim()) return `Line ${i + 1}: copper is required.`;
      if (!String(l.qty || "").trim()) return `Line ${i + 1}: qty is required.`;
    }
    return "";
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const errMsg = validate();
    if (errMsg) {
      toast({ title: "Fix required fields", description: errMsg, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = buildUpdatePayload(form);
      await rfqApi.update(id, payload);

      toast({ title: "Saved", description: "RFQ updated successfully." });
      navigate(`/sales/rfq/${id}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save RFQ.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copy = async (text, ok) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: ok || "Copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission blocked.", variant: "destructive" });
    }
  };

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

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-3">
            <FileText className="h-6 w-6 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Edit RFQ</h1>
              <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">PCB Manufacturing</Badge>
              <Badge className="rounded-full bg-gray-100 text-gray-700">
                {form.lines.length} line{form.lines.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Update customer requirements, PCB specs, instructions and attachments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/sales/rfq/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Link>
          </Button>

          <Button type="submit" className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Qty</CardTitle>
            <CardDescription>Across all lines</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{totals.totalQty || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layer Sets</CardTitle>
            <CardDescription>Unique layer counts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-gray-900">
              {totals.uniqueLayers.length ? totals.uniqueLayers.join(", ") : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RFQ Date</CardTitle>
            <CardDescription>Document date</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            {form.rfqDate || "—"}
          </CardContent>
        </Card>
      </div>

      {/* RFQ header info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">RFQ Header</CardTitle>
          <CardDescription>Number, date, status, customer</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rfqNo">RFQ Number *</Label>
            <Input
              id="rfqNo"
              value={form.rfqNo}
              onChange={(e) => update({ rfqNo: e.target.value })}
              placeholder="RFQ-2026-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rfqDate">RFQ Date *</Label>
            <Input
              id="rfqDate"
              type="date"
              value={form.rfqDate}
              onChange={(e) => update({ rfqDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              value={form.status}
              onChange={(e) => update({ status: e.target.value })}
              placeholder="Open / Quoted / Closed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              value={form.priority}
              onChange={(e) => update({ priority: e.target.value })}
              placeholder="Normal / High / Urgent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(e) => update({ currency: e.target.value })}
              placeholder="INR"
            />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor="customerName">Customer Name *</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="customerName"
                className="flex-1 min-w-[240px]"
                value={form.customerName}
                onChange={(e) => update({ customerName: e.target.value })}
                placeholder="Customer / Company"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => copy(form.customerName || "", "Customer name copied.")}
                disabled={!form.customerName}
              >
                <ClipboardCopy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Contact</CardTitle>
          <CardDescription>Optional but recommended</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={form.contactName}
              onChange={(e) => update({ contactName: e.target.value })}
              placeholder="Person name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => update({ contactEmail: e.target.value })}
              placeholder="email@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              value={form.contactPhone}
              onChange={(e) => update({ contactPhone: e.target.value })}
              placeholder="+91..."
            />
          </div>
        </CardContent>
      </Card>

      {/* PCB Lines */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">PCB Lines</CardTitle>
            <CardDescription>Add one or more PCB requirements</CardDescription>
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Add Line
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {form.lines.map((line, idx) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-white p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Line {idx + 1}</Badge>
                  <Badge className="rounded-full bg-emerald-50 text-emerald-700">{line.layers}-Layer</Badge>
                  <Badge className="rounded-full bg-blue-50 text-blue-700">{line.pcbType}</Badge>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeLine(line.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>PCB Type</Label>
                  <Input
                    value={line.pcbType}
                    onChange={(e) => updateLine(line.id, { pcbType: e.target.value })}
                    placeholder="FR4 / Rogers / Alu"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Layers *</Label>
                  <Input
                    value={line.layers}
                    onChange={(e) => updateLine(line.id, { layers: e.target.value })}
                    placeholder="2"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thickness (mm) *</Label>
                  <Input
                    value={line.thicknessMm}
                    onChange={(e) => updateLine(line.id, { thicknessMm: e.target.value })}
                    placeholder="1.6"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Copper (oz) *</Label>
                  <Input
                    value={line.copperOz}
                    onChange={(e) => updateLine(line.id, { copperOz: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Surface Finish</Label>
                  <Input
                    value={line.finish}
                    onChange={(e) => updateLine(line.id, { finish: e.target.value })}
                    placeholder="HASL / ENIG / OSP"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Solder Mask</Label>
                  <Input
                    value={line.solderMask}
                    onChange={(e) => updateLine(line.id, { solderMask: e.target.value })}
                    placeholder="Green / Black"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Silkscreen</Label>
                  <Input
                    value={line.silkscreen}
                    onChange={(e) => updateLine(line.id, { silkscreen: e.target.value })}
                    placeholder="White"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Panelization</Label>
                  <Input
                    value={line.panelization}
                    onChange={(e) => updateLine(line.id, { panelization: e.target.value })}
                    placeholder="Single / Panel"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Qty *</Label>
                  <Input
                    value={line.qty}
                    onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                    placeholder="10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={line.unit}
                    onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                    placeholder="PCS"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delivery Days</Label>
                  <Input
                    value={line.deliveryDays}
                    onChange={(e) => updateLine(line.id, { deliveryDays: e.target.value })}
                    placeholder="7"
                  />
                </div>

                <div className="space-y-2 md:col-span-3 lg:col-span-4">
                  <Label>Notes</Label>
                  <Textarea
                    value={line.notes}
                    onChange={(e) => updateLine(line.id, { notes: e.target.value })}
                    placeholder="IPC class, impedance, via type, special process notes…"
                    className="min-h-[90px]"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Special Instructions</CardTitle>
          <CardDescription>Any special process/quality/packing instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.instructions}
            onChange={(e) => update({ instructions: e.target.value })}
            placeholder="Example: IPC Class 2, impedance controlled, 100% E-Test, vacuum packing, RoHS..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Attachments (URL based) */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Attachments</CardTitle>
            <CardDescription>Gerber/ODB++ links, drawings, BOM links (URL-based for now)</CardDescription>
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={addAttachmentRow}>
            <Upload className="h-4 w-4" />
            Add Attachment
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.attachments.length === 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
              No attachments. Click “Add Attachment” to add URL links.
            </div>
          ) : (
            form.attachments.map((a, idx) => (
              <div key={idx} className="rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge className="rounded-full bg-gray-100 text-gray-700">Attachment {idx + 1}</Badge>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => removeAttachmentRow(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={a.name}
                      onChange={(e) => updateAttachmentRow(idx, { name: e.target.value })}
                      placeholder="Gerber / Drawing / BOM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={a.url}
                      onChange={(e) => updateAttachmentRow(idx, { url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Bottom actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="outline" className="gap-2" asChild>
          <Link to={`/sales/rfq/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>
        </Button>

        <Button type="submit" className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
