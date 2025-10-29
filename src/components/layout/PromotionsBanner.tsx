'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePromotions } from '@/app/api/promotions/promotionsQueries'
import { Button } from '../ui/button'

const AUTO_SLIDE_INTERVAL_MS = 8000

const isExternalLink = (url: string) => /^https?:\/\//i.test(url)

export function PromotionsBanner() {
  const { data: promotions = [], isLoading, isError } = usePromotions()
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => promotions, [promotions])
  const hasMultiple = items.length > 1

  useEffect(() => {
    if (!hasMultiple) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = current + 1
        return nextIndex >= items.length ? 0 : nextIndex
      })
    }, AUTO_SLIDE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [items.length, hasMultiple])

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0)
    }
  }, [items.length, activeIndex])

  if (isLoading || isError || items.length === 0) {
    return null
  }

  const handlePrev = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length)
  }

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % items.length)
  }

  return (
    <div
      className="relative border-b border-border bg-white"
      role="region"
      aria-label="Promotions en cours"
    >
      <div className="relative w-full">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {items.map((promotion) => {
              const title = promotion.title?.trim()
              const description = promotion.description?.trim()
              const linkLabel = promotion.link_text?.trim() || "Découvrir l'offre"

              return (
                <div key={promotion.id} className="w-full shrink-0">
                  <Link
                    href={promotion.link_url}
                    target={isExternalLink(promotion.link_url) ? '_blank' : undefined}
                    rel={isExternalLink(promotion.link_url) ? 'noopener noreferrer' : undefined}
                    className="flex h-full flex-col items-center justify-center px-4 py-2 text-center text-sm font-semibold uppercase tracking-wide text-black transition hover:brightness-110"
                  >
                    {title ? <span className="leading-tight font-black text-[0.9rem] lg:text-[1.05rem]">{title}</span> : null}
                    <div className="flex gap-2" >
                      {description ? (
                        <span className="leading-tight text-[0.55rem] sm:text-xs font-normal uppercase tracking-wide text-black/90 wrap-break-word">
                          {description}
                          {linkLabel ? (
                            <span className="leading-tight underline underline-offset-4 text-[0.5rem] lg:text-xs">{linkLabel}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {hasMultiple ? (
          <>
            <Button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-transparent p-2 text-gray-400 shadow-none hover:bg-transparent hover:text-gray-600 focus-visible:ring-0 lg:flex"
              aria-label="Promotion précédente"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-transparent p-2 text-gray-400 shadow-none hover:bg-transparent hover:text-gray-600 focus-visible:ring-0 lg:flex"
              aria-label="Promotion suivante"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
