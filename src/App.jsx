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
            <Route path="quality/inspections" element={<div>Inspections Page - Coming Soon</div>} />
            
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
            <Route path="procurement/suppliers" element={<div>Suppliers Page - Coming Soon</div>} />
            <Route path="procurement/purchase-orders" element={<div>Purchase Orders Page - Coming Soon</div>} />
            
            {/* Admin Routes */}
            <Route path="admin/users" element={<div>Users Page - Coming Soon</div>} />
            <Route path="admin/settings" element={<div>Settings Page - Coming Soon</div>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      <Toaster />
    </>
  )
}

export default App