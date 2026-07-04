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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Material Name *</label>
          <div className="relative group">
            <input {...register('material_name')} className="input-field peer" placeholder="Enter material name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.material_name && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errors.material_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unit *</label>
          <div className="relative group">
            <input {...register('unit')} className="input-field peer" placeholder="Meters, Kg, Pieces" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.unit && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errors.unit.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Supplier</label>
          <select {...register('supplier_id')} className="input-field">
            <option value="">Select Supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
          <div className="relative group">
            <input {...register('quantity')} type="number" step="0.01" className="input-field peer" placeholder="0" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.quantity && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Min Stock</label>
          <input {...register('min_stock')} type="number" step="0.01" className="input-field" placeholder="10" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cost per Unit *</label>
          <div className="relative group">
            <input {...register('cost')} type="number" step="0.01" className="input-field peer" placeholder="0.00" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.cost && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errors.cost.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
        <textarea {...register('description')} rows={3} className="input-field" placeholder="Material description..." />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary shadow-lg shadow-primary-500/20">{material ? 'Update' : 'Create'} Material</button>
      </div>
    </form>
  )
}
