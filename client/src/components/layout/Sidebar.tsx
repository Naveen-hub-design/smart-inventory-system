import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Droplets, Truck, ShoppingCart,
  ClipboardList, BarChart3, Users, Search, X, Shield,
  Settings as SettingsIcon, ScrollText, Layers, Brain
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/variants', icon: Layers, label: 'Variants' },
  { to: '/materials', icon: Droplets, label: 'Raw Materials' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/purchases', icon: ShoppingCart, label: 'Purchases' },
  { to: '/sales', icon: ClipboardList, label: 'Sales' },
  { to: '/inventory', icon: BarChart3, label: 'Inventory' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/ai-intelligence', icon: Brain, label: 'AI Intelligence' },
  { to: '/users', icon: Shield, label: 'User Management', adminOnly: true },
  { to: '/settings', icon: SettingsIcon, label: 'Settings', adminOnly: true },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Logs', adminOnly: true },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)
  const compact = localStorage.getItem('sidebarCompact') === 'true'
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 z-50 h-full ${compact ? 'w-16' : 'w-64'} bg-white dark:bg-gray-900/95 dark:backdrop-blur-xl border-r border-gray-200 dark:border-gray-700/50
        transform transition-all duration-300 ease-in-out shadow-lg dark:shadow-gray-950
        lg:translate-x-0 lg:static lg:z-auto
        ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/50 ${compact ? 'justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${compact ? '' : ''}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            {!compact && <span className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">SIMS</span>}
          </div>
          <button onClick={onClose} className={`lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${compact ? 'hidden' : ''}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {visibleItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{ animationDelay: `${index * 30}ms` }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 animate-fade-in-left ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-700 dark:text-primary-300 shadow-sm dark:shadow-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                } ${compact ? 'justify-center px-2' : ''}`
              }
            >
              <item.icon className={`flex-shrink-0 ${compact ? 'w-5 h-5' : 'w-5 h-5'}`} />
              {!compact && <span>{item.label}</span>}
              {!compact && location.pathname === item.to && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-soft" />
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
