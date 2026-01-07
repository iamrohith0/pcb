// src/pages/inventory/lots/LotDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Barcode,
  CalendarDays,
  Edit3,
  Factory,
  Hash,
  Info,
  Loader2,
  PackageSearch,
  ShieldCheck,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import lotsService from "@/services/inventory/lots.service";
import inventoryItemsService from "@/services/inventory/items.service";

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

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_META = {
  QUARANTINE: { label: "Quarantine", icon: ShieldCheck, className: "bg-amber-50 text-amber-700 border-amber-200" },
  RELEASED: { label: "Released", icon: BadgeCheck, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BLOCKED: { label: "Blocked", icon: XCircle, className: "bg-rose-50 text-rose-700 border-rose-200" },
  CONSUMED: { label: "Consumed", icon: PackageSearch, className: "bg-slate-50 text-slate-700 border-slate-200" },
};

const QUALITY_GATE_LABEL = {
  NONE: "None",
  COA_REQUIRED: "CoA Required",
  INCOMING_INSPECTION: "Incoming Inspection",
  LAB_TEST: "Lab Test",
};

function safe(v) {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

function fmtDate(d) {
  if (!d) return "—";
  // Accepts yyyy-mm-dd or ISO
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
}

export default function LotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [lot, setLot] = useState(null);
  const [item, setItem] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusKey = (lot?.status || "QUARANTINE").toUpperCase();
  const statusMeta = STATUS_META[statusKey] || STATUS_META.QUARANTINE;
  const StatusIcon = statusMeta.icon;

  const lotNumber = lot?.lot_number ?? lot?.lotNumber ?? lot?.code ?? lot?.number ?? "";
  const itemId = lot?.item_id ?? lot?.itemId ?? lot?.item?._id ?? lot?.item?.id;

  const qtyReceived = lot?.qty_received ?? lot?.qtyReceived ?? lot?.received_qty;
  const qtyAvailable = lot?.qty_available ?? lot?.qtyAvailable ?? lot?.available_qty;
  const uom = lot?.uom ?? lot?.unit ?? item?.uom ?? item?.unit;

  const isExpired = useMemo(() => {
    if (!lot?.expiry_date) return false;
    const now = new Date();
    const exp = new Date(lot.expiry_date);
    if (Number.isNaN(exp.getTime())) return false;
    // Compare dates (ignore time)
    return exp.toISOString().slice(0, 10) < now.toISOString().slice(0, 10);
  }, [lot?.expiry_date]);

  const expiryBadge = useMemo(() => {
    if (!lot?.expiry_date) return null;
    return (
      <Badge
        variant="secondary"
        className={cx(
          "gap-1 border",
          isExpired ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-700 border-slate-200"
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        exp {fmtDate(lot.expiry_date)}
      </Badge>
    );
  }, [lot?.expiry_date, isExpired]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await lotsService.getById(id);
      const data = res?.data?.lot ?? res?.data ?? null;
      setLot(data);

      const itId = data?.item_id ?? data?.itemId ?? data?.item?._id ?? data?.item?.id;
      if (itId) {
        try {
          const itRes = await inventoryItemsService.getById(itId);
          const itData = itRes?.data?.item ?? itRes?.data ?? null;
          setItem(itData);
        } catch {
          // fallback: may already have item embedded
          setItem(data?.item ?? null);
        }
      } else {
        setItem(data?.item ?? null);
      }
    } catch (err) {
      toast({
        title: "Failed to load lot",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
      navigate("/inventory/lots", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await lotsService.remove(id);
      toast({ title: "Lot deleted", description: "The lot has been removed successfully." });
      navigate("/inventory/lots", { replace: true });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading lot...
        </div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
        Lot not found. <Link className="text-[#dc2551] underline" to="/inventory/lots">Back to lots</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/inventory/lots" className="inline-flex items-center gap-2 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Lots
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Details</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{lotNumber || "Lot Details"}</h1>
            <Badge className={cx("gap-1 border", statusMeta.className)} variant="secondary">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusMeta.label}
            </Badge>
            {expiryBadge}
          </div>

          <p className="mt-1 text-sm text-gray-600">
            Traceability view: supplier → stores → QA → production usage (WIP) for PCB materials/chemicals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to={`/inventory/lots/${id}/edit`}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: lot info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-gray-600" />
              Lot Information
            </CardTitle>
            <CardDescription>Core identification, supplier references, and storage info.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Item block */}
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Item</p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {safe(item?.name ?? lot?.item_name ?? lot?.itemName)}
                    {item?.item_code || item?.code ? (
                      <span className="ml-2 text-xs font-medium text-gray-600">
                        ({item?.item_code ?? item?.code})
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Type: <span className="font-medium text-gray-900">{safe(item?.type ?? lot?.item_type)}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    UOM: <span className="font-medium text-gray-900">{safe(uom)}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 border bg-white">
                    <Hash className="h-3.5 w-3.5" />
                    item id: {safe(itemId)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Key fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon={Hash} label="Lot Number" value={lotNumber} />
              <InfoRow icon={Truck} label="Supplier" value={safe(lot?.supplier_name ?? lot?.supplierName)} />

              <InfoRow icon={Hash} label="Supplier Lot Ref" value={safe(lot?.supplier_lot_ref ?? lot?.supplierLotRef)} />
              <InfoRow icon={ShieldCheck} label="Quality Gate" value={safe(QUALITY_GATE_LABEL[lot?.quality_gate] ?? lot?.quality_gate)} />

              <InfoRow icon={CalendarDays} label="Received Date" value={fmtDate(lot?.received_date)} />
              <InfoRow icon={CalendarDays} label="MFG Date" value={fmtDate(lot?.mfg_date)} />

              <InfoRow icon={CalendarDays} label="Expiry Date" value={fmtDate(lot?.expiry_date)} highlight={isExpired} />
              <InfoRow icon={BadgeCheck} label="CoA Number" value={safe(lot?.coa_number)} />

              <InfoRow icon={BadgeCheck} label="CoC Number" value={safe(lot?.coc_number)} />
              <InfoRow icon={Factory} label="Warehouse" value={safe(lot?.warehouse)} />

              <InfoRow icon={Factory} label="Location" value={safe(lot?.location)} />
              <InfoRow icon={PackageSearch} label="Status" value={safe(lot?.status)} />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
              <div className="rounded-xl border bg-white p-3 text-sm text-gray-700">
                {lot?.notes ? lot.notes : <span className="text-gray-400">No notes</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: quantity + quick summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-gray-600" />
              Stock Summary
            </CardTitle>
            <CardDescription>Quantity and usage snapshot (for stores + production).</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Received</p>
                <p className="text-sm font-semibold text-gray-900">
                  {safe(qtyReceived)} <span className="text-xs font-medium text-gray-600">{uom || ""}</span>
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-sm font-semibold text-gray-900">
                  {safe(qtyAvailable)} <span className="text-xs font-medium text-gray-600">{uom || ""}</span>
                </p>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#dc2551]"
                  style={{
                    width: (() => {
                      const r = Number(qtyReceived);
                      const a = Number(qtyAvailable);
                      if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(a)) return "0%";
                      const pct = Math.max(0, Math.min(100, (a / r) * 100));
                      return `${pct}%`;
                    })(),
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-gray-600">
                If this lot is consumed in WIP, available quantity will reduce based on issue/return transactions.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production control</p>
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-600" />
                  <p>
                    Only <span className="font-medium">Released</span> lots should be issued to production.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-gray-600" />
                  <p>
                    Track expiry for chemicals and soldermask/ink to prevent defects and rework.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Barcode className="mt-0.5 h-4 w-4 text-gray-600" />
                  <p>
                    Lot number is used across traceability: incoming → storage → issue → panel/job linkage.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to={`/inventory/lots/${id}/edit`}>
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium">{lotNumber || "this lot"}</span>.
              If it is already linked to production/WIP, you should block it instead of deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- small presentational component ---------- */
function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className={cx("rounded-xl border bg-white p-3", highlight ? "border-rose-200 bg-rose-50" : "")}>
      <div className="flex items-start gap-2">
        <Icon className={cx("mt-0.5 h-4 w-4", highlight ? "text-rose-600" : "text-gray-600")} />
        <div className="min-w-0">
          <p className={cx("text-xs", highlight ? "text-rose-700" : "text-gray-500")}>{label}</p>
          <p className={cx("truncate text-sm font-medium", highlight ? "text-rose-800" : "text-gray-900")}>
            {value === null || value === undefined || value === "" ? "—" : String(value)}
          </p>
        </div>
      </div>
    </div>
  );
}
