'use client'

import { useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import MultiStepEventRegistration from '@/components/registration'
import { useSession } from '@/app/api/session/sessionQueries'
import { useEventRegisterData } from '@/app/api/events/[id]/register-data/registerDataQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccountRegistrations } from '@/app/api/account/registrations/accountRegistrationsQueries'

export default function EventRegisterPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const ticketQueryParam = searchParams?.get('ticket') ?? null
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: accountRegistrations, isLoading: accountRegistrationsLoading } = useAccountRegistrations({
    enabled: !sessionLoading && Boolean(session?.user),
  })
  const registerViewTrackedRef = useRef(false)
  const hasRenderedFormRef = useRef(false)

  const { data, isLoading, error, refetch } = useEventRegisterData(params.id, ticketQueryParam, {
    enabled: !sessionLoading,
  })

  useEffect(() => {
    if (!data?.event || registerViewTrackedRef.current) return
    registerViewTrackedRef.current = true

    const analyticsWindow = window as Window & {
      dataLayer?: Array<Record<string, unknown>>
      gtag?: (...args: unknown[]) => void
      fbq?: (...args: unknown[]) => void
    }

    const payload = {
      event_slug: data.event.slug,
      event_id: data.event.id,
      page_path: `/events/${params.id}/register`,
    }

    analyticsWindow.dataLayer?.push({
      event: 'view_register',
      ...payload,
    })
    analyticsWindow.gtag?.('event', 'view_register', {
      event_category: 'event_register',
      event_label: data.event.slug,
      ...payload,
    })
    analyticsWindow.fbq?.('track', 'ViewContent', {
      content_name: data.event.title || data.event.slug,
      content_category: 'event_register',
      content_type: 'product',
      content_ids: [data.event.id],
    })
    analyticsWindow.fbq?.('trackCustom', 'view_register', {
      event_slug: data.event.slug,
      event_id: data.event.id,
      page_path: `/events/${params.id}/register`,
    })
  }, [data?.event, params.id])

  // Once the registration form has rendered, never fall back to a full-page
  // loading screen again for this mount — background refetches (session,
  // account registrations after an inline login) would otherwise unmount the
  // form and wipe all in-progress local state (tickets, participants, step).
  if (!hasRenderedFormRef.current) {
    if (sessionLoading || (Boolean(session?.user) && accountRegistrationsLoading)) {
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

  hasRenderedFormRef.current = true

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto w-full px-4 pb-12 pt-8">
        <MultiStepEventRegistration
          event={data.event}
          tickets={data.tickets.map(ticket => ({
            ...ticket,
            race: ticket.race === null ? undefined : ticket.race,
          }))}
          upsells={data.upsells}
          user={
            data.user
              ? {
                  id: data.user.id,
                  email: data.user.email,
                  fullName: data.user.fullName,
                  date_of_birth: accountRegistrations?.profile?.date_of_birth || null,
                }
              : null
          }
          availableSpots={data.availableSpots}
          initialTicketId={ticketQueryParam}
          eventPriceTiers={data.event.price_tiers || []}
        />
      </div>
    </div>
  )
}
