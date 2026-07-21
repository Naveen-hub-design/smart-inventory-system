import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, X, Table, Eye, BarChart3, DollarSign, Package, TrendingUp, AlertTriangle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportService, categoryService, supplierService } from '../../services/dataService'
import { TableSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import Pagination from '../../components/ui/Pagination'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const reportTypes = [
  { id: 'inventory', label: 'Inventory Report', desc: 'Current stock levels of all products', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'sales', label: 'Sales Report', desc: 'Sales history and revenue data', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'purchases', label: 'Purchase Report', desc: 'Purchase order history', gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'suppliers', label: 'Supplier Report', desc: 'Supplier information overview', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'low-stock', label: 'Low Stock Report', desc: 'Items that need reordering', gradient: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20', bg: 'bg-red-100 dark:bg-red-900/30' },
]

const reportColumns: Record<string, { key: string; label: string }[]> = {
  inventory: [
    { key: 'Product', label: 'Product' },
    { key: 'SKU', label: 'SKU' },
    { key: 'Category', label: 'Category' },
    { key: 'Current Stock', label: 'Current Stock' },
    { key: 'Minimum Stock', label: 'Minimum Stock' },
    { key: 'Status', label: 'Status' },
  ],
  sales: [
    { key: 'Invoice', label: 'Invoice' },
    { key: 'Customer', label: 'Customer' },
    { key: 'Product', label: 'Product' },
    { key: 'Quantity', label: 'Quantity' },
    { key: 'Total', label: 'Total' },
    { key: 'Date', label: 'Date' },
  ],
  purchases: [
    { key: 'Purchase No', label: 'Purchase No' },
    { key: 'Supplier', label: 'Supplier' },
    { key: 'Material', label: 'Material' },
    { key: 'Quantity', label: 'Quantity' },
    { key: 'Cost', label: 'Cost' },
    { key: 'Date', label: 'Date' },
  ],
  suppliers: [
    { key: 'Supplier', label: 'Supplier' },
    { key: 'Contact Person', label: 'Contact Person' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Email', label: 'Email' },
    { key: 'Status', label: 'Status' },
  ],
  'low-stock': [
    { key: 'Product', label: 'Product' },
    { key: 'Current Stock', label: 'Current Stock' },
    { key: 'Minimum Stock', label: 'Minimum Stock' },
    { key: 'Required Quantity', label: 'Required Quantity' },
    { key: 'Status', label: 'Status' },
  ],
}

const FILTER_TYPES: Record<string, string[]> = {
  inventory: ['category'],
  sales: ['date', 'category', 'search'],
  purchases: ['date', 'supplier', 'search'],
  suppliers: ['search'],
  'low-stock': [],
}

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [categories, setCategories] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])

  const [filters, setFilters] = useState<Record<string, any>>({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    category_id: '',
    supplier_id: '',
    search: '',
  })

  const [chartData, setChartData] = useState<{
    salesTrend: any[] | null
    purchaseTrend: any[] | null
    categoryDist: any[] | null
  }>({ salesTrend: null, purchaseTrend: null, categoryDist: null })
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    categoryService.getAll({ per_page: 100 }).then(r => setCategories(r.data.categories || [])).catch(() => console.error('Failed to load categories'))
    supplierService.getAll({ per_page: 100 }).then(r => setSuppliers(r.data.suppliers || [])).catch(() => console.error('Failed to load suppliers'))
  }, [])

  const fetchCharts = useCallback(async () => {
    setChartLoading(true)
    try {
      const [salesRes, purchaseRes, catRes] = await Promise.all([
        reportService.getSalesChartData(12).catch(() => ({ data: { labels: [], values: [], quantities: [] } })),
        reportService.getPurchaseChartData(12).catch(() => ({ data: { labels: [], values: [], quantities: [] } })),
        reportService.getCategoryDistribution().catch(() => ({ data: { labels: [], values: [] } })),
      ])
      setChartData({
        salesTrend: salesRes.data.labels.map((l: string, i: number) => ({ label: l, revenue: salesRes.data.values[i], quantity: salesRes.data.quantities[i] })),
        purchaseTrend: purchaseRes.data.labels.map((l: string, i: number) => ({ label: l, cost: purchaseRes.data.values[i], quantity: purchaseRes.data.quantities[i] })),
        categoryDist: catRes.data.labels.map((l: string, i: number) => ({ name: l, value: catRes.data.values[i] })),
      })
    } catch { console.error('Failed to load chart data') }
    finally { setChartLoading(false) }
  }, [])

  useEffect(() => { fetchCharts() }, [fetchCharts])

  const buildParams = (type: string, format: string) => {
    const p: any = { format }
    if (FILTER_TYPES[type]?.includes('date') && filters.start_date) p.start_date = filters.start_date
    if (FILTER_TYPES[type]?.includes('date') && filters.end_date) p.end_date = filters.end_date
    if (FILTER_TYPES[type]?.includes('category') && filters.category_id) p.category_id = filters.category_id
    if (FILTER_TYPES[type]?.includes('supplier') && filters.supplier_id) p.supplier_id = filters.supplier_id
    if (FILTER_TYPES[type]?.includes('search') && filters.search) p.search = filters.search
    return p
  }

  const handleExport = async (type: string, format: string) => {
    setLoading(type + format)
    if (format === 'json') {
      setSelectedReport(type)
      setPage(1)
      setPreview(null)
    }
    try {
      let res: any
      const params = buildParams(type, format)

      if (format === 'excel') {
        const serviceMap: Record<string, any> = {
          inventory: () => reportService.getInventory(params),
          sales: () => reportService.getSales(params),
          purchases: () => reportService.getPurchases(params),
          suppliers: () => reportService.getSuppliers(params),
          'low-stock': () => reportService.getLowStock(params),
        }
        res = await serviceMap[type]()
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_report.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Excel report downloaded')
      } else if (format === 'csv') {
        const serviceMap: Record<string, any> = {
          inventory: () => reportService.getInventory({ ...params, format: 'csv' }),
          sales: () => reportService.getSales({ ...params, format: 'csv' }),
          purchases: () => reportService.getPurchases({ ...params, format: 'csv' }),
          suppliers: () => reportService.getSuppliers({ ...params, format: 'csv' }),
          'low-stock': () => reportService.getLowStock({ ...params, format: 'csv' }),
        }
        res = await serviceMap[type]()
        const blob = new Blob([res.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_report.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('CSV report downloaded')
      } else {
        const serviceMap: Record<string, any> = {
          inventory: () => reportService.getInventory({ ...params, format: 'json' }),
          sales: () => reportService.getSales({ ...params, format: 'json' }),
          purchases: () => reportService.getPurchases({ ...params, format: 'json' }),
          suppliers: () => reportService.getSuppliers({ ...params, format: 'json' }),
          'low-stock': () => reportService.getLowStock({ ...params, format: 'json' }),
        }
        res = await serviceMap[type]()
        setPreview(res.data)
        setSelectedReport(type)
      }
    } catch (err: any) {
      let msg = 'Failed to generate report'
      if (err?.response?.data) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text()
            const json = JSON.parse(text)
            msg = json.error || msg
          } catch { console.error('Failed to parse error response body') }
        } else {
          msg = err.response.data?.error || msg
        }
      } else if (err?.message) {
        msg = err.message
      }
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  const renderSummaryCards = () => {
    if (!preview?.summary) return null
    const s = preview.summary

    if (selectedReport === 'inventory') {
      return (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"><Package className="w-3 h-3" /> Total Products</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_products}</p>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><Package className="w-3 h-3" /> Total Stock</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_stock}</p>
          </div>
        </div>
      )
    }

    if (selectedReport === 'sales') {
      return (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><FileText className="w-3 h-3" /> Total Sales</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_sales}</p>
          </div>
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" /> Revenue</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">₹{s.total_revenue?.toLocaleString()}</p>
          </div>
          <div className="p-3.5 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Items Sold</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_quantity}</p>
          </div>
        </div>
      )
    }

    if (selectedReport === 'purchases') {
      return (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1"><FileText className="w-3 h-3" /> Purchases</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_purchases}</p>
          </div>
          <div className="p-3.5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Cost</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">₹{s.total_cost?.toLocaleString()}</p>
          </div>
          <div className="p-3.5 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1"><Package className="w-3 h-3" /> Items</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_quantity}</p>
          </div>
        </div>
      )
    }

    if (selectedReport === 'low-stock') {
      return (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low Stock Items</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_low_stock}</p>
          </div>
          <div className="p-3.5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Out of Stock</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.out_of_stock}</p>
          </div>
        </div>
      )
    }

    if (selectedReport === 'suppliers') {
      return (
        <div className="grid grid-cols-1 gap-3 mb-5 w-48">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1"><Package className="w-3 h-3" /> Total Suppliers</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.total_suppliers}</p>
          </div>
        </div>
      )
    }

    return null
  }

  const renderCharts = () => {
    if (!selectedReport) return null
    const show = selectedReport === 'sales' || selectedReport === 'purchases'
    if (!show) return null

    if (chartLoading) return <div className="mb-5"><ChartSkeleton /></div>

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {selectedReport === 'sales' && chartData.salesTrend && (
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <h4 className="card-title text-sm flex items-center gap-2 mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              Sales Trend
            </h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {selectedReport === 'purchases' && chartData.purchaseTrend && (
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-400" />
            <h4 className="card-title text-sm flex items-center gap-2 mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-orange-600" />
              Purchase Trend
            </h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.purchaseTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="cost" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Cost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {chartData.categoryDist && chartData.categoryDist.length > 0 && (
          <div className="card relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400" />
            <h4 className="card-title text-sm flex items-center gap-2 mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              Category Distribution
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.categoryDist} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {chartData.categoryDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex items-center">
                <div className="w-full space-y-2">
                  {chartData.categoryDist.map((d: any, i: number) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-400 flex-1">{d.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFilters = () => {
    if (!selectedReport) return null
    const filterTypes = FILTER_TYPES[selectedReport]
    if (!filterTypes || filterTypes.length === 0) return null

    return (
      <div className="flex flex-wrap gap-3 mb-5 items-end animate-fade-in">
        {filterTypes.includes('date') && (
          <>
            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-1">From</label>
              <input type="date" value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} className="input-field text-sm py-2 px-3 w-36" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-1">To</label>
              <input type="date" value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} className="input-field text-sm py-2 px-3 w-36" />
            </div>
          </>
        )}
        {filterTypes.includes('category') && (
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-1">Category</label>
            <select value={filters.category_id} onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))} className="select-field text-sm py-2 px-3 w-40">
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {filterTypes.includes('supplier') && (
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-1">Supplier</label>
            <select value={filters.supplier_id} onChange={e => setFilters(f => ({ ...f, supplier_id: e.target.value }))} className="select-field text-sm py-2 px-3 w-40">
              <option value="">All Suppliers</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
            </select>
          </div>
        )}
        {filterTypes.includes('search') && (
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="input-field text-sm py-2 pl-8 pr-3 w-40" placeholder="Invoice, name..." />
            </div>
          </div>
        )}
        <button onClick={() => handleExport(selectedReport, 'json')} disabled={loading === selectedReport + 'json'} className="btn-primary text-sm py-2 px-4">
          {loading === selectedReport + 'json' ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>
    )
  }

  const renderPreview = () => {
    if (!selectedReport) return null

    const columns = reportColumns[selectedReport]
    if (!columns) return null

    const isLoading = loading === selectedReport + 'json'

    if (isLoading) {
      return <TableSkeleton rows={5} />
    }

    if (!preview) return null

    const data = preview.data || []
    if (!Array.isArray(data)) return null

    const totalPages = Math.max(1, Math.ceil(data.length / perPage))
    const paginatedData = data.slice((page - 1) * perPage, page * perPage)

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No records found</p>
          <p className="text-xs mt-1">Try adjusting your date range or check back later.</p>
        </div>
      )
    }

    return (
      <>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {columns.map(col => (
                    <th key={col.key} className="table-header">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row: any, i: number) => (
                  <tr key={i} className="table-row animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                    {columns.map(col => (
                      <td key={col.key} className="table-cell">
                        {col.key === 'Total' || col.key === 'Cost' ? `₹${Number(row[col.key] ?? 0).toLocaleString()}` : String(row[col.key] ?? 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4">
          <Pagination page={page} pages={totalPages} total={data.length} onPageChange={setPage} />
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="page-title">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportTypes.map((report, i) => (
          <div key={report.id} className="card relative overflow-hidden card-hover cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => handleExport(report.id, 'json')}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${report.gradient}`} />
            <div className="flex items-center gap-3.5 mb-5">
              <div className={`w-11 h-11 bg-gradient-to-br ${report.gradient} rounded-xl flex items-center justify-center shadow-lg ${report.shadow} shrink-0`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{report.label}</h3>
                <p className="text-muted mt-0.5 truncate">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={(e) => { e.stopPropagation(); handleExport(report.id, 'json') }}
                disabled={loading === report.id + 'json'}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === report.id + 'json' ? (
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                Preview
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleExport(report.id, 'excel') }}
                disabled={loading === report.id + 'excel'}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === report.id + 'excel' ? (
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (preview || loading === selectedReport + 'json') && (
        <div className="card animate-fade-in-up relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Table className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              </span>
              <h3 className="card-title">{reportTypes.find(r => r.id === selectedReport)?.label} Preview</h3>
            </div>
            <div className="flex items-center gap-2">
              {(selectedReport === 'inventory' || selectedReport === 'sales' || selectedReport === 'purchases' || selectedReport === 'suppliers' || selectedReport === 'low-stock') && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleExport(selectedReport, 'csv') }}
                  disabled={loading === selectedReport + 'csv'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 active:scale-90"
                >
                  {loading === selectedReport + 'csv' ? '...' : 'CSV'}
                </button>
              )}
              <button onClick={() => { setPreview(null); setSelectedReport(null); setLoading(null) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 active:scale-90">
                <X className="w-3 h-3" /> Close
              </button>
            </div>
          </div>
          {renderFilters()}
          {renderSummaryCards()}
          {renderCharts()}
          {renderPreview()}
        </div>
      )}
    </div>
  )
}
