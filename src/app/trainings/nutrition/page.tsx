'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Headings from '@/components/globals/Headings'

const heroBackground =
  "url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1400&auto=format&fit=crop')"

const nutritionPillars = [
  {
    title: 'Préparer l’effort',
    subtitle: 'Base énergétique solide',
    description:
      'Structurer tes apports sur la semaine précédant la course : hydrates-toi, augmente progressivement ta part de glucides complexes et veille à ta qualité de sommeil.',
    bullets: [
      'Hydratation quotidienne : 35 ml/kg minimum',
      'Planification des glucides complexes (riz, patates douces, avoine)',
      'Apport suffisant en omega-3 et légumes verts',
    ],
  },
  {
    title: 'Pendant la course',
    subtitle: 'Énergie & confort digestif',
    description:
      'Sur les formats Overbound, teste tes apports avant le jour J. Combine boissons iso, gels ou aliments faciles à digérer pour éviter le coup de mou.',
    bullets: [
      '250–400 ml d’eau ou boisson iso toutes les 20 min',
      '30–45 g de glucides/h sur formats > 10 km',
      'Sel minéral ou boisson électrolyte pour compenser la sudation',
    ],
  },
  {
    title: 'Récupération',
    subtitle: 'Reconstruire et renforcer',
    description:
      'La fenêtre post-effort est décisive : reconstitue ton glycogène, apporte des protéines complètes et diminue l’inflammation avec fruits et antioxydants.',
    bullets: [
      'Ratio 3:1 glucides/protéines dans les 45 minutes',
      'Collation riche en BCAA ou whey isolat',
      'Légumes colorés + curcuma/gingembre pour calmer l’inflammation',
    ],
  },
]

const sampleDay = [
  {
    meal: 'Petit-déjeuner',
    items: [
      'Porridge avoine, lait végétal, banane, beurre d’amande',
      '1 yaourt grec pour le ratio protéines',
      'Hydratation : eau + citron + pincée de sel naturel',
    ],
  },
  {
    meal: 'Déjeuner',
    items: [
      'Bowl quinoa, poulet grillé, légumes rôtis, huile d’olive',
      'Une portion de fruits frais (kiwi, fruits rouges)',
      'Infusion digestive (fenouil, anis) si tu es sensible',
    ],
  },
  {
    meal: 'Snack pré-entraînement',
    items: [
      'Tartine pain complet + purée de cacahuète + miel',
      '850 ml d’eau avec électrolytes, 30 min avant séance',
    ],
  },
  {
    meal: 'Dîner',
    items: [
      'Poisson gras (saumon) + patate douce + salade verte',
      'Yaourt nature avec graines de chia pour la récupération',
      'Hydratation continue jusqu’au coucher',
    ],
  },
]

const supplements = [
  {
    name: 'Electrolytes / boisson iso',
    description:
      'Indispensable sur formats longs ou sous forte chaleur pour maintenir ton volume plasmatique et éviter les crampes.',
  },
  {
    name: 'Oméga-3 de qualité',
    description: 'Réduisent l’inflammation articulaire et favorisent une meilleure récupération musculaire.',
  },
  {
    name: 'Vitamine D & magnésium',
    description: 'Supportent le système immunitaire et nerveux, surtout si tu t’entraînes en intérieur ou hiver.',
  },
  {
    name: 'Collagène + Vitamine C',
    description: 'Renforce tendons/ligaments, utile pour encaisser les charges sur obstacles et portés.',
  },
]

export default function NutritionPage() {
  return (
    <main className='min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground'>
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <div className='h-full w-full bg-cover bg-center' style={{ backgroundImage: heroBackground }} />
          <div className='absolute inset-0 bg-background/35 backdrop-blur-[3px]' />
          <div className='absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background' />
        </div>
        <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Préparation Overbound
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Nutrition pour performer sur les obstacles
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Optimise tes apports avant, pendant et après l’effort pour arriver fort sur la ligne de départ et
              récupérer rapidement. Voici les bases qui accompagnent nos athlètes Overbound.
            </p>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='#fundamentaux'>Découvrir les piliers</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/trainings/plans'>Télécharger un plan nutritionnel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id='fundamentaux' className='border-y border-border/50 bg-background/80 py-14'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <Headings
            title='Les 3 piliers nutritionnels Overbound'
            description="Nos courses t’exigent une énergie stable, un système digestif solide et une récupération accélérée. Voici comment répartir tes efforts."
          />
          <div className='grid gap-6 md:grid-cols-3'>
            {nutritionPillars.map((pillar) => (
              <Card
                key={pillar.title}
                className='border border-white/20 bg-gradient-to-b from-muted/40 to-muted/10 shadow-lg shadow-primary/5 backdrop-blur'
              >
                <CardHeader className='space-y-1'>
                  <p className='text-sm font-semibold uppercase tracking-wide text-primary'>{pillar.subtitle}</p>
                  <CardTitle className='text-2xl'>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 text-sm text-muted-foreground'>
                  <p>{pillar.description}</p>
                  <ul className='space-y-2'>
                    {pillar.bullets.map((item) => (
                      <li key={item} className='flex gap-2'>
                        <span className='mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary' />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8'>
        <div className='grid gap-10 lg:grid-cols-[1.3fr,1fr] lg:items-start'>
          <div className='space-y-6'>
            <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl'>Exemple de journée type</h2>
            <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
              Cette journée fournit une charpente solide pour l’entraînement d’un athlète Overbound. Ajuste les
              quantités selon ton poids et ton volume d’entraînement. L’objectif : rester stable énergétiquement tout
              en maximisant tes apports micronutritionnels.
            </p>
            <div className='space-y-4 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-inner shadow-primary/5'>
              {sampleDay.map((meal) => (
                <div key={meal.meal} className='space-y-2'>
                  <h3 className='text-lg font-semibold text-foreground'>{meal.meal}</h3>
                  <ul className='space-y-1 text-sm text-muted-foreground'>
                    {meal.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-4 rounded-3xl border border-white/20 bg-primary/5 p-6 shadow-lg shadow-primary/10'>
            <h3 className='text-xl font-semibold text-primary'>Supplémentation recommandée</h3>
            <p className='text-sm text-primary/80'>
              Pour compléter ton alimentation quotidienne, privilégie des compléments testés et certifiés anti-dopage.
              Voici les incontournables des athlètes Overbound.
            </p>
            <div className='space-y-3'>
              {supplements.map((supplement) => (
                <div key={supplement.name} className='rounded-2xl border border-primary/20 bg-background/80 p-4'>
                  <p className='text-sm font-semibold text-primary'>{supplement.name}</p>
                  <p className='text-sm text-muted-foreground'>{supplement.description}</p>
                </div>
              ))}
            </div>
            <Button
              asChild
              variant='outline'
              size='lg'
              className='h-11 w-full border-primary text-primary hover:bg-primary/10'
            >
              <Link href='/contact'>Parler à notre nutritionniste partenaire</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className='relative bg-gradient-to-b from-background to-background/40 py-16 sm:py-20'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-2 lg:items-center'>
            <div className='space-y-4 text-center lg:text-left'>
              <h2 className='text-2xl font-semibold sm:text-3xl md:text-4xl'>
                Combine nutrition & entraînement pour un impact maximal
              </h2>
              <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
                Découvre nos ressources d’entraînement, nos plans et notre community coaching pour garder le cap
                jusqu’à la ligne de départ.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <Button asChild size='lg' className='h-12 w-full sm:w-auto'>
                <Link href='/trainings/what-race-for-me'>Choisir mon format</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
              >
                <Link href='/events'>Voir les événements</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
