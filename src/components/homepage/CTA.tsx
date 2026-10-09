'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { getNextPriceChange } from '@/lib/pricing'

const CTA = () => {
  const { data } = useFeaturedEvent()
  const event = data?.event
  const availableSpots = data?.availableSpots

  const cheapestTicket = (event?.tickets ?? []).reduce(
    (min, t) => ((t.final_price_cents ?? Infinity) < (min?.final_price_cents ?? Infinity) ? t : min),
    (event?.tickets ?? [])[0],
  )
  const nextChange = cheapestTicket ? getNextPriceChange(cheapestTicket, event?.price_tiers ?? []) : null
  const nextChangeDate = nextChange
    ? nextChange.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null

  const registerHref = event ? `/events/${event.slug}/register` : '/events/ultra-arena-2026/register'

  return (
    <section className='relative w-full min-h-screen flex flex-col justify-center items-center text-white overflow-hidden'>
        <div className='z-10 flex flex-col justify-center items-center gap-12 md:gap-16 lg:gap-20 xl:gap-24 px-4 sm:px-6 md:px-8'>
            <div className='w-full h-auto text-center flex flex-col justify-center items-center gap-2 sm:gap-3 md:gap-4'>
                <h2 className='text-balance wrap-break-word text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight'>
                    {typeof availableSpots === 'number' && availableSpots > 0 ? (
                      <span className='text-amber-500'>{availableSpots} places disponibles</span>
                    ) : (
                      <span className='text-amber-500'>Inscriptions ouvertes</span>
                    )}
                </h2>
                <p className='text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl max-w-4xl leading-relaxed'>
                    {nextChangeDate
                      ? `Le tarif change le ${nextChangeDate}. Réserve ta place avant.`
                      : "Rejoins la tribu Overbound et repousse tes limites."}
                </p>
            </div>
            <Button
                asChild
                className='min-h-11 w-64 h-12 sm:w-72 sm:h-14 md:w-80 md:h-16 text-lg sm:text-xl font-semibold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                variant='default'
            >
                <Link href={registerHref}>Je m'inscris maintenant</Link>
            </Button>
        </div>

        {/* Image de fond responsive */}
        <div className='absolute inset-0 w-full h-full'>
            <Image
                src='/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif'
                alt="Coureurs Overbound franchissant un obstacle avec des troncs d'arbres"
                fill
                sizes='100vw'
                className='object-cover object-center'
            />
        </div>

        {/* Overlay pour améliorer la lisibilité du texte */}
        <div className='absolute inset-0 bg-black/50 z-[1]'></div>
    </section>
  )
}

export default CTA
