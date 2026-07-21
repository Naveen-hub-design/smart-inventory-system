import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, X, Package, Image as ImageIcon } from 'lucide-react'
import { productService, variantService } from '../../services/dataService'
import { Product, Category, ProductVariant } from '../../types'
import { GARMENT_COLORS, getColorHex } from '../../constants/colors'

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL']

const productSchema = z.object({
  product_name: z.string().min(1, 'Product name required'),
  category_id: z.string().optional(),
  price: z.string().min(1, 'Price required'),
  quantity: z.string().optional(),
  min_stock: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface VariantEntry {
  key: number
  size: string
  color: string
  stock: string
  cost_price: string
  selling_price: string
}

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  onSuccess: () => void
  onCancel: () => void
}

export default function ProductForm({ product, categories, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [variants, setVariants] = useState<VariantEntry[]>([])
  const [existingVariants, setExistingVariants] = useState<ProductVariant[]>([])
  const [nextKey, setNextKey] = useState(1)

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      product_name: product.product_name,
      category_id: product.category_id?.toString() || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      min_stock: product.min_stock.toString(),
      status: product.status,
      description: product.description || '',
    } : {
      status: 'active',
      min_stock: '10',
    }
  })

  useEffect(() => {
    if (product?.id) {
      variantService.getByProduct(product.id, { per_page: 100 }).then((res: any) => {
        if (res.data?.variants) {
          setExistingVariants(res.data.variants)
        }
      }).catch(() => {})
    }
  }, [product?.id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const addVariant = () => {
    setVariants(prev => [...prev, {
      key: nextKey, size: '', color: '', stock: '0', cost_price: '0', selling_price: '',
    }])
    setNextKey(k => k + 1)
  }

  const removeVariant = (key: number) => {
    setVariants(prev => prev.filter(v => v.key !== key))
  }

  const updateVariant = (key: number, field: keyof VariantEntry, value: string) => {
    setVariants(prev => prev.map(v => v.key === key ? { ...v, [field]: value } : v))
  }

  const variantStockSum = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
  const totalStock = variantStockSum + existingVariants.reduce((s, v) => s + v.stock, 0)
  const hasExistingVariants = existingVariants.length > 0
  const hasNewVariants = variants.length > 0

  function priceError(v: VariantEntry): string | null {
    const cost = Number(v.cost_price)
    const sell = Number(v.selling_price)
    if (sell > 0 && cost > 0 && sell < cost) {
      return 'Selling Price cannot be less than Cost Price.'
    }
    return null
  }

  const hasPriceError = variants.some(v => priceError(v) !== null)

  const onSubmit = async (data: ProductFormData) => {
    if (!product && variants.length === 0) {
      toast.error('Add at least one variant')
      return
    }

    for (const v of variants) {
      const err = priceError(v)
      if (err) {
        toast.error(err)
        return
      }
    }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })
      if (imageFile) formData.append('image', imageFile)
      if (hasExistingVariants || hasNewVariants) {
        formData.set('quantity', totalStock.toString())
      }

      if (product) {
        await productService.update(product.id, formData)
        for (const v of variants) {
          await variantService.create({
            product_id: product.id,
            size: v.size || undefined,
            color: v.color || undefined,
            stock: Number(v.stock) || 0,
            cost_price: Number(v.cost_price) || 0,
            selling_price: Number(v.selling_price) || Number(data.price),
          })
        }
        toast.success('Product updated')
      } else {
        const res = await productService.create(formData)
        const pid = res.data?.product?.id || res.data?.id
        for (const v of variants) {
          await variantService.create({
            product_id: pid,
            size: v.size || undefined,
            color: v.color || undefined,
            stock: Number(v.stock) || 0,
            cost_price: Number(v.cost_price) || 0,
            selling_price: Number(v.selling_price) || Number(data.price),
          })
        }
        toast.success('Product created with variants')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="form-label">Product Name *</label>
          <input {...register('product_name')} className="input-field" placeholder="Enter product name" />
          {errors.product_name && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.product_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Category</label>
          <select {...register('category_id')} className="select-field">
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Price *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
            <input {...register('price')} type="number" step="0.01" className="input-field pl-8" placeholder="0.00" />
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.price.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Min Stock Alert</label>
          <input {...register('min_stock')} type="number" className="input-field" placeholder="10" />
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Quantity</label>
          {hasExistingVariants || hasNewVariants ? (
            <div className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-secondary cursor-not-allowed flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              Auto-calculated from variants: {totalStock}
            </div>
          ) : (
            <input {...register('quantity')} type="number" className="input-field" placeholder="0" />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Status</label>
          <select {...register('status')} className="select-field">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="form-label">Image</label>
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-secondary hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-300">
                <ImageIcon className="w-4 h-4" />
                <span>{imageFile ? imageFile.name : product?.image ? 'Change image' : 'Upload image'}</span>
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {(imagePreview || product?.image) && (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0">
                <img src={imagePreview || product?.image || ''} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">Description</label>
        <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Product description..." />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Product Variants</h3>
            <p className="text-muted mt-0.5">Add size and color combinations</p>
          </div>
          <button type="button" onClick={addVariant} className="btn-primary">
            <Plus className="w-3.5 h-3.5" /> Add Variant
          </button>
        </div>

        {hasExistingVariants && (
          <div className="mb-5 animate-fade-in">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Existing Variants</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {existingVariants.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-premium-sm">
                  <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/10 shrink-0" style={{ backgroundColor: getColorHex(v.color || '') }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">{v.color}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[36px]">{v.size}</span>
                  <span className="text-[11px] text-gray-400 font-mono flex-1 truncate">{v.sku}</span>
                  <span className="text-body font-medium tabular-nums">Stock: {v.stock}</span>
                  {v.stock <= v.min_stock && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">Low</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasNewVariants && (
          <div className="space-y-3 animate-fade-in">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {hasExistingVariants ? 'New Variants' : 'Variants'}
            </h4>
            {variants.map((v) => (
              <div key={v.key} className="flex flex-wrap items-end gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 relative animate-fade-in transition-all duration-200 hover:shadow-premium-sm hover:border-gray-300 dark:hover:border-gray-600">
                <div className="min-w-[140px] flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Color</label>
                  <select value={v.color} onChange={(e) => updateVariant(v.key, 'color', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300">
                    <option value="">Select Color</option>
                    {GARMENT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {v.color && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-3 h-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: getColorHex(v.color) }} />
                      <span className="text-[10px] text-gray-400 font-medium">{v.color}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-[80px] flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Size</label>
                  <select value={v.size} onChange={(e) => updateVariant(v.key, 'size', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300">
                    <option value="">Size</option>
                    {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="w-[70px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Stock</label>
                  <input type="number" value={v.stock} onChange={(e) => updateVariant(v.key, 'stock', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="0" />
                </div>
                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Cost ₹</label>
                  <input type="number" step="0.01" value={v.cost_price} onChange={(e) => updateVariant(v.key, 'cost_price', e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="0" />
                </div>
                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sell ₹</label>
                  <input type="number" step="0.01" value={v.selling_price} onChange={(e) => updateVariant(v.key, 'selling_price', e.target.value)} className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 ${priceError(v) ? 'border-red-400 dark:border-red-500 focus:border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-primary-400/50'}`} placeholder="0" />
                  {priceError(v) && <p className="text-red-500 text-[10px] mt-1">{priceError(v)}</p>}
                </div>
                <div className="w-[70px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">SKU</label>
                  <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-400 text-center cursor-not-allowed">Auto</div>
                </div>
                <div className="w-[70px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Barcode</label>
                  <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-400 text-center cursor-not-allowed">Auto</div>
                </div>
                <button type="button" onClick={() => removeVariant(v.key)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 mb-0.5" title="Remove variant">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!hasExistingVariants && !hasNewVariants && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl transition-colors hover:border-gray-300 dark:hover:border-gray-600">
            <Package className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No variants added yet.</p>
            <p className="text-hint mt-0.5">Click &ldquo;+ Add Variant&rdquo; to add size/color combinations.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
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
