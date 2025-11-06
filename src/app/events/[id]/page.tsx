'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import EventTicketListWithRegistration from '@/components/events/EventTicketListWithRegistration'
import { PricingTimeline } from '@/components/events/PricingTimeline'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { useSession } from '@/app/api/session/sessionQueries'
import { getPriceTiersForTimeline } from '@/lib/pricing'

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
    default:
      return status
  }
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const { data: session } = useSession()
  const { data, isLoading, error, refetch } = useEventDetail(params.id)

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
  const ticketPrices = tickets
    .map((ticket) => (typeof ticket.base_price_cents === 'number' ? ticket.base_price_cents : ticket.regular_price_cents))
    .filter((price): price is number => typeof price === 'number')
  const priceCurrency = tickets.find((ticket) => ticket.currency)?.currency ?? 'EUR'
  const lowestPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : null
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

  return (
    <main className="min-h-screen bg-background text-foreground max-w-7xl mx-auto">
      <section className="relative isolate overflow-hidden py-16">
        <div className="absolute inset-0">
          {event.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image_url} alt={event.title} className="h-full w-full object-cover opacity-30" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-background via-muted/40 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/80 to-background" />
        </div>

        <div className="container relative z-10">
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

          <div className="w-full flex flex-col gap-12">
            <Badge variant={getStatusColor(event.status)} className="border border-primary/30 bg-primary/10 text-primary backdrop-blur">
              {getStatusLabel(event.status)}
            </Badge>
            <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="flex-1 space-y-4 rounded-3xl border border-border/60 bg-background/70 p-8 backdrop-blur shadow-xl shadow-primary/10">
                <div className="space-y-2">
                  <h1 className="text-4xl font-black tracking-tight lg:text-5xl">{event.title}</h1>
                  {event.subtitle ? (
                    <p className="text-lg text-muted-foreground">{event.subtitle}</p>
                  ) : (
                    <p className="text-lg text-muted-foreground">Un rendez-vous sportif taillé pour repousser vos limites.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm shadow-primary/10 ring-1 ring-border/60">
                    <Calendar className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                      <p className="font-semibold">{formattedDate}</p>
                      <p className="text-sm text-muted-foreground">{formattedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm shadow-primary/10 ring-1 ring-border/60">
                    <MapPin className="mt-1 h-5 w-5 text-primary" />
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
                  <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm shadow-primary/10 ring-1 ring-border/60">
                    <Users className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacité</p>
                      <p className="font-semibold">{event.capacity} participants</p>
                      {isUpcoming ? (
                        <p className={`text-sm ${isToday ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {isToday
                            ? "C'est le grand jour !"
                            : `Plus que ${daysUntil} jour${daysUntil > 1 ? 's' : ''} avant le départ.`}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Édition terminée</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm shadow-primary/10 ring-1 ring-border/60">
                    <Trophy className="mt-1 h-5 w-5 text-primary" />
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

                <div className="rounded-3xl bg-card p-6 shadow-sm shadow-primary/10 ring-1 ring-border/60">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {event.description ||
                      "Préparez-vous à vivre une expérience sportive intense : échauffement collectif, zones techniques, runs rythmés et obstacles exigeants. L'événement rassemble des athlètes passionnés prêts à se dépasser dans une ambiance électrisante."}
                  </p>
                </div>
              </div>
              <div className="h-full w-full max-w-sm space-y-6 rounded-3xl border border-primary/40 bg-primary p-8 text-primary-foreground shadow-[0_25px_70px_-20px_rgba(34,197,94,0.45)] lg:w-auto">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">À partir de</p>
                  <p className="text-4xl font-extrabold">
                    {lowestPrice !== null ? formatCurrency(lowestPrice) : 'Bientôt en vente'}
                  </p>
                  <p className="text-sm text-primary-foreground/80">
                    Tarifs évolutifs selon le format choisi et la période d'inscription.
                  </p>
                </div>
                <Button
                  className="w-full rounded-2xl bg-background py-6 text-lg font-semibold text-foreground hover:bg-background/80"
                  size="lg"
                  asChild
                >
                  <a href="#tickets">{lowestPrice !== null ? 'Choisir mon format' : 'Être notifié'}</a>
                </Button>
                <div className="rounded-2xl bg-primary-foreground/80 p-4 text-sm text-primary">
                  <p className="font-semibold">Infos clés</p>
                  <ul className="mt-2 space-y-1">
                    <li>Ouverture des portes 1h avant le premier départ</li>
                    <li>Vestiaires et consignes disponibles sur place</li>
                    <li>Restauration & corners partenaires pendant toute la journée</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
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
      </section>

      <section id="tickets" className="bg-background py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Réserver mon inscription</h2>
            <p className="text-sm text-muted-foreground">
              Choisissez le format qui correspond à votre niveau : chaque billet est limité, ne tardez pas.
            </p>
          </div>

          {/* Pricing Timeline - Show only if tickets have price tiers */}
          {(() => {
            const ticketWithTiers = tickets.find(
              (ticket) => ticket.price_tiers && ticket.price_tiers.length > 0
            )
            return ticketWithTiers ? (
              <div className="mb-12 rounded-2xl border-2 border-border/60 p-8 backdrop-blur bg-accent-foreground text-black shadow-lg">
                <PricingTimeline
                  tiers={getPriceTiersForTimeline(ticketWithTiers)}
                  currency={ticketWithTiers.currency}
                  eventDate={event.date}
                />
              </div>
            ) : null
          })()}

          <EventTicketListWithRegistration
            event={event}
            tickets={tickets}
            availableSpots={availableSpots}
            user={user ? { id: user.id, email: user.email ?? '' } : null}
          />
        </div>
      </section>
    </main>
  )
}
