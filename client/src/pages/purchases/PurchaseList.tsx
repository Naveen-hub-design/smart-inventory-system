import { useState, useEffect } from 'react'
import { Plus, Search, ShoppingCart, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseService } from '../../services/dataService'
import { Purchase } from '../../types'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import PurchaseForm from './PurchaseForm'

export default function PurchaseList() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: 10, search, sort_by: 'created_at', sort_order: 'desc' }
      if (statusFilter) params.status = statusFilter
      const res = await purchaseService.getAll(params)
      setPurchases(res.data.purchases)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, statusFilter])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Purchases</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage purchase orders</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> New Purchase
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice, SKU or barcode..." className="input-field pl-9" />
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

        {loading ? <TableSkeleton /> : purchases.length === 0 ? (
          <EmptyState icon={<ShoppingCart className="w-8 h-8" />} title="No purchases" description="Create your first purchase." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-header">Invoice</th>
                    <th className="table-header">Supplier</th>
                    <th className="table-header">Date</th>
                    <th className="table-header text-right">Total</th>
                    <th className="table-header text-right">Discount</th>
                    <th className="table-header text-right">Grand Total</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr key={p.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{p.invoice_number}</td>
                      <td className="table-cell">{p.supplier_name || 'N/A'}</td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">{p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="table-cell text-right tabular-nums">₹{p.total_amount.toLocaleString()}</td>
                      <td className="table-cell text-right tabular-nums">₹{p.discount.toLocaleString()}</td>
                      <td className="table-cell text-right font-semibold tabular-nums">₹{p.grand_total.toLocaleString()}</td>
                      <td className="table-cell">
                        <span className={`badge-${p.status === 'completed' ? 'success' : p.status === 'cancelled' ? 'danger' : 'warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button onClick={() => setViewPurchase(p)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Details">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase" size="xl">
        <PurchaseForm onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!viewPurchase} onClose={() => setViewPurchase(null)} title={`Purchase: ${viewPurchase?.invoice_number}`} size="lg">
        {viewPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Supplier:</span> <span className="font-medium text-gray-900 dark:text-white">{viewPurchase.supplier_name || 'N/A'}</span></div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Date:</span> <span className="font-medium text-gray-900 dark:text-white">{viewPurchase.purchase_date ? new Date(viewPurchase.purchase_date).toLocaleDateString() : 'N/A'}</span></div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Status:</span> <span className="font-medium"><span className={`badge-${viewPurchase.status === 'completed' ? 'success' : viewPurchase.status === 'cancelled' ? 'danger' : 'warning'}`}>{viewPurchase.status}</span></span></div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-gray-500 dark:text-gray-400">Notes:</span> <span className="font-medium text-gray-900 dark:text-white">{viewPurchase.notes || 'N/A'}</span></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-header">Material</th>
                    <th className="table-header text-right">Qty</th>
                    <th className="table-header text-right">Unit Price</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPurchase.items?.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">{item.material_name || 'N/A'}</td>
                      <td className="table-cell text-right tabular-nums">{item.quantity} {item.unit || ''}</td>
                      <td className="table-cell text-right tabular-nums">₹{item.unit_price.toFixed(2)}</td>
                      <td className="table-cell text-right tabular-nums">₹{item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="table-cell text-right font-medium">Total:</td><td className="table-cell text-right">₹{viewPurchase.total_amount.toLocaleString()}</td></tr>
                  <tr><td colSpan={3} className="table-cell text-right font-medium">Discount:</td><td className="table-cell text-right text-red-600">-₹{viewPurchase.discount.toLocaleString()}</td></tr>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700"><td colSpan={3} className="table-cell text-right font-bold text-base">Grand Total:</td><td className="table-cell text-right font-bold text-base">₹{viewPurchase.grand_total.toLocaleString()}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
