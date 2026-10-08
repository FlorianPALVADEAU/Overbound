'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { OBSTACLE_TYPES, difficultyLabel } from '@/components/obstacles/obstacleLabels'

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
  const { data: obstacles, isLoading, isFetching, error } = useGetObstacles()
  const { data: featuredEventData } = useFeaturedEvent()
  const featuredEvent = featuredEventData?.event
  const featuredEventHref = featuredEvent ? `/events/${featuredEvent.slug}` : '/'
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const searchParams = useSearchParams()
  const deepLinkObstacleId = searchParams.get('obstacle')

  useEffect(() => {
    if (!deepLinkObstacleId || !obstacles) return
    const match = obstacles.find((obstacle) => obstacle.id === deepLinkObstacleId)
    if (match) setSelectedObstacle(match)
  }, [deepLinkObstacleId, obstacles])

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
      <main className="flex min-h-screen items-center justify-center bg-[#141414] px-6 text-center">
        <div className="space-y-4">
          <Zap className="mx-auto h-10 w-10 text-primary" />
          <p className="text-sm text-neutral-300">
            Impossible de charger les obstacles pour le moment. Réessaie dans quelques minutes.
          </p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="relative min-h-screen bg-[#141414] text-white">
        <section className="relative isolate overflow-hidden py-20 sm:py-24">
          <div className="absolute inset-0">
            <Image
              src="/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif"
              alt="Athlète Overbound franchissant un obstacle"
              fill
              sizes="100vw"
              className="object-cover object-bottom"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-black/50" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#141414]" />
          </div>
          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center justify-center rounded-full bg-primary/20 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-primary sm:text-sm">
                Parcours Overbound
              </span>
              <h1 className="text-balance break-words text-3xl font-black tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Les obstacles qui t&apos;attendent sur la boucle
              </h1>
              <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">
                Murs, portés, suspensions, obstacles aquatiques… chaque module est noté selon sa
                difficulté et sa dominante physique. Tu les retrouveras tous, tour après tour.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-12 w-full sm:w-auto">
                  <Link href="#catalogue">Voir le catalogue</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                >
                  <Link href={featuredEventHref}>Voir la prochaine édition</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="catalogue" className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mb-5 flex flex-col justify-center gap-6 sm:gap-8">
            <div className="w-full space-y-2">
              <label htmlFor="search" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                <Search className="h-4 w-4" />
                Rechercher un obstacle
              </label>
              <Input
                id="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Mur, Monkey bar, portés…"
                className="h-12 border-white/15 bg-white/5 text-base text-white placeholder:text-neutral-500 focus-visible:border-primary focus-visible:ring-primary/40"
              />
            </div>

            {/* <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  typeFilter === 'all'
                    ? 'border-primary bg-primary text-white'
                    : 'border-white/15 bg-white/5 text-neutral-300 hover:border-white/30 hover:text-white'
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
                      : 'border-white/15 bg-white/5 text-neutral-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {OBSTACLE_TYPES[type] ?? type} ({count})
                </button>
              ))}
            </div> */}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(isLoading || isFetching) &&
              Array.from({ length: 9 }).map((_, index) => <ObstacleSkeleton key={`skeleton-${index}`} />)}

            {!isLoading &&
              !isFetching &&
              filteredObstacles.map((obstacle) => (
                <button
                  key={obstacle.id}
                  type="button"
                  onClick={() => setSelectedObstacle(obstacle)}
                  className="group relative h-72 overflow-hidden rounded-2xl bg-neutral-800 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-primary/20"
                >
                  {obstacle.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={obstacle.image_url}
                      alt={obstacle.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                      <Zap className="h-12 w-12 text-neutral-600" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                    <Badge className="border-0 bg-primary text-white">
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
                    <h3 className="text-xl font-black text-white">{obstacle.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {OBSTACLE_TYPES[obstacle.type] ?? obstacle.type}
                      </span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {difficultyLabel(obstacle.difficulty)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-200">
                      Voir les détails
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              ))}
          </div>

          {!isLoading && filteredObstacles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
              <BadgeInfo className="mx-auto mb-4 h-10 w-10 text-neutral-400" />
              <p className="text-sm text-neutral-300">
                Aucun obstacle ne correspond à ta recherche. Ajuste les filtres pour voir tout le
                catalogue.
              </p>
            </div>
          ) : null}
        </section>

        <section className="relative z-10 border-t border-white/10 bg-[#0d0d0d] py-16 sm:py-20">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="text-2xl font-black sm:text-3xl md:text-4xl">
                  Envie de tester ces obstacles en conditions réelles ?
                </h2>
                <p className="text-sm leading-relaxed text-neutral-300 sm:text-base">
                  Inscris-toi à une course Overbound ou participe à nos sessions d&apos;entraînement
                  encadrées pour maîtriser chaque franchissement.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button asChild size="lg" className="h-12 w-full sm:w-auto">
                  <Link href={featuredEventHref}>Voir la prochaine édition</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                >
                  <Link href="/contact">Contacter le support</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ObstacleDetailDialog obstacle={selectedObstacle} onOpenChange={() => setSelectedObstacle(null)} />
    </>
  )
}
