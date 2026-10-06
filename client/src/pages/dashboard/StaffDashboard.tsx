import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, Package, AlertTriangle, PlusCircle, ShoppingCart,
  FileText, DollarSign, Activity as ActivityIcon,
  Users, UserCheck, ShieldCheck, UserCog, Calendar, RefreshCw, ArrowRight
} from 'lucide-react'
import { dashboardService } from '../../services/dataService'
import { authService } from '../../services/authService'
import { DashboardStats, Activity, User } from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import { useNavigate } from 'react-router-dom'

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, actRes, empRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivities(),
        authService.getUsers({ per_page: 100 }).catch(() => ({ users: [] })),
      ])
      setStats(statsRes.data)
      setActivities(actRes.data.activities || [])
      setEmployees(empRes.users || [])
    } catch (err) {
      console.error('Staff dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const employeeStats = useMemo(() => {
    const total = employees.length
    const active = employees.filter(u => u.is_active).length
    const admins = employees.filter(u => u.role === 'admin').length
    const staff = total - admins
    return { total, active, admins, staff }
  }, [employees])

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={3} />
        <ChartSkeleton />
      </div>
    )
  }

  const quickActions = [
    { label: 'New Sale', icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400', onClick: () => navigate('/sales') },
    { label: 'New Purchase', icon: PlusCircle, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400', onClick: () => navigate('/purchases') },
    { label: 'View Products', icon: Package, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400', onClick: () => navigate('/products') },
    { label: 'Inventory', icon: FileText, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400', onClick: () => navigate('/inventory') },
  ]

  const lowStock = (stats?.low_stock_variants || 0) + (stats?.low_stock_count || 0)

  const avatarGradients = [
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-600',
    'from-blue-400 to-indigo-600',
    'from-purple-400 to-pink-600'
  ]

  return (
    <div className="space-y-6 pb-8 text-gray-800 dark:text-gray-100 font-sans">

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Staff Operations</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1f30] border border-gray-200/80 dark:border-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>01.08.2026 - 31.10.2026</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-white dark:bg-[#1e1f30] border border-gray-200/80 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-medium text-emerald-700 dark:text-emerald-400 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational View</span>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div
          onClick={() => navigate('/sales')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Today's Sales</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                <AnimatedCounter value={stats?.today_sales || 0} prefix="₹" />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span>↑ Active</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">for today</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/products')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Available Products</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                <AnimatedCounter value={stats?.available_products || 0} />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span>Ready for dispatch</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/inventory', { state: { tab: 'alerts' } })}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Low Stock Alerts</p>
              <h2 className={`text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight ${lowStock > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                <AnimatedCounter value={lowStock} />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-amber-500 shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <span>Requires attention</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/sales')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Sales</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                <AnimatedCounter value={stats?.total_sales || 0} prefix="₹" />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span>Total Cumulative</span>
          </div>
        </div>

      </div>

      {/* EMPLOYEE SUMMARY ROW */}
      <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            Employee Oversight
          </h3>
          <button onClick={() => navigate('/users')} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1">
            <span>Manage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Total Staff</p>
              <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{employeeStats.total}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Active</p>
              <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{employeeStats.active}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Admins</p>
              <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{employeeStats.admins}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100/80 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Staff Role</p>
              <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{employeeStats.staff}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT COLUMN: ACTIVITIES LIST (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Recent System Activity
              </h3>
              <button
                onClick={fetchData}
                title="Refresh Activity"
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-400">No recent activity recorded</p>
              ) : (
                activities.map((a, i) => {
                  const grad = avatarGradients[i % avatarGradients.length]
                  return (
                    <div
                      key={`${a.type}-${a.id}-${i}`}
                      onClick={() => navigate(a.type === 'sale' ? '/sales' : a.type === 'purchase' ? '/purchases' : '/audit-logs')}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${grad} flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0`}>
                        {a.type.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{a.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {a.user ? `${a.user} · ` : ''}
                          {a.timestamp ? new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize border border-gray-200/50 dark:border-gray-700/50">
                        {a.type}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS & ALERTS (5 cols) */}
        <div className="lg:col-span-5 space-y-5">

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Quick Operations</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((act) => (
                <button
                  key={act.label}
                  onClick={act.onClick}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/60 hover:bg-gray-100/80 dark:hover:bg-gray-800/70 transition-all group"
                >
                  <div className={`p-2 rounded-lg ${act.color} group-hover:scale-110 transition-transform`}>
                    <act.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Low Stock Summary */}
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stock Health Quick Check
            </h3>
            <div className="space-y-2">
              <div
                onClick={() => navigate('/inventory', { state: { tab: 'alerts' } })}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 cursor-pointer hover:shadow-2xs transition-all"
              >
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Product Variants Low</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats?.low_stock_variants || 0}</span>
              </div>

              <div
                onClick={() => navigate('/inventory', { state: { tab: 'alerts' } })}
                className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/40 cursor-pointer hover:shadow-2xs transition-all"
              >
                <span className="text-xs font-semibold text-red-800 dark:text-red-300">Out of Stock Items</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">{stats?.out_of_stock_count || 0}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
