import { useState, useEffect } from 'react'
import { Plus, Search, ClipboardList, Eye } from 'lucide-react'
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
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice, customer, product, SKU or barcode..." className="input-field pl-9" />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field w-full sm:w-40">
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
            <div className="overflow-x-auto">
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
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s, i) => (
                    <tr key={s.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{s.invoice_number}</td>
                      <td className="table-cell">{s.customer_name || 'Walk-in'}</td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">{s.sale_date ? new Date(s.sale_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="table-cell text-right tabular-nums">₹{s.total_amount.toLocaleString()}</td>
                      <td className="table-cell text-right tabular-nums">₹{s.discount.toLocaleString()}</td>
                      <td className="table-cell text-right font-semibold tabular-nums">₹{s.grand_total.toLocaleString()}</td>
                      <td className="table-cell">
                        <span className="badge-info capitalize">{s.payment_method}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge-${s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button onClick={() => setViewSale(s)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="xl">
        <SaleForm onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title={`Sale: ${viewSale?.invoice_number}`} size="lg">
        {viewSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Customer:</span> <span className="font-medium text-gray-900 dark:text-white">{viewSale.customer_name || 'Walk-in'}</span></div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Date:</span> <span className="font-medium text-gray-900 dark:text-white">{viewSale.sale_date ? new Date(viewSale.sale_date).toLocaleDateString() : 'N/A'}</span></div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Payment:</span> <span className="font-medium"><span className="badge-info capitalize">{viewSale.payment_method}</span></span></div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Status:</span> <span className="font-medium"><span className={`badge-${viewSale.status === 'completed' ? 'success' : viewSale.status === 'cancelled' ? 'danger' : 'warning'}`}>{viewSale.status}</span></span></div>
            </div>
            <div className="overflow-x-auto">
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
                      <td className="table-cell">{item.product_name || 'N/A'} {item.size ? <span className="text-gray-400">({item.size})</span> : ''}</td>
                      <td className="table-cell text-right tabular-nums">{item.quantity}</td>
                      <td className="table-cell text-right tabular-nums">₹{item.unit_price.toFixed(2)}</td>
                      <td className="table-cell text-right tabular-nums">₹{item.discount.toFixed(2)}</td>
                      <td className="table-cell text-right tabular-nums">₹{item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4} className="table-cell text-right font-medium">Total:</td><td className="table-cell text-right">₹{viewSale.total_amount.toLocaleString()}</td></tr>
                  <tr><td colSpan={4} className="table-cell text-right font-medium">Discount:</td><td className="table-cell text-right text-red-600">-₹{viewSale.discount.toLocaleString()}</td></tr>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700"><td colSpan={4} className="table-cell text-right font-bold text-base">Grand Total:</td><td className="table-cell text-right font-bold text-base">₹{viewSale.grand_total.toLocaleString()}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
