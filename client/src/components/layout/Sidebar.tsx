import { NavLink, useLocation } from 'react-router-dom'
import { useRef, useState, useCallback, useEffect } from 'react'
import {
  LayoutDashboard, Package, Truck, ShoppingCart, Receipt,
  Boxes, BarChart3, Search, X, Bot, ShieldCheck, Settings,
  ClipboardList, Layers3, FlaskConical
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/variants', icon: Layers3, label: 'Variants' },
  { to: '/materials', icon: FlaskConical, label: 'Raw Materials' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/purchases', icon: ShoppingCart, label: 'Purchases' },
  { to: '/sales', icon: Receipt, label: 'Sales' },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/ai-intelligence', icon: Bot, label: 'AI Intelligence' },
  { to: '/users', icon: ShieldCheck, label: 'User Management', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
  { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs', adminOnly: true },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

function Label({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width,transform,margin] duration-[120ms,200ms,180ms,200ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
        show
          ? 'max-w-[200px] opacity-100 translate-x-0 ml-2'
          : 'max-w-0 opacity-0 translate-x-[-8px] ml-0'
      }`}
    >
      {children}
    </span>
  )
}

function getCompactDefault(): boolean {
  if (document.documentElement.classList.contains('compact-sidebar')) return true
  const stored = localStorage.getItem('sidebarCompact')
  if (stored !== null) return stored === 'true'
  return true
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)
  const [isCompact, setIsCompact] = useState(getCompactDefault)
  const [expanded, setExpanded] = useState(false)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolvedExpanded = expanded

  useEffect(() => {
    const handler = (e: Event) => {
      const v = (e as CustomEvent).detail as boolean
      setIsCompact(v)
      if (v) {
        setExpanded(false)
        if (collapseTimer.current) {
          clearTimeout(collapseTimer.current)
          collapseTimer.current = null
        }
      }
      localStorage.setItem('sidebarCompact', JSON.stringify(v))
    }
    window.addEventListener('sidebarCollapsedChange', handler)
    return () => window.removeEventListener('sidebarCollapsedChange', handler)
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth < 1024) return
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
    setExpanded(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (window.innerWidth < 1024) return
    collapseTimer.current = setTimeout(() => {
      setExpanded(false)
      collapseTimer.current = null
    }, 350)
  }, [])

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-900/95 dark:backdrop-blur-xl border-r border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-gray-950
          will-change-[width] [backface-visibility:hidden]
          transition-[width,transform,box-shadow] duration-[280ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          w-[260px] ${!resolvedExpanded ? 'lg:w-[80px]' : ''}
        `}
      >
        <div className={`flex items-center p-4 border-b border-gray-200 dark:border-gray-700/50 ${!resolvedExpanded ? 'justify-center' : ''}`}>
          <div className={`flex items-center overflow-hidden ${resolvedExpanded ? 'gap-3' : 'gap-0'}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <Label show={resolvedExpanded}>
              <span className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
                SIMS
              </span>
            </Label>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5 overflow-x-hidden">
          {visibleItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{ animationDelay: `${index * 30}ms` }}
              title={!resolvedExpanded ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-[background-color,color,box-shadow] duration-[150ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-700 dark:text-primary-300 shadow-sm dark:shadow-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                } ${!resolvedExpanded ? 'justify-center px-2 gap-0' : 'gap-3'}`
              }
            >
              <item.icon className="flex-shrink-0 w-5 h-5" />
              <Label show={resolvedExpanded}>
                <span className="truncate">{item.label}</span>
              </Label>
              {location.pathname === item.to && (
                <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-soft flex-shrink-0 transition-[opacity,width] duration-[150ms] ease-out ${!resolvedExpanded ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100'}`} />
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
