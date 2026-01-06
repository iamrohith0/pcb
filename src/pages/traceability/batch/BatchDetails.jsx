// src/pages/traceability/batch/BatchDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Barcode,
  Boxes,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Layers,
  Package,
  RefreshCcw,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import api from "@/lib/axios";

/**
 * PCBxpress - Traceability / Batch Details
 *
 * Expected API (adjust if your backend differs):
 *  GET /traceability/batches/:id
 *
 * Recommended response shape:
 * {
 *   data: {
 *     id, batch_no, status, created_at,
 *     product: { code, name, revision, layers, finish },
 *     work_order: { id, number },
 *     routing_step: { code, name },
 *     quantity: { input, good, reject, rework, uom },
 *     plant: { name }, warehouse: { name },
 *     lots: [{ id, lot_no, type, qty, uom, status }],
 *     materials: [{ id, code, name, lot_no, qty, uom }],
 *     tests: [{ id, type, result, report_no, performed_at }],
 *     shipments: [{ id, shipment_no, qty, uom, customer_name, shipped_at }],
 *     events: [{ id, at, type, message, actor }]
 *   }
 * }
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return safeText(v);
  return d.toLocaleString();
}

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();

  const map = {
    active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: CheckCircle2 },
    released: { label: "Released", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: CheckCircle2 },
    hold: { label: "On Hold", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", icon: ShieldCheck },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 ring-1 ring-red-200", icon: XCircle },
    closed: { label: "Closed", cls: "bg-gray-100 text-gray-700 ring-1 ring-gray-200", icon: CheckCircle2 },
    wip: { label: "WIP", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", icon: Layers },
  };

  const cfg = map[s] || { label: status || "—", cls: "bg-gray-100 text-gray-700 ring-1 ring-gray-200", icon: ClipboardList };
  const Icon = cfg.icon;

  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", cfg.cls)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
        {Icon ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <Icon className="h-5 w-5 text-[#dc2551]" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function BatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [batch, setBatch] = useState(null);

  // Local filter for events list
  const [eventQuery, setEventQuery] = useState("");

  const headerTitle = useMemo(() => {
    const bno = batch?.batch_no || batch?.batchNo || id;
    return `Batch ${bno}`;
  }, [batch, id]);

  async function fetchBatch() {
    setLoading(true);
    try {
      const res = await api.get(`/traceability/batches/${id}`);
      const data = res?.data?.data ?? res?.data;
      setBatch(data || null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load batch",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  const qty = batch?.quantity || {};
  const uom = qty?.uom || batch?.uom || "pcs";

  const events = Array.isArray(batch?.events) ? batch.events : [];
  const filteredEvents = useMemo(() => {
    const q = eventQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      const hay = `${safeText(e?.type)} ${safeText(e?.message)} ${safeText(e?.actor)} ${safeText(e?.at)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [events, eventQuery]);

  const lots = Array.isArray(batch?.lots) ? batch.lots : [];
  const materials = Array.isArray(batch?.materials) ? batch.materials : [];
  const tests = Array.isArray(batch?.tests) ? batch.tests : [];
  const shipments = Array.isArray(batch?.shipments) ? batch.shipments : [];

  const product = batch?.product || {};
  const wo = batch?.work_order || batch?.workOrder || null;
  const step = batch?.routing_step || batch?.routingStep || null;

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

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
                <StatusPill status={batch?.status} />
              </div>
              <p className="text-sm text-gray-600">
                End-to-end traceability for PCB manufacturing batches: routing → lots → materials → tests → shipments.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Created: {fmtDate(batch?.created_at || batch?.createdAt)}
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Barcode className="h-3.5 w-3.5" />
              Trace ID: {safeText(batch?.id || id)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="gap-2"
            disabled={loading}
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCcw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          {wo?.id ? (
            <Link to={`/production/work-orders/${wo.id}`}>
              <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
                <ClipboardList className="h-4 w-4" />
                View Work Order
              </Button>
            </Link>
          ) : (
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" disabled>
              <ClipboardList className="h-4 w-4" />
              Work Order
            </Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-3">
          <Stat label="Input Qty" value={`${safeText(qty?.input ?? batch?.qty_input ?? "—")} ${uom}`} icon={Package} />
        </div>
        <div className="md:col-span-3">
          <Stat label="Good Qty" value={`${safeText(qty?.good ?? batch?.qty_good ?? "—")} ${uom}`} icon={CheckCircle2} />
        </div>
        <div className="md:col-span-3">
          <Stat label="Reject Qty" value={`${safeText(qty?.reject ?? batch?.qty_reject ?? "—")} ${uom}`} icon={XCircle} />
        </div>
        <div className="md:col-span-3">
          <Stat label="Rework Qty" value={`${safeText(qty?.rework ?? batch?.qty_rework ?? "—")} ${uom}`} icon={ShieldCheck} />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Batch & product */}
        <Card className="p-4 lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-900">Batch & Product</h2>
              <p className="text-xs text-gray-500">PCB identity, revision, and routing step context.</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
              <Layers className="h-5 w-5 text-[#dc2551]" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Batch No</p>
              <p className="mt-1 font-semibold text-gray-900">{safeText(batch?.batch_no || batch?.batchNo || "—")}</p>
            </div>

            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current Step</p>
              <p className="mt-1 font-semibold text-gray-900">
                {step ? `${safeText(step?.code || "")} ${safeText(step?.name || "")}`.trim() : "—"}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Product</p>
              <p className="mt-1 font-semibold text-gray-900">{safeText(product?.name || batch?.product_name || "—")}</p>
              <p className="mt-1 text-xs text-gray-500">
                Code: <span className="font-medium text-gray-700">{safeText(product?.code || batch?.product_code || "—")}</span>
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Spec</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">Rev {safeText(product?.revision || batch?.revision || "—")}</Badge>
                <Badge variant="secondary">{safeText(product?.layers || batch?.layers || "—")} Layers</Badge>
                <Badge variant="secondary">{safeText(product?.finish || batch?.finish || "—")}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plant</p>
              <p className="mt-1 font-semibold text-gray-900">{safeText(batch?.plant?.name || batch?.plant_name || "—")}</p>
            </div>

            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Warehouse</p>
              <p className="mt-1 font-semibold text-gray-900">
                {safeText(batch?.warehouse?.name || batch?.warehouse_name || "—")}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Work Order</p>
              {wo?.id ? (
                <Link
                  to={`/production/work-orders/${wo.id}`}
                  className="mt-1 inline-flex items-center gap-2 font-semibold text-[#dc2551] hover:underline"
                >
                  <ClipboardList className="h-4 w-4" />
                  {safeText(wo?.number || wo?.work_order_no || wo?.wo_no || wo?.id)}
                </Link>
              ) : (
                <p className="mt-1 font-semibold text-gray-900">—</p>
              )}
            </div>
          </div>
        </Card>

        {/* Quick relations */}
        <Card className="p-4 lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-900">Trace Links</h2>
              <p className="text-xs text-gray-500">Lots, materials, tests, and shipments connected to this batch.</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
              <Boxes className="h-5 w-5 text-[#dc2551]" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lots</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{lots.length}</p>
              <p className="text-xs text-gray-500">Copper, laminate, soldermask, WIP, FG etc.</p>
            </div>

            <div className="rounded-2xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Material Issues</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{materials.length}</p>
              <p className="text-xs text-gray-500">Issued/consumed lots for this batch.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tests</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{tests.length}</p>
              </div>
              <div className="rounded-2xl border bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shipments</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{shipments.length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Lots table */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Lots</h3>
            <p className="text-xs text-gray-500">Material/WIP/FG lots linked to this batch</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Lot No</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 w-40 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : lots.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                    No lots linked to this batch.
                  </td>
                </tr>
              ) : (
                lots.map((l) => (
                  <tr key={l.id || l.lot_no} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {safeText(l?.lot_no || l?.lotNo || l?.code || "—")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{safeText(l?.type || "—")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {safeText(l?.qty ?? l?.quantity ?? "—")} {safeText(l?.uom || uom)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-700">
                        {safeText(l?.status || "—")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Materials table */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Material Consumption</h3>
            <p className="text-xs text-gray-500">Issued/consumed lots and quantities for this batch</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 w-56 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-40 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : materials.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                    No material issues/consumption recorded for this batch.
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id || `${m.code}-${m.lot_no}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{safeText(m?.name || "—")}</td>
                    <td className="px-4 py-3 text-gray-700">{safeText(m?.code || "—")}</td>
                    <td className="px-4 py-3 text-gray-700">{safeText(m?.lot_no || m?.lotNo || "—")}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {safeText(m?.qty ?? m?.quantity ?? "—")} {safeText(m?.uom || "—")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tests & Shipments */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="overflow-hidden lg:col-span-6">
          <div className="border-b bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Quality Tests</h3>
              <p className="text-xs text-gray-500">AOI / E-Test / Inspection outcomes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Report</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-4 w-28 rounded bg-gray-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-28 rounded bg-gray-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : tests.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                      No tests recorded.
                    </td>
                  </tr>
                ) : (
                  tests.map((t) => {
                    const pass =
                      (safeText(t?.result).toLowerCase() === "pass") ||
                      (safeText(t?.result).toLowerCase() === "passed") ||
                      t?.passed === true;

                    return (
                      <tr key={t.id || `${t.type}-${t.performed_at}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{safeText(t?.type || "—")}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cx(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                              pass
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-red-50 text-red-700 ring-1 ring-red-200"
                            )}
                          >
                            {pass ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {safeText(t?.result || (pass ? "PASS" : "FAIL"))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{safeText(t?.report_no || t?.reportNo || "—")}</td>
                        <td className="px-4 py-3 text-gray-700">{fmtDate(t?.performed_at || t?.performedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden lg:col-span-6">
          <div className="border-b bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Shipments</h3>
              <p className="text-xs text-gray-500">Dispatch history for finished goods from this batch</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Shipment</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-4 w-28 rounded bg-gray-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 rounded bg-gray-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : shipments.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                      No shipments recorded.
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id || s.shipment_no} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{safeText(s?.shipment_no || s?.shipmentNo || "—")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{safeText(s?.customer_name || s?.customer?.name || "—")}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {safeText(s?.qty ?? s?.quantity ?? "—")} {safeText(s?.uom || uom)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{fmtDate(s?.shipped_at || s?.shippedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Events / Audit trail */}
      <Card className="overflow-hidden">
        <div className="border-b bg-white px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Batch Events</h3>
              <p className="text-xs text-gray-500">Routing moves, holds, inspections, splits/merges, and user actions.</p>
            </div>

            <div className="w-full sm:w-[360px]">
              <Input
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
                placeholder="Filter events (type, message, actor...)"
              />
            </div>
          </div>
        </div>

        <div className="divide-y bg-white">
          {loading ? (
            <div className="p-4">
              <div className="h-4 w-1/2 rounded bg-gray-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-gray-100" />
              <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No events found.</div>
          ) : (
            filteredEvents.map((e) => (
              <div key={e.id || `${e.at}-${e.type}`} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{safeText(e?.type || "event")}</Badge>
                      <span className="text-sm font-semibold text-gray-900">{safeText(e?.message || "—")}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{safeText(e?.actor || "system")}</span>
                      <span className="text-gray-300"> • </span>
                      <span>{fmtDate(e?.at || e?.created_at || e?.createdAt)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="truncate">{safeText(e?.ref || e?.reference || "")}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
