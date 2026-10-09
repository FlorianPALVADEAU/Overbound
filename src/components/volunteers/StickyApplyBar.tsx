'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Visible entre le hero et la section candidature : rappelle toujours où postuler.
export function StickyApplyBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('top')
    const form = document.getElementById('candidature')
    if (!hero || !form) return

    let heroVisible = true
    let formVisible = false
    const update = () => setVisible(!heroVisible && !formVisible)

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) heroVisible = entry.isIntersecting
        if (entry.target === form) formVisible = entry.isIntersecting
      })
      update()
    })
    observer.observe(hero)
    observer.observe(form)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-300 motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
      )}
    >
      <a
        href="#candidature"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('candidature')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.history.replaceState(null, '', '#candidature')
        }}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className="pointer-events-auto inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-black text-primary-foreground shadow-xl shadow-black/50 transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Postuler comme bénévole
        <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
    </div>
  )
}
