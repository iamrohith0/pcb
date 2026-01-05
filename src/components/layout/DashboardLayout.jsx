// src/components/layout/DashboardLayout.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  AlertTriangle,
  BadgeAlert,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Boxes,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  Factory,
  Building2,
  FileSearch2,
  FileText,
  FolderKanban,
  GitCompare,
  Hash,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  LogOut,
  Mail,
  Menu,
  Package,
  Palette,
  Percent,
  Plus,
  QrCode,
  Route,
  ScanLine,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Truck,
  MapPin,
  PackageCheck,
  Ship,
  Users as UsersIcon,
  Warehouse,
  Webhook,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import settingsApi from "@/services/settings.service";

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

function NavItem({ to, icon: Icon, label, onClick, badge }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-cyan-500/10 text-cyan-700 ring-1 ring-inset ring-cyan-500/15"
            : "text-slate-700 hover:bg-slate-100"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/**
 * PCBxpress role mapping (adjust to your backend role values)
 */
const ROLE_LABEL = {
  super_admin: "Super Admin",
  admin: "Admin",
  production_manager: "Production Manager",
  quality_manager: "Quality Manager",
  procurement: "Procurement",
  sales: "Sales",
  store: "Store / Warehouse",
  operator: "Operator",
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [companyName, setCompanyName] = useState("PCBxpress ERP");

  // keep your backend role keys; fallback to admin
  const role = user?.role ?? "admin";

  const nav = useMemo(() => {
    // Shared (most roles)
    const overview = {
      title: "Overview",
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    };

    const sales = {
      title: "Sales",
      items: [
        { to: "/dashboard/sales/customers", label: "Customers", icon: UsersIcon },
        { to: "/dashboard/sales/rfq", label: "RFQ", icon: FileSearch2 },
        { to: "/dashboard/sales/quotations", label: "Quotations", icon: Percent },
        { to: "/dashboard/sales/orders", label: "Sales Orders", icon: ShoppingCart },
        { to: "/dashboard/sales/invoices", label: "Invoices", icon: FileSearch2 },
      ],
    };

    const engineering = {
      title: "Engineering",
      items: [
        { to: "/dashboard/engineering/dfm", label: "DFM Check", icon: FileSearch2, badge: "CAM" },
        { to: "/dashboard/engineering/dfm/checklist", label: "DFM Checklist", icon: ClipboardCheck },
        { to: "/dashboard/engineering/cam", label: "CAM Jobs", icon: FileSearch2 },
        { to: "/dashboard/engineering/panelization", label: "Panelization", icon: LayoutGrid },
        { to: "/dashboard/engineering/stackup", label: "Stackup", icon: Layers },
        { to: "/dashboard/engineering/revisions", label: "Revisions", icon: GitCompare },
      ],
    };

    const production = {
      title: "Production",
      items: [
        { to: "/dashboard/production/work-orders", label: "Work Orders", icon: Factory },
        { to: "/dashboard/production/wip", label: "WIP Board", icon: FolderKanban },
        { to: "/dashboard/production/scheduling", label: "Scheduling", icon: SlidersHorizontal },
        { to: "/dashboard/production/capacity", label: "Capacity", icon: BarChart3 },
        { to: "/dashboard/production/routing", label: "Process Routing", icon: Route },
      ],
    };

    const quality = {
      title: "Quality",
      items: [
        { to: "/dashboard/quality/inspections", label: "Inspections", icon: ClipboardCheck },
        { to: "/dashboard/quality/inspections/create", label: "Create Inspection", icon: ClipboardList },
        { to: "/dashboard/quality/inspections/templates", label: "Inspection Templates", icon: FileText },
        { to: "/dashboard/quality/ncr", label: "NCR List", icon: BadgeAlert },
        { to: "/dashboard/quality/ncr/create", label: "Create NCR", icon: AlertTriangle },
        { to: "/dashboard/quality/ncr/disposition", label: "NCR Disposition", icon: ShieldCheck },
        { to: "/dashboard/quality/capa", label: "CAPA List", icon: BadgeAlert },
        { to: "/dashboard/quality/capa/create", label: "Create CAPA", icon: ShieldCheck },
        { to: "/dashboard/quality/capa/effectiveness", label: "CAPA Effectiveness", icon: TrendingUp },
        { to: "/dashboard/quality/certificates", label: "Certificates", icon: BadgeCheck },
        { to: "/dashboard/quality/certificates/generate", label: "Generate CoC", icon: FileText },
        { to: "/dashboard/quality/certificates/compliance", label: "Compliance Docs", icon: FileSearch2 },
        { to: "/dashboard/quality/aoi", label: "AOI Results", icon: Eye },
        { to: "/dashboard/quality/aoi/queue", label: "AOI Queue", icon: LayoutGrid },
        { to: "/dashboard/quality/aoi/defects", label: "AOI Defects", icon: AlertTriangle },
        { to: "/dashboard/quality/aoi/rework", label: "AOI Rework", icon: Wrench },
        { to: "/dashboard/quality/etest", label: "E-Test Results", icon: Zap },
        { to: "/dashboard/quality/etest/queue", label: "E-Test Queue", icon: LayoutGrid },
        { to: "/dashboard/quality/etest/certificates", label: "E-Test Certificates", icon: BadgeCheck },
        { to: "/dashboard/quality/etest/netlist", label: "Netlist Comparison", icon: GitCompare },
      ],
    };

    const inventory = {
      title: "Inventory",
      items: [
        { to: "/dashboard/inventory/items", label: "Items / Materials", icon: Package },
        { to: "/dashboard/inventory/stock", label: "Stock / Ledger", icon: Boxes },
        { to: "/dashboard/inventory/adjustments", label: "Stock Adjustments", icon: ClipboardList },
        { to: "/dashboard/inventory/bom", label: "BOM", icon: ClipboardCheck },
        { to: "/dashboard/inventory/lots", label: "Lot Tracking", icon: QrCode },
        { to: "/dashboard/inventory/serials", label: "Serial Tracking", icon: ScanLine },
      ],
    };

    const procurement = {
      title: "Procurement",
      items: [
        { to: "/dashboard/procurement/suppliers", label: "Suppliers", icon: UsersIcon },
        { to: "/dashboard/procurement/suppliers/create", label: "Create Supplier", icon: Plus },
        { to: "/dashboard/procurement/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
        { to: "/dashboard/procurement/purchase-orders/create", label: "Create PO", icon: Plus },
        { to: "/dashboard/procurement/grn", label: "GRN / Receiving", icon: Truck },
        { to: "/dashboard/procurement/grn/create", label: "Create GRN", icon: Plus },
        { to: "/dashboard/procurement/grn/incoming-qc", label: "Incoming QC", icon: Eye },
        { to: "/dashboard/procurement/pricing", label: "Supplier Pricing", icon: Percent },
        { to: "/dashboard/procurement/pricing/rule-engine", label: "Price Rules", icon: Settings },
        { to: "/dashboard/procurement/pricing/lead-time", label: "Lead Time Matrix", icon: Clock },
        { to: "/dashboard/procurement/pricing/cost-history", label: "Cost History", icon: TrendingUp },
      ],
    };

    const traceability = {
      title: "Traceability",
      items: [
        { to: "/dashboard/traceability/lots", label: "Lot Tracking", icon: QrCode },
        { to: "/dashboard/traceability/serials", label: "Serial Tracking", icon: ScanLine },
        { to: "/dashboard/traceability/genealogy", label: "Batch Genealogy", icon: Layers },
        { to: "/dashboard/traceability/batch", label: "Batch Management", icon: Boxes },
        { to: "/dashboard/traceability/recall", label: "Recall Management", icon: ShieldCheck },
      ],
    };

    const maintenance = {
      title: "Maintenance",
      items: [
        { to: "/dashboard/maintenance/equipment", label: "Equipment", icon: Wrench },
        { to: "/dashboard/maintenance/pm", label: "PM Schedule", icon: ClipboardList },
        { to: "/dashboard/maintenance/work-orders", label: "Maintenance WOs", icon: ClipboardCheck },
        { to: "/dashboard/maintenance/breakdowns", label: "Breakdown Management", icon: AlertTriangle },
        { to: "/dashboard/maintenance/spares", label: "Spares Management", icon: Package },
      ],
    };

    const logistics = {
      title: "Logistics",
      items: [
        { to: "/dashboard/logistics/dispatch", label: "Dispatch", icon: Truck },
        { to: "/dashboard/logistics/dispatch/create", label: "Create Dispatch", icon: PackageCheck },
        { to: "/dashboard/logistics/dispatch/queue", label: "Dispatch Queue", icon: LayoutGrid },
        { to: "/dashboard/logistics/dispatch/details", label: "Dispatch Details", icon: FileText },
        { to: "/dashboard/logistics/shipments", label: "Shipments", icon: Ship },
        { to: "/dashboard/logistics/shipments/create", label: "Create Shipment", icon: Truck },
        { to: "/dashboard/logistics/shipments/details", label: "Shipment Details", icon: FileText },
        { to: "/dashboard/logistics/shipments/documents", label: "Shipment Documents", icon: FileText },
        { to: "/dashboard/logistics/tracking", label: "Tracking Dashboard", icon: MapPin },
        { to: "/dashboard/logistics/tracking/status", label: "Delivery Status", icon: Clock },
        { to: "/dashboard/logistics/tracking/pod", label: "POD Upload", icon: FileText },
        { to: "/dashboard/logistics/tracking/carriers", label: "Carrier Integration", icon: Ship },
      ],
    };

    const reports = {
      title: "Reports",
      items: [
        { to: "/dashboard/reports/production", label: "Production Reports", icon: BarChart3 },
        { to: "/dashboard/reports/quality", label: "Quality Reports", icon: BarChart3 },
        { to: "/dashboard/reports/inventory", label: "Inventory Reports", icon: BarChart3 },
        { to: "/dashboard/reports/finance", label: "Finance Reports", icon: DollarSign },
        { to: "/dashboard/reports/sales", label: "Sales Reports", icon: TrendingUp },
      ],
    };

    const admin = {
      title: "Admin",
      items: [
        { to: "/dashboard/admin/users", label: "Users", icon: UsersIcon },
        { to: "/dashboard/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
        { to: "/dashboard/admin/permissions", label: "Permissions", icon: ShieldCheck },
        { to: "/dashboard/admin/settings", label: "Settings", icon: Settings },
        { to: "/dashboard/admin/masters", label: "Master Data", icon: BookOpen },
        { to: "/dashboard/admin/audit-logs", label: "Audit Logs", icon: FileText },
      ],
    };

    const superSettings = {
      title: "Super Settings",
      items: [
        // Company
        { to: "/settings/company/profile", label: "Company Profile", icon: Building2 },
        { to: "/settings/company/branding", label: "Branding", icon: Palette },
        { to: "/settings/company/working-hours", label: "Working Hours", icon: Clock },
        
        // Integrations
        { to: "/settings/integrations/email", label: "Email SMTP", icon: Mail },
        { to: "/settings/integrations/webhooks", label: "ERP Webhooks", icon: Webhook },
        { to: "/settings/integrations/accounting", label: "Accounting Sync", icon: DollarSign },
        { to: "/settings/integrations/barcode", label: "Barcode", icon: QrCode },
        
        // Numbering
        { to: "/settings/numbering/documents", label: "Document Series", icon: Hash },
        { to: "/settings/numbering/lots", label: "Lot Numbering", icon: Tag },
        { to: "/settings/numbering/work-orders", label: "Work Order Numbering", icon: FileText },
        
        // Plants
        { to: "/settings/plants/list", label: "Plants", icon: Factory },
        { to: "/settings/plants/create", label: "Create Plant", icon: Plus },
        { to: "/settings/plants/shifts", label: "Shifts", icon: Calendar },
      ],
    };

    /**
     * Role-based visibility rules (simple & practical)
     * Adjust to match your org needs.
     */
    const sections = [overview];

    const can = {
      sales: ["super_admin", "admin", "sales"].includes(role),
      engineering: ["super_admin", "admin", "production_manager"].includes(role),
      production: ["super_admin", "admin", "production_manager", "operator"].includes(role),
      quality: ["super_admin", "admin", "quality_manager"].includes(role),
      procurement: ["super_admin", "admin", "procurement"].includes(role),
      inventory: ["super_admin", "admin", "procurement", "store", "production_manager"].includes(role),
      logistics: ["super_admin", "admin", "procurement", "store", "production_manager"].includes(role),
      traceability: ["super_admin", "admin", "quality_manager", "production_manager", "store"].includes(role),
      maintenance: ["super_admin", "admin", "production_manager"].includes(role),
      reports: ["super_admin", "admin", "production_manager", "quality_manager", "sales", "procurement"].includes(role),
      admin: ["super_admin", "admin"].includes(role),
    };

    if (can.sales) sections.push(sales);
    if (can.engineering) sections.push(engineering);
    if (can.production) sections.push(production);
    if (can.quality) sections.push(quality);
    if (can.inventory) sections.push(inventory);
    if (can.procurement) sections.push(procurement);
    if (can.logistics) sections.push(logistics);
    if (can.traceability) sections.push(traceability);
    if (can.maintenance) sections.push(maintenance);
    if (can.reports) sections.push(reports);
    if (can.admin) sections.push(admin);
    if (can.admin) sections.push(superSettings);

    return sections;
  }, [role]);

  const closeMobile = () => setMobileOpen(false);
  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const handleRequestLogout = () => setLogoutOpen(true);
  const handleConfirmLogout = () => {
    setLogoutOpen(false);
    logout?.();
    navigate("/login", { replace: true });
  };

  // Fetch company name
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const response = await settingsApi.get();
        const companyNameFromSettings = response.data?.company?.name;
        if (companyNameFromSettings) setCompanyName(companyNameFromSettings);
      } catch (error) {
        console.warn("Failed to fetch company name, using default:", error);
      }
    };
    fetchCompanyName();
  }, []);

  const showCrumbs = location.pathname && location.pathname !== "/dashboard";

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="flex h-14 w-full items-center justify-between px-3 sm:px-4 lg:px-6 relative">
          {/* Left */}
          <div className="flex items-center gap-3 z-10">
            <button
              className="inline-flex items-center rounded-lg p-2 hover:bg-slate-100"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile brand */}
            <div className="lg:hidden">
              <Link
                to="/dashboard"
                aria-label={`${companyName} — Home`}
                className={cx(
                  "group relative inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  "hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 transition-colors"
                )}
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-cyan-700 shadow-sm">
                  <Factory className="h-4 w-4" />
                </span>
                <span className="font-semibold tracking-wide">{companyName}</span>
              </Link>
            </div>
          </div>

          {/* Middle clickable space to close sidebar */}
          <div className="flex-1 h-full cursor-pointer z-0" onClick={() => setSidebarOpen(false)} />

          {/* Right */}
          <div className="flex items-center gap-3 z-10">
            <div className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-slate-600 md:flex ring-1 ring-inset ring-slate-200">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-700">
                <UsersIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-slate-500 text-center">{ROLE_LABEL[user?.role] ?? user?.role}</span>
                <span className="font-medium text-slate-800 text-center">{user?.name}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestLogout}
              className="gap-2 text-cyan-700 hover:bg-cyan-500/10 hover:text-cyan-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="relative">
        {/* Sidebar (desktop) */}
        <aside
          className={cx(
            "fixed top-0 left-0 z-40 h-screen w-72 border-r bg-white transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="sidebar-scroll flex h-full flex-col gap-6 overflow-y-auto py-4 pr-2" style={{ scrollbarGutter: "stable" }}>
            <div className="px-3">
              <Link
                to="/dashboard"
                aria-label={`${companyName} — Home`}
                className={cx(
                  "group relative inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm w-full",
                  "ring-1 ring-inset ring-slate-200 hover:ring-slate-300 hover:bg-slate-50 transition-colors"
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/10 text-cyan-700 shadow-sm">
                  <Factory className="h-4 w-4" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold tracking-wide">{companyName}</span>
                  <span className="text-xs text-slate-500">PCB Manufacturing ERP</span>
                </div>
              </Link>
            </div>

            {nav.map((section) => (
              <Section key={section.title} title={section.title}>
                {section.items.map((item) => (
                  <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} badge={item.badge} />
                ))}
              </Section>
            ))}
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="fixed inset-0 bg-black/30" onClick={closeMobile} aria-hidden="true" />
            <div className="relative ml-0 flex w-72 max-w-[80%] flex-col bg-white shadow-xl">
              <div className="flex h-14 items-center justify-between border-b px-4">
                <span className="text-sm font-semibold">Navigation</span>
                <button className="rounded-lg p-2 hover:bg-slate-100" onClick={closeMobile} aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="sidebar-scroll flex-1 space-y-6 overflow-y-auto p-4" style={{ scrollbarGutter: "stable" }}>
                {nav.map((section) => (
                  <Section key={section.title} title={section.title}>
                    {section.items.map((item) => (
                      <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={closeMobile} badge={item.badge} />
                    ))}
                  </Section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main
          className={cx(
            "px-4 py-6 sm:px-6 lg:px-6 transition-all duration-300",
            sidebarOpen ? "lg:ml-72" : "lg:ml-0"
          )}
        >
          {showCrumbs && (
            <div className="sticky top-0 z-10 -mx-4 border-b bg-white/70 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-6 lg:px-6">
              <p className="truncate text-xs text-slate-500">
                {location.pathname
                  .split("/")
                  .filter(Boolean)
                  .map((seg) => seg.replace(/-/g, " "))
                  .join("  /  ")}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <Card className="border-none bg-transparent shadow-none">
              <Outlet />
            </Card>
          </div>
        </main>
      </div>

      {/* Logout confirmation dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of <span className="font-medium">{companyName}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
