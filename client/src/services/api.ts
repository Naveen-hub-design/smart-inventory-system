import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/google') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        })
        localStorage.setItem('token', data.access_token)
        processQueue(null, data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (!error.response) {
      toast.error('Network error: Unable to reach server')
      return Promise.reject(error)
    }

    const message = error.response?.data?.error || 'Something went wrong'
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

interface CacheEntry {
  data: any
  status: number
  statusText: string
  headers: any
  config: any
  timestamp: number
}

const responseCache = new Map<string, CacheEntry>()
const pendingRequests = new Map<string, Promise<any>>()
const originalGet = api.get

export const clearApiCache = (filter?: string) => {
  if (!filter) {
    responseCache.clear()
    return
  }
  for (const key of responseCache.keys()) {
    if (key.includes(filter)) {
      responseCache.delete(key)
    }
  }
}

// Invalidate cache on mutations (POST, PUT, DELETE, PATCH)
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase()
    if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
      responseCache.clear()
    }
    return response
  },
  undefined
)

api.get = async (url: string, config?: any) => {
  const isNoCache = config?.headers?.['Cache-Control'] === 'no-cache'
  const key = `get:${url}?${JSON.stringify(config?.params || {})}`

  if (!isNoCache) {
    const cached = responseCache.get(key)
    // 30-second TTL: allows instant navigation between tabs without network lag
    if (cached && (Date.now() - cached.timestamp) < 30000) {
      return Promise.resolve({
        data: cached.data,
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
        config: cached.config,
      })
    }
  }

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  const promise = originalGet(url, config)
    .then((res: any) => {
      if (!isNoCache && res?.status === 200) {
        responseCache.set(key, {
          data: res.data,
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
          config: res.config,
          timestamp: Date.now()
        })
      }
      return res
    })
    .finally(() => {
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, promise)
  return promise
}

export default api
