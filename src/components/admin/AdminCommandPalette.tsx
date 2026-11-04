'use client'

import { useMemo, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { searchAdminNavItems } from './adminCommandSearch'
import { ADMIN_NAV_ITEMS } from './adminNavItems'

interface AdminCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Jump to any back-office page by name. Opened from the top bar or Cmd/Ctrl+K. */
export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const results = useMemo(() => searchAdminNavItems(ADMIN_NAV_ITEMS, query), [query])

  const close = () => {
    setQuery('')
    setActiveIndex(0)
    onOpenChange(false)
  }

  const go = (href: string) => {
    close()
    router.push(href)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      const target = results[activeIndex]
      if (target) go(target.href)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="top-[20%] translate-y-0 gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aller à une page</DialogTitle>
          <DialogDescription>Tape le nom d'une page, puis Entrée.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          placeholder="Participants, codes promo, groupes…"
          aria-label="Rechercher une page"
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
        />
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune page trouvée.</p>
        ) : (
          <ul role="listbox" aria-label="Pages" className="max-h-80 space-y-1 overflow-y-auto">
            {results.map((item, index) => (
              <li key={item.value} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${
                    index === activeIndex ? 'bg-primary/15 text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
