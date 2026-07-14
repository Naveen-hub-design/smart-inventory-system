export interface User {
  id: number
  username: string
  email: string
  full_name: string
  employee_id: string | null
  role: 'admin' | 'staff'
  phone: string | null
  avatar: string | null
  is_active: boolean
  password_reset_required: boolean
  last_login: string | null
  created_at: string | null
}

export interface PasswordResetRequest {
  id: number
  user_id: number | null
  username_input: string
  email_input: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: number | null
  user_full_name: string | null
  user_employee_id: string | null
}

export interface PasswordResetRequestResponse extends PaginatedResponse<PasswordResetRequest> {
  requests: PasswordResetRequest[]
}

export interface Category {
  id: number
  name: string
  description: string | null
  product_count: number
  created_at: string | null
}

export interface ProductVariant {
  id: number
  product_id: number
  product_name: string | null
  size: string | null
  color: string | null
  sku: string
  barcode: string | null
  qr_code: string | null
  stock: number
  min_stock: number
  cost_price: number
  selling_price: number
  created_at: string | null
  updated_at: string | null
}

export interface ProductVariantResponse extends PaginatedResponse<ProductVariant> {
  variants: ProductVariant[]
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
  variants?: ProductVariant[]
  variant_count?: number
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
  total_variants: number
  low_stock_variants: number
  low_stock_count: number
  out_of_stock_count: number
  total_categories: number
  total_customers: number
  revenue: number
  profit: number
  available_products: number
}

export interface Activity {
  type: 'audit' | 'sale' | 'purchase'
  id: number
  description: string
  user: string | null
  module: string | null
  action: string | null
  timestamp: string | null
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

export interface UserResponse extends PaginatedResponse<User> {
  users: User[]
}

export interface AuditLog {
  id: number
  timestamp: string | null
  user_id: number | null
  username: string
  role: string
  action: string
  module: string
  description: string
  status: string
  ip_address: string | null
  request_method: string | null
  endpoint: string | null
  created_at: string | null
}

export interface AuditLogResponse extends PaginatedResponse<AuditLog> {
  logs: AuditLog[]
}

export interface SearchResults {
  products: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  materials: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  suppliers: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  purchases: Array<{ id: number; name: string; type: string; detail: string; url: string }>
  sales: Array<{ id: number; name: string; type: string; detail: string; url: string }>
}

export interface ReorderRecommendation {
  variant_id: number
  product_name: string
  sku: string
  color: string | null
  size: string | null
  category: string | null
  current_stock: number
  min_stock: number
  avg_daily_sales: number
  avg_monthly_sales: number
  days_remaining: number | null
  priority: 'high' | 'medium' | 'low'
  suggested_reorder_qty: number
  reason: string
  explanation: string
  confidence_score: number
  sales_trend: 'Increasing' | 'Stable' | 'Decreasing'
}

export interface AiReorderResponse {
  recommendations: ReorderRecommendation[]
  high_priority: ReorderRecommendation[]
  medium_priority: ReorderRecommendation[]
  safe_items: ReorderRecommendation[]
  generated_at: string
  lookback_days: number
  lead_time_days: number
  total_analyzed: number
  inventory_health_percent: number
  supplier_risk: string
  dominant_trend: string
}

export interface ForecastItem {
  variant_id: number
  product_id: number
  product_name: string
  sku: string
  color: string | null
  size: string | null
  category: string | null
  category_id: number | null
  current_stock: number
  min_stock: number
  avg_daily_sales: number
  avg_weekly_sales: number
  avg_monthly_sales: number
  demand_7_days: number | null
  demand_30_days: number | null
  suggested_production_qty: number
  suggested_reorder_qty: number
  sales_trend: 'Increasing' | 'Stable' | 'Decreasing'
  confidence_score: number
  risk_level: string
  insufficient_data: boolean
  chart_labels: string[]
  chart_actual: number[]
  chart_predicted: number[]
  explanation: string
}

export interface ForecastResponse {
  forecasts: ForecastItem[]
  total_analyzed: number
  generated_at: string
  lookback_days: number
}

export interface InsightsSummaryCards {
  best_selling_product: {
    product_name: string; sku: string; units_sold: number; revenue: number
  } | null
  fastest_growing_product: {
    product_name: string; sku: string; growth_percent: number; prev_month: number; current_month: number
  } | null
  slow_moving_product: {
    product_name: string; sku: string; last_sold_date: string | null; days_without_sale: number; current_stock: number; recommendation: string
  } | null
  overstocked_product: {
    product_name: string; sku: string; current_stock: number; avg_monthly_sales: number; months_remaining: number; recommendation: string
  } | null
  highest_profit_product: {
    product_name: string; sku: string; profit: number; margin_percent: number
  } | null
  highest_revenue_category: {
    category_name: string; revenue: number
  } | null
  stock_out_risk_product: {
    product_name: string; sku: string; current_stock: number; avg_daily_sales: number; days_remaining: number
  } | null
  dead_stock_product: {
    product_name: string; sku: string; days_unsold: number; stock_value: number; recommendation: string
  } | null
}

export interface InsightsBestSeller {
  product_name: string; sku: string; category: string; units_sold: number; revenue: number; profit: number
}

export interface InsightsFastestGrowing {
  product_name: string; sku: string; growth_percent: number; prev_month: number; current_month: number
}

export interface InsightsSlowMoving {
  product_name: string; sku: string; last_sold_date: string | null; days_without_sale: number; current_stock: number; recommendation: string
}

export interface InsightsOverstockAnalysis {
  product_name: string; sku: string; current_stock: number; avg_monthly_sales: number; months_remaining: number; recommendation: string
}

export interface InsightsDeadStock {
  product_name: string; sku: string; days_unsold: number; stock_value: number; recommendation: string
}

export interface InsightsCategory {
  category_name: string; total_revenue: number; total_profit: number; sales_growth: number; stock_value: number
}

export interface InsightsRecommendation {
  type: string; message: string; severity: 'info' | 'warning' | 'success' | 'danger'
}

export interface InsightsChartData {
  top_selling_products: { labels: string[]; values: number[] }
  revenue_by_category: { labels: string[]; values: number[] }
  profit_by_category: { labels: string[]; values: number[] }
  sales_growth_trend: { labels: string[]; values: number[] }
  stock_distribution: { labels: string[]; values: number[] }
}

export interface InsightsResponse {
  summary_cards: InsightsSummaryCards
  best_sellers: InsightsBestSeller[]
  fastest_growing: InsightsFastestGrowing[]
  slow_moving: InsightsSlowMoving[]
  overstock_analysis: InsightsOverstockAnalysis[]
  dead_stock: InsightsDeadStock[]
  category_insights: InsightsCategory[]
  ai_recommendations: InsightsRecommendation[]
  chart_data: InsightsChartData
  generated_at: string
  filtered: boolean
}

export interface HealthFactor {
  score: number; weight: number
}

export interface HealthMetrics {
  total_products: number; healthy_products: number; low_stock_products: number
  overstock_products: number; dead_stock_products: number
  forecast_accuracy: number; inventory_turnover: number
}

export interface CategoryHealth {
  category_name: string; score: number; health_status: string
  total_products: number; healthy: number; at_risk: number
}

export interface HealthResponse {
  overall_score: number
  health_status: string
  ai_summary: string
  metrics: HealthMetrics
  factors: Record<string, HealthFactor>
  strengths: string[]
  issues: string[]
  recommendations: string[]
  health_trend: { labels: string[]; values: number[] }
  category_health: CategoryHealth[]
  generated_at: string
  filtered: boolean
}

export interface SupplierIntelSummaryCards {
  total_suppliers: number; active_suppliers: number
  preferred_suppliers: number; high_risk_suppliers: number
  avg_delivery_time_days: number
  avg_order_success_rate: number
  total_purchase_value: number; avg_purchase_cost: number
  best_performing_supplier: string | null; best_performing_score: number
  highest_reliability_supplier: string | null; highest_reliability_score: number
  fastest_delivery_supplier: string | null; fastest_delivery_rate: number
  lowest_cost_supplier: string | null; lowest_cost_value: number
  average_rating: number
}

export interface SupplierPerformanceRow {
  supplier_name: string; supplier_code: string
  products_supplied: number
  total_orders: number; completed_orders: number; cancelled_orders: number
  total_value: number; total_items: number
  avg_unit_price: number; avg_product_cost: number; avg_delivery_time: string; on_time_delivery: number
  reliability_score: number; quality_score: number; overall_rating: number
  risk_level: string; ranking_tier: string
}

export interface SupplierScore {
  supplier_name: string; supplier_code: string
  overall_score: number; overall_status: string; ranking_tier: string
  delivery_score: number; pricing_score: number; completion_score: number
  quality_score: number; history_score: number; return_rate: number
  delivery_consistency: number; risk_level: string
}

export interface SupplierRecommendation {
  product_name: string; sku: string; supplier_name: string; avg_cost: number
  delivery_days: string; reliability: number; confidence: number; reason: string
}

export interface PurchaseRecommendation {
  product_name: string; sku: string
  current_stock: number; min_stock: number
  suggested_quantity: number
  suggested_supplier: string
  estimated_cost: number
  estimated_delivery: string
  priority: string
  confidence: number
  reason: string
}

export interface SupplierInsight {
  type: string; message: string
}

export interface SupplierRiskItem {
  supplier_name: string; supplier_code: string; overall_score: number; risk_level: string; reasons: string[]
}

export interface SupplierRiskAnalysis {
  high_risk: SupplierRiskItem[]; medium_risk: SupplierRiskItem[]; low_risk: SupplierRiskItem[]
}

export interface SupplierIntelResponse {
  summary_cards: SupplierIntelSummaryCards
  performance_table: SupplierPerformanceRow[]
  supplier_scores: SupplierScore[]
  recommendations: SupplierRecommendation[]
  purchase_recommendations: PurchaseRecommendation[]
  insights: SupplierInsight[]
  risk_analysis: SupplierRiskAnalysis
  chart_data: {
    performance_ranking: { labels: string[]; values: number[] }
    avg_delivery_time: { labels: string[]; values: number[] }
    purchase_value: { labels: string[]; values: number[] }
    reliability_comparison: { labels: string[]; values: number[] }
    rating_distribution: Record<string, number>
    monthly_purchase_trend: { labels: string[]; values: number[] }
  }
  generated_at: string
  filtered: boolean
}

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CopilotResponse {
  session_id: string
  reply: string
  suggestions: string[]
  intent: string
  can_export: boolean
  report_type?: string
  report_id?: string
}

export interface CopilotHistoryResponse {
  history: CopilotMessage[]
}

export interface SystemSettings {
  company: Record<string, string>
  inventory: Record<string, string>
  ai: Record<string, string>
  notifications: Record<string, string>
  reports: Record<string, string>
  appearance: Record<string, string>
  security: Record<string, string>
}

export interface SettingsResponse {
  settings: SystemSettings
}

export interface AboutInfo {
  project_name: string
  version: string
  backend_status: string
  database_status: string
  ai_status: string
}
