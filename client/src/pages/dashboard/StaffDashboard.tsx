import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Package, AlertTriangle, PlusCircle, ShoppingCart, ClipboardList, FileText, ArrowUpRight, ArrowDownRight, DollarSign, Activity as ActivityIcon, Users, UserCheck, ShieldCheck, UserCog } from 'lucide-react'
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

  useEffect(() => {
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
    fetchData()
  }, [])

  const employeeStats = useMemo(() => {
    const total = employees.length
    const active = employees.filter(u => u.is_active).length
    const admins = employees.filter(u => u.role === 'admin').length
    const staff = total - admins
    const newThisMonth = employees.filter(u => {
      if (!u.created_at) return false
      const created = new Date(u.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
    return { total, active, admins, staff, newThisMonth }
  }, [employees])

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={3} />
        <ChartSkeleton />
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'audit': return <ClipboardList className="w-4 h-4 text-indigo-600" />
      case 'sale': return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'purchase': return <ArrowDownRight className="w-4 h-4 text-blue-600" />
      default: return <ActivityIcon className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'audit': return 'bg-indigo-50 dark:bg-indigo-900/20'
      case 'sale': return 'bg-green-50 dark:bg-green-900/20'
      case 'purchase': return 'bg-blue-50 dark:bg-blue-900/20'
      default: return 'bg-gray-50 dark:bg-gray-800/30'
    }
  }

  const quickActions = [
    { label: 'New Sale', icon: ShoppingCart, color: 'from-emerald-500 to-emerald-600', onClick: () => navigate('/sales') },
    { label: 'New Purchase', icon: PlusCircle, color: 'from-blue-500 to-blue-600', onClick: () => navigate('/purchases') },
    { label: 'View Products', icon: Package, color: 'from-violet-500 to-violet-600', onClick: () => navigate('/products') },
    { label: 'Inventory', icon: FileText, color: 'from-amber-500 to-amber-600', onClick: () => navigate('/inventory') },
  ]

  const lowStock = (stats?.low_stock_variants || 0) + (stats?.low_stock_count || 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Staff Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Daily operations at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/sales')} className="relative overflow-hidden group rounded-xl shadow-premium bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 animate-fade-in-up cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Sales</span>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            <AnimatedCounter value={stats?.today_sales || 0} prefix="₹" className="tabular-nums" />
          </p>
        </div>

        <div onClick={() => navigate('/products')} className="relative overflow-hidden group rounded-xl shadow-premium bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 animate-fade-in-up cursor-pointer" style={{ animationDelay: '50ms' }}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Products</span>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            <AnimatedCounter value={stats?.available_products || 0} className="tabular-nums" />
          </p>
        </div>

        <div onClick={() => navigate('/inventory', { state: { tab: 'alerts' } })} className="relative overflow-hidden group rounded-xl shadow-premium bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 animate-fade-in-up cursor-pointer" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Alerts</span>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${lowStock > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            <AnimatedCounter value={lowStock} className="tabular-nums" />
          </p>
          {lowStock > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
          )}
        </div>

        <div onClick={() => navigate('/sales')} className="relative overflow-hidden group rounded-xl shadow-premium bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 animate-fade-in-up cursor-pointer" style={{ animationDelay: '150ms' }}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</span>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            <AnimatedCounter value={stats?.total_sales || 0} prefix="₹" className="tabular-nums" />
          </p>
        </div>
      </div>

      <div className="card relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-500" />
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="card-title">Employee Summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:shadow-premium-sm cursor-pointer" onClick={() => navigate('/users')}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/20">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums leading-tight">{employeeStats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 transition-all duration-200 hover:shadow-premium-sm cursor-pointer" onClick={() => navigate('/users')}>
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums leading-tight">{employeeStats.active}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200/50 dark:border-indigo-800/30 transition-all duration-200 hover:shadow-premium-sm cursor-pointer" onClick={() => navigate('/users')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Admins</p>
              <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 tabular-nums leading-tight">{employeeStats.admins}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 transition-all duration-200 hover:shadow-premium-sm cursor-pointer" onClick={() => navigate('/users')}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserCog className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Staff</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300 tabular-nums leading-tight">{employeeStats.staff}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 grid grid-cols-1 gap-5">
          <div className="card relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-indigo-500" />
            <h3 className="card-title mb-4 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-indigo-500" />
              Recent Activities
            </h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {activities.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No recent activity</p>}
              {activities.map((a, i) => (
                <div key={`${a.type}-${a.id}`} onClick={() => navigate(a.type === 'sale' ? '/sales' : a.type === 'purchase' ? '/purchases' : '/audit-logs')} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${getActivityBg(a.type)}`}>
                    {getActivityIcon(a.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white leading-snug">{a.description}</p>
                    <p className="text-hint mt-0.5">
                      {a.timestamp ? new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-violet-500" />
            <h3 className="card-title mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500" />
            <h3 className="card-title mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock Summary
            </h3>
            <div className="space-y-2">
              <div onClick={() => navigate('/inventory', { state: { tab: 'alerts' } })} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 cursor-pointer transition-all duration-200 hover:shadow-premium-sm">
                <span className="text-body">Product Variants</span>
                <span className="text-sm font-bold text-amber-600 tabular-nums">{stats?.low_stock_variants || 0}</span>
              </div>
              <div onClick={() => navigate('/inventory', { state: { tab: 'alerts' } })} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 cursor-pointer transition-all duration-200 hover:shadow-premium-sm">
                <span className="text-body">Out of Stock</span>
                <span className="text-sm font-bold text-red-600 tabular-nums">{stats?.out_of_stock_count || 0}</span>
              </div>
              <div onClick={() => navigate('/inventory', { state: { tab: 'alerts' } })} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 cursor-pointer transition-all duration-200 hover:shadow-premium-sm">
                <span className="text-body">Legacy Low Stock</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{stats?.low_stock_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


