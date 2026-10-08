import type { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type Variant = 'dark' | 'light' | 'primary'

interface Props {
  variant?: Variant
  id?: string
  /** Cut the top and bottom edges diagonally for a sharper rhythm. */
  angled?: boolean
  /** Photo behind the content, with a tinted overlay that keeps text readable. */
  backgroundSrc?: string
  className?: string
  children: ReactNode
}

// Token overrides are arbitrary properties on the band itself, so every child
// component keeps using the normal design tokens (bg-card, text-muted-foreground...).
const LIGHT_TOKENS = [
  '[--background:oklch(0.98_0_0)]',
  '[--foreground:oklch(0.16_0_0)]',
  '[--card:oklch(1_0_0)]',
  '[--card-foreground:oklch(0.16_0_0)]',
  '[--muted:oklch(0.94_0_0)]',
  '[--muted-foreground:oklch(0.42_0_0)]',
  '[--secondary:oklch(0.94_0_0)]',
  '[--secondary-foreground:oklch(0.16_0_0)]',
  '[--border:oklch(0_0_0/14%)]',
  '[--input:oklch(0_0_0/16%)]',
  '[--primary:oklch(0.5_0.17_142)]',
].join(' ')

const VARIANT_CLASS: Record<Variant, string> = {
  dark: 'bg-background text-foreground',
  light: `${LIGHT_TOKENS} bg-background text-foreground`,
  primary: 'bg-primary text-primary-foreground [--foreground:oklch(1_0_0)] [--muted-foreground:oklch(1_0_0/80%)]',
}

const OVERLAY_CLASS: Record<Variant, string> = {
  dark: 'bg-background/85',
  light: 'bg-background/90',
  primary: 'bg-primary/80 mix-blend-multiply',
}

const ANGLED_CLASS =
  'py-6 sm:py-10 [clip-path:polygon(0_1.5rem,100%_0,100%_calc(100%_-_1.5rem),0_100%)] sm:[clip-path:polygon(0_2.5rem,100%_0,100%_calc(100%_-_2.5rem),0_100%)]'

/**
 * Full-bleed background band that gives the event page its rhythm: dark (site
 * default), light (high contrast for the decision section) and primary green
 * (punchy call to action), optionally over a photo.
 */
export function LandingBand({ variant = 'dark', id, angled = false, backgroundSrc, className, children }: Props) {
  return (
    <section
      id={id}
      className={cn('relative isolate scroll-mt-4 overflow-hidden', VARIANT_CLASS[variant], angled && ANGLED_CLASS, className)}
    >
      {backgroundSrc ? (
        <div className="absolute inset-0 -z-10" aria-hidden>
          <Image src={backgroundSrc} alt="" fill sizes="100vw" className="object-cover" />
          <div className={cn('absolute inset-0', OVERLAY_CLASS[variant])} />
        </div>
      ) : null}
      {children}
    </section>
  )
}
