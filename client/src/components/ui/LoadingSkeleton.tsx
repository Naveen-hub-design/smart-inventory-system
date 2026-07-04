function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700/50 rounded ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer bg-[length:200%_100%]" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Shimmer className="h-4 flex-1" />
          <Shimmer className="h-4 flex-1" />
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <Shimmer className="h-4 w-1/2 mb-3" />
          <Shimmer className="h-8 w-1/3 mb-2" />
          <Shimmer className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card">
      <Shimmer className="h-6 w-1/3 mb-4" />
      <Shimmer className="h-64 w-full" />
    </div>
  )
}
