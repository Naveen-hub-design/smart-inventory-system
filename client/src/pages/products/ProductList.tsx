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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="py-3 px-2">Product</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Size</th>
                  <th className="py-3 px-2">Color</th>
                  <th className="py-3 px-2 text-right">Price</th>
                  <th className="py-3 px-2 text-right">Stock</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2 font-medium">{product.product_name}</td>
                    <td className="py-3 px-2">{product.category_name || 'N/A'}</td>
                    <td className="py-3 px-2">{product.size || 'N/A'}</td>
                    <td className="py-3 px-2">{product.color || 'N/A'}</td>
                    <td className="py-3 px-2 text-right">₹{product.price.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={product.quantity <= product.min_stock ? 'text-red-600 font-medium' : ''}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={product.status === 'active' ? 'badge-success' : 'badge-warning'}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-600" />
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
