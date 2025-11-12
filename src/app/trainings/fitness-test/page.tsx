'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Target, TrendingUp, Dumbbell, Heart } from 'lucide-react'

const heroImageSrc = 'https://images.unsplash.com/photo-1517832606294-5fbdc7dcd837?q=80&w=1400&auto=format&fit=crop'

const assessments = [
  {
    title: 'Endurance cardio',
    subtitle: 'Course continue & fractionné',
    description:
      'Mesure ta capacité à tenir un effort soutenu grâce à un Cooper 12 minutes ou un test de VMA progressive. Note ta distance ou ta VMA pour connaître ton niveau.',
    checklist: ['Test Cooper 12 min ou VMA progressive', 'Noter la distance / vitesse atteinte', 'Repos actif 5 min'],
    icon: Activity,
    color: 'emerald',
  },
  {
    title: 'Force fonctionnelle',
    subtitle: 'Gainage – tirage – poussée',
    description:
      'Les obstacles Overbound mobilisent ton buste et ton grip. Chronomètre un gainage planche, réalise un max de tractions/rowing inversé et des pompes explosives.',
    checklist: ['Planche : max de temps', 'Tractions / rowing inversé : max en 90 s', 'Pompes explosives : max en 60 s'],
    icon: Dumbbell,
    color: 'red',
  },
  {
    title: 'Puissance & agilité',
    subtitle: 'Sauts, changements de direction',
    description:
      'Chrono sur un T-Test de vitesse, et calcule ta détente verticale avec un squat jump. Ces points révèlent ta vivacité sur les franchissements.',
    checklist: ['T-Test (course en T) : meilleur temps', 'Squat jump : hauteur ou nombre de répétitions', 'Travail de mobilité post-test'],
    icon: Zap,
    color: 'amber',
  },
]

const scoringBands = [
  {
    label: 'Rite du Guerrier',
    score: '0 – 9 points',
    description: 'Format sprint 6 km avec obstacles emblématiques. Idéal si tu débutes ou reprends une activité sportive.',
    cta: { label: 'Voir le format Sprint', href: '/races/rite-du-guerrier' },
    color: 'emerald',
  },
  {
    label: 'Voie du Héros',
    score: '10 – 17 points',
    description: 'Format intermédiaire 12 km. Mix course / obstacles équilibré. Prépare-toi à maintenir un effort soutenu avec 35 obstacles.',
    cta: { label: 'Explorer la Voie du Héros', href: '/races/voie-du-heros' },
    color: 'blue',
  },
  {
    label: 'Tribal Royale',
    score: '18 points et +',
    description: 'Format backyard élite. Exige un très haut niveau de force, endurance et mental. Élimination progressive jusqu\'au dernier debout.',
    cta: { label: 'Objectif Tribal Royale', href: '/races/tribale-royale' },
    color: 'amber',
  },
]

export default function FitnessTestPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero Section */}
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <Image
            src={heroImageSrc}
            alt='Test de fitness Overbound'
            fill
            sizes='100vw'
            className='object-cover object-center'
            priority
          />
          <div className='pointer-events-none absolute inset-0 bg-background/35 backdrop-blur-[3px]' />
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background' />
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent' />
        </div>
        <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Préparation Overbound
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Passe le test de fitness Overbound
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Diagnostique ton niveau et mesure ta progression avant d'attaquer une course Overbound. Trois
              blocs d'évaluation pour comprendre où tu en es et comment franchir le prochain palier.
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
        <div className='pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-70'>
          <Image
            src='/images/mountain-vector.svg'
            alt='Décor montagne'
            width={1600}
            height={800}
            className='w-[220%] max-w-none sm:w-[170%] md:w-[140%]'
            priority
          />
        </div>
      </section>

      {/* Section Pourquoi tester */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-primary/20 text-primary border-primary/40">
              <Target className="h-4 w-4 mr-2" />
              Évaluation complète
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Pourquoi tester ton fitness ?
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Nos parcours exigent cardio, force et explosivité. En réalisant ce test maison, tu identifies tes points forts,
              ce qu'il reste à travailler et la course qui correspond à ton profil.
            </p>
          </div>

          <div className='grid gap-6 md:grid-cols-3'>
            {assessments.map((assessment) => {
              const IconComponent = assessment.icon
              const colorClass = assessment.color === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40'
                : assessment.color === 'red'
                ? 'bg-red-500/10 text-red-600 border-red-500/40'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/40'

              return (
                <Card
                  key={assessment.title}
                  className='border-2 border-border/40 bg-gradient-to-br from-background to-muted/5 hover:-translate-y-1 transition-all shadow-lg'
                >
                  <CardHeader className='space-y-4'>
                    <div className="flex items-start justify-between">
                      <div className={`rounded-2xl p-4 ${assessment.color === 'emerald' ? 'bg-emerald-500/10' : assessment.color === 'red' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                        <IconComponent className={`h-8 w-8 ${assessment.color === 'emerald' ? 'text-emerald-600' : assessment.color === 'red' ? 'text-red-600' : 'text-amber-600'}`} />
                      </div>
                      <Badge variant="outline" className={colorClass}>
                        {assessment.subtitle}
                      </Badge>
                    </div>
                    <CardTitle className='text-2xl'>{assessment.title}</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4 text-sm text-muted-foreground'>
                    <p className="leading-relaxed">{assessment.description}</p>
                    <div className={`rounded-2xl p-4 ${assessment.color === 'emerald' ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20' : assessment.color === 'red' ? 'bg-red-500/5 ring-1 ring-red-500/20' : 'bg-amber-500/5 ring-1 ring-amber-500/20'}`}>
                      <p className='text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-2'>Checklist</p>
                      <ul className='space-y-2'>
                        {assessment.checklist.map((item) => (
                          <li key={item} className='flex gap-2 text-sm'>
                            <span className={`mt-1 inline-block h-1.5 w-1.5 rounded-full ${assessment.color === 'emerald' ? 'bg-emerald-600' : assessment.color === 'red' ? 'bg-red-600' : 'bg-amber-600'}`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section Scoring avec wall texture */}
      <section className="relative bg-accent-foreground py-16 sm:py-50">
        <Image
          src='/images/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute -top-10 lg:top-[-1%] rotate-180 left-1/2 w-screen max-w-none -translate-x-1/2'
        />
        <Image
          src="/images/wall-texture.png"
          alt="Wall texture decoration"
          width={600}
          height={400}
          className="w-full h-full absolute top-0 left-0 object-cover opacity-80"
        />
        <div id='protocoles' className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-background/80 text-foreground border-border">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tribal Index
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl text-background">
              Comment fonctionne le scoring ?
            </h2>
            <p className="text-background/80 max-w-3xl mx-auto">
              Note chacune des trois familles de tests sur 10. Additionne les points pour obtenir
              ton score "Tribal Index" et identifie immédiatement le format qui colle à ton niveau.
            </p>
          </div>

          <div className='grid gap-6 lg:grid-cols-[1fr,2fr] mb-12'>
            <Card className='border-border/50 bg-background/90 backdrop-blur'>
              <CardHeader>
                <CardTitle className="text-xl">Grille de notation</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 text-sm text-muted-foreground'>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/40 shrink-0">0-3</Badge>
                    <p>Début du travail, chaîne l'effort 60 secondes sans rupture.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/40 shrink-0">4-6</Badge>
                    <p>Tu tiens les séries demandées avec contrôle, quelques lacunes restent.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/40 shrink-0">7-8</Badge>
                    <p>Base solide, prêt pour la Voie du Héros.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/40 shrink-0">9-10</Badge>
                    <p>Profil élite, vise Tribal Royale ou formats challenge.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='grid gap-6 md:grid-cols-2'>
              {scoringBands.map((band) => {
                const borderClass = band.color === 'emerald'
                  ? 'border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5'
                  : band.color === 'blue'
                  ? 'border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5'
                  : 'border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5'

                const badgeClass = band.color === 'emerald'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40'
                  : band.color === 'blue'
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/40'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/40'

                return (
                  <Card
                    key={band.label}
                    className={`border-2 ${borderClass} shadow-xl hover:-translate-y-1 transition-all`}
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between">
                        <Badge className={badgeClass}>
                          {band.score}
                        </Badge>
                      </div>
                      <CardTitle className='text-xl'>{band.label}</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4 text-sm text-muted-foreground'>
                      <p className="leading-relaxed">{band.description}</p>
                      <Button asChild variant='outline' size='sm' className='w-full border-primary text-primary hover:bg-primary/10'>
                        <Link href={band.cta.href}>{band.cta.label}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <Card className="border-border/50 bg-background/90 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <p className="font-semibold text-foreground mb-1">Besoin d'un accompagnement personnalisé ?</p>
                  <p className="text-sm text-muted-foreground">Nos coachs peuvent t'aiguiller et créer un plan adapté à tes objectifs.</p>
                </div>
                <Button asChild variant='outline' size='lg' className='border-primary text-primary hover:bg-primary/10 shrink-0'>
                  <Link href='/contact'>Parler à un coach</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Image
          src='/images/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute bottom-[-1%] left-1/2 w-screen max-w-none -translate-x-1/2'
        />
      </section>

      {/* Section CTA finale */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <Badge className="bg-primary/20 text-primary border-primary/40">
                <Heart className="h-4 w-4 mr-2" />
                Prochaine étape
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Prêt à valider ton test sur le terrain ?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <span className="text-foreground font-semibold">Maintenant que tu connais ton niveau,</span> il est temps
                  de passer à l'action. Inscris-toi à un événement Overbound qui correspond à ton profil.
                </p>
                <p>
                  Tu peux aussi rejoindre une session d'entraînement officielle ou t'entraîner avec la communauté Overbound
                  pour progresser et devenir plus fort chaque jour.
                </p>
              </div>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <Button asChild size='lg'>
                  <Link href='/events'>Trouver un événement</Link>
                </Button>
                <Button asChild variant='outline' size='lg'>
                  <Link href='/trainings/plans'>Plans d'entraînement</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1400&auto=format&fit=crop"
                alt="Entraînement Overbound"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
