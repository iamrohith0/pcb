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
            <Route path="engineering/dfm" element={<div>DFM Check Page - Coming Soon</div>} />
            
            {/* Production Routes */}
            <Route path="production/work-orders" element={<div>Work Orders Page - Coming Soon</div>} />
            
            {/* Quality Routes */}
            <Route path="quality/inspections" element={<div>Inspections Page - Coming Soon</div>} />
            
            {/* Inventory Routes */}
            <Route path="inventory/items" element={<div>Items/Materials Page - Coming Soon</div>} />
            <Route path="inventory/stock" element={<div>Stock/Ledger Page - Coming Soon</div>} />
            
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