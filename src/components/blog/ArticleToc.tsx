'use client'

import { useEffect, useState } from 'react'
import { Disclosure } from '@/components/ds'
import type { BlogHeading } from '@/lib/blog/renderMarkdown'
import { cn } from '@/lib/utils'

/** Heading whose anchor is in the reading band (upper part of the viewport) is the current one. */
function useActiveHeading(ids: string[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(ids[0])
  const idsKey = ids.join('|')

  useEffect(() => {
    const orderedIds = idsKey ? idsKey.split('|') : []
    const targets = orderedIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = orderedIds.find((id) => visible.has(id))
        if (first) setActiveId(first)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [idsKey])

  return activeId
}

export function ArticleTocList({ items }: { items: BlogHeading[] }) {
  const activeId = useActiveHeading(items.map((item) => item.id))

  return (
    <nav aria-label="Sommaire de l'article">
      <ol className="flex flex-col">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'flex min-h-11 items-center border-l-2 py-2 pl-3 text-sm leading-snug transition-colors duration-200 ease-standard',
                  isActive
                    ? 'border-primary font-semibold text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                )}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Sommaire folded above the article on screens below `xl`. */
export function ArticleTocMobile({ items }: { items: BlogHeading[] }) {
  if (items.length === 0) return null

  return (
    <div className="xl:hidden">
      <Disclosure title="Sommaire" badge={<span className="text-xs font-normal text-muted-foreground">{items.length}</span>}>
        <ArticleTocList items={items} />
      </Disclosure>
    </div>
  )
}

/** Sticky column at the right edge of the page, from `xl`. Placed in the grid's last column. */
export function ArticleTocAside({ items }: { items: BlogHeading[] }) {
  if (items.length === 0) return null

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-28 w-52 justify-self-end">
        <p className="mb-3 text-label font-semibold uppercase text-subtle">Sommaire</p>
        <ArticleTocList items={items} />
      </div>
    </aside>
  )
}
