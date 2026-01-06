// src/pages/quality/certificates/CoCGenerate.jsx
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

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

import {
    CheckCircle2,
    ClipboardCheck,
    Download,
    FileText,
    FileUp,
    Printer,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress - CoC (Certificate of Conformance) Generate
 *
 * Recommended Backend Endpoints:
 * - GET  /quality/certificates/coc/orders?search=&from=&to=&status=&page=&limit=
 * - GET  /quality/certificates/coc/orders/:id
 * - POST /quality/certificates/coc/generate
 *     body: { order_id, shipment_id?, template_id?, include_test_reports?, include_aoi_summary?, include_etch_coupons? }
 *     returns: { coc_id, pdf_url? } OR stream pdf
 * - GET  /quality/certificates/coc/:coc_id
 * - GET  /quality/certificates/coc/:coc_id/pdf   (download)
 *
 * NOTE:
 * This UI will work even if endpoints are missing (it falls back to sample data).
 */
export default function CoCGenerate() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // list + pagination
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // all|ready|shipped|hold
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // dialogs
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // selected order/shipment
  const [selected, setSelected] = useState(null);

  // generation options
  const [templateId, setTemplateId] = useState("default");
  const [shipmentId, setShipmentId] = useState("");
  const [includeTestReports, setIncludeTestReports] = useState(true);
  const [includeAOISummary, setIncludeAOISummary] = useState(true);
  const [includeEtchCoupons, setIncludeEtchCoupons] = useState(false);

  // preview result
  const [generated, setGenerated] = useState(null); // { coc_id, pdf_url? }

  const totalPages = useMemo(() => {
    const t = Number(meta?.total || 0);
    const l = Number(meta?.limit || 10);
    return Math.max(1, Math.ceil(t / l));
  }, [meta]);

  const normalizeList = (payload) => {
    const root = payload?.data ?? payload ?? {};
    const items = root.items ?? root.rows ?? root.data ?? (Array.isArray(root) ? root : []);
    const page = root.page ?? root.meta?.page ?? 1;
    const limit = root.limit ?? root.meta?.limit ?? 10;
    const total = root.total ?? root.meta?.total ?? items?.length ?? 0;
    return {
      items: Array.isArray(items) ? items : [],
      meta: { page: Number(page), limit: Number(limit), total: Number(total) },
    };
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const badgeStatus = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "ready")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready
        </span>
      );
    if (v === "shipped")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          Shipped
        </span>
      );
    if (v === "hold")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Hold
        </span>
      );
    return <Badge variant="outline">Unknown</Badge>;
  };

  const mockRows = () => [
    {
      id: "SO-2026-018",
      orderNo: "SO-2026-018",
      customer: "Astra Electronics",
      poNo: "PO-8891",
      pcbType: "Multilayer (6L)",
      finish: "ENIG",
      qty: 120,
      status: "ready",
      dueDate: "2026-01-10",
      lotNo: "LOT-ML6-0123",
      woNo: "WO-2026-031",
      shipmentOptions: [
        { id: "SHP-001", carrier: "BlueDart", awb: "BD123456789", shipDate: "2026-01-06" },
        { id: "SHP-002", carrier: "DTDC", awb: "DT987654321", shipDate: "2026-01-06" },
      ],
    },
    {
      id: "SO-2026-012",
      orderNo: "SO-2026-012",
      customer: "MicroNova Systems",
      poNo: "PO-7740",
      pcbType: "Single Layer",
      finish: "HASL",
      qty: 500,
      status: "shipped",
      dueDate: "2026-01-03",
      lotNo: "LOT-SL-0455",
      woNo: "WO-2026-019",
      shipmentOptions: [{ id: "SHP-003", carrier: "Delhivery", awb: "DL556677889", shipDate: "2026-01-04" }],
    },
    {
      id: "SO-2026-009",
      orderNo: "SO-2026-009",
      customer: "EdgeFab Pvt Ltd",
      poNo: "PO-7702",
      pcbType: "2-Layer",
      finish: "OSP",
      qty: 240,
      status: "hold",
      dueDate: "2026-01-08",
      lotNo: "LOT-2L-0088",
      woNo: "WO-2026-014",
      shipmentOptions: [],
    },
  ];

  const fetchList = async (nextPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/quality/certificates/coc/orders", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          from: from || undefined,
          to: to || undefined,
          page: nextPage,
          limit: meta.limit,
        },
      });

      const { items, meta: m } = normalizeList(res?.data);
      setRows(items);
      setMeta((prev) => ({ ...prev, ...m }));
    } catch (err) {
      toast({
        title: "Failed to load orders",
        description: err?.response?.data?.message || "Using sample data (API not reachable).",
        variant: "destructive",
      });

      const sample = mockRows();
      const q = search.trim().toLowerCase();
      const filtered = sample.filter((r) => {
        const matchesQ =
          !q ||
          [r.orderNo, r.customer, r.poNo, r.pcbType, r.finish, r.lotNo, r.woNo]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q));

        const matchesStatus = status === "all" ? true : r.status === status;
        const matchesFrom = !from ? true : new Date(r.dueDate).getTime() >= new Date(from).getTime();
        const matchesTo = !to ? true : new Date(r.dueDate).getTime() <= new Date(to + "T23:59:59").getTime();

        return matchesQ && matchesStatus && matchesFrom && matchesTo;
      });

      setRows(filtered);
      setMeta((prev) => ({ ...prev, page: 1, total: filtered.length }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, from, to]);

  const openDetails = async (row) => {
    setSelected(row);
    setGenerated(null);
    setShipmentId("");
    setDetailsOpen(true);

    const id = row?.id ?? row?._id ?? row?.orderId;
    if (!id) return;

    try {
      const res = await api.get(`/quality/certificates/coc/orders/${id}`);
      const details = res?.data?.data ?? res?.data;
      if (details) setSelected((prev) => ({ ...(prev || {}), ...(details || {}) }));
    } catch {
      // ignore
    }
  };

  const openGenerateConfirm = () => setConfirmOpen(true);

  const generateCoC = async () => {
    if (!selected) return;

    const orderId = selected?.id ?? selected?._id ?? selected?.orderId;
    if (!orderId) {
      toast({ title: "Missing order id", description: "Order id is required to generate CoC.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post("/quality/certificates/coc/generate", {
        order_id: orderId,
        shipment_id: shipmentId || undefined,
        template_id: templateId || "default",
        include_test_reports: includeTestReports,
        include_aoi_summary: includeAOISummary,
        include_etch_coupons: includeEtchCoupons,
      });

      const data = res?.data?.data ?? res?.data ?? {};
      const coc_id = data.coc_id || data.id || data.cocId;
      const pdf_url = data.pdf_url || data.pdfUrl;

      setGenerated({ coc_id, pdf_url });
      toast({ title: "CoC generated", description: "Certificate of Conformance created successfully." });
      setConfirmOpen(false);
    } catch (err) {
      // fallback (sample mode)
      const fallbackId = `COC-${String(selected?.orderNo || selected?.id || "NEW")}`;
      setGenerated({ coc_id: fallbackId, pdf_url: null });

      toast({
        title: "CoC generated (sample mode)",
        description: err?.response?.data?.message || "Generation endpoint not available; created local placeholder.",
      });
      setConfirmOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = async () => {
    if (!generated?.coc_id) return;

    setExporting(true);
    try {
      // If backend provides a direct url, open it
      if (generated.pdf_url) {
        window.open(generated.pdf_url, "_blank", "noopener,noreferrer");
        setExporting(false);
        return;
      }

      const res = await api.get(`/quality/certificates/coc/${generated.coc_id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${generated.coc_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Downloaded", description: "CoC PDF downloaded." });
    } catch (err) {
      toast({
        title: "Download failed",
        description: err?.response?.data?.message || "PDF endpoint not available.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const printPdf = async () => {
    if (!generated?.coc_id) return;

    try {
      if (generated.pdf_url) {
        const w = window.open(generated.pdf_url, "_blank", "noopener,noreferrer");
        if (w) {
          w.addEventListener("load", () => w.print());
        }
        return;
      }

      // If blob printing is needed, we download blob then open object URL
      const res = await api.get(`/quality/certificates/coc/${generated.coc_id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (w) {
        w.addEventListener("load", () => w.print());
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      toast({
        title: "Print failed",
        description: err?.response?.data?.message || "PDF endpoint not available.",
        variant: "destructive",
      });
    }
  };

  const pageFrom = (meta.page - 1) * meta.limit + 1;
  const pageTo = (meta.page - 1) * meta.limit + rows.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2551]/10">
            <FileText className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Generate CoC</h1>
              <Badge variant="outline">Quality</Badge>
              <Badge variant="secondary">Certificates</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Generate Certificate of Conformance for shipped/ready orders with optional AOI & E-test attachments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(1)} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Order Filter</CardTitle>
          <CardDescription className="text-xs">Find sales orders / shipments to generate CoC.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SO / Customer / PO / Lot / WO…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
            >
              <option value="all">All</option>
              <option value="ready">Ready</option>
              <option value="shipped">Shipped</option>
              <option value="hold">Hold</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>From (Due)</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>To (Due)</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="lg:col-span-6 mt-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>
              Showing <span className="font-medium text-gray-900">{rows.length ? `${pageFrom}-${pageTo}` : 0}</span> of{" "}
              <span className="font-medium text-gray-900">{meta.total || rows.length}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className={cx("h-2 w-2 rounded-full", loading ? "bg-amber-500" : "bg-emerald-500")} />
              {loading ? "Loading…" : "Ready"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Orders</CardTitle>
          <CardDescription className="text-xs">
            Open an order to select shipment and generate certificate.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-[1050px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Customer / PO</th>
                  <th className="px-4 py-3 text-left">PCB</th>
                  <th className="px-4 py-3 text-left">Lot / WO</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                      {loading ? "Loading orders…" : "No orders found for CoC generation."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id ?? r._id ?? r.orderNo} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.orderNo || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">Qty: {r.qty ?? "-"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.customer || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.poNo ? `PO: ${r.poNo}` : "—"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.pcbType || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.finish ? `Finish: ${r.finish}` : "—"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.lotNo || "-"}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.woNo ? `WO: ${r.woNo}` : "—"}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-800">{fmtDate(r.dueDate)}</td>
                      <td className="px-4 py-3">{badgeStatus(r.status)}</td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                            onClick={() => openDetails(r)}
                          >
                            <Sparkles className="h-4 w-4" />
                            Generate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-900">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.max(1, meta.page - 1))}
                disabled={loading || meta.page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchList(Math.min(totalPages, meta.page + 1))}
                disabled={loading || meta.page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details / Generate dialog */}
      <AlertDialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#dc2551]" />
              CoC Generation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Order <span className="font-medium">{selected?.orderNo}</span> • Customer{" "}
              <span className="font-medium">{selected?.customer}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="PO No" value={selected?.poNo || "—"} />
            <Info label="PCB Type" value={selected?.pcbType || "—"} />
            <Info label="Finish" value={selected?.finish || "—"} />
            <Info label="Quantity" value={selected?.qty ?? "—"} />
            <Info label="Lot No" value={selected?.lotNo || "—"} />
            <Info label="Work Order" value={selected?.woNo || "—"} />
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-gray-900">Options</div>
                <div className="text-xs text-gray-600">Select shipment and attachments to include in CoC package.</div>
              </div>
              <Badge variant="outline">{badgeStatus(selected?.status)?.props?.children ? " " : " "}</Badge>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Template</Label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
                >
                  <option value="default">Default (PCBxpress)</option>
                  <option value="customer">Customer Specific</option>
                  <option value="iso">ISO Style</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Shipment (optional)</Label>
                <select
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#dc2551]/30"
                >
                  <option value="">Auto / Latest shipment</option>
                  {(selected?.shipmentOptions || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} • {s.carrier} • {s.awb} • {fmtDate(s.shipDate)}
                    </option>
                  ))}
                </select>
                {selected?.shipmentOptions?.length === 0 ? (
                  <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    No shipment found. You can still generate CoC for “Ready” orders.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Attachments</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <ToggleBox
                    label="Include E-Test Report"
                    hint="Attach electrical test summary"
                    checked={includeTestReports}
                    onChange={setIncludeTestReports}
                  />
                  <ToggleBox
                    label="Include AOI Summary"
                    hint="Attach AOI results summary"
                    checked={includeAOISummary}
                    onChange={setIncludeAOISummary}
                  />
                  <ToggleBox
                    label="Include Etch Coupons"
                    hint="Attach coupon records if available"
                    checked={includeEtchCoupons}
                    onChange={setIncludeEtchCoupons}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-500" />
                  Tip: enforce “Hold” orders to require QA clearance before generating certificates.
                </p>
              </div>
            </div>
          </div>

          {generated ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <div className="font-semibold text-emerald-900">CoC Ready</div>
                    <div className="text-xs text-emerald-800/80">Certificate ID: {generated.coc_id || "—"}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={downloadPdf} disabled={exporting}>
                    <Download className={cx("h-4 w-4", exporting ? "animate-pulse" : "")} />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={printPdf}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Close</AlertDialogCancel>
            <AlertDialogAction
              className="bg-cyan-600 hover:bg-cyan-500"
              disabled={generating || String(selected?.status || "").toLowerCase() === "hold"}
              onClick={openGenerateConfirm}
            >
              {String(selected?.status || "").toLowerCase() === "hold" ? "On Hold" : "Generate CoC"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm generate */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-[#dc2551]" />
              Confirm CoC Generation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Generate CoC for <span className="font-medium">{selected?.orderNo}</span> using{" "}
              <span className="font-medium">{templateId}</span> template.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium">Attachments</span>
              <span className="text-xs text-gray-500">Included</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              <li className="flex items-center justify-between">
                <span>E-Test Report</span>
                <span>{includeTestReports ? "Yes" : "No"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>AOI Summary</span>
                <span>{includeAOISummary ? "Yes" : "No"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Etch Coupons</span>
                <span>{includeEtchCoupons ? "Yes" : "No"}</span>
              </li>
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={generateCoC}
              disabled={generating}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              {generating ? "Generating…" : "Generate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value ?? "-"}</div>
    </div>
  );
}

function ToggleBox({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "rounded-xl border p-3 text-left transition-colors",
        checked ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          <div className="mt-1 text-xs text-gray-600">{hint}</div>
        </div>
        <span
          className={cx(
            "inline-flex h-5 w-9 items-center rounded-full p-1 transition-colors",
            checked ? "bg-emerald-600" : "bg-gray-300"
          )}
        >
          <span className={cx("h-3 w-3 rounded-full bg-white transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
        </span>
      </div>
    </button>
  );
}
