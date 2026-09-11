import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { verifyGoogleOAuthState } from '../../services/googleAuth'

export default function GoogleOAuthCallback() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    const fail = (message: string) => {
      toast.error(message)
      navigate('/login', { replace: true })
    }

    if (error) {
      fail(error === 'access_denied' ? 'Google sign-in was cancelled.' : `Google sign-in failed: ${error}`)
      return
    }
    if (!code) {
      fail('Missing authorization code from Google.')
      return
    }
    if (!verifyGoogleOAuthState(params.get('state'))) {
      fail('Google sign-in state mismatch. Please try again.')
      return
    }

    loginWithGoogle(code)
      .then((user) => {
        toast.success('Signed in with Google!')
        navigate(user.password_reset_required ? '/profile?forceChange=1' : '/dashboard', { replace: true })
      })
      .catch((err: any) => {
        console.error('Google login error:', err)
        fail(err.response?.data?.error || 'Google sign-in could not be completed. The backend OAuth endpoint may not be configured.')
      })
  }, [loginWithGoogle, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-white p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Completing Google sign-in…</p>
      </div>
    </div>
  )
}
