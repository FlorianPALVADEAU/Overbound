'use client'
import React, { useMemo } from 'react'
import Headings from '@/components/globals/Headings'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { isPublicObstacleVisible } from '@/lib/obstaclesVisibility'

interface ObstaclesOverviewProps {
    eventId?: string
    title?: string
    description?: string
    embedded?: boolean
}

const ObstaclesOverview = ({
    eventId = 'ultra-arena-2026',
    title = "Quelques obstacles",
    description = "Découvre une sélection d'obstacles emblématiques qui te mettront au défi lors de l'Overbound.",
    embedded = false,
}: ObstaclesOverviewProps) => {

    const { data, isLoading, isFetching } = useEventDetail(eventId)

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
        <section 
            className={
                embedded
                    ? "w-full py-12 sm:py-16"
                    : "w-full items-center justify-center gap-8 sm:gap-12 md:gap-16 lg:gap-20 xl:gap-24 py-12 sm:py-16 md:py-20 pt-20 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32"
            }
            style={embedded ? undefined : {backgroundColor: '#141414'}}
        >
            <div className={embedded ? 'container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8' : ''}>
            <div className='w-auto h-full flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-7 md:mb-8'>
                <Headings
                    title={title}
                    description={description}
                    sx='mb-4 sm:mb-6 md:mb-8'
                />

                {(isLoading || isFetching) ? (
                    <div className="w-full">
                        <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i}
                                    className={embedded ? "shrink-0 w-[88%] sm:w-[60%] lg:w-[42%]" : "shrink-0 w-[85%] sm:w-[70%] md:w-1/2 lg:w-1/3 xl:w-1/4"}
                                >
                                    <div className={embedded ? "h-56 sm:h-60 bg-neutral-700 rounded-lg sm:rounded-xl animate-pulse" : "h-64 sm:h-72 md:h-80 bg-neutral-700 rounded-lg sm:rounded-xl animate-pulse"}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full relative">
                        <Carousel
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className={embedded ? "-ml-2 sm:-ml-3 pb-14 sm:pb-16" : "-ml-2 sm:-ml-3 md:-ml-4 md:pb-20"}>
                                {obstacles?.map((obst, index) => (
                                    <CarouselItem 
                                        key={index} 
                                        className={embedded ? "pl-2 sm:pl-3 basis-[88%] sm:basis-[62%] lg:basis-[44%] xl:basis-[34%]" : "pl-2 sm:pl-3 md:pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4"}
                                    >
                                        <div className={embedded ? "relative h-56 sm:h-60 lg:h-64 rounded-lg sm:rounded-xl overflow-hidden bg-neutral-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" : "relative h-64 sm:h-72 md:h-80 lg:h-84 xl:h-80 rounded-lg sm:rounded-xl overflow-hidden bg-neutral-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"}>
                                            <img
                                                src={obst.image_url || 'https://images.unsplash.com/photo-1598702631024-b282c0fd96b2?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                                                alt={obst.name}
                                                className={`w-full h-full object-cover ${obst.image_url ? '' : 'blur-sm grayscale '}`}
                                                loading="lazy"
                                            />
                                            
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                                            
                                            {/* Obstacle info */}
                                            <div className={embedded ? "absolute bottom-0 left-0 right-0 p-3 text-white" : "absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white"}>
                                                <h3 className={embedded ? "font-semibold text-sm sm:text-base mb-1 line-clamp-2" : "font-semibold text-base sm:text-lg mb-1 line-clamp-2"}>
                                                    {obst.name}
                                                </h3>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            
                            {/* Navigation buttons - positionnés en bas à gauche */}
                            <div className={embedded ? "hidden md:block" : "hidden sm:block"}>
                                <CarouselPrevious 
                                    className="left-4 bottom-4 top-auto bg-[#26AA26] border-[#26AA26] hover:bg-[#1e8a1e] text-white shadow-lg" 
                                />
                                <CarouselNext 
                                    className="left-16 bottom-4 top-auto right-auto bg-[#26AA26] border-[#26AA26] hover:bg-[#1e8a1e] text-white shadow-lg" 
                                />
                            </div>
                        </Carousel>
                        
                        {/* Indicateur de swipe pour mobile */}
                        <div className="flex justify-center mt-4 sm:hidden">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <span>←</span>
                                <span>Glisse pour voir plus</span>
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            </div>
        </section>
    )
}

export default ObstaclesOverview
