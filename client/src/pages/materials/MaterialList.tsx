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
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      <div className="card p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
        <div className="flex gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); setTimeout(fetchData, 0) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">Search</button>
          </form>
        </div>

        {loading ? <TableSkeleton /> : materials.length === 0 ? (
          <EmptyState icon={<Droplets className="w-8 h-8" />} title="No materials" description="Add your first raw material." />
        ) : (
          <>
            <div className="overflow-x-auto -mx-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-[720px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[180px] min-w-[140px]">Material</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[80px]">Unit</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[160px] min-w-[120px]">Supplier</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px]">Quantity</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px]">Min Stock</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[105px]">Cost/Unit</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, i) => (
                      <tr key={m.id} className="group border-b border-gray-50 dark:border-gray-800/20 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all duration-150 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white truncate max-w-[180px]" title={m.material_name}>{m.material_name}</td>
                        <td className="px-4 py-4 whitespace-nowrap"><span className="badge-info">{m.unit}</span></td>
                        <td className="px-5 py-4 whitespace-nowrap truncate max-w-[160px]" title={m.supplier_name || ''}>{m.supplier_name || <span className="text-gray-400">N/A</span>}</td>
                        <td className="px-4 py-4 text-right tabular-nums whitespace-nowrap">
                          <span className={`font-medium ${m.quantity <= m.min_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            {m.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-400">{m.min_stock}</td>
                        <td className="px-4 py-4 text-right font-medium tabular-nums whitespace-nowrap text-gray-900 dark:text-white">₹{m.cost.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
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
                <div className="px-5">
                  <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Material' : 'Add Material'} size="lg">
        <MaterialForm material={editing} suppliers={suppliers} onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
