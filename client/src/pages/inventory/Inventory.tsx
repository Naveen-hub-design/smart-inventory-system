import { useState, useEffect } from 'react'
import { BarChart3, AlertTriangle } from 'lucide-react'
import { inventoryService } from '../../services/dataService'
import { InventoryLog } from '../../types'
import Pagination from '../../components/ui/Pagination'
import { CardSkeleton } from '../../components/ui/LoadingSkeleton'

export default function Inventory() {
  const [stock, setStock] = useState<{ products: any[]; materials: any[] }>({ products: [], materials: [] })
  const [movements, setMovements] = useState<InventoryLog[]>([])
  const [lowStock, setLowStock] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [tab, setTab] = useState<'stock' | 'movements' | 'alerts'>('stock')

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-gray-500 mt-1">Monitor stock levels and movements</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['stock', 'movements', 'alerts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'stock' ? 'Current Stock' : t === 'movements' ? 'Stock Movements' : 'Low Stock Alerts'}
          </button>
        ))}
      </div>

      {loading ? <CardSkeleton /> : (
        <>
          {tab === 'stock' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2">Product</th>
                        <th className="py-2 text-right">Quantity</th>
                        <th className="py-2 text-right">Min Stock</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.products.map((p: any) => (
                        <tr key={p.id} className="border-b">
                          <td className="py-2">{p.name}</td>
                          <td className="py-2 text-right">{p.quantity}</td>
                          <td className="py-2 text-right">{p.min_stock}</td>
                          <td className="py-2">{statusBadge(p.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Raw Materials</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2">Material</th>
                        <th className="py-2 text-right">Quantity</th>
                        <th className="py-2 text-right">Min Stock</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.materials.map((m: any) => (
                        <tr key={m.id} className="border-b">
                          <td className="py-2">{m.name}</td>
                          <td className="py-2 text-right">{m.quantity} {m.unit}</td>
                          <td className="py-2 text-right">{m.min_stock}</td>
                          <td className="py-2">{statusBadge(m.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'movements' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Stock Movements</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">Date</th>
                      <th className="py-2">Item</th>
                      <th className="py-2">Type</th>
                      <th className="py-2 text-right">Quantity</th>
                      <th className="py-2">Reference</th>
                      <th className="py-2">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b">
                        <td className="py-2">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
                        <td className="py-2">{m.product_name || m.material_name || 'N/A'}</td>
                        <td className="py-2">
                          <span className={`badge-${m.change_type === 'in' ? 'success' : m.change_type === 'out' ? 'danger' : 'warning'}`}>
                            {m.change_type}
                          </span>
                        </td>
                        <td className="py-2 text-right">{Math.abs(m.quantity)}</td>
                        <td className="py-2">{m.reference_type || 'Manual'}</td>
                        <td className="py-2">{m.user_name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
            </div>
          )}

          {tab === 'alerts' && lowStock && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card ring-2 ring-yellow-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" /> Low Stock Products
                </h3>
                {lowStock.low_stock_products?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No low stock products</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.low_stock_products?.map((p: any) => (
                      <div key={p.id} className="flex justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <span>{p.product_name}</span>
                        <span className="font-medium">{p.quantity} / {p.min_stock}</span>
                      </div>
                    ))}
                  </div>
                )}
                <h4 className="font-semibold mt-4 mb-2 flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" /> Out of Stock Products
                </h4>
                {lowStock.out_of_stock_products?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No out of stock products</p>
                ) : (
                  lowStock.out_of_stock_products?.map((p: any) => (
                    <div key={p.id} className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-1">
                      <span>{p.product_name}</span>
                      <span className="font-medium text-red-600">Out of Stock</span>
                    </div>
                  ))
                )}
              </div>
              <div className="card ring-2 ring-yellow-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" /> Low Stock Materials
                </h3>
                {lowStock.low_stock_materials?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No low stock materials</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.low_stock_materials?.map((m: any) => (
                      <div key={m.id} className="flex justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <span>{m.material_name}</span>
                        <span className="font-medium">{m.quantity} / {m.min_stock} {m.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                <h4 className="font-semibold mt-4 mb-2 flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" /> Out of Stock Materials
                </h4>
                {lowStock.out_of_stock_materials?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No out of stock materials</p>
                ) : (
                  lowStock.out_of_stock_materials?.map((m: any) => (
                    <div key={m.id} className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-1">
                      <span>{m.material_name}</span>
                      <span className="font-medium text-red-600">Out of Stock</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
