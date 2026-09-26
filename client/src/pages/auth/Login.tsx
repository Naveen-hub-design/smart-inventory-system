import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, User, Lock, Eye, EyeOff, ArrowRight, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import LoginBrandPanel from '../../components/auth/LoginBrandPanel'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

/** Small live UTC clock for the operator desk header. Presentational only. */
function UtcClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
      <Clock className="w-3.5 h-3.5" /> {hh}:{mm} UTC
    </span>
  )
}

export default function Login() {
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [remember, setRemember] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff' | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  })

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Quick Demo Role autofill handler
  const handleQuickRole = (role: 'admin' | 'staff') => {
    setSelectedRole(role)
    if (role === 'admin') {
      setValue('username', 'admin', { shouldValidate: true })
      setValue('password', 'admin123', { shouldValidate: true })
      toast.success('Admin demo credentials filled in')
    } else {
      setValue('username', 'staff1', { shouldValidate: true })
      setValue('password', 'staff123', { shouldValidate: true })
      toast.success('Staff demo credentials filled in')
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const user = await login(data.username, data.password)
      setSuccess(true)
      setTimeout(() => {
        toast.success('Welcome back!')
        if (user?.password_reset_required) {
          navigate('/profile?forceChange=1')
        } else {
          navigate('/dashboard')
        }
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
    <div className="flex min-h-screen flex-col bg-[#f6f4ef] dark:bg-[#16130e] lg:flex-row lg:overflow-x-hidden">
      {/* ============ LEFT PANEL — Warehouse visual (60%) ============ */}
      <LoginBrandPanel />

      {/* ============ RIGHT PANEL — Operator desk (40%) ============ */}
      <section className="relative flex w-full flex-col bg-[#f6f4ef] dark:bg-[#16130e] lg:w-[40%] lg:shrink-0 lg:min-h-screen lg:overflow-y-auto">
        {/* Mobile hero: dark brand banner */}
        <div className="relative h-40 shrink-0 overflow-hidden bg-gradient-to-br from-[#0d1526] via-[#0a0f1e] to-[#111a36] lg:hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04070f]/85 via-transparent to-[#04070f]/30" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 animate-fade-in-up">
            <span className="inline-flex w-fit items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.18em] text-white/85 border border-white/25 bg-white/5">
              INVENTORY OPERATIONS
            </span>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white [font-family:Georgia,'Times_New_Roman',serif]">
              Command every aisle.
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center w-full max-w-[400px] mx-auto px-6 sm:px-8 py-6 lg:py-8 animate-fade-in-up">
          {/* Desk header */}
          <div className="flex items-center justify-between animate-fade-in-down">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#101828] dark:bg-white flex items-center justify-center">
                <Package className="w-[18px] h-[18px] text-white dark:text-[#101828]" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">SIMS</p>
                <p className="text-[10px] font-medium tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  OPERATOR DESK
                </p>
              </div>
            </div>
            <UtcClock />
          </div>

          {/* Heading */}
          <div className="mt-6">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-400 dark:text-slate-500">
              SECURE ACCESS
            </p>
            <h2 className="mt-2 text-[34px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white [font-family:Georgia,'Times_New_Roman',serif]">
              Welcome back.
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Sign in to your inventory workspace.
            </p>
          </div>

          {/* Demo accounts — existing autofill logic */}
          <div className="mt-4 rounded-xl border border-stone-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-0.5">
              Try a demo account
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  selectedRole === 'admin'
                    ? 'bg-[#101828] dark:bg-white text-white dark:text-[#101828] border-[#101828] dark:border-white'
                    : 'bg-transparent text-slate-500 dark:text-slate-400 border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/25 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('staff')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  selectedRole === 'staff'
                    ? 'bg-[#101828] dark:bg-white text-white dark:text-[#101828] border-[#101828] dark:border-white'
                    : 'bg-transparent text-slate-500 dark:text-slate-400 border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/25 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Staff
              </button>
            </div>
          </div>

          {/* Login Form — existing behavior, validation, states */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors duration-200 z-10" />
                <input
                  {...register('username')}
                  id="username"
                  className="w-full pl-10 pr-3.5 h-12 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10 transition-all duration-200 hover:border-stone-300 dark:hover:border-white/20"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in"><span className="w-1 h-1 bg-red-500 rounded-full" />{errors.username.message}</p>}
            </div>

            {/* password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors duration-200 z-10" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-11 h-12 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10 transition-all duration-200 hover:border-stone-300 dark:hover:border-white/20"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in"><span className="w-1 h-1 bg-red-500 rounded-full" />{errors.password.message}</p>}
            </div>

            {/* remember / forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 dark:border-white/20 accent-[#101828] cursor-pointer"
                />
                <span className="text-[13px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={loading || success}
              onClick={handleRipple}
              className="relative w-full h-12 px-4 bg-[#101828] hover:bg-[#1d2939] dark:bg-white dark:hover:bg-slate-200 disabled:opacity-70 text-white dark:text-[#101828] rounded-xl font-semibold text-[15px] tracking-wide transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[#f6f4ef] dark:focus:ring-offset-[#16130e] overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {success ? (
                  <><span className="w-5 h-5 rounded-full bg-white/15 dark:bg-[#101828]/10 flex items-center justify-center animate-scale-in"><Check className="w-3 h-3" /></span><span>Signed in</span></>
                ) : loading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 dark:border-[#101828]/20 border-t-white dark:border-t-[#101828] rounded-full animate-spin" /><span>Signing in…</span></>
                ) : (
                  <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>
                )}
              </span>
            </button>
          </form>

          {/* Continue with Google — existing behavior */}
          <GoogleSignInButton />

          <div className="mt-4 text-center text-[13px] text-slate-400 dark:text-slate-500 animate-fade-in">
            Don&apos;t have an account?{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">Contact your administrator</span>
          </div>

          {/* footer */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400/80 dark:text-slate-600 animate-fade-in">
            <span>v2.0.0</span>
            <span>&copy; {new Date().getFullYear()} SIMS</span>
          </div>
        </div>
      </section>
    </div>
  )
}
