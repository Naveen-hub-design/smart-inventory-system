import { useState } from 'react'
import { FileText, Download, X, Table, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportService } from '../../services/dataService'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'

const reportTypes = [
  { id: 'inventory', label: 'Inventory Report', desc: 'Current stock levels of all products', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'sales', label: 'Sales Report', desc: 'Sales history and revenue data', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'purchases', label: 'Purchase Report', desc: 'Purchase order history', gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'suppliers', label: 'Supplier Report', desc: 'Supplier information overview', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'low-stock', label: 'Low Stock Report', desc: 'Items that need reordering', gradient: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20', bg: 'bg-red-100 dark:bg-red-900/30' },
]

const reportColumns: Record<string, { key: string; label: string }[]> = {
  inventory: [
    { key: 'Product', label: 'Product' },
    { key: 'SKU', label: 'SKU' },
    { key: 'Category', label: 'Category' },
    { key: 'Current Stock', label: 'Current Stock' },
    { key: 'Minimum Stock', label: 'Minimum Stock' },
    { key: 'Status', label: 'Status' },
  ],
  sales: [
    { key: 'Invoice', label: 'Invoice' },
    { key: 'Customer', label: 'Customer' },
    { key: 'Product', label: 'Product' },
    { key: 'Quantity', label: 'Quantity' },
    { key: 'Total', label: 'Total' },
    { key: 'Date', label: 'Date' },
  ],
  purchases: [
    { key: 'Purchase No', label: 'Purchase No' },
    { key: 'Supplier', label: 'Supplier' },
    { key: 'Material', label: 'Material' },
    { key: 'Quantity', label: 'Quantity' },
    { key: 'Cost', label: 'Cost' },
    { key: 'Date', label: 'Date' },
  ],
  suppliers: [
    { key: 'Supplier', label: 'Supplier' },
    { key: 'Contact Person', label: 'Contact Person' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Email', label: 'Email' },
    { key: 'Status', label: 'Status' },
  ],
  'low-stock': [
    { key: 'Product', label: 'Product' },
    { key: 'Current Stock', label: 'Current Stock' },
    { key: 'Minimum Stock', label: 'Minimum Stock' },
    { key: 'Required Quantity', label: 'Required Quantity' },
    { key: 'Status', label: 'Status' },
  ],
}

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const handleExport = async (type: string, format: string) => {
    setLoading(type + format)
    if (format === 'json') {
      setSelectedReport(type)
      setPreview(null)
    }
    try {
      let res: any
      const params: any = {}
      if (type === 'sales' || type === 'purchases') {
        params.start_date = '2024-01-01'
        params.end_date = new Date().toISOString().split('T')[0]
      }

      if (format === 'excel') {
        params.format = 'excel'
        const excelService: Record<string, any> = {
          inventory: () => reportService.getInventory('excel'),
          sales: () => reportService.getSales({ ...params }),
          purchases: () => reportService.getPurchases({ ...params }),
          suppliers: () => reportService.getSuppliers('excel'),
          'low-stock': () => reportService.getLowStock('excel'),
        }
        res = await excelService[type]()
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_report.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Report downloaded')
      } else {
        const serviceMap: Record<string, any> = {
          inventory: () => reportService.getInventory('json'),
          sales: () => reportService.getSales({ ...params, format: 'json' }),
          purchases: () => reportService.getPurchases({ ...params, format: 'json' }),
          suppliers: () => reportService.getSuppliers('json'),
          'low-stock': () => reportService.getLowStock('json'),
        }
        res = await serviceMap[type]()
        setPreview(res.data)
        setSelectedReport(type)
      }
    } catch (err: any) {
      let msg = 'Failed to generate report'
      if (err?.response?.data) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text()
            const json = JSON.parse(text)
            msg = json.error || msg
          } catch {}
        } else {
          msg = err.response.data?.error || msg
        }
      } else if (err?.message) {
        msg = err.message
      }
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  const renderPreview = () => {
    if (!selectedReport) return null

    const columns = reportColumns[selectedReport]
    if (!columns) return null

    const isLoading = loading === selectedReport + 'json'

    if (isLoading) {
      return <TableSkeleton rows={5} />
    }

    if (!preview) return null

    const data = preview.data || []
    if (!Array.isArray(data)) return null

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No records found</p>
          <p className="text-xs mt-1">Try adjusting your date range or check back later.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto -mx-6">
        <div className="inline-block min-w-full align-middle px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {columns.map(col => (
                  <th key={col.key} className="table-header">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 20).map((row: any, i: number) => (
                <tr key={i} className="table-row animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                  {columns.map(col => (
                    <td key={col.key} className="table-cell">
                      {String(row[col.key] ?? 'N/A')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="page-title">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportTypes.map((report, i) => (
          <div key={report.id} className="card relative overflow-hidden card-hover cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => handleExport(report.id, 'json')}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${report.gradient}`} />
            <div className="flex items-center gap-3.5 mb-5">
              <div className={`w-11 h-11 bg-gradient-to-br ${report.gradient} rounded-xl flex items-center justify-center shadow-lg ${report.shadow} shrink-0`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{report.label}</h3>
                <p className="text-muted mt-0.5 truncate">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={(e) => { e.stopPropagation(); handleExport(report.id, 'json') }}
                disabled={loading === report.id + 'json'}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === report.id + 'json' ? (
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                Preview
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleExport(report.id, 'excel') }}
                disabled={loading === report.id + 'excel'}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === report.id + 'excel' ? (
                  <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (preview || loading === selectedReport + 'json') && (
        <div className="card animate-fade-in-up relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Table className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              </span>
              <h3 className="card-title">{reportTypes.find(r => r.id === selectedReport)?.label} Preview</h3>
            </div>
            <button onClick={() => { setPreview(null); setSelectedReport(null); setLoading(null) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 active:scale-90">
              <X className="w-3 h-3" /> Close
            </button>
          </div>
          {renderPreview()}
          {preview && preview.data && preview.data.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-hint flex items-center gap-1.5">
              <Table className="w-3 h-3" />
              Showing up to 20 records. Download Excel for full data.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
