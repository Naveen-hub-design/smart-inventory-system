import { useState } from 'react'
import { User, Save, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  new_password: z.string().min(6, 'Password must be 6+ characters'),
  confirm_password: z.string().min(1, 'Confirm password'),
}).refine((d) => d.new_password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function Profile() {
  const { user, login } = useAuth()
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' }
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    setSaving(true)
    try {
      await authService.updateProfile(data)
      toast.success('Profile updated')
    } catch { } finally { setSaving(false) }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setChangingPwd(true)
    try {
      await authService.changePassword(data.current_password, data.new_password)
      toast.success('Password changed')
      passwordForm.reset()
    } catch { } finally { setChangingPwd(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.full_name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge-info mt-1 inline-block">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Edit Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input {...profileForm.register('full_name')} className="input-field" />
              {profileForm.formState.errors.full_name && <p className="text-red-500 text-xs">{profileForm.formState.errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...profileForm.register('email')} className="input-field" />
              {profileForm.formState.errors.email && <p className="text-red-500 text-xs">{profileForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input {...profileForm.register('phone')} className="input-field" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input {...passwordForm.register('current_password')} type="password" className="input-field" />
              {passwordForm.formState.errors.current_password && <p className="text-red-500 text-xs">{passwordForm.formState.errors.current_password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input {...passwordForm.register('new_password')} type="password" className="input-field" />
              {passwordForm.formState.errors.new_password && <p className="text-red-500 text-xs">{passwordForm.formState.errors.new_password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input {...passwordForm.register('confirm_password')} type="password" className="input-field" />
              {passwordForm.formState.errors.confirm_password && <p className="text-red-500 text-xs">{passwordForm.formState.errors.confirm_password.message}</p>}
            </div>
          </div>
          <button type="submit" disabled={changingPwd} className="btn-primary flex items-center gap-2">
            <Lock className="w-4 h-4" /> {changingPwd ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
