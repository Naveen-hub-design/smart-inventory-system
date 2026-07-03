import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { supplierService } from '../../services/dataService'
import { Supplier } from '../../types'

const schema = z.object({
  supplier_name: z.string().min(1, 'Supplier name required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  gst_number: z.string().optional(),
  status: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  supplier?: Supplier | null
  onSuccess: () => void
  onCancel: () => void
}

export default function SupplierForm({ supplier, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: supplier ? {
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      gst_number: supplier.gst_number || '',
      status: supplier.status,
    } : { status: 'active' }
  })

  const onSubmit = async (data: FormData) => {
    try {
      if (supplier) {
        await supplierService.update(supplier.id, data)
        toast.success('Supplier updated')
      } else {
        await supplierService.create(data)
        toast.success('Supplier created')
      }
      onSuccess()
    } catch { toast.error('Operation failed') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Supplier Name *</label>
          <input {...register('supplier_name')} className="input-field" />
          {errors.supplier_name && <p className="text-red-500 text-xs">{errors.supplier_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact Person</label>
          <input {...register('contact_person')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input {...register('phone')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email')} type="email" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">GST Number</label>
          <input {...register('gst_number')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select {...register('status')} className="input-field">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea {...register('address')} rows={3} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{supplier ? 'Update' : 'Create'} Supplier</button>
      </div>
    </form>
  )
}
