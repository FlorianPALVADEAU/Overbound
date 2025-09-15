import React from 'react'
import { Button } from '../ui/button'
import Image from 'next/image'
import Link from 'next/link'

const CTA = () => {
  return (
    <section className='relative w-full min-h-screen flex flex-col justify-center items-center text-white overflow-hidden'>
        <div className='z-10 flex flex-col justify-center items-center gap-12 md:gap-16 lg:gap-20 xl:gap-24 px-4 sm:px-6 md:px-8'>
            <div className='w-full h-auto text-center flex flex-col justify-center items-center gap-2 sm:gap-3 md:gap-4'>
                <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight'>
                    800 places. Pas une de plus.
                </h2>
                <p className='text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl max-w-4xl leading-relaxed'>
                    Les premiers guerriers écriront l'histoire d'Overbound. Seras-tu l'un d'eux ?
                </p>
            </div>
            <Link href="/events">
                <Button 
                    className='w-64 h-12 sm:w-72 sm:h-14 md:w-80 md:h-16 text-lg sm:text-xl font-semibold'
                    variant='destructive'
                >
                    Je m'inscris maintenant
                </Button>
            </Link>
        </div>
        
        {/* Image de fond responsive */}
        <div className='absolute inset-0 w-full h-full'>
            <Image
                src='/images/hero_header_poster.jpg'
                alt='Call to Action'
                fill
                sizes='100vw'
                className='object-cover object-center'
                priority
            />
        </div>
        
        {/* Overlay pour améliorer la lisibilité du texte */}
        <div className='absolute inset-0 bg-black/30 z-[1]'></div>
    </section>
  )
}

export default CTA