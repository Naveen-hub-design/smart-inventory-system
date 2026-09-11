import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Lock,
  Package,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { Reveal, SectionHeading, useCountUp, useInView, formatIN } from './landing-ui'

/* ---------------- Stats strip ---------------- */

const stats = [
  { icon: Boxes, value: '200+', label: 'Products Managed' },
  { icon: Activity, value: 'Real-time', label: 'Tracking' },
  { icon: BarChart3, value: 'Smart', label: 'Analytics' },
  { icon: Clock, value: '24/7', label: 'Monitoring' },
]

export function StatsStrip() {
  return (
    <section className="relative border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex items-center justify-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </span>
                  <span>
                    <span className="block text-xl font-bold text-white tracking-tight">{s.value}</span>
                    <span className="block text-xs text-slate-400">{s.label}</span>
                  </span>
                </div>
              )
            })}
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
    tile: 'bg-blue-500/15 text-blue-300',
    title: 'Real-time Inventory Tracking',
    desc: 'Monitor stock levels and inventory movement in real time.',
  },
  {
    icon: BarChart3,
    tile: 'bg-emerald-500/15 text-emerald-300',
    title: 'Smart Analytics',
    desc: 'Turn inventory and sales data into actionable business insights.',
  },
  {
    icon: Bell,
    tile: 'bg-amber-500/15 text-amber-300',
    title: 'Intelligent Alerts',
    desc: 'Automatically identify low-stock items and important inventory events.',
  },
  {
    icon: ShieldCheck,
    tile: 'bg-indigo-500/15 text-indigo-300',
    title: 'Secure Role-based Access',
    desc: 'Keep business data protected with secure authentication and access control.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-16 sm:py-24 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to manage inventory smarter."
          desc="SIMS brings inventory, materials, sales, analytics and alerts together in one intelligent platform."
        />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} delay={i * 90}>
                <div className="h-full rounded-2xl bg-white/[0.03] border border-white/10 p-5 hover:border-blue-400/30 hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-300">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.tile} ring-1 ring-white/10`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-white leading-snug">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------- How it works ---------------- */

const steps = [
  { n: '01', title: 'Track', desc: 'Capture and monitor inventory activity.' },
  { n: '02', title: 'Analyze', desc: 'Understand stock, sales and business performance.' },
  { n: '03', title: 'Optimize', desc: 'Use insights and alerts to make faster decisions.' },
]

export function HowItWorks() {
  return (
    <section id="solutions" className="relative py-16 sm:py-24 scroll-mt-16 bg-white/[0.015] border-y border-white/[0.07]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From inventory data to better decisions."
          desc="A simple flow that turns everyday stock activity into confident business moves."
        />
        <div className="mt-10 sm:mt-14 relative grid md:grid-cols-3 gap-8 md:gap-6">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-7 left-[18%] right-[18%] border-t-2 border-dashed border-blue-400/20"
            aria-hidden="true"
          />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative text-center px-4">
                <div className="relative z-10 mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-1 ring-white/15">
                  <span className="text-sm font-bold text-white tabular-nums">{s.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Dashboard preview ---------------- */

const previewStats = [
  { label: 'Total Products', value: 1284, prefix: '', suffix: '', color: 'text-blue-400' },
  { label: 'Inventory Value', value: 864, prefix: '₹', suffix: 'L', color: 'text-emerald-400' },
  { label: 'Low Stock Items', value: 18, prefix: '', suffix: '', color: 'text-amber-400' },
  { label: 'Revenue (MTD)', value: 126, prefix: '₹', suffix: 'L', color: 'text-indigo-400' },
]

const salesBars = [38, 52, 44, 61, 58, 74, 69, 82, 77, 90, 86, 96]

const distribution = [
  { label: 'Electronics', pct: 72, bar: 'from-blue-500 to-blue-400' },
  { label: 'Hardware', pct: 54, bar: 'from-indigo-500 to-indigo-400' },
  { label: 'Raw Materials', pct: 63, bar: 'from-emerald-500 to-emerald-400' },
  { label: 'Accessories', pct: 38, bar: 'from-amber-500 to-amber-400' },
]

const previewAlerts = [
  { item: 'Copper wire 2mm', detail: '4 units left', level: 'Critical', cls: 'bg-red-500/15 text-red-300' },
  { item: 'Steel bolts M8', detail: '12 units left', level: 'Low', cls: 'bg-amber-500/15 text-amber-300' },
  { item: 'PVC pipe 1 inch', detail: '21 units left', level: 'Watch', cls: 'bg-blue-500/15 text-blue-300' },
]

const previewTxns = [
  { id: 'INV-8831', party: 'Walk-in Customer', items: '24 items', amount: '₹18,240', kind: 'Sale', cls: 'bg-emerald-500/15 text-emerald-300' },
  { id: 'PO-1042', party: 'Sharma Suppliers', items: '120 items', amount: '₹64,500', kind: 'Purchase', cls: 'bg-blue-500/15 text-blue-300' },
  { id: 'INV-8830', party: 'Tech Solutions', items: '8 items', amount: '₹9,750', kind: 'Sale', cls: 'bg-emerald-500/15 text-emerald-300' },
  { id: 'PO-1041', party: 'National Traders', items: '60 items', amount: '₹32,100', kind: 'Purchase', cls: 'bg-blue-500/15 text-blue-300' },
]

export function DashboardPreview() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2)
  const animated = previewStats.map((s) => s.value)
  const v0 = useCountUp(animated[0], inView)
  const v1 = useCountUp(animated[1], inView)
  const v2 = useCountUp(animated[2], inView)
  const v3 = useCountUp(animated[3], inView)
  const values = [v0, v1, v2, v3]

  return (
    <section id="analytics" className="relative py-16 sm:py-24 scroll-mt-16 overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-[46rem] max-w-none rounded-full bg-indigo-600/10 blur-[130px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Dashboard"
          title="One platform. Complete inventory visibility."
          desc="Stock levels, sales performance, alerts and transactions — visible at a glance, updated in real time."
        />

        <Reveal delay={150} className="mt-10 sm:mt-14">
          <div ref={ref} className="relative">
            <div className="pointer-events-none absolute -inset-4 rounded-[28px] bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent blur-2xl" />
            {/* Browser frame */}
            <div className="relative rounded-2xl border border-white/10 bg-[#0a1330] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] overflow-hidden">
              {/* Frame top bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="mx-auto hidden sm:flex items-center gap-2 px-4 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400">
                  <Lock className="w-3 h-3" /> app.sims.io/dashboard
                </div>
                <div className="w-10 hidden sm:block" />
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Stat row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {previewStats.map((s, i) => (
                    <div
                      key={s.label}
                      className="rounded-xl bg-white/[0.04] border border-white/10 p-3.5 sm:p-4"
                    >
                      <p className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                        {s.label}
                      </p>
                      <p className="mt-1.5 text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
                        {s.prefix}
                        {formatIN(values[i])}
                        {s.suffix}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-5 gap-3 sm:gap-4">
                  {/* Sales analytics */}
                  <div className="lg:col-span-3 rounded-xl bg-white/[0.04] border border-white/10 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" /> Sales analytics
                      </p>
                      <span className="text-[11px] text-slate-500">Last 12 months</span>
                    </div>
                    <div className="mt-4 flex items-end gap-1.5 sm:gap-2 h-28 sm:h-32">
                      {salesBars.map((h, i) => (
                        <div key={i} className="flex-1 flex items-end h-full">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-blue-600/70 to-blue-400/90"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock distribution */}
                  <div className="lg:col-span-2 rounded-xl bg-white/[0.04] border border-white/10 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-indigo-400" /> Stock distribution
                    </p>
                    <div className="mt-4 space-y-3.5">
                      {distribution.map((d) => (
                        <div key={d.label}>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-slate-300">{d.label}</span>
                            <span className="text-slate-400 tabular-nums">{d.pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${d.bar}`}
                              style={{ width: `${d.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
                  {/* Low-stock alerts */}
                  <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Low-stock alerts
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {previewAlerts.map((a) => (
                        <div
                          key={a.item}
                          className="flex items-center gap-3 text-xs rounded-lg bg-white/[0.03] border border-white/[0.07] px-3 py-2"
                        >
                          <span className="text-slate-200 font-medium truncate">{a.item}</span>
                          <span className="text-slate-500 shrink-0">{a.detail}</span>
                          <span
                            className={`ml-auto shrink-0 px-2 py-0.5 rounded-full font-semibold ${a.cls}`}
                          >
                            {a.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent transactions */}
                  <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" /> Recent transactions
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {previewTxns.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 text-xs rounded-lg bg-white/[0.03] border border-white/[0.07] px-3 py-2"
                        >
                          <span className="text-slate-400 tabular-nums shrink-0">{t.id}</span>
                          <span className="text-slate-200 truncate">{t.party}</span>
                          <span className="ml-auto text-slate-300 tabular-nums shrink-0">{t.amount}</span>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full font-semibold ${t.cls}`}>
                            {t.kind}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Illustrative product preview — sample data
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- AI section ---------------- */

const aiPoints = [
  { title: 'Low-stock risks', desc: 'Spot items likely to run out before they do.' },
  { title: 'Inventory trends', desc: 'See which categories are growing or slowing.' },
  { title: 'Sales patterns', desc: 'Understand what sells, when, and how fast.' },
  { title: 'Business insights', desc: 'Turn raw activity into clear next actions.' },
]

const flowNodes = [
  { icon: Database, label: 'Inventory Data' },
  { icon: Sparkles, label: 'AI Analysis' },
  { icon: Zap, label: 'Smart Actions' },
]

export function AISection() {
  return (
    <section id="ai" className="relative py-16 sm:py-24 scroll-mt-16 bg-[#050a1a] border-y border-white/[0.07] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 animate-gradient-shift bg-[linear-gradient(115deg,rgba(59,130,246,0.07),rgba(99,102,241,0.05),rgba(59,130,246,0.07))]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="AI Intelligence"
          title="Turn inventory data into intelligence."
          desc="SIMS analyses stock, sales and supplier activity to surface risks and opportunities automatically."
        />

        {/* Data-flow visualization */}
        <Reveal delay={120}>
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-0 max-w-3xl mx-auto">
            {flowNodes.map((n, i) => {
              const Icon = n.icon
              return (
                <div key={n.label} className="flex flex-col sm:flex-row items-center flex-1">
                  <div className="flex flex-col items-center rounded-2xl bg-white/[0.04] border border-white/10 px-6 py-5 w-full sm:w-auto sm:min-w-[180px]">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-1 ring-white/15">
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <span className="mt-2.5 text-sm font-semibold text-white">{n.label}</span>
                  </div>
                  {i < flowNodes.length - 1 && (
                    <div className="flex sm:flex-1 flex-col sm:flex-row items-center justify-center py-2 sm:py-0 sm:px-3" aria-hidden="true">
                      {/* vertical connector on mobile, horizontal on desktop */}
                      <span className="sm:hidden w-px h-6 bg-gradient-to-b from-blue-400/40 to-blue-400/10" />
                      <span className="hidden sm:flex flex-1 items-center gap-1.5">
                        <span className="flex-1 h-px bg-gradient-to-r from-blue-400/10 via-blue-400/40 to-blue-400/10" />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
                          style={{ animationDelay: `${i * 400}ms` }}
                        />
                        <span className="flex-1 h-px bg-gradient-to-r from-blue-400/10 via-blue-400/40 to-blue-400/10" />
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Reveal>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiPoints.map((a, i) => (
            <Reveal key={a.title} delay={i * 90}>
              <div className="flex gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4 h-full">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                  <p className="mt-1 text-[13px] text-slate-400 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Security section ---------------- */

const securityItems = [
  {
    icon: Lock,
    tile: 'bg-blue-500/15 text-blue-300',
    title: 'Secure authentication',
    desc: 'JWT-secured sign-in with encrypted sessions and Google SSO support.',
  },
  {
    icon: Users,
    tile: 'bg-indigo-500/15 text-indigo-300',
    title: 'Role-based access',
    desc: 'Admin and staff roles keep sensitive operations properly protected.',
  },
  {
    icon: ShieldCheck,
    tile: 'bg-emerald-500/15 text-emerald-300',
    title: 'Protected business data',
    desc: 'Validated inputs, full activity audit logs, and safe data backups.',
  },
  {
    icon: Server,
    tile: 'bg-amber-500/15 text-amber-300',
    title: 'Reliable backend',
    desc: 'A structured Flask REST API backed by a relational SQL database.',
  },
]

export function SecuritySection() {
  return (
    <section id="security" className="relative py-16 sm:py-24 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Security"
          title="Built for secure business operations."
          desc="Authentication, access control, and data protection are part of the foundation — not an afterthought."
        />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {securityItems.map((s, i) => {
            const Icon = s.icon
            return (
              <Reveal key={s.title} delay={i * 90}>
                <div className="h-full rounded-2xl bg-white/[0.03] border border-white/10 p-5 hover:border-blue-400/30 transition-colors duration-300">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.tile} ring-1 ring-white/10`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1f4d] via-[#101c4a] to-[#1a1446] border border-white/10 px-6 py-12 sm:px-12 sm:py-16 text-center">
            <div className="pointer-events-none absolute inset-0 animate-gradient-shift bg-[linear-gradient(115deg,rgba(59,130,246,0.14),rgba(99,102,241,0.10),rgba(59,130,246,0.14))]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                Ready to manage inventory smarter?
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-slate-300/80 leading-relaxed">
                Bring inventory tracking, analytics and intelligent insights into one powerful platform.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-8 inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all duration-200 active:scale-[0.97]"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Footer ---------------- */

export function LandingFooter() {
  return (
    <footer id="about" className="relative border-t border-white/10 bg-[#050a1a] scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 ring-1 ring-white/15">
                <Package className="w-5 h-5 text-white" />
              </span>
              <span className="text-[15px] font-bold text-white tracking-tight">SIMS</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Smart Inventory Management System</p>
            <p className="mt-2 max-w-sm text-[13px] text-slate-500 leading-relaxed">
              Real-time inventory tracking, intelligent analytics, and automated business
              insights for modern businesses.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-300">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How it Works', href: '#solutions' },
                { label: 'Dashboard', href: '#analytics' },
                { label: 'AI Intelligence', href: '#ai' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-slate-400 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-300">Resources</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: 'Analytics', href: '#analytics' },
                { label: 'Security', href: '#security' },
                { label: 'Contact', href: '#cta' },
                { label: 'Sign In', href: '/login' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-slate-400 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>&copy; 2026 SIMS. All rights reserved.</span>
          <span>Inventory + Analytics + Automation + Security</span>
        </div>
      </div>
    </footer>
  )
}
