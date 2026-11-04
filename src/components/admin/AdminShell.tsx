'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Eyebrow } from '@/components/ds'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette'

interface AdminShellProps {
  fullName?: string | null
  children: ReactNode
}

/** Frame of every back-office page: sidebar, top bar, content area. Event context lives on the overview only. */
export function AdminShell({ fullName, children }: AdminShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background md:flex">
      <AdminSidebar profileRole="admin" fullName={fullName} />
      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-deep px-4 py-3 md:px-6 md:py-4 lg:px-8">
          <Eyebrow>Administration</Eyebrow>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" aria-label="Aller à une page (Ctrl K)" onClick={() => setPaletteOpen(true)}>
              <Search aria-hidden />
            </Button>
            <Badge variant="secondary" className="hidden sm:inline-flex">Administrateur</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/account">Mon compte</Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-6 px-4 py-4 md:space-y-8 md:px-6 md:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
