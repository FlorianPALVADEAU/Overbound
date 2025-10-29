import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className='relative flex h-[70vh] flex-col items-center justify-center overflow-hidden bg-neutral-200'>
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent' />
        <div className='absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/80 to-transparent' />
      </div>

      <section className='relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-16 sm:gap-12 sm:px-6 lg:px-8 lg:py-24'>
        <div className='flex flex-col items-center gap-4 text-center sm:gap-6'>
          <span className='inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#26AA26] shadow-sm sm:text-sm'>
            Erreur 404
          </span>
          <h1 className='text-3xl font-bold text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl'>
            Oups... tu viens de quitter le sentier balisé
          </h1>
          <p className='max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base md:text-lg'>
            Comme lors d&apos;un parcours Overbound, il arrive de prendre un détour inattendu. Cette page n&apos;existe pas (ou plus), mais on peut t&apos;orienter pour retrouver le bon chemin et poursuivre l&apos;aventure.
          </p>
        </div>

        <Button asChild className='mt-auto w-full sm:w-auto border-2 border-[#26AA26] bg-transparent text-[#26AA26] hover:bg-[#26AA26] hover:text-white'>
          <Link href='/'>Revenir à l&apos;accueil</Link>
        </Button>
      </section>

      <Image
        src='/images/mountain-vector.svg'
        alt='Illustration montagne'
        width={1200}
        height={600}
        className='pointer-events-none absolute bottom-[-10%] left-1/2 w-[140%] max-w-none -translate-x-1/2'
        priority
      />
      <Image
        src='/images/mountain-vector.svg'
        alt='Illustration montagne'
        width={1200}
        height={600}
        className='pointer-events-none absolute top-[-10%] rotate-180 left-1/2 w-[140%] max-w-none -translate-x-1/2'
        priority
      />
    </main>
  )
}
