import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Package, Box, AlertTriangle, ClipboardList, Plus } from 'lucide-react'
import { inventoryService } from '../../services/dataService'
import { InventoryLog } from '../../types'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { InventorySkeleton } from '../../components/ui/LoadingSkeleton'
import toast from 'react-hot-toast'

export default function Inventory() {
  const location = useLocation()
  const navigate = useNavigate()
  const [stock, setStock] = useState<{ products: any[]; materials: any[] }>({ products: [], materials: [] })
  const [movements, setMovements] = useState<InventoryLog[]>([])
  const [lowStock, setLowStock] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [tab, setTab] = useState<'stock' | 'movements' | 'alerts'>('stock')
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<'product' | 'material'>('product')
  const [adjustItem, setAdjustItem] = useState<number | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const doAdjust = async () => {
    if (!adjustItem) { toast.error('No item selected'); return }
    if (!adjustQty || adjustQty.trim() === '') { toast.error('Quantity required'); return }
    const qty = parseFloat(adjustQty)
    if (isNaN(qty) || qty < 0) { toast.error('Quantity must be a valid non-negative number'); return }
    setAdjusting(true)
    try {
      await inventoryService.adjust({
        type: adjustType,
        item_id: adjustItem,
        quantity: qty,
        notes: adjustNotes,
      })
      toast.success('Stock adjusted')
      setAdjustOpen(false)
      setAdjustItem(null)
      setAdjustQty('')
      setAdjustNotes('')
      try {
        const res = await inventoryService.getStock()
        setStock(res.data)
      } catch {
        console.error('Failed to refresh stock after adjustment')
      }
    } catch {
      toast.error('Failed to adjust stock')
    } finally {
      setAdjusting(false)
    }
  }

  useEffect(() => {
    if (location.state) {
      const s = location.state as any
      if (s.tab === 'alerts' || s.tab === 'stock' || s.tab === 'movements') setTab(s.tab)
    }
  }, [location.state])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        if (tab === 'stock') {
          const res = await inventoryService.getStock()
          setStock(res.data)
        } else if (tab === 'movements') {
          const res = await inventoryService.getMovements({ page, per_page: 15 })
          setMovements(res.data.movements)
          setPages(res.data.pages)
          setTotal(res.data.total)
        } else if (tab === 'alerts') {
          const res = await inventoryService.getLowStock()
          setLowStock(res.data)
        }
      } catch { console.error('Failed to fetch inventory data') } finally { setLoading(false) }
    }
    fetchAll()
  }, [tab, page])

  const statusBadge = (status: string) => {
    const cls = status === 'in_stock' ? 'badge-success' : status === 'low' ? 'badge-warning' : 'badge-danger'
    const label = status === 'in_stock' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'
    return <span className={cls}>{label}</span>
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="page-title">Inventory</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor stock levels and movements</p>
      </div>

      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 pb-0.5 bg-gray-50/30 dark:bg-gray-800/10 rounded-t-lg px-1">
        {(['stock', 'movements', 'alerts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className={`relative px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              tab === t
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {t === 'stock' && <Package className="w-3.5 h-3.5" />}
              {t === 'movements' && <ClipboardList className="w-3.5 h-3.5" />}
              {t === 'alerts' && <AlertTriangle className="w-3.5 h-3.5" />}
              {t === 'stock' ? 'Current Stock' : t === 'movements' ? 'Stock Movements' : 'Low Stock Alerts'}
            </span>
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {loading ? <InventorySkeleton /> : (
        <>
          {tab === 'stock' && (
            <div className="flex justify-end mb-2 animate-fade-in">
              <button onClick={() => { setAdjustType('product'); setAdjustOpen(true) }} className="btn-secondary text-sm">
                <Plus className="w-3.5 h-3.5" /> Adjust Stock
              </button>
            </div>
          )}
          {tab === 'stock' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400" />
                <h3 className="card-title mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </span>
                  Products
                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-auto">{stock.products.length} items</span>
                </h3>
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="table-header">Product</th>
                          <th className="table-header text-right">Quantity</th>
                          <th className="table-header text-right">Min Stock</th>
                          <th className="table-header">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stock.products.length === 0 ? (
                          <tr>
                            <td colSpan={4}>
                              <EmptyState title="No products" description="No products have been added yet." icon={<Package className="w-10 h-10" />} />
                            </td>
                          </tr>
                        ) : (
                          stock.products.map((p: any, i: number) => (
                            <tr key={p.id} onClick={() => { setAdjustType('product'); setAdjustItem(p.id); setAdjustQty(String(p.quantity)); setAdjustOpen(true) }} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 30}ms` }}>
                              <td className="table-cell font-medium text-gray-900 dark:text-white">{p.name}</td>
                              <td className="table-cell text-right tabular-nums font-medium">{p.quantity}</td>
                              <td className="table-cell text-right tabular-nums text-gray-600 dark:text-gray-400">{p.min_stock}</td>
                              <td className="table-cell">{statusBadge(p.status)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
                <h3 className="card-title mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Box className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  Raw Materials
                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-auto">{stock.materials.length} items</span>
                </h3>
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="table-header">Material</th>
                          <th className="table-header text-right">Quantity</th>
                          <th className="table-header text-right">Min Stock</th>
                          <th className="table-header">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stock.materials.length === 0 ? (
                          <tr>
                            <td colSpan={4}>
                              <EmptyState title="No materials" description="No raw materials have been added yet." icon={<Box className="w-10 h-10" />} />
                            </td>
                          </tr>
                        ) : (
                          stock.materials.map((m: any, i: number) => (
                            <tr key={m.id} onClick={() => { setAdjustType('material'); setAdjustItem(m.id); setAdjustQty(String(m.quantity)); setAdjustOpen(true) }} className="table-row animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 30}ms` }}>
                              <td className="table-cell font-medium text-gray-900 dark:text-white">{m.name}</td>
                              <td className="table-cell text-right tabular-nums font-medium">
                                {m.quantity} <span className="text-gray-400 text-xs font-normal">{m.unit}</span>
                              </td>
                              <td className="table-cell text-right tabular-nums text-gray-600 dark:text-gray-400">{m.min_stock}</td>
                              <td className="table-cell">{statusBadge(m.status)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'movements' && (
            <div className="card animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
              <h3 className="card-title mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                </span>
                Recent Stock Movements
                {total > 0 && <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-auto">{total} total</span>}
              </h3>
              <div className="overflow-x-auto -mx-6">
                <div className="inline-block min-w-full align-middle px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="table-header">Date</th>
                        <th className="table-header">Item</th>
                        <th className="table-header">Type</th>
                        <th className="table-header text-right">Quantity</th>
                        <th className="table-header">Reference</th>
                        <th className="table-header">User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <EmptyState title="No movements" description="No stock movements recorded yet." icon={<ClipboardList className="w-10 h-10" />} />
                          </td>
                        </tr>
                      ) : (
                        movements.map((m, i) => (
                          <tr key={m.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                            <td className="table-cell text-gray-400 dark:text-gray-500 text-xs font-mono tabular-nums whitespace-nowrap">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
                            <td className="table-cell font-medium text-gray-900 dark:text-white">{m.product_name || m.material_name || 'N/A'}</td>
                            <td className="table-cell">
                              <span className={`badge-${m.change_type === 'in' ? 'success' : m.change_type === 'out' ? 'danger' : 'warning'}`}>
                                {m.change_type}
                              </span>
                            </td>
                            <td className="table-cell text-right tabular-nums font-medium text-gray-900 dark:text-white">{Math.abs(m.quantity)}</td>
                            <td className="table-cell text-gray-600 dark:text-gray-400">{m.reference_type || 'Manual'}</td>
                            <td className="table-cell text-gray-600 dark:text-gray-400">{m.user_name || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
            </div>
          )}

          {tab === 'alerts' && lowStock && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-yellow-500" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-400" />
                <h3 className="card-title mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  </span>
                  Low Stock Products
                </h3>
                {lowStock.low_stock_products?.length === 0 ? (
                  <div className="mb-5">
                    <EmptyState title="All clear" description="No products are running low on stock." icon={<Package className="w-10 h-10" />} />
                  </div>
                ) : (
                  <div className="space-y-2 mb-6">
                    {lowStock.low_stock_products?.map((p: any, i: number) => (
                      <div key={p.id} onClick={() => navigate('/products')} className="flex justify-between items-center p-3.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl animate-fade-in hover:shadow-premium-sm hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-all duration-200 cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-100 dark:ring-amber-900/30" />
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{p.product_name}</span>
                        </div>
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{p.quantity} / {p.min_stock}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <span className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </span>
                    Out of Stock Products
                  </h4>
                  {lowStock.out_of_stock_products?.length === 0 ? (
                    <EmptyState title="All in stock" description="No products are out of stock." icon={<Package className="w-10 h-10" />} />
                  ) : (
                    <div className="space-y-2">
                      {lowStock.out_of_stock_products?.map((p: any, i: number) => (
                        <div key={p.id} onClick={() => navigate('/products')} className="flex justify-between items-center p-3.5 bg-red-50 dark:bg-red-900/10 rounded-xl animate-fade-in hover:shadow-premium-sm hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-red-100 dark:ring-red-900/30" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{p.product_name}</span>
                          </div>
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">Out of Stock</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-yellow-500" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-400" />
                <h3 className="card-title mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  </span>
                  Low Stock Materials
                </h3>
                {lowStock.low_stock_materials?.length === 0 ? (
                  <div className="mb-5">
                    <EmptyState title="All clear" description="No materials are running low on stock." icon={<Box className="w-10 h-10" />} />
                  </div>
                ) : (
                  <div className="space-y-2 mb-6">
                    {lowStock.low_stock_materials?.map((m: any, i: number) => (
                      <div key={m.id} onClick={() => navigate('/materials')} className="flex justify-between items-center p-3.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl animate-fade-in hover:shadow-premium-sm hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-all duration-200 cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-100 dark:ring-amber-900/30" />
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{m.material_name}</span>
                        </div>
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{m.quantity} / {m.min_stock} <span className="text-amber-500 text-xs font-normal">{m.unit}</span></span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <span className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </span>
                    Out of Stock Materials
                  </h4>
                  {lowStock.out_of_stock_materials?.length === 0 ? (
                    <EmptyState title="All in stock" description="No materials are out of stock." icon={<Box className="w-10 h-10" />} />
                  ) : (
                    <div className="space-y-2">
                      {lowStock.out_of_stock_materials?.map((m: any, i: number) => (
                        <div key={m.id} onClick={() => navigate('/materials')} className="flex justify-between items-center p-3.5 bg-red-50 dark:bg-red-900/10 rounded-xl animate-fade-in hover:shadow-premium-sm hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-red-100 dark:ring-red-900/30" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{m.material_name}</span>
                          </div>
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">Out of Stock</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title={`Adjust ${adjustType === 'product' ? 'Product' : 'Material'} Stock`} size="sm">
        <div className="space-y-4">
          {adjustType === 'product' ? (
            <div>
              <label className="input-label">Select Product</label>
              <select value={adjustItem ?? ''} onChange={e => setAdjustItem(Number(e.target.value))} className="input-field">
                <option value="">Choose...</option>
                {stock.products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.quantity})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="input-label">Select Material</label>
              <select value={adjustItem ?? ''} onChange={e => setAdjustItem(Number(e.target.value))} className="input-field">
                <option value="">Choose...</option>
                {stock.materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="input-label">New Quantity</label>
            <input type="number" min="0" step="any" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} className="input-field" placeholder="Enter new stock quantity" />
          </div>
          <div>
            <label className="input-label">Notes (optional)</label>
            <textarea value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)} className="input-field" rows={3} placeholder="Reason for adjustment" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAdjustOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={doAdjust} disabled={adjusting || !adjustItem || !adjustQty} className="btn-primary">
              {adjusting ? 'Adjusting...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
