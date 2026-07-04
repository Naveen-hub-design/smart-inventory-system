import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { supplierService } from '../../services/dataService'
import { Supplier } from '../../types'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import SupplierForm from './SupplierForm'

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: 10, search, sort_by: 'created_at', sort_order: 'desc' }
      if (statusFilter) params.status = statusFilter
      const res = await supplierService.getAll(params)
      setSuppliers(res.data.suppliers)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, statusFilter])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this supplier?')) return
    try { await supplierService.delete(id); toast.success('Deleted'); fetchData() } catch { }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Suppliers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your suppliers</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="input-field pl-9" />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field w-full sm:w-40">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? <TableSkeleton /> : suppliers.length === 0 ? (
          <EmptyState icon={<Truck className="w-8 h-8" />} title="No suppliers" description="Add your first supplier." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-header">Supplier</th>
                    <th className="table-header">Contact</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">GST</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s, i) => (
                    <tr key={s.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{s.supplier_name}</td>
                      <td className="table-cell">{s.contact_person || 'N/A'}</td>
                      <td className="table-cell">
                        {s.phone ? (
                          <a href={`tel:${s.phone}`} className="hover:text-primary-600 transition-colors">{s.phone}</a>
                        ) : 'N/A'}
                      </td>
                      <td className="table-cell">
                        {s.email ? (
                          <a href={`mailto:${s.email}`} className="hover:text-primary-600 transition-colors">{s.email}</a>
                        ) : 'N/A'}
                      </td>
                      <td className="table-cell font-mono text-xs">{s.gst_number || 'N/A'}</td>
                      <td className="table-cell">
                        <span className={s.status === 'active' ? 'badge-success' : 'badge-warning'}>{s.status}</span>
                      </td>
                      <td className="table-cell text-right">
                        <button onClick={() => { setEditing(s); setModalOpen(true) }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <SupplierForm supplier={editing} onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
