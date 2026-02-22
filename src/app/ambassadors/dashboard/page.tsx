'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/app/api/session/sessionQueries'
import { useAmbassadorDashboard } from '@/app/api/ambassadors/dashboard/dashboardQueries'
import { AmbassadorDashboard } from '@/components/ambassadors/AmbassadorDashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'

export default function AmbassadorDashboardPage() {
  const { data: session, isLoading } = useSession()
  const role = session?.profile?.role ?? null
  const canAccessAmbassadorDashboard = hasAmbassadorAccess({
    role,
    email: session?.user?.email ?? null,
  })
  const { data, isLoading: dashboardLoading, error, refetch } = useAmbassadorDashboard({
    enabled: Boolean(session?.user && canAccessAmbassadorDashboard),
  })

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </main>
    )
  }

  if (!session?.user) {
    redirect('/auth/login?next=/ambassadors/dashboard')
  }

  if (!canAccessAmbassadorDashboard) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <p className="text-lg font-semibold">Accès refusé</p>
            <p className="text-sm text-muted-foreground">
              Tu n&apos;as pas les permissions necessaires pour acceder a cette page.
            </p>
            <Link href="/account">
              <Button>Retour au compte</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="font-semibold text-destructive">Impossible de charger le dashboard ambassadeur</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()}>Reessayer</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (dashboardLoading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </main>
    )
  }

  return (
    <AmbassadorDashboard
      fullName={session.profile?.full_name ?? undefined}
      email={session.user?.email ?? undefined}
      data={data}
      onRewardClaimed={() => {
        void refetch()
      }}
    />
  )
}
