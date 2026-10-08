'use client'

import { useState, type ReactNode } from 'react'
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

interface CardCarouselProps<T> {
  items: T[]
  getKey: (item: T, index: number) => string | number
  renderItem: (item: T, index: number) => ReactNode
  /** Classes of the scrolling track (negative margin and bottom room for the nav buttons). */
  contentClassName?: string
  /** Classes of each slide, mainly its `basis-*` width per breakpoint. */
  itemClassName?: string
  /** Visibility of the prev/next buttons, e.g. `hidden sm:block`. */
  navVisibilityClassName?: string
  loop?: boolean
  showSwipeHint?: boolean
  /** Bigger prev/next buttons with room around them, for sliders on a full page band. */
  roomy?: boolean
  /** Auto-advance every N ms (pauses on hover/touch, off for reduced motion). */
  autoplayMs?: number
}

/**
 * Swipeable card slider with the green prev/next buttons and the mobile
 * swipe hint used by the obstacles carousel. Rendering of each card stays with
 * the caller, so any card list can reuse the same behavior and look.
 */
export function CardCarousel<T>({
  items,
  getKey,
  renderItem,
  contentClassName = '-ml-2 sm:-ml-3 md:-ml-4 pb-14 sm:pb-16',
  itemClassName = 'pl-2 sm:pl-3 md:pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4',
  navVisibilityClassName = 'hidden sm:block',
  loop = true,
  showSwipeHint = true,
  roomy = false,
  autoplayMs,
}: CardCarouselProps<T>) {
  const [api, setApi] = useState<CarouselApi>()
  useCarouselAutoplay(api, autoplayMs)

  return (
    <div className="relative w-full">
      <Carousel opts={{ align: 'start', loop }} setApi={setApi} className="w-full">
        <CarouselContent className={contentClassName}>
          {items.map((item, index) => (
            <CarouselItem key={getKey(item, index)} className={itemClassName}>
              {renderItem(item, index)}
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className={navVisibilityClassName}>
          <CarouselPrevious
            className={cn(
              'top-auto border-[#26AA26] bg-[#26AA26] text-white shadow-lg hover:bg-[#1e8a1e]',
              roomy ? 'bottom-1 left-0 size-11' : 'bottom-4 left-4',
            )}
          />
          <CarouselNext
            className={cn(
              'right-auto top-auto border-[#26AA26] bg-[#26AA26] text-white shadow-lg hover:bg-[#1e8a1e]',
              roomy ? 'bottom-1 left-14 size-11' : 'bottom-4 left-16',
            )}
          />
        </div>
      </Carousel>

      {showSwipeHint ? (
        <div className="mt-4 flex justify-center sm:hidden">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>←</span>
            <span>Glisse pour voir plus</span>
            <span>→</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
