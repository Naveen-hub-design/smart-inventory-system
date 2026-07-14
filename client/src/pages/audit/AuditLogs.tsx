import { useState, useEffect } from 'react'
import { Search, ScrollText, LogIn, LogOut, Plus, Pencil, Trash2, Key, Calendar, X, Globe, Server, Fingerprint, Activity, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { auditService } from '../../services/auditService'
import { AuditLog } from '../../types'
import Pagination from '../../components/ui/Pagination'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'

const ACTION_ICONS: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogOut,
  create: Plus,
  update: Pencil,
  delete: Trash2,
  password_reset: Key,
  password_reset_request: Key,
  password_reset_approved: Key,
  stock_increase: Activity,
  stock_decrease: Activity,
  stock_adjustment: Activity,
}

const ACTION_COLORS: Record<string, string> = {
  login: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  logout: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800',
  create: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  update: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  delete: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  password_reset: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
  password_reset_request: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
  password_reset_approved: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
  stock_increase: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
  stock_decrease: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  stock_adjustment: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
}

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'auth', label: 'Authentication' },
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'materials', label: 'Materials' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
]

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'stock_increase', label: 'Stock Increase' },
  { value: 'stock_decrease', label: 'Stock Decrease' },
  { value: 'stock_adjustment', label: 'Stock Adjustment' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
]

function ActionBadge({ action }: { action: string }) {
  const Icon = ACTION_ICONS[action]
  const colorClass = ACTION_COLORS[action] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
  const label = action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  )
}

function ModuleBadge({ module }: { module: string }) {
  const colors: Record<string, string> = {
    auth: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    products: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    categories: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    suppliers: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    materials: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    purchases: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    sales: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    inventory: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${colors[module] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
      {module}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        Success
      </span>
    )
  }
  if (status === 'failure') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        <XCircle className="w-3 h-3" />
        Failure
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      <AlertTriangle className="w-3 h-3" />
      {status}
    </span>
  )
}

function AuditLogModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  if (!log) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Audit Log Details</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Timestamp</label>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</label>
              <div className="mt-1"><StatusBadge status={log.status} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">User</label>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{log.username}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Role</label>
              <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${log.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                {log.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Module</label>
              <div className="mt-1"><ModuleBadge module={log.module} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Action</label>
              <div className="mt-1"><ActionBadge action={log.action} /></div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</label>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{log.description}</p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Request Information</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">IP Address</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{log.ip_address || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">HTTP Method</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{log.request_method || '-'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Endpoint</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{log.endpoint || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = async (resetPage = false) => {
    setLoading(true)
    const p = resetPage ? 1 : page
    if (resetPage) setPage(1)
    try {
      const params: any = {
        page: p,
        per_page: 20,
        sort_by: 'timestamp',
        sort_order: 'desc',
      }
      if (search) params.search = search
      if (actionFilter) params.action = actionFilter
      if (moduleFilter) params.module = moduleFilter
      if (statusFilter) params.status = statusFilter
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const res = await auditService.getLogs(params)
      setLogs(res.logs)
      setPages(res.pages)
      setTotal(res.total)
      setPage(res.page)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const clearFilters = () => {
    setSearch('')
    setActionFilter('')
    setModuleFilter('')
    setStatusFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const hasFilters = search || actionFilter || moduleFilter || statusFilter || startDate || endDate

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Audit Logs</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">System activity and change history</p>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by user, description, module..."
                className="input-field pl-9"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="input-field w-full sm:w-40"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1) }}
              className="input-field w-full sm:w-40"
            >
              {MODULE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="input-field w-full sm:w-32"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                className="input-field pl-9"
                title="Start date"
              />
            </div>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                className="input-field pl-9"
                title="End date"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary px-6">
              Search
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary px-6">
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="w-8 h-8 text-gray-400" />}
            title="No audit logs found"
            description={hasFilters ? 'Try different search terms or filters.' : 'No system activity recorded yet.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-header">Timestamp</th>
                    <th className="table-header">User</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Action</th>
                    <th className="table-header">Module</th>
                    <th className="table-header">Description</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="table-row cursor-pointer animate-fade-in hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <td className="table-cell text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                      </td>
                      <td className="table-cell">
                        <span className="font-medium text-gray-900 dark:text-white">{log.username}</span>
                      </td>
                      <td className="table-cell">
                        <span className={log.role === 'admin' ? 'badge-info' : 'badge-success'}>
                          {log.role}
                        </span>
                      </td>
                      <td className="table-cell">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="table-cell">
                        <ModuleBadge module={log.module} />
                      </td>
                      <td className="table-cell max-w-xs truncate text-gray-600 dark:text-gray-400">
                        {log.description}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-400 dark:text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      {selectedLog && (
        <AuditLogModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}