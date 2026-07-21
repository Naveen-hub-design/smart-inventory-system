import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'

interface SessionTimeoutModalProps {
  open: boolean
  onStayLoggedIn: () => void
  onLogout: () => void
}

export default function SessionTimeoutModal({ open, onStayLoggedIn, onLogout }: SessionTimeoutModalProps) {
  const [countdown, setCountdown] = useState(60)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setCountdown(60)
      return
    }
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [open, onLogout])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-premium-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm mx-4 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Session Expiring Soon</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your session will expire due to inactivity. Choose to stay logged in or you will be logged out automatically.
          </p>
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400 font-semibold">
            <Clock className="w-4 h-4" />
            <span>{countdown}s remaining</span>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
            >
              Logout Now
            </button>
            <button
              onClick={onStayLoggedIn}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 rounded-xl shadow-lg shadow-primary-500/25 transition-all active:scale-[0.97]"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
