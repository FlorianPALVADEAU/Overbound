'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin } from 'lucide-react'
import EventTicketListWithRegistration from '@/components/events/EventTicketListWithRegistration'
import { PricingTimeline } from '@/components/events/PricingTimeline'
import { UltraArenaHero } from '@/components/events/ultra-arena/UltraArenaHero'
import { UltraArenaWhyDifferent } from '@/components/events/ultra-arena/UltraArenaWhyDifferent'
import { UltraArenaProjection } from '@/components/events/ultra-arena/UltraArenaProjection'
import { UltraArenaTestimonials } from '@/components/events/ultra-arena/UltraArenaTestimonials'
import { UltraArenaComeTogether } from '@/components/events/ultra-arena/UltraArenaComeTogether'
import { UltraArenaFormats } from '@/components/events/ultra-arena/UltraArenaFormats'
import { UltraArenaReassurance } from '@/components/events/ultra-arena/UltraArenaReassurance'
import { UltraArenaPricing } from '@/components/events/ultra-arena/UltraArenaPricing'
import { UltraArenaFAQ } from '@/components/events/ultra-arena/UltraArenaFAQ'
import { UltraArenaValidationStrip } from '@/components/events/ultra-arena/UltraArenaValidationStrip'
import ObstaclesOverview from '@/components/homepage/ObstaclesOverview'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { useSession } from '@/app/api/session/sessionQueries'
import { getCurrentTicketPrice } from '@/lib/pricing'
import { getCurrentPriceTier } from '@/types/EventPriceTier'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'
import { OPEN_SAS_CONFIG, RANKED_START_CONFIG } from '@/lib/openSas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getStatusColor = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
  switch (status) {
    case 'on_sale':
      return 'default'
    case 'sold_out':
      return 'destructive'
    case 'closed':
    case 'announced':
      return 'secondary'
    case 'draft':
      return 'outline'
    default:
      return 'outline'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'Inscriptions ouvertes'
    case 'sold_out':
      return 'Complet'
    case 'closed':
      return 'Inscriptions fermées'
    case 'draft':
      return 'Bientôt disponible'
    case 'announced':
      return 'Inscriptions à venir'
    default:
      return status
  }
}

const formatConfigTime = (time: { hour: number; minute: number }) =>
  `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`

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

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const { data, isLoading, error, refetch } = useEventDetail(params.id)
  const isUltraArena = params.id === 'ultra-arena-2026'

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
  const [showDesktopCta, setShowDesktopCta] = useState(false)

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

  const trackedEvent = data?.event
  const trackedLowestPrice = useMemo(() => {
    if (!trackedEvent) return null
    const trackedTickets =
      (trackedEvent.tickets as any[] | undefined)?.map((t) => ({
        ...t,
        race: t.race ?? undefined,
      })) ?? []
    const trackedTiers = (trackedEvent as any).price_tiers || []
    const prices = trackedTickets
      .map((t) => getCurrentTicketPrice(t, trackedTiers))
      .filter((p): p is number => typeof p === 'number')
    return prices.length > 0 ? Math.min(...prices) : null
  }, [trackedEvent])

  const trackEvent = useCallback(
    (eventName: string, payload: AnalyticsPayload = {}) => {
      if (typeof window === 'undefined' || !trackedEvent) return

      const analyticsWindow = window as Window & {
        dataLayer?: Array<Record<string, unknown>>
        gtag?: (...args: unknown[]) => void
        fbq?: (...args: unknown[]) => void
      }

      const basePayload: Record<string, unknown> = {
        event: eventName,
        event_slug: trackedEvent.slug,
        event_id: trackedEvent.id,
        event_status: trackedEvent.status,
        ...payload,
      }

      analyticsWindow.dataLayer?.push(basePayload)
      analyticsWindow.gtag?.('event', eventName, {
        event_category: 'event_landing',
        event_label: trackedEvent.slug,
        ...payload,
      })

      // Meta Pixel mirror for retargeting/optimization
      if (analyticsWindow.fbq) {
        if (eventName === 'view_content' || eventName === 'page_view_event_landing') {
          analyticsWindow.fbq('track', 'ViewContent', {
            content_name: trackedEvent.title ?? trackedEvent.slug,
            content_category: 'event',
            content_ids: [trackedEvent.id],
          })
        }
        if (eventName === 'add_to_cart') {
          analyticsWindow.fbq('track', 'AddToCart', {
            content_name: trackedEvent.title ?? trackedEvent.slug,
            content_category: 'event',
            content_ids: [trackedEvent.id],
          })
        }
        if (eventName === 'begin_checkout' || eventName === 'begin_checkout_event') {
          analyticsWindow.fbq('track', 'InitiateCheckout', {
            content_name: trackedEvent.title ?? trackedEvent.slug,
            content_category: 'event',
            content_ids: [trackedEvent.id],
          })
        }
      }
    },
    [trackedEvent],
  )

  // Page view
  useEffect(() => {
    if (!isUltraArena || !trackedEvent) return
    trackEvent('page_view_event_landing', {
      page_path: `/events/${params.id}`,
      has_price: trackedLowestPrice !== null,
    })
    trackEvent('view_content', {
      page_path: `/events/${params.id}`,
      content_type: 'event',
    })
  }, [isUltraArena, trackedEvent, trackedLowestPrice, params.id, trackEvent])

  // Scroll depth
  useEffect(() => {
    if (!isUltraArena) return

    let tracked25 = false
    let tracked50 = false
    let tracked90 = false

    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = (window.scrollY / max) * 100

      if (!tracked25 && pct >= 25) {
        tracked25 = true
        trackEvent('scroll_25_event_page', { depth_percent: 25 })
      }
      if (!tracked50 && pct >= 50) {
        tracked50 = true
        trackEvent('scroll_50_event_page', { depth_percent: 50 })
        trackEvent('scroll_50', { depth_percent: 50 })
      }
      if (!tracked90 && pct >= 90) {
        tracked90 = true
        trackEvent('scroll_90_event_page', { depth_percent: 90 })
        trackEvent('scroll_90', { depth_percent: 90 })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isUltraArena, trackEvent])

  // Desktop sticky CTA — show after scrolling past the hero (~400px)
  useEffect(() => {
    if (!isUltraArena) return
    const onScroll = () => setShowDesktopCta(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isUltraArena])

  // Pricing section visibility (decision zone)
  useEffect(() => {
    if (!isUltraArena) return
    const target = document.getElementById('tarifs-inscription')
    if (!target) return
    let fired = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (fired || !entry?.isIntersecting) return
        fired = true
        trackEvent('view_pricing', { section: 'pricing' })
        observer.disconnect()
      },
      { threshold: 0.25 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [isUltraArena, trackEvent])

  // -------------------------------------------------------------------------
  // Form handlers
  // -------------------------------------------------------------------------

  const handleNotifySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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

  const tickets =
    (event.tickets as any[] | undefined)?.map((t) => ({
      ...t,
      race: t.race ?? undefined,
    })) ?? []

  const eventPriceTiers = (event as any).price_tiers || []
  const activeTier = getCurrentPriceTier(eventPriceTiers)
  const hasDiscount = activeTier && activeTier.discount_percentage > 0

  const ticketPrices = tickets
    .map((t) => getCurrentTicketPrice(t, eventPriceTiers))
    .filter((p): p is number => typeof p === 'number')

  const priceCurrency = tickets.find((t) => t.currency)?.currency ?? 'EUR'
  const lowestPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : null

  const baseLowestPrice = (() => {
    const bases = tickets
      .map((t) => t.final_price_cents)
      .filter((p): p is number => typeof p === 'number')
    return bases.length > 0 ? Math.min(...bases) : null
  })()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: (priceCurrency || 'EUR').toUpperCase(),
      minimumFractionDigits: 2,
    }).format(value / 100)

  const formattedDate = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const formattedSalesStart = event.sales_start
    ? new Date(event.sales_start).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : null

  const isOnSale = event.status === 'on_sale' && availableSpots > 0
  const registeredCount =
    typeof event.capacity === 'number' && Number.isFinite(event.capacity)
      ? Math.max(event.capacity - availableSpots, 0)
      : null

  const galleryImages: string[] =
    Array.isArray((event as any).gallery) && (event as any).gallery.length > 0
      ? (event as any).gallery
      : event.image_url
        ? [event.image_url]
        : []

  const locationMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`

  const findTicketByFormat = (format: 'open' | 'ranked') =>
    tickets.find((t) => {
      const raceType = String(t.race?.type ?? '').toLowerCase()
      const raceName = String(t.race?.name ?? t.name ?? '').toLowerCase()
      return raceType.includes(format) || raceName.includes(format)
    })

  const openTicket = findTicketByFormat('open')
  const rankedTicket = findTicketByFormat('ranked')
  const openFirstDepartureLabel = formatConfigTime(OPEN_SAS_CONFIG.firstDeparture)
  const openLastDepartureLabel = formatConfigTime(OPEN_SAS_CONFIG.lastDeparture)
  const rankedStartLabel = formatConfigTime(RANKED_START_CONFIG)
  const departureSummary = openTicket && rankedTicket
    ? `RANKED ${rankedStartLabel} · OPEN ${openFirstDepartureLabel}-${openLastDepartureLabel}`
    : openTicket
      ? `OPEN ${openFirstDepartureLabel}-${openLastDepartureLabel}`
      : rankedTicket
        ? `RANKED ${rankedStartLabel}`
        : `Départ à ${formattedTime}`

  const registerHref = (ticketId?: string) =>
    ticketId
      ? `/events/${params.id}/register?ticket=${ticketId}`
      : `/events/${params.id}/register`

  // =========================================================================
  // Ultra Arena 2026 — optimised conversion landing page
  // =========================================================================

  if (isUltraArena) {
    return (
      <main className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
        {/* 1. HERO — promise first, price nowhere in sight */}
        <UltraArenaHero
          formattedDate={formattedDate}
          location={event.location}
          statusLabel={getStatusLabel(event.status)}
          statusVariant={getStatusColor(event.status)}
          isOnSale={isOnSale}
          isAnnounced={isAnnounced}
          formattedSalesStart={formattedSalesStart}
          registerHref={registerHref()}
          onDiscoverClick={() => {
            trackEvent('click_cta_hero_discover', { cta_location: 'hero' })
            trackEvent('click_cta_hero', { cta_location: 'hero', cta_variant: 'discover' })
            trackEvent('click_cta_secondary', { cta_location: 'hero' })
          }}
          onRegisterClick={() => {
            trackEvent('click_cta_hero_register', { cta_location: 'hero' })
            trackEvent('click_cta_hero', { cta_location: 'hero', cta_variant: 'register' })
            trackEvent('click_cta_primary', { cta_location: 'hero' })
          }}
        />

        {/* 3. WHY DIFFERENT — concept clarity */}
        <UltraArenaWhyDifferent
          isOnSale={isOnSale}
          registerHref={registerHref()}
          onCtaClick={() => {
            trackEvent('click_cta_midpage', { cta_location: 'why_different' })
            trackEvent('click_cta_secondary', { cta_location: 'why_different' })
          }}
        />

        {/* 4. PROJECTION — emotional buy-in */}
        <UltraArenaProjection
          galleryImages={galleryImages}
          isOnSale={isOnSale}
          registerHref={registerHref()}
          onCtaClick={() => {
            trackEvent('click_cta_midpage', { cta_location: 'projection' })
            trackEvent('click_cta_secondary', { cta_location: 'projection' })
          }}
        />

        {/* 5. TESTIMONIALS — social proof before price reveal */}
        <UltraArenaTestimonials
          onVideoPlay={(id) =>
            trackEvent('click_testimonial_video', { testimonial_id: id })
          }
          isOnSale={isOnSale}
          registerHref={registerHref()}
          onCtaClick={() => {
            trackEvent('click_cta_midpage', { cta_location: 'participants' })
            trackEvent('click_cta_secondary', { cta_location: 'participants' })
          }}
        />

        {/* 6. COME TOGETHER — boost group conversion */}
        <UltraArenaComeTogether
          isOnSale={isOnSale}
          registerHref={registerHref()}
          onCtaClick={() => {
            trackEvent('click_cta_midpage', { cta_location: 'group_section' })
            trackEvent('click_cta_secondary', { cta_location: 'group_section' })
          }}
        />

        {/* 7. FORMATS — help visitors self-select */}
        <UltraArenaFormats
          isOnSale={isOnSale}
          openTicket={openTicket}
          rankedTicket={rankedTicket}
          registerHref={registerHref}
          onOpenClick={() => {
            trackEvent('click_format_open', { source: 'formats_section' })
            trackEvent('select_format_open', { source: 'formats_section' })
            trackEvent('click_cta_primary', { cta_location: 'formats_open' })
          }}
          onRankedClick={() => {
            trackEvent('click_format_ranked', { source: 'formats_section' })
            trackEvent('select_format_ranked', { source: 'formats_section' })
            trackEvent('click_cta_primary', { cta_location: 'formats_ranked' })
          }}
          onMidCtaClick={() => {
            trackEvent('click_cta_midpage', { cta_location: 'formats' })
            trackEvent('click_cta_secondary', { cta_location: 'formats' })
          }}
        />

        {/* 7.5 OBSTACLES — reuse homepage slider component */}
        <ObstaclesOverview
          eventId={params.id}
          embedded
          title="Les obstacles de l'Ultra Arena"
          description="Un aperçu concret des ateliers qui vont tester ton grip, ton cardio et ton mental."
        />

        {/* 7. REASSURANCE — practical info + location */}
        <UltraArenaReassurance
          location={event.location}
          locationMapUrl={locationMapUrl}
        />

        {/* 8. PRICING — price revealed after full context */}
        <UltraArenaPricing
          event={event}
          tickets={tickets}
          eventPriceTiers={eventPriceTiers}
          availableSpots={availableSpots}
          user={user ? { id: user.id, email: user.email ?? '' } : null}
          existingRegistration={existingRegistration ?? null}
          isOnSale={isOnSale}
          isAnnounced={isAnnounced}
          lowestPrice={lowestPrice}
          baseLowestPrice={baseLowestPrice}
          hasDiscount={!!hasDiscount}
          priceCurrency={priceCurrency}
          formatCurrency={formatCurrency}
          formattedSalesStart={formattedSalesStart}
          countdown={countdown}
          notifyEmail={notifyEmail}
          notifyStatus={notifyStatus}
          notifyMessage={notifyMessage}
          onNotifyEmailChange={setNotifyEmail}
          onNotifySubmit={handleNotifySubmit}
          onRegisterClick={({ ticketId, ticketName, raceType }) => {
            trackEvent('click_price_section_register', {
              cta_location: 'ticket_card',
              ticket_id: ticketId,
              ticket_name: ticketName,
              race_type: raceType ?? null,
            })
            trackEvent('click_cta_primary', { cta_location: 'ticket_card' })
          }}
          onPriceSectionRegisterClick={() => {
            trackEvent('click_price_section_register', { cta_location: 'price_section' })
            trackEvent('click_cta_price', { cta_location: 'price_section' })
            trackEvent('click_cta_primary', { cta_location: 'price_section' })
          }}
        />

        {/* 9. FAQ — lift final objections */}
        <UltraArenaFAQ
          openedFaqs={openedFaqs}
          onFaqChange={handleFaqChange}
          isOnSale={isOnSale}
          registerHref={registerHref()}
        />

        {/* Sticky mobile CTA — appears only when inscriptions are open */}
        {isOnSale ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:hidden">
            <Button
              asChild
              className="h-12 w-full rounded-xl text-base font-semibold"
              onClick={() => {
                trackEvent('click_sticky_register', { cta_location: 'sticky_mobile' })
                trackEvent('click_sticky_cta', { cta_location: 'sticky_mobile' })
                trackEvent('click_cta_primary', { cta_location: 'sticky_mobile' })
              }}
            >
              <Link href={registerHref()}>Je prends ma place</Link>
            </Button>
          </div>
        ) : null}

        {/* Sticky desktop CTA — bottom-right popup, appears after scrolling past hero */}
        {isOnSale ? (
          <div
            className={[
              'fixed bottom-6 right-6 z-40 hidden md:flex',
              'flex-col items-end gap-2',
              'transition-all duration-300',
              showDesktopCta
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <div className="rounded-2xl border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur">
              <Button
                asChild
                size="lg"
                className="rounded-xl px-6 text-base font-semibold shadow-lg"
                onClick={() => {
                  trackEvent('click_sticky_register', { cta_location: 'sticky_desktop' })
                  trackEvent('click_cta_primary', { cta_location: 'sticky_desktop' })
                }}
              >
                <Link href={registerHref()}>Je prends ma place →</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    )
  }

  // =========================================================================
  // Generic event page (all non-Ultra-Arena events)
  // =========================================================================

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden py-24 sm:py-28">
        <div className="absolute inset-0">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover opacity-30"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-background via-muted/40 to-background" />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/75 to-background" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/events">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6 rounded-full border border-border/60 bg-background/70"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux événements
            </Button>
          </Link>

          <Badge variant={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">{event.title}</h1>
          <p className="mt-4 text-muted-foreground">
            {event.description || 'Découvre toutes les infos de cet événement Overbound.'}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{formattedDate}</p>
                    <p className="text-sm text-muted-foreground">{departureSummary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{event.location}</p>
                    <p className="text-sm text-muted-foreground">
                      {availableSpots > 0 ? 'Places disponibles' : 'Complet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Règlement officiel 2026 :{' '}
            <Link href={OFFICIAL_RULEBOOK_PDF_PATH} target="_blank" className="underline">
              consulter le PDF
            </Link>
            .
          </p>
        </div>
      </section>

      <section
        id="tarifs-inscription"
        className="container mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        {existingRegistration && user ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Tu as déjà une inscription active avec le billet "
              {existingRegistration.tickets?.[0]?.name || '—'}". Tu peux compléter une nouvelle
              inscription pour un autre format ou participant.
            </p>
          </div>
        ) : null}

        {eventPriceTiers.length > 0 && tickets.length > 0 ? (
          <div className="mb-8 rounded-2xl border border-primary/20 bg-card/80 p-6">
            <PricingTimeline
              ticket={tickets.reduce((min, t) =>
                (t.final_price_cents ?? Infinity) < (min.final_price_cents ?? Infinity) ? t : min,
                tickets[0]
              )}
              eventPriceTiers={eventPriceTiers}
              currency={priceCurrency as 'eur' | 'usd' | 'gbp'}
              eventDate={event.date}
            />
          </div>
        ) : null}

        <EventTicketListWithRegistration
          event={event}
          tickets={tickets}
          availableSpots={availableSpots}
          user={user ? { id: user.id, email: user.email ?? '' } : null}
          eventPriceTiers={eventPriceTiers}
        />
      </section>
    </main>
  )
}
