import { useState, useEffect } from 'react'
import { Plus, Search, X, ClipboardList, Eye, FileText, User, Calendar,  Building2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { saleService } from '../../services/dataService'
import { Sale } from '../../types'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import SaleForm from './SaleForm'

export default function SaleList() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewSale, setViewSale] = useState<Sale | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: 10, search, sort_by: 'created_at', sort_order: 'desc' }
      if (statusFilter) params.status = statusFilter
      const res = await saleService.getAll(params)
      setSales(res.data.sales)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, statusFilter])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Sales</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage sales and invoices</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice, customer, product, SKU or barcode..."
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-full sm:w-44 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 appearance-none cursor-pointer">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? <TableSkeleton /> : sales.length === 0 ? (
          <EmptyState icon={<ClipboardList className="w-8 h-8" />} title="No sales" description="Create your first sale." />
        ) : (
          <>
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header">Invoice</th>
                      <th className="table-header">Customer</th>
                      <th className="table-header">Date</th>
                      <th className="table-header text-right">Total</th>
                      <th className="table-header text-right">Discount</th>
                      <th className="table-header text-right">Grand Total</th>
                      <th className="table-header">Payment</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <tr key={s.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400 shrink-0" />
                            <span className="font-medium text-gray-900 dark:text-white">{s.invoice_number}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{s.customer_name || 'Walk-in'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{s.sale_date ? new Date(s.sale_date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="table-cell text-right tabular-nums font-medium text-gray-900 dark:text-white">₹{s.total_amount.toLocaleString()}</td>
                        <td className="table-cell text-right tabular-nums text-red-500">-₹{s.discount.toLocaleString()}</td>
                        <td className="table-cell text-right font-semibold tabular-nums text-gray-900 dark:text-white">₹{s.grand_total.toLocaleString()}</td>
                        <td className="table-cell">
                          <span className="badge-info capitalize">{s.payment_method}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge-${s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          <button onClick={() => setViewSale(s)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 active:scale-90 group" title="View Details">
                            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="xl">
        <SaleForm onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title={`Sale: ${viewSale?.invoice_number}`} size="lg">
        {viewSale && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/30">
                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Customer</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{viewSale.customer_name || 'Walk-in'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/30">
                <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{viewSale.sale_date ? new Date(viewSale.sale_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/30">
                <span className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Payment</p>
                  <span className="badge-info capitalize">{viewSale.payment_method}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/30">
                <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Status</p>
                  <span className={`badge-${viewSale.status === 'completed' ? 'success' : viewSale.status === 'cancelled' ? 'danger' : 'warning'}`}>{viewSale.status}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto -mx-5">
              <div className="inline-block min-w-full align-middle px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="table-header">Product</th>
                      <th className="table-header text-right">Qty</th>
                      <th className="table-header text-right">Price</th>
                      <th className="table-header text-right">Discount</th>
                      <th className="table-header text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewSale.items?.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{item.product_name || 'N/A'} {item.size ? <span className="text-gray-400 font-normal">({item.size})</span> : ''}</td>
                        <td className="table-cell text-right tabular-nums font-medium">{item.quantity}</td>
                        <td className="table-cell text-right tabular-nums">₹{item.unit_price.toFixed(2)}</td>
                        <td className="table-cell text-right tabular-nums text-red-500">-₹{item.discount.toFixed(2)}</td>
                        <td className="table-cell text-right tabular-nums font-medium">₹{item.total_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={4} className="table-cell text-right font-medium">Subtotal:</td><td className="table-cell text-right tabular-nums">₹{viewSale.total_amount.toLocaleString()}</td></tr>
                    <tr><td colSpan={4} className="table-cell text-right font-medium">Discount:</td><td className="table-cell text-right tabular-nums text-red-600">-₹{viewSale.discount.toLocaleString()}</td></tr>
                    <tr><td colSpan={4} className="table-cell text-right font-medium">Tax:</td><td className="table-cell text-right tabular-nums">₹{viewSale.tax?.toLocaleString() || '0'}</td></tr>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                      <td colSpan={4} className="table-cell text-right font-bold text-sm">Grand Total:</td>
                      <td className="table-cell text-right font-bold text-sm text-primary-600 dark:text-primary-400">₹{viewSale.grand_total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
