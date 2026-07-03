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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your suppliers</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData() }} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                  <tr className="border-b text-left">
                    <th className="py-3 px-2">Supplier</th>
                    <th className="py-3 px-2">Contact</th>
                    <th className="py-3 px-2">Phone</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">GST</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-medium">{s.supplier_name}</td>
                      <td className="py-3 px-2">{s.contact_person || 'N/A'}</td>
                      <td className="py-3 px-2">{s.phone || 'N/A'}</td>
                      <td className="py-3 px-2">{s.email || 'N/A'}</td>
                      <td className="py-3 px-2">{s.gst_number || 'N/A'}</td>
                      <td className="py-3 px-2">
                        <span className={s.status === 'active' ? 'badge-success' : 'badge-warning'}>{s.status}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => { setEditing(s); setModalOpen(true) }} className="p-1.5 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-600" />
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
