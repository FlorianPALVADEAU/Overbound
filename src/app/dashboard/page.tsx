'use client'

import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { useSession } from '@/app/api/session/sessionQueries'
import { useAdminOverview } from '@/app/api/admin/overview/overviewQueries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data, isLoading, error, refetch } = useAdminOverview()

  if (sessionLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </main>
    )
  }

  if (!session?.user) {
    redirect('/auth/login?next=/dashboard')
  }

  if (error) {
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

  if (!data || !['admin', 'volunteer'].includes(data.profile.role || '')) {
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

  return (
    <AdminDashboard
      user={data.user as any}
      profile={{ role: data.profile.role as any, full_name: data.profile.full_name ?? undefined }}
      stats={data.stats}
    />
  )
}
