import { useState } from 'react'
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
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    try {
      if (supplier) {
        await supplierService.update(supplier.id, data)
        toast.success('Supplier updated')
      } else {
        await supplierService.create(data)
        toast.success('Supplier created')
      }
      onSuccess()
    } catch { toast.error('Operation failed') } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <label className="form-label">Supplier Name *</label>
          <div className="relative group">
            <input {...register('supplier_name')} className="input-field" placeholder="Enter supplier name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.supplier_name && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.supplier_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="form-label">Contact Person</label>
          <div className="relative group">
            <input {...register('contact_person')} className="input-field" placeholder="Contact person name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="form-label">Phone</label>
          <div className="relative group">
            <input {...register('phone')} className="input-field" placeholder="Phone number" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="form-label">Email</label>
          <div className="relative group">
            <input {...register('email')} type="email" className="input-field" placeholder="email@example.com" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="form-label">GST Number</label>
          <div className="relative group">
            <input {...register('gst_number')} className="input-field" placeholder="GSTIN" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="form-label">Status</label>
          <select {...register('status')} className="select-field">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="form-label">Address</label>
          <textarea {...register('address')} rows={3} className="input-field resize-none" placeholder="Full address..." />
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
          ) : supplier ? 'Update Supplier' : 'Create Supplier'}
        </button>
      </div>
    </form>
  )
}
