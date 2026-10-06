import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Layers, ShoppingBag, Truck, Users, ShoppingCart, TrendingUp,
  DollarSign, AlertTriangle, Brain, ClipboardList,
  BarChart3, ArrowUpRight, ArrowDownRight, ArrowRight, Activity as ActivityIcon,
  Calendar, CreditCard, CheckSquare, Wallet, ChevronDown, RefreshCw, Sparkles, PieChart as PieIcon
} from 'lucide-react'
import { dashboardService, aiService } from '../../services/dataService'
import AiRecommendationDetailModal from './AiRecommendationDetailModal'
import { DashboardStats, Activity, ReorderRecommendation } from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Sector
} from 'recharts'

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

// Active shape for Donut chart interactive hover
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="#fff"
      strokeWidth={2}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
    />
  )
}

function PieChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value, color } = payload[0]
  const total = payload.reduce((s: number, p: any) => s + p.value, 0)
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
  return (
    <div className="bg-white/95 dark:bg-[#1e1f30]/95 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xl px-4 py-3 text-xs animate-scale-in">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <p className="font-bold text-gray-900 dark:text-white">{name}</p>
      </div>
      <div className="space-y-0.5 text-gray-600 dark:text-gray-300">
        <p>Stock: <span className="font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</span></p>
        <p>Share: <span className="font-semibold text-gray-900 dark:text-white">{pct}%</span></p>
      </div>
    </div>
  )
}

interface StockCategory {
  name: string
  quantity: number
}

interface MonthlyData {
  month: number
  total: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [stockByCategory, setStockByCategory] = useState<StockCategory[]>([])
  const [monthlySales, setMonthlySales] = useState<MonthlyData[]>([])
  const [monthlyPurchases, setMonthlyPurchases] = useState<MonthlyData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [aiRecs, setAiRecs] = useState<ReorderRecommendation[]>([])
  const [aiHighCount, setAiHighCount] = useState(0)
  const [inventoryHealth, setInventoryHealth] = useState(100)
  const [supplierRisk, setSupplierRisk] = useState('Low')
  const [dominantTrend, setDominantTrend] = useState('Stable')
  const [selectedAiVariant, setSelectedAiVariant] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartLoaded, setChartLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>()
  const [selectedYear, setSelectedYear] = useState('2026')

  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

  const fetchData = async () => {
    try {
      const [statsRes, transRes, stockRes, salesRes, purchasesRes, topRes, actRes, aiRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentTransactions(),
        dashboardService.getStockByCategory(),
        dashboardService.getMonthlySales(),
        dashboardService.getMonthlyPurchases(),
        dashboardService.getTopProducts(),
        dashboardService.getRecentActivities(),
        aiService.getReorderRecommendations(),
      ])
      setStats(statsRes.data)
      setTransactions(transRes.data.transactions || [])
      setStockByCategory(stockRes.data.data || [])
      setMonthlySales(salesRes.data.data || [])
      setMonthlyPurchases(purchasesRes.data.data || [])
      setTopProducts(topRes.data.data || [])
      setActivities(actRes.data.activities || [])
      setAiRecs((aiRes.data.recommendations || []).slice(0, 10))
      setAiHighCount(aiRes.data.high_priority?.length || 0)
      setInventoryHealth(aiRes.data.inventory_health_percent ?? 100)
      setSupplierRisk(aiRes.data.supplier_risk ?? 'Low')
      setDominantTrend(aiRes.data.dominant_trend ?? 'Stable')
      setTimeout(() => setChartLoaded(true), 100)
    } catch (err) {
      console.error('Admin dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  // Formatting helper for currency & numbers
  const formatVal = (num?: number) => (num || 0).toLocaleString('en-IN')

  // Combined Sales dynamics data for dual bar chart or sales view
  const salesDynamicsData = monthNames.map((m, idx) => {
    const s = monthlySales.find(item => item.month === idx + 1)?.total || 0
    const p = monthlyPurchases.find(item => item.month === idx + 1)?.total || 0
    return { name: m, sales: s, purchases: p }
  })

  // Status badges mapping for Customer order table
  const statusBadges: Record<string, { bg: string; text: string; border: string; label: string }> = {
    sale: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200/60 dark:border-emerald-800/40', label: 'Delivered' },
    purchase: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200/60 dark:border-amber-800/40', label: 'Processed' },
    pending: { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200/60 dark:border-blue-800/40', label: 'Pending' },
    default: { bg: 'bg-red-50 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-400', border: 'border-red-200/60 dark:border-red-800/40', label: 'Cancelled' }
  }

  const avatarGradients = [
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-600',
    'from-blue-400 to-indigo-600',
    'from-purple-400 to-pink-600',
    'from-cyan-400 to-blue-500'
  ]

  // User breakdown data for Donut widget in top KPI row
  const customerBreakdownData = [
    { name: 'New', value: 52, color: '#f59e0b' },
    { name: 'Returning', value: 28, color: '#f97316' },
    { name: 'Inactive', value: 20, color: '#06b6d4' }
  ]

  // Subscription/Supplier breakdown for Donut widget in top KPI row
  const supplierBreakdownData = [
    { name: 'Paid', value: 70, color: '#3b82f6' },
    { name: 'Trial', value: 30, color: '#60a5fa' }
  ]

  return (
    <div className="space-y-6 pb-8 text-gray-800 dark:text-gray-100 font-sans">

      {/* Top Bar: Analytics Title & Date Selector Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Analytics</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1f30] border border-gray-200/80 dark:border-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>01.08.2026 - 31.10.2026</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-white dark:bg-[#1e1f30] border border-gray-200/80 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-medium text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live System</span>
          </div>
        </div>
      </div>

      {/* KPI GRID - ROW 1: 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Orders */}
        <div
          onClick={() => navigate('/products')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Orders</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                <AnimatedCounter value={stats?.total_products || 201} />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-2xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span>↑ 8.2%</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">since last month</span>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div
          onClick={() => navigate('/purchases')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Approved</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                <AnimatedCounter value={stats?.total_purchases || 36} />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-2xs">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span>↑ 3.4%</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">since last month</span>
          </div>
        </div>

        {/* Card 3: Users */}
        <div
          onClick={() => navigate('/sales')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Users</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
              <AnimatedCounter value={stats?.total_customers || 4890} />
            </h2>
            <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">since last month</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={customerBreakdownData} dataKey="value" innerRadius={16} outerRadius={26} strokeWidth={0}>
                    {customerBreakdownData.map((entry, index) => (
                      <Cell key={`c3-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 52%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 28%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Subscriptions */}
        <div
          onClick={() => navigate('/suppliers')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Subscriptions</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
              <AnimatedCounter value={stats?.total_suppliers || 1201} />
            </h2>
            <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">since last month</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={supplierBreakdownData} dataKey="value" innerRadius={16} outerRadius={26} strokeWidth={0}>
                    {supplierBreakdownData.map((entry, index) => (
                      <Cell key={`c4-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 70%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 30%</span>
            </div>
          </div>
        </div>

      </div>

      {/* KPI GRID - ROW 2: 4 Secondary Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 5: Month total */}
        <div
          onClick={() => navigate('/sales')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Month total</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                <AnimatedCounter value={stats?.revenue || 25410} prefix="₹" />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-bold shadow-2xs">
              ₹
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-red-500">
            <span>↓ 0.2%</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">since last month</span>
          </div>
        </div>

        {/* Card 6: Revenue */}
        <div
          onClick={() => navigate('/reports')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Revenue</p>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                <AnimatedCounter value={stats?.profit || 1352} prefix="₹" />
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-red-500">
            <span>↓ 1.2%</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">since last month</span>
          </div>
        </div>

        {/* Card 7: Paid Invoices */}
        <div
          onClick={() => navigate('/sales')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-2xs">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
              +15%
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Paid Invoices</p>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 tabular-nums tracking-tight">
              ₹{formatVal(stats?.total_sales || 30256.23)}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Current Financial Year</p>
          </div>
        </div>

        {/* Card 8: Funds received */}
        <div
          onClick={() => navigate('/purchases')}
          className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
              +99%
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Funds received</p>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 tabular-nums tracking-tight">
              ₹{formatVal(stats?.total_purchases || 150256.23)}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Current Financial Year</p>
          </div>
        </div>

      </div>

      {/* MAIN DASHBOARD CONTENT GRID (Left 7 cols, Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT COLUMN: CHARTS & AI (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">

          {/* Sales dynamics (Bar Chart) */}
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sales dynamics</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Monthly sales vs purchasing performance</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer shadow-2xs">
                <span>{selectedYear}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div className={`h-[220px] transition-opacity duration-700 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesDynamicsData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226,232,240,0.9)', background: 'rgba(255,255,255,0.98)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="purchases" name="Purchases" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={18} opacity={0.65} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Overall User Activity (Area/Line Chart) */}
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Overall User Activity</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Operational interactions & transaction intensity</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer shadow-2xs">
                <span>{selectedYear}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div className={`h-[200px] transition-opacity duration-700 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesDynamicsData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226,232,240,0.9)', background: 'rgba(255,255,255,0.98)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, 'Activity']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#c084fc" strokeWidth={2.5} fillOpacity={1} fill="url(#purpleGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights & Critical Alerts Operations Panel */}
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 border-l-4 border-l-primary-500 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Insights & Critical Alerts</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Continuous automated inventory monitoring & stock recommendations</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/ai-intelligence')}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Critical Reorders</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">{aiHighCount} Items</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Health Score</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">{inventoryHealth}%</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Supplier Risk</p>
                <p className={`text-base font-bold mt-0.5 ${supplierRisk === 'High' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{supplierRisk}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Trend</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{dominantTrend}</p>
              </div>
            </div>

            {aiRecs.length > 0 && (
              <div className="space-y-1.5 border-t border-gray-100 dark:border-gray-800/80 pt-3">
                {aiRecs.slice(0, 3).map((r) => (
                  <div
                    key={r.variant_id}
                    onClick={() => setSelectedAiVariant(r.variant_id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${r.priority === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{r.product_name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Low stock · Reorder threshold reached</p>
                      </div>
                    </div>
                    <button className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-2.5 py-1 rounded-lg bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200/50 dark:border-primary-800/40 transition-colors">
                      Reorder {r.suggested_reorder_qty} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: DONUT, CUSTOMER ORDERS TABLE & TOP PRODUCTS (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">

          {/* Stock by Category Donut Card */}
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Stock by Category</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Inventory distribution across product types</p>
              </div>
              <PieIcon className="w-4 h-4 text-gray-400" />
            </div>

            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockByCategory.filter(d => d.quantity > 0)}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    {stockByCategory.filter(d => d.quantity > 0).map((_, index) => (
                      <Cell key={`cell-cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-2 text-xs w-full">
              {stockByCategory.filter(d => d.quantity > 0).slice(0, 6).map((entry, idx) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/inventory', { state: { tab: 'stock', category: entry.name } })}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-400 text-[11px] font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer order / Recent Transactions Table */}
          <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Customer order</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Recent order transactions & status</p>
              </div>
              <button
                onClick={fetchData}
                title="Refresh Table"
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <th className="pb-2.5 font-medium">Profile</th>
                    <th className="pb-2.5 font-medium">Address</th>
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80 dark:divide-gray-800/50 text-xs">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">No transactions recorded</td>
                    </tr>
                  ) : (
                    transactions.slice(0, 6).map((t, i) => {
                      const badge = statusBadges[t.type] || statusBadges.default
                      const grad = avatarGradients[i % avatarGradients.length]
                      const name = t.customer || t.supplier || 'User'
                      const address = t.type === 'sale' ? 'London' : 'New York'
                      const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB') : '22.08.2026'

                      return (
                        <tr
                          key={t.id || i}
                          onClick={() => navigate(t.type === 'sale' ? '/sales' : '/purchases')}
                          className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${grad} flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0`}>
                              {name.charAt(0)}
                            </div>
                            <span className="truncate max-w-[90px]" title={name}>{name}</span>
                          </td>
                          <td className="py-3 text-gray-500 dark:text-gray-400">{address}</td>
                          <td className="py-3 text-gray-400 dark:text-gray-500 tabular-nums">{dateStr}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                            ₹{t.amount?.toLocaleString('en-IN') || '600'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Products Table Card */}
          {topProducts.length > 0 && (
            <div className="bg-white dark:bg-[#1e1f30] rounded-2xl p-5 border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Selling Products</h3>
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-1.5">
                {topProducts.slice(0, 4).map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/products')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/60 dark:bg-gray-800/30 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-all cursor-pointer border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                  >
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[160px]" title={p.name}>{p.name}</span>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white tabular-nums">₹{p.revenue.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{p.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      <AiRecommendationDetailModal
        variantId={selectedAiVariant}
        onClose={() => setSelectedAiVariant(null)}
      />

    </div>
  )
}
