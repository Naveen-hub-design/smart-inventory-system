import api from './api'
import { User, UserResponse, PasswordResetRequestResponse } from '../types'

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

  getUsers: async (params?: any): Promise<UserResponse> => {
    const { data } = await api.get('/auth/users', { params })
    return data
  },

  createUser: async (userData: { username: string; email: string; password: string; full_name?: string; phone?: string }): Promise<{ message: string; user: User }> => {
    const { data } = await api.post('/auth/users', userData)
    return data
  },

  updateUser: async (id: number, userData: { username?: string; email?: string; full_name?: string; phone?: string }): Promise<{ message: string; user: User }> => {
    const { data } = await api.put(`/auth/users/${id}`, userData)
    return data
  },

  toggleUserStatus: async (id: number, isActive: boolean): Promise<{ message: string; user: User }> => {
    const { data } = await api.put(`/auth/users/${id}/status`, { is_active: isActive })
    return data
  },

  resetUserPassword: async (id: number, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.put(`/auth/users/${id}/reset-password`, { new_password: newPassword })
    return data
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/auth/users/${id}`)
    return data
  },

  forgotPassword: async (username?: string, email?: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/forgot-password', { username, email })
    return data
  },

  getPasswordResetRequests: async (params?: any): Promise<PasswordResetRequestResponse> => {
    const { data } = await api.get('/auth/password-reset-requests', { params })
    return data
  },

  approvePasswordReset: async (id: number, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.put(`/auth/password-reset-requests/${id}/approve`, { new_password: newPassword })
    return data
  },

  rejectPasswordReset: async (id: number, notes?: string): Promise<{ message: string }> => {
    const { data } = await api.put(`/auth/password-reset-requests/${id}/reject`, { notes })
    return data
  }
}
