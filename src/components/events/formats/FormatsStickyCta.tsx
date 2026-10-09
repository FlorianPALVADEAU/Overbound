'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  href: string
  label: string
}

const REVEAL_AFTER_PX = 320

/** Mobile-only registration bar, revealed once the hero CTA has scrolled away. */
export function FormatsStickyCta({ href, label }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > REVEAL_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 md:hidden',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
    >
      <Link
        href={href}
        className="flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 text-base font-black text-primary-foreground"
      >
        {label}
      </Link>
    </div>
  )
}
