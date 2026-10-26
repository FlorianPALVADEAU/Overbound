'use client'

import { COVER } from '@/constants/coverImages'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, BadgeInfo, Play, Search, Star, Zap } from 'lucide-react'
import { useGetObstacles } from '../api/obstacles/obstaclesQueries'
import type { Obstacle } from '@/types/Obstacle'
import AnimatedBanner from '@/components/homepage/AnimatedBanner'
import { PARTNERS_DATA } from '@/datas/Partners'
import { useFeaturedEvent } from '../api/events/featured/featuredEventQueries'
import { ObstacleDetailDialog } from '@/components/obstacles/ObstacleDetailDialog'
import { ObstaclePhoto } from '@/components/obstacles/ObstaclePhoto'
import { OBSTACLE_TYPES, difficultyLabel } from '@/components/obstacles/obstacleLabels'
import { PageHero } from '@/components/hero/PageHero'
import { Container, Section, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

const ObstacleSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
    <div className="h-56 animate-pulse bg-white/10" />
    <div className="space-y-3 p-5">
      <div className="h-5 w-1/2 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
    </div>
  </div>
)

export default function ObstaclesPage() {
  const { data: obstacles, isLoading, error } = useGetObstacles()
  const { data: featuredEventData } = useFeaturedEvent()
  const featuredEvent = featuredEventData?.event
  const featuredEventHref = featuredEvent ? `/events/${featuredEvent.slug}` : '/'
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // ?obstacle=<id> opens its detail. Read after mount rather than with
  // useSearchParams, which would drop the whole page out of the server HTML.
  useEffect(() => {
    const deepLinkObstacleId = new URLSearchParams(window.location.search).get('obstacle')
    if (!deepLinkObstacleId || !obstacles) return
    const match = obstacles.find((obstacle) => obstacle.id === deepLinkObstacleId)
    if (match) setSelectedObstacle(match)
  }, [obstacles])

  const totalObstacles = obstacles?.length ?? 0

  const typesWithCount = useMemo(() => {
    const map = new Map<string, number>()
    obstacles?.forEach((obstacle) => {
      map.set(obstacle.type, (map.get(obstacle.type) ?? 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [obstacles])

  const filteredObstacles = useMemo(() => {
    if (!obstacles) return []
    const query = search.trim().toLowerCase()

    return obstacles
      .filter((obstacle) => {
        if (typeFilter !== 'all' && obstacle.type !== typeFilter) return false
        if (!query) return true
        const haystack = `${obstacle.name} ${obstacle.description ?? ''} ${
          OBSTACLE_TYPES[obstacle.type] ?? obstacle.type
        }`.toLowerCase()
        return haystack.includes(query)
      })
      .sort((a, b) => b.difficulty - a.difficulty)
  }, [obstacles, search, typeFilter])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="space-y-4">
          <Zap className="mx-auto h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Impossible de charger les obstacles pour le moment. Réessaie dans quelques minutes.
          </p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="relative min-h-screen bg-background text-foreground">
        <PageHero
          image={{ src: COVER.pages.obstacles, alt: 'Athlète Overbound franchissant un obstacle', position: '50% 100%' }}
          eyebrow="Parcours Overbound"
          title="Les obstacles qui t'attendent sur la boucle"
          description="Chaque module est noté selon sa difficulté et sa dominante physique."
          actions={
            <>
              <Button asChild size="cta" className="w-full sm:w-auto">
                <Link href="#catalogue">Voir le catalogue</Link>
              </Button>
              <Button
                asChild
                variant="outline-on-photo"
                size="cta"
                className="w-full sm:w-auto"
              >
                <Link href={featuredEventHref}>Voir la prochaine édition</Link>
              </Button>
            </>
          }
        />

        <Section id="catalogue">
          <Container>
          {/* Cards are h3: this keeps the outline h1 > h2 > h3. */}
          <h2 className="sr-only">Catalogue des obstacles</h2>
          <div className="mb-5 flex flex-col justify-center gap-6 sm:gap-8">
            <div className="w-full space-y-2">
              <label htmlFor="search" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Search className="h-4 w-4" />
                Rechercher un obstacle
              </label>
              <Input
                id="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Mur, Monkey bar, portés…"
                className="h-12 border-white/15 bg-white/5 text-base text-white placeholder:text-subtle focus-visible:border-primary focus-visible:ring-primary/40"
              />
            </div>

            {/* <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  typeFilter === 'all'
                    ? 'border-primary bg-primary text-white'
                    : 'border-white/15 bg-white/5 text-muted-foreground hover:border-white/30 hover:text-white'
                }`}
              >
                Tous ({totalObstacles})
              </button>
              {typesWithCount.map(([type, count]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    typeFilter === type
                      ? 'border-primary bg-primary text-white'
                      : 'border-white/15 bg-white/5 text-muted-foreground hover:border-white/30 hover:text-white'
                  }`}
                >
                  {OBSTACLE_TYPES[type] ?? type} ({count})
                </button>
              ))}
            </div> */}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading &&
              Array.from({ length: 9 }).map((_, index) => <ObstacleSkeleton key={`skeleton-${index}`} />)}

            {!isLoading &&
              filteredObstacles.map((obstacle) => (
                <button
                  key={obstacle.id}
                  type="button"
                  onClick={() => setSelectedObstacle(obstacle)}
                  className="group relative h-72 overflow-hidden rounded-2xl bg-card text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-primary/20"
                >
                  {obstacle.image_url ? (
                    <ObstaclePhoto
                      url={obstacle.image_url}
                      alt={obstacle.name}
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-card">
                      <Zap className="h-12 w-12 text-subtle" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                    <Badge className="border-0 bg-primary text-primary-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      {obstacle.difficulty}/10
                    </Badge>
                    {obstacle.video_url ? (
                      <Badge className="border-0 bg-black/70 text-white">
                        <Play className="mr-1 h-3 w-3" />
                        Vidéo
                      </Badge>
                    ) : null}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
                    <h3 className={cn(DISPLAY_TITLE, 'text-title text-white')}>{obstacle.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-label font-semibold uppercase text-white">
                        {OBSTACLE_TYPES[obstacle.type] ?? obstacle.type}
                      </span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-label font-semibold uppercase text-white">
                        {difficultyLabel(obstacle.difficulty)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                      Voir les détails
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              ))}
          </div>

          {!isLoading && filteredObstacles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
              <BadgeInfo className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucun obstacle ne correspond à ta recherche. Ajuste les filtres pour voir tout le
                catalogue.
              </p>
            </div>
          ) : null}
          </Container>
        </Section>

        <Section tone="deep" spacing="spacious" className="border-t border-primary/40">
          <Container className="flex flex-col gap-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>
                  Envie de tester ces obstacles en conditions réelles ?
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Inscris-toi à une course Overbound ou participe à nos sessions d&apos;entraînement
                  encadrées pour maîtriser chaque franchissement.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button asChild size="cta" className="w-full sm:w-auto">
                  <Link href={featuredEventHref}>Voir la prochaine édition</Link>
                </Button>
                <Button
                  asChild
                  variant="outline-on-photo"
                  size="cta"
                  className="w-full sm:w-auto"
                >
                  <Link href="/contact">Contacter le support</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <ObstacleDetailDialog obstacle={selectedObstacle} onOpenChange={() => setSelectedObstacle(null)} />
    </>
  )
}
