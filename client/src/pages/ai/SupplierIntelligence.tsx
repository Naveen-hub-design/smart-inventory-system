import { useState, useEffect } from 'react'
import {
  Truck, Building2, Award, Shield, Zap, DollarSign, Star,
  Search, Filter, Download, FileText, TrendingUp, Clock,
  CheckCircle, XCircle, AlertTriangle, Info, Brain, BarChart3,
  ArrowUp, ArrowDown, Layers, Package, ShoppingCart, TrendingDown, Hash
} from 'lucide-react'
import { aiService, categoryService, supplierService } from '../../services/dataService'
import {
  SupplierIntelResponse, SupplierScore, SupplierPerformanceRow,
  SupplierRecommendation, PurchaseRecommendation,
  SupplierInsight, SupplierRiskItem
} from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const riskColors: Record<string, string> = {
  'Low Risk': 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30',
  'Medium Risk': 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30',
  'High Risk': 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30',
}

const rankingTierColors: Record<string, string> = {
  'Platinum': 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/30',
  'Gold': 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30',
  'Silver': 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/30',
  'Bronze': 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30',
  'Needs Improvement': 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30',
}

const statusGradients: Record<string, string> = {
  'Excellent': 'from-emerald-500 to-teal-600',
  'Good': 'from-blue-500 to-indigo-600',
  'Average': 'from-amber-500 to-orange-600',
  'Poor': 'from-red-500 to-pink-600',
}

const rankingTierGradients: Record<string, string> = {
  'Platinum': 'from-indigo-500 to-violet-600',
  'Gold': 'from-yellow-500 to-amber-600',
  'Silver': 'from-slate-400 to-slate-500',
  'Bronze': 'from-orange-500 to-amber-600',
  'Needs Improvement': 'from-red-500 to-pink-600',
}

const statusScoreColors: Record<string, string> = {
  'Excellent': 'text-emerald-600',
  'Good': 'text-blue-600',
  'Average': 'text-amber-600',
  'Poor': 'text-red-600',
}

const insightIcons: Record<string, any> = {
  positive: CheckCircle,
  negative: XCircle,
  warning: AlertTriangle,
}

const insightColors: Record<string, string> = {
  positive: 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300',
  negative: 'border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  warning: 'border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300',
}

function SummaryCard({ title, icon: Icon, gradient, value, sub }: { title: string; icon: any; gradient: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4 animate-fade-in-up">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value ?? 'N/A'}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

const rankingEmoji: Record<string, string> = {
  'Platinum': '🏆', 'Gold': '🥇', 'Silver': '🥈', 'Bronze': '🥉', 'Needs Improvement': '⚠',
}

function ScoreBadge({ score, status, tier }: { score: number; status: string; tier?: string }) {
  const color = score >= 90 ? 'stroke-emerald-500' : score >= 75 ? 'stroke-blue-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500'
  return (
    <div className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx="18" cy="18" r="15" fill="none" className={color} strokeWidth="3"
          strokeDasharray={`${score * 0.942} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        <text x="18" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor"
          className={statusScoreColors[status] || 'text-gray-600'}>{score}</text>
      </svg>
      <div className="flex flex-col items-start gap-0.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
          status === 'Excellent' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
          status === 'Good' ? 'border-blue-200 text-blue-700 bg-blue-50' :
          status === 'Average' ? 'border-amber-200 text-amber-700 bg-amber-50' :
          'border-red-200 text-red-700 bg-red-50'
        }`}>{status}</span>
        {tier && <span className="text-[11px]">{rankingEmoji[tier] || ''} {tier}</span>}
      </div>
    </div>
  )
}

function RiskItemCard({ item }: { item: SupplierRiskItem }) {
  const borderColor = item.risk_level === 'Low Risk' ? 'border-emerald-200 dark:border-emerald-800/30' :
    item.risk_level === 'Medium Risk' ? 'border-amber-200 dark:border-amber-800/30' :
    'border-red-200 dark:border-red-800/30'
  const bgColor = item.risk_level === 'Low Risk' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
    item.risk_level === 'Medium Risk' ? 'bg-amber-50 dark:bg-amber-900/20' :
    'bg-red-50 dark:bg-red-900/20'
  return (
    <div className={`p-3 rounded-xl border ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.supplier_name}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${riskColors[item.risk_level] || ''}`}>{item.risk_level}</span>
      </div>
      {item.supplier_code && <p className="text-[10px] font-mono text-gray-400 mb-1.5">{item.supplier_code}</p>}
      <ul className="space-y-0.5">
        {item.reasons.map((r, j) => (
          <li key={j} className="text-[11px] text-gray-600 dark:text-gray-300 flex items-start gap-1">
            <span className="text-gray-400 mt-0.5">·</span> {r}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function SupplierIntelligence() {
  const [data, setData] = useState<SupplierIntelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: number; supplier_name: string }[]>([])
  const [products, setProducts] = useState<{ id: number; product_name: string }[]>([])
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterPerformance, setFilterPerformance] = useState('')
  const [compareIds, setCompareIds] = useState<number[]>([])

  const fetchData = () => {
    setLoading(true)
    const params: any = {}
    if (filterSupplier) params.supplier_id = filterSupplier
    if (filterCategory) params.category_id = filterCategory
    if (filterProduct) params.product_id = filterProduct
    if (filterDateFrom) params.date_from = filterDateFrom
    if (filterDateTo) params.date_to = filterDateTo
    if (filterPerformance) params.performance_level = filterPerformance
    aiService.getSupplierIntel(params).then(r => {
      setData(r.data)
    }).catch(() => toast.error('Failed to load supplier data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    categoryService.getAll({ per_page: 100 }).then(r => setCategories(r.data.categories || [])).catch(() => {})
    supplierService.getAll({ per_page: 100 }).then(r => setSuppliers(r.data.suppliers || [])).catch(() => {})
    import('../../services/dataService').then(m => m.productService.getAll({ per_page: 500 }).then(r => setProducts(r.data.products || [])).catch(() => {}))
  }, [])

  const toggleCompare = (name: string) => {
    const s = data?.supplier_scores.find(x => x.supplier_name === name)
    if (!s) return
    const id = data!.supplier_scores.indexOf(s)
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(x => x !== id))
    } else {
      setCompareIds([...compareIds.slice(-2), id])
    }
  }

  const handleExportPDF = async () => {
    if (!data) return
    setExporting('pdf')
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()
      const pw = doc.internal.pageSize.getWidth()

      doc.setFontSize(18)
      doc.text('Supplier Intelligence Report', pw / 2, 20, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date(data.generated_at).toLocaleString('en-IN')}`, pw / 2, 27, { align: 'center' })

      let y = 35
      const sc = data.summary_cards
      doc.setFontSize(12); doc.text('Overview', 14, y); y += 7
      doc.setFontSize(9)
      const overviewLines = [
        `Total Suppliers: ${sc.total_suppliers} (${sc.active_suppliers} active, ${sc.preferred_suppliers} preferred, ${sc.high_risk_suppliers} high risk)`,
        `Average Rating: ${sc.average_rating}/100`,
        `Avg Delivery Time: ${sc.avg_delivery_time_days} days since last order`,
        `Avg Purchase Cost: Rs.${sc.avg_purchase_cost.toFixed(2)} per unit`,
        `Order Success Rate: ${sc.avg_order_success_rate}%`,
        `Total Purchase Value: Rs.${sc.total_purchase_value.toFixed(0)}`,
      ]
      overviewLines.forEach(l => { doc.text(l, 14, y); y += 5 })
      y += 3

      if (data.performance_table.length > 0) {
        autoTable(doc, {
          startY: y, head: [['Supplier', 'Code', 'Products', 'Orders', 'Cmpltd', 'Cancld', 'Value', 'Avg Cost', 'On-Time%', 'Rating', 'Tier']],
          body: data.performance_table.map(r => [r.supplier_name, r.supplier_code, r.products_supplied, r.total_orders, r.completed_orders, r.cancelled_orders, `Rs.${r.total_value.toFixed(0)}`, `Rs.${r.avg_product_cost?.toFixed(2) || 'N/A'}`, `${r.on_time_delivery}%`, `${r.overall_rating}`, r.ranking_tier]),
          theme: 'striped', headStyles: { fillColor: [59, 130, 246], fontSize: 9 }, styles: { fontSize: 8 },
        })
        y = (doc as any).lastAutoTable.finalY + 5
      }
      doc.save('supplier_intelligence.pdf')
      toast.success('PDF exported')
    } catch { toast.error('PDF export failed') }
    finally { setExporting(null) }
  }

  const handleExportExcel = () => {
    if (!data) return; setExporting('excel')
    try {
      let csv = '\uFEFF'; csv += 'Supplier Intelligence Report\n'
      csv += `Generated,${new Date(data.generated_at).toLocaleString('en-IN')}\n\n`
      csv += 'Performance Table\n'
      csv += 'Supplier,Code,Products,Orders,Completed,Cancelled,Value,Avg Price,Avg Cost,On-Time %,Rating,Tier,Risk\n'
      data.performance_table.forEach(r => {
        csv += `"${r.supplier_name}","${r.supplier_code}",${r.products_supplied},${r.total_orders},${r.completed_orders},${r.cancelled_orders},${r.total_value},${r.avg_unit_price},${r.avg_product_cost || ''},${r.on_time_delivery},${r.overall_rating},"${r.ranking_tier}","${r.risk_level}"\n`
      })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'supplier_intelligence.csv'
      a.click(); URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch { toast.error('Export failed') }
    finally { setExporting(null) }
  }

  const sc = data?.summary_cards
  const chartData = data?.chart_data

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 w-40" />
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 w-40" />
          <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 w-44">
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 w-44">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 w-48">
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
          </select>
          <select value={filterPerformance} onChange={e => setFilterPerformance(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 w-36">
            <option value="">All Tiers</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
            <option value="needs improvement">Needs Improvement</option>
          </select>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200 px-4">
            <Search className="w-3.5 h-3.5" /> Apply
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleExportPDF} disabled={exporting === 'pdf' || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">
          {exporting === 'pdf' ? <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <FileText className="w-3.5 h-3.5" />} PDF
        </button>
        <button onClick={handleExportExcel} disabled={exporting === 'excel' || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">
          {exporting === 'excel' ? <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <Download className="w-3.5 h-3.5" />} Excel
        </button>
        {data?.filtered && <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 ml-2"><Filter className="w-3 h-3" /> Filtered</span>}
      </div>

      {loading ? (
        <div className="space-y-4"><CardSkeleton count={6} /><ChartSkeleton /></div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <Truck className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">No supplier data available</p>
          <p className="text-sm">Add suppliers and purchase orders to enable supplier intelligence.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard title="Total Suppliers" icon={Building2} gradient="from-blue-500 to-indigo-600" value={sc?.total_suppliers ?? 0} sub={`${sc?.active_suppliers ?? 0} active · ${sc?.preferred_suppliers ?? 0} preferred`} />
            <SummaryCard title="Average Rating" icon={Star} gradient="from-amber-500 to-orange-600" value={sc?.average_rating ? `${sc.average_rating}` : 'N/A'} sub={`/ 100`} />
            <SummaryCard title="Avg Delivery Time" icon={Clock} gradient="from-cyan-500 to-blue-600" value={sc?.avg_delivery_time_days ? `${sc.avg_delivery_time_days}d` : 'N/A'} sub="Since last order" />
            <SummaryCard title="Avg Purchase Cost" icon={Hash} gradient="from-violet-500 to-purple-600" value={sc?.avg_purchase_cost ? `Rs.${sc.avg_purchase_cost.toFixed(2)}` : 'N/A'} sub="Per unit" />
            <SummaryCard title="Total Purchase Value" icon={DollarSign} gradient="from-orange-500 to-red-600" value={sc?.total_purchase_value ? `Rs.${(sc.total_purchase_value / 1000).toFixed(0)}K` : 'N/A'} sub="Across all suppliers" />
            <SummaryCard title="High Risk Suppliers" icon={AlertTriangle} gradient="from-red-500 to-pink-600" value={sc?.high_risk_suppliers ?? 0} sub={sc?.high_risk_suppliers ? 'Require attention' : 'All clear'} />
          </div>

          {/* Supplier Scores Grid */}
          <div className="card p-5 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary-600" /> AI Supplier Scores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.supplier_scores.map((s: SupplierScore, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.supplier_name}</p>
                      <p className="text-[10px] font-mono text-gray-400 truncate">{s.supplier_code}</p>
                    </div>
                    <ScoreBadge score={s.overall_score} status={s.overall_status} tier={s.ranking_tier} />
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {[
                      { label: 'Delivery', score: s.delivery_score, color: '#3b82f6' },
                      { label: 'Pricing', score: s.pricing_score, color: '#10b981' },
                      { label: 'Completion', score: s.completion_score, color: '#f59e0b' },
                      { label: 'Quality', score: s.quality_score, color: '#8b5cf6' },
                      { label: 'Return Rate', score: s.return_rate, color: '#ec4899' },
                      { label: 'Consistency', score: s.delivery_consistency, color: '#14b8a6' },
                    ].map((f, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="w-16 text-gray-500 dark:text-gray-400">{f.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${f.score}%`, backgroundColor: f.color }} />
                        </div>
                        <span className="w-6 text-right font-semibold text-gray-700 dark:text-gray-300">{Math.round(f.score)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${riskColors[s.risk_level] || ''}`}>{s.risk_level}</span>
                    <button onClick={() => toggleCompare(s.supplier_name)}
                      className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                        compareIds.includes(i) ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}>
                      {compareIds.includes(i) ? 'Selected' : 'Compare'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison View */}
          {compareIds.length >= 2 && (
            <div className="card p-5 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-600" /> Supplier Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-left">Metric</th>
                      {compareIds.map(id => (
                        <th key={id} className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-center">
                          {data.supplier_scores[id]?.supplier_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Overall Score', key: 'overall_score' },
                      { label: 'Delivery', key: 'delivery_score' },
                      { label: 'Pricing', key: 'pricing_score' },
                      { label: 'Completion', key: 'completion_score' },
                      { label: 'Quality', key: 'quality_score' },
                      { label: 'Return Rate', key: 'return_rate' },
                      { label: 'Consistency', key: 'delivery_consistency' },
                    ].map((metric, j) => (
                      <tr key={j} className="group border-b border-gray-50 dark:border-gray-800/20 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all duration-200">
                        <td className="py-2 px-3 font-medium text-gray-700 dark:text-gray-300">{metric.label}</td>
                        {compareIds.map(id => {
                          const val = (data.supplier_scores[id] as any)?.[metric.key] ?? 0
                          const isBest = compareIds.every(otherId => {
                            const otherVal = (data.supplier_scores[otherId] as any)?.[metric.key] ?? 0
                            return val >= otherVal
                          })
                          return (
                            <td key={id} className={`py-2 px-3 text-center font-semibold tabular-nums ${isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                              {typeof val === 'number' ? Math.round(val) : val}
                              {isBest && j === 0 && ' *'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setCompareIds([])} className="text-xs text-gray-400 hover:text-gray-600 mt-2 transition-colors">Clear comparison</button>
            </div>
          )}

          {/* Performance Table */}
          {data.performance_table.length > 0 && (
            <div className="card p-5 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-600" /> Supplier Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-left">Supplier</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-left">Code</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Products</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Orders</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Cmpltd</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Cancld</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Value</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Avg Price</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Avg Cost</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">On-Time %</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Rating</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-center">Rank</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-center">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.performance_table.map((r: SupplierPerformanceRow, i: number) => (
                      <tr key={i} className="group border-b border-gray-50 dark:border-gray-800/20 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{r.supplier_name}</td>
                        <td className="py-2 px-3 text-left font-mono text-[11px] text-gray-500">{r.supplier_code}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.products_supplied}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.total_orders}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-emerald-600">{r.completed_orders}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-red-500">{r.cancelled_orders}</td>
                        <td className="py-2 px-3 text-right tabular-nums">Rs.{r.total_value.toFixed(0)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">Rs.{r.avg_unit_price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-mono text-[11px] text-gray-500">{r.avg_product_cost ? `Rs.${r.avg_product_cost.toFixed(2)}` : 'N/A'}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.on_time_delivery}%</td>
                        <td className="py-2 px-3 text-right tabular-nums font-bold">{r.overall_rating.toFixed(0)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${rankingTierColors[r.ranking_tier] || ''}`}>{r.ranking_tier}</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${riskColors[r.risk_level] || ''}`}>{r.risk_level}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="card p-5 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary-600" /> Best Supplier Recommendations
              </h3>
              <div className="space-y-3">
                {data.recommendations.slice(0, 10).map((r: SupplierRecommendation, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 animate-fade-in">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Package className="w-3.5 h-3.5 text-primary-500" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.product_name}</span>
                          <span className="text-[10px] font-mono text-gray-400">{r.sku}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Truck className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{r.supplier_name}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30">
                        {r.confidence}% confidence
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                        <p className="text-[10px] text-gray-500">Avg Cost</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">Rs.{r.avg_cost.toFixed(2)}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                        <p className="text-[10px] text-gray-500">Delivery</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{r.delivery_days}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                        <p className="text-[10px] text-gray-500">Reliability</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{r.reliability}%</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Recommendations */}
          {data.purchase_recommendations && data.purchase_recommendations.length > 0 && (
            <div className="card p-5 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary-600" /> Purchase Recommendations
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-left">Product</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-left">Supplier</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Stock</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Qty</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">Est. Cost</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-center">Delivery</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-center">Priority</th>
                      <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-center">Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchase_recommendations.slice(0, 15).map((pr: PurchaseRecommendation, i: number) => (
                      <tr key={i} className="group border-b border-gray-50 dark:border-gray-800/20 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all duration-200 animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                        <td className="py-2 px-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{pr.product_name}</div>
                          <div className="text-[10px] font-mono text-gray-400">{pr.sku}</div>
                        </td>
                        <td className="py-2 px-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">{pr.suggested_supplier}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{pr.current_stock}<span className="text-[10px] text-gray-400">/{pr.min_stock}</span></td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-primary-600">+{pr.suggested_quantity}</td>
                        <td className="py-2 px-3 text-right tabular-nums">Rs.{pr.estimated_cost.toFixed(0)}</td>
                        <td className="py-2 px-3 text-center text-xs">{pr.estimated_delivery}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                            pr.priority === 'High' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' :
                            'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
                          }`}>{pr.priority}</span>
                        </td>
                        <td className="py-2 px-3 text-center font-semibold tabular-nums text-primary-600">{pr.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Risk Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up">
            {(['high_risk', 'medium_risk', 'low_risk'] as const).map(category => {
              const items = data.risk_analysis[category]
              const label = category === 'high_risk' ? 'High Risk' : category === 'medium_risk' ? 'Medium Risk' : 'Low Risk'
              const Icon = category === 'high_risk' ? XCircle : category === 'medium_risk' ? AlertTriangle : CheckCircle
              const accentColor = category === 'high_risk' ? 'text-red-600' : category === 'medium_risk' ? 'text-amber-600' : 'text-emerald-600'
              return (
                <div key={category} className="card p-4">
                  <h3 className={`text-sm font-semibold ${accentColor} mb-3 flex items-center gap-2`}>
                    <Icon className="w-4 h-4" /> {label} <span className="text-xs font-normal text-gray-400">({items.length})</span>
                  </h3>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No suppliers in this category.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item: SupplierRiskItem, j: number) => (
                        <RiskItemCard key={j} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* AI Insights */}
          {data.insights.length > 0 && (
            <div className="animate-fade-in-up">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary-600" /> AI Insights
              </h3>
              <div className="space-y-2">
                {data.insights.map((insight: SupplierInsight, i: number) => {
                  const Icon = insightIcons[insight.type] || Info
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${insightColors[insight.type] || ''} animate-fade-in`} style={{ animationDelay: `${i * 30}ms` }}>
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm leading-relaxed">{insight.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up">
            {chartData && chartData.performance_ranking && chartData.performance_ranking.labels.length > 0 && (
              <div className="card p-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Supplier Performance Ranking</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.performance_ranking.labels.map((l, i) => ({ name: l, value: chartData.performance_ranking.values[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartData && chartData.purchase_value && chartData.purchase_value.labels.length > 0 && (
              <div className="card p-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Purchase Value by Supplier</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.purchase_value.labels.map((l, i) => ({ name: l, value: chartData.purchase_value.values[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartData && chartData.reliability_comparison && chartData.reliability_comparison.labels.length > 0 && (
              <div className="card p-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Reliability Comparison</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.reliability_comparison.labels.map((l, i) => ({ name: l, value: chartData.reliability_comparison.values[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartData && chartData.avg_delivery_time && chartData.avg_delivery_time.labels.length > 0 && (
              <div className="card p-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Avg Delivery Time (On-Time %)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.avg_delivery_time.labels.map((l, i) => ({ name: l, value: chartData.avg_delivery_time.values[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

            {chartData && chartData.monthly_purchase_trend && chartData.monthly_purchase_trend.labels.length > 0 && (
              <div className="card p-4 lg:col-span-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Monthly Purchase Trend (Last 6 Months)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.monthly_purchase_trend.labels.map((l, i) => ({ label: l, value: chartData.monthly_purchase_trend.values[i] }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          {/* Rating Distribution */}
          {data.supplier_scores.length > 0 && (
            <div className="card p-4 animate-fade-in-up">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Supplier Rating Distribution</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Excellent', value: (chartData && chartData.rating_distribution && chartData.rating_distribution.Excellent) || 0 },
                      { name: 'Good', value: (chartData && chartData.rating_distribution && chartData.rating_distribution.Good) || 0 },
                      { name: 'Average', value: (chartData && chartData.rating_distribution && chartData.rating_distribution.Average) || 0 },
                      { name: 'Poor', value: (chartData && chartData.rating_distribution && chartData.rating_distribution.Poor) || 0 },
                    ]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {['Excellent', 'Good', 'Average', 'Poor'].map((_, i) => (
                        <Cell key={i} fill={COLORS[i * 2]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
