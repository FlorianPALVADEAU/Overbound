'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAccountRegistrations } from '@/app/api/account/registrations/accountRegistrationsQueries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountRegistrationsList } from '@/components/account/AccountRegistrationsList'
import { Skeleton } from '@/components/ui/skeleton'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'

export default function AccountTicketsPage() {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useAccountRegistrations()

  useEffect(() => {
    if (!isLoading && data?.user === null) {
      router.replace('/auth/login?next=/account/tickets')
    }
  }, [data?.user, isLoading, router])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-5xl space-y-6 px-6 py-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-48 rounded-md" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`ticket-skeleton-${index}`} className="flex flex-col gap-3 rounded-lg border border-dashed border-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6">
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="font-semibold text-destructive">Impossible de récupérer vos billets</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()}>Réessayer</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!data?.user) {
    return null
  }

  const sortedRegistrations = [...data.registrations].sort((a, b) => {
    const aDate = a.event_date ? new Date(a.event_date).getTime() : 0
    const bDate = b.event_date ? new Date(b.event_date).getTime() : 0
    return bDate - aDate
  })
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Mes billets</h1>
            <p className="text-muted-foreground">
              Retrouvez les billets associés à vos inscriptions. Ouvrez un billet pour afficher son QR code en plein écran.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/account">
              <Button variant="outline">Retour au compte</Button>
            </Link>
            <Link href="/events/ultra-arena-2026">
              <Button>Explorer de nouveaux événements</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Billets disponibles</CardTitle>
            <p className="text-sm text-muted-foreground">
              Règlement officiel 2026 :{' '}
              <Link href={OFFICIAL_RULEBOOK_PDF_PATH} target="_blank" className="underline">
                consulter le PDF
              </Link>
              .
            </p>
          </CardHeader>
          <CardContent>
            {sortedRegistrations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Aucun billet disponible pour le moment. Consultez vos inscriptions passées dans votre espace compte ou inscrivez-vous à un nouvel événement.
              </div>
            ) : (
              <AccountRegistrationsList registrations={sortedRegistrations} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
