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
