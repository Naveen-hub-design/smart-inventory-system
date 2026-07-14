import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, User, ArrowLeft, Send, Package, CheckCircle, Clock, Shield } from 'lucide-react'
import { authService } from '../../services/authService'
import LoginScene from '../../components/three/LoginScene'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username && !email) return
    setLoading(true)
    try {
      await authService.forgotPassword(username || undefined, email || undefined)
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-950 flex items-center justify-center p-6">
        <LoginScene />
        <div className="relative z-20 w-full max-w-md animate-fade-in-up">
          <div className="relative rounded-2xl transition-all duration-500" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Request Submitted</h2>
              <p className="text-primary-300/70 leading-relaxed mb-8">
                Your password reset request has been sent to the system administrator.
              </p>
              <button onClick={() => navigate('/login')} className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-950 flex flex-col lg:flex-row">
      <LoginScene />

      <div className="relative z-20 w-full lg:w-[55%] min-h-[50vh] lg:min-h-screen flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl space-y-8 lg:space-y-10">
          <div className="animate-fade-in-down">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10">
                <Shield className="w-5 h-5 text-primary-300" />
              </div>
              <div>
                <p className="text-primary-200/90 text-lg font-medium">Password Reset</p>
                <p className="text-primary-300/60 text-xs">Internal ERP System</p>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mt-4">Smart Inventory Management System</h1>
            <p className="text-primary-300/70 text-base lg:text-lg mt-3 max-w-xl leading-relaxed">AI Powered Inventory &amp; Business Analytics</p>
          </div>

          <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {[
              { icon: Package, title: 'Inventory Tracking', desc: 'Real-time stock management' },
              { icon: Clock, title: 'Sales Analytics', desc: 'Comprehensive revenue insights' },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-primary-400/30 transition-all duration-300" style={{ animationDelay: `${200 + i * 80}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500/30 to-primary-600/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white/90">{card.title}</h3>
                      <p className="text-xs text-primary-300/50 mt-0.5">{card.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full lg:w-[45%] min-h-screen flex items-center justify-center p-6 lg:p-12 bg-black/10 lg:bg-black/20 lg:backdrop-blur-sm">
        <div className="w-full max-w-[420px]">
          <div className="relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="relative rounded-2xl transition-all duration-500" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Forgot Password</h2>
                <p className="text-primary-300/60 text-sm mb-8">Enter your username or email to request a password reset.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary-400 transition-colors duration-300 z-10" />
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300"
                        placeholder="Username"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-white/10" />
                    <span className="text-xs text-white/30">or</span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary-400 transition-colors duration-300 z-10" />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className="w-full pl-10 pr-3.5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300"
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
                    <button type="submit" disabled={loading || (!username && !email)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 disabled:from-primary-500/50 disabled:to-primary-600/50 text-white rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2">
                      {loading ? (
                        <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Sending...</span></>
                      ) : (
                        <><Send className="w-4 h-4" /><span>Submit Request</span></>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <button onClick={() => navigate('/login')} className="inline-flex items-center gap-1.5 text-xs text-primary-400/70 hover:text-primary-300 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
