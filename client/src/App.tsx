import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import ProductList from './pages/products/ProductList'
import MaterialList from './pages/materials/MaterialList'
import SupplierList from './pages/suppliers/SupplierList'
import PurchaseList from './pages/purchases/PurchaseList'
import SaleList from './pages/sales/SaleList'
import Inventory from './pages/inventory/Inventory'
import Reports from './pages/reports/Reports'
import SearchPage from './pages/search/SearchPage'
import NotificationsPage from './pages/auth/Notifications'
import Profile from './pages/auth/Profile'
import UserList from './pages/users/UserList'
import Settings from './pages/settings/Settings'
import AuditLogs from './pages/audit/AuditLogs'
import VariantList from './pages/variants/VariantList'
import AiPage from './pages/ai/AiPage'
import AccessDenied from './pages/errors/AccessDenied'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="animate-spin w-10 h-10 border-[3px] border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse-soft" />
          </div>
        </div>
        <p className="text-sm text-gray-400 animate-pulse-soft">Loading...</p>
      </div>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="animate-spin w-10 h-10 border-[3px] border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse-soft" />
          </div>
        </div>
        <p className="text-sm text-gray-400 animate-pulse-soft">Loading...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <AccessDenied />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="materials" element={<MaterialList />} />
        <Route path="variants" element={<VariantList />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="purchases" element={<PurchaseList />} />
        <Route path="sales" element={<SaleList />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="ai-intelligence" element={<AiPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<AdminRoute><UserList /></AdminRoute>} />
        <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
