import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Package, Droplets, Truck, ShoppingCart, ClipboardList } from 'lucide-react'
import { searchService } from '../../services/dataService'
import { SearchResults } from '../../types'

const typeIcons: Record<string, any> = {
  product: Package,
  material: Droplets,
  supplier: Truck,
  purchase: ShoppingCart,
  sale: ClipboardList,
}

const typeColors: Record<string, string> = {
  product: 'bg-blue-100 text-blue-600',
  material: 'bg-green-100 text-green-600',
  supplier: 'bg-purple-100 text-purple-600',
  purchase: 'bg-orange-100 text-orange-600',
  sale: 'bg-cyan-100 text-cyan-600',
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  const doSearch = async (q: string) => {
    if (!q || q.length < 2) return
    setLoading(true)
    try {
      const res = await searchService.search(q)
      setResults(res.data.results)
    } catch { } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      doSearch(q)
    }
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      doSearch(query.trim())
    }
  }

  const allResults = results ? Object.values(results).flat() : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Global Search</h1>
        <p className="text-gray-500 mt-1">Search across all modules</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, materials, suppliers..."
            className="input-field pl-10 py-3 text-lg"
          />
        </div>
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {results && !loading && (
        <div className="space-y-4">
          {allResults.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No results found for "{query}"</p>
            </div>
          ) : (
            Object.entries(results).map(([type, items]) => {
              if (items.length === 0) return null
              const Icon = typeIcons[type] || Search
              return (
                <div key={type} className="card">
                  <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                    <Icon className="w-5 h-5" /> {type}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${typeColors[item.type] || 'bg-gray-100'}`}>
                            {item.name.charAt(0)}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.detail}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{item.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
