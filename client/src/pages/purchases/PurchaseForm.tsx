import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseService, supplierService, materialService } from '../../services/dataService'
import { Supplier, RawMaterial } from '../../types'

interface PurchaseItemForm {
  material_id: string
  quantity: string
  unit_price: string
}

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function PurchaseForm({ onSuccess, onCancel }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseItemForm[]>([{ material_id: '', quantity: '1', unit_price: '0' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supplierService.getAll({ per_page: 100 }).then(r => setSuppliers(r.data.suppliers)).catch(() => { })
    materialService.getAll({ per_page: 100 }).then(r => setMaterials(r.data.materials)).catch(() => { })
  }, [])

  const addItem = () => setItems([...items, { material_id: '', quantity: '1', unit_price: '0' }])
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: keyof PurchaseItemForm, value: string) => {
    const newItems = [...items]
    newItems[i] = { ...newItems[i], [field]: value }

    if (field === 'material_id') {
      const mat = materials.find(m => m.id === Number(value))
      if (mat) {
        newItems[i].unit_price = mat.cost.toString()
      }
    }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
  }, 0)

  const grandTotal = totalAmount + Number(tax) - Number(discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) { toast.error('Select a supplier'); return }
    if (items.some(i => !i.material_id)) { toast.error('Fill all item fields'); return }

    setLoading(true)
    try {
      await purchaseService.create({
        supplier_id: Number(supplierId),
        discount: Number(discount),
        tax: Number(tax),
        notes,
        items: items.map(i => ({
          material_id: Number(i.material_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        }))
      })
      toast.success('Purchase created')
      onSuccess()
    } catch {
      toast.error('Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Supplier *</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input-field" required>
            <option value="">Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
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
          <label className="text-sm font-medium">Purchase Items</label>
          <button type="button" onClick={addItem} className="text-sm text-primary-600 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <select
                value={item.material_id}
                onChange={(e) => updateItem(i, 'material_id', e.target.value)}
                className="input-field flex-1"
                required
              >
                <option value="">Select Material</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.material_name} ({m.unit})</option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                className="input-field w-24"
                placeholder="Qty"
                required
              />
              <input
                type="number"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                className="input-field w-32"
                placeholder="Price"
                required
              />
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
          {loading ? 'Creating...' : 'Create Purchase'}
        </button>
      </div>
    </form>
  )
}
