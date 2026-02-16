'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  Tent,
  Route,
  PartyPopper,
  Ticket,
  Shield,
  IdCard,
  Eye,
  Backpack,
  Baby,
  Camera,
  ArrowLeftRight,
  Swords,
  Heart,
  Car,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import EventTicketListWithRegistration from '@/components/events/EventTicketListWithRegistration'
import { PricingTimeline } from '@/components/events/PricingTimeline'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { useSession } from '@/app/api/session/sessionQueries'
import { getCurrentTicketPrice } from '@/lib/pricing'
import { getCurrentPriceTier } from '@/types/EventPriceTier'
import FAQ from '@/components/homepage/FAQ'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'default'
    case 'sold_out':
      return 'destructive'
    case 'closed':
      return 'secondary'
    case 'draft':
      return 'outline'
    case 'announced':
      return 'secondary'
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

const getCountdownParts = (target: Date, now: Date) => {
  const diff = Math.max(target.getTime() - now.getTime(), 0)
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

const padCountdown = (value: number) => value.toString().padStart(2, '0')

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

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement de l'événement…</div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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

  const { event, availableSpots, existingRegistration } = data
  const user = session?.user
  const isUpcoming = new Date(event.date) > new Date()
  const isToday = new Date(event.date).toDateString() === new Date().toDateString()
  const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const tickets =
    (event.tickets as any[] | undefined)?.map((ticket) => ({
      ...ticket,
      race: ticket.race ?? undefined,
    })) ?? []
  const eventPriceTiers = (event as any).price_tiers || []
  const activeTier = getCurrentPriceTier(eventPriceTiers)
  const hasDiscount = activeTier && activeTier.discount_percentage > 0

  const ticketPrices = tickets
    .map((ticket) => getCurrentTicketPrice(ticket, eventPriceTiers))
    .filter((price): price is number => typeof price === 'number')
  const priceCurrency = tickets.find((ticket) => ticket.currency)?.currency ?? 'EUR'
  const lowestPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : null
  const defaultCtaLabel = lowestPrice !== null ? "Je m'inscris maintenant" : 'Être notifié'
  const defaultCtaHref = lowestPrice !== null ? '/events/ultra-arena-2026/register' : '#tickets'

  // Get base price (without discount) for display
  const baseTicketPrices = tickets
    .map((ticket) => ticket.final_price_cents)
    .filter((price): price is number => typeof price === 'number')
  const baseLowestPrice = baseTicketPrices.length > 0 ? Math.min(...baseTicketPrices) : null
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: priceCurrency || 'EUR',
      minimumFractionDigits: 2,
    }).format(value / 100)
  const raceHighlights = tickets.reduce<
    Array<{
      key: string
      label: string
      type?: string | null
      distance?: number | null
      target?: string | null
      difficulty?: number | null
    }>
  >((acc, ticket) => {
    if (!ticket.race && !ticket.name) {
      return acc
    }
    const label = ticket.race?.name || ticket.name
    if (acc.some((item) => item.label === label)) {
      return acc
    }

    acc.push({
      key: ticket.id,
      label,
      type: ticket.race?.type ?? null,
      distance: ticket.race?.distance_km ?? ticket.distance_km ?? null,
      target: ticket.race?.target_public ?? null,
      difficulty: ticket.race?.difficulty ?? null,
    })

    return acc
  }, [])
  const galleryImages: string[] =
    Array.isArray((event as any).gallery) && (event as any).gallery.length > 0
      ? (event as any).gallery
      : event.image_url
        ? [event.image_url]
        : []
  const locationMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
  const formattedDate = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const formattedSalesStart = event.sales_start
    ? new Date(event.sales_start).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : null
  const isOnSale = event.status === 'on_sale'

  const handleNotifySubmit = async (eventSubmit: FormEvent<HTMLFormElement>) => {
    eventSubmit.preventDefault()

    if (!notifyEmail) {
      setNotifyStatus('error')
      setNotifyMessage('Merci de renseigner ton email.')
      return
    }

    setNotifyStatus('loading')
    setNotifyMessage(null)

    try {
      const response = await fetch(`/api/events/${event.slug ?? event.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          full_name: session?.profile?.full_name ?? null,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Erreur lors de la demande')
      }

      setNotifyStatus('success')
      setNotifyMessage('Parfait, on te prévient dès l’ouverture.')
    } catch (error) {
      setNotifyStatus('error')
      setNotifyMessage(error instanceof Error ? error.message : 'Erreur lors de la demande')
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          {(isUltraArena || event.image_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={isUltraArena ? '/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif' : event.image_url!} alt={event.title} className="h-full w-full object-cover opacity-25 scale-105" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-background via-muted/40 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 pb-8 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/events">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full border border-border/60 bg-background/70 px-6 text-muted-foreground backdrop-blur transition hover:bg-background/80 hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux événements
              </Button>
            </Link>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Dernière mise à jour :{' '}
              {new Date(event.updated_at ?? event.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="w-full flex flex-col gap-8">
            <Badge variant={getStatusColor(event.status)} className="w-fit border border-primary/30 bg-primary/10 text-primary backdrop-blur">
              <span className='relative mr-2 flex h-2 w-2'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
                <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
              </span>
              {getStatusLabel(event.status)}
            </Badge>
            <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="flex-1 space-y-6 animate-fade-in-up animate-duration-700">
                <div className="space-y-3">
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{event.title}</h1>
                  {event.subtitle ? (
                    <p className="text-lg text-muted-foreground sm:text-xl">{event.subtitle}</p>
                  ) : (
                    <p className="text-lg text-muted-foreground sm:text-xl">Un rendez-vous sportif taillé pour repousser vos limites.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl bg-card/80 p-5 shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:shadow-md hover:ring-primary/20">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                    <p className="font-semibold">{formattedDate}</p>
                    <p className="text-sm text-muted-foreground">{formattedTime}</p>
                    {event.status === 'announced' && formattedSalesStart ? (
                      <p className="text-sm text-muted-foreground">
                        Ouverture des inscriptions : {formattedSalesStart}
                      </p>
                    ) : null}
                  </div>
                </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-card/80 p-5 shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:shadow-md hover:ring-primary/20">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Lieu</p>
                      <p className="font-semibold">{event.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {availableSpots > 0
                          ? `${availableSpots} place${availableSpots > 1 ? 's' : ''} encore disponibles`
                          : 'Complètement réservé'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-card/80 p-5 shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:shadow-md hover:ring-primary/20">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacité</p>
                      <p className="font-semibold">{event.capacity} participants</p>
                      {isUpcoming ? (
                        <p className={`text-sm ${isToday ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                          {isToday
                            ? "C'est le grand jour !"
                            : `Plus que ${daysUntil} jour${daysUntil > 1 ? 's' : ''} avant le départ.`}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Édition terminée</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-card/80 p-5 shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:shadow-md hover:ring-primary/20">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Formats au programme</p>
                      <p className="font-semibold">
                        {raceHighlights.length > 0
                          ? raceHighlights.length === 1
                            ? raceHighlights[0].label
                            : `${raceHighlights.length} formats`
                          : 'À dévoiler bientôt'}
                      </p>
                      {raceHighlights.length > 1 ? (
                        <p className="text-sm text-muted-foreground">
                          {raceHighlights
                            .map((race) => race.type || race.label)
                            .slice(0, 3)
                            .join(' • ')}
                          {raceHighlights.length > 3 ? '…' : ''}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-card/80 p-6 ring-1 ring-border/60 backdrop-blur">
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {event.description ||
                      "Préparez-vous à vivre une expérience sportive intense : échauffement collectif, zones techniques, runs rythmés et obstacles exigeants. L'événement rassemble des athlètes passionnés prêts à se dépasser dans une ambiance électrisante."}
                  </p>
                </div>

                {isUltraArena && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-fit rounded-2xl border-border/60 bg-card/80 backdrop-blur hover:bg-card"
                  >
                    <a href="#infos-pratiques">Découvrez toutes les infos pratiques ici</a>
                  </Button>
                )}
              </div>
              <div className="h-full w-full max-w-sm space-y-6 rounded-3xl border border-primary/40 bg-primary p-8 text-primary-foreground shadow-[0_25px_70px_-20px_rgba(34,197,94,0.45)] lg:sticky lg:top-24 lg:w-auto animate-fade-in-up animate-duration-700 animate-delay-200">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">À partir de</p>
                  {lowestPrice !== null ? (
                    <div className="space-y-1">
                      {hasDiscount && baseLowestPrice && baseLowestPrice > lowestPrice && (
                        <p className="text-2xl font-bold line-through text-primary-foreground/60">
                          {formatCurrency(baseLowestPrice)}
                        </p>
                      )}
                      <p className="text-5xl font-extrabold">
                        {formatCurrency(lowestPrice)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-4xl font-extrabold">Bientôt en vente</p>
                  )}
                  <p className="text-sm text-primary-foreground/80">
                    Tarifs évolutifs selon le format choisi et la période d'inscription.
                  </p>
                </div>
                {isAnnounced ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-primary-foreground/10 p-4 text-primary-foreground">
                      <p className="text-sm font-semibold">Inscriptions pas encore ouvertes</p>
                      {formattedSalesStart ? (
                        <p className="mt-1 text-xs text-primary-foreground/70">
                          Ouverture prévue le {formattedSalesStart}.
                        </p>
                      ) : null}
                      {countdown ? (
                        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                          <div className="rounded-xl bg-white/15 px-2 py-3">
                            <p className="text-lg font-bold">{countdown.days}</p>
                            <p className="text-[8px] uppercase tracking-wide text-primary-foreground/70">Jours</p>
                          </div>
                          <div className="rounded-xl bg-white/15 px-2 py-3">
                            <p className="text-lg font-bold">{padCountdown(countdown.hours)}</p>
                            <p className="text-[8px] uppercase tracking-wide text-primary-foreground/70">Heures</p>
                          </div>
                          <div className="rounded-xl bg-white/15 px-2 py-3">
                            <p className="text-lg font-bold">{padCountdown(countdown.minutes)}</p>
                            <p className="text-[8px] uppercase tracking-wide text-primary-foreground/70">Minutes</p>
                          </div>
                          <div className="rounded-xl bg-white/15 px-2 py-3">
                            <p className="text-lg font-bold">{padCountdown(countdown.seconds)}</p>
                            <p className="text-[8px] uppercase tracking-wide text-primary-foreground/70">Secondes</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <form className="space-y-3" onSubmit={handleNotifySubmit}>
                      <Input
                        type="email"
                        value={notifyEmail}
                        onChange={(eventInput) => setNotifyEmail(eventInput.target.value)}
                        placeholder="Ton email"
                        className="h-12 rounded-2xl border-white/40 bg-white/90 text-foreground placeholder:text-black/60"
                        required
                      />
                      <Button
                        className="w-full rounded-2xl bg-background py-6 text-lg font-semibold text-foreground shadow-lg hover:bg-background/80"
                        size="lg"
                        type="submit"
                        disabled={notifyStatus === 'loading' || notifyStatus === 'success'}
                      >
                        {notifyStatus === 'loading' ? 'Envoi...' : notifyStatus === 'success' ? 'On te prévient !' : 'Me prévenir'}
                      </Button>
                    </form>
                    {notifyMessage ? (
                      <p className={`text-xs ${notifyStatus === 'error' ? 'text-red-200' : 'text-primary-foreground/80'}`}>
                        {notifyMessage}
                      </p>
                    ) : null}
                    <p className="text-xs text-primary-foreground/70">
                      Un seul email à l'ouverture des inscriptions. Pas de spam.
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full rounded-2xl bg-background py-6 text-lg font-semibold text-foreground shadow-lg hover:bg-background/80"
                    size="lg"
                    asChild
                  >
                    <a href={defaultCtaHref}>{defaultCtaLabel}</a>
                  </Button>
                )}
                <div className="rounded-2xl bg-primary-foreground/80 p-4 text-sm text-primary">
                  <p className="font-semibold">Infos clés</p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Ouverture des portes 1h avant le premier départ</li>
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Vestiaires et consignes disponibles sur place</li>
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Restauration & corners partenaires pendant toute la journée</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-background py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-80 w-full overflow-hidden rounded-2xl border border-border/60 shadow-lg">
            <iframe
              title={`Carte de ${event.location}`}
              src={locationMapUrl}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
      {isUltraArena ? (
        <>
        {/* L'événement */}
        <section className="relative overflow-hidden bg-background py-16 sm:py-20">
          <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  L'événement
                </p>
                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ultra Arena 2026</h2>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Backyard OCR nouvelle génération — une boucle unique en pleine nature, deux formats pour tous les niveaux d'engagement.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit border border-primary/30 bg-primary/10 text-primary">
                Backyard OCR nouvelle génération
              </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Rejoindre l'événement</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Overbound est une course à obstacles nouvelle génération organisée sous forme de backyard, sur une
                  boucle unique en pleine nature. Deux formats sont proposés : OPEN et RANKED, pour permettre à
                  chacun de choisir son niveau d'engagement.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  L'événement est ouvert aux sportifs de tous niveaux, dès lors qu'ils sont majeurs.
                </p>
              </div>
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Tent className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Le village Overbound</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Le village Overbound est le cœur de l'événement : zone de départ et d'arrivée, partenaires,
                  animations, musique et public.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  C'est un lieu vivant, pensé pour créer une ambiance forte et permettre aux spectateurs de suivre
                  l'épreuve jusqu'au dernier survivant.
                </p>
              </div>
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Route className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">La course</h3>
                </div>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Boucle d'environ 2 km</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />10 obstacles et plus, sollicitant force, endurance, agilité et mental</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Parcours en milieu naturel</li>
                </ul>
              </div>
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <PartyPopper className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Après ta course</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Après l'effort, place à la récupération et au partage : repos au village, échanges avec les autres
                  participants, partenaires, public et ambiance conviviale.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Formats OPEN & RANKED */}
        <section className="relative overflow-hidden py-16 sm:py-20">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.avif"
              alt="Participants courant avec des chaînes autour du cou"
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background" />
          </div>
          <div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Choisis ton format
              </p>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Deux formats, un même terrain</h2>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Que tu viennes pour le dépassement personnel ou la compétition pure, il y a un format pour toi.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-card to-card p-8 shadow-lg transition hover:border-blue-500/50 hover:shadow-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-500/15 p-2.5">
                      <Heart className="h-5 w-5 text-blue-500" />
                    </div>
                    <Badge className="bg-blue-500/15 text-blue-600 border-0">Accessible</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">OPEN</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Format accessible, sans élimination. Les participants disposent d'un temps de course global et
                    gèrent librement leurs tours, leurs pauses, leur nutrition et leur récupération. L'objectif :
                    se dépasser à son rythme, dans un cadre encadré et sécurisé.
                  </p>
                  {isOnSale ? (
                    <Button asChild size="lg" className="mt-6 w-full rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700">
                      <Link href="/events/ultra-arena-2026/register">S'inscrire en OPEN</Link>
                    </Button>
                  ) : (
                    <Button size="lg" className="mt-6 w-full rounded-xl bg-blue-600/60 text-white shadow-lg shadow-blue-500/25" disabled>
                      Inscriptions à venir
                    </Button>
                  )}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card p-8 shadow-lg transition hover:border-amber-500/50 hover:shadow-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/15 p-2.5">
                      <Swords className="h-5 w-5 text-amber-500" />
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-600 border-0">Compétitif</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">RANKED</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Format compétitif à élimination progressive. Un départ est donné toutes les 20 minutes. Les
                    participants doivent terminer chaque boucle dans le temps imparti sous peine d'élimination. La
                    course s'arrête lorsqu'il ne reste plus qu'un seul participant en compétition.
                  </p>
                  {isOnSale ? (
                    <Button asChild size="lg" className="mt-6 w-full rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-500/25 hover:bg-amber-700">
                      <Link href="/events/ultra-arena-2026/register">S'inscrire en RANKED</Link>
                    </Button>
                  ) : (
                    <Button size="lg" className="mt-6 w-full rounded-xl bg-amber-600/60 text-white shadow-lg shadow-amber-500/25" disabled>
                      Inscriptions à venir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Infos pratiques */}
        <section id="infos-pratiques" className="bg-background py-16 sm:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Infos pratiques
              </p>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Tout ce qu'il faut savoir</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Ton billet</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Accès à la course choisie (OPEN ou RANKED)</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Accès au village Overbound</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Services mis à disposition sur site</li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">
                  Les informations pratiques (guide du coureur) seront envoyées par email avant l'événement.
                </p>
              </div>
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Lieu de l'événement</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Base de loisirs de Saint-Quentin-en-Yvelines (Yvelines – Île-de-France).
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  L'accès précis et les informations de stationnement seront communiqués dans le Guide du Coureur.
                </p>
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-500/5 p-3 ring-1 ring-amber-500/15">
                  <Car className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <span className="font-semibold">Parking payant : 6 €/voiture.</span> Pensez au covoiturage — c'est plus économique, plus écologique, et ça fait déjà partie de l'esprit tribu !
                  </p>
                </div>
              </div>
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Conditions de participation & sécurité</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />PPS (Parcours Prévention Santé) valide — <a className="text-primary hover:underline" href="https://pps.athle.fr" target="_blank" rel="noreferrer">pps.athle.fr</a></li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />ou certificat médical en cours de validité attestant l'absence de contre-indication</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />ou licence sportive valide pour l'année de l'événement</li>
                </ul>
                <p className="mt-3 rounded-xl bg-destructive/5 p-3 text-xs text-destructive/80 ring-1 ring-destructive/10">
                  En l'absence de l'un de ces documents, l'accès à la course sera refusé. Aucun remboursement ne
                  pourra être effectué.
                </p>
              </div>
              <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <IdCard className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Enregistrement</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Merci de prévoir une pièce d'identité (carte d'identité, permis de conduire, carte étudiante,
                  etc.). Une photo du document sur téléphone est acceptée.
                </p>
              </div>
            </div>

            {/* Grille infos complémentaires */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Eye, title: 'Spectateurs', text: "Les spectateurs sont les bienvenus sur le village Overbound et les zones dédiées. Pour des raisons de sécurité, l'accès au parcours leur est strictement interdit." },
                { icon: Backpack, title: 'Dépôt de sac', text: "Un espace de dépôt de sacs sera disponible sur site. Les modalités exactes seront précisées dans le Guide du Coureur." },
                { icon: Baby, title: 'Âge minimum', text: "Événement réservé aux majeurs (18 ans minimum)." },
                { icon: Camera, title: 'Photos & contenus', text: "Des photographes officiels seront présents sur l'événement. Les photos seront mises en ligne dans les jours suivant la course." },
                { icon: ArrowLeftRight, title: 'Transfert de billet', text: "Les modalités de modification ou de transfert de billet seront précisées dans le Guide du Coureur. Certaines modifications pourront être effectuées directement en ligne." },
              ].map((item) => (
                <div key={item.title} className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-5 transition hover:border-primary/20 hover:shadow-md">
                  <div className="rounded-lg bg-muted/80 p-2 shrink-0">
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </>
      ) : null}
      {/* <section className="bg-background py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-10">
              <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-lg shadow-primary/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Au programme</h2>
                  <Badge variant="secondary" className="border border-primary/30 bg-primary/10 text-primary">
                    Intense & immersif
                  </Badge>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl bg-background/70 p-5 ring-1 ring-border/60">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Séquences de course</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Alternance de runs explosifs et d'ateliers fonctionnels pour tester votre explosivité, votre cardio et votre technique.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-background/70 p-5 ring-1 ring-border/60">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ambiance</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      DJ set, commentateurs live et zones spectateurs pour garder la motivation au maximum.
                    </p>
                  </div>
                </div>
                {raceHighlights.length > 0 ? (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Les formats de courses proposés</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {raceHighlights.map((race) => (
                        <div key={race.key} className="rounded-2xl bg-background/70 p-5 ring-1 ring-border/60">
                          <p className="text-base font-semibold text-foreground">{race.label}</p>
                          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                            {race.type ? <li>Type : {race.type}</li> : null}
                            {typeof race.distance === 'number' ? <li>Distance : {race.distance} km</li> : null}
                            {typeof race.difficulty === 'number' ? <li>Difficulté : {race.difficulty}/10</li> : null}
                            {race.target ? <li>Public visé : {race.target}</li> : null}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-2xl border border-dashed border-border bg-background/60 p-6 text-sm text-muted-foreground">
                    Les formats détaillés seront dévoilés très prochainement. Restez connectés !
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-lg shadow-primary/10">
                <h2 className="text-2xl font-bold text-foreground">Galerie & ambiance</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Une immersion visuelle dans l&apos;intensité de nos éditions précédentes. Partagez vos meilleurs moments sur les réseaux avec
                  #OverboundRace.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {galleryImages.length > 0 ? (
                    galleryImages.map((src, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${src}-${index}`}
                        src={src}
                        alt={`Overbound event highlight ${index + 1}`}
                        className="h-32 w-full rounded-2xl object-cover ring-1 ring-border/60"
                      />
                    ))
                  ) : (
                    <div className="col-span-full rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center text-sm text-muted-foreground">
                      Les visuels arrivent bientôt.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-lg shadow-primary/10">
                <h2 className="text-xl font-semibold text-foreground">Infos pratiques</h2>
                <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <p>
                    {event.description
                      ? 'Retrouvez ci-dessous les informations essentielles pour préparer votre venue.'
                      : "Tout ce qu'il faut savoir pour vivre l'expérience Overbound dans les meilleures conditions."}
                  </p>
                  <ul className="space-y-2">
                    <li>• Check-in sur place : pensez à votre pièce d&apos;identité.</li>
                    <li>• Pack coureur en retrait sur présentation du QR code.</li>
                    <li>• Parking et transports en commun à proximité immédiate.</li>
                  </ul>
                  <p className="rounded-2xl bg-background/70 p-4 text-xs text-muted-foreground">
                    Besoin d&apos;aide ? Contactez-nous :{' '}
                    <a className="text-primary hover:underline" href="mailto:contact@overbound-race.com">
                      contact@overbound-race.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border bg-card/80 shadow-lg shadow-primary/10">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-foreground">Localisation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                </div>
                <div className="h-64 w-full">
                  <iframe
                    title={`Carte de ${event.location}`}
                    src={locationMapUrl}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              {user ? (
                existingRegistration ? (
                  <Alert className="border-primary/40 bg-primary/10 text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Vous avez déjà une inscription active avec le billet "{existingRegistration.tickets?.[0]?.name || '—'}". Vous pouvez tout
                      de même compléter une nouvelle inscription pour un autre format ou participant.
                    </AlertDescription>
                  </Alert>
                ) : availableSpots <= 0 ? (
                  <Alert variant="destructive" className="border-destructive/60 bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Les inscriptions ne sont plus disponibles pour cet événement.</AlertDescription>
                  </Alert>
                ) : null
              ) : (
                <Alert className="border-border bg-background/80 text-muted-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription>Connectez-vous pour vous inscrire à l&apos;événement et accéder à vos billets.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Inscription */}
      <section id="tickets" className="relative isolate overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/images/a-sunny-mood-with-runners-ready-to-go.avif"
            alt="Des coureurs prêts à s'élancer sous le soleil"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-primary-foreground/70">
            Places limitées
          </p>
          <h2 className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Prêt à entrer dans l'arène ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">
            Les tarifs augmentent à chaque palier. Plus tu réserves tôt, plus tu économises. Choisis ton format et assure ta place.
          </p>

          {lowestPrice !== null && (
            <div className="mt-8 inline-flex flex-col items-center gap-1">
              {hasDiscount && baseLowestPrice && baseLowestPrice > lowestPrice && (
                <span className="text-lg font-semibold line-through text-primary-foreground/50">
                  dès {formatCurrency(baseLowestPrice)}
                </span>
              )}
              <span className="text-5xl font-extrabold text-primary-foreground sm:text-6xl">
                dès {formatCurrency(lowestPrice)}
              </span>
              {hasDiscount && activeTier && (
                <Badge className="mt-1 border-0 bg-white/20 text-primary-foreground text-sm">
                  -{activeTier.discount_percentage}% — {activeTier.name}
                </Badge>
              )}
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {isOnSale ? (
              <Button
                asChild
                size="lg"
                className="h-14 rounded-2xl bg-red-600 px-10 text-lg font-bold text-white shadow-xl shadow-red-500/25 hover:bg-red-700"
              >
                <Link href={`/events/${params.id}/register`}>Je m&apos;inscris maintenant</Link>
              </Button>
            ) : isAnnounced ? (
              <Button
                asChild
                size="lg"
                className="h-14 rounded-2xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90"
              >
                <a href="#tickets">Être notifié de l&apos;ouverture</a>
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-14 rounded-2xl bg-muted px-10 text-lg font-bold text-muted-foreground"
                disabled
              >
                Inscriptions fermées
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-2xl border-2 border-primary-foreground/30 bg-transparent px-10 text-lg font-semibold text-primary-foreground hover:bg-white/10"
            >
              <a href="#infos-pratiques">Infos pratiques</a>
            </Button>
          </div>

          {isOnSale && (
            <p className="mt-6 text-xs text-primary-foreground/60">
              Paiement sécurisé par Stripe — Inscription en 2 minutes
            </p>
          )}
        </div>
      </section>

      {/* Ancien bloc réservation (commenté pour refacto)
      <section id="tickets-old" className="relative overflow-hidden bg-background py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-primary/5" />
        <div className="pointer-events-none absolute -top-24 right-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative mx-auto max-w-7xl px-6">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Réserver mon inscription</h2>
            <p className="text-sm text-muted-foreground">
              Choisissez le format qui correspond à votre niveau : chaque billet est limité, ne tardez pas.
            </p>
          </div>
          {eventPriceTiers.length > 0 && tickets.length > 0 && (
            <div className="mb-12 rounded-2xl border border-primary/20 bg-background/80 p-8 backdrop-blur shadow-lg shadow-primary/10">
              <PricingTimeline
                ticket={tickets[0]}
                eventPriceTiers={eventPriceTiers}
                currency={priceCurrency}
                eventDate={event.date}
              />
            </div>
          )}
          <EventTicketListWithRegistration
            event={event}
            tickets={tickets}
            availableSpots={availableSpots}
            user={user ? { id: user.id, email: user.email ?? '' } : null}
            eventPriceTiers={eventPriceTiers}
          />
        </div>
      </section>
      */}
      <FAQ />
    </main>
  )
}
