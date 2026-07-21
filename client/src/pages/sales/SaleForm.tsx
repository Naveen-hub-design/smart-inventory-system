import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Percent, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { saleService, productService, variantService } from '../../services/dataService'
import { Product, ProductVariant } from '../../types'

interface SaleItemForm {
  product_id: string
  variant_id: string
  quantity: string
  unit_price: string
  discount: string
}

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function SaleForm({ onSuccess, onCancel }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [productVariants, setProductVariants] = useState<Record<number, ProductVariant[]>>({})
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleItemForm[]>([{ product_id: '', variant_id: '', quantity: '1', unit_price: '0', discount: '0' }])
  const [loading, setLoading] = useState(false)
  const [skuSearch, setSkuSearch] = useState('')
  const [skuResults, setSkuResults] = useState<ProductVariant[]>([])
  const [searchingSku, setSearchingSku] = useState(false)

  useEffect(() => {
    productService.getAll({ per_page: 100, status: 'active' }).then(r => setProducts(r.data.products)).catch(() => console.error('Failed to load products'))
  }, [])

  const loadVariants = async (productId: number) => {
    if (productVariants[productId]) return
    try {
      const res = await variantService.getByProduct(productId)
      setProductVariants(prev => ({ ...prev, [productId]: res.data.variants }))
    } catch { console.error('Failed to load product variants') }
  }

  const doSkuSearch = async (q: string) => {
    if (!q || q.length < 2) { setSkuResults([]); return }
    setSearchingSku(true)
    try {
      const res = await variantService.getAll({ search: q, per_page: 10 })
      setSkuResults(res.data.variants || [])
    } catch { setSkuResults([]) } finally { setSearchingSku(false) }
  }

  const addFromSkuSearch = (v: ProductVariant) => {
    setItems(prev => [...prev, {
      product_id: v.product_id.toString(),
      variant_id: v.id.toString(),
      quantity: '1',
      unit_price: v.selling_price.toString(),
      discount: '0',
    }])
    if (!productVariants[v.product_id]) {
      loadVariants(v.product_id)
    }
    setSkuSearch('')
    setSkuResults([])
  }

  const addItem = () => setItems([...items, { product_id: '', variant_id: '', quantity: '1', unit_price: '0', discount: '0' }])
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: keyof SaleItemForm, value: string) => {
    const newItems = [...items]
    newItems[i] = { ...newItems[i], [field]: value }

    if (field === 'product_id') {
      newItems[i].variant_id = ''
      const prod = products.find(p => p.id === Number(value))
      if (prod) {
        newItems[i].unit_price = prod.price.toString()
      }
      if (value) loadVariants(Number(value))
    }
    if (field === 'variant_id' && value) {
      const pid = Number(newItems[i].product_id)
      const variants = productVariants[pid] || []
      const v = variants.find(x => x.id === Number(value))
      if (v) newItems[i].unit_price = v.selling_price.toString()
    }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount) || 0)
  }, 0)

  const grandTotal = totalAmount + Number(tax) - Number(discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.some(i => !i.product_id)) { toast.error('Fill all item fields'); return }

    setLoading(true)
    try {
      await saleService.create({
        customer_name: customerName,
        payment_method: paymentMethod,
        discount: Number(discount),
        tax: Number(tax),
        notes,
        items: items.map(i => ({
          product_id: Number(i.product_id),
          variant_id: i.variant_id ? Number(i.variant_id) : undefined,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          discount: Number(i.discount),
        }))
      })
      toast.success('Sale created')
      onSuccess()
    } catch (err: any) {
      const msg = err.response?.data?.details?.[0] || err.response?.data?.error || 'Failed to create sale'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="form-label">Customer Name</label>
          <div className="relative group">
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field" placeholder="Customer name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="form-label">Payment Method</label>
          <div className="relative group">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="select-field">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
            <option value="other">Other</option>
            </select>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="form-label">Discount</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Percent className="w-3.5 h-3.5" />
              </div>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input-field pl-9 pr-3.5" placeholder="0" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="form-label">Tax</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <input type="number" value={tax} onChange={(e) => setTax(e.target.value)} className="input-field pl-9 pr-3.5" placeholder="0" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sale Items</h3>
            <p className="text-muted mt-0.5">Add products or search by SKU/barcode</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={skuSearch} onChange={(e) => { setSkuSearch(e.target.value); doSkuSearch(e.target.value) }} placeholder="Search SKU or Barcode..." className="w-48 pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" />
              {searchingSku && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            {skuResults.length > 0 && (
              <div className="relative">
                <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl shadow-black/5 dark:shadow-black/20 z-50 max-h-48 overflow-y-auto animate-fade-in">
                  {skuResults.map(v => (
                    <button key={v.id} type="button" onClick={() => addFromSkuSearch(v)} className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-2.5 transition-colors">
                      <span className="font-mono text-primary-600 dark:text-primary-400 font-medium">{v.sku}</span>
                      <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{v.product_name} - {v.color} {v.size}</span>
                      <span className="text-gray-400 font-medium">₹{v.selling_price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-xs font-medium rounded-lg shadow-sm shadow-primary-500/20 hover:shadow-md hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
        </div>
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start p-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700/30 hover:border-gray-200 dark:hover:border-gray-600/50 hover:shadow-premium-sm transition-all duration-200 animate-fade-in">
              <div className="flex-1 space-y-1.5">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.product_name} <span className="text-gray-400">(Stock: {p.quantity})</span></option>
                  ))}
                </select>
                {item.product_id && (productVariants[Number(item.product_id)]?.length > 0) && (
                  <select
                    value={item.variant_id}
                    onChange={(e) => updateItem(i, 'variant_id', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="">Select Variant</option>
                    {productVariants[Number(item.product_id)].map(v => (
                      <option key={v.id} value={v.id}>{v.color} / {v.size} <span className="text-gray-400">(Stock: {v.stock})</span></option>
                    ))}
                  </select>
                )}
              </div>
              <div className="relative group w-20">
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="input-field" placeholder="Qty" required />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <div className="relative group w-28">
                <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} className="input-field" placeholder="Price" required />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <div className="relative group w-24">
                <input type="number" step="0.01" value={item.discount} onChange={(e) => updateItem(i, 'discount', e.target.value)} className="input-field" placeholder="Disc" />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-90 self-start mt-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-800/10 p-5 rounded-xl space-y-1.5 text-sm border border-gray-100 dark:border-gray-700/30">
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal:</span><span className="font-medium text-gray-900 dark:text-white tabular-nums">₹{totalAmount.toLocaleString()}</span></div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Discount:</span><span className="font-medium text-red-600 tabular-nums">-₹{Number(discount).toLocaleString()}</span></div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tax:</span><span className="font-medium text-gray-900 dark:text-white tabular-nums">₹{Number(tax).toLocaleString()}</span></div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5 flex justify-between font-bold text-base"><span className="text-gray-900 dark:text-white">Grand Total:</span><span className="text-primary-600 dark:text-primary-400 tabular-nums">₹{grandTotal.toLocaleString()}</span></div>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">Notes</label>
        <div className="relative group">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field resize-none" placeholder="Additional notes..." />
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Creating...
            </span>
          ) : 'Create Sale'}
        </button>
      </div>
    </form>
  )
}
