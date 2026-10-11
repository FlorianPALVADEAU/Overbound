import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { containerClass, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <main className='relative flex h-full flex-col items-center justify-center overflow-hidden tone-light bg-background text-foreground'>
      <Image
        src='/images/decorations/mountain-vector.svg'
        alt='Illustration montagne'
        width={1200}
        height={600}
        className='pointer-events-none z-1 relative top-0 lg:top-[10%] rotate-180 left-1/2 w-[140%] max-w-none -translate-x-1/2'
        priority
      />
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent' />
        <div className='absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/80 to-transparent' />
      </div>

      <section className={cn(containerClass(), 'relative z-10 flex flex-col items-center gap-10 py-16 sm:gap-12 lg:py-24')}>
        <div className='flex flex-col items-center gap-4 text-center sm:gap-6'>
          <span className='inline-flex items-center gap-2 rounded-full bg-card/60 px-4 py-2 text-eyebrow font-semibold uppercase text-primary shadow-sm'>
            404
          </span>
          <h1 className={cn(DISPLAY_TITLE, 'text-display-lg')}>
            Oups... tu viens de quitter le sentier balisé
          </h1>
          <p className='max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg'>
            Comme lors d&apos;un parcours Overbound, il arrive de prendre un détour inattendu. Cette page n&apos;existe pas (ou plus), mais on peut t&apos;orienter pour retrouver le bon chemin et poursuivre l&apos;aventure.
          </p>
        </div>

        <Button asChild className='mt-auto w-full sm:w-auto border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground'>
          <Link href='/'>Revenir à l&apos;accueil</Link>
        </Button>
      </section>
      <Image
        src='/images/decorations/mountain-vector.svg'
        alt='Illustration montagne'
        width={1200}
        height={600}
        className='pointer-events-none absolute bottom-[-1%] lg:bottom-[-5%] left-1/2 w-[140%] max-w-none -translate-x-1/2'
        priority
      />
    </main>
  )
}
