import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserIcon, Mail, Phone, Key, ShieldCheck, BadgeCheck, Building2 } from 'lucide-react'
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

function FormField({ icon: Icon, label, required, children }: { icon: any; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-3">
        {user && user.employee_id ? (
          <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20 flex-1">
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Employee ID</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{user.employee_id}</p>
            </div>
          </div>
        ) : !user ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex-1">
            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              <BadgeCheck className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Employee ID</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">Auto-generated on creation</p>
            </div>
          </div>
        ) : null}
        {user && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20 shrink-0">
            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField icon={UserIcon} label="Username" required>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('username')} className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="Enter username" />
          </div>
          {errors.username && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.username.message}</p>}
        </FormField>

        <FormField icon={Mail} label="Email" required>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('email')} type="email" className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="email@example.com" />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.email.message}</p>}
        </FormField>

        <FormField icon={UserIcon} label="Full Name" required>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('full_name')} className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="Enter full name" />
          </div>
          {errors.full_name && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.full_name.message}</p>}
        </FormField>

        <FormField icon={Phone} label="Phone">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('phone')} className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="Enter phone number" />
          </div>
        </FormField>
      </div>

      {!user && (
        <FormField icon={Key} label="Password" required>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('password')} type="password" className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400/50 transition-all duration-300" placeholder="Min 6 characters" />
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.password.message}</p>}
        </FormField>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {user ? 'Update staff account details below. Password changes use the Reset Password option.' : 'New staff will receive an auto-generated Employee ID on creation.'}
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">Cancel</button>
          <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
            {user ? 'Update Staff' : 'Create Staff'}
          </button>
        </div>
      </div>
    </form>
  )
}
