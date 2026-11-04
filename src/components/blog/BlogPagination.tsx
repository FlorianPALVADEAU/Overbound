import Link from 'next/link'

interface Props {
  current: number
  pageCount: number
  hrefFor: (page: number) => string
}

const PILL_LINK =
  'rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted'

// Renders nothing when there is only one page.
export default function BlogPagination({ current, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-4">
      {current > 1 && (
        <Link href={hrefFor(current - 1)} className={PILL_LINK}>
          Précédent
        </Link>
      )}
      <span className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">
        Page {current} / {pageCount}
      </span>
      {current < pageCount && (
        <Link href={hrefFor(current + 1)} className={PILL_LINK}>
          Suivant
        </Link>
      )}
    </nav>
  )
}
