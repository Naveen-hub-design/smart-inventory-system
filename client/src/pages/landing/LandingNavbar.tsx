import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Menu, X, ArrowRight } from 'lucide-react'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'About', href: '#about' },
]

export default function LandingNavbar() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#070c1c]/85 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5"
          aria-label="SIMS home"
        >
          <span className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 ring-1 ring-white/15">
            <Package className="w-5 h-5 text-white" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[15px] font-bold text-white tracking-tight">SIMS</span>
            <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wide">
              Smart Inventory Management System
            </span>
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all duration-200 active:scale-[0.97]"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#070c1c]/95 backdrop-blur-xl border-b border-white/10 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
