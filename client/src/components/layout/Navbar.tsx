import { Menu, Moon, Sun, Bell, LogOut, User, Search as SearchIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services/dataService'

interface NavbarProps {
  onToggle: () => void
}

export default function Navbar({ onToggle }: NavbarProps) {
  const { user, logout, isAdmin } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount()
        setNotifCount(res.data.count)
      } catch { }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button onClick={onToggle} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div className="relative group">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, suppliers..."
                className="pl-9 pr-4 py-2 w-64 lg:w-80 bg-gray-100 dark:bg-gray-800/50 border border-transparent focus:border-primary-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 group-hover:bg-gray-200 dark:group-hover:bg-gray-700/50"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleDarkMode}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="transition-transform duration-500 ease-in-out rotate-0 dark:-rotate-180">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
          </button>

          <button
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 group"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-5 h-5 group-hover:animate-bounce-gentle" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-scale-in">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-md shadow-primary-500/20">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">{user?.full_name}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-premium-xl border border-gray-200/80 dark:border-gray-700/50 py-1 animate-scale-in origin-top-right">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
                  <p className="text-muted mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-2 badge-info">{isAdmin ? 'Admin' : 'Staff'}</span>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setProfileOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" /> Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
