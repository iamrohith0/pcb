// src/pages/inventory/serials/SerialPrint.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Loader2,
  Hash,
  QrCode,
  Barcode,
  Copy,
  Check,
  Settings2,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import serialsService from "@/services/inventory/serials.service";
import settingsApi from "@/services/settings.service";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function safeStr(v) {
  return v === null || v === undefined ? "" : String(v);
}

/**
 * SerialPrint
 * - Prints PCB manufacturing serial labels (QR + key text fields)
 * - Supports URL params:
 *    ?serial=SN-000123
 *    ?qty=3
 *    ?size=small|medium|large
 *    ?layout=1|2
 */
export default function SerialPrint() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSerial = searchParams.get("serial") || "";
  const initialQty = Number(searchParams.get("qty") || 1);
  const initialSize = searchParams.get("size") || "medium";
  const initialLayout = searchParams.get("layout") || "1";

  const [companyName, setCompanyName] = useState("PCBXpress ERP");
  const [serial, setSerial] = useState(initialSerial);
  const [qty, setQty] = useState(Number.isFinite(initialQty) && initialQty > 0 ? initialQty : 1);
  const [size, setSize] = useState(["small", "medium", "large"].includes(initialSize) ? initialSize : "medium");
  const [layout, setLayout] = useState(["1", "2"].includes(initialLayout) ? initialLayout : "1");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  const canLoad = useMemo(() => serial.trim().length > 0, [serial]);

  // Fetch company name (for label header)
  useEffect(() => {
    const fetchName = async () => {
      try {
        const res = await settingsApi.get();
        const name = res?.data?.company?.name;
        if (name) setCompanyName(name);
      } catch {
        // ignore
      }
    };
    fetchName();
  }, []);

  // Auto-load if serial param exists
  useEffect(() => {
    if (initialSerial) {
      load(initialSerial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncParams = (next = {}) => {
    const sp = new URLSearchParams(searchParams);
    if (next.serial !== undefined) {
      if (next.serial) sp.set("serial", next.serial);
      else sp.delete("serial");
    }
    if (next.qty !== undefined) sp.set("qty", String(next.qty));
    if (next.size !== undefined) sp.set("size", String(next.size));
    if (next.layout !== undefined) sp.set("layout", String(next.layout));
    setSearchParams(sp, { replace: true });
  };

  const load = async (serialValue) => {
    const s = (serialValue ?? serial).trim();
    if (!s) return;

    setLoading(true);
    setData(null);

    try {
      syncParams({ serial: s, qty, size, layout });

      // Expected: backend returns serial details suitable for printing
      const res = await serialsService.getSerial(s);
      const payload = res?.data ?? res;

      setData(payload);
      toast({ title: "Loaded", description: `Ready to print label for ${s}` });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load serial details for printing.";
      toast({ title: "Load failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Simple print: CSS ensures only print area is visible.
    window.print();
  };

  const handleCopySerial = async () => {
    try {
      await navigator.clipboard.writeText(serial.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  };

  const clear = () => {
    setSerial("");
    setData(null);
    syncParams({ serial: "" });
  };

  // Derived fields (support multiple backend payload shapes)
  const serialNo = serial.trim() || data?.serial || data?.serialNo || "—";
  const itemName = data?.itemName || data?.item?.name || "—";
  const itemCode = data?.itemCode || data?.item?.code || data?.sku || "—";
  const lotNo = data?.lotNo || data?.lot?.lotNo || "—";
  const plant = data?.plant || data?.plantName || "—";
  const jobNo = data?.jobNo || data?.workOrderNo || data?.woNo || "—";
  const rev = data?.revision || data?.rev || data?.pcbRev || "—";
  const customer = data?.customerName || data?.customer?.name || "—";
  const mfgDate = data?.mfgDate || data?.manufacturedAt || data?.createdAt || "—";

  // QR content
  const qrValue = useMemo(() => {
    // Keep it stable and useful for scanning
    // You can replace with a deep link if you want:
    // return `${window.location.origin}/inventory/serials/lookup?serial=${encodeURIComponent(serialNo)}`;
    return JSON.stringify({
      serial: serialNo,
      itemCode,
      lotNo,
      jobNo,
      rev,
      plant,
    });
  }, [serialNo, itemCode, lotNo, jobNo, rev, plant]);

  const qtySafe = Math.max(1, Math.min(200, Number(qty) || 1));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Print styles (scoped in this page) */}
      <style>{`
        /* Label sizing presets */
        :root{
          --lbl-w: 62mm;
          --lbl-h: 30mm;
          --lbl-pad: 6mm;
          --lbl-radius: 10px;
        }
        .lbl-small { --lbl-w: 50mm; --lbl-h: 25mm; --lbl-pad: 5mm; }
        .lbl-medium { --lbl-w: 62mm; --lbl-h: 30mm; --lbl-pad: 6mm; }
        .lbl-large { --lbl-w: 80mm; --lbl-h: 38mm; --lbl-pad: 7mm; }

        /* Print-only rules */
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; }
          .print-grid { gap: 0 !important; }
          .label { box-shadow: none !important; border: 1px solid #111827 !important; page-break-inside: avoid; }
        }

        .label {
          width: var(--lbl-w);
          height: var(--lbl-h);
          border-radius: var(--lbl-radius);
          border: 1px solid rgba(17,24,39,.18);
          background: white;
          overflow: hidden;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
        }
        .label-inner {
          height: 100%;
          padding: var(--lbl-pad);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }
        .label-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(220, 37, 81, 0.10);
          color: #DC2551;
          font-weight: 700;
          font-size: 11px;
          line-height: 1;
          white-space: nowrap;
        }
        .brand-dot {
          width: 16px;
          height: 16px;
          border-radius: 6px;
          background: #DC2551;
          color: white;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 800;
        }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .k { font-size: 10px; color: rgba(17,24,39,.55); font-weight: 700; }
        .v { font-size: 11px; color: rgba(17,24,39,.9); font-weight: 700; }
        .tiny { font-size: 10px; color: rgba(17,24,39,.70); font-weight: 600; }
        .qr {
          width: 22mm;
          height: 22mm;
          border-radius: 10px;
          border: 1px solid rgba(17,24,39,.15);
          display: grid;
          place-items: center;
          overflow: hidden;
          background: white;
        }
        .qr img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .grid2 {
          margin-top: 6px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 10px;
        }
        .line {
          height: 1px;
          background: rgba(17,24,39,.12);
          margin: 6px 0;
        }
      `}</style>

      {/* Header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Serial Print</h1>
            <p className="text-sm text-gray-500">
              Print PCBXpress serial labels (QR + key fields). Use a label printer for best results.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/inventory/serials/lookup">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Serial Lookup
            </Button>
          </Link>
          <Button variant="outline" onClick={() => load()} disabled={loading || !canLoad}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Load
          </Button>
          <Button className="bg-[#DC2551] hover:bg-[#B02045]" onClick={handlePrint} disabled={!data}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-gray-500" />
            Print Settings
          </CardTitle>
          <CardDescription>Serial, quantity, size and layout options.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <Label>Serial</Label>
            <div className="mt-2 flex gap-2">
              <Input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="SN-000123"
                onKeyDown={(e) => {
                  if (e.key === "Enter") load(e.currentTarget.value);
                }}
              />
              <Button variant="outline" onClick={handleCopySerial} disabled={!serial.trim()}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" onClick={clear} disabled={!serial && !data}>
                Clear
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Tip: you can pass <span className="font-mono">?serial=...</span> in URL.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>Quantity</Label>
            <Input
              className="mt-2"
              type="number"
              min={1}
              max={200}
              value={qtySafe}
              onChange={(e) => {
                const n = Number(e.target.value || 1);
                setQty(n);
                syncParams({ qty: Math.max(1, n) });
              }}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Size</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["small", "medium", "large"].map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={size === s ? "default" : "outline"}
                  className={cx(size === s ? "bg-[#DC2551] hover:bg-[#B02045]" : "")}
                  onClick={() => {
                    setSize(s);
                    syncParams({ size: s });
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>Layout</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["1", "2"].map((l) => (
                <Button
                  key={l}
                  type="button"
                  variant={layout === l ? "default" : "outline"}
                  className={cx(layout === l ? "bg-[#DC2551] hover:bg-[#B02045]" : "")}
                  onClick={() => {
                    setLayout(l);
                    syncParams({ layout: l });
                  }}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-12 flex flex-wrap gap-2">
            <Button
              className="bg-[#DC2551] hover:bg-[#B02045]"
              onClick={() => load()}
              disabled={loading || !canLoad}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Load Serial Data
            </Button>

            <Button variant="outline" onClick={handlePrint} disabled={!data}>
              <Printer className="mr-2 h-4 w-4" />
              Print Now
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Sync all current params into URL
                syncParams({ serial: serial.trim(), qty: qtySafe, size, layout });
                toast({ title: "Updated", description: "URL updated with print settings." });
              }}
              disabled={!serial.trim()}
            >
              <Hash className="mr-2 h-4 w-4" />
              Save to URL
            </Button>

            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
              <Barcode className="mr-2 h-4 w-4" />
              Label printer recommended
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Print Area */}
      <div className="print-area">
        {!data ? (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Load a serial to preview the label.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm font-medium text-gray-900">No serial loaded</p>
                <p className="mt-1 text-sm text-gray-500">
                  Enter a serial above and click <span className="font-medium">Load</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            ref={printRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader className="no-print">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-gray-500" />
                  Label Preview
                </CardTitle>
                <CardDescription>
                  Preview updates based on size/layout. Printing will repeat the label for quantity.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className={cx("print-grid grid gap-4", "grid-cols-2 md:grid-cols-4 lg:grid-cols-6")}>
                  {Array.from({ length: qtySafe }).map((_, i) => (
                    <LabelCard
                      key={i}
                      companyName={companyName}
                      size={size}
                      layout={layout}
                      fields={{
                        serialNo,
                        itemName,
                        itemCode,
                        lotNo,
                        plant,
                        jobNo,
                        rev,
                        customer,
                        mfgDate,
                      }}
                      qrValue={qrValue}
                    />
                  ))}
                </div>

                <div className="no-print mt-4 rounded-xl border bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-700">QR content</p>
                  <p className="mt-1 break-all text-xs text-gray-600">{safeStr(qrValue)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * LabelCard
 * - Uses external QR generator (no extra packages needed)
 * - If you want fully offline QR rendering, tell me what libraries you're okay to install.
 */
function LabelCard({ companyName, size, layout, fields, qrValue }) {
  const {
    serialNo,
    itemName,
    itemCode,
    lotNo,
    plant,
    jobNo,
    rev,
    customer,
    mfgDate,
  } = fields;

  const qrSrc = useMemo(() => {
    // Simple QR without adding a dependency:
    // You can swap provider or implement backend qr endpoint later.
    const enc = encodeURIComponent(qrValue);
    // size ~ 220px good for printing; printer will scale.
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${enc}`;
  }, [qrValue]);

  return (
    <div className={cx("label", `lbl-${size}`)} aria-label="serial-label">
      <div className="label-inner">
        <div className="min-w-0">
          <div className="label-topline">
            <span className="brand-pill">
              <span className="brand-dot">P</span>
              {companyName}
            </span>
            <span className="tiny">{layout === "2" ? "PCB Serial" : "Trace Label"}</span>
          </div>

          <div className="line" />

          {/* Layout 1: compact + serial prominent */}
          {layout === "1" ? (
            <>
              <div className="space-y-1">
                <div>
                  <div className="k">SERIAL</div>
                  <div className="v mono">{safeStr(serialNo) || "—"}</div>
                </div>

                <div className="grid2">
                  <div>
                    <div className="k">ITEM</div>
                    <div className="v">{safeStr(itemCode) || "—"}</div>
                  </div>
                  <div>
                    <div className="k">LOT</div>
                    <div className="v mono">{safeStr(lotNo) || "—"}</div>
                  </div>
                  <div>
                    <div className="k">WO</div>
                    <div className="v mono">{safeStr(jobNo) || "—"}</div>
                  </div>
                  <div>
                    <div className="k">REV</div>
                    <div className="v mono">{safeStr(rev) || "—"}</div>
                  </div>
                </div>

                <div className="line" />

                <div className="grid2">
                  <div>
                    <div className="k">PLANT</div>
                    <div className="v">{safeStr(plant) || "—"}</div>
                  </div>
                  <div>
                    <div className="k">DATE</div>
                    <div className="v mono">{safeStr(mfgDate) || "—"}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Layout 2: customer + description emphasis */
            <>
              <div className="space-y-1">
                <div>
                  <div className="k">SERIAL</div>
                  <div className="v mono">{safeStr(serialNo) || "—"}</div>
                </div>

                <div>
                  <div className="k">ITEM NAME</div>
                  <div className="v">{safeStr(itemName) || "—"}</div>
                </div>

                <div className="grid2">
                  <div>
                    <div className="k">ITEM</div>
                    <div className="v">{safeStr(itemCode) || "—"}</div>
                  </div>
                  <div>
                    <div className="k">LOT</div>
                    <div className="v mono">{safeStr(lotNo) || "—"}</div>
                  </div>
                </div>

                <div className="grid2">
                  <div>
                    <div className="k">CUSTOMER</div>
                    <div className="v">{safeStr(customer) || "—"}</div>
                  </div>
                  <div>
                    <div className="k">WO</div>
                    <div className="v mono">{safeStr(jobNo) || "—"}</div>
                  </div>
                </div>

                <div className="grid2">
                  <div>
                    <div className="k">PLANT</div>
                    <div className="v">{safeStr(plant) || "—"}</div>
                  </div>
                  <div>
                    <div className="k">REV</div>
                    <div className="v mono">{safeStr(rev) || "—"}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* QR */}
        <div className="flex flex-col items-end justify-between">
          <div className="qr" title="QR">
            {/* If QR provider is blocked, image will show broken.
                Then we can replace with a backend qr endpoint. */}
            <img src={qrSrc} alt="QR" />
          </div>
          <div className="mt-2 text-right">
            <div className="k">SCAN</div>
            <div className="tiny mono">{String(serialNo).slice(0, 10)}{String(serialNo).length > 10 ? "…" : ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

