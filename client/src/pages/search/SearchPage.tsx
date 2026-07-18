import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Package, Droplets, Truck, ShoppingCart, ClipboardList, X } from 'lucide-react'
import { searchService } from '../../services/dataService'
import { SearchResults } from '../../types'

const typeIcons: Record<string, any> = {
  product: Package,
  material: Droplets,
  supplier: Truck,
  purchase: ShoppingCart,
  sale: ClipboardList,
}

const typeGradients: Record<string, string> = {
  product: 'from-blue-500 to-blue-600 shadow-blue-500/20',
  material: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
  supplier: 'from-purple-500 to-purple-600 shadow-purple-500/20',
  purchase: 'from-orange-500 to-orange-600 shadow-orange-500/20',
  sale: 'from-cyan-500 to-cyan-600 shadow-cyan-500/20',
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Global Search</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Search across all modules</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors z-10" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, materials, suppliers..."
            className="w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400/50 transition-all duration-300 pl-11 text-base lg:text-lg peer"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="absolute inset-x-3 bottom-0 h-0.5 bg-primary-500 scale-x-0 peer-focus:scale-x-100 transition-transform duration-300 rounded-full" />
        </div>
        <button type="submit" className="inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">Search</button>
      </form>

      {loading && (
        <div className="flex justify-center py-16 animate-fade-in">
          <div className="relative">
            <div className="animate-spin w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-3 h-3 bg-primary-600 rounded-full animate-pulse-soft" />
            </div>
          </div>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {allResults.length === 0 ? (
            <div className="card relative overflow-hidden text-center py-16">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No results found for "<span className="font-medium text-gray-700 dark:text-gray-300">{query}</span>"</p>
            </div>
          ) : (
            Object.entries(results).map(([type, items], groupIndex) => {
              if (items.length === 0) return null
              const Icon = typeIcons[type] || Search
              return (
                <div key={type} className="card relative overflow-hidden animate-fade-in-up" style={{ animationDelay: `${groupIndex * 80}ms` }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
                  <h3 className="text-base font-semibold mb-3 capitalize flex items-center gap-2 text-gray-900 dark:text-white">
                    <Icon className="w-4 h-4" /> {type}
                    <span className="text-xs font-normal text-gray-400 ml-1">({items.length})</span>
                  </h3>
                  <div className="space-y-1">
                    {items.map((item: any, i: number) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl text-left transition-all duration-200 hover:pl-4 animate-fade-in"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg bg-gradient-to-br ${typeGradients[item.type] || 'from-primary-500 to-primary-600 shadow-primary-500/20'}`}>
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize bg-gray-100 dark:bg-gray-800/50 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700/50 font-medium">{item.type}</span>
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
