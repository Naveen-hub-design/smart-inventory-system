import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Package,
  Boxes,
  Brain,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronRight,
  SlidersHorizontal,
  CornerDownRight,
  Command,
} from 'lucide-react'
import { SimsLogoIcon } from '../components/auth/LoginBrandPanel'

// Simulated data for interactive live workbench tab previews
const WORKBENCH_TABS = [
  {
    id: 'inventory',
    title: 'Real-Time Inventory Engine',
    subtitle: 'Track SKU variants, warehouse locations, and low-stock alerts with microsecond updates.',
    badge: 'Core Engine',
    accentColor: 'indigo',
    metrics: [
      { label: 'Total SKUs', val: '1,284' },
      { label: 'Low Stock Items', val: '3' },
      { label: 'Stock Value', val: '$482,900' },
    ],
    previewData: [
      { name: 'Organic Cotton Oxford Shirt', sku: 'SHIRT-COT-BLU-L', qty: 142, status: 'Healthy', category: 'Apparel' },
      { name: 'Raw Denim Indigo Fabric', sku: 'FAB-DEN-IND-01', qty: 18, status: 'Low Stock', category: 'Raw Materials' },
      { name: 'Merino Wool Crewneck Sweater', sku: 'SWEAT-WOL-GRY-M', qty: 89, status: 'Healthy', category: 'Apparel' },
      { name: 'Brass Zipper 18cm (Pack 50)', sku: 'ACC-ZIP-BRS-18', qty: 5, status: 'Critical', category: 'Hardware' },
    ]
  },
  {
    id: 'ai',
    title: 'AI Analytics & Demand Forecasting',
    subtitle: 'Machine-learning models predict upcoming seasonal demand and auto-suggest reorder quantities.',
    badge: 'AI Powered',
    accentColor: 'emerald',
    metrics: [
      { label: 'Forecast Accuracy', val: '98.6%' },
      { label: 'Suggested Orders', val: '14' },
      { label: 'Capital Saved', val: '$18,400' },
    ],
    previewData: [
      { name: 'Autumn Cotton Twill', forecast: '+34% Demand next 30d', recommended: 'Order +250 meters', confidence: '96%' },
      { name: 'Polyester Thread Spools', forecast: 'Stable Consumption', recommended: 'Maintain buffer (50 units)', confidence: '99%' },
      { name: 'Heavy Canvas Tote Bags', forecast: '+62% Surge Expected', recommended: 'Order +400 units by Oct 12', confidence: '94%' },
    ]
  },
  {
    id: 'logistics',
    title: 'Purchase & Sales Logistics',
    subtitle: 'Unified workflow from supplier purchase orders to final customer invoice dispatch.',
    badge: 'Operations',
    accentColor: 'amber',
    metrics: [
      { label: 'Active POs', val: '8 Orders' },
      { label: 'Fulfillment Rate', val: '99.8%' },
      { label: 'Avg Turnaround', val: '1.4 Days' },
    ],
    previewData: [
      { name: 'PO-2026-089 (Apex Textiles)', items: '800 meters Fabric', status: 'In Transit', total: '$14,200' },
      { name: 'SO-2026-412 (Nordic Retail)', items: '120 Garment Units', status: 'Dispatched', total: '$8,650' },
      { name: 'PO-2026-090 (Zeta Hardware)', items: '2,500 Buttons', status: 'Delivered', total: '$1,800' },
    ]
  }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [simulatedQty, setSimulatedQty] = useState(142)
  const [simulatedSearch, setSimulatedSearch] = useState('')

  const currentTab = WORKBENCH_TABS[activeTab]

  return (
    <div className="min-h-screen w-full bg-[#F9F7F1] text-[#1E293B] font-sans antialiased selection:bg-[#111827] selection:text-white">
      {/* Soft Ambient Warm Light Yellow/Ivory Glows (Pure CSS - No Images) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-amber-100/40 via-yellow-100/20 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-[35%] right-0 w-[500px] h-[500px] bg-amber-50/70 rounded-full blur-3xl" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E2DDD0] to-transparent" />
      </div>

      {/* ==================== TOP NAVIGATION BAR ==================== */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#F9F7F1]/90 border-b border-[#E6E2D5] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center shadow-md shadow-slate-900/10 transition-transform group-hover:scale-105">
              <SimsLogoIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#111827] text-lg tracking-tight">SIMS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-100/70 text-amber-900 border border-amber-200/80">
                  v2.1
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium">Smart Inventory System</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#EFECE1]/80 p-1 rounded-full border border-[#E2DDD0]">
            <a href="#features" className="px-4 py-1.5 text-xs font-medium text-[#475569] hover:text-[#111827] hover:bg-white rounded-full transition-all">
              Features
            </a>
            <a href="#workbench" className="px-4 py-1.5 text-xs font-medium text-[#475569] hover:text-[#111827] hover:bg-white rounded-full transition-all">
              Live Console
            </a>
            <a href="#ai-intelligence" className="px-4 py-1.5 text-xs font-medium text-[#475569] hover:text-[#111827] hover:bg-white rounded-full transition-all flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              AI Assistant
            </a>
            <a href="#architecture" className="px-4 py-1.5 text-xs font-medium text-[#475569] hover:text-[#111827] hover:bg-white rounded-full transition-all">
              Architecture
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-semibold text-[#475569] hover:text-[#111827] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold hover:bg-[#1E293B] shadow-md shadow-slate-900/10 active:scale-[0.98] transition-all"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-8 z-10">
              {/* Operational Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E6E2D5] shadow-sm text-xs text-[#475569]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-[#111827]">Garment & Manufacturing Operations</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-800 font-medium">Real-Time Precision</span>
              </div>

              {/* Serif & Sans Hero Title */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111827] leading-[1.08]">
                  Command your inventory with <span className="font-serif italic font-normal text-amber-900 underline decoration-amber-300 underline-offset-8">absolute clarity.</span>
                </h1>
                <p className="text-lg sm:text-xl text-[#475569] max-w-2xl font-normal leading-relaxed pt-2">
                  An enterprise-grade, lightweight inventory platform engineered for modern garment production, raw material logistics, variant control, and AI forecasting.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-xl bg-[#111827] text-white font-semibold text-sm hover:bg-[#1E293B] shadow-lg shadow-slate-900/15 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Explore Demo Accounts</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#workbench"
                  className="px-6 py-3.5 rounded-xl bg-white border border-[#E6E2D5] text-[#1E293B] font-semibold text-sm hover:bg-[#F3EEDD]/50 hover:border-[#DCD5C0] shadow-sm flex items-center gap-2 transition-all"
                >
                  <Command className="w-4 h-4 text-[#64748B]" />
                  <span>Interactive Live Preview</span>
                </a>
              </div>

              {/* Metric Highlights Strip */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E6E2D5]">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-[#111827] font-mono tracking-tight">174+</p>
                  <p className="text-xs text-[#64748B] font-medium">Products & Materials</p>
                </div>
                <div className="space-y-1 border-l border-[#E6E2D5] pl-4">
                  <p className="text-2xl font-bold text-[#111827] font-mono tracking-tight">75+</p>
                  <p className="text-xs text-[#64748B] font-medium">Active Color/SKU Variants</p>
                </div>
                <div className="space-y-1 border-l border-[#E6E2D5] pl-4">
                  <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600 flex items-center gap-1">
                    <span>99.9%</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </p>
                  <p className="text-xs text-[#64748B] font-medium">Stock Audit Accuracy</p>
                </div>
              </div>
            </div>

            {/* Right Column - Console Widget */}
            <div className="lg:col-span-5 relative z-10">
              <div className="relative">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-300/40 to-yellow-400/30 rounded-3xl opacity-40 blur-xl" />

                <div className="relative rounded-2xl bg-white border border-[#E6E2D5] shadow-2xl p-5 space-y-4">
                  
                  {/* Mock Window Control Bar */}
                  <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-200" />
                      <div className="w-3 h-3 rounded-full bg-amber-200" />
                      <div className="w-3 h-3 rounded-full bg-amber-200" />
                      <span className="text-[11px] font-mono text-[#94A3B8] ml-2">SIMS Operational Desk</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      LIVE STREAM
                    </span>
                  </div>

                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FAF8F3] rounded-xl p-3 border border-[#EAE6D8]">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] text-[#64748B] font-medium">Inventory Val</span>
                        <Package className="w-3.5 h-3.5 text-amber-800" />
                      </div>
                      <p className="text-lg font-bold text-[#111827] mt-1 font-mono">$482,900</p>
                      <span className="text-[10px] text-emerald-600 font-medium">↑ +4.2% this week</span>
                    </div>

                    <div className="bg-[#FAF8F3] rounded-xl p-3 border border-[#EAE6D8]">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] text-[#64748B] font-medium">Low Stock Alerts</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <p className="text-lg font-bold text-amber-700 mt-1 font-mono">3 SKUs</p>
                      <span className="text-[10px] text-[#94A3B8] font-medium">Auto-reorder active</span>
                    </div>
                  </div>

                  {/* Interactive Live Slider Demo */}
                  <div className="bg-[#1E293B] text-white rounded-xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-200 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        Live Stock Adjuster
                      </span>
                      <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded">Interactive</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className="text-slate-300">Cotton Denim Fabric</span>
                        <span className="font-bold text-white">{simulatedQty} meters</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        value={simulatedQty}
                        onChange={(e) => setSimulatedQty(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-slate-700"
                      />
                    </div>
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Threshold: 50 meters</span>
                      {simulatedQty < 50 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold animate-pulse">
                          ⚠️ Needs Reorder
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                          ✓ Stock Optimal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Activity List */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Recent Activity</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF8F3] border border-[#EAE6D8]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">PO</div>
                          <div>
                            <p className="font-semibold text-[#1E293B] text-[11px]">Purchase Order #89</p>
                            <p className="text-[10px] text-[#94A3B8]">Apex Textiles Co.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#64748B]">Just now</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF8F3] border border-[#EAE6D8]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">AI</div>
                          <div>
                            <p className="font-semibold text-[#1E293B] text-[11px]">Demand Forecast Generated</p>
                            <p className="text-[10px] text-[#94A3B8]">+34% Autumn trend</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#64748B]">2m ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Link */}
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2.5 rounded-xl bg-[#F3EEDD] hover:bg-[#EAE4CF] text-[#111827] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Sign In to Access Full Dashboard</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== CORE SYSTEM ARCHITECTURE ==================== */}
      <section id="features" className="py-20 bg-[#F4F1E6] border-y border-[#E2DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-900 uppercase bg-[#EAE4CF] px-3.5 py-1.5 rounded-full border border-[#DDD6BF]">
                End-To-End System Modules
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight mt-3">
                Purpose-built for raw materials & garment manufacturing.
              </h2>
            </div>
            <p className="text-[#64748B] max-w-md text-sm leading-relaxed">
              Every detail engineered to streamline purchasing, raw material tracking, stock movements, and AI insights with clean performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="group rounded-2xl bg-white border border-[#E6E2D5] p-7 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-[#111827] text-white flex items-center justify-center mb-6 shadow-md shadow-slate-900/20 group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">Variant & SKU Tracking</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Seamless matrix control over sizes, colors, fabric weights, barcodes, and unique SKU numbers with automatic stock aggregation.
              </p>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 text-xs font-semibold text-amber-900">
                <span>Barcodes & QR Code Generation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2 (Elevated Accent) */}
            <div className="group rounded-2xl bg-white border-2 border-amber-600 p-7 shadow-xl shadow-amber-900/5 relative transform lg:-translate-y-2 transition-all">
              <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                Manufacturing Core
              </span>
              <div className="w-12 h-12 rounded-xl bg-amber-700 text-white flex items-center justify-center mb-6 shadow-md shadow-amber-700/20 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">Raw Material Control</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Manage fabrics, threads, zippers, buttons, and dyes linked directly to suppliers with automatic unit conversion and low-stock alerts.
              </p>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 text-xs font-semibold text-amber-900">
                <span>Supplier Linked Catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl bg-white border border-[#E6E2D5] p-7 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-700/20 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">AI Copilot & Insights</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                6 specialized AI analytics modules for demand forecasting (30/60/90 days), health scoring, supplier intelligence, and natural language copilot chat.
              </p>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span>ML Predictive Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="group rounded-2xl bg-white border border-[#E6E2D5] p-7 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-6 shadow-md shadow-amber-600/20 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">Orders & Invoicing</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Multi-item PO & Sales management with automated inventory deduction, invoice generation, status tracking, and supplier histories.
              </p>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 text-xs font-semibold text-amber-700">
                <span>Auto-Stock Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="group rounded-2xl bg-white border border-[#E6E2D5] p-7 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-6 shadow-md shadow-slate-800/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">Audit & Compliance</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Comprehensive immutable activity logs tracking stock adjustments, user sign-ins, order status modifications, and system configuration.
              </p>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>Granular Trail Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 6 */}
            <div className="group rounded-2xl bg-white border border-[#E6E2D5] p-7 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-[#1E293B] text-white flex items-center justify-center mb-6 shadow-md shadow-slate-900/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">Role-Based Access</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Admin and Staff roles with JWT token management, automatic session timeout, dark/light mode toggles, and Excel/CSV export engine.
              </p>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 text-xs font-semibold text-[#111827]">
                <span>JWT & Session Security</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== INTERACTIVE WORKBENCH PREVIEW ==================== */}
      <section id="workbench" className="py-20 bg-[#F9F7F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-amber-900 uppercase bg-[#EAE4CF] px-3.5 py-1.5 rounded-full border border-[#DDD6BF]">
              Live Console Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight mt-4">
              Experience the SIMS Workflow
            </h2>
            <p className="text-[#475569] text-sm sm:text-base mt-2">
              Select a module tab below to explore live sample datasets, real-time metrics, and operational cards.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {WORKBENCH_TABS.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === idx
                    ? 'bg-[#111827] text-white shadow-md shadow-slate-900/10 scale-105'
                    : 'bg-white text-[#475569] hover:bg-[#F3EEDD] border border-[#E6E2D5]'
                }`}
              >
                <span>{tab.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  activeTab === idx ? 'bg-amber-700 text-white' : 'bg-[#EAE4CF] text-[#5C5332]'
                }`}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Workbench Display */}
          <div className="bg-white rounded-2xl border border-[#E6E2D5] shadow-xl overflow-hidden">
            <div className="bg-[#111827] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-white">{currentTab.title}</h3>
                <p className="text-xs text-slate-400">{currentTab.subtitle}</p>
              </div>
              <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                {currentTab.metrics.map((m) => (
                  <div key={m.label} className="text-right">
                    <p className="text-[10px] uppercase font-mono text-slate-400">{m.label}</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">{m.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-xs">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter preview data..."
                    value={simulatedSearch}
                    onChange={(e) => setSimulatedSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F3] border border-[#E6E2D5] rounded-lg text-xs text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-amber-700"
                  />
                </div>
                <span className="text-xs text-[#64748B] font-mono">
                  Showing {currentTab.previewData.length} records
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#F0ECE1]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F3] text-[#64748B] font-semibold border-b border-[#F0ECE1]">
                    <tr>
                      <th className="py-3 px-4">Item / Description</th>
                      {activeTab === 0 && <>
                        <th className="py-3 px-4">SKU Code</th>
                        <th className="py-3 px-4">Stock Qty</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </>}
                      {activeTab === 1 && <>
                        <th className="py-3 px-4">AI Demand Trend</th>
                        <th className="py-3 px-4">Recommended Action</th>
                        <th className="py-3 px-4 text-right">Confidence</th>
                      </>}
                      {activeTab === 2 && <>
                        <th className="py-3 px-4">Details</th>
                        <th className="py-3 px-4">Total Value</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1] text-[#334155] font-medium">
                    {currentTab.previewData
                      .filter(item => 
                        simulatedSearch === '' || 
                        JSON.stringify(item).toLowerCase().includes(simulatedSearch.toLowerCase())
                      )
                      .map((rowItem, i) => {
                        const row = rowItem as any
                        return (
                          <tr key={i} className="hover:bg-[#FAF8F3] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#111827]">{row.name}</td>
                            {activeTab === 0 && (
                              <>
                                <td className="py-3.5 px-4 font-mono text-[#64748B]">{row.sku}</td>
                                <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">{row.qty}</td>
                                <td className="py-3.5 px-4">{row.category}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    row.status === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    row.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                              </>
                            )}
                            {activeTab === 1 && (
                              <>
                                <td className="py-3.5 px-4 text-amber-900 font-medium">{row.forecast}</td>
                                <td className="py-3.5 px-4 font-semibold text-[#111827]">{row.recommended}</td>
                                <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">{row.confidence}</td>
                              </>
                            )}
                            {activeTab === 2 && (
                              <>
                                <td className="py-3.5 px-4 text-[#475569]">{row.items}</td>
                                <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">{row.total}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    {row.status}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2">
                <span className="text-xs text-[#94A3B8]">
                  ⚡ Connected to SQLite development database
                </span>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 transition-colors"
                >
                  <span>Open Full Workspace Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== AI COPILOT SPOTLIGHT ==================== */}
      <section id="ai-intelligence" className="py-20 bg-[#F4F1E6] border-t border-[#E2DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EAE4CF] text-amber-950 border border-[#DDD6BF]">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Conversational Copilot & Analytics
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight leading-tight">
                Ask your inventory questions in plain English.
              </h2>

              <p className="text-[#475569] text-base leading-relaxed">
                SIMS features custom machine learning analytics engines for demand forecasting, supplier performance scoring, inventory health assessment, and an interactive AI copilot.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Predict 30/60/90 day seasonal demand for garment lines',
                  'Instant reorder quantity recommendations based on lead times',
                  'Supplier lead-time intelligence and defect rate tracking',
                  'Automated low-stock notification alerts to team members',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-[#334155]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Console */}
            <div className="lg:col-span-6">
              <div className="bg-[#111827] text-slate-100 rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">SIMS AI Copilot</p>
                      <p className="text-[10px] text-emerald-400 font-mono">Online • Analytics Engine Active</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">v2.1 ML</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-end">
                    <div className="bg-amber-600 text-white px-3.5 py-2 rounded-xl rounded-tr-none max-w-xs shadow-sm">
                      Which raw materials need reordering before next week?
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded bg-amber-950 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                      AI
                    </div>
                    <div className="bg-slate-800 text-slate-200 border border-slate-700 p-3.5 rounded-xl rounded-tl-none space-y-2 max-w-sm">
                      <p className="font-semibold text-white">Based on current sales velocity and supplier lead times:</p>
                      <ul className="space-y-1 text-slate-300 list-disc list-inside">
                        <li><strong className="text-amber-300">Organic Denim Fabric:</strong> 18m remaining. Reorder +200m (Lead time: 5d).</li>
                        <li><strong className="text-amber-300">Brass Zippers (18cm):</strong> 5 units left. Reorder +500 units.</li>
                      </ul>
                      <div className="pt-1 text-[10px] text-emerald-400 font-mono">Confidence Score: 98.4%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono">
                    Ask AI about stock forecasts, suppliers, or sales...
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                  >
                    <CornerDownRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#111827] text-white pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-slate-800">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-[#111827] flex items-center justify-center font-bold">
                  <SimsLogoIcon className="w-5 h-5 text-[#111827]" />
                </div>
                <span className="font-bold text-xl text-white tracking-tight">SIMS</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Smart Inventory Management System for Garment & Textile Manufacturing. High clarity, zero bloat, enterprise power.
              </p>
            </div>

            <div className="md:col-span-4 bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Built-in Demo Credentials</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] block font-mono">ADMIN ROLE</span>
                  <span className="font-mono text-white font-bold">admin / admin123</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] block font-mono">STAFF ROLE</span>
                  <span className="font-mono text-white font-bold">staff1 / staff123</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col justify-center items-start md:items-end">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
              >
                <span>Access Operator Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} SIMS Smart Inventory Management System. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Flask + React + TypeScript</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Operational
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  )
}
