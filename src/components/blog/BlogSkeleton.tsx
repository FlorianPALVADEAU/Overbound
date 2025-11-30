export function BlogArticleSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all">
      <div className="relative h-48 w-full overflow-hidden bg-muted animate-pulse" />

      <div className="p-6 space-y-4">
        {/* Categories skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-7 w-full bg-muted rounded animate-pulse" />
          <div className="h-7 w-3/4 bg-muted rounded animate-pulse" />
        </div>

        {/* Excerpt skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>

        {/* Meta skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function BlogGridSkeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <BlogArticleSkeleton key={i} />
      ))}
    </div>
  )
}

export function BlogFiltersSkeleton() {
  return (
    <div className="mb-12 space-y-8">
      {/* Search Bar and Category Filter Skeleton */}
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar Skeleton */}
          <div className="flex-1 h-12 bg-muted rounded-xl animate-pulse" />

          {/* Category Dropdown Skeleton */}
          <div className="sm:w-80 h-12 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
