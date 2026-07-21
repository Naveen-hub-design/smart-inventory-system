import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Package, Ruler, X, ChevronDown, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService, categoryService, variantService } from '../../services/dataService'
import { Product, Category, ProductVariant } from '../../types'
import { getColorHex } from '../../constants/colors'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import ProductForm from './ProductForm'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || '/uploads'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [sizeModalOpen, setSizeModalOpen] = useState(false)
  const [sizeProduct, setSizeProduct] = useState<Product | null>(null)
  const [sizeVariants, setSizeVariants] = useState<ProductVariant[]>([])
  const [sizeLoading, setSizeLoading] = useState(false)

  const fetchProducts = async (searchVal = search, pageVal = page) => {
    setLoading(true)
    try {
      const params: any = { page: pageVal, per_page: 10, search: searchVal, sort_by: 'created_at', sort_order: 'desc' }
      if (categoryFilter) params.category_id = categoryFilter
      const res = await productService.getAll(params)
      setProducts(res.data.products)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { console.error('Failed to fetch products') } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [page, categoryFilter])

  useEffect(() => {
    categoryService.getAll().then(res => setCategories(res.data.categories)).catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await productService.delete(id)
      toast.success('Product deleted')
      fetchProducts()
    } catch { console.error('Failed to delete product') }
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const openSizeView = async (product: Product) => {
    setSizeProduct(product)
    setSizeModalOpen(true)
    setSizeLoading(true)
    try {
      const res = await variantService.getByProduct(product.id, { per_page: 100 })
      setSizeVariants(res.data.variants)
    } catch {
      setSizeVariants([])
    } finally {
      setSizeLoading(false)
    }
  }

  const groupedVariants = (variants: ProductVariant[]) => {
    const map: Record<string, ProductVariant[]> = {}
    for (const v of variants) {
      const key = v.color || 'Other'
      if (!map[key]) map[key] = []
      map[key].push(v)
    }
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    for (const [, list] of sorted) {
      list.sort((a, b) => {
        const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL']
        return order.indexOf(a.size || '') - order.indexOf(b.size || '')
      })
    }
    return sorted
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    if (path.startsWith('/uploads/')) return path
    return `${UPLOADS_URL.replace(/\/+$/, '')}/products/${path.replace(/^\/+/, '')}`
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your product catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
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
                placeholder="Search products..."
                className="input-field pl-10 pr-9"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); fetchProducts('', 1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <div className="relative w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              className="select-field w-full"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-gray-400" />}
            title="No products found"
            description="Add your first product to get started."
            action={<button onClick={openCreate} className="btn-primary">Add Product</button>}
          />
        ) : (
          <>
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-header">Product</th>
                      <th className="table-header">Category</th>
                      <th className="table-header">Size</th>
                      <th className="table-header">Color</th>
                      <th className="table-header text-right">Price</th>
                      <th className="table-header text-right">Stock</th>
                      <th className="table-header text-center">Status</th>
                      <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, i) => (
                    <tr
                      key={product.id}
                      className="table-row animate-fade-in"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0">
                              <img src={getImageUrl(product.image) ?? undefined} alt={product.product_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
                              <div className="hidden w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200/50 dark:border-primary-700/30 flex items-center justify-center shrink-0">
                              <Package className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{product.product_name}</span>
                            {product.description && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{product.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {product.category_name ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {product.category_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className="text-body">{product.size || <span className="text-gray-400">N/A</span>}</span>
                      </td>
                      <td className="table-cell">
                        {product.color ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/10" style={{ backgroundColor: getColorHex(product.color) }} />
                            <span className="text-body">{product.color}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="table-cell text-right">
                        <span className="font-medium tabular-nums text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</span>
                      </td>
                      <td className="table-cell text-right">
                        <span className={`tabular-nums font-medium ${
                          product.quantity <= 0 ? 'text-red-600 dark:text-red-400' :
                          product.quantity <= product.min_stock ? 'text-amber-600 dark:text-amber-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {product.quantity}
                        </span>
                        {product.quantity <= product.min_stock && product.quantity > 0 && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Low</span>
                        )}
                        {product.quantity <= 0 && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Out</span>
                        )}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-700/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200/50 dark:ring-gray-700/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            product.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`} />
                          {product.status}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openSizeView(product)} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm" title="View Sizes">
                            <Ruler className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </button>
                          <button onClick={() => openEdit(product)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm" title="Edit">
                            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm" title="Delete">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'} size="xl">
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSuccess={() => { setModalOpen(false); fetchProducts() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={sizeModalOpen} onClose={() => setSizeModalOpen(false)} title={`Sizes — ${sizeProduct?.product_name || ''}`} size="lg">
        {sizeLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sizeVariants.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-secondary">No size variants for this product.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedVariants(sizeVariants).map(([color, variants]) => (
              <div key={color} className="animate-fade-in">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-4 h-4 rounded-full ring-1 ring-black/10 dark:ring-white/10" style={{ backgroundColor: getColorHex(color) }} />
                  <span className="font-semibold text-gray-900 dark:text-white">{color}</span>
                  <span className="text-hint bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{variants.length} size{variants.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <div
                      key={v.id}
                      className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-200 hover:shadow-premium-sm ${
                        v.stock <= v.min_stock
                          ? 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-900/10 text-red-700 dark:text-red-300'
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:border-primary-200 dark:hover:border-primary-700'
                      }`}
                    >
                      <span className="tabular-nums font-semibold">{v.size}</span>
                      <span className={`text-xs ml-2 ${v.stock <= v.min_stock ? 'text-red-500' : 'text-gray-400'}`}>
                        {v.stock} in stock
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2 font-mono">{v.sku}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
