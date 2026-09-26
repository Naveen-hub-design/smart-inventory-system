import { useNavigate } from 'react-router-dom'
import { ArrowRight, MonitorPlay, Lock } from 'lucide-react'
import DashboardMock from './DashboardMock'
import { Reveal } from './landing-ui'

export default function LandingHero() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36 pb-14 sm:pb-16">
      {/* Restrained backdrop: faint grid + one soft blue wash */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_30%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[52rem] max-w-none rounded-full bg-blue-100 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-12 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <Reveal>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-200">
                Smart inventory management
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-5 text-4xl sm:text-5xl xl:text-[56px] font-bold tracking-tight text-slate-900 leading-[1.08] text-balance">
                Inventory control,
                <br />
                built for smarter operations.
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-slate-600 leading-relaxed">
                SIMS brings products, stock, sales, purchases, analytics and intelligent
                inventory insights into one centralized platform.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-600/20 hover:shadow-lg transition-all duration-200 active:scale-[0.97]"
                >
                  Explore Platform <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl shadow-sm transition-all duration-200"
                >
                  <MonitorPlay className="w-4 h-4" /> View Dashboard
                </button>
              </div>
            </Reveal>
          </div>

          {/* Product visual */}
          <Reveal delay={200} className="relative">
            <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
              Live product preview
            </p>
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-[0_32px_70px_-28px_rgba(15,23,42,0.25)] overflow-hidden hover:shadow-[0_36px_80px_-28px_rgba(15,23,42,0.32)] transition-shadow duration-300">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
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
              <DashboardMock variant="mini" />
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Interface preview with sample data
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
