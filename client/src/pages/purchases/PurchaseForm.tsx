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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Supplier *</label>
          <div className="relative group">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input-field peer" required>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Items</label>
          <button type="button" onClick={addItem} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1 font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700/30">
              <div className="relative group flex-1">
                <select
                  value={item.material_id}
                  onChange={(e) => updateItem(i, 'material_id', e.target.value)}
                  className="input-field w-full peer"
                  required
                >
                  <option value="">Select Material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.material_name} ({m.unit})</option>
                  ))}
                </select>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <div className="relative group w-24">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  className="input-field w-full peer"
                  placeholder="Qty"
                  required
                />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
              </div>
              <div className="relative group w-32">
                <input
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                  className="input-field w-full peer"
                  placeholder="Price"
                  required
                />
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
          ) : 'Create Purchase'}
        </button>
      </div>
    </form>
  )
}
