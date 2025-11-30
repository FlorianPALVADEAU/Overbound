'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface BlogFiltersProps {
  categories: Array<{
    slug: string
    title: string
    count: number
  }>
}

export default function BlogFilters({ categories }: BlogFiltersProps) {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.trim()
  const category = searchParams.get('category')?.trim()

  const clearCategory = () => {
    const newParams = new URLSearchParams()
    if (q) newParams.set('q', q)
    const url = `/blog${newParams.toString() ? `?${newParams.toString()}` : ''}`
    window.location.href = url
  }

  return (
    <div className="mb-12 space-y-8">
      {/* Search Bar and Category Filter - Same Line */}
      <form action="/blog" className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative group">
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Rechercher un article..."
              className="w-full rounded-xl border-2 border-border bg-background/50 pl-11 pr-28 py-3 text-sm backdrop-blur-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            >
              Rechercher
            </button>
          </div>

          {/* Category Dropdown with Clear Button */}
          <div className="relative sm:w-80 flex items-center gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <select
                id="category"
                name="category"
                defaultValue={category ?? ''}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="w-full appearance-none rounded-xl border-2 border-border bg-background/50 pl-10 pr-9 py-3 text-sm backdrop-blur-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 cursor-pointer"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat, index: number) => (
                  <option key={cat.slug + index} value={cat.slug}>
                    {cat.title} ({cat.count})
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Clear Category Button */}
            {category && (
              <button
                type="button"
                onClick={clearCategory}
                className="flex-shrink-0 rounded-lg border-2 border-border bg-background/50 p-3 text-muted-foreground hover:text-foreground hover:border-primary transition-all"
                title="Effacer le filtre"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
