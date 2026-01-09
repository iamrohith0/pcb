import React from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from './components/ui/toaster.jsx'
import { useAuth } from './context/AuthContext'
import './css/app.css'

// Direct imports to avoid lazy loading issues
import LoginPage from './Auth/LoginPage.jsx'
import ForgotPassword from './Auth/ForgotPassword.jsx'
import ResetPassword from './Auth/ResetPassword.jsx'
import AccessDenied from './Auth/AccessDenied.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import NotFound from './pages/not-found/NotFound.jsx'

function ParamRedirect({ to }) {
  const params = useParams();
  const resolved = to.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => params[key] ?? "");
  return <Navigate to={resolved} replace />;
}

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
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import TestAdmin from './pages/admin/TestAdmin.jsx'

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

// Logistics Pages
import DispatchChecklist from './pages/logistics/dispatch/DispatchChecklist.jsx'
import DispatchCreate from './pages/logistics/dispatch/DispatchCreate.jsx'
import DispatchDetails from './pages/logistics/dispatch/DispatchDetails.jsx'
import DispatchQueue from './pages/logistics/dispatch/DispatchQueue.jsx'
import ShipmentsList from './pages/logistics/shipments/ShipmentsList.jsx'
import ShipmentCreate from './pages/logistics/shipments/ShipmentCreate.jsx'
import ShipmentDetails from './pages/logistics/shipments/ShipmentDetails.jsx'
import ShipmentDocuments from './pages/logistics/shipments/ShipmentDocuments.jsx'
import TrackingDashboard from './pages/logistics/tracking/TrackingDashboard.jsx'
import DeliveryStatus from './pages/logistics/tracking/DeliveryStatus.jsx'
import PODUpload from './pages/logistics/tracking/PODUpload.jsx'
import CarrierIntegration from './pages/logistics/tracking/CarrierIntegration.jsx'

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

// Maintenance Pages
import EquipmentList from './pages/maintenance/equipment/EquipmentList.jsx'
import EquipmentCreate from './pages/maintenance/equipment/EquipmentCreate.jsx'
import EquipmentDetails from './pages/maintenance/equipment/EquipmentDetails.jsx'
import EquipmentHistory from './pages/maintenance/equipment/EquipmentHistory.jsx'
import PMSchedule from './pages/maintenance/preventive/PMSchedule.jsx'
import PMCreate from './pages/maintenance/preventive/PMCreate.jsx'
import PMChecklist from './pages/maintenance/preventive/PMChecklist.jsx'
import PMCalendar from './pages/maintenance/preventive/PMCalendar.jsx'
import BreakdownList from './pages/maintenance/breakdowns/BreakdownList.jsx'
import BreakdownCreate from './pages/maintenance/breakdowns/BreakdownCreate.jsx'
import BreakdownDetails from './pages/maintenance/breakdowns/BreakdownDetails.jsx'
import DowntimeAnalysis from './pages/maintenance/breakdowns/DowntimeAnalysis.jsx'
import SparesStock from './pages/maintenance/spares/SparesStock.jsx'
import SpareIssue from './pages/maintenance/spares/SpareIssue.jsx'
import SpareReturn from './pages/maintenance/spares/SpareReturn.jsx'
import SpareReorder from './pages/maintenance/spares/SpareReorder.jsx'

// Warehouse Pages
import WarehousesList from './pages/warehouse/warehouses/WarehousesList.jsx'
import WarehouseCreate from './pages/warehouse/warehouses/WarehouseCreate.jsx'
import WarehouseDetails from './pages/warehouse/warehouses/WarehouseDetails.jsx'
import WarehouseEdit from './pages/warehouse/warehouses/WarehouseEdit.jsx'
import LocationsList from './pages/warehouse/locations/LocationsList.jsx'
import LocationCreate from './pages/warehouse/locations/LocationCreate.jsx'
import LocationDetails from './pages/warehouse/locations/LocationDetails.jsx'
import LocationEdit from './pages/warehouse/locations/LocationEdit.jsx'
import LocationMap from './pages/warehouse/locations/LocationMap.jsx'
import PickList from './pages/warehouse/picking/PickList.jsx'
import PickWave from './pages/warehouse/picking/PickWave.jsx'
import PickConfirm from './pages/warehouse/picking/PickConfirm.jsx'
import PickExceptions from './pages/warehouse/picking/PickExceptions.jsx'
import PackList from './pages/warehouse/packing/PackList.jsx'
import PackingSlip from './pages/warehouse/packing/PackingSlip.jsx'
import PackConfirm from './pages/warehouse/packing/PackConfirm.jsx'
import LabelPrint from './pages/warehouse/packing/LabelPrint.jsx'

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

// Traceability Pages
import BatchDetails from './pages/traceability/batch/BatchDetails.jsx'
import BatchRegister from './pages/traceability/batch/BatchRegister.jsx'
import BatchScan from './pages/traceability/batch/BatchScan.jsx'
import BatchPrint from './pages/traceability/batch/BatchPrint.jsx'
import LotGenealogySearch from './pages/traceability/lot-genealogy/LotGenealogySearch.jsx'
import LotGenealogyTree from './pages/traceability/lot-genealogy/LotGenealogyTree.jsx'
import ComponentLinking from './pages/traceability/lot-genealogy/ComponentLinking.jsx'
import SupplierTrace from './pages/traceability/lot-genealogy/SupplierTrace.jsx'
import RecallCases from './pages/traceability/recall/RecallCases.jsx'
import RecallCreate from './pages/traceability/recall/RecallCreate.jsx'
import RecallImpact from './pages/traceability/recall/RecallImpact.jsx'
import RecallReports from './pages/traceability/recall/RecallReports.jsx'

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
          {/* Redirect routes for backward compatibility */}
          <Route path="/production/routing" element={<Navigate to="/dashboard/production/routing" replace />} />
          <Route path="/production/routing/create" element={<Navigate to="/dashboard/production/routing/create" replace />} />
          <Route path="/production/routing/:id" element={<Navigate to="/dashboard/production/routing/:id" replace />} />
          <Route path="/production/routing/:id/steps" element={<Navigate to="/dashboard/production/routing/:id/steps" replace />} />
          
          {/* Quality redirect routes for backward compatibility */}
          <Route path="/quality/inspections" element={<Navigate to="/dashboard/quality/inspections" replace />} />
          <Route path="/quality/inspections/create" element={<Navigate to="/dashboard/quality/inspections/create" replace />} />
          <Route path="/quality/inspections/:id" element={<Navigate to="/dashboard/quality/inspections/:id" replace />} />
          <Route path="/quality/inspections/templates" element={<Navigate to="/dashboard/quality/inspections/templates" replace />} />
          <Route path="/quality/ncr" element={<Navigate to="/dashboard/quality/ncr" replace />} />
          <Route path="/quality/ncr/create" element={<Navigate to="/dashboard/quality/ncr/create" replace />} />
          <Route path="/quality/ncr/:id" element={<Navigate to="/dashboard/quality/ncr/:id" replace />} />
          <Route path="/quality/ncr/disposition" element={<Navigate to="/dashboard/quality/ncr/disposition" replace />} />
          <Route path="/quality/capa" element={<Navigate to="/dashboard/quality/capa" replace />} />
          <Route path="/quality/capa/create" element={<Navigate to="/dashboard/quality/capa/create" replace />} />
          <Route path="/quality/capa/:id" element={<Navigate to="/dashboard/quality/capa/:id" replace />} />
          <Route path="/quality/capa/effectiveness" element={<Navigate to="/dashboard/quality/capa/effectiveness" replace />} />
          <Route path="/quality/certificates" element={<Navigate to="/dashboard/quality/certificates" replace />} />
          <Route path="/quality/certificates/generate" element={<Navigate to="/dashboard/quality/certificates/generate" replace />} />
          <Route path="/quality/certificates/compliance" element={<Navigate to="/dashboard/quality/certificates/compliance" replace />} />
          <Route path="/quality/aoi" element={<Navigate to="/dashboard/quality/aoi" replace />} />
          <Route path="/quality/aoi/queue" element={<Navigate to="/dashboard/quality/aoi/queue" replace />} />
          <Route path="/quality/aoi/defects" element={<Navigate to="/dashboard/quality/aoi/defects" replace />} />
          <Route path="/quality/aoi/rework" element={<Navigate to="/dashboard/quality/aoi/rework" replace />} />
          <Route path="/quality/etest" element={<Navigate to="/dashboard/quality/etest" replace />} />
          <Route path="/quality/etest/queue" element={<Navigate to="/dashboard/quality/etest/queue" replace />} />
          <Route path="/quality/etest/certificates" element={<Navigate to="/dashboard/quality/etest/certificates" replace />} />
          <Route path="/quality/etest/netlist" element={<Navigate to="/dashboard/quality/etest/netlist" replace />} />
          
          {/* Production redirect routes for backward compatibility */}
          <Route path="/production/work-orders" element={<Navigate to="/dashboard/production/work-orders" replace />} />
          <Route path="/production/work-orders/create" element={<Navigate to="/dashboard/production/work-orders/create" replace />} />
          <Route path="/production/work-orders/:id" element={<Navigate to="/dashboard/production/work-orders/:id" replace />} />
          <Route path="/production/work-orders/:id/issue-materials" element={<Navigate to="/dashboard/production/work-orders/:id/issue-materials" replace />} />
          <Route path="/production/wip" element={<Navigate to="/dashboard/production/wip" replace />} />
          <Route path="/production/wip/history" element={<Navigate to="/dashboard/production/wip/history" replace />} />
          <Route path="/production/wip/hold-release" element={<Navigate to="/dashboard/production/wip/hold-release" replace />} />
          <Route path="/production/wip/move" element={<Navigate to="/dashboard/production/wip/move" replace />} />
          <Route path="/production/capacity" element={<Navigate to="/dashboard/production/capacity" replace />} />
          <Route path="/production/capacity/bottleneck" element={<Navigate to="/dashboard/production/capacity/bottleneck" replace />} />
          <Route path="/production/capacity/oee" element={<Navigate to="/dashboard/production/capacity/oee" replace />} />
          <Route path="/production/capacity/utilization" element={<Navigate to="/dashboard/production/capacity/utilization" replace />} />
          <Route path="/production/scheduling" element={<Navigate to="/dashboard/production/scheduling" replace />} />
          <Route path="/production/scheduling/machines" element={<Navigate to="/dashboard/production/scheduling/machines" replace />} />
          <Route path="/production/scheduling/calendar" element={<Navigate to="/dashboard/production/scheduling/calendar" replace />} />
          <Route path="/production/scheduling/shifts" element={<Navigate to="/dashboard/production/scheduling/shifts" replace />} />
          
          {/* Inventory redirect routes for backward compatibility */}
          <Route path="/inventory/items" element={<Navigate to="/dashboard/inventory/items" replace />} />
          <Route path="/inventory/items/create" element={<Navigate to="/dashboard/inventory/items/create" replace />} />
          <Route path="/inventory/items/:id" element={<Navigate to="/dashboard/inventory/items/:id" replace />} />
          <Route path="/inventory/items/:id/edit" element={<Navigate to="/dashboard/inventory/items/:id/edit" replace />} />
          <Route path="/inventory/bom" element={<Navigate to="/dashboard/inventory/bom" replace />} />
          <Route path="/inventory/bom/create" element={<Navigate to="/dashboard/inventory/bom/create" replace />} />
          <Route path="/inventory/bom/:id" element={<Navigate to="/dashboard/inventory/bom/:id" replace />} />
          <Route path="/inventory/bom/:id/explode" element={<Navigate to="/dashboard/inventory/bom/:id/explode" replace />} />
          <Route path="/inventory/stock" element={<Navigate to="/dashboard/inventory/stock" replace />} />
          <Route path="/inventory/stock/ledger" element={<Navigate to="/dashboard/inventory/stock/ledger" replace />} />
          <Route path="/inventory/stock/transfer" element={<Navigate to="/dashboard/inventory/stock/transfer" replace />} />
          <Route path="/inventory/stock/valuation" element={<Navigate to="/dashboard/inventory/stock/valuation" replace />} />
          <Route path="/inventory/adjustments" element={<Navigate to="/dashboard/inventory/adjustments" replace />} />
          <Route path="/inventory/adjustments/create" element={<Navigate to="/dashboard/inventory/adjustments/create" replace />} />
          <Route path="/inventory/adjustments/:id" element={<Navigate to="/dashboard/inventory/adjustments/:id" replace />} />
          <Route path="/inventory/adjustments/cycle-count" element={<Navigate to="/dashboard/inventory/adjustments/cycle-count" replace />} />
          <Route path="/inventory/lots" element={<Navigate to="/dashboard/inventory/lots" replace />} />
          <Route path="/inventory/lots/create" element={<Navigate to="/dashboard/inventory/lots/create" replace />} />
          <Route path="/inventory/lots/:id" element={<Navigate to="/dashboard/inventory/lots/:id" replace />} />
          <Route path="/inventory/lots/:id/trace" element={<Navigate to="/dashboard/inventory/lots/:id/trace" replace />} />
          <Route path="/inventory/serials" element={<Navigate to="/dashboard/inventory/serials" replace />} />
          <Route path="/inventory/serials/lookup" element={<Navigate to="/dashboard/inventory/serials/lookup" replace />} />
          <Route path="/inventory/serials/register" element={<Navigate to="/dashboard/inventory/serials/register" replace />} />
          <Route path="/inventory/serials/print" element={<Navigate to="/dashboard/inventory/serials/print" replace />} />
          <Route path="/inventory/serials/history" element={<Navigate to="/dashboard/inventory/serials/history" replace />} />
          
          {/* Warehouse redirect routes for backward compatibility */}
          <Route path="/warehouse/warehouses" element={<Navigate to="/dashboard/warehouse/warehouses" replace />} />
          <Route path="/warehouse/warehouses/create" element={<Navigate to="/dashboard/warehouse/warehouses/create" replace />} />
          <Route path="/warehouse/warehouses/:id" element={<Navigate to="/dashboard/warehouse/warehouses/:id" replace />} />
          <Route path="/warehouse/warehouses/:id/edit" element={<Navigate to="/dashboard/warehouse/warehouses/:id/edit" replace />} />
          <Route path="/warehouse/locations" element={<Navigate to="/dashboard/warehouse/locations" replace />} />
          <Route path="/warehouse/locations/create" element={<Navigate to="/dashboard/warehouse/locations/create" replace />} />
          <Route path="/warehouse/locations/:id" element={<Navigate to="/dashboard/warehouse/locations/:id" replace />} />
          <Route path="/warehouse/locations/:id/edit" element={<Navigate to="/dashboard/warehouse/locations/:id/edit" replace />} />
          <Route path="/warehouse/locations/map" element={<Navigate to="/dashboard/warehouse/locations/map" replace />} />
          <Route path="/warehouse/picking" element={<Navigate to="/dashboard/warehouse/picking" replace />} />
          <Route path="/warehouse/picking/wave" element={<Navigate to="/dashboard/warehouse/picking/wave" replace />} />
          <Route path="/warehouse/picking/confirm" element={<Navigate to="/dashboard/warehouse/picking/confirm" replace />} />
          <Route path="/warehouse/picking/exceptions" element={<Navigate to="/dashboard/warehouse/picking/exceptions" replace />} />
          <Route path="/warehouse/packing" element={<Navigate to="/dashboard/warehouse/packing" replace />} />
          <Route path="/warehouse/packing/slip" element={<Navigate to="/dashboard/warehouse/packing/slip" replace />} />
          <Route path="/warehouse/packing/confirm" element={<Navigate to="/dashboard/warehouse/packing/confirm" replace />} />
          <Route path="/warehouse/packing/label" element={<Navigate to="/dashboard/warehouse/packing/label" replace />} />
          
          {/* Logistics redirect routes for backward compatibility */}
          <Route path="/logistics/dispatch" element={<Navigate to="/dashboard/logistics/dispatch" replace />} />
          <Route path="/logistics/dispatch/create" element={<Navigate to="/dashboard/logistics/dispatch/create" replace />} />
          <Route path="/logistics/dispatch/queue" element={<Navigate to="/dashboard/logistics/dispatch/queue" replace />} />
          <Route path="/logistics/dispatch/details" element={<Navigate to="/dashboard/logistics/dispatch/details" replace />} />
          <Route path="/logistics/shipments" element={<Navigate to="/dashboard/logistics/shipments" replace />} />
          <Route path="/logistics/shipments/create" element={<Navigate to="/dashboard/logistics/shipments/create" replace />} />
          <Route path="/logistics/shipments/details" element={<Navigate to="/dashboard/logistics/shipments/details" replace />} />
          <Route path="/logistics/shipments/documents" element={<Navigate to="/dashboard/logistics/shipments/documents" replace />} />
          <Route path="/logistics/tracking" element={<Navigate to="/dashboard/logistics/tracking" replace />} />
          <Route path="/logistics/tracking/status" element={<Navigate to="/dashboard/logistics/tracking/status" replace />} />
          <Route path="/logistics/tracking/pod" element={<Navigate to="/dashboard/logistics/tracking/pod" replace />} />
          <Route path="/logistics/tracking/carriers" element={<Navigate to="/dashboard/logistics/tracking/carriers" replace />} />
          
          {/* Maintenance redirect routes for backward compatibility */}
          <Route path="/maintenance/equipment" element={<Navigate to="/dashboard/maintenance/equipment" replace />} />
          <Route path="/maintenance/equipment/create" element={<Navigate to="/dashboard/maintenance/equipment/create" replace />} />
          <Route path="/maintenance/equipment/:id" element={<Navigate to="/dashboard/maintenance/equipment/:id" replace />} />
          <Route path="/maintenance/equipment/:id/history" element={<Navigate to="/dashboard/maintenance/equipment/:id/history" replace />} />
          <Route path="/maintenance/pm" element={<Navigate to="/dashboard/maintenance/pm" replace />} />
          <Route path="/maintenance/pm/create" element={<Navigate to="/dashboard/maintenance/pm/create" replace />} />
          <Route path="/maintenance/pm/checklist" element={<Navigate to="/dashboard/maintenance/pm/checklist" replace />} />
          <Route path="/maintenance/pm/calendar" element={<Navigate to="/dashboard/maintenance/pm/calendar" replace />} />
          <Route path="/maintenance/work-orders" element={<Navigate to="/dashboard/maintenance/work-orders" replace />} />
          <Route path="/maintenance/breakdowns" element={<Navigate to="/dashboard/maintenance/breakdowns" replace />} />
          <Route path="/maintenance/breakdowns/create" element={<Navigate to="/dashboard/maintenance/breakdowns/create" replace />} />
          <Route path="/maintenance/breakdowns/:id" element={<Navigate to="/dashboard/maintenance/breakdowns/:id" replace />} />
          <Route path="/maintenance/breakdowns/downtime" element={<Navigate to="/dashboard/maintenance/breakdowns/downtime" replace />} />
          <Route path="/maintenance/spares" element={<Navigate to="/dashboard/maintenance/spares" replace />} />
          <Route path="/maintenance/spares/issue" element={<Navigate to="/dashboard/maintenance/spares/issue" replace />} />
          <Route path="/maintenance/spares/return" element={<Navigate to="/dashboard/maintenance/spares/return" replace />} />
          <Route path="/maintenance/spares/reorder" element={<Navigate to="/dashboard/maintenance/spares/reorder" replace />} />
          
          {/* Traceability redirect routes for backward compatibility */}
          <Route path="/traceability/batch" element={<Navigate to="/dashboard/traceability/batch" replace />} />
          <Route path="/traceability/batch/details" element={<Navigate to="/dashboard/traceability/batch/details" replace />} />
          <Route path="/traceability/batch/register" element={<Navigate to="/dashboard/traceability/batch/register" replace />} />
          <Route path="/traceability/batch/scan" element={<Navigate to="/dashboard/traceability/batch/scan" replace />} />
          <Route path="/traceability/batch/print" element={<Navigate to="/dashboard/traceability/batch/print" replace />} />
          <Route path="/traceability/lot-genealogy" element={<Navigate to="/dashboard/traceability/lot-genealogy" replace />} />
          <Route path="/traceability/lot-genealogy/search" element={<Navigate to="/dashboard/traceability/lot-genealogy/search" replace />} />
          <Route path="/traceability/lot-genealogy/tree" element={<Navigate to="/dashboard/traceability/lot-genealogy/tree" replace />} />
          <Route path="/traceability/lot-genealogy/linking" element={<Navigate to="/dashboard/traceability/lot-genealogy/linking" replace />} />
          <Route path="/traceability/lot-genealogy/supplier" element={<Navigate to="/dashboard/traceability/lot-genealogy/supplier" replace />} />
          <Route path="/traceability/recall" element={<Navigate to="/dashboard/traceability/recall" replace />} />
          <Route path="/traceability/recall/cases" element={<Navigate to="/dashboard/traceability/recall/cases" replace />} />
          <Route path="/traceability/recall/create" element={<Navigate to="/dashboard/traceability/recall/create" replace />} />
          <Route path="/traceability/recall/impact" element={<Navigate to="/dashboard/traceability/recall/impact" replace />} />
          <Route path="/traceability/recall/reports" element={<Navigate to="/dashboard/traceability/recall/reports" replace />} />
          
          {/* Engineering redirect routes for backward compatibility */}
          <Route path="/engineering/dfm" element={<Navigate to="/dashboard/engineering/dfm" replace />} />
          <Route path="/engineering/dfm/review" element={<Navigate to="/dashboard/engineering/dfm/review" replace />} />
          <Route path="/engineering/dfm/report" element={<Navigate to="/dashboard/engineering/dfm/report" replace />} />
          <Route path="/engineering/dfm/checklist" element={<Navigate to="/dashboard/engineering/dfm/checklist" replace />} />
          <Route path="/engineering/cam" element={<Navigate to="/dashboard/engineering/cam" replace />} />
          <Route path="/engineering/cam/create" element={<Navigate to="/dashboard/engineering/cam/create" replace />} />
          <Route path="/engineering/cam/:id" element={<Navigate to="/dashboard/engineering/cam/:id" replace />} />
          <Route path="/engineering/cam/outputs" element={<Navigate to="/dashboard/engineering/cam/outputs" replace />} />
          <Route path="/engineering/cam/outputs/create" element={<Navigate to="/dashboard/engineering/cam/outputs/create" replace />} />
          <Route path="/engineering/cam/upload" element={<Navigate to="/dashboard/engineering/cam/upload" replace />} />
          <Route path="/engineering/panelization" element={<Navigate to="/dashboard/engineering/panelization" replace />} />
          <Route path="/engineering/panelization/create" element={<Navigate to="/dashboard/engineering/panelization/create" replace />} />
          <Route path="/engineering/panelization/:id" element={<Navigate to="/dashboard/engineering/panelization/:id" replace />} />
          <Route path="/engineering/panelization/templates" element={<Navigate to="/dashboard/engineering/panelization/templates" replace />} />
          <Route path="/engineering/revisions" element={<Navigate to="/dashboard/engineering/revisions" replace />} />
          <Route path="/engineering/revisions/create" element={<Navigate to="/dashboard/engineering/revisions/create" replace />} />
          <Route path="/engineering/revisions/compare" element={<Navigate to="/dashboard/engineering/revisions/compare" replace />} />
          <Route path="/engineering/revisions/eco" element={<Navigate to="/dashboard/engineering/revisions/eco" replace />} />
          <Route path="/engineering/stackup" element={<Navigate to="/dashboard/engineering/stackup" replace />} />
          <Route path="/engineering/stackup/create" element={<Navigate to="/dashboard/engineering/stackup/create" replace />} />
          <Route path="/engineering/stackup/:id" element={<Navigate to="/dashboard/engineering/stackup/:id" replace />} />
          <Route path="/engineering/stackup/material-rules" element={<Navigate to="/dashboard/engineering/stackup/material-rules" replace />} />
          
          {/* Procurement redirect routes for backward compatibility */}
          <Route path="/procurement/suppliers" element={<Navigate to="/dashboard/procurement/suppliers" replace />} />
          <Route path="/procurement/suppliers/create" element={<Navigate to="/dashboard/procurement/suppliers/create" replace />} />
          <Route path="/procurement/suppliers/:id" element={<Navigate to="/dashboard/procurement/suppliers/:id" replace />} />
          <Route path="/procurement/suppliers/:id/edit" element={<Navigate to="/dashboard/procurement/suppliers/:id/edit" replace />} />
          <Route path="/procurement/purchase-orders" element={<Navigate to="/dashboard/procurement/purchase-orders" replace />} />
          <Route path="/procurement/purchase-orders/create" element={<Navigate to="/dashboard/procurement/purchase-orders/create" replace />} />
          <Route path="/procurement/purchase-orders/:id" element={<Navigate to="/dashboard/procurement/purchase-orders/:id" replace />} />
          <Route path="/procurement/purchase-orders/:id/approve" element={<Navigate to="/dashboard/procurement/purchase-orders/:id/approve" replace />} />
          <Route path="/procurement/grn" element={<Navigate to="/dashboard/procurement/grn" replace />} />
          <Route path="/procurement/grn/create" element={<Navigate to="/dashboard/procurement/grn/create" replace />} />
          <Route path="/procurement/grn/:id" element={<Navigate to="/dashboard/procurement/grn/:id" replace />} />
          <Route path="/procurement/grn/incoming-qc" element={<Navigate to="/dashboard/procurement/grn/incoming-qc" replace />} />
          <Route path="/procurement/pricing" element={<Navigate to="/dashboard/procurement/pricing" replace />} />
          <Route path="/procurement/pricing/create" element={<Navigate to="/dashboard/procurement/pricing/create" replace />} />
          <Route path="/procurement/pricing/rule-engine" element={<Navigate to="/dashboard/procurement/pricing/rule-engine" replace />} />
          <Route path="/procurement/pricing/lead-time" element={<Navigate to="/dashboard/procurement/pricing/lead-time" replace />} />
          <Route path="/procurement/pricing/cost-history" element={<Navigate to="/dashboard/procurement/pricing/cost-history" replace />} />
          
          {/* Sales redirect routes for backward compatibility */}
          <Route path="/sales/customers" element={<Navigate to="/dashboard/sales/customers" replace />} />
          <Route path="/sales/customers/new" element={<Navigate to="/dashboard/sales/customers/new" replace />} />
          <Route path="/sales/customers/:id" element={<Navigate to="/dashboard/sales/customers/:id" replace />} />
          <Route path="/sales/customers/:id/edit" element={<Navigate to="/dashboard/sales/customers/:id/edit" replace />} />
          <Route path="/sales/quotations" element={<Navigate to="/dashboard/sales/quotations" replace />} />
          <Route path="/sales/quotations/create" element={<Navigate to="/dashboard/sales/quotations/create" replace />} />
          <Route path="/sales/quotations/:id" element={<Navigate to="/dashboard/sales/quotations/:id" replace />} />
          <Route path="/sales/orders" element={<Navigate to="/dashboard/sales/orders" replace />} />
          <Route path="/sales/orders/create" element={<Navigate to="/dashboard/sales/orders/create" replace />} />
          <Route path="/sales/orders/:id/edit" element={<ParamRedirect to="/dashboard/sales/orders/:id/edit" />} />
          <Route path="/sales/orders/:id" element={<ParamRedirect to="/dashboard/sales/orders/:id" />} />
          
          {/* RFQ redirect routes for backward compatibility */}
          <Route path="/sales/rfq" element={<Navigate to="/dashboard/sales/rfq" replace />} />
          <Route path="/sales/rfq/create" element={<Navigate to="/dashboard/sales/rfq/create" replace />} />
          <Route path="/sales/rfq/:id" element={<ParamRedirect to="/dashboard/sales/rfq/:id" />} />
          <Route path="/sales/rfq/:id/edit" element={<ParamRedirect to="/dashboard/sales/rfq/:id/edit" />} />
          
          {/* Invoice redirect routes for backward compatibility */}
          <Route path="/sales/invoices" element={<Navigate to="/dashboard/sales/invoices" replace />} />
          <Route path="/sales/invoices/create" element={<Navigate to="/dashboard/sales/invoices/create" replace />} />
          <Route path="/sales/invoices/:id" element={<ParamRedirect to="/dashboard/sales/invoices/:id" />} />
          <Route path="/sales/invoices/:id/print" element={<ParamRedirect to="/dashboard/sales/invoices/:id/print" />} />
          
          {/* Admin redirect routes for backward compatibility */}
          <Route path="/admin/users" element={<Navigate to="/dashboard/admin/users" replace />} />
          <Route path="/admin/users/create" element={<Navigate to="/dashboard/admin/users/create" replace />} />
          <Route path="/admin/users/:id" element={<Navigate to="/dashboard/admin/users/:id" replace />} />
          <Route path="/admin/users/:id/edit" element={<Navigate to="/dashboard/admin/users/:id/edit" replace />} />
          <Route path="/admin/roles" element={<Navigate to="/dashboard/admin/roles" replace />} />
          <Route path="/admin/roles/create" element={<Navigate to="/dashboard/admin/roles/create" replace />} />
          <Route path="/admin/roles/:id" element={<Navigate to="/dashboard/admin/roles/:id" replace />} />
          <Route path="/admin/roles/:id/edit" element={<Navigate to="/dashboard/admin/roles/:id/edit" replace />} />
          <Route path="/admin/permissions" element={<Navigate to="/dashboard/admin/permissions" replace />} />
          <Route path="/admin/permissions/create" element={<Navigate to="/dashboard/admin/permissions/create" replace />} />
          <Route path="/admin/permissions/audit" element={<Navigate to="/dashboard/admin/permissions/audit" replace />} />
          <Route path="/admin/settings" element={<Navigate to="/dashboard/admin/settings" replace />} />
          <Route path="/admin/settings/integrations" element={<Navigate to="/dashboard/admin/settings/integrations" replace />} />
          <Route path="/admin/settings/ip-whitelist" element={<Navigate to="/dashboard/admin/settings/ip-whitelist" replace />} />
          <Route path="/admin/settings/notifications" element={<Navigate to="/dashboard/admin/settings/notifications" replace />} />
          <Route path="/admin/masters" element={<Navigate to="/dashboard/admin/masters" replace />} />
          <Route path="/admin/masters/materials" element={<Navigate to="/dashboard/admin/masters/materials" replace />} />
          <Route path="/admin/masters/processes" element={<Navigate to="/dashboard/admin/masters/processes" replace />} />
          <Route path="/admin/masters/uom" element={<Navigate to="/dashboard/admin/masters/uom" replace />} />
          <Route path="/admin/masters/defects" element={<Navigate to="/dashboard/admin/masters/defects" replace />} />
          <Route path="/admin/audit-logs" element={<Navigate to="/dashboard/admin/audit-logs" replace />} />
          <Route path="/admin/audit-logs/:id" element={<Navigate to="/dashboard/admin/audit-logs/:id" replace />} />
          <Route path="/admin/audit-logs/export" element={<Navigate to="/dashboard/admin/audit-logs/export" replace />} />
          <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
          
          {/* Settings redirect routes for backward compatibility */}
          <Route path="/settings/company/profile" element={<Navigate to="/dashboard/settings/company/profile" replace />} />
          <Route path="/settings/company/branding" element={<Navigate to="/dashboard/settings/company/branding" replace />} />
          <Route path="/settings/company/working-hours" element={<Navigate to="/dashboard/settings/company/working-hours" replace />} />
          <Route path="/settings/integrations/email" element={<Navigate to="/dashboard/settings/integrations/email" replace />} />
          <Route path="/settings/integrations/webhooks" element={<Navigate to="/dashboard/settings/integrations/webhooks" replace />} />
          <Route path="/settings/integrations/accounting" element={<Navigate to="/dashboard/settings/integrations/accounting" replace />} />
          <Route path="/settings/integrations/barcode" element={<Navigate to="/dashboard/settings/integrations/barcode" replace />} />
          <Route path="/settings/numbering/documents" element={<Navigate to="/dashboard/settings/numbering/documents" replace />} />
          <Route path="/settings/numbering/lots" element={<Navigate to="/dashboard/settings/numbering/lots" replace />} />
          <Route path="/settings/numbering/work-orders" element={<Navigate to="/dashboard/settings/numbering/work-orders" replace />} />
          <Route path="/settings/plants/list" element={<Navigate to="/dashboard/settings/plants/list" replace />} />
          <Route path="/settings/plants/create" element={<Navigate to="/dashboard/settings/plants/create" replace />} />
          <Route path="/settings/plants/shifts" element={<Navigate to="/dashboard/settings/plants/shifts" replace />} />
          
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/access-denied"
            element={<AccessDenied />}
          />
          <Route
            path="/dashboard/settings"
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
            <Route path="production/routing/list" element={<RoutingList />} />
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
            
            {/* Traceability Routes */}
            <Route path="traceability/batch" element={<BatchDetails />} />
            <Route path="traceability/batch/details" element={<BatchDetails />} />
            <Route path="traceability/batch/register" element={<BatchRegister />} />
            <Route path="traceability/batch/scan" element={<BatchScan />} />
            <Route path="traceability/batch/print" element={<BatchPrint />} />
            <Route path="traceability/lot-genealogy" element={<LotGenealogySearch />} />
            <Route path="traceability/lot-genealogy/search" element={<LotGenealogySearch />} />
            <Route path="traceability/lot-genealogy/tree" element={<LotGenealogyTree />} />
            <Route path="traceability/lot-genealogy/linking" element={<ComponentLinking />} />
            <Route path="traceability/lot-genealogy/supplier" element={<SupplierTrace />} />
            <Route path="traceability/recall" element={<RecallCases />} />
            <Route path="traceability/recall/cases" element={<RecallCases />} />
            <Route path="traceability/recall/create" element={<RecallCreate />} />
            <Route path="traceability/recall/impact" element={<RecallImpact />} />
            <Route path="traceability/recall/reports" element={<RecallReports />} />
            
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
            
            {/* Warehouse Routes */}
            <Route path="warehouse/warehouses" element={<WarehousesList />} />
            <Route path="warehouse/warehouses/create" element={<WarehouseCreate />} />
            <Route path="warehouse/warehouses/:id" element={<WarehouseDetails />} />
            <Route path="warehouse/warehouses/:id/edit" element={<WarehouseEdit />} />
            <Route path="warehouse/locations" element={<LocationsList />} />
            <Route path="warehouse/locations/create" element={<LocationCreate />} />
            <Route path="warehouse/locations/:id" element={<LocationDetails />} />
            <Route path="warehouse/locations/:id/edit" element={<LocationEdit />} />
            <Route path="warehouse/locations/map" element={<LocationMap />} />
            <Route path="warehouse/picking" element={<PickList />} />
            <Route path="warehouse/picking/wave" element={<PickWave />} />
            <Route path="warehouse/picking/confirm" element={<PickConfirm />} />
            <Route path="warehouse/picking/exceptions" element={<PickExceptions />} />
            <Route path="warehouse/packing" element={<PackList />} />
            <Route path="warehouse/packing/slip" element={<PackingSlip />} />
            <Route path="warehouse/packing/confirm" element={<PackConfirm />} />
            <Route path="warehouse/packing/label" element={<LabelPrint />} />
            
            {/* Logistics Routes */}
            <Route path="logistics/dispatch" element={<DispatchChecklist />} />
            <Route path="logistics/dispatch/create" element={<DispatchCreate />} />
            <Route path="logistics/dispatch/queue" element={<DispatchQueue />} />
            <Route path="logistics/dispatch/details" element={<DispatchDetails />} />
            <Route path="logistics/shipments" element={<ShipmentsList />} />
            <Route path="logistics/shipments/create" element={<ShipmentCreate />} />
            <Route path="logistics/shipments/details" element={<ShipmentDetails />} />
            <Route path="logistics/shipments/documents" element={<ShipmentDocuments />} />
            <Route path="logistics/tracking" element={<TrackingDashboard />} />
            <Route path="logistics/tracking/status" element={<DeliveryStatus />} />
            <Route path="logistics/tracking/pod" element={<PODUpload />} />
            <Route path="logistics/tracking/carriers" element={<CarrierIntegration />} />
            
            {/* Maintenance Routes */}
            <Route path="maintenance/equipment" element={<EquipmentList />} />
            <Route path="maintenance/equipment/create" element={<EquipmentCreate />} />
            <Route path="maintenance/equipment/:id" element={<EquipmentDetails />} />
            <Route path="maintenance/equipment/:id/history" element={<EquipmentHistory />} />
            <Route path="maintenance/pm" element={<PMSchedule />} />
            <Route path="maintenance/pm/create" element={<PMCreate />} />
            <Route path="maintenance/pm/checklist" element={<PMChecklist />} />
            <Route path="maintenance/pm/calendar" element={<PMCalendar />} />
            <Route path="maintenance/work-orders" element={<Navigate to="/dashboard/maintenance/pm" replace />} />
            <Route path="maintenance/breakdowns" element={<BreakdownList />} />
            <Route path="maintenance/breakdowns/create" element={<BreakdownCreate />} />
            <Route path="maintenance/breakdowns/:id" element={<BreakdownDetails />} />
            <Route path="maintenance/breakdowns/downtime" element={<DowntimeAnalysis />} />
            <Route path="maintenance/spares" element={<SparesStock />} />
            <Route path="maintenance/spares/issue" element={<SpareIssue />} />
            <Route path="maintenance/spares/return" element={<SpareReturn />} />
            <Route path="maintenance/spares/reorder" element={<SpareReorder />} />
            
            {/* Admin Routes */}
            <Route path="admin" element={<AdminDashboard />}>
              <Route index element={<TestAdmin />} />
              <Route path="users" element={<UsersList />} />
              <Route path="users/create" element={<UserCreate />} />
              <Route path="users/:id" element={<UserDetails />} />
              <Route path="users/:id/edit" element={<UserEdit />} />
              <Route path="roles" element={<RolesList />} />
              <Route path="roles/create" element={<RoleCreate />} />
              <Route path="roles/:id" element={<RoleDetails />} />
              <Route path="roles/:id/edit" element={<RoleEdit />} />
              <Route path="permissions" element={<PermissionsMatrix />} />
              <Route path="permissions/create" element={<PermissionCreate />} />
              <Route path="permissions/audit" element={<PermissionAudit />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="settings/integrations" element={<IntegrationsAdmin />} />
              <Route path="settings/ip-whitelist" element={<IPWhitelist />} />
              <Route path="settings/notifications" element={<NotificationRules />} />
              <Route path="masters" element={<MaterialMaster />} />
              <Route path="masters/materials" element={<MaterialMaster />} />
              <Route path="masters/processes" element={<ProcessMaster />} />
              <Route path="masters/uom" element={<UOMMaster />} />
              <Route path="masters/defects" element={<DefectCodes />} />
              <Route path="audit-logs" element={<AuditLogList />} />
              <Route path="audit-logs/:id" element={<AuditLogDetails />} />
              <Route path="audit-logs/export" element={<ExportAuditLogs />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      <Toaster />
    </>
  )
}

export default App
