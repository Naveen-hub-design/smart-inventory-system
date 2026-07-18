import { useState, useEffect, useRef } from 'react'
import {
  Settings as SettingsIcon, User, Building2, Package, Brain, Bell,
  FileText, Palette, Shield, Database, Info, Save, RotateCcw, X,
  Upload, Key, Download, Eye, EyeOff, Sun, Moon, Maximize2, Minimize2,
  Check, AlertCircle, Loader2, ChevronRight
} from 'lucide-react'
import { settingsService } from '../../services/dataService'
import { useTheme } from '../../context/ThemeContext'
import ImagePreview from '../../components/ui/ImagePreview'
import toast from 'react-hot-toast'

type TabId = 'profile' | 'company' | 'inventory' | 'ai' | 'notifications' | 'reports' | 'appearance' | 'security' | 'backup' | 'about'

interface SettingsData {
  company: Record<string, string>
  inventory: Record<string, string>
  ai: Record<string, string>
  notifications: Record<string, string>
  reports: Record<string, string>
  appearance: Record<string, string>
  security: Record<string, string>
}

interface AboutInfo {
  project_name: string
  version: string
  backend_status: string
  database_status: string
  ai_status: string
}

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'ai', label: 'AI Settings', icon: Brain },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'backup', label: 'Backup', icon: Database },
  { id: 'about', label: 'About', icon: Info },
]

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'SAR']
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Australia/Sydney', 'Pacific/Auckland']
const AI_STYLES = ['professional', 'conversational', 'concise', 'detailed']
const REPORT_FORMATS = ['excel', 'pdf', 'csv']
const DATE_RANGES = ['7', '30', '60', '90', '180', '365']
const TIMEOUT_OPTIONS = ['5', '10', '15', '30', '60', '120']

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 animate-fade-in-up">
      {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>}
      {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{desc}</p>}
      {children}
    </div>
  )
}

function FormField({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 last:mb-0">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, id }: { value: string; onChange: (v: string) => void; options: string[]; id?: string }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function SecurityInfo() {
  const [sessions, setSessions] = useState<number | null>(null)
  const [history, setHistory] = useState<Array<{ timestamp: string; ip_address: string; status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      settingsService.getSessions(),
      settingsService.getLoginHistory(),
    ]).then(([sRes, hRes]) => {
      setSessions(sRes.data.active_sessions)
      setHistory(hRes.data.history || [])
    }).catch(() => {
      setError(true)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <SectionCard title="Session Information">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      </SectionCard>
    )
  }

  if (error) {
    return (
      <SectionCard title="Session Information">
        <p className="text-sm text-red-500 py-4">Failed to load session information.</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Session Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">Active Sessions (24h)</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{sessions ?? '—'}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Recent Login Activity</p>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No login history found.</p>
        ) : (
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-1.5 pr-3 text-left font-semibold text-gray-500 dark:text-gray-400">Time</th>
                  <th className="py-1.5 pr-3 text-left font-semibold text-gray-500 dark:text-gray-400">IP Address</th>
                  <th className="py-1.5 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {row.timestamp ? new Date(row.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">{row.ip_address}</td>
                    <td className="py-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        row.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState<SettingsData>({
    company: {}, inventory: {}, ai: {}, notifications: {},
    reports: {}, appearance: {}, security: {},
  })
  const [originalSettings, setOriginalSettings] = useState<string>('')

  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', avatar: '' })
  const [originalProfile, setOriginalProfile] = useState('')

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm: '' })

  const [about, setAbout] = useState<AboutInfo | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const { setDarkMode } = useTheme()

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [settingsRes, aboutRes, profileRes] = await Promise.all([
        settingsService.getAll(),
        settingsService.getAbout().catch(() => null),
        settingsService.getProfile().catch(() => null),
      ])
      const s = settingsRes.data.settings
      setSettings(s)
      setOriginalSettings(JSON.stringify(s))
      if (aboutRes) setAbout(aboutRes.data)
      if (profileRes?.data?.user) {
        const u = profileRes.data.user
        setProfile({ full_name: u.full_name || '', email: u.email || '', phone: u.phone || '', avatar: u.avatar || '' })
        setOriginalProfile(JSON.stringify({ full_name: u.full_name || '', email: u.email || '', phone: u.phone || '' }))
      }
      // Apply appearance settings
      const theme = s.appearance?.appearance_theme || 'light'
      const isDark = theme === 'dark'
      const compact = s.appearance?.appearance_compact_sidebar === 'true'
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.classList.toggle('compact-sidebar', compact)
      localStorage.setItem('darkMode', JSON.stringify(isDark))
      localStorage.setItem('sidebarCompact', JSON.stringify(compact))
      setDarkMode(isDark)
    } catch (err: any) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const isDirty = () => {
    const current = JSON.stringify(settings)
    const profileCurrent = JSON.stringify(profile)
    return current !== originalSettings || (profile.full_name && profileCurrent !== originalProfile)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, string> = {}
      for (const cat of ['company', 'inventory', 'ai', 'notifications', 'reports', 'appearance', 'security'] as const) {
        for (const [key, value] of Object.entries(settings[cat])) {
          payload[key] = value
        }
      }
      const res = await settingsService.update(payload)
      setSettings(res.data.settings)
      setOriginalSettings(JSON.stringify(res.data.settings))
      // Apply saved appearance
      const theme = res.data.settings.appearance?.appearance_theme || 'light'
      const isDark = theme === 'dark'
      const compact = res.data.settings.appearance?.appearance_compact_sidebar === 'true'
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.classList.toggle('compact-sidebar', compact)
      localStorage.setItem('darkMode', JSON.stringify(isDark))
      localStorage.setItem('sidebarCompact', JSON.stringify(compact))
      setDarkMode(isDark)
      toast.success('Settings saved')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset all settings to default values?')) return
    setSaving(true)
    try {
      const res = await settingsService.reset()
      setSettings(res.data.settings)
      setOriginalSettings(JSON.stringify(res.data.settings))
      const theme = res.data.settings.appearance?.appearance_theme || 'light'
      const isDark = theme === 'dark'
      const compact = res.data.settings.appearance?.appearance_compact_sidebar === 'true'
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.classList.toggle('compact-sidebar', compact)
      localStorage.setItem('darkMode', JSON.stringify(isDark))
      localStorage.setItem('sidebarCompact', JSON.stringify(compact))
      setDarkMode(isDark)
      toast.success('Settings reset to defaults')
    } catch {
      toast.error('Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (cat: keyof SettingsData, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [key]: value },
    }))
  }

  const updateProfileField = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await settingsService.updateProfile({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
      })
      setOriginalProfile(JSON.stringify(profile))
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error('Fill all password fields')
      return
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await settingsService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm: '' })
      toast.success('Password changed')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      const res = await settingsService.uploadAvatar(file)
      setProfile((prev) => ({ ...prev, avatar: res.data.avatar }))
      toast.success('Avatar updated')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarRemove = async () => {
    if (!confirm('Remove your profile picture?')) return
    setSaving(true)
    try {
      await settingsService.removeAvatar()
      setProfile((prev) => ({ ...prev, avatar: '' }))
      toast.success('Avatar removed')
    } catch {
      toast.error('Failed to remove avatar')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      const res = await settingsService.uploadLogo(file)
      updateSetting('company', 'company_logo', res.data.logo)
      toast.success('Logo uploaded')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoRemove = async () => {
    if (!confirm('Remove company logo?')) return
    setSaving(true)
    try {
      await settingsService.removeLogo()
      updateSetting('company', 'company_logo', '')
      toast.success('Logo removed')
    } catch {
      toast.error('Failed to remove logo')
    } finally {
      setSaving(false)
    }
  }

  const handleExportBackup = async () => {
    try {
      const res = await settingsService.exportBackup()
      const blob = new Blob([res.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sims-backup-${Date.now()}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Backup exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      await settingsService.importBackup(file)
      toast.success('Settings imported')
      await loadAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Import failed')
    } finally {
      setSaving(false)
    }
  }

  const activeIcon = TABS.find((t) => t.id === activeTab)?.icon || SettingsIcon
  const ActiveIcon = activeIcon

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <>
    <div className="space-y-5 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">System configuration and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-thin">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-4 lg:hidden">
            <ActiveIcon className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{TABS.find((t) => t.id === activeTab)?.label}</h2>
          </div>

          {/* ===== PROFILE ===== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <SectionCard title="Profile Information" desc="Update your personal details and avatar">
                  <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow-md cursor-pointer" onClick={() => setPreviewImage(profile.avatar)} />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
                        </div>
                      )}
                      <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center cursor-pointer shadow-sm border-2 border-white dark:border-gray-800 transition-colors">
                        <Upload className="w-3 h-3 text-white" />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                      {profile.avatar && (
                        <button onClick={handleAvatarRemove} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800 transition-colors" title="Remove avatar">
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      )}
                    </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="font-medium text-gray-900 dark:text-white">{profile.full_name || 'Your Name'}</p>
                    <p>Click the upload button to change your avatar</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Full Name">
                    <input id="full_name" type="text" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={profile.full_name} onChange={(e) => updateProfileField('full_name', e.target.value)} placeholder="John Doe" />
                  </FormField>
                  <FormField label="Email">
                    <input id="email" type="email" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={profile.email} onChange={(e) => updateProfileField('email', e.target.value)} placeholder="john@example.com" />
                  </FormField>
                  <FormField label="Phone">
                    <input id="phone" type="tel" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={profile.phone} onChange={(e) => updateProfileField('phone', e.target.value)} placeholder="+91 9876543210" />
                  </FormField>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => loadAll()} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">Cancel</button>
                  <button onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Profile
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Change Password" desc="Update your account password">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Current Password">
                    <div className="relative">
                      <input id="current_password" type={showPassword ? 'text' : 'password'} className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 pr-9" value={passwordForm.current_password} onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </FormField>
                  <FormField label="New Password">
                    <input id="new_password" type="password" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={passwordForm.new_password} onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))} />
                  </FormField>
                  <FormField label="Confirm Password">
                    <input id="confirm_password" type="password" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} />
                  </FormField>
                </div>
                <div className="flex justify-end mt-3">
                  <button onClick={changePassword} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    Change Password
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ===== COMPANY ===== */}
          {activeTab === 'company' && (
            <SectionCard title="Company Information" desc="Configure your business details">
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white shadow-md overflow-hidden">
                  {settings.company.company_logo ? (
                    <img src={settings.company.company_logo} alt="Logo" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreviewImage(settings.company.company_logo)} />
                  ) : (
                    <Building2 className="w-7 h-7" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-all duration-200 active:scale-[0.97] cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {settings.company.company_logo && (
                    <button onClick={handleLogoRemove} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg transition-all duration-200 active:scale-[0.97]">
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-400 ml-1">PNG, JPG or SVG. 1MB max.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Company Name">
                  <input type="text" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={settings.company.company_name || ''} onChange={(e) => updateSetting('company', 'company_name', e.target.value)} placeholder="My Company" />
                </FormField>
                <FormField label="GST / Tax Number">
                  <input type="text" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={settings.company.company_gst || ''} onChange={(e) => updateSetting('company', 'company_gst', e.target.value)} placeholder="GSTIN" />
                </FormField>
                <FormField label="Email">
                  <input type="email" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={settings.company.company_email || ''} onChange={(e) => updateSetting('company', 'company_email', e.target.value)} placeholder="company@example.com" />
                </FormField>
                <FormField label="Phone">
                  <input type="tel" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={settings.company.company_phone || ''} onChange={(e) => updateSetting('company', 'company_phone', e.target.value)} placeholder="+91 9876543210" />
                </FormField>
                <FormField label="Website">
                  <input type="url" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={settings.company.company_website || ''} onChange={(e) => updateSetting('company', 'company_website', e.target.value)} placeholder="https://example.com" />
                </FormField>
                <FormField label="Address">
                  <textarea className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 resize-none" rows={2} value={settings.company.company_address || ''} onChange={(e) => updateSetting('company', 'company_address', e.target.value)} placeholder="123 Business St, City" />
                </FormField>
                <FormField label="Currency">
                  <Select value={settings.company.company_currency || 'INR'} onChange={(v) => updateSetting('company', 'company_currency', v)} options={CURRENCIES} />
                </FormField>
                <FormField label="Time Zone">
                  <Select value={settings.company.company_timezone || 'Asia/Kolkata'} onChange={(v) => updateSetting('company', 'company_timezone', v)} options={TIMEZONES} />
                </FormField>
              </div>
            </SectionCard>
          )}

          {/* ===== INVENTORY ===== */}
          {activeTab === 'inventory' && (
            <SectionCard title="Inventory Defaults" desc="Configure inventory management preferences">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Default Low Stock Threshold">
                  <input type="number" min="0" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={settings.inventory.inventory_low_stock_threshold || '10'} onChange={(e) => updateSetting('inventory', 'inventory_low_stock_threshold', e.target.value)} />
                </FormField>
                <FormField label="Default Product Category">
                  <input type="text" className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" value={settings.inventory.inventory_default_category || ''} onChange={(e) => updateSetting('inventory', 'inventory_default_category', e.target.value)} placeholder="General" />
                </FormField>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">Auto SKU Generation</p><p className="text-xs text-gray-500">Generate SKU automatically for new products</p></div>
                  <Toggle checked={settings.inventory.inventory_auto_sku === 'true'} onChange={(v) => updateSetting('inventory', 'inventory_auto_sku', v ? 'true' : 'false')} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">Auto Barcode Generation</p><p className="text-xs text-gray-500">Generate barcodes for new products</p></div>
                  <Toggle checked={settings.inventory.inventory_auto_barcode === 'true'} onChange={(v) => updateSetting('inventory', 'inventory_auto_barcode', v ? 'true' : 'false')} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">Auto QR Code Generation</p><p className="text-xs text-gray-500">Generate QR codes for new products</p></div>
                  <Toggle checked={settings.inventory.inventory_auto_qr === 'true'} onChange={(v) => updateSetting('inventory', 'inventory_auto_qr', v ? 'true' : 'false')} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ===== AI SETTINGS ===== */}
          {activeTab === 'ai' && (
            <SectionCard title="AI Configuration" desc="Manage AI-powered features">
              <div className="space-y-3">
                {[
                  { key: 'ai_enabled', label: 'Enable AI Assistant', desc: 'Turn on AI-powered copilot and assistance' },
                  { key: 'ai_reorder', label: 'Enable AI Reorder', desc: 'AI-driven reorder recommendations' },
                  { key: 'ai_forecasting', label: 'Enable AI Forecasting', desc: 'Predict future demand using AI models' },
                  { key: 'ai_health', label: 'Enable AI Inventory Health', desc: 'AI-powered inventory health scoring' },
                  { key: 'ai_supplier_intel', label: 'Enable AI Supplier Intelligence', desc: 'Analyze supplier performance with AI' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                    <Toggle checked={settings.ai[item.key] === 'true'} onChange={(v) => updateSetting('ai', item.key, v ? 'true' : 'false')} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <FormField label="AI Response Style">
                  <Select value={settings.ai.ai_response_style || 'professional'} onChange={(v) => updateSetting('ai', 'ai_response_style', v)} options={AI_STYLES} />
                </FormField>
                <FormField label="AI Confidence Level (%)">
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="100" step="5" className="flex-1 accent-primary-500" value={settings.ai.ai_confidence_level || '80'} onChange={(e) => updateSetting('ai', 'ai_confidence_level', e.target.value)} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{settings.ai.ai_confidence_level || 80}</span>
                  </div>
                </FormField>
              </div>
            </SectionCard>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === 'notifications' && (
            <SectionCard title="Notification Preferences" desc="Configure which alerts you receive">
              <div className="space-y-3">
                {[
                  { key: 'notify_low_stock', label: 'Low Stock Alerts', desc: 'Get notified when stock falls below minimum' },
                  { key: 'notify_sales', label: 'Sales Alerts', desc: 'Receive notifications for new sales' },
                  { key: 'notify_purchases', label: 'Purchase Alerts', desc: 'Get notified about purchase orders' },
                  { key: 'notify_suppliers', label: 'Supplier Alerts', desc: 'Alerts for supplier-related events' },
                  { key: 'notify_email', label: 'Email Notifications', desc: 'Send notifications via email' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                    <Toggle checked={settings.notifications[item.key] === 'true'} onChange={(v) => updateSetting('notifications', item.key, v ? 'true' : 'false')} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ===== REPORTS ===== */}
          {activeTab === 'reports' && (
            <SectionCard title="Report Defaults" desc="Configure report generation preferences">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Default Export Format">
                  <Select value={settings.reports.report_default_format || 'excel'} onChange={(v) => updateSetting('reports', 'report_default_format', v)} options={REPORT_FORMATS} />
                </FormField>
                <FormField label="Default Date Range (days)">
                  <Select value={settings.reports.report_default_date_range || '30'} onChange={(v) => updateSetting('reports', 'report_default_date_range', v)} options={DATE_RANGES} />
                </FormField>
              </div>
              <div className="flex items-center justify-between py-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                <div><p className="text-sm font-medium text-gray-900 dark:text-white">Company Logo on Reports</p><p className="text-xs text-gray-500">Include company logo in exported reports</p></div>
                <Toggle checked={settings.reports.report_company_logo === 'true'} onChange={(v) => updateSetting('reports', 'report_company_logo', v ? 'true' : 'false')} />
              </div>
            </SectionCard>
          )}

          {/* ===== APPEARANCE ===== */}
          {activeTab === 'appearance' && (
            <SectionCard title="Appearance" desc="Customize the interface look and feel">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Theme</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { updateSetting('appearance', 'appearance_theme', 'light'); document.documentElement.classList.remove('dark'); localStorage.setItem('darkMode', 'false'); setDarkMode(false) }}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        settings.appearance.appearance_theme === 'light'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Sun className={`w-6 h-6 ${settings.appearance.appearance_theme === 'light' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${settings.appearance.appearance_theme === 'light' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500'}`}>Light Mode</span>
                    </button>
                    <button
                      onClick={() => { updateSetting('appearance', 'appearance_theme', 'dark'); document.documentElement.classList.add('dark'); localStorage.setItem('darkMode', 'true'); setDarkMode(true) }}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        settings.appearance.appearance_theme === 'dark'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Moon className={`w-6 h-6 ${settings.appearance.appearance_theme === 'dark' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${settings.appearance.appearance_theme === 'dark' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500'}`}>Dark Mode</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">Compact Sidebar</p><p className="text-xs text-gray-500">Use a narrower sidebar layout</p></div>
                  <Toggle checked={settings.appearance.appearance_compact_sidebar === 'true'} onChange={(v) => { updateSetting('appearance', 'appearance_compact_sidebar', v ? 'true' : 'false'); document.documentElement.classList.toggle('compact-sidebar', v); localStorage.setItem('sidebarCompact', JSON.stringify(v)) }} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <SectionCard title="Security" desc="Manage security preferences">
                <FormField label="Session Timeout (minutes)">
                  <Select value={settings.security.security_session_timeout || '30'} onChange={(v) => updateSetting('security', 'security_session_timeout', v)} options={TIMEOUT_OPTIONS} />
                </FormField>
                <p className="text-xs text-gray-500 mt-2">After the session timeout period, you will be automatically logged out for security.</p>
              </SectionCard>
              <SecurityInfo />
            </div>
          )}

          {/* ===== BACKUP ===== */}
          {activeTab === 'backup' && (
            <SectionCard title="Backup & Restore" desc="Export or import system settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Database className="w-8 h-8 text-primary-500 mb-2" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Export Settings</h4>
                  <p className="text-xs text-gray-500 mb-3">Download all system settings as a JSON backup file.</p>
                  <button onClick={handleExportBackup} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200 w-fit">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Upload className="w-8 h-8 text-emerald-500 mb-2" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Import Settings</h4>
                  <p className="text-xs text-gray-500 mb-3">Restore settings from a previously exported backup file.</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.97] transition-all duration-200 cursor-pointer w-fit">
                    <Upload className="w-3.5 h-3.5" /> Import
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ===== ABOUT ===== */}
          {activeTab === 'about' && (
            <SectionCard title="About" desc="System information">
              {about ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Project Name</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{about.project_name}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Version</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{about.version}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${about.backend_status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Backend Status</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{about.backend_status}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${about.database_status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Database Status</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{about.database_status}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${about.ai_status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">AI Status</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{about.ai_status}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}
            </SectionCard>
          )}

          {/* ===== SAVE / CANCEL / RESET (non-profile, non-backup, non-about tabs) ===== */}
          {activeTab !== 'profile' && activeTab !== 'backup' && activeTab !== 'about' && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleReset} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">
                <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
              </button>
              <div className="flex gap-2">
                <button onClick={() => loadAll()} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !isDirty()} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {previewImage && (
      <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />
    )}
  </>
)
}
