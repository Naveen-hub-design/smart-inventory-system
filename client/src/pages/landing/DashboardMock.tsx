import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Boxes,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
} from 'lucide-react'
import { useCountUp, useInView, formatIN } from './landing-ui'

/**
 * Faithful miniature of the real SIMS Admin Dashboard:
 * white sidebar + gray-50 workspace, stat cards with gradient icon tiles,
 * blue sales line (#3b82f6), emerald purchase bars (#10b981),
 * transaction rows and the AI Insights Summary block.
 * Static sample data — clearly labelled as a preview where used.
 */

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Package, label: 'Products', active: false },
  { icon: ShoppingCart, label: 'Sales', active: false },
  { icon: Truck, label: 'Purchases', active: false },
  { icon: Boxes, label: 'Inventory', active: false },
  { icon: Brain, label: 'AI Intelligence', active: false },
]

function Sidebar({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`shrink-0 bg-white border-r border-gray-200 flex flex-col ${
        compact ? 'w-28 p-2' : 'w-36 sm:w-44 p-2.5 sm:p-3'
      }`}
    >
      <div className="flex items-center gap-1.5 px-1 pb-2 border-b border-gray-100">
        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
          <Package className="w-3.5 h-3.5 text-white" />
        </span>
        {!compact && <span className="text-xs font-bold text-gray-900 tracking-tight">SIMS</span>}
      </div>
      <div className={`flex-1 space-y-0.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
        {navItems.map((n) => {
          const Icon = n.icon
          return (
            <div
              key={n.label}
              className={`flex items-center gap-1.5 rounded-lg font-medium ${
                compact ? 'px-1.5 py-1.5 text-[9px] justify-center flex-col gap-0.5' : 'px-2 py-1.5 text-[10px]'
              } ${
                n.active
                  ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700'
                  : 'text-gray-500'
              }`}
            >
              <Icon className={compact ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
              <span className={compact ? '' : 'truncate'}>{n.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SalesLine({ id, height = 64 }: { id: string; height?: number }) {
  return (
    <svg viewBox="0 0 240 80" fill="none" className="w-full" style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[16, 32, 48, 64].map((y) => (
        <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="#e5e7eb" strokeWidth="1" opacity="0.7" />
      ))}
      <path
        d="M4 62 L28 56 L52 58 L76 44 L100 47 L124 34 L148 37 L172 24 L196 27 L220 14 L236 17"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 62 L28 56 L52 58 L76 44 L100 47 L124 34 L148 37 L172 24 L196 27 L220 14 L236 17 L236 80 L4 80 Z"
        fill={`url(#${id})`}
      />
      <circle cx="220" cy="14" r="3" fill="#3b82f6" />
    </svg>
  )
}

const purchaseBars = [34, 48, 41, 56, 52, 66, 61, 72, 68, 78, 74, 88]

function MiniKpi({
  label,
  display,
  tile,
  icon,
}: {
  label: string
  display: string
  tile: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-white border border-gray-100 shadow-premium p-2 sm:p-2.5">
      <div className="flex items-start justify-between gap-1">
        <span className="text-[9px] sm:text-[10px] font-medium text-gray-500 leading-tight">{label}</span>
        <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${tile} flex items-center justify-center shrink-0`}>
          {icon}
        </span>
      </div>
      <p className="mt-1 text-sm sm:text-base font-bold text-gray-900 tabular-nums tracking-tight">{display}</p>
    </div>
  )
}

const recentRows = [
  { invoice: 'INV-8831', party: 'Walk-in Customer', amount: '₹18,240', sale: true },
  { invoice: 'PO-1042', party: 'Sharma Suppliers', amount: '₹64,500', sale: false },
  { invoice: 'INV-8830', party: 'Tech Solutions', amount: '₹9,750', sale: true },
]

const reorderRows = [
  { name: 'Copper wire 2mm', qty: '+240', dot: 'bg-red-500' },
  { name: 'Steel bolts M8', qty: '+120', dot: 'bg-amber-400' },
  { name: 'PVC pipe 1 inch', qty: '+60', dot: 'bg-green-400' },
]

export default function DashboardMock({ variant = 'full' }: { variant?: 'mini' | 'full' }) {
  const mini = variant === 'mini'
  const { ref, inView } = useInView<HTMLDivElement>(0.2)
  const products = useCountUp(1284, inView)
  const revenue = useCountUp(42, inView)

  return (
    <div ref={ref} className="flex rounded-xl sm:rounded-2xl overflow-hidden text-left">
      <Sidebar compact={mini} />
      {/* Workspace — mirrors the real app shell: gray-50 + white cards */}
      <div className={`flex-1 min-w-0 bg-gray-50 ${mini ? 'p-2 sm:p-3' : 'p-3 sm:p-5'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-bold text-gray-900 tracking-tight ${mini ? 'text-[11px] sm:text-xs' : 'text-sm sm:text-base'}`}>
              Admin Dashboard
            </p>
            {!mini && <p className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">Full oversight of the inventory system</p>}
          </div>
          <div className="flex items-center gap-1.5">
            {!mini && (
              <span className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-[9px] text-gray-400 w-36">
                <Search className="w-3 h-3 shrink-0" />
                <span className="truncate">Search products…</span>
                <kbd className="ml-auto shrink-0 px-1 rounded bg-white border border-gray-200 text-[8px] font-semibold text-gray-400">
                  ⌘K
                </kbd>
              </span>
            )}
            <span className="relative hidden sm:block text-gray-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <span className="relative text-gray-400">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </span>
            {!mini && (
              <span className="hidden sm:flex w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center text-[9px] font-bold text-white shrink-0">
                A
              </span>
            )}
            <span className="flex items-center gap-1 text-[9px] text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" /> Live
            </span>
          </div>
        </div>

        {/* KPI cards — same pattern as the real dashboard stat cards */}
        <div className={`grid grid-cols-2 ${mini ? 'gap-1.5 mt-1.5' : 'sm:grid-cols-4 gap-2 sm:gap-3 mt-2.5 sm:mt-3'}`}>
          <MiniKpi
            label="Total Products"
            display={formatIN(products)}
            tile="from-blue-500 to-blue-600"
            icon={<Package className="w-3 h-3 text-white" />}
          />
          <MiniKpi
            label="Revenue"
            display={`₹${formatIN(revenue)}L`}
            tile="from-emerald-500 to-emerald-600"
            icon={<ArrowUpRight className="w-3 h-3 text-white" />}
          />
          {!mini && (
            <>
              <MiniKpi
                label="Low Stock"
                display="18"
                tile="from-amber-500 to-amber-600"
                icon={<ArrowDownRight className="w-3 h-3 text-white" />}
              />
              <MiniKpi
                label="AI Alerts"
                display="5"
                tile="from-indigo-500 to-indigo-600"
                icon={<Brain className="w-3 h-3 text-white" />}
              />
            </>
          )}
          {mini && (
            <MiniKpi
              label="Low Stock"
              display="18"
              tile="from-amber-500 to-amber-600"
              icon={<ArrowDownRight className="w-3 h-3 text-white" />}
            />
          )}
        </div>

        {/* Charts */}
        <div className={`grid grid-cols-2 ${mini ? 'gap-1.5 mt-1.5' : 'gap-2 sm:gap-3 mt-2 sm:mt-3'}`}>
          <div className="rounded-lg bg-white border border-gray-100 shadow-premium p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900">Monthly Sales</p>
              <ArrowUpRight className="w-3 h-3 text-green-500" />
            </div>
            <div className="mt-1">
              <SalesLine id={mini ? 'mockSalesMini' : 'mockSalesFull'} height={mini ? 44 : 72} />
            </div>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 shadow-premium p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900">Monthly Purchases</p>
              <ArrowDownRight className="w-3 h-3 text-emerald-500" />
            </div>
            <div className={`flex items-end gap-[3px] ${mini ? 'h-11 mt-1' : 'h-[72px] mt-2'}`}>
              {purchaseBars.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-[3px] bg-emerald-500/90" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Activity + AI */}
        <div className={`grid ${mini ? 'grid-cols-1 gap-1.5 mt-1.5' : 'sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3'}`}>
          <div className="rounded-lg bg-white border border-gray-100 shadow-premium p-2 sm:p-3">
            <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900">Recent Transactions</p>
            <div className="mt-1.5 space-y-1">
              {recentRows.slice(0, mini ? 2 : 3).map((t) => (
                <div key={t.invoice} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${t.sale ? 'bg-green-50' : 'bg-blue-50'}`}>
                    {t.sale ? <ArrowUpRight className="w-3 h-3 text-green-600" /> : <ArrowDownRight className="w-3 h-3 text-blue-600" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] sm:text-[10px] font-medium text-gray-900 truncate">{t.invoice}</span>
                    {!mini && <span className="block text-[9px] text-gray-400 truncate">{t.party}</span>}
                  </span>
                  <span className="ml-auto text-[9px] sm:text-[10px] font-semibold text-gray-900 tabular-nums shrink-0">{t.amount}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 shadow-premium p-2 sm:p-3">
            <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900 flex items-center gap-1">
              <Brain className="w-3 h-3 text-indigo-500" /> AI Insights
            </p>
            <div className="mt-1.5 space-y-1">
              {reorderRows.slice(0, mini ? 2 : 3).map((r) => (
                <div key={r.name} className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.dot}`} />
                  <span className="text-[9px] sm:text-[10px] text-gray-900 truncate">{r.name}</span>
                  <span className="ml-auto text-[9px] sm:text-[10px] font-semibold text-indigo-600 shrink-0">{r.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
