/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
import Image from 'next/image'

const WhatsOverbound = () => {
  return (
    <div
      className="w-full relative overflow-hidden bg-neutral-200"
    >
      {/* Version unifiée responsive - même design pour tous les écrans */}
      <div className="min-h-[60vh] lg:h-[80vh] w-full flex items-center justify-center py-12 sm:py-16 md:py-20 lg:pt-40 lg:pb-20 relative z-10 px-4 sm:px-6 lg:px-0">
        <div className='h-full w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[40%] flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 lg:-mt-8'>
          <div className='relative'>
            <h2 className='text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-black relative z-10 text-center'>
              Overbound,
              <span className='text-[#26AA26] ml-2 sm:ml-3 relative inline-block'>
                c'est quoi ?
                <div className='absolute -bottom-1 sm:-bottom-2 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-[#26AA26] to-transparent rounded-full'></div>
              </span>
            </h2>
          </div>
          <div className='flex flex-col gap-3 sm:gap-4 space-y-1 sm:space-y-2'>
            <p className='text-center text-sm sm:text-base md:text-lg leading-relaxed text-gray-900'>
              Dans un monde trop confortable et artificiel, nous perdons le goût du <span className='text-[#26AA26] font-semibold'>vrai défi</span>.
            </p>
            <p className='text-center text-sm sm:text-base md:text-lg leading-relaxed text-gray-900'>
              Overbound n'est pas seulement une course : c'est une <span className='text-[#26AA26] font-semibold'>réponse à ce manque</span>.
              C'est un rite de passage moderne, brut, où la nature devient votre arène, et où chaque obstacle vous rapproche de qui vous êtes vraiment.
            </p>
            <p className='text-center text-sm sm:text-base md:text-lg leading-relaxed text-gray-900'>
              Overbound sert à recréer ce que notre société a perdu : la <span className='text-[#26AA26] font-semibold'>force du collectif</span>, le dépassement de soi, et la fierté d'avoir accompli quelque chose de grand.
            </p>
          </div>
          <div className='mt-2 sm:mt-3 md:mt-4 w-full sm:w-auto'>
            <Link href="/about" className="w-full group block">
              <Button
                className="w-full sm:w-auto sm:min-w-[200px] md:min-w-[220px] lg:w-56 h-12 sm:h-12 md:h-13 lg:h-14 text-sm sm:text-base md:text-md font-semibold bg-transparent border-2 border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26] hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#26AA26]/30 relative overflow-hidden"
              >
                <span className='relative z-10'>Je veux en savoir plus</span>
                <div className='absolute inset-0 bg-gradient-to-r from-[#26AA26] to-[#1e8a1e] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'></div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Image
        src="/images/mountain-vector.svg"
        alt="Background"
        className='object-cover object-center absolute w-full -bottom-3 sm:-bottom-4 md:-bottom-5 -right-0 pointer-events-none'
        height={'600'}
        width={'600'}
        priority
      />
    </div>
  )
}

export default WhatsOverbound