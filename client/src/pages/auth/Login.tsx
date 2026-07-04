import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, User, Lock, Package, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 15,
  duration: Math.random() * 10 + 12,
}))

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [remember, setRemember] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  })

  const usernameVal = watch('username')
  const passwordVal = watch('password')

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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const x = ((clientX / window.innerWidth) - 0.5) * 30
    const y = ((clientY / window.innerHeight) - 0.5) * 30
    setMousePos({ x, y })
    setCursorPos({ x: clientX, y: clientY })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 })
    setCursorPos({ x: -200, y: -200 })
  }, [])

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const ripple = document.createElement('span')
    ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,0.35);transform:scale(0);animation:ripple-anim 0.6s ease-out;pointer-events:none;`
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-950 flex items-center justify-center p-4"
    >
      {/* Cursor glow */}
      <div
        className="fixed pointer-events-none z-0 transition-opacity duration-500"
        style={{
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          transform: `translate(${cursorPos.x - 250}px, ${cursorPos.y - 250}px)`,
          opacity: cursorPos.x > 0 ? 1 : 0,
        }}
      />

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-gradient-to-br from-primary-400/20 to-blue-500/10 rounded-full blur-[100px]"
          style={{ transform: `translate(${mousePos.x * -0.02}px, ${mousePos.y * -0.02}px)`, animation: 'blob-drift 20s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/20 to-purple-600/10 rounded-full blur-[120px]"
          style={{ transform: `translate(${mousePos.x * 0.03}px, ${mousePos.y * 0.03}px)`, animation: 'blob-drift 25s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-cyan-400/10 to-sky-500/10 rounded-full blur-[80px]"
          style={{ transform: `translate(${mousePos.x * -0.015}px, ${mousePos.y * 0.02}px)`, animation: 'blob-drift 18s ease-in-out infinite 2s' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-[350px] h-[350px] bg-gradient-to-br from-violet-500/10 to-pink-500/10 rounded-full blur-[90px]"
          style={{ transform: `translate(${mousePos.x * 0.025}px, ${mousePos.y * -0.015}px)`, animation: 'blob-drift 22s ease-in-out infinite 5s' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: 0,
              animation: `particle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-[420px] relative z-10">
        {/* Branding */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 backdrop-blur-2xl rounded-2xl mb-5 shadow-2xl border border-white/10 animate-float" style={{ animationDuration: '4s' }}>
            <div className="relative">
              <Package className="w-8 h-8 text-white" />
              <div className="absolute -inset-2 bg-primary-400/20 blur-xl rounded-full" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Smart Inventory
          </h1>
          <p className="text-primary-300/80 mt-1.5 text-sm font-medium tracking-wide">
            Management System
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-soft" />
            <span className="text-xs text-primary-300/70">Garment Industry</span>
          </div>
        </div>

        {/* Glassmorphism Card */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute -inset-[1px] bg-gradient-to-b from-primary-400/30 via-primary-500/10 to-indigo-400/30 rounded-2xl blur-[2px]" />
          <div className="relative bg-white/10 dark:bg-gray-900/40 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/10 dark:border-white/5 overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white mb-7 tracking-tight">Welcome Back</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Username field */}
                <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary-400 transition-colors duration-300 z-10" />
                    <input
                      {...register('username')}
                      id="username"
                      className="w-full pl-10 pr-3.5 py-3 bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-transparent focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300 peer"
                      placeholder="username"
                      autoComplete="username"
                    />
                    <label
                      htmlFor="username"
                      className="absolute left-10 top-3.5 text-sm text-white/40 transition-all duration-300 pointer-events-none
                        peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[11px] peer-focus:text-primary-400
                        peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-white/50"
                    >
                      Username
                    </label>
                    {usernameVal && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-scale-in" />
                    )}
                  </div>
                  {errors.username && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary-400 transition-colors duration-300 z-10" />
                    <input
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-11 py-3 bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-transparent focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300 peer"
                      placeholder="password"
                      autoComplete="current-password"
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-10 top-3.5 text-sm text-white/40 transition-all duration-300 pointer-events-none
                        peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[11px] peer-focus:text-primary-400
                        peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-white/50"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-all duration-200 p-0.5 hover:scale-110 active:scale-95"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 animate-fade-in">
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '250ms' }}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 border border-white/20 rounded-[4px] bg-white/5 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all duration-200 group-hover:border-white/30" />
                      {remember && (
                        <Check className="absolute inset-0 w-4 h-4 text-white p-[3px] animate-scale-in" />
                      )}
                    </div>
                    <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toast('Password reset coming soon', { icon: '🔒' })}
                    className="text-xs text-primary-400/70 hover:text-primary-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login button */}
                <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <button
                    type="submit"
                    disabled={loading || success}
                    onClick={handleRipple}
                    className="relative w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 disabled:from-primary-500/50 disabled:to-primary-600/50 text-white rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 disabled:cursor-not-allowed active:scale-[0.98] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900 overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                      {success ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center animate-scale-in">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span>Signed In!</span>
                        </>
                      ) : loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          <span>Sign In</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              {/* Demo credentials */}
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

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-xs text-white/20 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <span>v2.0.0</span>
          <span>&copy; {new Date().getFullYear()} SIMS — All rights reserved</span>
        </div>
      </div>
    </div>
  )
}
