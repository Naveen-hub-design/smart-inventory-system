export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'staff'
  phone: string | null
  avatar: string | null
  is_active: boolean
  last_login: string | null
  created_at: string | null
}

export interface Category {
  id: number
  name: string
  description: string | null
  product_count: number
  created_at: string | null
}

export interface Product {
  id: number
  product_name: string
  category_id: number | null
  category_name: string | null
  size: string | null
  color: string | null
  price: number
  quantity: number
  min_stock: number
  image: string | null
  barcode: string | null
  status: 'active' | 'inactive'
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Supplier {
  id: number
  supplier_name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  gst_number: string | null
  status: 'active' | 'inactive'
  material_count: number
  created_at: string | null
  updated_at: string | null
}

export interface RawMaterial {
  id: number
  material_name: string
  unit: string
  supplier_id: number | null
  supplier_name: string | null
  quantity: number
  min_stock: number
  cost: number
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export interface PurchaseItem {
  id: number
  purchase_id: number
  material_id: number | null
  material_name: string | null
  unit: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface Purchase {
  id: number
  invoice_number: string
  supplier_id: number | null
  supplier_name: string | null
  user_id: number | null
  user_name: string | null
  total_amount: number
  discount: number
  tax: number
  grand_total: number
  status: 'pending' | 'completed' | 'cancelled'
  notes: string | null
  purchase_date: string | null
  items: PurchaseItem[]
  created_at: string | null
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number | null
  product_name: string | null
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
  discount: number
  total_price: number
}

export interface Sale {
  id: number
  invoice_number: string
  customer_name: string | null
  user_id: number | null
  user_name: string | null
  total_amount: number
  discount: number
  tax: number
  grand_total: number
  payment_method: 'cash' | 'card' | 'bank' | 'other'
  status: 'pending' | 'completed' | 'cancelled'
  notes: string | null
  sale_date: string | null
  items: SaleItem[]
  created_at: string | null
}

export interface InventoryLog {
  id: number
  product_id: number | null
  product_name: string | null
  material_id: number | null
  material_name: string | null
  change_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference_type: string | null
  reference_id: number | null
  notes: string | null
  user_name: string | null
  created_at: string | null
}

export interface Notification {
  id: number
  user_id: number | null
  title: string
  message: string | null
  type: 'info' | 'warning' | 'success' | 'danger'
  is_read: boolean
  link: string | null
  created_at: string | null
}

export interface DashboardStats {
  total_products: number
  total_materials: number
  total_suppliers: number
  total_purchases: number
  total_sales: number
  today_sales: number
  total_purchase_amount: number
  low_stock_count: number
  out_of_stock_count: number
}

export interface Transaction {
  type: 'sale' | 'purchase'
  id: number
  invoice: string
  customer?: string
  supplier?: string
  amount: number
  date: string
  status: string
}

export interface PaginatedResponse<T> {
  total: number
  pages: number
  page: number
  per_page: number
}

export interface ProductResponse extends PaginatedResponse<Product> {
  products: Product[]
}

export interface MaterialResponse extends PaginatedResponse<RawMaterial> {
  materials: RawMaterial[]
}

export interface SupplierResponse extends PaginatedResponse<Supplier> {
  suppliers: Supplier[]
}

export interface PurchaseResponse extends PaginatedResponse<Purchase> {
  purchases: Purchase[]
}

export interface SaleResponse extends PaginatedResponse<Sale> {
  sales: Sale[]
}

export interface SearchResults {
  products: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  materials: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  suppliers: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  purchases: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  sales: Array<{ id: number; name: string; type: string; detail: string; url: string }>
}
