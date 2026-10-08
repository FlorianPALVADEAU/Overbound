'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UltraArenaEventOver } from '@/components/events/landing/UltraArenaEventOver'
import { EventHero } from '@/components/events/landing/EventHero'
import { EventTicketDepartures } from '@/components/events/landing/EventTicketDepartures'
import { EventAnnouncedPanel } from '@/components/events/landing/EventAnnouncedPanel'
import { EventFinalCta } from '@/components/events/landing/EventFinalCta'
import VolunteersAppeal from '@/components/homepage/VolunteersAppeal'
import { LANDING_BACKGROUNDS } from '@/components/events/landing/backgrounds'
import { LandingBand } from '@/components/events/landing/LandingBand'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'
import { EventPerks } from '@/components/events/landing/EventPerks'
import { EventGallery } from '@/components/events/landing/EventGallery'
import { EventStickyCta } from '@/components/events/landing/EventStickyCta'
import { UltraArenaValidationStrip } from '@/components/events/landing/UltraArenaValidationStrip'
import { UltraArenaWhyDifferent } from '@/components/events/landing/UltraArenaWhyDifferent'
import { UltraArenaProjection } from '@/components/events/landing/UltraArenaProjection'
import { UltraArenaTestimonials } from '@/components/events/landing/UltraArenaTestimonials'
import { UltraArenaComeTogether } from '@/components/events/landing/UltraArenaComeTogether'
import { FormatsComparison } from '@/components/events/landing/FormatsComparison'
import { UltraArenaReassurance } from '@/components/events/landing/UltraArenaReassurance'
import { UltraArenaFAQ } from '@/components/events/landing/UltraArenaFAQ'
import ObstaclesOverview from '@/components/homepage/ObstaclesOverview'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { useSession } from '@/app/api/session/sessionQueries'
import { buildEventLandingView, type LandingTicket } from '@/lib/events/eventLandingView'
import { getEventStatusVariant, getEventStatusLabel } from '@/lib/shared/presentation/eventStatus'
import { useOpenWavesOverview } from '@/hooks/events/useOpenWavesOverview'
import { formatConfigTime } from '@/lib/events/eventLandingView'
import { RANKED_START_CONFIG } from '@/lib/openSas'
import { useEventAnalytics } from '@/hooks/events/useEventAnalytics'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getCountdownParts = (target: Date, now: Date) => {
  const diff = Math.max(target.getTime() - now.getTime(), 0)
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const { data, isLoading, error, refetch } = useEventDetail(params.id)
  const { data: waveOverview, isError: waveOverviewFailed } = useOpenWavesOverview(params.id)

  const salesStart = data?.event?.sales_start ?? null
  const eventStatus = data?.event?.status ?? null
  const isAnnounced = eventStatus === 'announced'

  const salesStartDate = useMemo(
    () => (salesStart ? new Date(salesStart) : null),
    [salesStart],
  )

  const [now, setNow] = useState(() => new Date())
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null)
  const [openedFaqs, setOpenedFaqs] = useState<string[]>([])

  useEffect(() => {
    if (!salesStartDate || !isAnnounced) return
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [salesStartDate, isAnnounced])

  useEffect(() => {
    if (session?.user?.email && !notifyEmail) {
      setNotifyEmail(session.user.email)
    }
  }, [session?.user?.email, notifyEmail])

  const countdown = useMemo(() => {
    if (!salesStartDate || !isAnnounced) return null
    return getCountdownParts(salesStartDate, now)
  }, [salesStartDate, now, isAnnounced])

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  const { trackEvent, showDesktopCta } = useEventAnalytics(
    data?.event,
    `/events/${params.id}`,
  )

  // -------------------------------------------------------------------------
  // Form handlers
  // -------------------------------------------------------------------------

  const handleNotifySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trackedEvent = data?.event
    if (!trackedEvent) return

    if (!notifyEmail) {
      setNotifyStatus('error')
      setNotifyMessage('Merci de renseigner ton email.')
      return
    }

    setNotifyStatus('loading')
    setNotifyMessage(null)

    try {
      const res = await fetch(`/api/events/${trackedEvent.slug ?? trackedEvent.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          full_name: session?.profile?.full_name ?? null,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Erreur lors de la demande')
      }

      setNotifyStatus('success')
      setNotifyMessage("Parfait, on te prévient dès l'ouverture.")
    } catch (err) {
      setNotifyStatus('error')
      setNotifyMessage(err instanceof Error ? err.message : 'Erreur lors de la demande')
    }
  }

  const handleFaqChange = (values: string[]) => {
    const newlyOpened = values.filter((v) => !openedFaqs.includes(v))
    newlyOpened.forEach((faqId) => {
      trackEvent(`faq_open_${faqId}`, { faq_id: faqId })
    })
    setOpenedFaqs(values)
  }

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement de l'événement…</div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-linear-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-lg px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Événement introuvable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error?.message || "Cet événement n'existe pas ou n'est plus disponible."}</p>
              <Button onClick={() => refetch()}>Réessayer</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const { event, availableSpots, existingRegistration } = data
  const user = session?.user

  const tickets = (event.tickets ?? []).map((t) => ({ ...t, race: t.race ?? undefined }))
  const eventPriceTiers = event.price_tiers ?? []

  const view = buildEventLandingView({
    tickets: tickets as unknown as LandingTicket[],
    priceTiers: eventPriceTiers,
    eventSlug: params.id,
  })
  const { lowestPriceCents, currency, hasBothFormats, galleryImages } = view
  const registerHref = view.registerHref
  const registerSlotHref = (ticketId: string, waveIndex?: number) =>
    waveIndex ? `${registerHref(ticketId)}&wave=${waveIndex}` : registerHref(ticketId)
  // Every register button is one click from the registration (the ticket is
  // preselected when there is only one; otherwise the form picks the first and
  // lets the visitor change it). Choosing a slot first is optional.
  const ctaHref = registerHref(view.soleTicketId ?? undefined)
  const ctaLabel = "Je m'inscris"
  const wavesByTicket = waveOverview
    ? Object.fromEntries(waveOverview.map((t) => [t.ticket_id, t.waves]))
    : waveOverviewFailed
      ? {}
      : undefined

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: (currency || 'EUR').toUpperCase(),
      minimumFractionDigits: 2,
    }).format(value / 100)

  const formattedDate = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedSalesStart = event.sales_start
    ? new Date(event.sales_start).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : null

  const isOnSale = event.status === 'on_sale' && availableSpots > 0
  const registeredCount =
    typeof event.capacity === 'number' && Number.isFinite(event.capacity)
      ? Math.max(event.capacity - availableSpots, 0)
      : null
  const startingPriceLabel = lowestPriceCents !== null ? `Dès ${formatCurrency(lowestPriceCents)}` : null
  const locationMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`

  // Event is over — inscriptions closed, show "see you next time" screen
  if (['completed', 'closed', 'cancelled'].includes(event.status)) {
    return (
      <UltraArenaEventOver
        eventTitle={event.title}
        formattedDate={formattedDate}
        location={event.location}
        photosUrl={event.photos_url ?? null}
        notifyEmail={notifyEmail}
        notifyStatus={notifyStatus}
        notifyMessage={notifyMessage}
        onNotifyEmailChange={setNotifyEmail}
        onNotifySubmit={handleNotifySubmit}
      />
    )
  }

  // =========================================================================
  // Template: hero → tickets → story sections → formats → obstacles → infos → FAQ.
  // Optional sections appear only if the event has what they need: the story
  // sections and FAQ are written around OPEN vs RANKED, so they need both formats.
  // =========================================================================

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <EventHero
        title={event.title}
        description={event.description}
        eventDate={event.date}
        location={event.location}
        startingPriceLabel={startingPriceLabel}
        availableSpots={availableSpots}
        statusLabel={getEventStatusLabel(event.status)}
        statusVariant={getEventStatusVariant(event.status)}
        isOnSale={isOnSale}
        formattedSalesStart={formattedSalesStart}
        registerHref={ctaHref}
        ctaLabel={ctaLabel}
        imageUrl={event.image_url}
        onRegisterClick={() => {
          trackEvent('click_cta_hero_register', { cta_location: 'hero' })
          trackEvent('click_cta_primary', { cta_location: 'hero' })
        }}
      />

      {/* Decision section right under the hero: price and departure per format */}
      <LandingBand id="departs" variant="light" angled className="z-10">
        <EventTicketDepartures
          tickets={tickets as never}
          eventPriceTiers={eventPriceTiers}
          eventDate={event.date}
          currency={currency}
          isOnSale={isOnSale}
          wavesByTicket={wavesByTicket}
          rankedLabel={formatConfigTime(RANKED_START_CONFIG)}
          registerHref={registerSlotHref}
          groupHref={(intent) => `${ctaHref}${ctaHref.includes('?') ? '&' : '?'}group=${intent}`}
          onRegister={({ ticketId, ticketName, waveIndex }) => {
            trackEvent('click_price_section_register', {
              cta_location: 'ticket_departure',
              ticket_id: ticketId,
              ticket_name: ticketName,
              wave_index: waveIndex,
            })
            trackEvent('click_cta_primary', { cta_location: 'ticket_departure' })
          }}
          notice={
            <>
              {isAnnounced ? (
                <EventAnnouncedPanel
                  formattedSalesStart={formattedSalesStart}
                  countdown={countdown}
                  notifyEmail={notifyEmail}
                  notifyStatus={notifyStatus}
                  notifyMessage={notifyMessage}
                  onNotifyEmailChange={setNotifyEmail}
                  onNotifySubmit={handleNotifySubmit}
                />
              ) : null}
              {user && existingRegistration ? (
                <Alert className="border-primary/30 bg-primary/5 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Tu as déjà une inscription active avec le billet "
                    {existingRegistration.tickets?.[0]?.name ?? '—'}". Tu peux compléter une nouvelle
                    inscription pour un autre format ou participant.
                  </AlertDescription>
                </Alert>
              ) : null}
            </>
          }
        />
        {hasBothFormats ? (
          <UltraArenaValidationStrip
            isOnSale={isOnSale}
            registeredCount={registeredCount}
            availableSpots={availableSpots}
          />
        ) : null}
      </LandingBand>

      <LandingBand
        id="perks"
        backgroundSrc={LANDING_BACKGROUNDS.perks}
        className="-mt-6 pt-6 sm:-mt-10 sm:pt-10"
      >
        <EventPerks />
      </LandingBand>

      {hasBothFormats ? (
        <>
          <UltraArenaWhyDifferent
            isOnSale={isOnSale}
            registerHref={ctaHref}
            onCtaClick={() => trackEvent('click_cta_midpage', { cta_location: 'why_different' })}
          />
          <UltraArenaProjection
            galleryImages={galleryImages}
            isOnSale={isOnSale}
            registerHref={ctaHref}
            onCtaClick={() => trackEvent('click_cta_midpage', { cta_location: 'projection' })}
          />
          <UltraArenaTestimonials
            onVideoPlay={(id) => trackEvent('click_testimonial_video', { testimonial_id: id })}
            isOnSale={isOnSale}
            registerHref={ctaHref}
            onCtaClick={() => trackEvent('click_cta_midpage', { cta_location: 'participants' })}
          />
          <UltraArenaComeTogether
            isOnSale={isOnSale}
            registerHref={ctaHref}
            onCtaClick={() => trackEvent('click_cta_midpage', { cta_location: 'group_section' })}
          />
        </>
      ) : (
        <EventGallery images={galleryImages} title={event.title} />
      )}

      {hasBothFormats ? (
        <FormatsComparison
          isOnSale={isOnSale}
          openTicket={view.openTicket}
          rankedTicket={view.rankedTicket}
          registerHref={registerHref}
          onOpenClick={() => trackEvent('select_format_open', { source: 'formats_section' })}
          onRankedClick={() => trackEvent('select_format_ranked', { source: 'formats_section' })}
        />
      ) : null}

      <ObstaclesOverview
        constrained
        eventId={params.id}
        title="Les obstacles"
        description="Un aperçu concret des ateliers qui vont tester ton grip, ton cardio et ton mental."
      />

      <LandingBand backgroundSrc={LANDING_BACKGROUNDS.reassurance}>
        <UltraArenaReassurance location={event.location} locationMapUrl={locationMapUrl} />
      </LandingBand>

      {hasBothFormats ? (
        <UltraArenaFAQ
          openedFaqs={openedFaqs}
          onFaqChange={handleFaqChange}
          isOnSale={isOnSale}
          registerHref={ctaHref}
        />
      ) : null}

      {isOnSale ? (
        <LandingBand className="border-t border-primary/40 bg-black">
          <EventFinalCta
            formattedDate={formattedDate}
            href={ctaHref}
            label={ctaLabel}
            onClick={() => trackEvent('click_cta_primary', { cta_location: 'final_cta' })}
          />
        </LandingBand>
      ) : null}

      <VolunteersAppeal />

      {isOnSale ? (
        <EventStickyCta
          registerHref={ctaHref}
          label={ctaLabel}
          priceLabel={startingPriceLabel}
          visible={showDesktopCta}
          onClick={(location) => {
            trackEvent('click_sticky_register', { cta_location: location })
            trackEvent('click_cta_primary', { cta_location: location })
          }}
        />
      ) : null}
    </main>
  )
}
