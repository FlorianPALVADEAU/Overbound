'use client'

import Link from 'next/link'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { useSession } from '@/app/api/session/sessionQueries'
import { useClaimDetails } from '@/app/api/account/tickets/claim/claimQueries'
import { ClaimTicketButton } from '@/components/account/ClaimTicketButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ClaimTicketPageInner() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  const router = useRouter()
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data, isLoading, error, refetch } = useClaimDetails(token, Boolean(token))

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/account/tickets/claim?token=${token}`)}`)
    }
  }, [session?.user, sessionLoading, router, token])

  if (!token) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-2xl px-6 py-12">
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Lien de transfert invalide.
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (isLoading || sessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement du billet…</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-2xl px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Billet introuvable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error.message}</p>
              <div className="flex gap-2">
                <Link href="/account/tickets">
                  <Button variant="outline">Retour à mes billets</Button>
                </Link>
                <Button onClick={() => refetch()}>Réessayer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!data?.registration) {
    return null
  }

  const registration = data.registration
  const eventDate = registration.event?.date ? new Date(registration.event.date) : null
  const formattedEventDate = eventDate
    ? eventDate.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
    : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-2xl px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Récupérer un billet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold">{registration.event?.title ?? 'Événement'}</h2>
              <p className="text-sm text-muted-foreground">{registration.ticket?.name}</p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {formattedEventDate ? (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formattedEventDate}</span>
                  </div>
                ) : null}
                {registration.event?.location ? (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{registration.event.location}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                En récupérant ce billet, il sera associé à ton compte Overbound et apparaîtra dans ta
                liste de billets. Le titulaire actuel recevra une notification de transfert.
              </p>
              <ClaimTicketButton token={token} />
            </div>

            <div className="flex gap-2">
              <Link href="/account/tickets">
                <Button variant="outline">Retour à mes billets</Button>
              </Link>
              <Link href="/events">
                <Button variant="ghost">Parcourir les événements</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function ClaimTicketPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
          <div className="text-sm text-muted-foreground">Chargement du billet…</div>
        </main>
      }
    >
      <ClaimTicketPageInner />
    </Suspense>
  )
}
