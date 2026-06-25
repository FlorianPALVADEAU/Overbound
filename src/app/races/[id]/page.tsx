'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Flag, Flame, Mountain, Target, Zap, MapPin, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRaceById } from '@/app/api/races/racesQueries'
import { getFormatConfig, FORMAT_TEMPLATES } from '@/constants/raceFormats'
import Image from 'next/image'
import Headings from '@/components/globals/Headings'
import SubHeadings from '@/components/globals/SubHeadings'

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
      <main className="min-h-screen bg-background ">
        <div className="w-full px-4 py-12 sm:px-6 xl:px-32">
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
  const obstacleCount = race.obstacles?.length ?? 0
  const difficultyLabel =
    race.difficulty <= 3
      ? 'Accessible'
      : race.difficulty <= 6
        ? 'Engagé'
        : 'Explosif'
  const galleryImages: string[] = race.logo_url ? [race.logo_url] : []

  // Get format config
  const formatConfig = getFormatConfig(params.id, race.name, race.format_template)

  // Detect race formats (keep for legacy compatibility with other sections)
  const isUltraArena = params.id === 'ultra-arena'
  const isTribalKids = params.id === 'tribal-kids'
  const isOrigin = params.id === 'origin'
  const isHorizon = params.id === 'horizon'

  // Build stats cards from format config or fallback to legacy data
  const statsCards = formatConfig
    ? (() => {
        const cards = [...formatConfig.statsCards]

        // Add estimated time card if available
        const estimatedTimeMin = race.estimated_time_min ?? formatConfig.estimatedTimeMin
        const estimatedTimeMax = race.estimated_time_max ?? formatConfig.estimatedTimeMax

        if (estimatedTimeMin && estimatedTimeMax) {
          cards.push({
            label: 'Temps estimé',
            value: `${estimatedTimeMin}-${estimatedTimeMax} min`,
            icon: Clock,
            helper: 'Durée moyenne pour terminer ce parcours',
          })
        }

        return cards
      })()
    : [
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
        <div className="container relative z-10 mx-auto px-4 py-12 sm:px-6 xl:px-32">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 rounded-full border border-border/50 bg-background/60 px-6 text-muted-foreground backdrop-blur transition hover:bg-background/80 hover:text-foreground"
            asChild
          >
            <Link href="/events/ultra-arena-2026">
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
                {isUltraArena ? (
                  <div className="mt-4 space-y-3">
                    <Badge className="bg-amber-500 text-white font-bold text-sm">
                      PREMIÈRE MONDIALE - Format Backyard OCR
                    </Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground">
                      <span className="text-foreground font-semibold">Du jamais vu dans l'OCR :</span> Le premier format backyard appliqué aux courses d'obstacles.
                      Inspiré du légendaire <a href="https://www.mattmahoney.net/barkley/" target='_blank' className='underline'>Barkley Marathons</a>, la Ultra Arena n'a pas de distance fixe.
                    </p>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      <span className="text-amber-600 font-semibold">Élimination progressive.</span> Chaque tour dure 1h maximum.
                      Si tu ne reviens pas à temps, tu es éliminé. Le dernier debout gagne.
                      C'est un test mental et physique extrême réservé aux athlètes d'élite.
                    </p>
                  </div>
                ) : isTribalKids ? (
                  <div className="mt-4 space-y-3">
                    <Badge className="bg-purple-500 text-white font-bold text-sm">
                      FORMAT FAMILLE - 6-14 ans
                    </Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground">
                      <span className="text-foreground font-semibold">L'initiation parfaite à l'OCR :</span> Des parcours d'obstacles ludiques et sécurisés spécialement conçus pour les enfants de 6 à 14 ans.
                    </p>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      <span className="text-purple-600 font-semibold">3 distances adaptées par âge.</span> 1 km (6-8 ans), 2 km (9-11 ans), 3 km (12-14 ans).
                      Avec 15 obstacles ludiques, progressifs et totalement sécurisés, les enfants découvrent l'esprit Overbound dans un environnement bienveillant et stimulant.
                    </p>
                  </div>
                ) : isOrigin ? (
                  <div className="mt-4 space-y-3">
                    <Badge className="bg-emerald-500 text-white font-bold text-sm">
                      FORMAT SPRINT - 6 km
                    </Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground">
                      <span className="text-foreground font-semibold">L'initiation explosive à l'OCR :</span> Origin est le format parfait pour découvrir l'univers Overbound ou viser un chrono explosif.
                    </p>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      <span className="text-emerald-600 font-semibold">6 km, 20 obstacles.</span> Distance courte mais intense qui te permet de donner ton maximum du début à la fin.
                      Accessible aux débutants motivés tout en offrant un vrai défi pour les athlètes confirmés qui cherchent la performance pure.
                    </p>
                  </div>
                ) : isHorizon ? (
                  <div className="mt-4 space-y-3">
                    <Badge className="bg-blue-500 text-white font-bold text-sm">
                      FORMAT INTERMÉDIAIRE - 12 km
                    </Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground">
                      <span className="text-foreground font-semibold">Le défi équilibré :</span> Horizon combine endurance, technique et mental pour un test complet de tes capacités.
                    </p>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      <span className="text-blue-600 font-semibold">12 km, 35 obstacles.</span> Distance médium qui demande gestion d'effort et stratégie.
                      Avec des portés lourds, des obstacles techniques répétés et une vraie dimension cardio, c'est le tremplin idéal pour progresser vers les formats élite.
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xl leading-relaxed text-muted-foreground">
                    {race.description ||
                      "Un format signature Overbound qui combine puissance, endurance et coordination. Préparez votre team pour des runs fractionnés, des ateliers fonctionnels et des obstacles techniques à haute intensité."}
                  </p>
                )}
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
                <div className="mt-6 rounded-2xl bg-background/70 p-4 ring-1 ring-border backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Inscriptions</p>
                  <p className="mt-1 text-base font-semibold text-primary">Places limitées</p>
                </div>
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

      <section className="bg-background ">
        <div className="w-full px-4 py-12 sm:px-6 xl:px-32">
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

      <section className="bg-background ">
        <div className="w-full px-4 py-12 sm:px-6 xl:px-32">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-3xl border border-border bg-card p-8">
                <h2 className="text-2xl font-bold text-card-foreground">
                  {isUltraArena ? 'Le concept Backyard OCR' : isTribalKids ? 'L\'esprit Tribal Kids' : isOrigin ? 'L\'esprit Sprint' : isHorizon ? 'Philosophie de la progression' : 'Philosophie du format'}
                </h2>
                {isUltraArena ? (
                  <>
                    <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                      <p>
                        <span className="text-foreground font-semibold">Inspiré du <a href="https://www.mattmahoney.net/barkley/" target='_blank' className='underline'>Barkley Marathons</a></span>, la Ultra Arena introduit
                        pour la première fois au monde le concept de backyard ultra à l'obstacle course racing.
                      </p>
                      <p>
                        <span className="text-amber-600 font-semibold">Le principe :</span> Chaque concurrent part pour un tour de 2km
                        avec 10+ obstacles extrêmes. Tu as 1h pour revenir. Si tu ne reviens pas à temps, tu es éliminé.
                        Tous ceux qui reviennent à temps repartent pour un nouveau tour, et ainsi de suite jusqu'à ce qu'il ne reste
                        qu'un seul concurrent.
                      </p>
                      <p>
                        Ce n'est pas une course de distance, <span className="text-foreground font-semibold">c'est un test de limites absolues</span>.
                        Mental, physique, stratégie de récupération : tout est mis à l'épreuve. Le dernier debout gagne.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-amber-500/5 p-4 ring-1 ring-amber-500/20">
                        <p className="text-xs uppercase tracking-wide text-amber-600">Format élimination</p>
                        <p className="mt-1 text-base font-semibold text-foreground">1h par tour maximum</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Pas d'arrivée en avance. Chaque tour démarre toutes les heures, peu importe quand tu reviens.
                          Gère ta récupération.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-amber-500/5 p-4 ring-1 ring-amber-500/20">
                        <p className="text-xs uppercase tracking-wide text-amber-600">Pré-requis</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Mental d'acier obligatoire</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Conçu pour les athlètes avec une préparation physique et mentale extrême. Ce format n'est pas recommandé pour les débutants.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-amber-500/5 p-4 ring-1 ring-amber-500/20">
                        <p className="text-xs uppercase tracking-wide text-amber-600">Objectif</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Le dernier debout gagne</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Pas de classement, pas de chrono. Un seul gagnant : celui qui reste quand tous les autres ont abandonné.
                        </p>
                      </div>
                    </div>
                  </>
                ) : isTribalKids ? (
                  <>
                    <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                      <p>
                        <span className="text-foreground font-semibold">Tribal Kids, c'est bien plus qu'une simple course</span> : c'est une aventure conçue pour initier les enfants à l'univers de l'obstacle course racing dans un cadre ludique, sécurisé et bienveillant.
                      </p>
                      <p>
                        <span className="text-purple-600 font-semibold">Notre approche :</span> Chaque parcours est adapté à l'âge et au développement physique des enfants. Les obstacles sont pensés pour être relevés avec plaisir et confiance, tout en développant coordination, courage et esprit d'équipe.
                      </p>
                      <p>
                        Les enfants découvrent <span className="text-foreground font-semibold">les valeurs Overbound</span> : dépassement de soi, entraide et fierté collective. Un souvenir marquant qui peut éveiller une passion pour le sport et l'aventure.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
                        <p className="text-xs uppercase tracking-wide text-purple-600">Parcours adapté</p>
                        <p className="mt-1 text-base font-semibold text-foreground">3 distances par âge</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          1 km pour les 6-8 ans, 2 km pour les 9-11 ans, 3 km pour les 12-14 ans. Chaque parcours est pensé pour leur niveau.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
                        <p className="text-xs uppercase tracking-wide text-purple-600">Sécurité maximale</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Obstacles sécurisés</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Tous les obstacles sont ludiques, progressifs et totalement sécurisés. Encadrement bienveillant et attentif.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
                        <p className="text-xs uppercase tracking-wide text-purple-600">Esprit collectif</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Entraide et fierté</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Les enfants apprennent à s'encourager mutuellement et à célébrer les réussites de chacun.
                        </p>
                      </div>
                    </div>
                  </>
                ) : isOrigin ? (
                  <>
                    <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                      <p>
                        <span className="text-foreground font-semibold">Origin, c'est l'essence même de l'OCR concentrée sur 6 km</span> : vitesse, explosivité et intensité pure du premier au dernier obstacle.
                      </p>
                      <p>
                        <span className="text-emerald-600 font-semibold">Format sprint :</span> La distance courte te permet de donner ton maximum sans retenue. Pas besoin de gérer ton effort sur la durée, juste de tout donner pendant 30 à 60 minutes d'effort intense.
                      </p>
                      <p>
                        C'est <span className="text-foreground font-semibold">le format idéal pour débuter</span> dans l'univers Overbound ou pour les athlètes confirmés qui recherchent la performance pure et le chrono. Accessible mais exigeant.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
                        <p className="text-xs uppercase tracking-wide text-emerald-600">Format explosif</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Court et intense</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          6 km de course où chaque mètre compte. Tu peux sprinter du début à la fin sans économiser ton énergie.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
                        <p className="text-xs uppercase tracking-wide text-emerald-600">Accessible</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Idéal pour débuter</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          La porte d'entrée parfaite dans l'univers Overbound. Distance accessible avec un vrai défi à relever.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
                        <p className="text-xs uppercase tracking-wide text-emerald-600">Performance</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Vise le chrono</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Format parfait pour battre tes records personnels et te mesurer aux meilleurs sur une distance explosive.
                        </p>
                      </div>
                    </div>
                  </>
                ) : isHorizon ? (
                  <>
                    <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                      <p>
                        <span className="text-foreground font-semibold">Horizon est le format de la progression</span> : 12 km qui combinent endurance cardio, technique sur obstacles et mental d'acier.
                      </p>
                      <p>
                        <span className="text-blue-600 font-semibold">Distance intermédiaire :</span> Ni trop courte pour sprinter, ni trop longue pour être réservée aux élites. C'est le format équilibré qui teste toutes tes qualités : cardio, force, technique et gestion d'effort.
                      </p>
                      <p>
                        <span className="text-foreground font-semibold">Tremplin vers l'élite :</span> Ce format est parfait pour ceux qui ont déjà fait le Origin et veulent monter en puissance. Avec 35 obstacles incluant des portés lourds répétés, c'est un vrai test de progression.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-blue-500/5 p-4 ring-1 ring-blue-500/20">
                        <p className="text-xs uppercase tracking-wide text-blue-600">Endurance</p>
                        <p className="mt-1 text-base font-semibold text-foreground">12 km d'effort soutenu</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Distance qui demande de la gestion d'effort et de la stratégie. Tu ne peux pas tout donner d'un coup.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-blue-500/5 p-4 ring-1 ring-blue-500/20">
                        <p className="text-xs uppercase tracking-wide text-blue-600">Technique</p>
                        <p className="mt-1 text-base font-semibold text-foreground">35 obstacles variés</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Mix complet : portés lourds, grip, agilité. Les obstacles se répètent et testent ta résistance à la fatigue.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-blue-500/5 p-4 ring-1 ring-blue-500/20">
                        <p className="text-xs uppercase tracking-wide text-blue-600">Progression</p>
                        <p className="mt-1 text-base font-semibold text-foreground">Vers les formats élite</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Le format parfait pour développer ton endurance et ta technique avant de passer aux formats extrêmes.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
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

              {/* Bouton "Quel format pour moi ?" - sauf pour Tribal Kids */}
              {!isTribalKids && (
                <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 p-8 shadow-lg">
                  <div className="flex items-start gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-card-foreground">Pas sûr de ton choix ?</h2>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Réponds à quelques questions et découvre le format Overbound qui correspond le mieux à ton niveau et tes objectifs.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full bga-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/trainings/what-race-for-me">
                      Quel format pour moi ?
                    </Link>
                  </Button>
                </div>
              )}

              <div className="rounded-3xl border border-border bg-card p-8">
                <h2 className="text-xl font-semibold text-card-foreground">
                  {isUltraArena ? 'Équipement requis' : isTribalKids ? 'Ce qu\'il faut prévoir' : isOrigin ? 'Équipement sprint' : isHorizon ? 'Équipement intermédiaire' : 'Matériel & équipement'}
                </h2>
                {isUltraArena ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-amber-500/5 p-4 ring-1 ring-amber-500/20">
                      <p className="text-xs uppercase tracking-wide text-amber-600 mb-2">Obligatoire</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Chaussures trail avec grip extrême</li>
                        <li>• Gants résistants (grip répété sur obstacles)</li>
                        <li>• Lampe frontale (tours de nuit)</li>
                        <li>• Ravitaillement personnel entre les tours</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Fortement recommandé</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Stratégie de récupération (massage, compression)</li>
                        <li>• Nutrition adaptée pour effort prolongé</li>
                        <li>• Mental d'acier et capacité à gérer la fatigue</li>
                      </ul>
                    </div>
                  </div>
                ) : isTribalKids ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
                      <p className="text-xs uppercase tracking-wide text-purple-600 mb-2">Pour les enfants</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Chaussures de sport confortables (baskets)</li>
                        <li>• Vêtements de sport adaptés à la météo</li>
                        <li>• Bouteille d'eau (ravitaillement sur place)</li>
                        <li>• Tenue de rechange pour après la course</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Pour les parents</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Présence d'un adulte responsable obligatoire</li>
                        <li>• Possibilité d'accompagner l'enfant sur le parcours</li>
                        <li>• Zones spectateurs pour encourager</li>
                        <li>• Vestiaires et douches disponibles sur place</li>
                      </ul>
                    </div>
                  </div>
                ) : isOrigin ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
                      <p className="text-xs uppercase tracking-wide text-emerald-600 mb-2">Essentiel</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Chaussures de trail ou running avec bon grip</li>
                        <li>• Gants recommandés pour les obstacles à grip</li>
                        <li>• Pas besoin de ravitaillement (course courte)</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Conseils</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Échauffement complet avant le départ</li>
                        <li>• Tenue légère pour favoriser la vitesse (😎)</li>
                        <li>• Prévois une tenue de rechange (tu vas être sale !)</li>
                      </ul>
                    </div>
                  </div>
                ) : isHorizon ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-blue-500/5 p-4 ring-1 ring-blue-500/20">
                      <p className="text-xs uppercase tracking-wide text-blue-600 mb-2">Obligatoire</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Chaussures de trail avec bon amorti et grip</li>
                        <li>• Gants robustes (obstacles répétés = usure)</li>
                        <li>• Système d'hydratation (sac à dos ou ceinture)</li>
                        <li>• Tenue technique anti-frottements</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recommandé</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Gel énergétique pour maintenir le niveau</li>
                        <li>• Compression musculaire (mollets, cuisses)</li>
                        <li>• Stratégie de gestion d'effort préparée</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <li>• Chaussures de training stable et grip antidérapant.</li>
                    <li>• Gants optionnels pour la traction et les manipulations répétées.</li>
                    <li>• Ceinture hydratation légère ou ravitaillement en libre-service sur zone.</li>
                    <li>• Tenue respirante et seconde peau pour limiter les frottements.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      <div className='relative bg-white'>
        <Image
          src='/images/decorations/mountain-vector.svg'
          alt='Décor montagne'
          width={1600}
          height={800}
          className='relative w-screen -mt-1 rotate-180'
          priority
        />
        <section className='bg-transparent'>
          <div className="w-full px-4 py-12 sm:px-6 xl:px-32">
            <SubHeadings
              title='Comparaison des formats'
              description='Découvrez comment ce format se positionne par rapport aux autres parcours Overbound'
              sx='text-black my-6'
            />

            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-2xl bg-card overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Format</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Distance</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Intensité</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Obstacles</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Niveau requis</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Temps estimé</th>
                  </tr>
                </thead>
                <tbody>
                  {FORMAT_TEMPLATES.filter(format => format.id !== 'ultra-arena').map((format) => {
                    const isCurrentFormat = format.id === getFormatConfig(params.id, race.name, race.format_template)?.id
                    return (
                      <tr
                        key={format.id}
                        className={`border-t border-border ${isCurrentFormat ? 'bg-primary/5 ring-2 ring-primary/30' : 'hover:bg-muted/30'} transition`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{format.name}</span>
                            {isCurrentFormat && (
                              <Badge variant="default" className="text-xs">Ce format</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format.statsCards.find(s => s.label === 'Distance')?.value || '-'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format.statsCards.find(s => s.label === 'Intensité')?.value || '-'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format.statsCards.find(s => s.label === 'Obstacles')?.value || '-'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format.prerequisites ? `${format.prerequisites.fitnessLevel}/10` : '-'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format.estimatedTimeMin && format.estimatedTimeMax
                            ? `${format.estimatedTimeMin}-${format.estimatedTimeMax} min`
                            : 'Variable'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Progression Path Section */}
        {(() => {
          const formatConfig = getFormatConfig(params.id, race.name, race.format_template)
          const progressionFrom = race.progression_from || formatConfig?.progressionFrom
          const progressionTo = race.progression_to || formatConfig?.progressionTo

          if ((!progressionFrom || progressionFrom.length === 0) && (!progressionTo || progressionTo.length === 0)) {
            return null
          }

          if (isUltraArena) {
            return;
          }

          return (
            <section>
              <div className="w-full px-4 py-12 sm:px-6 xl:px-32">
                <SubHeadings
                  title='Progression recommandée'
                  description='Voici comment ce format se positionne dans ton parcours Overbound'
                  sx='text-black my-6'
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
                  {/* From Formats */}
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground text-center mb-4">
                      Tu viens de
                    </p>
                    {progressionFrom && progressionFrom.length > 0 ? (
                      <>
                        {progressionFrom.map((formatId: string) => {
                          const fromFormat = FORMAT_TEMPLATES.find(f => f.id === formatId)
                          if (!fromFormat) return null
                          const distance = fromFormat.statsCards.find(s => s.label === 'Distance')?.value
                          return (
                            <div
                              key={formatId}
                              className="rounded-2xl border-2 border-border bg-card p-6 shadow-lg text-center"
                            >
                              <h3 className="text-lg font-bold text-foreground mb-1">
                                {fromFormat.name.split('(')[0].trim()}
                              </h3>
                              {distance && (
                                <p className="text-sm text-muted-foreground">{distance}</p>
                              )}
                            </div>
                          )
                        })}
                      </>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
                        <p className="text-sm text-muted-foreground italic">
                          Point de départ
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Current Format - Center */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                      <Badge className="bg-primary text-primary-foreground font-bold">
                        Tu es ici
                      </Badge>
                    </div>
                    <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-lg text-center">
                      <h3 className="text-2xl font-black text-foreground mb-2">
                        {race.name}
                      </h3>
                      {race.distance_km && (
                        <p className="text-lg text-primary font-semibold">
                          {race.distance_km} km
                        </p>
                      )}
                    </div>
                  </div>

                  {/* To Formats */}
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground text-center mb-4">
                      Prochaine étape
                    </p>
                    {progressionTo && progressionTo.length > 0 ? (
                      <>
                        {progressionTo.map((formatId: string) => {
                          const toFormat = FORMAT_TEMPLATES.find(f => f.id === formatId)
                          if (!toFormat) return null
                          const distance = toFormat.statsCards.find(s => s.label === 'Distance')?.value
                          return (
                            <div
                              key={formatId}
                              className="rounded-2xl border-2 border-border bg-card p-6 shadow-lg text-center"
                            >
                              <h3 className="text-lg font-bold text-foreground mb-1">
                                {toFormat.name.split('(')[0].trim()}
                              </h3>
                              {distance && (
                                <p className="text-sm text-muted-foreground">{distance}</p>
                              )}
                            </div>
                          )
                        })}
                      </>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
                        <p className="text-sm text-muted-foreground italic">
                          Objectif final
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* Gallery Link Section */}
        <section>
          <div className="w-full px-4 py-12 sm:px-6 xl:px-32">
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground">Découvre les obstacles</h2>
              <p className="mt-2 text-muted-foreground">
                Explore notre galerie d'obstacles pour visualiser ce qui t'attend sur le parcours
              </p>
            </div>
          </div>
        </section>

        {/* What You'll Get Section - Auto-scrolling Carousel */}
        <section className=" overflow-hidden">
          <div className="w-full py-12">
            <SubHeadings
              title='Ce que tu obtiendras en participant'
              description="Bien plus qu'une course, une expérience qui te transforme"
              sx='text-black my-6 px-4 py-12 sm:px-6 xl:px-32'
            />

            <div className="relative">
              <div className="flex gap-6 animate-scroll">
                {[...Array(2)].map((_, duplicateIndex) => (
                  <div key={duplicateIndex} className="flex gap-6">
                    {[
                      {
                        icon: '🏆',
                        title: 'Dépassement de soi',
                        description: 'Repousse tes limites',
                        photoUrl: '/images/images/man-looking-determined-staring-at-the-floor.avif'
                      },
                      {
                        icon: '🤝',
                        title: 'Esprit de tribu',
                        description: 'Une communauté soudée',
                        photoUrl: '/images/images/a-group-of-friends-celebrating-after-a-hard-obstacle.avif'
                      },
                      {
                        icon: '💪',
                        title: 'Progression mesurable',
                        description: 'Vois ton évolution',
                        photoUrl: '/images/images/a-big-tire-is-falling-upside-down-thanks-to-a-middle-aged-man.avif'
                      },
                      {
                        icon: '🎯',
                        title: 'Confiance en toi',
                        description: 'Gagne en assurance',
                        photoUrl: '/images/images/a-man-shouting-of-happiness-very-happy.avif'
                      },
                      {
                        icon: '🔥',
                        title: 'Souvenir inoubliable',
                        description: 'Une expérience qui marque',
                        photoUrl: '/images/images/young-man-carrying-wooden-logs.avif'
                      },
                      {
                        icon: '⚡',
                        title: 'Forme physique',
                        description: 'Améliore ta condition',
                        photoUrl: '/images/images/blond-lady-carrying-chains.avif'
                      },
                      {
                        icon: '🎖️',
                        title: 'Accomplissement',
                        description: 'La fierté du défi relevé',
                        photoUrl: '/images/images/young-lady-smiling-below-barbed-wires.avif'
                      },
                      {
                        icon: '👥',
                        title: 'Nouvelles amitiés',
                        description: 'Des liens forts',
                        photoUrl: '/images/images/a-group-of-friend-celebrating-after-a-race.avif'
                      },
                    ].map((item, index) => (
                      <div
                        key={`${duplicateIndex}-${index}`}
                        className="relative flex flex-col flex-shrink-0 w-80 h-80 items-start justify-end rounded-2xl border border-border p-6 hover:scale-105 transition-transform"
                      >
                        <Image 
                          src={item.photoUrl} 
                          alt={`photo représentant ${item.title}`}
                          width={1000}
                          height={1000}
                          className='absolute top-0 left-0 w-full h-full rounded-2xl object-center object-cover -z-1 hover:opacit-80'
                        />
                        <div className="text-4xl mb-3 z-1">{item.icon}</div>
                        <h3 className="text-lg font-bold text-foreground z-1">{item.title}</h3>
                        <p className="text-sm text-white/70 z-1">{item.description}</p>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent to-background/50" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="events">
          <div className="w-full px-4 py-12 sm:px-6 xl:px-32">
              <SubHeadings
                title='Événements associés'
                description='Retrouvez toutes les dates qui proposent ce format. Inscriptions limitées : choisissez votre arène.'
                sx='text-black my-6 lex-row! justify-between!'
              />

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
                        <span>Capacité limitée</span>
                        <span>Places limitées</span>
                      </div>
                      <Button className="mt-6 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                        <Link href={`/events/${event.id}`}>Voir l&apos;événement</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-background p-8 text-sm text-white">
                Aucune date n&apos;est programmée pour le moment. Rejoignez la newsletter pour être informé des prochaines ouvertures.
              </div>
            )}
          </div>
        </section>

        <Image
          src='/images/decorations/mountain-vector.svg'
          alt='Décor montagne'
          width={1600}
          height={800}
          className='relative w-screen -mb-1'
          priority
        />
      </div>
      {/* Format Comparison Table */}
    </main>
  )
}
