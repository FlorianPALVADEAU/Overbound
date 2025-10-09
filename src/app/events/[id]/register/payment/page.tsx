'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect } from 'react'
import PaymentClient from './PaymentClient'
import { useSession } from '@/app/api/session/sessionQueries'
import { useEventPaymentData } from '@/app/api/events/[id]/payment-data/paymentDataQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function EventPaymentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data, isLoading, error, refetch } = useEventPaymentData(params.id, {
    enabled: Boolean(session?.user),
  })

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/events/${params.id}/register/payment`)}`)
    }
  }, [session?.user, sessionLoading, router, params.id])

  if (sessionLoading || (session && !session.user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement des informations de paiement…</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-lg px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Impossible de charger le paiement</CardTitle>
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
      <div className="container mx-auto max-w-5xl px-4 pb-12 pt-8 space-y-6">
        <h1 className="text-2xl font-semibold">Finaliser mon inscription</h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez vos informations et procédez au paiement sécurisé.
        </p>
        <PaymentClient
          event={data.event}
          tickets={data.tickets}
          upsells={data.upsells}
          userEmail={data.userEmail}
        />
      </div>
    </div>
  )
}
