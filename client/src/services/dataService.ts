import api from './api'

const createService = (basePath: string) => ({
  getAll: (params?: any) => api.get(`/${basePath}/`, { params }),
  getAllSimple: () => api.get(`/${basePath}/all`),
  getById: (id: number) => api.get(`/${basePath}/${id}`),
  create: (data: any) => api.post(`/${basePath}/`, data),
  update: (id: number, data: any) => api.put(`/${basePath}/${id}`, data),
  delete: (id: number) => api.delete(`/${basePath}/${id}`),
})

export const productService = {
  ...createService('products'),
  getLowStock: () => api.get('/products/low-stock'),
  adjustStock: (id: number, data: any) => api.put(`/products/${id}/adjust-stock`, data),
}

export const materialService = {
  ...createService('materials'),
  getLowStock: () => api.get('/materials/low-stock'),
}

export const supplierService = createService('suppliers')

export const purchaseService = {
  ...createService('purchases'),
  updateStatus: (id: number, status: string) => api.put(`/purchases/${id}/status`, { status }),
}

export const saleService = {
  ...createService('sales'),
  updateStatus: (id: number, status: string) => api.put(`/sales/${id}/status`, { status }),
}

export const categoryService = createService('categories')

export const inventoryService = {
  getStock: () => api.get('/inventory/stock'),
  getMovements: (params?: any) => api.get('/inventory/movements', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  adjust: (data: any) => api.post('/inventory/adjust', data),
  getTimeline: (params?: any) => api.get('/inventory/timeline', { params }),
}

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentTransactions: () => api.get('/dashboard/recent-transactions'),
  getStockByCategory: () => api.get('/dashboard/stock-by-category'),
  getMonthlySales: () => api.get('/dashboard/monthly-sales'),
  getMonthlyPurchases: () => api.get('/dashboard/monthly-purchases'),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
}

export const reportService = {
  getInventory: (format?: string) => api.get('/reports/inventory', {
    params: { format },
    ...(format === 'excel' ? { responseType: 'blob' as const } : {}),
  }),
  getSales: (params?: any) => api.get('/reports/sales', {
    params,
    ...(params?.format === 'excel' ? { responseType: 'blob' as const } : {}),
  }),
  getPurchases: (params?: any) => api.get('/reports/purchases', {
    params,
    ...(params?.format === 'excel' ? { responseType: 'blob' as const } : {}),
  }),
  getSuppliers: (format?: string) => api.get('/reports/suppliers', {
    params: { format },
    ...(format === 'excel' ? { responseType: 'blob' as const } : {}),
  }),
  getLowStock: (format?: string) => api.get('/reports/low-stock', {
    params: { format },
    ...(format === 'excel' ? { responseType: 'blob' as const } : {}),
  }),
}

export const searchService = {
  search: (q: string) => api.get('/search/', { params: { q } }),
}

export const variantService = {
  ...createService('product-variants'),
  getByProduct: (productId: number, params?: any) => api.get('/product-variants/', { params: { ...params, product_id: productId } }),
}

export const aiService = {
  getReorderRecommendations: () => api.get('/ai/reorder-recommendations'),
  getReorderDetail: (variantId: number) => api.get(`/ai/reorder-detail/${variantId}`),
  getForecast: (params?: any) => api.get('/ai/forecast', { params }),
  getInsights: (params?: any) => api.get('/ai/insights', { params }),
  getInventoryHealth: (params?: any) => api.get('/ai/health', { params }),
  getSupplierIntel: (params?: any) => api.get('/ai/suppliers-intel', { params }),
  copilotChat: (data: { message: string; session_id?: string }) => api.post('/ai/copilot/chat', data),
  copilotHistory: (session_id?: string) => api.get('/ai/copilot/history', { params: { session_id } }),
  copilotClear: (session_id?: string) => api.post('/ai/copilot/clear', { session_id }),
  copilotExport: (session_id?: string) => api.post('/ai/copilot/export', { session_id }, { responseType: 'text' }),
}

export const settingsService = {
  getAll: () => api.get('/settings/'),
  getProfile: () => api.get('/auth/me'),
  update: (data: Record<string, string>) => api.put('/settings/', data),
  reset: () => api.post('/settings/reset'),
  updateProfile: (data: Record<string, string>) => api.put('/settings/profile', data),
  changePassword: (data: { current_password: string; new_password: string }) => api.put('/settings/password', data),
  uploadAvatar: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/settings/avatar', fd)
  },
  uploadLogo: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/settings/logo', fd)
  },
  removeAvatar: () => api.delete('/settings/avatar'),
  removeLogo: () => api.delete('/settings/logo'),
  getAbout: () => api.get('/settings/about'),
  exportBackup: () => api.post('/settings/backup/export', {}, { responseType: 'blob' }),
  importBackup: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/settings/backup/import', fd)
  },
  getSessions: () => api.get('/settings/security/sessions'),
  getLoginHistory: () => api.get('/settings/security/login-history'),
}

export const notificationService = {
  getAll: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  generateAlerts: () => api.post('/notifications/generate-alerts'),
}
