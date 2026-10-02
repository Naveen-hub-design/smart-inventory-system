const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_REDIRECT_URI =
  import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth/google/callback`

const OAUTH_STATE_KEY = 'google_oauth_state'

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID)
}

export function getGoogleAuthUrl(): string {
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
  sessionStorage.setItem(OAUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function verifyGoogleOAuthState(state: string | null): boolean {
  const stored = sessionStorage.getItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
  return Boolean(state && stored && state === stored)
}

// ------------------------------------------------------------------
// Google Identity Services (GIS) ID-token flow.
//
// Used by the "Continue with Google" button: shows the Google account
// chooser and resolves with a Google ID token (credential) that the
// Flask backend verifies server-side. No redirect URI is required —
// only the Authorized JavaScript origin (e.g. http://localhost:5173).
// ------------------------------------------------------------------

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

interface GisCredentialResponse {
  credential?: string
}

interface GisPromptMoment {
  isDisplayed(): boolean
  isNotDisplayed(): boolean
  isSkippedMoment(): boolean
  isDismissedMoment(): boolean
}

interface GisIdConfig {
  client_id: string
  callback: (response: GisCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: GisIdConfig): void
          prompt(listener?: (moment: GisPromptMoment) => void): void
          cancel(): void
        }
      }
    }
  }
}

let gisLoadPromise: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    return Promise.resolve()
  }
  if (gisLoadPromise) return gisLoadPromise
  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_URL
    script.async = true
    script.defer = true
    const timer = window.setTimeout(() => {
      gisLoadPromise = null
      reject(new Error('load-timeout'))
    }, 15000)
    script.onload = () => {
      window.clearTimeout(timer)
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      gisLoadPromise = null
      reject(new Error('load-failed'))
    }
    document.head.appendChild(script)
  })
  return gisLoadPromise
}

/** Error codes thrown by requestGoogleCredential(). */
export type GoogleFlowError =
  | 'not-configured'
  | 'load-failed'
  | 'unavailable'
  | 'cancelled'
  | 'timeout'

/**
 * Show the Google account chooser and resolve with the verified-to-be
 * Google ID token (credential). The token itself is NOT trusted here —
 * the backend verifies it with Google before doing anything with it.
 *
 * Rejects with Error('cancelled') when the user dismisses the prompt
 * (callers should stay silent in that case).
 */
export async function requestGoogleCredential(): Promise<string> {
  if (!isGoogleOAuthConfigured()) {
    throw new Error('not-configured')
  }
  try {
    await loadGisScript()
  } catch {
    throw new Error('load-failed')
  }
  const google = typeof window !== 'undefined' ? window.google : undefined
  if (!google?.accounts?.id) {
    throw new Error('load-failed')
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false
    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      try {
        google.accounts.id.cancel()
      } catch {
        // ignore cleanup errors
      }
      fn()
    }
    const timer = window.setTimeout(() => {
      settle(() => reject(new Error('timeout')))
    }, 120000)

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            settle(() => resolve(response.credential as string))
          } else {
            settle(() => reject(new Error('cancelled')))
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      })
      google.accounts.id.prompt((moment) => {
        try {
          if (moment.isNotDisplayed()) {
            settle(() => reject(new Error('unavailable')))
          } else if (moment.isSkippedMoment() || moment.isDismissedMoment()) {
            settle(() => reject(new Error('cancelled')))
          }
        } catch {
          // ignore listener errors; the timeout guards the flow
        }
      })
    } catch {
      settle(() => reject(new Error('unavailable')))
    }
  })
}
