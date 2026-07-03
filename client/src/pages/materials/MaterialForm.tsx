import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { materialService } from '../../services/dataService'
import { RawMaterial, Supplier } from '../../types'

const schema = z.object({
  material_name: z.string().min(1, 'Name required'),
  unit: z.string().min(1, 'Unit required'),
  supplier_id: z.string().optional(),
  quantity: z.string().min(1, 'Quantity required'),
  min_stock: z.string().optional(),
  cost: z.string().min(1, 'Cost required'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  material?: RawMaterial | null
  suppliers: Supplier[]
  onSuccess: () => void
  onCancel: () => void
}

export default function MaterialForm({ material, suppliers, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: material ? {
      material_name: material.material_name,
      unit: material.unit,
      supplier_id: material.supplier_id?.toString() || '',
      quantity: material.quantity.toString(),
      min_stock: material.min_stock.toString(),
      cost: material.cost.toString(),
      description: material.description || '',
    } : { unit: 'Pieces', quantity: '0', min_stock: '10', cost: '0' }
  })

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, supplier_id: data.supplier_id ? Number(data.supplier_id) : null }
      if (material) {
        await materialService.update(material.id, payload)
        toast.success('Material updated')
      } else {
        await materialService.create(payload)
        toast.success('Material created')
      }
      onSuccess()
    } catch { toast.error('Operation failed') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Material Name *</label>
          <input {...register('material_name')} className="input-field" />
          {errors.material_name && <p className="text-red-500 text-xs">{errors.material_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Unit *</label>
          <input {...register('unit')} className="input-field" placeholder="Meters, Kg, Pieces" />
          {errors.unit && <p className="text-red-500 text-xs">{errors.unit.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Supplier</label>
          <select {...register('supplier_id')} className="input-field">
            <option value="">Select Supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity *</label>
          <input {...register('quantity')} type="number" step="0.01" className="input-field" />
          {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min Stock</label>
          <input {...register('min_stock')} type="number" step="0.01" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cost per Unit *</label>
          <input {...register('cost')} type="number" step="0.01" className="input-field" />
          {errors.cost && <p className="text-red-500 text-xs">{errors.cost.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea {...register('description')} rows={3} className="input-field" />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{material ? 'Update' : 'Create'} Material</button>
      </div>
    </form>
  )
}
