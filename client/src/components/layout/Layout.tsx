import { useState, useCallback, useEffect, useRef } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { settingsService } from '../../services/dataService'
import { useIdleTimer } from '../../hooks/useIdleTimer'
import SessionTimeoutModal from '../ui/SessionTimeoutModal'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  const { user, loading, logout } = useAuth()
  const { setDarkMode } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const synced = useRef(false)
  const settingsLoaded = useRef(false)

  const handleToggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev)
  }, [])

  const handleCloseMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  useEffect(() => {
    if (!user || synced.current) return
    synced.current = true
    settingsService.getAll().then((res) => {
      const s = res.data.settings
      if (!s?.appearance) return
      const theme = s.appearance.appearance_theme || 'light'
      const isDark = theme === 'dark'
      const compact = s.appearance.appearance_compact_sidebar === 'true'
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.classList.toggle('compact-sidebar', compact)
      localStorage.setItem('darkMode', JSON.stringify(isDark))
      localStorage.setItem('sidebarCompact', JSON.stringify(compact))
      setDarkMode(isDark)
    }).catch(() => {})
  }, [user, setDarkMode])

  useEffect(() => {
    if (!user || settingsLoaded.current) return
    settingsLoaded.current = true
    settingsService.getAll().then((res) => {
      const raw = res.data.settings?.security?.security_session_timeout
      if (raw) {
        const val = parseInt(raw, 10)
        if (!isNaN(val) && val >= 5) setSessionTimeout(val)
      }
    }).catch(() => {})
  }, [user])

  const handleSessionExpired = useCallback(() => {
    setShowTimeoutWarning(false)
    logout()
  }, [logout])

  const { reset: resetIdle } = useIdleTimer({
    timeoutMinutes: sessionTimeout,
    onWarn: () => setShowTimeoutWarning(true),
    onExpired: handleSessionExpired,
    enabled: !!user,
  })

  const handleStayLoggedIn = useCallback(() => {
    setShowTimeoutWarning(false)
    resetIdle()
  }, [resetIdle])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="animate-spin w-10 h-10 border-[3px] border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse-soft" />
            </div>
          </div>
          <p className="text-sm text-gray-400 animate-pulse-soft">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar mobileOpen={mobileOpen} onClose={handleCloseMobile} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onToggle={handleToggleMobile} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
      <SessionTimeoutModal
        open={showTimeoutWarning}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleSessionExpired}
      />
    </div>
  )
}
