'use client'

import AdminDashboard from '@/components/admin/AdminDashboard'
import { useAdminOverview } from '@/app/api/admin/overview/overviewQueries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  const { data, isLoading, error, refetch } = useAdminOverview()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-sm text-muted-foreground">Chargement du tableau de bord…</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
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

  if (!data || data.profile.role !== 'admin') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/20">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Accès administrateur requis.</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <AdminDashboard
      user={data.user as any}
      profile={{ role: 'admin', full_name: data.profile.full_name ?? undefined }}
      stats={data.stats}
    />
  )
}
