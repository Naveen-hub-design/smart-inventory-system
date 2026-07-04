import { useState, useEffect } from 'react'
import { Package, Droplets, Truck, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { dashboardService } from '../../services/dataService'
import { DashboardStats, Transaction } from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stockByCategory, setStockByCategory] = useState<StockCategory[]>([])
  const [monthlySales, setMonthlySales] = useState<MonthlyData[]>([])
  const [monthlyPurchases, setMonthlyPurchases] = useState<MonthlyData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoaded, setChartLoaded] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, transRes, stockRes, salesRes, purchasesRes, topRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentTransactions(),
          dashboardService.getStockByCategory(),
          dashboardService.getMonthlySales(),
          dashboardService.getMonthlyPurchases(),
          dashboardService.getTopProducts(),
        ])
        setStats(statsRes.data)
        setTransactions(transRes.data.transactions)
        setStockByCategory(stockRes.data.data)
        setMonthlySales(salesRes.data.data)
        setMonthlyPurchases(purchasesRes.data.data)
        setTopProducts(topRes.data.data)
        setTimeout(() => setChartLoaded(true), 100)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
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

  const statCards = [
    { label: 'Total Products', value: stats?.total_products || 0, icon: Package, gradient: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/10', trend: '+12%' },
    { label: 'Raw Materials', value: stats?.total_materials || 0, icon: Droplets, gradient: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50 dark:bg-emerald-900/10', trend: '+5%' },
    { label: 'Active Suppliers', value: stats?.total_suppliers || 0, icon: Truck, gradient: 'from-purple-500 to-purple-600', bgLight: 'bg-purple-50 dark:bg-purple-900/10', trend: '+8%' },
    { label: "Today's Sales", value: stats?.today_sales || 0, icon: TrendingUp, gradient: 'from-cyan-500 to-cyan-600', bgLight: 'bg-cyan-50 dark:bg-cyan-900/10', trend: '', prefix: '₹' },
    { label: 'Total Sales', value: stats?.total_sales || 0, icon: DollarSign, gradient: 'from-sky-500 to-sky-600', bgLight: 'bg-sky-50 dark:bg-sky-900/10', trend: '', prefix: '₹' },
    { label: 'Total Purchases', value: stats?.total_purchases || 0, icon: ShoppingCart, gradient: 'from-orange-500 to-orange-600', bgLight: 'bg-orange-50 dark:bg-orange-900/10', trend: '+3%' },
    { label: 'Low Stock Items', value: stats?.low_stock_count || 0, icon: AlertTriangle, gradient: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50 dark:bg-amber-900/10', trend: '', highlight: (stats?.low_stock_count || 0) > 0 },
    { label: 'Out of Stock', value: stats?.out_of_stock_count || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', bgLight: 'bg-red-50 dark:bg-red-900/10', trend: '', highlight: (stats?.out_of_stock_count || 0) > 0 },
  ]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your inventory system</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`relative overflow-hidden group rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-0.5 ${card.highlight ? 'ring-2 ring-red-300 dark:ring-red-700/50' : ''} animate-fade-in-up`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.03] dark:opacity-[0.05] rounded-bl-full transition-opacity duration-300 group-hover:opacity-[0.06]" />
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
              <div className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg shadow-${card.gradient.split(' ')[0].replace('from-', '')}/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {card.prefix === '₹' ? (
                <AnimatedCounter value={card.value} prefix="₹" className="tabular-nums" />
              ) : (
                <AnimatedCounter value={card.value} className="tabular-nums" />
              )}
            </p>
            {card.trend && (
              <div className="flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-500 font-medium">{card.trend}</span>
                <span className="text-xs text-gray-400 ml-1">vs last month</span>
              </div>
            )}
            {card.highlight && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Sales</h3>
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          </div>
          <div className={`transition-opacity duration-700 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="month" tickFormatter={(m) => monthNames[m - 1]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPurchases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="month" tickFormatter={(m) => monthNames[m - 1]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Purchases']}
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">Stock by Category</h3>
          <div className={`transition-opacity duration-700 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockByCategory}
                  dataKey="quantity"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {stockByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">Recent Transactions</h3>
          <div className="space-y-1">
            {transactions.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No recent transactions</p>}
            {transactions.slice(0, 6).map((t, i) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${i * 50}ms` }}
              >
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{t.amount.toLocaleString()}</p>
                  <span className={`text-xs font-medium ${t.type === 'sale' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {t.type === 'sale' ? 'Sale' : 'Purchase'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
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
                  <tr key={i} className="table-row">
                    <td className="table-cell font-medium">{p.name}</td>
                    <td className="table-cell text-right tabular-nums">{p.quantity}</td>
                    <td className="table-cell text-right font-medium tabular-nums">₹{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
