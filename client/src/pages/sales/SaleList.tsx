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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-gray-500 mt-1">Manage sales and invoices</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice or customer..." className="input-field pl-9" />
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
                  <tr className="border-b text-left">
                    <th className="py-3 px-2">Invoice</th>
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2 text-right">Total</th>
                    <th className="py-3 px-2 text-right">Discount</th>
                    <th className="py-3 px-2 text-right">Grand Total</th>
                    <th className="py-3 px-2">Payment</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-medium">{s.invoice_number}</td>
                      <td className="py-3 px-2">{s.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-2">{s.sale_date ? new Date(s.sale_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-2 text-right">₹{s.total_amount.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">₹{s.discount.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-medium">₹{s.grand_total.toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className="badge-info">{s.payment_method}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge-${s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button onClick={() => setViewSale(s)} className="p-1.5 hover:bg-blue-50 rounded-lg">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="xl">
        <SaleForm onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title={`Sale: ${viewSale?.invoice_number}`} size="lg">
        {viewSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Customer:</span> {viewSale.customer_name || 'Walk-in'}</div>
              <div><span className="text-gray-500">Date:</span> {viewSale.sale_date ? new Date(viewSale.sale_date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="text-gray-500">Payment:</span> {viewSale.payment_method}</div>
              <div><span className="text-gray-500">Status:</span> {viewSale.status}</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Product</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Discount</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewSale.items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.product_name || 'N/A'} {item.size ? `(${item.size})` : ''}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">₹{item.unit_price.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{item.discount.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={4} className="py-2 text-right font-medium">Total:</td><td className="py-2 text-right">₹{viewSale.total_amount.toLocaleString()}</td></tr>
                <tr><td colSpan={4} className="py-2 text-right font-medium">Discount:</td><td className="py-2 text-right">-₹{viewSale.discount.toLocaleString()}</td></tr>
                <tr><td colSpan={4} className="py-2 text-right font-medium">Grand Total:</td><td className="py-2 text-right font-bold">₹{viewSale.grand_total.toLocaleString()}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
