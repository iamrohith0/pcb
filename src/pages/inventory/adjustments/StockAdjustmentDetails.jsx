// src/pages/inventory/adjustments/StockAdjustmentDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    ClipboardCheck,
    Download,
    FileText,
    Hash,
    Layers,
    Loader2,
    Pencil,
    Printer,
    ShieldCheck,
    UserCircle2,
    Warehouse,
} from "lucide-react";

import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function num(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  // keep small decimals used in chemicals etc.
  const hasDecimals = String(v).includes(".") || String(v).includes(",");
  return hasDecimals ? n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "") : String(n);
}

function StatusBadge({ status }) {
  const s = String(status || "DRAFT").toUpperCase();
  const cls =
    s === "POSTED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "CANCELLED"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
      {s}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = String(type || "").toUpperCase();
  const cls =
    t === "INCREASE"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : t === "DECREASE"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
      {t || "-"}
    </span>
  );
}

export default function StockAdjustmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  const [doc, setDoc] = useState(null);

  // Optional: masters for nicer labels (warehouse/location names)
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // 1) load details
        // Adjust endpoint to your backend:
        const res = await api.get(`/inventory/adjustments/${id}`);
        const data = res?.data?.data ?? res?.data ?? null;

        // 2) load masters in parallel (optional)
        const [wRes, lRes] = await Promise.allSettled([
          api.get("/masters/warehouses"),
          api.get("/masters/locations"),
        ]);

        if (!mounted) return;

        setDoc(data);

        if (wRes.status === "fulfilled") {
          const w = wRes.value?.data?.data ?? wRes.value?.data ?? [];
          setWarehouses(Array.isArray(w) ? w : []);
        }
        if (lRes.status === "fulfilled") {
          const l = lRes.value?.data?.data ?? lRes.value?.data ?? [];
          setLocations(Array.isArray(l) ? l : []);
        }
      } catch (err) {
        console.error("Failed to load adjustment:", err);
        toast({
          title: "Failed to load",
          description: "Could not fetch stock adjustment details. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const warehouseName = useMemo(() => {
    const wid = String(doc?.warehouse_id ?? "");
    const w = warehouses.find((x) => String(x.id ?? x.warehouse_id) === wid);
    return w?.name ?? w?.warehouse_name ?? doc?.warehouse_name ?? "-";
  }, [doc, warehouses]);

  const locationName = useMemo(() => {
    const lid = String(doc?.location_id ?? "");
    if (!lid) return "-";
    const l = locations.find((x) => String(x.id ?? x.location_id) === lid);
    return l?.name ?? l?.location_name ?? doc?.location_name ?? "-";
  }, [doc, locations]);

  const lines = useMemo(() => {
    const arr = doc?.lines ?? doc?.items ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [doc]);

  const totals = useMemo(() => {
    const totalQty = lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
    const totalValue = lines.reduce(
      (sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_cost ?? l.unitCost) || 0),
      0
    );
    return { totalQty, totalValue };
  }, [lines]);

  const handlePrint = async () => {
    // Basic print of the page (you can replace with backend PDF export)
    setPrinting(true);
    try {
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    // Optional: if your backend returns a PDF blob
    // GET /inventory/adjustments/:id/pdf -> application/pdf
    try {
      toast({ title: "Preparing PDF...", description: "If PDF export is enabled, it will download shortly." });
      const res = await api.get(`/inventory/adjustments/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StockAdjustment_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("PDF export not available:", err);
      toast({
        title: "PDF export not available",
        description: "Your backend endpoint /pdf is not configured yet.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading stock adjustment...
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Stock Adjustment</CardTitle>
          <CardDescription>Document not found.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
            <Link to="/inventory/adjustments">Go to list</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <ClipboardCheck className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                Stock Adjustment <span className="text-gray-500">#{doc.id ?? id}</span>
              </h1>
              <StatusBadge status={doc.status} />
              <TypeBadge type={doc.adjustment_type ?? doc.type} />
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Inventory correction document for PCB manufacturing (lots, reels, sheets, chemicals).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Optional routes */}
          <Button variant="outline" onClick={handlePrint} className="gap-2" disabled={printing}>
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Print
          </Button>

          <Button variant="outline" onClick={handleDownloadPdf} className="gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>

          {/* If you implement edit route */}
          <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <Link to={`/inventory/adjustments/${doc.id ?? id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Document Info</CardTitle>
            <CardDescription>Key header fields for audit trail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-gray-500">
                <CalendarDays className="h-4 w-4" /> Date
              </span>
              <span className="font-medium text-gray-900">{fmtDate(doc.doc_date ?? doc.date)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-gray-500">
                <FileText className="h-4 w-4" /> Reason
              </span>
              <span className="font-medium text-gray-900 text-right">{doc.reason ?? "-"}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-gray-500">
                <Hash className="h-4 w-4" /> Reference
              </span>
              <span className="font-medium text-gray-900 text-right">{doc.reference ?? "-"}</span>
            </div>

            {doc.remarks ? (
              <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                <p className="text-xs font-semibold text-gray-500">Remarks</p>
                <p className="mt-1">{doc.remarks}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Warehouse & Location</CardTitle>
            <CardDescription>Where the adjustment applies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-gray-500">
                <Warehouse className="h-4 w-4" /> Warehouse
              </span>
              <span className="font-medium text-gray-900 text-right">{warehouseName}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-gray-500">
                <Layers className="h-4 w-4" /> Location
              </span>
              <span className="font-medium text-gray-900 text-right">{locationName}</span>
            </div>

            <div className="rounded-xl border border-[#dc2551]/20 bg-[#dc2551]/5 p-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[#dc2551]" />
                <div>
                  <p className="text-xs font-semibold text-gray-600">Traceability</p>
                  <p className="mt-1 text-sm text-gray-600">
                    For PCB materials (CCL, prepreg, soldermask, chemicals), always record lot/reel numbers.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Totals</CardTitle>
            <CardDescription>Summary across all line items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Total Lines</span>
              <span className="font-semibold text-gray-900">{lines.length}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Total Qty</span>
              <span className="font-semibold text-gray-900">{num(totals.totalQty)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Total Value</span>
              <span className="font-semibold text-gray-900">{money(totals.totalValue)}</span>
            </div>

            {/* Optional: show who created */}
            {(doc.created_by_name || doc.created_by) && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-gray-500">
                  <UserCircle2 className="h-4 w-4" /> Created By
                </span>
                <span className="font-medium text-gray-900 text-right">
                  {doc.created_by_name ?? doc.created_by}
                </span>
              </div>
            )}

            {/* Optional: warning if decrease without lot */}
            {String(doc.adjustment_type ?? doc.type).toUpperCase() === "DECREASE" &&
              lines.some((l) => !l.lot_no && !l.lotNo) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <p>
                      Some lines are missing Lot No. Consider adding lot/reel numbers for better PCB material traceability.
                    </p>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Lines */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
          <CardDescription>Items affected by this adjustment</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-3 py-2 w-[280px]">Item</th>
                  <th className="px-3 py-2 w-[140px]">Lot No</th>
                  <th className="px-3 py-2 w-[160px]">Serial No</th>
                  <th className="px-3 py-2 w-[90px]">UOM</th>
                  <th className="px-3 py-2 w-[120px]">Qty</th>
                  <th className="px-3 py-2 w-[140px]">Unit Cost</th>
                  <th className="px-3 py-2 w-[160px]">Line Value</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => {
                  const code = l.item_code ?? l.code ?? "";
                  const name = l.item_name ?? l.name ?? "";
                  const uom = l.uom ?? l.unit ?? "";
                  const qty = Number(l.qty) || 0;
                  const cost = Number(l.unit_cost ?? l.unitCost) || 0;
                  const value = qty * cost;

                  return (
                    <tr key={String(l.id ?? idx)} className={cx("border-t", idx % 2 === 0 ? "bg-white" : "bg-gray-50/40")}>
                      <td className="px-3 py-2 align-top">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{code || "-"}</p>
                          <p className="text-xs text-gray-500">{name || "-"}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">{l.lot_no ?? l.lotNo ?? "-"}</td>
                      <td className="px-3 py-2 align-top">{l.serial_no ?? l.serialNo ?? "-"}</td>
                      <td className="px-3 py-2 align-top">{uom || "-"}</td>
                      <td className="px-3 py-2 align-top">
                        <span className="font-semibold text-gray-900">{num(qty)}</span>
                      </td>
                      <td className="px-3 py-2 align-top">{money(cost)}</td>
                      <td className="px-3 py-2 align-top">
                        <span className="font-semibold text-gray-900">{money(value)}</span>
                      </td>
                      <td className="px-3 py-2 align-top">{l.line_note ?? l.note ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {lines.map((l, idx) => {
              const code = l.item_code ?? l.code ?? "";
              const name = l.item_name ?? l.name ?? "";
              const uom = l.uom ?? l.unit ?? "";
              const qty = Number(l.qty) || 0;
              const cost = Number(l.unit_cost ?? l.unitCost) || 0;

              return (
                <div key={String(l.id ?? idx)} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{code || "Item"}</p>
                      <p className="text-xs text-gray-500">{name || "-"}</p>
                    </div>
                    <Badge variant="secondary">{uom || "UOM"}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Qty</p>
                      <p className="font-semibold text-gray-900">{num(qty)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Unit Cost</p>
                      <p className="font-semibold text-gray-900">{money(cost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lot No</p>
                      <p className="font-medium text-gray-900">{l.lot_no ?? l.lotNo ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Serial No</p>
                      <p className="font-medium text-gray-900">{l.serial_no ?? l.serialNo ?? "-"}</p>
                    </div>
                  </div>

                  {l.line_note || l.note ? (
                    <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="text-xs font-semibold text-gray-500">Note</p>
                      <p className="mt-1">{l.line_note ?? l.note}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Totals footer */}
          <div className="flex flex-col gap-2 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Qty:</span> {num(totals.totalQty)}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Value:</span> {money(totals.totalValue)}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
              <Link to="/inventory/adjustments">Go to adjustments list</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          header, nav, aside, .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
