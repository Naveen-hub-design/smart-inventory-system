import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, Sparkles, Trash2, Download, AlertCircle,
  Lightbulb, TrendingUp, Package, ShoppingCart, Truck,
  HelpCircle, ChevronRight, FileText, BarChart3
} from 'lucide-react'
import { aiService, reportService } from '../../services/dataService'
import { useAuth } from '../../context/AuthContext'
import { CopilotMessage, CopilotResponse } from '../../types'

const WELCOME_SUGGESTIONS = [
  'Which products need reorder?',
  'Show low stock products.',
  'Summarize today\'s inventory.',
  'Show best selling products.',
  'Explain why this product needs reorder.',
  'How is inventory health?',
  'Predict next month\'s demand.',
  'Recommend the best supplier.',
]

const SUGGESTIONS_BY_INTENT: Record<string, string[]> = {
  reorder: [
    'Explain why these need reorder.',
    'Which supplier is best?',
    'Summarize inventory.',
    'Show slow moving items.',
    'Predict next month demand.',
  ],
  inventory_summary: [
    'Which products need reorder?',
    'Show best selling products.',
    'What is inventory health?',
    'Show dead stock items.',
    'How many products are low on stock?',
  ],
  best_sellers: [
    'Which one has highest profit?',
    'Show slow moving products.',
    'Forecast demand for top products.',
    'Which category generates most revenue?',
  ],
  forecast: [
    'Will we have enough stock?',
    'Which products need reorder?',
    'Explain the trend.',
    'Show inventory health.',
  ],
  health: [
    'What are my biggest issues?',
    'How to improve health score?',
    'Show slow moving items.',
    'Which categories need attention?',
  ],
  suppliers: [
    'Which supplier is cheapest?',
    'Compare supplier performance.',
    'Show supplier risk analysis.',
    'Recommend products from best supplier.',
  ],
  insights: [
    'Show best selling products.',
    'What is inventory turnover?',
    'How to reduce dead stock?',
    'Show inventory health.',
  ],
  sales: [
    'Show best selling products.',
    'What sold the most this month?',
    'Compare with last month.',
    'Show purchase history.',
  ],
  purchases: [
    'Show recent purchases.',
    'Which supplier is cheapest?',
    'Compare with sales.',
    'Show inventory status.',
  ],
  products: [
    'How many low stock products?',
    'Show products by category.',
    'What is inventory turnover?',
    'Show best selling products.',
  ],
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let inList = false
  let listItems: JSX.Element[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.slice(2)
      const parts = text.split(/(\*\*[^*]+\*\*)/g)
      const formatted = parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="text-gray-900 dark:text-white font-semibold">{p.slice(2, -2)}</strong>
          : p
      )
      inList = true
      listItems.push(
        <li key={idx} className="flex items-start gap-2 text-body">
          <span className="text-primary-500 mt-1.5 shrink-0">•</span>
          <span>{formatted}</span>
        </li>
      )
      return
    }

    if (inList) {
      elements.push(<ul key={`ul-${idx}`} className="space-y-1 my-2">{listItems}</ul>)
      inList = false
      listItems = []
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="text-base font-bold text-gray-900 dark:text-white mt-4 mb-2">
          {trimmed.slice(3)}
        </h3>
      )
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50) {
      elements.push(
        <p key={idx} className="text-sm font-semibold text-gray-900 dark:text-white mt-3 mb-1">
          {trimmed.slice(2, -2)}
        </p>
      )
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1" />)
    } else {
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g)
      const formatted = parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="text-gray-900 dark:text-white font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )
      elements.push(
        <p key={idx} className="text-body leading-relaxed">
          {formatted}
        </p>
      )
    }
  })

  if (inList) {
    elements.push(<ul key="ul-final" className="space-y-1 my-2">{listItems}</ul>)
  }

  return <div className="space-y-0.5">{elements}</div>
}

function getIntentIcon(intent: string) {
  switch (intent) {
    case 'reorder': return Package
    case 'inventory_summary': return Package
    case 'best_sellers': return TrendingUp
    case 'forecast': return TrendingUp
    case 'health': return AlertCircle
    case 'suppliers': return Truck
    case 'insights': return Lightbulb
    case 'sales': return ShoppingCart
    case 'purchases': return Truck
    case 'products': return Package
    default: return Bot
  }
}

export default function AiCopilot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [suggestions, setSuggestions] = useState<string[]>(WELCOME_SUGGESTIONS)
  const [lastIntent, setLastIntent] = useState<string>('greeting')
  const [reportType, setReportType] = useState<string | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const sendMessage = async (msg?: string) => {
    const text = (msg || input).trim()
    if (!text || loading) return

    setReportType(null)
    setReportId(null)
    setPreviewData(null)
    setPreviewLoading(null)

    const userMsg: CopilotMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setSuggestions([])

    try {
      const res = await aiService.copilotChat({
        message: text,
        session_id: sessionId || undefined,
      })
      const data: CopilotResponse = res.data
      if (!sessionId) setSessionId(data.session_id)

      const assistantMsg: CopilotMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
      setSuggestions(data.suggestions || [])
      setLastIntent(data.intent)

      if (data.report_type && data.report_id) {
        setReportType(data.report_type)
        setReportId(data.report_id)
      }
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        role: 'assistant',
        content: err?.response?.data?.error
          ? `⚠️ **Error:** ${err.response.data.error}`
          : '⚠️ **Error:** Unable to process your request. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
      setSuggestions([
        'Which products need reorder?',
        'Summarize inventory.',
        'Show best selling products.',
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClear = async () => {
    setMessages([])
    setSuggestions(WELCOME_SUGGESTIONS)
    setLastIntent('greeting')
    setReportType(null)
    setReportId(null)
    setPreviewData(null)
    setPreviewLoading(null)
    try {
      await aiService.copilotClear(sessionId)
    } catch {
      // ignore
    }
  }

  const handleExport = async () => {
    try {
      const res = await aiService.copilotExport(sessionId)
      const blob = new Blob([res.data as string], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `copilot-conversation-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleReportPreview = async () => {
    if (!reportId) return
    setPreviewLoading('preview')
    setPreviewData(null)
    try {
      const params: any = {}
      if (reportId === 'sales' || reportId === 'purchases') {
        params.start_date = '2024-01-01'
        params.end_date = new Date().toISOString().split('T')[0]
      }
      const serviceMap: Record<string, () => Promise<any>> = {
        inventory: () => reportService.getInventory(),
        sales: () => reportService.getSales(params),
        purchases: () => reportService.getPurchases(params),
        suppliers: () => reportService.getSuppliers(),
        'low-stock': () => reportService.getLowStock(),
      }
      const res = await serviceMap[reportId]()
      setPreviewData(res.data)
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to load report preview'
      setPreviewData({ error: msg })
    } finally {
      setPreviewLoading(null)
    }
  }

  const handleReportExport = async () => {
    if (!reportId) return
    setPreviewLoading('excel')
    try {
      const params: any = { format: 'excel' }
      if (reportId === 'sales' || reportId === 'purchases') {
        params.start_date = '2024-01-01'
        params.end_date = new Date().toISOString().split('T')[0]
      }
      const excelService: Record<string, () => Promise<any>> = {
        inventory: () => reportService.getInventory('excel'),
        sales: () => reportService.getSales(params),
        purchases: () => reportService.getPurchases(params),
        suppliers: () => reportService.getSuppliers('excel'),
        'low-stock': () => reportService.getLowStock('excel'),
      }
      const res = await excelService[reportId]()
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportId}_report.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to export report'
      setPreviewData({ error: msg })
    } finally {
      setPreviewLoading(null)
    }
  }

  function ReportPreviewTable({ data, id }: { data: any; id: string }) {
    if (!data) return <p className="text-sm text-gray-500">No data available.</p>
    let rows: any[] = []
    if (id === 'low-stock') {
      const products = data.products || []
      const materials = data.materials || []
      rows = [
        ...products.map((p: any) => ({ Type: 'Product', Name: p.Product || p.Name, Category: p.Category || 'N/A', Qty: p.Quantity || p.Stock, 'Min Stock': p['Min Stock'], Status: p.Status })),
        ...materials.map((m: any) => ({ Type: 'Material', Name: m.Material || m.Name, Category: 'Raw Material', Qty: m.Quantity, 'Min Stock': m['Min Stock'], Status: m.Status })),
      ]
    } else {
      const items = data.data || data.products || data.materials || []
      if (Array.isArray(items)) {
        rows = items.slice(0, 20)
      }
    }
    if (rows.length === 0) return <p className="text-sm text-gray-500">No data available.</p>
    const keys = Object.keys(rows[0])
    return (
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              {keys.map((k) => (
                <th key={k} className="py-1.5 px-2 font-semibold text-left uppercase tracking-wider text-gray-500 dark:text-gray-400">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                {keys.map((k) => (
                  <td key={k} className="py-1 px-2 text-gray-700 dark:text-gray-300">{String(row[k] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {(Array.isArray(data.data) && data.data.length > 20) && (
          <p className="text-hint mt-1">Showing first 20 of {data.data.length} records</p>
        )}
      </div>
    )
  }

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-premium-lg mb-5">
        <Bot className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Hello!</h2>
      <p className="text-secondary text-center max-w-md mb-2">
        I'm your <span className="font-semibold text-primary-600 dark:text-primary-400">AI ERP Copilot</span>.
        I can help you understand your inventory, suppliers, sales, purchases and AI insights.
      </p>
      <p className="text-hint mb-6">Try asking me something:</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {WELCOME_SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSuggestionClick(s)}
            className="group flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium
              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-600
              hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300
              transition-all duration-200 shadow-sm hover:shadow-premium-sm animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            {s}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in-up">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">AI ERP Copilot</h2>
            <p className="text-muted">Enterprise Intelligence Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                title="Export conversation"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.length === 0 && !loading ? (
          <WelcomeScreen />
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 animate-fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {msg.role === 'assistant' ? (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-500 dark:to-gray-700 flex items-center justify-center shrink-0 shadow-md">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <FormattedMessage content={msg.content} />
                    ) : (
                      <p className="text-sm text-white">{msg.content}</p>
                    )}
                  </div>
                  <p className={`text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {loading && <TypingIndicator />}

            {reportType && reportId && !loading && (
              <div className="flex items-center gap-2 pl-12 animate-fade-in-up">
                <span className="text-muted font-medium">{reportType}:</span>
                <button
                  onClick={handleReportPreview}
                  disabled={previewLoading === 'preview'}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
                    text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40
                    transition-all duration-200 disabled:opacity-50"
                >
                  {previewLoading === 'preview' ? (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <BarChart3 className="w-3 h-3" />
                  )}
                  Preview
                </button>
                <button
                  onClick={handleReportExport}
                  disabled={previewLoading === 'excel'}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800
                    text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40
                    transition-all duration-200 disabled:opacity-50"
                >
                  {previewLoading === 'excel' ? (
                    <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  Excel
                </button>
              </div>
            )}
            {previewData && !loading && (
              <div className="ml-12 mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-fade-in-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Report Preview</span>
                  <button onClick={() => setPreviewData(null)} className="text-hint hover:text-gray-600 dark:hover:text-gray-300">Close</button>
                </div>
                {previewData.error ? (
                  <p className="text-sm text-red-500">⚠️ {previewData.error}</p>
                ) : (
                  <ReportPreviewTable data={previewData} id={reportId!} />
                )}
              </div>
            )}
            {suggestions.length > 0 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1 pb-2 animate-fade-in-up">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700
                      text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600
                      hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300
                      transition-all duration-200"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="mt-3 shrink-0">
        <div className="flex items-end gap-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-sm focus-within:border-primary-300 dark:focus-within:border-primary-600 focus-within:shadow-premium-sm transition-all duration-200">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your ERP..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none px-2 py-1 max-h-32"
            style={{ scrollbarWidth: 'thin' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-sm hover:shadow-premium-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-1.5">
          AI Copilot uses ERP data. Responses are AI-generated and should be verified.
        </p>
      </div>
    </div>
  )
}
