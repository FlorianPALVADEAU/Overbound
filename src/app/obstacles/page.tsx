'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowRight,
  BadgeInfo,
  Filter,
  Mountain,
  Play,
  Search,
  Star,
  Target,
  Zap,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { useGetObstacles } from '../api/obstacles/obstaclesQueries'
import type { Obstacle } from '@/types/Obstacle'

const OBSTACLE_TYPES: Record<string, string> = {
  climbing: 'Escalade',
  jumping: 'Saut',
  crawling: 'Ramper',
  carrying: 'Porter',
  balance: 'Équilibre',
  strength: 'Force',
  endurance: 'Endurance',
  agility: 'Agilité',
  water: 'Aquatique',
  technical: 'Technique',
  mental: 'Mental',
  team: 'Équipe',
}

const typeColor = (type: string) => {
  const palette: Record<string, string> = {
    climbing: 'bg-orange-100 text-orange-700 border-orange-200',
    jumping: 'bg-blue-100 text-blue-700 border-blue-200',
    crawling: 'bg-amber-100 text-amber-700 border-amber-200',
    carrying: 'bg-purple-100 text-purple-700 border-purple-200',
    balance: 'bg-pink-100 text-pink-700 border-pink-200',
    strength: 'bg-red-100 text-red-700 border-red-200',
    endurance: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    agility: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    water: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    technical: 'bg-slate-100 text-slate-700 border-slate-200',
    mental: 'bg-violet-100 text-violet-700 border-violet-200',
    team: 'bg-lime-100 text-lime-700 border-lime-200',
  }
  return palette[type] ?? 'bg-neutral-100 text-neutral-700 border-neutral-200'
}

const difficultyBadge = (difficulty: number) => {
  if (difficulty <= 3) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (difficulty <= 6) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

const difficultyLabel = (difficulty: number) => {
  if (difficulty <= 3) return 'Facile'
  if (difficulty <= 6) return 'Intermédiaire'
  return 'Expert'
}

const heroImageSrc = 'https://images.unsplash.com/photo-1762544968153-b9b47435fefd?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

const ObstacleSkeleton = () => (
  <Card className='overflow-hidden'>
    <div className='h-48 animate-pulse bg-muted' />
    <CardHeader className='space-y-3'>
      <div className='h-6 w-1/2 animate-pulse rounded bg-muted' />
      <div className='flex gap-2'>
        <div className='h-5 w-20 animate-pulse rounded-full bg-muted' />
        <div className='h-5 w-16 animate-pulse rounded-full bg-muted' />
      </div>
    </CardHeader>
  </Card>
)

export default function ObstaclesPage() {
  const { data: obstacles, isLoading, isFetching, error } = useGetObstacles()
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const totalObstacles = obstacles?.length ?? 0
  const obstaclesWithVideo = obstacles?.filter((obstacle) => Boolean(obstacle.video_url)).length ?? 0
  const expertCount = obstacles?.filter((obstacle) => obstacle.difficulty >= 7).length ?? 0
  const averageDifficulty =
    totalObstacles > 0
      ? (obstacles || []).reduce((acc, obstacle) => acc + obstacle.difficulty, 0) / totalObstacles
      : 0

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
      <main className='min-h-screen bg-gradient-to-b from-background to-muted/20'>
        <div className='mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 text-center'>
          <div className='space-y-4'>
            <Zap className='mx-auto h-10 w-10 text-destructive' />
            <p className='text-sm text-muted-foreground'>
              Impossible de charger les obstacles pour le moment. Réessaie dans quelques minutes.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className='relative min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground'>
        <section className='relative isolate overflow-hidden py-20 sm:py-24'>
          <div className='absolute inset-0'>
            <Image
              src={heroImageSrc}
              alt='Athlète Overbound franchissant un obstacle'
              fill
              sizes='100vw'
              className='object-cover object-center'
              priority
            />
            <div className='pointer-events-none absolute inset-0 bg-background/35 backdrop-blur-[3px]' />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background' />
            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent' />
          </div>
          <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-3xl space-y-6 text-center lg:text-left'>
              <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
                Parcours Overbound
              </span>
              <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
                Explore nos obstacles signature
              </h1>
              <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
                Découvre les modules que tu franchiras lors des courses Overbound : murs, portés, suspensions,
                obstacles aquatiques… Chaque obstacle est noté selon sa difficulté et sa dominante physique.
              </p>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                  <Link href='#catalogue'>Voir le catalogue</Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
                >
                  <Link href='/events'>Trouver une course</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className='pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-70'>
            <Image
              src='/images/mountain-vector.svg'
              alt='Décor montagne'
              width={1600}
              height={800}
              className='w-[220%] max-w-none sm:w-[170%] md:w-[140%]'
              priority
            />
          </div>
        </section>

        <section
          id='catalogue'
          className='relative z-10 mx-auto flex w-screen flex-col gap-10 px-4 pb-16 sm:px-6 lg:px-8 lg:pt-16 !py-40 bg-accent-foreground'
        >
          <Image
            src='/images/mountain-vector.svg'
            alt='Illustration montagne'
            width={1200}
            height={600}
            className='pointer-events-none z-1 absolute -top-10 lg:top-[-1%] rotate-180 left-1/2 w-screen max-w-none -translate-x-1/2'
            priority
          />
          <div className='flex-col space-y-6'>
            <Card className='border-none bg-background/80 shadow-xl shadow-primary/10 backdrop-blur'>
              <CardContent className='flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between'>
                <div className='w-full max-w-xl space-y-3'>
                  <label htmlFor='search' className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
                    <Search className='h-4 w-4' />
                    Rechercher un obstacle
                  </label>
                  <Input
                    id='search'
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder='Mur de feu, Monkey bar, portés…'
                    className='h-12 text-base'
                  />
                </div>

                <div className='w-full space-y-3 lg:w-auto'>
                  <p className='flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                    <Filter className='h-4 w-4' />
                    Filtrer par dominante
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant={typeFilter === 'all' ? 'default' : 'outline'}
                      size='sm'
                      className='rounded-full'
                      onClick={() => setTypeFilter('all')}
                    >
                      Tous ({totalObstacles})
                    </Button>
                    {typesWithCount.map(([type, count]) => (
                      <Button
                        key={type}
                        variant={typeFilter === type ? 'default' : 'outline'}
                        size='sm'
                        className='rounded-full'
                        onClick={() => setTypeFilter(type)}
                      >
                        {OBSTACLE_TYPES[type] ?? type} ({count})
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>


            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
              {(isLoading || isFetching) &&
                Array.from({ length: 9 }).map((_, index) => <ObstacleSkeleton key={`skeleton-${index}`} />)}

              {!isLoading &&
                !isFetching &&
                filteredObstacles.map((obstacle) => (
                  <Card
                    key={obstacle.id}
                    className='group flex h-full flex-col cursor-pointer overflow-hidden border border-border/60 bg-background/90 shadow-lg shadow-primary/5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/20'
                    onClick={() => setSelectedObstacle(obstacle)}
                  >
                    <div className='relative h-48 overflow-hidden'>
                      {obstacle.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={obstacle.image_url}
                          alt={obstacle.name}
                          className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
                        />
                      ) : (
                        <div className='flex h-full items-center justify-center bg-muted'>
                          <Zap className='h-12 w-12 text-muted-foreground' />
                        </div>
                      )}
                      <div className='absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent opacity-0 transition group-hover:opacity-100' />
                      <div className='absolute inset-x-4 top-4 flex items-center justify-between gap-2'>
                        <Badge className={`${difficultyBadge(obstacle.difficulty)} border`}>
                          <Star className='mr-1 h-3 w-3' />
                          {obstacle.difficulty}/10
                        </Badge>
                        {obstacle.video_url ? (
                          <Badge variant='secondary' className='bg-black/80 text-white'>
                            <Play className='mr-1 h-3 w-3' />
                            Vidéo
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <CardHeader className='space-y-3 pb-3'>
                      <CardTitle className='text-xl font-semibold text-foreground'>{obstacle.name}</CardTitle>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant='outline' className={`${typeColor(obstacle.type)} border`}>
                          {OBSTACLE_TYPES[obstacle.type] ?? obstacle.type}
                        </Badge>
                        <Badge variant='outline' className={`${difficultyBadge(obstacle.difficulty)} border`}>
                          {difficultyLabel(obstacle.difficulty)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className='flex flex-1 flex-col justify-between space-y-4 text-sm text-muted-foreground'>
                      <p className='line-clamp-3 leading-relaxed'>
                        {obstacle.description ??
                          "Un obstacle emblématique de l'univers Overbound. Prépare-toi à tester ta technique et ton mental."}
                      </p>
                      <Button variant='ghost' className='group w-fit gap-2 px-0 text-primary' onClick={() => setSelectedObstacle(obstacle)}>
                        Voir les détails
                        <ArrowRight className='h-4 w-4 transition group-hover:translate-x-1' />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {!isLoading && filteredObstacles.length === 0 ? (
              <div className='rounded-3xl border border-dashed border-border/60 bg-background/80 p-10 text-center shadow-inner'>
                <BadgeInfo className='mx-auto mb-4 h-10 w-10 text-muted-foreground' />
                <p className='text-sm text-muted-foreground'>
                  Aucun obstacle ne correspond à ta recherche. Ajuste les filtres ou découvre tous les formats via nos
                  événements.
                </p>
              </div>
            ) : null}

            <Image
              src='/images/mountain-vector.svg'
              alt='Illustration montagne'
              width={1200}
              height={600}
              className='pointer-events-none absolute bottom-[-1%] left-1/2 w-screen max-w-none -translate-x-1/2'
              priority
            />
          </div>
        </section>

        <section className='relative z-10 bg-gradient-to-b from-background to-background/40 py-16 sm:py-20'>
          <div className='mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8'>
            <div className='grid gap-8 lg:grid-cols-2 lg:items-center'>
              <div className='space-y-4 text-center lg:text-left'>
                <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl'>
                  Envie de tester ces obstacles en conditions réelles ?
                </h2>
                <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
                  Inscris-toi à une course Overbound ou participe à nos sessions d’entraînement encadrées pour maîtriser
                  chaque franchissement.
                </p>
              </div>
              <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
                <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                  <Link href='/events'>Voir les prochains événements</Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
                >
                  <Link href='/contact'>Contacter le support</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={!!selectedObstacle} onOpenChange={() => setSelectedObstacle(null)}>
        <DialogContent className='w-full max-w-[90vw] overflow-hidden border-border/60 bg-background/95 p-0 backdrop-blur sm:max-w-4xl lg:max-w-5xl'>
          {selectedObstacle && (
            <>
              <DialogHeader className='space-y-3 px-6 pt-6'>
                <DialogTitle className='flex flex-wrap items-center gap-3 text-2xl font-bold'>
                  {selectedObstacle.name}
                  <Badge className={`${difficultyBadge(selectedObstacle.difficulty)} border`}>
                    <Star className='mr-1 h-3 w-3' />
                    {selectedObstacle.difficulty}/10 – {difficultyLabel(selectedObstacle.difficulty)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className='space-y-6 px-6 pb-8'>
                <div className='relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 md:h-80'>
                  {selectedObstacle.video_url ? (
                    <iframe
                      className='h-full w-full'
                      src={selectedObstacle.video_url.replace('watch?v=', 'embed/')}
                      title={`Vidéo ${selectedObstacle.name}`}
                      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                      referrerPolicy='strict-origin-when-cross-origin'
                      allowFullScreen
                    />
                  ) : selectedObstacle.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedObstacle.image_url} alt={selectedObstacle.name} className='h-full w-full object-cover' />
                  ) : (
                    <div className='flex h-full items-center justify-center'>
                      <Zap className='h-16 w-16 text-primary/40' />
                    </div>
                  )}
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                  <Card className='border border-border/60 bg-background/80 shadow-inner'>
                    <CardHeader>
                      <CardTitle className='text-lg'>Informations clés</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline' className={`${typeColor(selectedObstacle.type)} border`}>
                          {OBSTACLE_TYPES[selectedObstacle.type] ?? selectedObstacle.type}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Target className='h-4 w-4 text-primary' />
                        <span>
                          Dominante :{' '}
                          <strong className='text-foreground'>
                            {OBSTACLE_TYPES[selectedObstacle.type] ?? selectedObstacle.type}
                          </strong>
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border border-border/60 bg-background/80 shadow-inner'>
                    <CardHeader>
                      <CardTitle className='text-lg'>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {selectedObstacle.video_url ? (
                        <Button
                          variant='outline'
                          className='w-full justify-start'
                          onClick={() => window.open(selectedObstacle.video_url ?? '', '_blank')}
                        >
                          <Play className='mr-2 h-4 w-4' />
                          Voir la vidéo complète
                        </Button>
                      ) : null}
                      <Button
                        variant='outline'
                        className='w-full justify-start'
                        onClick={() => window.open(window.location.href, '_blank')}
                      >
                        <ExternalLink className='mr-2 h-4 w-4' />
                        Partager cet obstacle
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {selectedObstacle.description ? (
                  <div className='space-y-3'>
                    <h3 className='text-lg font-semibold'>Description</h3>
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {selectedObstacle.description}
                    </p>
                  </div>
                ) : null}

                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold'>Conseils pour réussir</h3>
                  <div className='rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary/80'>
                    <ul className='space-y-2'>
                      <li>• Échauffe tes épaules, poignets et hanches avant d&apos;aborder l&apos;obstacle.</li>
                      <li>• Observe la technique des coaches ou des athlètes expérimentés.</li>
                      <li>• Cherche la fluidité plutôt que la force brute : respire et anticipe chaque prise.</li>
                      <li>• Respecte les consignes sécurité et n&apos;hésite pas à recommencer pour progresser.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
