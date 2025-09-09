import React from 'react'
import { Button } from '../ui/button'
import Image from 'next/image'

const CTA = () => {
  return (
    <section className='relative w-full h-[100vh] flex flex-col justify-center items-center text-white overflow-hidden'>
        <div className='z-10 flex flex-col justify-center items-center gap-24'>
            <div className='w-full h-auto text-center flex flex-col justify-center items-center gap-2'>
                <h2 className='text-7xl font-bold '>800 places. Pas une de plus.</h2>
                <p className='text-3xl'>Les premiers guerriers écriront l'histoire d'Overbound. Seras-tu l'un d'eux ?</p>
            </div>
            <Button 
                className='w-80 h-16 text-xl font-semibold'
                variant='destructive'
            >
                Je m'inscris maintenant
            </Button>
        </div>
        <Image
            src='/images/hero_header_poster.jpg'
            alt='Call to Action'
            layout='responsive'
            width={700}
            height={475}
            className='absolute !w-full !h-full object-cover'
        />
    </section>
  )
}

export default CTA