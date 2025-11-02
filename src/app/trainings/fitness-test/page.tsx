'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Headings from '@/components/globals/Headings'

const heroBackground =
  "url('https://images.unsplash.com/photo-1517832606294-5fbdc7dcd837?q=80&w=1400&auto=format&fit=crop')"

const assessments = [
  {
    title: 'Endurance cardio',
    subtitle: 'Course continue & fractionné',
    description:
      'Mesure ta capacité à tenir un effort soutenu grâce à un Cooper 12 minutes ou un test de VMA progressive. Note ta distance ou ta VMA pour connaître ton niveau.',
    checklist: ['Test Cooper 12 min ou VMA progressive', 'Noter la distance / vitesse atteinte', 'Repos actif 5 min'],
  },
  {
    title: 'Force fonctionnelle',
    subtitle: 'Gainage – tirage – poussée',
    description:
      'Les obstacles Overbound mobilisent ton buste et ton grip. Chronomètre un gainage planche, réalise un max de tractions/rowing inversé et des pompes explosives.',
    checklist: ['Planche : max de temps', 'Tractions / rowing inversé : max en 90 s', 'Pompes explosives : max en 60 s'],
  },
  {
    title: 'Puissance & agilité',
    subtitle: 'Sauts, changements de direction',
    description:
      'Chrono sur un T-Test de vitesse, et calcule ta détente verticale avec un squat jump. Ces points révèlent ta vivacité sur les franchissements.',
    checklist: ['T-Test (course en T) : meilleur temps', 'Squat jump : hauteur ou nombre de répétitions', 'Travail de mobilité post-test'],
  },
]

const scoringBands = [
  {
    label: 'Tribal Sprint',
    score: '0 – 9 points',
    description: 'Format découverte avec obstacles emblématiques. Idéal si tu débutes ou reprends.',
    cta: { label: 'Voir les formats Sprint', href: '/events?format=sprint' },
  },
  {
    label: 'Voie du héros',
    score: '10 – 17 points',
    description: 'Mix course / obstacles équilibré. Prépare-toi à maintenir un effort soutenu 8 à 12 km.',
    cta: { label: 'Explorer la Voie du Héros', href: '/events?format=hero' },
  },
  {
    label: 'Tribal Royale',
    score: '18 points et +',
    description: 'Parcours élite & longues distances. Exige un haut niveau de force, endurance et mental.',
    cta: { label: 'Objectif Tribal Royale', href: '/events?format=royale' },
  },
]

export default function FitnessTestPage() {
  return (
    <main className='min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground'>
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <div className='h-full w-full bg-cover bg-center' style={{ backgroundImage: heroBackground }} />
          <div className='absolute inset-0 bg-background/30 backdrop-blur-[3px]' />
          <div className='absolute inset-0 bg-gradient-to-b from-background/20 via-background/75 to-background' />
        </div>
        <div className='relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Préparation Overbound
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Passe le test de fitness Overbound
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Diagnostique ton niveau et mesure ta progression avant d&apos;attaquer une course Overbound. Trois
              blocs d’évaluation pour comprendre où tu en es et comment franchir le prochain palier.
            </p>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='#protocoles'>Découvrir les protocoles</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/trainings/plans'>Télécharger un plan type</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className='border-y border-border/50 bg-background/80 py-14'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <Headings
            title='Pourquoi tester ton fitness ?'
            description="Nos parcours exigent cardio, force et explosivité. En réalisant ce test maison, tu identifies tes points forts, ce qu'il reste à travailler et la course qui correspond à ton profil."
          />
          <div className='grid gap-6 md:grid-cols-3'>
            {assessments.map((assessment) => (
              <Card
                key={assessment.title}
                className='border border-white/20 bg-gradient-to-b from-muted/40 to-muted/10 shadow-lg shadow-primary/5 backdrop-blur'
              >
                <CardHeader className='space-y-1'>
                  <p className='text-sm font-semibold uppercase tracking-wide text-primary'>{assessment.subtitle}</p>
                  <CardTitle className='text-2xl'>{assessment.title}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm text-muted-foreground'>
                  <p>{assessment.description}</p>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-wide text-foreground/70'>Checklist</p>
                    <ul className='mt-2 space-y-2'>
                      {assessment.checklist.map((item) => (
                        <li key={item} className='flex gap-2 text-sm'>
                          <span className='mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary' />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id='protocoles' className='mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8'>
        <div className='grid gap-10 lg:grid-cols-[2fr,3fr] lg:items-start'>
          <div className='space-y-4'>
            <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl'>Comment fonctionne le scoring&nbsp;?</h2>
            <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
              Note chacune des trois familles de tests sur 10 (voir ci-dessous). Additionne les points pour obtenir
              ton score &quot;Tribal Index&quot; et identifie immédiatement le format qui colle à ton niveau. Besoin
              d&apos;aide pour noter&nbsp;? Nos coachs peuvent t&apos;aiguiller via le support.
            </p>
            <div className='space-y-3 rounded-3xl border border-border/60 bg-background p-5 shadow-inner shadow-primary/10'>
              <p className='text-sm font-semibold text-foreground/90'>Grille de notation simplifiée :</p>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <strong>0 – 3 :</strong> début du travail, chaîne l&apos;effort 60 secondes sans rupture.
                </li>
                <li>
                  <strong>4 – 6 :</strong> tu tiens les séries demandées avec contrôle, quelques lacunes restent.
                </li>
                <li>
                  <strong>7 – 8 :</strong> base solide, prêt pour la Voie du héros.
                </li>
                <li>
                  <strong>9 – 10 :</strong> profil élite, vise Tribal Royale ou formats challenge.
                </li>
              </ul>
            </div>
            <Button asChild variant='outline' size='lg' className='h-11 w-full border-primary text-primary sm:w-max'>
              <Link href='/contact'>Besoin d&apos;un coach ?</Link>
            </Button>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            {scoringBands.map((band) => (
              <Card
                key={band.label}
                className='border border-primary/20 bg-primary/5 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-shadow'
              >
                <CardHeader>
                  <CardTitle className='text-xl font-semibold text-primary'>{band.label}</CardTitle>
                  <p className='text-sm font-medium text-primary/80'>{band.score}</p>
                </CardHeader>
                <CardContent className='space-y-4 text-sm text-muted-foreground'>
                  <p>{band.description}</p>
                  <Button asChild variant='outline' size='sm' className='w-full border-primary text-primary hover:bg-primary/10'>
                    <Link href={band.cta.href}>{band.cta.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='relative bg-gradient-to-b from-background to-background/40 py-16 sm:py-20'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-2 lg:items-center'>
            <div className='space-y-4 text-center lg:text-left'>
              <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl'>
                Prêt à valider ton test sur le terrain&nbsp;?
              </h2>
              <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
                Inscris-toi sur une session entraînement officielle ou rejoins la communauté Overbound pour
                t’entraîner avec d’autres athlètes. Deviens plus fort chaque jour.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='/trainings/plans'>Planifier mon entraînement</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/contact'>Parler à un coach</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
