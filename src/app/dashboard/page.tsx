'use client'

import { redirect, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { useSession } from '@/app/api/session/sessionQueries'
import { useAdminOverview } from '@/app/api/admin/overview/overviewQueries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AdminStats } from '@/components/admin/AdminStats'

export default function DashboardPage() {
  const [hasMounted, setHasMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isLoading: sessionLoading } = useSession()
  const role = session?.profile?.role ?? null
  const isAdmin = role === 'admin'
  const isVolunteer = role === 'volunteer'
  const { data, isLoading, error, refetch } = useAdminOverview({ enabled: isAdmin })
  const legacyTab = searchParams.get('tab')
  const eventId = searchParams.get('event')

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!legacyTab) return
    const routes: Record<string, string> = {
      events: '/dashboard/events',
      ambassadors: '/dashboard/ambassadors',
      'distribution-lists': '/dashboard/distribution-lists',
      upsells: '/dashboard/upsells',
      logs: '/dashboard/logs',
      races: '/dashboard/races',
      obstacles: '/dashboard/obstacles',
      promocodes: '/dashboard/promocodes',
      promotions: '/dashboard/promotions',
      groups: '/dashboard/groups',
      bootcamps: '/dashboard/bootcamps',
      users: '/dashboard/users',
      tickets: '/dashboard/tickets',
    }
    const destination = legacyTab === 'members' && eventId
      ? `/dashboard/events/${eventId}/participants`
      : legacyTab === 'tickets' && eventId
        ? `/dashboard/events/${eventId}/tickets`
        : routes[legacyTab]
    if (destination) router.replace(destination)
  }, [eventId, legacyTab, router])

  if (!hasMounted || sessionLoading || (isAdmin && isLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </main>
    )
  }

  if (!session?.user) {
    redirect('/auth/login?next=/dashboard')
  }

  if (isAdmin && error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="font-semibold text-destructive">Impossible de charger le tableau de bord</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()}>Réessayer</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isVolunteer && session?.user) {
    return (
      <AdminDashboard
        user={session.user as any}
        profile={{ role: 'volunteer', full_name: session.profile?.full_name ?? undefined }}
        stats={null}
      />
    )
  }

  if (!isAdmin || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="text-center space-y-4">
            <p className="text-lg font-semibold">Accès refusé</p>
            <p className="text-sm text-muted-foreground">
              Tu n'as pas les permissions nécessaires pour accéder à cette page.
            </p>
            <Link href="/account">
              <Button>Retour au compte</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (legacyTab) {
    return (
      <AdminDashboard
        user={data.user as any}
        profile={{ role: data.profile.role as any, full_name: data.profile.full_name ?? undefined }}
        stats={data.stats}
      />
    )
  }

  return <AdminStats stats={data.stats} />
}
