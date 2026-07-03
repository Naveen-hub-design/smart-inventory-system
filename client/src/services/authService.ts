import api from './api'
import { User } from '../types'

export interface LoginResponse {
  message: string
  access_token: string
  refresh_token: string
  user: User
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { username, password })
    return data
  },

  register: async (userData: { username: string; email: string; password: string; full_name?: string; role?: string }) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },

  getMe: async (): Promise<{ user: User }> => {
    const { data } = await api.get('/auth/me')
    return data
  },

  updateProfile: async (profileData: Partial<User>): Promise<{ message: string; user: User }> => {
    const { data } = await api.put('/auth/profile', profileData)
    return data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.put('/auth/change-password', { current_password: currentPassword, new_password: newPassword })
    return data
  },

  getUsers: async (): Promise<{ users: User[] }> => {
    const { data } = await api.get('/auth/users')
    return data
  }
}
