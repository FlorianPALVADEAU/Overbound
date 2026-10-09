'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  registerHref: string
  label: string
  priceLabel: string | null
  /** Reveal after the hero (which has its own CTA) has scrolled away. */
  visible: boolean
  onClick: (location: 'sticky_mobile' | 'sticky_desktop') => void
}

/** Always-reachable registration action. Render only while sales are open. */
export function EventStickyCta({ registerHref, label, priceLabel, visible, onClick }: Props) {
  return (
    <>
      <div
        className={[
          'fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 md:hidden',
          visible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          {priceLabel ? (
            <p className="shrink-0 text-sm font-bold leading-tight">{priceLabel}</p>
          ) : null}
          <Button asChild className="h-12 min-w-0 flex-1 rounded-xl text-base font-semibold">
            <Link href={registerHref} onClick={() => onClick('sticky_mobile')}>
              {label}
            </Link>
          </Button>
        </div>
      </div>

      <div
        className={[
          'fixed bottom-6 right-6 z-40 hidden transition-all duration-300 md:block',
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        ].join(' ')}
      >
        <div className="rounded-2xl border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur">
          <Button asChild size="lg" className="rounded-xl px-6 text-base font-semibold">
            <Link href={registerHref} onClick={() => onClick('sticky_desktop')}>
              {label} →
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
