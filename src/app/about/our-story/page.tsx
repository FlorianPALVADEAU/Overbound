import Image from 'next/image'
import Link from 'next/link'
import { PageHero } from '@/components/hero/PageHero'
import { Button } from '@/components/ui/button'
import { Eyebrow, containerClass, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

const IMG = '/images/images/'
const IMGObstacle = '/images/obstacles/'

const CHAPTERS = [
  {
    when: 'Août 2025',
    title: 'L’idée',
    text: 'Une boucle d’environ 2 km. Des obstacles à porter, à grimper, à ramper. Et deux façons de la vivre : OPEN, à ton rythme, ou RANKED, chrono en main.',
    image: { src: `${IMG}monkey-bars.avif`, alt: 'Coureur portant des troncs de bois' },
  },
  {
    when: 'Novembre 2025',
    title: 'Le trailer',
    text: 'On montre ce qu’on prépare. L’idée sort de ma tête et commence à circuler : elle devient un rendez-vous.',
    image: { src: `${IMG}two-runners-going-uphill-with-chains-on-their-backs.avif`, alt: 'Deux coureurs montant une pente, chaînes sur le dos' },
  },
  {
    when: '12 septembre 2026',
    title: 'Le premier départ',
    text: 'À l’Île de loisirs de Saint-Quentin-en-Yvelines, Overbound prend vie. Troncs sur les épaules, chaînes autour du cou, sourires à chaque tour. Un franc succès.',
    image: { src: `${IMG}benevoles-47.avif`, alt: 'Groupe d’amis qui célèbrent après la course' },
  },
]

const MOSAIC = [
  { src: `${IMGObstacle}monkey-bars.avif`, alt: 'Participant grimpant à la corde' },
  { src: `${IMG}P1091298.avif`, alt: 'Participante souriante dans l’herbe' },
  { src: `${IMGObstacle}log-carry-end.avif`, alt: 'Deux sportifs fiers face à la caméra' },
  { src: `${IMGObstacle}barbels.avif`, alt: 'Vague de coureurs portant des troncs' },
]

const VALUES = [
  { title: 'Pour tout le monde', text: 'Débutant ou confirmé : il y a un format et un rythme pour toi.' },
  { title: 'Un tour de plus', text: 'Chaque boucle compte. Le seul adversaire, c’est toi-même.' },
  { title: 'Ensemble', text: 'On s’entraide sur les obstacles et on fête chaque arrivée.' },
]

export default function OurStoryPage() {
  return (
    <main className="w-full bg-background text-foreground">
      <PageHero
        image={{ src: `${IMG}finish-line-2runners.avif`, alt: 'Deux sportifs fiers face à la caméra' }}
        eyebrow="Notre histoire"
        title="Une idée, une boucle, une tribu"
        description="Août 2025 : une envie. Septembre 2026 : une ligne de départ."
      />

      <section className={cn(containerClass(), 'grid gap-10 py-14 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16')}>
        <div className="space-y-6">
          <Eyebrow>Le fondateur</Eyebrow>
          <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>
            « Je voulais une course où personne ne se sent de trop. »
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-foreground/80 sm:text-lg">
            <p>
              Je m’appelle Florian, je suis à l’origine d’Overbound. En août 2025, j’ai eu une envie : monter une
              course à obstacles où le débutant du fond du peloton et celui qui vise le podium partagent la même
              boucle, les mêmes obstacles et la même fierté en passant la ligne.
            </p>
            <p>Le reste, on l’a construit pas à pas : le parcours, les obstacles, les formats, le trailer.</p>
          </div>
          <p className="font-bold">Florian Palvadeau</p>
        </div>
        <div className="relative aspect-4/5 overflow-hidden rounded-xl">
          <Image
            src={`${IMG}florian-and-sourath.avif`}
            alt="Coureur portant un tronc sur l’épaule"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transform scale-150"
          />
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className={cn(containerClass(), 'space-y-16 py-14 sm:py-24 lg:space-y-24')}>
          {CHAPTERS.map((chapter, index) => (
            <article
              key={chapter.when}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : undefined}>
                <p className="text-eyebrow font-semibold uppercase text-primary">{chapter.when}</p>
                <h3 className={cn(DISPLAY_TITLE, 'mt-3 text-display-md')}>{chapter.title}</h3>
                <p className="mt-5 max-w-prose text-base leading-relaxed text-foreground/80 sm:text-lg">
                  {chapter.text}
                </p>
              </div>
              <div className="relative aspect-4/3 overflow-hidden rounded-xl">
                <Image
                  src={chapter.image.src}
                  alt={chapter.image.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={cn(containerClass(), 'py-14 sm:py-24')}>
        <p className={cn(DISPLAY_TITLE, 'text-center text-display-md')}>
          Ici, le seul adversaire, <span className="text-primary">c’est toi-même.</span>
        </p>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {MOSAIC.map((photo) => (
            <div key={photo.src} className="relative aspect-3/4 overflow-hidden rounded-lg">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <dl className="mt-16 grid gap-8 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="space-y-2">
              <dt className={cn(DISPLAY_TITLE, 'text-title')}>{value.title}</dt>
              <dd className="text-foreground/80">{value.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t bg-muted/30">
        <div className={cn(containerClass(), 'flex flex-col gap-6 py-14 sm:py-20 lg:flex-row lg:items-center lg:justify-between')}>
          <div className="max-w-xl space-y-2">
            <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>La suite s’écrit avec toi</h2>
            <p className="text-foreground/80">
              La prochaine édition n’est pas encore annoncée. Suis-nous pour être prévenu en premier.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-11">
              <a href="https://www.instagram.com/overbound.race/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </Button>
            <Button asChild size="lg" className="min-h-11">
              <a href="https://www.tiktok.com/@overbound.race" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11">
              <Link href="/events/formats">Découvrir les formats</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
