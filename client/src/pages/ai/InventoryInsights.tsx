import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, TrendingUp, AlertTriangle, Package, DollarSign,
  Layers, Clock, Skull, Search, Filter, CalendarDays,
  Download, FileText, Award, Zap, Minus, TrendingDown,
  ShoppingBag, ArrowUp, ArrowDown, Info, Brain
} from 'lucide-react'
import { aiService, categoryService, supplierService } from '../../services/dataService'
import {
  InsightsResponse, InsightsRecommendation,
  InsightsBestSeller, InsightsFastestGrowing, InsightsSlowMoving,
  InsightsOverstockAnalysis, InsightsDeadStock, InsightsCategory,
  InsightsSummaryCards
} from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const severityIcon: Record<string, any> = {
  success: Award,
  warning: AlertTriangle,
  danger: Skull,
  info: Info,
}

const severityColors: Record<string, string> = {
  success: 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300',
  warning: 'border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300',
  danger: 'border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  info: 'border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
}

const cardGradients: Record<string, string> = {
  best_selling_product: 'from-emerald-500 to-teal-600',
  fastest_growing_product: 'from-blue-500 to-indigo-600',
  slow_moving_product: 'from-orange-500 to-red-600',
  overstocked_product: 'from-amber-500 to-orange-600',
  highest_profit_product: 'from-purple-500 to-violet-600',
  highest_revenue_category: 'from-pink-500 to-rose-600',
  stock_out_risk_product: 'from-red-500 to-pink-600',
  dead_stock_product: 'from-gray-600 to-slate-700',
}

const cardIcons: Record<string, any> = {
  best_selling_product: Award,
  fastest_growing_product: TrendingUp,
  slow_moving_product: Minus,
  overstocked_product: Package,
  highest_profit_product: DollarSign,
  highest_revenue_category: Layers,
  stock_out_risk_product: AlertTriangle,
  dead_stock_product: Skull,
}

function SummaryCard({ title, icon: Icon, gradient, onClick, children }: { title: string; icon: any; gradient: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClick} className={`card animate-fade-in-up ${onClick ? 'cursor-pointer hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, valueClass }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted">{label}</span>
      <span className={`text-xs font-semibold text-gray-900 dark:text-white tabular-nums ${valueClass || ''}`}>{value ?? 'N/A'}</span>
    </div>
  )
}

export default function InventoryInsights() {
  const navigate = useNavigate()
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: number; supplier_name: string }[]>([])

  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    const params: any = {}
    if (filterDateFrom) params.date_from = filterDateFrom
    if (filterDateTo) params.date_to = filterDateTo
    if (filterCategory) params.category_id = filterCategory
    if (filterSupplier) params.supplier_id = filterSupplier
    aiService.getInsights(params).then(r => {
      setData(r.data)
    }).catch(() => {
      toast.error('Failed to load insights')
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    categoryService.getAll({ per_page: 100 }).then(r => {
      setCategories(r.data.categories || [])
    }).catch(() => {})
    supplierService.getAll({ per_page: 100 }).then(r => {
      setSuppliers(r.data.suppliers || [])
    }).catch(() => {})
  }, [])

  const handleFilter = () => {
    fetchData()
    setActiveSection(null)
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    setTimeout(() => {
      document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const handleExportPDF = async () => {
    if (!data) return
    setExporting('pdf')
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFontSize(18)
      doc.text('Inventory Insights Report', pageWidth / 2, 20, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date(data.generated_at).toLocaleString('en-IN')}`, pageWidth / 2, 27, { align: 'center' })

      let y = 35

      // Summary Cards
      doc.setFontSize(12)
      doc.text('Key Insights', 14, y)
      y += 7

      const card = data.summary_cards
      const lines: string[] = []
      if (card.best_selling_product) lines.push(`Best Seller: ${card.best_selling_product.product_name} (${card.best_selling_product.units_sold} units)`)
      if (card.fastest_growing_product) lines.push(`Fastest Growing: ${card.fastest_growing_product.product_name} (${card.fastest_growing_product.growth_percent}% growth)`)
      if (card.slow_moving_product) lines.push(`Slow Moving: ${card.slow_moving_product.product_name} (${card.slow_moving_product.days_without_sale} days unsold)`)
      if (card.overstocked_product) lines.push(`Overstocked: ${card.overstocked_product.product_name} (${card.overstocked_product.months_remaining} months of stock)`)
      if (card.stock_out_risk_product) lines.push(`Stock-Out Risk: ${card.stock_out_risk_product.product_name} (${card.stock_out_risk_product.days_remaining} days left)`)
      if (card.dead_stock_product) lines.push(`Dead Stock: ${card.dead_stock_product.product_name} (${card.dead_stock_product.days_unsold} days unsold)`)
      if (card.highest_revenue_category) lines.push(`Top Category: ${card.highest_revenue_category.category_name}`)

      doc.setFontSize(9)
      lines.forEach((l, i) => {
        doc.text(l, 14, y + i * 5)
      })
      y += lines.length * 5 + 5

      // Best Sellers table
      if (data.best_sellers.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Product', 'SKU', 'Units Sold', 'Revenue', 'Profit']],
          body: data.best_sellers.slice(0, 10).map(r => [r.product_name, r.sku, r.units_sold, `Rs.${r.revenue.toFixed(0)}`, `Rs.${r.profit.toFixed(0)}`]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
          styles: { fontSize: 8 },
        })
        y = (doc as any).lastAutoTable.finalY + 5
      }

      // Slow moving
      if (data.slow_moving.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Slow Moving Products', 'SKU', 'Days Unsold', 'Stock', 'Recommendation']],
          body: data.slow_moving.slice(0, 10).map(r => [r.product_name, r.sku, r.days_without_sale, r.current_stock, r.recommendation]),
          theme: 'striped',
          headStyles: { fillColor: [245, 158, 11], fontSize: 9 },
          styles: { fontSize: 8 },
        })
        y = (doc as any).lastAutoTable.finalY + 5
      }

      // Dead stock
      if (data.dead_stock.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Dead Stock', 'SKU', 'Days Unsold', 'Stock Value', 'Recommendation']],
          body: data.dead_stock.slice(0, 10).map(r => [r.product_name, r.sku, r.days_unsold, `Rs.${r.stock_value.toFixed(0)}`, r.recommendation]),
          theme: 'striped',
          headStyles: { fillColor: [107, 114, 128], fontSize: 9 },
          styles: { fontSize: 8 },
        })
      }

      doc.save('inventory_insights.pdf')
      toast.success('PDF exported')
    } catch {
      toast.error('PDF export failed')
    } finally {
      setExporting(null)
    }
  }

  const handleExportExcel = () => {
    if (!data) return
    setExporting('excel')
    try {
      let csv = '\uFEFF'
      csv += 'Inventory Insights Report\n'
      csv += `Generated,${new Date(data.generated_at).toLocaleString('en-IN')}\n\n`

      // Best Sellers
      csv += 'Best Sellers (Top 10)\n'
      csv += 'Product,SKU,Category,Units Sold,Revenue,Profit\n'
      data.best_sellers.forEach(r => {
        csv += `"${r.product_name}",${r.sku},"${r.category}",${r.units_sold},${r.revenue},${r.profit}\n`
      })
      csv += '\n'

      // Slow Moving
      csv += 'Slow Moving Products\n'
      csv += 'Product,SKU,Days Without Sale,Current Stock,Recommendation\n'
      data.slow_moving.forEach(r => {
        csv += `"${r.product_name}",${r.sku},${r.days_without_sale},${r.current_stock},"${r.recommendation}"\n`
      })
      csv += '\n'

      // Category Insights
      csv += 'Category Insights\n'
      csv += 'Category,Total Revenue,Total Profit,Sales Growth (%),Stock Value\n'
      data.category_insights.forEach(r => {
        csv += `"${r.category_name}",${r.total_revenue},${r.total_profit},${r.sales_growth},${r.stock_value}\n`
      })
      csv += '\n'

      // AI Recommendations
      csv += 'AI Recommendations\n'
      csv += 'Type,Message\n'
      data.ai_recommendations.forEach(r => {
        csv += `"${r.type}","${r.message}"\n`
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory_insights.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  const sc = data?.summary_cards
  const sections = [
    { id: 'best_sellers', label: 'Best Selling Products', count: data?.best_sellers?.length || 0 },
    { id: 'fastest_growing', label: 'Fastest Growing Products', count: data?.fastest_growing?.length || 0 },
    { id: 'slow_moving', label: 'Slow Moving Products', count: data?.slow_moving?.length || 0 },
    { id: 'overstock', label: 'Overstock Analysis', count: data?.overstock_analysis?.length || 0 },
    { id: 'dead_stock', label: 'Dead Stock', count: data?.dead_stock?.length || 0 },
    { id: 'categories', label: 'Category Insights', count: data?.category_insights?.length || 0 },
    { id: 'recommendations', label: 'AI Recommendations', count: data?.ai_recommendations?.length || 0 },
    { id: 'charts', label: 'Charts & Visualizations', count: 5 },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            className="input-field w-40" placeholder="From" />
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            className="input-field w-40" placeholder="To" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="select-field w-44">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="select-field w-44">
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
          </select>
          <button onClick={handleFilter} className="btn-primary">
            <Search className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="flex items-center gap-2">
        <button onClick={handleExportPDF} disabled={exporting === 'pdf' || loading}
          className="btn-secondary">
          {exporting === 'pdf' ? <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <FileText className="w-3.5 h-3.5" />}
          PDF
        </button>
        <button onClick={handleExportExcel} disabled={exporting === 'excel' || loading}
          className="btn-secondary">
          {exporting === 'excel' ? <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <Download className="w-3.5 h-3.5" />}
          Excel
        </button>
        {data?.filtered && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 ml-2">
            <Filter className="w-3 h-3" /> Filtered
          </span>
        )}
      </div>

      {/* Section Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}>
            {s.label} ({s.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <CardSkeleton key={i} count={1} />)}
          </div>
          <ChartSkeleton />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">No data available</p>
          <p className="text-sm">Try adjusting the filters or adding sales data.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sc?.best_selling_product && (
              <SummaryCard title="Best Selling" icon={Award} gradient={cardGradients.best_selling_product} onClick={() => scrollToSection('best_sellers')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.best_selling_product.product_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Units Sold" value={sc.best_selling_product.units_sold} />
                  <InfoRow label="Revenue" value={`Rs.${(sc.best_selling_product.revenue || 0).toLocaleString('en-IN')}`} />
                </div>
              </SummaryCard>
            )}
            {sc?.fastest_growing_product && (
              <SummaryCard title="Fastest Growing" icon={TrendingUp} gradient={cardGradients.fastest_growing_product} onClick={() => scrollToSection('fastest_growing')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.fastest_growing_product.product_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Growth" value={`${sc.fastest_growing_product.growth_percent}%`} valueClass="text-green-600 dark:text-green-400" />
                  <InfoRow label="Prev → Current" value={`${sc.fastest_growing_product.prev_month} → ${sc.fastest_growing_product.current_month}`} />
                </div>
              </SummaryCard>
            )}
            {sc?.slow_moving_product && (
              <SummaryCard title="Slow Moving" icon={Minus} gradient={cardGradients.slow_moving_product} onClick={() => scrollToSection('slow_moving')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.slow_moving_product.product_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Days Unsold" value={sc.slow_moving_product.days_without_sale} />
                  <InfoRow label="Stock" value={sc.slow_moving_product.current_stock} />
                </div>
              </SummaryCard>
            )}
            {sc?.overstocked_product && (
              <SummaryCard title="Overstocked" icon={Package} gradient={cardGradients.overstocked_product} onClick={() => scrollToSection('overstock')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.overstocked_product.product_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Stock" value={sc.overstocked_product.current_stock} />
                  <InfoRow label="Months Remaining" value={sc.overstocked_product.months_remaining} />
                </div>
              </SummaryCard>
            )}
            {sc?.highest_profit_product && (
              <SummaryCard title="Highest Profit" icon={DollarSign} gradient={cardGradients.highest_profit_product} onClick={() => scrollToSection('best_sellers')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.highest_profit_product.product_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Profit" value={`Rs.${(sc.highest_profit_product.profit || 0).toLocaleString('en-IN')}`} />
                  <InfoRow label="Margin" value={`${sc.highest_profit_product.margin_percent}%`} />
                </div>
              </SummaryCard>
            )}
            {sc?.highest_revenue_category && (
              <SummaryCard title="Top Revenue" icon={Layers} gradient={cardGradients.highest_revenue_category} onClick={() => scrollToSection('categories')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.highest_revenue_category.category_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Revenue" value={`Rs.${(sc.highest_revenue_category.revenue || 0).toLocaleString('en-IN')}`} />
                </div>
              </SummaryCard>
            )}
            {sc?.stock_out_risk_product && (
              <SummaryCard title="Stock-Out Risk" icon={AlertTriangle} gradient={cardGradients.stock_out_risk_product} onClick={() => scrollToSection('recommendations')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.stock_out_risk_product.product_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Stock Left" value={sc.stock_out_risk_product.current_stock} />
                  <InfoRow label="Days Remaining" value={sc.stock_out_risk_product.days_remaining} valueClass="text-red-600 dark:text-red-400" />
                </div>
              </SummaryCard>
            )}
            {sc?.dead_stock_product && (
              <SummaryCard title="Dead Stock" icon={Skull} gradient={cardGradients.dead_stock_product} onClick={() => scrollToSection('dead_stock')}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sc.dead_stock_product.product_name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <InfoRow label="Days Unsold" value={sc.dead_stock_product.days_unsold} />
                  <InfoRow label="Stock Value" value={`Rs.${(sc.dead_stock_product.stock_value || 0).toLocaleString('en-IN')}`} />
                </div>
              </SummaryCard>
            )}
          </div>

          {/* Best Sellers */}
          {(!activeSection || activeSection === 'best_sellers') && data.best_sellers.length > 0 && (
            <div id="section-best_sellers" className="card animate-fade-in-up">
              <h3 className="card-title mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" /> Best Selling Products <span className="text-xs font-normal text-gray-400">(Top 10)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header text-left">Product</th>
                      <th className="table-header text-left">SKU</th>
                      <th className="table-header text-left">Category</th>
                      <th className="table-header text-right">Units Sold</th>
                      <th className="table-header text-right">Revenue</th>
                      <th className="table-header text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.best_sellers.map((r: InsightsBestSeller, i: number) => (
                      <tr key={i} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 20}ms` }} onClick={() => navigate('/products')}>
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{r.product_name}</td>
                        <td className="table-cell font-mono text-xs">{r.sku}</td>
                        <td className="table-cell text-right tabular-nums">{r.units_sold}</td>
                        <td className="table-cell text-right tabular-nums">Rs.{(r.revenue || 0).toLocaleString('en-IN')}</td>
                        <td className="table-cell text-right tabular-nums font-semibold text-green-600 dark:text-green-400">{r.profit ? `Rs.${r.profit.toLocaleString('en-IN')}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fastest Growing */}
          {(!activeSection || activeSection === 'fastest_growing') && data.fastest_growing.length > 0 && (
            <div id="section-fastest_growing" className="card animate-fade-in-up">
              <h3 className="card-title mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Fastest Growing Products
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header text-left">Product</th>
                      <th className="table-header text-left">SKU</th>
                      <th className="table-header text-right">Growth %</th>
                      <th className="table-header text-right">Prev Month</th>
                      <th className="table-header text-right">Current Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fastest_growing.map((r: InsightsFastestGrowing, i: number) => (
                      <tr key={i} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 20}ms` }} onClick={() => navigate('/products')}>
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{r.product_name}</td>
                        <td className="table-cell font-mono text-xs">{r.sku}</td>
                        <td className="table-cell text-right">
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold tabular-nums">
                            <ArrowUp className="w-3 h-3" /> {r.growth_percent}%
                          </span>
                        </td>
                        <td className="table-cell text-right tabular-nums">{r.prev_month}</td>
                        <td className="table-cell text-right tabular-nums font-semibold">{r.current_month}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slow Moving */}
          {(!activeSection || activeSection === 'slow_moving') && data.slow_moving.length > 0 && (
            <div id="section-slow_moving" className="card animate-fade-in-up">
              <h3 className="card-title mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" /> Slow Moving Products
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header text-left">Product</th>
                      <th className="table-header text-left">SKU</th>
                      <th className="table-header text-right">Last Sold</th>
                      <th className="table-header text-right">Days Unsold</th>
                      <th className="table-header text-right">Stock</th>
                      <th className="table-header text-left">AI Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slow_moving.map((r: InsightsSlowMoving, i: number) => (
                      <tr key={i} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 20}ms` }} onClick={() => navigate('/products')}>
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{r.product_name}</td>
                        <td className="table-cell font-mono text-xs">{r.sku}</td>
                        <td className="table-cell text-right tabular-nums text-xs">{r.last_sold_date ? new Date(r.last_sold_date).toLocaleDateString('en-IN') : 'Never'}</td>
                        <td className="table-cell text-right tabular-nums font-semibold text-orange-600 dark:text-orange-400">{r.days_without_sale}</td>
                        <td className="table-cell text-right tabular-nums">{r.current_stock}</td>
                        <td className="table-cell text-muted max-w-[200px] truncate">{r.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Overstock Analysis */}
          {(!activeSection || activeSection === 'overstock') && data.overstock_analysis.length > 0 && (
            <div id="section-overstock" className="card animate-fade-in-up">
              <h3 className="card-title mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" /> Overstock Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header text-left">Product</th>
                      <th className="table-header text-left">SKU</th>
                      <th className="table-header text-right">Stock</th>
                      <th className="table-header text-right">Avg Monthly Sales</th>
                      <th className="table-header text-right">Est. Months</th>
                      <th className="table-header text-left">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.overstock_analysis.map((r: InsightsOverstockAnalysis, i: number) => (
                      <tr key={i} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 20}ms` }} onClick={() => navigate('/products')}>
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{r.product_name}</td>
                        <td className="table-cell font-mono text-xs">{r.sku}</td>
                        <td className="table-cell text-right tabular-nums font-semibold">{r.current_stock}</td>
                        <td className="table-cell text-right tabular-nums">{r.avg_monthly_sales}</td>
                        <td className="table-cell text-right tabular-nums text-amber-600 dark:text-amber-400 font-semibold">{r.months_remaining}</td>
                        <td className="table-cell text-muted max-w-[200px] truncate">{r.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dead Stock */}
          {(!activeSection || activeSection === 'dead_stock') && data.dead_stock.length > 0 && (
            <div id="section-dead_stock" className="card animate-fade-in-up">
              <h3 className="card-title mb-3 flex items-center gap-2">
                <Skull className="w-4 h-4 text-gray-500" /> Dead Stock
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header text-left">Product</th>
                      <th className="table-header text-left">SKU</th>
                      <th className="table-header text-right">Days Unsold</th>
                      <th className="table-header text-right">Stock Value</th>
                      <th className="table-header text-left">AI Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dead_stock.map((r: InsightsDeadStock, i: number) => (
                      <tr key={i} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 20}ms` }} onClick={() => navigate('/products')}>
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{r.product_name}</td>
                        <td className="table-cell font-mono text-xs">{r.sku}</td>
                        <td className="table-cell text-right tabular-nums font-semibold text-red-600 dark:text-red-400">{r.days_unsold}</td>
                        <td className="table-cell text-right tabular-nums">Rs.{r.stock_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="table-cell text-muted max-w-[200px] truncate">{r.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Category Insights */}
          {(!activeSection || activeSection === 'categories') && data.category_insights.length > 0 && (
            <div id="section-categories" className="card animate-fade-in-up">
              <h3 className="card-title mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> Category Insights
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header text-left">Category</th>
                      <th className="table-header text-right">Total Revenue</th>
                      <th className="table-header text-right">Total Profit</th>
                      <th className="table-header text-right">Sales Growth</th>
                      <th className="table-header text-right">Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.category_insights.map((r: InsightsCategory, i: number) => (
                      <tr key={i} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 20}ms` }} onClick={() => navigate('/products')}>
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{r.category_name}</td>
                        <td className="table-cell text-right tabular-nums">Rs.{r.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="table-cell text-right tabular-nums text-emerald-600 dark:text-emerald-400">Rs.{r.total_profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="table-cell text-right tabular-nums">
                          <span className={`inline-flex items-center gap-1 font-semibold ${r.sales_growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {r.sales_growth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(r.sales_growth)}%
                          </span>
                        </td>
                        <td className="table-cell text-right tabular-nums">Rs.{r.stock_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {(!activeSection || activeSection === 'recommendations') && data.ai_recommendations.length > 0 && (
            <div id="section-recommendations" className="animate-fade-in-up">
              <h3 className="card-title mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary-600" /> AI Recommendations
              </h3>
              <div className="space-y-2">
                {data.ai_recommendations.map((r: InsightsRecommendation, i: number) => {
                  const Icon = severityIcon[r.severity] || Info
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${severityColors[r.severity]} animate-fade-in`} style={{ animationDelay: `${i * 30}ms` }}>
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                        r.severity === 'success' ? 'text-emerald-500' :
                        r.severity === 'warning' ? 'text-amber-500' :
                        r.severity === 'danger' ? 'text-red-500' : 'text-blue-500'
                      }`} />
                      <p className="text-sm leading-relaxed">{r.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Charts */}
          {(!activeSection || activeSection === 'charts') && (
            <div className="animate-fade-in-up space-y-4">
              <h3 className="card-title flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-600" /> Charts & Visualizations
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Selling Products */}
                {data.chart_data.top_selling_products.labels.length > 0 && (
                  <div className="card">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Selling Products</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chart_data.top_selling_products.labels.map((l, i) => ({ name: l, value: data.chart_data.top_selling_products.values[i] }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Revenue by Category */}
                {data.chart_data.revenue_by_category.labels.length > 0 && (
                  <div className="card">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Revenue by Category</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.chart_data.revenue_by_category.labels.map((l, i) => ({ name: l, value: data.chart_data.revenue_by_category.values[i] }))}
                            cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {data.chart_data.revenue_by_category.labels.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Profit by Category */}
                {data.chart_data.profit_by_category.labels.length > 0 && (
                  <div className="card">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Profit by Category</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.chart_data.profit_by_category.labels.map((l, i) => ({ name: l, value: Math.max(0, data.chart_data.profit_by_category.values[i]) }))}
                            cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {data.chart_data.profit_by_category.labels.map((_, i) => (
                              <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Sales Growth Trend */}
                {data.chart_data.sales_growth_trend.labels.length > 0 && (
                  <div className="card">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sales Growth Trend</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.chart_data.sales_growth_trend.labels.map((l, i) => ({ name: l, value: data.chart_data.sales_growth_trend.values[i] }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Stock Distribution */}
                {data.chart_data.stock_distribution.labels.length > 0 && (
                  <div className="card">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Stock Distribution by Category</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chart_data.stock_distribution.labels.map((l, i) => ({ name: l, value: data.chart_data.stock_distribution.values[i] }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
