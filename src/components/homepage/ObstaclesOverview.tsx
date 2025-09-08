/* eslint-disable @next/next/no-img-element */
'use client'
import React from 'react'
import Headings from '@/components/globals/Headings'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { useGetObstacles } from '@/app/api/obstacles/obstaclesQueries'


const ObstaclesOverview = () => {

    const {data: obstacles, isLoading, isFetching} = useGetObstacles();

    return (
        <section className="w-full items-center justify-center gap-24 py-20 pt-40 px-4 sm:px-6 xl:px-32">
            <div className='w-auto h-full flex flex-col justify-center items-center gap-6 mb-8'>
                <Headings
                    title="Quelques obstacles"
                    description="Découvre une sélection d'obstacles emblématiques qui te mettront au défi lors de l'Overbound."
                    cta={
                            <Button 
                                variant={'default'} 
                                className="
                                    w-full 
                                    sm:w-48 xl:w-48 
                                    h-10 sm:h-12 xl:h-12
                                    text-base
                                "
                            >
                                Voir tout
                            </Button>
                    }
                />

                {/* Simple Carousel */}
                <div className="w-full">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {obstacles?.map((obst, index) => (
                                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                    <div className="relative h-80 rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-lg transition-shadow">
                                        <img
                                            src={obst.image_url || ''}
                                            alt={obst.name}
                                            className="w-full h-full object-cover"
                                        />
                                        
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                        
                                        {/* Obstacle info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                            <h3 className="font-semibold text-lg mb-1">{obst.name}</h3>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
            </div>
        </section>
    )
}

export default ObstaclesOverview