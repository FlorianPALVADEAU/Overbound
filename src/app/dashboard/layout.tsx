'use client'

import Link from 'next/link'
import { redirect, useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminEventContextSelector } from '@/components/admin/events/AdminEventContextSelector'
import { VolunteerAccessControl } from '@/components/admin/VolunteerAccessControl'
import { useSession } from '@/app/api/session/sessionQueries'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession()
  const searchParams = useSearchParams()
  const params = useParams<{ eventId?: string }>()

  // Preserve the legacy tab host until each legacy domain has a route.
  if (searchParams.has('tab')) return children
  if (isLoading) return <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement…</main>
  if (!session?.user) redirect('/auth/login?next=/dashboard')
  if (session.profile?.role === 'volunteer') return <main className="min-h-screen p-6"><VolunteerAccessControl /></main>
  if (session.profile?.role !== 'admin') redirect('/account')

  const eventId = typeof params.eventId === 'string' ? params.eventId : searchParams.get('event')
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen w-full flex-col px-0 py-6 md:flex-row md:gap-6 md:px-6 lg:gap-10 lg:px-10">
        <AdminSidebar profileRole="admin" fullName={session.profile.full_name || session.user.email} />
        <div className="flex-1 overflow-hidden rounded-t-3xl bg-background shadow md:rounded-3xl">
          <header className="flex flex-col gap-4 border-b bg-background px-4 py-4 md:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Administration</h1><p className="text-sm text-muted-foreground">Événements, inscrits et opérations terrain.</p></div><div className="flex items-center gap-2"><Badge variant="secondary">Administrateur</Badge><Link href="/account"><Button variant="outline" size="sm">Mon compte</Button></Link></div></div>
            <AdminEventContextSelector eventId={eventId} />
          </header>
          <main className="space-y-6 px-4 py-6 md:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement…</main>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
