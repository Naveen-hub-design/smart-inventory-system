import { Package, Activity, BarChart3, ShieldCheck, Bell } from 'lucide-react'
import WarehouseIllustration from './WarehouseIllustration'

const featureCards = [
  {
    icon: Activity,
    title: 'Real-time Tracking',
    desc: 'Monitor stock levels across all warehouses, live.',
    tile: 'bg-blue-500/15 text-blue-300',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    desc: 'Reports and insights for better purchasing decisions.',
    tile: 'bg-emerald-500/15 text-emerald-300',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    desc: 'Role-based access keeps every transaction safe.',
    tile: 'bg-violet-500/15 text-violet-300',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Low-stock and expiry notifications, automatically.',
    tile: 'bg-amber-500/15 text-amber-300',
  },
]

export default function LoginBrandPanel() {
  return (
    <aside className="relative hidden lg:flex lg:w-[44%] xl:w-[46%] lg:shrink-0 flex-col overflow-hidden bg-[#0b1b33] p-8 xl:p-10 select-none">
      {/* Top-left logo */}
      <div className="relative z-10 flex items-center gap-3 animate-fade-in-down">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold text-white tracking-tight">SIMS</p>
          <p className="text-[11px] text-blue-200/60 font-medium tracking-wide">Smart Inventory Management System</p>
        </div>
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center py-4">
        <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase text-blue-200 bg-white/[0.06] border border-white/10">
            Inventory management for modern teams
          </span>
          <h1 className="mt-4 text-3xl xl:text-[32px] font-bold leading-[1.15] tracking-tight text-white">
            Manage inventory
            <br />
            with confidence.
          </h1>
          <p className="mt-3 max-w-md text-sm text-blue-100/60 leading-relaxed">
            Track stock in real time, analyse performance, and keep every warehouse
            running smoothly — all from one dashboard.
          </p>
        </div>

        {/* 2x2 feature cards */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {featureCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="rounded-xl bg-white/[0.04] border border-white/10 p-3 animate-fade-in-up"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.tile}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-white/90 leading-tight">{card.title}</h3>
                    <p className="text-xs text-blue-100/50 mt-1 leading-snug">{card.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Warehouse visual + status */}
        <div className="mt-4 animate-fade-in-up" style={{ animationDelay: '480ms' }}>
          <WarehouseIllustration />
          <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-300/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> All warehouses operational
            </span>
            <span className="flex items-center gap-1.5 text-blue-200/60">
              <Activity className="w-3 h-3" /> Live sync
            </span>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-blue-200/40">
        <span>v2.0.0</span>
        <span>&copy; {new Date().getFullYear()} SIMS — All rights reserved</span>
      </div>
    </aside>
  )
}
