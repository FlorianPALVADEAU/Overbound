'use client'

import { useRef, type ReactNode } from 'react'
import Image from 'next/image'
import { useParallax } from '@/hooks/useParallax'
import { cn } from '@/lib/utils'

/**
 * Single source of truth for every hero banner on the site: same height, same
 * parallax. Only the events page uses `tall`.
 */
export const HERO_HEIGHT = {
  standard: 'h-[clamp(32rem,68svh,40rem)]',
  tall: 'min-h-[88svh]',
} as const

// Vertical overscan (-inset-y-40 = 160px) exceeds scroll + mouse travel (110 + 15),
// so the photo edge never shows.
const PARALLAX = { scrollStrength: 110, mouseStrength: 30, mouseStrengthX: 6 } as const

interface HeroImage {
  /** Local static asset, rendered with next/image. */
  src?: string
  /** External URL (e.g. an event cover), rendered as a plain img. */
  url?: string | null
  alt?: string
  /** CSS object-position, default centered. */
  position?: string
}

interface Props {
  image: HeroImage
  variant?: keyof typeof HERO_HEIGHT
  id?: string
  className?: string
  children: ReactNode
}

export function HeroFrame({ image, variant = 'standard', id, className, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const parallax = useParallax(ref, PARALLAX)
  const position = image.position ?? '50% 50%'

  return (
    <section
      ref={ref}
      id={id}
      data-hero={variant}
      className={cn('relative isolate flex flex-col justify-center overflow-hidden', HERO_HEIGHT[variant], className)}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden={image.alt ? undefined : true}>
        <div
          className="absolute -inset-x-6 -inset-y-40 will-change-transform"
          style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
        >
          {image.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.alt ?? ''}
              className="h-full w-full object-cover"
              style={{ objectPosition: position }}
            />
          ) : image.src ? (
            <Image
              src={image.src}
              alt={image.alt ?? ''}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: position }}
            />
          ) : null}
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-background/45 via-background/75 to-background" />
      </div>
      {children}
    </section>
  )
}
