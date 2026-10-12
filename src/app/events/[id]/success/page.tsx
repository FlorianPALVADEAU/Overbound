'use client'
import { useEffect, useRef } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/app/api/session/sessionQueries'
import { useEventSuccess } from '@/app/api/events/[id]/success/successQueries'
import { EventSuccessView } from '@/components/events/success/EventSuccessView'
import { getFirstName } from '@/lib/share/purchaseShare'

export default function EventSuccessPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams?.get('session_id') ?? ''
  const paymentIntentId = searchParams?.get('payment_intent') ?? ''
  const registrationId = searchParams?.get('registration_id') ?? ''
  const hasReference = Boolean(sessionId || paymentIntentId || registrationId)
  const { data: session } = useSession()
  const purchaseTrackedRef = useRef(false)
  const { data, isLoading, error, refetch } = useEventSuccess(params.id, {
    sessionId,
    paymentIntentId,
    registrationId,
  }, {
    // The API authenticates the caller itself: do not wait for the session query first.
    enabled: hasReference,
  })

  useEffect(() => {
    const registration = data?.registration
    if (!registration || purchaseTrackedRef.current) return
    purchaseTrackedRef.current = true

    const analyticsWindow = window as Window & {
      dataLayer?: Array<Record<string, unknown>>
      gtag?: (...args: unknown[]) => void
      fbq?: (...args: unknown[]) => void
    }

    const value = Number((registration.order.amount_total / 100).toFixed(2))
    const currency = registration.order.currency.toUpperCase()
    const transactionId = registration.order.id
    const eventId = `purchase_${transactionId}`

    analyticsWindow.dataLayer?.push({
      event: 'purchase',
      transaction_id: transactionId,
      value,
      currency,
      event_slug: registration.event.slug,
      event_id: registration.event.id,
    })

    analyticsWindow.gtag?.('event', 'purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items: (data?.registrations ?? []).map((item) => ({
        item_id: item.ticket?.id ?? registration.ticket.id,
        item_name: item.ticket?.name ?? registration.ticket.name,
        item_category: 'event_ticket',
        quantity: 1,
      })),
    })

    analyticsWindow.fbq?.(
      'track',
      'Purchase',
      {
        value,
        currency,
        content_name: registration.event.title,
        content_ids: Array.from(new Set((data?.registrations ?? []).map((item) => item.ticket?.id ?? registration.ticket.id))),
        num_items: Math.max(data?.registrations.length ?? 1, 1),
        content_type: 'product',
      },
      { eventID: eventId },
    )
  }, [data?.registration])

  useEffect(() => {
    if (!hasReference) {
      router.replace(`/events/${params.id}`)
    }
  }, [hasReference, params.id, router])

  if (!hasReference) {
    return null
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Validation du paiement…</div>
      </main>
    )
  }

  if (error || !data?.registration) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-lg px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Impossible de confirmer l'inscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error?.message || 'Nous ne retrouvons pas cette session.'}</p>
              <Button onClick={() => refetch()}>Réessayer</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <EventSuccessView
      registration={data.registration}
      registrations={data.registrations}
      eventSlug={params.id}
      hasFirstName={Boolean(getFirstName(session?.profile?.full_name))}
    />
  )
}
