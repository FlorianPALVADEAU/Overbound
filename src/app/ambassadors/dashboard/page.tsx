'use client'

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/app/api/session/sessionQueries'
import { useAmbassadorDashboard } from '@/app/api/ambassadors/dashboard/dashboardQueries'
import { AmbassadorDashboard } from '@/components/ambassadors/AmbassadorDashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'

function AmbassadorDashboardContent() {
  const searchParams = useSearchParams()
  const viewAs = searchParams.get('as')
  const { data: session, isLoading } = useSession()
  const role = session?.profile?.role ?? null
  const isAdmin = role === 'admin'
  const canAccessAmbassadorDashboard = isAdmin || hasAmbassadorAccess({
    role,
    email: session?.user?.email ?? null,
  })
  const { data, isLoading: dashboardLoading, error, refetch } = useAmbassadorDashboard({
    enabled: Boolean(session?.user && canAccessAmbassadorDashboard),
    viewAs: isAdmin && viewAs ? viewAs : null,
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
    <>
      {isAdmin && viewAs ? (
        <div className="sticky top-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
          <span>Vue admin — dashboard de {data.code ?? viewAs}</span>
          <Link href="/ambassadors/dashboard">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Revenir à ma vue
            </Button>
          </Link>
        </div>
      ) : null}
      <AmbassadorDashboard
        fullName={isAdmin && viewAs ? undefined : (session.profile?.full_name ?? undefined)}
        email={isAdmin && viewAs ? undefined : (session.user?.email ?? undefined)}
        data={data}
        onRewardClaimed={() => {
          void refetch()
        }}
      />
    </>
  )
}

export default function AmbassadorDashboardPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </main>
    }>
      <AmbassadorDashboardContent />
    </Suspense>
  )
}
