import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { saleService, productService } from '../../services/dataService'
import { Product } from '../../types'

interface SaleItemForm {
  product_id: string
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
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleItemForm[]>([{ product_id: '', quantity: '1', unit_price: '0', discount: '0' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    productService.getAll({ per_page: 100, status: 'active' }).then(r => setProducts(r.data.products)).catch(() => { })
  }, [])

  const addItem = () => setItems([...items, { product_id: '', quantity: '1', unit_price: '0', discount: '0' }])
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: keyof SaleItemForm, value: string) => {
    const newItems = [...items]
    newItems[i] = { ...newItems[i], [field]: value }

    if (field === 'product_id') {
      const prod = products.find(p => p.id === Number(value))
      if (prod) {
        newItems[i].unit_price = prod.price.toString()
      }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Customer Name</label>
          <div className="relative group">
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field peer" placeholder="Customer name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment Method</label>
          <div className="relative group">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field peer">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
            <option value="other">Other</option>
            </select>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount</label>
            <div className="relative group">
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input-field peer" placeholder="0" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tax</label>
            <div className="relative group">
              <input type="number" value={tax} onChange={(e) => setTax(e.target.value)} className="input-field peer" placeholder="0" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sale Items</label>
          <button type="button" onClick={addItem} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1 font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700/30">
              <div className="relative group flex-1">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                  className="input-field w-full peer"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.product_name} <span className="text-gray-400">(Stock: {p.quantity})</span></option>
                  ))}
                </select>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <div className="relative group w-20">
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="input-field w-full peer" placeholder="Qty" required />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <div className="relative group w-28">
                <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} className="input-field w-full peer" placeholder="Price" required />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <div className="relative group w-24">
                <input type="number" step="0.01" value={item.discount} onChange={(e) => updateItem(i, 'discount', e.target.value)} className="input-field w-full peer" placeholder="Disc" />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors hover:scale-110 active:scale-95 self-start mt-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 p-5 rounded-xl space-y-1.5 text-sm border border-gray-100 dark:border-gray-700/30">
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal:</span><span className="font-medium text-gray-900 dark:text-white">₹{totalAmount.toLocaleString()}</span></div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Discount:</span><span className="font-medium text-red-600">-₹{Number(discount).toLocaleString()}</span></div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tax:</span><span className="font-medium text-gray-900 dark:text-white">₹{Number(tax).toLocaleString()}</span></div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5 flex justify-between font-bold text-base"><span className="text-gray-900 dark:text-white">Grand Total:</span><span className="text-primary-600 dark:text-primary-400">₹{grandTotal.toLocaleString()}</span></div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
        <div className="relative group">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field peer" placeholder="Additional notes..." />
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary shadow-lg shadow-primary-500/20">
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
