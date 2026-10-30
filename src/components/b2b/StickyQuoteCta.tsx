'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const SHOW_AFTER_PX = 480

/**
 * Phone only: a bar that keeps "Demander un devis" in reach while the visitor reads. It steps aside
 * near the top of the page (the hero has its own button) and once the quote form is on screen.
 */
export function StickyQuoteCta({ targetId = 'devis' }: { targetId?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [targetId])

  if (!scrolled || formVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
      <Button asChild size="cta" className="mb-3 w-full">
        <a href={`#${targetId}`}>Demander un devis</a>
      </Button>
    </div>
  )
}
