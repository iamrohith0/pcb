// src/pages/dashboard/Dashboard.jsx
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import settingsApi from "@/services/settings.service";

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Factory,
  FileText,
  Gauge,
  Layers,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Timer,
  Truck,
  Users
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * PCBxpress Dashboard
 * - Plant overview + quick actions
 * - KPIs for Sales, Engineering, Production, Quality, Inventory, Dispatch
 * - Uses placeholders for data; wire to your API endpoints later
 */
export default function Dashboard() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("PCBxpress");
  const [loading, setLoading] = useState(true);

  // Replace this object with API response later
  const [kpi, setKpi] = useState({
    sales: {
      rfqOpen: 18,
      quotesPending: 9,
      ordersThisWeek: 12,
      onTimeCommitRate: 92,
    },
    engineering: {
      dfmQueue: 7,
      camQueue: 5,
      pendingStackups: 3,
      activeRevisions: 4,
    },
    production: {
      woOpen: 14,
      wipLots: 22,
      lateOps: 6,
      capacityUsed: 74,
    },
    quality: {
      inspectionsDue: 10,
      aoiQueue: 8,
      etestQueue: 6,
      ncrOpen: 4,
      fpy: 96.4,
    },
    inventory: {
      lowStockItems: 11,
      expiringLots: 2,
      pendingGRN: 5,
      stockAccuracy: 98.1,
    },
    dispatch: {
      dispatchQueue: 7,
      shipmentsToday: 4,
      deliveriesAtRisk: 2,
      otif: 93,
    },
  });

  // Fetch company name (same pattern you use in layout/login)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await settingsApi.get();
        const name = res.data?.company?.name;
        if (name) setCompanyName(name);
      } catch (e) {
        // silent fallback
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const cards = useMemo(() => {
    const totalAlerts =
      kpi.production.lateOps +
      kpi.quality.ncrOpen +
      kpi.inventory.lowStockItems +
      kpi.dispatch.deliveriesAtRisk;

    return {
      totalAlerts,
      headline:
        totalAlerts > 0
          ? `${totalAlerts} attention items across shopfloor`
          : "All systems look stable today",
    };
  }, [kpi]);

  const quickActions = useMemo(
    () => [
      {
        title: "Create RFQ",
        desc: "Register new customer RFQ and specs",
        icon: FileText,
        to: "/sales/rfq/create",
        tone: "sales",
      },
      {
        title: "DFM Queue",
        desc: "Review incoming designs for manufacturability",
        icon: ClipboardCheck,
        to: "/engineering/dfm",
        tone: "eng",
      },
      {
        title: "Create Work Order",
        desc: "Release order to production routing",
        icon: Factory,
        to: "/production/work-orders/create",
        tone: "prod",
      },
      {
        title: "AOI Results",
        desc: "Defect verification & rework actions",
        icon: ScanLine,
        to: "/quality/aoi",
        tone: "qa",
      },
      {
        title: "Low Stock",
        desc: "Materials below reorder point",
        icon: Boxes,
        to: "/inventory/stock",
        tone: "inv",
      },
      {
        title: "Dispatch Queue",
        desc: "Pack, label and ship ready lots",
        icon: Truck,
        to: "/logistics/dispatch",
        tone: "log",
      },
    ],
    []
  );

  const sections = useMemo(
    () => [
      {
        title: "Sales",
        icon: ShoppingCart,
        subtitle: "RFQ → Quote → Order",
        items: [
          { label: "Open RFQs", value: kpi.sales.rfqOpen, hint: "Awaiting review / pricing" },
          { label: "Quotes Pending", value: kpi.sales.quotesPending, hint: "Draft / approval pending" },
          { label: "Orders This Week", value: kpi.sales.ordersThisWeek, hint: "New confirmed orders" },
          { label: "Commit Rate", value: `${kpi.sales.onTimeCommitRate}%`, hint: "Promised delivery adherence" },
        ],
        primaryTo: "/sales/rfq",
        primaryLabel: "Go to Sales",
      },
      {
        title: "Engineering",
        icon: Layers,
        subtitle: "DFM / CAM / Stackups",
        items: [
          { label: "DFM Queue", value: kpi.engineering.dfmQueue, hint: "Awaiting DFM review" },
          { label: "CAM Queue", value: kpi.engineering.camQueue, hint: "Tooling outputs pending" },
          { label: "Stackups Pending", value: kpi.engineering.pendingStackups, hint: "Approval needed" },
          { label: "Active Revisions", value: kpi.engineering.activeRevisions, hint: "ECO changes in progress" },
        ],
        primaryTo: "/engineering/dfm",
        primaryLabel: "Go to Engineering",
      },
      {
        title: "Production",
        icon: Factory,
        subtitle: "Work Orders / WIP / Capacity",
        items: [
          { label: "Open Work Orders", value: kpi.production.woOpen, hint: "Running / queued WOs" },
          { label: "WIP Lots", value: kpi.production.wipLots, hint: "Lots moving across routing" },
          { label: "Late Operations", value: kpi.production.lateOps, hint: "Behind schedule steps" },
          { label: "Capacity Used", value: `${kpi.production.capacityUsed}%`, hint: "Current utilization" },
        ],
        primaryTo: "/production/work-orders",
        primaryLabel: "Go to Production",
      },
      {
        title: "Quality",
        icon: ShieldCheck,
        subtitle: "Inspection / AOI / E-Test / NCR",
        items: [
          { label: "Inspections Due", value: kpi.quality.inspectionsDue, hint: "In-process / final checks" },
          { label: "AOI Queue", value: kpi.quality.aoiQueue, hint: "Awaiting AOI scan / review" },
          { label: "E-Test Queue", value: kpi.quality.etestQueue, hint: "Electrical test pending" },
          { label: "FPY", value: `${kpi.quality.fpy}%`, hint: "First-pass yield" },
        ],
        secondary: { label: "Open NCRs", value: kpi.quality.ncrOpen },
        primaryTo: "/quality/inspections",
        primaryLabel: "Go to Quality",
      },
      {
        title: "Inventory",
        icon: Boxes,
        subtitle: "Materials / Lots / GRN",
        items: [
          { label: "Low Stock Items", value: kpi.inventory.lowStockItems, hint: "Below reorder level" },
          { label: "Expiring Lots", value: kpi.inventory.expiringLots, hint: "Shelf life nearing end" },
          { label: "Pending GRN", value: kpi.inventory.pendingGRN, hint: "Receipts to post" },
          { label: "Stock Accuracy", value: `${kpi.inventory.stockAccuracy}%`, hint: "Cycle count score" },
        ],
        primaryTo: "/inventory/stock",
        primaryLabel: "Go to Inventory",
      },
      {
        title: "Dispatch",
        icon: Truck,
        subtitle: "Pack / Ship / Track",
        items: [
          { label: "Dispatch Queue", value: kpi.dispatch.dispatchQueue, hint: "Ready to pack" },
          { label: "Shipments Today", value: kpi.dispatch.shipmentsToday, hint: "Planned pickups" },
          { label: "Deliveries at Risk", value: kpi.dispatch.deliveriesAtRisk, hint: "May slip OTIF" },
          { label: "OTIF", value: `${kpi.dispatch.otif}%`, hint: "On-time in-full" },
        ],
        primaryTo: "/logistics/dispatch",
        primaryLabel: "Go to Dispatch",
      },
    ],
    [kpi]
  );

  const onRefresh = async () => {
    // Replace with real API call later
    toast({ title: "Refreshed", description: "Dashboard updated." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">PCBxpress</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {companyName} — Manufacturing Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Live snapshot of RFQs, engineering queues, shopfloor WIP, quality gates, stock and dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} className="gap-2 ring-1 ring-inset ring-slate-200">
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500 text-white"
            onClick={() => toast({ title: "Quick Create", description: "Hook this to your create modal." })}
          >
            <ClipboardList className="h-4 w-4" />
            Quick Create
          </Button>
        </div>
      </div>

      {/* Attention banner */}
      <Card className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-cyan-500/10 p-2">
              <Gauge className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Shopfloor Status</p>
              <p className="text-sm text-slate-600">{cards.headline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-50 text-slate-800 hover:bg-slate-50 ring-1 ring-inset ring-slate-200">
              <CalendarClock className="mr-1 h-3.5 w-3.5" />
              Shift: Day
            </Badge>
            <Badge className="bg-slate-50 text-slate-800 hover:bg-slate-50 ring-1 ring-inset ring-slate-200">
              <Timer className="mr-1 h-3.5 w-3.5" />
              Live
            </Badge>
            <Badge className={cx("hover:bg-transparent", cards.totalAlerts ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
              <BadgeCheck className="mr-1 h-3.5 w-3.5" />
              {cards.totalAlerts ? `${cards.totalAlerts} Alerts` : "No Alerts"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((a, idx) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
          >
            <Link to={a.to} className="block">
              <Card className="group border border-slate-200 bg-white p-4 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-cyan-500/10 p-2 transition group-hover:bg-cyan-500/15">
                      <a.icon className="h-5 w-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <p className="text-sm text-slate-600">{a.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* KPI sections */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title} className="border border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-100 p-2">
                  <s.icon className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-600">{s.subtitle}</p>
                </div>
              </div>

              <Button asChild variant="outline" size="sm" className="gap-2 ring-1 ring-inset ring-slate-200">
                <Link to={s.primaryTo}>
                  {s.primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
              {s.items.map((it) => (
                <div key={it.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{it.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{it.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{it.hint}</p>
                </div>
              ))}
            </div>

            {s.secondary && (
              <div className="border-t px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{s.secondary.label}</p>
                  <Badge className="bg-red-50 text-red-700 hover:bg-red-50">
                    {s.secondary.value}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Bottom strip: traceability / compliance shortcuts */}
      <Card className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-2">
              <PackageCheck className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Traceability & Compliance</p>
              <p className="text-sm text-slate-600">
                Lot genealogy, CoC generation, audit readiness and recall workflows.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="gap-2 ring-1 ring-inset ring-slate-200">
              <Link to="/traceability/lot-genealogy">
                <ScanLine className="h-4 w-4" />
                Lot Genealogy
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 ring-1 ring-inset ring-slate-200">
              <Link to="/quality/certificates">
                <ShieldCheck className="h-4 w-4" />
                Certificates
              </Link>
            </Button>
            <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-500 text-white">
              <Link to="/reports/production">
                <Users className="h-4 w-4" />
                KPIs & Reports
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading note (non-blocking) */}
      {loading && (
        <p className="text-xs text-slate-500">
          Loading company name & settings…
        </p>
      )}
    </div>
  );
}
