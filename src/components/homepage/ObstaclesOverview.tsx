'use client'
import React, { useMemo, useState } from 'react'
import { Container, Section, SectionHeader } from '@/components/ds'
import { CardCarousel } from '@/components/shared/CardCarousel'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { isPublicObstacleVisible } from '@/lib/obstaclesVisibility'
import { ZoomIn } from 'lucide-react'
import { ObstacleDetailDialog } from '@/components/obstacles/ObstacleDetailDialog'
import type { Obstacle } from '@/types/Obstacle'

interface ObstaclesOverviewProps {
    eventId?: string
    title?: string
    description?: string
    embedded?: boolean
    /** Same gutters and max width as the event landing sections. */
    constrained?: boolean
}

const ObstaclesOverview = ({
    eventId = 'ultra-arena-2026',
    title = "Les obstacles Overbound",
    description = "Découvre une sélection d'obstacles emblématiques qui te mettront au défi lors de l'Overbound.",
    embedded = false,
    constrained = false,
}: ObstaclesOverviewProps) => {

    const { data, isLoading, isFetching } = useEventDetail(eventId)
    const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)

    const obstacles = useMemo(() => {
        const tickets = (data?.event?.tickets as any[] | undefined) ?? []
        const collected = tickets.flatMap((ticket) =>
            (ticket?.race?.obstacles ?? []).map((entry: any) => entry?.obstacle).filter(Boolean) ?? []
        )

        const uniqueObstacles = new Map<string, (typeof collected)[number]>()
        collected.forEach((obstacle) => {
            if (!isPublicObstacleVisible(obstacle?.name)) return
            if (obstacle?.id && !uniqueObstacles.has(obstacle.id)) {
                uniqueObstacles.set(obstacle.id, obstacle)
            }
        })

        const deduped = Array.from(uniqueObstacles.values())
        const withIndex = deduped.map((obstacle, index) => ({ obstacle, index }))

        withIndex.sort((a, b) => {
            const aHasPhoto = Boolean(a.obstacle.image_url)
            const bHasPhoto = Boolean(b.obstacle.image_url)
            if (aHasPhoto !== bHasPhoto) {
                return aHasPhoto ? -1 : 1
            }
            return a.index - b.index
        })

        return withIndex.map(({ obstacle }) => obstacle)
    }, [data])

    return (
        <Section spacing={embedded ? "compact" : "default"}>
            <Container>
                <div className="flex h-full w-auto flex-col items-center justify-center gap-6">
                    <SectionHeader title={title} lead={description} flush className="max-w-none self-start" />

                    <p className="-mt-2 flex flex-col gap-0.5 self-start border-l-2 border-primary pl-3 text-xs leading-snug text-muted-foreground sm:-mt-4 sm:flex-row sm:items-baseline sm:gap-2 sm:rounded-full sm:border sm:border-border sm:bg-foreground/5 sm:px-3 sm:py-1.5">
                        <span className="shrink-0 font-semibold text-foreground">Adapté aux femmes</span>
                        <span>Chaque obstacle a une variante ajustée (hauteur, prise, charge).</span>
                    </p>

                {(isLoading || isFetching) ? (
                    <div className="w-full">
                        <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i}
                                    className={embedded ? "shrink-0 w-[88%] sm:w-[60%] lg:w-[42%]" : "shrink-0 w-[85%] sm:w-[70%] md:w-1/2 lg:w-1/3 xl:w-1/4"}
                                >
                                    <div className={embedded ? "h-56 sm:h-60 bg-muted rounded-2xl animate-pulse" : "h-64 sm:h-72 md:h-80 bg-muted rounded-2xl animate-pulse"}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <CardCarousel
                        roomy={constrained}
                        autoplayMs={constrained ? 4000 : undefined}
                        items={obstacles ?? []}
                        getKey={(_, index) => index}
                        contentClassName={embedded ? "-ml-2 sm:-ml-3 pb-14 sm:pb-16" : constrained ? "-ml-2 sm:-ml-3 md:-ml-4 pb-20" : "-ml-2 sm:-ml-3 md:-ml-4 md:pb-20"}
                        itemClassName={embedded ? "pl-2 sm:pl-3 basis-[88%] sm:basis-[62%] lg:basis-[44%] xl:basis-[34%]" : "pl-2 sm:pl-3 md:pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4"}
                        navVisibilityClassName={embedded ? "hidden md:block" : "hidden sm:block"}
                        renderItem={(obst) => (
                            <button
                                type="button"
                                onClick={() => setSelectedObstacle(obst)}
                                className={`group text-left w-full ${embedded ? "relative h-56 sm:h-60 lg:h-64 rounded-2xl overflow-hidden bg-card shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" : "relative h-64 sm:h-72 md:h-80 lg:h-84 xl:h-80 rounded-2xl overflow-hidden bg-card shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"}`}
                            >
                                <img
                                    src={obst.image_url || 'https://images.unsplash.com/photo-1598702631024-b282c0fd96b2?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                                    alt={obst.name}
                                    className={`w-full h-full object-cover ${obst.image_url ? '' : 'blur-sm grayscale '}`}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-surface-deep/70 via-surface-deep/10 to-transparent"></div>
                                <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-deep/60 text-foreground backdrop-blur-sm transition group-hover:bg-surface-deep/80">
                                    <ZoomIn className="h-4 w-4" />
                                </span>
                                <div className={embedded ? "absolute bottom-0 left-0 right-0 p-3 text-foreground" : "absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-foreground"}>
                                    <h3 className={embedded ? "font-semibold text-sm sm:text-base mb-1 line-clamp-2" : "font-semibold text-base sm:text-lg mb-1 line-clamp-2"}>
                                        {obst.name}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/80">
                                        Voir les détails
                                    </span>
                                </div>
                            </button>
                        )}
                    />
                )}

                </div>
            </Container>
            <ObstacleDetailDialog obstacle={selectedObstacle} onOpenChange={() => setSelectedObstacle(null)} />
        </Section>
    )
}

export default ObstaclesOverview
