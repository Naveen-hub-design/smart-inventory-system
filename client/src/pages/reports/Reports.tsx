import { useState } from 'react'
import { FileText, Download, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportService } from '../../services/dataService'

const reportTypes = [
  { id: 'inventory', label: 'Inventory Report', desc: 'Current stock levels of all products' },
  { id: 'sales', label: 'Sales Report', desc: 'Sales history and revenue data' },
  { id: 'purchases', label: 'Purchase Report', desc: 'Purchase order history' },
  { id: 'suppliers', label: 'Supplier Report', desc: 'Supplier information overview' },
  { id: 'low-stock', label: 'Low Stock Report', desc: 'Items that need reordering' },
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
          inventory: reportService.getInventory,
          sales: reportService.getSales,
          purchases: reportService.getPurchases,
          suppliers: reportService.getSuppliers,
          'low-stock': reportService.getLowStock,
        }
        res = await excelService[type](params.format)
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_report.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Report downloaded')
      } else {
        const serviceMap: Record<string, any> = {
          inventory: reportService.getInventory,
          sales: () => reportService.getSales(params),
          purchases: () => reportService.getPurchases(params),
          suppliers: reportService.getSuppliers,
          'low-stock': reportService.getLowStock,
        }
        res = await serviceMap[type]()
        setPreview(res.data)
        setSelectedReport(type)
      }
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(null)
    }
  }

  const renderPreview = () => {
    if (!preview || !selectedReport) return null
    const data = preview.data || preview.products || preview.materials || []
    if (!Array.isArray(data) && selectedReport === 'low-stock') {
      const items = [...(preview.products || []), ...(preview.materials || [])]
      return (
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span>{item.Product || item.Material}</span>
              <span className="font-medium">Qty: {item.Quantity || item.quantity}</span>
            </div>
          ))}
        </div>
      )
    }
    if (!Array.isArray(data)) return null
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              {Object.keys(data[0] || {}).map((key) => (
                <th key={key} className="py-2 px-2">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row: any, i: number) => (
              <tr key={i} className="border-b">
                {Object.values(row).map((val: any, j: number) => (
                  <td key={j} className="py-2 px-2">{String(val) || 'N/A'}</td>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-gray-500 mt-1">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="card-hover">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold">{report.label}</h3>
                <p className="text-xs text-gray-500">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport(report.id, 'json')}
                disabled={loading === report.id + 'json'}
                className="btn-secondary flex-1 text-sm"
              >
                <BarChart3 className="w-4 h-4 inline mr-1" /> Preview
              </button>
              <button
                onClick={() => handleExport(report.id, 'excel')}
                disabled={loading === report.id + 'excel'}
                className="btn-primary flex-1 text-sm"
              >
                <Download className="w-4 h-4 inline mr-1" /> Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && preview && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{reportTypes.find(r => r.id === selectedReport)?.label} Preview</h3>
            <button onClick={() => { setPreview(null); setSelectedReport(null) }} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
          {renderPreview()}
        </div>
      )}
    </div>
  )
}
