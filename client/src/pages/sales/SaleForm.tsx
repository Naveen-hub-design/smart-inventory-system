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
          <label className="block text-sm font-medium mb-1">Customer Name</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Discount</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tax</label>
            <input type="number" value={tax} onChange={(e) => setTax(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Sale Items</label>
          <button type="button" onClick={addItem} className="text-sm text-primary-600 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <select
                value={item.product_id}
                onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                className="input-field flex-1"
                required
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.product_name} (Stock: {p.quantity})</option>
                ))}
              </select>
              <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="input-field w-20" placeholder="Qty" required />
              <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} className="input-field w-28" placeholder="Price" required />
              <input type="number" step="0.01" value={item.discount} onChange={(e) => updateItem(i, 'discount', e.target.value)} className="input-field w-24" placeholder="Disc" />
              <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal:</span><span>₹{totalAmount.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Discount:</span><span>-₹{Number(discount).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Tax:</span><span>₹{Number(tax).toLocaleString()}</span></div>
        <div className="flex justify-between font-bold text-base"><span>Grand Total:</span><span>₹{grandTotal.toLocaleString()}</span></div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field" />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create Sale'}
        </button>
      </div>
    </form>
  )
}
