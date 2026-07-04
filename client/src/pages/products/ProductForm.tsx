import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { productService } from '../../services/dataService'
import { Product, Category } from '../../types'

const productSchema = z.object({
  product_name: z.string().min(1, 'Product name required'),
  category_id: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  price: z.string().min(1, 'Price required'),
  quantity: z.string().min(1, 'Quantity required'),
  min_stock: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  barcode: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  onSuccess: () => void
  onCancel: () => void
}

export default function ProductForm({ product, categories, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      product_name: product.product_name,
      category_id: product.category_id?.toString() || '',
      size: product.size || '',
      color: product.color || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      min_stock: product.min_stock.toString(),
      status: product.status,
      description: product.description || '',
      barcode: product.barcode || '',
    } : {
      status: 'active',
      quantity: '0',
      min_stock: '10',
    }
  })

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })
      if (imageFile) formData.append('image', imageFile)

      if (product) {
        await productService.update(product.id, formData)
        toast.success('Product updated')
      } else {
        await productService.create(formData)
        toast.success('Product created')
      }
      onSuccess()
    } catch {
      toast.error('Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Name *</label>
          <div className="relative group">
            <input {...register('product_name')} className="input-field peer" placeholder="Enter product name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.product_name && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errors.product_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
          <select {...register('category_id')} className="input-field">
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Size</label>
          <div className="relative group">
            <input {...register('size')} className="input-field peer" placeholder="e.g. M, L, XL, 32" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
          <div className="relative group">
            <input {...register('color')} className="input-field peer" placeholder="e.g. Red, Blue" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price *</label>
          <div className="relative group">
            <input {...register('price')} type="number" step="0.01" className="input-field peer" placeholder="0.00" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errors.price.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
          <div className="relative group">
            <input {...register('quantity')} type="number" className="input-field peer" placeholder="0" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.quantity && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errors.quantity.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Min Stock</label>
          <input {...register('min_stock')} type="number" className="input-field" placeholder="10" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Barcode</label>
          <input {...register('barcode')} className="input-field" placeholder="Auto-generated if empty" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
          <select {...register('status')} className="input-field">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="input-field file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50" />
          {product?.image && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {product.image}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
        <textarea {...register('description')} rows={3} className="input-field" placeholder="Product description..." />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary shadow-lg shadow-primary-500/20">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </span>
          ) : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}
