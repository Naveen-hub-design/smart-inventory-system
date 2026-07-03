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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-gray-500 mt-1">Manage purchase orders</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Purchase
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice..." className="input-field pl-9" />
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
                  <tr className="border-b text-left">
                    <th className="py-3 px-2">Invoice</th>
                    <th className="py-3 px-2">Supplier</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2 text-right">Total</th>
                    <th className="py-3 px-2 text-right">Discount</th>
                    <th className="py-3 px-2 text-right">Grand Total</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-medium">{p.invoice_number}</td>
                      <td className="py-3 px-2">{p.supplier_name || 'N/A'}</td>
                      <td className="py-3 px-2">{p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-2 text-right">₹{p.total_amount.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">₹{p.discount.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-medium">₹{p.grand_total.toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className={`badge-${p.status === 'completed' ? 'success' : p.status === 'cancelled' ? 'danger' : 'warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button onClick={() => setViewPurchase(p)} className="p-1.5 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4 text-blue-600" />
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
              <div><span className="text-gray-500">Supplier:</span> {viewPurchase.supplier_name || 'N/A'}</div>
              <div><span className="text-gray-500">Date:</span> {viewPurchase.purchase_date ? new Date(viewPurchase.purchase_date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="text-gray-500">Status:</span> {viewPurchase.status}</div>
              <div><span className="text-gray-500">Notes:</span> {viewPurchase.notes || 'N/A'}</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Material</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewPurchase.items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.material_name || 'N/A'}</td>
                    <td className="py-2 text-right">{item.quantity} {item.unit || ''}</td>
                    <td className="py-2 text-right">₹{item.unit_price.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={3} className="py-2 text-right font-medium">Total:</td><td className="py-2 text-right">₹{viewPurchase.total_amount.toLocaleString()}</td></tr>
                <tr><td colSpan={3} className="py-2 text-right font-medium">Discount:</td><td className="py-2 text-right">-₹{viewPurchase.discount.toLocaleString()}</td></tr>
                <tr><td colSpan={3} className="py-2 text-right font-medium">Grand Total:</td><td className="py-2 text-right font-bold">₹{viewPurchase.grand_total.toLocaleString()}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
