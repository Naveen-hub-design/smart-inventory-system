import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import AccessDenied from './pages/errors/AccessDenied'

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const ProductList = lazy(() => import('./pages/products/ProductList'))
const MaterialList = lazy(() => import('./pages/materials/MaterialList'))
const SupplierList = lazy(() => import('./pages/suppliers/SupplierList'))
const PurchaseList = lazy(() => import('./pages/purchases/PurchaseList'))
const SaleList = lazy(() => import('./pages/sales/SaleList'))
const Inventory = lazy(() => import('./pages/inventory/Inventory'))
const Reports = lazy(() => import('./pages/reports/Reports'))
const SearchPage = lazy(() => import('./pages/search/SearchPage'))
const NotificationsPage = lazy(() => import('./pages/auth/Notifications'))
const Profile = lazy(() => import('./pages/auth/Profile'))
const UserList = lazy(() => import('./pages/users/UserList'))
const Settings = lazy(() => import('./pages/settings/Settings'))
const AuditLogs = lazy(() => import('./pages/audit/AuditLogs'))
const VariantList = lazy(() => import('./pages/variants/VariantList'))
const AiPage = lazy(() => import('./pages/ai/AiPage'))

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-12">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 border-[3px] border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full" />
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <PageLoader />
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
        <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductList /></Suspense>} />
        <Route path="materials" element={<Suspense fallback={<PageLoader />}><MaterialList /></Suspense>} />
        <Route path="variants" element={<Suspense fallback={<PageLoader />}><VariantList /></Suspense>} />
        <Route path="suppliers" element={<Suspense fallback={<PageLoader />}><SupplierList /></Suspense>} />
        <Route path="purchases" element={<Suspense fallback={<PageLoader />}><PurchaseList /></Suspense>} />
        <Route path="sales" element={<Suspense fallback={<PageLoader />}><SaleList /></Suspense>} />
        <Route path="inventory" element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>} />
        <Route path="ai-intelligence" element={<Suspense fallback={<PageLoader />}><AiPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
        <Route path="search" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="users" element={<AdminRoute><Suspense fallback={<PageLoader />}><UserList /></Suspense></AdminRoute>} />
        <Route path="settings" element={<AdminRoute><Suspense fallback={<PageLoader />}><Settings /></Suspense></AdminRoute>} />
        <Route path="audit-logs" element={<AdminRoute><Suspense fallback={<PageLoader />}><AuditLogs /></Suspense></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
