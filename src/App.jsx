import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/toaster.jsx'
import { useAuth } from './context/AuthContext'
import './css/app.css'

// Direct imports to avoid lazy loading issues
import LoginPage from './Auth/LoginPage.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import NotFound from './pages/not-found/NotFound.jsx'

// Admin Pages
import UsersList from './pages/admin/users/UsersList.jsx'
import UserCreate from './pages/admin/users/UserCreate.jsx'
import UserDetails from './pages/admin/users/UserDetails.jsx'
import UserEdit from './pages/admin/users/UserEdit.jsx'
import RolesList from './pages/admin/roles/RolesList.jsx'
import RoleCreate from './pages/admin/roles/RoleCreate.jsx'
import RoleDetails from './pages/admin/roles/RoleDetails.jsx'
import RoleEdit from './pages/admin/roles/RoleEdit.jsx'
import PermissionsMatrix from './pages/admin/permissions/PermissionsMatrix.jsx'
import PermissionCreate from './pages/admin/permissions/PermissionCreate.jsx'
import PermissionAudit from './pages/admin/permissions/PermissionAudit.jsx'
import AdminSettings from './pages/admin/settings/AdminSettings.jsx'
import IntegrationsAdmin from './pages/admin/settings/IntegrationsAdmin.jsx'
import IPWhitelist from './pages/admin/settings/IPWhitelist.jsx'
import NotificationRules from './pages/admin/settings/NotificationRules.jsx'
import MaterialMaster from './pages/admin/masters/MaterialMaster.jsx'
import ProcessMaster from './pages/admin/masters/ProcessMaster.jsx'
import UOMMaster from './pages/admin/masters/UOMMaster.jsx'
import DefectCodes from './pages/admin/masters/DefectCodes.jsx'
import AuditLogList from './pages/admin/audit-logs/AuditLogList.jsx'
import AuditLogDetails from './pages/admin/audit-logs/AuditLogDetails.jsx'
import ExportAuditLogs from './pages/admin/audit-logs/ExportAuditLogs.jsx'

// Procurement Pages
import SuppliersList from './pages/procurement/suppliers/SuppliersList.jsx'
import SupplierCreate from './pages/procurement/suppliers/SupplierCreate.jsx'
import SupplierDetails from './pages/procurement/suppliers/SupplierDetails.jsx'
import SupplierEdit from './pages/procurement/suppliers/SupplierEdit.jsx'
import PurchaseOrdersList from './pages/procurement/purchase-orders/PurchaseOrdersList.jsx'
import PurchaseOrderCreate from './pages/procurement/purchase-orders/PurchaseOrderCreate.jsx'
import PurchaseOrderDetails from './pages/procurement/purchase-orders/PurchaseOrderDetails.jsx'
import PurchaseOrderApprove from './pages/procurement/purchase-orders/PurchaseOrderApprove.jsx'
import GRNList from './pages/procurement/grn/GRNList.jsx'
import GRNCreate from './pages/procurement/grn/GRNCreate.jsx'
import GRNDetails from './pages/procurement/grn/GRNDetails.jsx'
import IncomingQC from './pages/procurement/grn/IncomingQC.jsx'
import SupplierPriceList from './pages/procurement/pricing/SupplierPriceList.jsx'
import PriceRuleEngine from './pages/procurement/pricing/PriceRuleEngine.jsx'
import LeadTimeMatrix from './pages/procurement/pricing/LeadTimeMatrix.jsx'
import CostHistory from './pages/procurement/pricing/CostHistory.jsx'

// Settings Pages
import CompanyProfile from './pages/settings/company/CompanyProfile.jsx'
import Branding from './pages/settings/company/Branding.jsx'
import WorkingHours from './pages/settings/company/WorkingHours.jsx'
import EmailSMTP from './pages/settings/integrations/EmailSMTP.jsx'
import ERPWebhooks from './pages/settings/integrations/ERPWebhooks.jsx'
import AccountingSync from './pages/settings/integrations/AccountingSync.jsx'
import Barcode from './pages/settings/integrations/Barcode.jsx'
import DocumentSeries from './pages/settings/numbering/DocumentSeries.jsx'
import LotNumbering from './pages/settings/numbering/LotNumbering.jsx'
import WorkOrderNumbering from './pages/settings/numbering/WorkOrderNumbering.jsx'
import PlantsList from './pages/settings/plants/PlantsList.jsx'
import PlantCreate from './pages/settings/plants/PlantCreate.jsx'
import Shifts from './pages/settings/plants/Shifts.jsx'

// Quality Pages
import InspectionList from './pages/quality/inspections/InspectionList.jsx'
import InspectionCreate from './pages/quality/inspections/InspectionCreate.jsx'
import InspectionDetails from './pages/quality/inspections/InspectionDetails.jsx'
import InspectionTemplates from './pages/quality/inspections/InspectionTemplates.jsx'
import NCRList from './pages/quality/ncr/NCRList.jsx'
import NCRCreate from './pages/quality/ncr/NCRCreate.jsx'
import NCRDetails from './pages/quality/ncr/NCRDetails.jsx'
import NCRDisposition from './pages/quality/ncr/NCRDisposition.jsx'
import CAPAList from './pages/quality/capa/CAPAList.jsx'
import CAPACreate from './pages/quality/capa/CAPACreate.jsx'
import CAPADetails from './pages/quality/capa/CAPADetails.jsx'
import CAPAEffectiveness from './pages/quality/capa/CAPAEffectiveness.jsx'
import CoCList from './pages/quality/certificates/CoCList.jsx'
import CoCGenerate from './pages/quality/certificates/CoCGenerate.jsx'
import ComplianceDocs from './pages/quality/certificates/ComplianceDocs.jsx'
import RoHSREACH from './pages/quality/certificates/RoHSREACH.jsx'
import AOIResults from './pages/quality/aoi/AOIResults.jsx'
import AOIQueue from './pages/quality/aoi/AOIQueue.jsx'
import AOIDefects from './pages/quality/aoi/AOIDefects.jsx'
import AOIRework from './pages/quality/aoi/AOIRework.jsx'
import ETestResults from './pages/quality/etest/ETestResults.jsx'
import ETestQueue from './pages/quality/etest/ETestQueue.jsx'
import ETestCertificates from './pages/quality/etest/ETestCertificates.jsx'
import NetlistComparison from './pages/quality/etest/NetlistComparison.jsx'

// Sales Pages
import CustomersList from './pages/sales/customers/CustomersList.jsx'
import CustomerCreate from './pages/sales/customers/CustomerCreate.jsx'
import CustomerDetails from './pages/sales/customers/CustomerDetails.jsx'
import CustomerEdit from './pages/sales/customers/CustomerEdit.jsx'
import QuotationList from './pages/sales/quotations/QuotationList.jsx'
import QuotationCreate from './pages/sales/quotations/QuotationCreate.jsx'
import QuotationDetails from './pages/sales/quotations/QuotationDetails.jsx'
import SalesOrdersList from './pages/sales/orders/SalesOrdersList.jsx'
import SalesOrderCreate from './pages/sales/orders/SalesOrderCreate.jsx'
import SalesOrderDetails from './pages/sales/orders/SalesOrderDetails.jsx'
import SalesOrderEdit from './pages/sales/orders/SalesOrderEdit.jsx'

// RFQ Pages
import RFQList from './pages/sales/rfq/RFQList.jsx'
import RFQCreate from './pages/sales/rfq/RFQCreate.jsx'
import RFQDetails from './pages/sales/rfq/RFQDetails.jsx'
import RFQEdit from './pages/sales/rfq/RFQEdit.jsx'

// Invoice Pages
import InvoiceList from './pages/sales/invoices/InvoiceList.jsx'
import InvoiceCreate from './pages/sales/invoices/InvoiceCreate.jsx'
import InvoiceDetails from './pages/sales/invoices/InvoiceDetails.jsx'
import InvoicePrint from './pages/sales/invoices/InvoicePrint.jsx'

// Engineering Pages
import DFMQueue from './pages/engineering/dfm/DFMQueue.jsx'
import DFMReview from './pages/engineering/dfm/DFMReview.jsx'
import DFMReport from './pages/engineering/dfm/DFMReport.jsx'
import DFMChecklist from './pages/engineering/dfm/DFMChecklist.jsx'
import CAMJobs from './pages/engineering/cam/CAMJobs.jsx'
import CAMJobDetails from './pages/engineering/cam/CAMJobDetails.jsx'
import CAMOutputs from './pages/engineering/cam/CAMOutputs.jsx'
import CAMCreate from './pages/engineering/cam/CAMCreate.jsx'
import GerberUpload from './pages/engineering/cam/GerberUpload.jsx'
import PanelList from './pages/engineering/panelization/PanelList.jsx'
import PanelCreate from './pages/engineering/panelization/PanelCreate.jsx'
import PanelDetails from './pages/engineering/panelization/PanelDetails.jsx'
import PanelTemplates from './pages/engineering/panelization/PanelTemplates.jsx'
import RevisionList from './pages/engineering/revisions/RevisionList.jsx'
import RevisionCreate from './pages/engineering/revisions/RevisionCreate.jsx'
import RevisionCompare from './pages/engineering/revisions/RevisionCompare.jsx'
import ECOChangeRequests from './pages/engineering/revisions/ECOChangeRequests.jsx'
import StackupLibrary from './pages/engineering/stackup/StackupLibrary.jsx'
import StackupCreate from './pages/engineering/stackup/StackupCreate.jsx'
import StackupDetails from './pages/engineering/stackup/StackupDetails.jsx'
import MaterialRules from './pages/engineering/stackup/MaterialRules.jsx'

// Production Pages
import WorkOrdersList from './pages/production/work-orders/WorkOrdersList.jsx'
import WorkOrderCreate from './pages/production/work-orders/WorkOrderCreate.jsx'
import WorkOrderDetails from './pages/production/work-orders/WorkOrderDetails.jsx'
import WorkOrderIssueMaterials from './pages/production/work-orders/WorkOrderIssueMaterials.jsx'
import WIPDashboard from './pages/production/wip/WIPDashboard.jsx'
import WIPHistory from './pages/production/wip/WIPHistory.jsx'
import WIPHoldRelease from './pages/production/wip/WIPHoldRelease.jsx'
import WIPMove from './pages/production/wip/WIPMove.jsx'
import CapacityDashboard from './pages/production/capacity/CapacityDashboard.jsx'
import BottleneckAnalysis from './pages/production/capacity/BottleneckAnalysis.jsx'
import OEETracking from './pages/production/capacity/OEETracking.jsx'
import UtilizationReport from './pages/production/capacity/UtilizationReport.jsx'
import RoutingList from './pages/production/routing/RoutingList.jsx'
import RoutingCreate from './pages/production/routing/RoutingCreate.jsx'
import RoutingDetails from './pages/production/routing/RoutingDetails.jsx'
import RoutingSteps from './pages/production/routing/RoutingSteps.jsx'
import ScheduleBoard from './pages/production/scheduling/ScheduleBoard.jsx'
import MachineAllocation from './pages/production/scheduling/MachineAllocation.jsx'
import ProductionCalendar from './pages/production/scheduling/ProductionCalendar.jsx'
import ShiftPlanning from './pages/production/scheduling/ShiftPlanning.jsx'

// Inventory Pages
import ItemsList from './pages/inventory/items/ItemsList.jsx'
import ItemCreate from './pages/inventory/items/ItemCreate.jsx'
import ItemDetails from './pages/inventory/items/ItemDetails.jsx'
import ItemEdit from './pages/inventory/items/ItemEdit.jsx'
import BOMList from './pages/inventory/bom/BOMList.jsx'
import BOMCreate from './pages/inventory/bom/BOMCreate.jsx'
import BOMDetails from './pages/inventory/bom/BOMDetails.jsx'
import BOMExplode from './pages/inventory/bom/BOMExplode.jsx'
import StockDashboard from './pages/inventory/stock/StockDashboard.jsx'
import StockLedger from './pages/inventory/stock/StockLedger.jsx'
import StockTransfer from './pages/inventory/stock/StockTransfer.jsx'
import StockValuation from './pages/inventory/stock/StockValuation.jsx'
import StockAdjustmentsList from './pages/inventory/adjustments/StockAdjustmentsList.jsx'
import StockAdjustmentCreate from './pages/inventory/adjustments/StockAdjustmentCreate.jsx'
import StockAdjustmentDetails from './pages/inventory/adjustments/StockAdjustmentDetails.jsx'
import CycleCount from './pages/inventory/adjustments/CycleCount.jsx'
import LotsList from './pages/inventory/lots/LotsList.jsx'
import LotCreate from './pages/inventory/lots/LotCreate.jsx'
import LotDetails from './pages/inventory/lots/LotDetails.jsx'
import LotTrace from './pages/inventory/lots/LotTrace.jsx'
import SerialLookup from './pages/inventory/serials/SerialLookup.jsx'
import SerialRegister from './pages/inventory/serials/SerialRegister.jsx'
import SerialPrint from './pages/inventory/serials/SerialPrint.jsx'
import SerialHistory from './pages/inventory/serials/SerialHistory.jsx'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return children
}

// Public route wrapper (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  console.log('App.jsx loaded successfully')
  
  return (
    <>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Company Settings */}
            <Route path="company/profile" element={<CompanyProfile />} />
            <Route path="company/branding" element={<Branding />} />
            <Route path="company/working-hours" element={<WorkingHours />} />
            
            {/* Integrations Settings */}
            <Route path="integrations/email" element={<EmailSMTP />} />
            <Route path="integrations/webhooks" element={<ERPWebhooks />} />
            <Route path="integrations/accounting" element={<AccountingSync />} />
            <Route path="integrations/barcode" element={<Barcode />} />
            
            {/* Numbering Settings */}
            <Route path="numbering/documents" element={<DocumentSeries />} />
            <Route path="numbering/lots" element={<LotNumbering />} />
            <Route path="numbering/work-orders" element={<WorkOrderNumbering />} />
            
            {/* Plants Settings */}
            <Route path="plants/list" element={<PlantsList />} />
            <Route path="plants/create" element={<PlantCreate />} />
            <Route path="plants/shifts" element={<Shifts />} />
          </Route>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            {/* Sales Routes */}
            <Route path="sales/customers" element={<CustomersList />} />
            <Route path="sales/customers/new" element={<CustomerCreate />} />
            <Route path="sales/customers/:id" element={<CustomerDetails />} />
            <Route path="sales/customers/:id/edit" element={<CustomerEdit />} />
            <Route path="sales/quotations" element={<QuotationList />} />
            <Route path="sales/quotations/create" element={<QuotationCreate />} />
            <Route path="sales/quotations/:id" element={<QuotationDetails />} />
            <Route path="sales/orders" element={<SalesOrdersList />} />
            <Route path="sales/orders/create" element={<SalesOrderCreate />} />
            <Route path="sales/orders/:id/edit" element={<SalesOrderEdit />} />
            <Route path="sales/orders/:id" element={<SalesOrderDetails />} />
            
            {/* RFQ Routes */}
            <Route path="sales/rfq" element={<RFQList />} />
            <Route path="sales/rfq/create" element={<RFQCreate />} />
            <Route path="sales/rfq/:id" element={<RFQDetails />} />
            <Route path="sales/rfq/:id/edit" element={<RFQEdit />} />
            
            {/* Invoice Routes */}
            <Route path="sales/invoices" element={<InvoiceList />} />
            <Route path="sales/invoices/create" element={<InvoiceCreate />} />
            <Route path="sales/invoices/:id" element={<InvoiceDetails />} />
            <Route path="sales/invoices/:id/print" element={<InvoicePrint />} />
            
            {/* Engineering Routes */}
            <Route path="engineering/dfm" element={<DFMQueue />} />
            <Route path="engineering/dfm/review" element={<DFMReview />} />
            <Route path="engineering/dfm/report" element={<DFMReport />} />
            <Route path="engineering/dfm/checklist" element={<DFMChecklist />} />
            <Route path="engineering/cam" element={<CAMJobs />} />
            <Route path="engineering/cam/create" element={<CAMCreate />} />
            <Route path="engineering/cam/:id" element={<CAMJobDetails />} />
            <Route path="engineering/cam/outputs" element={<CAMOutputs />} />
            <Route path="engineering/cam/outputs/create" element={<CAMCreate />} />
            <Route path="engineering/cam/upload" element={<GerberUpload />} />
            <Route path="engineering/panelization" element={<PanelList />} />
            <Route path="engineering/panelization/create" element={<PanelCreate />} />
            <Route path="engineering/panelization/:id" element={<PanelDetails />} />
            <Route path="engineering/panelization/templates" element={<PanelTemplates />} />
            <Route path="engineering/revisions" element={<RevisionList />} />
            <Route path="engineering/revisions/create" element={<RevisionCreate />} />
            <Route path="engineering/revisions/compare" element={<RevisionCompare />} />
            <Route path="engineering/revisions/eco" element={<ECOChangeRequests />} />
            <Route path="engineering/stackup" element={<StackupLibrary />} />
            <Route path="engineering/stackup/create" element={<StackupCreate />} />
            <Route path="engineering/stackup/:id" element={<StackupDetails />} />
            <Route path="engineering/stackup/material-rules" element={<MaterialRules />} />
            <Route path="engineering/bom" element={<Navigate to="/dashboard/inventory/bom" replace />} />
            
            {/* Production Routes */}
            <Route path="production/work-orders" element={<WorkOrdersList />} />
            <Route path="production/work-orders/create" element={<WorkOrderCreate />} />
            <Route path="production/work-orders/:id" element={<WorkOrderDetails />} />
            <Route path="production/work-orders/:id/issue-materials" element={<WorkOrderIssueMaterials />} />
            <Route path="production/wip" element={<WIPDashboard />} />
            <Route path="production/wip/history" element={<WIPHistory />} />
            <Route path="production/wip/hold-release" element={<WIPHoldRelease />} />
            <Route path="production/wip/move" element={<WIPMove />} />
            <Route path="production/capacity" element={<CapacityDashboard />} />
            <Route path="production/capacity/bottleneck" element={<BottleneckAnalysis />} />
            <Route path="production/capacity/oee" element={<OEETracking />} />
            <Route path="production/capacity/utilization" element={<UtilizationReport />} />
            <Route path="production/routing" element={<RoutingList />} />
            <Route path="production/routing/create" element={<RoutingCreate />} />
            <Route path="production/routing/:id" element={<RoutingDetails />} />
            <Route path="production/routing/:id/steps" element={<RoutingSteps />} />
            <Route path="production/scheduling" element={<ScheduleBoard />} />
            <Route path="production/scheduling/machines" element={<MachineAllocation />} />
            <Route path="production/scheduling/calendar" element={<ProductionCalendar />} />
            <Route path="production/scheduling/shifts" element={<ShiftPlanning />} />
            
            {/* Quality Routes */}
            <Route path="quality/inspections" element={<InspectionList />} />
            <Route path="quality/inspections/create" element={<InspectionCreate />} />
            <Route path="quality/inspections/:id" element={<InspectionDetails />} />
            <Route path="quality/inspections/templates" element={<InspectionTemplates />} />
            <Route path="quality/ncr" element={<NCRList />} />
            <Route path="quality/ncr/create" element={<NCRCreate />} />
            <Route path="quality/ncr/:id" element={<NCRDetails />} />
            <Route path="quality/ncr/disposition" element={<NCRDisposition />} />
            <Route path="quality/capa" element={<CAPAList />} />
            <Route path="quality/capa/create" element={<CAPACreate />} />
            <Route path="quality/capa/:id" element={<CAPADetails />} />
            <Route path="quality/capa/effectiveness" element={<CAPAEffectiveness />} />
            <Route path="quality/certificates" element={<CoCList />} />
            <Route path="quality/certificates/generate" element={<CoCGenerate />} />
            <Route path="quality/certificates/compliance" element={<ComplianceDocs />} />
            <Route path="quality/certificates/rohs-reach" element={<RoHSREACH />} />
            <Route path="quality/aoi" element={<AOIResults />} />
            <Route path="quality/aoi/queue" element={<AOIQueue />} />
            <Route path="quality/aoi/defects" element={<AOIDefects />} />
            <Route path="quality/aoi/rework" element={<AOIRework />} />
            <Route path="quality/etest" element={<ETestResults />} />
            <Route path="quality/etest/queue" element={<ETestQueue />} />
            <Route path="quality/etest/certificates" element={<ETestCertificates />} />
            <Route path="quality/etest/netlist" element={<NetlistComparison />} />
            
            {/* Inventory Routes */}
            <Route path="inventory/items" element={<ItemsList />} />
            <Route path="inventory/items/create" element={<ItemCreate />} />
            <Route path="inventory/items/:id" element={<ItemDetails />} />
            <Route path="inventory/items/:id/edit" element={<ItemEdit />} />
            <Route path="inventory/bom" element={<BOMList />} />
            <Route path="inventory/bom/create" element={<BOMCreate />} />
            <Route path="inventory/bom/:id" element={<BOMDetails />} />
            <Route path="inventory/bom/:id/explode" element={<BOMExplode />} />
            <Route path="inventory/stock" element={<StockDashboard />} />
            <Route path="inventory/stock/ledger" element={<StockLedger />} />
            <Route path="inventory/stock/transfer" element={<StockTransfer />} />
            <Route path="inventory/stock/valuation" element={<StockValuation />} />
            <Route path="inventory/adjustments" element={<StockAdjustmentsList />} />
            <Route path="inventory/adjustments/create" element={<StockAdjustmentCreate />} />
            <Route path="inventory/adjustments/:id" element={<StockAdjustmentDetails />} />
            <Route path="inventory/adjustments/cycle-count" element={<CycleCount />} />
            <Route path="inventory/lots" element={<LotsList />} />
            <Route path="inventory/lots/create" element={<LotCreate />} />
            <Route path="inventory/lots/:id" element={<LotDetails />} />
            <Route path="inventory/lots/:id/trace" element={<LotTrace />} />
            <Route path="inventory/serials" element={<SerialLookup />} />
            <Route path="inventory/serials/lookup" element={<SerialLookup />} />
            <Route path="inventory/serials/register" element={<SerialRegister />} />
            <Route path="inventory/serials/print" element={<SerialPrint />} />
            <Route path="inventory/serials/history" element={<SerialHistory />} />
            
            {/* Procurement Routes */}
            <Route path="procurement/suppliers" element={<SuppliersList />} />
            <Route path="procurement/suppliers/create" element={<SupplierCreate />} />
            <Route path="procurement/suppliers/:id" element={<SupplierDetails />} />
            <Route path="procurement/suppliers/:id/edit" element={<SupplierEdit />} />
            <Route path="procurement/purchase-orders" element={<PurchaseOrdersList />} />
            <Route path="procurement/purchase-orders/create" element={<PurchaseOrderCreate />} />
            <Route path="procurement/purchase-orders/:id" element={<PurchaseOrderDetails />} />
            <Route path="procurement/purchase-orders/:id/approve" element={<PurchaseOrderApprove />} />
            <Route path="procurement/grn" element={<GRNList />} />
            <Route path="procurement/grn/create" element={<GRNCreate />} />
            <Route path="procurement/grn/:id" element={<GRNDetails />} />
            <Route path="procurement/grn/incoming-qc" element={<IncomingQC />} />
            <Route path="procurement/pricing" element={<SupplierPriceList />} />
            <Route path="procurement/pricing/create" element={<SupplierPriceList />} />
            <Route path="procurement/pricing/rule-engine" element={<PriceRuleEngine />} />
            <Route path="procurement/pricing/lead-time" element={<LeadTimeMatrix />} />
            <Route path="procurement/pricing/cost-history" element={<CostHistory />} />
            
            {/* Admin Routes */}
            <Route path="admin/users" element={<UsersList />} />
            <Route path="admin/users/create" element={<UserCreate />} />
            <Route path="admin/users/:id" element={<UserDetails />} />
            <Route path="admin/users/:id/edit" element={<UserEdit />} />
            <Route path="admin/roles" element={<RolesList />} />
            <Route path="admin/roles/create" element={<RoleCreate />} />
            <Route path="admin/roles/:id" element={<RoleDetails />} />
            <Route path="admin/roles/:id/edit" element={<RoleEdit />} />
            <Route path="admin/permissions" element={<PermissionsMatrix />} />
            <Route path="admin/permissions/create" element={<PermissionCreate />} />
            <Route path="admin/permissions/audit" element={<PermissionAudit />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="admin/settings/integrations" element={<IntegrationsAdmin />} />
            <Route path="admin/settings/ip-whitelist" element={<IPWhitelist />} />
            <Route path="admin/settings/notifications" element={<NotificationRules />} />
            <Route path="admin/masters" element={<MaterialMaster />} />
            <Route path="admin/masters/materials" element={<MaterialMaster />} />
            <Route path="admin/masters/processes" element={<ProcessMaster />} />
            <Route path="admin/masters/uom" element={<UOMMaster />} />
            <Route path="admin/masters/defects" element={<DefectCodes />} />
            <Route path="admin/audit-logs" element={<AuditLogList />} />
            <Route path="admin/audit-logs/:id" element={<AuditLogDetails />} />
            <Route path="admin/audit-logs/export" element={<ExportAuditLogs />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      <Toaster />
    </>
  )
}

export default App