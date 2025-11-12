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

  // Detect race formats
  const isTribalRoyale = params.id === 'tribale-royale' || race.name?.toLowerCase().includes('tribal royale')
  const isTribalKids = params.id === 'tribale-kids' || race.name?.toLowerCase().includes('tribal kids')
  const isRiteDuGuerrier = params.id === 'rite-du-guerrier' || race.name?.toLowerCase().includes('rite du guerrier')
  const isVoieDuHeros = params.id === 'voie-du-heros' || race.name?.toLowerCase().includes('voie du héros')

  const statsCards = isTribalRoyale
    ? [
        {
          label: 'Format',
          value: 'Backyard OCR',
          icon: Flag,
          helper: 'Premier format backyard appliqué à l\'OCR au monde',
        },
        {
          label: 'Intensité',
          value: '10/10',
          icon: Flame,
          helper: 'Mental et physique extrême',
        },
        {
          label: 'Distance',
          value: '∞ km',
          icon: Mountain,
          helper: 'Élimination progressive - le dernier debout gagne',
        },
        {
          label: 'Obstacles',
          value: '∞ obstacles',
          icon: Zap,
          helper: 'Répétés jusqu\'à élimination complète',
        },
      ]
    : isTribalKids
    ? [
        {
          label: 'Format',
          value: 'Famille',
          icon: Flag,
          helper: 'Course d\'obstacles ludique pour les 6-14 ans',
        },
        {
          label: 'Âge',
          value: '6-14 ans',
          icon: Target,
          helper: '3 parcours adaptés par tranche d\'âge',
        },
        {
          label: 'Distance',
          value: '1 / 2 / 3 km',
          icon: Mountain,
          helper: 'Selon l\'âge et le niveau de l\'enfant',
        },
        {
          label: 'Obstacles',
          value: '15 obstacles',
          icon: Zap,
          helper: 'Ludiques, sécurisés et progressifs',
        },
      ]
    : isRiteDuGuerrier
    ? [
        {
          label: 'Format',
          value: 'Sprint',
          icon: Flag,
          helper: 'Format court et explosif - idéal pour débuter en OCR',
        },
        {
          label: 'Intensité',
          value: '7/10',
          icon: Flame,
          helper: 'Accessible mais intense - explosivité et cardio',
        },
        {
          label: 'Distance',
          value: '6 km',
          icon: Mountain,
          helper: 'Distance idéale pour donner tout sans retenue',
        },
        {
          label: 'Obstacles',
          value: '20 obstacles',
          icon: Zap,
          helper: 'Mix équilibré entre technique et puissance',
        },
      ]
    : isVoieDuHeros
    ? [
        {
          label: 'Format',
          value: 'Intermédiaire',
          icon: Flag,
          helper: 'Distance médium - endurance et technique combinées',
        },
        {
          label: 'Intensité',
          value: '8/10',
          icon: Flame,
          helper: 'Exigeant - test d\'endurance et de mental',
        },
        {
          label: 'Distance',
          value: '12 km',
          icon: Mountain,
          helper: 'Endurance nécessaire avec gestion d\'effort',
        },
        {
          label: 'Obstacles',
          value: '35 obstacles',
          icon: Zap,
          helper: 'Portés lourds et obstacles techniques répétés',
        },
      ]
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
                {isTribalRoyale ? (
                  <div className="mt-4 space-y-3">
                    <Badge className="bg-amber-500 text-white font-bold text-sm">
                      PREMIÈRE MONDIALE - Format Backyard OCR
                    </Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground">
                      <span className="text-foreground font-semibold">Du jamais vu dans l'OCR :</span> Le premier format backyard appliqué aux courses d'obstacles.
                      Inspiré du légendaire Barkley Marathons, la Tribal Royale n'a pas de distance fixe.
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
                ) : isRiteDuGuerrier ? (
                  <div className="mt-4 space-y-3">
                    <Badge className="bg-emerald-500 text-white font-bold text-sm">
                      FORMAT SPRINT - 6 km
                    </Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground">
                      <span className="text-foreground font-semibold">L'initiation explosive à l'OCR :</span> Le Rite du Guerrier est le format parfait pour découvrir l'univers Overbound ou viser un chrono explosif.
                    </p>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      <span className="text-emerald-600 font-semibold">6 km, 20 obstacles.</span> Distance courte mais intense qui te permet de donner ton maximum du début à la fin.
                      Accessible aux débutants motivés tout en offrant un vrai défi pour les athlètes confirmés qui cherchent la performance pure.
                    </p>
                  </div>
                ) : isVoieDuHeros ? (
                  <div className="mt-4 space-y-3">
                    <Badge className="bg-blue-500 text-white font-bold text-sm">
                      FORMAT INTERMÉDIAIRE - 12 km
                    </Badge>
                    <p className="text-xl leading-relaxed text-muted-foreground">
                      <span className="text-foreground font-semibold">Le défi équilibré :</span> La Voie du Héros combine endurance, technique et mental pour un test complet de tes capacités.
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
                <h2 className="text-2xl font-bold text-card-foreground">
                  {isTribalRoyale ? 'Le concept Backyard OCR' : isTribalKids ? 'L\'esprit Tribal Kids' : isRiteDuGuerrier ? 'L\'esprit Sprint' : isVoieDuHeros ? 'Philosophie de la progression' : 'Philosophie du format'}
                </h2>
                {isTribalRoyale ? (
                  <>
                    <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                      <p>
                        <span className="text-foreground font-semibold">Inspiré du Barkley Marathons</span>, la Tribal Royale introduit
                        pour la première fois au monde le concept de backyard ultra à l'obstacle course racing.
                      </p>
                      <p>
                        <span className="text-amber-600 font-semibold">Le principe :</span> Chaque concurrent part pour un tour de 4 km
                        avec 15+ obstacles extrêmes. Tu as 1h pour revenir. Si tu ne reviens pas à temps, tu es éliminé.
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
                        <p className="mt-1 text-base font-semibold text-foreground">Niveau élite obligatoire</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Réservé aux athlètes d'élite avec une expérience OCR confirmée. Préparation mentale et physique extrême requise.
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
                ) : isRiteDuGuerrier ? (
                  <>
                    <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                      <p>
                        <span className="text-foreground font-semibold">Le Rite du Guerrier, c'est l'essence même de l'OCR concentrée sur 6 km</span> : vitesse, explosivité et intensité pure du premier au dernier obstacle.
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
                ) : isVoieDuHeros ? (
                  <>
                    <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                      <p>
                        <span className="text-foreground font-semibold">La Voie du Héros est le format de la progression</span> : 12 km qui combinent endurance cardio, technique sur obstacles et mental d'acier.
                      </p>
                      <p>
                        <span className="text-blue-600 font-semibold">Distance intermédiaire :</span> Ni trop courte pour sprinter, ni trop longue pour être réservée aux élites. C'est le format équilibré qui teste toutes tes qualités : cardio, force, technique et gestion d'effort.
                      </p>
                      <p>
                        <span className="text-foreground font-semibold">Tremplin vers l'élite :</span> Ce format est parfait pour ceux qui ont déjà fait le Rite du Guerrier et veulent monter en puissance. Avec 35 obstacles incluant des portés lourds répétés, c'est un vrai test de progression.
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
                <h2 className="text-2xl font-bold text-card-foreground">
                  {isTribalRoyale ? 'Obstacles extrêmes' : isTribalKids ? 'Obstacles ludiques' : isRiteDuGuerrier ? 'Obstacles explosifs' : isVoieDuHeros ? 'Obstacles techniques' : 'Obstacles signature'}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isTribalRoyale
                    ? '15+ obstacles extrêmes conçus pour tester tes limites absolues. Grip, portés lourds, technique : chaque obstacle est un test. Tu les répéteras tour après tour jusqu\'à élimination.'
                    : isTribalKids
                    ? '15 obstacles ludiques et sécurisés qui permettent aux enfants de développer leur coordination, leur confiance et leur courage dans un cadre amusant et progressif.'
                    : isRiteDuGuerrier
                    ? '20 obstacles variés qui mettent à l\'épreuve force, agilité et coordination. Sur un sprint, chaque seconde compte : maîtrise la technique pour enchainer sans perdre de temps.'
                    : isVoieDuHeros
                    ? '35 obstacles répétés qui testent ta résistance à la fatigue. Portés lourds, grip prolongé, escalades : les mêmes obstacles reviennent et deviennent de plus en plus durs à mesure que la fatigue s\'installe.'
                    : 'Une sélection d\'ateliers techniques et puissants conçus pour tester chaque groupe musculaire. Concentrez-vous sur la posture et l\'explosivité pour gagner un temps précieux.'}
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
                  {isTribalRoyale ? 'Équipement requis' : isTribalKids ? 'Ce qu\'il faut prévoir' : isRiteDuGuerrier ? 'Équipement sprint' : isVoieDuHeros ? 'Équipement intermédiaire' : 'Matériel & équipement'}
                </h2>
                {isTribalRoyale ? (
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
                ) : isRiteDuGuerrier ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
                      <p className="text-xs uppercase tracking-wide text-emerald-600 mb-2">Essentiel</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Chaussures de trail ou running avec bon grip</li>
                        <li>• Tenue de sport légère et respirante</li>
                        <li>• Gants recommandés pour les obstacles à grip</li>
                        <li>• Pas besoin de ravitaillement (course courte)</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-background/40 p-4 ring-1 ring-border">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Conseils</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Échauffement complet avant le départ</li>
                        <li>• Tenue légère pour favoriser la vitesse</li>
                        <li>• Prévois une tenue de rechange (tu vas être sale !)</li>
                      </ul>
                    </div>
                  </div>
                ) : isVoieDuHeros ? (
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
