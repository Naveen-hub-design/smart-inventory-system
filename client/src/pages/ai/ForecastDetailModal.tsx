import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, ShoppingCart, Package, BarChart3, CalendarDays, Target, ShieldCheck } from 'lucide-react'
import { ForecastItem } from '../../types'
import Modal from '../../components/ui/Modal'

interface Props {
  item: ForecastItem | null
  onClose: () => void
}

export default function ForecastDetailModal({ item, onClose }: Props) {
  if (!item) return null

  const trendIcon = () => {
    switch (item.sales_trend) {
      case 'Increasing': return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'Decreasing': return <TrendingDown className="w-5 h-5 text-red-500" />
      default: return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  const riskBadge = () => {
    const cls = item.risk_level === 'Low Risk'
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30'
      : item.risk_level === 'Medium Risk'
      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30'
    const icon = item.risk_level === 'Low Risk' ? ShieldCheck
      : item.risk_level === 'Medium Risk' ? AlertTriangle
      : AlertTriangle
    const Icon = icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
        <Icon className="w-3.5 h-3.5" />
        {item.risk_level}
      </span>
    )
  }

  const confidenceColor = () => {
    const s = item.confidence_score
    if (s >= 70) return 'text-green-600 dark:text-green-400'
    if (s >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const confidenceBarColor = () => {
    const s = item.confidence_score
    if (s >= 70) return 'bg-green-500'
    if (s >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <Modal open={!!item} onClose={onClose} title="Demand Forecast Details" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title">{item.product_name}</h3>
          {riskBadge()}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1">SKU</p>
            <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{item.sku}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1">Variant</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{[item.color, item.size].filter(Boolean).join(' · ') || 'N/A'}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Current Stock</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.current_stock}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Avg Daily Sales</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.avg_daily_sales}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Predicted Demand (7d)</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.demand_7_days ?? 'N/A'}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Predicted Demand (30d)</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.demand_30_days ?? 'N/A'}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> Suggested Reorder</p>
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{item.suggested_reorder_qty} units</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <p className="text-muted mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Confidence</p>
            <p className={`text-sm font-bold ${confidenceColor()}`}>{item.confidence_score}%</p>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
              <div className={`h-full rounded-full ${confidenceBarColor()}`} style={{ width: `${item.confidence_score}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            {trendIcon()}
            <div>
              <p className="text-muted">Sales Trend</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.sales_trend}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-muted">Forecast Period</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Next 30 days</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
            <Brain className="w-3.5 h-3.5" /> AI Explanation
          </p>
          <p className="text-body leading-relaxed">{item.explanation}</p>
        </div>
      </div>
    </Modal>
  )
}
