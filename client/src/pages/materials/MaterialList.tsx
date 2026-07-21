import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Droplets, X } from 'lucide-react'
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

  const fetchData = async (searchVal = search, pageVal = page) => {
    setLoading(true)
    try {
      const res = await materialService.getAll({ page: pageVal, per_page: 10, search: searchVal, sort_by: 'created_at', sort_order: 'desc' })
      setMaterials(res.data.materials)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { console.error('Failed to fetch materials') } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page])
  useEffect(() => {
    supplierService.getAll({ per_page: 100 }).then(r => setSuppliers(r.data.suppliers)).catch(() => console.error('Failed to load suppliers'))
  }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchData() }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this material?')) return
    try { await materialService.delete(id); toast.success('Deleted'); fetchData() } catch { console.error('Failed to delete material') }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Raw Materials</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage raw materials inventory</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search materials..."
                className="input-field pl-10 pr-9"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); fetchData('', 1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>

        {loading ? <TableSkeleton /> : materials.length === 0 ? (
          <EmptyState icon={<Droplets className="w-8 h-8" />} title="No materials" description="Add your first raw material." />
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="min-w-[720px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header w-[200px] min-w-[150px]">Material</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-center w-[75px]">Unit</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header w-[180px] min-w-[140px]">Supplier</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[100px]">Quantity</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[100px]">Min Stock</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[110px]">Cost/Unit</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[90px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, i) => (
                      <tr key={m.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="table-cell font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={m.material_name}>{m.material_name}</td>
                        <td className="table-cell text-center whitespace-nowrap"><span className="badge-info">{m.unit}</span></td>
                        <td className="table-cell whitespace-nowrap truncate max-w-[180px]" title={m.supplier_name || ''}>{m.supplier_name || <span className="text-gray-400">N/A</span>}</td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap">
                          <span className={`font-medium ${m.quantity <= m.min_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            {m.quantity}
                          </span>
                        </td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-400">{m.min_stock}</td>
                        <td className="table-cell text-right font-medium tabular-nums whitespace-nowrap text-gray-900 dark:text-white">₹{m.cost.toLocaleString()}</td>
                        <td className="table-cell text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditing(m); setModalOpen(true) }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm" title="Edit">
                              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Material' : 'Add Material'} size="lg">
        <MaterialForm material={editing} suppliers={suppliers} onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
