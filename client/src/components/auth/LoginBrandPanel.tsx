import React from 'react'

export function SimsLogoIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5L19.5 6.8V17.2L12 21.5L4.5 17.2V6.8L12 2.5Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 2.8L19.2 7L12 11.2L4.8 7L12 2.8Z" fill="white" fillOpacity="0.95" />
      <path d="M4.8 7.3L12 11.4V20.8L4.8 16.7V7.3Z" fill="white" fillOpacity="0.55" />
      <path d="M12 11.4L19.2 7.3V16.7L12 20.8V11.4Z" fill="white" fillOpacity="0.78" />
    </svg>
  )
}

const metrics = [
  { label: 'PRODUCTS', value: '174+' },
  { label: 'ACTIVE VARIANTS', value: '75+' },
  { label: 'INVENTORY VISIBILITY', value: '24/7' },
]

export default function LoginBrandPanel() {
  return (
    <aside className="relative hidden lg:flex lg:w-[58%] xl:w-[60%] lg:shrink-0 flex-col justify-between overflow-hidden bg-[#070b14] select-none min-h-screen">
      {/* Background Warehouse Image */}
      <img
        src="/warehouse_hero.jpg"
        alt="SIMS Warehouse Logistics"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none brightness-[0.82] contrast-[1.08]"
      />

      {/* Atmospheric dark overlays for high contrast and exact moody cinematic look */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050912]/95 via-[#050912]/50 to-[#050912]/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050912]/80 via-transparent to-[#050912]/20" />
      <div className="pointer-events-none absolute inset-0 bg-[#050912]/25 backdrop-brightness-95" />

      {/* Top-left brand header */}
      <div className="relative z-10 flex items-center gap-3.5 p-8 lg:p-10 xl:p-12">
        <div className="w-11 h-11 rounded-full bg-[#111726]/85 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/40">
          <SimsLogoIcon className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[16px] font-bold text-white tracking-wider">SIMS</p>
          <p className="text-[11px] text-white/70 font-medium tracking-wide">
            Smart Inventory Management System
          </p>
        </div>
      </div>

      {/* Lower editorial content */}
      <div className="relative z-10 px-8 lg:px-10 xl:px-14 pb-10 lg:pb-12 xl:pb-14">
        <div>
          {/* Badge */}
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.18em] text-white/85 border border-white/20 bg-white/[0.05] backdrop-blur-sm">
            INVENTORY OPERATIONS
          </span>

          {/* Editorial Headline */}
          <h1 className="mt-5 text-5xl lg:text-[54px] xl:text-[62px] font-bold leading-[1.06] tracking-tight text-white font-serif">
            Command<br />every aisle.
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-md text-sm lg:text-[15px] text-white/75 leading-relaxed font-normal">
            Real-time inventory control, analytics, and intelligent operations — built
            for teams who cannot afford a miss.
          </p>
        </div>

        {/* Divider & Key Metrics */}
        <div className="mt-8 border-t border-white/15 pt-6">
          <div className="grid grid-cols-3 max-w-lg gap-4">
            {metrics.map((m, i) => (
              <div key={m.label} className={i > 0 ? 'border-l border-white/15 pl-4 sm:pl-6' : ''}>
                <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.16em] text-white/50 uppercase">
                  {m.label}
                </p>
                <p className="mt-1.5 text-2xl sm:text-[28px] font-medium text-white tabular-nums font-serif">
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Status Dot */}
        <div className="mt-7 flex items-center gap-2.5 text-xs text-white/75 font-normal">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]" />
          </span>
          <span>All inventory systems operational</span>
        </div>
      </div>
    </aside>
  )
}
