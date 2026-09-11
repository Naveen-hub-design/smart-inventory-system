import { useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, TrendingUp, AlertTriangle, Activity, IndianRupee } from 'lucide-react'
import { Reveal, useCountUp, useInView, formatIN } from './landing-ui'

function Sparkline() {
  return (
    <svg viewBox="0 0 120 36" fill="none" className="w-full h-9" aria-hidden="true">
      <defs>
        <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M2 30 L16 26 L30 27 L44 20 L58 22 L72 15 L86 17 L100 9 L118 11 L118 36 L2 36 Z"
        fill="url(#heroSpark)"
      />
      <path
        d="M2 30 L16 26 L30 27 L44 20 L58 22 L72 15 L86 17 L100 9 L118 11"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="9" r="2.5" fill="#60a5fa" />
    </svg>
  )
}

/** Floating miniature dashboard — illustrative product preview with sample data. */
function MiniDashboard() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25)
  const units = useCountUp(12480, inView)
  const value = useCountUp(864, inView)

  return (
    <div ref={ref} className="relative">
      {/* Depth glow behind the cluster */}
      <div className="pointer-events-none absolute inset-6 rounded-[28px] bg-gradient-to-br from-blue-600/25 via-indigo-600/15 to-transparent blur-2xl" />

      <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
        {/* Total inventory */}
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2 text-slate-400">
            <Boxes className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-medium tracking-wide uppercase">Total inventory</span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
            {formatIN(units)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">units across catalog</p>
        </div>

        {/* Inventory value */}
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] animate-float-y">
          <div className="flex items-center gap-2 text-slate-400">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-medium tracking-wide uppercase">Inventory value</span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
            ₹{(value / 10).toFixed(1)}L
          </p>
          <p className="mt-1 text-[11px] text-emerald-300/80">+12.4% this month</p>
        </div>

        {/* Sales trend */}
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Sales trend
            </span>
            <span className="text-[11px] font-semibold text-emerald-300">+8.2%</span>
          </div>
          <div className="mt-2">
            <Sparkline />
          </div>
        </div>

        {/* Low-stock alerts */}
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-medium tracking-wide uppercase">Low-stock alerts</span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">18</p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">Steel bolts M8</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold">Low</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">Copper wire 2mm</span>
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-300 font-semibold">Critical</span>
            </div>
          </div>
        </div>

        {/* Recent activity — spans both columns */}
        <div className="col-span-2 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2 text-slate-400 mb-3">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-medium tracking-wide uppercase">Recent activity</span>
          </div>
          <div className="space-y-2.5">
            {[
              { dot: 'bg-emerald-400', text: 'Purchase #PO-1042 received from supplier', time: '2m ago' },
              { dot: 'bg-blue-400', text: 'Sale #INV-8831 billed — 24 items', time: '18m ago' },
              { dot: 'bg-amber-400', text: 'Low-stock alert triggered for 3 variants', time: '1h ago' },
            ].map((row) => (
              <div key={row.text} className="flex items-center gap-2.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.dot}`} />
                <span className="text-slate-300 truncate">{row.text}</span>
                <span className="ml-auto shrink-0 text-slate-500">{row.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-500">
        Illustrative product preview — sample data
      </p>
    </div>
  )
}

export default function LandingHero() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32 pb-14 sm:pb-20">
      {/* Backdrop: slow gradient drift + faint grid */}
      <div className="pointer-events-none absolute inset-0 animate-gradient-shift bg-[linear-gradient(115deg,rgba(59,130,246,0.10),rgba(99,102,241,0.06),rgba(59,130,246,0.10))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[42rem] max-w-none rounded-full bg-blue-600/15 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <Reveal>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase text-blue-300 bg-blue-500/10 border border-blue-400/20">
                AI-powered inventory management
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-5 text-4xl sm:text-5xl xl:text-[56px] font-bold tracking-tight text-white leading-[1.08] text-balance">
                Manage Inventory.
                <br />
                Make{' '}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Smarter Decisions.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-slate-400 leading-relaxed">
                Real-time inventory tracking, intelligent analytics, and automated business
                insights designed to help modern businesses operate smarter.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200 active:scale-[0.97]"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
                >
                  Explore Platform
                </a>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <p className="mt-6 text-xs text-slate-500 tracking-wide">
                Real-time data <span className="mx-1.5 text-slate-600">•</span> Smart analytics{' '}
                <span className="mx-1.5 text-slate-600">•</span> Secure access
              </p>
            </Reveal>
          </div>

          {/* Visual */}
          <Reveal delay={200} className="relative">
            <MiniDashboard />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
