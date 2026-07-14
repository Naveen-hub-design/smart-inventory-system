function Shimmer({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-700/40 rounded ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent animate-shimmer bg-[length:200%_100%]" />
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      <div className="flex gap-4 items-center p-4 border-b border-gray-100 dark:border-gray-800/50">
        <Shimmer className="h-3.5 flex-[2]" />
        <Shimmer className="h-3.5 flex-[1.5]" />
        <Shimmer className="h-3.5 w-16" />
        <Shimmer className="h-3.5 w-20" />
        <Shimmer className="h-3.5 w-24" />
        <Shimmer className="h-3.5 w-16" />
        <Shimmer className="h-3.5 w-12" />
        <Shimmer className="h-3.5 w-28" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 border-b border-gray-50 dark:border-gray-800/20" style={{ animationDelay: `${i * 50}ms` }}>
          <Shimmer className="h-4 flex-[2]" />
          <Shimmer className="h-4 flex-[1.5]" />
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-4 w-28" />
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
