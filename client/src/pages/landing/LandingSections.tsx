import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Brain,
  Lock,
  Package,
  Sparkles,
  TrendingUp,
  ArrowLeftRight,
  Zap,
} from 'lucide-react'
import { Reveal, SectionHeading } from './landing-ui'
import DashboardMock from './DashboardMock'

/* ---------------- Capability line ---------------- */

const capabilities = ['Inventory', 'Sales', 'Purchases', 'Analytics', 'AI Insights']

export function CapabilityLine() {
  return (
    <section className="relative border-y border-slate-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {capabilities.map((c, i) => (
              <span key={c} className="flex items-center gap-6">
                <span className="text-sm font-semibold text-slate-700 tracking-wide">{c}</span>
                {i < capabilities.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
                )}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Features ---------------- */

const features = [
  {
    icon: Boxes,
    tile: 'bg-blue-50 text-blue-600',
    title: 'Inventory Control',
    desc: 'Products, variants, stock and movements.',
  },
  {
    icon: ArrowLeftRight,
    tile: 'bg-emerald-50 text-emerald-600',
    title: 'Sales & Purchasing',
    desc: 'Track transactions and purchasing activity.',
  },
  {
    icon: BarChart3,
    tile: 'bg-indigo-50 text-indigo-600',
    title: 'Analytics & Reports',
    desc: 'Understand performance through meaningful data.',
  },
  {
    icon: Brain,
    tile: 'bg-violet-50 text-violet-600',
    title: 'Intelligent Insights',
    desc: 'Identify stock issues and reorder requirements.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-16 sm:py-24 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          index="01"
          title="Everything your inventory needs. Nothing unnecessary."
          desc="Four focused capabilities that cover the full inventory workflow."
        />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} delay={i * 90}>
                <div className="h-full rounded-2xl bg-white border border-slate-200 p-6 shadow-premium hover:shadow-premium-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.tile}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-slate-900 leading-snug">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------- How SIMS works ---------------- */

const steps = [
  { n: '01', title: 'TRACK', desc: 'Keep products, variants, suppliers and stock organized.' },
  { n: '02', title: 'ANALYZE', desc: 'Understand sales, purchases and inventory trends.' },
  { n: '03', title: 'ACT', desc: 'Use insights and alerts to make faster decisions.' },
]

export function HowItWorks() {
  return (
    <section id="solutions" className="relative py-16 sm:py-24 scroll-mt-16 bg-white border-y border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          index="02"
          title="From stock data to better decisions."
          desc="A simple flow that turns everyday stock activity into confident business moves."
        />
        <div className="mt-10 sm:mt-14 grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 md:gap-4 items-start max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.n} className="contents">
              <Reveal delay={i * 120} className="text-center px-2">
                <p className="text-sm font-bold text-blue-600 tabular-nums tracking-widest">{s.n}</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900 tracking-wide">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-[240px] mx-auto">{s.desc}</p>
              </Reveal>
              {i < steps.length - 1 && (
                <span className="hidden md:flex items-center justify-center pt-8 text-slate-300" aria-hidden="true">
                  <ArrowRight className="w-6 h-6" />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Dashboard showcase ---------------- */

const showcaseLabels = [
  { label: 'Real-time inventory', pos: 'xl:-left-4 xl:top-24' },
  { label: 'Sales analytics', pos: 'xl:-right-4 xl:top-1/3' },
  { label: 'Stock alerts', pos: 'xl:-left-4 xl:bottom-1/4' },
  { label: 'AI insights', pos: 'xl:-right-4 xl:bottom-24' },
]

export function DashboardShowcase() {
  return (
    <section id="analytics" className="relative py-16 sm:py-24 scroll-mt-16 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Product tour"
          index="03"
          title="One platform. Complete visibility."
          desc="The actual SIMS dashboard — stat cards, sales and purchase charts, transactions and AI insights in one view."
        />

        <Reveal delay={150} className="mt-10 sm:mt-14">
          <div className="relative xl:mx-8">
            {/* Browser frame */}
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-[0_40px_80px_-32px_rgba(15,23,42,0.28)] overflow-hidden hover:shadow-[0_48px_90px_-32px_rgba(15,23,42,0.34)] transition-shadow duration-300">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
                <div className="mx-auto hidden sm:flex items-center gap-2 px-4 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500">
                  <Lock className="w-3 h-3" /> app.sims.io/dashboard
                </div>
                <div className="w-10 hidden sm:block" />
              </div>
              <div className="p-3 sm:p-5 bg-gray-50">
                <DashboardMock variant="full" />
              </div>
            </div>

            {/* Subtle labels — desktop only, purely annotative */}
            {showcaseLabels.map((c, i) => (
              <div
                key={c.label}
                className={`hidden xl:flex absolute ${c.pos} items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 shadow-premium`}
              >
                <span className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{c.label}</span>
              </div>
            ))}
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Interface preview of the implemented dashboard — sample data
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- AI section (the one dark section) ---------------- */

const reorderSample = [
  { name: 'Copper wire 2mm', priority: 'High', cls: 'bg-red-500/15 text-red-300', qty: '+240' },
  { name: 'Steel bolts M8', priority: 'Medium', cls: 'bg-amber-500/15 text-amber-300', qty: '+120' },
  { name: 'PVC pipe 1 inch', priority: 'Medium', cls: 'bg-amber-500/15 text-amber-300', qty: '+60' },
]

export function AISection() {
  return (
    <section id="ai" className="relative py-16 sm:py-24 scroll-mt-16 bg-[#0A1730] overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-400/20">
              <span className="font-bold tabular-nums text-indigo-200">04</span>
              AI Intelligence
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
              Turn inventory data into actionable insight.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
              SIMS analyzes inventory signals to help identify products that may require
              attention, support reorder decisions and provide a clearer view of
              inventory health.
            </p>
          </Reveal>
          <div className="mt-6 space-y-3">
            {[
              { icon: AlertTriangle, text: 'Inventory health scoring across the catalog' },
              { icon: TrendingUp, text: 'Demand trends across products and categories' },
              { icon: Zap, text: 'Priority-ranked reorder recommendations' },
            ].map((row, i) => {
              const Icon = row.icon
              return (
                <Reveal key={row.text} delay={i * 90}>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-indigo-300" />
                    </span>
                    {row.text}
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>

        {/* AI insight panel — mirrors the real AI Insights Summary */}
        <Reveal delay={150}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)]">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" /> Inventory insight
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Inventory Health</p>
                <p className="mt-1 text-xl font-bold text-white tabular-nums">
                  86<span className="text-sm text-slate-400">%</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Demand Trend</p>
                <p className="mt-1 text-xl font-bold text-emerald-300">Increasing</p>
                <p className="mt-2 text-[11px] text-slate-500">vs. previous period</p>
              </div>
            </div>
            <p className="mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Products requiring reorder
            </p>
            <div className="mt-2 space-y-1.5">
              {reorderSample.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07] px-3 py-2"
                >
                  <span className="text-xs text-slate-200 truncate">{r.name}</span>
                  <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.cls}`}>
                    {r.priority}
                  </span>
                  <span className="text-xs font-semibold text-indigo-300 tabular-nums shrink-0">{r.qty}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Illustrative preview — sample data</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Final CTA ---------------- */

export function FinalCTA() {
  const navigate = useNavigate()
  return (
    <section id="cta" className="relative py-16 sm:py-24 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary-600 px-6 py-12 sm:px-12 sm:py-16 text-center shadow-[0_32px_70px_-28px_rgba(37,99,235,0.55)]">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_70%_90%_at_50%_50%,black,transparent)]"
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                Your inventory.
                <br />
                Under control.
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-blue-100/90 leading-relaxed">
                Bring products, transactions, analytics and intelligent inventory insights
                together in one platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-white hover:bg-blue-50 text-primary-700 text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 active:scale-[0.97]"
                >
                  Explore SIMS <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/25 hover:border-white/40 rounded-xl transition-all duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Footer ---------------- */

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'About', href: '#about' },
  { label: 'Sign In', href: '/login' },
]

export function LandingFooter() {
  return (
    <footer id="about" className="relative border-t border-slate-200 bg-white scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          <div className="md:max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                <Package className="w-5 h-5 text-white" />
              </span>
              <span className="text-[15px] font-bold text-slate-900 tracking-tight">SIMS</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">Smart Inventory Management System</p>
            <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">
              Inventory control, built for smarter operations.
            </p>
          </div>
          <nav className="md:ml-auto flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer">
            {footerLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          &copy; 2026 SIMS. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
