import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Droplets } from 'lucide-react'
import toast from 'react-hot-toast'
import { materialService, supplierService } from '../../services/dataService'
import { RawMaterial, Supplier } from '../../types'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import MaterialForm from './MaterialForm'

export default function MaterialList() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RawMaterial | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await materialService.getAll({ page, per_page: 10, search, sort_by: 'created_at', sort_order: 'desc' })
      setMaterials(res.data.materials)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page])
  useEffect(() => {
    supplierService.getAll({ per_page: 100 }).then(r => setSuppliers(r.data.suppliers)).catch(() => { })
  }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchData() }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this material?')) return
    try { await materialService.delete(id); toast.success('Deleted'); fetchData() } catch { }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Raw Materials</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage raw materials inventory</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials..." className="input-field pl-9" />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>

        {loading ? <TableSkeleton /> : materials.length === 0 ? (
          <EmptyState icon={<Droplets className="w-8 h-8" />} title="No materials" description="Add your first raw material." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-header">Material</th>
                    <th className="table-header">Unit</th>
                    <th className="table-header">Supplier</th>
                    <th className="table-header text-right">Quantity</th>
                    <th className="table-header text-right">Min Stock</th>
                    <th className="table-header text-right">Cost/Unit</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, i) => (
                    <tr key={m.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="table-cell font-medium text-gray-900 dark:text-white">{m.material_name}</td>
                      <td className="table-cell"><span className="badge-info">{m.unit}</span></td>
                      <td className="table-cell">{m.supplier_name || 'N/A'}</td>
                      <td className="table-cell text-right tabular-nums">
                        <span className={`font-medium ${m.quantity <= m.min_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                          {m.quantity}
                        </span>
                      </td>
                      <td className="table-cell text-right tabular-nums">{m.min_stock}</td>
                      <td className="table-cell text-right font-medium tabular-nums">₹{m.cost.toFixed(2)}</td>
                      <td className="table-cell text-right">
                        <button onClick={() => { setEditing(m); setModalOpen(true) }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Material' : 'Add Material'} size="lg">
        <MaterialForm material={editing} suppliers={suppliers} onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
