import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, ShoppingCart, Package, BarChart3, CalendarDays, Target } from 'lucide-react'
import api from '../../services/api'
import { useState, useEffect } from 'react'
import { ReorderRecommendation } from '../../types'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'

interface Props {
  variantId: number | null
  onClose: () => void
}

export default function AiRecommendationDetailModal({ variantId, onClose }: Props) {
  const [detail, setDetail] = useState<ReorderRecommendation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!variantId) return
    setLoading(true)
    api.get(`/ai/reorder-detail/${variantId}`).then(res => {
      setDetail(res.data)
    }).catch(() => {
      toast.error('Failed to load recommendation details')
    }).finally(() => {
      setLoading(false)
    })
  }, [variantId])

  const trendIcon = () => {
    if (!detail) return null
    switch (detail.sales_trend) {
      case 'Increasing': return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'Decreasing': return <TrendingDown className="w-5 h-5 text-red-500" />
      default: return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  const priorityColor = () => {
    if (!detail) return ''
    switch (detail.priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
      case 'medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
      default: return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30'
    }
  }

  const confidenceColor = () => {
    if (!detail) return ''
    const s = detail.confidence_score
    if (s >= 70) return 'text-green-600 dark:text-green-400'
    if (s >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const confidenceBarColor = () => {
    if (!detail) return 'bg-gray-300'
    const s = detail.confidence_score
    if (s >= 70) return 'bg-green-500'
    if (s >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <Modal open={!!variantId} onClose={onClose} title="AI Recommendation Details" size="lg">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}
      {!loading && !detail && (
        <p className="text-center text-gray-500 py-8">No data available</p>
      )}
      {!loading && detail && (
        <div className="space-y-5">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold capitalize ${priorityColor()}`}>
            <AlertTriangle className="w-4 h-4" />
            {detail.priority} Priority
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1">Product</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.product_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1">SKU</p>
              <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{detail.sku}</p>
            </div>
            {detail.color && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                <p className="text-muted mb-1">Variant</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{[detail.color, detail.size].filter(Boolean).join(' · ')}</p>
              </div>
            )}
            {detail.category && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                <p className="text-muted mb-1">Category</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.category}</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Current Stock</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.current_stock}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Min Stock</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.min_stock}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Avg Daily Sales</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.avg_daily_sales}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Avg Monthly Sales</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.avg_monthly_sales}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Est. Days Remaining</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {detail.days_remaining !== null && detail.days_remaining < 999
                  ? `${detail.days_remaining} days`
                  : 'N/A (no sales data)'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
              <p className="text-muted mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> Recommended Order</p>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{detail.suggested_reorder_qty} units</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              {trendIcon()}
              <div>
                <p className="text-muted">Sales Trend</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.sales_trend}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-muted">Confidence</p>
              <p className={`text-sm font-bold ${confidenceColor()}`}>{detail.confidence_score}%</p>
              <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 ml-auto">
                <div className={`h-full rounded-full transition-all ${confidenceBarColor()}`} style={{ width: `${detail.confidence_score}%` }} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> AI Analysis
            </p>
            <p className="text-body leading-relaxed">{detail.explanation}</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
