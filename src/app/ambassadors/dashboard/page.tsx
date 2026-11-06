'use client'

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/app/api/session/sessionQueries'
import { useAmbassadorDashboard } from '@/app/api/ambassadors/dashboard/dashboardQueries'
import { AmbassadorDashboard } from '@/components/ambassadors/AmbassadorDashboard'
import { Container } from '@/components/ds'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-background" role="status" aria-label="Chargement de ton espace">
      <Container size="page" className="space-y-4 py-6 sm:space-y-6 sm:py-8">
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-muted motion-safe:animate-pulse" />
          <div className="h-10 w-64 rounded bg-muted motion-safe:animate-pulse" />
        </div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-2xl bg-muted motion-safe:animate-pulse" />
          <div className="h-48 rounded-2xl bg-muted motion-safe:animate-pulse" />
        </div>
      </Container>
    </main>
  )
}

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

  if (isLoading) return <DashboardSkeleton />

  if (!session?.user) {
    redirect('/auth/login?next=/ambassadors/dashboard')
  }

  if (!canAccessAmbassadorDashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <p className="text-lg font-semibold">Accès refusé</p>
            <p className="text-sm text-muted-foreground">
              Tu n&apos;as pas les permissions nécessaires pour accéder à cette page.
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
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="font-semibold text-destructive">Impossible de charger le dashboard ambassadeur</p>
            <p className="text-sm text-muted-foreground">Vérifie ta connexion, puis réessaie. Si le problème continue, écris-nous.</p>
            <Button onClick={() => refetch()}>Réessayer</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (dashboardLoading || !data) return <DashboardSkeleton />

  return (
    <>
      {isAdmin && viewAs ? (
        <div className="sticky top-0 z-50 flex items-center justify-between bg-warning px-4 py-2 text-sm font-medium text-primary-foreground">
          <span>Vue admin : dashboard de {data.code ?? viewAs}</span>
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
        avatarUrl={isAdmin && viewAs ? undefined : (session.profile?.avatar_url ?? undefined)}
        data={data}
        adminView={isAdmin && Boolean(viewAs)}
        onRewardClaimed={() => {
          void refetch()
        }}
      />
    </>
  )
}

export default function AmbassadorDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AmbassadorDashboardContent />
    </Suspense>
  )
}
