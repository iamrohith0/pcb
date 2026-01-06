// src/pages/quality/ncr/NCRDisposition.jsx
import {
    ArrowLeft,
    BadgeCheck,
    ClipboardCheck,
    FileDown,
    Link2,
    RefreshCcw,
    Save,
    ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import ncrService from "@/services/quality/ncr.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  open: { label: "Open", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  under_review: { label: "Under Review", className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  dispositioned: { label: "Dispositioned", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  closed: { label: "Closed", className: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  rejected: { label: "Rejected", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

const SEVERITY_META = {
  minor: { label: "Minor", className: "bg-gray-100 text-gray-700" },
  major: { label: "Major", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  critical: { label: "Critical", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

const DISPOSITION_OPTIONS = [
  { value: "rework", label: "Rework" },
  { value: "scrap", label: "Scrap" },
  { value: "use_as_is", label: "Use As Is" },
  { value: "return_to_supplier", label: "Return to Supplier" },
  { value: "regrade", label: "Re-grade / Down-grade" },
  { value: "hold", label: "Hold / Quarantine" },
  { value: "other", label: "Other" },
];

function Pill({ children, className }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm text-gray-900">{value ?? "—"}</div>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function NCRDisposition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [row, setRow] = useState(null);

  const [form, setForm] = useState({
    status: "under_review",
    disposition: "",
    disposition_notes: "",
    scrap_qty: "",
    rework_qty: "",
    uai_qty: "", // use-as-is qty
    hold_qty: "",
    due_date: "",
    owner_id: "",
  });

  const statusPill = useMemo(() => {
    const meta = STATUS_META[row?.status] || { label: row?.status || "—", className: "bg-gray-100 text-gray-700" };
    return (
      <Pill className={meta.className}>
        <ShieldCheck className="h-4 w-4" />
        {meta.label}
      </Pill>
    );
  }, [row?.status]);

  const severityPill = useMemo(() => {
    const meta =
      SEVERITY_META[row?.severity] || { label: row?.severity || "—", className: "bg-gray-100 text-gray-700" };
    return (
      <Pill className={meta.className}>
        <BadgeCheck className="h-4 w-4" />
        {meta.label}
      </Pill>
    );
  }, [row?.severity]);

  const fetchNcr = async () => {
    setLoading(true);
    try {
      const res = await ncrService.get(id);
      const payload = res?.data ?? res;
      const data = payload?.data || payload;

      setRow(data || null);

      setForm({
        status: data?.status || "under_review",
        disposition: data?.disposition || "",
        disposition_notes: data?.disposition_notes || "",
        scrap_qty: data?.scrap_qty != null ? String(data.scrap_qty) : "",
        rework_qty: data?.rework_qty != null ? String(data.rework_qty) : "",
        uai_qty: data?.uai_qty != null ? String(data.uai_qty) : "",
        hold_qty: data?.hold_qty != null ? String(data.hold_qty) : "",
        due_date: data?.due_date ? String(data.due_date).slice(0, 10) : "",
        owner_id: data?.owner_id || "",
      });
    } catch (err) {
      toast({
        title: "Failed to load NCR",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNcr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const qtySum = useMemo(() => {
    const n = (v) => {
      const x = Number(v);
      return Number.isFinite(x) ? x : 0;
    };
    return n(form.scrap_qty) + n(form.rework_qty) + n(form.uai_qty) + n(form.hold_qty);
  }, [form.scrap_qty, form.rework_qty, form.uai_qty, form.hold_qty]);

  const orderQty = Number(row?.qty || 0) || 0;
  const qtyWarn = orderQty > 0 && qtySum > orderQty;

  const canSave = useMemo(() => {
    if (!row) return false;
    if (!form.disposition) return false;
    if (qtyWarn) return false;
    return true;
  }, [row, form.disposition, qtyWarn]);

  const handleSave = async () => {
    if (!canSave) {
      toast({
        title: "Cannot save",
        description: qtyWarn
          ? "Disposition quantities exceed the NCR quantity."
          : "Please select a disposition.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        status: form.status,
        disposition: form.disposition,
        disposition_notes: form.disposition_notes,
        scrap_qty: form.scrap_qty === "" ? null : Number(form.scrap_qty),
        rework_qty: form.rework_qty === "" ? null : Number(form.rework_qty),
        uai_qty: form.uai_qty === "" ? null : Number(form.uai_qty),
        hold_qty: form.hold_qty === "" ? null : Number(form.hold_qty),
        due_date: form.due_date || null,
        owner_id: form.owner_id || null,
      };

      // You can also create a dedicated endpoint later:
      // await ncrService.updateDisposition(id, payload)
      await ncrService.update(id, payload);

      toast({ title: "Disposition saved", description: "NCR disposition updated successfully." });
      navigate(`/quality/ncr/${id}`);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const res = await ncrService.exportPdf(id);
      const blob = res?.data instanceof Blob ? res.data : null;

      if (!blob) {
        toast({
          title: "Download failed",
          description: "Export endpoint did not return a blob. Check backend responseType.",
          variant: "destructive",
        });
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${row?.ncr_no || "NCR"}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "PDF export failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {row?.ncr_no ? `Disposition — ${row.ncr_no}` : "NCR Disposition"}
              </h1>
              {row?.status && statusPill}
              {row?.severity && severityPill}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Record the official disposition (Rework / Scrap / Use-As-Is / Return) and quantities for traceability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchNcr} className="gap-2" disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" className="gap-2" onClick={downloadPdf} disabled={!row}>
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>

          <Link to={`/quality/ncr/${id}`} className="inline-flex">
            <Button variant="outline" className="gap-2">
              <Link2 className="h-4 w-4" />
              View Details
            </Button>
          </Link>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSave}
            disabled={!canSave || saving || loading}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Disposition"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
          </div>
        </Card>
      ) : !row ? (
        <Card className="p-10 text-center text-sm text-gray-500">NCR not found.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: Disposition form */}
          <div className="space-y-5 lg:col-span-8">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700 ring-1 ring-indigo-100">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Disposition Decision</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    Choose the final disposition and provide notes. Quantities help WIP + inventory reconciliation.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-6">
                  <Label>Status (after decision)</Label>
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                    value={form.status}
                    onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="under_review">Under Review</option>
                    <option value="dispositioned">Dispositioned</option>
                    <option value="closed">Closed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="md:col-span-6">
                  <Label>Disposition</Label>
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                    value={form.disposition}
                    onChange={(e) => setForm((s) => ({ ...s, disposition: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="">Select disposition</option>
                    {DISPOSITION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-12">
                  <Label>Disposition Notes</Label>
                  <textarea
                    className="mt-1 min-h-[110px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                    value={form.disposition_notes}
                    onChange={(e) => setForm((s) => ({ ...s, disposition_notes: e.target.value }))}
                    placeholder="Explain why this decision was taken (customer concession, IPC criteria, rework plan, scrap reason, supplier return details...)"
                    disabled={saving}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Disposition Quantities</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    Enter quantities affected by each action. Total should not exceed NCR quantity.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">NCR Qty: {row?.qty ?? "—"}</Badge>
                  <Badge variant="secondary">Sum: {qtySum}</Badge>
                </div>
              </div>

              {qtyWarn && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  The sum of quantities ({qtySum}) exceeds NCR quantity ({orderQty}). Please adjust.
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-3">
                  <Label>Rework Qty</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    value={form.rework_qty}
                    onChange={(e) => setForm((s) => ({ ...s, rework_qty: e.target.value }))}
                    placeholder="0"
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label>Scrap Qty</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    value={form.scrap_qty}
                    onChange={(e) => setForm((s) => ({ ...s, scrap_qty: e.target.value }))}
                    placeholder="0"
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label>Use-As-Is Qty</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    value={form.uai_qty}
                    onChange={(e) => setForm((s) => ({ ...s, uai_qty: e.target.value }))}
                    placeholder="0"
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label>Hold Qty</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    value={form.hold_qty}
                    onChange={(e) => setForm((s) => ({ ...s, hold_qty: e.target.value }))}
                    placeholder="0"
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-6">
                  <Label>Due Date (if action required)</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((s) => ({ ...s, due_date: e.target.value }))}
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-6">
                  <Label>Owner (User ID)</Label>
                  <Input
                    className="mt-1"
                    value={form.owner_id}
                    onChange={(e) => setForm((s) => ({ ...s, owner_id: e.target.value }))}
                    placeholder="e.g., 12"
                    disabled={saving}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Replace with a user dropdown later (from /admin/users).
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: NCR context */}
          <div className="space-y-5 lg:col-span-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">NCR Context</div>
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <BadgeCheck className="h-4 w-4" />
                  Traceable
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <Field label="Job No" value={row?.job_no} />
                <Field label="Work Order" value={row?.work_order_no} />
                <Field label="Customer" value={row?.customer_name} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Part No" value={row?.part_no} />
                  <Field label="Revision" value={row?.revision} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Layers" value={row?.layer_count} />
                  <Field label="Qty" value={row?.qty} />
                  <Field label="UOM" value={row?.uom} />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm font-semibold text-gray-900">Defect</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Defect Code</span>
                  <span className="font-medium text-gray-900">{row?.defect_code || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Area</span>
                  <span className="font-medium text-gray-900">{row?.defect_area || "—"}</span>
                </div>
                <div className="pt-2 text-gray-700">{row?.defect_desc || "—"}</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm font-semibold text-gray-900">Timeline</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Detected</span>
                  <span className="font-medium text-gray-900">{formatDate(row?.detected_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium text-gray-900">{formatDate(row?.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium text-gray-900">{formatDate(row?.updated_at)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
