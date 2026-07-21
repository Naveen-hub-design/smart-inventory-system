import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Truck, Building2, Phone, Mail, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { supplierService } from '../../services/dataService'
import { Supplier } from '../../types'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import SupplierForm from './SupplierForm'

const initials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const colors = [
  'from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-violet-500 to-violet-600',
  'from-amber-500 to-amber-600', 'from-rose-500 to-rose-600', 'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600', 'from-teal-500 to-teal-600',
]

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

  const fetchData = async (searchVal = search, pageVal = page) => {
    setLoading(true)
    try {
      const params: any = { page: pageVal, per_page: 10, search: searchVal, sort_by: 'created_at', sort_order: 'desc' }
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
          <h1 className="page-title">Suppliers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your suppliers</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Supplier
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
                placeholder="Search suppliers..."
                className="input-field pl-10 pr-9"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); fetchData('', 1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="select-field w-full sm:w-44">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? <TableSkeleton /> : suppliers.length === 0 ? (
          <EmptyState icon={<Truck className="w-8 h-8" />} title="No suppliers" description="Add your first supplier." />
        ) : (
          <>
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
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
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                              {initials(s.supplier_name)}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">{s.supplier_name}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-gray-600 dark:text-gray-400">{s.contact_person || 'N/A'}</span>
                        </td>
                        <td className="table-cell">
                          {s.phone ? (
                            <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                              <Phone className="w-3 h-3" />
                              {s.phone}
                            </a>
                          ) : <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                        </td>
                        <td className="table-cell">
                          {s.email ? (
                            <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[160px]">{s.email}</span>
                            </a>
                          ) : <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                        </td>
                        <td className="table-cell">
                          {s.gst_number ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                              <FileText className="w-3 h-3" />
                              {s.gst_number}
                            </span>
                          ) : <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                        </td>
                        <td className="table-cell">
                          <span className={s.status === 'active' ? 'badge-success' : 'badge-warning'}>{s.status}</span>
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditing(s); setModalOpen(true) }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 active:scale-90 group" title="Edit supplier">
                              <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 group" title="Delete supplier">
                              <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <SupplierForm supplier={editing} onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
