import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, User, Lock, Package, Check, Clock, BarChart3, Shield, TrendingUp, Box, Layers, Cpu, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import LoginScene from '../../components/three/LoginScene'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const featureCards = [
  { icon: Box, title: 'Inventory Tracking', desc: 'Real-time stock management with low stock alerts' },
  { icon: TrendingUp, title: 'Sales Analytics', desc: 'Comprehensive sales data and revenue insights' },
  { icon: BarChart3, title: 'Smart Reports', desc: 'Generate detailed reports with one click' },
  { icon: Shield, title: 'Secure Authentication', desc: 'Role-based access with JWT security' },
]

const stats = [
  { label: 'Products', value: 208, suffix: '', icon: Box },
  { label: 'Materials', value: 104, suffix: '', icon: Layers },
  { label: 'Accuracy', value: 98, suffix: '%', icon: BarChart3 },
  { label: 'AI Powered', value: 247, suffix: '', icon: Cpu, format: (v: number) => '24/7' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [remember, setRemember] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isHovered, setIsHovered] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const usernameVal = watch('username')
  const passwordVal = watch('password')

  const greeting = useMemo(() => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [currentTime])

  const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.username, data.password)
      setSuccess(true)
      setTimeout(() => {
        toast.success('Welcome back!')
        navigate('/dashboard')
      }, 600)
    } catch (err: any) {
      console.error('Login error:', err)
      toast.error(err.response?.data?.error || err.message || 'Login failed')
    } finally {
      if (!success) setLoading(false)
    }
  }

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const ripple = document.createElement('span')
    ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,0.35);transform:scale(0);animation:ripple-anim 0.6s ease-out;pointer-events:none;`
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-950 flex flex-col lg:flex-row">
      <LoginScene />

      <div className="relative z-20 w-full lg:w-[55%] min-h-[50vh] lg:min-h-screen flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl space-y-8 lg:space-y-10">
          <div className="animate-fade-in-down">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10">
                <Clock className="w-5 h-5 text-primary-300" />
              </div>
              <div>
                <p className="text-primary-200/90 text-lg font-medium">{greeting}</p>
                <p className="text-primary-300/60 text-xs">{dayName}, {dateStr}</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight mt-4">{timeStr}</p>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">Smart Inventory Management System</h1>
            <p className="text-primary-300/70 text-base lg:text-lg mt-3 max-w-xl leading-relaxed">AI Powered Inventory &amp; Business Analytics</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {featureCards.map((card, i) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-primary-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 animate-fade-in" style={{ animationDelay: `${200 + i * 80}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500/30 to-primary-600/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-4.5 h-4.5 text-primary-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{card.title}</h3>
                      <p className="text-xs text-primary-300/50 group-hover:text-primary-300/70 mt-0.5 leading-relaxed transition-colors">{card.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:border-primary-400/20 transition-all duration-300 group animate-fade-in" style={{ animationDelay: `${400 + i * 80}ms` }}>
                  <Icon className="w-4 h-4 text-primary-400/60 mx-auto mb-1.5 group-hover:text-primary-300 group-hover:scale-110 transition-all duration-300" />
                  <p className="text-xl lg:text-2xl font-bold text-white">
                    {stat.format ? stat.format(stat.value) : <><AnimatedCounter value={stat.value} />{stat.suffix}</>}
                  </p>
                  <p className="text-[10px] lg:text-xs text-primary-300/50 mt-0.5 truncate">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full lg:w-[45%] min-h-screen flex items-center justify-center p-6 lg:p-12 bg-black/10 lg:bg-black/20 lg:backdrop-blur-sm">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6 animate-fade-in-down lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/5 backdrop-blur-2xl rounded-2xl mb-4 shadow-2xl border border-white/10">
              <div className="relative">
                <Package className="w-7 h-7 text-white" />
                <div className="absolute -inset-2 bg-primary-400/20 blur-xl rounded-full" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Smart Inventory</h1>
            <p className="text-primary-300/70 text-xs mt-0.5 font-medium tracking-wide">Management System</p>
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: '100ms' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden" style={{ opacity: isHovered ? 1 : 0.6, transition: 'opacity 0.3s' }}>
              <div className="absolute inset-0 bg-[conic-gradient(from_var(--angle,0deg),rgba(96,165,250,0.4),rgba(99,102,241,0.2),rgba(96,165,250,0.4))]" style={{ animation: 'border-rotate 4s linear infinite', filter: 'blur(3px)' }} />
            </div>

            <div className="relative rounded-2xl transition-all duration-500" style={{
              background: isHovered ? 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))' : 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: isHovered ? '0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(96,165,250,0.15), 0 0 40px rgba(96,165,250,0.06)' : '0 8px 32px rgba(0,0,0,0.15)',
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}>
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white mb-8 tracking-tight">Welcome Back</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary-400 transition-colors duration-300 z-10" />
                      <input {...register('username')} id="username" className="w-full pl-10 pr-3.5 py-3 bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-transparent focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300 peer" placeholder="username" autoComplete="username" />
                      <label htmlFor="username" className="absolute left-10 top-3.5 text-sm text-white/40 transition-all duration-300 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[11px] peer-focus:text-primary-400 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-white/50">Username</label>
                      {usernameVal && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-scale-in" />}
                    </div>
                    {errors.username && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in"><span className="w-1 h-1 bg-red-400 rounded-full" />{errors.username.message}</p>}
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary-400 transition-colors duration-300 z-10" />
                      <input {...register('password')} id="password" type={showPassword ? 'text' : 'password'} className="w-full pl-10 pr-11 py-3 bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-transparent focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300 peer" placeholder="password" autoComplete="current-password" />
                      <label htmlFor="password" className="absolute left-10 top-3.5 text-sm text-white/40 transition-all duration-300 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[11px] peer-focus:text-primary-400 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-white/50">Password</label>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-all duration-200 p-0.5 hover:scale-110 active:scale-95" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in"><span className="w-1 h-1 bg-red-400 rounded-full" />{errors.password.message}</p>}
                  </div>

                  <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '250ms' }}>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
                        <div className="w-4 h-4 border border-white/20 rounded-[4px] bg-white/5 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all duration-200 group-hover:border-white/30" />
                        {remember && <Check className="absolute inset-0 w-4 h-4 text-white p-[3px] animate-scale-in" />}
                      </div>
                      <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">Remember me</span>
                    </label>
                    <button type="button" onClick={() => toast('Password reset coming soon', { icon: '🔒' })} className="text-xs text-primary-400/70 hover:text-primary-300 transition-colors">Forgot Password?</button>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <button type="submit" disabled={loading || success} onClick={handleRipple}
                      className="relative w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 disabled:from-primary-500/50 disabled:to-primary-600/50 text-white rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 disabled:cursor-not-allowed active:scale-[0.98] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900 overflow-hidden group">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10 flex items-center justify-center gap-2.5">
                        {success ? (
                          <><div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center animate-scale-in"><Check className="w-3 h-3 text-white" /></div><span>Signed In!</span></>
                        ) : loading ? (
                          <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Signing in...</span></>
                        ) : (
                          <><LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /><span>Sign In</span></>
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                <div className="mt-6 p-3.5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/5 animate-fade-in" style={{ animationDelay: '350ms' }}>
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="font-medium text-white/70">Demo Credentials</span><br />
                    <span className="opacity-60">Admin: admin / admin123</span><br />
                    <span className="opacity-60">Staff: staff1 / admin123</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-white/20 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <span>v2.0.0</span>
            <span>&copy; {new Date().getFullYear()} SIMS — All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  )
}
