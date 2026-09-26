import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, User, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import LoginBrandPanel from '../../components/auth/LoginBrandPanel'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

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
      const loggedInUser = await login(data.username, data.password)
      setSuccess(true)
      setTimeout(() => {
        toast.success('Welcome back!')
        if (loggedInUser?.password_reset_required) {
          navigate('/profile?forceChange=1')
        } else {
          navigate('/dashboard')
        }
      }, 700)
    } catch (err: any) {
      console.error('Login error:', err)
      toast.error(err.response?.data?.error || err.message || 'Login failed')
    } finally {
      if (!success) setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 lg:flex-row lg:overflow-x-hidden">
      {/* ============ LEFT PANEL — Brand side ============ */}
      <LoginBrandPanel />

      {/* ============ RIGHT PANEL — Login form ============ */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:flex-1 lg:p-8">
        {/* Subtle ambient motion: slow sheen drift + faint dot-grid drift */}
        <div className="pointer-events-none absolute inset-0 animate-gradient-shift bg-[linear-gradient(120deg,rgba(59,130,246,0.08),rgba(99,102,241,0.05),rgba(59,130,246,0.08))] dark:bg-[linear-gradient(120deg,rgba(59,130,246,0.06),rgba(99,102,241,0.04),rgba(59,130,246,0.06))]" />
        <div className="pointer-events-none absolute inset-0 animate-wave-slower opacity-70 bg-[radial-gradient(rgba(100,116,139,0.12)_1px,transparent_1px)] [background-size:22px_22px] dark:bg-[radial-gradient(rgba(148,163,184,0.07)_1px,transparent_1px)]" />
        {/* Mobile / Tablet Header */}
        <div className="relative z-10 flex flex-col items-center mb-6 lg:hidden animate-fade-in-down">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white tracking-tight">SIMS</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Smart Inventory Management System</p>
        </div>

        <div className="relative w-full max-w-[400px] mx-auto">
          {/* Login card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-premium-xl p-6 animate-fade-in-up">
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
            </div>

            {/* Demo accounts */}
            <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-2.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-0.5">Try a demo account</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickRole('admin')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    selectedRole === 'admin'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRole('staff')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    selectedRole === 'staff'
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Staff
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
              {/* Username */}
              <div>
                <label htmlFor="username" className="form-label !mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    {...register('username')}
                    id="username"
                    className="input-field !pl-10 !py-2.5 h-11"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="form-label !mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field !pl-10 !pr-11 !py-2.5 h-11"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              {/* Remember me / Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500/30 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="btn-primary w-full !h-11 justify-center !text-sm !font-semibold"
              >
                <span className="flex items-center justify-center gap-2">
                  {success ? (
                    <>
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      <span>Signed in</span>
                    </>
                  ) : loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Continue with Google */}
            <GoogleSignInButton />

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account? <span className="font-medium text-gray-700 dark:text-gray-300">Contact your administrator</span>
            </div>
          </div>

          {/* Version / copyright */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>v2.0.0</span>
            <span>&copy; {new Date().getFullYear()} SIMS — All rights reserved</span>
          </div>
        </div>
      </section>
    </div>
  )
}
