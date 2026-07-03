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
}

export const reportService = {
  getInventory: (format?: string) => api.get('/reports/inventory', { params: { format } }),
  getSales: (params?: any) => api.get('/reports/sales', { params }),
  getPurchases: (params?: any) => api.get('/reports/purchases', { params }),
  getSuppliers: (format?: string) => api.get('/reports/suppliers', { params: { format } }),
  getLowStock: (format?: string) => api.get('/reports/low-stock', { params: { format } }),
}

export const searchService = {
  search: (q: string) => api.get('/search/', { params: { q } }),
}

export const notificationService = {
  getAll: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  generateAlerts: () => api.post('/notifications/generate-alerts'),
}
