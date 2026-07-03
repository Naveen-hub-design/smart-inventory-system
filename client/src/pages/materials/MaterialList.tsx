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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Raw Materials</h1>
          <p className="text-gray-500 mt-1">Manage raw materials inventory</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials..." className="input-field pl-9" />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>

        {loading ? <TableSkeleton /> : materials.length === 0 ? (
          <EmptyState icon={<Droplets className="w-8 h-8" />} title="No materials" description="Add your first raw material." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-2">Material</th>
                    <th className="py-3 px-2">Unit</th>
                    <th className="py-3 px-2">Supplier</th>
                    <th className="py-3 px-2 text-right">Quantity</th>
                    <th className="py-3 px-2 text-right">Min Stock</th>
                    <th className="py-3 px-2 text-right">Cost/Unit</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-medium">{m.material_name}</td>
                      <td className="py-3 px-2">{m.unit}</td>
                      <td className="py-3 px-2">{m.supplier_name || 'N/A'}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={m.quantity <= m.min_stock ? 'text-red-600 font-medium' : ''}>
                          {m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">{m.min_stock}</td>
                      <td className="py-3 px-2 text-right">₹{m.cost.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => { setEditing(m); setModalOpen(true) }} className="p-1.5 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Material' : 'Add Material'} size="lg">
        <MaterialForm material={editing} suppliers={suppliers} onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
