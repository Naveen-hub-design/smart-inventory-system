import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authService } from '../services/authService'
import api from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

function clearStaleAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('token')
    if (stored && isTokenExpired(stored)) {
      clearStaleAuth()
      return null
    }
    return stored
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authService.getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          clearStaleAuth()
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const res = await authService.login(username, password)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('refresh_token', res.refresh_token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token')
    api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {})
    clearStaleAuth()
    setToken(null)
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
