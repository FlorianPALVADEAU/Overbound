'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Headings from '@/components/globals/Headings'
import SubHeadings from '@/components/globals/SubHeadings'

const testimonials = [
  {
    quote:
      'Je suis arrivé pour donner un coup de main, je suis reparti avec une famille. Voir les coureurs franchir la ligne grâce à nous est indescriptible.',
    name: 'Amandine, chef de zone obstacles',
  },
  {
    quote:
      'Être volontaire, c’est sentir l’énergie d’Overbound de l’intérieur. J’ai découvert des amis, un sens et un défi humain incroyable.',
    name: 'Sébastien, responsable ravitaillement',
  },
  {
    quote:
      'On partage les mêmes valeurs que les athlètes : entraide, dépassement, fierté collective. C’est l’expérience la plus inspirante de mon année.',
    name: 'Lina, accueil participants',
  },
]

const missions = [
  {
    title: 'Tribu obstacles',
    description:
      'Rejoins l’équipe qui gère nos modules iconiques. Tu encourages, assures la sécurité et aides les coureurs à repartir plus forts.',
  },
  {
    title: 'Logistique & village',
    description:
      'Accueil participants, remise des dossards, gestion du flux, logistique matériel. Tu es le premier sourire que les athlètes croisent.',
  },
  {
    title: 'Ravitaillement & récupération',
    description:
      'Tu accompagnes les coureurs sur les zones critiques : ravitos, finish line, consignes. Tu redonnes de l’énergie au moment où ils en ont le plus besoin.',
  },
]

const rewards = [
  {
    title: 'Une inscription offerte',
    description:
      'Choisis ta course Overbound (ou offre-la à un proche). Tu vis l’expérience volontaire avant de te lancer à ton tour.',
  },
  {
    title: 'Kit volontaire',
    description:
      'Tenue technique, repas, boissons, accès coulisses… Tu es traité comme un membre essentiel de la tribu.',
  },
  {
    title: 'Souvenirs inoubliables',
    description:
      'Une immersion totale, des rencontres qui marquent, et la fierté d’avoir aidé des centaines d’athlètes à se dépasser.',
  },
]

export default function VolunteersPage() {
  return (
    <main className='relative min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground'>
      <div className='pointer-events-none absolute inset-x-0 top-0 flex justify-center opacity-50'>
        <Image
          src='/images/mountain-vector.svg'
          alt='Décor montagne'
          width={1600}
          height={800}
          className='w-[220%] max-w-none sm:w-[170%] md:w-[140%]'
          priority
        />
      </div>

      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <div
            className='h-full w-full bg-cover bg-center'
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1400&auto=format&fit=crop')",
            }}
          />
          <div className='absolute inset-0 bg-background/55 backdrop-blur-[3px]' />
          <div className='absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background' />
        </div>

        <div className='relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Volontaires Overbound
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Fais vibrer la course, rejoins la tribu.
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Être volontaire, c’est vivre l’expérience Overbound de l’intérieur, donner du courage au moment où les
              coureurs doutent et repartir avec des souvenirs qui restent toute une vie. Tu ne guettes pas le podium,
              tu crées l’émotion.
            </p>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Button asChild size='lg' className='h-12 w-full bg-primary text-white hover:bg-primary/90 sm:w-auto'>
                <Link href='#rejoindre'>Rejoindre la tribu</Link>
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

      <section className='mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8'>
        <Headings
          title='Pourquoi on a besoin de toi'
          description='Tu ne tiens pas un stand. Tu rends possible chaque sourire, chaque dépassement. Tu es l’âme d’Overbound.'
        />

        <div className='grid gap-6 md:grid-cols-3'>
          {missions.map((mission) => (
            <Card key={mission.title} className='border border-primary/20 bg-primary/5 shadow-lg shadow-primary/10'>
              <CardHeader>
                <CardTitle className='text-xl text-primary'>{mission.title}</CardTitle>
              </CardHeader>
              <CardContent className='text-sm leading-relaxed text-primary/80'>{mission.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className='relative bg-gradient-to-b from-background via-muted/15 to-background py-16 sm:py-20'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8'>
          <SubHeadings
            title='Ce que tu reçois en retour'
            description='Pour chaque heure donnée, tu repars avec de la gratitude, un dossard offert et une famille.'
          />

          <div className='grid gap-6 md:grid-cols-3'>
            {rewards.map((reward) => (
              <Card key={reward.title} className='border border-border/60 bg-background/90 shadow-lg shadow-primary/5'>
                <CardHeader>
                  <CardTitle className='text-xl text-foreground'>{reward.title}</CardTitle>
                </CardHeader>
                <CardContent className='text-sm leading-relaxed text-muted-foreground'>{reward.description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8'>
        <SubHeadings
          title='Ils ont donné de leur temps, ils ont gagné une tribu'
          description='Les volontaires Overbound parlent d’amitié, de fierté, de frissons. Pas de “bénévolat”, mais d’expérience de vie.'
        />
        <div className='grid gap-6 md:grid-cols-3'>
          {testimonials.map((testimonal) => (
            <Card key={testimonal.name} className='border border-primary/20 bg-background/90 shadow-lg shadow-primary/10'>
              <CardContent className='space-y-4 p-6 text-sm leading-relaxed text-muted-foreground'>
                <p className='italic'>&ldquo;{testimonal.quote}&rdquo;</p>
                <p className='text-sm font-semibold text-primary'>{testimonal.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id='rejoindre' className='relative bg-gradient-to-b from-background to-background/40 py-16 sm:py-20'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-10 lg:grid-cols-[1.2fr,1fr] lg:items-center'>
            <div className='space-y-6'>
              <Headings
                title='Prêt à vibrer au cœur de la course ?'
                description='Remplis le formulaire, choisis ta mission (obstacles, logistique, ravitaillement, team médicale) et la tribu te contacte sous 48h.'
                sx='text-left lg:w-11/12'
              />
              <ul className='space-y-3 text-sm text-muted-foreground'>
                <li>• Être disponible la veille et/ou le jour J (nous gérons ton transport local si besoin).</li>
                <li>• Avoir l’envie d’encourager, de rassurer et de donner de l’énergie aux coureurs.</li>
                <li>• Être majeur (ou 16+ avec autorisation parentale) pour intégrer la tribu officielle.</li>
              </ul>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <Button asChild size='lg' className='h-12 w-full bg-primary text-white hover:bg-primary/90 sm:w-auto'>
                  <Link href='https://forms.overbound.fr/volunteers' target='_blank' rel='noopener noreferrer'>
                    Je m&apos;inscris comme volontaire
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto'
                >
                  <Link href='/contact'>Parler à la team</Link>
                </Button>
              </div>
            </div>

            <div className='rounded-3xl border border-border/60 bg-background/90 p-6 shadow-lg shadow-primary/10'>
              <h3 className='text-lg font-semibold text-foreground'>Autres questions fréquentes</h3>
              <div className='mt-4 space-y-3 text-sm text-muted-foreground'>
                <p>
                  <strong>Repas & hydratation&nbsp;:</strong> fournis pour chaque volontaire. Options végétariennes
                  disponibles.
                </p>
                <p>
                  <strong>Logement&nbsp;:</strong> si tu viens de loin, on t’aide à trouver un hébergement chez un
                  membre de la tribu.
                </p>
                <p>
                  <strong>Tenue&nbsp;:</strong> nous te donnons un t-shirt technique, et tu repars avec des goodies
                  exclusifs.
                </p>
                <p>
                  <strong>Ambiance&nbsp;:</strong> brief, café, musique, encouragements… Tu vis la course côté coulisses
                  et tu participes à la cérémonie finale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
