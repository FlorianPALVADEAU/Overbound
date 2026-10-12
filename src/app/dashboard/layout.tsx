'use client'

import { redirect, useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { AdminShell } from '@/components/admin/AdminShell'
import { VolunteerAccessControl } from '@/components/admin/VolunteerAccessControl'
import { useSession } from '@/app/api/session/sessionQueries'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)
  const [profileRetryCount, setProfileRetryCount] = useState(0)
  const { data: session, isLoading, isFetching, refetch } = useSession()
  const searchParams = useSearchParams()
  const params = useParams<{ eventId?: string }>()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!session?.user || session.profile?.role || profileRetryCount >= 2) return
    const retryTimer = window.setTimeout(() => {
      setProfileRetryCount((count) => count + 1)
      void refetch()
    }, 300)
    return () => window.clearTimeout(retryTimer)
  }, [profileRetryCount, refetch, session?.profile?.role, session?.user])

  // Preserve the legacy tab host until each legacy domain has a route.
  if (searchParams.has('tab')) return children
  if (!hasMounted || isLoading || isFetching || (session?.user && !session.profile?.role && profileRetryCount < 2)) return <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement…</main>
  if (!session?.user) redirect('/auth/login?next=/dashboard')
  if (session.profile?.role === 'volunteer') return <main className="min-h-screen bg-background p-6"><VolunteerAccessControl /></main>
  if (session.profile?.role !== 'admin') redirect('/account')

  const eventId = typeof params.eventId === 'string' ? params.eventId : searchParams.get('event')
  return (
    <AdminShell fullName={session.profile.full_name || session.user.email} eventId={eventId}>
      {children}
    </AdminShell>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Chargement…</main>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
