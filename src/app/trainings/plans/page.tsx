'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Headings from '@/components/globals/Headings'
import { ArrowDownToLine } from 'lucide-react'

const heroBackground =
  "url('/images/images/sport-coach-warming-up-participant.avif')"

const planCategories = [
  {
    title: 'Tribal Sprint',
    subtitle: '6 km · 6 semaines',
    gradient: 'from-green-500/20 to-green-500/5',
    accent: 'text-green-600',
    description:
      'Idéal si tu veux découvrir Overbound ou revenir sur les obstacles avec un volume d’entraînement adaptable.',
    plans: [
      { name: 'Sprint Débutant · 6 semaines', href: '/docs/plans/sprint-debutant.pdf' },
      { name: 'Sprint Intermédiaire · 6 semaines', href: '/docs/plans/sprint-intermediaire.pdf' },
      { name: 'Sprint Team · 4 semaines', href: '/docs/plans/sprint-team.pdf' },
    ],
  },
  {
    title: 'Horizon',
    subtitle: '12 km · 8 semaines',
    gradient: 'from-blue-500/20 to-blue-500/5',
    accent: 'text-blue-600',
    description:
      'Programmes hybrides course/force pour tenir l’intensité sur un format signature. Adapté aux sportifs réguliers.',
    plans: [
      { name: 'Horizon · Primal', href: '/docs/plans/heros-standard.pdf' },
      { name: 'Horizon · Cross-training', href: '/docs/plans/heros-cross-training.pdf' },
      { name: 'Horizon · Objectif podium', href: '/docs/plans/heros-podium.pdf' },
    ],
  },
  {
    title: 'Ultra Arena',
    subtitle: '∞ km · 10 semaines',
    gradient: 'from-amber-500/20 to-amber-500/5',
    accent: 'text-amber-600',
    description:
      'Prépa élite avec cycles d’endurance, force maximale et charge progressive. À destination des profils confirmés.',
    plans: [
      { name: 'Royale Elite · 10 semaines', href: '/docs/plans/royale-elite.pdf' },
      { name: 'Royale Trail + Obstacles', href: '/docs/plans/royale-trail.pdf' },
      { name: 'Royale Hyrox mix', href: '/docs/plans/royale-hyrox.pdf' },
    ],
  },
]

const bonusResources = [
  {
    title: 'Prépa physique minimaliste',
    description: '4 semaines au poids de corps + kettlebell pour entretenir force et cardio.',
    href: '/docs/plans/prepa-minimaliste.pdf',
  },
  {
    title: 'Mobilité et récupération',
    description:
      'Séances mobilité + protocoles de récupération (électro, automassage) pour éviter la fatigue cumulative.',
    href: '/docs/plans/recovery-toolkit.pdf',
  },
  {
    title: 'Checklist matériel Overbound',
    description: 'Tout ce qu’il faut emporter (équipement, nutrition, docs) pour le jour J.',
    href: '/docs/plans/checklist-overbound.pdf',
  },
]

export default function TrainingPlansPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredPlans = useMemo(() => {
    if (selectedCategory === 'all') return planCategories
    return planCategories.filter((category) => category.title === selectedCategory)
  }, [selectedCategory])

  return (
    <main className='relative min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground'>
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <div className='h-full w-full bg-cover bg-center' style={{ backgroundImage: heroBackground }} />
          <div className='absolute inset-0 bg-background/35 backdrop-blur-[3px]' />
          <div className='absolute inset-0 bg-gradient-to-b from-background/20 via-background/75 to-background' />
        </div>
        <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Préparation Overbound
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Plans d&apos;entraînement Overbound prêts à télécharger
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Choisis un plan adapté à ton format, imprime-le en PDF et suis la progression pour arriver prêt le jour
              J. Tous nos programmes sont élaborés par les coachs Overbound.
            </p>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='#plans'>Explorer les plans</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/contact'>Demander un plan personnalisé</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id='plans' className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8'>
        <Headings
          title='Choisis ton format et télécharge le plan PDF'
          description='Chaque programme comprend : 4 à 6 séances hebdo, guidelines nutrition/hydratation, focus technique obstacles et indicateurs de progression.'
        />

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
          <label className='text-sm font-semibold text-muted-foreground' htmlFor='plan-category'>
            Filtrer par format
          </label>
          <select
            id='plan-category'
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64'
          >
            <option value='all'>Tous les formats</option>
            {planCategories.map((category) => (
              <option key={category.title} value={category.title}>
                {category.title} ({category.subtitle})
              </option>
            ))}
          </select>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredPlans.map((category) => (
            <Card
              key={category.title}
              className={`border-none bg-gradient-to-br ${category.gradient} shadow-xl shadow-primary/10 backdrop-blur`}
            >
              <CardHeader className='space-y-1'>
                <p className={`text-sm font-semibold uppercase tracking-wide ${category.accent}`}>{category.subtitle}</p>
                <CardTitle className='text-2xl text-foreground'>{category.title}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-5 text-sm text-muted-foreground'>
                <p>{category.description}</p>
                <div className='space-y-3'>
                  {category.plans.map((plan) => (
                    <div key={plan.name} className='group relative'>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled
                        className='w-full justify-between border-primary/30 text-foreground opacity-50 cursor-not-allowed'
                      >
                        <span>{plan.name}</span>
                        <ArrowDownToLine className='h-4 w-4 text-primary' />
                      </Button>
                      <div className='absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
                        Ça arrive bientôt !
                        <div className='absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground' />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 sm:px-6 lg:px-8'>
        <Headings
          title='Ressources complémentaires'
          description='Ajoute ces guides à ton arsenal pour t’organiser au quotidien et booster ta récupération.'
        />
        <div className='grid gap-6 md:grid-cols-3'>
          {bonusResources.map((resource) => (
            <Card
              key={resource.title}
              className='flex flex-col border border-border/50 bg-background/80 shadow-lg shadow-primary/10'
            >
              <CardHeader>
                <CardTitle className='text-xl text-foreground'>{resource.title}</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-1 flex-col justify-between gap-5 text-sm text-muted-foreground'>
                <p className='leading-relaxed'>{resource.description}</p>
                <div className='group relative'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled
                    className='w-full justify-between border-primary text-primary opacity-50 cursor-not-allowed'
                  >
                    <span>Télécharger le PDF</span>
                    <ArrowDownToLine className='h-4 w-4' />
                  </Button>
                  <div className='absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
                    Ça arrive bientôt !
                    <div className='absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className='relative z-10 bg-gradient-to-b from-background to-background/40 py-16 sm:py-20'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-2 lg:items-center'>
            <div className='space-y-4 text-center lg:text-left'>
              <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl'>
                Besoin d’aller plus loin dans ta préparation&nbsp;?
              </h2>
              <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
                Combine ces plans avec notre questionnaire « Quelle course est faite pour moi&nbsp;? », notre test de
                fitness et les conseils nutrition pour arriver prêt à franchir chaque obstacle.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='/trainings/what-race-for-me'>Trouver mon format</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/trainings/fitness-test'>Passer le test de fitness</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
