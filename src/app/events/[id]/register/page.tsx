'use client'

import { useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import MultiStepEventRegistration from '@/components/MultiStepEventRegistration'
import { useSession } from '@/app/api/session/sessionQueries'
import { useEventRegisterData } from '@/app/api/events/[id]/register-data/registerDataQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function EventRegisterPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const ticketQueryParam = searchParams?.get('ticket') ?? null
  const { data: session, isLoading: sessionLoading } = useSession()

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      const nextUrl = `/events/${params.id}/register${ticketQueryParam ? `?ticket=${ticketQueryParam}` : ''}`
      router.replace(`/auth/login?next=${encodeURIComponent(nextUrl)}`)
    }
  }, [session?.user, sessionLoading, router, params.id, ticketQueryParam])

  const { data, isLoading, error, refetch } = useEventRegisterData(params.id, ticketQueryParam, {
    enabled: Boolean(session?.user),
  })

  if (sessionLoading || (session && !session.user)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement des informations d'inscription…</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-lg px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Impossible de charger l'événement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error.message}</p>
              <Button onClick={() => refetch()}>Réessayer</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto w-full px-4 pb-12 pt-8">
        <MultiStepEventRegistration
          event={data.event}
          tickets={data.tickets}
          upsells={data.upsells}
          user={data.user}
          availableSpots={data.availableSpots}
          initialTicketId={ticketQueryParam}
        />
      </div>
    </div>
  )
}
