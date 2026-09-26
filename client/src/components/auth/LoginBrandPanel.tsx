import { Package, Activity } from 'lucide-react'

const SERIF = "[font-family:Georgia,'Times_New_Roman',serif]"

const metrics = [
  { label: 'PRODUCTS', value: '174+' },
  { label: 'ACTIVE VARIANTS', value: '75+' },
  { label: 'INVENTORY VISIBILITY', value: '24/7' },
]

export default function LoginBrandPanel() {
  return (
    <aside className="relative hidden lg:flex lg:w-[60%] lg:shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d1526] via-[#0a0f1e] to-[#111a36] select-none">
      {/* Subtle slow atmospheric drift over the dark base */}
      <div className="pointer-events-none absolute -inset-[4%] animate-wave-slower bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_65%)]" />
      {/* Readability overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[#060b18]/55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04070f]/85 via-transparent to-[#04070f]/35" />

      {/* Top-left brand */}
      <div className="relative z-10 flex items-center gap-3 p-8 xl:p-10 animate-fade-in-down">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-white tracking-wide">SIMS</p>
          <p className="text-[11px] text-white/60 font-medium tracking-wide">
            Smart Inventory Management System
          </p>
        </div>
      </div>

      {/* Lower-middle editorial content */}
      <div className="relative z-10 px-8 xl:px-12 pb-10 xl:pb-12">
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.18em] text-white/85 border border-white/25 bg-white/5">
            INVENTORY OPERATIONS
          </span>
          <h1
            className={`mt-5 text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight text-white ${SERIF}`}
          >
            Command
            <br />
            every aisle.
          </h1>
          <p className="mt-4 max-w-md text-[15px] text-white/70 leading-relaxed">
            Real-time inventory control, analytics, and intelligent operations — built
            for teams who cannot afford a miss.
          </p>
        </div>

        <div
          className="mt-8 border-t border-white/15 pt-6 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="grid grid-cols-3 max-w-lg">
            {metrics.map((m, i) => (
              <div key={m.label} className={i > 0 ? 'border-l border-white/15 pl-6' : ''}>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-white/50">
                  {m.label}
                </p>
                <p className={`mt-1.5 text-[26px] font-semibold text-white tabular-nums ${SERIF}`}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] tracking-wide text-white/35">Sample demo data</p>
        </div>

        <div
          className="mt-6 flex items-center gap-2 text-xs text-white/60 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <Activity className="w-3.5 h-3.5 text-emerald-400/80" />
          All inventory systems operational
        </div>
      </div>
    </aside>
  )
}
