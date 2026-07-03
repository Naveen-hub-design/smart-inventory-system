import { useState, useEffect } from 'react'
import { Package, Droplets, Truck, ShoppingCart, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'
import { dashboardService } from '../../services/dataService'
import { DashboardStats, Transaction } from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
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
      } catch { } finally {
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
    { label: 'Total Products', value: stats?.total_products || 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Raw Materials', value: stats?.total_materials || 0, icon: Droplets, color: 'bg-green-500' },
    { label: 'Active Suppliers', value: stats?.total_suppliers || 0, icon: Truck, color: 'bg-purple-500' },
    { label: "Today's Sales", value: `₹${(stats?.today_sales || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Total Sales', value: `₹${(stats?.total_sales || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-cyan-500' },
    { label: 'Total Purchases', value: stats?.total_purchases || 0, icon: ShoppingCart, color: 'bg-orange-500' },
    { label: 'Low Stock Items', value: stats?.low_stock_count || 0, icon: AlertTriangle, color: 'bg-yellow-500', highlight: (stats?.low_stock_count || 0) > 0 },
    { label: 'Out of Stock', value: stats?.out_of_stock_count || 0, icon: AlertTriangle, color: 'bg-red-500', highlight: (stats?.out_of_stock_count || 0) > 0 },
  ]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your inventory system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`card-hover ${card.highlight ? 'ring-2 ring-red-300 dark:ring-red-700' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tickFormatter={(m) => monthNames[m - 1]} />
              <YAxis />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPurchases}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tickFormatter={(m) => monthNames[m - 1]} />
              <YAxis />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Purchases']} />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Stock by Category</h3>
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
              >
                {stockByCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.length === 0 && <p className="text-gray-500 text-sm">No recent transactions</p>}
            {transactions.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{t.invoice}</p>
                  <p className="text-xs text-gray-500">{t.customer || t.supplier || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{t.amount.toLocaleString()}</p>
                  <span className={`text-xs ${t.type === 'sale' ? 'text-green-600' : 'text-blue-600'}`}>
                    {t.type === 'sale' ? 'Sale' : 'Purchase'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Quantity Sold</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2">{p.name}</td>
                    <td className="text-right py-2">{p.quantity}</td>
                    <td className="text-right py-2 font-medium">₹{p.revenue.toLocaleString()}</td>
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
