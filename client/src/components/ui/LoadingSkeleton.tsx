export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-1/6" />
          <div className="skeleton h-4 w-1/6" />
          <div className="skeleton h-4 w-1/12" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="skeleton h-4 w-1/2 mb-3" />
          <div className="skeleton h-8 w-1/3 mb-2" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card">
      <div className="skeleton h-6 w-1/3 mb-4" />
      <div className="skeleton h-64 w-full" />
    </div>
  )
}
