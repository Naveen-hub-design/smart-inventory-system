import { useState } from 'react'
import { FileText, Download, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportService } from '../../services/dataService'

const reportTypes = [
  { id: 'inventory', label: 'Inventory Report', desc: 'Current stock levels of all products', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
  { id: 'sales', label: 'Sales Report', desc: 'Sales history and revenue data', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  { id: 'purchases', label: 'Purchase Report', desc: 'Purchase order history', gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
  { id: 'suppliers', label: 'Supplier Report', desc: 'Supplier information overview', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
  { id: 'low-stock', label: 'Low Stock Report', desc: 'Items that need reordering', gradient: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20' },
]

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const handleExport = async (type: string, format: string) => {
    setLoading(type + format)
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
          inventory: () => reportService.getInventory(),
          sales: () => reportService.getSales(params),
          purchases: () => reportService.getPurchases(params),
          suppliers: () => reportService.getSuppliers(),
          'low-stock': () => reportService.getLowStock(),
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
    if (!preview || !selectedReport) return null

    if (selectedReport === 'low-stock') {
      const products = preview.products || []
      const materials = preview.materials || []
      const items = [
        ...products.map((p: any) => ({ Type: 'Product', Name: p.Product, Category: p.Category || 'N/A', Quantity: p.Quantity, 'Min Stock': p['Min Stock'], Status: p.Status })),
        ...materials.map((m: any) => ({ Type: 'Material', Name: m.Material, Category: 'Raw Material', Quantity: m.Quantity, 'Min Stock': m['Min Stock'], Status: m.Status })),
      ]
      if (items.length === 0) return null
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                {Object.keys(items[0]).map((key) => (
                  <th key={key} className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 20).map((row: any, i: number) => (
                <tr key={i} className="table-row animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                  {Object.values(row).map((val: any, j: number) => (
                    <td key={j} className="table-cell py-2 px-3">{String(val) || 'N/A'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {items.length > 20 && <p className="text-sm text-gray-500 mt-2">Showing first 20 of {items.length} records</p>}
        </div>
      )
    }

    const data = preview.data || preview.products || preview.materials || []
    if (!Array.isArray(data)) return null
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              {Object.keys(data[0] || {}).map((key) => (
                <th key={key} className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row: any, i: number) => (
              <tr key={i} className="table-row animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                {Object.values(row).map((val: any, j: number) => (
                  <td key={j} className="table-cell py-2 px-3">{String(val) || 'N/A'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 20 && <p className="text-sm text-gray-500 mt-2">Showing first 20 of {data.length} records</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, i) => (
          <div key={report.id} className="card-hover animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 bg-gradient-to-br ${report.gradient} rounded-xl flex items-center justify-center shadow-lg ${report.shadow}`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{report.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport(report.id, 'json')}
                disabled={loading === report.id + 'json'}
                className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5"
              >
                {loading === report.id + 'json' ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
                Preview
              </button>
              <button
                onClick={() => handleExport(report.id, 'excel')}
                disabled={loading === report.id + 'excel'}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5"
              >
                {loading === report.id + 'excel' ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && preview && (
        <div className="card animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{reportTypes.find(r => r.id === selectedReport)?.label} Preview</h3>
            <button onClick={() => { setPreview(null); setSelectedReport(null) }} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Close</button>
          </div>
          {renderPreview()}
        </div>
      )}
    </div>
  )
}
