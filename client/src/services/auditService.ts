import api from './api'
import { AuditLog, AuditLogResponse } from '../types'

export const auditService = {
  getLogs: async (params?: any): Promise<AuditLogResponse> => {
    const { data } = await api.get('/audit-logs/', { params })
    return data
  },
  getLog: async (id: number): Promise<{ log: AuditLog }> => {
    const { data } = await api.get(`/audit-logs/${id}`)
    return data
  }
}
