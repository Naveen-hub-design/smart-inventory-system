import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Layers, ShoppingBag, Truck, Users, ShoppingCart, TrendingUp,
  DollarSign, AlertTriangle, Brain, ClipboardList,
  BarChart3, ArrowUpRight, ArrowDownRight, ArrowRight, Activity as ActivityIcon
} from 'lucide-react'
import { dashboardService, aiService } from '../../services/dataService'
import AiRecommendationDetailModal from './AiRecommendationDetailModal'
import { DashboardStats, Activity, ReorderRecommendation } from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Sector
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 5}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="#fff"
      strokeWidth={2}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}
    />
  )
}

function PieChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value, color } = payload[0]
  const total = payload.reduce((s: number, p: any) => s + p.value, 0)
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl border border-gray-200/70 dark:border-gray-700/70 shadow-xl px-4 py-3 text-sm animate-scale-in">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
      </div>
      <div className="space-y-0.5">
        <p className="text-gray-600 dark:text-gray-300">
          Stock: <span className="font-medium text-gray-900 dark:text-white">{value.toLocaleString()}</span>
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          Share: <span className="font-medium text-gray-900 dark:text-white">{pct}%</span>
        </p>
      </div>
      <div className="mt-2 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function PieChartLegend({ data, colors }: { data: StockCategory[]; colors: string[] }) {
  const total = data.reduce((s: number, d: StockCategory) => s + d.quantity, 0)
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-3 pb-1">
      {data.map((entry, index) => {
        const pct = total > 0 ? ((entry.quantity / total) * 100).toFixed(0) : '0'
        return (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs transition-all duration-200 hover:scale-105 hover:opacity-90 cursor-default">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">{entry.name}</span>
            <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{pct}%</span>
          </div>
        )
      })}
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
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedAiVariant, setSelectedAiVariant] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartLoaded, setChartLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>()

  useEffect(() => {
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
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={5} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const adminStatCards = [
    { label: 'Total Products', value: stats?.total_products || 0, icon: Package, gradient: 'from-blue-500 to-blue-600', route: '/products' },
    { label: 'Total Variants', value: stats?.total_variants || 0, icon: Layers, gradient: 'from-violet-500 to-violet-600', route: '/inventory', state: { tab: 'stock' } },
    { label: 'Categories', value: stats?.total_categories || 0, icon: ShoppingBag, gradient: 'from-teal-500 to-teal-600' },
    { label: 'Suppliers', value: stats?.total_suppliers || 0, icon: Truck, gradient: 'from-purple-500 to-purple-600', route: '/suppliers' },
    { label: 'Customers', value: stats?.total_customers || 0, icon: Users, gradient: 'from-pink-500 to-pink-600' },
    { label: 'Total Sales', value: stats?.total_sales || 0, icon: ShoppingCart, gradient: 'from-orange-500 to-orange-600', prefix: true, route: '/sales' },
    { label: 'Total Purchases', value: stats?.total_purchases || 0, icon: TrendingUp, gradient: 'from-amber-500 to-amber-600', prefix: true, route: '/purchases' },
    { label: 'Revenue', value: stats?.revenue || 0, icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', prefix: true, route: '/sales' },
    { label: 'Profit', value: stats?.profit || 0, icon: BarChart3, gradient: 'from-cyan-500 to-cyan-600', prefix: true },
    { label: 'Low Stock', value: stats?.low_stock_variants || 0, icon: AlertTriangle, gradient: 'from-amber-500 to-amber-600', highlight: (stats?.low_stock_variants || 0) > 0, route: '/inventory', state: { tab: 'alerts' } },
    { label: 'Out of Stock', value: stats?.out_of_stock_count || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', highlight: (stats?.out_of_stock_count || 0) > 0, route: '/inventory', state: { tab: 'alerts' } },
    { label: 'AI Reorder Alerts', value: aiHighCount, icon: Brain, gradient: 'from-indigo-500 to-purple-600', highlight: aiHighCount > 0, route: '/ai-intelligence' },
  ]

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Full oversight of the inventory system</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStatCards.map((card, i) => (
          <div
            key={card.label}
            onClick={() => card.route && navigate(card.route, { state: card.state })}
            className={`relative overflow-hidden group rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 ${card.route ? 'cursor-pointer' : ''} ${card.highlight ? 'ring-2 ring-red-300 dark:ring-red-700/50' : ''} animate-fade-in-up`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.03] dark:opacity-[0.05] rounded-bl-full" />
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
              <div className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {card.prefix ? (
                <AnimatedCounter value={card.value} prefix="₹" className="tabular-nums" />
              ) : (
                <AnimatedCounter value={card.value} className="tabular-nums" />
              )}
            </p>
            {card.highlight && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Sales</h3>
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            </div>
            <div className={`transition-opacity duration-700 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                  <XAxis dataKey="month" tickFormatter={(m) => monthNames[m - 1]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }} formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} style={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Purchases</h3>
              <ArrowDownRight className="w-4 h-4 text-emerald-500" />
            </div>
            <div className={`transition-opacity duration-700 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyPurchases}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                  <XAxis dataKey="month" tickFormatter={(m) => monthNames[m - 1]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }} formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Purchases']} />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} style={{ cursor: 'pointer' }} onClick={() => navigate('/purchases')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card animate-fade-in-up flex flex-col transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5" style={{ animationDelay: '200ms' }}>
            <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">Stock by Category</h3>
            <div className={`flex-1 flex flex-col items-center justify-center transition-all duration-700 ease-out ${chartLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {stockByCategory.filter(d => d.quantity > 0).length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No stock data available</p>
              ) : (
                <>
                  <div className="w-full" style={{ height: 230 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stockByCategory.filter(d => d.quantity > 0)} dataKey="quantity" nameKey="name" cx="50%" cy="50%" outerRadius="95%" paddingAngle={2} activeIndex={activeIndex} activeShape={renderActiveShape} onMouseEnter={(_: any, index: number) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(undefined)} animationBegin={0} animationDuration={1200} animationEasing="ease-out" onClick={(entry: any) => navigate('/inventory', { state: { tab: 'stock', category: entry.name } })} style={{ cursor: 'pointer' }}>
                          {stockByCategory.filter(d => d.quantity > 0).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <PieChartLegend data={stockByCategory.filter(d => d.quantity > 0)} colors={COLORS} />
                </>
              )}
            </div>
          </div>

          <div className="card animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">Recent Transactions</h3>
            <div className="space-y-1">
              {transactions.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No recent transactions</p>}
              {transactions.slice(0, 5).map((t, i) => (
                <div key={t.id} onClick={() => navigate(t.type === 'sale' ? '/sales' : '/purchases')} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === 'sale' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                      {t.type === 'sale' ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.invoice}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.customer || t.supplier || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{t.amount?.toLocaleString() || '0'}</p>
                    <span className={`text-xs font-medium ${t.type === 'sale' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {t.type === 'sale' ? 'Sale' : 'Purchase'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-indigo-500" />
              Recent Activities
            </h3>
            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {activities.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No recent activity</p>}
              {activities.map((a, i) => (
                <div key={`${a.type}-${a.id}`} onClick={() => navigate(a.type === 'sale' ? '/sales' : a.type === 'purchase' ? '/purchases' : '/audit-logs')} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${getActivityBg(a.type)}`}>
                    {getActivityIcon(a.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white leading-snug">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.user && `${a.user} · `}
                      {a.timestamp ? new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              AI Insights Summary
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-3 cursor-pointer" onClick={() => navigate('/ai-intelligence')}>
              <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Critical Reorders</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{aiHighCount} {aiHighCount === 1 ? 'Item' : 'Items'}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inventory Health</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{inventoryHealth}%</p>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier Risk</p>
                <p className={`text-base font-bold ${supplierRisk === 'High' ? 'text-red-600 dark:text-red-400' : supplierRisk === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{supplierRisk}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Demand Trend</p>
                <p className={`text-base font-bold ${dominantTrend === 'Increasing' ? 'text-emerald-600 dark:text-emerald-400' : dominantTrend === 'Decreasing' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{dominantTrend}</p>
              </div>
            </div>
            {aiRecs.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Recommended Reorders</p>
                <div className="space-y-0.5 mb-3">
                  {aiRecs.slice(0, 5).map((r, i) => (
                    <div key={r.variant_id} onClick={() => setSelectedAiVariant(r.variant_id)} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.priority === 'high' ? 'bg-red-500' : r.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'}`} />
                        <p className="text-xs text-gray-900 dark:text-white truncate">{r.product_name}</p>
                      </div>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">+{r.suggested_reorder_qty}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => navigate('/ai-intelligence')} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all duration-200">
              View AI Intelligence
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="card animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="table-header">Product</th>
                  <th className="table-header text-right">Quantity Sold</th>
                  <th className="table-header text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="group border-b border-gray-50 dark:border-gray-800/20 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all duration-200 cursor-pointer" onClick={() => navigate('/products')}>
                    <td className="px-5 py-4 font-medium">{p.name}</td>
                    <td className="px-5 py-4 text-right tabular-nums">{p.quantity}</td>
                    <td className="px-5 py-4 text-right font-medium tabular-nums">₹{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AiRecommendationDetailModal
        variantId={selectedAiVariant}
        onClose={() => setSelectedAiVariant(null)}
      />
    </div>
  )
}
