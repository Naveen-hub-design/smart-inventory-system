import { useState, useEffect } from 'react'
import {
  Heart, Shield, AlertTriangle, Package, Skull,
  TrendingUp, Activity, Search, Filter, Download, FileText,
  ArrowUp, ArrowDown, Info, Brain, BarChart3, Layers,
  CheckCircle, XCircle, Clock
} from 'lucide-react'
import { aiService, categoryService, supplierService } from '../../services/dataService'
import { HealthResponse, CategoryHealth } from '../../types'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/LoadingSkeleton'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const statusColors: Record<string, string> = {
  Excellent: 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  Good: 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  Fair: 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-900/20',
  Poor: 'text-red-600 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-900/20',
}

const statusGradients: Record<string, string> = {
  Excellent: 'from-emerald-500 to-teal-600',
  Good: 'from-blue-500 to-indigo-600',
  Fair: 'from-amber-500 to-orange-600',
  Poor: 'from-red-500 to-pink-600',
}

const statusScoreColors: Record<string, string> = {
  Excellent: 'text-emerald-600 dark:text-emerald-400',
  Good: 'text-blue-600 dark:text-blue-400',
  Fair: 'text-amber-600 dark:text-amber-400',
  Poor: 'text-red-600 dark:text-red-400',
}

const factorColors: Record<string, string> = {
  stock_availability: '#3b82f6',
  low_stock_risk: '#f59e0b',
  overstock_level: '#f97316',
  dead_stock: '#6b7280',
  sales_performance: '#10b981',
  inventory_turnover: '#8b5cf6',
  forecast_confidence: '#ec4899',
}

const factorLabels: Record<string, string> = {
  stock_availability: 'Stock Availability',
  low_stock_risk: 'Low Stock Risk',
  overstock_level: 'Overstock Level',
  dead_stock: 'Dead Stock',
  sales_performance: 'Sales Performance',
  inventory_turnover: 'Inventory Turnover',
  forecast_confidence: 'Forecast Confidence',
}

function CircularScore({ score, size = 140 }: { score: number; size?: number }) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const status = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Poor'
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#3b82f6' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold tabular-nums ${statusScoreColors[status]}`}>{score}</span>
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">/ 100</span>
      </div>
    </div>
  )
}

function FactorBar({ label, score, weight, color }: { label: string; score: number; weight: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label} ({weight}%)</span>
        <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{score.toFixed(0)}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="card p-4 animate-fade-in-up flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0`} style={{ background: color }}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  )
}

const SEVERITY_COLORS: Record<string, string> = {
  strength: 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300',
  issue: 'border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  recommendation: 'border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
}

export default function InventoryHealth() {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: number; supplier_name: string }[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const fetchData = () => {
    setLoading(true)
    const params: any = {}
    if (filterCategory) params.category_id = filterCategory
    if (filterSupplier) params.supplier_id = filterSupplier
    if (filterDateFrom) params.date_from = filterDateFrom
    if (filterDateTo) params.date_to = filterDateTo
    aiService.getInventoryHealth(params).then(r => {
      setData(r.data)
    }).catch(() => toast.error('Failed to load health data'))
      .finally(() => setLoading(false))
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

  const handleExportPDF = async () => {
    if (!data) return
    setExporting('pdf')
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()
      const pw = doc.internal.pageSize.getWidth()

      doc.setFontSize(18)
      doc.text('Inventory Health Report', pw / 2, 20, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date(data.generated_at).toLocaleString('en-IN')}`, pw / 2, 27, { align: 'center' })
      doc.setFontSize(28)
      doc.text(`Score: ${data.overall_score} / 100 - ${data.health_status}`, pw / 2, 38, { align: 'center' })

      let y = 45
      doc.setFontSize(12)
      doc.text('AI Summary', 14, y)
      y += 7
      doc.setFontSize(9)
      const summaryLines = doc.splitTextToSize(data.ai_summary, pw - 28)
      doc.text(summaryLines, 14, y)
      y += summaryLines.length * 5 + 5

      // Metrics
      doc.setFontSize(12)
      doc.text('Key Metrics', 14, y)
      y += 7
      const m = data.metrics
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['Total Products', m.total_products],
          ['Healthy Products', m.healthy_products],
          ['Low Stock Products', m.low_stock_products],
          ['Overstock Products', m.overstock_products],
          ['Dead Stock Products', m.dead_stock_products],
          ['Forecast Accuracy', `${m.forecast_accuracy}%`],
          ['Inventory Turnover', `${m.inventory_turnover}x`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        styles: { fontSize: 8 },
      })
      y = (doc as any).lastAutoTable.finalY + 5

      // Strengths
      if (data.strengths.length > 0) {
        doc.setFontSize(12)
        doc.text('AI Strengths', 14, y)
        y += 7
        doc.setFontSize(9)
        data.strengths.forEach((s, i) => {
          doc.text(`  + ${s}`, 14, y + i * 5)
        })
        y += data.strengths.length * 5 + 5
      }

      // Issues
      if (data.issues.length > 0) {
        doc.setFontSize(12)
        doc.text('AI Issues', 14, y)
        y += 7
        doc.setFontSize(9)
        data.issues.forEach((s, i) => {
          doc.text(`  - ${s}`, 14, y + i * 5)
        })
        y += data.issues.length * 5 + 5
      }

      // Category health
      if (data.category_health.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Category', 'Score', 'Status', 'Total', 'Healthy', 'At Risk']],
          body: data.category_health.map(c => [c.category_name, `${c.score}%`, c.health_status, c.total_products, c.healthy, c.at_risk]),
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246], fontSize: 9 },
          styles: { fontSize: 8 },
        })
      }

      doc.save('inventory_health.pdf')
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
      csv += 'Inventory Health Report\n'
      csv += `Score,${data.overall_score}/100\n`
      csv += `Status,${data.health_status}\n`
      csv += `Generated,${new Date(data.generated_at).toLocaleString('en-IN')}\n\n`

      csv += 'Key Metrics\n'
      csv += 'Metric,Value\n'
      const m = data.metrics
      csv += `Total Products,${m.total_products}\n`
      csv += `Healthy Products,${m.healthy_products}\n`
      csv += `Low Stock Products,${m.low_stock_products}\n`
      csv += `Overstock Products,${m.overstock_products}\n`
      csv += `Dead Stock Products,${m.dead_stock_products}\n`
      csv += `Forecast Accuracy,${m.forecast_accuracy}%\n`
      csv += `Inventory Turnover,${m.inventory_turnover}x\n\n`

      csv += 'Category Health\n'
      csv += 'Category,Score,Status,Total,Healthy,At Risk\n'
      data.category_health.forEach(c => {
        csv += `"${c.category_name}",${c.score}%,${c.health_status},${c.total_products},${c.healthy},${c.at_risk}\n`
      })
      csv += '\n'

      csv += 'Health Factors\n'
      csv += 'Factor,Score,Weight\n'
      Object.entries(data.factors).forEach(([k, v]) => {
        csv += `"${factorLabels[k] || k}",${v.score},${v.weight}%\n`
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory_health.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            className="input-field w-40 text-sm" placeholder="From" />
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            className="input-field w-40 text-sm" placeholder="To" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field w-44 text-sm">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="input-field w-44 text-sm">
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
          </select>
          <button onClick={fetchData} className="btn-primary text-sm flex items-center gap-1.5 px-4">
            <Search className="w-3.5 h-3.5" /> Apply
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="flex items-center gap-2">
        <button onClick={handleExportPDF} disabled={exporting === 'pdf' || loading}
          className="btn-secondary text-sm flex items-center gap-1.5">
          {exporting === 'pdf' ? <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <FileText className="w-3.5 h-3.5" />}
          PDF
        </button>
        <button onClick={handleExportExcel} disabled={exporting === 'excel' || loading}
          className="btn-secondary text-sm flex items-center gap-1.5">
          {exporting === 'excel' ? <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <Download className="w-3.5 h-3.5" />}
          Excel
        </button>
        {data?.filtered && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 ml-2">
            <Filter className="w-3 h-3" /> Filtered
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton count={4} />
          <ChartSkeleton />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <Heart className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">No health data available</p>
          <p className="text-sm">Try adjusting the filters or adding inventory data.</p>
        </div>
      ) : (
        <>
          {/* Hero Section: Circular Score + Summary + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Circular Score */}
            <div className="card p-6 flex flex-col items-center justify-center animate-fade-in-up">
              <CircularScore score={data.overall_score} size={160} />
              <span className={`mt-3 px-3 py-1 text-xs font-bold rounded-full border ${statusColors[data.health_status] || statusColors.Poor}`}>
                {data.health_status}
              </span>
            </div>

            {/* AI Summary */}
            <div className="card p-5 lg:col-span-2 animate-fade-in-up flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Summary</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{data.ai_summary}</p>

              {/* Strengths / Issues quick view */}
              <div className="flex flex-wrap gap-3 mt-4">
                {data.strengths.slice(0, 2).map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/30">
                    <CheckCircle className="w-3 h-3" /> {s.length > 40 ? s.slice(0, 40) + '...' : s}
                  </span>
                ))}
                {data.issues.slice(0, 1).map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800/30">
                    <XCircle className="w-3 h-3" /> {s.length > 40 ? s.slice(0, 40) + '...' : s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Health Factors */}
          <div className="card p-5 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-600" /> Health Factors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(data.factors).map(([key, factor]) => (
                <FactorBar
                  key={key}
                  label={factorLabels[key] || key}
                  score={factor.score}
                  weight={factor.weight}
                  color={factorColors[key] || '#3b82f6'}
                />
              ))}
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <MetricCard icon={Layers} label="Total" value={data.metrics.total_products} color="linear-gradient(135deg, #3b82f6, #2563eb)" />
            <MetricCard icon={CheckCircle} label="Healthy" value={data.metrics.healthy_products}
              sub={`${data.metrics.total_products > 0 ? Math.round(data.metrics.healthy_products / data.metrics.total_products * 100) : 0}%`}
              color="linear-gradient(135deg, #10b981, #059669)" />
            <MetricCard icon={AlertTriangle} label="Low Stock" value={data.metrics.low_stock_products} color="linear-gradient(135deg, #f59e0b, #d97706)" />
            <MetricCard icon={Package} label="Overstock" value={data.metrics.overstock_products} color="linear-gradient(135deg, #f97316, #ea580c)" />
            <MetricCard icon={Skull} label="Dead Stock" value={data.metrics.dead_stock_products} color="linear-gradient(135deg, #6b7280, #4b5563)" />
            <MetricCard icon={Brain} label="Forecast Acc." value={`${data.metrics.forecast_accuracy}%`} color="linear-gradient(135deg, #ec4899, #db2777)" />
            <MetricCard icon={TrendingUp} label="Turnover" value={`${data.metrics.inventory_turnover.toFixed(1)}x`} color="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
          </div>

          {/* Strengths + Issues + Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Strengths */}
            <div className="card p-4 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> AI Strengths
              </h3>
              {data.strengths.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No significant strengths identified.</p>
              ) : (
                <div className="space-y-2">
                  {data.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                      <ArrowUp className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Issues */}
            <div className="card p-4 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> AI Issues
              </h3>
              {data.issues.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No issues detected.</p>
              ) : (
                <div className="space-y-2">
                  {data.issues.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/30">
                      <ArrowDown className="w-3 h-3 mt-0.5 shrink-0 text-red-500" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="card p-4 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" /> AI Recommendations
              </h3>
              {data.recommendations.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No recommendations at this time.</p>
              ) : (
                <div className="space-y-2">
                  {data.recommendations.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <Info className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Health Trend Chart */}
          {data.health_trend.labels.length > 0 && (
            <div className="card p-5 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" /> Health Score Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.health_trend.labels.map((l, i) => ({ label: l, score: data.health_trend.values[i] }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      formatter={(value: number) => [`${value} / 100`, 'Health Score']} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category Health */}
          {data.category_health.length > 0 && (
            <div className="card p-5 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> Category Health
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.category_health.map((cat: CategoryHealth, i: number) => {
                  const catColor = cat.score >= 90 ? '#10b981' : cat.score >= 75 ? '#3b82f6' : cat.score >= 60 ? '#f59e0b' : '#ef4444'
                  return (
                    <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 animate-fade-in-up">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cat.category_name}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          cat.health_status === 'Excellent' ? 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                          cat.health_status === 'Good' ? 'border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                          cat.health_status === 'Fair' ? 'border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                          'border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>{cat.health_status}</span>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score}%`, backgroundColor: catColor }} />
                          </div>
                        </div>
                        <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{cat.score}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                        <span>{cat.total_products} products</span>
                        <span>{cat.healthy} healthy · {cat.at_risk} at risk</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
