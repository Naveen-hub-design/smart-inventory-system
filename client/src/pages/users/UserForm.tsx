import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { User } from '../../types'

const userSchema = z.object({
  username: z.string().min(3, 'Username must be 3+ characters'),
  email: z.string().email('Invalid email'),
  full_name: z.string().min(1, 'Full name required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be 6+ characters').optional().or(z.literal('')),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  user?: User | null
  onSuccess: () => void
  onCancel: () => void
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? {
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      password: '',
    } : {
      username: '',
      email: '',
      full_name: '',
      phone: '',
      password: '',
    }
  })

  const onSubmit = async (data: UserFormData) => {
    try {
      if (user) {
        await authService.updateUser(user.id, {
          username: data.username,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone || undefined,
        })
        toast.success('User updated')
      } else {
        await authService.createUser({
          username: data.username,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone || undefined,
          password: data.password!,
        })
        toast.success('User created')
      }
      onSuccess()
    } catch {
      toast.error('Operation failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {user && user.employee_id && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Employee ID</label>
          <div className="input-field bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed">
            {user.employee_id}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username *</label>
        <input {...register('username')} className="input-field" placeholder="Enter username" />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
        <input {...register('email')} type="email" className="input-field" placeholder="email@example.com" />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
        <input {...register('full_name')} className="input-field" placeholder="Enter full name" />
        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
        <input {...register('phone')} className="input-field" placeholder="Enter phone number" />
      </div>

      {!user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password *</label>
          <input {...register('password')} type="password" className="input-field" placeholder="Min 6 characters" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary shadow-lg shadow-primary-500/20">
          {user ? 'Update Staff' : 'Create Staff'}
        </button>
      </div>
    </form>
  )
}
