import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService, categoryService } from '../../services/dataService'
import { Product, Category } from '../../types'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import ProductForm from './ProductForm'

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

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: 10, search, sort_by: 'created_at', sort_order: 'desc' }
      if (categoryFilter) params.category_id = categoryFilter
      const res = await productService.getAll(params)
      setProducts(res.data.products)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [page, categoryFilter])

  useEffect(() => {
    categoryService.getAll().then(res => setCategories(res.data.categories)).catch(() => { })
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
    } catch { }
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your product catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-9"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
            className="input-field w-full sm:w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="table-header">Product</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Size</th>
                  <th className="table-header">Color</th>
                  <th className="table-header text-right">Price</th>
                  <th className="table-header text-right">Stock</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => (
                  <tr key={product.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="table-cell font-medium text-gray-900 dark:text-white">{product.product_name}</td>
                    <td className="table-cell">{product.category_name || 'N/A'}</td>
                    <td className="table-cell">{product.size || 'N/A'}</td>
                    <td className="table-cell"><span className="flex items-center gap-2">{product.color && <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: product.color.toLowerCase() }} />}{product.color || 'N/A'}</span></td>
                    <td className="table-cell text-right font-medium tabular-nums">₹{product.price.toLocaleString()}</td>
                    <td className="table-cell text-right">
                      <span className={`tabular-nums font-medium ${product.quantity <= product.min_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={product.status === 'active' ? 'badge-success' : 'badge-warning'}>
                        {product.status}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
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
    </div>
  )
}
