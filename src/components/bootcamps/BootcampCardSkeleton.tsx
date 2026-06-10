export function BootcampCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-border/60 bg-background shadow-lg sm:flex-row">
      <div className="h-52 w-full shrink-0 animate-pulse bg-muted sm:h-auto sm:w-64 md:w-72" />
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-7 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="flex flex-wrap gap-4">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-auto h-9 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}
