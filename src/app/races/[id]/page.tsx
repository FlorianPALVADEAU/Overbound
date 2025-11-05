'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Flag, Flame, Mountain, Target, Zap, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRaceById } from '@/app/api/races/racesQueries'

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

interface RaceEvent {
  id: string
  title: string
  date: string
  location: string
  status: string
  capacity: number
  registrations_count: number
}

const formatRaceType = (type?: string | null) => {
  switch (type) {
    case 'trail':
      return 'Trail technique'
    case 'obstacle':
      return "Course d'obstacles"
    case 'urbain':
      return 'Format urbain'
    case 'nature':
      return 'Nature & outdoor'
    case 'extreme':
      return 'Format extrême'
    default:
      return 'Format hybride'
  }
}

const formatTargetPublic = (target?: string | null) => {
  if (!target) return 'Tout public motivé'
  return target.charAt(0).toUpperCase() + target.slice(1)
}

const formatDateLong = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatDateShort = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function RaceDetailPage() {
  const params = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = useRaceById(params.id)
  const raceId = data?.id

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery<{ events: RaceEvent[] }, Error>({
    queryKey: ['race-events', raceId],
    queryFn: async () => {
      if (!raceId) {
        throw new Error('Identifiant de course manquant')
      }
      const response = await fetch(`/api/races/${raceId}/events`, { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Impossible de récupérer les événements associés')
      }
      return (await response.json()) as { events: RaceEvent[] }
    },
    enabled: Boolean(raceId),
    staleTime: 60 * 1000,
  })

  const upcomingEvents = useMemo(() => {
    const entries = eventsData?.events ?? []
    return [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [eventsData?.events])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Chargement de la course…
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-background py-16">
        <div className="container mx-auto max-w-lg px-6">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Course introuvable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error?.message || "Cette course n'existe pas ou n'est plus disponible."}</p>
              <Button onClick={() => refetch()} variant="secondary">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const race = data
  const nextEvent = upcomingEvents[0]
  const remainingSpots =
    nextEvent && typeof nextEvent.capacity === 'number'
      ? Math.max(nextEvent.capacity - (nextEvent.registrations_count ?? 0), 0)
      : null
  const obstacleCount = race.obstacles?.length ?? 0
  const difficultyLabel =
    race.difficulty <= 3
      ? 'Accessible'
      : race.difficulty <= 6
        ? 'Engagé'
        : 'Explosif'
  const galleryImages: string[] = race.logo_url ? [race.logo_url] : []

  const statsCards = [
    {
      label: 'Format',
      value: formatRaceType(race.type),
      icon: Flag,
      helper: `Pensé pour les profils ${formatTargetPublic(race.target_public).toLowerCase()}`,
    },
    {
      label: 'Intensité',
      value: `${race.difficulty}/10`,
      icon: Flame,
      helper: difficultyLabel,
    },
    {
      label: race.distance_km ? 'Distance' : 'Public cible',
      value: race.distance_km ? `${race.distance_km} km` : formatTargetPublic(race.target_public),
      icon: race.distance_km ? Mountain : Target,
      helper: race.distance_km ? 'Segments de run et ateliers fonctionnels' : "Idéal pour progresser en team ou en solo",
    },
    obstacleCount > 0
      ? {
          label: 'Obstacles',
          value: `${obstacleCount} ateliers`,
          icon: Zap,
          helper: 'Mix cardio, force et stratégie',
        }
      : {
          label: 'Obstacles',
          value: 'À venir',
          icon: Zap,
          helper: 'Programme en cours de finalisation',
        },
  ]

  return (
    <main className="min-h-screen bg-background">
      <section className="relative bg-background py-24">
        <div className="absolute inset-0">
          {race.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={race.logo_url} alt={race.name} className="h-full w-full object-cover opacity-30" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-background via-muted/30 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/80 to-background" />
        </div>
        <div className="container relative z-10 mx-auto max-w-7xl px-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 rounded-full border border-border/50 bg-background/60 px-6 text-muted-foreground backdrop-blur transition hover:bg-background/80 hover:text-foreground"
            asChild
          >
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux événements
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-border/50 bg-background/70 p-8 backdrop-blur shadow-xl shadow-primary/10">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  {race.type ? (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      {formatRaceType(race.type)}
                    </Badge>
                  ) : null}
                  {race.distance_km ? (
                    <Badge variant="outline" className="border-border text-foreground">
                      {race.distance_km} km
                    </Badge>
                  ) : null}
                </div>

                <h1 className="text-5xl font-black tracking-tight text-foreground md:text-6xl">{race.name}</h1>
                <p className="mt-4 text-xl leading-relaxed text-muted-foreground">
                  {race.description ||
                    "Un format signature Overbound qui combine puissance, endurance et coordination. Préparez votre team pour des runs fractionnés, des ateliers fonctionnels et des obstacles techniques à haute intensité."}
                </p>
              </div>
            </div>

            {nextEvent ? (
              <div className="rounded-3xl border border-border/60 bg-background/75 p-8 backdrop-blur shadow-xl shadow-primary/10">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Prochaine édition</span>
                  <Badge variant={getStatusColor(nextEvent.status)}>{getStatusLabel(nextEvent.status)}</Badge>
                </div>
                <h3 className="text-lg font-bold text-foreground">{nextEvent.title}</h3>
                <p className="mt-2 text-2xl font-bold text-primary">{formatDateLong(nextEvent.date)}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{nextEvent.location}</span>
                </div>
                {remainingSpots !== null ? (
                  <div className="mt-6 rounded-2xl bg-background/70 p-4 ring-1 ring-border backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Places disponibles</p>
                    <p className="mt-1 text-3xl font-bold text-primary">{remainingSpots}</p>
                    <p className="mt-1 text-xs text-muted-foreground">sur {nextEvent.capacity} places</p>
                  </div>
                ) : null}
                <Button className="mt-6 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link href={`/events/${nextEvent.id}`}>S&apos;inscrire maintenant</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8">
                <p className="text-sm text-muted-foreground">
                  Aucune date n&apos;est encore programmée. Restez connecté pour connaître la prochaine édition.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-primary/5 transition hover:ring-2 hover:ring-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-card-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-3xl border border-border bg-card p-8">
                <h2 className="text-2xl font-bold text-card-foreground">Philosophie du format</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Cette course hybride combine l&apos;intensité des runs fractionnés avec une série d&apos;obstacles techniques qui sollicitent
                  l&apos;ensemble du corps. Chaque transition challenge votre endurance et votre capacité à récupérer sous pression, créant un
                  format parfait pour ceux qui cherchent à sortir des sentiers battus et découvrir un nouveau style de compétition.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">À quoi vous attendre</p>
                    <p className="mt-1 text-base font-semibold text-foreground">Runs, puissance et coordination</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Transition rapide entre cardio et ateliers fonctionnels pour garder un rythme élevé tout au long de la course.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pré-requis</p>
                    <p className="mt-1 text-base font-semibold text-foreground">Condition physique solide</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Programme idéal pour préparer une compétition hybride ou challenger votre team sur un format explosif.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Ambiance</p>
                    <p className="mt-1 text-base font-semibold text-foreground">Stade indoor & vibes club</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      DJ set, speaker live et zones spectateurs rapprochées pour des encouragements constants.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-8">
                <h2 className="text-2xl font-bold text-card-foreground">Obstacles signature</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Une sélection d&apos;ateliers techniques et puissants conçus pour tester chaque groupe musculaire. Concentrez-vous sur la
                  posture et l&apos;explosivité pour gagner un temps précieux.
                </p>
                {obstacleCount > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {race.obstacles
                      ?.sort((a, b) => a.order_position - b.order_position)
                      .slice(0, 6)
                      .map((item) => (
                        <div
                          key={item.obstacle.id}
                          className="rounded-2xl bg-background/40 p-4 ring-1 ring-border transition hover:ring-primary/60"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground">{item.obstacle.name}</p>
                            {item.is_mandatory ? (
                              <Badge variant="outline" className="border-primary/60 text-primary">
                                Obligatoire
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                            Intensité {item.obstacle.difficulty}/10 • {item.obstacle.type}
                          </p>
                        </div>
                      ))}
                    {obstacleCount > 6 ? (
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-background/30 p-4 text-sm text-muted-foreground">
                        +{obstacleCount - 6} autres ateliers au programme
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/30 p-6 text-sm text-muted-foreground">
                    Les obstacles seront dévoilés prochainement.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-border bg-card p-8">
                <h2 className="text-2xl font-bold text-card-foreground">Galerie & ambiance</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aperçu du flow et de la mise en scène Overbound. Inspirez-vous, partagez vos entraînements et préparez votre team pour le
                  grand jour.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {galleryImages.length > 0 ? (
                    galleryImages.map((src, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${src}-${index}`}
                        src={src}
                        alt={`Race highlight ${index + 1}`}
                        className="h-32 w-full rounded-2xl object-cover ring-1 ring-border"
                      />
                    ))
                  ) : (
                    <div className="col-span-full rounded-2xl border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">
                      Visuels en cours de production.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* <div className="rounded-3xl border border-border bg-card p-8">
                <h2 className="text-xl font-semibold text-card-foreground">Préparation recommandée</h2>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                    Combinez séances de running fractionné et travail fonctionnel lourd pour reproduire les transitions du parcours.
                  </p>
                  <p className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                    Travaillez la coordination en duo : relais de matériel, synchronisation sur les ateliers et communication sur les transitions.
                  </p>
                  <p className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                    Pensez à un échauffement articulaire complet (épaules, hanches, chevilles) afin d&apos;enchaîner les mouvements explosifs sans limite.
                  </p>
                </div>
              </div> */}

              <div className="rounded-3xl border border-border bg-card p-8">
                <h2 className="text-xl font-semibold text-card-foreground">Matériel & équipement</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>• Chaussures de training stable et grip antidérapant.</li>
                  <li>• Gants optionnels pour la traction et les manipulations répétées.</li>
                  <li>• Ceinture hydratation légère ou ravitaillement en libre-service sur zone.</li>
                  <li>• Tenue respirante et seconde peau pour limiter les frottements.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="bg-background py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Événements associés</h2>
              <p className="text-sm text-muted-foreground">
                Retrouvez toutes les dates qui proposent ce format. Inscriptions limitées : choisissez votre arène.
              </p>
            </div>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" onClick={() => refetchEvents()}>
              Rafraîchir les dates
            </Button>
          </div>

          {eventsLoading ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
              Chargement des événements…
            </div>
          ) : eventsError ? (
            <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              {eventsError.message}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {upcomingEvents.map((event) => {
                const eventRemaining =
                  typeof event.capacity === 'number'
                    ? Math.max(event.capacity - (event.registrations_count ?? 0), 0)
                    : null

                return (
                  <div
                    key={event.id}
                    className="flex h-full flex-col justify-between rounded-3xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border transition hover:ring-primary/70"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-muted-foreground">
                          {formatDateShort(event.date)} • {formatTime(event.date)}
                        </span>
                        <Badge variant={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-card-foreground">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                      <span>Capacité {event.capacity}</span>
                      <span>{eventRemaining !== null ? `${eventRemaining} places restantes` : 'Places limitées'}</span>
                    </div>
                    <Button className="mt-6 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                      <Link href={`/events/${event.id}`}>Voir l&apos;événement</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-sm text-muted-foreground">
              Aucune date n&apos;est programmée pour le moment. Rejoignez la newsletter pour être informé des prochaines ouvertures.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
