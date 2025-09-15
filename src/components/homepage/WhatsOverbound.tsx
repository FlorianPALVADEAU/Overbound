/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'

const WhatsOverbound = () => {
  return (
    <>
      {/* Version desktop : ton design original exact */}
      <div className="hidden lg:flex h-[80vh] w-full items-center justify-center gap-24 py-20 pt-40">
        <div className='w-auto h-full flex justify-center items-center gap-6 mb-8'>
          <img
            src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Qu'est-ce qu'Overbound ?"
            className="object-cover w-80 h-86 rounded-lg"
          />
          <div className='flex flex-col gap-6'>
            <img
              src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Qu'est-ce qu'Overbound ?"
              className="object-cover w-50 h-56 rounded-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Qu'est-ce qu'Overbound ?"
              className="object-cover w-80 h-86 rounded-lg"
            />
          </div>
        </div>
        <div className='h-full w-[40%] flex flex-col items-start justify-center gap-12 -mt-8'>
          <h2 className='text-5xl font-bold'>Overbound, c'est quoi ?</h2>
          <div className='flex flex-col gap-2'>
            <p className='text-lg/6.5 text-justify text-gray-600'>
              Dans un monde trop confortable et artificiel, nous perdons le goût du vrai défi.
            </p>
            <p className='text-lg/6.5 text-justify text-gray-600'>
              Overbound n'est pas seulement une course : c'est une réponse à ce manque.
              C'est un rite de passage moderne, brut, où la nature devient votre arène, et où chaque obstacle vous rapproche de qui vous êtes vraiment.
            </p>
            <p className='text-lg/6.5 text-justify text-gray-600'>
              Overbound sert à recréer ce que notre société a perdu : la force du collectif, le dépassement de soi, et la fierté d'avoir accompli quelque chose de grand.
            </p>
          </div>
          <Link href="/about" className="w-full lg:w-auto">
            <Button variant={'secondary'} className="lg:w-56 lg:h-14 md:w-48 md:h-12 xs:w-48 xs:h-12 text-md font-semibold">
              Je veux en savoir plus
            </Button>
          </Link>
        </div>
      </div>

      {/* Version mobile/tablette : layout vertical */}
      <div className="lg:hidden w-full py-12 px-4 sm:px-6">
        <div className="flex flex-col gap-8 sm:gap-12">
          
          {/* Images en version mobile */}
          <div className="w-full">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {/* Image principale */}
              <div className="col-span-2">
                <img
                  src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Qu'est-ce qu'Overbound ?"
                  className="object-cover w-full h-48 sm:h-64 rounded-lg"
                />
              </div>
              {/* Images secondaires */}
              <img
                src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Qu'est-ce qu'Overbound ?"
                className="object-cover w-full h-32 sm:h-40 rounded-lg"
              />
              <img
                src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Qu'est-ce qu'Overbound ?"
                className="object-cover w-full h-32 sm:h-40 rounded-lg"
              />
            </div>
          </div>

          {/* Contenu texte en version mobile */}
          <div className="w-full flex flex-col gap-6 sm:gap-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Overbound, c'est quoi ?</h2>
            <div className="flex flex-col gap-4">
              <p className="text-base sm:text-lg text-justify text-gray-600 leading-relaxed">
                Dans un monde trop confortable et artificiel, nous perdons le goût du vrai défi.
              </p>
              <p className="text-base sm:text-lg text-justify text-gray-600 leading-relaxed">
                Overbound n'est pas seulement une course : c'est une réponse à ce manque.
                C'est un rite de passage moderne, brut, où la nature devient votre arène, et où chaque obstacle vous rapproche de qui vous êtes vraiment.
              </p>
              <p className="text-base sm:text-lg text-justify text-gray-600 leading-relaxed">
                Overbound sert à recréer ce que notre société a perdu : la force du collectif, le dépassement de soi, et la fierté d'avoir accompli quelque chose de grand.
              </p>
            </div>
            <Button variant={'secondary'} className="w-full sm:w-auto sm:w-48 h-12 sm:h-14 text-base font-semibold">
              Je veux en savoir plus
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default WhatsOverbound