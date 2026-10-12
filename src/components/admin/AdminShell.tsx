'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/ds'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminEventContextSelector } from '@/components/admin/events/AdminEventContextSelector'

interface AdminShellProps {
  fullName?: string | null
  /** Event currently selected in the context selector (URL driven). */
  eventId?: string | null
  children: ReactNode
}

/** Frame of every back-office page: sidebar, top bar with the event context, content area. */
export function AdminShell({ fullName, eventId, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <AdminSidebar profileRole="admin" fullName={fullName} />
      <div className="min-w-0 flex-1">
        <header className="space-y-4 border-b border-border bg-surface-deep px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>Administration</Eyebrow>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Administrateur</Badge>
              <Button asChild variant="outline" size="sm">
                <Link href="/account">Mon compte</Link>
              </Button>
            </div>
          </div>
          <AdminEventContextSelector eventId={eventId} />
        </header>
        <main className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-8 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
