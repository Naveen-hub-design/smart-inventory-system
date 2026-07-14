import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BarChart3, AlertTriangle } from 'lucide-react'
import { inventoryService } from '../../services/dataService'
import { InventoryLog } from '../../types'
import Pagination from '../../components/ui/Pagination'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'

export default function Inventory() {
  const location = useLocation()
  const [stock, setStock] = useState<{ products: any[]; materials: any[] }>({ products: [], materials: [] })
  const [movements, setMovements] = useState<InventoryLog[]>([])
  const [lowStock, setLowStock] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [tab, setTab] = useState<'stock' | 'movements' | 'alerts'>('stock')

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
      } catch { } finally { setLoading(false) }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Inventory</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor stock levels and movements</p>
      </div>

      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 pb-0.5">
        {(['stock', 'movements', 'alerts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
              tab === t
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {t === 'stock' ? 'Current Stock' : t === 'movements' ? 'Stock Movements' : 'Low Stock Alerts'}
          </button>
        ))}
      </div>

      {loading ? <CardSkeleton /> : (
        <>
          {tab === 'stock' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="card">
                <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" /> Products
                </h3>
                <div className="overflow-x-auto">
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
                      {stock.products.map((p: any, i: number) => (
                        <tr key={p.id} className="table-row" style={{ animationDelay: `${i * 30}ms` }}>
                          <td className="table-cell font-medium text-gray-900 dark:text-white">{p.name}</td>
                          <td className="table-cell text-right tabular-nums">{p.quantity}</td>
                          <td className="table-cell text-right tabular-nums">{p.min_stock}</td>
                          <td className="table-cell">{statusBadge(p.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Raw Materials
                </h3>
                <div className="overflow-x-auto">
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
                      {stock.materials.map((m: any, i: number) => (
                        <tr key={m.id} className="table-row" style={{ animationDelay: `${i * 30}ms` }}>
                          <td className="table-cell font-medium text-gray-900 dark:text-white">{m.name}</td>
                          <td className="table-cell text-right tabular-nums">{m.quantity} <span className="text-gray-400 text-xs">{m.unit}</span></td>
                          <td className="table-cell text-right tabular-nums">{m.min_stock}</td>
                          <td className="table-cell">{statusBadge(m.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'movements' && (
            <div className="card animate-fade-in">
              <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">Recent Stock Movements</h3>
              <div className="overflow-x-auto">
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
                    {movements.map((m, i) => (
                      <tr key={m.id} className="table-row" style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="table-cell text-gray-500 dark:text-gray-400 text-xs">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
                        <td className="table-cell font-medium text-gray-900 dark:text-white">{m.product_name || m.material_name || 'N/A'}</td>
                        <td className="table-cell">
                          <span className={`badge-${m.change_type === 'in' ? 'success' : m.change_type === 'out' ? 'danger' : 'warning'}`}>
                            {m.change_type}
                          </span>
                        </td>
                        <td className="table-cell text-right tabular-nums font-medium">{Math.abs(m.quantity)}</td>
                        <td className="table-cell">{m.reference_type || 'Manual'}</td>
                        <td className="table-cell">{m.user_name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
            </div>
          )}

          {tab === 'alerts' && lowStock && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-yellow-500" />
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" /> Low Stock Products
                </h3>
                {lowStock.low_stock_products?.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No low stock products</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.low_stock_products?.map((p: any, i: number) => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{p.product_name}</span>
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{p.quantity} / {p.min_stock}</span>
                      </div>
                    ))}
                  </div>
                )}
                <h4 className="font-semibold mt-5 mb-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" /> Out of Stock Products
                </h4>
                {lowStock.out_of_stock_products?.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No out of stock products</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.out_of_stock_products?.map((p: any, i: number) => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{p.product_name}</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">Out of Stock</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-yellow-500" />
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" /> Low Stock Materials
                </h3>
                {lowStock.low_stock_materials?.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No low stock materials</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.low_stock_materials?.map((m: any, i: number) => (
                      <div key={m.id} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{m.material_name}</span>
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{m.quantity} / {m.min_stock} {m.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                <h4 className="font-semibold mt-5 mb-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" /> Out of Stock Materials
                </h4>
                {lowStock.out_of_stock_materials?.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No out of stock materials</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.out_of_stock_materials?.map((m: any, i: number) => (
                      <div key={m.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{m.material_name}</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">Out of Stock</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
