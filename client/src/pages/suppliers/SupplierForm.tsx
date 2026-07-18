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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Name *</label>
          <div className="relative group">
            <input {...register('supplier_name')} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="Enter supplier name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
          {errors.supplier_name && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.supplier_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
          <div className="relative group">
            <input {...register('contact_person')} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="Contact person name" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
          <div className="relative group">
            <input {...register('phone')} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="Phone number" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <div className="relative group">
            <input {...register('email')} type="email" className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="email@example.com" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GST Number</label>
          <div className="relative group">
            <input {...register('gst_number')} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="GSTIN" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select {...register('status')} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 cursor-pointer">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <textarea {...register('address')} rows={3} className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300 resize-none" placeholder="Full address..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">Cancel</button>
        <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">{supplier ? 'Update Supplier' : 'Create Supplier'}</button>
      </div>
    </form>
  )
}
