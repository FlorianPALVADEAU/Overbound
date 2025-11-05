import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Headings from '@/components/globals/Headings'
import WhichDistanceForMe from '@/components/WhichDistanceForMe'
import Image from 'next/image'

const formatHighlights = [
  {
    title: 'Sprint Tribal',
    subtitle: 'Format court et explosif',
    description:
      '5 à 7 km pour ceux qui veulent goûter à l’expérience Overbound sans compromis sur les obstacles emblématiques.',
    tags: ['Débutant', 'Intensité', 'Fun'],
  },
  {
    title: 'Voie du Héros',
    subtitle: 'Challenge intermédiaire',
    description:
      '8 à 12 km avec un mix équilibré de course, portés et franchissements techniques pour progresser à chaque obstacle.',
    tags: ['Intermédiaire', 'Endurance', 'Cohésion'],
  },
  {
    title: 'Tribal Royale',
    subtitle: 'L’épreuve signature',
    description:
      '15 km et plus pour les athlètes en quête de dépassement et d’un format élite taillé pour repousser leurs limites.',
    tags: ['Expert', 'Performance', 'Élite'],
  },
]

const preparationSteps = [
  {
    step: '01',
    title: 'Évalue ton niveau',
    description:
      'Cardio, force, expérience des obstacles… On te guide pour identifier où tu en es et ce que tu veux atteindre.',
  },
  {
    step: '02',
    title: 'Choisis ton format',
    description:
      'Sprint, voie du héros ou Tribal Royale : compare les distances, le nombre d’obstacles et la cible pour trouver ton challenge.',
  },
  {
    step: '03',
    title: 'Planifie ton entraînement',
    description:
      'Accède à nos ressources dédiées : plans 6 à 8 semaines, recommandations nutritionnelles et checklist matériel.',
  },
]

export default function WhatRaceForMePage() {
  return (
    <main className='min-h-screen maw-w-screen overflow-y-hidden bg-gradient-to-b from-background via-muted/20 to-background text-foreground'>
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <div
            className='h-full w-full bg-cover bg-center'
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1420&auto=format&fit=crop')",
            }}
          />
          <div className='absolute inset-0 bg-background/40 backdrop-blur-[3px]' />
          <div className='absolute inset-0 bg-gradient-to-b from-background/15 via-background/80 to-background' />
        </div>

        <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Trouve ton format
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Quelle course Overbound est faite pour toi&nbsp;?
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Sprint de 5 km, défi élite ou format team&nbsp;? Réponds à quelques questions pour obtenir une
              recommandation personnalisée, puis découvre comment te préparer comme un athlète Overbound.
            </p>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='#questionnaire'>Lancer le questionnaire</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/events'>Voir les prochains événements</Link>
              </Button>
            </div>
          </div>

          <div className='grid gap-6 md:grid-cols-3'>
            {formatHighlights.map((format) => (
              <Card
                key={format.title}
                className='border border-white/20 bg-background/60 shadow-lg shadow-primary/5 backdrop-blur'
              >
                <CardHeader className='space-y-1'>
                  <p className='text-sm font-semibold uppercase tracking-wide text-primary'>{format.subtitle}</p>
                  <CardTitle className='text-2xl'>{format.title}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm text-muted-foreground'>
                  <p>{format.description}</p>
                  <div className='flex flex-wrap gap-2'>
                    {format.tags.map((tag) => (
                      <Badge key={tag} variant='outline' className='border-primary/20 text-primary'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='border-y border-border/50 bg-background/80 py-14'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <Headings
            title='3 étapes pour choisir la bonne course'
            description="On t'accompagne depuis l'évaluation de ton niveau jusqu’à la préparation terrain. Chaque format Overbound possède ses codes : voici comment t’y retrouver."
          />

          <div className='grid gap-6 md:grid-cols-3'>
            {preparationSteps.map((step) => (
              <Card
                key={step.step}
                className='border-none bg-gradient-to-b from-muted/40 to-muted/10 shadow-md shadow-primary/5'
              >
                <CardContent className='space-y-4 p-6'>
                  <span className='text-lg font-semibold text-primary'>{step.step}</span>
                  <h3 className='text-xl font-semibold text-foreground'>{step.title}</h3>
                  <p className='text-sm leading-relaxed text-muted-foreground'>{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id='questionnaire' className='relative z-10 mx-auto py-50 w-full px-4 sm:px-6 lg:px-8 bg-white'>
        <Image
          src='/images/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='pointer-events-none z-1 absolute top-0 lg:top-[-2%] rotate-180 left-1/2 w-screen -translate-x-1/2'
          priority
        />
        <div className='mx-auto max-w-3xl space-y-4 text-center'>
          <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl text-black'>
            Réponds au questionnaire Overbound
          </h2>
          <p className='text-sm text-muted-foreground sm:text-base'>
            Notre formulaire intelligent (le même utilisé lors des événements) analyse ta motivation, ton niveau et
            ta tolérance aux obstacles pour te recommander un format précis. Il te faut moins de 3&nbsp;minutes&nbsp;!
          </p>
        </div>
        <div className='mt-8 rounded-2xl border border-border/60 bg-background/30 pb-10'>
          <WhichDistanceForMe />
        </div>
        <Image
          src='/images/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='pointer-events-none z-1 absolute bottom-0 lg:bottom-[-2%] left-1/2 w-screen -translate-x-1/2'
          priority
        />
      </section>

      <section className='relative bg-gradient-to-b from-background to-background/40 py-16 sm:py-20'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 text-center sm:px-6 lg:px-8 lg:text-left'>
          <div className='grid gap-8 lg:grid-cols-2 lg:items-center'>
            <div className='space-y-4'>
              <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl'>
                Tu as trouvé ton format&nbsp;? Il est temps de t&apos;entraîner.
              </h2>
              <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
                Accède à nos plans d’entraînement, découvre les obstacles signature et rejoins la communauté
                Overbound pour progresser jusqu’au jour J. Chaque course est une aventure collective.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='/trainings/plans'>Télécharger un plan</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/obstacles'>Voir les obstacles</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
