/* eslint-disable @next/next/no-img-element */
'use client'
import React from 'react'
import Headings from '@/components/globals/Headings'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { useGetObstacles } from '@/app/api/obstacles/obstaclesQueries'
import Link from 'next/link'

const ObstaclesOverview = () => {

    const {data: obstacles, isLoading, isFetching} = useGetObstacles();

    return (
        <section 
            className="w-full items-center justify-center gap-8 sm:gap-12 md:gap-16 lg:gap-20 xl:gap-24 py-12 sm:py-16 md:py-20 pt-20 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32"
            style={{backgroundColor: '#141414'}}
        >
            <div className='w-auto h-full flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-7 md:mb-8'>
                <Headings
                    title="Quelques obstacles"
                    description="Découvre une sélection d'obstacles emblématiques qui te mettront au défi lors de l'Overbound."
                    cta={
                        <Link href="/obstacles">
                            <Button 
                                className="
                                    w-full sm:w-44 md:w-48 xl:w-48 
                                    h-10 sm:h-11 md:h-12
                                    text-sm sm:text-base
                                    mt-2 sm:mt-0
                                    border-2 border-[#26AA26] text-[#26AA26] bg-transparent
                                    hover:bg-[#26AA26] hover:text-white
                                    transition-all duration-300
                                "
                            >
                                Voir tout
                            </Button>
                        </Link>
                    }
                    sx='mb-4 sm:mb-6 md:mb-8'
                />

                {(isLoading || isFetching) ? (
                    <div className="w-full">
                        <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="flex-shrink-0 w-[85%] sm:w-[70%] md:w-1/2 lg:w-1/3 xl:w-1/4"
                                >
                                    <div className="h-64 sm:h-72 md:h-80 bg-neutral-700 rounded-lg sm:rounded-xl animate-pulse"></div>
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
                            <CarouselContent className="-ml-2 sm:-ml-3 md:-ml-4 md:pb-20">
                                {obstacles?.map((obst, index) => (
                                    <CarouselItem 
                                        key={index} 
                                        className="pl-2 sm:pl-3 md:pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                                    >
                                        <div className="relative h-64 sm:h-72 md:h-80 lg:h-84 xl:h-80 rounded-lg sm:rounded-xl overflow-hidden bg-neutral-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                            <img
                                                src={obst.image_url || ''}
                                                alt={obst.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                                            
                                            {/* Obstacle info */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                                                <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-2">
                                                    {obst.name}
                                                </h3>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            
                            {/* Navigation buttons - positionnés en bas à gauche */}
                            <div className="hidden sm:block">
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
        </section>
    )
}

export default ObstaclesOverview