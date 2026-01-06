// src/pages/traceability/recall/RecallImpact.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    Boxes,
    Building2,
    Calendar,
    Download,
    Factory,
    FileSearch2,
    Filter,
    Link as LinkIcon,
    Loader2,
    RefreshCcw,
    ShieldAlert,
    Truck,
    Users,
    Wrench,
    XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function badgeTone(kind) {
  switch (kind) {
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "success":
      return "border-green-200 bg-green-50 text-green-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function parseQuery(search) {
  const p = new URLSearchParams(search);
  return {
    recallId: p.get("id") || p.get("recallId") || "",
    supplierLot: p.get("supplierLot") || "",
    internalLot: p.get("internalLot") || "",
    grnNo: p.get("grn") || p.get("grnNo") || "",
    woNo: p.get("wo") || p.get("woNo") || "",
    shipmentNo: p.get("shipment") || p.get("shipmentNo") || "",
  };
}

/**
 * PCBxpress ERP — Recall Impact (Where-used / Impact analysis)
 * Path: src/pages/traceability/recall/RecallImpact.jsx
 *
 * Purpose:
 * - Given a recall id or a trace anchor (supplier lot/internal lot/GRN/WO/shipment),
 *   compute "where-used" and business impact: WIP, shipments, customers, inventory, and open NCR/CAPA.
 *
 * Expected backend endpoints (adjust as needed):
 * - GET /recalls/:id/impact
 * - or POST /recalls/impact with anchors
 * - GET /recalls/:id/impact/export (pdf/xlsx)  (optional)
 *
 * If you don’t have backend yet:
 * - The page still renders and shows mock-safe UI.
 * - Clicking "Analyze" will show toast error.
 */

export default function RecallImpact() {
  const { search } = useLocation();
  const { toast } = useToast();

  const q = useMemo(() => parseQuery(search), [search]);

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Inputs for analysis
  const [recallId, setRecallId] = useState(q.recallId || "");
  const [supplierLot, setSupplierLot] = useState(q.supplierLot || "");
  const [internalLot, setInternalLot] = useState(q.internalLot || "");
  const [grnNo, setGrnNo] = useState(q.grnNo || "");
  const [woNo, setWoNo] = useState(q.woNo || "");
  const [shipmentNo, setShipmentNo] = useState(q.shipmentNo || "");

  // Optional filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);

  // Result
  const [impact, setImpact] = useState(null);

  const canAnalyze = useMemo(() => {
    return (
      recallId.trim() ||
      supplierLot.trim() ||
      internalLot.trim() ||
      grnNo.trim() ||
      woNo.trim() ||
      shipmentNo.trim()
    );
  }, [recallId, supplierLot, internalLot, grnNo, woNo, shipmentNo]);

  const payload = useMemo(() => {
    return {
      recall_id: recallId?.trim() || null,
      anchors: {
        supplier_lot: supplierLot?.trim() || null,
        internal_lot: internalLot?.trim() || null,
        grn_no: grnNo?.trim() || null,
        wo_no: woNo?.trim() || null,
        shipment_no: shipmentNo?.trim() || null,
      },
      filters: {
        date_from: dateFrom || null,
        date_to: dateTo || null,
        only_open: !!onlyOpen,
      },
    };
  }, [recallId, supplierLot, internalLot, grnNo, woNo, shipmentNo, dateFrom, dateTo, onlyOpen]);

  const summarizeRisk = (impactData) => {
    // This is UI-side heuristic. Backend can provide a computed risk_score too.
    const shipped = Number(impactData?.summary?.shipments_count || 0);
    const customers = Number(impactData?.summary?.customers_count || 0);
    const wip = Number(impactData?.summary?.wip_orders_count || 0);
    const inventory = Number(impactData?.summary?.inventory_lots_count || 0);
    const openNcr = Number(impactData?.summary?.open_ncr_count || 0);

    if (shipped > 0 || customers > 0) return { tone: "danger", label: "High exposure (shipped/customer impact)" };
    if (wip > 0 || openNcr > 0) return { tone: "warn", label: "Medium exposure (WIP / open quality cases)" };
    if (inventory > 0) return { tone: "warn", label: "Contained exposure (inventory only)" };
    return { tone: "success", label: "Low exposure (no linked usage found)" };
  };

  const analyze = async () => {
    if (!canAnalyze) {
      toast({
        title: "Missing reference",
        description: "Enter Recall ID or at least one anchor (Supplier Lot / Internal Lot / GRN / WO / Shipment).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setImpact(null);

    try {
      // Prefer recallId endpoint if present
      let res;
      if (recallId.trim()) {
        res = await api.get(`/recalls/${encodeURIComponent(recallId.trim())}/impact`, { params: payload.filters });
      } else {
        // Generic analyze
        res = await api.post("/recalls/impact", payload);
      }

      const data = res?.data?.data ?? res?.data ?? null;
      setImpact(data);

      toast({
        title: "Impact analyzed",
        description: "Review exposure across inventory, WIP, shipments, customers, and quality cases.",
      });
    } catch (err) {
      console.warn(err);
      toast({
        title: "Analyze failed",
        description: err?.response?.data?.message || "Impact analysis endpoint not available. Connect backend to proceed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format = "pdf") => {
    // This is optional; implement if backend supports it
    if (!impact) {
      toast({
        title: "Nothing to export",
        description: "Run Analyze first to generate an impact report.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // If you have an export endpoint:
      // GET /recalls/:id/impact/export?format=pdf
      const rid = recallId?.trim() || impact?.recall_id || impact?.id || null;
      if (!rid) throw new Error("Missing recall id for export.");

      const res = await api.get(`/recalls/${encodeURIComponent(rid)}/impact/export`, {
        params: { format },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recall-impact-${rid}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export started", description: `Downloading impact report as ${format.toUpperCase()}.` });
    } catch (err) {
      console.warn(err);
      toast({
        title: "Export unavailable",
        description: err?.response?.data?.message || "Export endpoint not available yet.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const risk = useMemo(() => (impact ? summarizeRisk(impact) : null), [impact]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="border bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#dc2551]/10 p-3">
                  <FileSearch2 className="h-6 w-6 text-[#dc2551]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recall Impact</CardTitle>
                  <CardDescription>
                    Where-used analysis across inventory lots, WIP work orders, shipments, customers, and open NCR/CAPA.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="ghost" className="gap-2">
                  <Link to="/traceability/recall">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setImpact(null);
                    toast({ title: "Cleared", description: "Impact results cleared." });
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  Clear
                </Button>

                <Button
                  className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                  onClick={analyze}
                  disabled={isLoading || !canAnalyze}
                  title={!canAnalyze ? "Enter an anchor to analyze" : "Analyze impact"}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Analyze
                </Button>

                <Button variant="outline" className="gap-2" onClick={() => exportReport("pdf")} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export PDF
                </Button>
              </div>
            </div>

            {impact && risk && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={cx("border", badgeTone(risk.tone))}>
                  <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                  {risk.label}
                </Badge>
                <Badge className={cx("border", badgeTone("default"))}>
                  Recall: {safe(impact?.recall_code || impact?.recall_id || impact?.id)}
                </Badge>
                <Badge className={cx("border", badgeTone("default"))}>
                  Anchors:{" "}
                  {[
                    supplierLot?.trim() ? "Supplier Lot" : null,
                    internalLot?.trim() ? "Internal Lot" : null,
                    grnNo?.trim() ? "GRN" : null,
                    woNo?.trim() ? "WO" : null,
                    shipmentNo?.trim() ? "Shipment" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Recall ID"}
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Inputs */}
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[#dc2551]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Analysis Inputs</p>
                  <p className="text-xs text-gray-600">
                    Provide Recall ID or one anchor. Add optional time filters to limit trace window.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Recall ID</Label>
                  <Input value={recallId} onChange={(e) => setRecallId(e.target.value)} placeholder="REC-..." />
                </div>

                <div className="space-y-2">
                  <Label>Supplier Lot</Label>
                  <Input value={supplierLot} onChange={(e) => setSupplierLot(e.target.value)} placeholder="LOT-..." />
                </div>

                <div className="space-y-2">
                  <Label>Internal Lot</Label>
                  <Input value={internalLot} onChange={(e) => setInternalLot(e.target.value)} placeholder="INT-LOT-..." />
                </div>

                <div className="space-y-2">
                  <Label>GRN No</Label>
                  <Input value={grnNo} onChange={(e) => setGrnNo(e.target.value)} placeholder="GRN-..." />
                </div>

                <div className="space-y-2">
                  <Label>Work Order No</Label>
                  <Input value={woNo} onChange={(e) => setWoNo(e.target.value)} placeholder="WO-..." />
                </div>

                <div className="space-y-2">
                  <Label>Shipment No</Label>
                  <Input value={shipmentNo} onChange={(e) => setShipmentNo(e.target.value)} placeholder="SHP-..." />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <button
                    type="button"
                    onClick={() => setOnlyOpen((s) => !s)}
                    className={cx(
                      "h-10 w-full rounded-md border px-3 text-sm text-left",
                      onlyOpen ? "border-amber-200 bg-amber-50 text-amber-800" : "bg-white"
                    )}
                  >
                    <Filter className="mr-2 inline-block h-4 w-4" />
                    {onlyOpen ? "Only OPEN items" : "All items (open + closed)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <SummaryTile
                icon={Boxes}
                label="Inventory Lots"
                value={impact?.summary?.inventory_lots_count}
                hint="Lots in stock/quarantine"
              />
              <SummaryTile
                icon={Factory}
                label="WIP Orders"
                value={impact?.summary?.wip_orders_count}
                hint="Active work orders"
              />
              <SummaryTile
                icon={Truck}
                label="Shipments"
                value={impact?.summary?.shipments_count}
                hint="Potentially delivered"
              />
              <SummaryTile
                icon={Users}
                label="Customers"
                value={impact?.summary?.customers_count}
                hint="Impacted customers"
              />
              <SummaryTile
                icon={ShieldAlert}
                label="Open NCR"
                value={impact?.summary?.open_ncr_count}
                hint="Open nonconformities"
              />
              <SummaryTile
                icon={Wrench}
                label="Open CAPA"
                value={impact?.summary?.open_capa_count}
                hint="Corrective actions"
              />
            </div>

            {/* Detailed sections */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ImpactListCard
                title="Inventory Exposure"
                icon={Boxes}
                description="Lots currently in inventory (usable / quarantine / on-hold)."
                items={impact?.inventory_lots}
                emptyText="No inventory lots linked."
                columns={[
                  { key: "lot_no", label: "Lot" },
                  { key: "item_name", label: "Item" },
                  { key: "qty", label: "Qty" },
                  { key: "location", label: "Location" },
                  { key: "status", label: "Status" },
                ]}
              />

              <ImpactListCard
                title="WIP / Production Exposure"
                icon={Factory}
                description="Work orders currently in progress or recently completed within filter window."
                items={impact?.work_orders}
                emptyText="No WIP work orders linked."
                columns={[
                  { key: "wo_no", label: "WO" },
                  { key: "part_no", label: "Part" },
                  { key: "process", label: "Process" },
                  { key: "status", label: "Status" },
                  { key: "qty", label: "Qty" },
                ]}
              />

              <ImpactListCard
                title="Shipment Exposure"
                icon={Truck}
                description="Shipments linked to affected lots / WOs."
                items={impact?.shipments}
                emptyText="No shipments linked."
                columns={[
                  { key: "shipment_no", label: "Shipment" },
                  { key: "customer", label: "Customer" },
                  { key: "date", label: "Date" },
                  { key: "status", label: "Status" },
                  { key: "qty", label: "Qty" },
                ]}
              />

              <ImpactListCard
                title="Customer Impact"
                icon={Building2}
                description="Customer list derived from shipments and open quality cases."
                items={impact?.customers}
                emptyText="No customers linked."
                columns={[
                  { key: "name", label: "Customer" },
                  { key: "shipments", label: "Shipments" },
                  { key: "open_cases", label: "Open Cases" },
                  { key: "last_shipment_date", label: "Last Ship Date" },
                ]}
              />

              <ImpactListCard
                title="Quality Cases (NCR)"
                icon={ShieldAlert}
                description="Open/linked NCRs from IQC, in-process, AOI/E-test, or customer returns."
                items={impact?.ncrs}
                emptyText="No NCR linked."
                columns={[
                  { key: "ncr_no", label: "NCR" },
                  { key: "source", label: "Source" },
                  { key: "severity", label: "Severity" },
                  { key: "status", label: "Status" },
                  { key: "created_at", label: "Created" },
                ]}
              />

              <ImpactListCard
                title="Corrective Actions (CAPA)"
                icon={Wrench}
                description="Linked or open CAPA records."
                items={impact?.capas}
                emptyText="No CAPA linked."
                columns={[
                  { key: "capa_no", label: "CAPA" },
                  { key: "owner", label: "Owner" },
                  { key: "due_date", label: "Due" },
                  { key: "status", label: "Status" },
                ]}
              />
            </div>

            {/* Guidance */}
            <div className="rounded-2xl border bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-semibold">How to interpret Recall Impact</div>
                  <div className="mt-1 text-xs text-amber-800">
                    If shipments/customers are impacted, immediately trigger containment: shipment hold, customer notice,
                    and internal lot quarantine. If only inventory/WIP is impacted, quarantine and revalidate before use.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/traceability/recall">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Button
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                onClick={analyze}
                disabled={isLoading || !canAnalyze}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Analyze Again
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => exportReport("xlsx")} disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export XLSX
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-600">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-gray-900">{safe(value)}</div>
          <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
        <div className="rounded-xl bg-[#dc2551]/10 p-2">
          <Icon className="h-5 w-5 text-[#dc2551]" />
        </div>
      </div>
    </div>
  );
}

function ImpactListCard({ title, icon: Icon, description, items, columns, emptyText }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <Card className="border bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#dc2551]/10 p-2">
            <Icon className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {list.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">{emptyText}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-600">
                  {columns.map((c) => (
                    <th key={c.key} className="px-3 py-2">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {list.map((row, idx) => (
                  <tr key={row?.id ?? row?._id ?? idx} className="text-sm">
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-2">
                        {renderCell(row?.[c.key], c.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function renderCell(value, key) {
  // Make statuses look nicer if backend sends status fields
  if (key === "status" || key === "severity") {
    const v = safe(value);
    const norm = String(v).toLowerCase();

    let tone = "default";
    if (norm.includes("open") || norm.includes("hold") || norm.includes("quarantine")) tone = "warn";
    if (norm.includes("critical") || norm.includes("high") || norm.includes("rejected")) tone = "danger";
    if (norm.includes("closed") || norm.includes("released") || norm.includes("ok")) tone = "success";

    return <Badge className={cx("border", badgeTone(tone))}>{v}</Badge>;
  }

  // Dates: keep simple
  if (key.includes("date") || key.includes("_at")) {
    return (
      <span className="inline-flex items-center gap-2 text-gray-700">
        <Calendar className="h-4 w-4 text-gray-400" />
        {safe(value)}
      </span>
    );
  }

  // Qty: show as number-ish
  if (key === "qty" || key === "shipments" || key === "open_cases") {
    return <span className="font-semibold text-gray-900">{safe(value)}</span>;
  }

  return <span className="text-gray-700">{safe(value)}</span>;
}
