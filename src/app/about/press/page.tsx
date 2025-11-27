'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Mail, Image as ImageIcon, FileText, Award } from 'lucide-react'
import { FORMAT_LEVELS } from '@/constants/formatLevels'

const heroImageSrc = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1400&auto=format&fit=crop'

const PRESS_CONTACTS = [
  {
    name: 'Relations Presse',
    email: 'presse@overbound-race.com',
    description: 'Demandes médias, interviews et couverture événementielle',
  },
  {
    name: 'Partenariats',
    email: 'partenariats@overbound-race.com',
    description: 'Collaborations, sponsoring et opportunités commerciales',
  },
]

const PRESS_RESOURCES = [
  {
    title: 'Kit Média',
    description: 'Logos, visuels et assets graphiques haute résolution',
    icon: ImageIcon,
    items: ['Logos (PNG, SVG)', 'Photos événements', 'Visuels réseaux sociaux'],
  },
  {
    title: 'Dossier de Presse',
    description: 'Présentation complète d\'Overbound et de nos événements',
    icon: FileText,
    items: ['Historique', 'Chiffres clés', 'Formats de course'],
  },
  {
    title: 'Communiqués',
    description: 'Dernières actualités et annonces officielles',
    icon: Award,
    items: ['Nouveaux événements', 'Résultats', 'Partenariats'],
  },
]

const ACHIEVEMENTS = [
  {
    stat: '10,000+',
    label: 'Participants depuis le lancement',
  },
  {
    stat: '25+',
    label: 'Événements organisés',
  },
  {
    stat: '100%',
    label: 'Organisation européenne',
  },
  {
    stat: '50+',
    label: 'Obstacles uniques créés',
  },
]

export default function PressPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero Section */}
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <Image
            src={heroImageSrc}
            alt='Espace presse Overbound'
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
              Espace Presse
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Médias & Ressources
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Bienvenue dans l'espace presse d'Overbound. Retrouvez ici tous les éléments dont vous avez besoin pour
              couvrir nos événements, nos actualités et notre communauté.
            </p>
          </div>
        </div>
        <div className='pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-70'>
          <Image
            src='/images/mountain-vector.svg'
            alt='Décor montagne'
            width={1600}
            height={800}
            className='w-[220%] max-w-none sm:w-[170%] md:w-[140%]'
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className='relative z-10 -mt-16 pb-16'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            {ACHIEVEMENTS.map((achievement, index) => (
              <Card key={index} className='border-border/50 bg-card/50 backdrop-blur-sm'>
                <CardContent className='p-6 text-center'>
                  <p className='text-3xl font-bold text-primary sm:text-4xl'>{achievement.stat}</p>
                  <p className='mt-2 text-sm text-muted-foreground'>{achievement.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className='py-16'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>Contacts Presse</h2>
            <p className='mt-4 text-muted-foreground'>
              Notre équipe est à votre disposition pour toute demande média
            </p>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            {PRESS_CONTACTS.map((contact, index) => (
              <Card key={index} className='border-border/50'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Mail className='h-5 w-5 text-primary' />
                    {contact.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-sm text-muted-foreground'>{contact.description}</p>
                  <Link
                    href={`mailto:${contact.email}`}
                    className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'
                  >
                    {contact.email}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className='bg-muted/30 py-16'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>Ressources Média</h2>
            <p className='mt-4 text-muted-foreground'>
              Téléchargez les éléments nécessaires pour votre couverture
            </p>
          </div>

          <div className='grid gap-6 md:grid-cols-3'>
            {PRESS_RESOURCES.map((resource, index) => {
              const Icon = resource.icon
              return (
                <Card key={index} className='border-border/50'>
                  <CardHeader>
                    <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
                      <Icon className='h-6 w-6 text-primary' />
                    </div>
                    <CardTitle>{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <p className='text-sm text-muted-foreground'>{resource.description}</p>
                    <ul className='space-y-2 text-sm'>
                      {resource.items.map((item, idx) => (
                        <li key={idx} className='flex items-start gap-2'>
                          <span className='mt-1 h-1.5 w-1.5 rounded-full bg-primary' />
                          <span className='text-muted-foreground'>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant='outline' className='w-full gap-2' asChild>
                      <Link href={`mailto:presse@overbound-race.com?subject=Demande ${resource.title}`}>
                        <Download className='h-4 w-4' />
                        Demander
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Overbound Section */}
      <section className='py-16'>
        <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          <div className='space-y-8'>
            <div className='text-center'>
              <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>À propos d'Overbound</h2>
            </div>

            <Card className='border-border/50'>
              <CardContent className='prose prose-sm max-w-none p-8 dark:prose-invert sm:prose'>
                <p className='text-muted-foreground'>
                  <strong>Overbound</strong> est une organisation européenne d'obstacle course racing (OCR) qui
                  réinvente l'expérience de la course d'obstacles. Fondée par des passionnés pour des passionnés, nous
                  créons des événements qui allient défi sportif, esprit de communauté et innovation.
                </p>

                <p className='text-muted-foreground'>
                  Notre mission : rendre l'OCR accessible à tous, du débutant curieux à l'athlète confirmé, en
                  proposant des formats variés et des obstacles uniques conçus en interne. Chaque événement Overbound
                  est pensé pour créer des souvenirs mémorables et pousser chacun à se dépasser dans une ambiance
                  bienveillante.
                </p>

                <h3 className='mt-6 text-xl font-bold'>Ce qui nous différencie</h3>
                <ul className='text-muted-foreground'>
                  <li>Organisation 100% européenne avec une expertise locale</li>
                  <li>Obstacles propriétaires conçus et fabriqués par nos équipes</li>
                  <li>3 formats adaptés à tous les niveaux ({FORMAT_LEVELS.low.name}, {FORMAT_LEVELS.mid.name}, {FORMAT_LEVELS.hard.name})</li>
                  <li>Communauté engagée de plus de 10,000 participants</li>
                  <li>Approche inclusive et bienveillante de la performance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-primary/5 py-16'>
        <div className='mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>Besoin de plus d'informations ?</h2>
          <p className='mt-4 text-lg text-muted-foreground'>
            Notre équipe communication est disponible pour répondre à toutes vos questions
          </p>
          <div className='mt-8 flex flex-col justify-center gap-4 sm:flex-row'>
            <Button size='lg' asChild>
              <Link href='mailto:presse@overbound-race.com'>
                <Mail className='mr-2 h-5 w-5' />
                Contactez-nous
              </Link>
            </Button>
            <Button size='lg' variant='outline' asChild>
              <Link href='/about/our-story'>En savoir plus</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
