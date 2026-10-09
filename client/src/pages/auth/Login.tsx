import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Eye, EyeOff, ArrowRight, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import LoginBrandPanel, { SimsLogoIcon } from '../../components/auth/LoginBrandPanel'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

/** Live UTC clock for the operator desk header */
function UtcClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  return (
    <span className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium tabular-nums">
      <Clock className="w-3.5 h-3.5 text-[#6B7280]" /> {hh}:{mm} UTC
    </span>
  )
}

export default function Login() {
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff' | null>('admin')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
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
      toast.success('Admin demo credentials populated')
    } else {
      setValue('username', 'staff1', { shouldValidate: true })
      setValue('password', 'staff123', { shouldValidate: true })
      toast.success('Staff demo credentials populated')
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const loggedUser = await login(data.username, data.password)
      setSuccess(true)
      toast.success('Welcome back!')
      if (loggedUser?.password_reset_required) {
        navigate('/profile?forceChange=1')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      toast.error(err.response?.data?.error || err.message || 'Invalid credentials')
    } finally {
      if (!success) setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F4F3EE] font-sans antialiased text-[#111827] selection:bg-[#111827] selection:text-white">
      {/* ============ LEFT PANEL (Moody Warehouse Visual) ============ */}
      <LoginBrandPanel />

      {/* ============ RIGHT PANEL (Clean Warm Minimalist Desk) ============ */}
      <section className="relative flex flex-1 flex-col justify-between bg-[#F4F3EE] min-h-screen px-6 sm:px-10 lg:px-12 xl:px-16 py-8 lg:py-10 overflow-y-auto">
        {/* Mobile Header Banner (small screens only) */}
        <div className="lg:hidden mb-6 flex items-center justify-between border-b border-[#E2E1DA] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center">
              <SimsLogoIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111827] tracking-wider">SIMS</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-[#6B7280]">OPERATOR DESK</p>
            </div>
          </div>
          <UtcClock />
        </div>

        {/* Top Header Bar (desktop) */}
        <div className="hidden lg:flex items-center justify-between w-full max-w-[420px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#111827] flex items-center justify-center shadow-sm">
              <SimsLogoIcon className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-[#111827] tracking-wider">SIMS</p>
              <p className="text-[9.5px] font-semibold tracking-[0.22em] text-[#6B7280]">
                OPERATOR DESK
              </p>
            </div>
          </div>
          <UtcClock />
        </div>

        {/* Center Main Form Card */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-6">
          {/* Section Headers */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#6B7280] uppercase">
              SECURE ACCESS
            </p>
            <h2 className="mt-1 text-[38px] font-bold leading-tight tracking-tight text-[#111827] font-serif">
              Welcome back.
            </h2>
            <p className="mt-1 text-[13.5px] text-[#6B7280]">
              Sign in to your inventory workspace.
            </p>
          </div>

          {/* Demo Account Pills Box */}
          <div className="mt-6 rounded-2xl border border-[#E2E1DA] bg-transparent p-4">
            <p className="text-[12px] font-medium text-[#4B5563] mb-3">
              Try a demo account
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className={`px-6 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  selectedRole === 'admin'
                    ? 'bg-[#111827] text-white shadow-sm border border-[#111827]'
                    : 'bg-transparent text-[#4B5563] border border-[#D5D4CC] hover:bg-[#EAE9E2]'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('staff')}
                className={`px-6 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  selectedRole === 'staff'
                    ? 'bg-[#111827] text-white shadow-sm border border-[#111827]'
                    : 'bg-transparent text-[#4B5563] border border-[#D5D4CC] hover:bg-[#EAE9E2]'
                }`}
              >
                Staff
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  {...register('username')}
                  id="username"
                  className="w-full pl-10 pr-3.5 h-[46px] bg-transparent border border-[#D5D4CC] rounded-xl text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-11 h-[46px] bg-transparent border border-[#D5D4CC] rounded-xl text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-[48px] bg-[#111827] hover:bg-[#1e293b] active:scale-[0.99] text-white rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 shadow-sm transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed mt-5"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Signed in</span>
                </>
              ) : loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Continue with Google */}
          <GoogleSignInButton />

          {/* Contact Admin */}
          <div className="mt-5 text-center text-[12.5px] text-[#6B7280]">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => toast('Please reach out to your system administrator to create an account.')}
              className="text-[#2563EB] hover:underline font-medium focus:outline-none"
            >
              Contact your administrator
            </button>
          </div>
        </div>

        {/* Bottom Version / Copyright Bar */}
        <div className="w-full max-w-[420px] mx-auto flex items-center justify-between text-[11px] text-[#9CA3AF] pt-4">
          <span className="font-mono">v2.1.0</span>
          <span>&copy; {new Date().getFullYear()} SIMS</span>
        </div>
      </section>
    </div>
  )
}
