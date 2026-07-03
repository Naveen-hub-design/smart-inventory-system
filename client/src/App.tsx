import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="materials" element={<MaterialList />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="purchases" element={<PurchaseList />} />
        <Route path="sales" element={<SaleList />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="reports" element={<Reports />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
