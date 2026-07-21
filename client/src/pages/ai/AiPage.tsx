import { useState, useEffect } from 'react'
import {
  Brain, ClipboardList, TrendingUp, BarChart3, Activity,
  Truck, MessageSquare, AlertTriangle, Package, ShoppingCart,
  CalendarDays, ShieldCheck, Clock, Target, Search, Filter,
  TrendingDown, Minus, LineChart
} from 'lucide-react'
import { aiService, productService, categoryService } from '../../services/dataService'
import { ReorderRecommendation, ForecastItem } from '../../types'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'
import AiRecommendationDetailModal from './AiRecommendationDetailModal'
import ForecastDetailModal from './ForecastDetailModal'
import InventoryInsights from './InventoryInsights'
import InventoryHealth from './InventoryHealth'
import SupplierIntelligence from './SupplierIntelligence'
import AiCopilot from './AiCopilot'
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Tab = 'overview' | 'reorder' | 'forecasting' | 'insights' | 'health' | 'suppliers' | 'assistant'

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Brain },
  { id: 'reorder', label: 'Reorder Recommendations', icon: ClipboardList },
  { id: 'forecasting', label: 'Demand Forecasting', icon: TrendingUp },
  { id: 'insights', label: 'Inventory Insights', icon: BarChart3 },
  { id: 'health', label: 'Inventory Health', icon: Activity },
  { id: 'suppliers', label: 'Supplier Intelligence', icon: Truck },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
]

function ComingSoon({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
      <Brain className="w-16 h-16 mb-4 opacity-30" />
      <p className="text-lg font-medium mb-1">Coming Soon</p>
      <p className="text-sm">The {tab} feature is under development.</p>
    </div>
  )
}

export default function AiPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<{
    recommendations: ReorderRecommendation[]
    high_priority: ReorderRecommendation[]
    medium_priority: ReorderRecommendation[]
    safe_items: ReorderRecommendation[]
    generated_at: string
    total_analyzed: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)

  // Forecast state
  const [forecastData, setForecastData] = useState<{ forecasts: ForecastItem[]; total_analyzed: number; generated_at: string } | null>(null)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [selectedForecast, setSelectedForecast] = useState<ForecastItem | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [products, setProducts] = useState<{ id: number; product_name: string }[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [filterProduct, setFilterProduct] = useState('')

  const fetchForecast = () => {
    setForecastLoading(true)
    const params: any = {}
    if (filterCategory) params.category_id = filterCategory
    if (filterProduct) params.product_id = filterProduct
    aiService.getForecast(params).then(res => {
      setForecastData(res.data)
    }).catch(() => {}).finally(() => setForecastLoading(false))
  }

  useEffect(() => {
    if (tab === 'forecasting') {
      fetchForecast()
    }
  }, [tab, filterCategory, filterProduct])

  useEffect(() => {
    // Load filter options on mount
    categoryService.getAll({ per_page: 100 }).then(r => {
      setCategories(r.data.categories || [])
    }).catch(() => {})
    productService.getAll({ per_page: 500 }).then(r => {
      setProducts(r.data.products || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    aiService.getReorderRecommendations().then(res => {
      setData(res.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const healthScore = () => {
    if (!data || data.total_analyzed === 0) return 0
    const high = data.high_priority?.length || 0
    const med = data.medium_priority?.length || 0
    const safe = data.safe_items?.length || 0
    const score = Math.round(((safe * 100) + (med * 60) + (high * 20)) / data.total_analyzed)
    return Math.min(100, Math.max(0, score))
  }

  const avgConfidence = () => {
    if (!data || data.recommendations.length === 0) return 0
    const total = data.recommendations.reduce((s, r) => s + (r.confidence_score || 0), 0)
    return Math.round(total / data.recommendations.length)
  }

  const needsReorder = () => {
    if (!data) return 0
    return (data.high_priority?.length || 0) + (data.medium_priority?.length || 0)
  }

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30">High</span>
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">Medium</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30">Low</span>
    }
  }

  const confidenceBar = (score: number) => {
    const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-semibold tabular-nums text-gray-600 dark:text-gray-400">{score}%</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="page-title flex items-center gap-3">
          <Brain className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          AI Intelligence Center
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered insights, reorder recommendations, and inventory intelligence</p>
      </div>

      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 pb-0.5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
              tab === t.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <CardSkeleton count={6} /> : (
        <>
          {tab === 'overview' && data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card animate-fade-in-up">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inventory Health Score</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{healthScore()}%</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        healthScore() >= 70 ? 'bg-emerald-500' : healthScore() >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${healthScore()}%` }}
                    />
                  </div>
                </div>
                <div className="card animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Products Requiring Reorder</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{needsReorder()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-hint">
                    {data.high_priority?.length || 0} high · {data.medium_priority?.length || 0} medium priority
                  </p>
                </div>
                <div className="card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average AI Confidence</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{avgConfidence()}%</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {confidenceBar(avgConfidence())}
                </div>
                <div className="card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">High Priority</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{data.high_priority?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-hint">Immediate attention required</p>
                </div>
                <div className="card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Medium Priority</p>
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{data.medium_priority?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-hint">Should be monitored</p>
                </div>
                <div className="card animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last AI Analysis</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {data.generated_at
                          ? new Date(data.generated_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-hint">{data.total_analyzed} variants analyzed</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'reorder' && data && (
            <div className="space-y-5">
              {data.recommendations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-base font-medium">No recommendations</p>
                  <p className="text-sm">All variants are sufficiently stocked.</p>
                </div>
              )}
              {data.recommendations.map((r, i) => (
                <div
                  key={r.variant_id}
                  onClick={() => setSelectedVariant(r.variant_id)}
                  className="card hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="card-title truncate">{r.product_name}</h3>
                        {priorityBadge(r.priority)}
                      </div>
                      <div className="flex items-center gap-3 text-muted">
                        <span className="font-mono">{r.sku}</span>
                        {r.color && <span>· {r.color}</span>}
                        {r.size && <span>· {r.size}</span>}
                        {r.category && <span>· {r.category}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-muted mb-0.5">Recommended Order</p>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">+{r.suggested_reorder_qty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                      <p className="text-muted">Current Stock</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.current_stock}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                      <p className="text-muted">Min Stock</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.min_stock}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                      <p className="text-muted">Est. Days Remaining</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {r.days_remaining !== null && r.days_remaining < 999 ? `${r.days_remaining} days` : 'N/A'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                      <p className="text-muted">Avg Daily Sales</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.avg_daily_sales}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-muted mb-1">Confidence Score</p>
                      {confidenceBar(r.confidence_score || 0)}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-muted">Sales Trend</p>
                      <span className={`text-xs font-semibold ${
                        r.sales_trend === 'Increasing' ? 'text-green-600 dark:text-green-400' :
                        r.sales_trend === 'Decreasing' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>{r.sales_trend}</span>
                    </div>
                  </div>

                  <p className="text-muted mt-3 leading-relaxed line-clamp-2">{r.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'forecasting' && (
            <div className="space-y-5">
              <div className="card">
                <div className="flex items-center gap-3 flex-wrap">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilterProduct('') }} className="select-field w-48">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="select-field w-56">
                    <option value="">All Products</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                  </select>
                </div>
              </div>

              {forecastLoading ? <CardSkeleton count={3} /> : forecastData && (
                <>
                  {forecastData.forecasts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                      <LineChart className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-base font-medium">No forecast data</p>
                      <p className="text-sm">No variants match the selected filters.</p>
                    </div>
                  )}
                  {forecastData.forecasts.map((f, i) => (
                    <div
                      key={f.variant_id}
                      onClick={() => setSelectedForecast(f)}
                      className="card hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="card-title truncate">{f.product_name}</h3>
                            {f.insufficient_data ? (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">No History</span>
                            ) : (
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                f.risk_level === 'Low Risk' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30' :
                                f.risk_level === 'Medium Risk' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30'
                              }`}>{f.risk_level}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-muted">
                            <span className="font-mono">{f.sku}</span>
                            {f.color && <span>· {f.color}</span>}
                            {f.size && <span>· {f.size}</span>}
                            {f.category && <span>· {f.category}</span>}
                          </div>
                        </div>
                        {!f.insufficient_data && (
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-muted mb-0.5">Predicted (30d)</p>
                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{f.demand_30_days}</p>
                          </div>
                        )}
                      </div>

                      {f.insufficient_data ? (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                          <p className="text-secondary">{f.explanation}</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                              <p className="text-muted">Current Stock</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.current_stock}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                              <p className="text-muted">Avg Daily</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.avg_daily_sales}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                              <p className="text-muted">Demand (7d)</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.demand_7_days}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                              <p className="text-muted">Suggested Reorder</p>
                              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">+{f.suggested_reorder_qty}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <p className="text-muted mb-1">Confidence Score</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${
                                    f.confidence_score >= 70 ? 'bg-green-500' : f.confidence_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                  }`} style={{ width: `${f.confidence_score}%` }} />
                                </div>
                                <span className="text-xs font-semibold tabular-nums text-gray-600 dark:text-gray-400">{f.confidence_score}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {f.sales_trend === 'Increasing' ? <TrendingUp className="w-4 h-4 text-green-500" /> :
                               f.sales_trend === 'Decreasing' ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                               <Minus className="w-4 h-4 text-gray-400" />}
                              <span className={`text-xs font-semibold ${
                                f.sales_trend === 'Increasing' ? 'text-green-600 dark:text-green-400' :
                                f.sales_trend === 'Decreasing' ? 'text-red-600 dark:text-red-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>{f.sales_trend}</span>
                            </div>
                          </div>

                          <div className="h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsLine data={f.chart_labels.map((label, idx) => ({
                                label,
                                Actual: f.chart_actual[idx] || 0,
                                Predicted: f.chart_predicted[idx] || 0,
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                <XAxis dataKey="label" tick={false} axisLine={false} />
                                <YAxis tick={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="Actual" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                                <Line type="monotone" dataKey="Predicted" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                              </RechartsLine>
                            </ResponsiveContainer>
                          </div>

                          <p className="text-muted mt-3 leading-relaxed line-clamp-2">{f.explanation}</p>
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'insights' && <InventoryInsights />}
          {tab === 'health' && <InventoryHealth />}

          {tab === 'suppliers' && <SupplierIntelligence />}
          {tab === 'assistant' && <AiCopilot />}
          {tab !== 'overview' && tab !== 'reorder' && tab !== 'forecasting' && tab !== 'insights' && tab !== 'health' && tab !== 'suppliers' && tab !== 'assistant' && <ComingSoon tab={tabs.find(t => t.id === tab)?.label || ''} />}
        </>
      )}

      <AiRecommendationDetailModal
        variantId={selectedVariant}
        onClose={() => setSelectedVariant(null)}
      />

      <ForecastDetailModal
        item={selectedForecast}
        onClose={() => setSelectedForecast(null)}
      />
    </div>
  )
}
