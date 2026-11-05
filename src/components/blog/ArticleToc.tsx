'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { BlogHeading } from '@/lib/blog/renderMarkdown'

interface Props {
  headings: BlogHeading[]
}

export default function ArticleToc({ headings }: Props) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    )

    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav aria-label="Sommaire de l'article" className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:block">
      <p className="text-label font-semibold uppercase text-subtle">Sommaire</p>
      <ul className="mt-4 space-y-2.5 border-l-2 border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                '-ml-px block border-l-2 py-0.5 pl-4 text-sm transition-colors',
                activeId === heading.id
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
