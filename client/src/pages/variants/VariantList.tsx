import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, Layers, Barcode, QrCode, Download, Printer, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { variantService, productService } from '../../services/dataService'
import { ProductVariant, Product } from '../../types'
import { getColorHex } from '../../constants/colors'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import VariantForm from './VariantForm'

export default function VariantList() {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [qrViewVariant, setQrViewVariant] = useState<ProductVariant | null>(null)
  const [qrViewUrl, setQrViewUrl] = useState<string | null>(null)
  const [barcodeViewVariant, setBarcodeViewVariant] = useState<ProductVariant | null>(null)
  const [barcodeViewUrl, setBarcodeViewUrl] = useState<string | null>(null)

  const fetchVariants = async (searchVal = search, pageVal = page) => {
    setLoading(true)
    try {
      const params: any = { page: pageVal, per_page: 20, sort_by: 'created_at', sort_order: 'desc' }
      if (searchVal) params.search = searchVal
      if (productFilter) params.product_id = productFilter
      if (colorFilter) params.color = colorFilter
      if (sizeFilter) params.size = sizeFilter
      const res = await variantService.getAll(params)
      setVariants(res.data.variants)
      setPages(res.data.pages)
      setTotal(res.data.total)
    } catch { console.error('Failed to fetch variants') } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVariants() }, [page, productFilter, colorFilter, sizeFilter])

  useEffect(() => {
    productService.getAll({ per_page: 200 }).then(r => setProducts(r.data.products)).catch(() => console.error('Failed to load products'))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchVariants()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return
    try {
      await variantService.delete(id)
      toast.success('Variant deleted')
      fetchVariants()
    } catch { console.error('Failed to delete variant') }
  }

  const openEdit = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingVariant(null)
    setModalOpen(true)
  }

  const fetchBlob = useCallback(async (url: string) => {
    const res = await api.get(url, { responseType: 'blob' })
    return res.data as Blob
  }, [])

  const downloadBarcode = useCallback(async (v: ProductVariant) => {
    try {
      const blob = await fetchBlob(`/product-variants/${v.id}/barcode?format=image&download=true`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `barcode_${v.sku}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download barcode') }
  }, [fetchBlob])

  const printBarcode = useCallback(async (v: ProductVariant) => {
    try {
      const blob = await fetchBlob(`/product-variants/${v.id}/barcode?format=image`)
      const url = URL.createObjectURL(blob)
      const win = window.open('', '_blank')
      if (!win) { URL.revokeObjectURL(url); return }
      win.document.write(`<!DOCTYPE html><html><head><title>Print Barcode - ${v.sku}</title><style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0}img{max-width:100%;height:auto}</style></head><body><img src="${url}" onload="window.print();URL.revokeObjectURL('${url}')" /></body></html>`)
      win.document.close()
    } catch { toast.error('Failed to print barcode') }
  }, [fetchBlob])

  const downloadQR = useCallback(async (v: ProductVariant) => {
    try {
      const blob = await fetchBlob(`/product-variants/${v.id}/qrcode?download=true`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode_${v.sku}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download QR code') }
  }, [fetchBlob])

  const printQR = useCallback(async (v: ProductVariant) => {
    try {
      const blob = await fetchBlob(`/product-variants/${v.id}/qrcode`)
      const url = URL.createObjectURL(blob)
      const win = window.open('', '_blank')
      if (!win) { URL.revokeObjectURL(url); return }
      win.document.write(`<!DOCTYPE html><html><head><title>Print QR Code - ${v.sku}</title><style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0}img{max-width:100%;height:auto}</style></head><body><img src="${url}" onload="window.print();URL.revokeObjectURL('${url}')" /></body></html>`)
      win.document.close()
    } catch { toast.error('Failed to print QR code') }
  }, [fetchBlob])

  const openQRView = useCallback(async (v: ProductVariant) => {
    try {
      const blob = await fetchBlob(`/product-variants/${v.id}/qrcode`)
      const url = URL.createObjectURL(blob)
      setQrViewUrl(url)
      setQrViewVariant(v)
    } catch { toast.error('Failed to load QR code') }
  }, [fetchBlob])

  const closeQRView = useCallback(() => {
    if (qrViewUrl) URL.revokeObjectURL(qrViewUrl)
    setQrViewUrl(null)
    setQrViewVariant(null)
  }, [qrViewUrl])

  const downloadQRFromView = useCallback(async () => {
    if (!qrViewVariant) return
    await downloadQR(qrViewVariant)
  }, [qrViewVariant, downloadQR])

  const printQRFromView = useCallback(async () => {
    if (!qrViewVariant) return
    await printQR(qrViewVariant)
  }, [qrViewVariant, printQR])

  const openBarcodeView = useCallback(async (v: ProductVariant) => {
    try {
      const blob = await fetchBlob(`/product-variants/${v.id}/barcode?format=image`)
      const url = URL.createObjectURL(blob)
      setBarcodeViewUrl(url)
      setBarcodeViewVariant(v)
    } catch { toast.error('Failed to load barcode') }
  }, [fetchBlob])

  const closeBarcodeView = useCallback(() => {
    if (barcodeViewUrl) URL.revokeObjectURL(barcodeViewUrl)
    setBarcodeViewUrl(null)
    setBarcodeViewVariant(null)
  }, [barcodeViewUrl])

  const downloadBarcodeFromView = useCallback(async () => {
    if (!barcodeViewVariant) return
    await downloadBarcode(barcodeViewVariant)
  }, [barcodeViewVariant, downloadBarcode])

  const printBarcodeFromView = useCallback(async () => {
    if (!barcodeViewVariant) return
    await printBarcode(barcodeViewVariant)
  }, [barcodeViewVariant, printBarcode])

  const uniqueColors = [...new Set(variants.map(v => v.color).filter((c): c is string => !!c))]
  const uniqueSizes = [...new Set(variants.map(v => v.size).filter((s): s is string => !!s))]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Product Variants</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage size and color variants for products</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Variant
        </button>
      </div>

      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
        <div className="flex flex-col gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by SKU, barcode, product..." className="input-field pl-10 pr-9" />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); fetchVariants('', 1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <select value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setPage(1) }} className="select-field w-full sm:w-48">
              <option value="">All Products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
            </select>
            <select value={colorFilter} onChange={(e) => { setColorFilter(e.target.value); setPage(1) }} className="select-field w-full sm:w-36">
              <option value="">All Colors</option>
              {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sizeFilter} onChange={(e) => { setSizeFilter(e.target.value); setPage(1) }} className="select-field w-full sm:w-32">
              <option value="">All Sizes</option>
              {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : variants.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-8 h-8 text-gray-400" />}
            title="No variants found"
            description="Add your first variant to manage size and color options."
            action={<button onClick={openCreate} className="btn-primary">Add Variant</button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header w-[110px] min-w-[90px]">SKU</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header min-w-[160px] w-[200px]">Product</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-center w-[70px]">Size</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header w-[100px]">Color</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[85px]">Stock</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[85px]">Min Stock</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[95px]">Cost</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[95px]">Price</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-center w-[90px]">Barcode</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-center w-[90px]">QR Code</th>
                      <th className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 table-header text-right w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={v.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                        <td className="table-cell font-mono text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap truncate max-w-[110px]" title={v.sku}>{v.sku}</td>
                        <td className="table-cell whitespace-nowrap truncate max-w-[200px] text-gray-900 dark:text-white" title={v.product_name || ''}>{v.product_name || <span className="text-gray-400">N/A</span>}</td>
                        <td className="table-cell text-center whitespace-nowrap text-gray-600 dark:text-gray-400">{v.size || <span className="text-gray-400">—</span>}</td>
                        <td className="table-cell whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {v.color && <span className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" style={{ backgroundColor: getColorHex(v.color) }} />}
                            <span className="truncate max-w-[70px]" title={v.color || ''}>{v.color || <span className="text-gray-400">—</span>}</span>
                          </span>
                        </td>
                        <td className="table-cell text-right whitespace-nowrap">
                          <span className={`tabular-nums font-medium ${v.stock <= v.min_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            {v.stock}
                          </span>
                        </td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-400">{v.min_stock}</td>
                        <td className="table-cell text-right tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300">₹{v.cost_price.toLocaleString()}</td>
                        <td className="table-cell text-right font-medium tabular-nums whitespace-nowrap text-gray-900 dark:text-white">₹{v.selling_price.toLocaleString()}</td>
                        <td className="table-cell text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => downloadBarcode(v)} className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 active:scale-90" title="Download Barcode">
                              <Download className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                            </button>
                            <button onClick={() => printBarcode(v)} className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 active:scale-90" title="Print Barcode">
                              <Printer className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                            </button>
                            <button onClick={() => openBarcodeView(v)} className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 active:scale-90" title="View Barcode">
                              <Barcode className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                            </button>
                          </div>
                        </td>
                        <td className="table-cell text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => downloadQR(v)} className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 active:scale-90" title="Download QR Code">
                              <Download className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                            </button>
                            <button onClick={() => printQR(v)} className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 active:scale-90" title="Print QR Code">
                              <Printer className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                            </button>
                            <button onClick={() => openQRView(v)} className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 active:scale-90" title="View QR Code">
                              <QrCode className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                            </button>
                          </div>
                        </td>
                        <td className="table-cell text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm" title="Edit">
                              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button onClick={() => handleDelete(v.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingVariant ? 'Edit Variant' : 'Add Variant'} size="lg">
        <VariantForm
          variant={editingVariant}
          products={products}
          onSuccess={() => { setModalOpen(false); fetchVariants() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={!!qrViewVariant} onClose={closeQRView} title="QR Code" size="sm">
        {qrViewVariant && (
          <div className="space-y-4">
            <div className="flex justify-center">
              {qrViewUrl ? (
                <img src={qrViewUrl} alt={`QR Code for ${qrViewVariant.sku}`} className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400">Loading...</div>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Product:</span> <span className="text-gray-900 dark:text-white">{qrViewVariant.product_name || 'N/A'}</span></p>
              <p><span className="font-medium text-gray-700 dark:text-gray-300">SKU:</span> <span className="font-mono text-gray-900 dark:text-white">{qrViewVariant.sku}</span></p>
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Barcode:</span> <span className="font-mono text-gray-900 dark:text-white">{qrViewVariant.barcode || 'N/A'}</span></p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={downloadQRFromView} className="btn-primary">
                <Download className="w-4 h-4" /> Download QR
              </button>
              <button onClick={printQRFromView} className="btn-secondary">
                <Printer className="w-4 h-4" /> Print QR
              </button>
              <button onClick={closeQRView} className="btn-secondary">
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!barcodeViewVariant} onClose={closeBarcodeView} title="Barcode" size="sm">
        {barcodeViewVariant && (
          <div className="space-y-4">
            <div className="flex justify-center">
              {barcodeViewUrl ? (
                <img src={barcodeViewUrl} alt={`Barcode for ${barcodeViewVariant.sku}`} className="max-w-full h-auto" />
              ) : (
                <div className="w-48 h-24 flex items-center justify-center text-gray-400">Loading...</div>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Product:</span> <span className="text-gray-900 dark:text-white">{barcodeViewVariant.product_name || 'N/A'}</span></p>
              <p><span className="font-medium text-gray-700 dark:text-gray-300">SKU:</span> <span className="font-mono text-gray-900 dark:text-white">{barcodeViewVariant.sku}</span></p>
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Barcode:</span> <span className="font-mono text-gray-900 dark:text-white">{barcodeViewVariant.barcode || 'N/A'}</span></p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={downloadBarcodeFromView} className="btn-primary">
                <Download className="w-4 h-4" /> Download Barcode
              </button>
              <button onClick={printBarcodeFromView} className="btn-secondary">
                <Printer className="w-4 h-4" /> Print Barcode
              </button>
              <button onClick={closeBarcodeView} className="btn-secondary">
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
