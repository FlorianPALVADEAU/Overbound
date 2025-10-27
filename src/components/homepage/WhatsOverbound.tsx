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
      {/* Version desktop : ton design original exact mais stylisé */}
      <div className="hidden lg:flex h-[80vh] w-full items-center justify-center gap-24 py-20 pt-40 relative z-10 mb-15">
        <div className='h-full w-[40%] flex flex-col items-center justify-center gap-12 -mt-8'>
          <div className='relative'>
            <h2 className='text-5xl font-bold text-black relative z-10'>
              Overbound, 
              <span className='text-[#26AA26] ml-3 relative'>
                c'est quoi ?
                <div className='absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#26AA26] to-transparent rounded-full'></div>
              </span>
            </h2>
          </div>
          <div className='flex flex-col gap-4 space-y-2'>
            <p className='text-center text-lg leading-relaxed text-gray-900'>
              Dans un monde trop confortable et artificiel, nous perdons le goût du <span className='text-[#26AA26] font-semibold'>vrai défi</span>.
            </p>
            <p className='text-center text-lg leading-relaxed text-gray-900'>
              Overbound n'est pas seulement une course : c'est une <span className='text-[#26AA26] font-semibold'>réponse à ce manque</span>.
              C'est un rite de passage moderne, brut, où la nature devient votre arène, et où chaque obstacle vous rapproche de qui vous êtes vraiment.
            </p>
            <p className='text-center text-lg leading-relaxed text-gray-900'>
              Overbound sert à recréer ce que notre société a perdu : la <span className='text-[#26AA26] font-semibold'>force du collectif</span>, le dépassement de soi, et la fierté d'avoir accompli quelque chose de grand.
            </p>
          </div>
          <div className='mt-4'>
            <Link href="/about" className="w-full lg:w-auto group">
              <Button 
                className="lg:w-56 lg:h-14 md:w-48 md:h-12 xs:w-48 xs:h-12 text-md font-semibold bg-transparent border-2 border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26] hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#26AA26]/30 relative overflow-hidden"
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
        className='object-cover object-center absolute w-full -bottom-5 -right-0 mt-10'
        height={'600'}
        width={'600'}
      />

      {/* Version mobile/tablette : layout vertical stylisé */}
      <div className="lg:hidden w-full py-12 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col gap-8 sm:gap-12">
          
          {/* Images en version mobile avec effets */}
          <div className="w-full animate-in fade-in slide-in-from-top duration-800">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {/* Image principale */}
              <div className="col-span-2 relative overflow-hidden rounded-lg group">
                <div className='absolute inset-0 bg-gradient-to-br from-[#26AA26]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10'></div>
                <img
                  src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Qu'est-ce qu'Overbound ?"
                  className="object-cover w-full h-48 sm:h-64 rounded-lg shadow-xl transform transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                />
              </div>
              {/* Images secondaires */}
              <div className='relative overflow-hidden rounded-lg group'>
                <div className='absolute inset-0 bg-gradient-to-tl from-[#26AA26]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10'></div>
                <img
                  src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Qu'est-ce qu'Overbound ?"
                  className="object-cover w-full h-32 sm:h-40 rounded-lg shadow-lg transform transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                />
              </div>
              <div className='relative overflow-hidden rounded-lg group'>
                <div className='absolute inset-0 bg-gradient-to-br from-[#26AA26]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10'></div>
                <img
                  src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Qu'est-ce qu'Overbound ?"
                  className="object-cover w-full h-32 sm:h-40 rounded-lg shadow-lg transform transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                />
              </div>
            </div>
          </div>

          {/* Contenu texte en version mobile */}
          <div className="w-full flex flex-col gap-6 sm:gap-8 animate-in slide-in-from-bottom duration-800" style={{animationDelay: '300ms'}}>
            <div className='relative'>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Overbound, 
                <span className='text-[#26AA26] block sm:inline sm:ml-2 relative'>
                  c'est quoi ?
                  <div className='absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#26AA26] to-transparent rounded-full'></div>
                </span>
              </h2>
            </div>
            <div className="flex flex-col gap-4 space-y-2">
              <p className="text-base sm:text-lg leading-relaxed text-gray-300" style={{animationDelay: '500ms'}}>
                Dans un monde trop confortable et artificiel, nous perdons le goût du <span className='text-[#26AA26] font-semibold'>vrai défi</span>.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-gray-300" style={{animationDelay: '700ms'}}>
                Overbound n'est pas seulement une course : c'est une <span className='text-[#26AA26] font-semibold'>réponse à ce manque</span>.
                C'est un rite de passage moderne, brut, où la nature devient votre arène, et où chaque obstacle vous rapproche de qui vous êtes vraiment.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-gray-300" style={{animationDelay: '900ms'}}>
                Overbound sert à recréer ce que notre société a perdu : la <span className='text-[#26AA26] font-semibold'>force du collectif</span>, le dépassement de soi, et la fierté d'avoir accompli quelque chose de grand.
              </p>
            </div>
            <div className='animate-in slide-in-from-bottom duration-700' style={{animationDelay: '1100ms'}}>
              <Link href="/about" className="group">
                <Button 
                  className="w-full sm:w-auto sm:w-48 h-12 sm:h-14 text-base font-semibold bg-transparent border-2 border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26] hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#26AA26]/30 relative overflow-hidden"
                >
                  <span className='relative z-10'>Je veux en savoir plus</span>
                  <div className='absolute inset-0 bg-gradient-to-r from-[#26AA26] to-[#1e8a1e] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsOverbound