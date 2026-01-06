// src/pages/inventory/serials/SerialRegister.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Barcode,
  Calendar,
  Check,
  Factory,
  FileText,
  Hash,
  Loader2,
  Package,
  Plus,
  Printer,
  RefreshCw,
  ScanLine,
  Settings2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import settingsApi from "@/services/settings.service";
import serialsService from "@/services/inventory/serials.service";

function cx(...p) {
  return p.filter(Boolean).join(" ");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const SIZE_OPTIONS = ["small", "medium", "large"];
const LAYOUT_OPTIONS = ["1", "2"];

export default function SerialRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companyName, setCompanyName] = useState("PCBXpress ERP");

  // Form state
  const [plant, setPlant] = useState(searchParams.get("plant") || "MAIN");
  const [workOrderNo, setWorkOrderNo] = useState(searchParams.get("wo") || "");
  const [lotNo, setLotNo] = useState(searchParams.get("lot") || "");
  const [itemCode, setItemCode] = useState(searchParams.get("item") || "");
  const [revision, setRevision] = useState(searchParams.get("rev") || "A");
  const [quantity, setQuantity] = useState(Number(searchParams.get("qty") || 1));
  const [mfgDate, setMfgDate] = useState(searchParams.get("date") || todayISO());

  // Print preferences
  const [labelSize, setLabelSize] = useState(SIZE_OPTIONS.includes(searchParams.get("size")) ? searchParams.get("size") : "medium");
  const [labelLayout, setLabelLayout] = useState(LAYOUT_OPTIONS.includes(searchParams.get("layout")) ? searchParams.get("layout") : "1");

  // Response / list
  const [creating, setCreating] = useState(false);
  const [serials, setSerials] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  // Load company name
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

  const qtySafe = useMemo(() => {
    const n = Number(quantity);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(5000, n));
  }, [quantity]);

  const isValid = useMemo(() => {
    return (
      plant.trim() &&
      workOrderNo.trim() &&
      lotNo.trim() &&
      itemCode.trim() &&
      revision.trim() &&
      qtySafe >= 1
    );
  }, [plant, workOrderNo, lotNo, itemCode, revision, qtySafe]);

  const syncParams = (next = {}) => {
    const sp = new URLSearchParams(searchParams);

    const setOrDel = (key, val) => {
      const v = (val ?? "").toString().trim();
      if (v) sp.set(key, v);
      else sp.delete(key);
    };

    setOrDel("plant", next.plant ?? plant);
    setOrDel("wo", next.wo ?? workOrderNo);
    setOrDel("lot", next.lot ?? lotNo);
    setOrDel("item", next.item ?? itemCode);
    setOrDel("rev", next.rev ?? revision);
    setOrDel("date", next.date ?? mfgDate);
    sp.set("qty", String(next.qty ?? qtySafe));
    sp.set("size", String(next.size ?? labelSize));
    sp.set("layout", String(next.layout ?? labelLayout));

    setSearchParams(sp, { replace: true });
  };

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    if (!isValid) {
      toast({
        title: "Missing fields",
        description: "Fill Plant, Work Order, Lot, Item Code, Revision and Quantity.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      syncParams();

      /**
       * Expected backend (recommended):
       * POST /inventory/serials/register
       * body: { plant, workOrderNo, lotNo, itemCode, revision, quantity, mfgDate }
       * response: { serials: ["SN-...","SN-..."], prefix?, start?, end? }
       */
      const res = await serialsService.registerSerials({
        plant: plant.trim(),
        workOrderNo: workOrderNo.trim(),
        lotNo: lotNo.trim(),
        itemCode: itemCode.trim(),
        revision: revision.trim(),
        quantity: qtySafe,
        mfgDate,
      });

      const payload = res?.data ?? res;
      const list = payload?.serials || payload?.items || payload?.data || [];

      if (!Array.isArray(list) || list.length === 0) {
        toast({
          title: "Created",
          description: "Serials were created, but none returned by API.",
        });
        setSerials([]);
      } else {
        setSerials(list.map((x) => (typeof x === "string" ? x : x?.serial || x?.serialNo)).filter(Boolean));
        toast({
          title: "Serials generated",
          description: `${list.length} serial(s) created for WO ${workOrderNo.trim()}.`,
        });
      }

      setPreviewOpen(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to register serials. Please try again.";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handlePrintAll = () => {
    if (!serials.length) return;
    // Open SerialPrint with first serial and quantity, or print one-by-one.
    // Best UX: open first serial and let user print, but for bulk printing we do "print queue":
    // We'll open SerialPrint for each serial in new tab. (Browsers may block popups if too many.)
    // So we open one page that can print multiple labels: use qty in print page.
    // Here: open first serial with qty=1 is not enough. Better: open print for each serial, qty=1.
    // We'll do a safe approach: open a new tab with a "bulk" mode param.
    const url = `/inventory/serials/print-bulk?size=${encodeURIComponent(labelSize)}&layout=${encodeURIComponent(
      labelLayout
    )}`;
    toast({
      title: "Bulk print",
      description: "Open Bulk Print page (recommended). If you don’t have it yet, tell me and I’ll create it.",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenPrintForOne = (s) => {
    const url =
      `/inventory/serials/print?serial=${encodeURIComponent(s)}` +
      `&qty=1&size=${encodeURIComponent(labelSize)}&layout=${encodeURIComponent(labelLayout)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleClear = () => {
    setClearOpen(false);
    setSerials([]);
    toast({ title: "Cleared", description: "Generated list cleared." });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Serial Register</h1>
            <p className="text-sm text-gray-500">
              Generate traceable serial numbers for PCB production lots (WO → Lot → Serial).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/inventory/serials/lookup">
            <Button variant="outline">
              <ScanLine className="mr-2 h-4 w-4" />
              Serial Lookup
            </Button>
          </Link>
          <Link to="/inventory/serials/history">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Serial History
            </Button>
          </Link>
          <Button
            className="bg-cyan-600 hover:bg-cyan-500"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-4 w-4 text-gray-500" />
            Create Serials
          </CardTitle>
          <CardDescription>
            Create serials for a PCB work order and lot. Recommended: 1 serial per PCB (or per panel, based on your traceability rule).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-3">
              <Label>Plant</Label>
              <div className="mt-2 relative">
                <Factory className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={plant}
                  onChange={(e) => {
                    setPlant(e.target.value);
                    syncParams({ plant: e.target.value });
                  }}
                  placeholder="MAIN / PLANT-1"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Work Order (WO)</Label>
              <div className="mt-2 relative">
                <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={workOrderNo}
                  onChange={(e) => {
                    setWorkOrderNo(e.target.value);
                    syncParams({ wo: e.target.value });
                  }}
                  placeholder="WO-2026-00021"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Lot No</Label>
              <div className="mt-2 relative">
                <Package className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={lotNo}
                  onChange={(e) => {
                    setLotNo(e.target.value);
                    syncParams({ lot: e.target.value });
                  }}
                  placeholder="LOT-00088"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Item Code</Label>
              <div className="mt-2 relative">
                <FileText className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={itemCode}
                  onChange={(e) => {
                    setItemCode(e.target.value);
                    syncParams({ item: e.target.value });
                  }}
                  placeholder="PCB-2L-ACME-001"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Revision</Label>
              <Input
                className="mt-2"
                value={revision}
                onChange={(e) => {
                  setRevision(e.target.value);
                  syncParams({ rev: e.target.value });
                }}
                placeholder="A"
                required
              />
            </div>

            <div className="md:col-span-4">
              <Label>Manufacturing Date</Label>
              <div className="mt-2 relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  className="pl-9 mt-2"
                  value={mfgDate}
                  onChange={(e) => {
                    setMfgDate(e.target.value);
                    syncParams({ date: e.target.value });
                  }}
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Quantity</Label>
              <Input
                className="mt-2"
                type="number"
                min={1}
                max={5000}
                value={qtySafe}
                onChange={(e) => {
                  const n = Number(e.target.value || 1);
                  setQuantity(n);
                  syncParams({ qty: Math.max(1, n) });
                }}
                required
              />
            </div>

            {/* Print prefs */}
            <div className="md:col-span-2">
              <Label>Label Size</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={labelSize === s ? "default" : "outline"}
                    className={cx(labelSize === s ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                    onClick={() => {
                      setLabelSize(s);
                      syncParams({ size: s });
                    }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Label Layout</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {LAYOUT_OPTIONS.map((l) => (
                  <Button
                    key={l}
                    type="button"
                    variant={labelLayout === l ? "default" : "outline"}
                    className={cx(labelLayout === l ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                    onClick={() => {
                      setLabelLayout(l);
                      syncParams({ layout: l });
                    }}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500"
                disabled={creating || !isValid}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Generate Serials
              </Button>

              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                <Check className="mr-2 h-4 w-4" />
                {companyName}
              </Badge>

              {!isValid && (
                <span className="text-xs text-gray-500">
                  Fill required fields to enable generation.
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Generated Serials</CardTitle>
            <CardDescription>
              {serials.length
                ? "Print individual labels or open bulk print."
                : "Generate serials to see them here."}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!serials.length}>
              <Settings2 className="mr-2 h-4 w-4" />
              Preview / Print
            </Button>

            <Button variant="outline" onClick={handlePrintAll} disabled={!serials.length}>
              <Printer className="mr-2 h-4 w-4" />
              Bulk Print
            </Button>

            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setClearOpen(true)}
              disabled={!serials.length}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {!serials.length ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="text-sm font-medium text-gray-900">No serials yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Generate serials for a lot, then print labels for traceability.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {serials.slice(0, 200).map((s, idx) => (
                <motion.div
                  key={`${s}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between rounded-xl border bg-white p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#DC2551]/10 text-[#DC2551] hover:bg-[#DC2551]/10">
                        <Barcode className="mr-2 h-4 w-4" />
                        Serial
                      </Badge>
                      <span className="font-mono text-sm font-semibold text-gray-900 truncate">{s}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      WO: <span className="font-medium">{workOrderNo || "—"}</span> · LOT:{" "}
                      <span className="font-medium">{lotNo || "—"}</span> · ITEM:{" "}
                      <span className="font-medium">{itemCode || "—"}</span> · REV:{" "}
                      <span className="font-medium">{revision || "—"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleOpenPrintForOne(s)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Link
                      to={`/inventory/serials/lookup?serial=${encodeURIComponent(s)}`}
                      className="inline-flex"
                    >
                      <Button variant="outline">
                        <ScanLine className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}

              {serials.length > 200 && (
                <div className="md:col-span-2 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                  Showing first <span className="font-semibold">200</span> serials for performance. Use Serial History for full export.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview / Print dialog */}
      <ConfirmationDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Print Options"
        description="Print serial labels. For bulk printing, it's best to use a dedicated bulk print page."
        confirmText="Done"
        onConfirm={() => setPreviewOpen(false)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6 rounded-xl border bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-700">Current Batch</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Plant</p>
                <p className="font-medium">{plant || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mfg Date</p>
                <p className="font-medium">{mfgDate || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">WO</p>
                <p className="font-medium">{workOrderNo || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lot</p>
                <p className="font-medium">{lotNo || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Item</p>
                <p className="font-medium">{itemCode || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rev</p>
                <p className="font-medium">{revision || "—"}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-[#DC2551]/10 text-[#DC2551] hover:bg-[#DC2551]/10">
                <Package className="mr-2 h-4 w-4" />
                Qty: {serials.length || 0}
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                <Settings2 className="mr-2 h-4 w-4" />
                Size: {labelSize} · Layout: {labelLayout}
              </Badge>
            </div>
          </div>

          <div className="md:col-span-6 rounded-xl border p-3">
            <p className="text-xs font-semibold text-gray-700">Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                className="bg-cyan-600 hover:bg-cyan-500"
                onClick={() => {
                  setPreviewOpen(false);
                  if (serials[0]) handleOpenPrintForOne(serials[0]);
                }}
                disabled={!serials.length}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print First Label
              </Button>

              <Button variant="outline" onClick={handlePrintAll} disabled={!serials.length}>
                <Printer className="mr-2 h-4 w-4" />
                Open Bulk Print
              </Button>

              <Link to="/inventory/serials/history" className="inline-flex">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Go to History
                </Button>
              </Link>
            </div>

            <div className="mt-3 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
              If you want, I can create <span className="font-semibold">SerialBulkPrint.jsx</span> that prints all generated serials in a single print job.
            </div>
          </div>
        </div>
      </ConfirmationDialog>

      {/* Clear confirmation */}
      <ConfirmationDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear generated list?"
        description="This only clears the list in this screen (it does not delete serials from the database)."
        confirmText="Clear"
        confirmVariant="destructive"
        onConfirm={handleClear}
      />
    </div>
  );
}
