import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import {
  isGoogleOAuthConfigured,
  requestGoogleCredential,
} from '../../services/googleAuth'

function GoogleGIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15 0.7 12 0.7 7.4 0.7 3.5 3.3 1.5 7.1l3.9 3C6.3 7.4 8.9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.9 3c2.3-2.1 3.5-5.2 3.5-9z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.9c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.9 0 10.4 0 12s.5 3.1 1.5 4.9l3.9-3z"
      />
      <path
        fill="#34A853"
        d="M12 23.3c3.2 0 6-1.1 8-3l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.7-2.1-6.6-5l-3.9 3C3.5 20.7 7.4 23.3 12 23.3z"
      />
    </svg>
  )
}

export default function GoogleSignInButton() {
  const configured = isGoogleOAuthConfigured()
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const handleClick = async () => {
    if (!configured) {
      toast('Google sign-in is not configured yet. Please contact your administrator.')
      return
    }
    // Single-flight guard: ignore duplicate clicks while authenticating.
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      // 1. Google authenticates the user and returns an ID token.
      //    The token is NOT trusted here — the backend verifies it.
      const credential = await requestGoogleCredential()
      // 2. Backend verifies the token, matches the SIMS account by the
      //    verified email, and returns the normal SIMS JWT response.
      const user = await loginWithGoogle(credential)
      toast.success('Signed in with Google!')
      if (user.password_reset_required) {
        // Mirror the normal-login flow (Login's redirect effect may fire
        // first, so delay slightly to land on the forced-change page).
        setTimeout(() => navigate('/profile?forceChange=1'), 100)
      }
    } catch (err: any) {
      if (err?.message === 'cancelled') {
        // User dismissed the Google prompt — stay silent.
        return
      }
      if (err?.message === 'not-configured') {
        toast('Google sign-in is not configured yet. Please contact your administrator.')
        return
      }
      if (!err?.response) {
        // No backend response: GIS script/timeout/popup issues, or the
        // API server is unreachable (axios network error).
        if (err?.message === 'timeout') {
          toast.error('Google sign-in timed out. Please try again.')
        } else if (err?.isAxiosError) {
          toast.error('Unable to connect to the authentication server.')
        } else {
          toast.error('Google authentication failed. Please try again.')
        }
        return
      }
      const status: number | undefined = err.response?.status
      const serverMessage: string | undefined = err.response?.data?.error
      if (status === 401 || status === 403) {
        // Backend decides: unregistered email, inactive account, or bad token.
        toast.error(serverMessage || 'Google authentication failed. Please try again.')
      } else {
        toast.error('Google authentication failed. Please try again.')
      }
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 w-full">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E2E1DA]" />
        </div>
        <div className="relative bg-[#F4F3EE] px-3">
          <span className="text-[11px] font-medium text-[#9CA3AF]">or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label="Continue with Google"
        className="mt-4 w-full h-[46px] flex items-center justify-center gap-2.5 bg-transparent hover:bg-[#EAE9E2]/70 active:scale-[0.99] border border-[#D5D4CC] rounded-xl text-[13.5px] font-medium text-[#374151] transition-all duration-150 shadow-none focus:outline-none focus:ring-2 focus:ring-[#111827]/10 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-[#9CA3AF]/40 border-t-[#374151] rounded-full animate-spin" />
            <span>Connecting to Google…</span>
          </>
        ) : (
          <>
            <GoogleGIcon />
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  )
}
