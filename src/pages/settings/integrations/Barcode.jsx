// src/pages/traceability/batch/Barcode.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Barcode as BarcodeIcon,
  ClipboardCopy,
  Download,
  Filter,
  RefreshCcw,
  Search,
  Printer,
  QrCode,
  Layers,
  Hash,
  Building2,
  Factory,
  PackageCheck,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

// NOTE: Create this service file if you don't already have it:
// src/services/barcodes.service.js
import barcodesApi from "@/services/barcodes.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
          {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
        </div>
        <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551] ring-1 ring-[#dc2551]/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
      {children}
    </span>
  );
}

function EmptyState({ onRefresh }) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-2xl bg-[#dc2551]/10 p-4 text-[#dc2551] ring-1 ring-[#dc2551]/20">
          <BarcodeIcon className="h-7 w-7" />
        </div>
        <div className="mt-3 text-lg font-bold text-gray-900">No barcodes found</div>
        <div className="mt-1 max-w-md text-sm text-gray-500">
          Try changing filters, or generate new barcodes from Work Orders / Lots.
        </div>
        <div className="mt-4">
          <Button variant="outline" className="gap-2" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b py-3 last:border-b-0">
      <div className="col-span-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="col-span-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="col-span-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="col-span-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <div className="h-9 w-24 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function Barcode() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("all"); // all | lot | panel | serial | work_order | shipment
  const [status, setStatus] = useState("all"); // all | active | void | used
  const [plant, setPlant] = useState(""); // optional

  // Pagination (simple)
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await barcodesApi.list({
        q,
        type: type === "all" ? undefined : type,
        status: status === "all" ? undefined : status,
        plant: plant || undefined,
        page,
        page_size: pageSize,
      });

      // support shapes:
      // 1) { data: { items: [], meta: {..} } }
      // 2) { data: [] }
      const data = res?.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setRows(items);
    } catch (err) {
      toast({
        title: "Failed to load barcodes",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalActive = useMemo(
    () => rows.filter((r) => (r?.status || "").toLowerCase() === "active").length,
    [rows]
  );

  const totalUsed = useMemo(
    () => rows.filter((r) => (r?.status || "").toLowerCase() === "used").length,
    [rows]
  );

  const visibleRows = useMemo(() => {
    // If backend already filters, this is mostly for instant UX
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const hay = [
        r?.code,
        r?.entity_ref,
        r?.entity_type,
        r?.work_order_no,
        r?.lot_no,
        r?.panel_no,
        r?.serial_no,
        r?.customer_name,
        r?.plant_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okQ = !needle || hay.includes(needle);
      const okType = type === "all" || (r?.entity_type || "").toLowerCase() === type.toLowerCase();
      const okStatus = status === "all" || (r?.status || "").toLowerCase() === status.toLowerCase();
      const okPlant = !plant || (r?.plant_code || "").toLowerCase().includes(plant.toLowerCase());
      return okQ && okType && okStatus && okPlant;
    });
  }, [rows, q, type, status, plant]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Barcode copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const downloadCSV = () => {
    const headers = [
      "code",
      "status",
      "entity_type",
      "entity_ref",
      "work_order_no",
      "lot_no",
      "panel_no",
      "serial_no",
      "plant_code",
      "created_at",
    ];

    const csv = [
      headers.join(","),
      ...visibleRows.map((r) =>
        headers
          .map((h) => {
            const v = r?.[h] ?? "";
            const safe = String(v).replace(/"/g, '""');
            return `"${safe}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcodes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printLabel = (row) => {
    // Simple print window for label (backend can provide printable HTML/PDF later)
    const title = `Barcode - ${row?.code || ""}`;
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            .label { border: 1px solid #111; border-radius: 10px; padding: 16px; width: 320px; }
            .row { display:flex; justify-content:space-between; font-size: 12px; margin-top: 6px; }
            .code { font-size: 16px; font-weight: 700; letter-spacing: .4px; margin-top: 10px; }
            .hint { font-size: 11px; color: #444; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="label">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:34px;height:34px;border-radius:10px;background:#dc2551;color:#fff;display:grid;place-items:center;font-weight:700;">PX</div>
              <div>
                <div style="font-size:12px;color:#444;">PCB Xpress • Traceability</div>
                <div class="code">${row?.code || "-"}</div>
              </div>
            </div>
            <div class="row"><span>Type</span><b>${row?.entity_type || "-"}</b></div>
            <div class="row"><span>Ref</span><b>${row?.entity_ref || "-"}</b></div>
            <div class="row"><span>Status</span><b>${row?.status || "-"}</b></div>
            <div class="row"><span>Plant</span><b>${row?.plant_code || "-"}</b></div>
            <div class="hint">Use this barcode during WIP moves, QC inspections, NCR, and dispatch.</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const headerPill = (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#dc2551]/10 px-3 py-1 text-xs font-semibold text-[#dc2551] ring-1 ring-[#dc2551]/20">
      <QrCode className="h-4 w-4" />
      Traceability • Barcode Registry
    </span>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Barcodes</h1>
            {headerPill}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Central registry for Lot / Panel / Serial / Work Order barcodes used in PCB manufacturing traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={downloadCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => fetchRows()}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat icon={BarcodeIcon} label="Loaded" value={rows.length} hint="Current page items" />
        <Stat icon={PackageCheck} label="Active" value={totalActive} hint="Ready for scan" />
        <Stat icon={Layers} label="Used" value={totalUsed} hint="Consumed / linked" />
        <Stat
          icon={Factory}
          label="Plant"
          value={plant ? plant : "All"}
          hint="Filter by plant code"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-5 space-y-1">
              <Label>
                <span className="inline-flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  Search
                </span>
              </Label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search barcode, lot no, WO, serial, customer..."
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <Label>
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  Type
                </span>
              </Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All</option>
                <option value="lot">Lot</option>
                <option value="panel">Panel</option>
                <option value="serial">Serial</option>
                <option value="work_order">Work Order</option>
                <option value="shipment">Shipment</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="void">Void</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Plant
                </span>
              </Label>
              <Input value={plant} onChange={(e) => setPlant(e.target.value)} placeholder="PLT-01" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
              onClick={() => {
                setPage(1);
                fetchRows();
              }}
              disabled={loading}
            >
              <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
              Apply
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setType("all");
                setStatus("all");
                setPlant("");
                setPage(1);
                fetchRows();
              }}
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">Barcode Records</div>
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold">{page}</span> • Showing{" "}
            <span className="font-semibold">{visibleRows.length}</span> item(s)
          </div>
        </div>

        <div className="hidden grid-cols-12 gap-3 border-b pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
          <div className="col-span-4">Barcode</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Ref</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="mt-2 space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState onRefresh={fetchRows} />
        ) : (
          <div className="mt-2 divide-y">
            {visibleRows.map((r) => (
              <motion.div
                key={r?.id || r?.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 gap-2 py-3 md:grid-cols-12 md:items-center md:gap-3"
              >
                <div className="md:col-span-4">
                  <div className="flex items-start justify-between gap-2 md:block">
                    <div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <div className="font-semibold text-gray-900">{r?.code || "-"}</div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {r?.work_order_no ? <Badge>WO: {r.work_order_no}</Badge> : null}
                        {r?.lot_no ? <Badge>LOT: {r.lot_no}</Badge> : null}
                        {r?.panel_no ? <Badge>PANEL: {r.panel_no}</Badge> : null}
                        {r?.serial_no ? <Badge>SERIAL: {r.serial_no}</Badge> : null}
                      </div>
                      {r?.created_at ? (
                        <div className="mt-1 text-xs text-gray-500">
                          Created: {String(r.created_at).slice(0, 10)}
                          {r?.plant_code ? ` • Plant: ${r.plant_code}` : ""}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500 md:hidden">Type</div>
                  <div className="text-sm font-medium text-gray-900">{r?.entity_type || "-"}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500 md:hidden">Ref</div>
                  <div className="text-sm text-gray-900">{r?.entity_ref || "-"}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500 md:hidden">Status</div>
                  <span
                    className={cx(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                      String(r?.status || "").toLowerCase() === "active" &&
                        "bg-green-50 text-green-700 ring-green-200",
                      String(r?.status || "").toLowerCase() === "used" &&
                        "bg-blue-50 text-blue-700 ring-blue-200",
                      String(r?.status || "").toLowerCase() === "void" &&
                        "bg-red-50 text-red-700 ring-red-200",
                      !["active", "used", "void"].includes(String(r?.status || "").toLowerCase()) &&
                        "bg-gray-50 text-gray-700 ring-gray-200"
                    )}
                  >
                    {r?.status || "Unknown"}
                  </span>
                </div>

                <div className="md:col-span-2 flex flex-wrap justify-start gap-2 md:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => copyToClipboard(r?.code || "")}
                    disabled={!r?.code}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    Copy
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => printLabel(r)}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div className="text-xs text-gray-500">
            Tip: Generate barcodes automatically from Work Orders / Lots / Serial Register for perfect traceability.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
