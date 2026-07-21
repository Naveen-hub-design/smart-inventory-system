import { useState } from 'react'
import toast from 'react-hot-toast'
import { variantService } from '../../services/dataService'
import { ProductVariant, Product } from '../../types'
import { GARMENT_COLORS, getColorHex } from '../../constants/colors'

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL']

interface Props {
  variant?: ProductVariant | null
  products: Product[]
  onSuccess: () => void
  onCancel: () => void
}

export default function VariantForm({ variant, products, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState(variant?.product_id?.toString() || '')
  const [size, setSize] = useState(variant?.size || '')
  const [color, setColor] = useState(variant?.color || '')
  const [stock, setStock] = useState(variant?.stock?.toString() || '0')
  const [minStock, setMinStock] = useState(variant?.min_stock?.toString() || '10')
  const [costPrice, setCostPrice] = useState(variant?.cost_price?.toString() || '0')
  const [sellingPrice, setSellingPrice] = useState(variant?.selling_price?.toString() || '0')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) { toast.error('Select a product'); return }

    setLoading(true)
    try {
      const data: any = {
        product_id: Number(productId),
        size: size || undefined,
        color: color || undefined,
        stock: Number(stock),
        min_stock: Number(minStock),
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
      }

      if (variant) {
        await variantService.update(variant.id, data)
        toast.success('Variant updated')
      } else {
        await variantService.create(data)
        toast.success('Variant created — SKU, barcode and QR code auto-generated')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="form-label">Product *</label>
          <select value={productId} onChange={(e) => {
            setProductId(e.target.value)
            const prod = products.find(p => p.id === Number(e.target.value))
            if (prod && !variant) {
              if (!sellingPrice || sellingPrice === '0') setSellingPrice(prod.price.toString())
            }
          }} className="select-field" required>
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
          </select>
        </div>

        {variant && (
          <div>
            <label className="form-label">SKU</label>
            <input type="text" value={variant.sku || ''} className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-secondary cursor-not-allowed" disabled />
          </div>
        )}

        {!variant && (
          <div className="md:col-span-1">
            <div className="h-full flex items-end pb-1">
              <p className="text-hint italic">
                SKU, barcode and QR code are auto-generated on creation.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="form-label">Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value)} className="select-field">
            <option value="">Select Size</option>
            {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            {variant && variant.size && !STANDARD_SIZES.includes(variant.size) && (
              <option value={variant.size}>{variant.size} (existing)</option>
            )}
          </select>
        </div>

        <div>
          <label className="form-label">Color</label>
          <select value={color} onChange={(e) => setColor(e.target.value)} className="select-field">
            <option value="">Select Color</option>
            {GARMENT_COLORS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
            {variant && variant.color && !GARMENT_COLORS.includes(variant.color) && (
              <option value={variant.color}>{variant.color} (existing)</option>
            )}
          </select>
          {color && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: getColorHex(color) }} />
              <span className="text-xs text-gray-500">{color}</span>
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Stock</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="input-field" placeholder="0" />
        </div>

        <div>
          <label className="form-label">Min Stock</label>
          <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="input-field" placeholder="10" />
        </div>

        <div>
          <label className="form-label">Cost Price</label>
          <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="input-field" placeholder="0.00" />
        </div>

        <div>
          <label className="form-label">Selling Price</label>
          <input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="input-field" placeholder="0.00" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </span>
          ) : variant ? 'Update Variant' : 'Create Variant'}
        </button>
      </div>
    </form>
  )
}
