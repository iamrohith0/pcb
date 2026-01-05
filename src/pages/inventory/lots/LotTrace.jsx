// src/pages/inventory/lots/LotTrace.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Barcode,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Factory,
  FileSearch2,
  GitBranch,
  Hash,
  Loader2,
  PackageSearch,
  RefreshCw,
  Route,
  ShieldCheck,
  Split,
  Truck,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import lotsService from "@/services/inventory/lots.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
}

const STATUS_META = {
  QUARANTINE: { label: "Quarantine", icon: ShieldCheck, className: "bg-amber-50 text-amber-700 border-amber-200" },
  RELEASED: { label: "Released", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BLOCKED: { label: "Blocked", icon: XCircle, className: "bg-rose-50 text-rose-700 border-rose-200" },
  CONSUMED: { label: "Consumed", icon: PackageSearch, className: "bg-slate-50 text-slate-700 border-slate-200" },
};

function StatusBadge({ value }) {
  const s = String(value || "QUARANTINE").toUpperCase();
  const meta = STATUS_META[s] || STATUS_META.QUARANTINE;
  const Icon = meta.icon;
  return (
    <Badge variant="secondary" className={cx("gap-1 border", meta.className)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  );
}

/**
 * Expected backend payload shapes (supports any of these):
 * res.data.trace
 * res.data.data
 * res.data
 *
 * Recommended normalized trace (example):
 * {
 *   lot: { id, lot_number, status, item_name, item_code, supplier_name, received_date, expiry_date, warehouse, location, uom, qty_received, qty_available },
 *   inbound: [{ type:"GRN", id, ref, date, supplier, warehouse, location, qty, uom }],
 *   consumed_in: [
 *     { type:"WORK_ORDER", id, ref, date, process:"Lamination", machine:"Lamination Press #2", qty, uom, status, outputs: [...] }
 *   ],
 *   linked_lots: [{ direction:"CHILD|PARENT", id, ref, relation:"Split/Repack", date, qty }],
 *   shipments: [{ type:"SHIPMENT", id, ref, date, customer, qty, uom, status }]
 * }
 */

export default function LotTrace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [trace, setTrace] = useState(null);

  // Expand/collapse groups
  const [open, setOpen] = useState({
    inbound: true,
    consumed: true,
    linkedLots: true,
    shipments: true,
    events: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      // Prefer trace endpoint if you have it; fallback to details() if not.
      const res =
        (await lotsService.trace?.(id)) ??
        (await lotsService.get?.(id)) ??
        (await lotsService.details?.(id));

      const data = res?.data?.trace ?? res?.data?.data ?? res?.data ?? null;

      // If backend returns only lot details, wrap it minimally
      const normalized =
        data && data.lot
          ? data
          : {
              lot: data,
              inbound: data?.inbound ?? [],
              consumed_in: data?.consumed_in ?? data?.consumedIn ?? [],
              linked_lots: data?.linked_lots ?? data?.linkedLots ?? [],
              shipments: data?.shipments ?? [],
              events: data?.events ?? [],
            };

      setTrace(normalized);
    } catch (err) {
      toast({
        title: "Failed to load lot trace",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const lot = trace?.lot ?? {};
  const lotNo = lot?.lot_number ?? lot?.lotNumber ?? lot?.code ?? lot?.number ?? id;

  const headerStats = useMemo(() => {
    const rec = Number(lot?.qty_received ?? lot?.qtyReceived ?? lot?.received_qty ?? 0) || 0;
    const avl = Number(lot?.qty_available ?? lot?.qtyAvailable ?? lot?.available_qty ?? 0) || 0;
    const uom = lot?.uom ?? lot?.unit ?? lot?.item?.uom ?? lot?.item?.unit ?? "";
    return { rec, avl, uom };
  }, [lot]);

  const breadcrumbs = useMemo(() => {
    const itemName = lot?.item_name ?? lot?.itemName ?? lot?.item?.name ?? "Item";
    return [
      { label: "Inventory", to: "/inventory/items" },
      { label: "Lots", to: "/inventory/lots" },
      { label: lotNo, to: `/inventory/lots/${id}` },
      { label: "Trace", to: `/inventory/lots/${id}/trace` },
      { label: itemName, to: null },
    ];
  }, [lot, lotNo, id]);

  const Toggle = ({ k, title, icon: Icon, count }) => (
    <button
      type="button"
      onClick={() => setOpen((s) => ({ ...s, [k]: !s[k] }))}
      className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-left hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100">
          <Icon className="h-4 w-4 text-gray-700" />
        </span>
        <div className="leading-tight">
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">{count} record(s)</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
          {count}
        </Badge>
        {open[k] ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
      </div>
    </button>
  );

  const TraceRow = ({ icon: Icon, title, metaLeft, metaRight, badge, onOpen }) => (
    <div className="flex items-start justify-between gap-3 rounded-xl border bg-white p-3 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-gray-100">
          <Icon className="h-4 w-4 text-gray-700" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-gray-900">{title}</div>
            {badge}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
              {metaLeft}
            </span>
            <span className="text-gray-300">•</span>
            <span>{metaRight}</span>
          </div>
        </div>
      </div>

      {onOpen ? (
        <Button variant="outline" size="sm" className="shrink-0" onClick={onOpen}>
          Open
        </Button>
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading lot trace...
        </div>
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Lot Trace</CardTitle>
            <CardDescription>Trace data not available.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">No trace information found for this lot.</CardContent>
        </Card>
      </div>
    );
  }

  const inbound = trace?.inbound ?? [];
  const consumed = trace?.consumed_in ?? trace?.consumedIn ?? [];
  const linkedLots = trace?.linked_lots ?? trace?.linkedLots ?? [];
  const shipments = trace?.shipments ?? [];
  const events = trace?.events ?? [];

  const itemName = lot?.item_name ?? lot?.itemName ?? lot?.item?.name;
  const itemCode = lot?.item_code ?? lot?.itemCode ?? lot?.item?.code ?? lot?.item?.item_code;
  const supplier = lot?.supplier_name ?? lot?.supplierName;

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button variant="outline" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link to={`/inventory/lots/${id}`}>
              <FileSearch2 className="h-4 w-4" />
              Lot Details
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="border bg-white text-gray-700">
            <Hash className="mr-1 h-3.5 w-3.5 text-gray-500" />
            {safe(itemCode)}
          </Badge>
          <StatusBadge value={lot?.status} />
          <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
            <Barcode className="mr-1 h-3.5 w-3.5 text-gray-500" />
            Lot: {safe(lotNo)}
          </Badge>
        </div>
      </div>

      {/* Breadcrumb-like path */}
      <div className="rounded-xl border bg-white px-3 py-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <Route className="h-4 w-4 text-gray-500" />
          {breadcrumbs
            .filter((b) => b.label)
            .map((b, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                {b.to ? (
                  <Link className="hover:text-[#dc2551]" to={b.to}>
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-gray-800">{b.label}</span>
                )}
                {idx < breadcrumbs.length - 1 ? <span className="text-gray-300">/</span> : null}
              </span>
            ))}
        </span>
      </div>

      {/* Lot summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lot Summary</CardTitle>
          <CardDescription>Quick view of identity + quantities + key dates (PCB material traceability).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-gray-500">Item</div>
            <div className="mt-1 font-semibold text-gray-900">{safe(itemName)}</div>
            <div className="mt-1 text-xs text-gray-600">Code: {safe(itemCode)}</div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-gray-500">Supplier</div>
            <div className="mt-1 font-semibold text-gray-900">{safe(supplier)}</div>
            <div className="mt-1 text-xs text-gray-600">Supplier Ref: {safe(lot?.supplier_lot_ref ?? lot?.supplierLotRef)}</div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-gray-500">Quantities</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
                Received: <span className="ml-1 font-semibold">{headerStats.rec}</span> {headerStats.uom}
              </Badge>
              <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
                Available: <span className="ml-1 font-semibold">{headerStats.avl}</span> {headerStats.uom}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Warehouse: {safe(lot?.warehouse)} {lot?.location ? `• ${lot.location}` : ""}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-3 md:col-span-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Received Date</div>
                <div className="mt-1 font-medium text-gray-900">{fmtDate(lot?.received_date)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Expiry Date</div>
                <div className="mt-1 font-medium text-gray-900">{fmtDate(lot?.expiry_date)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">QA Gate</div>
                <div className="mt-1">{<StatusBadge value={lot?.status} />}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trace Groups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Toggle k="inbound" title="Inbound (Procurement → GRN)" icon={Truck} count={inbound.length} />
          {open.inbound && (
            <div className="space-y-2">
              {inbound.length === 0 ? (
                <EmptyNote text="No inbound records for this lot (GRN / receiving)." />
              ) : (
                inbound.map((x, idx) => (
                  <TraceRow
                    key={x.id ?? x._id ?? `${x.type}-${idx}`}
                    icon={Truck}
                    title={`${safe(x.type ?? "GRN")} • ${safe(x.ref ?? x.reference ?? x.grn_no ?? x.grnNo)}`}
                    metaLeft={fmtDate(x.date ?? x.received_date ?? x.created_at)}
                    metaRight={`${safe(x.supplier ?? x.supplier_name ?? x.vendor)} • WH: ${safe(x.warehouse)}${x.location ? ` / ${x.location}` : ""}`}
                    badge={
                      <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
                        Qty: <span className="ml-1 font-semibold">{safe(x.qty ?? x.quantity)}</span> {safe(x.uom ?? x.unit)}
                      </Badge>
                    }
                    onOpen={
                      x?.route
                        ? () => navigate(x.route)
                        : x?.id || x?._id
                        ? () => navigate(`/procurement/grn/${x.id ?? x._id}`)
                        : null
                    }
                  />
                ))
              )}
            </div>
          )}

          <Toggle k="linkedLots" title="Linked Lots (Split / Repack / Merge)" icon={Split} count={linkedLots.length} />
          {open.linkedLots && (
            <div className="space-y-2">
              {linkedLots.length === 0 ? (
                <EmptyNote text="No linked lots found (splits / repacks / merges)." />
              ) : (
                linkedLots.map((x, idx) => (
                  <TraceRow
                    key={x.id ?? x._id ?? `${x.direction}-${idx}`}
                    icon={GitBranch}
                    title={`${safe(x.relation ?? "Linked")} • ${safe(x.ref ?? x.lot_number ?? x.lotNo ?? x.lot)}`}
                    metaLeft={fmtDate(x.date ?? x.created_at)}
                    metaRight={`${safe(x.direction ?? "—")} • Qty: ${safe(x.qty)} ${safe(x.uom)}`}
                    badge={
                      <Badge
                        variant="secondary"
                        className={cx(
                          "border",
                          String(x.direction || "").toUpperCase() === "CHILD"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-teal-50 text-teal-700 border-teal-200"
                        )}
                      >
                        {safe(x.direction ?? "LINK")}
                      </Badge>
                    }
                    onOpen={
                      x?.lot_id || x?.lotId || x?.id || x?._id
                        ? () => navigate(`/inventory/lots/${x.lot_id ?? x.lotId ?? x.id ?? x._id}/trace`)
                        : null
                    }
                  />
                ))
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Toggle k="consumed" title="Consumed In (Production / WIP)" icon={Factory} count={consumed.length} />
          {open.consumed && (
            <div className="space-y-2">
              {consumed.length === 0 ? (
                <EmptyNote text="No consumption records. Lot may not be issued to production yet." />
              ) : (
                consumed.map((x, idx) => (
                  <TraceRow
                    key={x.id ?? x._id ?? `${x.type}-${idx}`}
                    icon={Factory}
                    title={`${safe(x.type ?? "Work Order")} • ${safe(x.ref ?? x.work_order_no ?? x.wo_no ?? x.workOrderNo)}`}
                    metaLeft={fmtDate(x.date ?? x.issued_date ?? x.created_at)}
                    metaRight={`${safe(x.process ?? x.step ?? "Process")} • ${safe(x.machine ?? x.resource ?? "—")}`}
                    badge={
                      <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
                        Used: <span className="ml-1 font-semibold">{safe(x.qty ?? x.quantity)}</span> {safe(x.uom ?? x.unit)}
                      </Badge>
                    }
                    onOpen={
                      x?.route
                        ? () => navigate(x.route)
                        : x?.id || x?._id
                        ? () => navigate(`/production/work-orders/${x.id ?? x._id}`)
                        : null
                    }
                  />
                ))
              )}
            </div>
          )}

          <Toggle k="shipments" title="Outbound (Dispatch / Shipments)" icon={Boxes} count={shipments.length} />
          {open.shipments && (
            <div className="space-y-2">
              {shipments.length === 0 ? (
                <EmptyNote text="No shipment/dispatch records found for this lot." />
              ) : (
                shipments.map((x, idx) => (
                  <TraceRow
                    key={x.id ?? x._id ?? `${x.type}-${idx}`}
                    icon={Boxes}
                    title={`${safe(x.type ?? "Shipment")} • ${safe(x.ref ?? x.shipment_no ?? x.dispatch_no ?? x.reference)}`}
                    metaLeft={fmtDate(x.date ?? x.shipped_date ?? x.created_at)}
                    metaRight={`${safe(x.customer ?? x.customer_name ?? x.client)} • ${safe(x.carrier ?? x.mode ?? "—")}`}
                    badge={
                      <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
                        Qty: <span className="ml-1 font-semibold">{safe(x.qty ?? x.quantity)}</span> {safe(x.uom ?? x.unit)}
                      </Badge>
                    }
                    onOpen={
                      x?.route
                        ? () => navigate(x.route)
                        : x?.id || x?._id
                        ? () => navigate(`/logistics/shipments/${x.id ?? x._id}`)
                        : null
                    }
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional Events timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Trace Timeline</CardTitle>
          <CardDescription>Optional audit-style events (if your backend provides them).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={() => setOpen((s) => ({ ...s, events: !s.events }))}
            className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100">
                <ClipboardList className="h-4 w-4 text-gray-700" />
              </span>
              <div className="leading-tight">
                <div className="font-medium text-gray-900">Events</div>
                <div className="text-xs text-gray-500">{events.length} event(s)</div>
              </div>
            </div>
            {open.events ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
          </button>

          {open.events && (
            <div className="space-y-2">
              {events.length === 0 ? (
                <EmptyNote text="No timeline events available." />
              ) : (
                <ol className="space-y-2">
                  {events.map((ev, idx) => (
                    <li key={ev.id ?? ev._id ?? idx} className="rounded-xl border bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium text-gray-900">{safe(ev.title ?? ev.action ?? "Event")}</div>
                        <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
                          {fmtDate(ev.date ?? ev.created_at)}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {safe(ev.description ?? ev.message ?? ev.notes)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Boxes className="h-3.5 w-3.5" />
                          Source: {safe(ev.source ?? ev.module ?? "—")}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5" />
                          Ref: {safe(ev.ref ?? ev.reference ?? "—")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trace Map (simple) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Trace Map (Quick Graph)</CardTitle>
          <CardDescription>Simple visual grouping for quick audits (not a full graph engine).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <MiniNode
              icon={Truck}
              title="Inbound"
              subtitle="Procurement → GRN"
              count={inbound.length}
              hint="Source documents & receiving"
            />
            <MiniNode
              icon={Factory}
              title="Consumed"
              subtitle="Issue → WIP"
              count={consumed.length}
              hint="Work orders & process steps"
            />
            <MiniNode
              icon={Boxes}
              title="Outbound"
              subtitle="Dispatch → Shipment"
              count={shipments.length}
              hint="Customer delivery records"
            />
          </div>

          <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-gray-500" />
              Linked lots: <span className="font-semibold text-gray-900">{linkedLots.length}</span> (split / repack / merge)
            </div>
            <div className="mt-1 text-gray-500">
              Tip: For ISO/IPC traceability, keep lot status gates (Quarantine → Released) before issuing to production.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyNote({ text }) {
  return (
    <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
      {text}
    </div>
  );
}

function MiniNode({ icon: Icon, title, subtitle, count, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100">
            <Icon className="h-5 w-5 text-gray-700" />
          </span>
          <div>
            <div className="font-semibold text-gray-900">{title}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
          </div>
        </div>
        <Badge variant="secondary" className="border bg-slate-50 text-slate-700">
          {count}
        </Badge>
      </div>
      <div className="mt-3 text-xs text-gray-600">{hint}</div>
    </div>
  );
}
