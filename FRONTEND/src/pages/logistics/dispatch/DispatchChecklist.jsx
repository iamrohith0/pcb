// src/pages/logistics/dispatch/DispatchChecklist.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import dispatchService from "@/services/logistics/dispatch.service";

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  PackageCheck,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

/**
 * PCBxpress - DispatchChecklist
 * Purpose:
 * - Final dispatch gate checklist before shipping a PCB order
 * - Covers packaging, documents, labeling, QC release, and logistics handover
 *
 * Notes:
 * - This page is UI-ready and API-ready (stubbed). Replace mock fetch/save with real services later.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDateTime(value) {
  try {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return value ?? "-";
  }
}

function ProgressBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-[#dc2551]" style={{ width: `${v}%` }} />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Draft: "bg-gray-100 text-gray-700",
    "In Review": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    Ready: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    Blocked: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    Dispatched: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", map[status] || map.Draft)}>
      {status || "Draft"}
    </span>
  );
}

const DEFAULT_SECTIONS = [
  {
    key: "docs",
    title: "Documents",
    icon: FileText,
    items: [
      {
        id: "doc_invoice",
        label: "Invoice / Tax invoice attached",
        hint: "Invoice printed or included in pouch; matches PO & values.",
      },
      {
        id: "doc_packing_list",
        label: "Packing list attached",
        hint: "Quantities, lot/batch, panel count, and box count verified.",
      },
      {
        id: "doc_coc",
        label: "CoC (Certificate of Conformance) available (if required)",
        hint: "Customer/standard specific CoC generated and signed.",
      },
      {
        id: "doc_test",
        label: "Test reports attached (AOI / E-test / Microsection as applicable)",
        hint: "Attach only what customer requires; avoid unnecessary docs.",
      },
    ],
  },
  {
    key: "qc_release",
    title: "QC Release",
    icon: ShieldCheck,
    items: [
      {
        id: "qc_ncr_clear",
        label: "No open NCR / deviations pending",
        hint: "All NCRs closed or approved deviation documented.",
      },
      {
        id: "qc_final_ok",
        label: "Final inspection approved",
        hint: "Final QC sign-off recorded for the dispatch batch/lot.",
      },
      {
        id: "qc_labels_match",
        label: "Lot/Serial labels match QC records",
        hint: "Traceability labels match inspection & test entries.",
      },
    ],
  },
  {
    key: "packaging",
    title: "Packaging",
    icon: PackageCheck,
    items: [
      {
        id: "pack_esd",
        label: "ESD packaging used (as required)",
        hint: "Use ESD bag / bubble wrap; avoid dust & scratches.",
      },
      {
        id: "pack_separation",
        label: "Panels separated / protected (no edge damage)",
        hint: "Edge protectors, corner guards, and separators used.",
      },
      {
        id: "pack_desiccant",
        label: "Desiccant + humidity indicator included (if required)",
        hint: "Especially for ENIG/OSP and long-distance transit.",
      },
      {
        id: "pack_box_integrity",
        label: "Outer carton integrity verified",
        hint: "No dents; box sealed with proper tape and strapping.",
      },
    ],
  },
  {
    key: "labels",
    title: "Labeling & Traceability",
    icon: QrCode,
    items: [
      {
        id: "label_customer",
        label: "Customer label applied (PN / Rev / PO / Qty)",
        hint: "Match customer label format if provided.",
      },
      {
        id: "label_internal",
        label: "Internal tracking label (WO / Lot / Batch)",
        hint: "WO/lot/batch label for internal scanning.",
      },
      {
        id: "label_orientation",
        label: "Label placement & orientation verified",
        hint: "Readable, not on edges, not covering handling marks.",
      },
    ],
  },
  {
    key: "logistics",
    title: "Logistics Handover",
    icon: Truck,
    items: [
      {
        id: "log_courier",
        label: "Courier / transporter confirmed",
        hint: "Carrier selected, pickup scheduled, rate approved.",
      },
      {
        id: "log_address",
        label: "Ship-to address verified",
        hint: "Contact name, phone, pincode, and GSTIN (if required) confirmed.",
      },
      {
        id: "log_weight",
        label: "Weight & box count captured",
        hint: "Actual weight recorded for AWB/manifest.",
      },
      {
        id: "log_awb",
        label: "AWB / Tracking number generated",
        hint: "Tracking number captured and shared with customer.",
      },
    ],
  },
];

function computeProgress(checks) {
  const all = Object.values(checks || {});
  if (!all.length) return 0;
  const done = all.filter(Boolean).length;
  return Math.round((done / all.length) * 100);
}

// API functions using dispatch service
async function fetchDispatchFromBackend(dispatchId) {
  if (!dispatchId || dispatchId === 'new') {
    // Return empty template for new dispatch
    return {
      id: null,
      status: "Draft",
      customer: {},
      order: {},
      shipment: {},
      updatedAt: new Date().toISOString(),
      checklist: {},
      notes: "",
    };
  }
  const response = await dispatchService.getById(dispatchId);
  // Map backend response to frontend format
  return {
    id: response.id,
    status: response.status || "Draft",
    customer: {
      name: response.customerName || "",
      code: response.customerId || "",
    },
    order: {
      soNo: response.orderCode || "",
      woNo: response.code || "",
      poNo: "",
      incoterm: "",
      shipTo: response.warehouseName || "",
    },
    shipment: {
      carrier: response.carrierName || "",
      trackingNo: response.trackingNumber || "",
      boxes: 0,
      weightKg: response.weight || 0,
      pickupAt: response.dispatchDate || new Date().toISOString(),
    },
    updatedAt: response.updatedAt || new Date().toISOString(),
    checklist: response.checklist || {},
    notes: response.notes || "",
  };
}
// ------------------------------------------------------------------

export default function DispatchChecklist() {
  const { dispatchId } = useParams(); // route can be /logistics/dispatch/:dispatchId/checklist
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dispatch, setDispatch] = useState(null);
  const [checks, setChecks] = useState({});
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchDispatchFromBackend(dispatchId);
        if (!alive) return;
        setDispatch(data);
        setChecks(data.checklist || {});
        setNotes(data.notes || "");
      } catch (e) {
        console.error(e);
        toast({
          title: "Failed to load dispatch",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dispatchId, toast]);

  const allItemIds = useMemo(() => {
    const ids = [];
    DEFAULT_SECTIONS.forEach((s) => s.items.forEach((i) => ids.push(i.id)));
    return ids;
  }, []);

  const progress = useMemo(() => {
    const normalized = {};
    allItemIds.forEach((id) => (normalized[id] = Boolean(checks?.[id])));
    return computeProgress(normalized);
  }, [checks, allItemIds]);

  const isReadyToDispatch = useMemo(() => progress === 100, [progress]);

  const filteredSections = useMemo(() => {
    if (!search?.trim()) return DEFAULT_SECTIONS;
    const q = search.toLowerCase();
    return DEFAULT_SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter(
        (i) => i.label.toLowerCase().includes(q) || (i.hint || "").toLowerCase().includes(q)
      ),
    })).filter((s) => s.items.length > 0);
  }, [search]);

  const toggle = (id) => {
    setChecks((prev) => ({ ...(prev || {}), [id]: !prev?.[id] }));
  };

  const setAllInSection = (sectionKey, value) => {
    const section = DEFAULT_SECTIONS.find((s) => s.key === sectionKey);
    if (!section) return;
    setChecks((prev) => {
      const next = { ...(prev || {}) };
      section.items.forEach((it) => (next[it.id] = value));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build a complete payload matching DispatchPayload structure
      // Use data from UI context (dispatch state contains order/customer/shipment info)
      const customer = dispatch?.customer || {};
      const order = dispatch?.order || {};
      const shipment = dispatch?.shipment || {};

      // Generate a unique dispatch code if creating new
      const dispatchCode = dispatch?.id ? undefined : `DSP-${Date.now()}`;

      const payload = {
        // Dispatch identification
        code: dispatchCode,
        description: `Dispatch checklist for ${order.soNo || 'order'}`,

        // Order context - safe defaults if empty
        orderCode: order.soNo || order.woNo || 'UNLINKED',

        // Customer context - safe default if empty
        customerName: customer.name || 'UNKNOWN',

        // Warehouse context - safe default if empty
        warehouseName: order.shipTo || 'DEFAULT',

        // Shipment/carrier info - can be empty
        carrierName: shipment.carrier || '',
        trackingNumber: shipment.trackingNo || '',

        // Dispatch date - always set to now
        dispatchDate: new Date().toISOString(),

        // Valid status: DRAFT when first saving (safest enum value)
        status: "DRAFT",

        // Priority and type - always provide valid enums
        priority: "NORMAL",
        dispatchType: "STANDARD",

        // Weight info - ensure numeric, never null
        weight: shipment.weightKg ? Number(shipment.weightKg) : 0,
        weightUnit: "kg",

        // Notes - safe empty string if null
        notes: notes || '',
      };

      let savedDispatch;
      if (dispatch?.id) {
        // UPDATE existing dispatch via PUT /api/logistics/dispatch/{id}
        savedDispatch = await dispatchService.update(dispatch.id, payload);
      } else {
        // CREATE new dispatch via POST /api/logistics/dispatch
        savedDispatch = await dispatchService.create(payload);
      }

      toast({
        title: "Saved",
        description: isReadyToDispatch ? "Checklist complete. Ready to dispatch." : "Checklist saved.",
      });
      setDispatch((d) =>
        d
          ? { ...d, id: savedDispatch.id || d.id, checklist: checks, notes, status: isReadyToDispatch ? "Ready" : "Pending", updatedAt: new Date().toISOString() }
          : { id: savedDispatch.id, checklist: checks, notes, status: isReadyToDispatch ? "Ready" : "Pending", updatedAt: new Date().toISOString() }
      );
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: "Could not save checklist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkBlocked = async () => {
    if (!dispatch?.id) return;
    const reason = blockReason.trim();
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please enter why dispatch is blocked.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      // Update status to CANCELLED (valid enum) via PATCH /api/logistics/dispatch/{id}/status
      // Note: Backend enum has CANCELLED, not BLOCKED
      await dispatchService.updateStatus(dispatch.id, "CANCELLED");
      // Also update notes with block reason via PUT
      const updatedNotes = `${notes ? notes + "\n\n" : ""}[BLOCKED] ${reason}`;
      await dispatchService.update(dispatch.id, { notes: updatedNotes });

      toast({ title: "Marked as Blocked", description: "Dispatch was blocked with reason." });
      setDispatch((d) => (d ? { ...d, status: "Cancelled", updatedAt: new Date().toISOString() } : d));
      setNotes(updatedNotes);
      setBlockReason("");
    } catch (e) {
      console.error(e);
      toast({ title: "Action failed", description: "Unable to mark as blocked.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async () => {
    if (!dispatch?.id) {
      toast({
        title: "Save first",
        description: "Please save the dispatch before marking as dispatched.",
        variant: "destructive",
      });
      return;
    }
    if (!isReadyToDispatch) {
      toast({
        title: "Not ready",
        description: "Complete all checklist items before dispatch.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      // Update status to DISPATCHED via PATCH /api/logistics/dispatch/{id}/status
      await dispatchService.updateStatus(dispatch.id, "DISPATCHED");

      toast({ title: "Dispatched", description: "Shipment marked as dispatched." });
      setDispatch((d) => (d ? { ...d, status: "Dispatched", updatedAt: new Date().toISOString() } : d));
      // navigate to dispatch details page (if you have it)
      // navigate(`/logistics/dispatch/${dispatch.id}`);
    } catch (e) {
      console.error(e);
      toast({ title: "Dispatch failed", description: "Unable to dispatch right now.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-56 animate-pulse rounded bg-gray-100" />
          <div className="h-9 w-40 animate-pulse rounded bg-gray-100" />
        </div>
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = dispatch || {};
  const ship = meta.shipment || {};
  const order = meta.order || {};
  const customer = meta.customer || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Dispatch Checklist</h1>
              <StatusPill status={meta.status} />
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {meta.id}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Final gate before shipment — verify documents, QC release, packaging, labels and logistics handover.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => toast({ title: "Download", description: "Hook this to a PDF export endpoint." })}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <ClipboardCheck className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>

          <Button
            onClick={handleDispatch}
            disabled={saving || meta.status === "Dispatched"}
            className={cx("gap-2", isReadyToDispatch ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 text-gray-700 hover:bg-gray-300")}
            title={!isReadyToDispatch ? "Complete all checklist items to dispatch" : "Dispatch"}
          >
            <Truck className="h-4 w-4" />
            Dispatch
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Progress</CardTitle>
            <CardDescription className="text-xs">
              {progress}% complete {isReadyToDispatch ? "• Ready" : "• In progress"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressBar value={progress} />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                {isReadyToDispatch ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                {isReadyToDispatch ? "All checks completed" : "Pending items exist"}
              </span>
              <span className="text-gray-500">Updated: {formatDateTime(meta.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Order & Customer</CardTitle>
            <CardDescription className="text-xs">Dispatch context for PCBxpress</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-900">{customer.name || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">SO</span>
              <span className="font-medium text-gray-900">{order.soNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">WO</span>
              <span className="font-medium text-gray-900">{order.woNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Customer PO</span>
              <span className="font-medium text-gray-900">{order.poNo || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Shipment</CardTitle>
            <CardDescription className="text-xs">Carrier, tracking and package info</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Carrier</span>
              <span className="font-medium text-gray-900">{ship.carrier || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tracking</span>
              <span className="font-medium text-gray-900">{ship.trackingNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Boxes</span>
              <span className="font-medium text-gray-900">{ship.boxes ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Weight (kg)</span>
              <span className="font-medium text-gray-900">{ship.weightKg ?? "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + quick links */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search checklist items…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/logistics/shipments">
              <Truck className="h-4 w-4" />
              Shipments
            </Link>
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              toast({
                title: "Print Documents",
                description: "Hook this button to invoice/packing-list/CoC printing endpoints.",
              })
            }
          >
            <FileText className="h-4 w-4" />
            Print Docs
          </Button>
        </div>
      </div>

      {/* Checklist sections */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          const sectionItemIds = section.items.map((x) => x.id);
          const sectionDone = sectionItemIds.filter((id) => Boolean(checks?.[id])).length;
          const sectionPct = sectionItemIds.length ? Math.round((sectionDone / sectionItemIds.length) * 100) : 0;

          return (
            <Card key={section.key} className="border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {sectionDone}/{sectionItemIds.length} completed • {sectionPct}%
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => setAllInSection(section.key, true)}
                    >
                      Mark all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => setAllInSection(section.key, false)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <ProgressBar value={sectionPct} />
              </CardHeader>

              <CardContent className="space-y-4">
                {section.items.map((item) => {
                  const checked = Boolean(checks?.[item.id]);
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cx(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                              checked ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5 text-gray-400" />}
                            {checked ? "Done" : "Pending"}
                          </span>
                          <p className="truncate font-medium text-gray-900">{item.label}</p>
                        </div>
                        {item.hint ? <p className="mt-1 text-xs text-gray-500">{item.hint}</p> : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={checked} onCheckedChange={() => toggle(item.id)} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes + Block */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Dispatch Notes</CardTitle>
            <CardDescription className="text-xs">
              Add special instructions (fragile handling, customer label notes, partial shipment, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: Include microsection report in pouch. Mark carton: FRAGILE."
              rows={6}
            />
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Block Dispatch</CardTitle>
            <CardDescription className="text-xs">
              If shipment cannot move forward, record why (open NCR, missing documents, packaging issue, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="blockReason">Reason</Label>
              <Input
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Example: E-test report missing for lot L-102."
              />
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={handleMarkBlocked}
              disabled={saving}
            >
              <ShieldCheck className="h-4 w-4" />
              Mark as Blocked
            </Button>

            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-500" />
                <p>
                  Tip: In PCB manufacturing, **dispatch must be blocked** if QC release is not complete or any
                  traceability mismatch exists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          {isReadyToDispatch ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Checklist complete — Ready to dispatch.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <XCircle className="h-4 w-4 text-gray-400" /> Complete all items to enable dispatch.
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setSearch("")} className="gap-2">
            <XCircle className="h-4 w-4" />
            Clear Search
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <ClipboardCheck className="h-4 w-4" />
            {saving ? "Saving..." : "Save Checklist"}
          </Button>
          <Button
            onClick={handleDispatch}
            disabled={saving || meta.status === "Dispatched"}
            className={cx(
              "gap-2",
              isReadyToDispatch ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 text-gray-700 hover:bg-gray-300"
            )}
          >
            <Truck className="h-4 w-4" />
            Dispatch Now
          </Button>
        </div>
      </div>
    </div>
  );
}
